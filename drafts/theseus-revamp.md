---
layout: post
title: Theseus Revamp
---


I am considering some changes to the design for Theseus.

The big one is Tor. I've always been committed to supporting Tor, but now I am considering _requiring_ it.

Tor gives us NAT traversal for free. This is the killer feature, since reliable TCP NAT traversal is nontrivial.[^1]

[^1]: The issue of NAT traversal is one reason why UDP is often favored over TCP by peer-to-peer protocols: UDP NAT traversal turns out to be much easier than TCP NAT traversal. TCP is connection-based, and so NAT routers set up routing rules per-connection; UDP is connectionless, so routing rules are set up based on outgoing packets' source ports, which can (and usually do) remain invariant across time -- unlike in TCP.

Reliable TCP NAT traversal usually involves both peers connecting out to some third party who helps mediate the process
of forming their connection. This is not guaranteed to work -- modern protocols like STUN, TURN, etc, are pretty good,
but ultimately they depend on NAT implementation details and network topology -- and it requires compromising user
privacy, because the third party mediator gets to see who is connecting to who, and when. That is not great.

An alternative is to simply route all traffic through our helpful third party; this is what the Tor
network can offer us. Peers can simply establish themselves as Tor onion services, listen for connections through the
network, and establish connections through Tor as well.

I'd like to take a moment to underline how vital NAT traversal is for a peer-to-peer system like Theseus.

Of course, Tor provides other benefits in addition to NAT traversal. Privacy is the most obvious one. I'm not sure much
needs to be said on that: the second of five promises made [in my original post announcing Theseus](2017-02-17-theseus-robust-system-for-preserving)
was that the system would provide _guarantees of anonymity for users who need them_. I remain as committed to that
promise as ever, and as the design of the overall system crystallizes I am becoming more and more convinced that the
best way to deliver on it is through Tor.

Those are the high-level benefits. They are unsolved problems with Theseus that would be solved by always using Tor.
There are also solved problems for which more elegant solutions would be available if Tor is in use.

Some context: Previous drafts of the Theseus DHT protocol have included the idea of a _peer key_ which is used in peers'
initial Noise handshake.[^2] The motivation for these is to ensure that some non-ephemeral public key material is
involved in peers' key negotiation in order to complicate man-in-the-middle attacks. The peer key is mixed into the
underlying key material as part of a series of ECDH exchanges. The specification currently calls for these keys to use
Curve25519.

[^2]: [I wrote about these back in 2017](2017-06-11-transient-public-keys-for-resisting), though I called them _node keys_ at the time.

Tor onion services (as of version 3) are addressed using Ed25519 public keys. A public key is generated and combined
with some metadata, then base32 encoded to produce an onion address. Thus, the onion address can be base64 decoded to
recover the Ed25519 public key. This key can be converted to a Curve25519 public key with minimal effort.[^3]

[^3]: There's a good, short discussion of this topic [here](https://crypto.stackexchange.com/a/68129).

If the conversion is successful,[^4] I see no reason why not to also use the resulting Curve25519 key as our peer
key.[^5]

[^4]: My understanding is that the conversion is possible as long as $$x \ne 0$$ and $$y \ne 1$$ (which are conditions any sane crypto library should be enforcing anyway, but we should still validate these constraints ourselves). TODO: read up on this more.

[^5]: TODO explain why this is reasonable to be suspicious of, and why I don't think it's a problem because it doesn't involve anything the attacker couldn't simulate offline and therefore it should leak no extra information beyond what is available to offline cryptanalysis (i.e. hopefully little to nothing).

Deriving the peer key from the peer's contact info frees us from having to transmit these values separately. This
simplifies both the protocol spec and its implementation considerably.

Other benefits of using Tor exclusively: Sharing contact info is simpler; offering long-term points of introduction to
the network is easier than it would be if most of our peers were listening on dynamically allocated IP addresses;
relatedly, peers can rotate their identifiers whenever -- and as often as -- they choose to; the problem of accessing
Theseus on a given network reduces to the problem of accessing Tor, which has been worked on extensively (because for
many people -- activists, journalists, dissidents -- their lives literally depend on being able to access Tor reliably
without detection); and so on.

This would also change -- and potentially simplify -- our method of selecting node addresses.

Currently, node addresses are generated a specially formed input with Argon2id. The preimage consists of a timestamp in
Unix time, an IPv4 address, and 6 bytes of random noise. This design has several issues, and I've never been
particularly happy with it.

As part of this redesign, I'm inclined to change node address[^6] derivation to simply use Argon2id hashes of a peer's onion
address, keyed (or perhaps salted, depending on API availability) by (padded) Unix timestamps. Perhaps in some
situations we can even save bandwidth by returning timestamps instead of full node addresses in protocol messages.[^7]
Most of my current concerns with the node address generation model would be resolved by this change.

[^6]: AKA node IDs by most Kademlia systems' terminology.

[^7]: The trade-off here is a weird one: you'd be forcing a lot of Argon2id computations, which will have a small but real impact on device performance and power consumption; on the other hand, even if you provided node IDs directly, peers would still want to validate at least some of them -- meaning that some of those Argon2id computations would take place whether they are forced or not. There are strong arguments for both sides here -- this is one to think over for sure.

My big unresolved concern with node addresses is that the work factors for generating and validating addresses are
symmetric; validation is no cheaper than generation. We want address generation to be at least slightly hard so that
running an exhaustive search for desirable addresses is also hard. There is no need for address validation to be hard,
though -- in fact, we would prefer for it to be as easy as possible. Asymmetric proof-of-work functions built around
hard hash functions exist; hashcash and equihash are two famous examples. I am very interested in trying to introduce
some asymmetry here in order to make validation as cheap as possible while still maintaining a strong security margin.





<hr>
