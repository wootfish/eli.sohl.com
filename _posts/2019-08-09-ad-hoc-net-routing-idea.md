---
layout: post
title: "Low-Overhead Routing for Ad-Hoc Mesh Networks"
mathjax: true
---


Here's an idea that I've been turning over for a while now. It's a way of discovering routes through [ad-hoc, peer-to-peer wireless networks](https://en.wikipedia.org/wiki/Wireless_ad_hoc_network), and it comes with some interesting properties. In particular, it seems like it would scale very well.

The core construct is simple enough that I wonder whether I'm the first to get to it. I hope I'm not -- it'd be especially nice if someone else has already taken care of implementing it, too -- but just in case, here's an outline of what I have in mind. If there's prior art, I'd love to add a link to it.


## Transports

This idea depends on an underlying physical-layer transport, probably established via 802.11 in ad-hoc mode (or something similar). It also assumes a higher-level method for relaying messages along predetermined routes, probably with a design resembling onion network message delivery. I'm not interested in specifying either of these protocols here, since they have nothing to do with routing; to keep things simple, we will just assume their existence and assume they work well.


## Goals

As mentioned above, we have two sorts of connections: first, connections via direct point-to-point radio between nearby peers; second, connections via messages relayed over a chain of such radio links.

The goal of a mesh network's routing protocol is to infer enough about the topography of those radio links for us to establish efficient relay circuits over them.

This is easier said than done. Each radio link has finite bandwidth, so we have to be careful to minimize overhead. Ideally, the routing layer's total bandwidth overhead should be no worse than $$\mathcal{O}(n)$$ with respect to network size (or equivalently, per-peer bandwidth should be no worse than $$\mathcal{O}(1)$$). Any worse bound places an absolute upper limit on the network's size, as routing overhead is guaranteed to eventually saturate the network.

How do we meet this standard?


## Addresses

Let's start by doing away with any idea of assigning globally unique identifiers to anyone. Those just don't scale, so we'll get by without them. Same goes for letting people pick their own arbitrary addresses. Not gonna happen.

But how do we establish connections without specifying who we're connecting to?

Start by assigning[^1] randomly distributed fixed-length addresses to peers, with no intimations at uniqueness. Each peer might even have several addresses. These are less about _identifying_ peers and more about peers _claiming responsibility_ for certain regions in a shared, co-owned address space (somewhat like node IDs in Kademlia).

[^1]: Technically "assigning" is a loaded word here. The implication of address assignments coming from a central authority is not intended. Ideally, peers' addresses would come from some sort of trapdoor proof-of-work function (possibly after hashing its output, if necessary). Peer addresses should somehow be made to expire after a fixed window of time, in order to complicate address squatting.

Define distance between addresses via the `xor` metric (written as $$\oplus$$), and endow peers with responsibility for the addresses closest to their own local addresses by `xor`. Every peer serves as an introduction point for any target address close to their own address.

Note that for a target address $$a_t$$ with $$d_1 = a_1 \oplus a_t$$ and $$d_2 = a_2 \oplus a_t$$, the inequality $$d_1 < d_2$$ holds if and only if $$a_1$$ has more leading bits in common with $$a_t$$ than $$a_2$$ does.


## Bloom Filters

Let's start this section with a quick refresher on [Bloom filters](https://en.wikipedia.org/wiki/Bloom_filter). These are data structures which let us represent a set of hashable elements. Unlike most representations of sets, a Bloom filter's total storage overhead is _fixed_. Further, membership queries never return false negatives, though they may return false positives. The false positive rate for any filter increases monotonically with the size of the represented set in a way that is straightforward to model.

One curious property of Bloom filters is that the union and intersection of the sets represented by any two filters can be trivially computed using bitwise `OR` and `AND` respectively.

The purpose of this refresher will become clear shortly. First, some more preliminaries:

Every peer should be keeping a running list of every peer they have a point-to-point connection with, and they should keep track of every address claimed by each of these peers.

Given this information, each peer can determine the set of all addresses they can reach in one hop, and can expand this set to contain all the addresses and _address prefixes_ they can reach in one hop.[^2] (see footnote for example)

[^2]: For example, say a peer has two active point-to-point connections. The first connected peer claims addresses `0000`, `0010`, and `0011`. The second peer claims `1111` and `1000`. The set of reachable addresses is then `{0000, 0010, 0011, 1111, 1000}` and the expanded set is `{0000, 0010, 0011, 1111, 1000, 000, 001, 111, 100, 00, 11, 10, 0, 1}`

From there, peers can produce _Bloom filters_[^3] representing their set of one-hop reachable addresses and address prefixes.

[^3]: Using constant, globally fixed (and carefully determined) Bloom filter parameters.

Peers can then broadcast these Bloom filters to their immediate neighbors in the network.

Any peer, upon receiving one-hop Bloom filters from some or all of their own one-hop connections, can combine these filters via bitwise `OR` to compute the union of the sets these filters represent. This union of one-hop filters is precisely the set of addresses and address prefixes that the local peer can reach in _two_ hops.

These two-hop filters can then be sent to adjacent peers as well. Doing this allows everyone to compute three-hop filters. Sending these yields four-hop filters, and so on.

Of course, this process shouldn't continue indefinitely. Eventually these filters reach a saturation point and their false positive probability skyrockets. Note that this implicitly limits the total information any individual node can have about the overall network graph (though this limit only becomes relevant in large networks). The point at which this happens is straightforward to model for any given tolerance. Regardless of how the saturation point is determined, this iterative process of computing progressively broader Bloom filters should continue until the saturation point is reached.

Rather than broadcasting an update whenever any filter changes -- which would take significant bandwidth, since any change is likely to prompt changes in adjacent peers' filters, then in their neighbors' filters, leading to instant exponential blowup -- peers could just broadcast these updates at regular intervals. We can even standardize an interval duration (although it's a given that not quite everyone will adhere to it).

We can check the effectiveness of this strategy heuristically: If most peers' interval durations are under, say, $$t$$ seconds, then even if peers' intervals are out of phase, a peer's updated routing info would propagate at peers $$n$$ hops away after no more than $$n t$$ seconds. With each interval the number of peers to which this info has propogated can be expected to grow exponentially.

The overhead of these updates can be further reduced several ways. To begin with, sparse filters (as e.g. one- or two-hop filters likely would be) are very amenable to compression. Dense filters would be less easily compressed, but rather than broadcasting full filters directly on every update, a compressed version of the `xor` of a filter's old and new values -- which is likely to be much sparser -- could be broadcast instead. The filter's new value is then trivial to compute as long as the recipient has the old value stored (or has a way of explicitly requesting it, as a failsafe).


## Routing

Now, say you have an arbitrary target address and you want to figure out which peers, out of everyone whose addresses are in your Bloom filters, have the closest addresses to your target. Recall that this is equivalent to figuring out which peers' addresses share the longest prefixes with your target address.

To get started, you consult your Bloom filters. Start with the full address and query each local filter for it, starting with the one-hop filter and working outwards. If you get a hit, you can check for a false positive by querying for every smaller prefix as well -- if any are missing, you've hit a false positive (this won't _always_ detect false positives, but allows us to filter some out).

If no hits are found for the full address, repeat the process for the address's longest prefix; if no hits are found, repeat for the next-longest. Repeat until a hit is found, and note which filter it was found in.

After this process determines that a given prefix is reachable in $$n$$ hops, the next step is to take your neighbors' $$n-1$$-hop filters and query these for the same prefix. If none turn up a hit, then your local hit was a false positive and you need to backtrack in the search of your local filters. If any of these $$n-1$$-hop filters _do_ hit, however, then you've determined (barring a false positive) that the associated peer is the next hop in a minimal-length path to the peer whose address is closest to your target.

Once you've figured this out, you might contact the peer(s) whose filter(s) contained the hit and ask them to forward routing queries on your behalf. Then through them you can query _their_ neighbors' $$n-2$$-hop filters to identify the next step(s) in the path to your target. Repeat this process and you'll eventually get where you're trying to go.

Note that this iterative routing process is going to need to be able to handle Bloom filter false positives gracefully. This will involve some degree of backtracking. It might even be a good idea to try and preempt such issues by running parallel disjoint lookups, sort of like in S/Kademlia.[^4]

[^4]: The analogue to S/Kademlia is limited, since that algorithm's underlying protocol stack is obviously very different, but their core idea applies: Carrying out a lookup over multiple disjoint paths in parallel increases the chance of following at least one path which does not contain malicious nodes; the same logic (and possibly even the same or similar mathematical analysis) applies in the case of non-malicious protocol, e.g. misleading routing info due to false positives from a Bloom filter.

The precise forwarding/proxying mechanism here is left intentionally vague -- I'm imagining it resembling the process for establishing Tor circuits, but the specifics could go any number of ways and I'm trying to avoid getting bogged down in details in this post. This would be a fun topic to brainstorm over email or DMs, if anyone is interested.


## Connecting

What we have so far is a way of looking up an arbitrary target address and identifying, within the neighborhood of the network that you know about, the peers who have claimed responsibility for the closest addresses to this target.

Of course, these peers could be anyone. If you have a friend and you know your friend is on the network, we're not quite ready to use this routing construct to directly find your friend and open a connection. We're not there yet.

However, we are _almost_ there. The idea of peers serving as _introduction points_ was mentioned earlier. Here's what that might look like.

Say you have a shared secret with your friend. You could derive an address from this shared secret[^5], then look up this address to find the closest peers to it in your neighborhood of the network. You could then ask these peers to introduce us to anyone else who connects to them looking for the same address that you are. This is easy for them to do, since everyone who connects has already charted a course through the mesh to get where they've gotten, meaning that all the rendezvous peer has to do is knit together these other peers' independent circuits, with themself in the middle.

[^5]: e.g. by generating a secret through TOTP (as defined in [RFC 6238](https://tools.ietf.org/html/rfc6238))  -- or by taking, say, two or three such secrets for consecutive time increments, and attempting introductions at _all_ the resulting addresses in parallel. This second method, while higher-overhead, would increase the chances of a successful rendezvous, and would be more fault-tolerant in edge cases (e.g. if the two friends start their lookups at moderately different times, if their clocks are way out of sync, etc etc).

Since the rendezvous address is known only to us, your friend, and any peers you've shared it with during the lookup process (e.g. the peer serving as your introduction point, at minimum), it is likely but not guaranteed that the first and only connection you will see will be from your friend. Once a connection is established, you can guard against interference by mutually authenticating using your public keys and establishing an encrypted channel (e.g. via the Noise framework), and then you're good to go.

If the address lookup algorithm bears a passing resemblance to Tor circuit negotiation, then this process could (if properly designed) end up resembling the process of connecting to an onion service. This is (obviously) not a guarantee of privacy or security by itself, but it might seem to suggest that you're headed in an interesting direction.

Our routing construct can support both anonymous and authenticated introductions. We just saw the authenticated case. Here's how the anonymous case could look.

The use case here resembles that for e.g. Mainline DHT, where peers wishing to join a torrent swarm first look up the torrent's associated info hash as a DHT address, then request a list of peers who have stored their contact info at that address, connect to (some of) those peers, and finally add their own contact info to the list. We can mirror this construct, but without one less layer of indirection: rather than peers sharing contact info at an address, contact is established through the address itself (or rather, through the peers responsible for said address).


## Rerouting

So far we have a way of making end-to-end connections between arbitrary peers as long as they know what address to look up to find each other. However, the routes they take to find each other might be wildly inefficient.

Suppose you and your friend are two hops away from each other, but you're both five hops away from your rendezvous point. Then you'll end up establishing a ten-hop circuit when you could have a two-hop one. Not only will this impact the quality of your connection, it'll result in said connection consuming (in this case) five times more of the network's total bandwidth than necessary. This is not ideal.

Recall that just as the bitwise `OR` of two Bloom filters produces a new filter representing the union of the original filters' sets, bitwise `AND` produces a filter representing the _intersection_ of the filters' sets. Conveniently, the false positive probability in this new Bloom filter is bounded above by the false positive probabilities of the originals, ensuring that any tolerance established in the filter generation step is adhered to here as well.

In light of this, here's an idea: as soon as two peers connect to each other via an introduction point, they should send each other their routing Bloom filters. From these, a number of set intersections can be computed.

Of course, we should first check for the trivial case where each peer's local addresses are contained in the other's one-hop filter; this would indicate, somewhat embarrassingly, that the peers are already directly connected over radio but they somehow failed to notice this. This probably will not happen very often. In the majority of cases, a more involved strategy will be required.

Before getting into details, let's introduce some notation. We'll call our two peers $$a$$ and $$b$$ and denote $$a$$'s one-hop filter as $$a_1$$, their two-hop filter as $$a_2$$, and so on; likewise with $$b_1$$, $$b_2$$, etc. Denote bitwise `AND` and `OR` with $$\land$$ and $$\lor$$ respectively.

The intersection of the peers' one-hop filters, $$a_1 \land b_1$$, gives the set of all addresses and address prefixes that can be reached by both peers in one hop. This set almost certainly will contain some prefixes, but it is not guaranteed to contain any full addresses. However, if the intersection _does_ contain a full-length address then the peers have identified a specific address which they are both one hop away from. This will (with overwhelming probability) mean that they have also identified a third peer who can serve as an introduction point for a minimal-length circuit between the two peers.

So how do we check whether any full addresses are contained in the intersection filter? If the full address is contained in the filter, then necessarily all prefixes of it will be as well, and so we can just run a depth-first search. This search will either terminate on a full address or determine that no such address is contained in the filter.

If an address is identified, the peers may attempt to look it up and establish a new connection over it. If this fails, they may search for any other addresses in the filter and try these as well.

If no addresses are found, or if all attempts at new connections fail, then the peers may move on from looking for a two-hop circuit to looking for a three-hop circuit. This means they need to find a third peer who is one hop from one peer and two hops from the other, so the Bloom filter to search here is given by $$(a_1 \land b_2) \lor (a_2 \land b_1)$$. If they find a full address here and carry out a successful rendezvous through it, then great; if not, they'll need to look for a four-hop circuit, for which the filter to search will be $$(a_1 \land b_3) \lor (a_2 \land b_2) \lor (a_3 \land b_1)$$.

This process can be run until we identify enough circuits or run out of Bloom filters.

Given enough time, this process should allow two peers to exhaustively identify all the addresses they can both reach and to determine the minimum number of hops required to set up a circuit through any such address.

Note that any two peers who are able to open a connection through a rendezvous point in the first place trivially must have at least _one_ address that they both can reach: the rendezvous address. As such, this process can be expected to turn up at least one result.


## Security

Allusions have been made throughout this post to similarities between this design and the architecture of onion networks. Of course, direct parallels can't be drawn without a full specification, but if I were to write a full spec, I would make it a primary goal to try to carry over as many of onion networks' security properties as possible.

Nodes in the network would have personal public/private keypairs, and would broadcast their public keys along with all other relevant data. The lifespan of keys would likely be per-session (or maybe even per-connection) to try and limit the degree to which users could be tracked through them. These keys would be used by the message transport layer to hide every aspect of a message except for the next hop in its route.

Of course, a somewhat greater level of trust in the network is required here than in Tor since we rely on remote nodes to announce their neighbors, as well as their neighbors' public keys, addresses, filters, etc. There is lots of room for research into minimizing risk here. Disjoint lookups, already mentioned above, might help significantly.

An efficient, low-overhead ad-hoc mesh network protocol stack would be a powerful tool for resisting pervasive corporate and governmental surveillance, moreso because the network would lack any barrier to entry whatsoever and because peers could remain effectively anonymous (aside from any physical location data leaked by their radio signals) as desired.


## Scaling

Let's be clear: peers will have a limited knowledge of the full mesh, and will only be able to connect to peers they can establish a rendezvous with. It follows that there is no guarantee of every peer being able to reach every other peer. In large networks, distinct "regions" with limited interconnectivity may form.

This could be mitigated to some degree by establishing "shortcuts" between the cores of these regions. Shortcuts could operate over long-range point-to-point radio, internet link, satellite link, or whatever else. They would knit distant regions together, dramatically lowering average path length in the network graph and increasing the odds of successful rendezvous.

Just as an aside: I personally think that a certain spatial limit might not necessarily be a bad thing. A degree of locality in the network could have benefits as well as drawbacks. Only time can tell for sure, and there are interesting arguments to be made both ways. More on that later, maybe.


## Prior Work

The idea of limiting any individual node's knowledge of an ad-hoc network's overall layout is not new; this was being discussed at least as far back as '99 ([PDF link](http://www.ee.oulu.fi/~carlos/papers/routing/IW99.pdf)), and the advantages of this strategy for building scalable networks have been noted for just as long. However, the chosen strategy for the linked paper was to limit how often peers send routing info updates past their immediate neighbors, rather than to find a routing protocol whose baseline maintenance only ever requires peers to exchange routing info with said immediate neighbors.

I am not aware of prior work on using Bloom filters in this context. If you are, please [reach out](/contact.html) -- you would absolutely make my day.


## Applications

Relative to current networks, it appears that this protocol could form a core part of networks providing greatly preferable privacy properties.[^6]

[^6]: For instance: it is common for copyright holders (music labels, movie studios, etc) to monitor BitTorrent peer swarms operating over the internet, and to serve copyright infringement notices to the owners of any IPs observed in a swarm. Whatever you might think of people who torrent copyrighted material, it is clear that this practice on the part of the copyright holders is designed to intimidate and take advantage of people who lack the means to stand up to legal threats, and that for these copyright holders the fines associated with such notices serve as a way of profiting off artists' work without having to share any of the profits with said artists. This is just one example of an exploitive practice which would not be possible if network connections could be established without sharing any personally identifying information.

This sort of construct would be valuable in areas where internet service is not available or where it has been disrupted (e.g. in the aftermath of a natural or artificial disaster). In areas where internet service is broadly available, the value of a mesh network may seem less obvious to some, but it is no less real: not only would it provide redundant infrastructure, it would also be free to join. People with Internet connections could perhaps even establish crossover points between the internet and their local ad-hoc network, serving as bridges to grant internet access to their peers in the mesh network.[^7] Since internet access is increasingly becoming a necessity, the possibility of providing it for free is very attractive and has the potential to have a concrete positive impact on many people's lives.

[^7]: Though doing this would, of course, almost certainly violate their contract with the ISP, though it's anyone's guess whether the ISP will notice. The ISP issue could also be bypassed completely if (say) the internet access is provided through a direct line into an [internet exchange point](https://en.wikipedia.org/wiki/Internet_exchange_point).

It would be trivial to build a DHT on top of this construct as well, though this may or may not be a good idea. It would raise the memory overhead associated with maintaining a presence on the network.

This infrastructure could also lay the groundwork for entirely new categories of app architecture. More on that later, too, maybe.


### Questions

* What would be the best method for generating local addresses? They must be evenly distributed, they should be expensive to generate but easy to verify, and it would be nice for part of the generation process to involve a timestamp which is shared along with the address (so that addresses can be made to expire after some amount of time, to raise the difficulty of address squatting).

* The elephant in the room: how would a message transport layer go about optimizing routes based on individual point-to-point connections' individual bandwidth? This seems hard. Is it possible? Is it necessary?

* What sort of methodology should be used to determine appropriate Bloom filter parameters?

* How can we model the routing protocol's overhead? It appears to meet the requirement of being $$\mathcal{O}(n)$$ with regard to network size, and it seems intuitively likely that bandwidth would decrease as the network's average path length decreases[^8], but how can we formalize these intuitions, and what other patterns can we find?

[^8]: My reasoning here is that in networks where many addresses can be reached with a small number of hops, peers are likely to be sending fewer total filters since they will reach their filter saturation cutoff more quickly.

* How much of this traffic can be encrypted? (ideally: most or all)

* How much would the network benefit from adding "shortcuts" (e.g. long-distance high-bandwidth radio links between distant endpoints, or nodes which also have internet connections and use these to knit physically distant regions of the mesh together)? Under what circumstances, if any, would these be necessary?

* How should we manage public identities on the network? Should identities be long-lived, per-session, or per-connection? Should we even have any rules here?

* How well does this algorithm handle peer churn? How fast should the update intervals for broadcasting Bloom filter changes be? Should the interval have any sort of built-in dynamic scaling?

* It would be trivial to extend this routing algorithm to include a distributed hash table construct resembling Kademlia or Theseus DHT. Would this be a good idea?

As you can see, there's a lot more work to be done here to fill this idea out and get anything even resembling a full specification. That said, this routing construct feels powerful, and I wonder if something useful could come of it.

<hr>
