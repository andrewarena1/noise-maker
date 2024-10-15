import makeNoise from "./NoiseFuncs.js";

onmessage = (e) => {
    renderOffCanv();
}

function renderOffCanv() {
    var offcanv = new OffscreenCanvas(500, 500);
    var ctx = offcanv.getContext("2d");
    var canv_img = ctx.getImageData(0, 0, 500, 500);
    var canv_data = new Uint32Array(canv_img.data.buffer);


    function fractalSum(num) {
        var sum = new Uint32Array(canv.width * canv.height);
        for (var i = 0; i < num; i++) {
            nextRandom = splitmix32(seed);
            var pix_8 = new Uint8ClampedArray(canv.width * canv.height * 4);
            var data = new ImageData(pix_8, canv.width, canv.height);
            var pixels = new Uint32Array(pix_8.buffer);
            perlinGen(pixels, grid * Math.pow(2, i));
            greyScale(pixels, -1, Math.pow(2, i + 2) - 1);
            for (var j = 0; j < pixels.length; j++) {
                sum[j] += pixels[j];
            }
        }
        var almost = new Uint8ClampedArray(sum.buffer);
        var fin_img = new ImageData(almost, canv.width, canv.height);
        postMessage(fin_img);
    }
}

