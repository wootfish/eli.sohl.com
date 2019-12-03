---
layout: post
title: Wang's Attack
mathjax: true
---


Everyone knows MD4 is insecure. Modern attacks can find MD4 collisions almost instantly. With that level of
vulnerability, it's easy to forget that the algorithm stood up to a decade and a half of cryptanalysis before Wang et
al. broke it open in 2004.

Wang's attack was the first efficient collision attack on full MD4, but it was not the last; both the efficiency of the
attack and the clarity of its presentation were improved by later research. Nevertheless, Wang's attack has historical
significance, and it is included in [set 7 of the Cryptopals Challenges](https://cryptopals.com/sets/7/challenges/55).

I've been working through Cryptopals lately and I found this to be, without a doubt, the hardest and most rewarding
challenge in the first 7 sets.

The attack is hard for two reasons: first, it is tricky to implement; second, it is tricky to _understand_. [The
original paper](https://link.springer.com/content/pdf/10.1007%2F11426639_1.pdf) provides only a loose sketch of the
attack, accompanied by some example collisions to show that it works. To work out the details, you have to read between
the lines of a challenging paper which (for English speakers) is only available in translation.

Eventually I gave in and started searching for blog posts on the subject. The landscape is surprisingly sparse. There
are a few posts, but they left me with a lot of unanswered questions. To actually write the attack, I ended up having to
forego these and instead retrace the paper's steps as much as possible, filling in the blanks as I went.

This is written to be the post I wish I'd found. I hope someone finds it useful. If it isn't detailed enough for you,
come on out to Seattle and we'll go through it over beers.


## The Basic Idea

Wang et al. frame this as a _differential attack_, meaning they are interested in finding collisions between pairs of
messages where the messages also `xor` to some fixed constant. That is to say, we want messages $$m_1, m_2$$ such that
$$H(m_1) = H(m_2)$$ and $$m_1 \oplus m_2 = D$$ for some fixed differential $$D$$.

This might sound like adding an unnecessary constraint, but it gives us a powerful way of reframing the problem. Note
that this definition makes $$m_2$$ fully dependent on $$m_1$$ and $$D$$, so for the attack to succeed it suffices to
identify a differential $$D$$ and a set of messages $$S$$ such that if $$m \in S$$ then $$H(m) = H(m \oplus D)$$ with
high probability.

Wang's attack consists of a definition for one such differential $$D$$ and a method for finding likely elements of the
corresponding message set $$S$$.

The basic insight behind the attack is that MD4 makes it easy to track how various differentials spread through the hash
function's state. With enough careful analysis,[^1] this allows us to find sufficient conditions for certain
differentials to "cancel each other out" like waves destructively interfering.

[^1]: Plus some other conveniences, like a number of simple collisions in the hash function's round functions. These are essential to the theory behind the attack but totally irrelevant to its implementation.

In keeping with this idea, the message set $$S$$ is defined in terms of a set of sufficient conditions on the hash
function's intermediate states. Methods are prescribed for ensuring that a few of these conditions are met; we are left
to figure out the rest on our own.

The result, if we are successful, is that differences in the messages' hashes' intermediate states are introduced and
erased -- that is, the intermediate states are made to diverge and then reconverge -- producing collisions.

Before expanding on that idea, let's review the relevant parts of MD4 itself.


## The Structure of MD4

#### In Brief

MD4 has a 128-bit internal state. Internally, this is represented as four 32-bit state variables. These are initialized
to certain fixed values. The details aren't important for us.

MD4 takes 512-bit message blocks. We're only going to concern ourselves with one-block messages here, because those are
all we need to find collisions.[^2]

[^2]: Note that if we find any colliding one-block messages, we can use these to produce arbitrary-length collisions by simply appending the same byte sequence to each colliding message.

Message blocks are broken up into sixteen consecutive 32-bit chunks denoted by $$m_0, m_{1}, ..., m_{15}$$.

The message block is mixed into the state through a series of three rounds. Each round consists of sixteen steps; each
step modifies one of the four state variables as a function of the whole state plus a message chunk $$m_k$$.

Each message chunk is used exactly once per round. Each of the three rounds uses a different round function. All three
round functions have simple algebraic representations.

#### In Detail

You can find a full implementation of MD4 [here](https://github.com/wootfish/cryptopals/blob/master/challenge_30.py);
within that codebase, all three rounds are calculated [here](https://github.com/wootfish/cryptopals/blob/master/challenge_30.py#L66).
The most relevant parts are excerpted below.

Here's what the round functions look like. In the code below, `a, b, c, d` are the four state variables, `m` is a list
of 32-bit message chunks, `k` is the index of the message chunk to use, and `s` is the number of bits to left-rotate by.

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

This may look pretty arbitrary. That's fine; I'm not going to try to convince you that it isn't. Much like with the
round functions, we don't need to concern ourselves with the motivations behind this design. The main reason I included
this code is because it shows exactly how a message block is mixed into the hash function's state.

Recall that the first integer argument to each of these functions is the index of the message chunk it uses. Note how
each chunk is used exactly once per round, and how the order of use varies between rounds.

In the code block above, intermediate states are grouped into rows of four. This looks nice, and it also mimics the
paper's notation. This notation denotes e.g. the first state on the first row as $$a_1$$, the third state on the fourth
row as $$c_4$$, and so on. $$a_0, b_0, c_0, d_0$$ denote the values to which the four state variables `a, b, c, d` are
initialized.

The paper uses an extension of this notation to denote individual bits within states: for instance, $$c_{4,1}$$ refers
specifically to $$c_4$$'s least significant bit, $$d_{2,14}$$ refers to $$d_2$$'s 14th bit counting from the least
significant end, $$b_{9,32}$$ is $$b_9$$'s 32nd-least significant bit (i.e. its most significant bit), and so on.

This notation is important because it is used to express all of the paper's constraints on MD4's intermediate states.
These are central to the attack.

Note that both subscripts in this notation are 1-indexed -- this is something for implementers to look out for as a
potential source of off-by-one errors.

A quick note on terminology: The original paper prefers the term _conditions_ over _constraints_ when discussing the
rules it defines for MD4's intermediate states. _Conditions_ is more in line with the attack's theoretical
underpinnings, but I feel that _constraints_ is more reflective of how these rules are used when carrying out the
attack. This post uses the two terms more or less interchangeably.


## The Attack

The core of Wang's attack is a large list of constraints on the hash function's intermediate states. Despite what the
paper says, these do not quite form a set of sufficient conditions -- but they do come close.[^3] Here is the relevant
table (from page 16 of the paper):

[^3]: Subsequent research has identified the conditions missing from Wang et al.'s paper, as well as other differentials which utilize smaller sets of constraints (e.g. [Yu Sasaki et al., 2007](https://www.iacr.org/archive/fse2007/45930331/45930331.pdf)). This subsequent research is worth studying in their own right, but it is out of scope for this post.

[![Table 6: A Set of Sufficient Conditions for Collisions of MD4](/assets/img/wang-table-6.png){: .img-center }](/assets/img/wang-table-6.png)

This may look daunting, but if you stare at it for long enough you'll notice that nearly all of the conditions fall into
three broad categories: requiring that certain bits within intermediate states are either 1, 0, or equal to the bit at
the same index in a prior state (almost always the _immediately_ prior state). The only exceptions are two conditions on
$$c_6$$, namely $$c_{6,30} = d_{6,30}+1$$ and $$c_{6,32} = d_{6,32}+1$$.

The bulk of these conditions apply to first-round intermediate states. According to Wang et al., satisfying the
first-round conditions (i.e. everything up through $$b_4$$) is enough to produce a collision with probability
$$2^{-25}$$. If _all_ the conditions are satisfied, then "the probability can be among $$2^{-6} \sim 2^{-2}$$." This
sounds pretty good, but don't get too excited just yet.

If you'll grant me license to editorialize for a moment: The unusually loose phrasing of this probability's value seems
(to me) to imply that Wang et al. were unable to directly measure it, suggesting that even they may not have found a
methodology for enforcing _all_ of their conditions. They likely got close, but how close is anyone's guess.

With that in mind, let's see how close we can get. The idea for the whole attack is something like this:



Generate a random input message; then, compute all the intermediate states generated by hashing this message; in the
process of computing these states, derive and perform the necessary message modifications for these states to satisfy as
many as possible of the conditions in Table 6.

Wang et al. simply call this "message modification", but let's add a little flavor and refer to it as _massaging the
message_, or simply conducting a _message massage_.

After massaging the message, our odds of finding a collision between the message and its modified version are greatly
increased. The more conditions we are able to satisfy, the higher the probability of success.

We'll start by massaging the message so that all the first-round conditions are met; then, we'll use a somewhat more
complex procedure to enforce a few of the second-round conditions. We won't even bother with the third-round conditions
-- you'll see why when we get to the second round.


#### Enforcing Constraints

Since all our constraints pertain to specific bits within 32-bit integers, we can easily enforce them through bitwise
operations.

Frankly, I'd hope you can figure this part out on your own. That said, the way you choose to implement it can have a big
impact on performance, so let's take a moment to go over the options.

The first option is to enforce each constraint individually. This is less performant than the other option we'll be
looking at, but it is also arguably more straightforward.

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

All of these are perfectly reasonable, but we can do better. Each of these solutions involves a loop over a list of
indices. This loop would be executed once per state processed. Is this necessary? Not really. These loops generate masks
within them and carry out their operations using those masks; we can optimize by precomputing and consolidating these
masks, storing them, then using these stored values to check or enforce each set of constraints. The result, at the cost
of a tiny bit of prep work, is a non-branching one-liner for each operation. Check it out:

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

This is no small detail -- in my implementation, switching from the first method here to the second method improved
overall performance by 25%!

We can describe all the round 1 constraints in terms of these `Zeros`, `Ones`, and `Eqs` objects. For the sake of
completeness, here's what that might look like:

```python
round_1 = [[Eqs(6)],
           [Zeros(6), Eqs(7, 10)],
           [Zeros(10), Ones(6, 7), Eqs(25)],
           [Zeros(7, 10, 25), Ones(6)],
           [Zeros(25), Ones(7, 10), Eqs(13)],
           [Zeros(13), Ones(25), Eqs(18, 19, 20, 21)],
           [Zeros(13, 18, 19, 21), Ones(20), Eqs(12, 14)],
           [Zeros(14, 18, 19, 20, 21), Ones(12, 13), Eqs(16)],
           [Zeros(16, 18, 19, 20), Ones(12, 13, 14, 21), Eqs(22, 25)],
           [Zeros(16, 19, 22), Ones(12, 13, 14, 20, 21, 25), Eqs(29)],
           [Zeros(19, 20, 21, 22, 25), Ones(16, 29), Eqs(31)],
           [Zeros(19, 29, 31), Ones(20, 21, 25)],
           [Zeros(22, 25, 31), Ones(29), Eqs(26, 28)],
           [Zeros(22, 25, 29), Ones(26, 28, 31)],
           [Zeros(26, 28, 29), Ones(22, 25), Eqs(18)],
           [Zeros(18, 29), Ones(25, 26, 28)]]
```

This gives us almost everything we need for round 1. Round 2 is a little more involved... but we'll get to that later.


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

If we know what we want value we want $$r_1$$ to evaluate to, we can apply this equality to derive the message chunk
which will produce that value. Here's what it looks like for $$a_1$$:

$$
\begin{align}
a_1 &= r_1(a_0, b_0, c_0, d_0, 0, 3, m) \\
a_1 &= (a_0 + F(b_0, c_0, d_0) + m_0) \lll 3 \\
m_0 &= (a_1 \ggg 3) - a_0 - F(b_0, c_0, d_0) \\
\end{align}
$$

You can apply this just as easily for any other intermediate state, say $$c_3$$:

$$
\begin{align}
c_3 &= r_1(c_2, d_2, a_2, b_2, 10, 11, m) \\
c_3 &= (c_2 + F(d_2, a_2, b_2) + m_{10}) \lll 11 \\
m_{10} &= (c_3 \ggg 11) - c_2 - F(d_2, a_2, b_2) \\
\end{align}
$$

How easy is that? Right? Not bad at all!

We can follow this process to enforce all our conditions on $$a_1, d_1, c_1, ..., b_4$$.

We can even define a modified round function that automatically makes the required changes to each state's corresponding
message block at the same time as computing the states:

```python
def f(a, b, c, d, k, s, m):
    # serves as normal round function, but also adjusts m as it goes
    a_new = r1(a, b, c, d, k, s, m)
    for suite in round_1[k]:
        a_new = suite.massage(a_new, b)
    m[k] = (rrot(a_new, s) - a - F(b, c, d)) % (1 << 32)
    return a_new
```

This allows us to implement the round 1 message massage by simply copy-pasting the MD4 round 1 block from above and
swapping out `r1` for `f`.

This brings us to a success probability of roughly $$2^{-25}$$, at which point the attack is actually practical. This is
a good time to test your attack code. For reference, with just these constraints my Python implementation was finding
about one collision per day.

That's not bad, but we can do way better - at the cost of some added complexity.


#### Massaging the Message: $$a_5$$

One thing I've glossed over so far: whenever we change an intermediate state, we are also implicitly changing each
subsequent intermediate state. For instance, changing $$c_3$$ also implicitly changes $$b_3$$, $$a_4$$, $$d_4$$, $$c_4$$,
$$b_4$$, and so on. Of course, the preceding states $$d_3$$, $$a_3$$, $$b_2$$, $$c_2$$, $$d_2$$, etc, are all unchanged.

This is why our round one constraints have to be enforced in order: otherwise, they would run the risk of overwriting
each other.

When we get to round two, our process for deriving a new $$m_k$$ based on our desired modifications still works, but
with a caveat: any change we make will propogate backward into round 1. For example, $$a_5$$ depends on $$m_0$$, but so
does $$a_1$$ -- therefore, if we modify $$m_0$$ to enforce conditions on $$a_5$$, we'll end up changing $$a_1$$ as well.
This change will then propogate forward to $$d_1, c_1, b_1, a_2, b_2$$, and so on, undoing all our hard work as it goes.

How can we prevent this? I'm glad you asked. Take a look at this diagram.

[![Corrections for a5](/assets/img/wang-a5-adjustments.png){: .img-center }](/assets/img/wang-a5-adjustments.png)

This illustrates the process of correcting a second-round state (namely $$a_5$$). In this case, the process consists of
three steps.

The first step is shown in the leftmost section of the diagram, where $$a_5$$ is adjusted to meet our constraints and
$$m_1$$ is modified to produce the new value of $$a_5$$. This change also alters the value of a previous state ($$a_1$$)
and a later state ($$a_9$$).

We don't really care if $$a_9$$ changes, since we haven't massaged that state.[^4] The change to $$a_1$$, however, will
have to be dealt with.

[^4]: In fact, no constraints are specified for $$a_9$$ and so we won't be massaging it at all.

First, there is the possibility that our change to $$m_1$$ modified $$a_1$$ in such a way that our conditions on $$a_1$$
are no longer satisfied. Some second-round conditions are more likely than others to mess up first-round conditions; for
whatever reason, the conditions for $$a_5$$ seem to be stable.

If we _were_ to find our first-round constraints invalidated by our second-round message massage, that would be a big
problem. See the sections on $$d_5$$ and $$a_6$$ for a couple ideas of what effective solutions might look like.

If the conditions on $$a_1$$ are still satisfied, we can move on to the next step: containing the disruption caused by
changing $$a_1$$'s value. This is illustrated in the middle section of the diagram. $$a_1$$, shown in green, is in a
known-good state; its direct dependencies $$d_1, c_1, b_1, a_2$$ are highlighted in yellow to indicate that they have
been disrupted by the change to $$a_1$$.

Recall that we can derive the message modification necessary to set any intermediate state to any value (albeit not
without side effects). If we've saved the old values of $$d_1, c_1, b_1, a_2$$, we can just re-evaluate our equation
with the new value of $$a_1$$ to derive new message blocks $$m_2, m_3, m_4, m_5$$ which will produce the old values of
$$d_1, c_1, b_1, a_2$$. Since these are $$a_1$$'s only direct dependencies, preventing them from changing prevents
each subsequent state from changing as well.

Of course, making these changes to $$m_2, m_3, m_4, m_5$$ will create an even greater ripple effect, disrupting other
states in round 2. This is shown in the third part of the diagram, where $$d_5, a_6, a_7, a_8$$ are highlighted to show
that their values have changed (changes to round 3 states are omitted to avoid clutter).

The critical thing here is that all of these states occur _after_ the state we're concerned with massaging ($$a_5$$).
Thus we have managed to contain the impact from modifying $$a_5$$ so that the only altered states are ones where no
constraints have yet been enforced, and therefore none of our work can be disrupted.

Well... almost none. There is still a chance of messing up our _equality constraints_. Take, for example, the constraint
$$a_{2,14} = b_{1,14}$$.

Suppose we update $$a_{2}$$, and suppose further that we end up changing $$a_{2,19}$$ in the process. Afterwards, as
described above, we carefully make sure to preserve the old value of $$d_2$$. Now, if $$a_{2,19} = d_{2,19}$$ prior to
these changes, then $$a_{2,19} \ne d_{2,19}$$ afterwards. In other words, changing $$a_2$$ has the potential to break
our constraints on $$d_2$$. This is not an isolated issue: whenever we modify a state that is mentioned in another
state's equality constraints, we have to make sure that these equalities still hold.

As it happens, our modifications to $$a_{2}$$ don't tend to disrupt $$a_{2,19}$$. When we move on to massaging $$d_5$$
and $$a_6$$, though, we will have to take this issue into consideration.


#### Massaging the Message: $$d_5$$

Moving right along: Our next task is to massage $$d_5$$. This state takes $$m_4$$ as input, and $$m_4$$ is also used by
$$a_2$$.

The considerations discussed above in the context of $$a_5$$ apply here as well, but we have an additional challenge to
overcome: our changes to $$d_5$$ have a tendency to disrupt our earlier changes to $$a_2$$. This cuts both ways: if we
re-massage $$a_2$$, our changes are also likely to break the constraints for $$d_5$$. The method we have been using thus
far for satisfying sets of constraints can get either $$a_2$$ or $$d_5$$ to a known-good state, but it is very unlikely
to take care of both of them at once.

There are several potential solutions here.

If we're truly lazy, the low-effort solution is to try just running a loop that starts by randomizing the message chunk,
then generates the corresponding states $$a_2$$ and $$d_5$$, checks whether the states' constraints are satisfied, and
exits only if they are. This works, but it is not fast or elegant.

We could try enforcing our conditions on one state, then compute the resulting value of the other state, enforce our
conditions on that state, compute the resulting new value of the first state, and go back and forth until both are
satisfied. It would be nice if this worked reliably... but it doesn't.

My preferred solution is to _combine_ both sets of constraints. We will find a way of translating both of them from
constraints on _states_ to constraints on _the corresponding message chunk itself_. This requires some careful
bookkeeping, but it will allow us to enforce both sets of constraints at once, preventing them from conflicting with
each other.

Recall that the round functions `r1, r2` are defined like so:

```python
def r1(a: int, b: int, c: int, d: int, k: int, s: int, m: Sequence[int]) -> int:
    val = (a + F(b, c, d) + m[k]) % (1 << 32)
    return leftrotate(val, s)

def r2(a: int, b: int, c: int, d: int, k: int, s: int, m: Sequence[int]) -> int:
    val = (a + G(b, c, d) + m[k] + 0x5A827999) % (1 << 32)
    return leftrotate(val, s)
```

The values of `a, b, c, d` come from previous states, so we can treat them as constant. This allows us to simplify the
round functions somewhat. Let `N_1` and `N_2` denote consolidated constants for `r1` and `r2`, respectively. We can
then rewrite the formulae for our intermediate states like so:

$$
\begin{align}
N_1 &= a_1 + F(b_1, c_1, d_1) \\
N_2 &= d_4 + G(a_5, b_4, c_4) + \mathtt{0x5A827999} \\
\\
a_2 &= (N_1 + m_k) \lll 3 \\
d_5 &= (N_2 + m_k) \lll 5 \\
\\
a_2 \ggg 3 &= N_1 + m_k \\
d_5 \ggg 5 &= N_2 + m_k
\end{align}
$$

Through this equality we can translate constraints on $$a_2$$ and $$d_5$$ into constraints on $$N_1 + m_4$$ and $$N_2 +
m_4$$ respectively.

We will adapt our earlier notation to denote specific bits within these sums, e.g. $$(N_2 + m_4)_5$$
for the 5th bit of this sum. Note that $$(N_2 + m_4)_5$$ is not equivalent to $$N_{2,5} + m_{4,5}$$ since $$(N_2 +
m_4)_5$$ has the potential to be altered by carries from the sums of lower-order bits.

Take the constraint $$a_{2,8} = 1$$. We can translate this as $$(N_1 + m_{k})_5 = 1$$. Note that the original
constraint's index of 8 becomes 5 after translation. Indices of $$a_2$$'s constraints need to be adjusted by 3, as
shown; indices for $$d_5$$'s constraints need to be adjusted by 5. This is to compensate for the round functions' bit
rotations. Aside from this caveat, the translation process is pretty simple.

The full list of translated constraints is as follows.

$$
\begin{align}
(N_1 + m_4)_5    &= 1 \\
(N_1 + m_4)_8    &= 1 \\
(N_1 + m_4)_{11} &= b_{1,14} \\
(N_2 + m_4)_{14} &= a_{5,19} \\
(N_2 + m_4)_{21} &= b_{4,26} \\
(N_2 + m_4)_{22} &= b_{4,27} \\
(N_1 + m_4)_{23} &= 0 \\
(N_2 + m_4)_{24} &= b_{4,29} \\
(N_2 + m_4)_{25} &= b_{4,30} \\
(N_2 + m_4)_{26} &= b_{4,32}
\end{align}
$$

As luck would have it, all of these constraints translate to distinct indices. If this were not the case then we would
have a bit of an awkward situation,[^5] but as things stand it is straightforward to enforce all of these at once.

[^5]: For instance, if we had (say) the constraints $$(N_1 + m_4)_5 = 0$$ and $$(N_2 + m_4)_5 = 0$$, and we also had $$N_{1,5} \ne N_{2,5}$$, then we would not be able to satisfy both constraints just by changing $$m_{4,5}$$. We could try flipping a lower-order bit in $$m_4$$ -- for example, if we further note that $$N_{1,4} \ne N_{2,4}$$ -- meaning that precisely one of those bits is 1 -- then setting $$m_{4,4} = 1$$ would induce a carry on precisely one of $$N_1, N_2$$, zeroing the 1 bit at index 5 and allowing the constraint to be enforced. This method is somewhat involved, and it does not work in all cases. I have not used it in my implementation.

Our general methodology will be to work from low-order bits upward. For each bit, we will note the value it has and the
value we want it to have. If the constraint is already satisfied, we do nothing; otherwise, we flip the corresponding
bit in $$m_4$$. Since addition is just xor with carries, this will suffice to flip the bit in the sum. Note that this
modification also has the potential to modify higher-order bits in the sum, meaning we will have to re-evaluate the sum
after each modification to $$m_4$$.

Here is a lightly edited version of my implementation of the $$d_5$$ massage. Small changes have been made to maintain
consistency with this post's notation. Note that $$m_4$$ is initialized to 0; there is no deep reason for this. The
initial value could just as easily be any other constant or even `random.getrandbits(32)`. I just chose 0 for the sake
of simplicity and determinism.

```python
N_1 = (a_1 + F(b_1, c_1, d_1)) % MODULUS
N_2 = (d_4 + G(a_5, b_4, c_4) + 0x5A827999) % MODULUS
b_rot = rrot(b_4, 5)

m_4 = 0

def set_d5_bit(N_orig, m, ind, x):
    N = (N_orig + m) % MODULUS
    return (N & (1 << ind)) ^ x

m_4 |= set_d5_bit(N_1, m_4, 4, 1 << 4)
m_4 |= set_d5_bit(N_1, m_4, 7, 1 << 7)
m_4 |= set_d5_bit(N_1, m_4, 10, (state_log[7] >> 3) & (1 << 10))
m_4 |= set_d5_bit(N_2, m_4, 13, (a >> 5) & (1 << 13))
m_4 |= set_d5_bit(N_2, m_4, 20, b_rot & (1 << 20))
m_4 |= set_d5_bit(N_2, m_4, 21, b_rot & (1 << 21))
m_4 |= set_d5_bit(N_1, m_4, 22, 0)
m_4 |= set_d5_bit(N_2, m_4, 23, b_rot & (1 << 23))
m_4 |= set_d5_bit(N_2, m_4, 24, b_rot & (1 << 24))
m_4 |= set_d5_bit(N_2, m_4, 26, b_rot & (1 << 26))
m[4] = m_4

# regenerate d_5 and a_2
d_5 = r2(d_4, a_5, b_4, c_4, 4, 5, m)
a_2 = r1(a_1, b_1, c_1, d_1, 4, 3, m)

### Next steps (code omitted due to heavy dependence on implementation details):
# Re-massage d_2 to ensure its equality constraints with a_2 are still met
# Regenerate m_5 thru m_9 to contain side effects from changes to a_2 & d_2
```

This suffices to satisfy our constraints on $$d_5$$.


#### Massaging the Message: $$a_6$$

These later constraints are gradually harder and harder to enforce. The last constraint my implementation enforces is
$$a_{6,29} = 1$$. For whatever reason, we can usually massage this constraint into $$a_6$$ without any trouble. The
probability of failure appears to be about 0.0075, which is pretty low.

Since this probability is so low, I chose to use a pretty quick-and-dirty way of handling constraint failures. Frankly,
there is a little room for improvement here. I suspect we could manage a 2% or 3% speedup, but I haven't gotten around
to trying it yet.

For now, what I'm doing is simple: generate $$a_6$$, massage $$a_6$$, regenerate $$d_1$$, check whether our constraints
on $$d_1$$ or $$c_1$$ are violated, if so then replace $$m_1$$ with a random 32-bit int and try again in a loop until
all our constraints are met.

As mentioned, this loop is entered about 0.75% of the time. When entered, it exits after about 17 iterations on average.

I suspect it would be possible to improve this by applying a similar method as with $$a_6$$. If successful, this would
let us drop the constraint checks and the `while` loop, which would slightly (but measurably!) improve the script's hash
rate. Maybe someday I'll try that. Or maybe you will :-)


## The Results

If your implementation works, you should be able to discover collisions pretty quickly. If you have a practical need for
MD4 collisions, I'm not going to ask what you do for a living but I am going to suggest you look at some more recent
research on the subject, because you can do better than this attack. The paper cited in this post's footnotes is a good
starting point.

Note that while later attacks introduced different message differentials and different sets of conditions, the basic
ideas behind how to _implement_ the attack are relatively unchanged. The core ideas in this blog post map to more recent
differential attacks on MD4 and related functions more or less directly.

If you're curious about what an implementation of Wang's attack might look like, my take on it can be found [here](https://github.com/wootfish/cryptopals/blob/master/challenge_55.py).

I'm measuring a success probability of about $$2^{-17.3}$$ using the techniques described in this post. With my Python
implementation running in a Qubes VM on my ThinkPad T420s, I see a rate of about three collisions per minute.

You may be wondering how modern hash functions defend against this sort of attack. The long answer to that question
would fill a small book; the short answer is that modern designs take greater pains to ensure dispersion of
differentials through the function's full internal state.

For instance, SHA-1 and SHA-2 use "message expansion" steps which expand the 16 words of a message block into an input
buffer of 80 and 64 words respectively. In both cases, the expansion step is designed so that changing any of the 16
message chunks will give rise to a large number of differences in the expanded message. Message expansion takes place
before the (expanded) message is mixed into the hash function's internal state. As a consequence, any small change to
the message will produce many more (and more complex) changes to the internal state than in MD4.

Another defense is to simply build a hash function around a different design primitive; a good example of this is SHA-3,
which uses a radically different design based around a sponge function. The sponge function is required to provide
strong differential dispersion by definition. The resulting algorithm is strikingly simple and comes with elegant
security proofs. I'm no expert, but reading about SHA-3 and sponge constructions makes me wonder why we haven't been
building hash functions this way from the start.


<hr>
