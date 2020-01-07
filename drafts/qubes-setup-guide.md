---
layout: post
title: How to Install Qubes OS and Set It Up Just Right
---

Qubes is my favorite OS by a wide margin. It gives you an unbelievable level of control over your system. I could go on for hours about this, but I won't. I'm going to assume you're already familiar with Qubes, or at least already sold on trying it out.

I've been using Qubes heavily for a number of years at this point. In that time, I've figured out a lot of nice little tricks and customizations for it. This, from start to finish, is what I do to install Qubes from scratch and get it set up just how I like it. Try it out -- maybe you'll like it, too!

# Setup

## Hardware

I prefer used hardware, mostly because the prices are great. If you buy from a good retailer and pick a brand with solid build quality, you can expect used hardware to be good as new in every way that counts. ThinkPads tend to hold up particularly well in this regard. If you're in Seattle, I recommend seeing what InterConnection has in stock.

Make sure to swap out any stock hard drive for an SSD, naturally. A lot of VM operations bottleneck on disk I/O, so an SSD makes an even bigger difference than usual with Qubes.

I've used Qubes on a ThinkPad W540, a T420s, and a couple of desktops. I've had great results in each case. Qubes maintains an _awesome_ reference page for hardware compatibility:

https://www.qubes-os.org/hcl/

Make sure to look up any potential laptop purchases there before committing to them.

You're going to want at least 8G of RAM. I've been able to get by on 4G when necessary, but it does run noticably slower. If your laptop comes with 4G RAM stock, you should look up whether the motherboard supports more. 8G would be plenty; 16G would plenty and then some.

If your laptop has room for more than one SSD, all the better -- you can install to one and use one for backups. If not, you can use an external drive for the same purpose (the threat models here are not quite identical, since the old , but they're fairly close). I'll cover the setup for both cases below.

You'll need a USB drive to write the installer to. Make sure to copy any important files off the drive first.

## Firmware

First off, make sure your laptop's firmware is up to date. This isn't strictly _necessary_, but it is a good idea (especially with ThinkPads), and it'll be easiest to do it now before you've installed AEM.

Be careful here: make sure your laptop has a full charge, stays plugged in, and doesn't unexpectedly power down during the update process. The failure states for a BIOS update can be difficult or impossible to recover from, so you really do not want anything to go wrong here.

## Getting an image

I'm just going to go ahead and assume you're running Linux.

From a trusted device, or the closest thing you can find to one, go to

https://www.qubes-os.org/downloads/

and download the latest stable release. At time of writing, this is `4.0.2`.

You can torrent the image or download it directly over HTTPS. I usually torrent because it goes much faster. A direct download can be carried out over Tor, though, so for some users that option may be preferable.

After your download is complete, you should validate the image. Do this by following the steps described here:

https://www.qubes-os.org/security/verifying-signatures/

You _really should_ go through the above process. But if you're currently rolling your eyes and thinking "we both know that's not going to happen", then at the absolute minimum you should run checksums on your local images. If you downloaded `4.0.2` then you should see the following:

```
$ sha256sum Qubes-R4.0.2-x86_64.iso
4451712940d38d1766320ec814a9029f043f46fd339ad6e9ebb7c6594982a699  Qubes-R4.0.2-x86_64.iso
```

That value can also be found here:

https://mirrors.edge.kernel.org/qubes/iso/Qubes-R4.0.2-x86_64.iso.DIGESTS

Insert your USB drive, and run `sudo dmesg` to see what name the USB drive is available as. Usually this will be something like `/dev/sdb` or `/dev/sdc`, possibly with subdevices for partitions (e.g. `/dev/sdc1`, `/dev/sdc2`, etc). Write the ISO to the USB drive using something like this (where you've replaced `/dev/sdc` with the actual name of your drive):

```
# Make sure to get the name of the USB drive right in this command,
# or else you will seriously mess up your box.
sudo dd if=Qubes-R4.0.2-x86_64.iso of=/dev/sdc bs=4M status=progress
```

When `dd` completes, remove the drive, plug it into the box you want to install Qubes on, and boot from USB.

## Base Installation

The installer does a pretty good job of guiding you through this process, but I'll cover it anyway.

...
