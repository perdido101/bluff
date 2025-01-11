import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { SolanaTransaction } from '../../../server/src/services/solanaService';
import { PhantomWalletService } from '../services/PhantomWalletService';

interface SolanaTransactionsProps {
  transactions: SolanaTransaction[];
  className?: string;
}

const Container = styled.div`
  background: #1a1a1a;
  border-radius: 8px;
  padding: 20px;
  color: #ffffff;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  color: #ffffff;
`;

const WalletSection = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const WalletAddress = styled.span`
  background: #333;
  padding: 8px 12px;
  border-radius: 4px;
  font-family: monospace;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  background: ${props => props.variant === 'primary' ? '#4CAF50' : '#333'};
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
  }
`;

const TransactionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const TransactionItem = styled.div<{ status: string }>`
  background: #333;
  padding: 15px;
  border-radius: 4px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto;
  gap: 10px;
  align-items: center;

  ${props => props.status === 'CONFIRMED' && `
    border-left: 4px solid #4CAF50;
  `}

  ${props => props.status === 'FAILED' && `
    border-left: 4px solid #f44336;
  `}

  ${props => props.status === 'PENDING' && `
    border-left: 4px solid #ff9800;
  `}
`;

const TransactionInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Label = styled.span`
  color: #888;
  font-size: 0.8rem;
`;

const Value = styled.span`
  font-family: monospace;
`;

const Amount = styled.span<{ type: 'bet' | 'payout' }>`
  color: ${props => props.type === 'payout' ? '#4CAF50' : '#ff9800'};
  font-weight: bold;
`;

const Status = styled.span<{ status: string }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
  text-align: center;

  ${props => props.status === 'CONFIRMED' && `
    background: #1b5e20;
    color: #4CAF50;
  `}

  ${props => props.status === 'FAILED' && `
    background: #b71c1c;
    color: #f44336;
  `}

  ${props => props.status === 'PENDING' && `
    background: #e65100;
    color: #ff9800;
  `}
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: #888;
`;

export const SolanaTransactions: React.FC<SolanaTransactionsProps> = ({
  transactions,
  className
}) => {
  const [sortedTransactions, setSortedTransactions] = useState<SolanaTransaction[]>([]);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isPhantomInstalled, setIsPhantomInstalled] = useState(false);
  const walletService = PhantomWalletService.getInstance();

  useEffect(() => {
    // Check if Phantom is installed and get initial connection state
    setIsPhantomInstalled(walletService.isPhantomInstalled);
    setIsWalletConnected(walletService.isConnected);
    setWalletAddress(walletService.publicKey);
  }, []);

  useEffect(() => {
    // Sort transactions by timestamp, most recent first
    setSortedTransactions([...transactions].sort((a, b) => b.timestamp - a.timestamp));
  }, [transactions]);

  const handleConnectWallet = async () => {
    if (!isPhantomInstalled) {
      window.open('https://phantom.app/', '_blank');
      return;
    }

    try {
      const publicKey = await walletService.connect();
      setIsWalletConnected(true);
      setWalletAddress(publicKey);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      // You might want to show an error message to the user here
    }
  };

  const handleDisconnectWallet = async () => {
    try {
      await walletService.disconnect();
      setIsWalletConnected(false);
      setWalletAddress(null);
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      // You might want to show an error message to the user here
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatAmount = (amount: number) => {
    return `${amount.toFixed(2)} SOL`;
  };

  return (
    <Container className={className}>
      <Header>
        <Title>Solana Transactions</Title>
        <WalletSection>
          {isWalletConnected && walletAddress ? (
            <>
              <WalletAddress>{formatAddress(walletAddress)}</WalletAddress>
              <Button onClick={handleDisconnectWallet}>Disconnect</Button>
            </>
          ) : (
            <Button 
              variant="primary" 
              onClick={handleConnectWallet}
            >
              {isPhantomInstalled ? 'Connect Wallet' : 'Install Phantom'}
            </Button>
          )}
        </WalletSection>
      </Header>

      {sortedTransactions.length > 0 ? (
        <TransactionList>
          {sortedTransactions.map(transaction => (
            <TransactionItem key={transaction.id} status={transaction.status}>
              <TransactionInfo>
                <Label>From</Label>
                <Value>{formatAddress(transaction.fromAddress)}</Value>
              </TransactionInfo>
              <TransactionInfo>
                <Label>To</Label>
                <Value>{formatAddress(transaction.toAddress)}</Value>
              </TransactionInfo>
              <TransactionInfo>
                <Label>Amount</Label>
                <Amount type={transaction.fromAddress === walletAddress ? 'bet' : 'payout'}>
                  {formatAmount(transaction.amount)}
                </Amount>
              </TransactionInfo>
              <Status status={transaction.status}>
                {transaction.status}
              </Status>
            </TransactionItem>
          ))}
        </TransactionList>
      ) : (
        <EmptyState>
          {isWalletConnected
            ? "No transactions found"
            : isPhantomInstalled
              ? "Connect your wallet to view transactions"
              : "Install Phantom wallet to get started"}
        </EmptyState>
      )}
    </Container>
  );
}; 