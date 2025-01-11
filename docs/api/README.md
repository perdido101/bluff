# Bluff AI Game API Documentation

## Overview
This directory contains comprehensive documentation for the Bluff AI Game API, including both REST endpoints and WebSocket events.

## Contents

- `openapi.yaml`: OpenAPI/Swagger specification for REST endpoints
- `websocket-events.md`: Documentation for real-time WebSocket events
- Additional resources and examples

## Using the Documentation

### REST API

1. **View in Swagger UI**
   - Install Swagger UI: `npm install -g swagger-ui-cli`
   - Run: `swagger-ui-cli serve openapi.yaml`
   - Open browser at `http://localhost:3000`

2. **Generate Client Code**
   ```bash
   # Using OpenAPI Generator
   npx @openapitools/openapi-generator-cli generate -i openapi.yaml -g typescript-axios -o ./generated
   ```

### WebSocket Events

The WebSocket documentation provides:
- Event type definitions
- Example payloads
- Implementation guidelines
- Error handling patterns

## Authentication

All API endpoints require authentication using:
- Development: API key in headers
- Production: JWT tokens

Example:
```typescript
// Development
headers: {
  'X-API-Key': 'your-api-key'
}

// Production
headers: {
  'Authorization': 'Bearer your-jwt-token'
}
```

## Rate Limiting

- 100 requests per minute per IP for REST endpoints
- 60 WebSocket messages per minute per connection

## Environment-Specific Settings

### Development
```bash
BASE_URL=http://localhost:3001
WS_URL=ws://localhost:3001
```

### Production
```bash
BASE_URL=https://api.bluff-ai-game.com
WS_URL=wss://api.bluff-ai-game.com
```

## Examples

### Making a Game Move
```typescript
// REST API
const response = await axios.post('/api/game/move', {
  type: 'PLAY_CARDS',
  playerId: 'player1',
  cards: [
    { suit: 'hearts', value: 'A' }
  ],
  declaredValue: 'A'
});

// WebSocket
ws.send(JSON.stringify({
  type: 'makeMove',
  payload: {
    type: 'PLAY_CARDS',
    playerId: 'player1',
    cards: [
      { suit: 'hearts', value: 'A' }
    ],
    declaredValue: 'A'
  }
}));
```

## Error Handling

All endpoints return standardized error responses:
```typescript
{
  code: string;    // Error code
  message: string; // Human-readable message
  details?: any;   // Additional error details
}
```

Common error codes:
- `INVALID_REQUEST`: Malformed request
- `UNAUTHORIZED`: Authentication failed
- `FORBIDDEN`: Permission denied
- `NOT_FOUND`: Resource not found
- `RATE_LIMITED`: Too many requests
- `INTERNAL_ERROR`: Server error

## Contributing

1. Update OpenAPI spec for REST endpoint changes
2. Update WebSocket events doc for real-time features
3. Run validation: `npm run validate-api-docs`
4. Submit PR with documentation changes 