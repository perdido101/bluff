import React from 'react';
import styled from 'styled-components';
import { Achievement, PlayerAchievement } from '../../server/src/services/achievementService';

interface AchievementsProps {
  achievements: PlayerAchievement[];
  className?: string;
}

const Container = styled.div`
  background: #1a1a1a;
  border-radius: 12px;
  padding: 16px;
  width: 100%;
  max-width: 800px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  color: #ffffff;
  margin: 0 0 16px;
  text-align: center;
  font-size: 24px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
  padding: 8px;
`;

const AchievementCard = styled.div<{ unlocked: boolean; rarity: Achievement['rarity'] }>`
  background: ${props => props.unlocked ? '#2a2a2a' : '#1a1a1a'};
  border: 2px solid ${props => {
    if (!props.unlocked) return '#333';
    switch (props.rarity) {
      case 'LEGENDARY': return '#ffd700';
      case 'EPIC': return '#9b30ff';
      case 'RARE': return '#4169e1';
      default: return '#32cd32';
    }
  }};
  border-radius: 8px;
  padding: 16px;
  position: relative;
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
`;

const Icon = styled.div`
  font-size: 32px;
  margin-bottom: 8px;
  opacity: ${props => props.style?.opacity};
`;

const Name = styled.h3`
  color: #ffffff;
  margin: 0 0 8px;
  font-size: 18px;
`;

const Description = styled.p`
  color: #888;
  margin: 0 0 16px;
  font-size: 14px;
`;

const ProgressBar = styled.div`
  background: #333;
  border-radius: 4px;
  height: 8px;
  margin-top: 8px;
  overflow: hidden;
  position: relative;
`;

const Progress = styled.div<{ progress: number }>`
  background: #4a5eff;
  height: 100%;
  transition: width 0.3s ease;
  width: ${props => Math.min(100, (props.progress * 100))}%;
`;

const ProgressText = styled.div`
  color: #888;
  font-size: 12px;
  margin-top: 4px;
  text-align: right;
`;

const UnlockDate = styled.div`
  color: #666;
  font-size: 12px;
  margin-top: 8px;
  text-align: right;
`;

const RarityBadge = styled.div<{ rarity: Achievement['rarity'] }>`
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: ${props => {
    switch (props.rarity) {
      case 'LEGENDARY': return '#ffd70022';
      case 'EPIC': return '#9b30ff22';
      case 'RARE': return '#4169e122';
      default: return '#32cd3222';
    }
  }};
  color: ${props => {
    switch (props.rarity) {
      case 'LEGENDARY': return '#ffd700';
      case 'EPIC': return '#9b30ff';
      case 'RARE': return '#4169e1';
      default: return '#32cd32';
    }
  }};
`;

export const Achievements: React.FC<AchievementsProps> = ({
  achievements,
  className,
}) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <Container className={className}>
      <Title>Achievements</Title>
      
      <Grid>
        {achievements.map(achievement => {
          const progress = achievement.progress / achievement.requirement;
          
          return (
            <AchievementCard
              key={achievement.id}
              unlocked={achievement.unlocked}
              rarity={achievement.rarity}
            >
              <RarityBadge rarity={achievement.rarity}>
                {achievement.rarity}
              </RarityBadge>
              
              <Icon style={{ opacity: achievement.unlocked ? 1 : 0.3 }}>
                {achievement.icon}
              </Icon>
              
              <Name>{achievement.name}</Name>
              <Description>{achievement.description}</Description>
              
              <ProgressBar>
                <Progress progress={progress} />
              </ProgressBar>
              
              <ProgressText>
                {achievement.progress} / {achievement.requirement}
              </ProgressText>
              
              {achievement.unlocked && achievement.unlockedAt && (
                <UnlockDate>
                  Unlocked on {formatDate(achievement.unlockedAt)}
                </UnlockDate>
              )}
            </AchievementCard>
          );
        })}
      </Grid>
    </Container>
  );
}; 