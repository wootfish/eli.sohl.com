// depends on preamble.js

var warp_increasing = false;
var fadein = 0;
var entering = false;


function updateState() {
    // load, update, and re-save state in sessionStorage
    t = parseFloat(sessionStorage.getItem('t'));
    warp = parseFloat(sessionStorage.getItem('warp'));

    const scale_factor = frame_interval / default_frame_interval;

    var delta_t;
    var delta_warp;

    if (entering) delta_t = t_slow + (t_fast-t_slow)*(1-fadein);
    else delta_t = 1+0.5*Math.cos(t/51);
    var delta_warp = (warp_increasing ? warp_max : warp_min)*warp_delta + warp*(1-warp_delta) - warp;

    t += delta_t * scale_factor;
    warp += delta_warp * scale_factor;

    sessionStorage.setItem('t', t);
    sessionStorage.setItem('warp', warp);
}


function doEnterAnimation() {
    if (fadein < 1) fadein = (fadein+0.017)**1.02;
    if (fadein >= 1) {
        fadein = 1;
        entering = false;
        sessionStorage.setItem('fancyfade', true);
        window.location.href = "./blog.html";
    }
}


function main() {
    const canvas = document.getElementById("glcanvas");
    gl = canvas.getContext("webgl");

    if (!gl) {
        alert("fuck -- no webgl");  // TODO handle this better
        return;
    }


    resize(gl.canvas);


    // load t from local storage if possible, else initialize it
    // (this keeps the background from jumping whenever we switch pages)
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
    const grayscottUniformLocation = gl.getUniformLocation(renderProgram, "u_grayscott");
    const resolutionUniformNoiseLocation = gl.getUniformLocation(noiseProgram, "u_resolution");
    const resolutionUniformRenderLocation = gl.getUniformLocation(renderProgram, "u_resolution");
    const positionAttributeNoiseLocation = gl.getAttribLocation(noiseProgram, "a_position");
    const positionAttributeRenderLocation = gl.getAttribLocation(renderProgram, "a_position");
    const fadeinUniformRenderLocation = gl.getUniformLocation(renderProgram, "u_fadein");

    // initialize the programs' (shared) position buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // set up a texture for the gray-scott data array, and a corresponding
    // framebuffer with the texture as its color buffer
    const gs_width = 320;
    const gs_height = 320;
    const gs_texture = gl.createTexture();
    const gs_framebuffer = gl.createFramebuffer();
    {
        gl.bindTexture(gl.TEXTURE_2D, gs_texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gs_width, gs_height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);  // initialize the texture

        // disable mips, specify wrap method
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.bindFramebuffer(gl.FRAMEBUFFER, gs_framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, gs_texture, 0);
    }
    {
        // set up the noise program's persistent state
        gl.useProgram(noiseProgram);
        gl.enableVertexAttribArray(positionAttributeNoiseLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(positionBuffer, 2, gl.FLOAT, false, 0, 0);
    }
    {
        // set up the render program's persistent state
        gl.useProgram(renderProgram);
        gl.enableVertexAttribArray(positionAttributeRenderLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(positionBuffer, 2, gl.FLOAT, false, 0, 0);
    }

    // get ready to render
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    function full_render() {
        requestAnimationFrame(full_render);
        if (limitFrameRate()) return;
        logFPS();
        updateState();
        if (entering) doEnterAnimation();

        {
            // draw noise pattern to gray-scott data texture
            gl.bindFramebuffer(gl.FRAMEBUFFER, gs_framebuffer);
            gl.useProgram(noiseProgram);
            gl.disable(gl.DEPTH_TEST);
            gl.disable(gl.BLEND);
            gl.viewport(0, 0, gs_width, gs_height);
            gl.uniform1f(tUniformLocation, t);
            gl.uniform1f(warpUniformLocation, warp);
            gl.uniform2f(resolutionUniformNoiseLocation, gs_width, gs_height);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }

        {
            // render gray-scott data texture's contents to canvas
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.useProgram(renderProgram);
            resize(gl.canvas);
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            gl.uniform2f(resolutionUniformRenderLocation, gl.canvas.width, gl.canvas.height);
            gl.uniform1f(fadeinUniformRenderLocation, fadein);
            gl.bindTexture(gl.TEXTURE_2D, gs_texture);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
    }

    requestAnimationFrame(full_render);
}


main();


// wire up & show UI elements
// (we don't want them to appear way before the background)

// (doing this in window.onpageshow lets us reset the page after thaw from
// firefox's bfcache, making "back" navigation faster than but otherwise
// identical to a fresh page load)

window.onpageshow = function () {
    $("#greeting").fadeIn(170, "linear");
    $("#enter").click(function () {
        entering = true;
        warp_increasing = true;
        $("#greeting").fadeOut(2600);
        $("#enter").fadeOut(2300);
    }).mouseenter(function () {
        warp_increasing = true;
    }).mouseleave(function () {
        if (!entering) {
            warp_increasing = false;
        }
    }).fadeIn(170, "linear");
}
