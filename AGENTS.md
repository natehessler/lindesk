# Lindesk Development Guide

## Project Overview
Lindesk is an AI-powered Zendesk ticket analysis tool with GitHub integration, Linear issue creation, and Slack notifications. It features a modern web interface with dark mode and comprehensive settings management.

## Architecture
- **Frontend**: Vanilla HTML/CSS/JavaScript with Inter font and dark mode support
- **Backend**: Express.js server with file upload handling and GitHub integration
- **Config**: Uses `conf` library for persistent settings storage
- **AI**: Integrates with Amp AI for flexible ticket analysis

## Key Components

### Frontend Pages
- `public/index.html` - Main ticket analysis interface
- `public/settings.html` - Configuration management interface

### Backend Services
- `src/server.js` - Express server with API endpoints
- `src/config.js` - Configuration schema and management
- `src/services/ai-service.js` - Amp AI integration
- `src/commands/transfer.js` - Core ticket processing logic

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
ZENDESK_DOMAIN=your-company.zendesk.com
ZENDESK_EMAIL=your-email@example.com
ZENDESK_TOKEN=your-zendesk-token
AMP_API_KEY=your-amp-api-key
GITHUB_TOKEN=your-github-pat  # Optional
DEFAULT_GITHUB_REPO=https://github.com/owner/repo  # Optional
SLACK_TOKEN=your-slack-bot-token  # Optional
DEFAULT_SLACK_CHANNEL=C0123ABC456  # Optional
LINEAR_API_KEY=your-linear-api-key  # Optional
DEFAULT_LINEAR_PROJECT=TEAM  # Optional
```

### Web Configuration
Access settings at `http://localhost:3000/settings` for a user-friendly configuration interface.

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

### GitHub Integration
- Replaces file upload with GitHub repository URL input
- Clones repositories for codebase context
- Validates repository size (500MB limit)
- Supports both public and private repositories (with token)

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

### GitHub Integration  
- `POST /api/fetch-github-repo` - Clone and validate GitHub repository

### Ticket Analysis
- `POST /api/analyze-ticket` - Analyze Zendesk ticket with optional codebase context

## Troubleshooting

### Server Issues
- Check if server is running: `ps aux | grep "node.*server.js"`
- Restart server: `pkill -f "node src/server.js" && npm run web`
- Check port availability: `lsof -i :3000`

### Configuration Issues
- Test config API: `curl -s localhost:3000/api/config`
- Check config storage: `node -e "import('./src/config.js').then(m => console.log(m.config.store))"`

### Frontend Issues
- Hard refresh browser (Cmd+Shift+R) to clear cached JavaScript
- Check browser console for JavaScript errors
- Verify API responses in Network tab
