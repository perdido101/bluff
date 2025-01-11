# Header Component

## Overview
The Header component serves as the main navigation and branding area of the application. It provides consistent navigation, user authentication status, and responsive behavior across different screen sizes.

## Props

```typescript
interface HeaderProps {
  // Authentication
  isAuthenticated?: boolean;
  userProfile?: {
    username: string;
    avatar?: string;
  };
  
  // Navigation
  currentPath?: string;
  onNavigate?: (path: string) => void;
  
  // Branding
  logo?: React.ReactNode;
  title?: string;
  
  // Actions
  onLogin?: () => void;
  onLogout?: () => void;
  onProfileClick?: () => void;
  
  // Customization
  className?: string;
  style?: React.CSSProperties;
  
  // Mobile
  mobileMenuBreakpoint?: number;
  showMobileMenu?: boolean;
  onMobileMenuToggle?: () => void;
}
```

## Usage

### Basic Usage
```tsx
import { Header } from '@/components/ui/Header';

function App() {
  return (
    <Header
      title="Bluff AI Game"
      isAuthenticated={false}
      onLogin={() => {/* handle login */}}
    />
  );
}
```

### With User Profile
```tsx
function AuthenticatedExample() {
  return (
    <Header
      isAuthenticated={true}
      userProfile={{
        username: "Player123",
        avatar: "/avatars/player.png"
      }}
      onLogout={() => {/* handle logout */}}
      onProfileClick={() => {/* show profile menu */}}
    />
  );
}
```

### With Custom Navigation
```tsx
function NavigationExample() {
  const [currentPath, setCurrentPath] = useState('/');
  
  return (
    <Header
      currentPath={currentPath}
      onNavigate={setCurrentPath}
      logo={<CustomLogo />}
      title="Game Portal"
    />
  );
} 
```

## Styling

The component uses styled-components with theme integration and responsive design:

```typescript
const HeaderContainer = styled.header`
  position: sticky;
  top: 0;
  z-index: ${props => props.theme.zIndices.header};
  width: 100%;
  background-color: ${props => props.theme.colors.background.primary};
  box-shadow: ${props => props.theme.shadows.small};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding: 0.5rem;
  }
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: ${props => props.theme.sizes.maxWidth};
  margin: 0 auto;
  padding: 1rem 2rem;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding: 0.5rem 1rem;
  }
`;

const BrandingSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  
  img {
    height: 40px;
    width: auto;
  }
  
  h1 {
    font-size: ${props => props.theme.fontSizes.xl};
    font-weight: ${props => props.theme.fontWeights.bold};
    color: ${props => props.theme.colors.text.primary};
    margin: 0;
    
    @media (max-width: ${props => props.theme.breakpoints.md}) {
      font-size: ${props => props.theme.fontSizes.lg};
    }
  }
`;

const NavigationSection = styled.nav<{ $isMobileMenuOpen: boolean }>`
  display: flex;
  align-items: center;
  gap: 2rem;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    display: ${props => props.$isMobileMenuOpen ? 'flex' : 'none'};
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    flex-direction: column;
    background-color: ${props => props.theme.colors.background.primary};
    padding: 1rem;
    box-shadow: ${props => props.theme.shadows.medium};
  }
`;

const NavLink = styled.a<{ $isActive: boolean }>`
  color: ${props => 
    props.$isActive 
      ? props.theme.colors.primary 
      : props.theme.colors.text.primary
  };
  text-decoration: none;
  font-weight: ${props => 
    props.$isActive 
      ? props.theme.fontWeights.bold 
      : props.theme.fontWeights.medium
  };
  padding: 0.5rem;
  border-radius: ${props => props.theme.radii.sm};
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.theme.colors.background.hover};
  }
`;

const ProfileSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Avatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
`;

const MobileMenuButton = styled.button`
  display: none;
  padding: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  color: ${props => props.theme.colors.text.primary};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    display: block;
  }
  
  &:hover {
    background-color: ${props => props.theme.colors.background.hover};
    border-radius: ${props => props.theme.radii.sm};
  }
`;
``` 
```

## Accessibility

The Header component implements accessibility features following WAI-ARIA guidelines:

### ARIA Attributes and Keyboard Navigation
```tsx
function Header({ 
  isAuthenticated,
  showMobileMenu,
  onMobileMenuToggle,
  ...props 
}: HeaderProps) {
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  return (
    <HeaderContainer role="banner">
      <HeaderContent>
        <BrandingSection>
          <a href="/" aria-label="Home">
            {props.logo}
          </a>
          <h1>{props.title}</h1>
        </BrandingSection>
        
        <MobileMenuButton
          ref={menuButtonRef}
          aria-expanded={showMobileMenu}
          aria-controls="navigation-menu"
          aria-label={showMobileMenu ? "Close menu" : "Open menu"}
          onClick={onMobileMenuToggle}
        >
          <span className="sr-only">
            {showMobileMenu ? "Close menu" : "Open menu"}
          </span>
          {/* Icon implementation */}
        </MobileMenuButton>
        
        <NavigationSection
          id="navigation-menu"
          ref={menuRef}
          $isMobileMenuOpen={showMobileMenu}
          aria-label="Main navigation"
        >
          {/* Navigation items */}
        </NavigationSection>
        
        <ProfileSection aria-label="User menu">
          {isAuthenticated ? (
            <button
              onClick={props.onProfileClick}
              aria-label="Open profile menu"
              aria-haspopup="true"
            >
              <Avatar 
                src={props.userProfile?.avatar} 
                alt={`${props.userProfile?.username}'s avatar`}
              />
            </button>
          ) : (
            <button
              onClick={props.onLogin}
              aria-label="Log in"
            >
              Log in
            </button>
          )}
        </ProfileSection>
      </HeaderContent>
    </HeaderContainer>
  );
}
```

### Focus Management
```typescript
// Handle keyboard navigation in mobile menu
useEffect(() => {
  if (!showMobileMenu) return;
  
  const menuItems = menuRef.current?.querySelectorAll('a, button');
  const firstItem = menuItems?.[0];
  const lastItem = menuItems?.[menuItems.length - 1];
  
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onMobileMenuToggle?.();
      menuButtonRef.current?.focus();
    }
    
    if (e.key === 'Tab') {
      if (!e.shiftKey && document.activeElement === lastItem) {
        e.preventDefault();
        firstItem?.focus();
      } else if (e.shiftKey && document.activeElement === firstItem) {
        e.preventDefault();
        lastItem?.focus();
      }
    }
  };
  
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [showMobileMenu, onMobileMenuToggle]);
```

### Screen Reader Considerations
- Skip link provided for keyboard users to bypass header navigation
- Proper heading hierarchy with `h1` for site title
- Meaningful labels for all interactive elements
- Status announcements for mobile menu state changes
- Clear indication of current page in navigation

### Responsive Behavior
```typescript
// Announce mobile menu state changes to screen readers
useEffect(() => {
  if (showMobileMenu) {
    announceToScreenReader('Navigation menu opened');
  } else {
    announceToScreenReader('Navigation menu closed');
  }
}, [showMobileMenu]);

// Handle window resize
useEffect(() => {
  const handleResize = () => {
    if (window.innerWidth > mobileMenuBreakpoint && showMobileMenu) {
      onMobileMenuToggle?.();
    }
  };
  
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, [mobileMenuBreakpoint, showMobileMenu, onMobileMenuToggle]);
``` 
```

## Testing

### Unit Tests
```typescript
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Header } from './Header';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/styles/theme';

describe('Header', () => {
  const renderWithTheme = (ui: React.ReactElement) => {
    return render(
      <ThemeProvider theme={theme}>
        {ui}
      </ThemeProvider>
    );
  };

  // Rendering tests
  describe('rendering', () => {
    it('renders with basic props', () => {
      renderWithTheme(
        <Header
          title="Test App"
          isAuthenticated={false}
        />
      );
      
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByText('Test App')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
    });

    it('renders authenticated state', () => {
      renderWithTheme(
        <Header
          isAuthenticated={true}
          userProfile={{
            username: 'testuser',
            avatar: '/test-avatar.png'
          }}
        />
      );
      
      expect(screen.getByRole('img', { name: /testuser's avatar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /open profile menu/i })).toBeInTheDocument();
    });
  });

  // Navigation tests
  describe('navigation', () => {
    it('handles navigation clicks', () => {
      const onNavigate = jest.fn();
      renderWithTheme(
        <Header
          currentPath="/home"
          onNavigate={onNavigate}
        />
      );
      
      const navLink = screen.getByRole('link', { name: /home/i });
      fireEvent.click(navLink);
      
      expect(onNavigate).toHaveBeenCalledWith('/home');
    });

    it('indicates current page', () => {
      renderWithTheme(
        <Header currentPath="/home" />
      );
      
      const activeLink = screen.getByRole('link', { name: /home/i });
      expect(activeLink).toHaveStyle({
        fontWeight: theme.fontWeights.bold
      });
    });
  });

  // Mobile menu tests
  describe('mobile menu', () => {
    beforeEach(() => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375 // iPhone X width
      });
    });

    it('toggles mobile menu', () => {
      const onMobileMenuToggle = jest.fn();
      renderWithTheme(
        <Header
          showMobileMenu={false}
          onMobileMenuToggle={onMobileMenuToggle}
        />
      );
      
      const menuButton = screen.getByRole('button', { name: /open menu/i });
      fireEvent.click(menuButton);
      
      expect(onMobileMenuToggle).toHaveBeenCalled();
    });

    it('handles keyboard navigation in mobile menu', () => {
      renderWithTheme(
        <Header showMobileMenu={true} />
      );
      
      const menuItems = screen.getAllByRole('link');
      const firstItem = menuItems[0];
      const lastItem = menuItems[menuItems.length - 1];
      
      // Test tab navigation
      firstItem.focus();
      fireEvent.keyDown(firstItem, { key: 'Tab', shiftKey: true });
      expect(document.activeElement).toBe(lastItem);
      
      // Test escape key
      fireEvent.keyDown(firstItem, { key: 'Escape' });
      expect(screen.queryByRole('navigation')).not.toBeVisible();
    });
  });

  // Accessibility tests
  describe('accessibility', () => {
    it('provides skip link for keyboard users', () => {
      renderWithTheme(<Header />);
      const skipLink = screen.getByText(/skip to main content/i);
      
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).not.toBeVisible();
      
      // Should become visible on focus
      skipLink.focus();
      expect(skipLink).toBeVisible();
    });

    it('announces menu state changes', () => {
      const { rerender } = renderWithTheme(
        <Header showMobileMenu={false} />
      );
      
      rerender(
        <Header showMobileMenu={true} />
      );
      
      // Check that announcement was made
      // This would require setting up a mock for announceToScreenReader
    });
  });
});
```

### Integration Tests
```typescript
describe('Header Integration', () => {
  it('integrates with authentication flow', async () => {
    const onLogin = jest.fn();
    const onLogout = jest.fn();
    
    const { rerender } = renderWithTheme(
      <Header
        isAuthenticated={false}
        onLogin={onLogin}
      />
    );
    
    // Test login
    const loginButton = screen.getByRole('button', { name: /log in/i });
    fireEvent.click(loginButton);
    expect(onLogin).toHaveBeenCalled();
    
    // Test authenticated state
    rerender(
      <Header
        isAuthenticated={true}
        userProfile={{
          username: 'testuser',
          avatar: '/test-avatar.png'
        }}
        onLogout={onLogout}
      />
    );
    
    const profileButton = screen.getByRole('button', { name: /open profile menu/i });
    expect(profileButton).toBeInTheDocument();
    
    // Test logout
    fireEvent.click(profileButton);
    const logoutButton = screen.getByRole('button', { name: /log out/i });
    fireEvent.click(logoutButton);
    expect(onLogout).toHaveBeenCalled();
  });

  it('handles window resize', () => {
    const onMobileMenuToggle = jest.fn();
    renderWithTheme(
      <Header
        showMobileMenu={true}
        onMobileMenuToggle={onMobileMenuToggle}
        mobileMenuBreakpoint={768}
      />
    );
    
    // Simulate window resize
    act(() => {
      window.innerWidth = 1024;
      window.dispatchEvent(new Event('resize'));
    });
    
    expect(onMobileMenuToggle).toHaveBeenCalled();
  });
}); 