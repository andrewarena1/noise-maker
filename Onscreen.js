function initCanvas() {
    if (window.Worker) {
        var canv = document.getElementById("canv");
        canv.width = canv.height = 250;
        canv.style = "border:2px solid #000000";
        canv.style.width = canv.style.height = "500px";
        var ctx = canv.getContext("2d");
        var seed = 0;
        var canv_data, canv_img, noise, interval_id;
        var period = canv.width;
        var grid = 10;
        var noise_type = "goodNoise";
        settingsUpdated();

        var milli_rate = 22.2222;
        var t1, t2, count = 0;

        $("#anim").on("click", () => {
            if (interval_id) { //toggle OFF
                clearInterval(interval_id);
                interval_id = null;
                document.getElementById("framerate").style.visibility = "visible";
            } else { //toggle ON
                count = 0;
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

        $("input[type='radio'").on("click", (e) => {
            noise_type = e.target.value;
            settingsUpdated();
        });

        $("#period").on("change", (e) => {
            period = e.target.value;
            settingsUpdated();
        })


        function repeatFunc() {
            t1 = window.performance.now();
            ctx.putImageData(noise, 0, 0);
            newNoise();
            t2 = window.performance.now();
            console.log(t2 - t1);
        }

        function settingsUpdated() {
            ctx.clearRect(0, 0, canv.width, canv.height);
            canv_img = ctx.getImageData(0, 0, canv.width, canv.height);
            canv_data = new Uint32Array(canv_img.data.buffer);
            nextRandom = splitmix32(seed);
            newNoise();
            ctx.putImageData(noise, 0, 0);
        }

        function newNoise() {
            if (noise_type == "goodNoise") {
                noise = goodNoise1D();
            } else if (noise_type == "whiteNoise") {
                noise = whiteNoise();
            }
        }
        function whiteNoise() {
            for (var i = 0; i < canv_data.length; i++) {
                canv_data[i] = Math.round(0xFF * nextRandom()) * 0x1000000;
            }
            return canv_img;
        }

        function goodNoise1D() {
            var pix_dist = period / grid;
            var values = new Array(grid);
            var stink = new Uint32Array(canv.width);
            for (let i = 0; i < grid; i++) {
                values[i] = 0xFF * nextRandom();

            }
            for (let i = 0; i < canv.width; i++) {
                let a = i / pix_dist;
                let b = Math.floor(a);
                let t = a - b;
                stink[i] = cosineRemap(t, values[b % grid], values[(b + 1) % grid]);
            }
            for (let i = 0; i < canv.height; i++) {
                for (let j = 0; j < canv.width; j++) {
                    canv_data[i + canv.width * j] = stink[i];
                }
            }
            greyScale();

            return canv_img;
        }

        function lerp(t, lower, upper) {
            return lower + (upper - lower) * t;
        }
        function cosineRemap(t, lower, upper) {
            let t_remap_cos = (1 - Math.cos(t * Math.PI)) * 0.5;
            return lerp(t_remap_cos, lower, upper);
        }
        function greyScale() {
            for (let i = 0; i < canv_data.length; i++) {
                canv_data[i] *= 0x1000000;
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
