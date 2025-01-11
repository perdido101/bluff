# GameBoard Component

## Overview
The GameBoard component serves as the main game interface, managing the overall game state, player interactions, and AI opponent moves. It coordinates between PlayerHand components, displays game status, and handles all game actions.

## Props

```typescript
interface GameBoardProps {
  // Game state
  gameState: GameState;
  playerId: string;
  
  // Event handlers
  onAction: (action: GameAction) => void;
  onGameEnd?: (winner: string) => void;
  
  // Display options
  showAIHand?: boolean;
  enableAnimations?: boolean;
  
  // Customization
  theme?: 'light' | 'dark';
  className?: string;
  style?: React.CSSProperties;
}
```

## Usage

### Basic Usage
```tsx
import { GameBoard } from '@/components/GameBoard';

function Example() {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  
  const handleAction = (action: GameAction) => {
    // Process game action
    console.log('Game action:', action);
  };

  return (
    <GameBoard
      gameState={gameState}
      playerId="player1"
      onAction={handleAction}
    />
  );
}
```

### With Custom Theme
```tsx
<GameBoard
  gameState={gameState}
  playerId="player1"
  onAction={handleAction}
  theme="dark"
  enableAnimations={true}
/>
```

## Styling

The component uses styled-components for layout and theming:

```typescript
const BoardContainer = styled.div<{ theme: 'light' | 'dark' }>`
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
  background-color: ${props => props.theme === 'dark' ? '#2c3e50' : '#ecf0f1'};
  padding: 20px;
`;

const GameArea = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 20px;
  position: relative;
`;

const ActionArea = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
  padding: 10px;
`;
``` 

## Game State Management

The GameBoard component manages several aspects of the game state:

```typescript
function GameBoard({ gameState, playerId, onAction }: GameBoardProps) {
  // Track selected cards
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  
  // Track declared value for plays
  const [declaredValue, setDeclaredValue] = useState<string>('');
  
  // Track ongoing animations
  const [animatingAction, setAnimatingAction] = useState<string | null>(null);
  
  // Handle game state updates
  useEffect(() => {
    if (gameState.lastMove) {
      setAnimatingAction(gameState.lastMove.type);
      setTimeout(() => setAnimatingAction(null), 1000);
    }
  }, [gameState.lastMove]);

  // Reset selection when turn changes
  useEffect(() => {
    if (gameState.currentPlayer !== playerId) {
      setSelectedCards([]);
      setDeclaredValue('');
    }
  }, [gameState.currentPlayer, playerId]);
}
```

## Action Handling

The component handles various game actions:

```typescript
const handleCardSelection = (cards: Card[]) => {
  if (gameState.currentPlayer === playerId) {
    setSelectedCards(cards);
  }
};

const handlePlayCards = () => {
  if (selectedCards.length > 0 && declaredValue) {
    onAction({
      type: 'PLAY_CARDS',
      playerId,
      payload: {
        cards: selectedCards,
        declaredValue
      }
    });
    setSelectedCards([]);
    setDeclaredValue('');
  }
};

const handleChallenge = () => {
  if (gameState.lastMove) {
    onAction({
      type: 'CHALLENGE',
      playerId
    });
  }
};

const handlePass = () => {
  onAction({
    type: 'PASS',
    playerId
  });
};
```

## Game Flow Control

The component manages the game flow through conditional rendering and state checks:

```typescript
return (
  <BoardContainer theme={theme}>
    {/* Opponent's hand */}
    <PlayerHand
      cards={gameState.players.find(p => p.id !== playerId)?.hand || []}
      isCurrentPlayer={false}
      faceDown={!showAIHand}
    />
    
    {/* Game information */}
    <GameArea>
      <GameInfo
        lastMove={gameState.lastMove}
        currentPlayer={gameState.currentPlayer}
        isPlayerTurn={gameState.currentPlayer === playerId}
      />
      
      {/* Action buttons */}
      <ActionArea>
        <Button
          onClick={handlePlayCards}
          disabled={!selectedCards.length || !declaredValue}
        >
          Play Cards
        </Button>
        <Button
          onClick={handleChallenge}
          disabled={!gameState.lastMove}
        >
          Challenge
        </Button>
        <Button onClick={handlePass}>
          Pass
        </Button>
      </ActionArea>
    </GameArea>
    
    {/* Player's hand */}
    <PlayerHand
      cards={gameState.players.find(p => p.id === playerId)?.hand || []}
      isCurrentPlayer={gameState.currentPlayer === playerId}
      onCardsSelected={handleCardSelection}
      selectedCards={selectedCards}
    />
  </BoardContainer>
);
``` 

## Accessibility

The GameBoard component implements comprehensive accessibility features:

### ARIA Roles and Labels
```tsx
<BoardContainer
  role="main"
  aria-label="Game Board"
  aria-live="polite"
>
  {/* Game status announcements */}
  <div role="status" aria-live="assertive">
    {gameState.currentPlayer === playerId 
      ? "It's your turn" 
      : "Waiting for opponent"}
  </div>
  
  {/* Action buttons with descriptive labels */}
  <Button
    aria-label={`Play ${selectedCards.length} selected cards as ${declaredValue}`}
    disabled={!selectedCards.length || !declaredValue}
  >
    Play Cards
  </Button>
</BoardContainer>
```

### Keyboard Navigation
- Tab order follows logical game flow
- Keyboard shortcuts for common actions:
  - Space/Enter to select cards
  - P to play selected cards
  - C to challenge
  - Tab to pass

### Screen Reader Considerations
- Announces turn changes
- Describes card selections
- Provides context for game actions
- Indicates game status changes

## Performance Considerations

### State Management
```typescript
// Memoize handlers to prevent unnecessary re-renders
const handleCardSelection = useCallback((cards: Card[]) => {
  if (gameState.currentPlayer === playerId) {
    setSelectedCards(cards);
  }
}, [gameState.currentPlayer, playerId]);

// Memoize derived state
const currentPlayerHand = useMemo(() => 
  gameState.players.find(p => p.id === playerId)?.hand || [],
  [gameState.players, playerId]
);
```

### Render Optimization
1. Component splitting for targeted updates
2. Use of React.memo for child components
3. Efficient state updates using reducers
4. Debounced event handlers for frequent updates

### Animation Performance
1. Use of CSS transforms for smooth animations
2. RequestAnimationFrame for complex animations
3. Hardware acceleration for moving elements
4. Cleanup of animation timers

## Testing

```typescript
describe('GameBoard', () => {
  const mockGameState = {
    players: [
      { id: 'player1', hand: [{ suit: 'hearts', value: 'A' }] },
      { id: 'player2', hand: [{ suit: 'diamonds', value: 'K' }] }
    ],
    currentPlayer: 'player1',
    lastMove: null,
    pile: [],
    status: 'playing'
  };

  it('renders initial game state correctly', () => {
    render(
      <GameBoard
        gameState={mockGameState}
        playerId="player1"
        onAction={jest.fn()}
      />
    );
    
    expect(screen.getByText("It's your turn")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /play cards/i })).toBeDisabled();
  });

  it('handles card selection', () => {
    const { container } = render(
      <GameBoard
        gameState={mockGameState}
        playerId="player1"
        onAction={jest.fn()}
      />
    );
    
    const card = container.querySelector('[data-testid="card"]');
    fireEvent.click(card);
    
    expect(screen.getByRole('button', { name: /play cards/i })).toBeEnabled();
  });

  it('processes game actions', () => {
    const onAction = jest.fn();
    render(
      <GameBoard
        gameState={mockGameState}
        playerId="player1"
        onAction={onAction}
      />
    );
    
    // Select and play cards
    const card = screen.getByTestId('card');
    fireEvent.click(card);
    fireEvent.click(screen.getByRole('button', { name: /play cards/i }));
    
    expect(onAction).toHaveBeenCalledWith({
      type: 'PLAY_CARDS',
      playerId: 'player1',
      payload: expect.any(Object)
    });
  });
});
```

## Examples

### Complete Game Setup
```tsx
function Game() {
  const [gameState, setGameState] = useState(initialGameState);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const handleAction = (action: GameAction) => {
    // Process game action and update state
    const newState = processGameAction(gameState, action);
    setGameState(newState);
  };

  const handleGameEnd = (winner: string) => {
    console.log(`Game ended. Winner: ${winner}`);
  };

  return (
    <div>
      <ThemeToggle onChange={setTheme} />
      <GameBoard
        gameState={gameState}
        playerId="player1"
        onAction={handleAction}
        onGameEnd={handleGameEnd}
        theme={theme}
        enableAnimations={true}
      />
    </div>
  );
}
```

## Related Components

- [PlayerHand](./PlayerHand.md) - Manages the display of player's cards
- [Card](./Card.md) - Individual card component
- [GameInfo](./GameInfo.md) - Displays game status and last move
- [Button](./Button.md) - Action buttons used in the game