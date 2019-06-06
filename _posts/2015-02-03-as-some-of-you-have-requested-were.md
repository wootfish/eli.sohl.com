---
layout: post
title: Cracking General Substitution Ciphers
---

As some of you have requested, today we'll be talking about paper-and-pencil cryptography and how we can use computers to poke it full of holes!

We're going to start with some background on basic (pre-digital) cryptography. Then, we're going to describe the specific cipher we're attacking here, along with some standard paper-and-pencil approaches to cracking it. Thirdly, we'll discuss one algorithmic approach powered by a dictionary file. Then, we'll look at some Python scripts implementing the discussed ideas. Two different scripts will be provided: A bare-bones one written to be simple to understand, and a batteries-included fancy one which elegantly implements the main logic using coroutines.


<br/>
<div class="separator" style="clear: both; text-align: center;">
<a href="{{site.baseurl}}/assets/img/2015-02-03.png">
<img src="{{site.baseurl}}/assets/img/2015-02-03.png" class="img-fluid mx-auto d-block"/>
</a>
By the end of this post, we'll know what this script is doing and why it works.</div>
<br/>


So -- first -- background! A substitution cipher is just what it sounds like: a cipher in which plaintext is turned into ciphertext by substituting, for each letter, a predetermined and different letter. A famous special case here is the Caesar cipher, where each letter is replaced by a letter three places after it:

    Plaintext:  a b c d e f g h i j k l m n o p q r s t u v w x y z
    Ciphertext: x y z a b c d e f g h i j k l m n o p q r s t u v w

An aside: Traditionally, the uppercase letters are used for both ciphertext and plaintext. This has, to me, always had the effect of making the messages look like whoever wrote them was in a really bad mood. My convention both here and in my programs is to use all lowercase instead.

Anyhow! Using the Caesar cipher, a message reading (for example) "gaul is subdued" would, when 'encrypted', read "dxri fp pryarba". Julius Caesar is said to have used this scheme to protect secret messages for his generals. Security was provided both by the cipher and the fact that his adversaries were mostly illiterate. More recently, a prominent Mafia boss, Bernardo Provenzano, used a slightly modified version of the Caesar cipher for similar communications.

History has no record of how well the cipher worked for Caesar, but Provenzano's use of it is known to have contributed to his 2006 arrest. Caesar ciphers are weak, and using one is a bad idea. There are only 25 options for how to shift the alphabet, and so it's trivial for an attacker to just try each shift and see if any of them work.

The Caesar cipher is too weak to be of any use, but it's nice as an illustration of the substitution concept. In general substitution ciphers, each letter is replaced by another letter. Unlike in the Caesar cipher, though, the replacement letters in a general substitution cipher are not necessarily in alphabetical order. One example could be:

    Plaintext:  a b c d e f g h i j k l m n o p q r s t u v w x y z
    Ciphertext: y a g f t b r i l m o k s u v h e p n w j c q x d z

Conventional wisdom holds that it is unwise to have any letter correspond to itself, as x and z do in this scheme. However, this is a minor issue here, especially since both are uncommon letters. What is actually unwise is the use of a substitution cipher at all, as we are about to see :)

Ask yourself: If you intercepted a message that you knew used a general substitution cipher, how would you try to crack it? Traditionally, people have approached the problem with a tool known as frequency analysis -- looking at how often various letters appear, guessing that the most common ciphertext letters correspond to common English (or, of course, whatever other language the writer might be using) letters like E and T, filling these in, and then trying to fill in the blanks by guesswork.

Another common technique involves what is called bigram analysis. The technique is very similar, but instead of looking for common letters, we look for common pairs of letters. It is known that certain pairs of letters, such as for example 'th', 'in', 'er', and 'nd', are very common. These pairs will show up in plain English much more often than pairs such as e.g. 'wt' or 'nz'. Counting ciphertext bigrams and conjecturing correspondences to common English bigrams can be productive in conjunction with basic frequency analysis. In particular, if one of the letters in a common ciphertext bigram is known from basic frequency analysis, bigram analysis can help with making educated guesses about the full bigram.

These techniques work well for the average hobbyist or luddite working with paper and pencil. However, they are both very slow, prone to errors, and based on guesswork. On top of that, even after applying both of them, filling in the blanks can be very difficult. It feels a bit like trying to finish a half-solved crossword puzzle, without reading any hints! In fact, it's worse, since the letters you do 'know' are based on guesswork, and since your guesses could be wrong, you might be working on a puzzle with no solution! Surely there must be a better way.

<br />
<br />

Enter the computer. Back in the predigital era, doing these substitutions by hand truly was the best option we had. However, we now can leverage algorithmic techniques to solve this problem in a fraction of a second. Here's the idea:

The reason frequency analysis works is because the mapping between the plaintext and ciphertext alphabets is one-to-one: each ciphertext letter corresponds to exactly one plaintext letter. One letter, and only one. We will not be implementing frequency analysis, at least not directly, but we will be leveraging this one-to-one property.

We assume we know the language the plaintext is, and we further assume that we can provide a dictionary file enumerating each word which might appear in the plaintext. On nearly all Unix-based distributions, a good dictionary file is present at /usr/share/dict/words. I did all my coding on a lab computer running Ubuntu, and so everywhere that word counts are discussed, it is Ubuntu's words file that I am referring to. This file differs somewhat from e.g. the OS X version of the file. The latter is much larger. The former (Debian and Ubuntu's version) is what I've used for everything discussed here, and it has pulled its weight very well.

The idea is to make use of patterns of letter repetition within words. Let's illustrate it by example. Suppose we've intercepted a message from a Mafia don concerning a new potential business venture. Unfortunately, this don has learned from Provenzano's mistakes and is using a general substitution cipher instead of a Caesar cipher. The local authorities are very interested in what it might say. They had their best frequency analysts try to crack the message, but none of them got anywhere. Stumped, they pass it on to us. Here's the message:

`pf mmwpw skmms fjppf kkms`

We notice right away that the most common letters are: 'm', which occurs five times; and 'p', which occurs four times. These letters might, the frequency analysts suggest, correspond to E or T, but with such a small sample size it's really hard to say. If we substitute 'e' and 't' for 'm' and 'p', respectively, and denote everything else with a blank, we get: `t_  ee_t_  __ee_ _____ __e_`, which is just an absolutely hopeless mess. Do you know any words that start with two Es and have a T in the middle? I don't. Let's throw aside these guesses and see what letter repetition can tell us.

The first word is "pf". Our /usr/share/dict/words file contains 180 different words consisting of two different letters. Examples: 'as', 'in', 'my', 'ma', 'ye', etc etc etc. How is this any better, you might ask? Hang in there.

The second word is "mmwpw". This is where our word-matching idea starts to shine, because it turns out (we'll talk in a bit about how to determine this) that there is _exactly one_ word with this pattern of letter repetitions. That word is "llama", so we can conjecture "mmwpw" -> "llama" and now we know three valuable substitutions.

Of the 180 possibilities for the first word, only 13 of them start with the letter m. So, in trying each possibility for the first letter, 13 times we will come across the conjectured substitution 'p -> m', and it is only in these cases that we will deduce that the second word, for which we "know" only that its fourth letter is 'm', is llama. In all the other cases we'll have 'p' going to some other silly thing, and in those cases we'll be stymied at the second word and we'll move on to a different possible first word.

So, now, for each of these 13 possible first words, we've figured out the second word. We now have a bunch of possible plaintext starts: `ms llama ...`, `mr llama ...`, `mt llama ...`, `my llama ...`, and so on. An exercise for the reader: Decide which of these guesses sounds coolest. In the meantime, we proceed to the third word.

Using (at first) no knowledge of substitutions, we identify six possible words: 'sells', 'shoos', 'sills', 'tweet', 'yummy', and 'yuppy'. We now apply our extra knowledge: Whatever the word is, we expect it to match the pattern, `__ll_` (astute readers may find this phrasing evocative of regexes) We apply this pattern to our candidates and find that only 'sells' and 'sills' pass the test. 'k' hasn't shown up yet in any of the previous words, so we can't tell yet which of those words is the correct one. All we can do is forge ahead!

We now have 13 * 2 = 26 possibilities, down from 180, and two words left. Not bad!

I'll spare you the tedium of going through the last two words in detail. They have 6 and 7 possibilities, respectively, ignoring substitution information. Once we apply our conjectured knowledge of substitutions, we can trim those numbers down to the point where we have one full, unambiguous decryption: "My llama sells yummy eels". Those Mafia types sure have weird taste.

<br />
<br />

Ok, that's enough of that. Let's get into concrete code. There's some Python code below that implements the general strategy we used above. The code is internally documented, so I won't discuss it in detail. A broad overview, though, seems appropriate. The essential flow is: We generate a dictionary which documents all the words we know to follow any given pattern of letter repetitions. We then use a stack to do what is basically a depth-first search of a possibility tree. In this tree, each non-leaf node is a plaintext word guess, every leaf node is either an internally consistent decryption or a dead end, and branches link words in consecutive order.

Here are some github links so you can read the source code.
<div style="text-align: center;"><br />
</div><div style="text-align: center;">=== <a href="https://github.com/wootfish/generalsub/blob/master/simplesub.py">BORING SIMPLE VERSION</a> ===</div><div style="text-align: center;"><br />
</div><div style="text-align: center;">=== <a href="https://github.com/wootfish/generalsub/blob/master/coroutinesub.py">SUPER COOL COROUTINE VERSION</a> ===</div><div style="text-align: center;"><br />
</div>There are some differences between the boring version and the super cool version. The super cool one implements a couple optimizations to improve its runtime and memory footprint. It also only prints out a single guess. Letters which had several possible decrypted values are denoted in the plaintext by an underscore, rather than printing out tons of guesses. This looks nicer, I think.

<br />
<br />

FOOD FOR THOUGHT:

* Frequency analysis never shows up explicitly in our code. However, since it is of course based on letter occurrences in plaintext, it is sort of used indirectly, in a sense, due to our use of a dictionary file. Are there any optimizations or cool features which could come from using frequency analysis in a more explicit way?

* The biggest limitation of this code is that it only works if every plaintext word is in our dictionary. Things like weird names, acronyms, code names, or just randomly inserted gibberish words could all trip up the algorithm. I don't like this. It's trivial to make the search consider, in addition to each guess for any given word, the possibility of just skipping that word. This is tricky, though, because then we would suddenly have a lot of leaf nodes which aren't either dead ends or fully decrypted plaintexts. If we are to consider these, how do we rank them? Perhaps frequency analysis could play a role here!

* Are there any neat little projects, perhaps Raspberry Pi-based, that one could build up around something like this? Portable codebox?

* Modern cryptography has entirely supplanted classical cryptography, for obvious reasons. However, up until the mid-1800s, the Vigenere cipher was considered the way to go for total, perfect security. It was, of course, oversold, but the truth is that the Vigenere cipher is not a trivial thing to crack. There are various techniques, with Kasiski examination being perhaps the most potent. What would a program designed to attack Vigenere ciphers look like? I suspect that one could combine the general ideas used here with an automated Kasiski examination and get at least moderate success out of it. This would be an interesting direction to take the project in.

* Group theory has many applications to cryptography, both classical and modern. The early Polish cryptanalysis of Enigma was firmly rooted in permutation groups. Interesting cryptanalysis of the Vigenere cipher using group theory also exists. What relevance, if any, does all this have to programmatic attacks like this one and the one proposed on the Vigenere cipher?

* Often in practice messages were stripped of all spaces and punctuation and then transmitted in fixed-width blocks. This obviously may introduce some ambiguities, but it also makes the cipher harder to crack by masking word boundaries. Could this algorithm be adapted to work even in this case? If so, how?

* Another way to strengthen the cipher while preserving some amount of plaintext readability is to simply include spaces as an entry in the substitution alphabet. It appears that this was rarely done in practice, and I am not sure why. Our algorithm can be adapted to attack such ciphers simply by iterating over the 27 letters, for each one conjecturing that it decodes to space, and then making appropriate substitutions and running the above algorithm on the resultant message. This would work, but it increases the algorithm's (negligible) running time 27-fold. Is there a better solution?

* Does this algorithm parallelize well? What are the obstacles? What are the strengths? I have some ideas for how the coroutine version could be modified very slightly to run well in a parallel setting. Perhaps there could be a future post on that...
