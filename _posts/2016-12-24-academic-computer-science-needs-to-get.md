---
layout: post
title: Academic Computer Science Needs to Get Its Shit Together
---

The fact is, our beloved field of computer science has reached an embarrassing low. Among programmers in all but some collegiate circles, calling something "academic" is oblique shorthand for calling it overwrought, obscure, inflexible, and/or too fragile to be useful in the real world. And there's a good reason for this: more often than not, the products of academia in computer science meet all those criteria.

But why? Shouldn't universities be where our best and brightest gather? Isn't the whole idea of academia to draw great minds together so they can collaborate and educate?

The short answer: Well, yes, but that idea doesn't work so well when you're competing for talent against an industry that can afford to triple your salary offers. With few exceptions, industry gets who they want and academia gets stuck with the dregs -- and you can't do much with dregs.

What's the long answer? Glad you asked. Buckle up.

Once upon a time, academia really was (I am given to understand) a heavyweight player in computer science. MIT and University of Illinois have their places in the annals of Unix history right next to Bell and GE, and in fact it was academia where Unix first really gained traction. Same with the internet -- there's this picture that's been floating around recently:

<br/>
<center><blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">Going through old papers my dad gave me, I found his map of the internet as of May 1973. <br><br>The entire internet. <a href="https://t.co/0krvYoRGav">pic.twitter.com/0krvYoRGav</a></p>&mdash; David Newbury (@workergnome) <a href="https://twitter.com/workergnome/status/807704855276122114?ref_src=twsrc%5Etfw">December 10, 2016</a></blockquote></center>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
<br/>

There's a lot that is interesting about this picture, but as far as our discussion is concerned, let's note the breakdown of who owns which nodes: there ars a few government agencies and a few companies represented, but a solid majority of the systems are academic. Universities broke a lot of ground in both developing and implementing the technologies that underlie the internet.

Of course, hardware and networking isn't everything, and there are other areas where academia had a lot to offer. For instance, it's hard to overemphasize the eminent (and [eminently quotable](https://en.wikiquote.org/wiki/Edsger_W._Dijkstra)) Edsger Dijkstra's influence on programming language design, distributed systems, or really any number of other subjects. Or take Donald Knuth, who wrote the book on computer science, then called it "volume one" and set back to work writing volumes two through five (six and seven still pending!). Or Martin Hellman, who advised Ralph Merkel's groundbreaking PhD work on public-key cryptosystems. Hellman later recruited Whitfield Diffie to his lab and together they built on that work, eventually leading to the landmark discovery of what is now called Diffie-Hellman key exchange.

This was all real ground being broken, real problems being solved, challenging work being done well -- all by academics. If these were once academia's exports, when did it become so maligned? Where did things go wrong?

Well, there's a case to be made that in spite of all the above, things might not have gone wrong so much as stayed wrong. Knuth and Dijkstra, for instance, were both outspokenly critical of their field.

Knuth said of computer science during his time as a student that "...the standard of available publications was not that high. A lot of the papers coming out were quite simply wrong." He made it clear practically in the same breath that one of his main goals with _The Art of Computer Programming_ "was to put straight a story that had been very badly told."

Dijkstra, for his part, held practically every language of his time in the highest contempt. COBOL and BASIC "cripple the mind" and leave students "mentally mutilated beyond hope of regeneration," respectively. FORTRAN he described as "the infantile disorder," while PL/I was "the fatal disease." He also had [some critical words](http://www.cs.utexas.edu/users/EWD/transcriptions/EWD04xx/EWD498.html) for those in his field who refused to acknowledge some of its more uncomfortable truths.And in an abstract moment he opined, "Write a paper promising salvation, make it a 'structured' something or a 'virtual' something, or 'abstract', 'distributed' or 'higher-order' or 'applicative' and you can almost be certain of having started a new cult." Some things, it seems, never change.

A professor of mine once commented, in one of the last meetings of his class, that the structured programming practices he'd been teaching us were important because, in his words, "my generation has already written all the easy programs. The hard ones are up to you guys." He was of course talking about software development -- the bricklaying of computer science -- but I suspect that a similar quip would apply on the theoretical side of things.

Obviously the field is still new, but by and large it really does seem to be true: The easy, useful results have been discovered. The easy, useful definitions have been made. The easy, useful algorithms have been found. Having reached this point, academics now have two choices: either we take on the stuff that's not easy, or we take on the stuff that's not useful. A quick flip through arXiv suggests that most researchers have opted for the latter option.

The sad fact is, of course, that modern academic culture does nothing to discourage this -- in fact, "publish or perish" actually _encourages_ professors to focus on cranking out useless but simple results. Meanwhile, profound guiding problems like P vs NP or even P vs PSPACE go all but untouched. The culture is such that the average academic who's fool enough to really throw themself at such a problem ends up reduced to a ["cautionary tale" in a survey paper](https://www.cs.umd.edu/%7Egasarch/papers/poll.pdf).

Make no mistake: _there are major, important unsolved problems in computer science._ Hell, there are enough that [Wikipedia's got a whole list](https://en.wikipedia.org/wiki/List_of_unsolved_problems_in_computer_science). Breakthroughs on any of these would instantly make the reputations of the researchers involved. But those with the expertise to take these issues on are, more often than not, actively discouraged from doing so. How is a field supposed to produce anything of value when this is its culture?

There's a quote I recall reading, but which I can't seem to dig up. It was from one of the leading researchers on the topic of proving program correctness, given some time before the turn of the millennium, and his observation was that while the field had advanced significantly in the years he'd spent studying it, he was slowly coming to realize that the problems they were trying to solve, nobody else was really all that concerned about.

I know of a few kernel programmers and security buffs who'd take issue with that claim, but aside from them and aside from a few other very specialized contexts it turns out that yeah, nobody really cares too much. In the same vein, very few people care about some equivalence result in complexity theory between two games they've never heard of. Same goes doubly for the underachieving grad student's favorite recourse: survey papers directed at the above.

That story is a pretty common one in theoretical computer science, and honestly it's understandable -- the field is new, and it's only fair to give it some time to get its bearings. Not every result is going to have immediate practical applications, and we'd be doing everyone a disservice if we expected otherwise. But while that might excuse some seemingly useless research, it's no excuse for the sheer mediocrity and apathy that pervade the field.

There are important results waiting to be found. It seems apt to compare modern complexity theory to ancient Greek mathematics -- perhaps, if we really want to push the analogy, even going far enough to equate Knuth with Euclid -- and if this comparison holds, then mind-boggling amounts of valuable theory have yet to be discovered. My own background leaves me tempted to bring up the influence these results could have on computer security, but really, it's hard to think of a subject they _wouldn't_ influence. In fact, there are enough connections between computer science and advanced mathematics that results found here could easily filter back and offer unexpected insights on long-standing problems in that domain as well. John Conway's work gives a number of examples of what that might look like.

Speaking of computer security: one exciting thing we learned post-Snowden that, while we've massively dropped the ball on endpoint security, we've managed to build cryptosystems that _actually work_. Modern cryptography is one of the few things our clearance-sporting buddies in Fort Meade don't seem to be able to crack. And yet we don't have solid proofs for such basic questions as: _do one-way functions really exist?_ Or, _are public-key cryptosystems really possible?_ On the more practical side, we also have a tremendous amount of work to do as far as post-quantum cryptography and cryptanalysis are concerned.

In short, there's important work to be done, and (since abstract arguments are notoriously hard to monetize) you can bet industry isn't going to do it.

If academic computer science wants to be taken seriously, it needs to get its priorities straight. It needs to stop discouraging work on problems that matter, stop encouraging work on problems that don't, and make an honest effort to match the landmark achievements of previous decades. There's still plenty of room in the history books.
