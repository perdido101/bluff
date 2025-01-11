import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SolanaTransactions } from './SolanaTransactions';
import { SolanaTransaction } from '../../../server/src/services/solanaService';
import { PhantomWalletService } from '../services/PhantomWalletService';

jest.mock('../services/PhantomWalletService');

describe('SolanaTransactions', () => {
  const mockTransactions: SolanaTransaction[] = [
    {
      id: '1',
      betId: 'bet1',
      fromAddress: 'player123',
      toAddress: 'treasury456',
      amount: 1.5,
      status: 'CONFIRMED',
      signature: 'sig1',
      timestamp: Date.now() - 1000,
      blockHeight: 100
    },
    {
      id: '2',
      betId: 'bet1',
      fromAddress: 'treasury456',
      toAddress: 'player123',
      amount: 2.8,
      status: 'PENDING',
      signature: 'sig2',
      timestamp: Date.now(),
      blockHeight: 101
    }
  ];

  let mockPhantomWallet: jest.Mocked<PhantomWalletService>;

  beforeEach(() => {
    mockPhantomWallet = {
      isPhantomInstalled: true,
      isConnected: false,
      publicKey: null,
      connect: jest.fn().mockResolvedValue('player123'),
      disconnect: jest.fn().mockResolvedValue(undefined),
      getInstance: jest.fn().mockReturnThis()
    } as any;

    (PhantomWalletService.getInstance as jest.Mock).mockReturnValue(mockPhantomWallet);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders install button when Phantom is not installed', () => {
    mockPhantomWallet.isPhantomInstalled = false;
    
    render(<SolanaTransactions transactions={mockTransactions} />);
    
    const installButton = screen.getByText('Install Phantom');
    expect(installButton).toBeInTheDocument();
  });

  it('renders connect button when Phantom is installed but not connected', () => {
    render(<SolanaTransactions transactions={mockTransactions} />);
    
    const connectButton = screen.getByText('Connect Wallet');
    expect(connectButton).toBeInTheDocument();
  });

  it('connects wallet successfully', async () => {
    render(<SolanaTransactions transactions={mockTransactions} />);
    
    const connectButton = screen.getByText('Connect Wallet');
    await act(async () => {
      fireEvent.click(connectButton);
    });
    
    expect(mockPhantomWallet.connect).toHaveBeenCalled();
  });

  it('renders wallet address and disconnect button when connected', async () => {
    mockPhantomWallet.isConnected = true;
    mockPhantomWallet.publicKey = 'player123456789';
    
    render(<SolanaTransactions transactions={mockTransactions} />);
    
    expect(screen.getByText('player...6789')).toBeInTheDocument();
    expect(screen.getByText('Disconnect')).toBeInTheDocument();
  });

  it('disconnects wallet successfully', async () => {
    mockPhantomWallet.isConnected = true;
    mockPhantomWallet.publicKey = 'player123456789';
    
    render(<SolanaTransactions transactions={mockTransactions} />);
    
    const disconnectButton = screen.getByText('Disconnect');
    await act(async () => {
      fireEvent.click(disconnectButton);
    });
    
    expect(mockPhantomWallet.disconnect).toHaveBeenCalled();
  });

  it('displays transactions in correct order (most recent first)', () => {
    mockPhantomWallet.isConnected = true;
    mockPhantomWallet.publicKey = 'player123';
    
    render(<SolanaTransactions transactions={mockTransactions} />);
    
    const amounts = screen.getAllByText(/SOL/);
    expect(amounts[0]).toHaveTextContent('2.80 SOL');
    expect(amounts[1]).toHaveTextContent('1.50 SOL');
  });

  it('displays transaction status with correct styling', () => {
    mockPhantomWallet.isConnected = true;
    mockPhantomWallet.publicKey = 'player123';
    
    render(<SolanaTransactions transactions={mockTransactions} />);
    
    const confirmedStatus = screen.getByText('CONFIRMED');
    const pendingStatus = screen.getByText('PENDING');
    
    expect(confirmedStatus.parentElement).toHaveStyle({ 'border-left': '4px solid #4CAF50' });
    expect(pendingStatus.parentElement).toHaveStyle({ 'border-left': '4px solid #ff9800' });
  });

  it('displays correct amount colors for bets and payouts', () => {
    mockPhantomWallet.isConnected = true;
    mockPhantomWallet.publicKey = 'player123';
    
    render(<SolanaTransactions transactions={mockTransactions} />);
    
    const amounts = screen.getAllByText(/SOL/);
    const [payout, bet] = amounts;
    
    expect(payout.parentElement).toHaveStyle({ color: '#4CAF50' });
    expect(bet.parentElement).toHaveStyle({ color: '#ff9800' });
  });

  it('displays appropriate empty state message when not connected', () => {
    render(<SolanaTransactions transactions={[]} />);
    
    expect(screen.getByText('Connect your wallet to view transactions')).toBeInTheDocument();
  });

  it('displays appropriate empty state message when connected but no transactions', () => {
    mockPhantomWallet.isConnected = true;
    mockPhantomWallet.publicKey = 'player123';
    
    render(<SolanaTransactions transactions={[]} />);
    
    expect(screen.getByText('No transactions found')).toBeInTheDocument();
  });

  it('displays appropriate empty state message when Phantom is not installed', () => {
    mockPhantomWallet.isPhantomInstalled = false;
    
    render(<SolanaTransactions transactions={[]} />);
    
    expect(screen.getByText('Install Phantom wallet to get started')).toBeInTheDocument();
  });

  it('handles connection errors gracefully', async () => {
    mockPhantomWallet.connect.mockRejectedValueOnce(new Error('Connection failed'));
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    render(<SolanaTransactions transactions={mockTransactions} />);
    
    const connectButton = screen.getByText('Connect Wallet');
    await act(async () => {
      fireEvent.click(connectButton);
    });
    
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to connect wallet:',
      expect.any(Error)
    );
    
    consoleSpy.mockRestore();
  });

  it('handles disconnection errors gracefully', async () => {
    mockPhantomWallet.isConnected = true;
    mockPhantomWallet.publicKey = 'player123';
    mockPhantomWallet.disconnect.mockRejectedValueOnce(new Error('Disconnection failed'));
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    render(<SolanaTransactions transactions={mockTransactions} />);
    
    const disconnectButton = screen.getByText('Disconnect');
    await act(async () => {
      fireEvent.click(disconnectButton);
    });
    
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to disconnect wallet:',
      expect.any(Error)
    );
    
    consoleSpy.mockRestore();
  });
}); 