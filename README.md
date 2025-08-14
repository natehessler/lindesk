# Lindesk

AI-powered Zendesk ticket analysis that automatically creates Linear issues and posts summaries to Slack. Uses Amp AI to intelligently interpret ticket context and generate actionable insights.

## Features

- 🎫 Analyzes Zendesk tickets with full conversation history
- 🤖 AI-powered root cause analysis and solutions
- 📋 Automatically creates Linear issues
- 💬 Posts formatted summaries to Slack
- 🌐 Modern web interface + CLI
- 📁 Codebase context for better analysis

## Prerequisites

- Node.js 16+
- API access: Zendesk, Amp, Slack (optional), Linear (optional)

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
- Upload codebase for contextual analysis
- Interactive ticket analysis form  
- Real-time results display
- Settings configuration

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

Run `lindesk setup` and provide your API credentials:
- **Zendesk**: Domain, email, API token  
- **Amp**: API key for AI analysis
- **Slack**: Bot token (optional)
- **Linear**: API key (optional)

For Slack setup, see [SLACK_GUIDE.md](./SLACK_GUIDE.md).

## License

MIT