# AI Strategy Documentation

## Table of Contents
- [Overview](#overview)
- [Decision Making Process](#decision-making-process)
- [Probability Calculations](#probability-calculations)
- [Strategy Levels](#strategy-levels)
- [Implementation Details](#implementation-details)
- [Performance Considerations](#performance-considerations)
- [Future Improvements](#future-improvements)

## Overview

The AI opponent in Bluff implements a probabilistic decision-making system that combines card counting, probability calculations, and adaptive strategy selection. This document explains how the AI makes decisions during gameplay.

### Core Principles
- Probability-based decision making
- Adaptive difficulty levels
- Pattern recognition and learning
- Risk assessment and management

## Decision Making Process

### State Analysis
1. **Hand Evaluation**
   - Count cards by value
   - Identify potential sets
   - Calculate optimal plays

2. **Game State Assessment**
   - Track cards played
   - Monitor opponent's patterns
   - Evaluate pile size
   - Consider current score

3. **Risk Calculation**
   - Probability of successful bluff
   - Probability of getting caught
   - Risk vs. reward analysis

### Action Selection
1. **Playing Cards**
   - Choose between truth and bluff
   - Select number of cards to play
   - Determine declared value

2. **Challenging Decisions**
   - Calculate probability of opponent's honesty
   - Consider pile size impact
   - Evaluate risk/reward ratio

## Probability Calculations

### Card Counting
```typescript
interface CardCount {
  [value: string]: number;
  total: number;
}

// Example probability calculation
function calculateProbability(
  declaredValue: string,
  declaredCount: number,
  knownCards: Card[]
): number {
  const remainingCards = 52 - knownCards.length;
  const remainingOfValue = 4 - knownCards.filter(
    card => card.value === declaredValue
  ).length;
  
  return (remainingOfValue / remainingCards) ** declaredCount;
}
``` 