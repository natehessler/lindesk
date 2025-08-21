# Lindesk

AI-powered Zendesk ticket analysis that automatically creates Linear issues and posts summaries to Slack. Uses Amp AI to intelligently interpret ticket context and generate actionable insights.

## Features

- 🎫 Analyzes Zendesk tickets with full conversation history
- 🤖 AI-powered analysis with flexible, natural responses  
- 📋 Automatically creates Linear issues
- 💬 Posts formatted summaries to Slack
- 🌐 Modern web interface with dark mode + CLI
- 🐙 GitHub integration for codebase context
- ⚙️ Web-based settings management

## Prerequisites

- Node.js 16+
- API access: Zendesk, Amp, GitHub (optional), Slack (optional), Linear (optional)

## Quick Start

```bash
# Install
npm install -g lindesk

# Configure
lindesk setup
```

```
ZENDESK_DOMAIN=your-company.zendesk.com
ZENDESK_EMAIL=your-email@example.com
ZENDESK_TOKEN=your-zendesk-token
AMP_API_KEY=your-amp-api-key
# Amp uses CLI by default, no endpoint needed
GITHUB_TOKEN=your-github-personal-access-token  # Optional
DEFAULT_GITHUB_REPO=https://github.com/owner/repo  # Optional
SLACK_TOKEN=xoxb-your-slack-bot-token  # Optional
DEFAULT_SLACK_CHANNEL=C0123ABC456  # Optional
LINEAR_API_KEY=your-linear-api-key  # Optional
DEFAULT_LINEAR_PROJECT=TEAM  # Optional
```

## Usage

### Web Interface (Recommended)

```bash
npm run web
# Open http://localhost:3000
```

**Features:**
- GitHub repository integration for contextual analysis
- Interactive ticket analysis form with dark mode
- Real-time results display
- Web-based settings configuration
- Default repository URL settings

### Command Line

```bash
# Analyze and post to Slack
lindesk ticket 12345 --channel C0123ABC456

# Create Linear issue
lindesk ticket 12345 --project ENG

# Both Slack and Linear
lindesk ticket 12345 --project ENG --channel C0123ABC456

# Custom analysis prompt
lindesk ticket 12345 "analyze root cause" --channel C0123ABC456
```

## How It Works

1. Fetches ticket details and conversation history from Zendesk
2. Analyzes content using Amp AI for comprehensive insights  
3. Generates structured analysis with root causes and solutions
4. Creates Linear issue and/or posts to Slack with formatted summary

## Configuration

Configure via web interface at `http://localhost:3000/settings` or run `lindesk setup`:
- **Zendesk**: Domain, email, API token  
- **Amp**: API key for AI analysis
- **GitHub**: Personal access token, default repository URL (optional)
- **Slack**: Bot token (optional)
- **Linear**: API key (optional)

For Slack setup, see [SLACK_GUIDE.md](./SLACK_GUIDE.md).

## License

MIT