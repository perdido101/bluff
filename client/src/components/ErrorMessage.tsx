import React from 'react';
import styled from 'styled-components';

const ErrorContainer = styled.div`
  padding: 20px;
  background-color: #fff5f5;
  border: 1px solid #fc8181;
  border-radius: 5px;
  color: #c53030;
  text-align: center;
  margin: 20px auto;
  max-width: 400px;
`;

const RetryButton = styled.button`
  margin-top: 10px;
  padding: 8px 16px;
  background-color: #2c5282;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;

interface Props {
  message: string;
  onRetry: () => void;
}

export const ErrorMessage: React.FC<Props> = ({ message, onRetry }) => (
  <ErrorContainer>
    <p>{message}</p>
    <RetryButton onClick={onRetry}>Try Again</RetryButton>
  </ErrorContainer>
); 