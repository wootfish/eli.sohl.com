---
layout: post
title: Theseus Revamp
---

# Overview

I am considering making some big changes to the design of Theseus. Let's start with _what_, and then we can cover
_why_. Here's what I have in mind:

* Requring all peer connections to be established through Tor onion services.

* Using onion services' default encryption rather than the custom Noise-based encrypted channel specified in previous protocol drafts.

    * Onion services provide end-to-end encryption with one-way authentication: The server, whose public key is known from their onion address,
      authenticates to the client during the introduction protocol.

    * We will need to find a way of ensuring mutual authentication once the client peer has shared their onion
      address.

* Redefining node addresses:

    * Deriving addresses from Argon2id, using onion address as the "password" and Unix timestamps as the "salt".

    * Maintaining the current construct of a sliding window for address validity, such that only addresses whose
      timestamps differ from current Unix time by less than a given threshold are considered valid.

    * Including a proof-of-work component to add asymmetry between address generation and verification.

        * This would likely involve extending the Argon2id hash output from 20 bits to some larger amount, with the
          first 20 used as a node address and the remaining bits used as input for some proof-of-work function. The
          address would only be considered valid if proof-of-work validation succeeds.

        * Probably the simplest construct would be to extract 4 or 8 bytes, treat them a `long int` or `long long int`
          respectively, and require that they fall above or below a certain (possibly sliding) threshold.

* Adding a carefully tuned proof-of-work constraint to `put` queries. This allows us to extend our formal analysis of
  the DHT to include "carrying capacity" -- more on this in a future post.

    * The level of work required should scale super-linearly (quadratically? exponentially?) relative to the size of the
      data to store, so that `put`s for small data should be very cheap, but storing large binary blobs directly on the
      DHT is impossible without considerable precomputation.

    * The proof-of-work step should involve the data and the address but not the storer, any timestamp, or any other
      semantically significant field.

    * More on this later.

* Making the `t` field in `put` responses mandatory.

    * In tandem with this, if a peer promises to store data for a certain duration but then discards the node address at
      which the data is stored before the promised duration has run out, the peer should make a best-effort attempt
      at preventing this data from being silently lost by re-publishing the data on the
      network with a `t` field set to the difference between promised and actual storage time.

    * Some related formal work on the subject of timeouts and ratelimiting is forthcoming. This ties in with the analysis mentioned in the previous top-level bullet.

* Removing the Noise handshake re-negotiation queries, as they are no longer needed.

* Rewriting the format for contact info on-wire to reflect the above changes.

* Redesigning the `info` KRPC query.

    * This one was built out to provide some functionality which is no longer needed.

    * Most specified info keys are now obsoleted.

    * It will need some new functionality. In particular, we will have to look into whether it is possible to add a
      solid challenge-response authentication construct to it, to support simultaneously sharing & proving ownership
      of one's own onion addresses.

* _Possibly:_ Shelving the "data tags" feature for `put` requests.

   * Argument _for_ shelving this feature: The only data tags previously specified were `ip` and `port`, both of which are now irrelevant. We could swap them out for a tag representing a peer's onion address, perhaps.
   
   * Argument _against_: Data tags are interesting because they are constrained, and it is possible that other services built on Theseus DHT could find uses for them. This seems very plausible to me, since they were designed to mimic Mainline DHT's storage operation. They could possibly be exempted from `put`'s new proof-of-work constraint. More on this later.

Now, let's take a moment to unpack all this.


# Tor

The big news item here is Tor. I've always been committed to supporting Tor, but now I am considering _requiring_ it.
Peers would make themselves available as onion services, and all peer connections would be made through Tor.

#### Tor: NAT Traversal

Tor gives us NAT traversal for free. This is the killer feature, since reliable TCP NAT traversal is nontrivial.[^1]

[^1]: The issue of NAT traversal is one reason why UDP is often favored over TCP by peer-to-peer protocols: UDP NAT traversal turns out to be much easier than TCP NAT traversal. TCP is connection-based, and so NAT routers set up routing rules per-connection; UDP is connectionless, so routing rules are set up based on outgoing packets' source ports, which can (and usually do) remain invariant across time -- unlike in TCP.

Reliable TCP NAT traversal usually involves both peers reaching out to some third party who helps mediate the process
of forming their connection. This is not guaranteed to work -- modern protocols like STUN, TURN, etc, are pretty good,
but ultimately their success relies on NAT implementation details and network topology -- and it is a privacy disaster,
because the third-party mediator gets to see who is connecting to who, and when. That is not great.

An alternative to having our third party mediate new connections is to simply route all traffic through our helpful third
party; this is what the Tor network offers. This might sound worse, privacy-wise, but in fact it is (likely) much better.
Tor consists of a heterogenous mix of severs which work together in ways explicitly designed to limit the network's ability
to track connection metadata. With Tor, peers can simply establish themselves as Tor onion services, listen for connections
through the network, and establish connections through Tor as well.

I'd like to take a moment to underline how vital NAT traversal is for a peer-to-peer system like Theseus. A peer-to-peer
system's strength comes from its peers. Everyone contributes resources to the system; we rely on each peer to help
maintain the health of the network. If peers can't receive incoming connections then their ability to
perform this duty is severely limited. 

If a peer is unreachable, no one can contact them to request information. These peers are only able
to offer information over outgoing connections. Worse, the peers at the other ends of those outgoing connections have no
way of knowing that the peer they're talking to is otherwise unreachable (short of attempting a new, redundant trial
connection), so they could add these peers to their routing tables, degrading the quality of the table's information.
The impact would be significant if (as in the modern internet) the great majority of peers are behind NAT.

The integrity of the network depends on having a reliable method for NAT traversal. Tor onion services provide this.

#### Tor: Privacy

Of course, Tor provides other benefits in addition to NAT traversal. Privacy is the most obvious one. I'm not sure much
needs to be said on that: the second of five promises made [in my original post announcing Theseus](2017-02-17-theseus-robust-system-for-preserving)
was that the system would provide _guarantees of anonymity for users who need them_, and I remain as committed to that
promise as ever. I've always imagined Tor playing a role in how Theseus delivers on that promise, and as the design of
the overall system crystallizes I am becoming more and more convinced of Tor's necessity here.

#### Tor: Simplifications

Those are the high-level benefits. They are unsolved problems with Theseus that would be solved by always using Tor.
There are also some already-solved problems for which Tor permits new, improved solutions.

Most notably, communications with onion services are end-to-end encrypted. This stands in contrast to normal Tor use,
where traffic from Tor exit nodes is sent as-is and an additional application-level protocol like TLS is required to
ensure end-to-end encryption.

With onion services, all communication between the service operator and the service user
takes place within the Tor network, which both peers have encrypted connections to; the initial peer handshake establishes
a further shared secret (using one-way authentication to prevent man-in-the-middle attacks on its negotiation).
Subsequent messages are then end-to-end encrypted and authenticated using a key derived from this shared secret. For
details on the handshake, see [here](https://gitweb.torproject.org/torspec.git/tree/rend-spec-v3.txt#n1775) and
[here](https://gitweb.torproject.org/torspec.git/tree/tor-spec.txt#n1102).

Up to this point, encryption for Theseus has been handled through the Noise Protocol Framework. I am still a huge fan
of Noise, but I think it may not be necessary given the level of security automatically provided by onion services.
Dropping Noise as a Theseus component would permit _substantial_ simplifications to the Theseus codebase and test suite,
which would be fantastic.

The major drawback to dropping Noise is a loss of flexibility. Noise offers out-of-the-box support for mutual
authentication, rekeying, and other attractive features. Mutual authentication in particular is necessary for confirming
that a peer owns whatever onion address they claim to own. We would need to build out something else to provide this
functionality.

Some sort of challenge-response protocol could be used here; this seems less elegant than Noise's solution of simply
mixing ECDH secrets into the session's key material, but it would likely still work if properly designed.

Other benefits of using Tor exclusively: Sharing contact info is simpler; operating long-lived introduction points for
the network is easier; peers can rotate their identifiers whenever -- and as often as -- they choose to (unlike if they
were identified by e.g. IP/port pairs); in the average case, accessing Theseus on a given network reduces to of
accessing Tor, and extensive work has gone into making Tor accessible; and so on.

### Node Address Generation

Moving to Tor hidden services would also change -- and potentially simplify -- our method of selecting node addresses.

As of the last iteration of Theseus's design, node addresses were generated by hashing a specially formed input with
Argon2id. The preimage consists of a timestamp in Unix time, an IPv4 address, and 6 bytes of random noise. This design
has several issues, and I've never been particularly happy with it.

As part of this redesign, I'm inclined to change node address derivation to simply use Argon2id hashes of a peer's onion
address, salted by Unix timestamps. Argon2id takes a 16-byte salt, so let's just put the timestamp in an 8-byte int and
concatenate it with itself.

When peers are announcing their own node addresses, they could even save bandwidth by just sending over the timestamps
used to generate the addresses, rather than the full addresses themselves. We might still want to include full addresses
with routing query responses -- this is probably worth looking into down the road.

Something else I'd like to address in this design: node address generation and validation currently take equal amounts
of work. There is room for improvement here.

Honest peers will be generating node addresses infrequently but checking other peers' node addresses often. For Sybil peers,
the exact opposite will likely be the case: these peers will be generating new addresses constantly (and will likely not
bother with address checks for performance reasons, though this is less important).

In light of this, it would be nice to see if we can increase the level of work required for address generation while
holding the level of work required for address validation constant.

My proposed solution here is to extend Argon2id's output past the address size and to enforce a constraint on the
trailing bytes. The actual constraint used is sort of beside the point, since the search for valid addresses is
trivially parallelizable. As far as I can tell, we would gain nothing from using e.g. Equihash. We might as well keep
things simple by interpreting the trailing bytes as an unsigned integer and constraining this integer's value to fall
below a certain threshold. Note that this is constraint is very similar to, but ultimately offers much more granularity
than, the common constraint of requiring "n leading 0s" seen in e.g. Hashcash, Equihash, etc.

One very nice thing about this: our cutoff threshold could be gradually adjusted with time. This seems useful simply as an
acknowledgement of Moore's law,[^2] as well as a way of limiting the advantage a Sybil attacker gains from precomputing
addresses. Moreover, we get to adjust the threshold by very small amounts and in a very smooth way; this stands in sharp
contrast to more common proof-of-work schemes based on finding hashes starting with a fixed series of bits (since the
difficulty level of such problems can only ever be halved or doubled).

[^2]: Many, including Moore, expect the law to hold until around 2025; if this sliding threshold turns out to be a bad choice, it can always be re-evaluated down the road and adjusted -- as long as majority consensus is reached among network peers (or, in many cases, among the people developing those peers' Theseus clients).

One small note: this does technically put a soft limit on how many node addresses a single peer can have. The limit is
just the number of seconds in an address's lifespan multiplied by the proof-of-work test's success probability. I don't
see this as much of a problem -- I doubt most honest peers will ever run into this limit -- but nevertheless it would be
better if we could let honest users run as many nodes as they see fit to.

It may make sense, then, to make accomodations in the code for users to operate multiple onion addresses (i.e. to exist
as multiple distinct "peers" on the network). I will be the first to admit it: this is technically convenient but
terminologically nightmarish. I'm still working on what the best definitions for "peer" and related terms would be after
this change.

# Proof-of-Work for Storing Data

This is the other big idea. I'm still thinking this one through, and I've been going back and forth on it for a long
time. Here's where I'm at so far.

If malicious peers decided to just store a tremendous amount of data on the network, what would we do about it? They're
not doing anything wrong, per se -- after all, a DHT is meant to store data, so they're using it as intended -- they're
just trying to push the DHT to (and past) its capacity. How do we deal with this?

Well, how would such an attack be carried out? All else being equal, attackers would want to store as much data per
`put` query as possible. If we introduced a proof-of-work constraint that is negligible for small data but significant
for large data, we could punish this behavior at minimal impact for normal use (assuming that normal DHT use primarily
involves storing small data). This would disincentivize large `put`s, so malicious peers would have to submit many small
`put`s instead. These, of course, are trivial to ratelimit. Thus we can place a hard limit on how much data an attacker
is able to store with any given peer, as a function of the ratelimit threshold and the level of work of which the
attacker is capable, with increases to level of work very quickly leading to diminishing returns.

Once a peer is ratelimited, they'll need to switch to sending `put`s over new identities; for this, they'll need to go
through the node address generation process many times, so in some sense flooding the network with data reduces to
launching a small-scale Sybil attack -- meaning that our Sybil defenses come into play here as well.

Let's also _consider_ adding timestamps here as well. After all, if you solve a proof-of-work problem once, should you
be able to store that data in perpetuity? Or should your license last for some shorter period of time (say, one month)?
Something to think about.

OK, so we haven't worked through the necessary math to nail down any specifics here, but the conceptual grounding seems
solid. Now how can we minimize the overhead of this extra proof-of-work constraint for honest peers?

First, let's specify some threshold below which proof-of-work is not required. I think this should be very low. We can
fix an exact value after conducting more formal analysis.

Second, let's make the function involve both the data and the data address. Thus, solving the proof-of-work problem
would let you store the given datum at _one_ address. This should be fine for normal use, but it means that flooding the
entire network with data would mean solving these problems for a very wide range of addresses.

Third, let's make the above parameters the _only_ non-arbitrary inputs to the function. The primary motivation for this
is to make it so that when you rotate addresses you can, at negligible cost, send out `put` messages to maintain continuity
in the network for any locally stored data at the address(es) you're discarding.


# Next Steps

The Theseus protocol spec will need to be rewritten. This will require nailing down what `put` and `info` should look
like, which will be nontrivial.

On the implementation side: a fair bit of the codebase will need rewriting. I'd like to use this opportunity to move as
much of the code to `async`/`await` as possible.[^3] Note that this does not mean leaving Twisted behind -- the project
offers `asyncioreactor` for this exact purpose.[^4]

[^3]: I've got a few reasons for this, but if I'm being honest, the biggest one for me is that the stack traces you get from exceptions are just so much cleaner than what you get using `@inlineCallbacks`.

[^4]: `asyncioreactor` is a Twisted reactor implemented in terms of Python's `asyncio` event loop, allowing you to mix Twisted code and other `async` code as desired. You can find an example of what this looks like [here](https://meejah.ca/blog/python3-twisted-and-asyncio).

Here are my current plans for the codebase. Everything here is subject to change as necessary, of course, but I expect
it to work out well as-is.

Theseus will continue to use the Twisted Application Framework. For `Argon2id` bindings, we will continue to use
`PyNaCl`. The user-facing Theseus client will run off an API served by the Theseus daemon through Twisted Web.[^5] Tor
integration will be handled through [`txtorcon`](https://github.com/meejah/txtorcon).

[^5]: Caveat: I haven't used Twisted Web before. If it proves not to be a good fit, I am not opposed to bringing in an external library like `aiohttp`.

We no longer need `NoiseWrapper`, and we can likely adjust `DHTProtocol` to subclass `NetstringReceiver` (which would be
a big win).

We will have to decide whether, and how, to support operating multiple onion addresses.[^6]

[^6]: Some questions: When clients share their own onion addresses, should they share _all_ their addresses? Or should they pretend to only be operating one address? If the latter, how do they choose which address to use? If the former, how does this change our mutual authentication protocol? For that matter, should servers broadcast other addresses they also operate, and if they do then how should they prove ownership?[^7] More generally, are we considering multiple cohosted onion addresses as corresponding to _multiple cohosted logical peers_ or as _one peer providing multiple points of access_? Do we think the benefits of this latter option would outweigh the costs? Could we perhaps go for some sort of "hybrid" solution (e.g. distinct peers with a shared routing table)?

[^7]: Recall that unlike the original onion service connection, which provides one-way authentication through Tor's own protocols, all subsequent authentication must take place at the application level, which is to say within our own code.

All this should be less work than it looks like. I'm as confident in this project as I've ever been, and I can't wait to
get it out there into the world.


<hr>
