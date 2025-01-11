import React from 'react';
import styled from 'styled-components';
import { Game } from './components/Game';

const AppContainer = styled.div`
  min-height: 100vh;
  background: #f0f0f0;
  padding: 20px;
`;

const Title = styled.h1`
  text-align: center;
  color: #333;
  margin-bottom: 30px;
`;

function App() {
  return (
    <AppContainer>
      <Title>Bluff AI - Challenge the AI!</Title>
      <Game />
    </AppContainer>
  );
}

export default App; 