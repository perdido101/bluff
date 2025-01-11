import React, { useState } from 'react';
import styled from 'styled-components';
import { Bet, BettingStats } from '../../server/src/services/bettingService';

interface BettingInterfaceProps {
  tournamentId: string;
  matchId: string;
  currentPlayerId: string;
  player1Id: string;
  player2Id: string;
  onPlaceBet: (amount: number, predictedWinnerId: string) => Promise<void>;
  matchBets?: Bet[];
  playerStats?: BettingStats['playerStats']['values'][0];
  className?: string;
}

const Container = styled.div`
  background: #1a1a1a;
  border-radius: 12px;
  padding: 16px;
  width: 100%;
  max-width: 400px;
`;

const Title = styled.h3`
  color: #ffffff;
  margin: 0 0 16px;
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  color: #888;
  font-size: 14px;
`;

const Input = styled.input`
  background: #2a2a2a;
  border: 1px solid #333;
  border-radius: 6px;
  color: #ffffff;
  padding: 8px 12px;
  font-size: 14px;
  width: 100%;

  &:focus {
    border-color: #4a5eff;
    outline: none;
  }
`;

const PlayerSelect = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

const PlayerButton = styled.button<{ selected?: boolean }>`
  background: ${props => props.selected ? '#4a5eff22' : '#2a2a2a'};
  border: 2px solid ${props => props.selected ? '#4a5eff' : 'transparent'};
  border-radius: 6px;
  color: #ffffff;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.selected ? '#4a5eff33' : '#2a2a2a'};
    transform: translateY(-2px);
  }
`;

const SubmitButton = styled.button`
  background: #4a5eff;
  border: none;
  border-radius: 6px;
  color: #ffffff;
  padding: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #2a3aff;
    transform: translateY(-2px);
  }

  &:disabled {
    background: #333;
    cursor: not-allowed;
    transform: none;
  }
`;

const Stats = styled.div`
  background: #2a2a2a;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 24px;
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
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
  font-size: 16px;
  font-weight: 500;
`;

const BetsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
`;

const BetItem = styled.div<{ status: Bet['status'] }>`
  background: #2a2a2a;
  border-radius: 6px;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  ${props => {
    switch (props.status) {
      case 'WON':
        return 'border-left: 4px solid #4caf50;';
      case 'LOST':
        return 'border-left: 4px solid #f44336;';
      default:
        return 'border-left: 4px solid #ffa500;';
    }
  }}
`;

const BetInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const BetAmount = styled.div`
  color: #ffffff;
  font-weight: 500;
`;

const BetDetails = styled.div`
  color: #888;
  font-size: 12px;
`;

const BetStatus = styled.div<{ status: Bet['status'] }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;

  ${props => {
    switch (props.status) {
      case 'WON':
        return `
          background: #4caf5022;
          color: #4caf50;
        `;
      case 'LOST':
        return `
          background: #f4433622;
          color: #f44336;
        `;
      default:
        return `
          background: #ffa50022;
          color: #ffa500;
        `;
    }
  }}
`;

export const BettingInterface: React.FC<BettingInterfaceProps> = ({
  tournamentId,
  matchId,
  currentPlayerId,
  player1Id,
  player2Id,
  onPlaceBet,
  matchBets,
  playerStats,
  className,
}) => {
  const [amount, setAmount] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<string>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer || !amount) return;

    const betAmount = parseFloat(amount);
    if (isNaN(betAmount) || betAmount <= 0) return;

    await onPlaceBet(betAmount, selectedPlayer);
    setAmount('');
    setSelectedPlayer(undefined);
  };

  return (
    <Container className={className}>
      <Title>Place Your Bet</Title>

      {playerStats && (
        <Stats>
          <StatGrid>
            <StatItem>
              <StatLabel>Total Bets</StatLabel>
              <StatValue>{playerStats.betsPlaced}</StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>Win Rate</StatLabel>
              <StatValue>{(playerStats.winRate * 100).toFixed(1)}%</StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>Total Wagered</StatLabel>
              <StatValue>{playerStats.totalWagered}</StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>Total Won</StatLabel>
              <StatValue>{playerStats.totalWon}</StatValue>
            </StatItem>
          </StatGrid>
        </Stats>
      )}

      <Form onSubmit={handleSubmit}>
        <InputGroup>
          <Label>Bet Amount</Label>
          <Input
            type="number"
            min="0"
            step="1"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Enter amount"
          />
        </InputGroup>

        <InputGroup>
          <Label>Select Winner</Label>
          <PlayerSelect>
            <PlayerButton
              type="button"
              selected={selectedPlayer === player1Id}
              onClick={() => setSelectedPlayer(player1Id)}
            >
              {player1Id}
            </PlayerButton>
            <PlayerButton
              type="button"
              selected={selectedPlayer === player2Id}
              onClick={() => setSelectedPlayer(player2Id)}
            >
              {player2Id}
            </PlayerButton>
          </PlayerSelect>
        </InputGroup>

        <SubmitButton
          type="submit"
          disabled={!selectedPlayer || !amount || parseFloat(amount) <= 0}
        >
          Place Bet
        </SubmitButton>
      </Form>

      {matchBets && matchBets.length > 0 && (
        <>
          <Title>Match Bets</Title>
          <BetsList>
            {matchBets.map(bet => (
              <BetItem key={bet.id} status={bet.status}>
                <BetInfo>
                  <BetAmount>{bet.amount} coins</BetAmount>
                  <BetDetails>
                    on {bet.predictedWinnerId}
                    {bet.payout && ` • Won ${bet.payout} coins`}
                  </BetDetails>
                </BetInfo>
                <BetStatus status={bet.status}>
                  {bet.status}
                </BetStatus>
              </BetItem>
            ))}
          </BetsList>
        </>
      )}
    </Container>
  );
}; 