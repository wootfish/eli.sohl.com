---
layout: post
title: The State of Theseus, One Month In
tags: [theseus]
---

For just over a month now I've been working nonstop on one part after another of my current pet project, Theseus. Things are coming along very well so far -- in fact, I've surprised myself with the amount of progress I've been able to make in such a short time.

That said, I have yet to write a single line of code. This is because I'm trying to nail down a complete specification of the system first. The system has many moving parts, some of which possess complex interdependencies, and it's important to try to get this stuff right the first time.

The goal of this post is to take inventory of what's been done so far and to list out everything that's still needed in order to reach a point where work on an implementation can begin.

If you'd like to collaborate on Theseus, I'm hoping this post will give you an idea of where your contributions would be particularly valuable. If you're realizing at this point that you're not even sure what Theseus is, I've got you covered: The beginning of my introductory post, [Theseus: A Robust System for Preserving and Sharing Research]({{ site.baseurl }}{% post_url 2017-02-17-theseus-robust-system-for-preserving %}), can take care of that. I'll be directly referencing that post throughout the discussion below.

<br/>
# Progress on the Promises

In that original blog post, I laid out five major promises that I believed Theseus could provide. It would not be an exaggeration to say that these promises have guided the entire design of the system, and I remain fully confident in its ability to deliver on every single one of them. Some of them, I've already described solutions for. Others, I've found solutions but have yet to write them up. There are also some outstanding questions that need to be answered, either through hard work or consultation with subject experts.

The promises are laid out and described in the original post. Below I'll list them in order and discuss the progress made on them thus far.


### 1. A Guarantee of Robustness in the Face of Censorship

The system is useless unless it is robust under adversarial conditions. The unfortunate truth is that both private publishers and the current administration of my own country could conceivably take issue with this project's goals. As such, it is only prudent to do everything in my power to make sure the project can withstand their utmost efforts against it.

I lack the subject knowledge to understand the legal channels through which the project might be attacked. My suspicion, as I've mentioned elsewhere, is that anyone trying to pursue such an avenue of attack would be facing an uphill battle, since all I'm creating is a tool through which researchers may share their work without fear of censorship. Hopefully we'll be able to avoid putting this suspicion of mine to the test.

Setting aside such concerns (at least for the time being, until I can get in touch with someone having the appropriate legal background), we move on to technical concerns. These, I am more confident with. The question here is whether technical attacks exist which could prevent Theseus from functioning properly, effectively censoring the system by either rendering it unusable or rendering certain of its content inaccessible.

Denial-of-service attacks are obviously possible against individual nodes. However, the more nodes we have in the network, the less viable these attacks become. Thus this threat can be mitigated simply by making Theseus useful enough to see wide adoption.

At the heart of Theseus is a distributed hash table (DHT). This DHT has a number of uses in the system, some of which I have yet to write about in detail. Attacks on this DHT would have serious consequences. The most potent class of attacks on DHTs are known as Sybil attacks, which in fact are the bane of virtually all peer-to-peer systems. In [Resisting Sybil Attacks in Distributed Hash Tables]({{ site.baseurl }}{% post_url 2017-02-25-resisting-sybil-attacks-in-distributed_25 %}), I describe several countermeasures to these attacks which, to the best of my knowledge, constitute original research. Through these, I expect Theseus will be able to achieve virtually unprecedented resilience in the face of Sybil attacks.

Another critical component of Theseus is its distributed search functionality. This functionality is described in [Distributed Search in Theseus](2017-03-21-distributed-search-in-theseus). It relies on information returned by peers to get its results; as such, it obviously assumes access to honest peers. Dishonest peers can always return bad search results which would be nontrivial to identify as bad. However, they cannot prevent honest peers from returning honest results. The question of distinguishing honest and dishonest results is a very difficult one. Some methods that might help include: lending more weight to results returned by many nodes, using basic spam-filtering techniques locally, carrying out DHT lookups for returned links and prioritizing links with large numbers of available peers, prioritizing nodes possessing trusted public keys when carrying out the search, and so on.

The challenge here is to try to minimize the impact of these measures on search speed. It might be appropriate to allow the user to specify how paranoid their client should be, so that the more costly of these measures end up only being deployed as reactive countermeasures when a user starts noticing that they're getting lots of bogus search results.

Interesting future work in this vein could include: Investigating the viability of the countermeasures listed above, trying to come up with new countermeasures to add to the list, and investigating the various ideas' implications where latency is concerned.

The only other aspect of Theseus where censorship is applicable (as far as I can see) is where its social features are concerned. These have yet to be fully fleshed out, but anonymity and deniability are top priorities in their design. The only work I've released so far on this topic is [Securely Finding Friends via DHT Dead Drops]({{ site.baseurl }}{% post_url 2017-02-27-securely-finding-friends-via-dht-dead %}).

### 2. Guarantees of Anonymity for Users Who Need Them

The Theseus control protocol -- which handles everything except file downloads -- is intended to be low-bandwidth and to operate over TCP. As such, it could potentially be routed through a proxy, a VPN, or even over the Tor network. As mentioned in my original post, routing large downloads through Tor is rightly frowned upon; however, using it for lower-bandwidth activity like this is simply using the network as intended.

For some users, these options might not be enough. Maybe their threat model precludes simple solutions like VPNs (there are situations where this is entirely reasonable). Maybe they live in a country where access to Tor is restricted. For these users, I'm currently considering including in the Theseus spec a poor-hacker's equivalent to the Tor network, much like [what Tribler uses for anonymizing downloads](https://www.tribler.org/anonymity.html). More on that in a future post.

That takes care of anonymity at the control layer. At the download layer, here is what I'm thinking.

Users who trust a VPN can, of course, use that VPN to anonymize their UDP download traffic.

Regardless of other factors, the Theseus client should default to forcing encryption on all downloads / uploads. It's probably wise to include an option to disable mandatory encryption, for users who know what they're doing. It's probably also wise to discourage this by tucking the option deep in a config menu.

Encrypting traffic should go a long way towards thwarting ISP-level surveillance, but the person you're downloading from still knows what you're downloading. Thus, malicious peers still can get more insight into network behavior than we would perhaps like them to. As such it might be prudent to implement functionality similar or identical to the Tribler download-anonymizing spec linked above. I doubt it would be possible to make Theseus and Tribler clients interoperable -- but if it is possible, it might be a good idea. This is something that needs to be researched more thoroughly. Getting a clear idea of how this would work, if it would work, is an absolutely critical prerequisite to nailing down a draft spec for Theseus.

### 3. The Ability to Quickly Search for Papers on Any Topic

As mentioned above, [Distributed Search in Theseus](2017-03-21-distributed-search-in-theseus) deals with this exact topic and gives a detailed description of the solution I have in mind. Next steps for realizing this solution are also described therein. Practically all that's left is to decide on implementation details.

### 4. The Ability to Securely Share Your Own Research

I have a full, detailed idea of how this will work. It is described in some detail in the original post on Theseus. Expect more in an upcoming post -- in fact, writing that post might be my next priority.

### 5. The (Potential) Ability to Sidestep Thorny Copyright Issues

As stated in the original post:

> _I am not a lawyer_. Nothing in this blog post is legal advice, because legal advice is something I am not qualified to give. However, from my lay understanding I am optimistic about this tool's potential for circumventing restrictive laws and promoting freedom of information in the sense advocated by <a href="https://archive.org/stream/GuerillaOpenAccessManifesto/Goamjuly2008_djvu.txt">greats like Aaron Swartz</a>.

and:

> Decentralized services are very difficult to bring down, especially if they have nodes in multiple countries. Skeptical? Just ask the music industry.

These quotes continue to accurately reflect my views on this topic. If anyone with a better knowledge of modern copyright law would be interested in exploring this topic further, please get in touch.

<br />
# The Big To-Do List

In the discussions above, I outlined some things that still need to be done. Here is a more comprehensive list of what I see as standing between what we have and what we need to start implementing (roughly ordered to place prerequisites ahead of their dependencies):


* Brainstorm front-end ideas

    * There won't be a blog post on this until I have enough material to include some cool illustrations.

    * The priorities for the front-end are to make search intuitive and collaboration as painless as possible.

    * The goal is to make Theseus useful to as many people as possible, so outside input would be _invaluable_ here.

        * What features would be useful to you?

        * What are some things that existing research tools get wrong?

        * Would you be interested in collaborating on the project's interface design?

* Work out a universal format for storing data in the DHT

    * We're using it as a workhorse for several different aspects of the design

    * It needs to be flexible and support a variety of types of data, including...

        * For metadata collection:

            * Magnet links to files containing large amounts of document metadata

            * Cryptographic signatures for the above magnet links

            * (potentially:) The public key used to generate said signatures

        * For [friend-finding]({{ site.baseurl }}{% post_url 2017-02-27-securely-finding-friends-via-dht-dead %}):

            * Raw encrypted data which arrives sans context

            * Diffie-Hellman public-key integers

            * Cryptographic signature of above integers, possibly incl. public key

        * For actual torrenting:

            * Tracking lists of peers (some of which might actually be anonymous introduction points a la Tribler anonymous seeding)

            * [this is meant to mimic but operate disjointly from Mainline DHT's functionality, providing torrent-finding functionality to peers who _only_ trust anonymized communications with other Theseus nodes]

    * The question of whether or not to include public keys in the records is a tricky one which depends on several factors. The question is subtler than it may initially appear. I'm currently leaning towards including them.

    * One major priority in designing this format is to try and keep it as flexible as possible to encourage forward- and backward-compatibility, since it is possible that the DHT could end up shared between clients running multiple versions of the eventual Theseus protocol.

    * I've got a lot on this topic in my notebooks, and I'll probably be writing a post about it soon.

* Work out a universal format for metadata files

    * This involves deciding what kinds of data we want to track. A non-exhaustive list of ideas, not all of which necessarily merit inclusion:

        * Title

        * Author(s)

        * Author-specified tag list

        * User-specified tag list

        * Year of publication

        * Citations in paper (potentially w/ cross-references for other Theseus-accessible papers)

        * Citations _of_ paper (potentially w/ same)

        * User-provided annotations

        * etc...

    * The considerations outlined above concerning backward- and forward-compatibility apply here as well.

* Work out an appropriate set of parameters for [the search feature's Bloom filters](2017-03-21-distributed-search-in-theseus). There is potential here for interesting math, pretty graphs, etc.
    
* Work out in more detail the protocol's features concerning anonymity, as discussed in brief above, and potentially write a post about these as well if there turns out to be enough to say.

    * Do we like Tribler's approach to anonymizing downloads?
    
    * If so, can we plug into their system? Would they be OK with that? Would we even want to? Would we be better off just using their protocol across our own separate overlay graph?

* Nail down a rough draft of the Theseus control protocol (and potentially of the UDP anonymization system as well, if applicable)

* Start implementing and testing!


This might look like a long list, but it's a hell of a lot shorter than it would've been a month ago. I'm looking forward to seeing what it looks like a month from now!
