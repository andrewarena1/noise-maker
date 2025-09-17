function initCanvas() {
    var canv = document.getElementById("canv");
    canv.width = canv.height = 250;
    canv.style = "border:2px solid #000000";
    canv.style.width = canv.style.height = "500px";
    var ctx = canv.getContext("2d");
    var seed = 0;
    var shader = greyScale;
    var noise, noise2, interval_id;
    var period = canv.width;
    var fractal_iter = 1;
    var grid = 10;
    var noise_type = perlinGen; //NOTE must change if perlin is not first noise type in radio
    var milli_rate = 100 / 45;
    var t1, t2, count = 0;
    settingsUpdated();

    //DOM LISTENERS
    $("#fractalSum").on("change", (e) => {
        var layers = e.target.value
        if (layers != 1) {
            $("#fractalSumLabel")[0].text = "layers";
        }
        fractal_iter = layers
        settingsUpdated()
    });


    $("#seed").on("change", (e) => {
        seed = e.target.value;
        settingsUpdated();
    });

    $("#resX").on("change", (e) => {
        canv.width = e.target.value;
        canv.height = e.target.value;
        document.querySelector("#resY").value = e.target.value;
        settingsUpdated();
    });

    $("#grid").on("change", (e) => {
        grid = e.target.value;
        settingsUpdated();
    });

    $("#pixel_shader").on("change", (e) => {
        var index = e.target.selectedIndex
        if (index == 0) shader = greyScale
        if (index == 1) shader = funShad
        settingsUpdated();
    })


    $("input[type='radio'").on("click", (e) => {
        switch (e.target.id) {
            case "perlin":
                noise_type = perlinGen;
                break;
            case "smooth":
                noise_type = smoothGen;
                break;
            case "white":
                noise_type = whiteGen;
        }
        settingsUpdated();
    });

    //DOM-RELATED FUNCTIONS
    function settingsUpdated() {
        nextRandom = splitmix32(seed);
        noise = newNoise()
        noise2 = noise;
        ctx.putImageData(noise, 0, 0);
    }

    //NOISE FUNCTIONS

    /** returns the image data of the noise of currently selected type */
    function newNoise() {
        return shader(fractalSum(noise_type, grid, fractal_iter), -1, 1);
    }

    /** generate white noise. returns array of pixels with values bounded by -1 and 1. */
    function whiteGen() {
        var pixels = new Array(canv.width * canv.height);
        for (var i = 0; i < pixels.length; i++) {
            pixels[i] = nextRandom() * 2 - 1;
        }
        return pixels;
    }

    /** generate smooth 2D noise. returns array of pixels with bounded by -1 and 1. */
    function smoothGen(grid) {
        var pixels = new Array(canv.width * canv.height);
        var span = canv.width / grid;
        var values = new Array(grid);
        for (let i = 0; i < grid; i++) {
            let inner = new Array(grid);
            for (let j = 0; j < grid; j++) {
                inner[j] = nextRandom() * 2 - 1;
            }
            values[i] = inner;
        }
        for (let i = 0; i < canv.width * canv.width; i++) {
            let a1 = (i % canv.width) / span;
            let b1 = Math.floor(a1);
            let x = a1 - b1;
            let a2 = (i / canv.width) / span;
            let b2 = Math.floor(a2);
            let y = a2 - b2;
            let lerp_lower_x = smoothstepRemap(x, values[b2 % grid][b1 % grid], values[b2 % grid][(b1 + 1) % grid]);
            let lerp_higher_x = smoothstepRemap(x, values[(b2 + 1) % grid][b1 % grid], values[(b2 + 1) % grid][(b1 + 1) % grid]);
            pixels[i] = smoothstepRemap(y, lerp_lower_x, lerp_higher_x);
        }
        return pixels;
    }

    /** generate perlin noise. returns array of pixels with values bounded by -1 and 1 */
    function perlinGen(grid) {
        var pixels = new Array(canv.width * canv.height);
        var span = canv.width / grid;
        var gradients = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        var g = [];
        for (var i = 0; i < grid; i++) {
            let inner = [];
            for (let j = 0; j < grid; j++) {
                inner[j] = gradients[Math.floor(nextRandom() * gradients.length)];  //randomize gradients at lattice points
            }
            g[i] = inner;
        }

        for (var j = 0; j < canv.height; j++) {
            for (var i = 0; i < canv.width; i++) {
                pixels[i + canv.width * j] = Math.SQRT2 * perlin2d(i / span, j / span, g); //call perlin 2d at each point.
            }
        }
        var max = 0;
        for (var w = 0; w < pixels.length; w++) {
            if (pixels[w] >= max)
                max = pixels[w]
        }
        // console.log(max);
        // console.log(pixels);
        return pixels;
    }
    /** calculate perlin value for point x, y in grid g */
    function perlin2d(x, y, g) {
        var fl_x = Math.floor(x), fl_y = Math.floor(y);
        var t_x = x - fl_x, t_y = y - fl_y;
        var lx = fl_x % grid, uy = fl_y % grid, rx = (fl_x + 1) % grid, by = (fl_y + 1) % grid;
        var v = [];
        v[0] = t_x * g[lx][uy][0] + t_y * g[lx][uy][1];
        v[1] = (t_x - 1) * g[rx][uy][0] + t_y * g[rx][uy][1];
        v[2] = t_x * g[lx][by][0] + (t_y - 1) * g[lx][by][1];
        v[3] = (t_x - 1) * g[rx][by][0] + (t_y - 1) * g[rx][by][1];
        var upper_x = smoothstepRemap(t_x, v[0], v[1]);
        var lower_x = smoothstepRemap(t_x, v[2], v[3]);
        return smoothstepRemap(t_y, upper_x, lower_x);
    }


    /** Perform a fractal sum of the noise -- iterately double frequency and halve amplitude, and sum the sampled noise values at each pixel. 
     * Note: we ensure that the amplitude of the fractal is almost 1. 
     * returns the fractal summed noise values      
    */
    function fractalSum(noise_func, freq, num) {
        var sum = [];
        for (var i = 0; i < canv.width * canv.height; ++i) sum.push(0);
        var res;
        var g;
        var start_amp = 1 / (1 - (1/2)**(num))
        var test_amp = 0;
        for (var i = 0; i < num; i++) {
            new_freq = freq * Math.pow(2, i); // double frequency
            res = noise_func(new_freq);
            for (var j = 0; j < canv.width * canv.height; j++) {
                sum[j] += res[j] * start_amp / Math.pow(2, i + 1);
            }
            console.log(test_amp += start_amp / Math.pow(2, i + 1))

        }
        // ctx.putImageData(shader(sum, -1, 1), 0, 0);
        return sum;
    }

    /** transform array of ints between [min, max] to greyscaled image data. //TODO use percieved brightness?
     * 
     * @precondition min != max, arr.length = canv.width*canv.height.
     * @returns greyscaled image data representing the input arr. 
     */
    function greyScale(arr, min, max) {
        var pix_8 = new Uint8ClampedArray(canv.width * canv.height * 4);
        var pixels = new Uint32Array(pix_8.buffer);
        var val;
        var scale = 1 / (max - min);
        var shift = -1 * min
        for (let i = 0; i < arr.length; i++) {
            val = Math.round(0xFF * (arr[i] + shift) * scale);
            pixels[i] = 0xFF000000 + (val << 8) + (val << 16) + val;
        }
        return new ImageData(pix_8, canv.width, canv.height);
    }

    /*
     * Note: This is not at all how you would practically apply the perlin noise function! 
     * Here, we recieve an array where each value is the 2D Perlin function sampled at that pixel. Then we apply some fun shader to get our output image. 
     * In other words, here our only inputs are samples from the noise function (and pixel locations). This is unfortunate because it's inflexible. 
     * In Perlin's paper, he often uses his noise to add turbulence to some existing data (e.g. disturbing the boundary of a circle to represent the sun's corona). 
     * Or, he will sample the multiple noise functions for different uses (e.g. generating location of bands in marble texture vs adding turbulence to the bands)
     * Here, we are just applying different shaders to some rigid underlying data.
     * This visualization is still very cool, but this is something to keep in mind when generating output images. 
     */

    /**
     * transform array of ints between [min, max] to interesting image data.
     * 
     * @precondition min != max, arr.length = canv.width*canv.height.
     * @returns greyscaled image data representing the input arr. 
     */
    function funShad(arr, min, max) {
        //Write you own! An example is given here.
        var pix_8 = new Uint8ClampedArray(canv.width * canv.height * 4);
        var pixels = new Uint32Array(pix_8.buffer);
        //transform bounds on data from min to max -> 0 to 1
        var scale = 1 / (max - min);
        var shift = -1 * min
        for (let i = 0; i < arr.length; i++) {
            // var adjusted_pixel_val = (arr[i] + shift) * scale
            // var val = Math.round(0xFF * (Math.sin(i / (Math.PI * canv.width * grid) + Math.abs(arr[i])) + shift) * scale);
            var val_cc = lerp((Math.sin(i / (Math.PI * canv.width * grid) + Math.abs(arr[i])) + shift) * scale, 0x0, 0xFF);
            var red = val_cc
            var green = val_cc  << 8
            var blue = val_cc << 16
            pixels[i] = 0xFF000000 + (red + green + blue);
        }
        return new ImageData(pix_8, canv.width, canv.height);
    }
}

//helper functions
function lerp(t, lower, upper) {
    return lower + (upper - lower) * t;
}
function cosineRemap(t, lower, upper) {
    let t_remap_cos = (1 - Math.cos(t * Math.PI)) * 0.5;
    return lerp(t_remap_cos, lower, upper);
}
function smoothstepRemap(t, lower, upper) {
    let t_remap_step = 6 * t ** 5 - 15 * t ** 4 + 10 * t ** 3;
    return lerp(t_remap_step, lower, upper);
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


/*var gradients =
                [[0, 1, 1], [0, -1, -1], [0, 1, -1], [0, -1, 1],
                [1, 0, 1], [-1, 0, -1], [1, 0, -1], [-1, 0, 1],
                [1, 1, 0], [-1, -1, 0], [1, -1, 0], [-1, 1, 0]];*/