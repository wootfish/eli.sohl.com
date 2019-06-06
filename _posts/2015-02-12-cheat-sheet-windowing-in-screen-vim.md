---
layout: post
title: 'Cheat Sheet: Windowing in Screen & Vim'
---

As a lazy computer science student, I find myself working on  programs over SSH a lot. This tends to pose some challenges. Unless  you want to mess around with -X and -Y flags, all you get is one  terminal to do all your work in. Having to work in this environment has  taught me one lesson: When all you have is a terminal, everything looks  like a window manager. Or something. Anyway. There are lots of ways to split up a terminal session, and this post covers some common commands involved.


My current modus operandi involves using GNU screen for terminal multiplexing so I can juggle an editor, man pages, a terminal, etc, and share the display between these. I'm using Vim for editing because -- well -- ok -- let's not get started there, and I'm using Emacs every now and then to play Tetris. This works well, but it involves a whole lot of hotkeys, and since I'm still new to this it's not all that easy for me to remember every single one. This little post is the reference I keep wishing I had. It covers all the commands for each of these programs relevant to the task at hand.


<br/>
# screen

`screen` prefixes all its commands with Ctrl-a to distinguish them from commands within any of its windows. This is written below as C-a. If you want to actually send C-a to a window _within_ `screen`, use C-a a.

Screen also uses some possibly confusing nomenclature: the window-like areas displayed onscreen are called "regions", and the term "window" is reserved for the actual terminal sessions which a region may display. You can have no more than one window showing in any region, but you can have multiple regions showing the same window.

<span style="font-size: small;"><br />
</span> <br />
<center><table border="1" cellpadding="4" cellspacing="0" style="width: 75%px;"><tbody><tr><th>Action</th><th>Command</th></tr><tr><td>Begin session</td><td><span style="font-family: &quot;Courier New&quot;,Courier,monospace;">screen [-S &lt;session name&gt;]</span></td></tr><tr><td>End session</td><td><span style="font-family: &quot;Courier New&quot;,Courier,monospace;">C-a \</span></td></tr><tr><td>create a horizontal split</td><td><span style="font-family: &quot;Courier New&quot;,Courier,monospace;">C-a S</span></td></tr><tr><td>create a vertical split</td><td><span style="font-family: &quot;Courier New&quot;,Courier,monospace;">C-a |</span></td></tr><tr><td>close current region</td><td><span style="font-family: &quot;Courier New&quot;,Courier,monospace;">C-a X</span></td></tr><tr><td>close all regions except current</td><td><span style="font-family: &quot;Courier New&quot;,Courier,monospace;">C-a Q</span></td></tr><tr><td>switch focus to next region</td><td><span style="font-family: &quot;Courier New&quot;,Courier,monospace;">C-a &lt;tab&gt;</span></td></tr><tr><td>switch window displayed in region</td><td><span style="font-family: &quot;Courier New&quot;,Courier,monospace;">C-a C-a</span></td></tr><tr><td>choose window to display from menu</td><td><span style="font-family: &quot;Courier New&quot;,Courier,monospace;">C-a "</span></td></tr><tr><td>create and display a new terminal</td><td><span style="font-family: &quot;Courier New&quot;,Courier,monospace;">C-a c</span></td></tr><tr><td>shift current region's right border</td><td><span style="font-family: &quot;Courier New&quot;,Courier,monospace;">C-a :resize -h [+n|-n]</span></td></tr><tr><td>shift current region's bottom border</td><td><span style="font-family: &quot;Courier New&quot;,Courier,monospace;">C-a :resize -v [+n|-n]</span></td></tr><tr><td></td><td><i>Note: -h and -v may be omitted if only horizontal or only vertical splits are in use.</i></td></tr></tbody></table></center><span style="font-size: small;"><i></i></span><br />
<span style="font-size: small;"><i></i></span><br />
<span style="font-size: small;"><i></i></span><br />
<span style="font-size: small;"><i><br />
</i></span><span style="font-size: small;"><i><br />
</i></span><br />


<br/>
# vim

Vim, unlike screen, uses the completely reasonable convention of referring to regions on screen as windows, and to the things windows display as buffers. This convention is followed below.


<center><table border="1" cellpadding="4" cellspacing="0" style="width: 75%px;"><tbody><tr><th>Action</th><th>Command</th></tr><tr><td>create horizontal split</td><td><span style="font-family: &quot;Courier New&quot;,Courier,monospace;">:sp</span></td></tr><tr><td>create vertical split</td><td><span style="font-family: &quot;Courier New&quot;,Courier,monospace;">:vsp</span></td></tr><tr><td>change height of window by n</td><td><span style="font-family: &quot;Courier New&quot;,Courier,monospace;">:res [+n|-n]</span></td></tr><tr><td>change width of window by n</td><td><span style="font-family: &quot;Courier New&quot;,Courier,monospace;">:vert res [+n|-n]</span></td></tr><tr><td>move cursor to adjacent window<br />
(in normal mode) </td><td><br />
<span style="font-family: &quot;Courier New&quot;,Courier,monospace;">C-w [h|j|k|l]</span></td></tr><tr><td>open file buffer in window</td><td><span style="font-family: &quot;Courier New&quot;,Courier,monospace;">:e &lt;file&gt;</span></td></tr><tr><td>select file to open from interactive menu</td><td><span style="font-family: &quot;Courier New&quot;,Courier,monospace;">:E</span></td></tr></tbody></table></center><span style="font-size: small;"><br />
</span><span style="font-size: small;"><br />
</span><span style="font-size: small;"><br />
</span><span style="font-size: small;"><br />
</span><br />

<br/>
# Emacs

_Note:_ You'll want your `~/.emacs` file to contain the following line:

    (setq initial-major-mode 'tetris)


<center><table border="1" cellpadding="4" cellspacing="0" style="width: 75%px;"><tbody><tr><th>Action</th><th>Command</th></tr><tr><td>Start Tetris</td><td>emacs</td></tr><tr><td>Exit Tetris</td><td>C-x C-c</td></tr></tbody></table><div style="text-align: left;"></div><div style="text-align: left;"><br /></div></center>

Here's hoping you find this as useful as I do!&nbsp;:-)
