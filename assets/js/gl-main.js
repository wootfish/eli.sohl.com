---
---


{% include checker.js %}
{% include preamble.js %}


function updateState() {
    // load, update, and re-save state in sessionStorage
    t = parseFloat(sessionStorage.getItem('t'));
    warp = parseFloat(sessionStorage.getItem('warp'));

    const scale_factor = frame_interval / default_frame_interval;

    t += t_slow * scale_factor;
    var delta_warp = (warp_max*warp_delta + warp*(1-warp_delta)) - warp;
    warp += delta_warp * scale_factor;

    sessionStorage.setItem('t', t);
    sessionStorage.setItem('warp', warp);
}


function main() {
    const gl = document.getElementById("drawcanvas").getContext("webgl");
    const tiler = document.getElementById("tilecanvas").getContext("2d");

    if (!gl) {
        alert("fuck -- no webgl");  // TODO handle this better
        return;
    }
    if (!tiler) {
        alert("fuck -- no canvas");  // TODO handle this better
        return;
    }

    resize(gl.canvas);
    resize(tiler.canvas);


    // load t from local storage if possible, else initialize it
    // (this keeps the background from jumping whenever we click a link)
    // also, reinitialize t if this is a page refresh
    if (!sessionStorage.getItem('t') || pageWasReloaded()) {
        t = (Date.now()**2) % 1000001;
        sessionStorage.setItem('t', t);
    }

    if (!sessionStorage.getItem('warp') || pageWasReloaded()) {
        warp = (warp_min+warp_max)/2;
        sessionStorage.setItem('warp', warp);
    }


    // compile and initialize shaders
    const vertexShaderSource = document.getElementById("2d-vertex-shader").text;
    const noiseShaderSource = document.getElementById("2d-fragment-noise-shader").text;
    const renderShaderSource = document.getElementById("2d-fragment-render-shader").text;

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const noiseShader = createShader(gl, gl.FRAGMENT_SHADER, noiseShaderSource);
    const renderShader = createShader(gl, gl.FRAGMENT_SHADER, renderShaderSource);

    // initialize WebGL programs
    const noiseProgram = createProgram(gl, vertexShader, noiseShader);
    const renderProgram = createProgram(gl, vertexShader, renderShader);

    // get the locations of the programs' uniforms
    const tUniformLocation = gl.getUniformLocation(noiseProgram, "u_t");
    const warpUniformLocation = gl.getUniformLocation(noiseProgram, "u_warp");
    const textureUniformLocation = gl.getUniformLocation(renderProgram, "u_texture");
    const resolutionUniformNoiseLocation = gl.getUniformLocation(noiseProgram, "u_resolution");
    const resolutionUniformRenderLocation = gl.getUniformLocation(renderProgram, "u_resolution");
    const positionAttributeNoiseLocation = gl.getAttribLocation(noiseProgram, "a_position");
    const positionAttributeRenderLocation = gl.getAttribLocation(renderProgram, "a_position");
    const fadeinUniformRenderLocation = gl.getUniformLocation(renderProgram, "u_fadein");

    // initialize the programs' (shared) position buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // set up a texture for the data array, and a corresponding framebuffer
    // with the texture as its color buffer
    const tex_width = 320;
    const tex_height = 320;
    const gs_texture = gl.createTexture();
    const gs_framebuffer = gl.createFramebuffer();
    {
        gl.bindTexture(gl.TEXTURE_2D, gs_texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, tex_width, tex_height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);  // initialize the texture

        // disable mips, specify wrap method
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.bindFramebuffer(gl.FRAMEBUFFER, gs_framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, gs_texture, 0);
    }

    // set up the noise program's persistent state
    gl.useProgram(noiseProgram);
    gl.enableVertexAttribArray(positionAttributeNoiseLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionBuffer, 2, gl.FLOAT, false, 0, 0);

    // set up the render program's persistent state
    gl.useProgram(renderProgram);
    gl.enableVertexAttribArray(positionAttributeRenderLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionBuffer, 2, gl.FLOAT, false, 0, 0);

    // get ready to render
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    function full_render() {
        requestAnimationFrame(full_render);
        if (limitFrameRate()) return;
        logFPS();
        updateState();
        //resize(gl.canvas);
        resize(tiler.canvas);

        {
            // draw noise pattern to gray-scott data texture
            gl.bindFramebuffer(gl.FRAMEBUFFER, gs_framebuffer);
            gl.useProgram(noiseProgram);
            gl.disable(gl.DEPTH_TEST);
            gl.disable(gl.BLEND);
            gl.viewport(0, 0, tex_height, tex_height);
            gl.uniform1f(tUniformLocation, t);
            gl.uniform1f(warpUniformLocation, warp);
            gl.uniform2f(resolutionUniformNoiseLocation, tex_height, tex_height);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
        {
            // render gray-scott data texture's contents to canvas
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.useProgram(renderProgram);
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            gl.uniform2f(resolutionUniformRenderLocation, gl.canvas.width, gl.canvas.height);
            gl.uniform1f(fadeinUniformRenderLocation, 1);
            gl.bindTexture(gl.TEXTURE_2D, gs_texture);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }

        tiler.fillStyle = tiler.createPattern(gl.canvas, 'repeat');
        tiler.fillRect(0, 0, tiler.canvas.width, tiler.canvas.height);
    }

    requestAnimationFrame(full_render);
}


if (checkFancyEnabled()) main();


if (sessionStorage.getItem('fancyfade') == 'true') {
    $(".contentbox").fadeIn(5100);
    sessionStorage.setItem('fancyfade', false);
} else {
    $(".contentbox").fadeIn(420);
}
