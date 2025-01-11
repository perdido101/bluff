import React from 'react';
import styled from 'styled-components';

interface LeaderboardEntry {
  rank: number;
  rankChange: number;
  playerId: string;
  username: string;
  wins: number;
  losses: number;
  winStreak: number;
  bestWinStreak: number;
  bluffSuccessRate: number;
  eloRating: number;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentPlayerId?: string;
  className?: string;
}

const Container = styled.div`
  background: #1a1a1a;
  border-radius: 12px;
  padding: 16px;
  width: 100%;
  max-width: 800px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  color: #ffffff;
  margin: 0 0 16px;
  text-align: center;
  font-size: 24px;
`;

const Table = styled.div`
  display: table;
  width: 100%;
  border-spacing: 0 8px;
`;

const HeaderRow = styled.div`
  display: table-row;
  color: #888;
  font-size: 14px;
  
  & > div {
    padding: 8px;
    text-align: center;
    font-weight: 500;
  }
`;

const Row = styled.div<{ isCurrentPlayer?: boolean }>`
  display: table-row;
  background: ${props => props.isCurrentPlayer ? '#2a3aff22' : '#2a2a2a'};
  transition: background 0.2s;
  
  &:hover {
    background: ${props => props.isCurrentPlayer ? '#2a3aff33' : '#3a3a3a'};
  }
  
  & > div {
    display: table-cell;
    padding: 12px 8px;
    text-align: center;
    color: #ffffff;
    vertical-align: middle;
  }
`;

const Cell = styled.div`
  display: table-cell;
`;

const RankCell = styled(Cell)`
  width: 60px;
  position: relative;
`;

const RankChange = styled.span<{ change: number }>`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: ${props => props.change > 0 ? '#4caf50' : props.change < 0 ? '#f44336' : '#888'};
  
  &::before {
    content: '${props => props.change > 0 ? '↑' : props.change < 0 ? '↓' : ''}';
    margin-right: 2px;
  }
`;

const Username = styled.div`
  font-weight: 500;
  color: #4a5eff;
`;

const Stat = styled.div`
  font-family: monospace;
  font-size: 14px;
`;

const WinRate = styled.div<{ rate: number }>`
  color: ${props => {
    if (props.rate >= 60) return '#4caf50';
    if (props.rate >= 45) return '#ff9800';
    return '#f44336';
  }};
  font-weight: 500;
`;

export const Leaderboard: React.FC<LeaderboardProps> = ({
  entries,
  currentPlayerId,
  className,
}) => {
  return (
    <Container className={className}>
      <Title>Leaderboard</Title>
      
      <Table>
        <HeaderRow>
          <Cell>Rank</Cell>
          <Cell>Player</Cell>
          <Cell>Rating</Cell>
          <Cell>Win/Loss</Cell>
          <Cell>Win Rate</Cell>
          <Cell>Streak</Cell>
          <Cell>Best Streak</Cell>
          <Cell>Bluff Rate</Cell>
        </HeaderRow>
        
        {entries.map(entry => {
          const winRate = (entry.wins / (entry.wins + entry.losses)) * 100;
          
          return (
            <Row
              key={entry.playerId}
              isCurrentPlayer={entry.playerId === currentPlayerId}
            >
              <RankCell>
                {entry.rank}
                <RankChange change={entry.rankChange}>
                  {Math.abs(entry.rankChange)}
                </RankChange>
              </RankCell>
              
              <Cell>
                <Username>{entry.username}</Username>
              </Cell>
              
              <Cell>
                <Stat>{Math.round(entry.eloRating)}</Stat>
              </Cell>
              
              <Cell>
                <Stat>{entry.wins}/{entry.losses}</Stat>
              </Cell>
              
              <Cell>
                <WinRate rate={winRate}>
                  {winRate.toFixed(1)}%
                </WinRate>
              </Cell>
              
              <Cell>
                <Stat>{entry.winStreak}</Stat>
              </Cell>
              
              <Cell>
                <Stat>{entry.bestWinStreak}</Stat>
              </Cell>
              
              <Cell>
                <Stat>{entry.bluffSuccessRate.toFixed(1)}%</Stat>
              </Cell>
            </Row>
          );
        })}
      </Table>
    </Container>
  );
}; 