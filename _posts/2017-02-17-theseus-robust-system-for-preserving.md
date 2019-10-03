---
layout: post
title: 'Theseus: A Robust System for Preserving and Sharing Research'
tags: [theseus]
---

<hr class="bloghr" />

# The Promise

Recently, American scientists have been engaged in an [effort](https://www.washingtonpost.com/news/energy-environment/wp/2016/12/13/scientists-are-frantically-copying-u-s-climate-data-fearing-it-might-vanish-under-trump/) of [unprecedented](http://www.npr.org/2016/12/14/505592206/scientists-race-to-preserve-climate-change-data-before-trump-takes-office) [scope](https://www.wired.com/2017/01/rogue-scientists-race-save-climate-data-trump/) to back up as much climate data and research as they can get their hands on. In the hours surrounding the presidential inauguration, groups of activists rushed to back up this data on [European](https://qz.com/891201/hackers-were-downloading-government-climate-data-and-storing-it-on-european-servers-as-trump-was-being-inaugurated/) [servers](http://fortune.com/2017/01/22/climate-data-trump-admin-hackers/). These groups fear censorship of climate research by the incoming administration, and rightly so. [Currently](http://www.reuters.com/article/us-usa-trump-epa-climatechange-idUSKBN15906G), [governmental](https://www.washingtonpost.com/news/speaking-of-science/wp/2017/02/01/canadian-scientists-were-followed-threatened-and-censored-they-warn-trump-could-do-the-same/) [censorship](https://www.washingtonpost.com/politics/federal-agencies-ordered-to-restrict-their-communications/2017/01/24/9daa6aa4-e26f-11e6-ba11-63c4b4fb5a63_story.html?tid=a_inl&amp;utm_term=.47825bb6bdf8) of [science](https://arstechnica.com/science/2017/01/have-politics-trumped-science/) is [more](http://www.csmonitor.com/Environment/Inhabit/2017/0128/Scientists-drawn-into-politics-in-a-bid-to-defend-science) [than](http://www.slate.com/blogs/bad_astronomy/2017/01/25/trump_issues_gag_orders_on_science_agencies.html) a [hypothetical](http://mashable.com/2017/01/18/epa-nominee-pruitt-questions-climate-science/#RnXy8RwI_sqo) [concern](http://www.bbc.com/news/science-environment-38746608).

It's inspiring to see this level of mobilization, but horrifying that it is necessary. The need for this action reveals that we have built an infrastructure that is vulnerable to attack at many levels. We have found that our top scientific institutions can be silenced if the administration dislikes their findings. We have found that certain political groups believe they can shape reality through misinformation and censorship.&nbsp;And we have found that we, the people, have very little in place that's equipped to push back.

It doesn't have to be this way.

Imagine a system with the reference features and massive scope of the modern scientific paper repositories -- arXiv, Embase, et al. -- but completely decentralized and [peer-to-peer](https://en.wikipedia.org/wiki/Peer-to-peer). The processing power required for all of the system's features, including searching for and downloading papers or data, would be shared across all the network's participants. Anyone with an internet connection could join and use a friendly web interface to immediately access anything stored in the system. They would also optionally be able to volunteer their own spare storage space, CPU power, or network bandwidth to help keep the system healthy.

This is very close to the model used by BitTorrent, and if BitTorrent's success is any indication, this model can lead not only to remarkable download speeds but also  to resilience in the face of attempted censorship, even by state-level adversaries. No central server means no central point of failure.

What I'm laying out here is the outline of such a system for sharing important documents on any subject its users consider valuable. The system relies on its nodes to redundantly back up, index, enumerate, and supply the data it tracks. The system also includes support for searching for papers in a variety of ways. Every part of the system is designed with a strong, explicit focus on security and privacy.

I'm calling it [Theseus](https://en.wikipedia.org/wiki/Theseus).

I believe that the following promises can be made:

1. **A guarantee of robustness in the face of censorship.** Decentralized services can be very difficult to bring down, especially if they have nodes in multiple countries. Skeptical? Just ask the music industry.

2. **Guarantees of anonymity for users who need them.** This goes for file uploads, file downloads, searches -- you name it. This is a big one, and I'll go into more detail on ways it could work below.

3. **The ability to quickly search for papers on any topic.** This is also a big one. There are not very many good tools for browsing research papers, and I believe this system could provide functionality meeting or exceeding what is offered by the current gold standards.

4. **The ability to securely share your own research.** You could digitally sign and upload your own research and have it immediately backed up and indexed by your peers. The digital signatures involved in this scheme also prevent any ne'er-do-wells from trying to pass off modified versions of your work as authentic. The interface would be designed to make this all as simple as possible.

5. **The (potential) ability to sidestep thorny copyright issues.** _I am not a lawyer._ Nothing in this blog post is legal advice, because legal advice is something I am not qualified to give. However, from my lay understanding I am optimistic about this tool's potential for circumventing restrictive laws and promoting freedom of information in the sense advocated by [greats like Aaron Swartz](https://archive.org/stream/GuerillaOpenAccessManifesto/Goamjuly2008_djvu.txt).


What follows is a broad-strokes description of what I have in mind. You'll notice it's light on things like protocol details. This is intentional. While there will certainly be posts dedicated to specifics and minutiae in the future, for now I'm trying to stay focused on the big picture in order to try and lay out the driving vision behind Theseus as clearly as possible.

<br />
# The Ideas

There are several key ideas here, a couple of which have already implemented as stand-alone features in various P2P clients.

#### Searching

First off, it's critical to realize that a distributed peer-to-peer network can do more than just share files. You could share metadata, share file listings, and even perform operations unrelated to filesharing, like conducting searches. The only restriction is that you're running on (essentially) borrowed CPU cycles and thus should try to minimize overhead, preferably keeping it comparable to the overhead of seeding a file. This is just to avoid any impact on overall system performance as a courtesy to the user.

This is where the most prior work exists (as far as I know). There exists, for instance, a BitTorrent client with the special feature that it can conduct decentralized keyword searches for torrent files. There's another client designed to carry out _approximate-match_ decentralized keyword searches. Both of these -- and many other torrent client "extra features" -- work using overlay networks on top of the basic BitTorrent P2P network. This approach has in general yielded excellent results.

#### Automated Seedboxing

Something important to realize is that the life of a torrent lasts only as long as its seeders do. If nobody will seed a file, then that file is effectively gone forever. This is rarely a problem for popular torrents -- you'll always be able to find people to seed TV episodes or games or porn -- but for files that might not necessarily draw interest immediately, or which interest a smaller group of people, the situation can be more dire. These files often require their original provider to seed for a long period of time -- sometimes indefinitely. The critical realization here is that while this is how things are, it is not how things need to be. What if some peers volunteered a certain amount of their own storage space to keep upopular but important torrents alive?

There are many wrong ways to implement such a system. It's not hard to imagine attackers flooding these peers with garbage torrents, forcing the altruistic clients to try to somehow guess what to keep and what to discard. It's also easy to imagine the system getting clogged up by large files like (say) high-resolution rips of very long movies. How would the system know to prefer backing up climate research over backing up these? The best solution I have so far is to use digital signatures as a way of endorsing certain torrents, and to leverage a web of trust. Web-of-trust models are [far from perfect](https://lists.torproject.org/pipermail/tor-talk/2013-September/030235.html), but to me they seem good enough for their use case here.

The idea is, essentially, to only acquire (and subsequently seed) torrents endorsed by people you trust. Endorsement would be indicated by signing a torrent's magnet link. Suppose you were a climate scientist. You could publish a public key and use it to sign magnet links for papers you consider significant (including, but not necessarily limited to, your own work). Then, sympathetic strangers from around the world could import your public key and offer to download and seed torrents signed by said key, with priority given to those which have low numbers of seeders and/or which have only recently been introduced to the network.

These sympathetic souls would likely want features like filesize caps, caps on number of torrents per key, etc, in order to keep storage costs manageable. All of these would be easy to implement and totally compatible with the goal of the system, since research papers do not take up much disk space at all.

You can think of these volunteers as running specialized, automatically populated [seedboxes](https://en.wikipedia.org/wiki/Seedbox). I find it easy to imagine that there are enough generous souls with spare CPU cycles and terabyte hard drives in the world to maker this sort of scheme work.

As for how the signatures would be distributed, that is a good question and I'm not yet concretely committed to any one solution. There are a number of interesting options available here, which I'll try to explore in a future post. The problem is made slightly easier by the fact that signatures take up very little space on disk.

The [web of trust](https://en.wikipedia.org/wiki/Web_of_trust) could come into play if a user finishes downloading all low-seed-count torrents endorsed by anyone they trust and still has volunteered storage space left over. Rather than letting that extra space sit empty, the service could start expanding out from the set of trusted keys, identifying _those keys'_ trusted keys and in this way finding new, slightly lower-priority files to download and seed.

#### Anonymity

Another major issue is ensuring privacy through anonymity, and some good ideas have been developed that could be useful here.

First, the bad ones. The classic solution is to use a VPN. This is fine against weak adversaries but unacceptable against nation-states. Another is to try to route your traffic through Tor. This is rightly frowned upon by the Tor community because [it doesn't work very well and has a real impact on network performance](https://blog.torproject.org/blog/bittorrent-over-tor-isnt-good-idea).

A third solution is to do something similar to what the Tribler torrent client has done and implement a dedicated Tor-like network on top of the P2P overlay network they already have in place. This has some significant advantages: it lets you get some of the best properties of Tor without taxing the actual Tor network. It also has a disadvantage in that this network is smaller and less thoroughly tested. Traffic correlation attacks are usually more viable on smaller onion-routing networks like this one, and such networks are also more vulnerable to [Sybil attacks](https://en.wikipedia.org/wiki/Sybil_attack). Nevertheless, we do know ([thanks to the Snowden leaks](http://www.theverge.com/2014/12/28/7458159/encryption-standards-the-nsa-cant-crack-pgp-tor-otr-snowden)) that Tor is one of the few things we have that actually gives the three-letter agencies some trouble, and so it's tempting to adopt a Tor-like model if possible.

My inclination at this point would be to carry out a careful audit of Tribler's system and, if it passes muster, to try to either plug into it (if the developers are amenable) or else emulate it (if they aren't). Tribler also includes provisions for "anonymous seeding", which if effective would be very attractive, especially for authors who want to upload works of theirs whose copyright they no longer hold, perhaps [due to the coercion of an academic publisher](https://en.wikipedia.org/wiki/Copyright_policies_of_academic_publishers).

I do have some reservations about leaning too heavily on Tribler for this part of the design, though not due to any negative judgment of their design or code base -- in fact, so far I've been pleasantly surprised by the scope of their documentation. I'm optimistic about the possibility of drawing on some of their features. It's more that with security in mind I'm withholding endorsement until I have a chance to more thoroughly review their code and protocols. It's also worth noting that the Tribler team themselves are enough of a class act to be upfront and warn against trying to use their system to defend against "spooks and government agencies," since they claim not to currently be able to provide that level of protection.

Another possibility to consider is the use of mixnets. There are huge numbers of both advantages and disadvantages to using mixnets as opposed any of the other options proposed here. This is a hard decision that I may end up writing a future post on. For now, suffice to say that I currently favor the idea of constructing a Tor-like network a la Tribler, but that the idea of using a system based on a mixnet architecture is not completely off the table. The primary concerns motivating the final decision will be thwarting traffic analysis attacks and reducing as much as possible the potency of Sybil attacks.

#### Web Interface

Another idea is to present the tool through a web interface, rather than a dedicated desktop application. This idea is significantly less abstract than most of what's being outlined here, and for good reason. The motivation behind using a web interface is to make the average user feel more comfortable learning the system. If this tool is going to be useful, it has to be usable by non-specialists who might be intimidated by the prospect of learning a whole new desktop application. But a web site? At this point, most people can figure those out. So, my intuition is that a web interface would be easier for people to learn than a whole stand-alone GUI application.

Of course, the client would still run as a native stand-alone application. This application would start, immediately background itself, drop an icon in the system tray, quietly carry out its duties, and serve up the web interface over localhost.

A side benefit of using a web interface is that it would encourage the opening of downloaded files within a web browser whenever possible, rather than within a local program. Security-minded readers might be raising an eyebrow at the idea of this being a benefit. For these readers let me put it this way: which do you think has better sandboxing, Chrome or Adobe Acrobat? And let's not even mention the horde of ill-tested 3rd party PDF readers that people would use if left to their own devices.

There's not really any _good_ choice for PDF viewing right now (which is incredible in and of itself). My suspicion is that putting all this in the browser is probably our best bet at this point in time. This is an issue I'd be particularly interested in hearing reasoned counterpoints on. It's also worth mentioning that users who strongly mistrust the browser could still configure their system to open PDFs or other file types in dedicated applications.

It's also worth noting that the average user is probably familiar and at least reasonably comfortable with their browser's PDF viewer, which slightly reinforces the usability argument made above.

The first iteration of the interface will probably use Bootstrap. That's subject to change as soon as I can rope in anyone who knows more about web design than I do. If that sounds like you and you like what you're seeing here so far, consider this your invitation to get in touch.

#### Chat & Other Social Features

My end-goal for this system is twofold: First, to create a way to reliably distribute critical information such as climate research which enables both its redundant storage across the world and its easy retrieval by anyone; second, to create a tool which, by referencing this distributed network, enables individuals to conduct world-class research in any field of their choosing. This applies as much to climate science as to computer science as to local housing policy. The pursuit of this second goal requires considering certain ideas which might, from the perspective of the first goal, seem frivolous. One of these is chat. If peer-to-peer communication channels are established, it seems like end-to-end encrypted chat is a natural thing to layer on top of them.

Obviously chatting with strangers is risky, and in my mind the risk of user compromise through social engineering is high enough to be prohibitive. However, since the system already involves key distribution, it's interesting to consider the possibility of users who have already established trust for each other mutually authenticating via public key and then carrying out encrypted chat. Impressive and time-tested protocols like OTR exist which could be tunneled through the native communication channels of the system's overlay network. This could facilitate secure communication between e.g. research collaborators.

Other, related ideas like the ability to tag a torrent to facilitate searching, the ability to leave comments on a document and share them with trusted peers (or with the world), or the ability to record citation lists (potentially with magnet links included), would also be worth exploring down the road. Some time soon I'll probably dedicate a blog post to discussing the possibilities here. I'm very excited by the amount of potential here.

<br />
# The Ecosystem

I'm incredibly encouraged by what's already out there in the BitTorrent ecosystem. When I first conceived of this system, I spent a good deal of time coming up with ways to implement every part of it from scratch. Only later did I sit down to do some research -- and to discover that working implementations and quality publications exist for many of the components I thought I'd invented. (I have yet to find any prior work on the automated seedboxing component, though if anyone could cite some I'd be very interested to read up on it.) It's hard to describe how exciting this is, since it means there's a wealth of prior work that can be drawn upon in developing this system.

What surprises me is that these incredibly useful capabilities haven't already been synthesized and packaged into an easy-to-use, secure-by-default application for general use. It's remarkable the degree to which modern development has migrated away from inventing new algorithms or protocols and towards different methods of plugging discrete, pre-existing systems together in new and novel ways. This is where the real power of open-source software is on full display, since it both makes quality code available for this use and fosters the development of communities to support its maintenance and extension.

<br />
# The Future

I'm planning to start work on Theseus immediately, and to devote as much of my free time to it as possible. If you like the sound of what you just read, please feel free to get in touch. Let's work together.

As I emphasized near the start of this post, we live in interesting and, for many people, dangerous times. Major world powers are refusing to acknowledge scientific facts backed by [more than a century](http://www.snopes.com/1912-article-global-warming/) of consensus. The Internet has, and has always had, tremendous promise for promoting the freedom of information, but early assumptions about the specifics of its utopian nature have almost all proven to be overoptimistic.

In the '60s, Stewart Brand famously said that "[information wants to be free](https://en.wikipedia.org/wiki/Information_wants_to_be_free)." Cory Doctorow, in his outstanding book _Information Doesn't Want to Be Free_, plays with the idea of updating the slogan: _"Information doesn't want to be free; people do."_

In the early '90s, John Gilmore suggested that "the Net interprets censorship as damage and routes around it." Early cypherpunks, crypto-anarchists, etc., all seemed to agree -- and it is perhaps telling that the relative size and influence of these groups has dwindled as the internet has matured. The trend says, I think, less about their philosophies and more about how the easily subverted, default-insecure nature of the modern internet has failed to realize the potential they saw.

As a result, I feel about Gilmore's quote much the way Doctorow feels about Brand's: I very deeply respect the sentiment behind it, but I find it has a certain optimism which ends up leaving important things unsaid. After all, by itself the internet is fairly bad at routing around censorship, as projects like [OpenNet](https://opennet.net/) have demonstrated. It's more that we can build technologies _on top of the Internet_ which address and compensate for their substrate's inherent inadequacies.

Put differently: the Net doesn't "interpret censorship as damage and find ways to route around it." _We, its users, do that_. We do it by finding new, more resilient ways to use the internet -- ways that can repair this damage of censorship -- and by making these new technologies as widely available as we can.

The way I see it, the situation we currently find ourselves in is very simple. Some of the most valuable aspects of this sacred, world-changing space are existentially threatened. It is our civic responsibility to do everything we can to protect and strengthen them.
