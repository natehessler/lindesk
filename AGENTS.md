# Lindesk Development Guide

## Project Overview
Lindesk is an AI-powered Plain thread analysis tool with GitHub integration, Linear issue creation, and Slack notifications. It features a modern web interface with dark mode and comprehensive settings management.

## Architecture
- **Frontend**: Vanilla HTML/CSS/JavaScript with Inter font and dark mode support
- **Backend**: Express.js server with file upload handling and GitHub integration
- **Config**: Uses `conf` library for persistent settings storage
- **AI**: Integrates with Sourcegraph Deep Search for flexible thread analysis
- **Plain**: Uses Plain's GraphQL API for thread/customer data

## Key Components

### Frontend Pages
- `public/index.html` - Main thread analysis interface
- `public/settings.html` - Configuration management interface

### Backend Services
- `src/server.js` - Express server with API endpoints
- `src/config.js` - Configuration schema and management
- `src/services/plain-service.js` - Plain GraphQL API integration
- `src/services/ai-service.js` - Sourcegraph Deep Search integration
- `src/commands/transfer.js` - Core thread processing logic

## Development Commands

### Start Development Server
```bash
npm run web
# or
npm run dev
```

### Install Dependencies
```bash
npm install
```

### Test Configuration
```bash
node -e "import('./src/config.js').then(m => console.log(m.getConfig()))"
```

## Configuration

### Environment Variables
```bash
PLAIN_API_KEY=your-plain-api-key          # Required - Plain API key
SOURCEGRAPH_URL=https://sourcegraph.com   # Required - Sourcegraph instance URL
SOURCEGRAPH_TOKEN=your-sourcegraph-token  # Required - Sourcegraph access token
SLACK_TOKEN=your-slack-bot-token          # Optional
DEFAULT_SLACK_CHANNEL=C0123ABC456         # Optional
LINEAR_API_KEY=your-linear-api-key        # Optional
DEFAULT_LINEAR_PROJECT=TEAM               # Optional
```

### Web Configuration
Access settings at `http://localhost:3000/settings` for a user-friendly configuration interface.

## Plain API Integration

Plain uses a GraphQL API:
- **API URL**: `https://core-api.uk.plain.com/graphql/v1`
- **Auth**: Bearer token in Authorization header
- **Threads**: Equivalent to tickets/conversations
- **Timeline Entries**: Messages, emails, and events within a thread

### Getting a Plain API Key
1. Go to Plain Settings → Machine Users
2. Create a new Machine User
3. Add an API Key with `thread:read` and `customer:read` permissions
4. Copy the key and add it to your configuration

## Code Style

### CSS/HTML
- Uses CSS custom properties for theming
- Dark mode is default, light mode optional via toggle
- Inter font for professional appearance
- Consistent teal accent color (#4fd1c7)

### JavaScript
- Vanilla ES6+ JavaScript
- Async/await for API calls
- localStorage for theme persistence
- FormData for form handling

### Node.js
- ES modules (import/export)
- Express.js for web server
- Conf library for persistent configuration
- Child process spawning for git operations

## Features

### Plain Integration
- Fetches threads via GraphQL API
- Retrieves customer and company information
- Gets timeline entries (emails, chats, custom events)
- Normalizes data for consistent analysis

### Theme System
- Manual dark/light mode toggle
- Dark mode as default
- Theme preference stored in localStorage
- Consistent across all pages

### Configuration Management
- Web-based settings interface
- Persistent storage via Conf library
- Environment variable fallbacks
- Masked sensitive fields in API responses

## API Endpoints

### Configuration
- `GET /api/config` - Retrieve current configuration
- `POST /api/config` - Save configuration

### Thread Analysis
- `POST /api/analyze-thread` - Analyze Plain thread with optional integrations
- `POST /api/analyze-ticket` - Legacy endpoint (backward compatible)

## Troubleshooting

### Server Issues
- Check if server is running: `ps aux | grep "node.*server.js"`
- Restart server: `pkill -f "node src/server.js" && npm run web`
- Check port availability: `lsof -i :3000`

### Configuration Issues
- Test config API: `curl -s localhost:3000/api/config`
- Check config storage: `node -e "import('./src/config.js').then(m => console.log(m.config.store))"`

### Plain API Issues
- Verify API key has correct permissions (thread:read, customer:read)
- Check thread ID format (e.g., `th_01ABC123XYZ`)
- Test with Plain's API Explorer: https://app.plain.com/developer/api-explorer/

### Frontend Issues
- Hard refresh browser (Cmd+Shift+R) to clear cached JavaScript
- Check browser console for JavaScript errors
- Verify API responses in Network tab
