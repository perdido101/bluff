# Tooltip Component

## Overview
The Tooltip component provides contextual information or hints when users hover over or focus on an element. It supports multiple positions, custom delays, and animations while maintaining accessibility standards.

## Props

```typescript
interface TooltipProps {
  // Content
  content: React.ReactNode;
  children: React.ReactNode;
  
  // Behavior
  trigger?: 'hover' | 'focus' | 'click' | 'manual';
  isOpen?: boolean;
  defaultIsOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  
  // Positioning
  position?: 'top' | 'right' | 'bottom' | 'left';
  offset?: number;
  followCursor?: boolean;
  
  // Timing
  openDelay?: number;
  closeDelay?: number;
  
  // Appearance
  variant?: 'light' | 'dark' | 'custom';
  maxWidth?: number | string;
  hasArrow?: boolean;
  
  // Accessibility
  ariaLabel?: string;
  
  // Customization
  className?: string;
  style?: React.CSSProperties;
}
```

## Usage

### Basic Usage
```tsx
import { Tooltip } from '@/components/common/Tooltip';

function Example() {
  return (
    <Tooltip content="This is a helpful tip">
      <Button>Hover me</Button>
    </Tooltip>
  );
}
```

### Different Positions
```tsx
<>
  <Tooltip content="Top tooltip" position="top">
    <Button>Top</Button>
  </Tooltip>
  
  <Tooltip content="Right tooltip" position="right">
    <Button>Right</Button>
  </Tooltip>
  
  <Tooltip content="Bottom tooltip" position="bottom">
    <Button>Bottom</Button>
  </Tooltip>
  
  <Tooltip content="Left tooltip" position="left">
    <Button>Left</Button>
  </Tooltip>
</>
```

### Custom Trigger
```tsx
<Tooltip
  content="Click-triggered tooltip"
  trigger="click"
  position="top"
>
  <Button>Click me</Button>
</Tooltip>
```

## Styling

The component uses styled-components with theme integration:

```typescript
const TooltipContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const TooltipContent = styled.div<{
  $position: TooltipProps['position'];
  $variant: TooltipProps['variant'];
  $maxWidth: TooltipProps['maxWidth'];
}>`
  position: absolute;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.4;
  z-index: 1000;
  max-width: ${props => 
    typeof props.$maxWidth === 'number' 
      ? `${props.$maxWidth}px` 
      : props.$maxWidth || '200px'
  };
  
  /* Variant styles */
  ${props => {
    switch (props.$variant) {
      case 'dark':
        return css`
          background-color: ${props.theme.colors.gray900};
          color: white;
        `;
      case 'light':
        return css`
          background-color: white;
          color: ${props.theme.colors.gray900};
          border: 1px solid ${props.theme.colors.gray200};
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        `;
      default:
        return css`
          background-color: ${props.theme.colors.tooltip.background};
          color: ${props.theme.colors.tooltip.text};
        `;
    }
  }}
  
  /* Position styles */
  ${props => {
    switch (props.$position) {
      case 'top':
        return css`
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%) translateY(-8px);
        `;
      case 'right':
        return css`
          left: 100%;
          top: 50%;
          transform: translateY(-50%) translateX(8px);
        `;
      case 'bottom':
        return css`
          top: 100%;
          left: 50%;
          transform: translateX(-50%) translateY(8px);
        `;
      case 'left':
        return css`
          right: 100%;
          top: 50%;
          transform: translateY(-50%) translateX(-8px);
        `;
    }
  }}
`;

const Arrow = styled.div<{
  $position: TooltipProps['position'];
  $variant: TooltipProps['variant'];
}>`
  position: absolute;
  width: 8px;
  height: 8px;
  transform: rotate(45deg);
  
  /* Variant styles */
  ${props => {
    switch (props.$variant) {
      case 'dark':
        return css`
          background-color: ${props.theme.colors.gray900};
        `;
      case 'light':
        return css`
          background-color: white;
          border: 1px solid ${props.theme.colors.gray200};
          border-top: none;
          border-left: none;
        `;
      default:
        return css`
          background-color: ${props.theme.colors.tooltip.background};
        `;
    }
  }}
  
  /* Position styles */
  ${props => {
    switch (props.$position) {
      case 'top':
        return css`
          bottom: -4px;
          left: 50%;
          transform: translateX(-50%) rotate(45deg);
        `;
      case 'right':
        return css`
          left: -4px;
          top: 50%;
          transform: translateY(-50%) rotate(45deg);
        `;
      case 'bottom':
        return css`
          top: -4px;
          left: 50%;
          transform: translateX(-50%) rotate(45deg);
        `;
      case 'left':
        return css`
          right: -4px;
          top: 50%;
          transform: translateY(-50%) rotate(45deg);
        `;
    }
  }}
`;
``` 

## Accessibility

The Tooltip component implements accessibility features following WAI-ARIA guidelines:

### ARIA Attributes
```tsx
<TooltipContainer>
  <div
    ref={triggerRef}
    aria-describedby={tooltipId}
    onMouseEnter={handleMouseEnter}
    onMouseLeave={handleMouseLeave}
    onFocus={handleFocus}
    onBlur={handleBlur}
  >
    {children}
  </div>
  
  {isOpen && (
    <TooltipContent
      id={tooltipId}
      role="tooltip"
      aria-hidden={!isOpen}
    >
      {content}
      {hasArrow && <Arrow $position={position} $variant={variant} />}
    </TooltipContent>
  )}
</TooltipContainer>
```

### Keyboard Navigation
- Tooltips appear on focus for keyboard users
- ESC key dismisses click-triggered tooltips
- Arrow keys can navigate between tooltip triggers
- Focus remains on trigger element while tooltip is shown

### Screen Reader Support
```typescript
const Tooltip: React.FC<TooltipProps> = ({ content, ariaLabel, ...props }) => {
  const tooltipId = useId();
  
  // Announce tooltip content when it appears
  useEffect(() => {
    if (isOpen) {
      announceToScreenReader(`Tooltip: ${ariaLabel || content}`);
    }
  }, [isOpen, content, ariaLabel]);
  
  // Implementation
};
```

## Behavior Management

### Trigger Handling
```typescript
const handleTrigger = useCallback(() => {
  switch (trigger) {
    case 'hover':
      return {
        onMouseEnter: () => {
          openTimeoutRef.current = window.setTimeout(() => {
            setIsOpen(true);
          }, openDelay);
        },
        onMouseLeave: () => {
          if (openTimeoutRef.current) {
            clearTimeout(openTimeoutRef.current);
          }
          closeTimeoutRef.current = window.setTimeout(() => {
            setIsOpen(false);
          }, closeDelay);
        }
      };
    case 'click':
      return {
        onClick: () => {
          setIsOpen(prev => !prev);
        }
      };
    case 'focus':
      return {
        onFocus: () => setIsOpen(true),
        onBlur: () => setIsOpen(false)
      };
    default:
      return {};
  }
}, [trigger, openDelay, closeDelay]);
```

### Position Calculation
```typescript
const calculatePosition = useCallback(() => {
  if (!triggerRef.current || !tooltipRef.current) return;

  const triggerRect = triggerRef.current.getBoundingClientRect();
  const tooltipRect = tooltipRef.current.getBoundingClientRect();
  
  // Calculate optimal position based on viewport edges
  const positions = {
    top: {
      top: triggerRect.top - tooltipRect.height - offset,
      left: triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
    },
    bottom: {
      top: triggerRect.bottom + offset,
      left: triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
    },
    left: {
      top: triggerRect.top + (triggerRect.height - tooltipRect.height) / 2,
      left: triggerRect.left - tooltipRect.width - offset
    },
    right: {
      top: triggerRect.top + (triggerRect.height - tooltipRect.height) / 2,
      left: triggerRect.right + offset
    }
  };

  // Check if tooltip would overflow viewport
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  };

  let optimalPosition = position;
  
  // Flip position if needed
  if (position === 'top' && positions.top.top < 0) {
    optimalPosition = 'bottom';
  } else if (position === 'bottom' && positions.bottom.top + tooltipRect.height > viewport.height) {
    optimalPosition = 'top';
  } else if (position === 'left' && positions.left.left < 0) {
    optimalPosition = 'right';
  } else if (position === 'right' && positions.right.left + tooltipRect.width > viewport.width) {
    optimalPosition = 'left';
  }

  return positions[optimalPosition];
}, [position, offset]);
```

### Cursor Following
```typescript
const handleMouseMove = useCallback((event: MouseEvent) => {
  if (!followCursor || !isOpen) return;

  const { clientX, clientY } = event;
  const tooltipRect = tooltipRef.current?.getBoundingClientRect();
  
  if (!tooltipRect) return;

  const offset = 15; // Distance from cursor
  
  setPosition({
    left: clientX + offset,
    top: clientY + offset
  });
}, [followCursor, isOpen]);
```

## Performance Considerations

### Render Optimization
```typescript
// Memoize the tooltip component
const Tooltip = React.memo<TooltipProps>(({
  content,
  children,
  position = 'top',
  ...props
}) => {
  // Implementation
});

// Memoize handlers and calculations
const handleTrigger = useCallback(() => {
  // Implementation
}, [trigger, openDelay, closeDelay]);

const calculatePosition = useCallback(() => {
  // Implementation
}, [position, offset]);

// Memoize content to prevent unnecessary renders
const tooltipContent = useMemo(() => (
  <TooltipContent>
    {content}
    {hasArrow && <Arrow />}
  </TooltipContent>
), [content, hasArrow]);
```

### Event Handling
```typescript
// Debounce position calculations for performance
const debouncedCalculatePosition = useMemo(
  () => debounce(calculatePosition, 16),
  [calculatePosition]
);

// Clean up event listeners
useEffect(() => {
  if (followCursor && isOpen) {
    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }
}, [followCursor, isOpen, handleMouseMove]);

// Clean up timeouts
useEffect(() => {
  return () => {
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
    }
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
  };
}, []);
```

### Portal Usage
```typescript
// Render tooltip in a portal to avoid stacking context issues
const tooltipRoot = document.getElementById('tooltip-root');

return (
  <>
    <TooltipTrigger ref={triggerRef} {...triggerProps}>
      {children}
    </TooltipTrigger>
    {isOpen && tooltipRoot && ReactDOM.createPortal(
      tooltipContent,
      tooltipRoot
    )}
  </>
);
``` 

## Testing

### Unit Tests
```typescript
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  // Rendering tests
  describe('rendering', () => {
    it('renders trigger element without tooltip initially', () => {
      render(
        <Tooltip content="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('renders tooltip content when triggered', async () => {
      render(
        <Tooltip content="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      
      fireEvent.mouseEnter(screen.getByRole('button'));
      
      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveTextContent('Test tooltip');
    });
  });

  // Behavior tests
  describe('behavior', () => {
    it('shows tooltip on hover', async () => {
      render(
        <Tooltip content="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      
      fireEvent.mouseEnter(screen.getByRole('button'));
      expect(await screen.findByRole('tooltip')).toBeInTheDocument();
      
      fireEvent.mouseLeave(screen.getByRole('button'));
      await waitForElementToBeRemoved(() => screen.queryByRole('tooltip'));
    });

    it('shows tooltip on focus for keyboard users', async () => {
      render(
        <Tooltip content="Test tooltip" trigger="focus">
          <button>Focus me</button>
        </Tooltip>
      );
      
      fireEvent.focus(screen.getByRole('button'));
      expect(await screen.findByRole('tooltip')).toBeInTheDocument();
      
      fireEvent.blur(screen.getByRole('button'));
      await waitForElementToBeRemoved(() => screen.queryByRole('tooltip'));
    });
  });

  // Accessibility tests
  describe('accessibility', () => {
    it('has correct ARIA attributes', () => {
      render(
        <Tooltip content="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      
      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('aria-describedby');
    });

    it('supports keyboard navigation', () => {
      render(
        <Tooltip content="Test tooltip" trigger="click">
          <button>Click me</button>
        </Tooltip>
      );
      
      const trigger = screen.getByRole('button');
      trigger.focus();
      fireEvent.keyDown(trigger, { key: 'Enter' });
      
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
      
      fireEvent.keyDown(trigger, { key: 'Escape' });
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  // Position tests
  describe('positioning', () => {
    it('applies correct position styles', async () => {
      render(
        <Tooltip content="Test tooltip" position="top">
          <button>Hover me</button>
        </Tooltip>
      );
      
      fireEvent.mouseEnter(screen.getByRole('button'));
      const tooltip = await screen.findByRole('tooltip');
      
      expect(tooltip).toHaveStyle({
        position: 'absolute',
        transform: expect.stringContaining('translateX(-50%) translateY')
      });
    });
  });
});
```

### Integration Tests
```typescript
describe('Tooltip Integration', () => {
  it('works with complex content', async () => {
    render(
      <Tooltip
        content={
          <div>
            <h3>Complex tooltip</h3>
            <p>With multiple elements</p>
          </div>
        }
      >
        <button>Hover me</button>
      </Tooltip>
    );
    
    fireEvent.mouseEnter(screen.getByRole('button'));
    const tooltip = await screen.findByRole('tooltip');
    
    expect(tooltip).toContainElement(screen.getByRole('heading'));
    expect(tooltip).toContainElement(screen.getByText('With multiple elements'));
  });

  it('handles window resize', async () => {
    render(
      <Tooltip content="Test tooltip">
        <button>Hover me</button>
      </Tooltip>
    );
    
    fireEvent.mouseEnter(screen.getByRole('button'));
    const tooltip = await screen.findByRole('tooltip');
    
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveStyle({
      position: 'absolute'
    });
  });
}); 
```

## Examples

### Form Field Help Text
```tsx
function FormExample() {
  return (
    <form>
      <div>
        <label>
          Password
          <Tooltip
            content={
              <div>
                Password must contain:
                <ul>
                  <li>At least 8 characters</li>
                  <li>One uppercase letter</li>
                  <li>One number</li>
                  <li>One special character</li>
                </ul>
              </div>
            }
            position="right"
          >
            <span role="img" aria-label="help">ℹ️</span>
          </Tooltip>
        </label>
        <input type="password" />
      </div>
    </form>
  );
}
```

### Interactive Game Elements
```tsx
function GameCardExample() {
  return (
    <div className="card-container">
      <Tooltip
        content={
          <div>
            <strong>Card Effects:</strong>
            <p>+2 Attack Damage</p>
            <p>Applies Poison for 3 turns</p>
          </div>
        }
        position="top"
        openDelay={200}
      >
        <div className="game-card">
          Venomous Blade
        </div>
      </Tooltip>
    </div>
  );
}
```

### Mobile-Optimized Tooltip
```tsx
function MobileExample() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  return (
    <Tooltip
      content="This tooltip adapts to screen size"
      position={isMobile ? 'bottom' : 'right'}
      maxWidth={isMobile ? '200px' : '300px'}
      openDelay={isMobile ? 0 : 200}
      trigger={isMobile ? 'click' : 'hover'}
    >
      <button>Adaptive Tooltip</button>
    </Tooltip>
  );
}
```

### Dynamic Content Loading
```tsx
function DynamicExample() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const handleMouseEnter = async () => {
    if (!data) {
      setLoading(true);
      const result = await fetchData();
      setData(result);
      setLoading(false);
    }
  };
  
  return (
    <Tooltip
      content={
        loading ? (
          <div>Loading...</div>
        ) : data ? (
          <div>
            <h4>{data.title}</h4>
            <p>{data.description}</p>
          </div>
        ) : (
          <div>Hover to load data</div>
        )
      }
      onOpen={handleMouseEnter}
    >
      <button>Load Data</button>
    </Tooltip>
  );
}
```

### Related Components
- `Popover`: For more complex interactive overlays
- `Dialog`: For modal dialogs and confirmations
- `ContextMenu`: For right-click menus
- `Toast`: For temporary notifications
</rewritten_file>