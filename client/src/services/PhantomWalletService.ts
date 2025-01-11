import { PublicKey, Transaction } from '@solana/web3.js';

declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      connect: () => Promise<{ publicKey: PublicKey }>;
      disconnect: () => Promise<void>;
      signTransaction: (transaction: Transaction) => Promise<Transaction>;
      signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
      publicKey: PublicKey | null;
    };
  }
}

export class PhantomWalletService {
  private static instance: PhantomWalletService;
  private _isConnected: boolean = false;
  private _publicKey: string | null = null;

  private constructor() {
    // Initialize connection state if wallet was previously connected
    if (window.solana?.isPhantom) {
      this._isConnected = window.solana.publicKey !== null;
      this._publicKey = window.solana.publicKey?.toString() || null;
    }
  }

  static getInstance(): PhantomWalletService {
    if (!PhantomWalletService.instance) {
      PhantomWalletService.instance = new PhantomWalletService();
    }
    return PhantomWalletService.instance;
  }

  get isPhantomInstalled(): boolean {
    return window.solana?.isPhantom || false;
  }

  get isConnected(): boolean {
    return this._isConnected;
  }

  get publicKey(): string | null {
    return this._publicKey;
  }

  async connect(): Promise<string> {
    if (!this.isPhantomInstalled) {
      throw new Error('Phantom wallet is not installed');
    }

    try {
      const response = await window.solana!.connect();
      this._isConnected = true;
      this._publicKey = response.publicKey.toString();
      return this._publicKey;
    } catch (error) {
      console.error('Failed to connect to Phantom wallet:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isPhantomInstalled || !this.isConnected) {
      return;
    }

    try {
      await window.solana!.disconnect();
      this._isConnected = false;
      this._publicKey = null;
    } catch (error) {
      console.error('Failed to disconnect from Phantom wallet:', error);
      throw error;
    }
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!this.isPhantomInstalled || !this.isConnected) {
      throw new Error('Phantom wallet is not connected');
    }

    try {
      return await window.solana!.signTransaction(transaction);
    } catch (error) {
      console.error('Failed to sign transaction:', error);
      throw error;
    }
  }

  async signAllTransactions(transactions: Transaction[]): Promise<Transaction[]> {
    if (!this.isPhantomInstalled || !this.isConnected) {
      throw new Error('Phantom wallet is not connected');
    }

    try {
      return await window.solana!.signAllTransactions(transactions);
    } catch (error) {
      console.error('Failed to sign transactions:', error);
      throw error;
    }
  }
} 