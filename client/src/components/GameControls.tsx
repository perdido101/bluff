import React from 'react';
import styled from 'styled-components';
import { GameAction, GameState, Card } from '../types';

const ControlsContainer = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
`;

interface Props {
  gameState: GameState;
  selectedCards: Card[];
  declaredValue: string;
  onDeclaredValueChange: (value: string) => void;
  onPlayCards: () => void;
  onChallenge: () => void;
}

export const GameControls: React.FC<Props> = ({
  gameState,
  selectedCards,
  declaredValue,
  onDeclaredValueChange,
  onPlayCards,
  onChallenge
}) => {
  return (
    <ControlsContainer>
      <select
        value={declaredValue}
        onChange={(e) => onDeclaredValueChange(e.target.value)}
        disabled={gameState.currentTurn !== 'player'}
      >
        <option value="">Select Value</option>
        {['2','3','4','5','6','7','8','9','10','J','Q','K','A'].map(value => (
          <option key={value} value={value}>{value}</option>
        ))}
      </select>

      <button
        onClick={onPlayCards}
        disabled={
          gameState.currentTurn !== 'player' ||
          selectedCards.length === 0 ||
          !declaredValue
        }
      >
        Play Cards
      </button>

      <button
        onClick={onChallenge}
        disabled={
          gameState.currentTurn !== 'player' ||
          !gameState.lastPlay
        }
      >
        Challenge
      </button>
    </ControlsContainer>
  );
}; 