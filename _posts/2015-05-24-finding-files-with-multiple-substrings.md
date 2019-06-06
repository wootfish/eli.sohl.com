---
layout: post
title: Finding Files with Multiple Substrings
date: '2015-05-24T16:27:00.001-07:00'
author: Eli Sohl
tags: 
modified_time: '2016-11-09T20:23:53.322-08:00'
blogger_id: tag:blogger.com,1999:blog-4261047698100656327.post-2933570394367412365
blogger_orig_url: http://sohliloquies.blogspot.com/2015/05/finding-files-with-multiple-substrings.html
---

I'd like to share with you a challenge I ran into last night, a problem that's really difficult unless you take to the command line.

Some background: I play Go. The GoGoD game database, which I recently bought and downloaded, has somewhere on the order of 80,000 Go game records in it. These games are all in .sgf format, which is a simple plaintext format. Records of games from professionals of many different ranks are included. The rating scale for professionals starts at 1 dan (or "shodan") and goes up to 9 dan, the highest rating a player can achieve. Games between professionals are always interesting, but games between 9dan professionals are, in particular, packed with subtlety and value for the ambitious student of Go.

Any game from this database is worth studying, but with over eighty thousand games to choose from, it helps to be able to pick highlights, and what better way than by focusing on games between 9dans?

If we decide to take this route, we're immediately faced with a second question: sure, we can just open games at random until we find one between 9dans, but this is boring and slow. Are we doomed to tedium, or is there some way we could search this database of more than eighty thousand games, pick out only the games between 9dans, and copy these over to a special "elite database"?

To the average user, this might sound like an impossible amount of work. On the command line, it's almost trivial.

Here are a few lines from near the start of a GoGoD game record, where contextual info about a game is stored:

    ...
    PW[Sakai Hideyuki]
    WR[8d]
    PB[Cho Chikun]
    BR[9d]
    EV[59th NHK Cup] RO[Round 3]
    ...

This, intuitively enough, says that this is a record of a game between Cho Chikun 9dan and Sakai Hideyuki 8dan. Note that the use of newlines to delimit fields is common but entirely optional.


We want games where both Black and White are 9dan. Games where black is 9d will contain the string "BR[9d", and likewise games where white is 9d will contain "WR[9d". Note the omission of the closing bracket: the sgf format allows extra information to be included within these brackets, and so searching for "WR[9d]" would miss a fair number of matches, such as the string "WR[9d hon.]" which shows up (for example) in certain records of the games of the great Segoe Kensaku, honorary 9 dan.

So we have two strings to search for. Searching for either one individually is trivial. From GoGoD's base directory, which holds game records in a subfolder called `Database`,

    grep -rl "WR\[9d" Database

will recursively search files in the database and its subdirectories for the string WR[9d (note that the open bracket, a regex metacharacter, needs to be escaped) and output relative paths from the current working directory to all matching files. Swapping out W for B in the search string produces a list of black 9dan games.

Thus, we can build lists of games where black is 9dan or white is 9dan. But what about both?

There are a many ways to do this. One can write a script with a loop that lists white 9d games, then checks whether black is also 9d, and copies only if this condition holds. But, writing scripts is tedious and takes time. Check this out:

    { grep -rl "WR\[9d" Database ; grep -rl "BR\[9d" Database ; } | sort | uniq -d

will build a list of files where black is 9dan and a list of files where white is 9dan, concatenate these lists, sort the concatenated megalist so that duplicated filenames appear next to each other, and then filter through the sorted megalist, picking out only the duplicated lines and outputting one entry per duplicated group.

This command gives us a list of files where both black and white are 9dan. From here, it's a walk in the park. cp copies a file into a directory, but throws a fit if the file's containing directory doesn't exist yet. One underappreciated way to get around this is the --parents flag, which works like this:


    $ mkdir d1
    $ mkdir d1/d2
    $ touch d1/d2/testfile
    $ ls d1/d2
    testfile
    $ mkdir d3
    $ cp d1/d2/testfile d3/d1/d2
    cp: cannot create regular file ‘d3/d1/d2’: No such file or directory
    $ cp --parents d1/d2/testfile d3
    $ ls d3
    d1
    $ ls d3/d1/d2
    testfile


As you can see, the full path to testfile is copied into d3, with directories being created if they don't yet exist. This is exactly what we want.

The GoGoD directory tree looks like this:



    Database
    ├── 0196-1699
    ├── 1700-99
    ├── 1800-49
    ├── 1850-99
    ...
    ├── 2013
    ├── 2014
    ├── 2015
    └── Non19x19Boards
        ├── 13x13 Games
        ├── 15x15 Games
        ├── 21x21 Games
        ├── 9x9 Games
        └── Tibet_Games


So, to create an alternate database with the same directory structure but containing only 9dan games, we can use everything discussed above plus a little bit of xargs glue:

    $ mkdir 9danGoGoD
    $ { grep -rl "WR\[9d" Database ; grep -rl "BR\[9d" Database ; } | sort | uniq -d | xargs -I sgf cp --parents sgf 9dan

This may take a little while without an SSD, because we've got over 80k files to grep (twice!), but it's still a whole lot faster than going through them by hand.

Note that if we have e.g. vimgrep, pcregrep, or any other grep variant able to match across newlines, then there's the potential to speed things up by combining the grep search terms into one regex, thus cutting the number of greps in half and eliminating the need for sort and uniq . If we're willing to sacrifice clarity for speed, this would be one effective way to do so.

Another way to solve this problem: grep returns 0 (success) if it found a match, and nonzero (failure) if it didn't. "find" provides an -exec parameter which allows multiple commands to be specified. For each file found, the first command is run, and if it returns success then the second command is run as well, and so on. This can be leveraged as follows:

    $ find Database -name *.sgf -exec grep "WR\[9d" {} \; -exec grep "BR\[9d" {} \; -exec cp --parents {} 9dan \;

which is not nearly as pretty but is technically a single command!

This is, in my opinion, a good example of why people who criticize the command line for being arcane have the wrong idea -- it's not that they're incorrect, but rather that they're missing the point. Yes, the shell is arcane, but it is necessarily so. Why? Because the options it provides are so close to limitless that any simplification would require a substantial culling of them. Practically any operation you could want to perform on your system, especially on your filesystem, you can do through the command line. You can't create that powerful of a tool without absorbing a certain amount of irreducible complexity. Considering the scale of the task they take on, I'd argue that most modern command-line environments do a very good job of _minimizing_ their environments' arcana!

Years ago, before I started using Linux, I thought the command line was a cool tool for sysadmins but not really practical for the average user. I could not have been more wrong. It's one of those things that you don't realize you need until you learn it, at which point you never want to be without it again. This is why cygwin is such a successful project -- as soon as you realize how much bash & co can do, you never want to be without them again. I get lots of eye rolls when I try to explain this to people, so it was exciting to find in this problem a concrete example of how the shell can be useful entirely outside of sysadmin-related contexts. Setting up a collection of 9dan-only games took an order of magnitude less time than even writing this post!
