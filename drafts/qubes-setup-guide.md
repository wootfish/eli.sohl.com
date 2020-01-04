---
layout: post
title: How to Install Qubes and Get It Set Up Just Right
---

Qube OS is my favorite operating system by a wide margin. <add more about how great qubes is here>

I've been using Qubes heavily for a number of years at this point, and I've figured out a lot of nice little tricks to get it to work just right. This, from start to finish, is what I do to install Qubes from scratch and get it set up just how I like it. Try it out -- maybe it'll work for you too!

# Setup

## Hardware

I like to buy used hardware -- the prices are great, and anything with a robust build is going to be effectively good as new. ThinkPads tend to hold up particularly well in this regard. Make sure to swap out any stock hard drive for an SSD, naturally. A lot of VM operations bottleneck on disk I/O, so an SSD makes an even bigger difference here than usual.

I've used Qubes on a ThinkPad W540, a T420s, and a couple of desktops. I've had great results in each case.

You're going to want at least 8G of RAM. I've been able to get by on 4G when necessary, but it does run noticably slower. If your laptop comes with 4G RAM stock, you should look up whether the motherboard supports more. 8G would be plenty; 16G would plenty and then some.

If your laptop has room for more than one SSD, all the better -- you can install to one and use one for backups. If not, you can use an external drive for the same purpose (the threat models here are not quite identical, since the old , but they're fairly close). I'll cover the setup for both cases below.

You'll need a USB drive to write the installer to. Make sure to copy any important files off the drive first.

## Firmware

First off, make sure your laptop's firmware is up to date.

This isn't strictly _necessary_, but it is a good idea (especially with ThinkPads), and it'll be easiest to do it now before you've installed AEM.

Be careful doing this -- make sure your laptop has a full charge, stays plugged in, and doesn't unexpectedly power down during the update process, or else you run the risk of bricking your laptop's mobo.

## Getting an image

I'm just going to go ahead and assume you're running Linux (or something like it).

From a trusted device (or the closest thing you can find to one), go to

https://www.qubes-os.org/downloads/

and download the latest stable release. At time of writing, this is `4.0.2`.

You can download or torrent the image. Torrenting is usually much faster, but a direct download can be carried out over Tor; ultimately, your choice depends on your priorities.

After your download is complete, validate the image. Do this by following the steps described here:

https://www.qubes-os.org/security/verifying-signatures/

You _really should_ go through the above process. But if right now you're rolling your eyes and thinking "we both know that's not going to happen", then at the absolute minimum you should run checksums on your local images. If you downloaded `4.0.2` then you should see the following:

```
$ sha256sum *.iso
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

