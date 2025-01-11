import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { SystemHealthService } from '../services/SystemHealthService';

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

const StatusBadge = styled.span<{ status: string }>`
  padding: 6px 12px;
  border-radius: 16px;
  font-weight: 600;
  background-color: ${({ status }) => {
    switch (status) {
      case 'healthy':
        return '#4caf50';
      case 'degraded':
        return '#ff9800';
      case 'down':
        return '#f44336';
      default:
        return '#757575';
    }
  }};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const MetricCard = styled.div`
  background: #2d2d2d;
  padding: 20px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
`;

const MetricTitle = styled.h3`
  margin: 0 0 10px 0;
  color: #bdbdbd;
  font-size: 14px;
  text-transform: uppercase;
`;

const MetricValue = styled.div<{ alert?: boolean }>`
  font-size: 24px;
  font-weight: 600;
  color: ${({ alert }) => (alert ? '#f44336' : '#ffffff')};
`;

const ServicesTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 30px;
  background: #2d2d2d;
  border-radius: 8px;
  overflow: hidden;
`;

const Th = styled.th`
  text-align: left;
  padding: 12px 20px;
  background: #3d3d3d;
  color: #bdbdbd;
  font-weight: 600;
`;

const Td = styled.td`
  padding: 12px 20px;
  border-top: 1px solid #404040;
`;

const AlertsContainer = styled.div`
  background: #2d2d2d;
  border-radius: 8px;
  overflow: hidden;
`;

const AlertItem = styled.div<{ type: string }>`
  padding: 12px 20px;
  border-left: 4px solid ${({ type }) => (type === 'critical' ? '#f44336' : '#ff9800')};
  background: ${({ type }) => (type === 'critical' ? 'rgba(244, 67, 54, 0.1)' : 'rgba(255, 152, 0, 0.1)')};
  & + & {
    border-top: 1px solid #404040;
  }
`;

const AlertHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
`;

const AlertTitle = styled.span`
  font-weight: 600;
`;

const AlertTime = styled.span`
  color: #bdbdbd;
  font-size: 12px;
`;

const AlertMessage = styled.p`
  margin: 0;
  color: #bdbdbd;
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  border-radius: 4px;
  border: none;
  background: #404040;
  color: #ffffff;
  cursor: pointer;
  font-size: 14px;
  &:hover {
    background: #505050;
  }
`;

export const SystemHealthDashboard: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const healthService = SystemHealthService.getInstance();

  useEffect(() => {
    const fetchData = async () => {
      const currentHealth = await healthService.getCurrentHealth();
      setHealth(currentHealth);
      setAlerts(healthService.getActiveAlerts());
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleAcknowledgeAlert = (alertId: string) => {
    healthService.acknowledgeAlert(alertId);
    setAlerts(healthService.getActiveAlerts());
  };

  if (!health) return null;

  const formatMetric = (value: number, unit: string = '') => {
    return `${value.toLocaleString()}${unit}`;
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <Container>
      <Header>
        <Title>System Health</Title>
        <StatusBadge status={health.status}>
          {health.status.toUpperCase()}
        </StatusBadge>
      </Header>

      <Grid>
        <MetricCard>
          <MetricTitle>CPU Usage</MetricTitle>
          <MetricValue alert={health.metrics.cpu.usage > 90}>
            {formatMetric(health.metrics.cpu.usage, '%')}
          </MetricValue>
        </MetricCard>
        <MetricCard>
          <MetricTitle>Memory Usage</MetricTitle>
          <MetricValue alert={health.metrics.memory.used / health.metrics.memory.total > 0.9}>
            {formatMetric(health.metrics.memory.used / 1024 / 1024, ' GB')}
          </MetricValue>
        </MetricCard>
        <MetricCard>
          <MetricTitle>Network Latency</MetricTitle>
          <MetricValue alert={health.metrics.network.latency > 1000}>
            {formatMetric(health.metrics.network.latency, 'ms')}
          </MetricValue>
        </MetricCard>
        <MetricCard>
          <MetricTitle>Uptime</MetricTitle>
          <MetricValue>{formatUptime(health.metrics.uptime)}</MetricValue>
        </MetricCard>
      </Grid>

      <Title>Services</Title>
      <ServicesTable>
        <thead>
          <tr>
            <Th>Service</Th>
            <Th>Status</Th>
            <Th>Response Time</Th>
            <Th>Error Rate</Th>
            <Th>Last Check</Th>
          </tr>
        </thead>
        <tbody>
          {health.services.map((service: any) => (
            <tr key={service.name}>
              <Td>{service.name}</Td>
              <Td>
                <StatusBadge status={service.status}>
                  {service.status.toUpperCase()}
                </StatusBadge>
              </Td>
              <Td>{formatMetric(service.responseTime, 'ms')}</Td>
              <Td>{formatMetric(service.errorRate, '%')}</Td>
              <Td>{new Date(service.lastCheck).toLocaleString()}</Td>
            </tr>
          ))}
        </tbody>
      </ServicesTable>

      {alerts.length > 0 && (
        <>
          <Title>Active Alerts</Title>
          <AlertsContainer>
            {alerts.map((alert) => (
              <AlertItem key={alert.id} type={alert.type}>
                <AlertHeader>
                  <AlertTitle>{alert.component}</AlertTitle>
                  <AlertTime>{new Date(alert.timestamp).toLocaleString()}</AlertTime>
                </AlertHeader>
                <AlertMessage>{alert.message}</AlertMessage>
                <ActionButton onClick={() => handleAcknowledgeAlert(alert.id)}>
                  Acknowledge
                </ActionButton>
              </AlertItem>
            ))}
          </AlertsContainer>
        </>
      )}
    </Container>
  );
}; 