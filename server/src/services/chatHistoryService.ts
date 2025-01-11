import { GameState } from '../types';

interface ChatMessage {
  id: string;
  sender: 'player' | 'ai';
  text: string;
  timestamp: number;
  replyTo?: string;
  emotion?: string;
  isTyping?: boolean;
  isAnimating?: boolean;
}

interface ChatThread {
  messages: ChatMessage[];
  context: {
    gameState: GameState;
    lastAction?: string;
  };
}

export class ChatHistoryService {
  private messages: ChatMessage[] = [];
  private threads: Map<string, ChatThread> = new Map();
  private readonly MAX_HISTORY = 100;
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor() {}

  addMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
    const newMessage: ChatMessage = {
      ...message,
      id: this.generateMessageId(),
      timestamp: Date.now()
    };

    this.messages.push(newMessage);
    this.trimHistory();

    // If message is a reply, update thread
    if (message.replyTo) {
      this.updateThread(message.replyTo, newMessage);
    }

    return newMessage;
  }

  setTypingIndicator(sender: 'player' | 'ai', duration: number = 2000): void {
    const typingMessage = this.addMessage({
      sender,
      text: '...',
      isTyping: true
    });

    // Clear any existing typing indicator for this sender
    const existingTimeout = this.typingTimeouts.get(sender);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set timeout to remove typing indicator
    const timeout = setTimeout(() => {
      this.removeMessage(typingMessage.id);
      this.typingTimeouts.delete(sender);
    }, duration);

    this.typingTimeouts.set(sender, timeout);
  }

  getMessages(limit: number = 10, beforeId?: string): ChatMessage[] {
    let messages = [...this.messages];
    
    if (beforeId) {
      const index = messages.findIndex(m => m.id === beforeId);
      if (index !== -1) {
        messages = messages.slice(0, index);
      }
    }

    return messages.slice(-limit).filter(m => !m.isTyping);
  }

  getThread(messageId: string): ChatThread | undefined {
    return this.threads.get(messageId);
  }

  setMessageEmotion(messageId: string, emotion: string): void {
    const message = this.messages.find(m => m.id === messageId);
    if (message) {
      message.emotion = emotion;
    }
  }

  animateMessage(messageId: string, duration: number = 1000): void {
    const message = this.messages.find(m => m.id === messageId);
    if (message) {
      message.isAnimating = true;
      setTimeout(() => {
        message.isAnimating = false;
      }, duration);
    }
  }

  clearTypingIndicators(): void {
    // Clear all typing timeouts
    this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
    this.typingTimeouts.clear();

    // Remove typing messages
    this.messages = this.messages.filter(m => !m.isTyping);
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private trimHistory(): void {
    if (this.messages.length > this.MAX_HISTORY) {
      const excess = this.messages.length - this.MAX_HISTORY;
      const removedMessages = this.messages.splice(0, excess);
      
      // Clean up threads for removed messages
      removedMessages.forEach(message => {
        this.threads.delete(message.id);
      });
    }
  }

  private updateThread(parentId: string, newMessage: ChatMessage): void {
    let thread = this.threads.get(parentId);
    
    if (!thread) {
      thread = {
        messages: [],
        context: {
          gameState: {} as GameState // Will be updated when context is available
        }
      };
      this.threads.set(parentId, thread);
    }

    thread.messages.push(newMessage);
  }

  removeMessage(messageId: string): void {
    const index = this.messages.findIndex(m => m.id === messageId);
    if (index !== -1) {
      this.messages.splice(index, 1);
      this.threads.delete(messageId);
    }
  }

  updateGameContext(messageId: string, gameState: GameState, lastAction?: string): void {
    const thread = this.threads.get(messageId);
    if (thread) {
      thread.context = {
        gameState,
        lastAction
      };
    }
  }

  getMessageContext(messageId: string): GameState | undefined {
    const thread = this.threads.get(messageId);
    return thread?.context.gameState;
  }
} 