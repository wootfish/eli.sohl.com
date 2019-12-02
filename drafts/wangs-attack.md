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

Two reasons why: first, the attack is tricky to implement; second, it is tricky to _understand_. [The original
paper](https://link.springer.com/content/pdf/10.1007%2F11426639_1.pdf) provides only a loose sketch of the attack,
accompanied by some example collisions to show that it works. To work out the details, you have to read between the
lines of a challenging paper which (for English speakers) is only available in translation.

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

This may look pretty arbitrary. That's fine; I'm not going to try to convince you that it isn't. Much like the round
functions, we don't really need to concern ourselves with the motivations behind the design here. The main reason I
included this code is because it shows exactly how a message block is mixed into the hash function's state.

Recall that the first integer argument to each of these functions is the index of the message chunk within the message
block. Note how each chunk is used exactly once per round, and how the order of use varies between rounds.

In the code block above, intermediate states are grouped into rows of four. This mimics the paper's notation, which
denotes e.g. the first state on the first row as $$a_1$$, the fourth row's third intermediate state as $$c_4$$, and so
on. $$a_0, b_0, c_0, d_0$$ denote the values to which the four state variables `a, b, c, d` are initialized.

The paper extends this notation to let us refer to individual bits within states: for instance, $$c_{4,1}$$ refers
specifically to $$c_4$$'s least significant bit, $$d_{2,14}$$ refers to $$d_2$$'s 14th bit counting from the
least significant end, $$b_{9,32}$$ is $$b_9$$'s 32nd-least significant bit (i.e. its most significant bit), and so on.

This notation is important because it is used to express all of the paper's constraints on MD4's intermediate states.
These form the core of the attack.

Note that both subscripts are 1-indexed -- this is something for implementers to look out for as a potential source of
off-by-one errors.

A quick note on terminology: The original paper prefers the term _conditions_ over _constraints_ when discussing the
rules it defines for MD4's intermediate states. _Conditions_ is more in line with the attack's theoretical
underpinnings, but I feel that _constraints_ is more reflective of how these rules are used when carrying out the
attack. This post uses the two terms more or less interchangeably.


## The Attack

The core of Wang's attack is a large list of constraints on the hash function's intermediate states. Despite what the
paper says, these do not quite form a set of sufficient conditions -- but do they come close.[^3] Here is the relevant
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
(to me) to imply that Wang et al. were unable to directly measure the probability, suggesting that even they may not
have found a methodology for enforcing _all_ of their conditions. They likely got close, but how close is anyone's
guess. With that in mind, let's see how close we can get.[^4]

The idea for the whole attack is something like this:

[^4]: How close? I'm measuring a success probability of about $$2^{-17.3}$$ using the techniques described here. With my Python implementation running in a Qubes VM on my ThinkPad T420s, this shakes out to about one collision per 20 seconds.

Generate a random input message; then, compute all the intermediate states generated by hashing this message; in the
process of computing these states, derive and perform the necessary message modifications for these states to satisfy as
many as possible of the conditions in Table 6.

Wang et al. simply call this "message modification", but let's have a little more fun and refer to it as _massaging the
message_. Successfully carrying out the attack means managing a meticulous message massage.

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

All of these are perfectly reasonable, but we can do better. Each of these solutions involves a loop over the list of
indices. This loop would be executed once per state processed. Is this necessary? Not really. These loops generate masks
within them and carry out their operations using those masks; we can optimize by precomputing and consolidating these
masks, storing them, then using these stored values to check or enforce each set of constraints. The result is a
non-branching one-liner for each operation. Check it out:

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

This is no small detail. Getting rid of loops is a big deal for performance. In my implementation, switching from
the first method here to the second method improved overall performance by 25%!

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

We can follow this process to straightforwardly enforce all our conditions on $$a_1, d_1, c_1, ..., b_4$$.

With a success probability of roughly $$2^{-25}$$, this brings us to a point where the attack is actually practical.
This is a good time to test your attack code. For reference, with just these constraints my Python implementation was
finding about one collision per day.

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

We don't really care if $$a_9$$ is changed, since we haven't massaged that state.[^5] The change to $$a_1$$, however,
will have to be dealt with.

[^5]: In fact, no constraints are specified for $$a_9$$ and so we won't be massaging it at all.

First, there is the possibility that our change to $$m_1$$ modified $$a_1$$ in such a way that our conditions on $$a_1$$
are no longer met. Some second-round conditions are more likely than others to mess up first-round conditions; for
whatever reason, the conditions for $$a_5$$ seem fairly stable. If we _were_ to find our first-round constraints
invalidated by our second-round message massage, the simplest solution (though not the only one, as we will see when we
get to $$d_5$$) is to just start over with a new message and hope for better luck.[^6]

[^6]: I'm sure there are other, more complex methods of ensuring sets of conditions from two different rounds are simultaneously met; this is something I haven't looked into much yet and is a potential area for improvement in my current implementation of the attack. For instance, one simple approach would be to randomly generate new message blocks, massage one set of conditions into them, check them against the other set, and repeat this process until the check passes.

If the conditions on $$a_1$$ are still satisfied, then we can move on to the next step: containing the disruption caused
by changing $$a_1$$'s value. This is illustrated in the middle section of the diagram. $$a_1$$, shown in green, is in a
known-good state; its direct dependencies $$d_1, c_1, b_1, a_2$$ are highlighted in yellow to indicate that they have
been disrupted by the change to $$a_1$$.

Recall that we have a closed-form equation for deriving the message modification necessary to set any intermediate state
to any value. If we've saved the old values of $$d_1, c_1, b_1, a_2$$, we can just re-evaluate that equation with the
new value of $$a_1$$ to derive new message blocks $$m_2, m_3, m_4, m_5$$ which will give rise to the old values of
$$d_1, c_1, b_1, a_2$$. Since these are $$a_1$$'s only direct dependencies, if the values of these four states don't
change, then nothing after them in round 1 will change either.

Of course, making these changes to $$m_2, m_3, m_4, m_5$$ will create an even greater ripple effect, disrupting other
states in round 2. This is shown in the third part of the diagram, where $$d_5, a_6, a_7, a_8$$ are highlighted to show
that their values have changed (changes to round 3 states are omitted to avoid clutter).

The critical thing to notice is that all of these states occur _after_ the state we are concerned with massaging
($$a_5$$). Thus, we've managed to contain the impact from modifying $$a_5$$ so that the only altered states are ones
where no conditions have yet been enforced and therefore none of our work can be disrupted.

Well... almost none. There is still a chance of disrupting our _equality constraints_. Take, for example, the constraint
$$a_{2,14} = b_{1,14}$$.

Suppose we update $$a_{2}$$, and suppose further that we end up changing $$a_{2,19}$$ in the process. Afterwards, as
described above, we carefully make sure to preserve the old value of $$d_2$$. Now, if $$a_{2,19} = d_{2,19}$$ prior to
these changes, then $$a_{2,19} \ne d_{2,19}$$ afterwards. In other words, changing $$a_2$$ has the potential to break
our constraints on $$d_2$$. This is not an isolated issue: whenever we modify a state that is mentioned in another
state's equality constraints, we have to make sure that these equalities still hold.

As it happens, our modifications to $$a_{2}$$ don't tend to disrupt $$a_{2,19}$$. When we move on to massaging $$d_5$$
and $$a_6$$, though, we will have to take this issue into consideration.

You can read my implementation of the $$a_5$$ massage step [here (TODO TODO TODO)](TODO)


#### Massaging the Message: $$d_5$$

Moving right along: Our next task is to massage $$d_5$$. This state takes $$m_4$$ as input, and $$m_4$$ is also used by
$$a_2$$.

The considerations that we discussed in the context of $$a_5$$ apply here as well, but we have an additional challenge
to overcome: our changes to $$d_5$$ have a tendency to disrupt our earlier changes to $$a_2$$. This cuts both ways: if
we re-massage $$a_2$$, our changes are also likely to break the constraints for $$d_5$$. Our typical method of
satisfying constraints can get either $$a_2$$ or $$d_5$$ to a known-good state, but it is very unlikely to take care of
both of them at once.

There are several potential solutions here.

If we're truly lazy, we could try just running a loop that starts by randomizing the message chunk, then generates the
corresponding states $$a_2$$ and $$d_5$$, checks whether the states' constraints are satisfied, and exits only if they
are. This works, but it is not fast or elegant.

We could try enforcing our conditions on one state, then compute the resulting value of the other state, enforce our
conditions on that state, compute the resulting new value of the first state, and go back and forth until both are
satisfied. It would be nice if this worked reliably; unfortunately, it doesn't.

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
then rewrite our intermediate states in terms of these:

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

As luck would have it, all of these constraints translate to different indices. If this were not the case then we would
have a bit of an awkward situation, but as things stand it is straightforward to enforce all of these at once.

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
######## d5
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






<!--
For each of $$a_5$$ through $$b_5$$, some variation of the three-step process above suffices to enforce our constraints
and clean up the side effects. Starting with $$a_6$$, though, a more involved process is required: correcting $$a_6$$
means updating $$m_1$$, which spreads changes to $$d_1, c_1, b_1, a_2, d_2$$, requiring updates to (among others)
$$d_5$$ - - which is positioned prior to $$a_6$$ chronologically, meaning that we can't safely ignore the changes to it.
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

-->

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
