function initCanvas() {
    if (window.Worker) {
        var canv = document.getElementById("canv");
        canv.width = canv.height = 250;
        canv.style = "border:2px solid #000000";
        canv.style.width = canv.style.height = "500px";
        var ctx = canv.getContext("2d");
        var seed = 0;
        var noise, noise2, interval_id;
        var period = canv.width;
        var grid = 10;
        var noise_type = $("input[type='radio']:first").attr("id"); // first radio button is noise type
        var milli_rate = 100 / 45;
        var t1, t2, count = 0;

        settingsUpdated();
        //DOM LISTENERS
        $("#fractalSum").on("change", () => {
            fractalSum(e.target.value);
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
            noise_type = e.target.id;
            settingsUpdated();
        });

        $("#period").on("change", (e) => {
            period = e.target.value;
            settingsUpdated();
        });
        //DOM-RELATED FUNCTIONS
        function settingsUpdated() {
            ctx.clearRect(0, 0, canv.width, canv.height);
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
        function newNoise() {
            var pix_8 = new Uint8ClampedArray(canv.width * canv.height * 4);
            var pixels = new Uint32Array(pix_8.buffer);
            var data = new ImageData(pix_8, canv.width, canv.height);
            var span = canv.width / grid;

            if (noise_type == "perlinNoise") {
                perlinGen(pixels, span);
            }
            else if (noise_type == "goodNoise") {
                goodNoise1D(pixels, span);
            } else if (noise_type == "whiteNoise") {
                whiteNoise(pixels, span);
            }
            greyScale(pixels);
            return data;
        }
        function whiteNoise(pixels, span) {
            for (var i = 0; i < pixels.length; i++) {
                pixels[i] = 0xFF * nextRandom();
            }
            return pixels;
        }

        function goodNoise1D(pixels, span) {
            var values = new Array(grid);
            for (let i = 0; i < grid; i++) {
                let inner = new Array(grid);
                for (let j = 0; j < grid; j++) {
                    inner[j] = 0xFF * nextRandom();
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

        function perlinGen(pixels, span) {
            var abc = pixels;
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
                    abc[i + canv.width * j] = 0xFF * (perlin2d(i / span, j / span, g) + 1) * 0.5; //call perlin 2d at each point
                }
            }
            console.log(abc);
            return pixels;
        }
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

        function greyScale(pixels) {
            for (let i = 0; i < pixels.length; i++) {
                pixels[i] *= 0x1000000;
            }
        }
        function redScale(pixels) {
            for (let i = 0; i < pixels.length; i++) {
                pixels[i] = 0xFF000000 + (2 * pixels[i] % 0xFF) * 0x10000 + (3 * pixels[i] % 0xFF) * 0x100 + (5 * pixels[i] % 0xFF) * pixels[i];
            }
        }

    } else {
        alert("Web Worker is Not Supported: use a more modern browser")
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