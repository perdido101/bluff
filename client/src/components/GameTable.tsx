import React from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../types';

const Table = styled.div`
  position: relative;
  width: 100%;
  height: 400px;
  background: #277714;
  border-radius: 20px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const AIArea = styled(motion.div)`
  height: 100px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const CenterArea = styled(motion.div)`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
`;

const AIThinking = styled(motion.div)`
  color: white;
  font-size: 24px;
  position: absolute;
  top: 20px;
`;

const LastPlay = styled(motion.div)`
  color: white;
  text-align: center;
  margin: 10px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 5px;
`;

interface Props {
  centerPile: Card[];
  isAIThinking: boolean;
  lastPlay?: {
    player: 'player' | 'ai';
    declaredCards: string;
    actualCards: Card[];
  };
}

export const GameTable: React.FC<Props> = ({ centerPile, isAIThinking, lastPlay }) => {
  return (
    <Table>
      <AIArea>
        <AnimatePresence>
          {isAIThinking && (
            <AIThinking
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              AI is thinking...
            </AIThinking>
          )}
        </AnimatePresence>
      </AIArea>

      <CenterArea>
        <AnimatePresence>
          {lastPlay && (
            <LastPlay
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              {lastPlay.player === 'ai' ? 'AI' : 'You'} declared: {lastPlay.declaredCards}
              <br />
              Cards in pile: {centerPile.length}
            </LastPlay>
          )}
        </AnimatePresence>
      </CenterArea>
    </Table>
  );
}; 