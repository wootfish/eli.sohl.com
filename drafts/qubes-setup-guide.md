---
layout: post
title: How to Install Qubes and Get It Set Up Just Right
---

Qubes has been my daily driver OS on personal laptops since 2015. In that time, I've found some nice little tricks and customizations. This post is, from start to finish, what I do to install Qubes from scratch and get it set up just how I like it. If you're thinking of giving Qubes and i3 a try, maybe this will help.

Here's a quick overview of the main points.

* ThinkPad with up-to-date firmware

* Stable release

* i3 window manager

  * Movement rebound from `jkl;` to `hjkl`

  * Temperature monitor in status bar

  * Tailored app lists for each AppVM and DispVM

  * Shortcuts for common xrandr commands

* Automatic shutdown for idle qubes

* USB keyboard support

* Custom VM suggestions: `dev`, `vpn`, `dvm-web`, ...

* Per-VM custom browser homepages

* Split GPG, `dev-gpg` VM

* Bugfixes in `sys-net` (if needed)

* Anti-Evil Maid protections (if needed)

# Hardware

Qubes works well on both desktops and laptops. Good laptop support has always been one of their main goals.

You'll want at least 8G of RAM (I've run Qubes on boxes with 4G and it was usable, but just barely - not recommended). You'll want an SSD. If you plan on keeping on-device backups, you'll want a big SSD. Everything else is negotiable.

If you have a specific device in mind, make sure to check for it in the [Qubes Hardware Compatibility List](https://www.qubes-os.org/hcl/). That page can also serve as a buying guide.

My personal preference is for used or refurbished ThinkPads. The prices are great, the laptops are tough, and you almost never need to worry about Linux support because nerds fucking love these things. See if you can buy locally (if you're in the Seattle area, [InterConnection](https://interconnection.org/) is great); you can also find refurb hardware for good prices online. Of course, used hardware may be less attractive depending on your threat model; in that case, maybe it's worth buying something new off-the-shelf.

You'll need a USB drive to write the installer to. I like to get a new drive for each install, just so I know where it has(n't) been. Of course, buying new hardware is not a guarantee against tampering at the factory level, which is an established practice for certain threat actors.

# Firmware

First off, make sure your laptop's firmware is up to date. This isn't strictly _necessary_, but it is a good idea, especially with older ThinkPads. It'll be easiest to do this now, before you've installed AEM.

Be careful here. The usual warnings apply: make sure your laptop has a full charge and stays plugged in from start to finish. You do not want anything to go wrong here, or else your system might end up failing into an unrecoverable state.

# Getting an image

I'm going to go ahead and assume you're running Linux.

From a trusted device (or the closest thing you can find to one), get the latest release from here:

[https://www.qubes-os.org/downloads/](https://www.qubes-os.org/downloads/)

Just use the latest stable release. As of time of writing, that's `R4.0.4`.

You can torrent the image or download it directly over https. Torrenting will be much faster. A web download can be carried out over Tor, though, so for some users that option may be preferable. This has more to do with hiding your use of Qubes than getting an unaltered ISO, since both options include integrity checks (and you'll be validating the download's integrity manually anyway). Of course, if you really care about hiding your use of Qubes, you'll have to run all your updates through Tor as well, so only commit to this if you really, really need to - otherwise, you'll just be adding a bunch of overhead for no reason.

Once your download finishes, validate it by following the steps described here:

[https://www.qubes-os.org/security/verifying-signatures/](https://www.qubes-os.org/security/verifying-signatures/)

You really should go through the above process. It's easier than it looks. But if you're currently rolling your eyes and thinking "we both know that's not going to happen" then, at the absolute minimum, run a checksum on your local image. If you downloaded `R4.0.4`, you should see the following:

```
$ sha256sum Qubes-R4.0.4-x86_64.iso
1d05dbd247d6ea5588879570b74cfb1f8df97e135dbec8714924cc03e8d137b9  Qubes-R4.0.4-x86_64.iso
```

That value can also be found here:

[https://mirrors.edge.kernel.org/qubes/iso/Qubes-R4.0.4-x86_64.iso.DIGESTS](https://mirrors.edge.kernel.org/qubes/iso/Qubes-R4.0.4-x86_64.iso.DIGESTS)

You might be thinking that all this checking is redundant: HTTPS downloads should protect download integrity, and if you download a torrent file or magnet link over HTTPS then a comparable level of trust can be placed in the torrent's integrity check. You're right. However, these extra measures provide defense in depth, and there are some convoluted scenarios where they could actually come in handy - but this is not the place to go into that.

Now it's time to do the usual ISO dance. Insert your USB drive. Use something like `sudo dmesg` or `lsblk` to see what name the drive showed up under in `/dev`. It will likely be something like `/dev/sdc`. Ignore any partitions (e.g. `/dev/sdc1`).

Write the image to the drive: something like `sudo dd if=Qubes-R4.x.x-x86_64.iso of=/dev/sdx bs=4M status=progress`, with the `x`es replaced as appropriate. Note the use of `status=progress`; it's optional, but I find it to be absolutely essential to maintaining my patience during long write jobs.

When `dd` completes, you can pull the drive, plug it into the box you're putting Qubes on, and boot from USB.

# Installation

The installer does a fine job of guiding you through this process. There's not much you need to do.

You don't _need_ to set a time zone, but you probably want to. They have a big map for you to click on. It's fun.

You'll have to set a disk encryption passphrase. I really do encourage you to use a pass-_phrase_ - The longer the better. AEM and a good disk passphrase are your first lines of defense against some realistic attacks. I would never take a laptop into even a mildly risky environment without first making sure both of these protections are in place.

Here's my passphrase advice:

* Start with something that will be easy for you to remember (like, say, a quote, as long as it's not too generic)

* Modify the phrasing in some way. For example:

  * Change some verb tenses

  * Swap out a word or two for less-common synonyms

  * Switch to a different quote partway through, or just use two full ones in series

* Maybe throw in some contractions (e.g. _your_ to _yr_ - or to be extra spicy, go in the opposite direction, e.g. _yoouuur_)

* Pepper in some special characters (e.g. space to underscore, _s_ to _5_, `l` to `|` or `1`)

Don't go too overboard with the special characters - you do still need to remember this, and the more passphrases you have, the harder that'll get. Bear in mind that if you're doing character substitutions, just a few go a long way. The usual [correct horse battery staple](https://xkcd.com/936/) advice applies -- though the overall entropy will be lower if you're using a phrase that might appear in, say, your chat logs or a list of famous quotes (hence the suggestion to adjust the phrasing).

Once you've picked a passphrase, practice typing it in many times. There are two password boxes, so you can switch between typing it into the first and second box over and over, and it'll tell you if you got it right each time. Practice typing it in correctly ten times in a row, then get up, get some water, check some blogs, come back in five or ten minutes, and practice it again. I cannot tell you how many times I've come up with a brilliant passphrase and completely blanked on it the next day; you want to make sure this doesn't happen to you.

Once you kick off the install process, it'll also ask you to choose a username and password for your root user. This is mostly just a physical security measure, since (due to Qubes's [passwordless sudo](https://www.qubes-os.org/doc/vm-sudo/)) the user password is mostly just used for logging in or unlocking the screen; even so, I encourage you to use a strong passphrase here.

Something to bear in mind: You will be typing in your login passphrase much more often than your disk encryption passphrase, and you are more likely to have to type the login passphrase in public. Of the two, the login passphrase is much more likely to eventually be caught by surveillance. For these and other reasons, I encourage you not to reuse passphrases. It's not so hard to come up with three distinct ones, and that's all you really need: one each for disk encryption, user login, and your password manager. The password manager can take care of remembering everything else for you.

Also, on the subject of passphrases and cameras: When I type in passwords, I've made a habit of tilting my laptop screen forward to partially cover my fingers as I type; I encourage you to do the same. This is not a bulletproof solution (it turns out a lot can be inferred [from shoulder movement alone](https://arxiv.org/pdf/2010.12078.pdf)) but it raises the attack's difficulty level non-negligibly.

After installation finishes, the installer will prompt you to reboot. After reboot you'll be prompted for post-install configuration. The default settings are fine here. In particular, you really want a USB qube. If you opt for updates over Tor, bear in mind that they will be slow. They also (as mentioned above) aren't really necessary unless trying to hide the fact that you're using Qubes from your ISP and their associates, but don't mind them seeing you regularly connect to Tor.

# First Backups

After login, before doing anything else, update all your Qubes templates, including those with "no known available updates". Then reboot (since you probably updated dom0) and try to update again.

Once you're sure everything's up to date, make a full system backup. If you ever want to "factory reset" a qube (e.g. after plugging in a dubious USB device), these backups will let you do that.

# Configuration

Now we're getting to the good stuff. The base Qubes install is usable, but over the years I've found a lot of tweaks that I think make it much nicer.

## i3

Once you get used to a tiling window manager, you'll never want to go back. I've tried a few and, to me, i3 is easily the standout.

Install in dom0 with `sudo qubes-dom0-update i3 i3-settings-qubes`. That second package sets a bunch of nice, Qubes-specific default settings for i3. You want it.

Once i3 is installed, log out, then log in with i3. This will prompt you to create a config, which mostly involves picking a modifier key. You probably want to use Win rather than Alt: lots of apps have their own Alt chords, but they tend to leave Win chords to the window manager.

### Key bindings

i3 _almost_ comes with Vim keybindings, but they do something weird: they wanted to use `h` to mean "horizontal split", so they moved the movement keys from `hjkl` to `jkl;`. I do not like this. I suggest shifting all five of these keys back over to the left: first, map horizontal split to `g` instead of `h`, then shift the movement keys back to where they belong.

To do this, open dom0's `~/.config/i3/config` file. Here are the sections you'll want to make changes in:

* "# change focus"
* "# move focused window"
* "# split in horizontal orientation"
* "# resize window"

<!--
TKTK THIS NO LONGER APPLIES IN LATEST i3config (how is locking handled now?)
This is also where you can change how fast the screen locks. In the `# Use a screen locker` section, change `-time 3` from `3` to however many minutes you want to wait before locking. Bear in mind that you can always lock your screen manually with `i3lock`, and the less often your screen auto-locks while the laptop is in use, the less often you have to type in (and potentially be seen typing in) your user password, so I think it's reasonable to set this value fairly high as long as you're diligent about manual screen-locking.
-->

You can also add a key binding for locking the screen, which will save you a lot of time. Add a line like this in the config file's top-level scope:

```
bindsym Ctrl+Shift+l exec i3lock -f -c 420420
```

`-f` is optional and shows failed login attempts.

`-c` specifies color. Of course, you can specify any color you want - you'll find that `420420` is a dark, pleasing shade of maroon or burgundy. You can also provide e.g. `AAAAAA` for a gray background, if you prefer a more drab aesthetic.

However, this is not just an aesthetic consideration: if you have multiple laptops with i3 on them, you should set their lock screens to different colors; this will make it easier to avoid accidentally typing your credentials into the wrong system. This especially applies if the devices look similar (e.g. if you followed my advice regarding ThinkPads).

After making these changes and saving the config, restart i3 in-place with `mod+shift+r`.

### Temperature

I like to add a CPU temperature readout to the bar at the bottom. This works a little differently than it would in stock i3, because of Qubes' custom config.

In a dom0 terminal, run `sensors` and play with piping and cutting the output until it gives you a single value like `+49∘C`. Your final command might look something like `sensors | grep CPU | cut -d' ' -f11`.

Now, in a dom0 terminal, open `/usr/bin/qubes-i3status` as root. Add a new function, `status_cputemp()`, that looks something like this:

```
status_cputemp() {
    local cputemp=$(sensors | grep 'CPU' | cut -d' ' -f11)
    json cputemp "T:$cputemp"
}
```

You may need to adjust the inner commands depending on what `sensors` returns on your system. Try it out on the command line before saving your changes.

Next, add a line like `local cputemp=$(status_cputemp)` in `main`'s innermost block and include the result to the final echo: `echo ",[$cputemp$qubes$disk$bat$load$time]"`. Then restart i3 and check the bottom of the screen to see if it worked.

### Unicode on the Status Bar

You can free up space on your status bar by replacing text with unicode glyphs. This is totally a matter of personal taste, but I like how it looks. In Vim, when you're in insert mode, you can type in Unicode characters easily: Ctrl-V, then u or U (for a 4- or 8-digit code), then the symbol's hex code. Here are some symbols to try:

* 📆 U0001f6c6
* ⌚ u231a
* 💻 U0001f4bb
* 🐏 U0001f40f
* ⚡ u26a1
* 📡 U0001f4e1
* 🌡 U0001f321
* 🥵 U0001f975

In a default Qubes install, the status bar's font (which, confusingly, is set in `~/.config/i3/status` rather than in `i3status`'s config) is `font pango:monospace 8`. If you're having trouble with unicode support in the status bar, changing the font might help. You might consider `font pango:DejaVu Sans mono 9` or (my current favorite, but more of an acquired taste) `font pango:Terminus 9`, although this also requires the `terminus-fonts-legacy-x11` package in dom0.

### Starting Apps

Note that you can now start dom0 applications by name from dmenu (e.g. `mod+d Qube Manager`), and you can start AppVM applications by prefixing the VM name (e.g. "mod+d personal: Firefox"). If you open a terminal on a blank workspace, it will be a dom0 terminal; if any window is focused, the terminal is opened in the same VM where that window is running.

Qubes' native xfce environment is fine, and it does a better job of surfacing the OS's features for new users. You can still switch back to xfce any time you want, and as a new user, you might want to do this from time to time. But once you know what you're doing, you might find, as I do, that i3 is a much more comfortable place to work.

In fact, with a little adjustment, you can make it at least as ergonomic as a normal Linux install. Most Qubes AppVMs and DispVMs will only ever be started up to run one or two specific applications. For instance, I have an `email` AppVM that will only ever be used to open a web browser and check my web mail accounts. So, I run `email: Qube Settings`, go to the Applications tab, and deselect everything except my browser. Now, when I begin to type `mod+d email`, very quickly it will autocomplete to `email: Firefox`, which is what I want. In fact, I literally only have to type `e` for this suggestion to come up.

You could do something similar with an AppVM for social media accounts, say, or online stores. Separating those domains might seem like overkill, but I take a certain spiteful pleasure in knowing I'm making it that much harder for the bastards to track my browsing.

Similar tricks work for most AppVMs and DispVMs: for instance, to open my password manager, I can just type `mod+d v <enter>`, which autocompletes to `vault: KeePassXC`. Opening a browser in a disposable VM is just `mod+d dv <enter>`, which autocompletes to `fedora-37-dvm: Firefox` (note that this matches on the middle of the name).

Qubes has a reputation for inconvenience, compared to a traditional Linux system; it's not hard to see where this comes from, but once i3 is set up right, Qubes' interface will be so similar to a traditional i3 environment that you might even forget there's a difference.

### Multi-Monitor Setups

i3 expects you to manage your displays with xrandr, or with something that wraps xrandr. Honestly, this isn't so bad - you'd be surprised how easy it is to learn:

* `xrandr` to list your displays and their available resolutions

* `xrandr --output HDMI1 --auto` to turn on a display called HDMI1

* `xrandr --output HDMI1 --auto --left-of eDP1` to turn on HDMI1 and position it to the left of eDP1

  * You can use any of `--left-of`, `--right-of`, `--above`, `--below` here.

* `xrandr --output HDMI1 --auto --left-of eDP1 --mode 3440x1440` to do all of the above, and also set HDMI1's resolution to 3440x1440

* `xrandr --output HDMI1 --off` to turn off HDMI1

There's a whole lot more that xrandr can do, but this is all I've ever needed.

These commands do get a little tedious to type in; you can save some time by setting up keybindings for them. For example, in my dom0's `.config/i3/config` file I have the following lines:

```
# hotkeys for multi monitor setup
bindsym $mod+x exec xrandr --output HDMI1 --auto --mode 3440x1440 --left-of eDP1
bindsym $mod+c exec xrandr --output HDMI1 --off
```

With something like this, you just plug in your monitor and press mod+x to turn it on and mod+c to turn it off.

You can also consider putting your `xrandr` command(s) into a script in your PATH.


## Idle Qube Shutdown

You can set VMs to automatically shut down if they haven't opened a window or touched the network in a while. I really like this as a sort of failsafe measure for when I forget to shut a qube down.

On top of the RAM this saves you, it arguably also improves your security posture a bit: lots of VM-to-VM attacks require both VMs to be running concurrently, so it makes sense to shut down VMs as soon as they're not needed. If you ever forget to shut a qube down right as you're done with it, auto-shutdown will cover for you. It's opt-in and is configured on a per-VM basis.

In dom0:

```
$ sudo qubes-dom0-update qubes-app-shutdown-idle
$ qvm-features vault service.shutdown-idle 1
```

To enable the feature for the `vault` VM. I'm honestly not sure what the units of time are here, but this works well enough.


## USB Keyboard

If you don't plan on using a USB keyboard, skip this step. Doing so will marginally reduce your attack surface. You can read the Qubes team's notes on that subject [here](https://www.qubes-os.org/doc/device-handling-security/#security-warning-on-usb-input-devices).

That said, some of us can't resist the siren song of the mechanical keyboard. Here's how to make that work.

In dom0:

```
$ sudo qubes-dom0-update
$ sudo qubesctl state.sls qvm.usb-keyboard
```

Per the [Qubes docs](https://www.qubes-os.org/doc/usb-qubes/#automatic-setup):

> The above command will take care of all required configuration, including creating USB qube if not present. Note that it will expose dom0 to USB devices while entering LUKS passphrase. Users are advised to physically disconnect other devices from the system for that time, to minimize the risk.

As suggested, I leave my USB keyboard and mouse unplugged until after I log in. This allows me to ensure that the USB keyboard is only ever directly exposed to sys-usb, not dom0.

You can enable 

https://www.qubes-os.org/doc/usb-qubes/

Note that as of this writing (and probably forever), combined USB keyboard/mouse devices are _not_ supported: it'll let you identify an input device as a keyboard or a mouse, but not as both. I really wish they could relax that constraint, because I'd love to use my USB ThinkPad TrackPoint keyboard with Qubes, but I don't see that happening any time soon.


## VMs

You generally want to give your AppVMs short names, because (with i3) you'll be typing them a lot.

I like to create a `dev` VM for any coding I do on my own time. You have the option to base this on whatever you want, with Fedora and Debian being the most convenient options.

You can configure the default Fedora disposable VM to use `sys-whonix` as its NetVM. I did this for a long time, but lately I've relented and connect them to `sys-firewall` by default. If you do run them through `sys-whonix`, note that these DVMs' Firefox should not be treated as equivalent to Tor Browser; the latter comes with a bunch of small tweaks that are missing in the former.

If you have a VPN client you like to use, you can set up a VPN NetVM. When set up correctly, connecting an AppVM to this VPN NetVM gives you an ironclad guarantee that all traffic sent from your AppVM will either be wrapped in the VPN or dropped. If you torrent, you may want to do this. The guide is [here](https://www.qubes-os.org/doc/vpn/).

Call me crazy, but I feel a little uncomfortable using Tor Browser. It's great, but software monoculture makes exploit targeting easy. Of course, there's a $1m bounty for Tor Browser 0-days, and people run honeypot browser sessions looking for that payout. So it's reasonable to feel safe using Tor Browser. I probably shouldn't worry, but I do; that's just how my brain is wired.

If you're in the same boat, here's my advice: take a modern browser and load it out with the proper extensions. [Here are some good suggestions](https://gist.github.com/grugq/353b6fc9b094d5700c70#web-browser). Whatever you think of the grugq's whole thing, these suggestions are simple and solid. In particular, I strongly encourage disabling JavaScript by default (as long as you have the patience for that). That alone eliminates most of your browser's attack surface. It'll also break a lot of sites, but mostly ones you didn't really want to use anyway (and you can always selectively re-enable JS as needed).

You can set this all up in `whonix-ws-15-dvm` or you can create a new VM; if you choose the latter, I'd suggest naming it something like `dvm-web` and setting your browser as its only application in the Qubes Settings menu. This ensures that you can get what you want by just typing "dvm" into dmenu and hitting Enter.

In fact, you'll find that `whonix-ws-15-dvm` competes with `whonix-gw-15` in dmenu's autocompletions, so you might want to rename or clone `whonix-ws-15-dvm` regardless.

I'd also suggest changing your default search engine. I use DuckDuckGo. Google gives marginally better results overall, especially for technical searches, but DDG doesn't force Tor users to do the unpaid labor of solving captchas. Google figures that if they can't track your searches, they'll just have to extract value from you a different way; DDG apparently doesn't give a fuck who you are or where you're connecting from. I appreciate that.

## Homepages

It took me a while to think of this one.

You're going to have different uses for different VMs. If I'm opening `personal: Firefox` I'm probably headed to Twitter; with `dev: Firefox` it's probably GitHub. By default, these browsers will open to a blank page. You can save yourself a step by just setting each VM's browser's homepage to whatever you're most likely to use that VM for. Your finance VM might go to your bank's web site, and so on.

This actually ends up being _more_ convenient than a traditional Linux install, because in that case your best option for really is to have your browser open on a blank tab. This also helps shore up your security boundaries against human error by making sure you open up each page in the correct VM.

## Split GPG

Split GPG lets you keep your GPG private keys on a standalone VM with no network access. Other VMs can request temporary access to these keys. This isn't full access -- they can't read the keys directly -- it just gives them an interface to request that your standalone VM performs certain operations with those keys and relays the results.

I really strongly recommend this. In fact, I wish Qubes supported something similar for SSH keys. (does it? let me know if so!!)

You can find the setup guide [here](https://www.qubes-os.org/doc/split-gpg/).

In my opinion, subkeys are overkill (though you might disagree, and if you do, you're free to use them). That said, the basic setup is well worth taking the time to go through.

Why would you want this? Let me tell you.

Personally, I live in constant fear of someone compromising an account of someone whose Vim plugins I use, or whose `pip` or `node` modules I run. This isn't just a paranoid fantasy; these sorts of supply chain attacks [really do happen](https://thenewstack.io/attackers-up-their-game-with-latest-npm-package-compromise/), and they can result in attackers getting shells on your dev VM.

Now, if someone's reading my post drafts before I push them to GitHub, I don't care. If someone's reading my private repos, I don't care. If they set up a backdoor in `sudo` to catch my password, [I lol](https://www.qubes-os.org/doc/vm-sudo/). If they hard-push empty repos to every GitHub project I'm [allowing unsigned commits on](https://help.github.com/en/github/administering-a-repository/enabling-required-commit-signing), I'll be a little annoyed as I logout my GitHub web session, restore my `dev` VM from backup, and rotate SSH keys. But if they get the GPG private key that I'm signing commits with, that's game over.

Split GPG lets you keep that private key safe. Your `dev` VM doesn't get to directly access it (and doesn't have to!), so a compromised package that gets run in `dev` doesn't have the access necessary to steal it. This is awesome.

Split GPG is not just for commit signing. The Qubes docs give the example of email signing, which is another good use case (although, to be perfectly honest, email is irrepairably broken and any attempt to secure it is ultimately futile). If your email VM gets compromised, your private keys are still safe.

The [official guide](https://www.qubes-os.org/doc/split-gpg/) does a great job of describing the setup process and the security benefits you get from it.

Security-conscious users might want to note that Git and GPG both (as of Jan 2020) still make heavy use of SHA-1 in spite of it being [extremely](https://sha-mbles.github.io/) [broken](https://arstechnica.com/information-technology/2020/01/pgp-keys-software-security-and-much-more-threatened-by-new-sha1-exploit/). Now, we don't have time to unpack all that... but it still seems worth mentioning.

It would be awesome to be able to swap out GPG for, say, [age](https://github.com/FiloSottile/age) here. Yes, a lot of things would have to change for that to be possible, but... maybe someday.

## sys-net 

Sometimes your laptop might have trouble reconnecting to wifi after the laptop wakes up from sleep. I'm not sure if this is a ThinkPad issue or a more general Qubes issue but I've seen it for years on multiple laptops. You can read a little about sleep-related issues [here](https://www.qubes-os.org/doc/suspend-resume-troubleshooting/).

Here's what works for me:

To *manually* reload the wifi kernel module, which should manually fix the problem:

`$ sudo rmmod iwlmvm iwlwifi; sudo modprobe iwlmvm iwlwifi`

For a more permanent fix, try the following. In sys-net, create a file `/rw/config/suspend-module-blacklist` with the following contents:

```
# You can list modules here that you want to be unloaded before going to sleep. This
# file is used only if the VM has any PCI device assigned. Modules will be
# automatically re-loaded after resume.
iwlmvm
iwlwifi
```

I still find that I have to reload the module manually maybe a couple times a month. I'm not sure why that is, but luckily `sys-net` saves your command history and that's the only command I ever run there, so I can just hit `Up` and `Enter` in a new terminal instead of having to type the whole thing out every time.

If you're using i3, you might find that sometimes the sys-net wifi widget in the system dock comes undocked. In particular, this might happen after you restart i3. To fix this, in dom0 open `.config/i3/config` and add the following section:

```
# fix network widget
exec_always --no-startup-id "qvm-run sys-net \"pkill nm-applet; nm-applet \&\""
```

This automatically restarts sys-net's NetworkManager applet whenever i3's config file is executed, i.e. whenever i3 is loaded. Now, if the widget ever disappears, you can bring it back by hitting `mod+shift+r` to restart i3 in place.


## AEM

<center><blockquote class="twitter-tweet"><p lang="en" dir="ltr">its telling that infosec calls it the “evil maid” attack instead of the much more realistic “jealous boyfriend” attack</p>&mdash; ypad 🍃 (@ypad) <a href="https://twitter.com/ypad/status/1415365746071379974?ref_src=twsrc%5Etfw">July 14, 2021</a></blockquote> </center>

You may want to consider "Anti-Evil Maid" protections. This is in some ways similar to Secure Boot, though it works differently: Rather than Secure Boot's "only run trusted code" model, AEM allows you to essentially specify a trusted startup state, and then on future boots determine whether you've ended up in that same state - the implication being that if you haven't, then something has gone wrong (or you've updated your firmware/bootloader).

It is not a perfect protection. In particular, there is no clear path to recovery from compromise - but then again, isn't that always the case? You can read more about the security trade-offs and installation instructions on Qubes' [Anti-Evil Maid](https://www.qubes-os.org/doc/anti-evil-maid/) page.

In addition to the concerns noted on that page, bear in mind that AEM depends on TPM and TXT, meaning 1) your system needs to support those, and 2) if your threat model includes adversaries who might be able to compromise a TPM unit then AEM is not quite a bulletproof guarantee of boot security.

# Wrap-up

That's just about it! Final thoughts: use a password manager, take domain separation seriously, keep regular backups (maybe even on external media or a second internal drive), and do your best to leave the world better than you found it.

To be honest, this is as much a note-to-self as it is a blog post; all the same, I hope you find it useful. If you do, or if you have any additions to suggest, feel free to [get in touch](https://eli.sohl.com/contact)!
