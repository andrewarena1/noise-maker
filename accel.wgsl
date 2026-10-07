
struct Uniforms { 
    depth: u32, 
    grid: u32, 
    _pad2: u32, 
    _pad3: u32
}

const SQRT_2_2: f32 = sqrt(2.0) / 2.0f;
const TWO_PI: f32 = 2*3.141592653589793;

@group(0) @binding(0) var<uniform> uniforms: Uniforms; 

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
};

// Vertex shader: Generates a full-screen triangle automatically without vertex buffers
@vertex
fn vs_main(@builtin(vertex_index) vertex_index: u32) -> VertexOutput {
    var out: VertexOutput;
    let x = f32(i32(vertex_index << 1u) & 2) * 2.0 - 1.0;
    let y = f32(i32(vertex_index & 2u)) * 2.0 - 1.0;
    out.position = vec4<f32>(x, y, 0.0, 1.0);
    out.uv = vec2<f32>(x * 0.5 + 0.5, 1.0 - (y * 0.5 + 0.5)); // Flip Y for standard texture coords
    return out;
}

// PCG hash: integer coords + octave seed → pseudo-random u32
fn hash2(ix: u32, iy: u32, seed: u32) -> u32 {
    var h = ix * 1664525u + iy * 1013904223u + seed * 2891336453u;
    h = h ^ (h >> 16u);
    h = h * 0x45d9f3bu;
    h = h ^ (h >> 16u);
    return h;
}

// Map a hash to one of 4 gradient vectors: (±1,0), (0,±1)
fn grad(x: u32, y:u32, seed: u32) -> vec2f {
    let h = f32(hash2(x, y, seed)) / f32(0xFFFFFFFF);
    return vec2f(cos(h*TWO_PI), sin(h*TWO_PI));
    // if h == 0u { return vec2f( 1.0,  0.0); }
    // if h == 1u { return vec2f(-1.0,  0.0); }
    // if h == 2u { return vec2f( 0.0,  1.0); }
    // if h == 3u { return vec2f( 0.0, -1.0); }
    // if h == 4u { return vec2f( SQRT_2_2, -SQRT_2_2); }
    // if h == 5u { return vec2f( SQRT_2_2, SQRT_2_2); }
    // if h == 6u { return vec2f( -SQRT_2_2, SQRT_2_2); }
    //              return vec2f( -SQRT_2_2, -SQRT_2_2);

}

fn perlin2d(xy: vec2f, grid: u32, seed:u32) -> f32 {
    let fl = floor(xy);
    let t =  xy - fl;
    let ll = vec2<u32>(fl) % grid;  
    let s1 = grad(ll.x, ll.y, seed);
    let s2 = grad(ll.x + 1u, ll.y, seed);
    let s3 = grad(ll.x, ll.y + 1u, seed);
    let s4 = grad(ll.x + 1u, ll.y + 1u, seed);
    var v1 = vec2f(dot(t, s1), dot(t - vec2f(0.0, 1.0), s3));
    var v2 = vec2f(dot(t - vec2f(1.0, 0.0), s2), dot(t - vec2f(1.0), s4));
    let fade = smoothstep(vec2f(0.0), vec2f(1.0), t);
    let m = mix(v1, v2, fade.x);
    return mix(m.x, m.y, fade.y);
}

@fragment
fn fs_main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
    var grid = uniforms.grid;
    var noise = 0.0;
    var amp = 0.5 / (1.0 - pow(0.5, f32(uniforms.depth)));
    var nuv = uv * f32(grid);
    for (var i = 0u; i < uniforms.depth; i++) {
        noise += perlin2d(nuv, grid, i) * amp;
        grid *= 2u;
        nuv *= 2f;
        amp *= 0.5;
    }
    let c = noise * 0.5 + 0.5;  // remap [-1,1] -> [0,1] for display
    return vec4<f32>(c, c, c, 1.0);
}