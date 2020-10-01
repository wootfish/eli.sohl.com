---
layout: post
title: security in the internet of things
---


# the movie-plot threat

Imagine you woke up one day to find out that overnight you lost access to every account you use online -- Facebook, Twitter, Gmail, you name it. If you use online banking, add that in too. Worse, because all your accounts' password reset flows go through your Gmail account, there's no easy way to get these accounts back.

Now imagine that all of this happened because you bought the wrong fridge.

This sounds like an absurd thought experiment. [It isn't](https://www.schneier.com/blog/archives/2015/08/using_samsungs_.html). For those few who're unlucky enough to own the vulnerable model of 'smart' fridge, this could actually happen. This is reality. The fridge is made by Samsung and it costs about $3600. If an attacker can get within radio distance of the fridge, they can sniff credentials and take over the fridge owner's Google account without breaking a sweat.

Once we've got that (imagining ourselves now in the attacker's shoes, taking advantage of some poor sap who dropped close to four grand on an absurd fridge), we can pull up their other accounts, hit that big fat "password reset" button, and get a link delivered to your new mailbox inviting you to set the account's password to whatever you like. Note that the strength of the original passwords has no bearing on whether this attack can work.

Now, the issue here is not just this specific threat. It's the fact that we're moving towards a world where _threats like this one are normal._ After all, these vulnerabilities are already commonplace -- I only named one, but there are [way](http://www.bbc.com/news/technology-28208905) [more](http://www.dhanjani.com/blog/2013/08/hacking-lightbulbs.html) [where](http://mashable.com/2013/08/02/samsung-smart-tv-hack/) [that](http://www.darkreading.com/vulnerabilities---threats/internet-of-things-contains-average-of-25-vulnerabilities-per-device/d/d-id/1297623) [came](http://siliconangle.com/blog/2014/01/23/the-internet-of-things-is-riddled-with-vulnerabilities/) [from](https://www.youtube.com/watch?v=stnJiPBIM6o), and you'd best believe that [all sorts of folks are taking note.](http://arstechnica.com/security/2014/04/how-new-malware-is-making-the-internet-of-things-the-windows-xp-of-2014/) Even Schneier is [raising the alarm](https://www.schneier.com/essays/archives/2014/01/the_internet_of_thin.html).[^1]

[^1]: Side note: followers of Schneier's blog might fault me for opening this post with a "movie-plot threat", i.e. a threat which is compelling and misleading for the same reason: its specificity. High-level security modeling deals in generalities more than specifics. Specific attacks may highlight general weaknesses, but it is often more productive to discuss these weaknesses directly. Making up movie-plot threats is bad; the thing is, this threat isn't made up. It was an actual vulnerability, and there are many more like it that have yet to be discovered.


# who cares?

Some have argued that this isn't a big deal and that in fact the real problem comes from paranoid nerds using hypothetical risks to distract from real ones. Brian Krebs seems to be [of this opinion](http://krebsonsecurity.com/2015/01/the-internet-of-dangerous-things/): _"from where I sit, the real threat is from The Internet of Things We Already Have That Need Fixing Today."_

And, like, ok, sure: we have a lot of things that need fixing and need fixing now. We're not doing a very good job of fixing them. We desperately need to figure out what we're going to do about this. That said, the Internet of Things is going to make all of these problems much worse.

Why? Well, I'm not here to give a history lesson, but some background might help here. Let's make this fast.

Older folks in security love to tell stories of back when the internet was young and all you needed to be somebody was a terminal and a copy of [that one fucking Phrack article](http://phrack.org/issues/49/14.html). Here's your helpful diagram explaining that the call stack grows downwards, and here's where it stores return addresses, and here's a quick reference for writing shellcodes, and hey look now you have a cool toy.

At some point, the world's major governments realized they might not be cool with this. Lots of money went into developing states' proficiencies in the field of "cyber".[^2] They occasionally ran into big problems (strong public-key cryptography and [onion routing](https://en.wikipedia.org/wiki/Onion_routing), for example), but they were able to quickly and quietly become powerful players, unnoticed only because they chose not to publicize their abilities.

[^2]: Many private security researchers at the time were busy developing proficiency in a different form of "cyber", if you know what I mean.

The NSA in particular is now quietly infamous for recruiting tons of up-and-coming security or crypto talent. One has to imagine that their counterparts are similarly enthusiastic. It's gotten to the point where some commentators suggest articulating one's threat model in terms of "[Mossad or not-Mossad](https://www.usenix.org/system/files/1401_08-12_mickens.pdf)".

Why is this relevant? Because there is a big asymmetry here and it is about to get a whole lot worse.

Well-funded groups are able to throw a whole lot of time and money into finding security bugs. Those of us who work in the open don't really have the resources to keep pace. Frankly, we also have better stuff to do most of the time. This is not a criticism of open-source security research; rather, it is a comment on just how much harm you can do if you can find enough clever people with loose morals and give them lots of funding and very easy jobs.


# threat modeling

The first step to owning a network is getting a foothold. Once you have that first box, your options increase exponentially. In a world in which IoT devices are prevalent, an IoT device is almost certainly your first target, and a huge advantage goes to attackers who already know about vulnerabilities in a broad range of devices.

We live in a world where national intelligence agencies have powers that are hard to believe. We're on the verge of a world in which their powers could literally defy belief. I don't know about you, but that's sure not something I'm comfortable with.

It's not just these agencies who would be helped by the mass proliferation of Internet of Things devices. It would be a boon to organized crime too, as the Ars Technica link given earlier outlined. If you own (or want to start) a botnet, the Internet of Things is your wildest dream come true. Find one obscure exploit and you could add thousands of devices to your net almost instantly. Pretty soon that'll be tens of thousands. Enterprising black-hats could even trivially slap together a masscan-like tool to look for & log addresses of known IoT devices, keeping headcounts for each device. Then you know which devices to spend your time on, and whenever you uncover a 0-day exploit you have a list of vulnerable Things ready to go.

I personally know a number of people who like to roll out the old argument that they're secure because they're boring. "Why would anyone want to take the time to hack little old me?" The mistake here is thinking you have to be interesting to be at risk. Botnets don't care how interesting you are; they care how many cores your processor has.

And what are the odds of the user noticing if their internet-connected robot vacuum gets compromised? Pretty low! Why would you spend more than a few seconds at a time interfacing with your smart calendar? Would you notice if it is running a little slower than usual? Say your internet-enabled fridge/toaster/TV/router/thermostat/lamp gets hacked. If 90% of its idle compute power was put towards (say) bitcoin mining, you probably wouldn't even notice. None of us would. If you think that isn't a big deal, [you aren't thinking hard enough](http://krebsonsecurity.com/2012/10/the-scrap-value-of-a-hacked-pc-revisited/).


# it gets worse

OK - so _what do we do_? We have a problem, sure, but what about solutions?

I'm glad you asked. The first, most obvious step is just to _not buy this crap_ (here is as good a place as any to leave the obligatory s/o to Twitter titan [@internetofshit](https://twitter.com/internetofshit)). I mean, really, who actually wants a [web-enabled pill dispenser](https://twitter.com/internetofshit/status/636869866134372352)? Or the ability to [order a pizza by punching the wall](https://twitter.com/internetofshit/status/634274643629711360)? Or a giant [ugly white cylinder](https://twitter.com/internetofshit/status/633219582820352000) that waters your plants and apparently needs to be connected to the internet to do this? Buy that, and hackers don't have to stop at stealing your identity, spying on you 24/7, driving up your power bill by making money off your compute cycles, and using your fridge in DDoS attacks -- they can drown your plants, too!

Maybe you aren't content with just refusing to go anywhere near these things (or maybe your partner or roommate isn't). You can still _call for security audits_. How hard is it for manufacturers, before shipping their buggy, insecure product, to contract a consultancy to audit the system and find any gaping holes? Not very hard, but it costs money, so most companies won't do it unless they have to -- meaning if it is somehow externally imposed upon them, either through legislation or public pressure.

If you have the time, money, and skills, you can also start buying and breaking these devices on your own time, but frankly I would not recommend that. Your time is almost certainly better spent elsewhere.

Now, here's the bad news: that's about it. From where I'm standing, I don't see much more that we can do as individuals. And it's not clear that any of those measures will be anywhere close to sufficient.

Tech companies have a long and shameful history of viewing security bugs as unimportant or even as a net loss to fix. One common view is this: since audits cost money and most users supposedly don't care about security, it's cheaper to just ship whatever you have and deal with issues when they arise, if they arise.

This is the sort of logic that pushed security researchers to adopt [full disclosure](http://www.spacerogue.net/wordpress/?p=536). The idea was that the only _reliable_ way to get companies to take action is to give them a financial incentive, and the best/fastest way to do that is to light a fire under them. This makes a degree of sense, and it seems to work more often than not, but it is preconditioned on researchers volunteering large amounts of pro bono skilled labor.

This is also the sort of logic that can lead manufacturers to make mistakes they are unable to fix. Many (most?) IoT devices are [difficult or impossible to patch](http://www.wired.com/2014/01/theres-no-good-way-to-patch-the-internet-of-things-and-thats-a-huge-problem/). This is sometimes justified as an anti-jailbreak measure, as a way of keeping users from accidentally damaging their firmware, or even as a security measure (really!). In fact, this measure just ensures that any vulnerability which may exist in a product will never be fully fixed.[^3]

[^3]: At least, not by the manufacturer or the user. From time to time, researchers discover programs designed to spread by exploiting common vulnerabilities, which they then patch after exploitation. This is cool when it works, but it doesn't always work, and it certainly does not seem like a reliable general-purpose alternative to regular patching.

As the IoT becomes more prevalent, more manufacturers are going to have to ask themselves how they want to handle security. I hope we'll see big-name companies start to step up here, but I'm not holding my breath.


# what else?

What else is there to do? Well, currently most big-time IoT products come from big-time hardware companies trying to broaden their catalog by putting chips in everything, and from entrepreneurs looking for easy hardware startup ideas, but really, the Makers should be the ones leading the way here.

It's not that difficult to lock down the software on a Raspberry Pi (use good passwords, disable ssh, [etc](http://raspberrypi.stackexchange.com/questions/1247/what-should-be-done-to-secure-raspberry-pi)) or an Arduino (keep it offline lol, or do all your networking through well-audited libraries). So, if you really can't stop thinking about having a [toilet that tweets](http://www.computerworld.com/article/2605093/laid-off-from-job-man-builds-tweeting-toilet.html) or a [web-enabled toaster](http://laughingsquid.com/jamy-a-weather-forecasting-smart-toaster/), why not try to make your own?

Heck, if it's good enough, you could even head to Kickstarter and join those annoying hardware startup people. But when you hit it big and your funds raised double your stretch goal, just remember that some of that spare change could go towards hiring some hackers to take a long hard look at your product before it ships.


---
