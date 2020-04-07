// https://webglfundamentals.org/ is the shit


var gl;
var now;
var first_frame = Date.now();
var last_frame = Date.now();
var target_fps = 30;
var frame_interval = 1000/target_fps;
var default_frame_interval = frame_interval;
var frame_count = 0;
//var t, warp, fadein;
var t_slow = 0.2;
var t_fast = 1;
var warp_min = 0.17;
var warp_max = 0.34;
var warp_med = (warp_min+warp_max)/2.0;
var tiler = null;
var debug = false;
var params;


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
    frame_count += 1;

    const fps = 1000*frame_count/(last_frame-first_frame);
    if (debug && frame_count % 20 == 0) {
        console.log("fps:", fps, "target:", target_fps, "frames:", frame_count);
    }
    if (last_frame-first_frame > 2000 && last_frame-first_frame < 10000 && fps <= target_fps-1 && frame_count % 2 == 0) {
        target_fps = Math.max(target_fps-1, 1);  // scale back target by 1, but bottom out at 1 fps total
        frame_interval = 1000/target_fps;
    }
    if (target_fps > 4 && target_fps < 10) {
        // if the hardware can't even push 10 fps then let's just take pity
        // and aim low (but still allow the auto-scaling to go lower)
        target_fps = Math.max(target_fps-1, 4);
        frame_interval = 1000/target_fps;
    }

    return false;
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


function initParams(fade_val, t_rate) {
    params = {warp: (fade_val == 0 ? warp_min : warp_med), fadein: fade_val};

    if (!sessionStorage.getItem('t') || pageWasReloaded()) {
        params.t = (Date.now()**2) % 1000001;
    } else {
        params.t = parseFloat(sessionStorage.getItem('t'));
    }

    function increment_t () {
        $(params).animate({t: params.t + 100}, {
            duration: t_rate,
            easing: 'linear',
            complete: increment_t
        });
    }
    increment_t();
}


function simpleModeForced() {
    return window.matchMedia("(max-width:840px)").matches;
}
