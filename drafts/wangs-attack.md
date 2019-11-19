---
layout: post
title: Wang's Attack
mathjax: true
---


Everyone knows MD4 is insecure. Modern attacks make finding MD4 collisions just as easy as verifying them. With that
level of vulnerability, it's easy to forget that the algorithm stood up to 14 years of cryptanalysis before Wang et al.
broke it open in 2004.

Wang's attack was the first efficient collision attack on full MD4, but it was not the last; the efficiency of the
attack and the clarity of its presentation were both significantly improved by later researchers. Nevertheless, Wang's
attack has historical significance, which may be [why it is included in Cryptopals set 7](https://cryptopals.com/sets/7/challenges/55).

I've been working through Cryptopals lately and I found this to be, without a doubt, the hardest and most rewarding
challenge in the first 7 sets.

Two reasons: first, the attack is tricky to implement; second, and primarily, it is tricky to _understand_. [The original
paper](https://link.springer.com/content/pdf/10.1007%2F11426639_1.pdf) provides only a loose sketch of the attack,
accompanied by some example collisions to show that it works. To work out the details, you have to read between the
lines of a paper which (for English speakers) is only available in translation.

Eventually I gave in and started searching for blog posts on the subject. The landscape is surprisingly sparse. There
are a few posts, but they left me with a lot of unanswered questions. To actually write the attack, I ended up having to
forego these and instead just retrace the paper's steps as much as possible, filling in the blanks as I went.

This is written to be the post I wish I'd found. I hope someone finds it useful. If it isn't detailed enough for you,
fly out to Seattle and we'll go through it over beers.


## The Basic Idea

Wang et al. frame this as a _differential attack_, meaning they are interested in collisions in pairs of messages where
the messages also `xor` to some fixed constant. That is to say, we want messages $$m_1, m_2$$ such that $$H(m_1) =
H(m_2)$$ and $$m_1 \oplus m_2 = D$$ for some fixed differential $$D$$.

This might sound like adding an unnecessary constraint, but it gives us a powerful way of reframing the problem. Note
that this definition makes $$m_2$$ fully dependent on $$m_1$$ and $$D$$, so for the attack to succeed it suffices to
identify a differential $$D$$ and a set of messages $$S$$ such that if $$m \in S$$ then $$H(m) = H(m \oplus D)$$ with
high probability. At its core, Wang's attack is a method for finding probable elements of one such set $$S$$.

The message set $$S$$ is defined in terms of a set of sufficient conditions on the hash function's intermediate states,
and methods are prescribed for ensuring that these conditions are met.

The basic insight behind this attack is that MD4 makes it easy to track how various differentials spread through the
hash function's state. With enough careful analysis,[^1] this allows us to derive sufficient conditions for certain
differentials to "cancel each other out" like waves destructively interfering.

[^1]: Plus some other conveniences, like a number of simple collisions in the hash function's round functions. These are essential to the theory behind the attack but totally irrelevant to its implementation.

The result is that differences in the messages' hashes' intermediate states are introduced and erased -- that is, the
intermediate states are made to diverge and then reconverge -- producing collisions.

Before expanding on that idea, let's review the relevant parts of MD4 itself.


## The Structure of MD4

#### In Brief

MD4 has a 128-bit internal state. Internally, this is represented as four consecutive 32-bit state variables. These are
initialized to certain fixed values. The details aren't important for us.

MD4 takes 512-bit message blocks. We're only going to concern ourselves with one-block messages here, because those are
all we need to find collisions.[^2]

[^2]: Note that if we find any colliding one-block messages, we can use these to produce arbitrary-length collisions by simply appending the same arbitrary byte sequence to each colliding message.

Message blocks are broken up into sixteen consecutive 32-bit chunks denoted by $$m_0, m_{1}, ..., m_{15}$$.

The message block is mixed into the state through a series of three rounds. Each round consists of sixteen steps, and
each step modifies one of the four state variables as a function of the whole state plus one message chunk $$m_k$$.

Each message chunk is used exactly once per round. A different function is used in each round. All three functions have
simple algebraic representations.

#### In Detail

You can find a full implementation of MD4 [here](https://github.com/wootfish/cryptopals/blob/master/challenge_30.py);
within that codebase, all three rounds are calculated [here](https://github.com/wootfish/cryptopals/blob/master/challenge_30.py#L66).
The most relevant parts are excerpted below.

Here's what the round functions look like. In the code below, `a, b, c, d` are the four state variables. `m` is a list
of message chunks. `k` is the index of the message chunk to use, and `s` is the number of bits to left-rotate by.

```python
def F(x: int, y: int, z: int) -> int: return (x & y) | ((x ^ 0xFFFFFFFF) & z)
def G(x: int, y: int, z: int) -> int: return (x & y) | (x & z) | (y & z)
def H(x: int, y: int, z: int) -> int: return x ^ y ^ z

def r1(a: int, b: int, c: int, d: int, k: int, s: int, m: Sequence[int]) -> int:
    val = (a + F(b, c, d) + m[k]) % (1 << 32)
    return leftrotate(val, s)

def r2(a: int, b: int, c: int, d: int, k: int, s: int, m: Sequence[int]) -> int:
    val = (a + G(b, c, d) + m[k] + 0x5A827999) % (1 << 32)
    return leftrotate(val, s)

def r3(a: int, b: int, c: int, d: int, k: int, s: int, m: Sequence[int]) -> int:
    val = (a + H(b, c, d) + m[k] + 0x6ED9EBA1) % (1 << 32)
    return leftrotate(val, s)
```

The functions `F, G, H` might look bizarre; luckily, we don't need to worry about how they work at all.

Note that within `r1`, `r2`, and `r3`, after the four state variables `a, b, c, d` are mixed together into a single value
the message chunk `m[k]` is just added to the result and wrapped with a modulus. What this means is that if we know what
we want `val` to evaluate to for any arguments `a, b, c, d, k, s`, it's easy for us to algebraically determine what
`m[k]` needs to equal to produce the desired result. Since `leftrotate` is trivially invertable, this is equivalent to
being able to determine the return value of `r1`, `r2`, or `r3`.

Now, here's how the round functions are applied to compute the hash function's intermediate states.

```python
# round 1
a = r1(a,b,c,d, 0,3,m); d = r1(d,a,b,c, 1,7,m); c = r1(c,d,a,b, 2,11,m); b = r1(b,c,d,a, 3,19,m)
a = r1(a,b,c,d, 4,3,m); d = r1(d,a,b,c, 5,7,m); c = r1(c,d,a,b, 6,11,m); b = r1(b,c,d,a, 7,19,m)
a = r1(a,b,c,d, 8,3,m); d = r1(d,a,b,c, 9,7,m); c = r1(c,d,a,b,10,11,m); b = r1(b,c,d,a,11,19,m)
a = r1(a,b,c,d,12,3,m); d = r1(d,a,b,c,13,7,m); c = r1(c,d,a,b,14,11,m); b = r1(b,c,d,a,15,19,m)

# round 2
a = r2(a,b,c,d,0,3,m); d = r2(d,a,b,c,4,5,m); c = r2(c,d,a,b, 8,9,m); b = r2(b,c,d,a,12,13,m)
a = r2(a,b,c,d,1,3,m); d = r2(d,a,b,c,5,5,m); c = r2(c,d,a,b, 9,9,m); b = r2(b,c,d,a,13,13,m)
a = r2(a,b,c,d,2,3,m); d = r2(d,a,b,c,6,5,m); c = r2(c,d,a,b,10,9,m); b = r2(b,c,d,a,14,13,m)
a = r2(a,b,c,d,3,3,m); d = r2(d,a,b,c,7,5,m); c = r2(c,d,a,b,11,9,m); b = r2(b,c,d,a,15,13,m)

# round 3
a = r3(a,b,c,d,0,3,m); d = r3(d,a,b,c, 8,9,m); c = r3(c,d,a,b,4,11,m); b = r3(b,c,d,a,12,15,m)
a = r3(a,b,c,d,2,3,m); d = r3(d,a,b,c,10,9,m); c = r3(c,d,a,b,6,11,m); b = r3(b,c,d,a,14,15,m)
a = r3(a,b,c,d,1,3,m); d = r3(d,a,b,c, 9,9,m); c = r3(c,d,a,b,5,11,m); b = r3(b,c,d,a,13,15,m)
a = r3(a,b,c,d,3,3,m); d = r3(d,a,b,c,11,9,m); c = r3(c,d,a,b,7,11,m); b = r3(b,c,d,a,15,15,m)
```

Recall that the first integer argument to each of these functions is the index of the message chunk within the message
block. Note how each chunk is used exactly once per round and how the order of use varies between rounds.

In the code block above, intermediate states are grouped into rows of four. This mimics the paper's notation, which
denotes e.g. the fourth row's third intermediate state as $$c_4$$, the first state on the first row as $$a_1$$, and so
on. $$a_0, b_0, c_0, d_0$$ denote the values to which the four state variables `a, b, c, d` are initialized.

The paper extends this notation further to allow for addressing individual bits within states: for instance, $$c_{4,1}$$
refers specifically to $$c_4$$'s least significant bit, $$d_{2,14}$$ refers to $$d_2$$'s 14th bit counting from the
least-significant end, $$b_{9,32}$$ is $$b_9$$'s 32nd-least significant bit (i.e. its most significant bit), and so on.

This notation is important because it is used to express all of the paper's constraints on MD4's intermediate states.
These form the core of this attack.

Note that both subscripts are 1-indexed -- if you're implementing the attack, this is something to look out for as a
potential source of off-by-one errors.


## The Attack

The core of Wang's attack is a large list of constraints on intermediate hash function states. Despite what the paper
says, these constraints do not quite form a set of sufficient conditions -- but do they come close.[^3] Here's the
relevant table from the paper:

[^3]: Subsequent research has identified the conditions missing from Wang et al.'s paper, as well as other differentials which utilize smaller sets of constraints (e.g. [Yu Sasaki et al., 2007](https://www.iacr.org/archive/fse2007/45930331/45930331.pdf)). This subsequent research is worth studying in their own right, but it is out of scope for this post.

![Table 6: A Set of Sufficient Conditions for Collisions of MD4](/assets/img/wang-table-6.png){: .img-center }

This looks daunting at first, but if you stare at it for long enough you'll notice the constraints fall into three broad
categories: ensuring that various bits within intermediate states are either 1, 0, or equal to the bit at the same index
in a prior state (almost always the _immediately_ prior state). The only exceptions to this taxonomy are the constraints
$$c_{6,30} = d_{6,30}+1$$ and $$c_{6,32} = d_{6,32}+1$$.

The bulk of these conditions apply to first-round intermediate states. According to Wang et al., satisfying the first
round conditions (i.e. everything up through $$b_4$$) is enough to produce a collision with probability $$2^{-25}$$. If
_all_ the conditions are satisfied, then "the probability can be among $$2^{-6} \sim 2^{-2}$$."

If you'll grant me license to editorialize a little here: It seems like the loose phrasing of this constraint implies
that Wang et al. were unable to directly measure this success probability, suggesting that even they may not have found
a methodology for enforcing _all_ their constraints.

With that in mind, let's see how close we can get.[^4] The idea for the whole attack is something like this:

[^4]: Here are some numbers: On 2019/11/13 I tested the most recent version of my Python implementation on a MacBook Pro and found 6 collisions in just over 25 minutes of execution time, implying a success rate of one collision per 4.20 minutes (lol, yes, really). I'm satisfied with that -- after all, Python is not particularly known for speed. The script's trial rate is just over 10,000 trials per second and it uses no parallelism; all this implies a success probability in the ballpark of $$2^{-21.3}$$.

Generate a random input message; then, compute all the intermediate states generated by hashing this message; in the
process of computing these states, derive and perform the necessary message modifications for these states to satisfy as
many as possible of the conditions in Table 6.

Wang et al. simply call this "message modification", but let's have a little more fun and refer to it as _massaging the
message_.

After massaging the message, our odds of finding a collision between the message and its modified version are very good.
The more conditions we are able to satisfy, the higher the probability of success.

We'll start by massaging the message so that all the first-round conditions are met; then, we'll use a somewhat more
complex procedure to enforce as many of the second-round conditions as we can manage. We won't even bother with the
third-round conditions - you'll see why when we get to the second round.


#### Enforcing Constraints

Since our constraints all concern the values of specific bits within 32-bit integers, we can easily enforce them through
bitwise operations.

Frankly, I'd hope you can figure this part out on your own. That said, there are a couple different reasonable ways of
doing it, and the choice you make can have a big impact on performance, so let's take a moment to go over the options.

The first option is to enforce each constraint individually. This is less performant than the other option we'll be
looking at, but it is also arguably easier to read.

 Given a state variable `a` and a list of indices for bits that should be set to 1, you might write something like this:

```python
a: int = ...
indices: List[int] = [...]

for i in indices:
    a |= 1 << i
```

Enforcing the 0 constraints would be a little more involved:

```python
# branching version
for i in indices:
    mask = 1 << i
    if a & mask:
        a ^= mask

# non-branching version
for i in indices:
    a &= 0xFFFFFFFF ^ (1 << i)
```

Finally, for equality constraints between a current state `a` and a previous state `b`:

```python
# branching version
for i in indices:
    mask = 1 << i
    if a & mask != b & mask:
        a ^= mask

# non-branching version
for i in indices:
    mask_1 = 1 << i
    mask_2 = 0xFFFFFFFF ^ mask_1
    a = (a & mask_2) | (b & mask_1)
```

All of these are perfectly reasonable, but we can do better. Each of these solutions loops over the list of indices once
per state processed. Is this necessary? Not really. These loops generate masks within them and carry out their
operations using those masks; we can optimize by consolidating these masks, saving the results, then using those to
check or enforce each set of constraints. The result is a non-branching one-liner for each operation. Check it out:

```python
class Constraint:
    def __init__(self, *inds):
        self.mask = 0
        for ind in inds:
            self.mask |= (1 << ind)
        self.mask_inv = self.mask ^ 0xFFFFFFFF


class Zeros(Constraint):
    def check(self, word_1: int) -> bool:
        return word_1 & self.mask == 0

    def massage(self, word_1: int) -> int:
        return word_1 & self.mask_inv


class Ones(Constraint):
    def check(self, word_1: int) -> bool:
        return word_1 & self.mask == self.mask

    def massage(self, word_1: int) -> int:
        return word_1 | self.mask


class Eqs(Constraint):
    def check(self, word_1: int, word_2: int) -> bool:
        return (word_1 & self.mask) == (word_2 & self.mask)

    def massage(self, word_1: int, word_2: int) -> int:
        return (word_1 & self.mask_inv) | (word_2 & self.mask)
```

This is no small detail: in my implementation, switching from individual constraints enforcement to this batch
enforcement method brought the script from ~8000 trials per second to ~10,000 -- a 25% improvement!


#### Massaging the Message: Round One

Now that we know how to modify our state variables, let's turn our attention to message modifications, starting with
the modifications needed to satisfy our round 1 conditions.

The process for these first-round conditions is easy enough: just start at the start and work down the list.

First, modify $$a_1$$ so that the condition $$a_{1,7} = b_{0,7}$$ is met. Then, derive the message chunk required to
produce this modified $$a_1$$. To do this, we need to solve the round function `r1` for `m[k]`:

$$
\begin{align}
r_1(a, b, c, d, k, s, m) &= (a + F(b, c, d) + m_k) \lll s \\
r_1(a, b, c, d, k, s, m) \ggg s &= a + F(b, c, d) + m_k \\
(r_1(a, b, c, d, k, s, m) \ggg s) - a - F(b, c, d) &= m_k \\
\end{align}
$$

If we know what we want value we want $$r_1$$ to end up with, we can apply this equality to derive the message chunk
which will produce that value. Here's what it looks like for $$a_1$$:

$$
\begin{align}
a_1 &= r_1(a_0, b_0, c_0, d_0, 0, 3, m) \\
a_1 &= (a_0 + F(b_0, c_0, d_0) + m_0) \lll 3 \\
m_0 &= (a_1 \ggg 3) - a_0 - F(b_0, c_0, d_0) \\
\end{align}
$$

You can apply this procedure just as easily for any other intermediate state, say $$c_3$$:

$$
\begin{align}
c_3 &= r_1(c_2, d_2, a_2, b_2, 10, 11, m) \\
c_3 &= (c_2 + F(d_2, a_2, b_2) + m_{10}) \lll 11 \\
m_{10} &= (c_3 \ggg 11) - c_2 - F(d_2, a_2, b_2) \\
\end{align}
$$

How easy is that? Right? Not bad at all!

We can follow this process to straightforwardly enforce all our conditions on $$a_1, d_1, c_1, ..., b_4$$. With a
success probability of $$2^{-25}$$, this puts us well within the range where brute-force search can successfully find
collisions. This is a good point at which to test your attack code. For reference, with just these constraints my
Python implementation was finding about one collision per day.

That's not bad, but we can do way better - at the cost of some added complexity.


#### Massaging the Message: Round Two

One thing I've glossed over so far: whenever we change an intermediate state, we are also implicitly changing each
subsequent intermediate state. For instance, changing $$c_3$$ changes $$b_3$$, $$a_4$$, $$d_4$$, $$c_4$$, $$b_4$$, and
so on. Of course, $$d_3$$, $$a_3$$, $$b_2$$, $$c_2$$, $$d_2$$, etc, are all unchanged.

This is why our round one constraints have to be enforced in order: otherwise, they would run the risk of overwriting
each other.

When we get to round two, our process for deriving a new $$m_k$$ based on our desired modifications does not change.
What does change, however, is that any change we make will propogate backward into round 1. $$a_5$$ depends on $$m_0$$,
but so does $$a_1$$ -- therefore, if we modify $$m_0$$ to enforce conditions on $$a_5$$, we'll end up changing $$a_1$$
as well. This change will then propogate forward to $$d_1, c_1, b_1, a_2, b_2$$, and so on, undoing all our hard work as
it goes.

How can we prevent this? I'm glad you asked. Take a look at this diagram.

![Corrections for a5](/assets/img/wang-a5-adjustments.png){: .img-center }

This illustrates the process of correcting $$a_5$$. The process consists, in this case, of three steps.

The first step is shown in the leftmost section of the diagram, where $$a_5$$ is adjusted to meet our constraints and
$$m_1$$ is modified to produce the new value of $$a_5$$. This change also alters the value of a previous state ($$a_1$$)
and a later state ($$a_9$$).

We don't really care if $$a_9$$ changes since we haven't massaged that state.[^5] The change to $$a_1$$, however, will have
to be dealt with.

[^5]: As it happens, no constraints are specified for that state and so we won't be massaging it at all.

First, there is the possibility that our change to $$m_1$$ modified $$a_1$$ in such a way that our constraints on it are
no longer met. Some second-round conditions are more likely than others to mess up first-round conditions; for whatever
reason, the conditions for $$a_5$$ seem fairly stable. If we _were_ to find our first-round constraints invalidated by
our second-round message massage, the simplest solution is to just start over with a new message and hope for better
luck.[^6]

[^6]: I'm sure there are other, more complex methods of ensuring sets of conditions from two different rounds are simultaneously met; this is something I haven't looked into much yet and is a potential area for improvement in my current implementation of the attack. For instance, one simple approach would be to randomly generate new message blocks, massage one set of conditions into them, check them against the other set, and repeat this process until the check passes.

If the conditions on $$a_1$$ are still satisfied, then we can move on to the next step: containing the disruption caused
by changing $$a_1$$'s value. This is illustrated in the middle section of the diagram. $$a_1$$, shown in green, is in a
known-good state; its direct dependencies $$d_1, c_1, b_1, a_2$$ are highlighted in yellow to indicate that they have
been disrupted by the change to $$a_1$$.

Recall that we have a closed-form equation for deriving the message modification necessary to set any intermediate state
to any value. If we've saved the old values of $$d_1, c_1, b_1, a_2$$, we can just re-evaluate that equation for the new
value of $$a_1$$ to derive new message blocks $$m_2, m_3, m_4, m_5$$ which will give rise to the old values of $$d_1,
c_1, b_1, a_2$$. Since these are $$a_1$$'s only direct dependencies, if the values of these four states don't change,
then nothing after them in round 1 will change either.

Of course, making these changes to $$m_2, m_3, m_4, m_5$$ will create an even greater ripple effect, disrupting other
states in round 2. This is shown in the third part of the diagram, where $$d_5, a_6, a_7, a_8$$ are highlighted to show
that their values have changed (changes in round 3 are not shown, to avoid clutter).

The critical thing to notice is that all of these states occur _after_ the state we are concerned with massaging
($$a_5$$). Thus, we've managed to contain the impact from modifying $$a_5$$ so that the only altered states are ones
where no conditions have yet been enforced and therefore none of our work can be disrupted.

For each of $$a_5$$ through $$b_5$$, some variation of the three-step process above suffices to enforce our constraints
and clean up the side effects. Starting with $$a_6$$, though, a more involved process is required: correcting $$a_6$$
means updating $$m_1$$, which spreads changes to $$d_1, c_1, b_1, a_2, d_2$$, requiring updates to (among others)
$$d_5$$ -- which is positioned prior to $$a_6$$ chronologically, meaning that we can't safely ignore the changes to it.
The third-round constraints on $$b_{9}, a_{10}$$ pose similar challenges on an even greater scale.

This is a tricky situation to resolve; frankly, I'm not convinced it's worth the effort. Of the 122 conditions required
for Wang's attack, only 8 pertain to any state later than $$b_5$$; thus, heuristically, enforcing the first 114
conditions should yield messages satisfying all 122 conditions with a probability roughly on the order of $$2^{-8}$$.

That probability is high enough that exhaustive search should be a viable and performant option for finding messages
satisfying the constraints on $$a_6, d_6, c_6, b_{9}, a_{10}$$. That's good enough for me.


#### Follow-up: Equality Constraints

We've got one more detail to cover. Recall that one of the three constraint categories in our taxonomy is _equality_, as
in (say) $$a_{2,14} = b_{1,14}$$. There's a bit of a _gotcha_ here with the approach described earlier: recall how we
found a methodology for modifying any given state while leaving its direct dependencies unchanged. It turns out that
sometimes this isn't quite what we want to do.

Suppose we update $$b_{1}$$, changing $$b_{1,14}$$ in the process. Then we make other changes to carefully preserve the
old value of $$a_2$$. If $$a_{2,14} = b_{1,14}$$ prior to these changes, then $$a_{2,14} \ne b_{1,14}$$ afterwards. As
we can see, changing $$b_1$$ has the potential to invalidate $$a_2$$.

One possible solution here: modify $$a_2$$ to re-enforce the equality constraints, then jump through the necessary hoops
to contain the side effects from this change. This gets very messy very quickly.

If you choose this solution, the round 1 constraints have an interesting property that you will want to be aware of.
This should make your task somewhat easier: In round 1, no two consecutive states' equality constraints involve the same
bits. They don't overlap at all. Corollary: in round 1, correcting an invalidated equality constraint in one state will
_never_ directly invalidate an equality constraint in a following state. This is nice in that it leaves you with one
less way for side effects to propogate.

A different, simpler possible solution: First, say that exhaustive search is our chosen method for finding message
blocks that can simultaneously satisfy multiple rounds' state constraints. We can simply extend our search so that the
loop termination condition also includes checks on following states' equality constraints. This is the option I chose to
use in my implementation. The advantage of this option is that it allows us to avoid modifying the state to which the
equality constraint applies, meaning we also avoid creating any more side effects that we'd then have to clean up.


## The Results

If your implementation works, you should be able to discover collisions pretty quickly. If you have a practical need for
MD4 collisions, I'm not going to ask what you do for a living but I am going to suggest you look at some more recent
research on the subject, because you can do better than this attack. The paper cited in this post's footnotes is a good
starting point.

Note that while later attacks introduced different message differentials and different sets of conditions, the basic
ideas behind how to _implement_ the attack are relatively unchanged. The bulk of the ideas in this blog post can be
applied to more modern differential attacks pretty directly.

If you want to see what an implementation of Wang's attack might look like, my version (which enforces all constraints up
through $$b_5$$ (TODO TODO TODO finish up second round massage function TODO TODO TODO)) can be found
[here](https://github.com/wootfish/cryptopals/blob/master/challenge_55.py).

You may be wondering how modern hash functions defend themselves against attacks like this. The long answer could fill a
small book; the short answer is that modern designs try to "mix" message blocks together more effectively. For instance,
SHA-1 and SHA-2 use "message expansion" steps which expand the 16 words of a message block into 80 or 64 words
respectively. In each case, the expansion step is designed so that changing any of the 16 message chunks produces a
large number of changes in the expansion. This causes differentials to spread much more quickly and in much more complex
ways through the function's internal state. Another defense is to simply build a hash function around a different design
primitive; a good example of this is SHA-3, which is designed around a sponge function instead of round functions.




<hr>
