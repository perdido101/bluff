import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { PerformanceOptimizationService } from '../services/PerformanceOptimizationService';

interface PerformanceMetrics {
  cacheHits: number;
  cacheMisses: number;
  averageProcessingTime: number;
  totalProcessed: number;
  cacheHitRate: number;
}

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

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
`;

const MetricCard = styled.div`
  background: #333;
  padding: 15px;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MetricLabel = styled.span`
  color: #888;
  font-size: 0.9rem;
`;

const MetricValue = styled.span<{ color?: string }>`
  font-size: 1.5rem;
  font-weight: bold;
  color: ${props => props.color || '#ffffff'};
`;

const RefreshButton = styled.button`
  background: #4CAF50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
  }
`;

export const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const performanceService = PerformanceOptimizationService.getInstance();

  const updateMetrics = () => {
    const currentMetrics = performanceService.getMetrics();
    setMetrics(currentMetrics);
  };

  useEffect(() => {
    updateMetrics();
    const interval = setInterval(updateMetrics, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  if (!metrics) {
    return null;
  }

  const formatNumber = (num: number): string => {
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const getCacheHitRateColor = (rate: number): string => {
    if (rate >= 0.8) return '#4CAF50'; // Green
    if (rate >= 0.6) return '#FFC107'; // Yellow
    return '#f44336'; // Red
  };

  const getProcessingTimeColor = (time: number): string => {
    if (time <= 100) return '#4CAF50'; // Green
    if (time <= 300) return '#FFC107'; // Yellow
    return '#f44336'; // Red
  };

  return (
    <Container>
      <Header>
        <Title>Performance Metrics</Title>
        <RefreshButton onClick={updateMetrics}>
          Refresh
        </RefreshButton>
      </Header>
      <MetricsGrid>
        <MetricCard>
          <MetricLabel>Cache Hit Rate</MetricLabel>
          <MetricValue color={getCacheHitRateColor(metrics.cacheHitRate)}>
            {(metrics.cacheHitRate * 100).toFixed(1)}%
          </MetricValue>
        </MetricCard>
        <MetricCard>
          <MetricLabel>Cache Hits</MetricLabel>
          <MetricValue>{formatNumber(metrics.cacheHits)}</MetricValue>
        </MetricCard>
        <MetricCard>
          <MetricLabel>Cache Misses</MetricLabel>
          <MetricValue>{formatNumber(metrics.cacheMisses)}</MetricValue>
        </MetricCard>
        <MetricCard>
          <MetricLabel>Avg. Processing Time</MetricLabel>
          <MetricValue color={getProcessingTimeColor(metrics.averageProcessingTime)}>
            {formatNumber(metrics.averageProcessingTime)}ms
          </MetricValue>
        </MetricCard>
        <MetricCard>
          <MetricLabel>Total Processed</MetricLabel>
          <MetricValue>{formatNumber(metrics.totalProcessed)}</MetricValue>
        </MetricCard>
      </MetricsGrid>
    </Container>
  );
}; 