---
layout: post
title: Distributed Search in Theseus
mathjax: true
tags: [theseus]
---

> Previously:<br/>
> [Theseus: A Robust System for Preserving and Sharing Research]({{ site.baseurl }}{% post_url 2017-02-17-theseus-robust-system-for-preserving %})<br/>
> [Resisting Sybil Attacks in Distributed Hash Tables]({{ site.baseurl }}{% post_url 2017-02-25-resisting-sybil-attacks-in-distributed_25 %})<br/>
> [Securely Finding Friends via DHT Dead Drops]({{ site.baseurl }}{% post_url 2017-02-27-securely-finding-friends-via-dht-dead %})<br/>


Search algorithms in peer-to-peer networks have a long, storied, and not terribly happy history. Search might sound like a basic problem but in fact it turns out to be alarmingly difficult even in non-adversarial settings. In realistic models which assume the presence of some hostile peers the situation is even worse.

It has taken me a while to sit down and write this post. There are two reasons why. First off, I've been pretty busy: on top of keeping up with my job, last week was my last finals week before graduating with my Bachelor's, yesterday was commencement, and next weekend is PRCCDC. So I've been spread somewhat thin. The second reason is that search is a very hard problem, and I've been holding off until I'm confident I've got something worth sharing. Luckily, after making some headway in the last couple weeks, I think I have just that.

Before we go any further, let me just say one thing: The design I'm proposing is simple enough that (like much else that I've written about on this blog) I'd be surprised if I'm the first to get to it. However, I have yet to find such prior work, and if anyone could point me towards it I'd be incredibly grateful.

I'm also providing this idea sans technical analysis. All I'm saying (right now) is: here's an idea that sure sounds like it could work.

For the sake of providing context, we'll take a moment to discuss previous attempts at peer-to-peer search before delving into what I'm proposing.

<br/>
# Prior Work

[RFC 4981](https://tools.ietf.org/html/rfc4981) is a whirlwind tour of major work on this topic up to '07. There seems to have been surprisingly little work since then (perhaps due to the difficulty of the problem, which RFC 4981 indirectly demonstrates through its length and density). Most of the strategies outlined are either uncomfortably simple, uncomfortably complex, or some unholy amalgam of both. Also, little attention seems to have been paid how these various approaches perform in adversarial contexts -- perhaps because everyone already knows that the findings would not be pretty.

One thing worth mentioning is that the obvious approach to p2p search, which was implemented by Gnutella, fails miserably. Their strategy was to simply define a "search" message which explicitly describes what you're looking for. Then, whenever you wanted to do a search, you would send these messages to as many of your peers as possible. This works alright for small networks, but to say it scales poorly would be a dramatic understatement. It can be seen that total bandwidth used by the peer swarm grows exponentially with network size. The details are discussed at some length in RFC 4981; their ultimate conclusion is that scalable systems unavoidably require some sort of routing structure to reduce overall network load.

In surveying the rest of the survey, I found nothing that lined up with all our requirements. In the time since that survey's publication, there have been some more recent developments. None that I know of have fully met our requirements, but a couple of them perhaps merit brief discussion before we move on.

In '08, a protocol called Cubit was released which took on the problem of inexact keyword search using the concept of edit distance. This work made enough of a splash at the time to [land a writeup in Ars Technica](https://arstechnica.com/uncategorized/2008/06/cubit-p2p-search-protocol-could-one-day-sink-the-pirate-bay/). The idea, roughly: Nodes in a p2p overlay graph were transparently associated with specific search terms, and when you wanted to carry out a search, you would query not only the node corresponding to a given word but also the nodes whose words were closest to it by the edit distance metric (which the overlay structure ensures are proximal in the routing graph as well). One stated goal of the protocol is to gracefully handle misspellings in search queries. (I'm not sure why those can't just be taken care of by a spell checker.) The protocol seems, unfortunately, to suffer from serious lack of resilience in the presence of hostile peers.

Around the same time, the Tribler torrent client's team was developing (and continues to develop) a different approach to a similar problem. Specifically, their goal is efficient, low-bandwidth exact-match keyword search for torrent files. The idea is to have everyone in the network share their download histories, and to let peers with similar histories be close in the overlay graph. When you carry out a keyword search, the peers closest to you are queried first, the idea being that since their tastes resemble yours, maybe they've already looked for and found what you're looking for now. This scheme yields some nice properties; however, they come at an obvious and massive cost as far as user privacy is concerned. The Tribler team deserves credit for [acknowledging this problem](https://github.com/Tribler/tribler/issues/2547), as well as that their protocols operate in an [adversarial environment](https://www.tribler.org/AdversarialContentSearch/). They even go so far as to suggest appropriate countermeasures for some malicious behavior. Unfortunately, their countermeasures are generally based on reputation-management systems. My reservations about such systems are discussed in previous posts.

So, neither of these systems quite meet our criteria. This, again, underlines how challenging the problem of p2p search really is. What I'm proposing here is a system which is (arguably) simpler than those suggested above, and which excels in some of their weaker areas, in particular by possessing several very nice privacy-related properties. It also allows for significant routing redundancy, which is desirable under adversarial conditions and which helps prevent hotspots in the network.

<br/>
# The Idea

### Fun with Bloom Filters

The approach is centered around [Bloom filters](https://en.wikipedia.org/wiki/Bloom_filter), which have many useful properties:

1. At the minor cost of a small but nonzero false positive rate, they allow large content indices to be stored with remarkable space efficiency. This space efficiency makes them easy to fit on the wire, and also makes them amenable to storage en masse.

2. They are inherently one-way, which has desirable privacy properties. Every Bloom filter technically represents an infinite set; as such, any given Bloom filter can be generated by a number of different input key sets, and going only by the filter there is no way to tell for certain which set was used. Given a key, you can test its membership in a Bloom filter, but the possibility of false positives means that some level of deniability is maintained even if a hit is found.

3. They have meaningful behavior under bitwise logical operations. Relatedly, the number of elements in a Bloom filter or in the union or intersection of two Bloom filters can be [straightforwardly estimated](https://en.wikipedia.org/wiki/Bloom_filter#Approximating_the_number_of_items_in_a_Bloom_filter).

4. Querying a Bloom filter for a key involves checking the filter against a certain bit mask derived from the key in a way that (for good hash functions) is infeasible to reverse. A user may thus search for a key by generating a bit mask and sending it to remote peers, who can check if their known filters contain it without even really knowing the key they're searching for. The mapping from keys to masks is many-to-one, meaning that attempts to invert it cannot ever achieve perfect confidence in their results.

5. There has been interesting research into optimizing Bloom filters for network transfer, with excellent results. The work is presented [here (PDF)](http://www.eecs.harvard.edu/~michaelm/postscripts/ton2002.pdf) and summarized in section 2.6 of [this survey (PDF)](http://www.eecs.harvard.edu/~michaelm/postscripts/im2005b.pdf). The main finding is that while ordinary Bloom filters don't compress well, it's possible to create sparser Bloom filters which are optimized for compression and end up with a structure that takes up more space in memory but less space on the wire, for a given false positive rate, than the corresponding ordinary Bloom filter. This trade-off is in some cases very appealing.


### Metametadata

We start with the assumption that everyone has, in local storage, metadata for a certain number of files. For this post, we're not yet going to worry about where it comes from. The problem we're trying to solve here is: if everyone has a certain amount of metadata, but no one is maintaining a master record of who has what, how can we efficiently implement keyword search across everyone's metadata?

One possible answer, as I see it, is for everyone to communicate an approximation of what they've got using Bloom filters, and to use some simple tricks to build an efficient and highly redundant routing system out of those filters.

More specifically, everyone individually takes the names of (or other tag data for) every paper they have metadata on, then inserts every relevant keyword (excepting [stop words](https://en.wikipedia.org/wiki/Stop_words)) into their Bloom filter and shares this filter with other peers upon request. The linguistically perverse might be inclined to call this filter a peer's metametadata. Everyone stores up-to-date Bloom filters from all the peers in their routing tables.

On top of that, whenever a Bloom filter is received, we compute the value $$\lvert F_r \rvert + \lvert F_r \land F_l \rvert$$, where $$\lvert F \rvert$$ represents the Hamming weight of a filter, and $$F_r$$ and $$F_l$$ are the remote and local nodes' Bloom filters respectively. We record in a separate list the N nodes for which this sum is largest, out of all the nodes we've received Bloom filters for. Like peers in routing table buckets, the peers on this list are periodically pinged to check their freshness.

Keeping this list helps us make sure that we know at least a few nodes with well-populated large Bloom filters, which is useful since we have no built-in guarantees about the filters of the peers in our routing table. It has the further interesting property of promoting a degree of clustering in the network, since the second term in the summand favors nodes whose Bloom filters $$F_r$$ have many bits in common with the local filter $$F_l$$.

It may be appropriate to place a dynamic upper limit on $$\lvert F_r \rvert$$, to weed out filters for which the false positive rate would be prohibitively large and to prevent malicious nodes from trivially poisoning everyone's filter lists with all-1 filters. It may also make sense to restrict this list to only include peers not already in the routing table, to avoid redundancy. If the clustering effect is found to be insufficiently weak to prevent hotspots from forming, we may want to include a constant coefficient like (say) $$\lvert F_r \rvert + 2 \lvert F_r \land F_l \rvert$$.

Note that these are all decisions which individual nodes can make for themselves, internally, without taking input from or even informing the network. This means that different clients -- or successive versions of the same client -- can try different strategies without harming the overall network (except for the potential harm that would result from a client choosing a bad strategy and making itself less useful than it could otherwise be).

### Search

To carry out a search, we define a couple queries: one to request data from a remote node, and one to find nodes whose Bloom filters match the data you want to request. We'll describe them at a high level here and go into more detail below.

The first query is simple. Let's call it "search_files". You send a request for some data to the remote node, which either sends back what you wanted or apologizes and says it doesn't have what you're looking for.

The second query is simple as well but has certain subtleties. We'll call it "search_peers". The idea is that if your immediate neighbors don't have the data you need, you can ask them to help you find other nodes who might. You do this by sending the Bloom filter masks describing your query to the peers who are closest to having a match, i.e. who have most of the mask's bits set. These nodes, in their filter lists, keep track of other nodes with large Bloom filters having large intersections with their own. Thus, they are likely to be able to point you in the direction of nodes that match your search even better than they themselves do. Applying these query iteratively should allow a user to find very many peers.

The concept behind these queries is somewhat similar in spirit to the design of Kademlia, and proofs of Kademlia's proper function suggest broad strokes for several heuristic arguments for this system's efficacy as well.

### Bit Masks

Say you have three keys: $$K_1$$, $$K_2$$, $$K_3$$. You have a Bloom filter $$B$$ that you want to check the keys' membership in. Running our $$k$$ hash functions on $$K_1$$ gives us a bit mask with (up to) $$k$$ bits set in it. Call this mask $$M_1$$, and define $$M_2$$ and $$M_3$$ analogously.

To check for $$K_1$$'s membership in B, we just test whether $$M_1 = B \land M_1$$. To check for $$K_1$$ through $$K_3$$ at once, we can run a parallel query by computing a new value $$M' = M_1 \lor M_2 \lor M_3$$ and testing whether $$M' = B \land M'$$.

Thus to search for a set of keywords $$K_1, ..., K_n$$, we can simply compute the combined bit mask $$K_1 \lor K_2 \lor ... \lor K_n$$ and send this combined bit mask as our argument to the query. This conserves bandwidth and increases opacity as to the actual terms being searched for.

This allows us to efficiently use AND logic in our search queries. We can implement OR conditions by conducting multiple queries and implement NOT conditions through local filtering of results. Part of the goal of this design is to recognize which problems it is appropriate to solve at the protocol level and which problems are better handled in other parts of an application, and to use this recognition to design a protocol which does everything it needs to and nothing more.

> Follow-up: While this is important, a counterbalancing consideration is the need to conserve network bandwidth. This is important both for practical reasons and to increase the protocol's flexibility with regard to traffic pattern masking, which is discussed at some length in later posts. As such, it may be appropriate to include a NOT condition, with the full recognition that it may be appropriate to use under some circumstances but not others. Note also that NOT conditions do not map quite as elegantly to the Bloom filter, since false positives would be much more problematic here.

<br/>
# Specifics (or Lack Thereof)

One weird thing about this system is that in its current iteration it requires constant, universal Bloom filter parameters across the entire network. This is tricky because filter parameters are typically optimized as functions of two variables: the desired uncompressed filter size, and the expected number of elements in the filter. Since the number of filter elements is likely to vary widely from peer to peer, coming up with good values here is a nontrivial task. More accurately: it's easy to do, but hard to do right.

When I can spare the time -- probably next week -- I'll sit down with a notebook, a Python terminal, and something green that's illegal to take across state lines, and I'll work at this until I come up with some good arguments for what an optimal parameterization might look like. I'll try to have some good simulations to back those parameters up. Another question to be answered as part of that analysis is whether the value of compressed Bloom filters outweighs the increased cost of computation they entail. This all will require a lot of fun but fairly involved math. Expect gory details.
