import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Card as CardType } from '../types';

const CardContainer = styled(motion.div)<{ selected: boolean }>`
  width: 100px;
  height: 140px;
  background: white;
  border-radius: 10px;
  border: 2px solid ${props => props.selected ? '#4299e1' : '#e2e8f0'};
  box-shadow: ${props => props.selected ? '0 0 10px rgba(66, 153, 225, 0.5)' : '0 2px 4px rgba(0,0,0,0.1)'};
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  user-select: none;
  position: relative;
  transform-origin: center bottom;
`;

const Value = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: ${props => props.color};
`;

const Suit = styled.div`
  font-size: 32px;
  color: ${props => props.color};
`;

const suitSymbols = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠'
};

interface Props {
  card: CardType;
  selected: boolean;
  onClick: () => void;
}

export const Card: React.FC<Props> = ({ card, selected, onClick }) => {
  const color = card.suit === 'hearts' || card.suit === 'diamonds' ? '#e53e3e' : '#2d3748';

  return (
    <CardContainer
      selected={selected}
      onClick={onClick}
      initial={{ scale: 0, y: 20 }}
      animate={{ 
        scale: 1, 
        y: selected ? -10 : 0 
      }}
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 15
      }}
    >
      <Value color={color}>{card.value}</Value>
      <Suit color={color}>{suitSymbols[card.suit]}</Suit>
    </CardContainer>
  );
}; 