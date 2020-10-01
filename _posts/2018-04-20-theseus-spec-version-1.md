---
layout: post
title: theseus protocol v1.0 overview
tags: [theseus]
---

> Previously:<br/>
> [Theseus: A Robust System for Preserving and Sharing Research]({{ site.baseurl }}{% post_url 2017-02-17-theseus-robust-system-for-preserving %})<br/>
> [Resisting Sybil Attacks in Distributed Hash Tables]({{ site.baseurl }}{% post_url 2017-02-25-resisting-sybil-attacks-in-distributed_25 %})<br/>
> [Securely Finding Friends via DHT Dead Drops]({{ site.baseurl }}{% post_url 2017-02-27-securely-finding-friends-via-dht-dead %})<br/>
> [Distributed Search in Theseus]({{ site.baseurl }}{% post_url 2017-03-21-distributed-search-in-theseus %})<br/>
> [The State of Theseus, One Month In]({{ site.baseurl }}{% post_url 2017-03-22-the-state-of-theseus-one-month-in %})<br/>
> [Theseus Protocol v0.1 Overview]({{ site.baseurl }}{% post_url 2017-04-20-theseus-protocol-v01-overview %})<br/>
> [Bloom Filter Parameters for Distributed Search]({{ site.baseurl }}{% post_url 2017-06-09-message-encryption-in-theseus %})<br/>
> [Message Encryption in Theseus]({{ site.baseurl }}{% post_url 2017-06-09-message-encryption-in-theseus %})<br/>
> [Resisting Man-in-the-Middle Attacks in P2P Networks]({{ site.baseurl }}{% post_url 2017-06-11-transient-public-keys-for-resisting %})<br/>


I just published Version 1.0 of the Theseus DHT Protocol specification. This is especially exciting because it went live on Friday evening, April 20th -- which just happens to be the one-year anniversary of the version 0.1 spec's publication.

The 1.0 spec contains a number of important changes, and reflects a lot of conceptual and material improvements to the design that I've been able to come up with over the last year. I don't expect to have to make any more changes to the spec before finishing a 1.0 version of [the actual implementation](https://github.com/wootfish/theseus.dht).

There's still a long way to go as far as implementing everything described here, but publishing an authoritative spec for reference is a big step forward and I'm really excited about how far this project has come and where it's headed.
