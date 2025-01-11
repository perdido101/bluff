import React from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Card as CardType } from '../types';
import { Card } from './Card';

const HandContainer = styled(motion.div)`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  padding: 20px;
  min-height: 200px;
`;

interface Props {
  cards: CardType[];
  selectedCards: CardType[];
  onCardSelect: (card: CardType) => void;
}

export const PlayerHand: React.FC<Props> = ({ cards, selectedCards, onCardSelect }) => (
  <HandContainer>
    <AnimatePresence>
      {cards.map((card, index) => (
        <Card
          key={`${card.suit}-${card.value}-${index}`}
          card={card}
          selected={selectedCards.includes(card)}
          onClick={() => onCardSelect(card)}
        />
      ))}
    </AnimatePresence>
  </HandContainer>
); 