---
layout: post
title: Mesh Protocol Idea Sketch
---


Here's an idea for a mesh network protocol that could scale well.

The core construct is pretty simple -- simple enough that I have to wonder if someone else has already come up with it. I hope so (it'd be especially nice if they've already taken care of implementing it, too) but just in case I'm the first, here's a sketch of what I have in mind. If there's prior art, I'd love to add a link to it.

This is just the sketch of an idea, not a full specification. It is light on details in some areas, because I'm not an expert and I know my limits. With that said, here we go.


### Addresses

First off, let's do away with any idea of assigning globally unique identifiers to anyone. This just doesn't scale, so we'll figure out a way to get by without it.

But how do we establish connections without specifying who we're connecting to?

Well, in any mesh network, you're going to have two sorts of connections: first, connections via direct point-to-point radio between nearby peers; second, connections via messages relayed over a chain of such radio links.

Let's say we already have a way of establishing point-to-point radio connections with nearby peers.

The goal of a mesh network's routing protocol is to infer enough about the topography of those radio links for us to establish efficient relay circuits over them.

This is easier said than done. Each radio link has finite bandwidth which we have to be careful to conserve. Ideally, the routing layer's per-peer bandwidth overhead should be $$\mathcal{O}(1)$$ with respect to network size. Any weaker bound than this places an absolute upper limit on the network's size, as routing overhead is guaranteed to eventually saturate the network.

How do we meet this standard?

Assign[^1] randomly distributed fixed-length addresses to peers, with no intimations at uniqueness. Each peer might even have several addresses. These are less about _identifying_ peers and more about peers _claiming responsibility_ for certain regions of a shared, co-owned address space (somewhat like node IDs in Kademlia).

[^1]: Technically "assign" is a loaded word here. The implication of assignment coming from a central authority is not intended. Ideally peers' addresses would come from some sort of trapdoor proof-of-work function (possibly after hashing its output, if outputs are not already uniformly distributed). Peer addresses should somehow be made to expire after a fixed window of time, in order to complicate address squatting.

Define distance between addresses via the `xor` metric, and endow peers with responsibility for the addresses closest to their own IDs by this metric. Every peer serves as an introduction point for any target address which is close to their own address. Observe that for a target address $$a_t$$ with $$d_1 = a_1 \oplus a_t$$ and $$d_2 = a_2 \oplus a_t$$, the inequality $$d_1 < d_2$$ holds if and only if $$a_1$$ has more leading bits in common with $$a_t$$ than $$a_2$$ does.


### Bloom Filters

Let's start with a quick refresher on [Bloom filters](https://en.wikipedia.org/wiki/Bloom_filter). They are data structures which let us represent a set of hashable elements in finite space. Membership queries never return false negatives, but they may return false positives. The false positive rate can be tightly controlled and quantified.

One curious property of Bloom filters is that for any two filters, the union and intersection of the sets represented by the filters can be trivially computed using bitwise `OR` and `AND`, respectively.

The purpose of this refresher will become clear shortly, but first, some preliminaries:

Every peer should be keeping a running list of every peer they have a point-to-point connection with, and they should keep track of every address claimed by each of these peers.

Each peer can then determine the set of all addresses they can reach in one hop. They can then expand this set to contain all the addresses and _address prefixes_ they can reach in one hop.[^2] (see footnote for example)

[^2]: For example, say a peer has two active point-to-point connections. The first connected peer claims addresses `0000`, `0010`, and `0011`. The second peer claims `1111` and `1000`. The set of reachable addresses is then `{0000, 0010, 0011, 1111, 1000}` and the expanded set is `{0000, 0010, 0011, 1111, 1000, 000, 001, 111, 100, 00, 11, 10, 0, 1}`

From there, peers can produce _Bloom filters_[^3] representing their set of one-hop reachable addresses and address prefixes.

[^3]: Using constant, globally fixed (and carefully determined) Bloom filter parameters.

These Bloom filters can then be broadcast over radio to peers' immediate neighbors in the network.

Any peer, upon receiving one-hop Bloom filters from some or all of their own one-hop connections, can combine these filters via bitwise `OR` to compute the union of the sets these filters represent. This union is precisely the set of addresses and address prefixes that the local peer can reach in two hops.

These two-hop filters can then be sent to adjacent peers as well. Doing this allows everyone to compute three-hop filters. Sending these yields four-hop filters, and so on.

Of course, this process can't continue indefinitely. Eventually these filters reach a saturation point and their false positive probability skyrockets. The point at which this happens is straightforward to model for any given tolerance. Regardless of how the saturation point is determined, this iterative process of computing progressively broader Bloom filters should continue until this point is reached.

Rather than broadcasting an update whenever any of these filters changes -- which would take significant bandwidth -- peers could just broadcast these updates at regular intervals. We can even standardize an interval duration, although it's a given that not everyone will adhere to it. Regardless, we can check the effectiveness of this strategy heuristically: If most peers' interval durations are under, say, $$t$$ seconds, then even if peers' intervals are out of phase (as they inevitably would be), a peer's updated routing info would propagate at peers $$n$$ hops away after no more than $$n t$$ seconds. With each interval the number of peers to which this info has propogated can be expected to grow exponentially.


### Routing

Now, say we have an arbitrary target address and we want to figure out which peers, out of everyone whose addresses are in our Bloom filters, have the closest addresses to our target. Recall that this is equivalent to figuring out whose address shares the longest prefixes with our target.

To get started, we can simply consult our Bloom filters. Start with the full address, and query each local Bloom filter for it, starting with the one-hop filter and working outwards. If we get a hit, check for a false positive by querying for every smaller prefix as well -- if any are missing, we've hit a false positive (this does not eliminate false positives but does allow us to filter some out).

If no hits are found for the full address, repeat the process for the address's longest prefix; if no hits are found, repeat for the next-longest. Repeat until a hit is found, and note which filter it was found in.

If this process determines that a given prefix is reachable in $$n$$ hops, the next step is to take our neighbors' $$n-1$$-hop filters and query these for the same prefix. If none turn up a hit, then our local hit was a false positive and we need to backtrack in the search of our local filters. If any of these $$n-1$$-hop filters does hit, however, then we've determined that (barring a false positive) the associated peer is the next hop in a minimal-length path to the peer whose address is closest to our target.

Once we've figured this out, we might contact the peer(s) whose filter(s) contained the hit and ask them to forward routing queries on our behalf. Then through them we can query their neighbors' $$n-2$$-hop filters to identify the next step(s) in the path to our target. Repeat this process and we'll eventually get where we're going.

The precise forwarding/proxying mechanism here is left intentionally vague -- I'm imagining it resembling the protocol for establishing Tor circuits, but the specifics could go any number of ways, and I'm trying to avoid getting bogged down in details in this post.

Note that the iterative routing process is going to need to be able to handle Bloom filter false positives gracefully. This will involve some degree of backtracking. It might even be a good idea to try and preempt this by running parallel disjoint lookups, sort of like in S/Kademlia[^4].

[^4]: The analogue to S/Kademlia is limited, since that algorithm's underlying protocol stack is obviously very different, but their core idea applies. Carrying out a lookup over multiple disjoint paths in parallel increases the chance of following at least one path which does not contain malicious nodes; the same logic (and possibly even the same mathematical analysis) applies in the case of non-malicious interference, e.g. misleading routing info due to false positives from a Bloom filter.


### Connecting

What we have so far is a way of looking up an arbitrary target address and identifying, within the neighborhood of the network that we know about, the peers who have claimed responsibility for the closest addresses to this target.

Of course, these peers could be anyone. If we have a friend and we know our friend is on the network, we still can't use this routing construct to directly find our friend and open a connection. We're not there yet.

However, we are _almost_ there. The idea of peers serving as _introduction points_ was mentioned earlier. Say we have a shared secret with our friend. We could derive an address from this shared secret[^5], then look up this address to find the closest peers to it in our neighborhood of the network, and then ask these peers to introduce us to anyone else who connects to them looking for the same address that we are. This is easy for them to do, since everyone who connects has already charted a course through the mesh to get where they've gotten, meaning that all any rendezvous peer has to do is knit together these other peers' circuits, with themself as the connecting point.

[^5]: e.g. by taking current Unix time as an integer, shifting it right by some number of bits to limit resolution, and using this as the key for a hash of the shared secret -- or by taking, say, two or three such hashes for consecutive timestamps and attempting introductions at _all_ the resulting addresses in parallel. This second method, while higher-overhead, would increase the chances of a successful rendezvous, and would be more fault-tolerant in edge cases (e.g. when the two friends start their lookups at different times, or when their clocks are out of sync, etc etc).

If the address lookup bears a passing resemblance to Tor circuit negotiation, then this process could (if properly designed) end up resembling the process of connecting to an onion service. This is (obviously) not a guarantee of privacy or security by itself, but it _does_ seem to suggest that we could be headed in a promising direction.

This construct can support both anonymous and authenticated introductions.

The anonymous case vaguely resembles e.g. Mainline DHT, where peers wishing to join a torrent swarm look up the torrent's associated info hash as a DHT address, request a list of peers who have stored their contact info at that address, then add their own contact info to the list. We could mirror this construct, but without one less layer of indirection: rather than peers sharing contact info at an address, contact is established through the peer(s) responsible for the address itself.

The authenticated case could work any number of ways. It might look like this: suppose you and your friend each have an encrypted messenger app, and the app has (say) an Ed448 public key associated with your identity. Say you exchange public keys (e.g. by scanning QR codes on each other's phones). You can now use ECDH to obtain a shared secret. Now, whenever you want to attempt a connection over the network, derive an ephemeral _rendezvous address_ from your shared secret (or maybe even derive _several_ such addresses)[^5], then look up these addresses, establish circuits over the network to the peers identified by this lookup process, and ask each peer to introduce us to anyone else who shows up asking about the same address.

Since the rendezvous address is known only to you, your friend, and any peers you've shared it with during the lookup process (e.g. the peer serving as your introduction point, at minimum), it is likely but not guaranteed that the first and only connection you will see will be from your friend. Once this connection is established, you can guard against interference by mutually authenticating using your public keys and establishing an encrypted channel (e.g. via Noise), and then you're good to go.


### Rerouting

So far, we have a way of making end-to-end connections between arbitrary peers as long as they know what address to look up to find each other. However, the routes they take to find each other might be wildly inefficient.

For instance, suppose you and your friend are two hops away from each other, but you're both five hops away from your rendezvous point. Then you'll end up establishing a ten-hop circuit when you could have a two-hop one. Not only will this impact the quality of your connection, it'll result in said connection consuming five times more of the network's total bandwidth than necessary. This is obviously less than ideal.

An interesting property of Bloom filters is that just like bitwise `OR` of two filters produces a new filter representing the union of the original filters' sets, the bitwise `AND` of these filters produces a filter representing the _intersection_ of the filters' sets. Delightfully, the false positive probability in this new Bloom filter is bounded above by the false positive probabilities of the originals.

In light of this, here's an idea: as soon as two peers connect to each other via an introduction point, they should send each other their routing Bloom filters. From these, a number of set intersections can be computed.

Of course, first we should check for the trivial case where either peer's local addresses are contained in the other's one-hop filter; this would indicate (somewhat embarrassingly) that the peers are already directly connected over radio but they somehow failed to notice this. This will, of course, almost never happen, and in the majority of cases a more involved strategy may be required.

Before getting into details, let's introduce some notation. Let's call our two peers $$a$$ and $$b$$ and denote $$a$$'s one-hop filter as $$a_1$$, their two-hop filter as $$a_2$$, and so on; likewise with $$b_1$$, $$b_2$$, etc. Denote bitwise `AND` and `OR` with $$\land$$ and $$\lor$$ respectively.

The intersection of the peers' one-hop filters, $$a_1 \land b_1$$, gives the set of all addresses and address prefixes that can be reached by both peers in one hop. This set almost certainly will contain some prefixes, but it is not guaranteed to contain any full addresses. However, if the intersection _does_ contain a full-length address then the peers have identified a specific address which they are both one hop away from. This will (with overwhelming probability) mean that they have also identified a third peer who can serve as an introduction point for a minimal-length circuit between the two peers.

So how do we check whether any full addresses are contained in the intersection filter? If the full address is contained in the filter, then necessarily all prefixes of it will be as well, and so we can just run a depth-first search. This search will either terminate on a full address or determine that no such address is contained in the filter.

If an address is identified, the peers may attempt to look it up and establish a new connection over it. If this fails, they may search for any other addresses in the filter and try these as well.

If no addresses are found, or if all attempts at new connections fail, then the peers may move on from looking for a two-hop circuit to looking for a three-hop circuit. This means they need to find a third peer who is one hop from one peer and two hops from the other, so the Bloom filter to search here is given by $$(a_1 \land b_2) \lor (a_2 \land b_1)$$. If they find a full address here and carry out a successful rendezvous through it, then great; if not, they'll need to look for a four-hop circuit, for which the filter to search will be $$(a_1 \land b_3) \lor (a_2 \land b_2) \lor (a_3 \land b_1)$$.

This process can be run until we identify enough circuits or run out of Bloom filters.

Given enough time, this process should allow two peers to exhaustively identify all the addresses they can both reach and to determine the minimum number of hops required to set up a circuit through any such address.


### What is this?

This is a routing protocol for mesh networks. As long as peers agree on some global network parameters, no advance setup is required. In particular, nothing about the network topology needs to be known in advance.

Peers can establish connections without sharing any identifying information, even a network address. This stands in contrast to the way things work on the current Internet, and suggests that this network could provide some superior privacy properties.[^6]

[^6]: For instance, it is common for copyright holders (music labels, movie studios, etc) to monitor BitTorrent peer swarms and serve copyright infringement notices to the owners of all IPs observed. Whatever you might think of people who torrent copyrighted material, it is undeniable that this practice is designed to intimidate and take advantage of people who lack the means to stand up to legal threats, and for these copyright holders the fines associated with these notices serve as a way of profiting off artists' work without sharing _any_ of the profits with those artists. This exploitive practice would not be possible if connections could be established without sharing any personally identifying information.

This sort of construct would be valuable in areas where internet service is not available or where it has been disrupted (e.g. in the aftermath of a natural disaster). In areas where internet service is broadly available, the value of a mesh network is less obvious but no less real: not only does it provide redundant infrastructure, it also would be free to join. People with Internet connections could perhaps establish crossover points between the networks. Since internet access is increasingly becoming a necessity, the possibility of providing it for free is very attractive and has the potential to have a concrete positive impact on many people's lives.

This infrastructure could also provide entirely new categories of app architecture. More on that later, maybe.


### Questions

* None of this says anything about optimizing routes based on available bandwidth on individual point-to-point connections. How could we handle that?

* For that matter, what will it take to set up these point-to-point connections in the first place?

* What sort of criteria should we adhere to with regard to setting Bloom filter parameters?

* How can we model the routing system's bandwidth overhead? It appears to meet the requirement of being $$\mathcal{O}(1)$$ with regard to network size, and it seems intuitively likely that bandwidth would decrease as the network's average path length decreases[^7], but how can we formalize these intuitions?

[^7]: My reasoning here is that in networks where many addresses can be reached with a small number of hops, peers are likely to be sending fewer total filters since they will reach their saturation cutoff more quickly.

* How much of this traffic can be encrypted?

* How much would the network benefit from adding "shortcuts" (e.g. long-distance high-bandwidth radio links between distant endpoints, or nodes which also have internet connections and use these to knit physically distant regions of the mesh together)? Intuitively it seems like past a certain size these would be key to scaling well. How can this intuition be formalized?

* How should we manage public identities on the network? Should identities be long-lived or per-session?

* How well does this algorithm handle peer churn? How fast should the update intervals for broadcasting Bloom filter changes be? Should they scale dynamically?

* It would be trivial to extend this routing algorithm to include a distributed hash table construct resembling Kademlia or Theseus DHT. Would this be a good idea?

As you can see, there's a lot more work to be done here to fill this idea out and get anything even resembling a full specification. That said, this routing construct feels very powerful, and I wonder if something useful could come of it.

<hr>
