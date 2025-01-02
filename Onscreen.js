function initCanvas() {
    var canv = document.getElementById("canv");
    canv.width = canv.height = 250;
    canv.style = "border:2px solid #000000";
    canv.style.width = canv.style.height = "500px";
    var ctx = canv.getContext("2d");
    var seed = 0;
    var noise, noise2, interval_id;
    var period = canv.width;
    var grid = 10;
    var noise_type = perlinGen; //NOTE must change if perlin is not first noise type in radio
    var milli_rate = 100 / 45;
    var t1, t2, count = 0;

    settingsUpdated();
    //DOM LISTENERS
    $("#fractalSum").on("change", (e) => {
        console.log(e.target.value);
        fractalSum(noise_type, e.target.value);
    });

    $("#anim").on("click", () => {
        if (interval_id) { //toggle OFF
            clearInterval(interval_id);
            interval_id = null;
            document.getElementById("framerate").style.visibility = "visible";
        } else { //toggle ON
            count = 1;
            t1 = window.performance.now();
            interval_id = setInterval(repeatFunc, milli_rate);
            document.getElementById("framerate").style.visibility = "hidden";
        }
    });

    $("#framerate").on("input", (e) => {
        let framerate = e.target.value;
        milli_rate = 1000 / framerate;
        document.getElementById("rate_label").innerText = `${framerate} fps`;
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

    $("#gridlines").on("change", (e) => {
        if (e.target.checked == true) {
            displayGridlines(canv_data);
            ctx.putImageData(canv_img, 0, 0);
        } else {
            ctx.putImageData(noise, 0, 0);
        }

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

    $("#period").on("change", (e) => {
        period = e.target.value;
        settingsUpdated();
    });
    //DOM-RELATED FUNCTIONS
    function settingsUpdated() {
        $("#fractalSum")[0].value = 1;
        nextRandom = splitmix32(seed);
        noise = newNoise();
        noise2 = noise;
        ctx.putImageData(noise, 0, 0);
    }

    function repeatFunc() {
        t1 = window.performance.now();
        noise = newNoise();
        ctx.putImageData(noise, 0, 0);
        t2 = window.performance.now();
        console.log(t2 - t1);
    }

    function displayGridlines(canv_data) {
        var canv_img = ctx.getImageData(0, 0, canv.width, canv.height);
        var canv_data = new Uint32Array(canv_img.data.buffer);
        for (var i = 0; i < grid; i++) {
            for (var j = 0; j < grid; j++) {
                canv_data[j / grid * canv.width + i / grid * canv.width * canv.width] = 0xFF000000;
            }
        }
    }
    //NOISE FUNCTIONS

    /** returns the image data of the noise of currently selected type */
    function newNoise() {
        return greyScale(noise_type(grid), 0, 1);
    }
    /** generate white noise. returns array of pixels with values from 0 to 1. */
    function whiteGen() {
        var pixels = new Array(canv.width * canv.height);
        for (var i = 0; i < pixels.length; i++) {
            pixels[i] = nextRandom();
        }
        return pixels;
    }
    /** generate smooth 2D noise. returns array of pixels with values from 0 to 1. */
    function smoothGen(grid) {
        var pixels = new Array(canv.width * canv.height);
        var span = canv.width / grid;
        var values = new Array(grid);
        for (let i = 0; i < grid; i++) {
            let inner = new Array(grid);
            for (let j = 0; j < grid; j++) {
                inner[j] = nextRandom();
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
    /** generate white noise. returns array of pixels with values from 0 to 1. */
    function perlinGen(grid) {
        var pixels = new Array(canv.width * canv.height);
        var span = canv.width / grid;
        var gradients = [[0, 1], [0, -1], [1, 0], [-1, 0]]; // gradient options
        var g = []; // gradient grid
        for (var i = 0; i < grid; i++) {
            let inner = [];
            for (let j = 0; j < grid; j++) {
                inner[j] = gradients[Math.floor(nextRandom() * 4)];  //randomize gradients at lattice points
            }
            g[i] = inner;
        }

        for (var j = 0; j < canv.height; j++) {
            for (var i = 0; i < canv.width; i++) {
                pixels[i + canv.width * j] = (perlin2d(i / span, j / span, g) + 1) / 2; //call perlin 2d at each point
            }
        }
        return pixels;
    }
    /** calculate perlin value for point x, y in grid g */
    function perlin2d(x, y, g) {
        var fl_x = Math.floor(x);
        var t_x = x - fl_x;
        var fl_y = Math.floor(y);
        var t_y = y - fl_y;
        var v = [];
        for (var i = 0; i <= 1; i++) {
            for (var j = 0; j <= 1; j++) {
                v[2 * i + j] = g[(i + fl_x) % grid][(j + fl_y) % grid][0] * (x - (fl_x + i)) + g[(i + fl_x) % grid][(j + fl_y) % grid][1] * (y - (fl_y + j));
            }
        }
        var upper_x = smoothstepRemap(t_x, v[0], v[2]);
        var lower_x = smoothstepRemap(t_x, v[1], v[3]);
        return smoothstepRemap(t_y, upper_x, lower_x);
    }

    /** Perform a fractal sum of the noise -- iterately double frequency and halve amplitude, and sum the results.
    */
    function fractalSum(func, num) {
        if (num == 1)
            return settingsUpdated();
        nextRandom = splitmix32(seed);
        var sum = [];
        for (var i = 0; i < canv.width * canv.height; ++i) sum.push(0);
        var res;

        for (var i = 0; i < num; i++) {
            res = func(grid * Math.pow(2, i));
            for (var j = 0; j < canv.width * canv.height; j++) {
                sum[j] += res[j] / Math.pow(2, i + 1);
            }
            console.log(sum);
        }
        ctx.putImageData(greyScale(sum, 0, 1), 0, 0);
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
        let t_remap_step = t * t * (3 - 2 * t);
        return lerp(t_remap_step, lower, upper);
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
    function redScale(pixels, min, max) {
        var scale = 1 / (max - min);
        var shift = -1 * min
        for (let i = 0; i < pixels.length; i++) {
            pixels[i] = (pixels[i] + shift) * scale;
            pixels[i] = pixels[i] * 0xFF000000 + (pixels[i] % 0xFF);
        }
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


/*var gradients =
                [[0, 1, 1], [0, -1, -1], [0, 1, -1], [0, -1, 1],
                [1, 0, 1], [-1, 0, -1], [1, 0, -1], [-1, 0, 1],
                [1, 1, 0], [-1, -1, 0], [1, -1, 0], [-1, 1, 0]];*/