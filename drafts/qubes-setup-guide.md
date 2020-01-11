---
layout: post
title: How to Install Qubes OS and Set It Up Just Right
---

I've been using Qubes as my main OS for personal laptops for about five years. In that time, I've figured out some nice little tricks and customizations. This, from start to finish, is what I do to install Qubes from scratch and get it set up just how I like it. Try it out -- maybe you'll like it, too!

# Setup

## Hardware

Qubes works fine on both desktops and laptops. 

You'll want at least 8G of RAM (4G is usable, but just barely). You'll want an SSD. If you plan on keeping backups, you'll want a big SSD. Everything else is negotiable.

If you have a specific device in mind, make sure to look for it in the [Qubes Hardware Compatibility List](https://www.qubes-os.org/hcl/).

My preference is for used or refurbed ThinkPads. The prices are great and the laptops are tough as hell. See if you can buy locally ([InterConnection](https://interconnection.org/) is great); you can also find refurb hardware for great prices on Newegg.

You'll need a USB drive to write the installer to. I like to buy a new drive for each install, just so I know where it has(n't) been.

## Firmware

First off, make sure your laptop's firmware is up to date. This isn't strictly _necessary_, but it is a good idea (especially with ThinkPads). It'll be easiest to do this now, before you've installed AEM.

Be careful here: make sure your laptop has a full charge and stays plugged in from start to finish.

If the device unexpectedly powers down during the update process, you can end up in failure states that are difficult or impossible to recover from. You really do not want anything to go wrong here.

## Getting an image

I'm just going to go ahead and assume you're running Linux.

From a trusted device (or the closest thing you can find to one), get the latest release from

https://www.qubes-os.org/downloads/

For new users or critical work, I recommend the stable release. I use the testing release -- but I also keep meticulous backups. Breaking issues in Qubes release candidates are rare but not unheard of.

You can torrent the image or download it directly over HTTPS. I usually torrent because it goes much faster. A direct download can be carried out over Tor, though, so for some users that option may be preferable. This has more to do with hiding your use of Qubes than getting an unaltered ISO, since you'll be validating the ISO separately.

Once your download finishes, validate it by following the steps described here:

https://www.qubes-os.org/security/verifying-signatures/

You _really should_ go through the above process. It's easier than it looks. But if you're currently rolling your eyes and thinking "we both know that's not going to happen", then at the absolute minimum you should run checksums on your local images. If you downloaded `4.0.2-rc3` then you should see the following:

```
$ sha256sum Qubes-R4.0.2-x86_64.iso
4451712940d38d1766320ec814a9029f043f46fd339ad6e9ebb7c6594982a699  Qubes-R4.0.2-x86_64.iso
```

That value can also be found here: https://mirrors.edge.kernel.org/qubes/iso/Qubes-R4.0.2-x86_64.iso.DIGESTS

Insert your USB drive. Use `sudo dmesg` to see where it is exposed in `/dev`. It will likely be something like `/dev/sdc`. Ignore any partitions (e.g. `/dev/sdc1`).

Write the image to the drive: something like `sudo dd if=Qubes-R4.0.2-x86_64.iso of=/dev/sdc bs=4M status=progress`

(Make sure to validate the input and output filenames above; you may need to modify them depending on your setup)

When `dd` completes, remove the drive, power off the box you want to install Qubes on, plug the drive into the box, and boot from USB.

## Installation

The installer does a great job of guiding you through this process. There's not much you need to do.

You don't _need_ to set a time zone here, but you probably want to. They have a nice big map that you can click on. It's cute.

You'll have to set a disk encryption passphrase. I really do encourage you to use a pass-_phrase_. The longer the better.

Here's my passphrase advice:

* Start with a quote or whatever else will be easy for you to remember
* Modify the phrasing in some way. For example:
  * Change verb tense
  * Swap out a word for a synonym
  * Switch to a different quote partway through, or just use two full quotes
* Maybe throw in some contractions (e.g. _your_ to _yr_)
* Pepper in a couple special characters (e.g. space to underscore, _s_ to _5_, `l` to `|`)

Don't go overboard with the special characters; if you're doing character substitutions then each one adds roughly one bit of entropy, meaning that just a few go a long way. The usual [correct horse battery staple](https://xkcd.com/936/) advice applies here -- though the entropy calculation is thrown off if you're using a phrase that might appear in, say, your chat logs or a list of famous quotes. Thus the suggestion to slightly modify phrasing.

Once you've picked a passphrase, practice typing it in. There are two password boxes, so you can switch between typing it into the first and second box and it'll tell you if you got it right each time. Practice typing it in correctly ten times in a row, then get up, get some water, check Twitter, come back in five or ten minutes, and practice it again. I cannot tell you how many times I've come up with a brilliant passphrase and completely blanked on it the next day; you want to make extra sure this won't happen.

Once you kick off the install process, it'll also ask you to choose a username and password for your root user. This is mostly just a physical security measure; even so, I encourage you to use a strong password or passphrase here.

Bear in mind that at some point in the lifespan of this laptop you are much more likely to be caught on surveillance cameras typing in your login password than your encryption password; for this and other reasons, it should go without saying that you should not reuse passwords or passphrases. On the subject of cameras: I've made a habit of tilting my laptop screen forward to partially hide my fingers as I'm typing in passwords, and I encourage you to do the same. Make sure your laptop webcam is covered, of course.

After installation finishes, it will prompt you to reboot. After reboot you'll be prompted for post-install configuration. The defaults are fine here. I like to enable updates over Tor, but this is a personal preference.

## First Backups

After login, before doing anything else, make a full system backup.

Then update all your Qubes (including those with "no known available updates"). Then make another backup.

If you ever want to "factory reset" a qube (e.g. after plugging in a dubious USB device), these backups will let you do that.

## Configuration

### i3

Once you get used to a tiling window manager, you'll never want to go back. I've tried a few and for me, i3 is the standout.

Install in dom0 with `sudo qubes-dom0-update i3 i3-settings-qubes`. The second package there is a custom configuration suite. It makes a whole lot of useful little adjustments. You want it.

Once i3 is installed, log out, then log in with i3. This will prompt you to create a config; follow the configuration wizard and you'll be set.

i3 _almost_ comes with Vim keybindings, but they wanted to use `h` to mean "horizontal split" so they moved the movement keys from `hjkl` to `jkl;`. I do not care for this, so I map horizontal split to `g` instead of `h` and then shift the movement keys back over to where they belong.

To do this, open dom0's `~/.config/i3/config` file. Here are the sections you'll want to make changes in:

* "# change focus"
* "# move focused window"
* "# split in horizontal orientation"
* "# resize window"

This is also where you can change how fast the screen locks. In the `# Use a screen locker` section, change `-time 3` from `3` to however many minutes you want to wait before locking.

After making these changes and saving the config, reload i3 with `mod-shift-c`.

Note that you can now start dom0 applications by name from dmenu (e.g. `mod-d Qube Manager`), and you can start AppVM applications by prefixing the VM name (e.g. "mod-d personal: Firefox"). If you open a terminal on a blank workspace, it will be a dom0 terminal; if any window is focused, the terminal is opened in the same VM where that window is running.

Qubes' native xfce environment is fine, and it does a better job of surfacing the OS's features for new users. You can still switch back to xfce any time you want. But once you know what you're doing, you might find -- as I do -- that i3 is a much more comfortable place to work.

I like to add a CPU temperature readout to the bar at the bottom. This works a little differently than in stock i3 because of Qubes' custom config.

Open `/usr/bin/qubes-i3status` as root. Add a new function, `status_cputemp()`, that looks something like this:

```
status_cputemp() {
    local cputemp=$(sensors | grep 'Package id 0:' | cut -d' ' -f5)
    json cputemp "T:$cputemp"
}
```

You may need to adjust the innermost set of commands here depending on what `sensors` returns on your system.

Add a line like `local cputemp=$(status_cputemp)` in `main`'s innermost block and include the result to the final echo: `echo ",[$cputemp$qubes$disk$bat$load$time]". Then restart i3 and see if it worked.

### USB Keyboard

If you don't plan on using a USB keyboard, skip this step. Doing so will reduce your attack surface. You can read the Qubes team's notes on that subject [here](https://www.qubes-os.org/doc/device-handling-security/#security-warning-on-usb-input-devices).

That said, some of us can't resist the siren song of the mechanical keyboard. I'd be lost without my CM Storm with Cherry MX Blues, so this step is a must for me.

In dom0:

```
$ sudo qubes-dom0-update
$ sudo qubesctl state.sls qvm.usb-keyboard
```

Per the [Qubes docs](https://www.qubes-os.org/doc/usb-qubes/#automatic-setup):

> The above command will take care of all required configuration, including creating USB qube if not present. Note that it will expose dom0 to USB devices while entering LUKS passphrase. Users are advised to physically disconnect other devices from the system for that time, to minimize the risk.

As suggested, I leave my USB keyboard and mouse unplugged until after I log in, typing in my initial passwords through my laptop keyboard. This allows me to ensure that the USB keyboard is only ever directly exposed to sys-usb, not dom0.


### VMs

You generally want to give your AppVMs short names, because i3 makes you type them a lot.

I like to create a `dev` VM for any coding I do on my own time. You have the option to base this on whatever you want, with Fedora and Debian being the most convenient options.

I like to configure the default Fedora disposable VM to use `sys-whonix` as its NetVM. You can still set individual disposable VM instances to use `sys-firewall` if you ever want to skip Tor. Note that these DVMs' Firefox should not be treated as equivalent to Tor Browser; the latter comes with a bunch of small tweaks that are missing in the former.

If you have a VPN client you like to use, you can set up a VPN NetVM. Connecting an AppVM to this VPN NetVM gives you an ironclad guarantee that all traffic sent from your AppVM will either be wrapped in the VPN or dropped. If you torrent, you will want to do this. The guide is [here](https://www.qubes-os.org/doc/vpn/).

Call me crazy, but I feel a little uncomfortable using Tor Browser. It's great, but software monoculture makes exploit targeting easy. Of course, there's a $1m bounty for Tor Browser 0-days, and people run honeypot browser sessions looking for that payout. As such, it's reasonable not to worry too much about 0-day Tor browser exploits; I probably shouldn't worry, but I do, because I'm just like that.

If you're in the same boat, here's my advice: take a modern browser and load it out with the proper extensions. As for what to use, [here are some good suggestions](https://gist.github.com/grugq/353b6fc9b094d5700c70#web-browser). Whatever you think of the grugq's whole schtick, his suggestions here are simple and solid. In particular, I encourage disabling JavaScript by default (if you have the patience for that).

You can set this all up in `whonix-ws-15-dvm` or you can create a new VM; if you choose the latter, I'd suggest naming it `dvm-web` and setting your browser as its only application in the Qubes Settings menu. This ensures that you can get what you want by just typing "dvm" into dmenu and hitting Enter.

In fact, you'll find that `whonix-ws-15-dvm` competes with `whonix-gw-15` in dmenu's autocompletions, so you might want to rename or clone `whonix-ws-15-dvm` regardless.

I'd also suggest changing your default search engine to DuckDuckGo. Google gives marginally better results overall, especially for technical searches, but DuckDuckGo doesn't force Tor users to do the unpaid labor of solving captchas. Google figures that if they can't track your searches, they'll just have to extract value from you a different way; DDG apparently doesn't give a fuck who you are or where you're connecting from. I appreciate that.

### Homepages

It took me a while to think of this one.

You're going to have different uses for different VMs. If I'm opening `personal: Firefox` I'm probably headed to Twitter; with `dev: Firefox` it's probably GitHub. By default, these browsers will open to a blank page. You can save yourself a step by just setting each VM's browser's homepage to whatever you're most likely to use that VM for. Your finance VM might go to your bank's web site, and so on.

This actually ends up being _more_ convenient than a traditional Linux install, because in that case your best option for Firefox really is just to open on a blank tab. It also helps shore up your security boundaries against human error by making sure you open up each page in the correct VM.

### Split GPG

Split GPG lets you keep your GPG private keys on a standalone VM with no network access. Other VMs can request temporary access to these keys. This isn't full access -- they can't read the keys directly -- it just gives them an interface to request that your standalone VM performs certain operations with those keys and relays the results.

I really strongly recommend this. In fact, I wish Qubes supported something similar for SSH keys. (does it? let me know if so!!)

You can find the setup guide [here](https://www.qubes-os.org/doc/split-gpg/).

In my opinion, subkeys are overkill (though you might disagree -- I can certainly see why one would want them in certain serious situations, particularly re: email). That said, the basic setup is well worth taking the time to go through.

Why would you want this? Let me tell you.

I live in constant fear of someone compromising an account of someone whose Vim plugins I use, or whose `pip` or `node` modules I run. This isn't a fantasy; these sorts of supply chain attacks [really do happen](https://thenewstack.io/attackers-up-their-game-with-latest-npm-package-compromise/).

Now, if someone's reading my post drafts before I push them to GitHub, I don't care. If someone's reading my private repos, I don't care. If they set up a backdoor in `sudo` to catch my password, [I lol](https://www.qubes-os.org/doc/vm-sudo/). If they hard-push empty repos to every GitHub project I'm [allowing unsigned commits on](https://help.github.com/en/github/administering-a-repository/enabling-required-commit-signing), I'll be a little annoyed as I restore my `dev` VM from backup, logout my GitHub web session, and rotate SSH keys. If they get the GPG private key that I'm signing commits with, that's when it's game over.

Split GPG lets you keep that private key safe. Your `dev` VM doesn't get to directly access it (and doesn't have to!), so a compromised package that gets run in `dev` doesn't have the access necessary to steal it. This is awesome.

Split GPG is not just for commit signing. The Qubes docs give the example of email signing, which is another good one. If your email VM gets compromised (through an exploit in a codec, say, or in your email app's implementation of some wire protocol), your private keys are still safe.

The [official guide](https://www.qubes-os.org/doc/split-gpg/) does a great job of describing the setup process and the security benefits you get from it.

Security-conscious users might want to note that Git and GPG both (as of Jan 2020) still make heavy use of SHA-1 in spite of it being [extremely](https://sha-mbles.github.io/) [broken](https://arstechnica.com/information-technology/2020/01/pgp-keys-software-security-and-much-more-threatened-by-new-sha1-exploit/). We don't have room to unpack the implications that here but it seems worth mentioning.

It would be awesome to be able to swap out GPG for, say, [age](https://github.com/FiloSottile/age) here. Maybe someday.

