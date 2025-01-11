import React from 'react';
import styled from 'styled-components';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const TutorialCard = styled.div`
  background: white;
  padding: 30px;
  border-radius: 15px;
  max-width: 600px;
  text-align: center;
  position: relative;
`;

const Title = styled.h2`
  color: #4a90e2;
  margin-bottom: 20px;
`;

const Text = styled.p`
  font-size: 18px;
  line-height: 1.6;
  margin-bottom: 20px;
`;

const Button = styled.button`
  padding: 10px 20px;
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;

  &:hover {
    background: #357abd;
  }
`;

interface TutorialStep {
  title: string;
  content: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    title: "Welcome to Bluff AI! 🎮",
    content: "Ready to match wits with an AI that's mastered the art of deception? You're about to play Bluff (also known as BS or Cheat) against a crafty artificial opponent!"
  },
  {
    title: "The Basics 🃏",
    content: "The goal is simple: get rid of all your cards first! Each turn, you'll play cards of the same value (like two 7s or three Kings). But here's the twist - you can lie about what you're playing!"
  },
  {
    title: "Bluffing 🎭",
    content: "When it's your turn, you can play any cards and claim they're any value. Playing three cards and saying they're all Aces when they're really 2s? That's the spirit! Just don't get caught..."
  },
  {
    title: "Challenging 🕵️",
    content: "Think the AI is lying? Hit that Challenge button! If you catch them bluffing, they pick up the whole pile. But if they were honest, you get the pile instead. Choose wisely!"
  },
  {
    title: "Your Opponent 🤖",
    content: "You're playing against Claude, an AI that learns from your play style. It tracks probabilities, remembers your patterns, and isn't afraid to bluff. Can you outsmart it?"
  },
  {
    title: "Ready to Play? 🎲",
    content: "Remember: a good bluffer keeps their opponent guessing. Mix up your strategy, watch for patterns, and may the best bluffer win!"
  }
];

interface Props {
  onComplete: () => void;
}

export const TutorialOverlay: React.FC<Props> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = React.useState(0);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  return (
    <Overlay>
      <TutorialCard>
        <Title>{tutorialSteps[currentStep].title}</Title>
        <Text>{tutorialSteps[currentStep].content}</Text>
        <Button onClick={handleNext}>
          {currentStep === tutorialSteps.length - 1 ? "Let's Play!" : "Next"}
        </Button>
      </TutorialCard>
    </Overlay>
  );
}; 