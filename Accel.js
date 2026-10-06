/** gpu-accelerated shaders */

function initGPUContext(device) { 
    const canvas = document.getElementById("canv");
    const context = canvas.getContext("webgpu");
    context.configure({
        device: device,
        format: navigator.gpu.getPreferredCanvasFormat(), 
        alphaMode: 'opaque'
    });
    return context;

}
async function requestDevice() { 
    // 1. Check for WebGPU support and request the device
    if (!navigator.gpu) {
        console.error("WebGPU is not supported on this browser.");
        return;
    }
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        console.error("No appropriate GPU adapter found.");
        return;
    }

    const device = await adapter.requestDevice();
    return device;
}

async function fetchShader(device) { 
    // Fetch the file text via network/file-server
    const response = await fetch('./accel.wgsl');
    const shaderCode = await response.text();

    // Pass the retrieved string to device compiler
    const shader_module = device.createShaderModule({
        label: "accel shader",
        code: shaderCode
    });

    const compilationInfo = await shader_module.getCompilationInfo();
    if (compilationInfo.messages.length > 0) {
        console.error("WGSL Compilation Errors:");
        for (const msg of compilationInfo.messages) {
            console.error(`${msg.lineNum}:${msg.linePos} - ${msg.message}`);
        }
    }
    return shader_module;
}

async function runComputeShader(grid, nextRandom, device, shader_module, context, fractal_depth) {    
    const uniform = device.createBuffer({
        size:16, 
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    const data = new Uint32Array([fractal_depth, grid, 0, 0]);
    device.queue.writeBuffer(uniform, 0, data);

    const pipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex: {
            module: shader_module,
            entryPoint: 'vs_main',
            buffers: []
        },
        fragment: {
            module: shader_module,
            entryPoint: 'fs_main',
            targets: [{ format: navigator.gpu.getPreferredCanvasFormat() }], // Directs output mapping to the canvas format
        },
        primitive: { topology: 'triangle-list' }
    });

    const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
        {
            binding: 0, resource: {buffer: uniform}
        }
    ]});

    const commandEncoder = device.createCommandEncoder();
    const renderPass = commandEncoder.beginRenderPass({
        colorAttachments: [{
            view: context.getCurrentTexture().createView(),
            clearValue: { r: 1, g: 0, b: 1, a: 1 },
            loadOp: 'clear',
            storeOp: 'store'
        }]
    });
    renderPass.setPipeline(pipeline); 
    renderPass.setBindGroup(0, bindGroup);
    renderPass.draw(3); 
    renderPass.end();
    device.queue.submit([commandEncoder.finish()]);
}
