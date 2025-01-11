# PlayerHand Component

## Overview
The PlayerHand component manages and displays a collection of cards in a player's hand. It handles card selection, arrangement, and animations for card addition/removal.

## Props

```typescript
interface PlayerHandProps {
  // Card data
  cards: Card[];              // Array of card objects
  isCurrentPlayer: boolean;   // Whether it's this player's turn
  
  // Display options
  faceDown?: boolean;        // Whether cards should be face down
  maxCards?: number;         // Maximum number of cards to display
  
  // Event handlers
  onCardsSelected?: (selectedCards: Card[]) => void;
  onCardHover?: (card: Card) => void;
  
  // Layout options
  layout?: 'horizontal' | 'vertical' | 'fan';
  spacing?: number;          // Space between cards
  
  // Animation options
  animateChanges?: boolean;  // Whether to animate card changes
  
  // Styling
  className?: string;
  style?: React.CSSProperties;
}
```

## Usage

### Basic Usage
```tsx
import { PlayerHand } from '@/components/PlayerHand';

function Example() {
  const cards = [
    { suit: 'hearts', value: 'A' },
    { suit: 'diamonds', value: 'K' }
  ];

  return (
    <PlayerHand
      cards={cards}
      isCurrentPlayer={true}
      onCardsSelected={(cards) => console.log('Selected cards:', cards)}
    />
  );
}
```

### Face Down Cards
```tsx
<PlayerHand
  cards={cards}
  isCurrentPlayer={false}
  faceDown={true}
  layout="horizontal"
/>
```

### With Custom Layout
```tsx
<PlayerHand
  cards={cards}
  layout="fan"
  spacing={30}
  style={{ height: '200px' }}
/>
```

## Styling

The component uses styled-components for layout and animations:

```typescript
const HandContainer = styled.div<{ layout: string }>`
  display: flex;
  flex-direction: ${props => props.layout === 'vertical' ? 'column' : 'row'};
  position: relative;
  padding: 20px;
  min-height: 160px;
  
  ${props => props.layout === 'fan' && css`
    transform-origin: bottom center;
    transform: perspective(1000px) rotateX(30deg);
  `}
`;

const CardWrapper = styled.div<{ index: number; total: number; spacing: number }>`
  position: absolute;
  transform: ${props => calculateCardPosition(props)};
  transition: transform 0.3s ease;
  z-index: ${props => props.index};
`;
```

## Card Selection Logic

```typescript
function PlayerHand({ cards, onCardsSelected }) {
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);

  const handleCardClick = (card: Card) => {
    setSelectedCards(prev => {
      const newSelection = prev.includes(card)
        ? prev.filter(c => c !== card)
        : [...prev, card];
      
      onCardsSelected?.(newSelection);
      return newSelection;
    });
  };

  return (
    <HandContainer>
      {cards.map((card, index) => (
        <CardWrapper
          key={`${card.suit}-${card.value}`}
          index={index}
          total={cards.length}
        >
          <Card
            {...card}
            selected={selectedCards.includes(card)}
            onClick={() => handleCardClick(card)}
          />
        </CardWrapper>
      ))}
    </HandContainer>
  );
}
```

## Animations

The component includes animations for:
- Adding/removing cards
- Selecting cards
- Rearranging cards
- Dealing animations

```typescript
const cardAnimations = {
  enter: {
    initial: { scale: 0, y: -100 },
    animate: { scale: 1, y: 0 },
    transition: { type: 'spring', stiffness: 200 }
  },
  exit: {
    initial: { scale: 1 },
    animate: { scale: 0, y: 100 },
    transition: { duration: 0.2 }
  }
};
```

## Accessibility

The component implements:
- Keyboard navigation between cards
- ARIA labels for hand state
- Screen reader announcements for changes
- Focus management

```tsx
<HandContainer
  role="group"
  aria-label={`Player's hand with ${cards.length} cards`}
  aria-live="polite"
>
  {/* Cards */}
</HandContainer>
```

## Performance Considerations

1. **Card Rendering**
   - Uses virtualization for large hands
   - Memoizes card components
   - Optimizes transform calculations

2. **Selection Management**
   - Efficient selection tracking
   - Debounced selection callbacks
   - Optimized re-renders

3. **Animation Performance**
   - Hardware-accelerated transforms
   - Batched animation updates
   - RAF-based animations

## Testing

```typescript
describe('PlayerHand', () => {
  const mockCards = [
    { suit: 'hearts', value: 'A' },
    { suit: 'diamonds', value: 'K' }
  ];

  it('renders all cards', () => {
    render(<PlayerHand cards={mockCards} isCurrentPlayer={true} />);
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('handles card selection', () => {
    const onCardsSelected = jest.fn();
    render(
      <PlayerHand
        cards={mockCards}
        isCurrentPlayer={true}
        onCardsSelected={onCardsSelected}
      />
    );

    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(onCardsSelected).toHaveBeenCalledWith([mockCards[0]]);
  });

  it('applies correct layout', () => {
    render(<PlayerHand cards={mockCards} layout="fan" spacing={30} />);
    const container = screen.getByRole('group');
    expect(container).toHaveStyle({ transform: expect.stringContaining('perspective') });
  });
});
```

## Examples

### Interactive Hand
```tsx
function GameHandExample() {
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [cards, setCards] = useState(initialCards);

  const handleCardsSelected = (selected: Card[]) => {
    setSelectedCards(selected);
  };

  const playSelectedCards = () => {
    setCards(prev => prev.filter(card => !selectedCards.includes(card)));
    setSelectedCards([]);
  };

  return (
    <div>
      <PlayerHand
        cards={cards}
        isCurrentPlayer={true}
        onCardsSelected={handleCardsSelected}
        animateChanges={true}
      />
      <button
        onClick={playSelectedCards}
        disabled={selectedCards.length === 0}
      >
        Play Selected Cards
      </button>
    </div>
  );
}
```

## Related Components

- [Card](./Card.md) - Individual card component
- [GameBoard](./GameBoard.md) - Parent game board component
- [HandActions](./HandActions.md) - Actions for selected cards 