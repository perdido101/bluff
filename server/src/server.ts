import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import { gameService } from './services/gameService';
import { GameAction, GameState, Card } from './types';
import { AIStrategyService } from './services/aiStrategyService';
import { AIPersonalityService } from './services/aiPersonalityService';
import { PatternRecognitionService } from './services/patternRecognitionService';
import { AdaptiveLearningService } from './services/adaptiveLearningService';
import { PersistenceService } from './services/persistenceService';
import { MLIntegrationService } from './services/mlIntegrationService';
import { ModelMonitoringService } from './services/modelMonitoringService';
import { PerformanceMetricsService } from './services/performanceMetricsService';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Add error handling middleware
app.use((err: Error, req: any, res: any, next: any) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

let mlIntegration: MLIntegrationService;
let performanceMetrics: PerformanceMetricsService;
let currentGameId: string | null = null;

async function initializeServer() {
  // Initialize services
  const persistenceService = new PersistenceService();
  await persistenceService.init();

  const aiStrategy = new AIStrategyService();
  const aiPersonality = new AIPersonalityService();
  const patternRecognition = new PatternRecognitionService(persistenceService);
  const adaptiveLearning = new AdaptiveLearningService(persistenceService);
  const modelMonitoring = new ModelMonitoringService(persistenceService);
  performanceMetrics = new PerformanceMetricsService(persistenceService);

  // Initialize ML Integration
  mlIntegration = new MLIntegrationService(
    aiStrategy,
    patternRecognition,
    adaptiveLearning,
    aiPersonality,
    modelMonitoring
  );

  // Game routes
  app.get('/api/game/initialize', (req, res) => {
    try {
      const gameState = gameService.initializeGame();
      currentGameId = performanceMetrics.startNewGame(gameState);
      res.json(gameState);
    } catch (error) {
      console.error('Error initializing game:', error);
      res.status(500).json({ error: 'Failed to initialize game' });
    }
  });

  // Add performance metrics endpoints
  app.get('/api/metrics/aggregate', (req, res) => {
    try {
      const metrics = performanceMetrics.getAggregateMetrics();
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching aggregate metrics:', error);
      res.status(500).json({ error: 'Failed to fetch aggregate metrics' });
    }
  });

  app.get('/api/metrics/history', (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const history = performanceMetrics.getGameHistory(limit);
      res.json(history);
    } catch (error) {
      console.error('Error fetching game history:', error);
      res.status(500).json({ error: 'Failed to fetch game history' });
    }
  });

  app.get('/api/metrics/current-game', (req, res) => {
    try {
      const stats = performanceMetrics.getCurrentGameStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching current game stats:', error);
      res.status(500).json({ error: 'Failed to fetch current game stats' });
    }
  });

  app.post('/api/game/move', async (req, res) => {
    try {
      const { action, gameState } = req.body;
      const updatedState = await gameService.processMove(action, gameState);

      // Update ML models and metrics with the player's move
      if (action.type !== 'PASS') {
        const result = action.type === 'CHALLENGE' 
          ? !gameState.lastPlay?.actualCards.some((card: Card) => card.value !== gameState.lastPlay?.declaredCards)
          : true;
        await mlIntegration.updateModel(action, result, gameState);
        await performanceMetrics.recordMove('player', action, result, gameState);
      } else {
        await performanceMetrics.recordMove('player', action, true, gameState);
      }

      // Check for game end after player's move
      const winner = gameService.checkWinCondition(updatedState);
      if (winner) {
        await performanceMetrics.endGame(winner);
        currentGameId = null;
      }

      // If it's AI's turn, get the AI's move
      if (updatedState.currentTurn === 'ai' && !winner) {
        const aiAction = await mlIntegration.makeDecision(updatedState);
        const finalState = await gameService.processMove(aiAction, updatedState);
        
        // Update ML models and metrics with the AI's move
        if (aiAction.type !== 'PASS') {
          const result = aiAction.type === 'CHALLENGE'
            ? !updatedState.lastPlay?.actualCards.some((card: Card) => card.value !== updatedState.lastPlay?.declaredCards)
            : true;
          await mlIntegration.updateModel(aiAction, result, updatedState);
          await performanceMetrics.recordMove('ai', aiAction, result, updatedState);
        } else {
          await performanceMetrics.recordMove('ai', aiAction, true, updatedState);
        }

        // Check for game end after AI's move
        const finalWinner = gameService.checkWinCondition(finalState);
        if (finalWinner) {
          await performanceMetrics.endGame(finalWinner);
          currentGameId = null;
        }

        res.json(finalState);
      } else {
        res.json(updatedState);
      }
    } catch (error) {
      console.error('Error processing move:', error);
      res.status(500).json({ error: 'Failed to process move' });
    }
  });

  // Add monitoring endpoints
  app.get('/api/monitoring/performance', (req, res) => {
    try {
      const metrics = modelMonitoring.getPerformanceMetrics();
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      res.status(500).json({ error: 'Failed to fetch performance metrics' });
    }
  });

  app.get('/api/monitoring/recent-decisions', (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const decisions = modelMonitoring.getRecentDecisions(limit);
      res.json(decisions);
    } catch (error) {
      console.error('Error fetching recent decisions:', error);
      res.status(500).json({ error: 'Failed to fetch recent decisions' });
    }
  });

  app.get('/api/monitoring/decision-distribution', (req, res) => {
    try {
      const distribution = modelMonitoring.getDecisionDistribution();
      res.json(distribution);
    } catch (error) {
      console.error('Error fetching decision distribution:', error);
      res.status(500).json({ error: 'Failed to fetch decision distribution' });
    }
  });

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

initializeServer().catch(console.error); 