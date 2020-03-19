---
layout: post
title: Vim
---


If you want to make an old nerd's day, ask them about the editor wars. I guarantee you they have strong opinions about Vim and Emacs, and I guarantee they remember a time (not too many years back, really) when people would actually listen to those opinions. THat time has, of course, passed, but a lot of nerds secretly miss it.

I hadn't seriously tried either editor until about five years ago, so I'm a newcomer to all this. I picked them up out of necessity -- if that's what we can agree to call deciding to work over SSH rather than spend all day on campus -- and, if we're being honest, I had a pretty rough start. I tried Emacs First and did not care for it. It was clearly powerful, and it was a clear predecessor to most of the more modern development environments I was used to at the time, but it felt like just that: a predecessor. I found myself wondering why I was installing plugins to make Emacs Feel more like its successors, rather than just using them instead. Eventually I got tired of it and decided to try out Vim.

To a degree, it turns out, Vim has the same problem. Out of the box, it lacks a lot of creature comforts that users of any modern IDE (VSCode, Sublime, Atom, Eclipse, you know the rest) would expect.

The difference between Emacs and Vim is that while designers have learned the lessons of Emacs well, they have largely failed to understand the lessons of Vim.

THat is not to say that Vim is impenetrable. Every major editor has a "vim mode" of some kind, so clearly some people want it (I know I do!). You can find Vim keybindings in all sorts of other weird places, too (two of my favorites: i3 and Twitter).

So what makes Vim so great? In a sentence: it recognizes that _code is edited more often than it is written_.[^1] As a corollary, an editor (like Vim) that focuses on _modifying_ text files, rather than just _expanding_ them, will meet the user's needs better than an editor that is centered around inserting text.

Vim capturse this insight through the concept of _modes_.

One of these is "insert mode", where Vim behaves as you'd expect any editor to: you type, and test appears at the cursor's location; hit backspace, and the character before the cursor is deleted; press an arrow key, and the cursor moves one notch in the direction you pressed. Some other motions are possible: Home and End to jump around on the current line, PgUp and PgDn to jump around on the screen, Delete to get rid of the character under the cursor. Of course, most poeople never use these because they're way off to the side of the keyboard - out of reach, out of mind.

If you hit Escape in insert mode, you're brought back to "command mode". Now, typing will no longer insert text; insetad, each key corresponds to some sort of _command_ that you can carry out.

# TODO SHOW OFF 'd' - DELETING DIFFERENT WORD OBJECTS (use asciinema)

<hr/>

[^1]: Last you think I came up with this line, I have to admit that it's just a riff on one of Python's famous guru meditations handed down by Guido: that _readability counts_ because _code is read more often than it is written_. The same core principle is at play in both cases: that only a small part of the time we spend interacting with source code is spent inserting wholly new code into it. Much more time is spent reading, re-reading, understanding, and modifying existing code.
