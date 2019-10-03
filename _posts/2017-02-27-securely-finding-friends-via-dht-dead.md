---
layout: post
title: Securely Finding Friends via DHT Dead Drops
tags: [theseus]
---

> Previously:<br/>
> [Theseus: A Robust System for Preserving and Sharing Research]({{ site.baseurl }}{% post_url 2017-02-17-theseus-robust-system-for-preserving %})<br/>
> [Resisting Sybil Attacks in Distributed Hash Tables]({{ site.baseurl }}{% post_url 2017-02-25-resisting-sybil-attacks-in-distributed_25 %})<br/>


<br/>
> Note (added 2019/06/06): This is a post I haven't had time to seriously revise, but I do have some misgivings about it. I think it gives an unnecessary level of specificity and overcomplicates things which could be simple. That said, I think the core idea -- that a shared secret can be established without direct communication, that this secret can be used to establish a rendezvous point, that this rendezvous point can be used to bootstrap an actual direct connection, and that all of this can be done in a way that is totally opaque to prying eyes -- is very good and valuable. Maybe someday I'll get the chance to write a better treatment of it.
<br/>


This won't be a long one -- I just wanted to take a few spare moments to jot down an idea. This post describes how friends in a Theseus-like network who know each other only by public key but don't have each other's network contact info could first get in touch.

It's possible to do this without anyone else finding that contact info, deducing the social connection, or even necessarily knowing that either party is trying to get in touch with anyone. Those guarantees would be tricky to establish through naive use of public-key cryptography, but I believe this scheme can offer all that and more.

This solution strikes me as being simple enough that it has almost certainly been discovered before. As always, if anyone can point out prior work, please do.

In addition to basic cryptographic primitives, the scheme requires a couple nontrivial building blocks. I assume the existence of a reliable distributed hash table (like the one being designed for Theseus). I also assume that the DHT can be accessed anonymously. This second assumption is of course easier said than done, but we'll address that issue separately in due time.

This idea allows for two parties who only know each other's public keys to establish communication without any personally-identifying data leaking to third parties. No centralized authority of any kind is required. Communicating public keys to each other is a bit of a pain but, again, we're sweeping that under the rug for now. Everything in due time.

How it starts is: if you're on the Theseus network and you have a public key that you're using with Theseus, you probably have some file signatures associated with the key published to the DHT. You're going to publish something else along with them: a very large integer signed by your key.

If your friend also has a public key associated with Theseus, they'll share a very large integer signed by their key as well.

These integers are each chosen to constitute one half of a [Diffie-Hellman key exchange](https://en.wikipedia.org/wiki/Diffie%E2%80%93Hellman_key_exchange). Behind them lie personal secrets used to derive them. Put any two of them together, and someone knowing at least one of the personal secrets can derive a shared secret. So, if everyone who wants to be contacted by public key publishes such an integer, then any two such people can arrive at a shared secret without ever directly communicating.

(as an aside, if the public keys are for an elliptic-curve cryptosystem then ECDH could be used to do away with the need to publish traditional DH keys at all, since the public keys essentially also become the DH keys. This may or may not be desirable.)

It's perhaps worth mentioning that using the same public Diffie-Hellman integer in multiple key exchanges does nothing to weaken it. Also, while we're mentioning things, this requires system-wide constants for a DH modulus and base, which is no problem.

Okay, so what we have so far allows two arbitrary people who have exchanged public keys to arrive at a shared secret, but they still haven't managed to communicate. They don't even have each other's contact info. What next?

The idea here is to set up a [dead drop](https://en.wikipedia.org/wiki/Dead_drop). Specifically:

* Calculate the shared secret.

* XOR together cryptographic hashes of the two public keys.

* Compute an [HMAC](https://en.wikipedia.org/wiki/Hash-based_message_authentication_code) of the resulting value, keyed by the shared secret.

* Truncate this hash to the network's address length; this is your dead drop address.

* Check the address for anything that decrypts to contact info under your shared secret. If you find something, you're done.

* If you don't find anything, take your contact info and encrypt it with the shared secret, and store the encrypted value at the dead drop address.

The encryption key is derived from Diffie-Hellman, rather than from the public keys (which are only used to certify the trustworthiness of the DH integers), meaning that this system achieves [forward secrecy](https://en.wikipedia.org/wiki/Forward_secrecy) even if users' private keys are later compromised (except if ECDH is used).

The particularly conservative might, prior to storage, doubly encrypt their contact info: first with the shared secret, then with their contact's public key. This would complicate brute-force attacks on the shared secret somewhat, at the cost of increasing overhead and complicating the algorithm. That measure is not taken here because the benefit of it seems small enough to be outweighed by the cost.

The rendezvous address will be static; if this is a problem, friends could take any number of measures to solve it (e.g. mixing in a low-resolution timestamp to the HMAC). One could come up with any number of similar variations on this idea to provide other properties. The important thing here is the sketch of an idea: that a shared secret and a DHT are enough to bootstrap a connection from arbitrary endpoints.

The system as described seems to me fairly robust. To an outside observer, the dead drop address and the stored value convey no personal information. However, to someone who knows the shared secret and both public keys, the drop is easy to locate and decrypt. So as long as users can somehow anonymize themselves while accessing the data, this system has all the properties we want.
