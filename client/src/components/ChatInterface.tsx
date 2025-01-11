import React, { useState, useRef, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import EmojiPicker from 'emoji-picker-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  sender: 'player' | 'ai';
  text: string;
  timestamp: number;
  emotion?: string;
  isTyping?: boolean;
  isAnimating?: boolean;
  replyTo?: string;
}

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string, replyTo?: string) => void;
  onTypingStart?: () => void;
  onTypingEnd?: () => void;
  className?: string;
}

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 400px;
  width: 300px;
  background: #1a1a1a;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column-reverse;
  gap: 8px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #2a2a2a;
  }

  &::-webkit-scrollbar-thumb {
    background: #4a4a4a;
    border-radius: 3px;
  }
`;

const MessageBubble = styled.div<{
  isPlayer: boolean;
  isAnimating?: boolean;
  emotion?: string;
}>`
  max-width: 80%;
  padding: 8px 12px;
  border-radius: 12px;
  background: ${props => props.isPlayer ? '#4a5eff' : '#2a2a2a'};
  color: ${props => props.isPlayer ? '#ffffff' : '#e0e0e0'};
  align-self: ${props => props.isPlayer ? 'flex-end' : 'flex-start'};
  animation: ${props => props.isAnimating ? bounce : fadeIn} 0.3s ease;
  position: relative;
  margin-bottom: 4px;

  ${props => props.emotion && `
    &::before {
      content: '${props.emotion}';
      position: absolute;
      top: -20px;
      ${props.isPlayer ? 'right: 8px;' : 'left: 8px;'}
      font-size: 16px;
    }
  `}
`;

const TypingIndicator = styled.div`
  display: flex;
  gap: 4px;
  padding: 8px;
  
  span {
    width: 8px;
    height: 8px;
    background: #4a4a4a;
    border-radius: 50%;
    animation: ${bounce} 0.8s infinite;
    
    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
`;

const InputArea = styled.div`
  display: flex;
  gap: 8px;
  padding: 12px;
  background: #2a2a2a;
  position: relative;
`;

const Input = styled.input`
  flex: 1;
  padding: 8px 12px;
  border-radius: 20px;
  border: none;
  background: #3a3a3a;
  color: #ffffff;
  outline: none;
  
  &:focus {
    box-shadow: 0 0 0 2px #4a5eff;
  }
`;

const SendButton = styled.button`
  padding: 8px 16px;
  border-radius: 20px;
  border: none;
  background: #4a5eff;
  color: #ffffff;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #3a4eff;
  }
  
  &:disabled {
    background: #2a2a2a;
    cursor: not-allowed;
  }
`;

const EmojiButton = styled.button`
  padding: 8px;
  background: none;
  border: none;
  color: #ffffff;
  cursor: pointer;
  font-size: 20px;
  
  &:hover {
    opacity: 0.8;
  }
`;

const EmojiPickerContainer = styled.div`
  position: absolute;
  bottom: 100%;
  right: 12px;
  z-index: 1000;
`;

const ReplyIndicator = styled.div`
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
  padding: 4px 8px;
  background: #222;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    background: #333;
  }
`;

const SearchContainer = styled.div`
  padding: 8px 12px;
  background: #2a2a2a;
  border-bottom: 1px solid #3a3a3a;
`;

const SearchInput = styled(Input)`
  width: 100%;
  background: #3a3a3a;
  padding-left: 32px;
  position: relative;
`;

const SearchIcon = styled.span`
  position: absolute;
  left: 24px;
  top: 50%;
  transform: translateY(-50%);
  color: #888;
  z-index: 1;
`;

const SearchResults = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #2a2a2a;
  border-radius: 0 0 12px 12px;
  max-height: 200px;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 1000;
`;

const SearchResultItem = styled.div<{ isHighlighted: boolean }>`
  padding: 8px 12px;
  cursor: pointer;
  background: ${props => props.isHighlighted ? '#3a3a3a' : 'transparent'};
  
  &:hover {
    background: #3a3a3a;
  }
  
  mark {
    background: #4a5eff;
    color: white;
    padding: 0 2px;
    border-radius: 2px;
  }
`;

const FormattingToolbar = styled.div`
  display: flex;
  gap: 4px;
  padding: 4px 8px;
  background: #2a2a2a;
  border-top: 1px solid #3a3a3a;
`;

const FormatButton = styled.button<{ isActive?: boolean }>`
  padding: 4px 8px;
  background: ${props => props.isActive ? '#4a5eff' : 'transparent'};
  border: 1px solid ${props => props.isActive ? '#4a5eff' : '#3a3a3a'};
  border-radius: 4px;
  color: #ffffff;
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    background: ${props => props.isActive ? '#3a4eff' : '#3a3a3a'};
  }
`;

const MessageContent = styled.div`
  p {
    margin: 0;
  }
  
  code {
    background: #1a1a1a;
    padding: 2px 4px;
    border-radius: 4px;
    font-family: monospace;
  }
  
  pre {
    background: #1a1a1a;
    padding: 8px;
    border-radius: 4px;
    overflow-x: auto;
    
    code {
      background: none;
      padding: 0;
    }
  }
`;

interface FormatAction {
  type: 'bold' | 'italic' | 'underline' | 'code';
  prefix: string;
  suffix: string;
}

const formatActions: Record<string, FormatAction> = {
  bold: { type: 'bold', prefix: '**', suffix: '**' },
  italic: { type: 'italic', prefix: '_', suffix: '_' },
  underline: { type: 'underline', prefix: '__', suffix: '__' },
  code: { type: 'code', prefix: '`', suffix: '`' },
};

interface SearchResult {
  messageId: string;
  text: string;
  matchStart: number;
  matchEnd: number;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  onTypingStart,
  onTypingEnd,
  className
}) => {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | undefined>();
  const [isTyping, setIsTyping] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      onTypingStart?.();
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTypingEnd?.();
    }, 1000);
  };

  const handleSendMessage = () => {
    if (inputText.trim()) {
      onSendMessage(inputText.trim(), replyingTo);
      setInputText('');
      setReplyingTo(undefined);
      setShowEmojiPicker(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiClick = (emojiData: any) => {
    setInputText(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleReply = (messageId: string) => {
    setReplyingTo(messageId);
    inputRef.current?.focus();
  };

  const handleSearch = (query: string) => {
    setSearchText(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const results: SearchResult[] = [];
    const searchRegex = new RegExp(query, 'gi');

    messages.forEach(message => {
      let match;
      while ((match = searchRegex.exec(message.text)) !== null) {
        results.push({
          messageId: message.id,
          text: message.text,
          matchStart: match.index,
          matchEnd: match.index + query.length
        });
      }
    });

    setSearchResults(results);
    setSelectedResultIndex(-1);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedResultIndex(prev => 
        prev < searchResults.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedResultIndex(prev => prev > 0 ? prev - 1 : prev);
    } else if (e.key === 'Enter' && selectedResultIndex >= 0) {
      e.preventDefault();
      const result = searchResults[selectedResultIndex];
      handleSearchResultClick(result);
    }
  };

  const handleSearchResultClick = (result: SearchResult) => {
    const messageElement = document.getElementById(`message-${result.messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      messageElement.classList.add('highlight');
      setTimeout(() => messageElement.classList.remove('highlight'), 2000);
    }
    setSearchResults([]);
    setSearchText('');
  };

  const highlightSearchResult = (text: string, result: SearchResult) => {
    const before = text.slice(0, result.matchStart);
    const match = text.slice(result.matchStart, result.matchEnd);
    const after = text.slice(result.matchEnd);
    return (
      <>
        {before}<mark>{match}</mark>{after}
      </>
    );
  };

  const applyFormat = (format: FormatAction) => {
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = inputText;

    const beforeText = text.substring(0, start);
    const selectedText = text.substring(start, end);
    const afterText = text.substring(end);

    const newText = `${beforeText}${format.prefix}${selectedText}${format.suffix}${afterText}`;
    setInputText(newText);

    // Restore cursor position
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(
        start + format.prefix.length,
        end + format.prefix.length
      );
    });
  };

  const renderMessageContent = (text: string) => (
    <MessageContent>
      <ReactMarkdown>{text}</ReactMarkdown>
    </MessageContent>
  );

  return (
    <Container className={className}>
      <SearchContainer>
        <SearchIcon>🔍</SearchIcon>
        <SearchInput
          ref={searchInputRef}
          value={searchText}
          onChange={e => handleSearch(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search messages..."
        />
        {searchResults.length > 0 && (
          <SearchResults>
            {searchResults.map((result, index) => (
              <SearchResultItem
                key={`${result.messageId}-${index}`}
                isHighlighted={index === selectedResultIndex}
                onClick={() => handleSearchResultClick(result)}
              >
                {highlightSearchResult(result.text, result)}
              </SearchResultItem>
            ))}
          </SearchResults>
        )}
      </SearchContainer>

      <MessageList>
        {messages.map(message => (
          <div key={message.id} id={`message-${message.id}`}>
            {message.replyTo && (
              <ReplyIndicator onClick={() => handleReply(message.replyTo!)}>
                Replying to: {messages.find(m => m.id === message.replyTo)?.text.slice(0, 30)}...
              </ReplyIndicator>
            )}
            {message.isTyping ? (
              <TypingIndicator>
                <span />
                <span />
                <span />
              </TypingIndicator>
            ) : (
              <MessageBubble
                isPlayer={message.sender === 'player'}
                isAnimating={message.isAnimating}
                emotion={message.emotion}
                onClick={() => handleReply(message.id)}
              >
                {renderMessageContent(message.text)}
              </MessageBubble>
            )}
          </div>
        ))}
      </MessageList>

      <FormattingToolbar>
        {Object.entries(formatActions).map(([key, action]) => (
          <FormatButton
            key={key}
            isActive={selectedFormat === key}
            onClick={() => {
              applyFormat(action);
              setSelectedFormat(selectedFormat === key ? null : key);
            }}
          >
            {action.type === 'bold' && 'B'}
            {action.type === 'italic' && 'I'}
            {action.type === 'underline' && 'U'}
            {action.type === 'code' && '</>'}
          </FormatButton>
        ))}
      </FormattingToolbar>

      <InputArea>
        {replyingTo && (
          <ReplyIndicator onClick={() => setReplyingTo(undefined)}>
            Reply to: {messages.find(m => m.id === replyingTo)?.text.slice(0, 20)}...
            {' '}(click to cancel)
          </ReplyIndicator>
        )}
        
        <EmojiButton onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
          😊
        </EmojiButton>
        
        {showEmojiPicker && (
          <EmojiPickerContainer>
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </EmojiPickerContainer>
        )}
        
        <Input
          ref={inputRef}
          value={inputText}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
        />
        
        <SendButton
          onClick={handleSendMessage}
          disabled={!inputText.trim()}
        >
          Send
        </SendButton>
      </InputArea>
    </Container>
  );
}; 