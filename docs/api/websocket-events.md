# WebSocket Events Documentation

## Overview
The game uses WebSocket connections for real-time updates and game state synchronization. This document describes all WebSocket events used in the application.

## Connection

### Establishing Connection
```typescript
const ws = new WebSocket(WEBSOCKET_URL);
```

The WebSocket URL is provided in the environment configuration:
- Development: `ws://localhost:3001`
- Production: `wss://api.bluff-ai-game.com`

## Events

### Server to Client Events

#### `gameStateUpdate`
Sent when the game state changes.

```typescript
{
  type: 'gameStateUpdate',
  payload: {
    players: Player[],
    currentPlayer: string,
    pile: Card[],
    lastMove: GameAction | null,
    gameStatus: 'waiting' | 'playing' | 'finished',
    winner: string | null
  }
}
```

#### `moveResult`
Sent after a player makes a move.

```typescript
{
  type: 'moveResult',
  payload: {
    success: boolean,
    message: string,
    newState: GameState
  }
}
```

#### `error`
Sent when an error occurs.

```typescript
{
  type: 'error',
  payload: {
    code: string,
    message: string,
    details?: object
  }
}
```

### Client to Server Events

#### `makeMove`
Sent when a player makes a move.

```typescript
{
  type: 'makeMove',
  payload: {
    type: 'PLAY_CARDS' | 'CHALLENGE' | 'PASS',
    playerId: string,
    cards?: Card[],
    declaredValue?: string
  }
}
```

#### `joinGame`
Sent when a player joins the game.

```typescript
{
  type: 'joinGame',
  payload: {
    playerId: string
  }
}
```

## Error Handling

### Reconnection
The client should implement reconnection logic with exponential backoff:

```typescript
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const baseDelay = 1000; // 1 second

function reconnect() {
  if (reconnectAttempts >= maxReconnectAttempts) {
    console.error('Max reconnection attempts reached');
    return;
  }

  const delay = baseDelay * Math.pow(2, reconnectAttempts);
  setTimeout(() => {
    // Attempt to reconnect
    initializeWebSocket();
    reconnectAttempts++;
  }, delay);
}
```

### Connection State Monitoring
Monitor connection state changes:

```typescript
ws.onclose = (event) => {
  if (!event.wasClean) {
    reconnect();
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};
```

## Best Practices

1. **Heartbeat Mechanism**
   - Send periodic ping messages to keep the connection alive
   - Implement server-side ping timeout handling

2. **Message Validation**
   - Validate all incoming messages against expected schemas
   - Handle malformed messages gracefully

3. **State Synchronization**
   - Implement version tracking for game state
   - Request full state sync if partial updates fail

4. **Security**
   - Implement authentication token in connection URL
   - Validate all actions against current game state
   - Rate limit client messages 