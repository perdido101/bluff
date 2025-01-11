import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { BrowserCompatibilityService } from '../services/BrowserCompatibilityService';

const Container = styled.div`
  padding: 20px;
  background: #1a1a1a;
  border-radius: 8px;
  color: #ffffff;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h2`
  margin: 0;
  color: #ffffff;
`;

const BrowserInfo = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 14px;
  color: #bdbdbd;
`;

const BrowserIcon = styled.span`
  font-size: 20px;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
`;

const FeatureCard = styled.div<{ supported: boolean }>`
  background: ${({ supported }) => supported ? '#2d2d2d' : '#3d2d2d'};
  padding: 15px;
  border-radius: 4px;
  border-left: 4px solid ${({ supported }) => supported ? '#4caf50' : '#ff9800'};
`;

const FeatureName = styled.div`
  font-weight: 600;
  margin-bottom: 5px;
`;

const FeatureDetails = styled.div`
  font-size: 12px;
  color: #bdbdbd;
`;

const IssuesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Issue = styled.div<{ severity: 'WARNING' | 'CRITICAL' }>`
  background: ${({ severity }) => severity === 'CRITICAL' ? '#f443361a' : '#ff97001a'};
  border-left: 4px solid ${({ severity }) => severity === 'CRITICAL' ? '#f44336' : '#ff9700'};
  padding: 15px;
  border-radius: 4px;
`;

const IssueHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
`;

const IssueSeverity = styled.span<{ severity: 'WARNING' | 'CRITICAL' }>`
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  background: ${({ severity }) => severity === 'CRITICAL' ? '#f44336' : '#ff9700'};
  color: white;
`;

const IssueMessage = styled.div`
  font-size: 14px;
`;

const IssueWorkaround = styled.div`
  font-size: 12px;
  color: #bdbdbd;
  margin-top: 5px;
`;

export const BrowserCompatibility: React.FC = () => {
  const [browserInfo, setBrowserInfo] = useState<any>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const service = BrowserCompatibilityService.getInstance();

  useEffect(() => {
    service.checkCompatibility();
    setBrowserInfo(service.getBrowserInfo());
    setIssues(service.getIssues());
  }, []);

  const getBrowserIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'chrome': return '🌐';
      case 'firefox': return '🦊';
      case 'safari': return '🧭';
      case 'edge': return '📱';
      default: return '🌐';
    }
  };

  if (!browserInfo) {
    return <Container>Loading browser information...</Container>;
  }

  return (
    <Container>
      <Header>
        <Title>Browser Compatibility</Title>
        <BrowserInfo>
          <BrowserIcon>{getBrowserIcon(browserInfo.name)}</BrowserIcon>
          {browserInfo.name} {browserInfo.version} on {browserInfo.platform}
        </BrowserInfo>
      </Header>

      <FeaturesGrid>
        {browserInfo.features.map((feature: any) => (
          <FeatureCard key={feature.name} supported={feature.supported}>
            <FeatureName>{feature.name}</FeatureName>
            <FeatureDetails>
              {feature.supported ? '✓ Supported' : feature.fallbackAvailable ? '⚠ Fallback Available' : '✕ Not Supported'}
              {feature.details && ` • ${feature.details}`}
            </FeatureDetails>
          </FeatureCard>
        ))}
      </FeaturesGrid>

      {issues.length > 0 && (
        <IssuesList>
          {issues.map((issue, index) => (
            <Issue key={index} severity={issue.severity}>
              <IssueHeader>
                <IssueSeverity severity={issue.severity}>{issue.severity}</IssueSeverity>
              </IssueHeader>
              <IssueMessage>{issue.message}</IssueMessage>
              {issue.workaround && (
                <IssueWorkaround>{issue.workaround}</IssueWorkaround>
              )}
            </Issue>
          ))}
        </IssuesList>
      )}
    </Container>
  );
}; 