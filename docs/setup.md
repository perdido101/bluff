# Setup Instructions

## Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Git

## Installation

### Clone the Repository
```bash
git clone https://github.com/yourusername/bluff-ai-game.git
cd bluff-ai-game
```

### Install Dependencies
```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### Environment Setup
1. Create `.env` files in both client and server directories:

```bash
# client/.env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WEBSOCKET_URL=ws://localhost:3001
REACT_APP_ENVIRONMENT=development
```

```bash
# server/.env
PORT=3001
NODE_ENV=development
```

## Development

### Start Development Servers
```bash
# Start client (in client directory)
npm start

# Start server (in server directory)
npm run dev
```

### Available Scripts
- `npm start`: Start development server
- `npm test`: Run tests
- `npm run build`: Create production build
- `npm run deploy`: Deploy to GitHub Pages

## Development Workflow

### Code Style and Linting
The project uses ESLint and Prettier for code formatting and style checking:
```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Type Checking
TypeScript is used throughout the project:
```bash
# Run type checking
npm run typecheck
```

### Testing

#### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run tests in watch mode
npm run test:watch
```

#### Writing Tests
- Unit tests should be placed in `__tests__` directories next to the code they test
- Use React Testing Library for component tests
- Follow the testing patterns shown in existing tests
- Ensure proper coverage for new features

### Performance Testing
```bash
# Run performance tests
npm run test:perf

# Analyze bundle size
npm run analyze
```

## Deployment

### GitHub Pages
1. Update the `homepage` field in `package.json`
2. Build and deploy:
```bash
npm run deploy
```

### Production Build
```bash
# Build for production
npm run build

# Preview production build
npm run serve
```

## Troubleshooting

### Common Issues
1. **Port already in use**
   - Kill the process using the port or change the port in `.env`

2. **WebSocket connection fails**
   - Check if the server is running
   - Verify WebSocket URL in `.env`

3. **Build fails**
   - Clear the build cache: `npm run clean`
   - Delete `node_modules` and run `npm install`

### Getting Help
- Check existing issues on GitHub
- Create a new issue with:
  - Steps to reproduce
  - Expected behavior
  - Actual behavior
  - Environment details

## Project Structure
```
bluff-ai-game/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── public/
│   └── package.json
├── server/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
└── README.md
```

## Contributing

### Development Best Practices

#### Code Organization
- Follow the established project structure
- Keep components small and focused
- Use TypeScript for all new code
- Follow the existing naming conventions

#### Component Development
- Create components in their respective directories
- Include necessary tests
- Document props and usage
- Consider accessibility from the start
- Implement proper error handling

#### State Management
- Use React hooks for local state
- Follow existing patterns for game state management
- Document state changes and side effects

#### Performance Considerations
- Implement proper memoization
- Optimize re-renders
- Keep bundle size in mind
- Use lazy loading where appropriate

### Git Workflow
1. Create a new branch for your feature/fix:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes following the guidelines above

3. Commit your changes:
```bash
git add .
git commit -m "feat: description of your changes"
```

4. Push your changes:
```bash
git push origin feature/your-feature-name
```

5. Create a pull request on GitHub

### Commit Message Guidelines
Follow conventional commits:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation
- `test:` for test changes
- `refactor:` for code changes that neither fix nor add
- `style:` for formatting changes
- `chore:` for maintenance tasks

### Code Review Process
1. Ensure all tests pass
2. Check code coverage
3. Review for:
   - Code quality
   - Test coverage
   - Documentation
   - Performance impact
   - Accessibility
   - Security considerations

### Documentation
- Update relevant documentation
- Include JSDoc comments
- Update README if needed
- Document breaking changes 