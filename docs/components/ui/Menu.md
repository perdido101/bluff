# Menu Component

## Overview
The Menu component provides a flexible dropdown menu system that supports nested items, keyboard navigation, and various trigger methods. It's commonly used for navigation, settings, and action menus throughout the application.

## Props

```typescript
interface MenuProps {
  // Content
  items: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    href?: string;
    onClick?: () => void;
    disabled?: boolean;
    children?: Array<Omit<MenuProps['items'][0], 'children'>>;
  }>;
  
  // Trigger
  trigger: React.ReactNode;
  triggerType?: 'click' | 'hover';
  
  // Positioning
  placement?: 'top' | 'right' | 'bottom' | 'left';
  offset?: number;
  
  // State
  isOpen?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  
  // Behavior
  closeOnSelect?: boolean;
  closeOnClickOutside?: boolean;
  
  // Customization
  className?: string;
  style?: React.CSSProperties;
  
  // Animation
  animationDuration?: number;
}
```

## Usage

### Basic Usage
```tsx
import { Menu } from '@/components/ui/Menu';

function BasicExample() {
  return (
    <Menu
      trigger={<button>Open Menu</button>}
      items={[
        { id: '1', label: 'Profile', onClick: () => {} },
        { id: '2', label: 'Settings', onClick: () => {} },
        { id: '3', label: 'Logout', onClick: () => {} }
      ]}
    />
  );
}
```

### With Icons and Nested Items
```tsx
function NestedExample() {
  return (
    <Menu
      trigger={<button>Game Menu</button>}
      items={[
        {
          id: 'game',
          label: 'Game',
          icon: <GameIcon />,
          children: [
            { id: 'new', label: 'New Game', onClick: () => {} },
            { id: 'save', label: 'Save Game', onClick: () => {} }
          ]
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: <SettingsIcon />,
          children: [
            { id: 'audio', label: 'Audio', onClick: () => {} },
            { id: 'video', label: 'Video', onClick: () => {} }
          ]
        }
      ]}
    />
  );
}
```

### Controlled Menu
```tsx
function ControlledExample() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Menu
      trigger={<button>Options</button>}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      items={[
        { id: '1', label: 'Option 1', onClick: () => {} },
        { id: '2', label: 'Option 2', onClick: () => {} }
      ]}
      placement="bottom"
      offset={8}
    />
  );
} 
```

## Styling

The component uses styled-components with theme integration and animations:

```typescript
const MenuContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const MenuTrigger = styled.div`
  cursor: pointer;
  
  &[aria-expanded="true"] {
    color: ${props => props.theme.colors.primary};
  }
`;

const MenuContent = styled.div<{ $placement: MenuProps['placement'], $isOpen: boolean }>`
  position: absolute;
  min-width: 200px;
  background-color: ${props => props.theme.colors.background.primary};
  border-radius: ${props => props.theme.radii.md};
  box-shadow: ${props => props.theme.shadows.large};
  z-index: ${props => props.theme.zIndices.dropdown};
  
  // Placement styles
  ${props => {
    switch (props.$placement) {
      case 'top':
        return `
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-bottom: ${props.theme.space[2]};
        `;
      case 'right':
        return `
          left: 100%;
          top: 0;
          margin-left: ${props.theme.space[2]};
        `;
      case 'left':
        return `
          right: 100%;
          top: 0;
          margin-right: ${props.theme.space[2]};
        `;
      default:
        return `
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-top: ${props.theme.space[2]};
        `;
    }
  }}
  
  // Animation
  opacity: ${props => props.$isOpen ? 1 : 0};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transition: all ${props => props.theme.transitions.normal} ease;
`;

const MenuItem = styled.button<{ $hasIcon: boolean; $isDisabled: boolean }>`
  display: flex;
  align-items: center;
  width: 100%;
  padding: ${props => props.theme.space[2]} ${props => props.theme.space[3]};
  border: none;
  background: none;
  color: ${props => 
    props.$isDisabled 
      ? props.theme.colors.text.disabled 
      : props.theme.colors.text.primary
  };
  cursor: ${props => props.$isDisabled ? 'not-allowed' : 'pointer'};
  font-size: ${props => props.theme.fontSizes.md};
  text-align: left;
  
  ${props => props.$hasIcon && `
    gap: ${props.theme.space[2]};
    
    svg {
      width: 16px;
      height: 16px;
    }
  `}
  
  &:hover:not(:disabled) {
    background-color: ${props => props.theme.colors.background.hover};
  }
  
  &:focus-visible {
    outline: 2px solid ${props => props.theme.colors.primary};
    outline-offset: -2px;
  }
`;

const MenuDivider = styled.hr`
  margin: ${props => props.theme.space[1]} 0;
  border: none;
  border-top: 1px solid ${props => props.theme.colors.border};
`;

const NestedMenuIndicator = styled.span`
  margin-left: auto;
  color: ${props => props.theme.colors.text.secondary};
`;

const NestedMenuContent = styled(MenuContent)`
  top: 0;
  left: 100%;
  margin-left: ${props => props.theme.space[1]};
  transform: none;
`;
```

The styling includes:
- Flexible positioning system with four placement options
- Smooth animations for opening/closing
- Support for icons and nested menus
- Hover and focus states
- Theme integration for consistent styling
- Responsive sizing and spacing
- Accessibility-focused styling (focus indicators, disabled states)

## Accessibility

The Menu component implements accessibility features following WAI-ARIA guidelines:

### ARIA Attributes and Keyboard Navigation
```tsx
function Menu({ items, trigger, isOpen, onOpenChange, ...props }: MenuProps) {
  const menuId = useId();
  const [activeIndex, setActiveIndex] = useState(-1);
  
  return (
    <MenuContainer>
      <MenuTrigger
        role="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => onOpenChange?.(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpenChange?.(!isOpen);
          }
          if (e.key === 'ArrowDown' && !isOpen) {
            e.preventDefault();
            onOpenChange?.(true);
            setActiveIndex(0);
          }
        }}
      >
        {trigger}
      </MenuTrigger>

      <MenuContent
        id={menuId}
        role="menu"
        aria-orientation="vertical"
        $isOpen={isOpen}
        $placement={props.placement}
      >
        {items.map((item, index) => (
          <MenuItem
            key={item.id}
            role="menuitem"
            aria-disabled={item.disabled}
            tabIndex={isOpen ? 0 : -1}
            $hasIcon={!!item.icon}
            $isDisabled={!!item.disabled}
            onClick={() => {
              if (!item.disabled) {
                item.onClick?.();
                if (props.closeOnSelect) {
                  onOpenChange?.(false);
                }
              }
            }}
            onKeyDown={(e) => {
              switch (e.key) {
                case 'ArrowDown':
                  e.preventDefault();
                  setActiveIndex((index + 1) % items.length);
                  break;
                case 'ArrowUp':
                  e.preventDefault();
                  setActiveIndex((index - 1 + items.length) % items.length);
                  break;
                case 'Home':
                  e.preventDefault();
                  setActiveIndex(0);
                  break;
                case 'End':
                  e.preventDefault();
                  setActiveIndex(items.length - 1);
                  break;
                case 'Enter':
                case ' ':
                  e.preventDefault();
                  if (!item.disabled) {
                    item.onClick?.();
                    if (props.closeOnSelect) {
                      onOpenChange?.(false);
                    }
                  }
                  break;
                case 'Escape':
                  e.preventDefault();
                  onOpenChange?.(false);
                  break;
              }
            }}
          >
            {item.icon && (
              <span aria-hidden="true">{item.icon}</span>
            )}
            {item.label}
            {item.children && (
              <NestedMenuIndicator aria-hidden="true">
                ›
              </NestedMenuIndicator>
            )}
          </MenuItem>
        ))}
      </MenuContent>
    </MenuContainer>
  );
}
```

### Focus Management
```typescript
// Handle focus when menu opens/closes
useEffect(() => {
  if (isOpen) {
    // Focus first non-disabled item
    const firstEnabledItem = items.findIndex(item => !item.disabled);
    if (firstEnabledItem !== -1) {
      setActiveIndex(firstEnabledItem);
    }
  } else {
    // Return focus to trigger when menu closes
    const triggerElement = triggerRef.current;
    if (triggerElement && document.activeElement !== triggerElement) {
      triggerElement.focus();
    }
  }
}, [isOpen, items]);

// Handle click outside
useEffect(() => {
  if (!isOpen || !props.closeOnClickOutside) return;

  const handleClickOutside = (event: MouseEvent) => {
    if (
      menuRef.current &&
      !menuRef.current.contains(event.target as Node) &&
      triggerRef.current &&
      !triggerRef.current.contains(event.target as Node)
    ) {
      onOpenChange?.(false);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [isOpen, props.closeOnClickOutside, onOpenChange]);
```

### Screen Reader Considerations
- Menu trigger clearly indicates it will open a menu
- Menu items are properly labeled with their function
- Disabled states are announced
- Nested menus are indicated
- Keyboard shortcuts are announced
- Focus is managed predictably
- Menu state changes are announced
- Icons are hidden from screen readers when decorative

## Testing

The Menu component includes comprehensive tests to ensure functionality, accessibility, and proper behavior:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Menu } from './Menu';

describe('Menu Component', () => {
  const mockItems = [
    { id: '1', label: 'Item 1', onClick: jest.fn() },
    { id: '2', label: 'Item 2', onClick: jest.fn() },
    { id: '3', label: 'Item 3', disabled: true },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders trigger button correctly', () => {
      render(
        <Menu
          trigger={<button>Open Menu</button>}
          items={mockItems}
        />
      );
      
      expect(screen.getByRole('button')).toHaveTextContent('Open Menu');
    });

    it('renders menu items when opened', async () => {
      render(
        <Menu
          trigger={<button>Open Menu</button>}
          items={mockItems}
        />
      );
      
      await userEvent.click(screen.getByRole('button'));
      
      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(screen.getAllByRole('menuitem')).toHaveLength(3);
    });
  });

  describe('Interaction', () => {
    it('opens menu on trigger click', async () => {
      render(
        <Menu
          trigger={<button>Open Menu</button>}
          items={mockItems}
        />
      );
      
      await userEvent.click(screen.getByRole('button'));
      expect(screen.getByRole('menu')).toBeVisible();
    });

    it('calls item onClick when clicked', async () => {
      render(
        <Menu
          trigger={<button>Open Menu</button>}
          items={mockItems}
        />
      );
      
      await userEvent.click(screen.getByRole('button'));
      await userEvent.click(screen.getByText('Item 1'));
      
      expect(mockItems[0].onClick).toHaveBeenCalled();
    });

    it('does not call onClick for disabled items', async () => {
      render(
        <Menu
          trigger={<button>Open Menu</button>}
          items={mockItems}
        />
      );
      
      await userEvent.click(screen.getByRole('button'));
      await userEvent.click(screen.getByText('Item 3'));
      
      expect(mockItems[2].onClick).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('opens menu on Enter key', async () => {
      render(
        <Menu
          trigger={<button>Open Menu</button>}
          items={mockItems}
        />
      );
      
      const trigger = screen.getByRole('button');
      trigger.focus();
      await userEvent.keyboard('{Enter}');
      
      expect(screen.getByRole('menu')).toBeVisible();
    });

    it('navigates items with arrow keys', async () => {
      render(
        <Menu
          trigger={<button>Open Menu</button>}
          items={mockItems}
        />
      );
      
      await userEvent.click(screen.getByRole('button'));
      await userEvent.keyboard('{ArrowDown}');
      
      expect(document.activeElement).toHaveTextContent('Item 1');
      
      await userEvent.keyboard('{ArrowDown}');
      expect(document.activeElement).toHaveTextContent('Item 2');
    });

    it('closes menu on Escape key', async () => {
      render(
        <Menu
          trigger={<button>Open Menu</button>}
          items={mockItems}
        />
      );
      
      await userEvent.click(screen.getByRole('button'));
      await userEvent.keyboard('{Escape}');
      
      expect(screen.queryByRole('menu')).not.toBeVisible();
    });
  });

  describe('Accessibility', () => {
    it('has correct ARIA attributes', () => {
      render(
        <Menu
          trigger={<button>Open Menu</button>}
          items={mockItems}
        />
      );
      
      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('aria-haspopup', 'true');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('manages focus correctly', async () => {
      render(
        <Menu
          trigger={<button>Open Menu</button>}
          items={mockItems}
        />
      );
      
      const trigger = screen.getByRole('button');
      await userEvent.click(trigger);
      
      expect(screen.getByRole('menu')).toHaveAttribute('aria-orientation', 'vertical');
      
      await userEvent.keyboard('{Escape}');
      expect(trigger).toHaveFocus();
    });
  });
});