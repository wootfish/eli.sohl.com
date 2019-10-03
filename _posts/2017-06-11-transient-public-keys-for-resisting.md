---
layout: post
title: Resisting Man-in-the-Middle Attacks in P2P Networks
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


In the previous post, _Message Encryption in Theseus_, I outlined how on top of robust encryption, Theseus can handle optional public-key authentication. This authentication gives us a way of defeating man-in-the-middle (MitM) attacks, but only if at least one of the communicating peers trusts a key possessed by the other. Since most interactions in peer-to-peer networks take place between total strangers, this limitation carries with it some unpleasant drawbacks.

One solution would be to have peers vouch for each other. For instance, when replying to a query with a list of peers, one could include not only the listed peers' contact info but also their public key fingerprints. Then when the querying peer connects to a new peer from this list, they could request the new peer's public key, check it against the provided fingerprint, authenticate using the key if it matches, or bail out or degrade their trust in the connection if the fingerprint and key don't match.

This seems like it would work, but at the cost of necessarily sharing public key identity information very promiscuously. If these are long-term identity keys we're talking about, then that's a big problem as far as anonymity, deniability, etc are concerned. As discussed in the previous post, it makes sense from a privacy angle to be reluctant to share long-term identity information with anyone you don't have a mutual trust relationship with.

That's no reason, though, why we couldn't add dedicated keys for this purpose. Since the term "ephemeral key" is already taken,  let's call these, say, "node keys".

A peer could generate a node key immediately before first connecting to the network and have this key last only as long as their session does. They could share the key with anyone they connect to, but avoid explicitly associating it with their long-term cryptographic identity (e.g. by authenticating using both keys _only_ with well-trusted remote peers, if ever). The only thing this key ever gets explicitly associated with is the peer's contact info. It would probably make sense to put an upper limit on the lifespan of such keys -- maybe six or twelve hours.

What is accomplished here? Man-in-the-middle attacks are made considerably more difficult and complex. What would it take to carry out a successful MitM attack with this system in place? That's a good and tricky question, the answer to which depends somewhat on the goal of the attack.

If the goal is to read and potentially alter all traffic sent to or from a specific peer, the MitM attack would have to intercept all encrypted traffic to or from that peer, swap out the keys used for all ephemeral ECDH handshakes, actively replace the advertised node key with an attacker-controlled key every time it is sent, alter the contents of all re-handshake negotiation messages to reflect the attacker-controlled key, and actively MitM those extra handshakes as well.

Such an attack is not impossible, of course, but it would require considerable resources, and if a connection can be established with even one trusted peer then the attack can be detected. The attacker could of course attempt to close the trusted peers' connection prior to their authentication to prevent this -- but that would likely seem suspicious in and of itself.

Note that the impact of malicious nodes lying about other nodes' node key fingerprints when returning contact info is minimal, since they don't really accomplish much that they couldn't've also accomplished by refusing to refer those nodes in the first place. Really, the worst case scenario is that the connecting node comes to believe that something malicious is taking place -- which, since they were just talking to a malicious node, is actually correct.
