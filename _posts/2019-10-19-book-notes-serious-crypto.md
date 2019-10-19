---
layout: post
title: "Book Notes: Serious Cryptography"
tags: [book-notes]
---

![Cover Image](/assets/img/serious-crypto.png)

[Available through No Starch Press](https://nostarch.com/seriouscrypto)

I bought this book for its last chapter and ended up reading the whole thing. It's really good. If you asked me for one book to get you up to speed on modern cryptography, this is the book I would recommend.

Prior to this, most of my foundational crypto knowledge came from _Practical Cryptography_ by Schneier and Ferguson (2003). That's a great book as well, though it is starting to show its age. That's to be expected: modern cryptography as we know it began in the mid-70s, meaning the field is not even fifty years old. Every year brings us new and interesting research, and it can be hard to keep up with it all.

My hope was that this book would help me catch up on what's new in cryptography over the last decade or two. Granted, that's a lot to ask of a 300-page book, but overall it delivered.

In particular, the discussion of post-quantum cryptography in the last chapter - the main thing I bought the book for - was very lucid, and I came away from it feeling for the first time like I've actually understood the basics of the subject: what qubits are and how they're used, why it's so hard to simulate them with classical computers, what Shor's and Grover's algorithms actually do (though not how they are implemented), the main categories of proposed post-quantum cryptosystems, and the advantages and drawbacks of each.

The author (Jean-Philippe Aumasson) is great at knowing when and how to go into detail on a topic without going _too far_ and getting bogged down. Every detailed discussion is related back to high-level ideas in a way that makes its relevance clear. Generally, details that can't be easily treated in this way are omitted - but each chapter ends with a "Further Reading" section that gives you the references you need to go fill in the gaps for yourself. Like the rest of the book, these sections are consistently terse, thoughtful, and informative.

There's another recurring chapter-ending section: _How Things Can Go Wrong_. These are consistently excellent as well. A lot of failed cryptosystems come from engineers having a rough idea of what they're supposed to do with crypto primitives but having very little idea of what _not_ to do. These sections do two things: they introduce you to some of the most common and serious mistakes people make, and they serve as cautionary tales about trying to cut corners or get too clever. There's a time and place for cutting corners, and it is definitely not when you're working on cryptography.

There are a few chapters that I wish went deeper on their subjects, and a few discussions that I wish were presented with more mathematical formality (the author has a habit of speaking in absolutes about claims for which we only have strong heuristic arguments, which probably wouldn't bother most people but which is like nails on a chalkboard to me), but these are minor complaints, and the reference lists in the Further Reading sections do a good job of covering any major omissions or generalizations in the main text.

I really enjoyed the discussion of block cipher modes. This is a subject with a lot of important results and startling attacks; it's also pretty technical, and in the wrong hands it can be very dry. Not here, though. Maybe I'm just a nerd, but I found Aumasson's treatment of it engaging from start to finish. Note that it is spread out over a couple sections: ECB, CBC, and CTR are covered early on in the chapter on block ciphers, while authenticated constructs OCB and GCM come up later in the chapter on authenticated encryption. XTS gets an honorable mention in a Further Reading section. Other modes like CFB and OFB are (correctly) written off as "folklore techniques that nobody uses."

If you're interested, you can sample the chapter on block ciphers [here](https://nostarch.com/download/SeriousCryptography_Chapter4_sample.pdf), courtesy of the publisher.

Subjects like keyed hashes, authenticated encryption, and elliptic-curve cryptography were largely absent from my previous primer, _Practical Cryptography_, since they were still taking shape as it was being written. I was glad to find that Aumasson provides serious, in-depth treatments of these, and I learned more from those chapters than I ever did from blog posts and Wikipedia articles.

Another subject in that same vein: _security notions_. NM-CPA, NM-CCA, IND-CPA, and IND-CCA were all terms that I was peripherally aware of but had filed into the broad category of "obscure academic jargon". I'm still convinced that's what they are, but now at least I know what they mean.

Part of me wishes that _Serious Cryptography_ were, say, a hundred pages longer, with more detail in some of its discussions and with chapters on some more obscure or cutting-edge topics: ring signatures, zero-knowledge proofs, cryptographic protocol design (e.g. a chapter on the Noise framework would touch on a lot of valuable topics), and so on.

That's what I would've liked to see, but maybe that's excessive. After all, the book's stated goal is to be an engineer's introduction (or re-introduction) to modern cryptography - and by that standard, it is exceptionally good.
