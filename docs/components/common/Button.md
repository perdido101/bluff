# Button Component

## Overview
The Button component is a reusable, accessible button element that provides consistent styling and behavior across the game. It supports various states, themes, and sizes while maintaining accessibility standards.

## Props

```typescript
interface ButtonProps {
  // Content
  children: React.ReactNode;
  icon?: React.ReactNode;
  
  // Behavior
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  
  // Appearance
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  
  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;
  
  // Customization
  className?: string;
  style?: React.CSSProperties;
}
```

## Usage

### Basic Usage
```tsx
import { Button } from '@/components/common/Button';

function Example() {
  return (
    <Button onClick={() => console.log('Clicked!')}>
      Click Me
    </Button>
  );
}
```

### With Different Variants
```tsx
<>
  <Button variant="primary">Primary</Button>
  <Button variant="secondary">Secondary</Button>
  <Button variant="danger">Danger</Button>
  <Button variant="ghost">Ghost</Button>
</>
```

### With Icon
```tsx
<Button icon={<PlayIcon />}>
  Play Cards
</Button>
```

### Loading State
```tsx
<Button loading disabled>
  Processing...
</Button>
```

## Styling

The component uses styled-components with theme integration:

```typescript
const StyledButton = styled.button<{
  variant: ButtonProps['variant'];
  size: ButtonProps['size'];
  $fullWidth: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 4px;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
  
  /* Size variations */
  ${props => {
    switch (props.size) {
      case 'small':
        return css`
          padding: 6px 12px;
          font-size: 14px;
        `;
      case 'large':
        return css`
          padding: 12px 24px;
          font-size: 18px;
        `;
      default:
        return css`
          padding: 8px 16px;
          font-size: 16px;
        `;
    }
  }}
  
  /* Variant styles */
  ${props => {
    switch (props.variant) {
      case 'secondary':
        return css`
          background-color: transparent;
          border: 2px solid ${props.theme.colors.primary};
          color: ${props.theme.colors.primary};
          
          &:hover:not(:disabled) {
            background-color: ${props.theme.colors.primaryLight};
          }
        `;
      case 'danger':
        return css`
          background-color: ${props.theme.colors.danger};
          border: none;
          color: white;
          
          &:hover:not(:disabled) {
            background-color: ${props.theme.colors.dangerDark};
          }
        `;
      case 'ghost':
        return css`
          background-color: transparent;
          border: none;
          color: ${props.theme.colors.text};
          
          &:hover:not(:disabled) {
            background-color: ${props.theme.colors.backgroundHover};
          }
        `;
      default:
        return css`
          background-color: ${props.theme.colors.primary};
          border: none;
          color: white;
          
          &:hover:not(:disabled) {
            background-color: ${props.theme.colors.primaryDark};
          }
        `;
    }
  }}
  
  /* Full width */
  width: ${props => props.$fullWidth ? '100%' : 'auto'};
  
  /* Disabled state */
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  /* Loading state */
  ${props => props.loading && css`
    position: relative;
    color: transparent;
    pointer-events: none;
    
    &::after {
      content: '';
      position: absolute;
      width: 16px;
      height: 16px;
      border: 2px solid;
      border-radius: 50%;
      border-color: currentColor transparent transparent;
      animation: spin 0.6s linear infinite;
    }
  `}
`;
``` 

## Accessibility

The Button component implements comprehensive accessibility features:

### ARIA Support
```tsx
<StyledButton
  role="button"
  aria-label={ariaLabel || children?.toString()}
  aria-describedby={ariaDescribedBy}
  aria-disabled={disabled}
  aria-busy={loading}
  {...props}
>
  {icon && <span className="button-icon" aria-hidden="true">{icon}</span>}
  <span className="button-text">{children}</span>
</StyledButton>
```

### Keyboard Navigation
- Fully keyboard accessible with Tab navigation
- Space and Enter keys trigger click events
- Focus styles respect user preferences
- Focus trap in loading state

### Screen Reader Considerations
- Clear button role and state announcements
- Loading state announcements
- Icon descriptions when relevant
- Error state announcements

## Performance Considerations

### Render Optimization
```typescript
// Memoize the button component to prevent unnecessary re-renders
const Button = React.memo<ButtonProps>(({
  children,
  icon,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  ...props
}) => {
  // Implementation
});

// Memoize icon components
const ButtonIcon = React.memo<{ icon: React.ReactNode }>(({ icon }) => (
  <span className="button-icon" aria-hidden="true">{icon}</span>
));
```

### Event Handler Management
```typescript
const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
  if (!loading && !disabled && onClick) {
    onClick(event);
  }
}, [loading, disabled, onClick]);
```

### Style Optimization
- Use CSS custom properties for theme values
- Hardware-accelerated transitions
- Efficient CSS selectors
- Minimal DOM nesting

## Testing

```typescript
describe('Button', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Click me');
    expect(button).toHaveClass('primary');
    expect(button).not.toBeDisabled();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables click events when loading', () => {
    const handleClick = jest.fn();
    render(
      <Button onClick={handleClick} loading>
        Loading...
      </Button>
    );
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies variant styles correctly', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveStyle({
      backgroundColor: expect.stringMatching(/rgb\(.*\)|#[0-9A-Fa-f]{6}/)
    });

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveStyle({
      backgroundColor: 'transparent'
    });
  });

  it('handles keyboard navigation', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button');
    button.focus();
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalledTimes(1);
    
    fireEvent.keyDown(button, { key: ' ' });
    expect(handleClick).toHaveBeenCalledTimes(2);
  });
});
```

## Examples

### Button with Loading States
```tsx
function LoadingExample() {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
  };

  return (
    <Button
      onClick={handleClick}
      loading={isLoading}
      disabled={isLoading}
    >
      {isLoading ? 'Processing...' : 'Submit'}
    </Button>
  );
}
```

### Button Group
```tsx
function ButtonGroup() {
  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <Button variant="secondary" size="small">
        Cancel
      </Button>
      <Button variant="primary" size="small">
        Confirm
      </Button>
    </div>
  );
}
```

### Responsive Button
```tsx
function ResponsiveButton() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  return (
    <Button
      size={isMobile ? 'large' : 'medium'}
      fullWidth={isMobile}
      icon={<PlayIcon />}
    >
      Play Game
    </Button>
  );
}
```

## Related Components

- [IconButton](./IconButton.md) - Button variant for icon-only actions
- [ButtonGroup](./ButtonGroup.md) - Container for grouping related buttons
- [LoadingButton](./LoadingButton.md) - Button with built-in loading states 