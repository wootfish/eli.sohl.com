---
layout: post
title: Virtualizing a Raspberry Pi with QEMU
---

A while ago, I wrote about building a [rack](https://sohliloquies.blogspot.com/2015/12/making-raspberry-pi-cluster-part-1.html) for a Raspberry Pi cluster. If you have a rack, at some point you'll want to put some Pis on it. Virtualization can make the process of imaging these Pis relatively painless. You can generate custom images from the comfort of your desktop and even automate the whole process. Here's a quick crash course in virtualizing the Pi using QEMU.

All the guides I could find on this were at least a couple years old and were missing various important parts of the process. None of them quite worked out-of-the-box. It's hard to blame them, though, since a hardware platform like the Pi is of course a moving target. For what it's worth, this guide should be complete and up-to-date as of October 2016.

The first thing to do is to get a base disk image to work from. It shouldn't make too much of a difference what you choose (unless you opt for something absurd and masochistic like [Arch Linux](https://wiki.archlinux.org/index.php/Raspberry_Pi)). For this guide, I'll be using [Raspbian Lite](https://www.raspberrypi.org/downloads/raspbian/). My focus will be on emulating images compatible with the Pi 2, though I don't see why they wouldn't work on the Pi 3 as well.

Once you've chosen a distro, download or torrent a .iso file for it. As soon as you have that, you can get started. I like to start by making a working copy of this .iso file right off the bat so that if I make a mistake I can just be throw it away and start over again from a fresh copy, without having to re-download the image.

```
mkdir -p ~/workspace/raspberry
cp ~/Downloads/2016-09-23-raspbian-jessie-lite.img ~/workspace/raspberry/raspbian.img
```

`raspbian.img` will serve as our base image. If you ever want to copy the current state of the virtualized Pi to an SD card, you can do that using `dd` from this file.

We'll need a custom kernel to get QEMU to boot this Pi image. Currently [this github repo](https://github.com/dhruvvyas90/qemu-rpi-kernel) maintains up-to-date kernel files for this purpose. Source code and a build script are included, if you're interested in those.

```
cd ~/workspace
git clone git@github.com:dhruvvyas90/qemu-rpi-kernel.git
cp qemu-rpi-kernel/kernel-qemu-4.4.13-jessie raspberry/kernel-qemu
```

Now we have everything we need to boot up the Pi -- but if we do, it'll hit a kernel panic and dump core. That's no good. If you want to see this happen, then feel free to copy the qemu command from later on, but I'll warn you: it's not very exciting. What we're going to do now is make fixes to a couple different config files so we can get things working.

Before we apply these fixes, we need to be able to mount the Pi image's root partition. There's a hard way and an easy way to do this. The hard way involves reading the image's partition table, multiplying one of the fields in it by 512, and making a huge "mount" invocation. The easy way is this:

```
cd ~/workspace/raspberry
sudo kpartx -va raspbian.img
# note the name of the loop device chosen by kpartx, then...
sudo mount /dev/mapper/loop0p2 /mnt  # assuming kpartx chose loop0
```

kpartx does all the work for us, reading the image's partition table and creating loop devices for its partitions. The first one is the Pi's boot partition and the second one is its root filesystem. So following this process gives us the Pi's root filesystem mounted to `/mnt`. No mess no stress!

Now, here's what we've got to change. First, edit `/mnt/etc/ld.so.preload` and comment out its first and only line by prepending a `#` to it:

```
#/usr/lib/arm-linux-gnueabihf/libarmmem.so
```

This prevents the kernel panic. I have no idea why.

Next, create a new file, `/mnt/etc/udev/rules.d/90-qemu.rules`, and put the following lines into it:

```
KERNEL=="sda", SYMLINK+="mmcblk0"
KERNEL=="sda?", SYMLINK+="mmcblk0p%n",
```

These are necessary because (`/mnt`)`/etc/fstab` specifies partitions under `/dev/mmcblk0` for critical parts of the filesystem. That would make sense for Raspbian under normal circumstances because it boots from an SD card, but since we're exposing our disk image to the system as `/dev/sda`, we need to add these mappings if we want to keep everyone happy.

You could of course also edit `/etc/fstab` to specify `sda` instead of `mmcblk0`, but that would break compatibility between the image and actual Pis.

These two fixes should be enough to get Raspbian to boot cleanly. If you want to use SSH to access the Pi from the host machine, you can optionally set that up as well  by disabling password login (which actually is good to do anyway) and adding your public key to `authorized_keys`. If you don't already have a public key, you will of course need to run `rsa-keygen` first. Then,

```
echo "PasswordAuthentication no" >> /mnt/etc/ssh/sshd_config
mkdir -p /mnt/home/pi/.ssh
cat ~/.ssh/id_rsa.pub >> /mnt/home/pi/.ssh/authorized_keys
```

And you'll be good to go. This disables password authentication but grants passwordless access to anyone in possession of your private key.

You should also unmount `/mnt` at this point:

```
sudo umount /mnt
```

This may not be strictly necessary, but it seems like common sense given that `/mnt` is mounted from a partition on the image file we're about to give to QEMU. Under certain circumstances, leaving a partition mounted while also using it with QEMU runs the risk of corrupting the filesystem.

Now, the moment has arrived -- we're going to actually boot up our virtual Pi! Here's the invocation:

```
qemu-system-arm -kernel kernel-qemu -cpu arm1176 -m 256 -M versatilepb -no-reboot -serial stdio -append “root=/dev/sda2 panic=1” -hda raspbian.img -redir tcp:5022::22
```


That should work to boot to a login prompt. The default login is

```
Username - pi
Password - raspberry
```

If you didn't disable password authentication for SSH earlier then you should change this password as soon as you log in.

For education's sake, let's break down the different parts of that QEMU invocation:

* Since the Pi is an ARM system, we naturally want to invoke QEMU's ARM emulator.

* We pass it the kernel image we obtained from Github earlier. 

* We specify the CPU model as arm1176, and we give the device 256M of RAM.

* The ARM board type we specify as VersatilePB.

* `-no-reboot` is necessary because without it, running commands such as sudo shutdown -h now in the guest would not in fact shut down the virtual system but would instead reboot it. Not sure why.

* We specify `-serial stdio` to allow stdin/stdout to be used for a serial connection. This isn't strictly necessary as far as I know but it's widely included in examples, and it would certainly be useful for scripting interactions with the guest OS.

* `-append` allows us to pass kernel parameters to the guest. We specify the "disk" partition it should mount as root, and we tell the system to reboot after 1 second on kernel panic. You can replace this with a larger integer to wait longer, with 0 to hang on panic, or with a negative number to make kernel panics cause an instant reboot.

* We also of course specify our working copy of the Raspbian image file as the system's primary hard drive.

* Lastly, we set up some port forwarding to allow us to connect over SSH from the host. Port 5022 on the host will be redirected to port 22 on the Pi. That lets you ssh to the guest from the host like this: `ssh -p 5022 pi@localhost`

If you want to copy your configured Pi image to a SD card, you can simply plug  in the card, use `dmesg` to find the name of its block device (we'll assume here that it's `/dev/mmcblk0`), and then write from the image file to this block device using `dd`:

```
sudo dd if=raspbian.img of=/dev/mmcblk0 bs=4M status=progress
```

And once that completes, your SD card should be all set! Note that you'll probably want to expand the filesystem once you've finished writing to the Pi, since the SD card's max size is likely a fair bit larger than this disk image. On Raspbian, the `raspi-config` utility provides a helper tool for doing that.

So, that just about does it for using QEMU to virtualize a Raspberry Pi and create custom SD card images! If there's anything you'd like to add, you know how to reach me.
