---
layout: post
title: How to Lose at Mancala (Consistently!)
mathjax: true
---

Over winter break, I spent a few days fiddling with a Mancala AI. It came together surprisingly quickly! Here's a little journaling on that project.

Background: Mancala is a fun, simple board game with a surprisingly high skill ceiling. I've never been very good at the game, but I've had fun playing it anyway. After a recent series of ruinous defeats at the hands of my own family I started thinking about what optimal game strategies might look like.

_(Side note: It turns out Mancala is a solved game, i.e. it's known how to play "perfectly" for the most common numbers of stones or houses. I haven't looked at any of the relevant publications in depth, but at a glance my impression is that they relied mostly on endgame databases and exhaustive search. That's no fun, so I'm going to ignore those results and try to build this project from the ground up. The goal is to write a program that can beat me at Mancala, and hopefully to learn a few things about the game from it.)_

If you don't know the rules of the game, [here's a quick overview](https://en.wikipedia.org/wiki/Kalah) of the variant I'll be writing about. I'll be calling the game pieces "stones", and the little areas they sit in "houses".

I opted to do this all in C because I had a feeling I'd need speed here and because I wanted more practice with the language.

[You can find the Github repo here](https://github.com/wootfish/mancala).

<br/>
# The Basics

My goal here was to start by writing a C framework and basic shell for playing Mancala. The idea is that if this is made modular enough, then the game logic can be tested through manual play, and down the road the code that prompts a user for a move can be swapped out for code that asks an AI the equivalent question.

Boards are represented through a struct:


```
typedef struct {
    char p1_store;
    char p1[6];
    char p2[6];
    char p2_store;
} board;
```

This struct is of course effectively just a char array, but it's still nice to have pointers into its various sections, both for convenience and for readability. The board will never have more than $$4\cdot6\cdot2=48$$ stones on it, so there's no drawback to the limited range of a char. And in fact using chars rather than larger data types offers an advantage: their small size makes the struct easier to copy quickly.

There's just one gotcha: we haven't addressed the question of how to map this data structure to the physical board. There are three things we want to do with the board: print it, reference specific houses on it, and play moves on it. In printing it and referencing moves, it's convenient to think of reading off the state of the board left-to-right. But when you're playing out a move, stones progress counter-clockwise -- that is to say, left-to-right along the bottom and right-to-left along the top.

Thus, while it's possible to lay out memory so as to make either of these operations natural, the two are mutually exclusive. We have to choose which to bias the design towards.

The main consideration I used is that if we make move calculation easy but printing and indexing more difficult, then that introduces complexity to many parts of the program. Complexity just about inevitably leads to bugs.

On the other hand, if we make move calculation more difficult but printing and indexing easy, then we've encapsulated the complexity within whatever function handles playing a move -- a small function which'll be easy to rigorously test. The rest of the program avoids having to deal with this complexity as long as it trusts the validity of the move function.

The positioning of `p1_store` and `p2_store` (the "endzones" where players are trying to collect stones) was purely to simplify the logic of `play_move`, since nothing else really cares too much about where in the struct those elements are placed.

The "main loop" of the game is a function, `play_game`, which does exactly what it says on the tin. `play_game` takes three arguments: a pointer to a board struct, and two function pointers. These function pointers are meant to indicate two functions which, if passed the game state, will pick moves for players 1 and 2 respectively. Those moves are enacted on the board via `play_move`, which returns a `MOVE_RESULT` enum that is then used to provide helpful feedback and update the game state.

I'd never really done much before with function pointers in C. They're really cool -- they feel way too useful, like something that got smuggled into the standard, secretly backported from higher-order languages. If C also had a clean way to curry functions, I'm not sure I'd ever want for anything more.

The use of function pointers in `play_game` allowed me to start out with players 1 and 2 both played from user input. This manual operation was a good chance to verify that the basic guts of the mancala engine were working properly, and I caught a few bugs in the move function right away. Like I mentioned earlier, that was expected, and the whole setup here was designed to make those expected bugs as easy as possible to root out.

Their real utility, though, came when I decided to add my first shot at an AI to the game. _All that's required_ to swap out a human for an AI is to write a C function with an identical signiture which implemented the AI desired and to change one line in main to pass that function instead of `get_move`. How's that for modularity?

The next step is to write an AI to play the game. That's where "losing consistently" comes in: playing yourself is great, but playing something else is better, and if the thing you've made to play against can beat you, then hey, that's all the better. My goal from the start is to make an AI that's good enough that it can beat me consistently.

<br/>
# Losing Consistently

### The Idea

My first strategy is simple: a naive version of [Monte Carlo tree search](https://en.wikipedia.org/wiki/Monte_Carlo_tree_search) (MCTS). This is a solid go-to strategy for lots of kinds of games. All you need is to be able to simulate playing games out to their conclusions, logging who won as you go. If you have a working engine but don't have any real theory for the game and don't have a bulletproof way of evaluating positions mid-game, MCTS is a good way to get a basic AI working practically "for free". In spite of having such low requirements, MCTS is an incredibly effective strategy -- it's done wonders for many games, notably including Go. In fact, the AlphaGo system was built by using neural nets to provide heuristics for a (thoroughly non-naive) implementation of a similar algorithm.

In short, this is a strategy that gets results, especially in games with emergent mechanics. A full implementation of Monte Carlo tree search involves weighting different moves during the search to provide a basic heuristic for focusing on the most promising candidate moves. We'll start out without this: hence the "naive", since our heuristic will be the random function.

This naive approach probably won't work quite as well as a full MCTS implementation would, but it's much simpler to implement, so it'll make for a good starting point. Down the road, it'll also be interesting to compare this algorithm's performance to that of full MCTS.

### Random Moves

Incidentally, here's something not a lot of people get right: how do you pick a random number between 0 and n in C? Most people would just use `rand() % (n+1)`, but unless `n+1` divides `RAND_MAX` this will introduce a slight amount of skew towards some numbers, which is unacceptable. Random number generation is at the heart of our algorithm. We need to avoid generator skew or the algorithm will suffer.

I chose to encapsulate the complexity of this problem inside a function called `pick_random_move`. This function picks a move at random, while taking care to adjust for skew and to check that the move is legal. The function:

```
char pick_random_move(char side[]) {
    int divisor;
    int move;

    divisor = RAND_MAX/6;
    do {
        do {
            move = rand() / divisor;
        } while (move > 5);
    } while (side[move] == 0);

    return move;
}
```

...is then polled by the NMCTS engine to get random moves. Notice that to switch from a naive heuristic to any other, all we'd have to do is swap out this function. More modularity at work. It's a pity we can't easily make this function an argument to the MCTS algorithm which could get curried in before passing the algorithm driver to `play_game`, but that's C for you.

Quick note about how the function works: `RAND_MAX` is a predefined macro giving the upper limit on the value of `rand()`. We want to map these values to values between 0 and 5, without skew. However this would only be possible if `RAND_MAX` is divisible by 6, and we have no guarantee that that is the case. So, we instead create an imperfect map from values of `rand()` to numbers between 0 and 6. The way we do this (integer division) guarantees that values 0-5 have the same probability of occurring, but has some skew in how often 6 shows up. We deal with that by just throwing out 6es completely -- repolling the RNG whenever we get one -- and returning on 0 through 5 (as long as the number represents a valid move). And just like that, we have a reliable random number generator!

### Where does this get us?

The Github repo already contains an implementation of the naive Monte Carlo tree search. It runs out a configurable number of simulations (defined by a preprocessor macro, `NAIVE_MCTS_NUM_PATHS`, which defaults to 200000) and picks the one which had the highest margin of wins over losses.

In each simulation, all moves are chosen randomly. That's all this thing does -- and yet it works. In aggregate, that strategy is already enough to identify which branches are promising and which are not. My suspicion is that this works because Mancala positions have an extremely low branching factor. This makes branch pruning less important than it would be in e.g. computer Go.

There's one more thing to address: how moves are chosen. There's a few different options here. You could go by the ratio of wins to losses, the ratio of wins to total games played, the integer difference between number of wins and losses observed... In full MCTS, the ratio of wins to games played is typically used, which makes sense since those ratios are also used to set the weights for the random move generation function. However, since we're using naive MCTS, complete with even move probability weighting, I opted instead to go for integer difference, just because it makes for simpler code and gives more or less the same choices on average.

The Github repo currently includes code for setting up both human and NMCTS players. It's even possible to pit the AI against itself (and it plays a pretty good game!). The code is decently well-commented, at least in my opinion, and has a bunch of optional, preprocessor-controlled debug print statements that also help to narrate what's going on.

<br />
# Next Steps

The naive MCTS is not yet completely bug-free, and occasionally picks illegal moves. Hopefully I'll have that issue figured out soon. After that, my next goal is going to be to try and add a more fully-fledged version of MCTS to the program, mostly just to see if it performs tangibly better. It'll be especially fun pitting different versions of the AI against each other and seeing if one has an edge over another.

After that's done, I'm tempted to experiment a little more with different guiding heuristics. It might be interesting to use a decent AI to build up a big corpus of games, then use that corpus to train some sort of statistical model for guessing candidate moves, and use those guesses to help navigate the search space more effectively. I'm not sure how well that will work -- the original algorithm does after all work from random move choices, so as far as data derived from it goes, one is tempted to invoke 'garbage in, garbage out' -- but it'll be interesting regardless. I'm hesitant to make predictions but I think it'll work pretty well.

In any case, I've already achieved my goal of losing to the AI consistently, so I know I'm on the right track.
