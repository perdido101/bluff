import { motion } from 'framer-motion';
import styled from 'styled-components';
import { CardComponent } from './Card';
import { Card } from '../types';

const AnimatedContainer = styled(motion.div)`
  position: relative;
`;

interface AnimatedCardProps {
  card: Card;
  selected?: boolean;
  onClick?: () => void;
  initial?: object;
  animate?: object;
  exit?: object;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  card,
  selected,
  onClick,
  initial = { scale: 0 },
  animate = { scale: 1 },
  exit = { scale: 0 }
}) => {
  return (
    <AnimatedContainer
      initial={initial}
      animate={animate}
      exit={exit}
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
    >
      <CardComponent card={card} selected={selected} onClick={onClick} />
    </AnimatedContainer>
  );
}; 