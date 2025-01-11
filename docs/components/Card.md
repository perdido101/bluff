# Card Component

## Overview
The Card component represents a playing card in the game. It supports both face-up and face-down states, selection states, and animations for various game actions.

## Props

```typescript
interface CardProps {
  // Card data
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  value: '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
  
  // Display states
  faceDown?: boolean;       // Whether the card is face down
  selected?: boolean;       // Whether the card is selected
  disabled?: boolean;       // Whether the card is interactive
  
  // Event handlers
  onClick?: (event: React.MouseEvent) => void;
  onHover?: (event: React.MouseEvent) => void;
  
  // Animation props
  animate?: boolean;        // Whether to animate the card
  animationType?: 'flip' | 'deal' | 'collect';
  
  // Styling
  className?: string;
  style?: React.CSSProperties;
}
```

## Usage

### Basic Usage
```tsx
import { Card } from '@/components/Card';

function Example() {
  return (
    <Card
      suit="hearts"
      value="A"
      onClick={() => console.log('Card clicked')}
    />
  );
}
```

### Face Down Card
```tsx
<Card
  suit="hearts"
  value="A"
  faceDown={true}
/>
```

### Selected State
```tsx
<Card
  suit="diamonds"
  value="K"
  selected={true}
/>
```

### With Animation
```tsx
<Card
  suit="clubs"
  value="Q"
  animate={true}
  animationType="flip"
/>
```

## Styling

The component uses styled-components for styling:

```typescript
const CardContainer = styled.div<{ selected: boolean; disabled: boolean }>`
  position: relative;
  width: 100px;
  height: 140px;
  border-radius: 8px;
  background-color: ${props => props.selected ? '#e6e6e6' : 'white'};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
  cursor: ${props => props.disabled ? 'default' : 'pointer'};
  
  &:hover {
    transform: ${props => props.disabled ? 'none' : 'translateY(-5px)'};
  }
`;
```

## Animations

The component supports several animations using Framer Motion:

```typescript
const animations = {
  flip: {
    initial: { rotateY: 0 },
    animate: { rotateY: 180 },
    transition: { duration: 0.6 }
  },
  deal: {
    initial: { x: -300, y: -200 },
    animate: { x: 0, y: 0 },
    transition: { type: 'spring', stiffness: 100 }
  },
  collect: {
    initial: { scale: 1 },
    animate: { scale: 0 },
    transition: { duration: 0.3 }
  }
};
```

## Accessibility

The component implements several accessibility features:

- Keyboard navigation support
- ARIA labels for card values
- Color contrast for card suits
- Screen reader descriptions

```tsx
<CardContainer
  role="button"
  aria-label={`${value} of ${suit}`}
  tabIndex={disabled ? -1 : 0}
  onKeyPress={handleKeyPress}
>
  {/* Card content */}
</CardContainer>
```

## Performance Considerations

1. **Memoization**
   - Component is memoized using React.memo
   - Event handlers are memoized using useCallback

2. **Rendering Optimization**
   - Uses CSS transforms for animations
   - Implements shouldComponentUpdate for complex states

3. **Asset Loading**
   - Card images are preloaded
   - SVG icons for suits are inlined

## Testing

```typescript
describe('Card', () => {
  it('renders face up card correctly', () => {
    render(<Card suit="hearts" value="A" />);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByTestId('suit-icon')).toHaveAttribute('data-suit', 'hearts');
  });

  it('handles click events', () => {
    const onClick = jest.fn();
    render(<Card suit="hearts" value="A" onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });

  it('applies selected styles', () => {
    render(<Card suit="hearts" value="A" selected />);
    expect(screen.getByRole('button')).toHaveStyle({
      backgroundColor: '#e6e6e6'
    });
  });
});
```

## Examples

### Card in a Game Context
```tsx
function GameExample() {
  const [selected, setSelected] = useState(false);
  const [faceDown, setFaceDown] = useState(true);

  const handleClick = () => {
    setSelected(!selected);
  };

  const handleReveal = () => {
    setFaceDown(false);
  };

  return (
    <Card
      suit="hearts"
      value="A"
      selected={selected}
      faceDown={faceDown}
      onClick={handleClick}
      onHover={handleReveal}
      animate={true}
      animationType="flip"
    />
  );
}
```

## Related Components

- [PlayerHand](./PlayerHand.md) - Container for multiple cards
- [CardPile](./CardPile.md) - Displays a stack of cards
- [CardAnimation](./CardAnimation.md) - Reusable card animations 