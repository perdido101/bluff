import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { MemoryMonitoringService } from '../services/MemoryMonitoringService';

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

const Controls = styled.div`
  display: flex;
  gap: 10px;
`;

const Button = styled.button<{ active?: boolean }>`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: ${({ active }) => active ? '#2196f3' : '#333333'};
  color: #ffffff;
  cursor: pointer;
  &:hover {
    background: ${({ active }) => active ? '#1976d2' : '#404040'};
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
`;

const MetricCard = styled.div`
  background: #2d2d2d;
  padding: 15px;
  border-radius: 4px;
`;

const MetricLabel = styled.div`
  color: #bdbdbd;
  font-size: 12px;
  margin-bottom: 5px;
`;

const MetricValue = styled.div<{ alert?: boolean }>`
  font-size: 18px;
  font-weight: 600;
  color: ${({ alert }) => (alert ? '#f44336' : '#ffffff')};
`;

const LeaksList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const LeakAlert = styled.div<{ severity: 'WARNING' | 'CRITICAL' }>`
  background: ${({ severity }) => severity === 'CRITICAL' ? '#f443361a' : '#ff97001a'};
  border-left: 4px solid ${({ severity }) => severity === 'CRITICAL' ? '#f44336' : '#ff9700'};
  padding: 15px;
  border-radius: 4px;
`;

const LeakMessage = styled.div`
  font-size: 14px;
  margin-bottom: 5px;
`;

const LeakDetails = styled.div`
  font-size: 12px;
  color: #bdbdbd;
`;

export const MemoryMonitor: React.FC = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [snapshot, setSnapshot] = useState<any>(null);
  const [leaks, setLeaks] = useState<any[]>([]);
  const memoryService = MemoryMonitoringService.getInstance();

  useEffect(() => {
    const updateInterval = setInterval(() => {
      if (isMonitoring) {
        const latest = memoryService.getLatestSnapshot();
        if (latest) {
          setSnapshot(latest);
        }
      }
    }, 1000);

    return () => {
      clearInterval(updateInterval);
      memoryService.stopMonitoring();
    };
  }, [isMonitoring]);

  const toggleMonitoring = () => {
    if (isMonitoring) {
      memoryService.stopMonitoring();
    } else {
      memoryService.startMonitoring();
    }
    setIsMonitoring(!isMonitoring);
  };

  const clearData = () => {
    memoryService.clearHistory();
    setSnapshot(null);
    setLeaks([]);
  };

  const formatBytes = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <Container>
      <Header>
        <Title>Memory Monitor</Title>
        <Controls>
          <Button active={isMonitoring} onClick={toggleMonitoring}>
            {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </Button>
          <Button onClick={clearData}>Clear Data</Button>
        </Controls>
      </Header>

      {snapshot && (
        <MetricsGrid>
          <MetricCard>
            <MetricLabel>Used Heap</MetricLabel>
            <MetricValue alert={snapshot.usedJSHeapSize > snapshot.totalJSHeapSize * 0.8}>
              {formatBytes(snapshot.usedJSHeapSize)}
            </MetricValue>
          </MetricCard>

          <MetricCard>
            <MetricLabel>Total Heap</MetricLabel>
            <MetricValue>
              {formatBytes(snapshot.totalJSHeapSize)}
            </MetricValue>
          </MetricCard>

          <MetricCard>
            <MetricLabel>Heap Limit</MetricLabel>
            <MetricValue>
              {formatBytes(snapshot.jsHeapSizeLimit)}
            </MetricValue>
          </MetricCard>

          <MetricCard>
            <MetricLabel>DOM Nodes</MetricLabel>
            <MetricValue alert={snapshot.domNodes > 1000}>
              {snapshot.domNodes}
            </MetricValue>
          </MetricCard>

          <MetricCard>
            <MetricLabel>Detached Nodes</MetricLabel>
            <MetricValue alert={snapshot.detachedDomNodes > 0}>
              {snapshot.detachedDomNodes}
            </MetricValue>
          </MetricCard>

          <MetricCard>
            <MetricLabel>Event Listeners</MetricLabel>
            <MetricValue alert={snapshot.listeners > 100}>
              {snapshot.listeners}
            </MetricValue>
          </MetricCard>
        </MetricsGrid>
      )}

      <LeaksList>
        {leaks.map((leak, index) => (
          <LeakAlert key={index} severity={leak.severity}>
            <LeakMessage>{leak.message}</LeakMessage>
            <LeakDetails>
              Trend: {(leak.trend * 100).toFixed(1)}% change
            </LeakDetails>
          </LeakAlert>
        ))}
      </LeaksList>
    </Container>
  );
}; 