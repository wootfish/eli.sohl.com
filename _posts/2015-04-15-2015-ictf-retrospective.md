---
layout: post
title: 2015 iCTF Retrospective
---

After some delays, last Friday saw the 2015 UCSB iCTF come and go, and it was quite the experience. This is (to my knowledge) the first year that Western has joined the competition. We didn't exactly place first, but it was great fun and lots of lessons were learned. Now that it's over and we've had a few days to reflect, here are some thoughts on what we did right, what we could've done better, and what caught me by surprise.

There were two big surprises for us this year. First, the sheer number of exposed vulnerable services -- upwards of 40, I'm pretty sure -- and second, the inability to directly attack other teams.

Exploits had to be developed as Python scripts defining an "exploit" class implementing a certain interface. These scripts were to be submitted to the organizers, who would test them and, if the tests were successful, run them on your behalf against all the other teams. Scripts were to retrieve flags -- doing anything else was frowned upon. In particular, damaging or backdooring servers was discouraged, and even if you could install a backdoor on a competitor's server, the VPN was structured so you couldn't actually directly reach it, and any script designed to go after it would fizzle on the fresh image used for testing.

At first, I thought (to be blunt) that this level of structure and restriction was just idiotic. In retrospect, though, I see that it was necessary. Considering the number of services exposed (many reused from previous years -- with the same holes -- guaranteeing that returning teams would have exploits ready to go immediately!!), getting pwned was a guarantee, and so this system prevented everyone from having to revert to backups every few minutes. It was in some ways a disappointment, though, since we went into the competition blind but with a fair number of cool general-purpose CTF scripts at the ready, all of which would have wreaked havoc in previous years' competition but which turned out to have no place in this highly structured context.

One tricky angle was that not everyone on our team knew Python well enough to write the deliverable scripts required by this framework. We ended up, near the end of the competition, with several attacks we could run by hand but which nobody with the proper skills had time to write up. If we'd had more people and a more clearly defined group structure, we could have set up some sort of "assembly line" to handle this bottleneck better, with people hunting for bugs and putting them into a queue on a whiteboard. I suspect this would've raised our overall productivity by quite a bit.

I think that one of our main strengths was in setting priorities when looking for holes to exploit. Our first task, as soon as we got our VM image decrypted, was to see if we had recyclable exploits on hand for any of the services. We had a few. As soon as we'd deployed those, we started looking through any service with source code available. Some quick grepping identified unprotected calls to exec() et al, which yielded more easy exploits -- some of which kept paying dividends throughout the whole competition. It turns out that this is a very easy process to automate. Another tactic that paid big returns was looking for default passwords -- I was astounded by how many teams didn't seem to notice these and left bypasses for all their database protections hardcoded into their web scripts!

We maintained a private GitHub repo, which started out as a place to put all the scripts we thought we'd have cause to use. As the unusual nature of the competition became clear, this repo quickly morphed into a different beast. Right off the bat I put in some template Python scripts which the less initiated could base automated exploits off of. As soon as any exploit of ours was accepted by the server, we added it to a folder inside the repo, so it could be used as a reference. Several other references (e.g. network-related commands, syntax for common tasks) were also maintained in here. We also kept, separately, a Google doc where things like port mappings were recorded for reference. We also communicated across computer labs and shared code snippets via WWU's Slack channel. All of these tools proved to be very useful.

Speaking of Github, one of our team members rediscovered [this](https://github.com/ucsb-seclab/ictf-framework/) about halfway through the competition and realized that the "services" directory contains full source for five of the services which were running on our boxes. Several backdoors turned out to have been removed in the versions we got, but many other holes remained -- and, remarkably, the docs on Github enumerated many of these holes, sometimes even with example exploit code!

<br/>
<div class="separator" style="clear: both; text-align: center;">
<a href="{{site.baseurl}}/assets/img/2015-04-15.png">
<img src="{{site.baseurl}}/assets/img/2015-04-15.png" class="img-fluid mx-auto d-block"/>
</a>
Who doesn't love open source?</div>
<br/>

One nice thing about this particular competition image, with its massive number of vulnerable services, is that now, in the aftermath, we're left with a whole ton of toys to play with. I'm looking forward to spending my free time breaking as many of these as I can. The prospect of organizing internal mock CTFs using server images derived from this year's competition image, with different subsets of its services activated, is also an interesting one.

I'm curious to see the degree to which next year's competition will resemble this year's. Hopefully most of these lessons will transfer fairly well. After all, now we have a score to beat!
