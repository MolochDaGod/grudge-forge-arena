/**
 * Dual Quaternion Skinning (DQS) shader chunks for Three.js
 *
 * Based on:
 *   Kavan et al. "Geometric Skinning with Approximate Dual Quaternion Blending"
 *   ACM Transactions on Graphics (SIGGRAPH 2008)
 *   skinning.org — Part I: Direct Methods
 *
 * DQS eliminates the "candy-wrapper" volume collapse that LBS (Linear Blend Skinning)
 * produces at rotating joints (elbows, wrists, knees). Instead of blending 4×4 bone
 * matrices, we convert each bone to a dual quaternion (rotation + translation encoded
 * together), blend in dual-quaternion space, then apply. This preserves volume at
 * joint bends — the #1 quality improvement for rigged characters.
 *
 * Antipodality correction: all DQs must lie in the same hemisphere before blending,
 * otherwise the linear interpolation will "go the long way around" through zero.
 */

// ─── Pars chunk (replaces #include <skinning_pars_vertex>) ────────────────────
// Defines: bindMatrix, bindMatrixInverse, boneTexture, getBoneMatrix(),
//          mat4ToDQ(), dqTransformPoint(), dqTransformVector()
export const DQS_PARS_VERTEX = /* glsl */`
#ifdef USE_SKINNING

uniform mat4 bindMatrix;
uniform mat4 bindMatrixInverse;
uniform highp sampler2D boneTexture;

mat4 getBoneMatrix( const in float i ) {
  int size = textureSize( boneTexture, 0 ).x;
  int j    = int( i ) * 4;
  int x    = j % size;
  int y    = j / size;
  vec4 v1  = texelFetch( boneTexture, ivec2( x,     y ), 0 );
  vec4 v2  = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
  vec4 v3  = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
  vec4 v4  = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
  return mat4( v1, v2, v3, v4 );
}

// ── mat4 → dual quaternion ──────────────────────────────────────────────────
// A rigid-body bone matrix M (rotation R + translation t) is encoded as a
// unit dual quaternion: DQ = Qr + ε·Qd
//   Qr = rotation quaternion  (xyzw)
//   Qd = dual part = 0.5 · pure(t) · Qr  (encodes translation)
void mat4ToDQ( mat4 M, out vec4 Qr, out vec4 Qd ) {
  // Extract rotation 3×3 (column-major in GLSL: M[col][row])
  float m00 = M[0][0], m10 = M[0][1], m20 = M[0][2];
  float m01 = M[1][0], m11 = M[1][1], m21 = M[1][2];
  float m02 = M[2][0], m12 = M[2][1], m22 = M[2][2];
  float tr  = m00 + m11 + m22;

  // Shepperd's method — numerically stable branch for rotation extraction
  if ( tr > 0.0 ) {
    float s = 0.5 / sqrt( tr + 1.0 );
    Qr = vec4( ( m21 - m12 ) * s,
               ( m02 - m20 ) * s,
               ( m10 - m01 ) * s,
               0.25 / s );
  } else if ( m00 > m11 && m00 > m22 ) {
    float s = 2.0 * sqrt( 1.0 + m00 - m11 - m22 );
    Qr = vec4( 0.25 * s,
               ( m01 + m10 ) / s,
               ( m02 + m20 ) / s,
               ( m21 - m12 ) / s );
  } else if ( m11 > m22 ) {
    float s = 2.0 * sqrt( 1.0 + m11 - m00 - m22 );
    Qr = vec4( ( m01 + m10 ) / s,
               0.25 * s,
               ( m12 + m21 ) / s,
               ( m02 - m20 ) / s );
  } else {
    float s = 2.0 * sqrt( 1.0 + m22 - m00 - m11 );
    Qr = vec4( ( m02 + m20 ) / s,
               ( m12 + m21 ) / s,
               0.25 * s,
               ( m10 - m01 ) / s );
  }

  // Dual part: Qd = 0.5 · pure(t) ⊗ Qr  (quaternion product with t as pure quat)
  vec3 t = M[3].xyz;
  Qd.w   = -0.5 * ( t.x * Qr.x + t.y * Qr.y + t.z * Qr.z );
  Qd.x   =  0.5 * ( t.x * Qr.w + t.y * Qr.z - t.z * Qr.y );
  Qd.y   =  0.5 * (-t.x * Qr.z + t.y * Qr.w + t.z * Qr.x );
  Qd.z   =  0.5 * ( t.x * Qr.y - t.y * Qr.x + t.z * Qr.w );
}

// ── Apply unit DQ to a point ────────────────────────────────────────────────
// p' = rotate(p, Qr) + translate(Qr, Qd)
// Using the formula: p' = p + 2·(Qr.xyz × (Qr.xyz × p + Qr.w·p))
//                       + 2·(Qr.w·Qd.xyz − Qd.w·Qr.xyz + Qr.xyz × Qd.xyz)
vec3 dqTransformPoint( vec4 Qr, vec4 Qd, vec3 p ) {
  vec3 rot = p + 2.0 * cross( Qr.xyz, cross( Qr.xyz, p ) + Qr.w * p );
  vec3 tr  = 2.0 * ( Qr.w * Qd.xyz - Qd.w * Qr.xyz + cross( Qr.xyz, Qd.xyz ) );
  return rot + tr;
}

// ── Apply DQ rotation only to a vector (no translation) ────────────────────
// Used for normals and tangents
vec3 dqTransformVector( vec4 Qr, vec3 n ) {
  return n + 2.0 * cross( Qr.xyz, cross( Qr.xyz, n ) + Qr.w * n );
}

#endif
`;

// ─── Position chunk (replaces #include <skinning_vertex>) ─────────────────────
// NOTE: skinbase_vertex still runs before this, defining boneMatX/Y/Z/W.
//       We use those + our DQ functions to transform `transformed`.
export const DQS_POSITION_VERTEX = /* glsl */`
#ifdef USE_SKINNING

// Convert the 4 influencing bones to dual quaternions
vec4 Xr, Xd, Yr, Yd, Zr, Zd, Wr, Wd;
mat4ToDQ( boneMatX, Xr, Xd );
mat4ToDQ( boneMatY, Yr, Yd );
mat4ToDQ( boneMatZ, Zr, Zd );
mat4ToDQ( boneMatW, Wr, Wd );

// Antipodality correction — ensure all DQs are in the same hemisphere as
// the primary bone (Xr). Without this, linear blend interpolates "backwards"
// through zero when two quaternions represent the same rotation with opposite signs.
if ( dot( Xr, Yr ) < 0.0 ) { Yr = -Yr; Yd = -Yd; }
if ( dot( Xr, Zr ) < 0.0 ) { Zr = -Zr; Zd = -Zd; }
if ( dot( Xr, Wr ) < 0.0 ) { Wr = -Wr; Wd = -Wd; }

// Linearly blend dual quaternions (ScLERP approximation)
vec4 blendQr = Xr * skinWeight.x + Yr * skinWeight.y
             + Zr * skinWeight.z  + Wr * skinWeight.w;
vec4 blendQd = Xd * skinWeight.x + Yd * skinWeight.y
             + Zd * skinWeight.z  + Wd * skinWeight.w;

// Renormalize (scale correction for linear blending)
float blen   = length( blendQr );
blendQr     /= blen;
blendQd     /= blen;

// Apply: first move to bind space, DQ-transform, then back
vec3 bindPos    = ( bindMatrix * vec4( transformed, 1.0 ) ).xyz;
vec3 dqPos      = dqTransformPoint( blendQr, blendQd, bindPos );
transformed     = ( bindMatrixInverse * vec4( dqPos, 1.0 ) ).xyz;

#endif
`;

// ─── Normal chunk (replaces #include <skinnormal_vertex>) ─────────────────────
// Transforms objectNormal (and tangent) using the DQ rotation.
// boneMatX/Y/Z/W are already defined by skinbase_vertex above this chunk.
export const DQS_NORMAL_VERTEX = /* glsl */`
#ifdef USE_SKINNING

vec4 nXr, nXd, nYr, nYd, nZr, nZd, nWr, nWd;
mat4ToDQ( boneMatX, nXr, nXd );
mat4ToDQ( boneMatY, nYr, nYd );
mat4ToDQ( boneMatZ, nZr, nZd );
mat4ToDQ( boneMatW, nWr, nWd );

if ( dot( nXr, nYr ) < 0.0 ) { nYr = -nYr; nYd = -nYd; }
if ( dot( nXr, nZr ) < 0.0 ) { nZr = -nZr; nZd = -nZd; }
if ( dot( nXr, nWr ) < 0.0 ) { nWr = -nWr; nWd = -nWd; }

vec4 nBlendQr = nXr * skinWeight.x + nYr * skinWeight.y
              + nZr * skinWeight.z  + nWr * skinWeight.w;
vec4 nBlendQd = nXd * skinWeight.x + nYd * skinWeight.y
              + nZd * skinWeight.z  + nWd * skinWeight.w;
nBlendQr /= length( nBlendQr );

// Rotate normals/tangents through bind space (DQ only rotates, no translation needed)
vec3 bindNormal  = ( bindMatrix * vec4( objectNormal, 0.0 ) ).xyz;
vec3 dqNormal    = dqTransformVector( nBlendQr, bindNormal );
objectNormal     = ( bindMatrixInverse * vec4( dqNormal, 0.0 ) ).xyz;

#ifdef USE_TANGENT
  vec3 bindTangent = ( bindMatrix * vec4( objectTangent, 0.0 ) ).xyz;
  vec3 dqTangent   = dqTransformVector( nBlendQr, bindTangent );
  objectTangent    = ( bindMatrixInverse * vec4( dqTangent, 0.0 ) ).xyz;
#endif

#endif
`;
