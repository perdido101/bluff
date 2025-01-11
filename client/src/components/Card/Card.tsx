import React from 'react';
import styled from 'styled-components';
import { Card as CardType } from '../../types/game';

interface CardProps {
  card?: CardType;
  faceDown?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

const CardContainer = styled.div<{ selected?: boolean }>`
  width: 100px;
  height: 140px;
  border-radius: 8px;
  border: 2px solid #ddd;
  background: ${props => props.selected ? '#e3f2fd' : 'white'};
  position: relative;
  cursor: pointer;
  transition: transform 0.2s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);

  &:hover {
    transform: translateY(-5px);
  }
`;

const CardFace = styled.div<{ faceDown: boolean }>`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  color: ${props => ['hearts', 'diamonds'].includes(props.color || '') ? 'red' : 'black'};
  background: ${props => props.faceDown ? '#2196f3' : 'white'};
  border-radius: 6px;
`;

export const Card: React.FC<CardProps> = ({ card, faceDown = false, selected = false, onClick }) => {
  const getSuitSymbol = (suit: string) => {
    const symbols = {
      hearts: '♥',
      diamonds: '♦',
      clubs: '♣',
      spades: '♠'
    };
    return symbols[suit as keyof typeof symbols] || '';
  };

  return (
    <CardContainer selected={selected} onClick={onClick}>
      <CardFace faceDown={faceDown} color={card?.suit}>
        {!faceDown && card ? (
          <>
            {card.value}
            {getSuitSymbol(card.suit)}
          </>
        ) : null}
      </CardFace>
    </CardContainer>
  );
}; 