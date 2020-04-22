---
layout: post
title: Wang's Attack in Practice
mathjax: true
---


[Last time, we discussed Wang's attack in theory]({% post_url 2020-04-20-wangs-attack-1 %}).
Now let's work through the implementation. This is tricky, but with a little
finesse we can get it looking pretty good. The end result will be a script that
continuously generates MD4 collisions at a rate of several per minute.

We'll be working in Python, because life's too short to waste time writing hard
code like this in any less helpful language.

The theory behind the attack was covered in [Wang's Attack in Theory]({% post_url 2020-04-20-wangs-attack-1 %}).
That post covers the "what" and "why" of Wang's attack; this post covers the "how".


# MD4

[Here is a full implementation of MD4 in Python](https://github.com/wootfish/cryptopals/blob/master/challenge_30.py).

To review, here is how we define the boolean functions `F, G, H` and the round
functions `r1, r2, r3`:

```python
def F(x: int, y: int, z: int) -> int: return (x & y) | ((x ^ 0xFFFFFFFF) & z)
def G(x: int, y: int, z: int) -> int: return (x & y) | (x & z) | (y & z)
def H(x: int, y: int, z: int) -> int: return x ^ y ^ z

MODULUS = 1 << 32

def r1(a: int, b: int, c: int, d: int, k: int, s: int, X: Sequence[int]) -> int:
    val = (a + F(b, c, d) + X[k]) % MODULUS
    return leftrotate(val, s)

def r2(a: int, b: int, c: int, d: int, k: int, s: int, X: Sequence[int]) -> int:
    val = (a + G(b, c, d) + X[k] + 0x5A827999) % MODULUS
    return leftrotate(val, s)

def r3(a: int, b: int, c: int, d: int, k: int, s: int, X: Sequence[int]) -> int:
    val = (a + H(b, c, d) + X[k] + 0x6ED9EBA1) % MODULUS
    return leftrotate(val, s)
```

In the round functions' arguments, `X` is a list of integers representing 32-bit
message words $$m_{0}, ..., m_{15}$$ in order. I'm calling it `X` rather than
`M` to avoid any implied association with any fixed message value, because `X`'s
contents will change over the course of the message massage.

One thing that might seem odd to the seasoned reader: rather than simply passing
message words `X[k]` into our round functions we are passing in both `X` and `k`
separately. This might seem unnecessary - and strictly speaking, it is - but
having a reference to `X` inside the round function enables a cool trick in our
round 1 massage, as you will see momentarily.

Continuing our review, here's how MD4 computes all three rounds for each message
block:

```python
# round 1
a = r1(a,b,c,d, 0,3,X); d = r1(d,a,b,c, 1,7,X); c = r1(c,d,a,b, 2,11,X); b = r1(b,c,d,a, 3,19,X)
a = r1(a,b,c,d, 4,3,X); d = r1(d,a,b,c, 5,7,X); c = r1(c,d,a,b, 6,11,X); b = r1(b,c,d,a, 7,19,X)
a = r1(a,b,c,d, 8,3,X); d = r1(d,a,b,c, 9,7,X); c = r1(c,d,a,b,10,11,X); b = r1(b,c,d,a,11,19,X)
a = r1(a,b,c,d,12,3,X); d = r1(d,a,b,c,13,7,X); c = r1(c,d,a,b,14,11,X); b = r1(b,c,d,a,15,19,X)

# round 2
a = r2(a,b,c,d,0,3,X); d = r2(d,a,b,c,4,5,X); c = r2(c,d,a,b, 8,9,X); b = r2(b,c,d,a,12,13,X)
a = r2(a,b,c,d,1,3,X); d = r2(d,a,b,c,5,5,X); c = r2(c,d,a,b, 9,9,X); b = r2(b,c,d,a,13,13,X)
a = r2(a,b,c,d,2,3,X); d = r2(d,a,b,c,6,5,X); c = r2(c,d,a,b,10,9,X); b = r2(b,c,d,a,14,13,X)
a = r2(a,b,c,d,3,3,X); d = r2(d,a,b,c,7,5,X); c = r2(c,d,a,b,11,9,X); b = r2(b,c,d,a,15,13,X)

# round 3
a = r3(a,b,c,d,0,3,X); d = r3(d,a,b,c, 8,9,X); c = r3(c,d,a,b,4,11,X); b = r3(b,c,d,a,12,15,X)
a = r3(a,b,c,d,2,3,X); d = r3(d,a,b,c,10,9,X); c = r3(c,d,a,b,6,11,X); b = r3(b,c,d,a,14,15,X)
a = r3(a,b,c,d,1,3,X); d = r3(d,a,b,c, 9,9,X); c = r3(c,d,a,b,5,11,X); b = r3(b,c,d,a,13,15,X)
a = r3(a,b,c,d,3,3,X); d = r3(d,a,b,c,11,9,X); c = r3(c,d,a,b,7,11,X); b = r3(b,c,d,a,15,15,X)
```

This may look pretty arbitrary. That’s fine; I’m not going to try to convince
you that it isn’t. We don’t need to concern ourselves here with the motivations
behind this design. The main reason I included this code is because it shows the
message block and leftrotate amount used in computing each intermediate state.
We'll need to know these values in order to perform our massage.

# Defining Constraints

The core of Wang's attack is a large list of constraints on the hash function's
intermediate states. Nearly all the attack's constraints fall into one of three
types: _zero constraints_, _one constraints_, and _equality constraints_. This
taxonomy suffices for all the constraints we will be implementing.

For reference, here's the table of constraints:

{%
include blog-image.md
image="/assets/img/wang/wang-table-6.png"
description="Table 6: A Set of Sufficient Conditions for Collisions of MD4"
%}

If these constraints are the core of the attack, then they seem like a
reasonable starting point to build our program out around.

As a rough draft, we could represent zero constraints with a class like this:

```python
class ZeroConstraint:
    def __init__(self, ind: int):
        self.ind = ind

    def check(self, word: int):
        return word & (1 << self.ind) == 0

    def massage(self, word: int):
        mask = (1 << self.ind) ^ 0xFFFFFFFF
        return word & mask
```

This is simple enough, and you can write similar classes for each other type of
constraint.

Already, though, we have some improvements to make. First, we can get a small
performance boost by precomputing the masks used in `check()` and `massage()`:

```python
class ZeroConstraint:
    def __init__(self, ind: int):
        self.ind = ind
        self.mask = 1 << ind
        self.mask_inv = self.mask ^ 0xFFFFFFFF

    def check(self, word: int):
        return word & self.mask == 0

    def massage(self, word: int):
        return word & self.mask_inv
```

Also: when a state is subject to multiple constraints of the same type (e.g.
zero constraints on several indices), we might as well enforce those constraints
simultaneously. Let's add support for passing a list of indices to `__init__`.

And while we're at it, we'll want our other constraint types to support the same
pattern, so let's pull that logic out into a superclass and subclass it:

```python
class Constraint:
    def __init__(self, *inds):
        self.inds = inds
        self.mask = 0
        for ind in inds:
            self.mask |= (1 << ind)
        self.mask_inv = self.mask ^ 0xFFFFFFFF


class Zeros(Constraint):
    def check(self, word_1: int, word_2=None):
        return word_1 & self.mask == 0

    def massage(self, word_1: int, word_2=None):
        return word_1 & self.mask_inv


class Ones(Constraint):
    def check(self, word_1: int, word_2=None):
        return word_1 & self.mask == self.mask

    def massage(self, word_1, word_2=None):
        return word_1 | self.mask


class Eqs(Constraint):
    def check(self, word_1, word_2):
        return (word_1 & self.mask) == (word_2 & self.mask)

    def massage(self, word_1, word_2):
        return (word_1 & self.mask_inv) | (word_2 & self.mask)
```

You'll note that `Eqs.check()` and `Eqs.massage()` accept two arguments, because
these constraints involve two states. For `Eqs.massage()`, the first state
argument is the one that gets massaged.

I've added optional, unused extra arguments to the `check()` and `massage()`
methods for `Zeros` and `Ones` as well, to keep the method signatures
consistent. This might look a little silly, and it's not strictly necessary, but
it allows us to massage constraints of all three types in the same loop without
having to keep track of which constraint type we're dealing with on any given
iteration.

Let's take a quick moment to unpack the bitwise logic in use in these classes.

* `mask` is an int with 1 bits wherever we have `ind`s and 0 bits everywhere else.
  For example, if `inds = [0, 3, 6, 31]`, then `mask = 0b10000000000000000000000001001001`.

* `mask_inv` is the inversion of `mask`: it has 0s where `mask` has 1s and it
  has 1s where `mask` has 0s. So if `inds = [0, 3, 6]`, then `mask_inv = 0b01111111111111111111111110110110`.

* `Zeros.check()` computes `word & mask` and relies on the fact that this value
  will be 0 if and only if `word` is 0 at all bits set in `mask`.

* `Zeros.massage()` uses `word & mask_inv` to ensure that all bits set in `mask`
  are zeroed and all other bits are left unchanged.

* `Ones.check()` tests whether `word & mask == mask`; this test is True if and
  only if `word` is 1 wherever `mask` is 1.

* `Ones.massage()` simply returns `word | mask`, ensuring all bits set in `mask`
  are set in the returned value.

* `Eqs.check()` derives versions of `word_1` and `word_2` with all irrelevant
  bits zeroed by computing `word_1 & mask` and `word_2 & mask`, then checks
  whether these new words are equal.

* `Eqs.massage()` massages `word_1` by first zeroing all relevant bits with
  `word & mask_inv`, then setting those bits to 1 if and only if they are set to
  1 in `word_2`. The full expression is `(word_1 & mask_inv) | (word_2 & mask)`.

Now that we've defined and discussed these classes, let's express the attack's
round-one constraints in terms of them:

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

This lists out the constraints, one row per state, starting with $$a_{1,7} =
b_{0,7}$$ and ending with $$b_{4,19} = b_{4,30} = 0$$ and $$b_{4,26} = b_{4,27}
= b_{4,29} = 1$$.

Note that we are 0-indexing our bit indices in all of these constraints, in
direct defiance of the paper's 1-indexed notation. This makes for a bit of a
hassle when transcribing indices from the paper to our code, but it makes our
code itself much cleaner.[^1]

[^1]: The alternatives would be to either: (1) Use 1-indexed notation throughout our entire script (no thank you), or (2) make a semantic distinction in our code between constants that come from the paper and constants that come from anywhere else, and treat constants as 0-indexed or 1-indexed based on their origin (again, no thank you).

Note that none of these `Eqs` constraints specify _which_ two states they apply
to; there's no need for them to, since all of them apply to a state and its
immediate prior (e.g., in the case of the first row, the constraint is between
$$a_1$$ and $$b_0$$, and for the second row the constraints involve $$d_1$$ and
$$a_1$$).

This list has 94 constraints. A round-one massage which enforces each constraint
individually would have to make 94 calls to `massage()`; by consolidating
constraints, we've reduced this to 41 `Constraint` instances and thus 41 calls
to `massage()`. This is roughly a 2.3x improvement in the massage's efficiency.


# Massaging Constraints: Round 1

Let's write a function to take an input message (as bytes) and massage it.

First, we'll need to break the message up into a list of ints sized to 32 bits
apiece. We'll also want to initialize our state variables and keep a log of all
intermediate states.

```python
def massage(message, quiet=True):
    X = [struct.unpack("<I", word)[0] for word in bytes_to_chunks(message, 4)]
    a, b, c, d = 0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476
    state_log = [a, d, c, b]
```

(note: this makes use of a helper function, `bytes_to_chunks`, which is defined [here](TODO))

Recall that massaging constraints consists of two steps: first, finding a
modified value for the state variable itself; second, modifying the
corresponding message block to ensure that `r1` returns the state variable's new
desired value.

Since the message is stored in a mutable array, we can wrap our round function
with a helper which derives and performs the necessary message modifications in
place:

```python
    def f(a, b, c, d, k, s, X):
        # serves as normal round function, but also adjusts X as it goes
        a_new = r1(a, b, c, d, k, s, X)
        for suite in round_1[k]:
            a_new = suite.massage(a_new, b)
        X[k] = (rrot(a_new, s) - a - F(b, c, d)) % MODULUS
        state_log.append(a_new)
        return a_new
```

The math behind the derivation of `X[k]`'s value was covered in [my previous post on Wang's attack]({% post_url 2020-04-20-wangs-attack-1 %}).

Note that this function takes advantage of the fact that all three constraints'
`massage()` methods accept two arguments even if only one argument is needed.
This allows it to avoid having to do any type inspection to determine constraint
suites' method signatures, which is good for performance.

Now that we have this function, we can apply a full round-one message massage by
simply copying the round-one MD4 code block from above and swapping out `r1` for
`f`:

```python
    a = f(a,b,c,d,0x0,3,X); d = f(d,a,b,c,0x1,7,X); c = f(c,d,a,b,0x2,11,X); b = f(b,c,d,a,0x3,19,X)
    a = f(a,b,c,d,0x4,3,X); d = f(d,a,b,c,0x5,7,X); c = f(c,d,a,b,0x6,11,X); b = f(b,c,d,a,0x7,19,X)
    a = f(a,b,c,d,0x8,3,X); d = f(d,a,b,c,0x9,7,X); c = f(c,d,a,b,0xA,11,X); b = f(b,c,d,a,0xB,19,X)
    a = f(a,b,c,d,0xC,3,X); d = f(d,a,b,c,0xD,7,X); c = f(c,d,a,b,0xE,11,X); b = f(b,c,d,a,0xF,19,X)
```

Since `f` modifies the message word list `X` in place, we just have to execute
this block and by the end of it our round-one massage will be complete.

Once we're satisfied with our massage, we pack the message back up into bytes
and return it:

```python
    return b''.join(struct.pack("<I", word) for word in X)
```

That's right - that really is all it takes.

# Applying the Message Differential

The massage function we just wrote takes arbitrary length-64 bytestrings and
returns promising candidate messages `M`. To check whether `M` is part of a
collision, we have to be able to compute `M'`, aka `M + D`.

The differential modifies three message words: the first, the second, and the
12th. We can encode these words' indices and their internal differentials like
so:

```python
DIFFERENTIALS = ((1, 1 << 31),
                 (2, (1 << 31) - (1 << 28)),
                 (12, -(1 << 16)))
```

Then applying this differential becomes as simple as this:

```python
def apply_differential(m):
    words = bytes_to_chunks(m, 4)
    for i, delta in DIFFERENTIALS:
        m_i = (struct.unpack("<I", words[i])[0] + delta) % MODULUS
        words[i] = struct.pack("<I", m_i)
    m_prime = b''.join(words)
    return m_prime
```

# Finding Collisions

Now we know how to derive `M'` from `M`. The next step is to generate `M` values
in a loop, checking for each one to see whether `M` and `M'` collide. We can
encapsulate this search in a generator function like so:

```python
def find_collisions():
    for i in count():
        # occasionally print something so the user knows we're still running
        if i & 0xFFFF == 0:
            print(end=".", flush=True)

        # massage some random bytes. if we get a collision then yield (m1, m2)
        orig = random.getrandbits(512).to_bytes(64, 'big')
        m1 = massage(orig)
        m2 = apply_differential(m1)

        if md4(m1) == md4(m2):
            yield m1, m2  # we've got a hit!
```

Pro-tip: After trying a bunch of different options, I'm pretty sure that
`random.getrandbits(512).to_bytes(64, 'big')` is just about the fastest way to
get a 64-byte[^2] pseudorandom[^3] bytestring in Python.

[^2]: Or any other length, not just 64 bytes, naturally. For n bytes, precompute `8*n` and use `random.getrandbits(8*n).to_bytes(n, 'big')`. My performance tests did not indicate any significant difference between using 'big' or 'little' here, but YMMV.

[^3]: Not cryptographically secure - but in this case it doesn't have to be!

Then, all we have to do is run this function and print what it yields.

```python
if __name__ == "__main__":
    print("Searching for collisions...")
    print(datetime.now())
    print()

    for m1, m2 in find_collisions(report_trial_rate=True):
        print()
        print(datetime.now())
        print("Collision found!!")
        print(f"md4(bytes.fromhex('{m1.hex()}')) == {md4(m1)}")
        print(f"md4(bytes.fromhex('{m2.hex()}')) == {md4(m2)}")
        print()
```

You can speed up `find_collisions()` by using a crypto library's binding for
`md4` (e.g. `pycrypto`'s `Crypto.Hash.MD4`). This will likely run much faster
than any Python-native implementation, which is important since our hot loop
runs `md4` twice per iteration.

Using this algorithm for a full round-1 massage, I measured a per-trial success
probability of appx $$2^{-25}$$. With just these constraints my implementation
was finding about one collision per day. At that rate the attack is actually
practical, so this is a good time to test your attack code.

# Massaging Constraints: Round 2

Let's talk about how we get from one collision per day to several per minute.

Unfortunately, this will end up being a little less terse than round one. Two
reasons: the constraints more more varied, and (unlike in round one) we have to
worry about cleaning up any side effects we cause.

We're going to lean on our state log heavily while cleaning up side effects. As
described in the last post, we're going to have to end up changing words 0
through 4 of the message in order to avoid perturbing our round-one states.

Let's write a helper function for inverting `r1` to find the message word that
produces a given state. We'll feed it with the index of the word in the message,
plus the `leftrotate` shift amount for the given step. It can get everything
else that it needs to know from the state log:

```python
    def r1_inv(k, rot):
        # returns a message value tailored to produce the expected intermediate state
        return (rrot(state_log[k+4], rot) - state_log[k] - F(state_log[k+3], state_log[k+2], state_log[k+1])) % MODULUS
```

This helper will allow us to contain the side effects of our changes to any
message word. Now, let's take a look at how we massage some specific states.

## $$a_5$$

Here's the full massage step for the first state in round two:

```python
    ######## a5
    a_4 = a
    a = r2(a,b,c,d,0,3,X)
    for suite in round_2[0]:
        a = suite.massage(a, c)
    X[0] = (rrot(a, 3) - a_4 - G(b, c, d) - ROUND_2_CONST) % MODULUS
    state_log[4] = r1(state_log[0], state_log[3], state_log[2], state_log[1], 0, 3, X)  # adjust a_1
    X[1] = r1_inv(1, 7);
    X[2] = r1_inv(2, 11);
    X[3] = r1_inv(3, 19);
    X[4] = r1_inv(4, 3)
```

As noted in the last post, our constraints on $$a_1$$ and $$a_5$$ seem to tend
not to interfere with each other. As a result, we can just compute a new value
for $$a_1$$ and hold the next four intermediate states constant.


## $$d_5$$

You'll recall from the last post that our methodology for massaging `d5` was
somewhat more involved than $$a_5$$. The idea is to enforce all our constraints
on $$m_4$$ directly. I'm going to skip over the discussion here, since this is
just a faithful implementation of the methodology described in the last post:

```python
    ######## d5
    N_1 = (state_log[4] + F(state_log[7], state_log[6], state_log[5])) % MODULUS
    N_2 = (d + G(a, b, c) + ROUND_2_CONST) % MODULUS
    m_4 = 0
    b_rot = rrot(b, 5)

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

    X[4] = m_4
    d = r2(d, a, b, c, 4, 5, X)

    # re-massage a_2 and make sure d_2's equality constraints with a2 still hold
    state_log[8] = r1(state_log[4], state_log[7], state_log[6], state_log[5], 4, 3, X)
    state_log[9] = round_1[5][2].massage(state_log[9], state_log[8])

    # contain the effects of these changes to a_2 and d_2
    X[5] = (rrot(state_log[9], 7) - state_log[5] - F(state_log[8], state_log[7], state_log[6])) % MODULUS
    X[6] = r1_inv(6, 11)
    X[7] = r1_inv(7, 19)
    X[8] = r1_inv(8, 3)
    X[9] = r1_inv(9, 7)
```

# $$a_6$$

$$a_6$$ is another state whose constraints can sometimes interfere with our
round-one constraints. The failure rate is low but nonzero. My (somewhat lazy)
solution is to just regenerate the block from scratch whenever a failure is
detected.

I've experimentally determined that the round 2 massage has a better chance of
leaving us with both sets of conditions satisfied than the round-one massage
does, so that's the massage we'll use. The code to massage $$a_6$$ looks like
this:


```python
    ######## c5 and b5 (just skip over these two)
    c = r2(c,d,a,b,8,9,X)
    b = r2(b,c,d,a,12,13,X)

    ######## a6
    a_5 = a
    a = r2(a,b,c,d,1,3,X)
    a = round_2[4][0].massage(a, b)
    X[1] = (rrot(a, 3) - a_5 - G(b, c, d) - ROUND_2_CONST) % MODULUS
    state_log[5] = r1(state_log[1], state_log[4], state_log[3], state_log[2], 1, 7, X)

    # could probably get rid of this while loop w/ enough careful analysis
    while (not round_1[1][0].check(state_log[5], None)
           or not round_1[1][1].check(state_log[5], state_log[4])
           or not round_1[2][2].check(state_log[6], state_log[5])):
        X[1] = random.getrandbits(32)
        a = r2(a_5,b,c,d,1,3,X)
        a = round_2[4][0].massage(a, b)
        X[1] = (rrot(a, 3) - a_5 - G(b,c,d) - ROUND_2_CONST) % MODULUS
        state_log[5] = r1(state_log[1], state_log[4], state_log[3], state_log[2], 1, 7, X)

    X[2] = r1_inv(2, 11)
    X[3] = r1_inv(3, 19)
    X[4] = r1_inv(4, 3)
    X[5] = r1_inv(5, 7)
```

This loop is only entered about 0.75% of the time, or about once every 133
trials. When entered, it exits after about 17 iterations on average.

I suspect it would be possible to improve this by applying a similar method as
with $$a_6$$. If successful, this would let us drop the constraint checks and
the `while` loop, which would improve the script's overall hash rate. Maybe
someday I'll try that. Or maybe you will :-)

This is enough of a massage to generate a few collisions per minute. 

Past this point, side effects get _really_ tricky to manage, so we'll stop here.

# Conclusion

If your implementation works, you should be able to discover collisions pretty
quickly. If you have a practical need for MD4 collisions, I'm not going to ask
what you do for a living but I am going to suggest you look at some more recent
research on the subject, e.g. Yu Sasaki et al., 2007 ([PDF link](https://www.iacr.org/archive/fse2007/45930331/45930331.pdf)).

Note that although later attacks introduced different message differentials and
different sets of conditions from Wang's attack, the basic concepts behind how
to _implement_ the attack are relatively unchanged. The core ideas in this blog
post can be applied to more recent differential attacks on MD4 and related
functions more or less directly.

If you're curious what it looks like when all the code from this example is put
together, my take on Wang's attack can be found [here](https://github.com/wootfish/cryptopals/blob/master/challenge_55.py).

I'm measuring a success probability of about $$2^{-17.3}$$ using the techniques
described in this post. With my Python implementation running in a Qubes VM on a
ThinkPad T420s, I see a rate of about three collisions per minute.

And frankly, after how much work this attack took, three collisions per minute
is fast enough for me.

<hr>
