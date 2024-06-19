function initCanvas() {
    if (window.Worker) {
        var canv = document.getElementById("canv");
        canv.style = "border:2px solid #000000";
        var ctx = canv.getContext("bitmaprenderer");
        const first_worker = new Worker("OffscreenRendering.js");
        var interval_id;
        var milli_rate = 22.2222;
        var t1, t2, count = 0;
        promptWorker();


        first_worker.onmessage = (e) => {
            ctx.transferFromImageBitmap(e.data);
            t2 = window.performance.now();
            console.log(t2 - t1);
            count++;
        }

        document.getElementById("anim").addEventListener("click", () => {
            if (interval_id) { //toggle OFF
                clearInterval(interval_id);
                interval_id = null;
                document.getElementById("framerate").style.visibility = "visible";
            } else { //toggle ON
                count = 0;
                t1 = window.performance.now();
                interval_id = setInterval(promptWorker, milli_rate);
                document.getElementById("framerate").style.visibility = "hidden";
            }
            //console.log((t2 - t1) / count);
        })

        document.getElementById("framerate").addEventListener("input", (e) => {
            let framerate = e.target.value;
            milli_rate = 1000 / framerate;
            document.getElementById("rate_label").innerText = `${framerate} fps`;

        })

        function promptWorker(message) {
            t1 = window.performance.now();
            first_worker.postMessage(message || "");
        }

    } else {
        alert("Web Worker is Not Supported: use a more modern browser")
    }
}

