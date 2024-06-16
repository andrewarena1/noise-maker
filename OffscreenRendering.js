var offcanv = new OffscreenCanvas(500, 500);
var ctx = offcanv.getContext("2d");
var canv_img = ctx.getImageData(0, 0, 500, 500);
var canv_data = new Uint32Array(canv_img.data.buffer);

onmessage = (e) => {
    postMessage(whiteNoise());
}

function whiteNoise() {
    let rand1, rand2;
    let rand3s = [];
    let arr = [0xFFFF0000, 0xFF00FF00, 0xFF0000FF]; //need four colors to prevent extreme diagonal banding
    for (var j = 0; j < offcanv.height; j += 1) {
        for (var i = 0; i < offcanv.width; i += 1) {
            do {
                rand2 = Math.floor(Math.random() * 3);
            } while (rand1 == rand2 || rand2 == rand3s[i]);
            canv_data[i + 500 * j] = arr[rand2];
            rand1 = rand2;
            rand3s[i] = rand2;
            rand2 = -1;
        }

    }
    console.log(canv_img);
    ctx.putImageData(canv_img, 0, 0);
    return offcanv.transferToImageBitmap();
}