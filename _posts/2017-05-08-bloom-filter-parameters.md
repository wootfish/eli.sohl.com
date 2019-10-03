---
layout: post
title: Bloom Filter Parameters for Distributed Search
mathjax: true
tags: [theseus]
---

> Previously:<br/>
> [Theseus: A Robust System for Preserving and Sharing Research]({{ site.baseurl }}{% post_url 2017-02-17-theseus-robust-system-for-preserving %})<br/>
> [Resisting Sybil Attacks in Distributed Hash Tables]({{ site.baseurl }}{% post_url 2017-02-25-resisting-sybil-attacks-in-distributed_25 %})<br/>
> [Securely Finding Friends via DHT Dead Drops]({{ site.baseurl }}{% post_url 2017-02-27-securely-finding-friends-via-dht-dead %})<br/>
> [Distributed Search in Theseus]({{ site.baseurl }}{% post_url 2017-03-21-distributed-search-in-theseus %})<br/>
> [The State of Theseus, One Month In]({{ site.baseurl }}{% post_url 2017-03-22-the-state-of-theseus-one-month-in %})<br/>
> [Theseus Protocol v0.1 Overview]({{ site.baseurl }}{% post_url 2017-04-20-theseus-protocol-v01-overview %})<br/>


[Bloom filters](https://en.wikipedia.org/wiki/Bloom_filter) are central to both the routing and content-indexing functions of Theseus's distributed search algorithm. A filter's false-positive probability increases monotonically as a function of the number of keys in the filter, as well as on two pre-set parameters: the filter size and the number of hash functions used. The expected number of bits set to 1 in the filter also increases monotonically as a function of n. Derivations of the equations governing these values can be found [in section II.A of this paper](http://www.eecs.harvard.edu/~michaelm/postscripts/ton2002.pdf), which also provides a treatment of the idea of _compressing_ Bloom filters in certain situations, e.g. for network transfer or bulk storage. The question is asked of whether a benefit can be obtained from this compression, and the answer is that it of course depends on the sparsity of the filter.

The strategies suggested by that paper for parameterizing a Bloom filter with compression in mind involve significantly increasing the filter's uncompressed size in memory. This is a fairly unattractive cost.

"Correctly" optimizing a Bloom filter's parameters requires having a good estimate of the number of elements the filter will contain. If this value is expected to vary widely, as it likely would in Theseus, then such an optimization can't really be performed in any particularly rigorous way.

The cost of underestimating the number of elements is that your filter's false positive rate will be untenably high. The cost of overestimating is that you'll end up with a sparse, inefficient filter.

I observed in [_Resisting Sybil Attacks in Distributed Hash Tables_]({{ site.baseurl }}{% post_url 2017-02-25-resisting-sybil-attacks-in-distributed_25 %}) that having honest peers operate multiple DHT nodes would help increase their resilience to horizontal Sybil attacks. Another benefit to operating multiple DHT nodes is that one could spread one's content library across them and have each node indey only its own subset of the total library. So in the case of Theseus, if a peer has more data to share than they can fit in a single Bloom filter while maintaining an acceptable false-positive rate, they can simply partition the data to optimally-sized subsets and in this way sidestep the problem. Thus for Theseus the cost of underestimating the number of elements is actually very low.

The cost of _over_estimating the number of elements is also fairly low: sparse filters, as we just discussed, are amenable to compression. Thus we can compress them before transmission to keep from wasting bandwidth -- and if we're tight on working memory, we can compress them at rest as well. Making compression optional allows us to do all this without impacting performance for saturated filters.

So really, as long as our estimate isn't _wildly_ off-base, the system should be able to gracefully handle outliers on either extreme. This means that there is in fact a wide range of parameterizations "good enough" for our purposes. How do we choose one over the others? Lacking a better motivator, we might as well make the choice based on convenience of implementation.

What's convenient? Well, having the filter size be a power of 2 would be convenient, because it'd make it easier to get indices from a cryptographic hash function. Having the 2's exponent be a multiple or 4 would also be quite nice, to make the hex constant for the bitmask more readable. Say $$2^{16}$$ bits, then. The next question is what we want the capacity of the filter to be -- or, equivalently, how many bits per element we want to allocate.

If we choose, say, 10 bits per element, our filter would cap out at $$2^{16}/10 \approx 6554$$ elements. The optimal number of hash functions would be $$10 \ln 2 \approx 7$$, and the false positive rate at saturation would be $$(1-e^{-7/10})^7 \approx 0.81\%$$ chance of a false positive.

6554 seems a little small, though -- especially considering that in all likelihood any given file in the system would have at least several unique filter elements associated with it. What if we try fewer bits per element?

Going down to 7 bits per element raises our cap to $$2^{16} / 7 \approx 9362$$ elements. $$7 \ln 2 \approx 5$$. The false positive chance increases to about 3.5%. These figures sound reasonable enough to me, so let's say our provisional Bloom filter parameters are $$2^{16}$$ bits ($$= 2^{13}$$ bytes) and 5 hash functions.

As a reward for sticking with me through this short but dense post, have some graphs. These show how various filter properties change as the filter fills up. Click the images to view them full-size. The code that generated them can be found [on Github](https://github.com/wootfish/bloom_experiments). Analysis is left as an exercise for the reader.

<br/>

<a href="https://github.com/wootfish/bloom_experiments/raw/master/figure_1.png">
<img src="https://github.com/wootfish/bloom_experiments/raw/master/figure_1.png" class="img-fluid"/>
</a>

<br/>

<a href="https://github.com/wootfish/bloom_experiments/raw/master/figure_2.png">
<img src="https://github.com/wootfish/bloom_experiments/raw/master/figure_2.png" class="img-fluid"/>
</a>
