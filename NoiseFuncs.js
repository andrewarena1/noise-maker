import state from "./NoiseState.js";

/** @returns ImageData containing generated Noise */
export default function newNoise() {
    var pix_8 = new Uint8ClampedArray(state.width * state.height * 4);
    var pixels = new Uint32Array(pix_8.buffer);
    var data = new ImageData(pix_8, state.width, state.height);
    var span = state.width / state.grid;
    if (state.noiseType == "2DPerlin") {
        perlinGen(pixels, state.grid);
        greyScale(pixels, -1, 1);
    }
    else if (state.noiseType == "2DSmooth") {
        goodNoise2D(pixels, span);
        greyScale(pixels, 0, 1);
    } else if (state.noiseType == "WhiteNoise") {
        whiteNoise(pixels, span);
        greyScale(pixels, 0, 1);
    }
    return data;
}

function whiteNoise(pixels, span) {
    for (var i = 0; i < pixels.length; i++) {
        pixels[i] = 0xFF * state.nextRandom();
    }
    return pixels;
}

function goodNoise2D(pixels, span) {
    var values = new Array(state.grid);
    for (let i = 0; i < state.grid; i++) {
        let inner = new Array(state.grid);
        for (let j = 0; j < state.grid; j++) {
            inner[j] = 0xFF * state.nextRandom();
        }
        values[i] = inner;
    }
    for (let i = 0; i < state.width * state.width; i++) {
        let a1 = (i % state.width) / span;
        let b1 = Math.floor(a1);
        let x = a1 - b1;
        let a2 = (i / state.width) / span;
        let b2 = Math.floor(a2);
        let y = a2 - b2;
        let lerp_lower_x = smoothstepRemap(x, values[b2 % state.grid][b1 % state.grid], values[b2 % state.grid][(b1 + 1) % state.grid]);
        let lerp_higher_x = smoothstepRemap(x, values[(b2 + 1) % state.grid][b1 % state.grid], values[(b2 + 1) % state.grid][(b1 + 1) % state.grid]);
        pixels[i] = smoothstepRemap(y, lerp_lower_x, lerp_higher_x);
    }
    return pixels;
}

function perlinGen(pixels, gsize) {
    var span = state.width / gsize;
    var gradients = [[0, 1], [0, -1], [1, 0], [-1, 0]]; // gradient options
    var g = []; // gradient grid
    for (var i = 0; i < gsize; i++) {
        let inner = [];
        for (let j = 0; j < gsize; j++) {
            inner[j] = gradients[Math.floor(state.nextRandom() * 4)];  //randomly choose from gradients at each lattice point
        }
        g[i] = inner;
    }
    for (var j = 0; j < state.height; j++) {
        for (var i = 0; i < state.width; i++) {
            pixels[i + state.width * j] = 0xFF * perlin2d(i / span, j / span, g, gsize); //generate perlin value for every pixel
        }
    }
    return pixels;
}
function perlin2d(x, y, g, gsize) {
    var fl_x = Math.floor(x);
    var t_x = x - fl_x;
    var fl_y = Math.floor(y);
    var t_y = y - fl_y;
    var v = [];
    for (var i = 0; i <= 1; i++) {
        for (var j = 0; j <= 1; j++) {
            v[2 * i + j] = g[(i + fl_x) % gsize][(j + fl_y) % gsize][0] * (x - (fl_x + i)) + g[(i + fl_x) % gsize][(j + fl_y) % gsize][1] * (y - (fl_y + j));
        }
    }
    var upper_x = smoothstepRemap(t_x, v[0], v[2]);
    var lower_x = smoothstepRemap(t_x, v[1], v[3]);
    return smoothstepRemap(t_y, upper_x, lower_x);
}

function lerp(t, lower, upper) {
    return lower + (upper - lower) * t;
}
function cosineRemap(t, lower, upper) {
    let t_remap_cos = (1 - Math.cos(t * Math.PI)) * 0.5;
    return lerp(t_remap_cos, lower, upper);
}
function smoothstepRemap(t, lower, upper) {
    let t_remap_step = t * t * (3 - 2 * t);
    return lerp(t_remap_step, lower, upper);
}

function greyScale(pixels, min, max) {
    var scale = 1 / (max - min);
    var shift = -1 * min
    for (let i = 0; i < pixels.length; i++) {
        pixels[i] = (pixels[i] + 0xFF * shift) * scale;
        pixels[i] *= 0x1000000;
    }
}
function redScale(pixels, min, max) {
    var scale = 1 / (max - min);
    var shift = -1 * min
    for (let i = 0; i < pixels.length; i++) {
        pixels[i] = (pixels[i] + 0xFF * shift) * scale;
        pixels[i] = pixels[i] * 0x1000000 + (pixels[i] % 0xFF);
    }
}

function splitmix32(a) {        //PRNG generator
    return function () {
        a |= 0;
        a = a + 0x9e3779b9 | 0;
        let t = a ^ a >>> 16;
        t = Math.imul(t, 0x21f0aaad);
        t = t ^ t >>> 15;
        t = Math.imul(t, 0x735a2d97);
        return ((t = t ^ t >>> 15) >>> 0) / 4294967296;
    }
}
