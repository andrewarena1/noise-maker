function initCanvas() {
    if (window.Worker) {
        var canv = document.getElementById("canv");
        canv.style = "border:2px solid #000000";
        var ctx = canv.getContext("bitmaprenderer");

        const first_worker = new Worker("OffscreenRendering.js");
        var interval_id;
        var milli_rate = 22.2222;
        promptWorker();

        first_worker.onmessage = (e) => {
            ctx.transferFromImageBitmap(e.data);
        }

        document.getElementById("anim").addEventListener("click", () => {
            if (interval_id) {
                clearInterval(interval_id);
                interval_id = null;
                document.getElementById("framerate").style.visibility = "visible";
            } else {
                interval_id = setInterval(promptWorker, milli_rate);
                document.getElementById("framerate").style.visibility = "hidden";
            }
        })

        document.getElementById("framerate").addEventListener("input", (e) => {
            let framerate = e.target.value;
            milli_rate = 1000 / framerate;
            document.getElementById("rate_label").innerText = `${framerate} fps`;

        })

        function promptWorker() {
            first_worker.postMessage("");
        }



    } else {
        alert("Web Worker is Not Supported: use a more modern browser")
    }
}