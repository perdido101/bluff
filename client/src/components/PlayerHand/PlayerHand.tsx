import React, { useState } from 'react';
import styled from 'styled-components';
import { Card as CardComponent } from '../Card/Card';
import { Card as CardType } from '../../types/game';

interface PlayerHandProps {
  cards: CardType[];
  isCurrentPlayer: boolean;
  onCardsSelected: (cards: CardType[]) => void;
  faceDown?: boolean;
}

const HandContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 20px;
  justify-content: center;
  min-height: 160px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 12px;
`;

const CardWrapper = styled.div`
  position: relative;
  margin-left: -30px;
  &:first-child {
    margin-left: 0;
  }
  transition: transform 0.2s;

  &:hover {
    z-index: 1;
  }
`;

export const PlayerHand: React.FC<PlayerHandProps> = ({
  cards,
  isCurrentPlayer,
  onCardsSelected,
  faceDown = false
}) => {
  const [selectedCards, setSelectedCards] = useState<CardType[]>([]);

  const handleCardClick = (card: CardType) => {
    if (!isCurrentPlayer) return;

    setSelectedCards(prev => {
      const isSelected = prev.some(c => 
        c.suit === card.suit && c.value === card.value
      );

      if (isSelected) {
        const newSelection = prev.filter(c => 
          !(c.suit === card.suit && c.value === card.value)
        );
        onCardsSelected(newSelection);
        return newSelection;
      } else {
        const newSelection = [...prev, card];
        onCardsSelected(newSelection);
        return newSelection;
      }
    });
  };

  return (
    <HandContainer>
      {cards.map((card, index) => (
        <CardWrapper key={`${card.suit}-${card.value}-${index}`}>
          <CardComponent
            card={card}
            faceDown={faceDown}
            selected={selectedCards.some(c => 
              c.suit === card.suit && c.value === card.value
            )}
            onClick={() => handleCardClick(card)}
          />
        </CardWrapper>
      ))}
    </HandContainer>
  );
}; 