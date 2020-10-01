---
layout: post
title: evaluating the alternating harmonic series
mathjax: true
---

Here's a fun little note I just found while organizing my desk. I came up with this proof during a class on infinite series last summer.

In that class, the professor mentioned the limit of the alternating harmonic series, then commented offhand that "this limit is true, but we cannot prove it yet." Never one to shy from a challenge, I decided to see whether he was right. By the end of class I had roughly this proof scrawled on a piece of paper. He suggested that I try to publish it, but that didn't pan out (long story). Nevertheless, it's a fun proof, and I wasn't able to find it anywhere online, so I thought I'd share it here.

First off: the alternating harmonic series is defined as


$$
\sum_{i=1}^{\infty} \frac{-1^{i-1}}{i} = 1 - \frac{1}{2} + \frac{1}{3} - \frac{1}{4} + \frac{1}{5} - \ldots
$$

which, of course, is just the harmonic series with the sign of every other term flipped.

It is well known that the harmonic series diverges. Slightly less well known is that the alternating harmonic series converges to a very clean limit. Strangely enough, this limit turns out to be $$\ln 2$$.

This fact, if it comes up, is usually proved just as a trivial consequence of the [Euler-Mascheroni constant](https://en.wikipedia.org/wiki/Euler%E2%80%93Mascheroni_constant)'s most common identity. Not only is that proof beyond the reach of many undergrads, it's also so trivial as to border on inane.

It's like using a sledgehammer to pound in a nail: of course it works, but the result would look a lot nicer if you used a hammer instead.

Consider the following series:

$$
a_n = \sum_{n+1}^{2n} \frac{1}{n}
$$

The first few terms of this sequence are,

$$
\begin{align}
a_1 &= \frac{1}{2} \\
a_2 &= \frac{1}{3} + \frac{1}{4} \\
a_3 &= \frac{1}{4} + \frac{1}{5} + \frac{1}{6} \\
a_4 &= \frac{1}{5} + \frac{1}{6} + \frac{1}{7} + \frac{1}{8}
\end{align}
$$

It turns out that the limit of this series as n goes to infinity is also $$ln 2$$, which is kind of a cool result in its own right. Proof sketch: Consider successive Riemann sums of the definite integral from 1 to 2 of 1/x.

Convinced? Great. Now then: let's do a little algebra with this sequence. Check out how nicely it telescopes down:

$$
\begin{align}
a_n - a_{n-1} &= (\frac{1}{n+1} + \ldots + \frac{1}{2n}) - (\frac{1}{n} + \ldots + \frac{1}{2n-2}) \\
&= \frac{1}{2n-1} + \frac{1}{2n} - \frac{1}{n} \\
&= \frac{1}{(2n-1)(2n)}
\end{align}
$$

This gives us the difference between subsequent terms in the sequence. We know the first term, too, so let's stick the two together:

$$
\begin{align}
a_n - a_{n-1} &= \frac{1}{(2n-1)(2n)} \\
a_n &= a_{n-1} + \frac{1}{(2n-1)(2n)} \\
a_1 &= \frac{1}{2} = \frac{1}{(2 \cdot 1 - 1)(2 \cdot 1)} \\
\therefore a_n &= \sum_{k=1}^{n} \frac{1}{(2 \cdot k - 1)(2k)}
\end{align}
$$

This is a central result in the proof. In fact, we're almost done. Let's turn our attention back to the alternating harmonic series for a second. Consider its partial sums, which we'll denote by $$S$$ subscripted with the number of terms in the sum. So, for example:

$$
\begin{align}
S_1 &= 1 \\
S_2 &= 1 - \frac{1}{2} \\
S_3 &= 1 - \frac{1}{2} + \frac{1}{3} \\
S_4 &= 1 - \frac{1}{2} + \frac{1}{3} - \frac{1}{4} \\
\end{align}
$$

Notice that as the subscript grows, the difference between subsequent terms diminishes, and in fact it (of course) goes to zero in the limit. Because of this, in order to prove the limit of this series of partial sums, it would suffice to establish the limit only for terms with either even or odd subscripts. I've got a good feeling about the even ones.

Let's start by matching even sums' terms up into pairs, like so:

$$
S_6 = (1 - \frac{1}{2}) + (\frac{1}{3} - \frac{1}{4}) + (\frac{1}{5} - \frac{1}{6})
$$

This pattern generalizes and simplifies as follows:

$$
\begin{align}
S_{2n} &= \sum_{k=1}^n (\frac{1}{2k-1} - \frac{1}{2k}) \\
&= \sum_{k=1}^n \frac{1}{(2k-1)(2k)} \\
&= a_n \\
\therefore \lim_{n \to \infty} S_{2n} &= \lim_{n \to \infty} a_n = \ln 2
\end{align}
$$

And that's it! Certain steps here could also have been established mechanically by induction, but look at this -- there really is something nice about the direct proof, isn't there?
