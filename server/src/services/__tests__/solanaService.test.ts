import { SolanaService, SolanaTransaction } from '../solanaService';
import { PersistenceService } from '../persistenceService';
import { Connection, Transaction, PublicKey } from '@solana/web3.js';

jest.mock('@solana/web3.js');
jest.mock('../persistenceService');

describe('SolanaService', () => {
  let solanaService: SolanaService;
  let mockPersistenceService: jest.Mocked<PersistenceService>;
  let mockConnection: jest.Mocked<Connection>;

  const mockConfig = {
    rpcEndpoint: 'https://api.devnet.solana.com',
    programId: 'program123',
    treasuryAddress: 'treasury456'
  };

  beforeEach(() => {
    mockPersistenceService = {
      load: jest.fn().mockResolvedValue({}),
      save: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockConnection = {
      sendRawTransaction: jest.fn().mockResolvedValue('signature123'),
      confirmTransaction: jest.fn().mockResolvedValue({
        value: { err: null },
        context: { slot: 123 }
      }),
      sendTransaction: jest.fn().mockResolvedValue('signature123'),
      getSignatureStatus: jest.fn().mockResolvedValue({
        value: { err: null }
      })
    } as any;

    (Connection as jest.Mock).mockImplementation(() => mockConnection);

    solanaService = new SolanaService(mockPersistenceService, mockConfig);
  });

  it('creates bet transaction correctly', async () => {
    const transaction = await solanaService.createBetTransaction(
      'bet123',
      'player789',
      100
    );

    expect(transaction.id).toBeDefined();
    expect(transaction.betId).toBe('bet123');
    expect(transaction.fromAddress).toBe('player789');
    expect(transaction.toAddress).toBe(mockConfig.treasuryAddress);
    expect(transaction.amount).toBe(100);
    expect(transaction.status).toBe('PENDING');
    expect(transaction.timestamp).toBeDefined();
  });

  it('processes bet transaction correctly', async () => {
    const transaction = await solanaService.createBetTransaction(
      'bet123',
      'player789',
      100
    );

    const mockSignedTransaction = {
      serialize: jest.fn().mockReturnValue(new Uint8Array())
    } as unknown as Transaction;

    await solanaService.processBetTransaction(transaction.id, mockSignedTransaction);

    const processedTransaction = solanaService.getTransaction(transaction.id);
    expect(processedTransaction?.status).toBe('CONFIRMED');
    expect(processedTransaction?.signature).toBe('signature123');
    expect(processedTransaction?.blockHeight).toBe(123);
  });

  it('creates payout transaction correctly', async () => {
    const transaction = await solanaService.createPayoutTransaction(
      'bet123',
      'winner789',
      180
    );

    expect(transaction.id).toBeDefined();
    expect(transaction.betId).toBe('bet123');
    expect(transaction.fromAddress).toBe(mockConfig.treasuryAddress);
    expect(transaction.toAddress).toBe('winner789');
    expect(transaction.amount).toBe(180);
    expect(transaction.status).toBe('PENDING');
    expect(transaction.timestamp).toBeDefined();
  });

  it('processes payout transaction correctly', async () => {
    const transaction = await solanaService.createPayoutTransaction(
      'bet123',
      'winner789',
      180
    );

    await solanaService.processPayoutTransaction(transaction.id);

    const processedTransaction = solanaService.getTransaction(transaction.id);
    expect(processedTransaction?.status).toBe('CONFIRMED');
    expect(processedTransaction?.signature).toBe('signature123');
    expect(processedTransaction?.blockHeight).toBe(123);
  });

  it('handles failed transactions correctly', async () => {
    mockConnection.confirmTransaction.mockResolvedValueOnce({
      value: { err: new Error('Transaction failed') },
      context: { slot: 123 }
    });

    const transaction = await solanaService.createBetTransaction(
      'bet123',
      'player789',
      100
    );

    const mockSignedTransaction = {
      serialize: jest.fn().mockReturnValue(new Uint8Array())
    } as unknown as Transaction;

    await solanaService.processBetTransaction(transaction.id, mockSignedTransaction);

    const processedTransaction = solanaService.getTransaction(transaction.id);
    expect(processedTransaction?.status).toBe('FAILED');
  });

  it('retrieves bet transactions correctly', async () => {
    await solanaService.createBetTransaction('bet123', 'player789', 100);
    await solanaService.createBetTransaction('bet123', 'player789', 200);
    await solanaService.createPayoutTransaction('bet456', 'winner789', 180);

    const betTransactions = solanaService.getBetTransactions('bet123');
    expect(betTransactions).toHaveLength(2);
    expect(betTransactions[0].amount).toBe(200); // Most recent first
    expect(betTransactions[1].amount).toBe(100);
  });

  it('gets transaction status correctly', async () => {
    const status = await solanaService.getTransactionStatus('signature123');
    expect(status).toBe('CONFIRMED');

    mockConnection.getSignatureStatus.mockResolvedValueOnce({
      value: { err: new Error('Failed') }
    });
    const failedStatus = await solanaService.getTransactionStatus('signature456');
    expect(failedStatus).toBe('FAILED');

    mockConnection.getSignatureStatus.mockResolvedValueOnce({
      value: null
    });
    const pendingStatus = await solanaService.getTransactionStatus('signature789');
    expect(pendingStatus).toBe('PENDING');
  });

  it('prevents processing already processed transactions', async () => {
    const transaction = await solanaService.createBetTransaction(
      'bet123',
      'player789',
      100
    );

    const mockSignedTransaction = {
      serialize: jest.fn().mockReturnValue(new Uint8Array())
    } as unknown as Transaction;

    await solanaService.processBetTransaction(transaction.id, mockSignedTransaction);
    
    await expect(
      solanaService.processBetTransaction(transaction.id, mockSignedTransaction)
    ).rejects.toThrow('Transaction already processed');
  });
}); 