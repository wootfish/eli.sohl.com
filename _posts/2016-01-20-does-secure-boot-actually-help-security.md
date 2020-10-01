---
layout: post
title: does UEFI Secure Boot actually help security?
---

> This is the second installment in a two-month series of posts on the intersection of politics and technology, written for a class at Western Washington University. The series consists of two bookend posts with four focused discussions in between; this is the first discussion. You can find the other posts [here]({{ site.baseurl }}{% post_url 2016-01-15-politics-in-software %}), [here]({{ site.baseurl }}{% post_url 2016-01-29-sharing-economy-apps-and-new-bottle %}), [here]({{ site.baseurl }}{% post_url 2016-02-12-ignoring-abuse-on-your-social-platform %}), [here]({{ site.baseurl }}{% post_url 2016-02-19-you-cant-legislate-reality %}), and [here]({{ site.baseurl }}{% post_url 2016-02-26-software-in-politics %}).

<br/>

You know, BIOS gets a bad rap. Most people only know it by the splash screen they see when they first boot up, and if they ever have to actually interact with it, what they find is often downright jarring. Flat colors? Keyboard-only navigation? Didn't we leave all this behind decades ago?

Maybe we did in higher-level systems, but not here. And if we're being honest, I've always had a soft spot for those tacky, old-school ASCII menus. They're kind of cute. And UEFI, the successor to BIOS, is so user-friendly it creeps me out a little bit -- you can even use a mouse in it! What kind of low-level interface supports a mouse?

I do have to admit, though, that UEFI fixes some important problems. It can boot from multiple-terabyte hard drives, which apparently people need these days. It has networking capabilities that BIOS couldn't dream of. UEFI is more broadly portable across different processors, which helps with security and stability.

That's the good. There's also lots of bad. We could talk about UEFI's negligence towards long-standing device driver issues, but that's nothing next to Microsoft's darling, the UEFI "Secure Boot" feature. Secure Boot is borderline functional for Windows users and an unmitigated disaster for everyone else.

The problem Secure Boot was meant to solve is a classic security issue called the "Evil Maid Attack". As [Bruce Schneier explains it](https://www.schneier.com/blog/archives/2009/10/evil_maid_attac.html):

> Step 1: Attacker gains access to your shut-down computer and boots it from a separate volume. The attacker writes a hacked bootloader onto your system, then shuts it down.
>
> Step 2: You boot your computer using the attacker's hacked bootloader, entering your encryption key. Once the disk is unlocked, the hacked bootloader does its mischief. It might install malware to capture the key and send it over the Internet somewhere, or store it in some location on the disk to be retrieved later, or whatever.

In essence, if you encrypt your hard drives with a password only you know, an attacker couldn't access those drives -- but that doesn't stop them from rewriting the piece of code that asks you for the password! If you don't notice realize what's going on until after you've unlocked the drive, that's [game over](https://www.youtube.com/watch?v=dsx2vdn7gpY).

Secure Boot tries to prevent this using what're called [crypographic signatures, or digital signatures](https://en.wikipedia.org/wiki/Digital_signature). Just like signing your name is something that (supposedly) only you know how to do, a cryptographic signature is something only you (with the help of your computer, which has a big personal secret number saved on it) can generate.

You can cryptographically sign any piece of data, and that signature can serve as your personal seal of approval. Anyone can check that your signature on a file is valid, but they can't forge your signature. And if the file changes, your signature won't match it any more, so it's hard to get tricked into signing the wrong thing. As you can probably imagine, these signatures are really useful. For example, all major flavors of Linux use these signatures when installing software to make sure their downloads weren't corrupted or tampered with in transit.

So, what if we get the people who wrote our bootloader to cryptographically sign it, and we make UEFI check the signature and sound the alarm if it doesn't match? If your Windows bootloader is signed by Microsoft, you know you can trust it not to steal your password (well, that's not entirely true, but only because [Microsoft is creepy](https://theintercept.com/2015/12/28/recently-bought-a-windows-computer-microsoft-probably-has-your-encryption-key/)). If someone overwrites that bootloader, the signature won't match, and UEFI can warn you of shenanigans and bail out.

This might seem like a fine idea, but it has some bad consequences. Microsoft is vehement about manufacturers enabling Secure Boot and setting it to only accept Microsoft's signature if they want to ship Windows on their hardware. That prevents the computer from loading anything except Microsoft-signed code, meaning that with secure boot enabled, those computers _would only be able to run Windows_. Regardless of Microsoft's claims to the contrary, this is a blatant attempt at promoting [lock-in](https://en.wikipedia.org/wiki/Vendor_lock-in). The open-source community was, and is, [less than thrilled](http://www.pcworld.com/article/248342/windows_8_secure_boot_the_controversy_continues.html).

_"So"_, you might ask, _"why not just set UEFI to accept Linux developers' signatures instead?"_ The answer is that, more often than not, you can't. Most if not all hardware manufacturers' UEFI implementations don't provide that option. _"Why not have manufacturers bake the developers' keys in, then?"_ Well, in favor of that we have open-source geeks, and opposed to it we have Microsoft. One of these groups holds more influence than the other.

[There do exist workarounds](http://www.zdnet.com/article/shimming-your-way-to-linux-on-windows-8-pcs/), but they're inconvenient and far from universal. More than that, the need for a workaround rather than the presence of a solution represents a toxic shift away from openness. This is why some have advocated renaming Secure Boot as "Restricted Boot".

Microsoft's official stance is that people who don't like Secure Boot being limited to Microsoft signatures can just disable the feature. This makes about as much sense as forcing a subletter to use a room lock whose key you've copied and telling them that if they aren't comfortable with that, they could always just not use a lock at all.

And astoundingly, most of the big players in this debacle have completely ignored the fact that there are better defenses against Evil Maid -- for example, [this approach that Joanna Rutkowska outlined five years ago](http://theinvisiblethings.blogspot.co.uk/2011/09/anti-evil-maid.html).

This situation has been developing since before UEFI even hit the market. [Boot security still sucks](https://mjg59.dreamwidth.org/39339.html), but it's marginally improving. For that, we have organizations like the [Free Software Foundation](https://www.fsf.org/campaigns/secure-boot-vs-restricted-boot/statement) and dedicated developers like [Matthew Garrett](https://en.wikipedia.org/wiki/Matthew_Garrett) (who wrote the workaround linked above -- and who turns out to be [just as much of a righteous dude](https://mjg59.dreamwidth.org/32778.html) in non-UEFI matters) to thank. Microsoft doesn't seem to be coming to its senses any time soon, but hopefully boot security will continue to improve in spite of their influence.
