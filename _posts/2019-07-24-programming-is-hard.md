---
layout: post
title: Programming is Hard, That's Why You Shouldn't
---


It has been suggested that the number of bug-containing lines in a codebase is [largely just a function of total lines](https://softwareengineering.stackexchange.com/a/185684). That is, it depends more on a program's size than anything else. Large codebases will have bugs, no matter what language they're in or how they're designed.

As bugs are fixed and regression tests are added to keep them fixed, the complexity of the codebase grows, as does the amount of time needed to write and maintain it. It is practically impossible to write and maintain a large codebase without a large test suite. It has even been claimed, as an extension of this idea, that untested code is broken by definition.

An increasingly clear trend in open-source software: while the experiment of asking people to write valuable software for free has worked surprisingly well, the experiment of asking those same people to make long-term commitments to project maintenance has seen more mixed results. It is not uncommon for developers to end up feeling like they've been vested with more responsibility than they thought they were signing up for, and to abandon or even [unpublish](https://blog.npmjs.org/post/141577284765/kik-left-pad-and-npm#_=_) their work in response.

We can't blame anyone for making this decision, of course: they're just opting to stop providing the rest of us with free labor, which is well within their rights. That said, it's nicer for everyone when this situation can be avoided.

How? By only publishing code that is easy to maintain and that is designed to (hopefully) need as little maintenance as possible.

Statistically, this means keeping your programs as short as possible.

For programs containing complex logic, this means offloading as much of their complexity as possible to high-quality third-party libraries (which will come with their own test suites to ensure the work you're offloading to them is carried out correctly).

This means resisting the urge to roll your own parsers, your own protocol clients, your own ORMs, your own bignum arithmetic libraries, or whatever else you're considering building from scratch when perfectly good off-the-shelf solutions already exist. This means resisting the urge to write your program in some esoteric language that no one knows and that even you will get bored of in a month or two and forget the finer points of.

There is a culture among certain developers of seeking out "trials of strength" and using them to demonstrate personal aptitude and measure the aptitude of others. There seems to be some sort of idea that this is "real" programming, probably because it is hard in different and more abstract ways than normal programming. Maybe there was a time when this attitude made sense, decades ago, but in 2019 it comes off -- at least to me -- as both uncomfortably performative and uncomfortably dated.

It's like digital survivalism: just as certain people take a bizarre pride in the knowledge that, if dropped into a tropical rainforest with no supplies, they could find food and water, build shelter, navigate, and so on, there are developers who desperately want us all to know that if they were dropped into a world without pre-built, pre-audited, pre-fuzz-tested, pre-test-suited ASN.1 parsers, they would happily be able to write one from scratch.

I want these people to know that no one wants them to do this.

By all means, learn how these things work. That will make you a better coder. If writing a toy implementation helps you learn, then go for it. If you want to publish these toys as examples of your work, I suppose no one can stop you. But please make it clear up front whether you plan on supporting these things long-term when they (inevitably) turn out to be buggy and need support. If you don't plan on providing support and you don't communicate this, then you're putting yourself in a situation where the _best-case_ scenario is that no one uses what you've made.

If anyone will be relying on your code, you are obligated to make that code as robust as possible. In almost all cases, this means picking robust components and plugging them together in simple, terse, easily validated ways. Anything more than that is overkill.

In other words: [programming is hard, that's why you shouldn't](https://twitter.com/HeadlineSmasher/status/544253141823533056).
