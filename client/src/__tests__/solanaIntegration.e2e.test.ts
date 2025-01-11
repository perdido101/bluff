import { PhantomWalletService } from '../services/PhantomWalletService';
import { SolanaService, SolanaTransaction } from '../../../server/src/services/solanaService';
import { PersistenceService } from '../../../server/src/services/persistenceService';
import { Connection, Transaction, PublicKey } from '@solana/web3.js';

describe('Solana Integration E2E', () => {
  let walletService: PhantomWalletService;
  let solanaService: SolanaService;
  let persistenceService: PersistenceService;
  let mockWindow: any;

  const mockConfig = {
    rpcEndpoint: 'https://api.devnet.solana.com',
    programId: 'program123',
    treasuryAddress: 'treasury456'
  };

  beforeEach(() => {
    // Mock window.solana (Phantom Wallet)
    mockWindow = {
      solana: {
        isPhantom: true,
        connect: jest.fn().mockResolvedValue({ 
          publicKey: { toString: () => 'player123' } 
        }),
        disconnect: jest.fn().mockResolvedValue(undefined),
        signTransaction: jest.fn().mockImplementation(tx => Promise.resolve(tx)),
        publicKey: null
      }
    };
    global.window = mockWindow;

    // Initialize services
    persistenceService = new PersistenceService();
    solanaService = new SolanaService(persistenceService, mockConfig);
    walletService = PhantomWalletService.getInstance();
  });

  describe('Betting Flow', () => {
    it('completes a full betting cycle', async () => {
      // 1. Connect wallet
      await walletService.connect();
      expect(walletService.isConnected).toBe(true);
      expect(walletService.publicKey).toBe('player123');

      // 2. Create bet transaction
      const betTransaction = await solanaService.createBetTransaction(
        'bet123',
        'player123',
        1.5
      );
      expect(betTransaction.status).toBe('PENDING');
      expect(betTransaction.amount).toBe(1.5);

      // 3. Sign and process bet transaction
      const mockSignedTransaction = new Transaction();
      await solanaService.processBetTransaction(betTransaction.id, mockSignedTransaction);
      
      const processedBet = solanaService.getTransaction(betTransaction.id);
      expect(processedBet?.status).toBe('CONFIRMED');

      // 4. Create and process payout
      const payoutTransaction = await solanaService.createPayoutTransaction(
        'bet123',
        'player123',
        2.8
      );
      await solanaService.processPayoutTransaction(payoutTransaction.id);

      const processedPayout = solanaService.getTransaction(payoutTransaction.id);
      expect(processedPayout?.status).toBe('CONFIRMED');

      // 5. Verify transaction history
      const betTransactions = solanaService.getBetTransactions('bet123');
      expect(betTransactions).toHaveLength(2);
      expect(betTransactions[0].amount).toBe(2.8); // Payout
      expect(betTransactions[1].amount).toBe(1.5); // Original bet
    });

    it('handles transaction failures gracefully', async () => {
      await walletService.connect();

      // Create bet transaction
      const betTransaction = await solanaService.createBetTransaction(
        'bet456',
        'player123',
        1.0
      );

      // Simulate transaction failure
      mockWindow.solana.signTransaction.mockRejectedValueOnce(
        new Error('Insufficient funds')
      );

      // Attempt to process the failed transaction
      const mockSignedTransaction = new Transaction();
      await expect(
        solanaService.processBetTransaction(betTransaction.id, mockSignedTransaction)
      ).rejects.toThrow();

      const failedTransaction = solanaService.getTransaction(betTransaction.id);
      expect(failedTransaction?.status).toBe('FAILED');
    });
  });

  describe('Wallet Integration', () => {
    it('maintains wallet state across transactions', async () => {
      // 1. Connect wallet
      await walletService.connect();
      const initialPublicKey = walletService.publicKey;

      // 2. Create and process multiple transactions
      const bet1 = await solanaService.createBetTransaction('bet1', initialPublicKey!, 1.0);
      const bet2 = await solanaService.createBetTransaction('bet2', initialPublicKey!, 2.0);

      const mockSignedTransaction = new Transaction();
      await solanaService.processBetTransaction(bet1.id, mockSignedTransaction);
      await solanaService.processBetTransaction(bet2.id, mockSignedTransaction);

      // 3. Verify wallet state remains consistent
      expect(walletService.isConnected).toBe(true);
      expect(walletService.publicKey).toBe(initialPublicKey);

      // 4. Disconnect wallet
      await walletService.disconnect();
      expect(walletService.isConnected).toBe(false);
      expect(walletService.publicKey).toBeNull();
    });
  });

  describe('Performance', () => {
    it('handles multiple concurrent transactions efficiently', async () => {
      await walletService.connect();

      const startTime = Date.now();
      const numTransactions = 10;
      const transactions = [];

      // Create multiple transactions concurrently
      for (let i = 0; i < numTransactions; i++) {
        transactions.push(
          solanaService.createBetTransaction(
            `bet${i}`,
            walletService.publicKey!,
            1.0
          )
        );
      }

      const createdTransactions = await Promise.all(transactions);
      const mockSignedTransaction = new Transaction();

      // Process all transactions concurrently
      await Promise.all(
        createdTransactions.map(tx =>
          solanaService.processBetTransaction(tx.id, mockSignedTransaction)
        )
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all transactions were processed
      const allProcessed = createdTransactions.every(
        tx => solanaService.getTransaction(tx.id)?.status === 'CONFIRMED'
      );
      expect(allProcessed).toBe(true);

      // Ensure processing time is reasonable (adjust threshold as needed)
      expect(duration).toBeLessThan(5000); // 5 seconds
    });
  });

  describe('Error Recovery', () => {
    it('recovers from network disconnection', async () => {
      await walletService.connect();

      // Create initial transaction
      const bet = await solanaService.createBetTransaction(
        'bet789',
        walletService.publicKey!,
        1.0
      );

      // Simulate network error
      mockWindow.solana.signTransaction.mockRejectedValueOnce(
        new Error('Network error')
      );

      // Attempt transaction - should fail
      const mockSignedTransaction = new Transaction();
      await expect(
        solanaService.processBetTransaction(bet.id, mockSignedTransaction)
      ).rejects.toThrow();

      // Retry transaction - should succeed
      await solanaService.processBetTransaction(bet.id, mockSignedTransaction);
      
      const recoveredTransaction = solanaService.getTransaction(bet.id);
      expect(recoveredTransaction?.status).toBe('CONFIRMED');
    });
  });
}); 