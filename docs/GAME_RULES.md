# Bluff Card Game Rules

## Table of Contents
- [Overview](#overview)
- [Game Setup](#game-setup)
- [Game Flow](#game-flow)
- [Actions](#actions)
- [Scoring](#scoring)
- [Special Cases](#special-cases)
- [Strategy Tips](#strategy-tips)

## Overview

Bluff is a card game of deception and strategy where players aim to be the first to get rid of all their cards. The game involves declaring cards being played face-down, which may or may not be truthful declarations.

### Number of Players
- 2 players (1 human player vs AI)
- The game uses a standard 52-card deck

### Objective
Be the first player to get rid of all your cards by:
- Playing cards face-down while declaring their values
- Successfully bluffing about the cards you play
- Catching other players when they bluff
- Avoiding getting caught when bluffing

## Game Setup

1. **Deck Preparation**
   - Use a standard 52-card deck
   - Shuffle the deck thoroughly
   - Deal cards evenly between players

2. **Initial State**
   - Each player receives 26 cards
   - Cards are kept hidden from the opponent
   - No cards are placed face-up initially

3. **Turn Order**
   - Human player starts first
   - Players alternate turns
   - Turn order remains constant throughout the game

## Game Flow

### Round Structure
1. **Start of Turn**
   - Current player reviews their hand
   - Decides which cards to play and what to declare

2. **During Turn**
   - Player places 1-4 cards face down
   - Declares the cards' value (must be same value)
   - Opponent can either accept or challenge

3. **End of Turn**
   - If no challenge, cards remain face down
   - If challenged, cards are revealed
   - Turn passes to the next player

### Game End
- Game ends when a player has no cards left
- Game can also end if a player is caught bluffing and must pick up the pile

## Actions

### Playing Cards
1. **Regular Play**
   - Play 1-4 cards face down
   - Declare them as any value
   - Cards must be declared as the same value

2. **Passing**
   - Player can choose to pass their turn
   - Must pick up the pile if the previous player also passed

### Challenging
1. **When to Challenge**
   - If you suspect the opponent is bluffing
   - Based on the cards you hold
   - Based on previous plays

2. **Challenge Results**
   - If bluff caught: Player who bluffed takes the pile
   - If challenge failed: Challenger takes the pile 

## Special Cases

### Empty Pile
- First player can declare any value
- No passing allowed on empty pile
- Must play at least one card

### Multiple Winners
- If both players run out of cards in the same round:
  - Player who played last wins
  - If due to challenge, challenger wins

### Disconnection
- Game state is saved
- Can resume from last valid state
- Timeout protection implemented

## Scoring

### Points System
- Winning a game: 100 points
- Catching a bluff: 20 points
- Successful bluff: 10 points
- Bonus for winning with opponent having many cards: 1 point per opponent's card

### Statistics Tracked
- Games won/lost
- Successful bluffs
- Successful challenges
- Average cards left when losing
- Longest winning streak

## Strategy Tips

### Basic Strategy
1. **Card Counting**
   - Keep track of played cards
   - Remember opponent's successful plays
   - Note which values are likely used up

2. **Bluffing Techniques**
   - Mix truth and bluffs
   - Bluff with similar values to cards held
   - Use opponent's known cards to inform bluffs

3. **Challenge Tactics**
   - Challenge when holding many cards of declared value
   - Watch for patterns in opponent's play
   - Consider pile size when challenging

### Advanced Strategies

1. **Psychology**
   - Establish patterns, then break them
   - Use timing to suggest uncertainty
   - Build false confidence in opponent

2. **Risk Management**
   - Calculate risk vs. reward for challenges
   - Consider hand size when bluffing
   - Manage pile size strategically

3. **Late Game Tactics**
   - Adjust strategy based on remaining cards
   - Force opponent to pick up large piles
   - Save known good cards for crucial moments

## Common Mistakes to Avoid

1. **Bluffing**
   - Don't bluff too often
   - Avoid obvious bluffs
   - Don't establish predictable patterns

2. **Challenging**
   - Don't challenge without good reason
   - Don't ignore obvious tells
   - Don't challenge with large piles unless certain

3. **General Play**
   - Don't forget to count cards
   - Don't ignore opponent's card count
   - Don't play too conservatively

## Frequently Asked Questions

### Game Rules
Q: Can I play more cards than I declare?
A: No, the number of cards played must match the declaration.

Q: Can I look at the pile?
A: No, once cards are played face-down, they cannot be viewed unless challenged.

Q: What happens if I can't play?
A: You can always play cards and declare any value, or choose to pass.

### Strategy
Q: When should I bluff?
A: Bluff when you have backup plans and when the risk/reward ratio is favorable.

Q: How do I know when to challenge?
A: Challenge when you hold cards that make the opponent's declaration unlikely to be true.

Q: Should I always play multiple cards when possible?
A: Not always - sometimes playing fewer cards gives you more flexibility later. 