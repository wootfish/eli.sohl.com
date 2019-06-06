---
layout: post
title: Message Encryption in Theseus
---

> Previously:<br/>
> [Theseus: A Robust System for Preserving and Sharing Research]({{ site.baseurl }}{% post_url 2017-02-17-theseus-robust-system-for-preserving %})<br/>
> [Resisting Sybil Attacks in Distributed Hash Tables]({{ site.baseurl }}{% post_url 2017-02-25-resisting-sybil-attacks-in-distributed_25 %})<br/>
> [Securely Finding Friends via DHT Dead Drops]({{ site.baseurl }}{% post_url 2017-02-27-securely-finding-friends-via-dht-dead %})<br/>
> [Distributed Search in Theseus]({{ site.baseurl }}{% post_url 2017-03-21-distributed-search-in-theseus %})<br/>
> [The State of Theseus, One Month In]({{ site.baseurl }}{% post_url 2017-03-22-the-state-of-theseus-one-month-in %})<br/>
> [Theseus Protocol v0.1 Overview]({{ site.baseurl }}{% post_url 2017-04-20-theseus-protocol-v01-overview %})<br/>
> [Bloom Filter Parameters for Distributed Search]({{ site.baseurl }}{% post_url 2017-06-09-message-encryption-in-theseus %})<br/>


<br/>
# Brief Summary

Theseus will use the [Noise Protocol Framework](https://noiseprotocol.org/noise.html).

This will allow all network traffic to be encrypted, with flexible authentication and many other desirable properties as detailed below.

This post explicitly obsoletes the [Theseus Protocol v0.1 Overview](http://sohliloquies.blogspot.com/2017/04/theseus-protocol-v01-overview.html). That overview deliberately lacked specifics on message encryption. It was expected that said specifics would necessitate some changes, and this has indeed proven to be the case. A v0.2 specification is forthcoming.

<br/>
# Background

Prior to learning of the Noise protocol framework I was (with considerable trepidation) planning on designing a custom cryptographic protocol modeled closely on OTR and Signal but with modifications to fit our use case. Both of those protocols came close but ultimately fell just short of satisfying the rigorous and slightly unusual security parameters Theseus is aiming for.

Desired properties for the encrypted channel established by this protocol include the standard [AE]("https://en.wikipedia.org/wiki/Authenticated_encryption") fare, namely [confidentiality](https://en.wikipedia.org/wiki/Confidentiality), [integrity](https://en.wikipedia.org/wiki/Data_integrity), and [authentication](https://en.wikipedia.org/wiki/Message_authentication). On top of these properties, we desire [forward secrecy](https://en.wikipedia.org/wiki/Forward_secrecy) and strong resistance to surveillance.

By strong resistance to surveillance, I mean all of the above plus several more properties: traffic analysis should yield little to no information, with message lengths and traffic patterns leaking minimal data and protocol traffic indistinguishable from randomness; relatedly, the protocol must be as hard as possible to fingerprint; and lastly, the cryptographic identities of the participants must be hidden from passive observers.

Efficiency, simplicity of design, and avoidance of bloat are also all high priorities. The last and perhaps most troublesome requirement is that authentication be _optional_, since parties may variously desire mutual, one-way, or no authentication depending on context. The protocol should be able to handle all three (or four, depending on how you count) of these cases straightforwardly and securely.

Startlingly few protocols even come close to meeting these criteria; virtually none meet all of them. Note in particular that cryptographic mainstays like TLS clearly fall short, as do standard message-based protocols like OTR and Signal (albeit by much smaller margins).

As I've mentioned before, the conventional wisdom concerning crypto algorithms and protocols is: whatever you do, don't roll your own. Unable to find any existing protocol meeting all our desired security properties, I was on the verge of breaking this advice and rolling a custom protocol when I discovered the Noise Protocol Framework, which describes something remarkably close to (though considerably better-designed than) what I had in mind -- something which effortlessly provides every property listed above and a few more for good measure. I'm amazed that it isn't more well-known. See the Github wiki's list of [properties and protocol comparisons](https://github.com/noiseprotocol/noise_spec/wiki/Noise-properties-and-protocol-comparisons). Having now reviewed the [specification](https://noiseprotocol.org/noise.html) in full, I really could not be happier or more impressed by the work that's clearly gone into it.

Noise is less a concrete protocol and more a framework for assembling protocols by mixing and matching stand-alone components in robust ways. What follows are some specifics on how Noise will be used in Theseus.

<br/>
# Handshake and Message Encryption

As mentioned before, a primary goal is to avoid any features that could lead to easy protocol fingerprinting. Negotiating handshake parameters (such as e.g. ciphers) in the clear would obviously violate this design principle. What we'll opt for here is to specify a _default_ handshake parameterization to first establish an encrypted channel, and allow users to optionally re-negotiate a second handshake once communicating within this channel. This allows us to encrypt absolutely everything aside from an initial exchange of ephemeral public keys, (which can be encoded to appear as random).

The default handshake will be an exchange only of ephemeral keys, i.e. the `Noise_NN` pattern. Future handshakes negotiated within this channel may be of the patterns `Noise_NK`, `Noise_KN`, or `Noise_KK`, with an [optional extra PSK](https://noiseprotocol.org/noise.html#pre-shared-symmetric-keys) potentially determined during negotiation and applied via the `psk0` modifier.

The default ciphersuite will be Noise448, which specifies ChaCha20/Poly1305 for AE and the conservatively-defined Ed448-Goldilocks curve for elliptic curve operations. We'll have the default hash function be SHA512.

Thus the protocol name for Theseus's default Noise protocol is `Noise_NN_448_ChaChaPoly_SHA512`.

If peers wish to negotiate future handshakes, these may be any of: `Noise_NK_448_ChaChaPoly_SHA512`, `Noise_KN_448_ChaChaPoly_SHA512`, `Noise_KK_448_ChaChaPoly_SHA512`, `Noise_NKpsk0_448_ChaChaPoly_SHA512`, `Noise_KNpsk0_448_ChaChaPoly_SHA512`, `Noise_KKpsk0_448_ChaChaPoly_SHA512`.
Later versions of the Theseus protocol may expand this list, in particular potentially expanding the list of permitted ciphersuites. The handshake re-negotiation is designed to gracefully support such extensions.

One last note: Noise specifies a max message size of 65535 bytes, with the handling of larger messages being considered an application concern. As such, Theseus will prepend total message length to all plaintexts as a 16-bit big-endian integer, as [recommended in the framework specification](http://noiseprotocol.org/noise.html#application-responsibilities).

<br/>
# Handshake Re-Negotiation

Once an encrypted channel has been established using ephemeral keys, peers may optionally use this channel to negotiate authentication. Once they agree on parameters like a handshake protocol name and which public keys they wish to use in authentication, they may discard their current CipherState objects and, within the same TCP connection, start from scratch executing a new handshake using the previously agreed-upon keys (and, optionally, a similarly agreed-upon PSK).

The challenge for re-negotiation is that two peers must agree on three things:

1. What sort of authentication to use (`Noise_NK`, `Noise_KN`, or `Noise_KK`).
2. What public keys to use in the handshake
3. Whether to include a PSK, and if so, what its value should be.

The difficulty is that some peers may understandably be reluctant to advertise to a total stranger the list of all public keys by which they are willing to authenticate. Doing so would have obvious and severe ramifications where anonymity is concerned. As such, a peer may be willing to authenticate using a given key if _and only if_ the remote peer demonstrates prior knowledge of this key, and/or if the remote peer is also willing to authenticate using a specific key of their own.

Note that such a model would not _completely_ obviate the abovementioned privacy concern -- what it does is reduce the issue from peers promiscuously advertising identity keys to those peers exposing what is essentially an oracle by which an attacker could _test_ whether the remote peer is willing to authenticate using a single given key.

Of course, abuse of this oracle should be very easy to detect, and this solution is still leagues better than promiscuous broadcast, but the issue is still worth pointing out as both an informational note and an acknowledgement that there may be room for further improvement here.

We'll define two protocol messages which together allow for re-negotiation without unnecessarily promiscuous disclosure of information: `handshake_suggest` and `handshake_request`.

Messages of the former type are purely informational and may be exchanged any number of times. Their purpose is to communicate re-handshake parameters that the sending party would find acceptable.

A message of the latter type specifies concrete re-handshake parameters. If the remote peer finds these parameters unacceptable, it may reply with an error code. A non-error response indicates that the remote peer accepts the re-handshake parameters.

As soon as acceptance is indicated, both peers should discard their existing protocol state, remembering only the agreed-upon parameters for the new handshake, and the new handshake should then be carried out, with the party who first sent the `handshake_request` message serving as the handshake initiator.

We'll defer on providing a precise specification of the parameters of `handshake_suggest` and `handshake_request` pending the v0.2 spec draft.

<br/>
# Miscellaneous Considerations

### Public Key Disclosure

As discussed above, some parties may be reluctant to disclose their public keys to an unauthenticated third party. If both peers harbor this concern, a curious impasse is reached. This is a hard problem to crack, with a number of seemingly obvious solutions harboring non-obvious but fatal flaws. The idea of an approach involving zero-knowledge proofs seems promising but threatens to introduce to the protocol worrying levels of complexity for marginal benefit. This might be an interesting problem for a particularly sharp and motivated contributor to spend some time mulling over.

### In-Order Message Delivery

Just as an aside, it's worth noting that the vanilla Noise framework works best in environments guaranteeing in-order delivery of messages. Out-of-order delivery could lead to legitimate messages being decrypted with the wrong key material, causing them to appear invalid. Other protocols such as Signal and OTR face a similar problem and solve it by various means such as order-specifying message headers. These approaches solve the problem but also introduce trivially-recordable metadata and make the protocol significantly easier to fingerprint -- both undesirable properties.

Applications using Noise in spaces where in-order delivery is not guaranteed typically seem to solve the problem by precomputing a certain number of keys and thus maintaining a sliding "window" within which they can gracefully handle out-of-order delivery, i.e. if you precompute five keys ahead then you can handle out-of-order delivery as long as the delivery order doesn't place any message more than five notches away from its spot in the intended message order.

I mention all this purely for informational purposes, as the Theseus control protocol -- the component of the system using Noise -- will operate over TCP, which guarantees in-order message delivery.

### Man-In-The-Middle Attacks

Authentication is necessary whenever possible in order to defeat man-in-the-middle attacks, which can otherwise straightforwardly bypass Diffie-Hellman of both the traditional and elliptic-curve varieties. The initial handshake, in which only ephemeral keys are exchanged and therefore no cryptographic statements of identity are made by either party, is thus vulnerable to man-in-the-middle compromise by an active attacker. There isn't really any way around this, since we need to support connections between complete strangers (who obviously won't know or trust each other's public keys, and thus have no easy way of authenticating to one another).

Note that if either party authenticates to the other, the success of this authentication would necessarily indicate the absence of a man-in-the-middle attack. Note further that if an active MitM attacker were to interfere with the re-handshake negotiation, the most harm they could do would be to either cause the second handshake to fail or else prevent it from happening at all.

Of course, if an attacker is in control of a public key well-trusted by a given peer, then naturally the attacker can impersonate the identity associated with this key to this peer and carry out a man-in-the-middle attack in this way. Dealing with such a threat is well beyond the scope of this post (and if you have any ideas how to do it, I'd buy you a beer...)

Note that the authentication model described above makes no mention of public key roles, leaving itself open to supporting basically any trust model a given client may wish to adopt. This is intentional, for flexibility's sake. Consider it a form of future-proofing. I do have some ideas on a reasonable baseline method of managing public-key identities to get some of their benefits without needlessly compromising anonymity; this'll likely be the subject of my next post.

### Explicit Connection-Ending

The Noise protocol specification suggests that an explicit way of indicating end-of-connection be included at the application level, to give applications a way of distinguishing between benign disconnects and attacker interference. This is a good idea which will be included in the v0.2 Theseus spec draft.

### Implementation

The intent is to implement Theseus in Python 3. It is therefore worth mentioning Python 3 does not yet have a library for Noise, though there is an [ongoing project](https://github.com/jhwgh1968/noiseproto-python) to implement one though bindings to the C reference implementation via ctypes. The library appears to be under active development, with Python 2.7 support available and Python 3 support in progress.

### Protocol Fingerprinting & Info Leaks

One fantastic property of the Noise protocol is its resistance to fingerprinting. True to its name, virtually all protocol traffic is indistinguishable from random noise, although this varies somewhat depending on context: for instance, handshakes that lead with long-lived public identity keys provide identifiable data to a knowledgable adversary, and public keys either ephemeral or long-lived can be identified as such with reasonable confidence unless they are cleverly encoded using a scheme such as Elligator. These schemes tend to come with complications of their own, but that's a story for another time.

Note that even if message contents are indistinguishable from random noise, message _sizes_ and _traffic patterns_ still convey some data to the attacker. These are harder problems to solve, and there are information-theoretic limits on how good a solution can get..

Reducing the information conveyed by traffic patterns is a protocol design problem more than an encryption problem. The v0.1 protocol overview discussed this matter at some length, and the (relatively promising) ideas described therein are absolutely going to be carried forward in v0.2 and hopefully beyond.

The amount of information conveyed by message size can be reduced by padding our messages with random noise. This is discussed in brief under the Noise specification's section on "[Application Responsibilities](http://noiseprotocol.org/noise.html#application-responsibilities)". One thing worth noting is that the Noise protocol specifies a maximum message size. This allows extremely security-focused users to pad all their messages to said size, thus eliminating all variation in message size. This size limit also means that messages larger than the size limit must be broken up. So even with an aggressive padding scheme, _some_ size data will necessarily leak in the case of very large messages.

On this subject, the Noise framework specification says:

>**Length fields**: Applications must handle any framing or additional length fields for Noise messages, considering that a Noise message may be up to 65535 bytes in length. If an explicit length field is needed, applications are recommended to add a 16-bit big-endian length field prior to each message.

65535 bytes is large enough that message fragmentation doesn't seem likely to cause problems in practice. It may come up in some situations e.g. when returning lots of search results or Bloom filters, but (fingers crossed) this is probably fine.
