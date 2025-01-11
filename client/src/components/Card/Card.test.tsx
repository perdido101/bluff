import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { Card } from './Card';

describe('Card Component', () => {
  const mockCard = {
    suit: 'hearts' as const,
    value: 'A' as const
  };

  it('renders face-up card correctly', () => {
    render(<Card card={mockCard} />);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('♥')).toBeInTheDocument();
  });

  it('renders face-down card without value', () => {
    render(<Card card={mockCard} faceDown={true} />);
    expect(screen.queryByText('A')).not.toBeInTheDocument();
    expect(screen.queryByText('♥')).not.toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Card card={mockCard} onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies selected styles when selected prop is true', () => {
    render(<Card card={mockCard} selected={true} />);
    const container = screen.getByRole('button');
    expect(container).toHaveStyle({ background: '#e3f2fd' });
  });
}); 