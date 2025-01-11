import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { LoadTestingService } from '../services/LoadTestingService';

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

const Form = styled.form`
  background: #2d2d2d;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  color: #bdbdbd;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  border: 1px solid #404040;
  border-radius: 4px;
  background: #333333;
  color: #ffffff;
  &:focus {
    outline: none;
    border-color: #666666;
  }
`;

const Button = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: #2196f3;
  color: #ffffff;
  cursor: pointer;
  &:hover {
    background: #1976d2;
  }
  &:disabled {
    background: #666666;
    cursor: not-allowed;
  }
`;

const TestList = styled.div`
  display: grid;
  gap: 20px;
`;

const TestCard = styled.div`
  background: #2d2d2d;
  padding: 20px;
  border-radius: 8px;
`;

const TestHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const TestTitle = styled.h3`
  margin: 0;
  color: #ffffff;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 15px;
`;

const MetricCard = styled.div`
  background: #333333;
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

interface LoadTestFormData {
  concurrentUsers: number;
  rampUpTime: number;
  testDuration: number;
  requestsPerUser: number;
  targetEndpoints: string;
}

export const LoadTestDashboard: React.FC = () => {
  const [formData, setFormData] = useState<LoadTestFormData>({
    concurrentUsers: 10,
    rampUpTime: 5,
    testDuration: 30,
    requestsPerUser: 5,
    targetEndpoints: ''
  });
  const [isRunning, setIsRunning] = useState(false);
  const [summaries, setSummaries] = useState<any[]>([]);
  const loadTestingService = LoadTestingService.getInstance();

  useEffect(() => {
    const interval = setInterval(() => {
      setSummaries(loadTestingService.getAllTestSummaries());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRunning(true);

    try {
      await loadTestingService.startLoadTest({
        ...formData,
        targetEndpoints: formData.targetEndpoints.split(',').map(e => e.trim())
      });
    } catch (error) {
      console.error('Failed to start load test:', error);
    }

    setIsRunning(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'targetEndpoints' ? value : Number(value)
    }));
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  return (
    <Container>
      <Header>
        <Title>Load Testing</Title>
      </Header>

      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label>Concurrent Users</Label>
          <Input
            type="number"
            name="concurrentUsers"
            value={formData.concurrentUsers}
            onChange={handleInputChange}
            min="1"
            max="1000"
            required
          />
        </FormGroup>

        <FormGroup>
          <Label>Ramp Up Time (seconds)</Label>
          <Input
            type="number"
            name="rampUpTime"
            value={formData.rampUpTime}
            onChange={handleInputChange}
            min="1"
            required
          />
        </FormGroup>

        <FormGroup>
          <Label>Test Duration (seconds)</Label>
          <Input
            type="number"
            name="testDuration"
            value={formData.testDuration}
            onChange={handleInputChange}
            min="1"
            required
          />
        </FormGroup>

        <FormGroup>
          <Label>Requests per User</Label>
          <Input
            type="number"
            name="requestsPerUser"
            value={formData.requestsPerUser}
            onChange={handleInputChange}
            min="1"
            required
          />
        </FormGroup>

        <FormGroup>
          <Label>Target Endpoints (comma-separated)</Label>
          <Input
            type="text"
            name="targetEndpoints"
            value={formData.targetEndpoints}
            onChange={handleInputChange}
            placeholder="http://api.example.com/endpoint1, http://api.example.com/endpoint2"
            required
          />
        </FormGroup>

        <Button type="submit" disabled={isRunning}>
          {isRunning ? 'Running Test...' : 'Start Test'}
        </Button>
      </Form>

      <TestList>
        {summaries.map((summary) => (
          <TestCard key={summary.startTime}>
            <TestHeader>
              <TestTitle>
                Test {new Date(summary.startTime).toLocaleString()}
              </TestTitle>
              <div>
                {summary.endTime ? 
                  formatDuration(summary.endTime - summary.startTime) : 
                  'Running...'}
              </div>
            </TestHeader>

            <MetricsGrid>
              <MetricCard>
                <MetricLabel>Total Requests</MetricLabel>
                <MetricValue>{summary.totalRequests}</MetricValue>
              </MetricCard>

              <MetricCard>
                <MetricLabel>Success Rate</MetricLabel>
                <MetricValue alert={summary.errorRate > 5}>
                  {(100 - summary.errorRate).toFixed(1)}%
                </MetricValue>
              </MetricCard>

              <MetricCard>
                <MetricLabel>Avg Response Time</MetricLabel>
                <MetricValue alert={summary.averageResponseTime > 1000}>
                  {summary.averageResponseTime.toFixed(0)}ms
                </MetricValue>
              </MetricCard>

              <MetricCard>
                <MetricLabel>P95 Response Time</MetricLabel>
                <MetricValue alert={summary.p95ResponseTime > 2000}>
                  {summary.p95ResponseTime.toFixed(0)}ms
                </MetricValue>
              </MetricCard>

              <MetricCard>
                <MetricLabel>P99 Response Time</MetricLabel>
                <MetricValue alert={summary.p99ResponseTime > 3000}>
                  {summary.p99ResponseTime.toFixed(0)}ms
                </MetricValue>
              </MetricCard>

              <MetricCard>
                <MetricLabel>Concurrent Users</MetricLabel>
                <MetricValue>
                  {summary.config.concurrentUsers}
                </MetricValue>
              </MetricCard>
            </MetricsGrid>
          </TestCard>
        ))}
      </TestList>
    </Container>
  );
}; 