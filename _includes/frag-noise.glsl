// shader for initializing gray-scott data array from smooth noise

#define TWO_PI 6.2831853

precision mediump float;

uniform vec2 u_resolution;
uniform float u_warp;
uniform float u_t;


/******* 4D simplex noise implementation begins *********/
// (reference: https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83 )
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
float permute(float x){return floor(mod(((x*34.0)+1.0)*x, 289.0));}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float taylorInvSqrt(float r){return 1.79284291400159 - 0.85373472095314 * r;}

vec4 grad4(float j, vec4 ip) {
    const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);
    vec4 p,s;

    p.xyz = floor( fract (vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;
    p.w = 1.5 - dot(abs(p.xyz), ones.xyz);
    s = vec4(lessThan(p, vec4(0.0)));
    p.xyz = p.xyz + (s.xyz*2.0 - 1.0) * s.www; 

    return p;
}

float snoise(vec4 v) {
    const vec2  C = vec2( 0.138196601125010504,  // (5 - sqrt(5))/20  G4
                        0.309016994374947451); // (sqrt(5) - 1)/4   F4
    // First corner
    vec4 i  = floor(v + dot(v, C.yyyy) );
    vec4 x0 = v -   i + dot(i, C.xxxx);

    // Other corners

    // Rank sorting originally contributed by Bill Licea-Kane, AMD (formerly ATI)
    vec4 i0;

    vec3 isX = step( x0.yzw, x0.xxx );
    vec3 isYZ = step( x0.zww, x0.yyz );
    //  i0.x = dot( isX, vec3( 1.0 ) );
    i0.x = isX.x + isX.y + isX.z;
    i0.yzw = 1.0 - isX;

    //  i0.y += dot( isYZ.xy, vec2( 1.0 ) );
    i0.y += isYZ.x + isYZ.y;
    i0.zw += 1.0 - isYZ.xy;

    i0.z += isYZ.z;
    i0.w += 1.0 - isYZ.z;

    // i0 now contains the unique values 0,1,2,3 in each channel
    vec4 i3 = clamp( i0, 0.0, 1.0 );
    vec4 i2 = clamp( i0-1.0, 0.0, 1.0 );
    vec4 i1 = clamp( i0-2.0, 0.0, 1.0 );

    //  x0 = x0 - 0.0 + 0.0 * C 
    vec4 x1 = x0 - i1 + 1.0 * C.xxxx;
    vec4 x2 = x0 - i2 + 2.0 * C.xxxx;
    vec4 x3 = x0 - i3 + 3.0 * C.xxxx;
    vec4 x4 = x0 - 1.0 + 4.0 * C.xxxx;

    // Permutations
    i = mod(i, 289.0); 
    float j0 = permute( permute( permute( permute(i.w) + i.z) + i.y) + i.x);
    vec4 j1 = permute( permute( permute( permute (
             i.w + vec4(i1.w, i2.w, i3.w, 1.0 ))
           + i.z + vec4(i1.z, i2.z, i3.z, 1.0 ))
           + i.y + vec4(i1.y, i2.y, i3.y, 1.0 ))
           + i.x + vec4(i1.x, i2.x, i3.x, 1.0 ));
    // Gradients
    // ( 7*7*6 points uniformly over a cube, mapped onto a 4-octahedron.)
    // 7*7*6 = 294, which is close to the ring size 17*17 = 289.

    vec4 ip = vec4(1.0/294.0, 1.0/49.0, 1.0/7.0, 0.0) ;

    vec4 p0 = grad4(j0,   ip);
    vec4 p1 = grad4(j1.x, ip);
    vec4 p2 = grad4(j1.y, ip);
    vec4 p3 = grad4(j1.z, ip);
    vec4 p4 = grad4(j1.w, ip);

    // Normalise gradients
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    p4 *= taylorInvSqrt(dot(p4,p4));

    // Mix contributions from the five corners
    vec3 m0 = max(0.6 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);
    vec2 m1 = max(0.6 - vec2(dot(x3,x3), dot(x4,x4)            ), 0.0);
    m0 = m0 * m0;
    m1 = m1 * m1;
    return 49.0 * ( dot(m0*m0, vec3( dot( p0, x0 ), dot( p1, x1 ), dot( p2, x2 )))
               + dot(m1*m1, vec2( dot( p3, x3 ), dot( p4, x4 ) ) ) ) ;
}
/********** 4D simplex noise implementation ends ***********/


// fbm function adapted from https://thebookofshaders.com/
#define OCTAVES 8
float fbm (in vec4 point) {
    // Initial values
    float value = 0.3;
    float amplitude = 1.34;
    float frequency = 0.;
    // Loop of octaves
    for (int i = 0; i < OCTAVES; i++) {
        value += amplitude * snoise(point);
        point *= 1.95;
        amplitude *= .5;
    }
    return value;
}


vec4 serialize(vec2 ab) {
    // this is hacky b/c we don't get to use bitwise operators if we want to
    // maintain compatibility w/ earlier versions than GLSL ES 3.00
    ivec2 as_ints = ivec2(ab * 65535.0);
    int a_big = as_ints.x / 0xFF;
    int a_lil = as_ints.x - a_big*0xFF;
    int b_big = as_ints.y / 0xFF;
    int b_lil = as_ints.y - b_big*0xFF;
    return vec4(a_big, a_lil, b_big, b_lil) / 255.0;
}


float fbm_max(vec4 point) {
    // this produces an extra bit of fun, muted self-similarity, and also helps
    // keep the image's darkest regions from getting too big
    return max(fbm(point), 0.4*fbm(point+1.7+0.17*u_warp));
}


void main() {
    //vec2 pos = vec2(gl_FragCoord.xy/u_resolution.xy);
    vec2 pos = vec2(TWO_PI*gl_FragCoord.xy/256.0);
    
    // cute lil trick: get the texture to tile in a visually interesting way
    // and without discontinuities by normalizing x and y to [0, TWO_PI) and
    // treating them as theta values for two circles on orthogonal 2D planes
    // embedded in 4D space. animate by translating these circles with time
    //
    // as with almost all tiled textures, horizontal or vertical "lines" which
    // appear to be contiguous across tiles will occasionally show up. anyone
    // who grew up playing games which relied on small tilesets will instantly
    // recognize the look of these artifacts.
    //
    // fixed tilesets produce these artifacts at constant offsets from tile
    // borders. by highlighting the tile borders through juxtaposition, they
    // served as implicit reminders of the limitations of tiled graphics.
    //
    // here, however, these artifacts appear at random and slowly migrate
    // across the image, thus simultaneously evoking a memory of things past
    // and recontextualizing these past limitations as aesthetic celebrations.
    //
    // "Whatever you now find weird, ugly, uncomfortable and nasty about a new
    // medium will surely become its signature. CD distortion, the jitteriness
    // of digital video, the crap sound of 8-bit - all of these will be
    // cherished and emulated as soon as they can be avoided." -Brian Eno

    //float x1 = (0.17+0.8*u_warp)*cos(pos.x) - u_t/2000.0;
    //float y1 = (0.17+0.8*u_warp)*sin(pos.x) + u_t/640.0;
    //float x2 = (0.17+0.8*u_warp)*cos(pos.y) + u_t/640.0;
    //float y2 = (0.17+0.8*u_warp)*sin(pos.y) + u_t/2000.0;
    vec4 point = vec4(
        (0.17+0.8*u_warp)*cos(pos.x) - u_t/2000.0,
        (0.17+0.8*u_warp)*sin(pos.x) + u_t/640.0,
        (0.17+0.8*u_warp)*cos(pos.y) + u_t/640.0,
        (0.17+0.8*u_warp)*sin(pos.y) + u_t/2000.0
    );

    float noise = fbm_max(point + u_warp*fbm(point + 0.34*u_warp));
    gl_FragColor = serialize(vec2(noise, 0.0));
    //gl_FragColor = vec4(noise*noise*0.2, noise*0.9, noise, 1);
}
