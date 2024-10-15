import noise from "./NoiseState.js";


const mcanv = {
    initCanvas() {
        if (window.Worker) {
            this.canv = $("#canv")[0];
            this.canv.width = this.canv.height = 250;
            this.canv.style.width = canv.style.height = "31em";
            this.canv.ctx = canv.getContext("2d");
            noise.canvas = this.canv;
            var interval_id;
            var period = canv.width;
            noise.genNoise();
            this.canv.ctx.putImageData(noise.data, 0, 0);
            var offcanv = new Worker("/OffscreenRendering.js");
            offcanv.onmessage = (e) => {
                console.log(typeof e);
            }
        }
        else {
            alert("Web Workers Not Supported: please use a more modern browser");

        }
    },
    render() {
        if (this.renderFlag) {
            this.canv.ctx.putImageData(noise.genNoise(), 0, 0);
            this.renderFlag = false;
        }
        if (this.gridFlag) {
            displayGridlines();
        }
    }
}

mcanv.initCanvas();




//DOM LISTENERS
$("#fractalSum").on("input", (e) => {
    offcanv.postMessage({ value: e.target.value, width: canv.width, height: canv.height });
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


$("#gridlines").on("change", (e) => {
    if (e.target.checked == true) {
        mcanv.gridFlag = true;
    } else {
        mcanv.gridFlag = false;
    }
    mcanv.render();
});

$("#width").on("change", (e) => {
    mcanv.canv.width = e.target.value;
    mcanv.canv.height = e.target.value;
});

$(".updates-noise").on("change", (e) => {
    console.log(e.target.value);
    noise[e.target.id] = e.target.value;
    mcanv.renderFlag = true;
    mcanv.render();
});


//DOM-RELATED FUNCTIONS
function repeatFunc() {
    t1 = window.performance.now();
    noise = newNoise();
    ctx.putImageData(noise, 0, 0);
    t2 = window.performance.now();
    console.log(t2 - t1);
}


function displayGridlines() {
    var canv_img = noise.data;
    var canv_data = new Uint32Array(canv_img.data.buffer);
    for (var i = 0; i < noise.grid; i++) {
        for (var j = 0; j < noise.grid; j++) {
            canv_data[j / noise.grid * mcanv.canv.width + i / noise.grid * mcanv.canv.width * mcanv.canv.width] = 0xFF000000;
        }
    }
    mcanv.ctx.putImageData(canv_img, 0, 0);
}

