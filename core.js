// https://webglfundamentals.org/ is the shit

var gl;

var now, frame_delta;

var first_frame = Date.now();
var last_frame = Date.now();

var frame_interval = 1000/24;  // 24 fps
var frame_count = 0;
var t = 0;

var debug = true;

// clipspace coordinates for two right triangles covering the whole screen
const positions = [
    -1.0, -1.0,
    1.0, -1.0,
    -1.0, 1.0,

    1.0, 1.0,
    1.0, -1.0,
    -1.0, 1.0
];


main();

function limitFrameRate() {
    now = Date.now();
    delta = now - last_frame;
    if (delta <= frame_interval) return true;
    last_frame = now - (delta % frame_interval);
    return false;
}


function logFPS() {
    // log fps
    frame_count += 1;
    if (debug && frame_count % 240 == 0) {
        console.log("fps:", 1000*frame_count/(last_frame-first_frame), "frames:", frame_count);
    }
}


function resize(canvas) {
    // get browser display's size
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    // if canvas size != display size, set canvas size to display size
    if (canvas.width != displayWidth || canvas.height != displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
    }
    //console.log(canvas.width, canvas.height);
}


function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }
    // on failure
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}


function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }
    // on failure
    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}


function main() {
    const canvas = document.getElementById("glcanvas");
    gl = canvas.getContext("webgl");

    if (!gl) {
        alert("fuck -- no webgl");  // TODO handle this better
        return;
    }

    resize(gl.canvas);

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
    const tUniformLocation = gl.getUniformLocation(noiseProgram, "t");
    const grayscottUniformLocation = gl.getUniformLocation(renderProgram, "u_grayscott");
    const resolutionUniformNoiseLocation = gl.getUniformLocation(noiseProgram, "u_resolution");
    const resolutionUniformRenderLocation = gl.getUniformLocation(renderProgram, "u_resolution");
    const positionAttributeNoiseLocation = gl.getAttribLocation(noiseProgram, "a_position");
    const positionAttributeRenderLocation = gl.getAttribLocation(renderProgram, "a_position");

    // initialize the programs' (shared) position buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // set up a texture for the gray-scott data array, and a corresponding
    // framebuffer with the texture as its color buffer
    const gs_width = 128;
    const gs_height = 128;
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

        t += 1;

        // draw noise pattern to gray-scott data texture
        gl.bindFramebuffer(gl.FRAMEBUFFER, gs_framebuffer);
        gl.useProgram(noiseProgram);
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.BLEND);
        gl.viewport(0, 0, gs_width, gs_height);
        gl.uniform1f(tUniformLocation, t);
        gl.uniform2f(resolutionUniformNoiseLocation, gs_width, gs_height);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // render gray-scott data texture's contents to canvas
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.useProgram(renderProgram);
        resize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.uniform2f(resolutionUniformRenderLocation, gl.canvas.width, gl.canvas.height);
        gl.bindTexture(gl.TEXTURE_2D, gs_texture);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    requestAnimationFrame(full_render);
}
