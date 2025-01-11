import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ErrorReportingService } from '../services/ErrorReportingService';

const Container = styled.div`
  background: #1a1a1a;
  border-radius: 8px;
  padding: 20px;
  color: #ffffff;
  margin: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  color: #ffffff;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
`;

const StatCard = styled.div<{ severity?: string }>`
  background: ${props => {
    switch (props.severity) {
      case 'critical': return '#f44336';
      case 'high': return '#ff9800';
      case 'medium': return '#ffc107';
      case 'low': return '#4caf50';
      default: return '#333';
    }
  }};
  padding: 15px;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const StatLabel = styled.span`
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
`;

const StatValue = styled.span`
  font-size: 1.5rem;
  font-weight: bold;
  color: #ffffff;
`;

const ErrorList = styled.div`
  background: #333;
  border-radius: 4px;
  overflow: hidden;
`;

const ErrorItem = styled.div<{ severity: string }>`
  padding: 15px;
  border-bottom: 1px solid #444;
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  gap: 20px;
  align-items: center;
  background: ${props => props.severity === 'critical' ? 'rgba(244, 67, 54, 0.1)' : 'transparent'};

  &:last-child {
    border-bottom: none;
  }
`;

const ErrorMessage = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ErrorComponent = styled.span`
  color: #888;
  font-size: 0.8rem;
`;

const ErrorTime = styled.span`
  color: #888;
  font-size: 0.8rem;
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  background: ${props => {
    switch (props.status) {
      case 'new': return '#2196f3';
      case 'acknowledged': return '#ff9800';
      case 'resolved': return '#4caf50';
      default: return '#333';
    }
  }};
`;

const ActionButton = styled.button`
  background: transparent;
  border: 1px solid #666;
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #444;
  }
`;

export const ErrorDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [recentErrors, setRecentErrors] = useState<any[]>([]);
  const errorService = ErrorReportingService.getInstance();

  const updateDashboard = () => {
    setStats(errorService.getStats());
    setRecentErrors(errorService.getRecentErrors());
  };

  useEffect(() => {
    updateDashboard();
    const interval = setInterval(updateDashboard, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusUpdate = (errorId: string, newStatus: 'acknowledged' | 'resolved') => {
    errorService.updateErrorStatus(errorId, newStatus);
    updateDashboard();
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (!stats) {
    return null;
  }

  return (
    <Container>
      <Header>
        <Title>Error Reports</Title>
        <ActionButton onClick={() => {
          errorService.clearResolvedErrors();
          updateDashboard();
        }}>
          Clear Resolved
        </ActionButton>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatLabel>Total Errors</StatLabel>
          <StatValue>{stats.totalErrors}</StatValue>
        </StatCard>
        <StatCard severity="critical">
          <StatLabel>Critical Errors</StatLabel>
          <StatValue>{stats.criticalErrors}</StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>Resolved</StatLabel>
          <StatValue>{stats.resolvedErrors}</StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>Avg. Resolution Time</StatLabel>
          <StatValue>
            {Math.round(stats.averageResolutionTime / 1000 / 60)} min
          </StatValue>
        </StatCard>
      </StatsGrid>

      <ErrorList>
        {recentErrors.map(error => (
          <ErrorItem key={error.id} severity={error.severity}>
            <StatusBadge status={error.status}>
              {error.status.toUpperCase()}
            </StatusBadge>
            <ErrorMessage>
              {error.message}
              <ErrorComponent>{error.component}</ErrorComponent>
            </ErrorMessage>
            <ErrorTime>{formatTime(error.timestamp)}</ErrorTime>
            <div>
              {error.status === 'new' && (
                <ActionButton
                  onClick={() => handleStatusUpdate(error.id, 'acknowledged')}
                >
                  Acknowledge
                </ActionButton>
              )}
              {error.status === 'acknowledged' && (
                <ActionButton
                  onClick={() => handleStatusUpdate(error.id, 'resolved')}
                >
                  Resolve
                </ActionButton>
              )}
            </div>
          </ErrorItem>
        ))}
      </ErrorList>
    </Container>
  );
}; 