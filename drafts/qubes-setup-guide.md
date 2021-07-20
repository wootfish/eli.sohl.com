---
layout: post
title: How to Install Qubes and Get It Set Up Just Right
---

I've been using Qubes as my main OS for personal laptops for about five years. In that time, I've figured out some nice little tricks and customizations. This, from start to finish, is what I do to install Qubes from scratch and get it set up just how I like it. Try it out -- maybe you'll like it, too!

# Setup

## Hardware

Qubes works fine on both desktops and laptops. Being usable on laptops has been a design goal of theirs from the start.

You'll want at least 8G of RAM (I've run Qubes on boxes with 4G and it was usable, but just barely - not recommended). You'll want an SSD. If you plan on keeping backups, you'll want a big SSD. Everything else is negotiable.

If you have a specific device in mind, make sure to look for it in the [Qubes Hardware Compatibility List](https://www.qubes-os.org/hcl/). That page can also serve as a buying guide.

My personal preference is for used or refurbished ThinkPads. The prices are great, the laptops are tough, and you almost never need to worry about Linux support, because nerds fucking love them. See if you can buy locally (for the Seattle area, [InterConnection](https://interconnection.org/) is great); you can also find refurb hardware for cheap on Newegg and elsewhere. Of course, used hardware may be less attractive depending on your threat model; in that case, maybe it's worth considering buying something new off the shelf.

You'll need a USB drive to write the installer to. I like to get a new drive for each install, just so I know where it has(n't) been.

## Firmware

First off, make sure your laptop's firmware is up to date. This isn't strictly _necessary_, but it is a good idea (especially with older ThinkPads). It'll be easiest to do this now, before you've installed AEM.

Be careful here, as the usual caveats apply: make sure your laptop has a full charge and stays plugged in from start to finish. You do not want anything to go wrong here, or else you might end up in an unrecoverable fail state.

## Getting an image

I'm just going to go ahead and assume you're running Linux.

From a trusted device (or the closest thing you can find to one), get the latest release from

https://www.qubes-os.org/downloads/

For new users or critical work, I recommend the stable release. I use the testing release -- but I also keep meticulous backups. Breaking issues in testing releases are rare but not unheard of.

You can torrent the image or download it directly over HTTPS. I usually torrent because it goes much faster. A direct download can be carried out over Tor, though, so for some users that option may be preferable. This has more to do with hiding your use of Qubes than getting an unaltered ISO, since you'll be validating the ISO separately. Of course, if you really care about hiding your use of Qubes, you'll have to run all your updates through Tor as well, so only commit to this if you really need to.

Once your download finishes, validate it by following the steps described here:

https://www.qubes-os.org/security/verifying-signatures/

You really should go through the above process. It's easier than it looks. But if you're currently rolling your eyes and thinking "we both know that's not going to happen", then at the absolute minimum you should run checksums on your local images. If you downloaded `4.0.2-rc3` then you should see the following:

```
$ sha256sum Qubes-R4.0.2-x86_64.iso
4451712940d38d1766320ec814a9029f043f46fd339ad6e9ebb7c6594982a699  Qubes-R4.0.2-x86_64.iso
```

That value can also be found here: https://mirrors.edge.kernel.org/qubes/iso/Qubes-R4.0.2-x86_64.iso.DIGESTS

Now it's time to do the usual ISO dance. Insert your USB drive. Use `sudo dmesg` to see where it is exposed in `/dev`. It will likely be something like `/dev/sdc`. Ignore any partitions (e.g. `/dev/sdc1`).

Write the image to the drive: something like `sudo dd if=Qubes-R4.x.x-x86_64.iso of=/dev/sdx bs=4M status=progress`, with the `x`es replaced as appropriate. Note the use of `status=progress`; it's optional, but I find it to be absolutely essential to maintaining my patience during long write jobs.

When `dd` completes, you can pull the drive, plug it into the box you're putting Qubes on, and boot from USB.

## Installation

The installer does a great job of guiding you through this process. There's not much you need to do.

You don't _need_ to set a time zone, but you probably want to. They have a nice big map for you to click on. It's neat.

You'll have to set a disk encryption passphrase. I really do encourage you to use a pass-_phrase_ - The longer the better. AEM and a good disk passphrase are your first lines of defense against many realistic attacks. I would never take a laptop through an airport, across a border, to a conference, etc, without first making sure both of these protections are in place.

Here's my passphrase advice:

* Start with something that will be easy for you to remember (like, say, a quote, as long as it's not too generic)
* Modify the phrasing in some way. For example:
  * Change some verb tenses
  * Swap out a word or two for less-common synonyms
  * Switch to a different quote partway through, or just use two full ones in series
* Maybe throw in some contractions (e.g. _your_ to _yr_ - or to be extra spicy, go in the opposite direction, e.g. _yoouuur_)
* Pepper in some special characters (e.g. space to underscore, _s_ to _5_, `l` to `|` or `1`)

Don't go too overboard with the special characters - you do still need to remember this thing, and the more passphrases you have, the harder that'll get. Bear in mind that if you're doing character substitutions, just a few go a long way. The usual [correct horse battery staple](https://xkcd.com/936/) advice applies here -- though the entropy calculation is thrown off if you're using a phrase that might appear in, say, your chat logs or a list of famous quotes. Hence the suggestion to adjust the phrasing.

Once you've picked a passphrase, practice typing it in. There are two password boxes, so you can switch between typing it into the first and second box over and over, and it'll tell you if you got it right each time. Practice typing it in correctly ten times in a row, then get up, get some water, check Twitter, come back in five or ten minutes, and practice it again. I cannot tell you how many times I've come up with a brilliant passphrase and completely blanked on it the next day; you want to make extra sure this won't happen.

Once you kick off the install process, it'll also ask you to choose a username and password for your root user. This is mostly just a physical security measure; even so, I encourage you to use a strong password or passphrase here.

Bear in mind that at some point in the lifespan of this laptop you will be typing in your login password much more often than your disk encryption password, meaning the former is much more likely to eventually be caught by surveillance; for this and other reasons, I encourage you not to reuse either password/passphrase, and not to use the same one for both of these uses. On the subject of cameras: I've made a habit of tilting my laptop screen forward to partially cover my fingers as I type in passwords; I encourage you to do the same. This is only really important for disk, user, and password manager passphrases, of course: once you're logged in, you can just enter everything else using your password manager.

After installation finishes, the installer will prompt you to reboot. After reboot you'll be prompted for post-install configuration. The defaults are fine here. Updates over Tor will go much slower, and (as mentioned above) aren't really necessary unless you're trying to hide the fact that you're using Qubes from your ISP (and their friends).

## First Backups

After login, before doing anything else, make a full system backup. You can do this through the Qube Manager. Next, update all your Qubes (including those with "no known available updates"). Then make another backup.

If you ever want to "factory reset" a qube (e.g. after plugging in a dubious USB device), these backups will let you do that.

## Configuration

Now we're getting to the good stuff. The base Qubes install is usable, but over the years I've found a lot of tweaks that I think make it much nicer.

### i3

Once you get used to a tiling window manager, you'll never want to go back. I've tried a few and, to me, i3 is easily the standout.

Install in dom0 with `sudo qubes-dom0-update i3 i3-settings-qubes`. The second package there is a custom configuration suite. It makes a whole lot of useful little adjustments. You want it.

Once i3 is installed, log out, then log in with i3. This will prompt you to create a config; follow the configuration wizard and you'll be set. You probably want to use Win as your modifier key since other apps generally leave Win chords for the window manager, whereas lots of apps have custom Alt chords.

#### Key bindings

i3 _almost_ comes with Vim keybindings, but they do something weird: they wanted to use `h` to mean "horizontal split", so they moved the movement keys from `hjkl` to `jkl;`. I do not like this, to put it mildly. I suggest shifting all five of these keys back over to the left: first, map horizontal split to `g` instead of `h`, then shift the movement keys back to where they belong.

To do this, open dom0's `~/.config/i3/config` file. Here are the sections you'll want to make changes in:

* "# change focus"
* "# move focused window"
* "# split in horizontal orientation"
* "# resize window"

This is also where you can change how fast the screen locks. In the `# Use a screen locker` section, change `-time 3` from `3` to however many minutes you want to wait before locking. Bear in mind that you can always lock your screen manually with `i3lock`, and the less often your screen auto-locks while the laptop is in use, the less often you have to type in (and potentially be seen typing in) your user password, so I think it's reasonable to set this value fairly high as long as you're diligent about manual screen-locking.

After making these changes and saving the config, restart i3 in-place with `mod+shift+r`.

#### Temperature

I like to add a CPU temperature readout to the bar at the bottom. This works a little differently than it would in stock i3, because of Qubes' custom config. Here's what you have to do.

In a dom0 terminal, open `/usr/bin/qubes-i3status` as root. Add a new function, `status_cputemp()`, that looks something like this:

```
status_cputemp() {
    local cputemp=$(sensors | grep 'Package id 0:' | cut -d' ' -f5)
    json cputemp "T:$cputemp"
}
```

You may need to adjust the innermost set of commands here depending on what `sensors` returns on your system. Try it out on the command line before saving your changes.

Next, add a line like `local cputemp=$(status_cputemp)` in `main`'s innermost block and include the result to the final echo: `echo ",[$cputemp$qubes$disk$bat$load$time]"`. Then restart i3 and check the bottom of the screen to see if it worked.

#### Starting apps

Note that you can now start dom0 applications by name from dmenu (e.g. `mod+d Qube Manager`), and you can start AppVM applications by prefixing the VM name (e.g. "mod-d personal: Firefox"). If you open a terminal on a blank workspace, it will be a dom0 terminal; if any window is focused, the terminal is opened in the same VM where that window is running.

Qubes' native xfce environment is fine, and it does a better job of surfacing the OS's features for new users. You can still switch back to xfce any time you want. But once you know what you're doing, you might find, as I do, that i3 is a much more comfortable place to work.

In fact, with a little adjustment, you can make it at least as ergonomic as a normal Linux install. Most Qubes AppVMs and DispVMs will only ever be started up to run one or two specific applications. For instance, I have an `email` AppVM that will only ever be used to open a web browser and check my web mail accounts. So, I run `email: Qube Settings`, go to the Applications tab, and deselect everything except my browser. Now, when I begin to type `mod+d email`, very quickly it will autocomplete to `email: Firefox`, which is what I want. In fact, I literally only have to type `e` for this suggestion to come up.

You could do something similar with an AppVM for social media accounts, say, or online stores. Separating those domains might seem like overkill, but I take a certain spiteful pleasure in knowing I'm making it that much harder for the bastards to track my browsing.

Similar tricks work for most AppVMs and DispVMs: for instance, to open my password manager, I can just type `mod+d v <enter>`, which autocompletes to `vault: KeePassXC`. Opening a browser in a disposable VM is just `mod+d dv <enter>`, which autocompletes to `fedora-33-dvm: Firefox` (note that this matches on the middle of the name, which is perfectly legal).


### USB Keyboard

If you don't plan on using a USB keyboard, skip this step. Doing so will marginally reduce your attack surface. You can read the Qubes team's notes on that subject [here](https://www.qubes-os.org/doc/device-handling-security/#security-warning-on-usb-input-devices).

That said, some of us can't resist the siren song of the mechanical keyboard. We need our clicky keys. Here's how to make that work.

In dom0:

```
$ sudo qubes-dom0-update
$ sudo qubesctl state.sls qvm.usb-keyboard
```

Per the [Qubes docs](https://www.qubes-os.org/doc/usb-qubes/#automatic-setup):

> The above command will take care of all required configuration, including creating USB qube if not present. Note that it will expose dom0 to USB devices while entering LUKS passphrase. Users are advised to physically disconnect other devices from the system for that time, to minimize the risk.

As suggested, I leave my USB keyboard and mouse unplugged until after I log in. This allows me to ensure that the USB keyboard is only ever directly exposed to sys-usb, not dom0.

Note that as of this writing (and probably forever), combined USB keyboard/mouse devices are _not_ supported: it'll let you identify an input device as a keyboard or a mouse, but not as both. I really wish they could relax that constraint, because I'd love to use my USB ThinkPad TrackPoint keyboard with Qubes, but I don't see that happening any time soon.


### VMs

You generally want to give your AppVMs short names, because (with i3) you'll be typing them a lot.

I like to create a `dev` VM for any coding I do on my own time. You have the option to base this on whatever you want, with Fedora and Debian being the most convenient options.

You can configure the default Fedora disposable VM to use `sys-whonix` as its NetVM. I did this for a long time, but lately I've relented and connect them to `sys-firewall` by default. If you do run them through `sys-whonix`, note that these DVMs' Firefox should not be treated as equivalent to Tor Browser; the latter comes with a bunch of small tweaks that are missing in the former.

If you have a VPN client you like to use, you can set up a VPN NetVM. When set up correctly, connecting an AppVM to this VPN NetVM gives you an ironclad guarantee that all traffic sent from your AppVM will either be wrapped in the VPN or dropped. If you torrent, you may want to do this. The guide is [here](https://www.qubes-os.org/doc/vpn/).

Call me crazy, but I feel a little uncomfortable using Tor Browser. It's great, but software monoculture makes exploit targeting easy. Of course, there's a $1m bounty for Tor Browser 0-days, and people run honeypot browser sessions looking for that payout. So it's reasonable not to worry too much about 0-day Tor browser exploits. I probably shouldn't worry, but I do, because that's just how my brain is wired.

If you're in the same boat, here's my advice: take a modern browser and load it out with the proper extensions. [Here are some good suggestions](https://gist.github.com/grugq/353b6fc9b094d5700c70#web-browser). Whatever you think of the grugq's whole schtick, his suggestions here are simple and solid. In particular, I strongly encourage disabling JavaScript by default (if you have the patience for that). That alone will eliminate the vast majority of your browser's attack surface.

You can set this all up in `whonix-ws-15-dvm` or you can create a new VM; if you choose the latter, I'd suggest naming it something like `dvm-web` and setting your browser as its only application in the Qubes Settings menu. This ensures that you can get what you want by just typing "dvm" into dmenu and hitting Enter.

In fact, you'll find that `whonix-ws-15-dvm` competes with `whonix-gw-15` in dmenu's autocompletions, so you might want to rename or clone `whonix-ws-15-dvm` regardless.

I'd also suggest changing your default search engine. I use DuckDuckGo. Google gives marginally better results overall, especially for technical searches, but DDG doesn't force Tor users to do the unpaid labor of solving captchas. Google figures that if they can't track your searches, they'll just have to extract value from you a different way; DDG apparently doesn't give a fuck who you are or where you're connecting from. I appreciate that.

### Homepages

It took me a while to think of this one.

You're going to have different uses for different VMs. If I'm opening `personal: Firefox` I'm probably headed to Twitter; with `dev: Firefox` it's probably GitHub. By default, these browsers will open to a blank page. You can save yourself a step by just setting each VM's browser's homepage to whatever you're most likely to use that VM for. Your finance VM might go to your bank's web site, and so on.

This actually ends up being _more_ convenient than a traditional Linux install, because in that case your best option for really is to have your browser open on a blank tab. This also helps shore up your security boundaries against human error by making sure you open up each page in the correct VM.

### Split GPG

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

It would be awesome to be able to swap out GPG for, say, [age](https://github.com/FiloSottile/age) here. Maybe someday.


