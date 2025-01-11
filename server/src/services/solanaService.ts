import { Connection, PublicKey, Transaction, SystemProgram, Keypair } from '@solana/web3.js';
import { PersistenceService } from './persistenceService';

export interface SolanaTransaction {
  id: string;
  betId: string;
  fromAddress: string;
  toAddress: string;
  amount: number;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  signature?: string;
  timestamp: number;
  blockHeight?: number;
}

export interface SolanaConfig {
  rpcEndpoint: string;
  programId: string;
  treasuryAddress: string;
}

export class SolanaService {
  private connection: Connection;
  private transactions: Map<string, SolanaTransaction> = new Map();
  private readonly persistenceService: PersistenceService;
  private readonly config: SolanaConfig;

  constructor(persistenceService: PersistenceService, config: SolanaConfig) {
    this.persistenceService = persistenceService;
    this.config = config;
    this.connection = new Connection(config.rpcEndpoint, 'confirmed');
    this.loadData();
  }

  private async loadData(): Promise<void> {
    try {
      const savedTransactions = await this.persistenceService.load('solanaTransactions');
      if (savedTransactions) {
        this.transactions = new Map(Object.entries(savedTransactions));
      }
    } catch (error) {
      console.error('Failed to load Solana transaction data:', error);
    }
  }

  private async saveData(): Promise<void> {
    try {
      const transactionsObj = Object.fromEntries(this.transactions);
      await this.persistenceService.save('solanaTransactions', transactionsObj);
    } catch (error) {
      console.error('Failed to save Solana transaction data:', error);
    }
  }

  async createBetTransaction(
    betId: string,
    fromAddress: string,
    amount: number
  ): Promise<SolanaTransaction> {
    const transaction: SolanaTransaction = {
      id: `solana_tx_${Date.now()}`,
      betId,
      fromAddress,
      toAddress: this.config.treasuryAddress,
      amount,
      status: 'PENDING',
      timestamp: Date.now()
    };

    this.transactions.set(transaction.id, transaction);
    await this.saveData();
    return transaction;
  }

  async processBetTransaction(transactionId: string, signedTransaction: Transaction): Promise<void> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) throw new Error('Transaction not found');
    if (transaction.status !== 'PENDING') throw new Error('Transaction already processed');

    try {
      // Send the signed transaction
      const signature = await this.connection.sendRawTransaction(
        signedTransaction.serialize()
      );

      // Wait for confirmation
      const confirmation = await this.connection.confirmTransaction(signature);
      
      if (confirmation.value.err) {
        transaction.status = 'FAILED';
      } else {
        transaction.status = 'CONFIRMED';
        transaction.signature = signature;
        transaction.blockHeight = confirmation.context.slot;
      }
    } catch (error) {
      transaction.status = 'FAILED';
      console.error('Failed to process Solana transaction:', error);
    }

    await this.saveData();
  }

  async createPayoutTransaction(
    betId: string,
    toAddress: string,
    amount: number
  ): Promise<SolanaTransaction> {
    const transaction: SolanaTransaction = {
      id: `solana_payout_${Date.now()}`,
      betId,
      fromAddress: this.config.treasuryAddress,
      toAddress,
      amount,
      status: 'PENDING',
      timestamp: Date.now()
    };

    this.transactions.set(transaction.id, transaction);
    await this.saveData();
    return transaction;
  }

  async processPayoutTransaction(transactionId: string): Promise<void> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) throw new Error('Transaction not found');
    if (transaction.status !== 'PENDING') throw new Error('Transaction already processed');

    try {
      // Create a new transaction
      const treasuryKeypair = Keypair.generate(); // In production, this would be loaded from secure storage
      const toPublicKey = new PublicKey(transaction.toAddress);

      const solanaTransaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: treasuryKeypair.publicKey,
          toPubkey: toPublicKey,
          lamports: transaction.amount
        })
      );

      // Sign and send the transaction
      const signature = await this.connection.sendTransaction(
        solanaTransaction,
        [treasuryKeypair]
      );

      // Wait for confirmation
      const confirmation = await this.connection.confirmTransaction(signature);
      
      if (confirmation.value.err) {
        transaction.status = 'FAILED';
      } else {
        transaction.status = 'CONFIRMED';
        transaction.signature = signature;
        transaction.blockHeight = confirmation.context.slot;
      }
    } catch (error) {
      transaction.status = 'FAILED';
      console.error('Failed to process Solana payout transaction:', error);
    }

    await this.saveData();
  }

  getTransaction(transactionId: string): SolanaTransaction | undefined {
    return this.transactions.get(transactionId);
  }

  getBetTransactions(betId: string): SolanaTransaction[] {
    return Array.from(this.transactions.values())
      .filter(tx => tx.betId === betId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  async getTransactionStatus(signature: string): Promise<'CONFIRMED' | 'FAILED' | 'PENDING'> {
    try {
      const status = await this.connection.getSignatureStatus(signature);
      if (!status || !status.value) return 'PENDING';
      return status.value.err ? 'FAILED' : 'CONFIRMED';
    } catch (error) {
      console.error('Failed to get transaction status:', error);
      return 'FAILED';
    }
  }
} 