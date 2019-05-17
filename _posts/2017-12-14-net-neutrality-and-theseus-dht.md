---
layout: post
title: Net Neutrality and Theseus DHT
---

The design for Theseus, as it stands, consists of a distributed hash table (DHT), a torrent client, a distributed search algorithm, and a web-based UI. Until now, I'd been developing everything as one monolithic entity. The purpose of this blog post is to make two announcements: first, that I'm going to be breaking out Theseus DHT into a stand-alone software package; second, that I'm setting a hard release date for this package: New Year's Eve.

If you're interested, I'm going to go ahead and spend a little time discussing the motivations behind this decision.

The main result of breaking out the DHT like this is that anyone who needs a robust, secure distributed hash table can just plug this one into their project and be good to go. And, of course, it'll come with full documentation, so anyone wanting to develop their own libraries will have everything they need to do so.

This is exciting and a little bit scary. After all, the DHT library isn't actually done yet. But deadlines are among the strongest motivating forces I know, so it makes sense to put this project on one.

There are some technical reasons why I'm making the DHT a free-standing component, and there are some political reasons as well.

I'm writing this on the eve of the FCC's net neutrality vote. I fully expect them to vote to repeal what little protections we have in place. This is a deeply immoral act, and one which will have far-reaching consequences. It falls to those of us who see the potential of a free, open internet, who recognize the internet's cultural and educational power, to do everything we can to resist.

Virtually every step in the internet's evolution has been unexpected, and every step of the way the companies responsible for its infrastructure have proven their inability to understand the new technologies that're keeping them in business. The first major competitors to AT&T's deep-sea cable monopoly didn't even realize they were building internet infrastructure -- even in the late 90s, they still thought they'd be making most of their money off phone calls. Unbeknownst to them, of course, society had other plans.

So it was then, and so it is now. ISPs are trying to claim control of the internet, essentially claiming that because they own the cables you send data through to access web sites, they should get to decide which sites you go on and how slow those sites will load. That's about as fair as a dealership trying to say where you can or can't drive and remotely disabling your car if you refuse to listen.

The response to this move has been fast and clear. The public is virtually unanimous in opposing the loss of net neutrality: calling our elected officials, submitting pro-net-neutralty public comments to the FCC, leveraging analytics to reveal many anti-net-neutrality comments as having been [faked](https://www.gravwell.io/blog/discovering-truth-through-lies-on-the-internet-fcc-comments-analyzed), raising awareness through social media, writing articles -- an amazing show of effort and unity, and one which will almost certainly be for nothing, because the FCC has been bought.

What comes next? Defense.

There are ways to circumvent this exploitative behavior. Using a VPN, using Tor, or getting your connection from a local ISP that has explicitly committed to respecting your rights -- any of these can help, though none are perfect solutions.

In the end, what this comes down to is a design failure. There is _no need_ for the carrier of network traffic to know what sort of traffic they are carrying, and yet many of the protocols the Internet is built on readily give up this data -- largely because their authors didn't (or don't) know any better. Not that I'm criticizing them -- after all, even just ten years ago the internet was a very different place.

We don't want to leave those days behind, but it's time to face facts, and the fact is that modern protocols need to be designed with the full awareness that _the network is under constant surveillance_. This means we need strong encryption, strong authentication wherever possible, and _strong resistance to fingerprinting_.

After all, they can't selectively throttle your traffic if all your traffic looks the same.
To a passive observer, all Theseus DHT traffic is indistinguishable from random noise. Even message sizes can be made to follow arbitrary patterns or no pattern. All of this makes the protocol very hard to fingerprint. The DHT also offers resistance to man-in-the-middle attacks (assuming a trusted introduction to the network) and offers unparalleled resistance to Sybil attacks. You can read more about that [here](http://sohliloquies.blogspot.com/2017/02/resisting-sybil-attacks-in-distributed_25.html).

If other applications adopt Theseus DHT, then a user's presence in the DHT peer swarm doesn't even reveal that they're using Theseus -- they could be using any of the apps that plug into the DHT.

The network's ability to detect and mitigate Sybil attacks increases as the network itself grows, which is another reason for opening up Theseus DHT as a stand-alone entity. I want people to use this, because the more people we have using it, the stronger it gets. Everyone wins.

I wish we lived in a world where these sorts of measures were unnecessary. But if they are necessary, then let's make them great.
