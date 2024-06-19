var offcanv = new OffscreenCanvas(500, 500);
var ctx = offcanv.getContext("2d");
var canv_img = ctx.getImageData(0, 0, 500, 500);
var canv_data = new Uint32Array(canv_img.data.buffer);
var noise = whiteNoise();
onmessage = (e) => {
    postMessage(noise);
    noise = whiteNoise();

}

function whiteNoise() {
    for (var i = 0; i < canv_data.length; i++) {
        canv_data[i] = 0xFF000000 + Math.random() * 0xFFFFFF;
    }
    ctx.putImageData(canv_img, 0, 0);
    return offcanv.transferToImageBitmap();
}

function lerp(t, lower, upper) {
    return lower + (upper - lower) * t;
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
