import { PhantomWalletService } from './PhantomWalletService';
import { PublicKey, Transaction } from '@solana/web3.js';

describe('PhantomWalletService', () => {
  let service: PhantomWalletService;
  let mockWindow: any;
  let mockPublicKey: PublicKey;

  beforeEach(() => {
    mockPublicKey = {
      toString: jest.fn().mockReturnValue('mock-public-key')
    } as unknown as PublicKey;

    mockWindow = {
      solana: {
        isPhantom: true,
        connect: jest.fn().mockResolvedValue({ publicKey: mockPublicKey }),
        disconnect: jest.fn().mockResolvedValue(undefined),
        signTransaction: jest.fn().mockImplementation((tx) => Promise.resolve(tx)),
        signAllTransactions: jest.fn().mockImplementation((txs) => Promise.resolve(txs)),
        publicKey: null
      }
    };

    global.window = mockWindow;
    service = PhantomWalletService.getInstance();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getInstance', () => {
    it('returns the same instance on multiple calls', () => {
      const instance1 = PhantomWalletService.getInstance();
      const instance2 = PhantomWalletService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('isPhantomInstalled', () => {
    it('returns true when Phantom is installed', () => {
      expect(service.isPhantomInstalled).toBe(true);
    });

    it('returns false when Phantom is not installed', () => {
      delete mockWindow.solana;
      expect(service.isPhantomInstalled).toBe(false);
    });
  });

  describe('connect', () => {
    it('connects successfully to Phantom wallet', async () => {
      const publicKey = await service.connect();
      expect(publicKey).toBe('mock-public-key');
      expect(service.isConnected).toBe(true);
      expect(mockWindow.solana.connect).toHaveBeenCalled();
    });

    it('throws error when Phantom is not installed', async () => {
      delete mockWindow.solana;
      await expect(service.connect()).rejects.toThrow('Phantom wallet is not installed');
    });

    it('handles connection errors', async () => {
      mockWindow.solana.connect.mockRejectedValue(new Error('Connection failed'));
      await expect(service.connect()).rejects.toThrow('Connection failed');
      expect(service.isConnected).toBe(false);
    });
  });

  describe('disconnect', () => {
    beforeEach(async () => {
      await service.connect();
    });

    it('disconnects successfully from Phantom wallet', async () => {
      await service.disconnect();
      expect(service.isConnected).toBe(false);
      expect(service.publicKey).toBeNull();
      expect(mockWindow.solana.disconnect).toHaveBeenCalled();
    });

    it('handles disconnection errors', async () => {
      mockWindow.solana.disconnect.mockRejectedValue(new Error('Disconnection failed'));
      await expect(service.disconnect()).rejects.toThrow('Disconnection failed');
    });

    it('does nothing when already disconnected', async () => {
      await service.disconnect();
      await service.disconnect();
      expect(mockWindow.solana.disconnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('signTransaction', () => {
    const mockTransaction = {} as Transaction;

    beforeEach(async () => {
      await service.connect();
    });

    it('signs transaction successfully', async () => {
      const signedTx = await service.signTransaction(mockTransaction);
      expect(signedTx).toBe(mockTransaction);
      expect(mockWindow.solana.signTransaction).toHaveBeenCalledWith(mockTransaction);
    });

    it('throws error when wallet is not connected', async () => {
      await service.disconnect();
      await expect(service.signTransaction(mockTransaction))
        .rejects.toThrow('Phantom wallet is not connected');
    });

    it('handles signing errors', async () => {
      mockWindow.solana.signTransaction.mockRejectedValue(new Error('Signing failed'));
      await expect(service.signTransaction(mockTransaction))
        .rejects.toThrow('Signing failed');
    });
  });

  describe('signAllTransactions', () => {
    const mockTransactions = [{}, {}] as Transaction[];

    beforeEach(async () => {
      await service.connect();
    });

    it('signs multiple transactions successfully', async () => {
      const signedTxs = await service.signAllTransactions(mockTransactions);
      expect(signedTxs).toBe(mockTransactions);
      expect(mockWindow.solana.signAllTransactions).toHaveBeenCalledWith(mockTransactions);
    });

    it('throws error when wallet is not connected', async () => {
      await service.disconnect();
      await expect(service.signAllTransactions(mockTransactions))
        .rejects.toThrow('Phantom wallet is not connected');
    });

    it('handles signing errors', async () => {
      mockWindow.solana.signAllTransactions.mockRejectedValue(new Error('Signing failed'));
      await expect(service.signAllTransactions(mockTransactions))
        .rejects.toThrow('Signing failed');
    });
  });
}); 