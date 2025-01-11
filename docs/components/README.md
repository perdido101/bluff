# Component Documentation

## Overview
This directory contains comprehensive documentation for all React components used in the Bluff AI game. Each component is documented with its props, usage examples, and design considerations.

## Component Structure

```
src/
└── components/
    ├── Card/             # Card display component
    ├── PlayerHand/       # Player's card hand component
    ├── GameBoard/        # Main game board component
    ├── common/           # Shared components
    └── ui/               # UI components
```

## Core Components

### Game Components
- [Card](./Card.md) - Individual card display
- [PlayerHand](./PlayerHand.md) - Player's hand of cards
- [GameBoard](./GameBoard.md) - Main game board

### Common Components
- Button
- Modal
- Tooltip
- Loading Spinner

### UI Components
- Header
- Footer
- Menu
- Notifications

## Component Guidelines

### Props Interface
All components should have well-defined prop interfaces:
```typescript
interface ComponentProps {
  // Required props
  requiredProp: string;
  // Optional props with default values
  optionalProp?: number;
}
```

### State Management
Components should:
- Use local state for UI-only concerns
- Use global state (via context/redux) for game state
- Document state dependencies

### Styling
Components use styled-components with:
- Theme-based styling
- Responsive design
- Accessibility considerations

### Testing
Each component should have:
- Unit tests
- Integration tests where needed
- Accessibility tests
- Snapshot tests

## Usage Examples

### Basic Component Usage
```tsx
import { Card } from '@/components/Card';

function Example() {
  return (
    <Card
      suit="hearts"
      value="A"
      faceUp={true}
      onClick={() => console.log('Card clicked')}
    />
  );
}
```

### Component Composition
```tsx
import { PlayerHand } from '@/components/PlayerHand';
import { Card } from '@/components/Card';

function Example() {
  const cards = [
    { suit: 'hearts', value: 'A' },
    { suit: 'diamonds', value: 'K' }
  ];

  return (
    <PlayerHand>
      {cards.map((card, index) => (
        <Card key={index} {...card} />
      ))}
    </PlayerHand>
  );
}
```

## Best Practices

1. **Component Organization**
   - One component per file
   - Clear file/folder structure
   - Consistent naming conventions

2. **Props**
   - Use TypeScript interfaces
   - Document all props
   - Provide default values
   - Use prop-types in JavaScript

3. **State Management**
   - Clear state ownership
   - Documented side effects
   - Performance considerations

4. **Styling**
   - Theme-based approach
   - Responsive design
   - Consistent naming
   - CSS-in-JS best practices

5. **Testing**
   - Component rendering
   - User interactions
   - Edge cases
   - Accessibility

6. **Documentation**
   - Props documentation
   - Usage examples
   - Edge cases
   - Performance considerations 