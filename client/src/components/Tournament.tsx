import React from 'react';
import styled from 'styled-components';
import { Tournament as TournamentType, TournamentMatch, TournamentStats } from '../../server/src/services/tournamentService';

interface TournamentProps {
  tournament: TournamentType;
  stats?: TournamentStats;
  currentPlayerId?: string;
  onMatchSelect?: (matchId: string) => void;
  className?: string;
}

const Container = styled.div`
  background: #1a1a1a;
  border-radius: 12px;
  padding: 16px;
  width: 100%;
  max-width: 1200px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
  margin-bottom: 24px;
  text-align: center;
`;

const Title = styled.h2`
  color: #ffffff;
  margin: 0 0 8px;
  font-size: 24px;
`;

const Status = styled.div<{ status: TournamentType['status'] }>`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  background: ${props => {
    switch (props.status) {
      case 'PENDING': return '#ffa50022';
      case 'IN_PROGRESS': return '#4a5eff22';
      case 'COMPLETED': return '#4caf5022';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'PENDING': return '#ffa500';
      case 'IN_PROGRESS': return '#4a5eff';
      case 'COMPLETED': return '#4caf50';
    }
  }};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin: 16px 0;
  padding: 16px;
  background: #2a2a2a;
  border-radius: 8px;
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatLabel = styled.div`
  color: #888;
  font-size: 12px;
  margin-bottom: 4px;
`;

const StatValue = styled.div`
  color: #ffffff;
  font-size: 18px;
  font-weight: 500;
`;

const BracketContainer = styled.div`
  display: flex;
  gap: 32px;
  padding: 16px;
  overflow-x: auto;
`;

const Round = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 250px;
`;

const RoundTitle = styled.div`
  color: #888;
  font-size: 14px;
  text-align: center;
  margin-bottom: 8px;
`;

const Match = styled.div<{ isSelected?: boolean; isCurrentPlayer?: boolean }>`
  background: ${props => props.isSelected ? '#2a3aff22' : '#2a2a2a'};
  border: 2px solid ${props => props.isSelected ? '#2a3aff' : 'transparent'};
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  ${props => props.isCurrentPlayer && `
    &::before {
      content: '';
      position: absolute;
      left: -8px;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 80%;
      background: #4a5eff;
      border-radius: 2px;
    }
  `}
`;

const Player = styled.div<{ isWinner?: boolean }>`
  color: ${props => props.isWinner ? '#4caf50' : '#ffffff'};
  font-weight: ${props => props.isWinner ? '600' : '400'};
  margin: 4px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PlayerStats = styled.div`
  font-size: 12px;
  color: #888;
`;

const MatchStatus = styled.div<{ status: TournamentMatch['status'] }>`
  font-size: 12px;
  text-align: center;
  margin-top: 8px;
  color: ${props => {
    switch (props.status) {
      case 'PENDING': return '#ffa500';
      case 'IN_PROGRESS': return '#4a5eff';
      case 'COMPLETED': return '#4caf50';
    }
  }};
`;

export const Tournament: React.FC<TournamentProps> = ({
  tournament,
  stats,
  currentPlayerId,
  onMatchSelect,
  className,
}) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getRoundTitle = (roundNumber: number, totalRounds: number) => {
    if (roundNumber === totalRounds) return 'Final';
    if (roundNumber === totalRounds - 1) return 'Semi-Finals';
    if (roundNumber === totalRounds - 2) return 'Quarter-Finals';
    return `Round ${roundNumber}`;
  };

  const rounds = Array.from(
    new Set(tournament.matches.map(m => m.roundNumber))
  ).sort((a, b) => a - b);

  const totalRounds = Math.max(...rounds);

  return (
    <Container className={className}>
      <Header>
        <Title>{tournament.name}</Title>
        <Status status={tournament.status}>{tournament.status}</Status>
      </Header>

      {stats && (
        <StatsGrid>
          <StatItem>
            <StatLabel>Total Matches</StatLabel>
            <StatValue>{stats.totalMatches}</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Completed Matches</StatLabel>
            <StatValue>{stats.completedMatches}</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Total Bluffs</StatLabel>
            <StatValue>{stats.totalBluffs}</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Total Challenges</StatLabel>
            <StatValue>{stats.totalChallenges}</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Avg. Match Duration</StatLabel>
            <StatValue>
              {Math.round(stats.averageMatchDuration / 1000 / 60)}m
            </StatValue>
          </StatItem>
        </StatsGrid>
      )}

      <BracketContainer>
        {rounds.map(roundNumber => (
          <Round key={roundNumber}>
            <RoundTitle>
              {getRoundTitle(roundNumber, totalRounds)}
            </RoundTitle>
            
            {tournament.matches
              .filter(match => match.roundNumber === roundNumber)
              .map(match => {
                const matchStats = stats?.playerStats.get(match.player1Id);
                const isCurrentPlayerInMatch = currentPlayerId && (
                  match.player1Id === currentPlayerId ||
                  match.player2Id === currentPlayerId
                );

                return (
                  <Match
                    key={match.id}
                    onClick={() => onMatchSelect?.(match.id)}
                    isCurrentPlayer={isCurrentPlayerInMatch}
                  >
                    <Player isWinner={match.winnerId === match.player1Id}>
                      {match.player1Id === 'bye' ? 'BYE' : match.player1Id}
                      {matchStats && (
                        <PlayerStats>
                          {matchStats.matchesWon}/{matchStats.matchesPlayed}
                        </PlayerStats>
                      )}
                    </Player>
                    
                    <Player isWinner={match.winnerId === match.player2Id}>
                      {match.player2Id === 'bye' ? 'BYE' : match.player2Id}
                      {matchStats && (
                        <PlayerStats>
                          {matchStats.matchesWon}/{matchStats.matchesPlayed}
                        </PlayerStats>
                      )}
                    </Player>

                    <MatchStatus status={match.status}>
                      {match.status}
                    </MatchStatus>
                  </Match>
                );
              })}
          </Round>
        ))}
      </BracketContainer>
    </Container>
  );
}; 