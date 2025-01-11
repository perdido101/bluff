# Modal Component

## Overview
The Modal component provides a flexible, accessible overlay for displaying content above the main application. It supports various sizes, animations, and can be triggered programmatically or through user interaction. The component handles focus management, keyboard navigation, and screen reader announcements.

## Props

```typescript
interface ModalProps {
  // Control
  isOpen: boolean;
  onClose: () => void;
  
  // Content
  children: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  
  // Behavior
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
  preventScroll?: boolean;
  
  // Appearance
  size?: 'small' | 'medium' | 'large' | 'full';
  position?: 'center' | 'top' | 'bottom';
  animation?: 'fade' | 'slide' | 'scale';
  
  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;
  initialFocus?: RefObject<HTMLElement>;
  
  // Customization
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;
}
```

## Usage

### Basic Usage
```tsx
import { Modal } from '@/components/common/Modal';

function Example() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Open Modal
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Example Modal"
      >
        <p>This is the modal content.</p>
      </Modal>
    </>
  );
}
```

### With Footer Actions
```tsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Confirm Action"
  footer={
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
      <Button variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleConfirm}>
        Confirm
      </Button>
    </div>
  }
>
  <p>Are you sure you want to proceed?</p>
</Modal>
```

### Custom Position and Size
```tsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  position="top"
  size="small"
  animation="slide"
>
  <div>Notification content</div>
</Modal>
```

## Styling

The component uses styled-components with theme integration:

```typescript
const ModalOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: ${props => props.$isOpen ? 1 : 0};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transition: opacity 0.2s ease, visibility 0.2s ease;
`;

const ModalContent = styled.div<{
  $size: ModalProps['size'];
  $position: ModalProps['position'];
}>`
  background-color: ${props => props.theme.colors.background};
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  
  /* Size variations */
  ${props => {
    switch (props.$size) {
      case 'small':
        return css`
          width: 400px;
          max-width: 90vw;
        `;
      case 'large':
        return css`
          width: 800px;
          max-width: 90vw;
        `;
      case 'full':
        return css`
          width: 90vw;
          height: 90vh;
        `;
      default:
        return css`
          width: 600px;
          max-width: 90vw;
        `;
    }
  }}
  
  /* Position variations */
  ${props => {
    switch (props.$position) {
      case 'top':
        return css`
          margin-top: 40px;
        `;
      case 'bottom':
        return css`
          margin-bottom: 40px;
        `;
      default:
        return css`
          margin: auto;
        `;
    }
  }}
`;

const ModalHeader = styled.div`
  padding: 16px 24px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ModalBody = styled.div`
  padding: 24px;
`;

const ModalFooter = styled.div`
  padding: 16px 24px;
  border-top: 1px solid ${props => props.theme.colors.border};
`;
``` 

## Accessibility

The Modal component implements comprehensive accessibility features following WAI-ARIA guidelines:

### ARIA Roles and Attributes
```tsx
<ModalOverlay
  role="presentation"
  aria-hidden={!isOpen}
  onClick={closeOnOverlayClick ? onClose : undefined}
>
  <ModalContent
    role="dialog"
    aria-modal="true"
    aria-labelledby={titleId}
    aria-describedby={descriptionId}
    onClick={e => e.stopPropagation()}
  >
    <ModalHeader>
      <h2 id={titleId}>{title}</h2>
      <CloseButton
        onClick={onClose}
        aria-label="Close modal"
      />
    </ModalHeader>
    {description && (
      <div id={descriptionId}>{description}</div>
    )}
    {children}
  </ModalContent>
</ModalOverlay>
```

### Focus Management
```typescript
const Modal: React.FC<ModalProps> = ({ isOpen, initialFocus, ...props }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousFocus.current = document.activeElement as HTMLElement;
      
      // Focus the specified element or the modal content
      const elementToFocus = initialFocus?.current || contentRef.current;
      elementToFocus?.focus();
      
      return () => {
        // Restore focus when modal closes
        previousFocus.current?.focus();
      };
    }
  }, [isOpen, initialFocus]);

  // Focus trap implementation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen || !contentRef.current) return;

    if (event.key === 'Tab') {
      const focusableElements = contentRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};
```

### Screen Reader Considerations
- Modal announces its presence when opened
- Clear labeling of modal purpose and content
- Proper heading structure
- Descriptive action buttons
- Status updates for loading states

## Animations

The Modal component supports various animation types using Framer Motion:

```typescript
const animations = {
  fade: {
    overlay: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.2 }
    },
    content: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.2, delay: 0.1 }
    }
  },
  scale: {
    overlay: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.2 }
    },
    content: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
      transition: { duration: 0.2, delay: 0.1 }
    }
  },
  slide: {
    overlay: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.2 }
    },
    content: {
      initial: { opacity: 0, y: -20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 20 },
      transition: { duration: 0.2, delay: 0.1 }
    }
  }
};

const AnimatedModalContent = motion(ModalContent);
const AnimatedModalOverlay = motion(ModalOverlay);

return (
  <AnimatePresence>
    {isOpen && (
      <AnimatedModalOverlay
        {...animations[animation].overlay}
      >
        <AnimatedModalContent
          {...animations[animation].content}
        >
          {/* Modal content */}
        </AnimatedModalContent>
      </AnimatedModalOverlay>
    )}
  </AnimatePresence>
);
```

## Performance Considerations

### Render Optimization
```typescript
// Memoize the modal component to prevent unnecessary re-renders
const Modal = React.memo<ModalProps>(({
  isOpen,
  onClose,
  children,
  ...props
}) => {
  // Implementation
});

// Memoize handlers
const handleClose = useCallback(() => {
  onClose();
}, [onClose]);

// Memoize animations
const currentAnimation = useMemo(() => 
  animations[animation], 
  [animation]
);
```

### Portal Usage
```typescript
// Render modal in a portal to avoid stacking context issues
const modalRoot = document.getElementById('modal-root');

return ReactDOM.createPortal(
  <Modal isOpen={isOpen} onClose={onClose}>
    {children}
  </Modal>,
  modalRoot
);
```

### Cleanup
```typescript
useEffect(() => {
  if (isOpen && preventScroll) {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }
}, [isOpen, preventScroll]);
```

## Testing

```typescript
describe('Modal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    // Create modal root element
    const modalRoot = document.createElement('div');
    modalRoot.setAttribute('id', 'modal-root');
    document.body.appendChild(modalRoot);
  });

  afterEach(() => {
    // Clean up
    const modalRoot = document.getElementById('modal-root');
    if (modalRoot) {
      document.body.removeChild(modalRoot);
    }
    mockOnClose.mockClear();
  });

  it('renders when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onClose when escape key is pressed', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} closeOnEscape>
        <p>Modal content</p>
      </Modal>
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('traps focus within the modal', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <button>First</button>
        <button>Last</button>
      </Modal>
    );

    const firstButton = screen.getByText('First');
    const lastButton = screen.getByText('Last');

    // Focus last button and press tab
    lastButton.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(firstButton);

    // Focus first button and press shift+tab
    firstButton.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(lastButton);
  });
});
``` 

## Examples

### Confirmation Modal
```tsx
function ConfirmationModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await someAsyncAction();
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="Confirm Action"
      description="This action cannot be undone."
      footer={
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Button
            variant="secondary"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            loading={isLoading}
          >
            Confirm
          </Button>
        </div>
      }
    >
      <p>Are you sure you want to proceed with this action?</p>
    </Modal>
  );
}
```

### Form Modal
```tsx
function FormModal() {
  const [isOpen, setIsOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    console.log(Object.fromEntries(formData));
    setIsOpen(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="Edit Profile"
      initialFocus={formRef}
    >
      <form ref={formRef} onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input
            type="text"
            name="name"
            placeholder="Enter your name"
            required
          />
          <textarea
            name="bio"
            placeholder="Enter your bio"
            rows={4}
          />
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
}
```

### Nested Modals
```tsx
function NestedModals() {
  const [isFirstOpen, setIsFirstOpen] = useState(false);
  const [isSecondOpen, setIsSecondOpen] = useState(false);

  return (
    <>
      <Modal
        isOpen={isFirstOpen}
        onClose={() => setIsFirstOpen(false)}
        title="First Modal"
      >
        <Button onClick={() => setIsSecondOpen(true)}>
          Open Second Modal
        </Button>
      </Modal>

      <Modal
        isOpen={isSecondOpen}
        onClose={() => setIsSecondOpen(false)}
        title="Second Modal"
        animation="slide"
      >
        <p>This is a nested modal with different animation.</p>
      </Modal>
    </>
  );
}
```

### Mobile-Optimized Modal
```tsx
function MobileModal() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      position={isMobile ? 'bottom' : 'center'}
      size={isMobile ? 'full' : 'medium'}
      animation={isMobile ? 'slide' : 'scale'}
    >
      <div style={{ padding: isMobile ? '16px' : '24px' }}>
        <p>Content adapts to mobile view</p>
      </div>
    </Modal>
  );
}
```

## Related Components

- [Dialog](./Dialog.md) - Simpler version for basic confirmations
- [Drawer](./Drawer.md) - Side-sliding panel variant
- [Tooltip](./Tooltip.md) - For small hover information
- [Popover](./Popover.md) - For contextual information
- [Alert](./Alert.md) - For system messages and notifications 