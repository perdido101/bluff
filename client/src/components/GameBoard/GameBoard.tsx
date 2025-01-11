import React, { useState } from 'react';
import styled from 'styled-components';
import { PlayerHand } from '../PlayerHand/PlayerHand';
import { Card as CardComponent } from '../Card/Card';
import { GameState, Card, GameAction } from '../../types/game';

interface GameBoardProps {
  gameState: GameState;
  onAction: (action: GameAction) => void;
  playerId: string;
}

const BoardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const CenterArea = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  background: rgba(33, 150, 243, 0.1);
  border-radius: 16px;
  padding: 20px;
`;

const ActionArea = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
  padding: 20px;
`;

const Button = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  background: #2196f3;
  color: white;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.2s;

  &:hover {
    background: #1976d2;
  }

  &:disabled {
    background: #bdbdbd;
    cursor: not-allowed;
  }
`;

const GameInfo = styled.div`
  text-align: center;
  font-size: 18px;
  color: #333;
`;

export const GameBoard: React.FC<GameBoardProps> = ({ gameState, onAction, playerId }) => {
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [declaredValue, setDeclaredValue] = useState<string>('');

  const isCurrentPlayer = gameState.currentPlayer === playerId;
  const player = gameState.players.find(p => p.id === playerId);
  const opponent = gameState.players.find(p => p.id !== playerId);

  const handlePlayCards = () => {
    if (!declaredValue || selectedCards.length === 0) return;
    
    onAction({
      type: 'PLAY_CARDS',
      playerId,
      payload: {
        cards: selectedCards,
        declaredValue
      }
    });
    setSelectedCards([]);
    setDeclaredValue('');
  };

  const handleChallenge = () => {
    onAction({
      type: 'CHALLENGE',
      playerId
    });
  };

  const handlePass = () => {
    onAction({
      type: 'PASS',
      playerId
    });
  };

  return (
    <BoardContainer>
      {opponent && (
        <PlayerHand
          cards={Array(opponent.hand.length).fill({ suit: 'hearts', value: '2' })}
          isCurrentPlayer={false}
          onCardsSelected={() => {}}
          faceDown={true}
        />
      )}

      <CenterArea>
        {gameState.lastMove && (
          <GameInfo>
            Last move: {gameState.lastMove.numberOfCards} {gameState.lastMove.declaredValue}(s)
          </GameInfo>
        )}
      </CenterArea>

      {isCurrentPlayer && (
        <ActionArea>
          <select 
            value={declaredValue}
            onChange={(e) => setDeclaredValue(e.target.value)}
            disabled={!isCurrentPlayer}
          >
            <option value="">Select value</option>
            {['2','3','4','5','6','7','8','9','10','J','Q','K','A'].map(value => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
          <Button 
            onClick={handlePlayCards}
            disabled={!isCurrentPlayer || !declaredValue || selectedCards.length === 0}
          >
            Play Cards
          </Button>
          <Button 
            onClick={handleChallenge}
            disabled={!isCurrentPlayer || !gameState.lastMove}
          >
            Challenge
          </Button>
          <Button 
            onClick={handlePass}
            disabled={!isCurrentPlayer}
          >
            Pass
          </Button>
        </ActionArea>
      )}

      {player && (
        <PlayerHand
          cards={player.hand}
          isCurrentPlayer={isCurrentPlayer}
          onCardsSelected={setSelectedCards}
        />
      )}
    </BoardContainer>
  );
}; 