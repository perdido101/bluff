import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { GameTable } from './GameTable';
import { PlayerHand } from './PlayerHand';
import { GameControls } from './GameControls';
import { GameState, GameAction, Card } from '../types';
import { api } from '../services/api';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

const GameContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Controls = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
`;

const Button = styled.button`
  padding: 10px 20px;
  border-radius: 5px;
  border: none;
  background: #2c5282;
  color: white;
  cursor: pointer;
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const Game: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [declaredValue, setDeclaredValue] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAIThinking, setIsAIThinking] = useState(false);

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = async () => {
    try {
      setLoading(true);
      const initialState = await api.initializeGame();
      setGameState(initialState);
    } catch (err) {
      setError('Failed to initialize game');
    } finally {
      setLoading(false);
    }
  };

  const handleCardSelect = (card: Card) => {
    if (selectedCards.includes(card)) {
      setSelectedCards(selectedCards.filter(c => c !== card));
    } else {
      setSelectedCards([...selectedCards, card]);
    }
  };

  const handlePlayCards = async () => {
    if (!gameState || !declaredValue || selectedCards.length === 0) return;

    try {
      const action: GameAction = {
        type: 'PLAY_CARDS',
        payload: {
          cards: selectedCards,
          declaredValue
        }
      };

      const newState = await api.makeMove(action, gameState);
      setGameState(newState);
      setSelectedCards([]);
      setDeclaredValue('');

      // AI's turn
      await handleAITurn(newState);
    } catch (err) {
      setError('Failed to play cards');
    }
  };

  const handleChallenge = async () => {
    if (!gameState) return;

    try {
      const action: GameAction = { type: 'CHALLENGE' };
      const newState = await api.makeMove(action, gameState);
      setGameState(newState);

      if (newState.currentTurn === 'ai') {
        await handleAITurn(newState);
      }
    } catch (err) {
      setError('Failed to challenge');
    }
  };

  const handleAITurn = async (currentState: GameState) => {
    try {
      setIsAIThinking(true);
      const aiAction = await api.getAIDecision(currentState);
      const newState = await api.makeMove(aiAction, currentState);
      setGameState(newState);
    } catch (err) {
      setError('AI encountered an error');
    } finally {
      setIsAIThinking(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={initializeGame} />;
  if (!gameState) return null;

  return (
    <GameContainer>
      <GameTable
        centerPile={gameState.centerPile}
        isAIThinking={isAIThinking}
        lastPlay={gameState.lastPlay}
      />
      
      <PlayerHand
        cards={gameState.playerHand}
        selectedCards={selectedCards}
        onCardSelect={handleCardSelect}
      />

      <Controls>
        <select
          value={declaredValue}
          onChange={(e) => setDeclaredValue(e.target.value)}
          disabled={gameState.currentTurn !== 'player'}
        >
          <option value="">Select Value</option>
          {['2','3','4','5','6','7','8','9','10','J','Q','K','A'].map(value => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>

        <Button
          onClick={handlePlayCards}
          disabled={
            gameState.currentTurn !== 'player' ||
            selectedCards.length === 0 ||
            !declaredValue
          }
        >
          Play Cards
        </Button>

        <Button
          onClick={handleChallenge}
          disabled={
            gameState.currentTurn !== 'player' ||
            !gameState.lastPlay
          }
        >
          Challenge
        </Button>
      </Controls>
    </GameContainer>
  );
}; 