---
layout: post
title: Sybil Defense
mathjax: true
---

<style>
{% include sybil-prefix-tree.css %}
</style>


# Introduction

This post discusses some well-known security issues with modern distributed hash tables.

We start with a discussion of attempted solutions, then review the current best-known solutions. Some issues with these are identified and discussed, and remediations are proposed. The final section, which makes up the bulk of the post, consists of a thorough mathematical analysis of these remediations' effectiveness.

It is shown that while Sybil attacks cannot be prevented entirely, they can be made impractical while introducing only negligible overhead for honest peers.

This post's main contribution is a method for quantifying precisely _how_ impractical a Sybil attack may be under any given set of network parameters. The results are surprisingly strong, and indicate that modern DHT constructs could be made much more secure with some very easy and simple design changes.

# Background

Sybil attacks are really hard to defend against. The basic issue is this: if you have a peer-to-peer network that anyone can join anonymously, there's no good way to keep someone from joining a bunch of times with a bunch of different names. An increased presence in the network often leads to an outsided level of influence over it, and that is the root of the problem.

The simplest and most common solution is to introduce a central authority who certifies identities. This solution has been breathlessly proposed many, many times.[^central] Of course, it completely sacrifices decentralization and anonymity, and so it is not appropriate for ad-hoc peer-to-peer settings.

[^central]: TODO Cite

OK, so that's a no-go -- what else has been tried?

A couple other common solutions: associating identity with some invariant aspect of network topology,[^topology] or associating it with social graph data.[^social] The former of these is fragile and inflexible,[^topology-tor] and the latter compromises user privacy by design. These compromises are clearly are not acceptable either.

[^topology]: TODO Cite

[^social]: TODO Cite

[^topology-tor]: TODO explain why this is incompatible with eg Tor

The fourth solution class, and the one that has seen the most interesting results in ad-hoc contexts so far,[^pow-papers] is proof-of-work. It has been proposed that peers could periodically send puzzles to each other, the idea being that if a peer can't promptly find and send a solution, they are not to be trusted. This places an upkeep cost on each identity operated, thus theoretically pegging an attacker's total number of identities to their computational capacity.

[^pow-papers]: TODO Cite (mention S/Kademlia)

This is an improvement: we aren't leaking any social metadata, we aren't relying on anything fragile (to our knowledge), and we need no central authority. However, there are drawbacks: First, the overhead for this scheme is very high,[^pow-overhead] and second, it penalizes peers for maintaining connections with a large number of peers (since this will result in them receiving more challenges). This disincentivizes broad engagement with the network. These drawbacks are also serious.

[^pow-overhead]: This is not an idle concern: TODO rant about bitcoin

The above is just a quick overview geared towards giving you some idea of the main sorts of proposed solutions; for some more thorough surveys, see the footnote.[^surveys]

[^surveys]: TODO Cite

# Proof-of-Work Kinda Works

The 2002 paper which introduced the term "Sybil attack" also proved that "without a logically centralized authority, Sybil attacks are always possible except under extreme and unrealistic assumptions of resource parity and coordination among entities."[^sybil-2002]

[^sybil-2002]: TODO Cite

It has been shown, then, that the attack cannot be defended against in general. However, its impact can be mitigated in specific cases.

The classic success story (if we can call it that) is Bitcoin; for all that Bitcoin is tremendously wasteful,[^bitcoin-waste] it also actually no-shit _works_. We take it for granted today, but a decade ago that was flat-out miraculous. The reason Bitcoin works is because peers gain influence in the network by solving proof-of-work problems. Thus, your influence is constrained by the amount of compute power you can afford to bring to bear.[^bad-pow]

[^bitcoin-waste]: And it is: TODO rant about bitcoin more

[^bad-pow]: Though not all compute power is created equal, at least for Bitcoin: they chose a hash function (SHA-256) that runs quickly with low memory overhead, meaning it is embarrassingly easy to parallelize on cheap, low-horsepower specialized hardware (eg GPUs or ASICs). These hardware miners have much higher ROIs than consumer hardware, granting an outsized level of network influence to those who can afford to pick up (and run) specialized hardware. Proof-of-work systems are generally better off using a memory-hard hash function like Argon2 or a purpose-built proof-of-work algorithm like Equihash.

The problem, of course, is that Bitcoin's security is predicated on the combined hash rate of all honest peers exceeding that of any attacker. Thus, honest peers must pay greater hardware and power costs than any attacker can afford to at all times. _None of us are as dumb as all of us_.

Anyway, the point of that digression was to set up this question: we've seen that proof-of-work works, but can it work _efficiently_? I believe that it can. I'd like to describe a solution, and provide some analysis for it, in the specific context of distributed hash tables. First, though, we'll need a little more background.


# Kademlia and S/Kademlia

Let's talk distributed hash tables. All sorts of DHT designs are proven to work in theory, but in practice Kademlia is the most popular by far. If you're not already familiar, [Wikipedia has a good article](https://wikipedia.org/wiki/Kademlia) that you might want to scan through before continuing.

Plain Kademlia (as implemented in e.g. Mainline DHT) is horribly insecure. The currently recognized state of the art (as far as I know) is a variant called S/Kademlia.[^skademlia] You can tell S/Kademlia is an improvement because it has "S", which stands for Secure, in the name.[^proto-hyperbole] How secure is it?

[^skademlia]: TODO cite

[^proto-hyperbole]: Side note: can we please declare a moratorium on hyperbole in protocol names? It never goes well -- just look at WEP, aka "_Wired Equivalent Privacy_". That's great marketing, but it's also totally untrue and, for the designers, probably a little embarrassing in hindsight.

Let me first say: The S/Kademlia designers have some really good ideas. They provide interesting and compelling modifications to the stock peer lookup algorithm. I consider that to be the best part of their work. They also recognize the need to prevent peers from choosing their own Node IDs.

They propose generating node IDs from cryptographic hashes of identity-certifying public keys. These keys are used for authentication and to ensure message integrity. For Sybil defense, two options are provided.

First, they suggest that public keys could be endorsed by a central authority. We have already discussed and dismissed this option.

Second, they suggest sharing public keys alongside solved computational puzzles. This is similar, but not identical, to the fourth solution class discussed earlier: the differences are that peers come up with their own puzzles (instead of being challenged), and the puzzle only has to be solved once, when the peer is first initialized, rather than on an ongoing basis.

Unfortunately, one of the puzzles specified in the S/Kademlia paper is broken.


# Breaking S/Kademlia

If this were a Wikipedia article, this would be the part where you'd see a giant red banner saying something like, "WARNING: ORIGINAL RESEARCH." Let's just acknowledge that up front.

Now, here are the two puzzles given for S/Kademlia. A peer needs to solve both for their node ID to be accepted.

Let us define the following: a cryptographic hash function $$H$$, a method for generating public/private keypairs $$s_{\text{pub}}, s_{\text{priv}}$$, and a pair of constant integer parameters $$c_1, c_2$$ (which allow us to tune the difficulties of the first and second puzzles respectively).

Now, first, here is the "static" puzzle:[^transcription-1]

[^transcription-1]: Note: This algorithm is transcribed, with very light edits, from a figure in the original S/Kademlia paper.

1. Generate key pair $$s_{\text{pub}}, s_{\text{priv}}$$.
2. Calculate $$P := H(H(s_{\text{pub}}))$$.
3. If any of the first $$c$$ bits of $$P$$ are not 0, goto 1.
4. The node ID is $$H(s_{\text{pub}})$$.

There are several drawbacks to this scheme. It considers any given public key to be either valid or invalid, with the majority of public keys being invalid. Constraining the set of valid keys like this opens up some trivial theoretic attacks.[^storage-attack] Pre-existing identity keys generally can't be imported since the great majority of them will not pass validation. The scheme also requires two hash function evaluations when really only one should be necessary.

[^storage-attack]: TODO Explain trivial theoretic storage attack

Now, here is the second, "dynamic" puzzle:[^transcription-2]

[^transcription-2]: Again, this algorithm is transcribed from the paper with very light edits for clarity.

1. Import $$\text{NodeID}$$ from the previous problem.
2. Choose a random X.
3. Calculate $$P := H(\text{NodeID} \oplus X)$$.
4. If any of the first $$c$$ bits of $$P$$ are not 0, goto 2.
5. This puzzle's solution is $$(\text{NodeID}, X)$$.

The paper claims that the dynamic puzzle "ensures that it is complex to generate a huge amount of nodeIds". It is then stated that "crypto puzzle creation has $$O(2^{c_1} + 2^{c_2})$$ complexity". For a naive attack these values are certainly correct.

The issue is that once an attacker has identified _any_ hash input $$I$$ which passes the puzzle's test, they can set X to produce that input: $$X := \text{NodeID} \oplus I$$. This works since there is no way for remote peers to verify that X is truly random.

Thus, once a suitable value $$I$$ has been found,[^preimage-stealing] solutions to the second puzzle may be generated for free, lowering the total complexity to $$O(2^{c_1})$$, the cost for the first puzzle.

[^preimage-stealing]: Note that I say "found" and not "generated" because in fact there is no need for the attacker to generate this at all: they could simply observe some other peer's solution to the dynamic problem and copy that peer's value of $$NodeID \oplus X$$.


# Fixing S/Kademlia

A trivial mitigation would be to swap out XOR for concatenation in the dynamic puzzle, like $$P := H(\text{NodeID} \vert X)$$, or to use a more robust construction like $$P := \operatorname{HMAC}(\text{NodeID}, X)$$.

Of course, either of these changes would break backwards compatibility with the original S/Kademlia spec... but perhaps breaking backwards compatibility with a broken system is not such a bad thing.

Another note: The paper does not specify that $$H$$ should be a hard function, only that it should be cryptographically secure; however, most classic cryptographic hash functions are specifically tuned for speed, making them unsuitable for use in proof-of-work constructions. Common sense dictates that a hard function, ideally a modern, memory-hard password hashing function like Argon2, should be used for $$H$$.

If we are using a hard function for $$H$$, then we need to pay attention to how many calls to this function we need to make to verify a remote peer's NodeID. S/Kademlia's two-puzzle construction requires three calls: one to generate the NodeID, one more to check the static puzzle, and a third one to check the dynamic puzzle. We can improve on this.

Argon2 allows us to generate arbitrary-length hashes. Say NodeIDs are 20 bytes long (as in the Kademlia specification). We can simply parameterize $$H$$ to generate hashes of length $$20 + \lceil \frac{c_2}{8} \rceil$$, then treat the first 20 bytes as the NodeID and apply our proof-of-work test to the following $$c_2$$ bits.

This allows us to get the strengths of both puzzles (NodeIDs determined by hash function, node generation constrained by puzzle with tunable difficulty level) while improving validation speed by a factor of three.

Another improvement: Why should nodes only have one ID? If your available RAM greatly exceeds the amount of data people want to store near your node ID (as is almost certainly the case in the year 2020) then really you're letting resources go to waste by only claiming responsibility for that one neighborhood. Why not claim as many IDs as you can support?

If we're still including an arbitrary value X in the node ID generation hash, then there's no reason not to allow peers to just provide several values of X and to let them claim responsibility for all the corresponding node IDs. If Sybil peers are running multiple nodes, why not let honest peers do the same thing?[^lookup-question]

[^lookup-question]: An interesting aside: TODO ask if big-theta(log sub k of n) bound holds here or if perhaps a better best-case bound is possible. Revisit the underlying theory and see if there's an easy argument either way. If this change reduces average number of hops then path lookup success rates increase; this would strengthen the network against Eclipse attacks a lot.

Note also that using a hard function for $$H$$ allows us to get by with much smaller values for our work constant $$c$$. Since our trial rate will be dramatically reduced, our trial success probability can afford to dramatically increase.[^new-pow]

[^new-pow]: We could even consider redefining the proof-of-work challenge to give us more granular control over the success probability, but that's a subject for another post.

This, in turn, allows us to consider doing more with X. What if X wasn't arbitrary? What if we gave it some form of significance? Increasing our success probability means we'll have to try fewer values of X to find a solution, so we can certainly get away with adding some semantic significance to X.

Bear with me: what if we treat it as an expiration date? That is, we'd predefine a window of validity (say 36 hours), and we'd only accept NodeIDs if their corresponding values of X represented Unix timestamps between now and 36 hours from now.

This changes the cost equation for both attackers and defenders.

On the defenders' side, honest peers have to solve puzzles once every couple days rather than solving only a single puzzle when they first join the network.

On the attackers' side, it is no longer to generate a huge number of Sybil NodeIDs; now, they have to generate that many every 36 hours. Instead of requiring an attacker to compute some large total number of hashes, we're now requiring them to be able to field a large, sustained _hash rate_.

Since attackers have to solve the proof-of-work problem many more times than defenders in order to be effective, this change to the cost equation has a significantly greater impact on attackers than defenders.

How much of an impact? I'm so glad you asked.


# Modeling Sybil Attacks on S/Kademlia and Related Networks

If you thought the last sections were heavy on original research... buckle up.

I arrived at the following as part of my research for the Theseus DHT project, [which is currently on indefinite hiatus](TODO). I've been sitting on this result since 2018; I was waiting until Theseus DHT was further along before writing this up, but it's looking like that won't happen soon, so I guess I've waited long enough to share this.

A couple years ago I did a fairly thorough literature review and was not able to find any prior art for the model I'm about to share. Now, I'm no academic, I don't happen to know any subject matter experts to consult with on this, and I haven't done any lit review since that survey a couple years ago; all that being said, to the best of my knowledge this is the first time the following model has been published. If you know of any prior art, please [send it my way](https://eli.sohl.com/contact).


### Definitions

Let's start with some constants.

Let $$L$$ denote the length of node IDs (in bits). In S/Kademlia, $$L = 160$$. Some other Kademlia-based DHTs set $$L = 128$$. Either value is fine.

Let $$n$$ denote the number of honest nodes on the network at some moment in time.

Let $$m$$ denote the number of _malicious_ nodes on the network at the same moment.

Let $$k$$ denote the size of our routing lookup sets.

We will be dealing with a number of random variables following the [hypergeometric distribution](https://wikipedia.org/wiki/Hypergeometric_distribution); for these, we will write $$X_{p,s,d}$$ where $$p_{}, s, d$$ denote the population size, number of success states in the population, and number of draws from the population (without replacement), respectively.


### Network Model

The Kademlia address space may be thought of as a binary tree of height $$L$$, structured as a prefix tree, with each leaf representing an address (or, equivalently, a node ID, since both are length-$$L$$ bitstrings).[^node-addr]

[^node-addr]: Side note: I've always thought the "Node ID" naming convention is a little obtuse - these IDs are points in the address space, so why not call them "node addresses"?

Note that as a straightforward consequence of the XOR metric's definition, any leaf in a given subtree will be closer to any other leaf in that subtree than to any leaf outside it.

With regard to node IDs, each leaf in the tree may be considered as being in one of three states: _unoccupied_, _honest_, or _Sybil_, depending on whether the corresponding node ID has been claimed (and by whom).

With regard to data addresses, we may consider each leaf to be in one of two states: _compromised_ or _resilient_, depending on whether a lookup for that data address would return at least one honest node (i.e. whether the network's redundancy factor $$k$$ is sufficient to maintain the integrity of any data stored at the given address).[^perfect-routing]

[^perfect-routing]: Note: This model assumes perfect routing information, which is not quite true to life. However, this is not as bad of a compromise as it might sound, since the S/Kademlia lookup algorithm comes with an analysis of its probability of success. As such, that result can be composed with this one to provide a (probably fairly tight) lower bound on network resilience.


### Collocation

Some notes on collocation: First, we know that honest nodes are evenly distributed through the network, since their distribution is determined by a cryptographically secure hash function. As a result, accidental node collocation between honest peers is extremely unlikely. Modeling this as an instance of the birthday problem, the probability would seem to be negligible until the number of honest nodes is at least on the order of $$10^{19}$$ for $$L = 128$$ or $$10^{24}$$ for $$L = 160$$. For scale, Earth's total population is currently below $$10^{10}$$.

Collocation between honest and malicious peers is also exceedingly unlikely, though not strictly impossible. An attacker with truly massive compute power might sometimes be able to cause this to happen as part of a vertical Sybil attack.[^sybil-taxonomy]

[^sybil-taxonomy]: _Vertical_ essentially meaning _highly targeted_, per the taxonomy given in TODO

Handling this edge case requires a minor alteration to our lookup logic: rather than looking up $$k$$ _peers_, let us cut off our lookups at $$k$$ _IDs_. The distinction may seem insignificant, and in practice it almost always will be, but it is of theoretic significance because it allows us to say that _whenever a honest and a malicious peer collocate, the corresponding leaf node is considered honest_.


### Terminology

Here are some higher-level concepts based on the ideas we've just discussed. This will feel dense; I apologize. For what it's worth, these definitions make the following derivations much easier to follow.

A _non-empty subtree_ (or _NEST_) is a subtree containing at least one honest node.

An _empty subtree_ (or _EST_) is a subtree containing only unoccupied or Sybil nodes.

A _maximal EST_ is a subtree which is an EST but whose parent (if it has one) does not have the same property.

Equivalently: a maximal EST is an EST whose sibling is a NEST (or which has no sibling, if it is the root of the tree, as would occur in the degenerate case of a network composed _only_ of Sybils).

The _resilience coefficient_ for a subtree of height $$h$$, denoted by $$R_{h,k}$$, is a value on the range $$[0, 1]$$ denoting the ratio of resilient nodes to total nodes in the subtree with lookups of size $$k$$.

Note that $$\operatorname{E}[R_{h,k}]$$ will be equal for all subtrees of any given height $$h$$, since the tree's structure is symmetric and even node distribution preserves this symmetry.

Let $$A_{h,x}$$ denote the event of a height-$$h$$ subtree containing precisely $$x$$ Sybil nodes (attackers).

Let $$D_{h,x}$$ denote the analogous event of a height-$$h$$ subtree containing precisely $$x$$ honest nodes (defenders).

Let $$N_h$$ denote the event of a height-$$h$$ subtree being a NEST. $$N_h = \lnot D_{h,0}$$ by definition.

Let $$E_h$$ denote the event of a height-$$h$$ subtree being a maximal EST. $$E_h = N_{h+1} \land \lnot N_{h}$$ by definition.

Bitstrings will be indicated by a subscripted $$b$$, like so: $$10101_b$$. Note that in bitstrings, unlike ordinary numbers, leading zeroes have semantic significance.


### Example: Evaluating a Prefix Tree

<div class="img-center img-fluid">
{% include sybil-prefix-tree.svg %}
</div>

This illustration shows a simple toy network with $$L = 5, a = 5, d = 5$$.

Each leaf represents an address (or node ID) determined by the leaf's position in the prefix tree. Starting from the left, we have $$\text{00000}_b$$, $$\text{00001}_b$$, $$\text{00010}_b$$, $$\text{00011}_b$$, etc.

The green leaves represent honest peers and the red leaves represent Sybil peers.

Under the tree, we have three rows. These represent the states of the leaves' data addresses for $$k \in \{1, 2, 3\}$$. You can see that each address is either resilient (green) or compromised (red), and that the number of resilient addresses rises sharply as $$k$$ increases. Note that real networks use much larger values of $$k$$, e.g. $$k = 8$$ or $$k = 16$$.

You can mouse over any address in these last three rows to see which peers are included in its size-$$k$$ lookup set.

Let's use this figure to help review our terminology.

The honest nodes are $$\text{00001}_b$$, $$\text{01001}_b$$, $$\text{01010}_b$$, $$\text{01111}_b$$, and $$\text{10001}_b$$.

The Sybil nodes are $$\text{00110}_b$$, $$\text{01101}_b$$, $$\text{10010}_b$$, $$\text{10100}_b$$, and $$\text{10111}_b$$.

The maximal ESTs' root nodes are $$\text{00000}_b$$, $$\text{0001}_b$$, $$\text{001}_b$$, $$\text{01000}_b$$, $$\text{01011}_b$$, $$\text{0110}_b$$, $$\text{01110}_b$$, $$\text{10000}_b$$, $$\text{1001}_b$$, $$\text{101}_b$$, and $$\text{11}_b$$.

Every node which is not part of a maximal EST is a NEST.

By simply counting resilient addresses, we can evaluate the following resilience coefficients:

$$
\begin{align}
R_{L, 1} &= \frac{14}{32} = 0.4375 \\
R_{L, 2} &= \frac{24}{32} = 0.75 \\
R_{L, 3} &= \frac{28}{32} = 0.875
\end{align}
$$

Some instructive relationships between subtrees can also be observed.

The resiliences of each address in subtree $$\text{11}_b$$ are equal to those for subtree $$\text{10}_b$$. This is because $$\text{11}_b$$ is completely empty (i.e. it is an EST), meaning that the closest peers to any address in $$\text{11}_b$$ are the same as the closest peers to the corresponding leaf in $$\text{11}_b$$'s sibling $$\text{10}_b$$.

The maximal EST $$\text{101}_b$$ contains two Sybil nodes. Thus, for $$k \le 2$$, this subtree is fully compromised. However, for $$k = 3$$ its resilience states are the same as its sibling $$\text{100}_b$$'s states with $$k = 1$$. This is because any lookup for an address in $$\text{101}_b$$ will necessarily include the subtree's two Sybil nodes, leaving room for one more possibly-honest node. Thus, the lookup will succeed if and only if a $$k = 1$$ lookup for the corresponding leaf in $$\text{100}_b$$ would also succeed.


### Deriving Resilience Coefficients

The goal of this analysis is to provide a method for finding $$\operatorname{E}[R_{L,k}]$$ given arbitrary values of $$n, m$$. We will find $$\operatorname{E}[R_{L,k}]$$ through an iterative method which derives the resilience coefficients for progressively taller nonempty subtrees, eventually working our the way up to the full tree.

You can click on any **Equation 1.x** heading to hide (or unhide) the corresponding proof.

{::options parse_block_html="true" /}

**Theorem 1.** $$\operatorname{E}[R_{L,k}]$$ is computable for all $$L, k$$.

> *Proof.* From definitions, $$L > 0, k \ge 0, n \ge 0$$.
>
> If $$n = 0$$, then the network contains no honest nodes and the result is trivial: $$\operatorname{E}[R_{L,k}] = 0$$.
>
> The rest of this proof assumes the nontrivial case $$n > 0$$. The derivation for this case depends on some supporting results.
>
> Before continuing, take a moment to convince yourself that for a height-$$L$$ tree containing $$n$$ evenly distributed nodes, the number of nodes in any height-$$h$$ subtree is modeled by the hypergeometric random variable $$X_{2^L,n,2^h}$$. The proofs for Equations 1.8 and 1.9 rely on this fact.
>
> <span onclick="do_toggle('#eqn-1')">**Equation 1.1.**</span> For $$h \le \log_2{k}$$, we have $$\operatorname{E}[R_{L,k} \vert N_h] = 1$$.
>
>> *Proof.* The event $$N_h$$ guarantees that at least one honest node will be present in our height-$$h$$ subtree.
>>
>> The constraint $$h \le \log_2{k}$$ implies $$2^h \le k$$, meaning that, since $$2^h$$ is the number of leaves in a subtree of height $$h$$, any occupied leaves in our height-$$h$$ subtree will be included in all lookup results for addresses within the subtree.
>>
>> Thus, any lookups in this subtree will find the honest node and will succeed.
>>
>> It follows that $$\operatorname{E}[R_{L,k} \vert N_h] = \frac{2^h}{2^h} = 1$$. $$\tag*{$\square$}$$
> {: #eqn-1 }
>
> <span onclick="do_toggle('#eqn-2')">**Equation 1.2.**</span> For $$h > 0$$, we have $$\operatorname{E}[R_{h,k} \vert N_h] = \operatorname{E}[R_{h-1,k} \vert N_h]$$.
>
>> *Proof.* Recall that the left-hand side of this equality is the expected resilience coefficience for a height-$$h$$ NEST.
>>
>> Every leaf of this NEST belongs to either its left or right child subtree. It follows that the resilience for the full NEST may be accounted for in terms of the child subtrees’ resiliences. In fact, since both subtrees are of equal size, the full NEST's resilience must be the average of its children's by definition.
>>
>> By symmetry, the children's resilience coefficients are equal. Their expected value is $$\operatorname{E}[R_{h-1,k} \vert N_h]$$, so this must be the expected value for the full NEST's resilience coefficient as well. $$\tag*{$\square$}$$
> {: #eqn-2 }
>
> <span onclick="do_toggle('#eqn-3')">**Equation 1.3.**</span> For $$n > 0$$, we have $$\operatorname{E}[R_{L,k}] = \operatorname{E}[R_{L-1,k} \vert N_L]$$.
>
>> *Proof.* If $$n > 0$$, then the prefix tree's root must be a NEST.
>>
>> Thus, $$P(N_L) = 1$$ and $$\operatorname{E}[R_{L,k}] = \operatorname{E}[R_{L,k} \vert N_L]$$.
>>
>> The given equation then follows trivially from Equation 1.2. $$\tag*{$\square$}$$
> {: #eqn-3 }
>
> <span onclick="do_toggle('#eqn-4')">**Equation 1.4.**</span> $$
\begin{equation*}
\operatorname{E}[R_{0, k} \vert N_1] =
\begin{cases}
0 & \text{if } k = 0\\
1 - \frac{P(A_{0,1})P(X_{2^L, n-1, 1} = 0)}{2} & \text{if } k = 1\\
1 & \text{if } k \ge 2
\end{cases}
\end{equation*}
$$
>
>> *Proof.* Let's address each case individually.
>>
>> Case $$k = 0$$: We know that $$\operatorname{E}[R_{h,0}] = 0$$ by definition, since an empty result set cannot contain any honest peers. It follows as a trivial corollary that $$\operatorname{E}[R_{0,0} \vert N_1] = 0$$.
>>
>> Case $$k = 1$$: First, per Equation 1.2, we have $$\operatorname{E}[R_{0,1} \vert N_{1}] = \operatorname{E}[R_{1,1} \vert N_1]$$.
>>
>> Recall that a NEST of height 1 contains two leaves, one of which is guaranteed to be occupied by an honest node. Lookups for the other address succeed unless two independent conditions are both met: first, the lookup address is occupied by a malicious node; second, no other honest node is collocated at the same address.
>>
>> These independent events' probabilities are $$P(A_{0,1})$$ and $$P(X_{2^L,n-1,1} = 0)$$ respectively. Thus, we have
>>
>> $$ \begin{align}
>> \operatorname{E}[R_{0,1} \vert N_{1}] &= \operatorname{E}[R_{1,1} \vert N_1] \\
>> &= {1+(1-P(A_{0,1})P(X_{2^L, n-1, 1} = 0))}{2} \\
>> &= 1-\frac{P(A_{0,1})P(X_{2^L, n-1, 1} = 0)}{2}
>> \end{align}
>> $$
>>
>> Case $$k \ge 2$$: the result is a direct consequence of Equations 1.1 and 1.2:
>>
>> $$ \begin{align*}
>> \operatorname{E}[R_{0, k} \vert N_1]
>> &= \operatorname{E}[R_{1,k} \vert N_1] & \text{(by Eqn 1.2)} \\
>> &= 1 & \text{(by Eqn 1.1, since $1 \leq \log_2{k}$)}
>> \end{align*}
>> $$
>> $$\tag*{$\square$}$$
> {: #eqn-4 }
>
> <span onclick="do_toggle('#eqn-5')">**Equation 1.5.**</span> For $$h > 0$$, we have
>
> $$
\begin{align}
\operatorname{E}[R_{h, k} \vert N_{h+1}]
 & = P(N_h \vert N_{h+1}) \operatorname{E}[R_{h,k} \vert N_h] \\
 & + P(E_h \vert N_{h+1}) \operatorname{E}[R_{h,k} \vert E_h]
\end{align}
$$
>
>> *Proof.* Any subtree is precisely one of: a NEST, a maximal EST, or a nonmaximal EST.
>>
>> Consequently, in general,
>>
>> $$
\begin{equation*}
P(N_h) + P(E_h) + P(D_{h+1,0}) = 1
\end{equation*}
$$
>>
>> and in particular,
>>
>> $$
\begin{equation*}
P(N_h \vert N_{h+1}) + P(E_h \vert N_{h+1}) + P(D_{h+1,0} \vert N_{h+1}) = 1
\end{equation*}
$$
>>
>> We can simplify this:
>>
>> $$
\begin{align*}
&P(D_{h+1,0}) = 1 - P(N_{h+1})\\
\text{$\therefore$ } & P(D_{h+1,0} \vert N_{h+1}) = 0\\
\text{$\therefore$ } & P(N_h \vert N_{h+1}) + P(E_h \vert N_{h+1}) = 1
\end{align*}
$$
>>
>> Since $$N_h$$ and $$E_{h}$$ are disjoint events and the event $$N_{h+1}$$ ensures that precisely one of them must occur, we may decompose the expectation $$\operatorname{E}[R_{h,k} \vert N_{h+1}]$$ into cases:
>>
>> $$
\begin{align*}
\operatorname{E}[R_{h,k} \vert N_{h+1}]
&= P(N_h \vert N_{h+1}) \operatorname{E}[R_{h,k} \vert N_{h} \land N_{h+1}] \\
&+ P(E_h \vert N_{h+1}) \operatorname{E}[R_{h,k} \vert E_{h} \land N_{h+1}] \\
&= P(N_h \vert N_{h+1}) \operatorname{E}[R_{h,k} \vert N_{h}] \\
&+ P(E_h \vert N_{h+1}) \operatorname{E}[R_{h,k} \vert E_{h}]
\end{align*}
$$
>>
>> This was the expected conclusion. $$\tag*{$\square$}$$
> {: #eqn-5 }
>
> <span onclick="do_toggle('#eqn-6')">**Equation 1.6.**</span> For $$h > 0$$, we have
>
> $$
\operatorname{E}[R_{h,k} \vert E_h] = \sum_{a=0}^{k-1} P(A_{h,a}) \operatorname{E}[R_{h-1,k-a} \vert N_h]
$$
>
>> *Proof.* In an empty subtree, $$k$$ or more attackers are sufficient to compromise every subtree address.
>>
>> Thus, the expectation for the resilience coefficient must be a weighted sum of its expectations for 0 to $$k$$ attackers, where the summands are weighted by the relative probabilities of their corresponding events.
>>
>> Any attackers in the EST will necessarily by found by all subtree address lookups. The question is whether a honest node in the sibling subtree (which must be a NEST) can be reached as well. This amounts to performing a lookup for the sibling's corresponding address with $$k$$ reduced by the empty subtree's number of attackers. $$\tag*{$\square$}$$
> {: #eqn-6 }
>
> <span onclick="do_toggle('#eqn-7')">**Equation 1.7.**</span> $$P(E_h \vert N_{h+1}) = 1-P(N_h \vert N_{h+1})$$
>
>> *Proof.* This one's easy. By definition,
>>
>> $$
\begin{align}
P(E_h \vert N_{h+1}) &= P(\lnot N_h \vert N_{h+1}) \\
&= 1 - P(N_h \vert N_{h+1})
\end{align}
$$
>> $$\tag*{$\square$}$$
> {: #eqn-7 }
>
> <span onclick="do_toggle('#eqn-8')">**Equation 1.8.**</span> $$P(N_h \vert N_{h+1}) = \frac{1-P(X_{2^L,n,2^h}=0)}{1-P(X_{2^L,n,2^{h+1}}=0)}$$
>
>> *Proof.* Apply Bayes' Theorem and simplify:
>>
>> $$
\begin{align*}
P(N_h \vert N_{h+1})
&= \frac{P(N_{h+1} \vert N_h)P(N_h)}{P(N_{h+1})} \\
&= \frac{P(N_h)}{P(N_{h+1})} \\
&= \frac{1-P(X_{2^L, n, 2^h}=0)}{1-P(X_{2^L, n, 2^{h+1}}=0)}
\end{align*}
$$
>> $$\tag*{$\square$}$$
> {: #eqn-8}
>
> <span onclick="do_toggle('#eqn-9')">**Equation 1.9**</span> $$P(A_{h,a}) = P(X_{2^L, m, 2^h} = a)$$
>
>> *Proof.* Recall that the event $$A_{h,a}$$ is dependent only on the distribution of Sybil nodes, i.e. it is not influenced by the possibility of address collocation between malicious and honest nodes. This identity, then, is just a trivial application of the hypergeometric distribution. $$\tag*{$\square$}$$
> {: #eqn-9 }
>
> These equations give us everything we need to prove the theorem. The derivation is as follows.
>
> Let $$0 \leq k' \leq k$$ and let $$0 \leq h < L$$. Equation 1.4 gives us,
>
> $$
\operatorname{E}[R_{0, k'} \vert N_1] =
\begin{cases}
0 & \text{if } k' = 0\\
1 - \frac{P(A_{0,1})P(X_{2^L, n-1, 1} = 0)}{2} & \text{if } k' = 1\\
1 & \text{if } k' \ge 2
\end{cases}
$$
>
> This is a full, computable definition for $$\operatorname{E}[R_{h, k'} \vert N_{h+1}]$$ with $$h=0$$.
>
> We may find the expectations for $$h=1$$ in terms of the expectations for $$h=0$$ by applying Equations 1.5, 1.2, and 1.6 as follows:
>
> $$
\begin{align*}
\operatorname{E}[R_{1, k'} \vert N_2] &= P(N_1 \vert N_2) \operatorname{E}[R_{1,k'} \vert N_1] \\
&+ P(E_1 \vert N_2) \operatorname{E}[R_{1,k'} \vert E_1] \\\\
&= P(N_1 \vert N_2) \operatorname{E}[R_{0, k'} \vert N_1] \\
&+ P(E_1 \vert N_2) \sum_{a=0}^{k'-1} P(A_{1,a}) \operatorname{E}[R_{0, k'-a} \vert N_1]
\end{align*}
$$
>
> This expression is not pretty, but it is computationally tractable. The probabilities $$P(N_1 \vert N_2)$$, $$P(E_1 \vert N_2)$$, and $$P(A_{1,a})$$ can be evaluated via the closed-form solutions given in Equations 1.8, 1.7, and 1.9 respectively.
>
> This same method can be used to express the expectation for $$h = 3$$ in terms of those for $$h = 1$$ and $$h = 2$$, and so on up to $$h = L - 1$$, at which point the result is:
>
> $$
\begin{align*}
\operatorname{E}[R_{L-1, k'} \vert N_L]
&= P(N_{L-1} \vert N_L) \operatorname{E}[R_{L-2, k'} \vert N_{L-1}] \\
&+ P(E_1 \vert N_2) \sum_{a=0}^{k'-1} P(A_{L-1,a}) \operatorname{E}[R_{L-2, k'-a} \vert N_1]
\end{align*}
$$
>
> Every part of the right-hand side of this equation has been shown to be individually computable, and therefore this expression can be evaluated. Now let us apply Equation 1.3 to the left-hand side:
>
> $$
\operatorname{E}[R_{L-1, k}  \vert  N_L] = \operatorname{E}[R_{L,k}]
$$
>
> In this way, we see that the prescribed iterative method leads us all the way to $$\operatorname{E}[R_{L,k}]$$, the expected resilience of the full tree (and so also the full address space).
>
> This shows $$\operatorname{E}[R_{L,k}]$$ to be well-defined and computable. $$\tag*{$\blacksquare$}$$

The process described above may be implemented as an algorithm with complexity $$\Theta(Lk^2)$$.

My biggest disappointment with this research is that I have not yet found a closed-form expression for the resilience of a full tree. Even without a closed-form solution, though, the resilience of realistic networks can still be evaluated. The exact algorithm given above can be used as-is, and it can be shown to give exact, correct results.

# Experimental Validation

You may have some doubts about the above proof. That's fair; it is nontrivial. I had doubts about it myself, which is why I decided to validate its predictions against a number of simulations. Here are the results.

TODO

# Analysis

TODO




<hr>
