# Notifications Component

## Overview
The Notifications component provides a system for displaying toast notifications and alerts to users. It supports different types of notifications (success, error, warning, info), custom positioning, animations, and can handle multiple notifications simultaneously.

## Props

```typescript
interface NotificationProps {
  // Content
  id: string;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  icon?: React.ReactNode;
  
  // Behavior
  duration?: number;
  dismissible?: boolean;
  onDismiss?: () => void;
  
  // Positioning
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  offset?: number;
  
  // Animation
  animationDuration?: number;
  
  // Customization
  className?: string;
  style?: React.CSSProperties;
}

interface NotificationsProviderProps {
  maxNotifications?: number;
  defaultDuration?: number;
  defaultPosition?: NotificationProps['position'];
  defaultAnimationDuration?: number;
}
```

## Usage

### Basic Usage
```tsx
import { useNotifications, NotificationsProvider } from '@/components/ui/Notifications';

function App() {
  return (
    <NotificationsProvider>
      <YourApp />
    </NotificationsProvider>
  );
}

function YourApp() {
  const { showNotification } = useNotifications();
  
  const handleSuccess = () => {
    showNotification({
      title: 'Success!',
      message: 'Operation completed successfully',
      type: 'success'
    });
  };
  
  return (
    <button onClick={handleSuccess}>
      Show Success Notification
    </button>
  );
}
```

### Custom Duration and Position
```tsx
function CustomExample() {
  const { showNotification } = useNotifications();
  
  const handleError = () => {
    showNotification({
      title: 'Error',
      message: 'Something went wrong',
      type: 'error',
      duration: 5000,
      position: 'top-center',
      dismissible: true
    });
  };
  
  return (
    <button onClick={handleError}>
      Show Error Notification
    </button>
  );
}
```

### With Custom Icon and Action
```tsx
function ActionExample() {
  const { showNotification } = useNotifications();
  
  const handleWarning = () => {
    showNotification({
      title: 'Warning',
      message: 'Your session will expire soon',
      type: 'warning',
      icon: <ClockIcon />,
      onDismiss: () => {
        // Handle dismiss action
      }
    });
  };
  
  return (
    <button onClick={handleWarning}>
      Show Warning Notification
    </button>
  );
} 
```

## Styling

The component uses styled-components with theme integration and animations:

```typescript
const NotificationsContainer = styled.div<{ $position: NotificationProps['position'] }>`
  position: fixed;
  z-index: ${props => props.theme.zIndices.notifications};
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space[2]};
  padding: ${props => props.theme.space[4]};
  pointer-events: none;
  
  ${props => {
    switch (props.$position) {
      case 'top-left':
        return 'top: 0; left: 0;';
      case 'top-right':
        return 'top: 0; right: 0;';
      case 'bottom-left':
        return 'bottom: 0; left: 0;';
      case 'bottom-right':
        return 'bottom: 0; right: 0;';
      case 'top-center':
        return 'top: 0; left: 50%; transform: translateX(-50%);';
      case 'bottom-center':
        return 'bottom: 0; left: 50%; transform: translateX(-50%);';
    }
  }}
`;

const NotificationItem = styled.div<{
  $type: NotificationProps['type'];
  $animationDuration: number;
}>`
  pointer-events: auto;
  min-width: 300px;
  max-width: 400px;
  padding: ${props => props.theme.space[3]};
  background-color: ${props => {
    switch (props.$type) {
      case 'success':
        return props.theme.colors.success.background;
      case 'error':
        return props.theme.colors.error.background;
      case 'warning':
        return props.theme.colors.warning.background;
      case 'info':
      default:
        return props.theme.colors.info.background;
    }
  }};
  border-left: 4px solid ${props => {
    switch (props.$type) {
      case 'success':
        return props.theme.colors.success.border;
      case 'error':
        return props.theme.colors.error.border;
      case 'warning':
        return props.theme.colors.warning.border;
      case 'info':
      default:
        return props.theme.colors.info.border;
    }
  }};
  border-radius: ${props => props.theme.radii.md};
  box-shadow: ${props => props.theme.shadows.medium};
  
  // Animation
  animation: slideIn ${props => props.$animationDuration}ms ease-out,
             fadeIn ${props => props.$animationDuration}ms ease-out;
  
  &.notification-exit {
    animation: slideOut ${props => props.$animationDuration}ms ease-in,
               fadeOut ${props => props.$animationDuration}ms ease-in;
  }
  
  @keyframes slideIn {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideOut {
    from { transform: translateX(0); }
    to { transform: translateX(100%); }
  }
  
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
`;

const NotificationContent = styled.div`
  display: flex;
  gap: ${props => props.theme.space[3]};
  align-items: flex-start;
`;

const NotificationIcon = styled.div<{ $type: NotificationProps['type'] }>`
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  color: ${props => {
    switch (props.$type) {
      case 'success':
        return props.theme.colors.success.text;
      case 'error':
        return props.theme.colors.error.text;
      case 'warning':
        return props.theme.colors.warning.text;
      case 'info':
      default:
        return props.theme.colors.info.text;
    }
  }};
`;

const NotificationText = styled.div`
  flex-grow: 1;
`;

const NotificationTitle = styled.h4`
  margin: 0;
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.fontSizes.md};
  font-weight: ${props => props.theme.fontWeights.bold};
`;

const NotificationMessage = styled.p`
  margin: ${props => props.theme.space[1]} 0 0;
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.fontSizes.sm};
`;

const DismissButton = styled.button`
  position: absolute;
  top: ${props => props.theme.space[2]};
  right: ${props => props.theme.space[2]};
  padding: ${props => props.theme.space[1]};
  border: none;
  background: none;
  color: ${props => props.theme.colors.text.secondary};
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s ease;
  
  &:hover {
    opacity: 1;
  }
  
  &:focus-visible {
    outline: 2px solid ${props => props.theme.colors.primary};
    outline-offset: 2px;
    border-radius: ${props => props.theme.radii.sm};
  }
`;
```

The styling includes:
- Flexible positioning system with six placement options
- Smooth enter/exit animations
- Type-based theming (success, error, warning, info)
- Responsive sizing and spacing
- Focus management for dismiss buttons
- Theme integration for consistent styling
- Accessibility-focused styling

## Accessibility

The Notifications component implements accessibility features following WAI-ARIA guidelines:

### ARIA Attributes and Live Regions
```tsx
function NotificationsProvider({ children, ...props }: NotificationsProviderProps) {
  return (
    <>
      {children}
      <NotificationsContainer
        role="log"
        aria-live="polite"
        aria-atomic="true"
        aria-relevant="additions"
        $position={props.defaultPosition || 'top-right'}
      >
        {/* Notifications will be rendered here */}
      </NotificationsContainer>
    </>
  );
}

function NotificationItem({ notification, onDismiss }: NotificationItemProps) {
  return (
    <NotificationItem
      role="alert"
      aria-describedby={`notification-${notification.id}-message`}
      $type={notification.type}
      $animationDuration={notification.animationDuration || 300}
    >
      <NotificationContent>
        {notification.icon && (
          <NotificationIcon
            $type={notification.type}
            aria-hidden="true"
          >
            {notification.icon}
          </NotificationIcon>
        )}
        <NotificationText>
          <NotificationTitle>
            {notification.title}
          </NotificationTitle>
          <NotificationMessage id={`notification-${notification.id}-message`}>
            {notification.message}
          </NotificationMessage>
        </NotificationText>
        {notification.dismissible && (
          <DismissButton
            onClick={onDismiss}
            aria-label="Dismiss notification"
          >
            ×
          </DismissButton>
        )}
      </NotificationContent>
    </NotificationItem>
  );
}
```

### Focus Management
```typescript
// Handle focus when notifications appear
useEffect(() => {
  if (notifications.length > 0) {
    const latestNotification = notifications[notifications.length - 1];
    if (latestNotification.dismissible) {
      const dismissButton = document.querySelector(
        `[aria-describedby="notification-${latestNotification.id}-message"] button`
      );
      dismissButton?.focus();
    }
  }
}, [notifications]);

// Return focus after dismissal
const handleDismiss = (notification: NotificationProps) => {
  const previousFocus = document.activeElement;
  notification.onDismiss?.();
  
  // Return focus to the element that was focused before the notification appeared
  if (previousFocus instanceof HTMLElement) {
    previousFocus.focus();
  }
};
```

### Keyboard Navigation
```typescript
// Handle keyboard shortcuts for dismissing notifications
useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && notifications.length > 0) {
      const latestNotification = notifications[notifications.length - 1];
      if (latestNotification.dismissible) {
        handleDismiss(latestNotification);
      }
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [notifications]);
```

### Screen Reader Considerations
- Uses `role="log"` for the container to announce new notifications
- Uses `role="alert"` for individual notifications when immediate attention is required
- Implements proper ARIA live regions for dynamic content updates
- Provides clear, descriptive messages for screen readers
- Ensures dismiss buttons have proper labels
- Maintains focus management for keyboard users
- Supports keyboard shortcuts for dismissal
- Announces notification type and content appropriately

## Testing

The Notifications component includes comprehensive tests to ensure functionality, accessibility, and proper behavior:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationsProvider, useNotifications } from './Notifications';

describe('Notifications Component', () => {
  const TestComponent = () => {
    const { showNotification } = useNotifications();
    
    return (
      <button onClick={() => showNotification({
        id: 'test',
        title: 'Test Notification',
        message: 'This is a test message',
        type: 'info'
      })}>
        Show Notification
      </button>
    );
  };

  const renderWithProvider = (ui: React.ReactElement) => {
    return render(
      <NotificationsProvider>
        {ui}
      </NotificationsProvider>
    );
  };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders notifications when triggered', async () => {
      renderWithProvider(<TestComponent />);
      
      await userEvent.click(screen.getByRole('button'));
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Test Notification')).toBeInTheDocument();
      expect(screen.getByText('This is a test message')).toBeInTheDocument();
    });

    it('applies correct styling based on notification type', async () => {
      const { showNotification } = renderWithProvider(<TestComponent />).result.current;
      
      showNotification({
        id: 'success',
        title: 'Success',
        message: 'Operation successful',
        type: 'success'
      });
      
      const notification = screen.getByRole('alert');
      expect(notification).toHaveStyle({
        backgroundColor: expect.stringMatching(/success/i)
      });
    });
  });

  describe('Behavior', () => {
    it('auto-dismisses after duration', async () => {
      renderWithProvider(<TestComponent />);
      
      await userEvent.click(screen.getByRole('button'));
      
      jest.advanceTimersByTime(5000);
      
      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });

    it('can be dismissed manually', async () => {
      renderWithProvider(<TestComponent />);
      
      await userEvent.click(screen.getByRole('button'));
      await userEvent.click(screen.getByLabelText('Dismiss notification'));
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('calls onDismiss callback when dismissed', async () => {
      const onDismiss = jest.fn();
      const { showNotification } = renderWithProvider(<TestComponent />).result.current;
      
      showNotification({
        id: 'test',
        title: 'Test',
        message: 'Test',
        onDismiss
      });
      
      await userEvent.click(screen.getByLabelText('Dismiss notification'));
      expect(onDismiss).toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('can be dismissed with Escape key', async () => {
      renderWithProvider(<TestComponent />);
      
      await userEvent.click(screen.getByRole('button'));
      await userEvent.keyboard('{Escape}');
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('maintains focus after dismissal', async () => {
      renderWithProvider(<TestComponent />);
      
      const button = screen.getByRole('button');
      await userEvent.click(button);
      await userEvent.keyboard('{Escape}');
      
      expect(button).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('uses correct ARIA attributes', async () => {
      renderWithProvider(<TestComponent />);
      
      await userEvent.click(screen.getByRole('button'));
      
      const container = screen.getByRole('log');
      expect(container).toHaveAttribute('aria-live', 'polite');
      expect(container).toHaveAttribute('aria-atomic', 'true');
      
      const notification = screen.getByRole('alert');
      expect(notification).toHaveAttribute('aria-describedby');
    });

    it('manages focus correctly for dismissible notifications', async () => {
      renderWithProvider(<TestComponent />);
      
      await userEvent.click(screen.getByRole('button'));
      
      const dismissButton = screen.getByLabelText('Dismiss notification');
      expect(dismissButton).toHaveFocus();
    });
  });
});