---
layout: post
title: Grab Bag: Processing Tips & Tricks
---

I adore Processing. It's so easy to use! As someone with a deep aversion to boilerplate, I can tell that the designers of Processing are kindred spirits. The more I use it, the more appreciation I gain for the care that they've clearly put into this project. The language is terse, expressive, powerful, focused, flexible... I could go on.

Processing is built on Java. I used to hate Java, but Processing has taught me to tolerate it. It's that good. Plus, if you ever need to pull a weird data structure in from Java's standard libraries, you can.

My latest project is a framework for MIDI controller-driven generative concert visuals. This codebase currently weighs in at about 6500 lines of Processing and GLSL. I thought it might be fun to collect in one place some of the tricks this project has taught me, so here they are.

<!--
One of my favorite things about Processing is how easy it makes it to work with GLSL shaders. These, if you don't know, are little [C-like](https://www.khronos.org/opengl/wiki/Core_Language_(GLSL)) programs that run natively on your GPU. Because they run on the GPU, they can be _massively_ parallel. You can do things like write a program to render a single pixel, and run it for every pixel on your screen at the same time. You can also do parallel data processing, which is super useful: this lets you write fast implementations for things like particle effects or reaction-diffusion effects. I'll show you toy examples for all three of those use cases.

The Processing site has a great tutorial on shaders. You can find it [here](https://processing.org/tutorials/pshader/).

This tutorial shows you how to texture 3D shapes, how to do fancy vertex manipulations, etc. I mostly use shaders for a simpler purpose: drawing cool patterns on fullscreen rects.
-->


# Shader Rendering

Let's say you just got done reading [The Book of Shaders](https://thebookofshaders.com/) (or maybe it was the excellent [Processing shader tutorial](https://processing.org/tutorials/pshader/)) and you want to try out what you've learned.

The simplest way to render a shader is to draw a rectangle over the entire screen and use the shader to texture it. This will result in the GPU evaluating the shader once for each pixel in the draw area. You can do this on screen or in an offscreen buffer; usually I find it more convenient to do it offscreen.

## ShaderBuffer

This is a utility class for rendering a shader in an offscreen buffer. I use this all the time. The constructor takes a `PShader`, a width, and a height. It takes care of setting up an offscreen buffer at the given resolution, and it provides a `render()` method for running the shader on the full buffer. You can access the result as `shader_buffer.pg`.

```processing
// sb.pde

class ShaderBuffer {
  PGraphics2D pg;
  PShader sh;
  int pg_w;
  int pg_h;

  ShaderBuffer(PShader sh, int pg_w, int pg_h) {
    // the shader is assumed to accept a `wh_rcp` uniform.
    this.sh = sh;
    this.pg_w = pg_w;
    this.pg_h = pg_h;
    sh.set("wh_rcp", 1.0/pg_w, 1.0/pg_h);
  }

  void initialize() {
    pg = createTexture(pg_w, pg_h);
  }

  PGraphics2D createTexture(int w, int h){
    PGraphics2D pg = (PGraphics2D) createGraphics(w, h, P2D);
    pg.beginDraw();
    pg.smooth(0);  // no antialiasing nonsense
    pg.textureSampling(2);  // 2: sample nearest (no interpolation)
    pg.blendMode(REPLACE);  // no blending (in case we want to store data in alpha)
    pg.clear();
    pg.noStroke();
    pg.endDraw();
    return pg;
  }

  void render() {
    pg.shader(sh);
    pg.beginDraw();
    pg.rectMode(CORNER);
    pg.rect(0, 0, pg_w, pg_h);
    pg.endDraw();
  }
}
```

Nothing groundbreaking, but it helps cut down on boilerplate. In fact, it helps a lot. You'll see momentarily.

## DualBuffer

One common pattern that I've found myself using in this project is to write shaders that take their own output as an input. It opens up all kinds of trippy possibilities. It's also useful for running simulations on the GPU: if you can represent the state in a PGraphics buffer, you can iterate on it with this pattern.

Here's a class which encapsulates that pattern. Again, it takes a `PShader`, a width, and a height.

```processing
// db.pde

class DualBuffer {
  ShaderBuffer src;
  ShaderBuffer dst;
  PShader sh;
  int pg_w;
  int pg_h;

  DualBuffer(PShader sh, int pg_w, int pg_h) {
    // the shader is assumed to accept `tex` and `wh_rcp` uniforms.
    this.sh = sh;
    this.pg_w = pg_w;
    this.pg_h = pg_h;
    sh.set("wh_rcp", 1f/pg_w, 1f/pg_h);
  }

  void initialize() {
    src = new ShaderBuffer(sh, pg_w, pg_h);
    dst = new ShaderBuffer(sh, pg_w, pg_h);
    src.initialize();
    dst.initialize();
  }

  void swap() {
    ShaderBuffer tmp = src;
    src = dst;
    dst = tmp;
  }

  void passes(int num) {
    for (int i = 0; i < num; i++) {
      swap();
      sh.set("tex", src.pg);
      dst.render();
    }
  }
}
```

This uses two ShaderBuffers to represent the input and output buffers. Before the output is rendered, the references to these buffers are swapped; the previous step's output thus becomes the current step's input.

The process can be influenced by drawing on `dual_buffer.dst.pg` in between calls to `dual_buffer.passes()`, though you will likely have to reset the shader before doing anything interesting. Don't worry about cleaning up after yourself - `ShaderBuffer` re-sets the shader for you.

## Example: Reaction-Diffusion

Let's take a practical example. [Here's](https://forum.processing.org/two/discussion/comment/99803/#Comment_99803) a post on the Processing forums about running [reaction-diffusion](https://en.wikipedia.org/wiki/Reaction%E2%80%93diffusion_system) simulations using the [Gray-Scott model](https://groups.csail.mit.edu/mac/projects/amorphous/GrayScott/). Let's borrow the fragment shaders from that post but rewrite the Processing script.

```processing
// rd.pde

PShader shader_grayscott;
PShader shader_render;
DualBuffer db;
ShaderBuffer sb;

void draw_initial_pattern(PGraphics pg) {
  pg.beginDraw();
  pg.resetShader();
  pg.background(0xFFFF0000);
  pg.fill(0x0000FFFF);
  pg.rectMode(CENTER);
  pg.rect(width/2, height/2, 20, 20);
  pg.endDraw();
}

void settings() {
  size(800, 800, P2D);
}

void setup() {
  frameRate(1000);

  shader_render = loadShader("render2.frag");
  shader_grayscott = loadShader("grayscott2.frag");
  shader_grayscott.set("dA", 1.0);
  shader_grayscott.set("dB", 0.5);
  shader_grayscott.set("feed", 0.55);
  shader_grayscott.set("kill", 0.62);
  shader_grayscott.set("dt", 1.0);

  db = new DualBuffer(shader_grayscott, width, height);
  db.initialize();
  sb = new ShaderBuffer(shader_render, width, height);
  sb.initialize();

  draw_initial_pattern(db.dst.pg);
}

void draw() {
  db.passes(100);
  shader_render.set("tex", db.dst.pg);
  sb.render();
  image(sb.pg, 0, 0);
}
```

This may look pretty bare-bones. That's intentional. The original core Processing script from that forum post is 114 lines; by using our helper classes, we've boiled it down to 43 lines. Pretty good! Here's a gif of this script in action:

# TODO

This gif starts over after about ten seconds; since reaction-diffusion systems are chaotic, the simulation could in theory go on practically forever without looping.[^2]

In the above script, note how the DualBuffer object is only ever used for off-screen simulation. Its contents are never drawn directly to screen; instead, they are run through another shader (encapsulated in our ShaderBuffer).

This opens up interesting possibilities: for instance, if we wanted to improve performance (maybe to let us render to a huge screen or run more simulation steps per frame), we could reduce the size of the DualBuffer and add some logic to our render shader to handle interpolation.[^1] If for some reason we wanted to supersample the pattern, that would also be straightforward.

[^1]: GLSL provides some native options for interpolating between pixels, but they work per-component, which is no good for us because our Gray-Scott shader stores 16-bit data values in pairs of data channels. Interpolating these channels indepenently would mess up the encoding and break out simulation. It's not too hard, though, to adapt the render shader to sample some adjacent values, decode them, and interpolate the decoded values.


# Showing Secrets

This one's less of a Processing tip than a general Linux tip, but it took me ages to figure it out so I thought I might as well share it.

If you're using Processing as part of any sort of live set, you likely want to be able to see the same thing the audience sees. In fact, you likely want to see _more_ than they see.

When I was first developing this project, I just watched my own projections. This works great at home, but not on stage. How do you get the image onto both screens at once?

After a few false starts, I decided to just set up my projector and laptop screens to mirror each other (`xrandr --output <projector> --auto --same-as <laptop>`), with the same live images being shown on both. What I really wanted, though, was for the laptop screen (which is 2880x1620 - way higher res than my projector!) to show the projection _and more_. There's a whole ton of auxillary data (for instance, a readout of my MIDI controller state) that would be nice to have on hand.

Some context: I run i3 as my window manager. It's no-nonsense, gets out of the way, and doesn't look too bad if it accidentally gets projected in front of people. When two displays overlap, as in the setup I just described, i3 will helpfully resize itself to the smaller of the two. Fullscreened windows will only take up this space, filling the smaller screen but leaving any extra space on your larger screen completely unused. This is not ideal.

The solution, in i3, starts with making sure your `~/.config/i3/config` file has a line like:

```
bindsym $mod+shift+f fullscreen toggle global
```

Then, mod-shift-f will fullscreen a window across the _larger_ of the overlapping screens, not the smaller. This means that the smaller screen (in this case, the projector) will only display a section of this window.

Then, just align the top-left corners of the displays (as the `xrandr` command above should do), draw what you want to project inside the projection window, and fill in the space around it with whatever secrets you want.


# Shelling Out to Bash

One thing I found myself wanting as soon as I started putting the GPU to work was a section with readouts for (among other things) the GPU load level, its memory usage, and the laptop's current internal temperature. This helps me to immediately diagnose any performance issues and lets me know when I'm about to run up against hardware limitations.

After researching libraries for a while, I decided that I didn't feel good about pulling in any of the available options as a dependency. However, the info I was after is super easy to get on the command line: for the GPU there's `nvidia-smi -q`, and for temperature there's `sensors`.

Enter `bash_exec`:

```processing
// bash.pde

import java.io.BufferedReader;
import java.io.InputStreamReader;

StringList bash_exec(String cmd) {
  File workingDir = new File(sketchPath());
  StringList out = new StringList();
  String[] args = { "bash", "-c", cmd };
  try {
    Process p = Runtime.getRuntime().exec(args);
    int i = p.waitFor();
    if (i == 0) {
      // process exited cleanly, no error code
      // TODO can this block be tightened up?
      BufferedReader p_stdout = new BufferedReader(new InputStreamReader(p.getInputStream()));
      String s = p_stdout.readLine();
      while (s != null) {
        out.append(s);
        s = p_stdout.readLine();
      }
    } else {
      out.append("err: " + Integer.toString(i));
    }
  } catch (Exception e) {
    println("Error in bash_exec for cmd ", cmd);
    println();
    println(e);
    println();
    e.printStackTrace();
  }
  return out;
}
```

This silly little function encapsulates a lot of complexity in a very simple interface. Given this, we just need to fiddle around in Bash until we've got the right one-liners, and then getting regularly updated system stats is as easy as this:

```processing
// stats.pde

String gpu_util = "...";
String gpu_mem = "...";
String celsius = "...";

float update_interval = 500;  // ms
float next_update_at = 0;

void update_stats() {
  check_gpu();
  check_temp();
  next_update_at = millis() + update_interval;
}

void check_gpu() {
  StringList out = bash_exec("nvidia-smi -q | grep 'Utilization' -A 2 | tail -n 2 | cut -d':' -f2");
  int out_size = out.size();
  if (out_size == 0 || out_size > 2) {
    gpu_util = "big err";
    gpu_mem = "big err";
    return;
  }
  if (out_size == 1) {
    gpu_util = out.get(0);
    gpu_mem = gpu_util;
    return;
  }
  // out_size == 2
  gpu_util = String.format("%5s", out.get(0));
  gpu_mem = String.format("%6s", out.get(1));
}

void check_temp() {
  StringList out = bash_exec("sensors | grep 'Physical id 0' | cut -d' ' -f5");
  if (out.size() == 1) {
    celsius = out.get(0);
  } else {
    celsius = "err";
  }
}
```

Of course, during a live set we have a frame rate to maintain, so all of this should be done in the background. Luckily, Processing has by far the most convenient threading API of any major language. All we have to do is add this line somewhere in `draw`:

```processing
if (millis() > next_update_at) thread("update_stats");
```

...and then we're set! How cool is that?

Note that even though we're dealing with multiple threads, we don't need any locks or semaphores or any of that stuff: our threaded functions' only side effects are assignments, which are atomic and therefore threadsafe.


# That's all for now!

Peace!

<hr>
