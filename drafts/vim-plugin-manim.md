---
layout: post
title: Writing a Vim Plugin for Manim in Python
---


If you know me, you know I love Vim. But this love is not pure: it is
inextricable from -- and perhaps even surpassed by -- my fear of
Vimscript. Vimscript is terrifying. It is the PHP of plugin languages. If
you don't believe me, check out Learn Vimscript the Hard Way, and let me
know how far you get.

> Vimscript is extremely powerful, but has grown organically over the
> years into a twisty maze ready to ensnare unwary programmers who enter
> it.

-[_Learn Vimscript the Hard Way_](https://learnvimscriptthehardway.stevelosh.com)

This is why I never even tried writing Vim plugins - until earlier this
year, when I learned to write them in Python. This is _much_ easier, and
allows us to avoid (most of) the weirdest parts of Vimscript entirely.

Using this technique, I recently wrote a Vim plugin for Manim,
a math-visualization library that I've been working with a lot lately. The
entire plugin, which adds a nontrivial feature to Vim and makes it
competitive with Jupyter as a Manim development environment, weighs in at
only 41 lines of Vimscript and 49 lines of Python - less than one screen
of code in all. This makes it a great little case study for plugin
writing, so here's a quick tutorial on how to design and build it from
scratch.

# Motivation: Manim

[Manim](https://www.manim.community) is a library for creating
mathematical animations. You see it on YouTube a lot on channels like
3blue1brown (in fact, that's who wrote the original version of it).

There are two ways people typically use Manim. The more basic option is to
run it from the command line. That looks something like this:

``` TKTK TODO ```

To see the result, check out the [Manim Quickstart
guide](https://docs.manim.community/en/stable/tutorials/quickstart.html).

The second method is to use Jupyter notebooks. This is much more
convenient for iteratively roughing out an animation. You can kick off
renders by evaluating cells, and the resulting videos are embedded back
into in the notebook. To see what this looks like, check out
[try.manim.community](https://try.manim.community).

Let me be clear: this is sick. It works great. But Jupyter's editor is
basically Notepad with syntax highlighting, and I'd prefer to write my
code in Vim.

Also, the ergonomics of Jupyter notebooks encourage long-lived interpreter
sessions, and there are a handful of cases where that's inconvenient, in
particular when you're making lots of incremental changes to a library
imported by your notebook. In contrast, the command-line method starts up
a fresh interpreter - with fresh imports - for each render job.

So, all that is to say...


# Goals

Here's the goal: to write a Vim plugin that lets us render and view Manim
animations without leaving the editor.

We also have some supporting goals:
* Write as little Vimscript as possible (it is evil)
* Lean on Python as much as possible
* Keep the design lightweight, and make it easy to use and modify
* Require little-to-no configuration

We've already motivated the first couple of goals; the others should speak
for themselves.

# Design

Here's what the plugin's directory tree will look like:

```
.
├── doc
├── plugin
│   └── vanim.vim
├── python
│   └── vanim.py
└── README.md
```

The doc folder is empty because I haven't learned how to write docs yet.
I'm still pretty new to this.

Note that there is only one vimscript file, `plugin/vanim.vim`. This is
our entry point, and it only has a handful of responsibilities:

* Check for error conditions
  * Exit if plugin is disabled
  * Exit if plugin has already been loaded
  * Exit if python3 isn't available
* Set up Python environment
  * Expand `../python/` into a full path, and add it to `pythonpath`
  * Import Python plugin code
  * Instantiate main plugin class
* Bind plugin's Vim commands to Python methods
* Set flag indicating plugin has been loaded

There is also only one Python file, `python/vanim.py`. It is responsible
for providing the plugin's actual core logic. For this plugin, we need it
to know how to do two things:

* Figure out which Python class the Vim cursor is currently inside, if any
* Run manim to render the focused class, if it is a Scene, and preview the result

# UX

The command line `manim` invocation, once you run it, provides some nice
terminal graphics with animated progress bars and so on. What do we do
with these?

We could disable them, but that's no fun. We could background Vim to run
them in the terminal, but that means we can't edit while the render is
running. We could try proxying them into a Vim scratch buffer, but that
might mess up our split layout, and doing this async is nontrivial.

The least-worst solution, to me, is to run `manim` in a pop-up terminal
window. This has pretty good ergonomics in i3 with tabbed layout, and
I bet it's usable under Gnome or KDE or whatever too.

This terminal might show an error message (if the render fails) or spawn
a video player (if it succeeds). Both will disappear if their popup window
closes, so the terminal must always stay open for as long as the user
needs.

Before writing code to spawn these popup terminals, let's figure out how
to spawn one manually.

* First step: Spawn a terminal from Vim without locking it up
  * Google gives us <https://unix.stackexchange.com/questions/163201/in-vim-how-do-you-run-a-command-silently-in-the-background>
  * With a little fiddling, we arrive at `:execute 'silent !gnome-terminal -q &' | redraw!
  * Why does this work? What's with that `redraw!`? I don't know :)
    but you need it :) and may god have mercy on your soul if you leave it out
  * Issue: Default working directory is wrong
    * We can pass `--working-directory=...` to fix this if we know cwd
* Second step: Run manim in the terminal
  * `:execute 'silent !gnome-terminal --working-directory=/home/eli/workspace/manim_cryptopals -q -- manim -pqh test.py TestScene --flush_cache ' | redraw!`
* Third step: Keep the window from closing right away
  * `:execute 'silent !gnome-terminal --working-directory=/home/eli/workspace/manim_cryptopals -q -- manim -pqh test.py TestScene --flush_cache; echo \"Press Enter to close this window.\"; read' | redraw!` TKTK check this against script
  * This is not pretty - but it works!

To assemble a command like this last one programmatically, we need a CWD,
a filename, and a Scene class name. The first two of these values are known to
Vim a priori; the third can be worked out with some fancy Python.


# Vimscript

But before we write Python, we have to write Vimscript. The following is mostly
boilerplate - change a few variable names and it can be reused between plugins.

```vimscript
TKTK everything up to command bindings, plus plugin_loaded flag
```

The embedded Python script brings `../python/` into pythonpath and imports
a class from it, then instantiates and binds that class. I recommend
encapsulating the plugin within a class, to avoid polluting Vim's top-level
Python namespace. Plus, if other poorly-written plugins _do_ pollute the
top-level namespace, you're less likely to be impacted by that.

# Python

Now that we have an entry point into Python, and we can switch to writing
Python code. In Python, Vim exposes its integration through the auto-imported
`vim` library; for details on this, see `:help python`.

Let's start with finding the CWD, filename, and cursor location. Scanning
`:help python`, we find `vim.current.buffer`, which sounds promising.

Indeed, the full file path turns out to be available under the attribute
`buffer.name`, which we can split to get cwd and filename. We can also read the
buffer.

Given the buffer's contents, we could run a regex backwards to scan for the
first top-level class above the cursor. This is e.g. what Vim's `[[` command
does in Python files, and it is probably the fastest way of finding the current
class. However, it relies on parsing code with regexes, which I cannot do in
good conscience.

In my projects, we do things properly, and that means parsing code with
`ast.parse`. Incredibly, not only does this work, it's pretty easy:

```python3
TKTK entire python script
```

View the full `vanim.py` script [here](TKTK).

# Bindings

Ultimately, keybindings are left up to the user, but the user should not have
to know that we're using Python. This means our plugin should expose its
top-level functionality as Vim commands, which will be bound to Python commands
behind the scenes. We do this with `command!`, like so:

```vimscript
vanim bindings to python
```

View the full `vanim.vim` script [here](TKTK).

Note the -nargs=? flag; this allows a single _optional_ argument to be passed.
If no argument is passed, `<args>` is replaced with an empty string (which
luckily is still valid syntax in Python, even with the hanging comma). This is
convenient, but of course by no means necessary; if the flag is not given
explicitly, the default is `-nargs=0`.

The final step, of course, is to bind these commands to vim keymappings. This,
of course, is up to the user, and reflect the subset of plugin functionality
that you care about; as an example, here's what's in my `.vimrc`:

```vimscript
nnoremap <leader>rl :VanimRenderL<CR>
nnoremap <leader>rm :VanimRenderM<CR>
nnoremap <leader>rh :VanimRenderH<CR>
nnoremap <leader>rk :VanimRenderK<CR>
nnoremap <leader>ra :VanimRenderAll("h")<CR>
nnoremap <leader>rak :VanimRenderAll("k")<CR>
```

# Closing notes

The code you just saw is the entire plugin. It's that easy.

If you want to build something more complicated, you can refactor your Python
script into multiple scripts, as long as you put them all under `./python/`.

I recommend reading `:help python` from start to finish to get an idea of what
can be done easily from Python. Python can also easily do anything that is easy
in Vimscript, through `TKTK vim.execute() or something`.

You can find the finished plugin at [TKTK] and install it as described in [TKTK README.md].

Shoutout to [TKTK OTHER BLOG POST], which is what got me off the ground with this project
