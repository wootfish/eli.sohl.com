---
layout: post
title: Estimating the Size of DHT Networks
mathjax: true
image: '/assets/img/dht/estimate_results.png'
---


# Background

Figuring out the size of a peer-to-peer network can be surprisingly difficult. Every member of the network knows about their immediate neighbors, but no one has a full view of the network state. So, how can we measure network size?

I'm going to focus on Kademlia-style networks here, because most big DHTs are based on Kademlia. Other DHTs with similar routing properties might be able to adapt this methodology.

Previous work on estimating the size of Kademlia-based DHTs (e.g. MLDHT) has focused on "walking" subregions of the address space, counting the number of peers found, and scaling that count up to provide a size estimate for the full network. This relies on the assumption that peers are evenly distributed through the address space.

This idea seems simple enough, but it turns out that it doesn't actually work. Even if peer density is uniform, there is still the problem of accurately measuring it. Any walk over a region of the address space is going to miss some peers, and this will cause you to underestimate the actual peer density. Figuring out the magnitude of this underestimation turns out to be possible but nontrivial.

[This page](https://www.cl.cam.ac.uk/~lw525/MLDHT/) does a good job of discussing this issue. Incredibly, they show that deriving a size estimate from a naive walk leads to "errors on the order of tens of percents" -- in one example, as much as 37.5%. Their proposed solution is to measure the probability of any given peer being missed by a walk through the address space, then to use this probability to derive a "correction factor" by which their peer count is adjusted. This tries to compensate for however many peers they assume they missed. The results appear to be accurate, and they claim this technique can produce a size estimate "in about 5 seconds".

They do not mention how many address lookups the process requires. However, looking at their code and their published results, we can guess that it is likely on the order of tens of thousands of queries.[^query-count]

I'd like to share a slightly simpler methodology that uses a small number of ordinary address lookups. With this technique, accurate network size estimates can be determined from less than ten lookups. These lookups can be for arbitrary addresses, and they can be performed in parallel. This means that not only can size estimates be produced much more quickly, but they can also be produced _as a byproduct of ordinary network activity_.

[^query-count]: Reviewing their published code, it appears that their walker sends five lookup queries to each node it finds in the target subregion, and one query to each node it finds outside that region. They use a "12-bit zone", and Fig. 2 from their published paper suggests that such a zone can be expected to contain roughly 5000 nodes. It seems reasonable to expect somewhere in the rough range of 25000 queries might be sent over the course of the crawl. Note that this count does not include the queries required to produce an experimental measurement for the "correction factor".


# The Idea

The problem is this: Kademlia only supports lookups for specific addresses, not for address *ranges*. This makes sense, because you only need address lookups in order to use the network as intended. Trying to walk an address range with Kademlia's address lookup queries is like trying to hammer in a nail with a screwdriver. Overextending the analogy, the page I linked in the last section proposes an improved screwdriver-hammering technique; what I'd like to propose is that we replace the nail with a screw.

Let's start from first principles. The network consists of nodes. Each node has a node ID. Node IDs are random bitstrings of length $$L$$. Thus, node IDs are evenly[^even-distribution] distributed through an address space of size $$2^L$$. Distance between addresses is measured with the XOR metric.

[^even-distribution]: Technically, Kademlia does not _require_ even distribution, and some DHTs like MLDHT allow nodes to choose their own IDs. About this, the authors of the paper linked above write, "we carefully examined a large set of samples (over 32000) crawled from the different parts of MLDHT, and found the node IDs follow a uniform distribution. We did observe some abused IDs such as ID 0, but they only contribute a trivial amount of nodes to the whole MLDHT, and can be safely neglected in our case." Some variants of Kademlia further encourage even distribution of nodes through the use of a cryptographically secure hash function.

Let $$n$$ be the number of nodes in the network. We don't know the value of $$n$$ yet, but we'll get to that.

Choose an arbitrary address $$A$$. What is each node ID's distance from that address? We can compute these with a curried XOR, like $$f(I) = I \oplus A$$. This defines a bijective map from the address space to itself. We'll define $$D = \{D_1, \ldots, D_n\}$$ as the image of our node ID set under $$f$$.

For convenience, let's consider these distances not as bitstrings but as integers on the range $$[0, 2^L-1]$$, and let's specify (without loss of generality) that $$D_1 < D_2 < \ldots < D_n$$.

Under these definitions, $$D_i$$ is precisely the $$i$$'th [order statistic](https://en.wikipedia.org/wiki/Order_statistic) of $$D$$. The order statistics for discrete random variables are a pain to analyze, but it turns out we can simplify things by swapping out our discrete random variables for continuous ones, adding only a negligible error term in the process.

If we approximate $$D_1, \ldots, D_n$$ by the order statistics, in order, of a sample of $$n$$ uniform random variables, and we normalize these variables from $$[0, 2^L-1]$$ to $$[0, 1]$$, we end up with $$n$$ new random variables $$N = \{N_1, ..., N_n\}$$, where $$N_i \approx \frac{D_i}{2^L-1}$$.

These normalized random variables $$N_i$$ can be shown to follow specific beta distributions. The parameterization is $$\alpha = i, \beta = n - i + 1$$. [The proof is on Wikipedia](https://en.wikipedia.org/wiki/Order_statistic#Order_statistics_sampled_from_a_uniform_distribution). Simplifying the expression for the beta distribution's mean under this parameterization yields $$\mathbf{E}[N_i] = \frac{i}{n+1}$$.

This is all we need: we can just rewrite $$\mathbf{E}[N_i] = \frac{i}{n+1}$$ as $$n = \frac{i}{\mathbf{E}[N_i]} - 1$$.

Size-$$k$$ lookups allow us to gather samples for $$N_1$$ through $$N_k$$. Each sample for each one of those variables can be plugged into that equation to produce a network size estimate. Individual size estimates are somewhat noisy, but they can be combined to provide a stable, fairly accurate estimate for the value of $$n$$.

The naive way to combine these estimates would be to take their average. For marginally more complexity, we can instead compute a least-squares fit to find a value of $$n$$ which minimizes error terms for any set of sampled values for $$N_1$$ through $$N_k$$. The formula is $$n = \frac{k(k+1)(2k+1)}{6 \sum_i i N_i} - 1$$. This least-squares fit method for estimating $$n$$ turns out to be significantly more precise than the naive method of averaging across individual estimates.

If you sample enough of these estimates and take their average, you can arrive at an arbitrarily accurate estimate of network size. Even with just a few estimates sampled, the accuracy is still very good.

Recall also that these estimates can be computed in parallel, since they only depend on the results of independent address lookups (which can also be run in parallel). This means that the estimate's accuracy can be improved (by adding more independent lookups) without slowing it down at all.


# Experimental Validation

OK, that sounds too easy, right? Let's see if it works. We'll start by running some tests on simulated networks. The goal here is to see if our statistical models predict these simulations' behavior correctly.

For these simulations, we'll be using $$L = 25$$ and $$k = 8$$. Using a small value for $$L$$ improves performance and does not have a significant impact on our results.

Here are measurements for the distributions of $$N_1$$ through $$N_8$$, with the model's corresponding beta distributions superimposed. 

{%
include blog-image.md
image="/assets/img/dht/beta_1000.svg"
description="A number of beta curves superimposed over histograms. The curves and bars match each other very closely."
%}

Those are for a network with $$n = 1000$$ peers. Here is a version of that same chart for $$n = 10$$:

{%
include blog-image.md
image="/assets/img/dht/beta_10.svg"
description="A number of beta curves superimposed over histograms. The histograms have some noise in them, but still match the curves closely."
%}

And here is $$n = 100000$$.

{%
include blog-image.md
image="/assets/img/dht/beta_100000.svg"
description="A number of beta curves superimposed over histograms. The histograms have some noise in them, but still match the curves closely."
%}

Smaller networks can be seen to lead to noisier measurements, while for large networks the distribution is matched just about perfectly.

The next step is to combine these measurements into an overall size estimate. There are many reasonable ways this could be done. I've illustrated two below. The results of taking an unweighted average across each individual size estimate are shown in red. The results of taking unweighted averages for each individual order statistic and then deriving a size estimate from a least-squares fit is shown in green.

{%
include blog-image.md
image="/assets/img/dht/estimate_results.svg"
description="Illustrations of the distribution of DHT size estimates for two different methodologies. Both are accurate, but the green histogram is more precise."
%}


# Conclusion

Measuring DHT network size lets us carry out interesting research; it also allows us to detect [vertical Sybil attacks](TODO).[^vert]

[^vert]: This is done by recognizing cases where all $$k$$ of the closest peers for a given address are closer than the expected distance of the closest honest peer (i.e. $$D_{1}$$). This is a reliable signal since $$P(D_{k+1} > E[D_1]) = TODO SMALL NUMBER$$.

This is original research, and I could not find any prior published descriptions of this method for DHT size measurement. It can produce accurate size estimates using many fewer queries than the next-best published method.

This method uses nothing but ordinary lookups for arbitrary addresses, meaning size estimates can be produced as a by-product of normal activity on the network. This allows peers to maintain up-to-date estimates of network size essentially for free.


<hr>
