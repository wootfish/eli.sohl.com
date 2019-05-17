// https://webglfundamentals.org/ is the shit

var gl;
var now;
var first_frame = Date.now();
var last_frame = Date.now();
var frame_interval = 1000/30;  // cap frame rate for consistency (30 fps)
var frame_count = 0;
var t, warp;
var warp_min = 0.09;
var warp_max = 0.34;
var warp_delta = 0.011;
var debug = false;

// clipspace coordinates for two right triangles covering the whole screen
const positions = [
    -1.0, -1.0,
    1.0, -1.0,
    -1.0, 1.0,

    1.0, 1.0,
    1.0, -1.0,
    -1.0, 1.0
];


//main();


function pageWasReloaded() {
    if (!window.performance) return false;  // performance api not supported
    if (!performance.getEntriesByType) return (performance.navigation.type == 1);  // api level 2 not supported
    const entries = performance.getEntriesByType("navigation");  // the modern way
    for (var i = 0; i < entries.length; i++) {
        if (entries[i].type == "reload") {
            return true;
        }
    }
    return false;
}


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
    if (debug && frame_count % 200 == 0) {
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
