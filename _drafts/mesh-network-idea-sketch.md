---
layout: post
title: Idea Sketch for a Mesh Network Protocol
---


Here's an idea for a mesh networking protocol that might actually scale well. The core construct is simple enough that I can't help but wonder if someone else has already come up with it. I hope they have -- it'd be nice if someone else had already done the legwork of implementing it, too! -- but just in case I'm the first, here's a description of what I had in mind. If you can point me to prior art, please feel free to email or DM me so I can add a link to it!

This is not a full specification, just the sketch of an idea. It's light on details in some areas because I'm not an expert and I know my limits. I am open to suggestions, though :)

So, here's the idea at a high level: First off, do away with global addressing. It just doesn't scale. Past a certain point you end up saturating your network's bandwidth just trying to maintain consistent routing info under heavy peer churn. That's no good.

There is no construct for saying, _"I would like to open a connection to the computer at this address"_. Instead, there is a construct for saying _"I am interested in connecting to anyone who is also interested in this address"_. Rather than using addresses to uniquely identify endpoints and initiate connections, use them to set up _rendezvous points_ which can serve as _points of introduction_ for peers in the network.

Note that this still allows point-to-point connections to be established, if a rendezvous point is derived from a shared secret. For instance, if you and I have a shared secret (maybe derived from ECDH on our public keys, or from one of us scanning a QR code on the other's phone, say), we could derive an address from that secret. Then, we both look up the rendezvous point, and ask the peers responsible for it to put us in contact with anyone else who is doing the same thing.

In addition to point-to-point connections, though, this allows for many-to-many relations to be easily formed.
