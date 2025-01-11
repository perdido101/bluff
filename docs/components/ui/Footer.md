# Footer Component

## Overview
The Footer component serves as the main footer area of the application, providing links to important pages, social media connections, and copyright information. It supports responsive design and customizable content sections.

## Props

```typescript
interface FooterProps {
  // Content
  links?: Array<{
    label: string;
    href: string;
    category?: string;
  }>;
  socialLinks?: Array<{
    platform: 'twitter' | 'github' | 'discord';
    href: string;
    icon?: React.ReactNode;
  }>;
  copyright?: string;
  
  // Customization
  className?: string;
  style?: React.CSSProperties;
  
  // Layout
  columns?: number;
  showSocialIcons?: boolean;
  
  // Events
  onLinkClick?: (href: string) => void;
  
  // Mobile
  mobileBreakpoint?: number;
}
```

## Usage

### Basic Usage
```tsx
import { Footer } from '@/components/ui/Footer';

function App() {
  return (
    <Footer
      copyright="© 2024 Bluff AI Game. All rights reserved."
      links={[
        { label: "About", href: "/about" },
        { label: "Rules", href: "/rules" },
        { label: "Privacy", href: "/privacy" }
      ]}
    />
  );
}
```

### With Social Links
```tsx
function SocialExample() {
  return (
    <Footer
      socialLinks={[
        { platform: "twitter", href: "https://twitter.com/bluffai" },
        { platform: "github", href: "https://github.com/bluffai" },
        { platform: "discord", href: "https://discord.gg/bluffai" }
      ]}
      showSocialIcons={true}
    />
  );
}
```

### With Categorized Links
```tsx
function CategorizedExample() {
  return (
    <Footer
      columns={3}
      links={[
        { label: "Game Rules", href: "/rules", category: "Game" },
        { label: "Leaderboard", href: "/leaderboard", category: "Game" },
        { label: "Terms", href: "/terms", category: "Legal" },
        { label: "Privacy", href: "/privacy", category: "Legal" },
        { label: "Blog", href: "/blog", category: "Community" },
        { label: "Forum", href: "/forum", category: "Community" }
      ]}
    />
  );
} 
```

## Styling

The component uses styled-components with theme integration and responsive design:

```typescript
const FooterContainer = styled.footer`
  width: 100%;
  background-color: ${props => props.theme.colors.background.secondary};
  padding: 3rem 0;
  margin-top: auto;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding: 2rem 0;
  }
`;

const FooterContent = styled.div`
  max-width: ${props => props.theme.sizes.maxWidth};
  margin: 0 auto;
  padding: 0 2rem;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding: 0 1rem;
  }
`;

const LinkGrid = styled.div<{ $columns: number }>`
  display: grid;
  grid-template-columns: repeat(${props => props.$columns}, 1fr);
  gap: 2rem;
  margin-bottom: 2rem;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const LinkCategory = styled.div`
  h3 {
    color: ${props => props.theme.colors.text.primary};
    font-size: ${props => props.theme.fontSizes.lg};
    font-weight: ${props => props.theme.fontWeights.bold};
    margin-bottom: 1rem;
  }
  
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  li {
    margin-bottom: 0.5rem;
  }
`;

const FooterLink = styled.a`
  color: ${props => props.theme.colors.text.secondary};
  text-decoration: none;
  transition: color 0.2s ease;
  
  &:hover {
    color: ${props => props.theme.colors.primary};
  }
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  
  a {
    color: ${props => props.theme.colors.text.secondary};
    font-size: ${props => props.theme.fontSizes.xl};
    transition: color 0.2s ease;
    
    &:hover {
      color: ${props => props.theme.colors.primary};
    }
  }
`;

const Copyright = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  text-align: center;
  margin: 0;
  padding-top: 2rem;
  border-top: 1px solid ${props => props.theme.colors.border};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    font-size: ${props => props.theme.fontSizes.sm};
  }
`;
```

The styling includes:
- Responsive grid layout for link categories
- Mobile-friendly design with breakpoints
- Theme integration for colors, spacing, and typography
- Smooth hover transitions
- Social media icon styling
- Proper spacing and borders

## Accessibility

The Footer component implements accessibility features following WAI-ARIA guidelines:

### ARIA Attributes and Semantic HTML
```tsx
function Footer({ links, socialLinks, copyright, ...props }: FooterProps) {
  return (
    <FooterContainer role="contentinfo">
      <FooterContent>
        <LinkGrid $columns={props.columns || 1}>
          {Object.entries(groupByCategory(links)).map(([category, categoryLinks]) => (
            <LinkCategory key={category}>
              <h3 id={`footer-${category.toLowerCase()}`}>{category}</h3>
              <ul
                role="list"
                aria-labelledby={`footer-${category.toLowerCase()}`}
              >
                {categoryLinks.map((link) => (
                  <li key={link.href}>
                    <FooterLink
                      href={link.href}
                      onClick={(e) => {
                        e.preventDefault();
                        props.onLinkClick?.(link.href);
                      }}
                    >
                      {link.label}
                    </FooterLink>
                  </li>
                ))}
              </ul>
            </LinkCategory>
          ))}
        </LinkGrid>

        {socialLinks && (
          <SocialLinks>
            {socialLinks.map((link) => (
              <FooterLink
                key={link.platform}
                href={link.href}
                aria-label={`Visit our ${link.platform} page`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.icon || <SocialIcon platform={link.platform} />}
              </FooterLink>
            ))}
          </SocialLinks>
        )}

        {copyright && (
          <Copyright aria-label="Copyright information">
            {copyright}
          </Copyright>
        )}
      </FooterContent>
    </FooterContainer>
  );
}
```

### Keyboard Navigation
```typescript
// Handle keyboard navigation within link categories
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      // Add visible focus styles
      document.body.classList.add('user-is-tabbing');
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

### Focus Management
```typescript
const FooterLink = styled.a`
  // ... existing styles ...

  &:focus {
    outline: 2px solid ${props => props.theme.colors.primary};
    outline-offset: 2px;
  }

  // Only show focus ring when using keyboard
  .user-is-tabbing & {
    &:focus {
      box-shadow: 0 0 0 2px ${props => props.theme.colors.background.primary},
                 0 0 0 4px ${props => props.theme.colors.primary};
    }
  }
`;
```

### Screen Reader Considerations
- Proper heading hierarchy with `h3` for category titles
- Semantic HTML structure using `footer`, `nav`, and `ul`/`li` elements
- ARIA labels for social media links
- Descriptive link text
- Proper grouping of related links using `aria-labelledby`

## Testing

### Unit Tests
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Footer } from './Footer';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/styles/theme';

describe('Footer', () => {
  const renderWithTheme = (ui: React.ReactElement) => {
    return render(
      <ThemeProvider theme={theme}>
        {ui}
      </ThemeProvider>
    );
  };

  // Basic rendering tests
  describe('rendering', () => {
    it('renders with basic props', () => {
      const copyright = "© 2024 Test App";
      renderWithTheme(
        <Footer
          copyright={copyright}
          links={[
            { label: "About", href: "/about" }
          ]}
        />
      );
      
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
      expect(screen.getByText(copyright)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /about/i })).toBeInTheDocument();
    });

    it('renders categorized links correctly', () => {
      renderWithTheme(
        <Footer
          links={[
            { label: "Rules", href: "/rules", category: "Game" },
            { label: "Privacy", href: "/privacy", category: "Legal" }
          ]}
          columns={2}
        />
      );
      
      expect(screen.getByText('Game')).toBeInTheDocument();
      expect(screen.getByText('Legal')).toBeInTheDocument();
      expect(screen.getAllByRole('list')).toHaveLength(2);
    });
  });

  // Interaction tests
  describe('interactions', () => {
    it('handles link clicks', () => {
      const onLinkClick = jest.fn();
      renderWithTheme(
        <Footer
          links={[{ label: "About", href: "/about" }]}
          onLinkClick={onLinkClick}
        />
      );
      
      const link = screen.getByRole('link', { name: /about/i });
      fireEvent.click(link);
      
      expect(onLinkClick).toHaveBeenCalledWith('/about');
    });

    it('opens social links in new tab', () => {
      renderWithTheme(
        <Footer
          socialLinks={[
            { platform: "twitter", href: "https://twitter.com/test" }
          ]}
        />
      );
      
      const socialLink = screen.getByRole('link', { name: /visit our twitter/i });
      expect(socialLink).toHaveAttribute('target', '_blank');
      expect(socialLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });
});
```

### Integration Tests
```typescript
describe('Footer Integration', () => {
  it('integrates with theme changes', () => {
    const { rerender } = renderWithTheme(
      <Footer
        links={[{ label: "About", href: "/about" }]}
      />
    );
    
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveStyle({
      backgroundColor: theme.colors.background.secondary
    });
    
    // Test theme update
    const newTheme = {
      ...theme,
      colors: {
        ...theme.colors,
        background: {
          ...theme.colors.background,
          secondary: '#000000'
        }
      }
    };
    
    rerender(
      <ThemeProvider theme={newTheme}>
        <Footer
          links={[{ label: "About", href: "/about" }]}
        />
      </ThemeProvider>
    );
    
    expect(footer).toHaveStyle({
      backgroundColor: '#000000'
    });
  });

  it('maintains accessibility after dynamic updates', async () => {
    const { rerender } = renderWithTheme(
      <Footer
        links={[{ label: "About", href: "/about" }]}
      />
    );
    
    // Add new category
    rerender(
      <Footer
        links={[
          { label: "About", href: "/about" },
          { label: "Rules", href: "/rules", category: "Game" }
        ]}
      />
    );
    
    const lists = screen.getAllByRole('list');
    lists.forEach(list => {
      expect(list).toHaveAttribute('aria-labelledby');
    });
  });
});
```

### Accessibility Tests
```typescript
describe('Footer Accessibility', () => {
  it('maintains focus order', () => {
    renderWithTheme(
      <Footer
        links={[
          { label: "About", href: "/about" },
          { label: "Rules", href: "/rules" }
        ]}
      />
    );
    
    const links = screen.getAllByRole('link');
    links[0].focus();
    
    // Simulate tab navigation
    userEvent.tab();
    expect(document.activeElement).toBe(links[1]);
  });

  it('handles keyboard navigation', () => {
    renderWithTheme(
      <Footer
        links={[{ label: "About", href: "/about" }]}
      />
    );
    
    const link = screen.getByRole('link', { name: /about/i });
    
    // Test keyboard activation
    link.focus();
    fireEvent.keyDown(link, { key: 'Enter' });
    expect(link).toHaveAttribute('aria-pressed', 'true');
  });

  it('provides proper ARIA labels', () => {
    renderWithTheme(
      <Footer
        socialLinks={[
          { platform: "twitter", href: "https://twitter.com/test" }
        ]}
      />
    );
    
    const socialLink = screen.getByRole('link', { name: /visit our twitter/i });
    expect(socialLink).toHaveAttribute('aria-label');
  });
});