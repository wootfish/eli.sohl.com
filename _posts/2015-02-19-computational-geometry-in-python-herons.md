---
layout: post
title: 'Symbolic Computational Geometry in Python: Heron''s Formula'
mathjax: true
---

Floating point numbers suck. Sometimes they're the best we've got, but they still suck. Floating point numbers are to math as Physics 101 lab measurements  are to the laws of physics: you get basically what you expect, but the margin of error can be non-negligible. Sometimes that's okay. Sometimes it's not. But what choice do we have? I'm so glad you asked.

But before we get into that, let's convince ourselves that we have a problem to solve. Luckily, this is really easy. Suppose we want to find out, for some terribly important reason, the area of the triangle with vertices at (3,4), (7,10), and (11, 161). We don't get pen and paper -- in fact, the only tool at our disposal is a Python shell. If we know some geometry, then our naive approach might go something like this:

<br />
<script src="https://gist.github.com/wootfish/6d8a9ac708d391e7b8ca.js"></script>
<br />

This almost works, but not quite. The correct answer turns out to be 290, so we were only off in the 12th decimal place -- great in a lab, awful if we want exact answers.

Why not just round the result, you might ask? That's a great question, and, well, if we aren't aiming for mathematical perfection, that might be good enough. It's difficult (though not impossible...) for floating point errors to compound to such a degree that the margin of error exceeds $$\frac{1}{2}$$. And, of course, even if that does happen, we'd only be off by 1. Again, sometimes that is good enough, but sometimes it's not -- and regardless, it leaves a nasty taste in the mouth.

If we're willing to sacrifice a bit of speed for the sake of perfection, there is a better way. Languages like SAGE and Mathematica have at their core the idea of symbolic manipulation. When you do math in these languages, you don't construct messy floating point approximations of things like $$\pi$$ or $$\sqrt{2}$$ or $$\ln 3$$ -- rather, the language stores them _as what they are_. It has an internal concept of things like "square root", or "natural log", or any of the countless ways pi can be represented. In a Mathematica session, typing in Sqrt[2] as input will just give you back Sqrt[2] as output. The only time you'd see these quantities displayed as a number is if you specifically ask for a _numerical approximation:_ N[Sqrt[2]] would give you 1.41421356..., drawn out to as many decimal places as you might ask for.

The power of supporting symbolic manipulation is that you can construct complex expressions using lots of numbers that aren't guaranteed to be integers or even rational numbers, and you don't need to worry about whether their internal representations are accurate. You are basically guaranteed that they are. The system knows what the constructs you're giving it (multiplication, square root, etc) _are_, in an algebraic sense, and it is able to handle them with algebraic levels of accuracy.

What this means is that if you have an expression that's full of irrational numbers but turns out to simplify to an integer, you can be pretty confident that if you put it into a symbolic manipulation tool, what comes out the other end will in fact be an integer. Not an accurate-to-11-decimal-places approximation of an integer, but an actual concrete integer. Margin of error: 0.

These are powerful tools, but they can be isolated and difficult to work with. Mathematica is clobberingly expensive (although it is perhaps one of the few pieces of software in that price range that's actually worth the cost of admission), and SAGE is cool (and open source!) but very much a stand-alone specialty utility. Interfacing with it from a script would be difficult. Luckily, there is an unbelievably cool Python library called [sympy](http://www.sympy.org/en/index.html), which turns Python into a stunningly capable symbolic manipulation tool. Check this out:

<br />
<script src="https://gist.github.com/wootfish/74114158a367cfd8356b.js"></script>
<br />

Isn't that something! pprint stands for pretty-print, and it displays the entire algebraic structure represented by the variable passed to it, which in this case is A. Notice how when we substitute our values in, the answer we get out is exactly right. This is because we aren't cutting corners with intermediate floating-point approximations, like we were with the floating point example above.

One caveat: in production code, this sort of solution would be a bit slow, because evalf is not the fastest option available. It is the only option with no dependencies, which is why I use it in this demo, and it's fast enough for our purposes, but SymPy does provide faster options for use when speed is critical. If you'd like to know more about that, [this](http://docs.sympy.org/0.7.4/modules/numeric-computation.html) is a good summary.

By the way, like I said before, SciPy is completely open source (BSD-licensed!) and their code base is written with readability in mind. Check it out some time, if you're into that sort of thing -- it's really cool, and there's a _lot_ you can do with it.

<br />
FOOD FOR THOUGHT:
<br />

* Python also provides the "decimal" module, which does a good job of making floating-point math more usable. Decimal, unlike SymPy, is part of the standard Python distribution. I didn't use it here because it doesn't behave with perfect accuracy when thorny operations like sqrt come into the picture. For instance, `Decimal(2).sqrt() ** 2` evaluates to `Decimal('1.999999999999999999999999999')`. That said, there are other contexts with floating-point number madness where this module is very valuable, so it's another good one to keep in your bag of tricks.

* Are there better ways of using SymPy to handle this? Is there anything better than SymPy to use for this?
