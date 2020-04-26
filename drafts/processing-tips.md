---
layout: post
title: "Grab Bag: Processing Tips & Tricks"
---

I've been using Processing for one of my recent projects (a framework for
MIDI-controlled live concert visuals). This codebase currently weighs in at
about 6500 lines of Processing and GLSL. I thought it might be fun to collect
some of the useful patterns I've learned - so here they are.

<!--
One of my favorite things about Processing is how easy it makes it to work with GLSL shaders. These, if you don't know, are little [C-like](https://www.khronos.org/opengl/wiki/Core_Language_(GLSL)) programs that run natively on your GPU. Because they run on the GPU, they can be _massively_ parallel. You can do things like write a program to render a single pixel, and run it for every pixel on your screen at the same time. You can also do parallel data processing, which is super useful: this lets you write fast implementations for things like particle effects or reaction-diffusion effects. I'll show you toy examples for all three of those use cases.

The Processing site has a great tutorial on shaders. You can find it [here](https://processing.org/tutorials/pshader/).

This tutorial shows you how to texture 3D shapes, how to do fancy vertex manipulations, etc. I mostly use shaders for a simpler purpose: drawing cool patterns on fullscreen rects.
-->


# Shader Rendering

Let's say you just got done reading [The Book of Shaders](https://thebookofshaders.com/)
(or maybe it was Processing.org's [shader tutorial](https://processing.org/tutorials/pshader/))
and you want to try out what you've learned.

There are endless uses for shaders, but I find myself mainly using them for two
purposes: to modify a scene, or to draw a scene from scratch.

For the latter case, the simplest way to render a shader is this: draw a
rectangle over the entire screen and use the shader to texture it. This will
result in the GPU evaluating the shader once for each pixel in the draw area and
saving the results.

You can do this on screen or in an offscreen buffer; usually I find it more
convenient to do these renders offscreen, because that pattern composes more
easily.

## ShaderBuffer

This is a utility class for rendering a shader in an offscreen buffer. It's
nothing revolutionary, but it takes care of a lot of boilerplate. I use this all
the time.

The constructor takes a `PShader`, a width, and a height. It sets up an
offscreen buffer of the given size, and it provides a `render()` method for
running the shader on the full buffer. You can access the result through the
`pg` attribute (short for `PGraphics`).

```java
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
    pg.blendMode(REPLACE);  // no blending (in case we want to store data in the alpha channel)
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

Nothing groundbreaking, but it helps cut down on boilerplate, and it works well
as a component in more interesting systems, as I'll show you in the next
section.

## DualBuffer

One common technique is to feed a shader's output back in to itself. This opens
the door to all kinds of trippy effects. It's also useful for running
simulations on the GPU: if you can represent a simulation's internal state in a
pixel buffer, you can iterate on it with this pattern.

The simplest way to feed a shader to itself is this: Create two buffers;
alternate between which one you render to; on each step, set the unused buffer
as a shader input.

Here's a class which encapsulates this pattern. Again, it takes a `PShader`, a
width, and a height.

```java
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

This uses two ShaderBuffers to represent the input and output buffers. Before
the output is rendered, the references to these buffers are swapped; the
previous step's output thus becomes the current step's input.

The process can be influenced by drawing on `dual_buffer.dst.pg` in between
calls to `dual_buffer.passes()` (though you will have to reset the shader before
doing anything interesting). Don't worry about cleaning up after yourself -
`ShaderBuffer` re-sets the shader for you.

## Example: Reaction-Diffusion

Let's run through a practical example. [Here's](https://forum.processing.org/two/discussion/comment/99803/#Comment_99803)
a post on the Processing forums about running [reaction-diffusion](https://en.wikipedia.org/wiki/Reaction%E2%80%93diffusion_system)
simulations using the [Gray-Scott model](https://groups.csail.mit.edu/mac/projects/amorphous/GrayScott/).
Let's borrow the fragment shaders from that post but rewrite the Processing
script to use the classes we just defined.

```java
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

This may look pretty minimal. That is intentional. The original core Processing
script from that forum post is 114 lines; by using our helper classes, we've
boiled it down to 43 lines. Not bad!

Here's a gif of this script in action:

# TODO

This gif starts over after about thirty seconds; since reaction-diffusion
systems are chaotic, the simulation could in theory go on practically forever
without looping.

In the above script, note how the DualBuffer object is only ever used for
off-screen simulation. Its contents are never drawn directly to screen. Instead,
they are fed to a dedicated render shader which is drawn to a separate buffer,
then that buffer is drawn to the screen.

This opens up interesting possibilities: for instance, if we wanted to improve
performance (to let us render to a huge screen, say, or to run more simulation
steps per frame), we could reduce the size of the DualBuffer and add some logic
to our render shader to handle interpolation.[^1] If for some reason we wanted
to supersample the pattern, that would also be straightforward.

[^1]: GLSL provides some native options for interpolating between pixels, but they work per-component, which is no good for us because our Gray-Scott shader stores 16-bit data values in pairs of data channels. Interpolating these channels indepenently would mess up the encoding and break our simulation. It's not too hard, though, to adapt the render shader to sample some adjacent values, decode them, and interpolate the decoded values.

Technically we could draw `shader_render` to screen rather than to an offscreen
buffer, but by writing things this way we've traded some minor overhead for the
privilege of keeping all the details of shader rendering (setting a shader,
setting the rectangle mode, possibly calling `noStroke` and `fill(255)`, drawing
a rectangle, possibly cleaning up after if we have any other drawing to do) out
of our main script completely. In most cases I think this trade is worth making.

Plus, if we ever want to do any post-processing on this rendered image, it's
easy to compose the current rendering pipeline with a new `ShaderBuffer` which
takes `sb`'s output as an input.

# Keeping Secrets

This one's less of a Processing tip than a general Linux tip, but it literally
took me months to figure this out so I thought I might as well share it.

If you're using Processing as part of any sort of live set, you likely want to
be able to see a superset of what the audience sees. That is, you'll want to see
whatever they see and possibly more.

When I was first developing this project, I just watched my own projections.
This works great at home, but not on stage.

After a few false starts, my next step was to just set up my projector and
laptop screens to mirror each other (`xrandr --output <projector> --auto
--same-as <laptop>`), with the same live images being shown on both.

What I really wanted, though, was for the laptop screen (which is 2880x1620 -
way higher-res than my projector!) to show the projection, plus a ton of
auxiliary data that would be nice to have on hand (e.g. full MIDI controller
state readouts).

Some context: I run i3 as my window manager. It's no-nonsense, gets out of the
way, and isn't too jarring if it ever shows up in the projection.

In i3, when two displays overlap (as in the setup I just described), i3 will
helpfully resize itself to the size of the smaller display. Fullscreened windows
will only take up this space, filling the smaller screen but leaving any extra
space on your larger screen completely unused.

This is not ideal.

The solution, in i3, starts with adding to your `~/.config/i3/config` file a
line like:

```
bindsym $mod+shift+f fullscreen toggle global
```

Then, mod-shift-f will fullscreen a window across the _larger_ of the
overlapping screens, not the smaller. This means that the smaller screen (in
this case, the projector) will only be able to show part of this window.

Then, just arrange displays to line up their top-left corners (as before), draw
what you want to project inside the projection window, and fill in the extra
space with whatever secrets you want.

# Shelling Out to Bash

As soon as I started putting the GPU to work, I found myself wishing I had some
heads-up stats available to see how hard I was pushing my hardware.

I wanted to be able to monitor (at a minimum) the GPU load level, GPU memory
usage, and the laptop's internal temperature. This helps with immediately
diagnosing any performance issues, and it lets me know when I'm about to run up
against hardware limitations.

After researching libraries for a while, I decided that I didn't feel good about
pulling in any of the available options as a dependency. However, the info I was
after is super easy to get on the command line: for the GPU there's `nvidia-smi
-q`, and for temperature there's `sensors`.

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

This silly little function encapsulates a lot of complexity in a very simple
interface. Given this, we just need to fiddle around in Bash until we've got the
right one-liners, and then getting regularly updated system stats is as easy as
this:

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

Of course, we have a frame rate to maintain, so all of this should be done in
the background. Luckily, Processing has by far the most convenient threading API
of any major language. All we have to do is add this line somewhere in `draw`:

```processing
if (millis() > next_update_at) thread("update_stats");
```

...and then we're set! How cool is that?

# TODO: rewrite this to just spawn a single thread on setup and persist it with `while (true) {}`

Note that even though we're dealing with multiple threads, we don't need any
locks or semaphores or any of that nonsense: our threaded functions' only side
effects are assignments, which are atomic and therefore threadsafe. As long as
all that we do from our stats thread is update the values of `String` variables,
we don't have to worry about concurrency issues at all.

# That's all for now!

Peace!

<hr>
