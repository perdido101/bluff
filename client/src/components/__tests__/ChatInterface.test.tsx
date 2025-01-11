import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react';
import { ChatInterface } from '../ChatInterface';
import '@testing-library/jest-dom';

const mockMessages = [
  {
    id: '1',
    sender: 'player',
    text: 'Hello!',
    timestamp: Date.now(),
  },
  {
    id: '2',
    sender: 'ai',
    text: 'Hi there!',
    timestamp: Date.now(),
    emotion: '😊',
  },
  {
    id: '3',
    sender: 'player',
    text: 'How are you?',
    timestamp: Date.now(),
    replyTo: '2',
  },
] as const;

describe('ChatInterface', () => {
  const mockOnSendMessage = jest.fn();
  const mockOnTypingStart = jest.fn();
  const mockOnTypingEnd = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders messages correctly', () => {
    render(
      <ChatInterface
        messages={mockMessages}
        onSendMessage={mockOnSendMessage}
        onTypingStart={mockOnTypingStart}
        onTypingEnd={mockOnTypingEnd}
      />
    );

    expect(screen.getByText('Hello!')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
    expect(screen.getByText('How are you?')).toBeInTheDocument();
  });

  it('shows typing indicator for typing messages', () => {
    const typingMessages = [
      ...mockMessages,
      {
        id: '4',
        sender: 'ai',
        text: '',
        timestamp: Date.now(),
        isTyping: true,
      },
    ];

    render(
      <ChatInterface
        messages={typingMessages}
        onSendMessage={mockOnSendMessage}
        onTypingStart={mockOnTypingStart}
        onTypingEnd={mockOnTypingEnd}
      />
    );

    expect(screen.getAllByRole('presentation')).toHaveLength(3); // 3 dots in typing indicator
  });

  it('shows emotion indicators', () => {
    render(
      <ChatInterface
        messages={mockMessages}
        onSendMessage={mockOnSendMessage}
        onTypingStart={mockOnTypingStart}
        onTypingEnd={mockOnTypingEnd}
      />
    );

    const messageWithEmotion = screen.getByText('Hi there!').parentElement;
    expect(messageWithEmotion).toHaveTextContent('😊');
  });

  it('handles message sending', () => {
    render(
      <ChatInterface
        messages={mockMessages}
        onSendMessage={mockOnSendMessage}
        onTypingStart={mockOnTypingStart}
        onTypingEnd={mockOnTypingEnd}
      />
    );

    const input = screen.getByPlaceholderText('Type a message...');
    const sendButton = screen.getByText('Send');

    fireEvent.change(input, { target: { value: 'New message' } });
    fireEvent.click(sendButton);

    expect(mockOnSendMessage).toHaveBeenCalledWith('New message', undefined);
    expect(input).toHaveValue('');
  });

  it('handles message sending with Enter key', () => {
    render(
      <ChatInterface
        messages={mockMessages}
        onSendMessage={mockOnSendMessage}
        onTypingStart={mockOnTypingStart}
        onTypingEnd={mockOnTypingEnd}
      />
    );

    const input = screen.getByPlaceholderText('Type a message...');

    fireEvent.change(input, { target: { value: 'New message' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 13, charCode: 13 });

    expect(mockOnSendMessage).toHaveBeenCalledWith('New message', undefined);
    expect(input).toHaveValue('');
  });

  it('handles typing events', () => {
    render(
      <ChatInterface
        messages={mockMessages}
        onSendMessage={mockOnSendMessage}
        onTypingStart={mockOnTypingStart}
        onTypingEnd={mockOnTypingEnd}
      />
    );

    const input = screen.getByPlaceholderText('Type a message...');

    fireEvent.change(input, { target: { value: 'T' } });
    expect(mockOnTypingStart).toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockOnTypingEnd).toHaveBeenCalled();
  });

  it('handles reply functionality', () => {
    render(
      <ChatInterface
        messages={mockMessages}
        onSendMessage={mockOnSendMessage}
        onTypingStart={mockOnTypingStart}
        onTypingEnd={mockOnTypingEnd}
      />
    );

    const messageToReplyTo = screen.getByText('Hi there!');
    fireEvent.click(messageToReplyTo);

    const input = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(input, { target: { value: 'Reply message' } });
    fireEvent.click(screen.getByText('Send'));

    expect(mockOnSendMessage).toHaveBeenCalledWith('Reply message', '2');
  });

  it('shows reply indicators', () => {
    render(
      <ChatInterface
        messages={mockMessages}
        onSendMessage={mockOnSendMessage}
        onTypingStart={mockOnTypingStart}
        onTypingEnd={mockOnTypingEnd}
      />
    );

    expect(screen.getByText(/Replying to:/)).toBeInTheDocument();
  });

  it('handles emoji picker', () => {
    render(
      <ChatInterface
        messages={mockMessages}
        onSendMessage={mockOnSendMessage}
        onTypingStart={mockOnTypingStart}
        onTypingEnd={mockOnTypingEnd}
      />
    );

    const emojiButton = screen.getByText('😊');
    fireEvent.click(emojiButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  describe('Search functionality', () => {
    it('shows search results when typing in search input', () => {
      render(
        <ChatInterface
          messages={mockMessages}
          onSendMessage={mockOnSendMessage}
          onTypingStart={mockOnTypingStart}
          onTypingEnd={mockOnTypingEnd}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search messages...');
      fireEvent.change(searchInput, { target: { value: 'Hello' } });

      expect(screen.getByText('Hello!')).toBeInTheDocument();
      expect(screen.getByRole('mark')).toHaveTextContent('Hello');
    });

    it('navigates search results with arrow keys', () => {
      const manyMessages = [
        ...mockMessages,
        {
          id: '4',
          sender: 'player',
          text: 'Hello again!',
          timestamp: Date.now(),
        },
      ];

      render(
        <ChatInterface
          messages={manyMessages}
          onSendMessage={mockOnSendMessage}
          onTypingStart={mockOnTypingStart}
          onTypingEnd={mockOnTypingEnd}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search messages...');
      fireEvent.change(searchInput, { target: { value: 'Hello' } });

      const results = screen.getAllByRole('listitem');
      expect(results).toHaveLength(2);

      fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
      expect(results[0]).toHaveStyle({ background: '#3a3a3a' });

      fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
      expect(results[1]).toHaveStyle({ background: '#3a3a3a' });
      expect(results[0]).not.toHaveStyle({ background: '#3a3a3a' });

      fireEvent.keyDown(searchInput, { key: 'ArrowUp' });
      expect(results[0]).toHaveStyle({ background: '#3a3a3a' });
      expect(results[1]).not.toHaveStyle({ background: '#3a3a3a' });
    });

    it('clears search results when clicking a result', () => {
      render(
        <ChatInterface
          messages={mockMessages}
          onSendMessage={mockOnSendMessage}
          onTypingStart={mockOnTypingStart}
          onTypingEnd={mockOnTypingEnd}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search messages...');
      fireEvent.change(searchInput, { target: { value: 'Hello' } });

      const result = screen.getByRole('listitem');
      fireEvent.click(result);

      expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
      expect(searchInput).toHaveValue('');
    });

    it('highlights search matches in results', () => {
      render(
        <ChatInterface
          messages={mockMessages}
          onSendMessage={mockOnSendMessage}
          onTypingStart={mockOnTypingStart}
          onTypingEnd={mockOnTypingEnd}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search messages...');
      fireEvent.change(searchInput, { target: { value: 'Hello' } });

      const mark = screen.getByRole('mark');
      expect(mark).toHaveTextContent('Hello');
      expect(mark).toHaveStyle({ background: '#4a5eff' });
    });

    it('handles empty search results', () => {
      render(
        <ChatInterface
          messages={mockMessages}
          onSendMessage={mockOnSendMessage}
          onTypingStart={mockOnTypingStart}
          onTypingEnd={mockOnTypingEnd}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search messages...');
      fireEvent.change(searchInput, { target: { value: 'xyz123' } });

      expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    });

    it('handles search with special characters', () => {
      const messagesWithSpecialChars = [
        ...mockMessages,
        {
          id: '4',
          sender: 'player',
          text: 'Hello! (test) [123] {abc}',
          timestamp: Date.now(),
        },
      ];

      render(
        <ChatInterface
          messages={messagesWithSpecialChars}
          onSendMessage={mockOnSendMessage}
          onTypingStart={mockOnTypingStart}
          onTypingEnd={mockOnTypingEnd}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search messages...');
      fireEvent.change(searchInput, { target: { value: '(test)' } });

      const mark = screen.getByRole('mark');
      expect(mark).toHaveTextContent('(test)');
    });
  });

  describe('Rich text formatting', () => {
    it('renders formatted text correctly', () => {
      const formattedMessages = [
        {
          id: '1',
          sender: 'player',
          text: '**Bold text** and _italic text_',
          timestamp: Date.now(),
        },
        {
          id: '2',
          sender: 'ai',
          text: '`code block` and __underlined text__',
          timestamp: Date.now(),
        },
      ];

      render(
        <ChatInterface
          messages={formattedMessages}
          onSendMessage={mockOnSendMessage}
          onTypingStart={mockOnTypingStart}
          onTypingEnd={mockOnTypingEnd}
        />
      );

      expect(screen.getByText('Bold text')).toHaveStyle('font-weight: bold');
      expect(screen.getByText('italic text')).toHaveStyle('font-style: italic');
      expect(screen.getByText('code block')).toHaveStyle('font-family: monospace');
      expect(screen.getByText('underlined text')).toHaveStyle('text-decoration: underline');
    });

    it('applies formatting to selected text', () => {
      render(
        <ChatInterface
          messages={mockMessages}
          onSendMessage={mockOnSendMessage}
          onTypingStart={mockOnTypingStart}
          onTypingEnd={mockOnTypingEnd}
        />
      );

      const input = screen.getByPlaceholderText('Type a message...');
      fireEvent.change(input, { target: { value: 'Test message' } });
      
      // Mock text selection
      Object.defineProperty(input, 'selectionStart', { value: 0 });
      Object.defineProperty(input, 'selectionEnd', { value: 4 });

      const boldButton = screen.getByText('B');
      fireEvent.click(boldButton);

      expect(input).toHaveValue('**Test** message');
    });

    it('toggles format buttons active state', () => {
      render(
        <ChatInterface
          messages={mockMessages}
          onSendMessage={mockOnSendMessage}
          onTypingStart={mockOnTypingStart}
          onTypingEnd={mockOnTypingEnd}
        />
      );

      const boldButton = screen.getByText('B');
      fireEvent.click(boldButton);
      expect(boldButton).toHaveStyle('background: #4a5eff');

      fireEvent.click(boldButton);
      expect(boldButton).not.toHaveStyle('background: #4a5eff');
    });

    it('handles nested formatting correctly', () => {
      const nestedMessages = [
        {
          id: '1',
          sender: 'player',
          text: '**Bold _and italic_ text**',
          timestamp: Date.now(),
        },
      ];

      render(
        <ChatInterface
          messages={nestedMessages}
          onSendMessage={mockOnSendMessage}
          onTypingStart={mockOnTypingStart}
          onTypingEnd={mockOnTypingEnd}
        />
      );

      const italicText = screen.getByText('and italic');
      expect(italicText).toHaveStyle('font-style: italic');
      expect(italicText.parentElement).toHaveStyle('font-weight: bold');
    });

    it('preserves cursor position after formatting', () => {
      render(
        <ChatInterface
          messages={mockMessages}
          onSendMessage={mockOnSendMessage}
          onTypingStart={mockOnTypingStart}
          onTypingEnd={mockOnTypingEnd}
        />
      );

      const input = screen.getByPlaceholderText('Type a message...');
      fireEvent.change(input, { target: { value: 'Test message' } });
      
      // Mock text selection and cursor position
      Object.defineProperty(input, 'selectionStart', { value: 5 });
      Object.defineProperty(input, 'selectionEnd', { value: 12 });

      const italicButton = screen.getByText('I');
      fireEvent.click(italicButton);

      expect(input.selectionStart).toBe(6);
      expect(input.selectionEnd).toBe(13);
    });
  });
}); 