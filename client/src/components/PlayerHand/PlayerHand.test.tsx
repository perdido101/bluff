import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { PlayerHand } from './PlayerHand';
import { Card as CardType } from '../../types/game';

describe('PlayerHand Component', () => {
  const mockCards: CardType[] = [
    { suit: 'hearts', value: 'A' },
    { suit: 'diamonds', value: 'K' },
    { suit: 'clubs', value: 'Q' }
  ];

  it('renders all cards in the hand', () => {
    render(
      <PlayerHand
        cards={mockCards}
        isCurrentPlayer={false}
        onCardsSelected={() => {}}
      />
    );

    // Each card should be rendered
    mockCards.forEach(card => {
      expect(screen.getByText(card.value)).toBeInTheDocument();
    });
  });

  it('renders face-down cards when faceDown prop is true', () => {
    render(
      <PlayerHand
        cards={mockCards}
        isCurrentPlayer={false}
        onCardsSelected={() => {}}
        faceDown={true}
      />
    );

    // No card values should be visible
    mockCards.forEach(card => {
      expect(screen.queryByText(card.value)).not.toBeInTheDocument();
    });
  });

  it('allows card selection when isCurrentPlayer is true', () => {
    const handleSelection = jest.fn();
    render(
      <PlayerHand
        cards={mockCards}
        isCurrentPlayer={true}
        onCardsSelected={handleSelection}
      />
    );

    // Click the first card
    fireEvent.click(screen.getByText(mockCards[0].value));
    expect(handleSelection).toHaveBeenCalledWith([mockCards[0]]);

    // Click the second card
    fireEvent.click(screen.getByText(mockCards[1].value));
    expect(handleSelection).toHaveBeenCalledWith([mockCards[0], mockCards[1]]);

    // Click the first card again to deselect
    fireEvent.click(screen.getByText(mockCards[0].value));
    expect(handleSelection).toHaveBeenCalledWith([mockCards[1]]);
  });

  it('prevents card selection when isCurrentPlayer is false', () => {
    const handleSelection = jest.fn();
    render(
      <PlayerHand
        cards={mockCards}
        isCurrentPlayer={false}
        onCardsSelected={handleSelection}
      />
    );

    // Try to click cards
    mockCards.forEach(card => {
      fireEvent.click(screen.getByText(card.value));
    });

    expect(handleSelection).not.toHaveBeenCalled();
  });

  it('maintains selected state of cards', () => {
    render(
      <PlayerHand
        cards={mockCards}
        isCurrentPlayer={true}
        onCardsSelected={() => {}}
      />
    );

    const firstCard = screen.getByText(mockCards[0].value).closest('div');
    expect(firstCard).not.toHaveStyle({ background: '#e3f2fd' });

    fireEvent.click(screen.getByText(mockCards[0].value));
    expect(firstCard).toHaveStyle({ background: '#e3f2fd' });
  });
}); 