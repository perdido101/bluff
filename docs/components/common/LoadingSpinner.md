# Loading Spinner Component

## Overview
The Loading Spinner component provides a visual indication of loading or processing states in the application. It supports various sizes, colors, and animation styles while maintaining accessibility and performance standards.

## Props

```typescript
interface LoadingSpinnerProps {
  // Size
  size?: 'small' | 'medium' | 'large' | number;
  
  // Appearance
  color?: string;
  variant?: 'circular' | 'dots' | 'pulse';
  thickness?: number;
  
  // Behavior
  speed?: 'slow' | 'normal' | 'fast';
  
  // Accessibility
  ariaLabel?: string;
  role?: string;
  
  // Additional
  className?: string;
  style?: React.CSSProperties;
  
  // Optional text
  text?: string;
  textPosition?: 'top' | 'right' | 'bottom' | 'left';
}
```

## Usage

### Basic Usage
```tsx
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

function Example() {
  return <LoadingSpinner />;
}
```

### With Custom Size and Color
```tsx
function CustomExample() {
  return (
    <LoadingSpinner
      size="large"
      color="#6366f1"
      thickness={4}
    />
  );
}
```

### With Loading Text
```tsx
function TextExample() {
  return (
    <LoadingSpinner
      text="Loading game state..."
      textPosition="bottom"
      size="medium"
    />
  );
} 
```

## Styling

The component uses styled-components with theme integration:

```typescript
const SpinnerContainer = styled.div<{
  $textPosition: LoadingSpinnerProps['textPosition'];
}>`
  display: inline-flex;
  flex-direction: ${props => 
    props.$textPosition === 'left' || props.$textPosition === 'right'
      ? 'row'
      : 'column'
  };
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const SpinnerText = styled.span`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 14px;
  line-height: 1.5;
`;

const Spinner = styled.div<{
  $size: LoadingSpinnerProps['size'];
  $color: LoadingSpinnerProps['color'];
  $thickness: LoadingSpinnerProps['thickness'];
  $speed: LoadingSpinnerProps['speed'];
}>`
  ${props => {
    const size = typeof props.$size === 'number' 
      ? `${props.$size}px` 
      : props.$size === 'small' 
        ? '16px' 
        : props.$size === 'large' 
          ? '48px' 
          : '32px';
    
    return css`
      width: ${size};
      height: ${size};
    `;
  }}
  
  border: ${props => props.$thickness || 2}px solid transparent;
  border-top-color: ${props => props.$color || props.theme.colors.primary};
  border-radius: 50%;
  
  animation: spin ${props => {
    switch (props.$speed) {
      case 'slow':
        return '1.5s';
      case 'fast':
        return '0.5s';
      default:
        return '1s';
    }
  }} linear infinite;
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const DotsContainer = styled.div<{
  $size: LoadingSpinnerProps['size'];
  $color: LoadingSpinnerProps['color'];
  $speed: LoadingSpinnerProps['speed'];
}>`
  display: flex;
  gap: 4px;
  
  > span {
    width: ${props => {
      const baseSize = typeof props.$size === 'number' 
        ? props.$size 
        : props.$size === 'small' 
          ? 4 
          : props.$size === 'large' 
            ? 12 
            : 8;
      return `${baseSize}px`;
    }};
    height: ${props => {
      const baseSize = typeof props.$size === 'number' 
        ? props.$size 
        : props.$size === 'small' 
          ? 4 
          : props.$size === 'large' 
            ? 12 
            : 8;
      return `${baseSize}px`;
    }};
    background-color: ${props => props.$color || props.theme.colors.primary};
    border-radius: 50%;
    animation: bounce ${props => {
      switch (props.$speed) {
        case 'slow':
          return '1.5s';
        case 'fast':
          return '0.5s';
        default:
          return '1s';
      }
    }} infinite ease-in-out;
    
    &:nth-child(2) {
      animation-delay: 0.1s;
    }
    
    &:nth-child(3) {
      animation-delay: 0.2s;
    }
  }
  
  @keyframes bounce {
    0%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-8px);
    }
  }
`;
``` 

## Accessibility

The Loading Spinner component implements accessibility features following WAI-ARIA guidelines:

### ARIA Attributes
```tsx
function LoadingSpinner({ 
  ariaLabel = 'Loading',
  role = 'status',
  text,
  ...props 
}: LoadingSpinnerProps) {
  return (
    <SpinnerContainer
      role={role}
      aria-label={ariaLabel}
      aria-live="polite"
      aria-busy="true"
    >
      {/* Spinner implementation */}
      {text && (
        <SpinnerText aria-hidden="true">
          {text}
        </SpinnerText>
      )}
    </SpinnerContainer>
  );
}
```

### Screen Reader Support
- Uses appropriate ARIA roles and labels
- Announces loading state changes
- Provides text alternatives for visual indicators
- Maintains proper focus management during loading states

### Reduced Motion
```typescript
const Spinner = styled.div<SpinnerProps>`
  @media (prefers-reduced-motion: reduce) {
    animation-duration: 0s;
    animation: none;
    
    /* Alternative visual indicator for reduced motion */
    opacity: 0.7;
    transition: opacity 0.3s ease;
  }
`;
```

## Performance

### Animation Optimization
```typescript
// Use transform instead of animating dimensions
const Spinner = styled.div<SpinnerProps>`
  transform-origin: center center;
  will-change: transform;
  
  /* Use hardware acceleration */
  transform: translateZ(0);
  backface-visibility: hidden;
  perspective: 1000px;
`;

// Batch animations using requestAnimationFrame
useEffect(() => {
  if (!isVisible) return;
  
  let frame: number;
  const animate = () => {
    // Animation logic
    frame = requestAnimationFrame(animate);
  };
  
  frame = requestAnimationFrame(animate);
  return () => cancelAnimationFrame(frame);
}, [isVisible]);
```

### Render Optimization
```typescript
// Memoize the spinner component
const LoadingSpinner = React.memo<LoadingSpinnerProps>(({
  size = 'medium',
  color,
  variant = 'circular',
  ...props
}) => {
  // Implementation
});

// Use CSS custom properties for dynamic values
const Spinner = styled.div<SpinnerProps>`
  --spinner-size: ${props => getSize(props.$size)};
  --spinner-color: ${props => props.$color || 'currentColor'};
  
  width: var(--spinner-size);
  height: var(--spinner-size);
  border-color: var(--spinner-color);
`;
```

### Cleanup
```typescript
useEffect(() => {
  // Cleanup animation frames and timers
  return () => {
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }
  };
}, []);
``` 

## Testing

### Unit Tests
```typescript
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from './LoadingSpinner';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/styles/theme';

describe('LoadingSpinner', () => {
  const renderWithTheme = (ui: React.ReactElement) => {
    return render(
      <ThemeProvider theme={theme}>
        {ui}
      </ThemeProvider>
    );
  };

  // Rendering tests
  describe('rendering', () => {
    it('renders with default props', () => {
      renderWithTheme(<LoadingSpinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveAttribute('aria-busy', 'true');
    });

    it('renders with custom size', () => {
      renderWithTheme(<LoadingSpinner size="large" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveStyle({
        '--spinner-size': '48px'
      });
    });

    it('renders with custom text', () => {
      const text = 'Loading game...';
      renderWithTheme(<LoadingSpinner text={text} />);
      expect(screen.getByText(text)).toBeInTheDocument();
    });
  });

  // Accessibility tests
  describe('accessibility', () => {
    it('has correct ARIA attributes', () => {
      renderWithTheme(<LoadingSpinner ariaLabel="Custom loading text" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-label', 'Custom loading text');
      expect(spinner).toHaveAttribute('aria-live', 'polite');
    });

    it('handles reduced motion preference', () => {
      const mediaQuery = '(prefers-reduced-motion: reduce)';
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === mediaQuery,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
      }));

      renderWithTheme(<LoadingSpinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveStyle({
        'animation': 'none'
      });
    });
  });

  // Variant tests
  describe('variants', () => {
    it('renders circular variant', () => {
      renderWithTheme(<LoadingSpinner variant="circular" />);
      const spinner = screen.getByRole('status');
      expect(spinner.firstChild).toHaveStyle({
        'border-radius': '50%'
      });
    });

    it('renders dots variant', () => {
      renderWithTheme(<LoadingSpinner variant="dots" />);
      const spinner = screen.getByRole('status');
      const dots = spinner.querySelectorAll('span');
      expect(dots).toHaveLength(3);
    });
  });

  // Animation tests
  describe('animations', () => {
    it('applies correct animation speed', () => {
      renderWithTheme(<LoadingSpinner speed="fast" />);
      const spinner = screen.getByRole('status');
      expect(spinner.firstChild).toHaveStyle({
        'animation-duration': '0.5s'
      });
    });

    it('cleans up animations on unmount', () => {
      const { unmount } = renderWithTheme(<LoadingSpinner />);
      unmount();
      // Verify that cancelAnimationFrame was called
      // This would require setting up a spy on window.cancelAnimationFrame
    });
  });
});
```

### Integration Tests
```typescript
describe('LoadingSpinner Integration', () => {
  it('works within loading states of other components', async () => {
    const TestComponent = () => {
      const [isLoading, setIsLoading] = useState(true);
      
      useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 100);
        return () => clearTimeout(timer);
      }, []);
      
      return (
        <div>
          {isLoading ? (
            <LoadingSpinner text="Loading content" />
          ) : (
            <div>Content loaded</div>
          )}
        </div>
      );
    };

    renderWithTheme(<TestComponent />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading content')).toBeInTheDocument();
    
    await waitForElementToBeRemoved(() => screen.queryByRole('status'));
    expect(screen.getByText('Content loaded')).toBeInTheDocument();
  });

  it('handles multiple spinners on the page', () => {
    renderWithTheme(
      <div>
        <LoadingSpinner text="Loading A" />
        <LoadingSpinner text="Loading B" />
      </div>
    );
    
    const spinners = screen.getAllByRole('status');
    expect(spinners).toHaveLength(2);
    expect(screen.getByText('Loading A')).toBeInTheDocument();
    expect(screen.getByText('Loading B')).toBeInTheDocument();
  });
}); 