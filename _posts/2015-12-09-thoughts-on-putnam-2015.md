---
layout: post
title: Thoughts on some 2015 Putnam Exam Problems
mathjax: true
---

Now that a few days have gone by, I thought I'd write a few notes on things I found interesting when I took this year's Putnam exam.

This year's problems seemed pretty different from last year's. That year, I had trouble making use of all my time; this year, I found myself working into the last five minutes in each session. The A section felt very approachable in particular; B was certainly more arcane, but still didn't feel prohibitively so. There were interesting problems to talk about on both sides.

A PDF with this year's problems can be found attached to the first post here: [link]((http://artofproblemsolving.com/community/c7t441f7h1171018_putnam_2015_general_discussion))

# A1, B1

Like last year's A1, these were straightforward problems whose main barrier to solution was that they required some nontrivial background knowledge. Not particularly interesting or exceptional.

For A1, this comes down to the fact that there's a simple geometric property which uniquely defines the point P. This in turn allows simple algebraic expressions for the two small areas under the chords AP and PB, and once you have those it's just a matter of integral-crunching to prove their equality.

For B1, it's a question of how much you know about the relevant facts in analysis. I didn't take the time to work out a full solution; the curious can find a good discussion [here](http://artofproblemsolving.com/community/c7t441f7h1171033_putnam_2015_b1). The idea of letting $$g(x) = f(x)h(x)$$, then working out the first three derivatives and looking for interesting properties, seems to bear fruit. It is useful to remember that if $$h$$ has no zeroes, then $$g$$'s zeroes are exactly $$f$$'s zeroes.

# A2

This was a fun one. The sequence is easy to work out by hand; it's also easy to work out a closed form for arbitrary terms. Doing either of these things can lead to the solution, if they are paired with the right ideas. The important first impression in either case is that since we're talking about odd prime factors, we should be on the lookout for properties concerning divisibility and prime factorization.

The straightforward way to find the closed form is by noting that the sequence can be modeled in terms of vectors and matrices.

$$
v_n =
\begin{bmatrix}
0 & 1 \\
-1 & 4
\end{bmatrix}
^n
\begin{bmatrix}
1 \\ 2
\end{bmatrix}
$$

This form allows one to obtain vectors containing consecutive elements of the sequence. It's possible to get the closed form of the sequence by solving for the matrix's eigenvectors and rewriting the starting vector as a linear combination of them. This makes it easy to get rid of the matrix. The closed form allows us to figure out some properties about certain elements of the sequence dividing others, and that gets us well on our way.

Working the sequence out by hand also can be surprisingly useful. In fact, the first thing I did was work out the first eight terms or so by hand and find the prime factorization of each one. This helped a lot as far as informing the rest of my strategy.

Note that a simple pigeonhole argument shows that the sequence is eventually periodic under any modulus. This means that if we work out the sequence mod $$p$$ until we've found where its periodicity starts and how long the period is, then we can predict all indices $$n$$ such that $$p \vert a_n$$.

That strategy, while guaranteed to _eventually_ work, would kind of take a while. The astute problem-solver can probably expect that no small primes bear fruit under this approach -- that would be too easy!

So, while we could work out all the sequences up to, say, $$p=17$$, and cross our fingers that one of them turns out to have a zero at index 2015, there's probably a better use for that time. If we're committed to this strategy, though, then what other primes can we use? Well, $$a_5 = 2 \cdot 181$$, which is a pretty big prime that shows up in a pretty weird place -- that might be worth checking out, right?

Right, indeed. If you do the arithmetic right, you find that 181 turns out to divide $$a_2015$$. Sometimes it pays to trust your intuition!

As an aside, there exists an interesting sort of symmetry between the zero terms of the sequence. Here, for example, is the start of the the sequence mod 181:


1, 2, 7, 26, 97, 0, 84, 155, 174, 179, 180, 179, 174, 155, 84, 0, 97, 26, 7, 2, 1, 2, 7, 26, 97, 0, 84, 155, 174, 179, 180, 179, 174, 155, 84, 0, ...


See the symmetry? Where's that coming from?


# A3

Still kicking myself for this one. The insufficiently careful might think, as I did through the haze of 10-minutes-left-in-the-session adrenaline, that the exponent can be rewritten as, $$e^{2 \pi i a b / 2015} = (e^{2 \pi i})^{ab/2015} = 1^{ab/2015} = 1$$, which _sure would make things a whole bunch easier_!

Sadly, the last step of this simplification fails to account for complex roots of unity -- something which, a few minutes into the break, I was absolutely kicking myself for. Even in the moment, it felt too easy. The actual solution methods turn out not to actually be that difficult -- more on that from the usual scary-smart folks [here](http://artofproblemsolving.com/community/c7t441f7h1171025_putnam_2015_a3).

# B2

This problem was _so cool._ Seriously. If you haven't tried it yet, you probably should. The patterns are really interesting and formulating rigorous arguments around them is a surprisingly tricky exercise. I don't want to say too much, because I don't want to spoil the fun of it -- the comments below will start out general and get gradually more specific. One word of warning: be cautious of conjectures concerning periodicity until you see a good proof for them.

It's possible to prove constraints on the least significant digits of terms in the sequence, and it's possible to put some useful constraints on their density. Once you have those tools, it's a short jump to finding large sums guaranteed to be in the sequence. If you find general forms for these sums, you can set them equal to 2015 mod 10,000. Then, if you know the extended Euclidean algorithm, you can invert any multiplications in these expressions and end up with some very strong hints about conditions sum terms would have to satisfy, if they exist at all.

Carefully following this line of thought, I was able to show that $$4668+4669+4670$$ is in the sequence, which in turn implies that $$14004+14005+14006$$ is. This is all we need, since $$14004+14005+14006 = 42015$$ <span style="font-size: xx-small;">blaze it</span>

I found it really helpful, in formulating these steps, to write out the first 60 positive integers in a 10x6 grid and work out the start of the sequence on this grid, crossing out summands and circling sums, doing my best to place sums > 60 roughly where they would appear if the grid extended far enough to include them.

# B3

Interesting problem. It can be done through casework if you have the linear algebra chops. There turn out to be two main categories of matrices satisfying the condition. I definitely would've worked on this one if I'd had more time, but making sure my B2 argument was rigorous took way too long. Lesson learned: practicing formally writing up unusual arguments is a productive use of one's time, even if you think that's something you're already good at.

# B4

There is a technique known as Ravi substitution which I had never heard of before reading about this problem, but which turns out to be well-known at the higher levels of competitive problem solving. It allows one to simplify the sides-of-a-triangle constraint. As far as I can tell, there seem to be two different forms of Ravi substitution: one for when the sides are reals, and one for when they are integers.

If the sides a, b, c are reals, it turns out that the sides-of-a-triangle condition is equivalent to specifying that there exist some positive reals x, y, z, such that a = x + y, b = x + z, and c = y + z.

If the sides a, b, c are integers (as in this problem) then that substitution is not possible, but several others are. For instance, we can define y, y, z as x = a + b - c, y = a + c - b, z = b + c - a. We can use the triangle inequality to trivially prove that x, y, z are all positive, and some mucking about with parity lets us set up a nice bijective property between triples a, b, c, and triples x, y, z. Once we have that, we can make substitutions and crunch out algebra. [BIGTRO](http://artofproblemsolving.com/community/c7t441f7h1171039_putnam_2015_b4)'s comment in this thread works this line of thought out to the end; I wish I'd had the time to try and find all this.

# B6

This is a really interesting problem, but I think that whoever came up with it may have been criminally insane. That's all I have to say here.
