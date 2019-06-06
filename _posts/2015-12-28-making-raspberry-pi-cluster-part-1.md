---
layout: post
title: Making a Raspberry Pi Cluster's Rack
---


<br/>
<div class="separator" style="clear: both; text-align: center;">
<a href="{{site.baseurl}}/assets/img/2015-12-28-1.jpg">
<img src="{{site.baseurl}}/assets/img/2015-12-28-1.jpg" class="img-fluid mx-auto d-block"/>
</a>
The frame, fully assembled, with trays.</div>
<br/>

It's hard to play with a Raspberry Pi and _not_ wonder what you could do with a bunch of them wired together. We're talking about tiny computers with 1GB RAM, a quad-core 900MHz processor, and a GPU, all on a credit card-sized board. They're not too far off, specs-wise, from the ThinkPad X60 I'm typing this post on. All that with a $40 price tag -- how could you not want as many as possible?

It probably wouldn't surprise anyone who knows me to hear that I've been working on doing exactly this: wiring a bunch of Raspberry Pis into a cluster for distributed computing. I've now collected enough of the hardware that the big priority is building a rack to keep it all organized. There are a bunch of cool [Pi cluster](http://www.element14.com/community/community/raspberry-pi/blog/2013/05/21/33-node-beowulf-cluster-using-raspberry-pi) rack designs out there. One [3D-printed design](https://hackaday.io/project/5456-raspberry-pi-rack) stands out in particular, both for the idea behind it and the implementation. I considered a few different designs, but none were a perfect match for my goals. In the end, it seemed like the best option was to roll my own rack.

Every design is tuned to the resources available to its designer. Being at my family's house for a week over winter break, I had a seven-day window of access to my dad's wood shop, his CNC machine, and his help. Naturally, I was inclined to take full advantage of all three. First of all, though, came deciding what exactly it was we would make.

<br/>
# Design

A few different design constraints are involved here. I wanted every Pis easy to access or remove. I wanted the finished product to look nice. I wanted to keep the footprint small, because this thing is probably going to live on my desk. It was also important to make sure the design wouldn't restrict airflow, because this cluster will be running some long jobs without heavy-duty heat sinking. Lastly, budget dictated no more than an eight-board setup.

I decided to power over USB, because my understanding is that the Pi has a protective self-resetting fuse in line with the USB power input. This fuse keeps power supply malfunctions from permanently destroying your board, but powering over GPIO seems to bypass this protection. I didn't put too much time into verifying this info, since I heard it from a trusted source, and in any case powering the boards over USB from a couple externally powered hubs is also nice and simple. If I ever decide to overclock these boards (and, let's be real, that's happening sooner or later), I'll probably enlist some help and make a custom power supply to deal with the increased power demands at that point. Maybe [mount some heat sinks](http://www.michaeldornisch.com/2012/06/diy-raspberry-pi-heat-sink.html), too.

These parameters together with the tools available led me to the design you saw above. It's a vertical rack of five trays: on the bottom, a tray for USB hubs and an 8-port Ethernet switch; above it, four trays, all set up to mount two Pis each. Each Pi mount point also has an elliptical hole to promote airflow. It seemed important not to neglect either side of the boards ventilation-wise, since both sides of the Pi 2 have important chips on them (CPU and GPU on top, RAM on bottom). The Pis are rotated 180 degrees from each other, so that both have their Ethernet port and USB power input exposed.


<br/>
<div class="separator" style="clear: both; text-align: center;">
<a href="{{site.baseurl}}/assets/img/2015-12-28-2.jpg">
<img src="{{site.baseurl}}/assets/img/2015-12-28-2.jpg" class="img-fluid mx-auto d-block"/>
</a>
The final design.</div>
<br/>


The Pis dictated the dimensions of the trays, which in turn dictated the dimensions of the wooden frame. The frame, assembled from square cuts of 3/4-inch-thick mahogany, ended up with a footprint of just about 7.5x5in (disregarding backstops), and a standing height of 9.5in. After cutting as many square beams as possible from the board, there was a thin strip left; we cut from this two more 9.5in pieces and used these as backstops.

<br/>
# Assembly

It was only in hindsight that I realized how simple this process really is. The vast majority of our time was spent not on woodworking but on trying to troubleshoot the CNC machine toolchain. There don't seem to be nearly enough mature open-source projects in this domain. This is an area where a few dedicated programmers could make a respectable impact. The process of setting up a working toolchain was so painful that I'm not going to say another word about it, except to note for posterity that when we did get things working it was using the proprietary tools provided by the manufacturer (Shapeoko) start-to-finish. One wishes that there could be a better way.


<br/>
<div class="separator" style="clear: both; text-align: center;">
<a href="{{site.baseurl}}/assets/img/2015-12-28-3.jpg">
<img src="{{site.baseurl}}/assets/img/2015-12-28-3.jpg" class="img-fluid mx-auto d-block"/>
</a>
The CNC machine, hard at work cutting a tray.<br/>Not pictured: hours and hours of troubleshooting.</div>
<br/>


Anyway! Enough of that. The tray design ended up being pretty simple -- two pairs of four screw holes lined up to the Raspberry Pi's [mount hole dimensions](https://www.raspberrypi.org/wp-content/uploads/2014/07/mechanicalspecB+.png) (link is to B+ measurements, but the Pi 2's hole spacing is identical). With those set to mill, it's time to cut some wood! We had this nice, light, 3/4-inch-thick mahogany lying around, so we used that, cutting as much as possible into square rods and cutting these rods down to the various lengths needed (four each at 3.5in, 6in, and 9.5in). This left a thin residual strip from the end of the board, which we later cut into backstops. But before backstops come tray slots, and before tray slots, the frame's sides need to be assembled.

The sides were easy enough to build: just take the relevant cut-to-size pieces (after sanding them reasonably smooth!), measure out whatever ground clearance you might want, glop some wood glue onto the points of contact, press everything together, slap on some clamps, and let it sit for a good long while.


<br/>
<div class="separator" style="clear: both; text-align: center;">
<a href="{{site.baseurl}}/assets/img/2015-12-28-4.jpg">
<img src="{{site.baseurl}}/assets/img/2015-12-28-4.jpg" class="img-fluid mx-auto d-block"/>
</a>
Letting it sit.</div>
<br/>


Cutting the slots is easy, too, if you have a tablesaw: just measure & mark the slot locations, lower the blade so it extends from the table by however deep you want the slots to be, and [gouge away](https://www.youtube.com/watch?v=BDHidMlViMc). I opted to be sort of generous with the cut depth (after all, better too wide than too narrow), but what I've come to realize is that the tolerance used here has a surprisingly big impact on how cleanly the trays slide in. It pays to be as accurate as possible.

Once the slots are cut, it's time to glue up the other four crosspieces and bring the whole frame together. This step was a bit tricky, since all four beams have to be left to set at roughly the same time in order to keep everything nicely aligned, which turns out to be easier said than done. The problem is that once two pieces are in and clamped down, the remaining ones get progressively harder to wedge in without losing most or all of their wood glue. I really don't have any better advice than to use generous amounts of glue (remember that spillover can always be cut/scraped/sanded off) and to have two pairs of hands involved: one person gently pulling the soon-to-be contact points apart, and another person to put the new beam in and get it lined up just right.


<br/>
<div class="separator" style="clear: both; text-align: center;">
<a href="{{site.baseurl}}/assets/img/2015-12-28-5.jpg">
<img src="{{site.baseurl}}/assets/img/2015-12-28-5.jpg" class="img-fluid mx-auto d-block"/>
</a>
Do not disturb.</div>
<br/>


Once this glue cures, the frame's complete except for backstops. These really could not be easier to attach, especially compared to what came before them.

After that, all that's left to do is sand this puppy _damn_ smooth and slap on some finish. This wood took the finish well, each coat drying pretty quickly. We put on about four or five coats (who counts?), continuing until it looked good, then sanded it down and added a final layer.


<br/>
<div class="separator" style="clear: both; text-align: center;">
<a href="{{site.baseurl}}/assets/img/2015-12-28-6.jpg">
<img src="{{site.baseurl}}/assets/img/2015-12-28-6.jpg" class="img-fluid mx-auto d-block"/>
</a>
A delicate process.</div>
<br/>


Oh -- there is one more thing left to do, and that's to mount the Pis on their trays. As you can see, we hit a slight snag here:


<br/>
<div class="separator" style="clear: both; text-align: center;">
<a href="{{site.baseurl}}/assets/img/2015-12-28-7.jpg">
<img src="{{site.baseurl}}/assets/img/2015-12-28-7.jpg" class="img-fluid mx-auto d-block"/>
</a>
Asymmetry...adds character?</div>
<br/>

If you think it looks like those boards are missing half their standoffs, you're absolutely right. Here's what happened. We drew up our parts list for screws, standoffs, nuts, and washers, and rolled on down to the local hardware store (Stone Way Hardware, great place). Tracking down the 2.5mm hardware took a while, since just about nobody except computer & electronics hobbyists use this stuff... arguably for good reason. Turns out the stock was pretty sparse. We asked if they might have more "in the back". No such luck. The clerk commented, after hearing the amounts we were looking for, that we wanted as many of these components as they sold in about two years. He didn't seem particularly moved by the chance to get two years ahead of quota. In the end, we had to make due with half of everything.

Fortunately, it only really takes two screws & standoffs to do a "good enough" job of mounting a Pi if you install them diagonally from each other. It's not pretty, but it works. The boards are mounted and stable now, but I definitely plan to get the rest of the hardware at some point down the road. It'd put less strain on the boards, and it'd just look better besides. Maybe I'll check back in at Stone Way in a couple years.


<br/>
<div class="separator" style="clear: both; text-align: center;">
<a href="{{site.baseurl}}/assets/img/2015-12-28-8.jpg">
<img src="{{site.baseurl}}/assets/img/2015-12-28-8.jpg" class="img-fluid mx-auto d-block"/>
</a>
The rack, with a network switch in its tray and 6 out of 8 Pis mounted.</div>
<br/>
