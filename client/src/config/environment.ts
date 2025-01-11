interface EnvironmentConfig {
  apiUrl: string;
  websocketUrl: string;
  environment: 'development' | 'production';
  enableLogging: boolean;
  performanceMonitoring: boolean;
  aiDifficulty: 'easy' | 'medium' | 'hard' | 'adaptive';
  maxReconnectAttempts: number;
  reconnectInterval: number;
}

function validateConfig(config: Partial<EnvironmentConfig>): EnvironmentConfig {
  if (!config.apiUrl) {
    throw new Error('REACT_APP_API_URL is required');
  }
  if (!config.websocketUrl) {
    throw new Error('REACT_APP_WEBSOCKET_URL is required');
  }
  if (!config.environment) {
    throw new Error('REACT_APP_ENVIRONMENT is required');
  }

  return {
    apiUrl: config.apiUrl,
    websocketUrl: config.websocketUrl,
    environment: config.environment as 'development' | 'production',
    enableLogging: config.enableLogging ?? false,
    performanceMonitoring: config.performanceMonitoring ?? true,
    aiDifficulty: (config.aiDifficulty as EnvironmentConfig['aiDifficulty']) ?? 'medium',
    maxReconnectAttempts: config.maxReconnectAttempts ?? 3,
    reconnectInterval: config.reconnectInterval ?? 5000,
  };
}

export const config: EnvironmentConfig = validateConfig({
  apiUrl: process.env.REACT_APP_API_URL,
  websocketUrl: process.env.REACT_APP_WEBSOCKET_URL,
  environment: process.env.REACT_APP_ENVIRONMENT as 'development' | 'production',
  enableLogging: process.env.REACT_APP_ENABLE_LOGGING === 'true',
  performanceMonitoring: process.env.REACT_APP_PERFORMANCE_MONITORING === 'true',
  aiDifficulty: process.env.REACT_APP_AI_DIFFICULTY as EnvironmentConfig['aiDifficulty'],
  maxReconnectAttempts: Number(process.env.REACT_APP_MAX_RECONNECT_ATTEMPTS),
  reconnectInterval: Number(process.env.REACT_APP_RECONNECT_INTERVAL),
});

// Helper functions for environment checks
export const isDevelopment = () => config.environment === 'development';
export const isProduction = () => config.environment === 'production';

// Logging utility that respects environment settings
export const logger = {
  log: (...args: any[]) => {
    if (config.enableLogging) {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    if (config.enableLogging) {
      console.error(...args);
    }
  },
  warn: (...args: any[]) => {
    if (config.enableLogging) {
      console.warn(...args);
    }
  },
  debug: (...args: any[]) => {
    if (config.enableLogging) {
      console.debug(...args);
    }
  },
}; 