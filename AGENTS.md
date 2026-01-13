# Lindesk

CLI tool that analyzes Plain support threads with Sourcegraph Deep Search and posts the analysis to Slack.

## Usage

```bash
lindesk <threadId> --channel <SLACK_CHANNEL_ID> [--prompt <custom_prompt>]
```

## Environment Variables

```bash
PLAIN_API_KEY=your-plain-api-key          # Required - Plain API key
SOURCEGRAPH_URL=https://sourcegraph.com   # Required - Sourcegraph instance URL
SOURCEGRAPH_TOKEN=your-sourcegraph-token  # Required - Sourcegraph access token
SLACK_TOKEN=your-slack-bot-token          # Required - Slack bot token
```

## Architecture

- `src/cli.js` - CLI entry point
- `src/config.js` - Configuration management
- `src/commands/transfer.js` - Main workflow orchestration
- `src/services/plain-service.js` - Plain GraphQL API integration
- `src/services/ai-service.js` - Sourcegraph Deep Search integration
- `src/services/slack-service.js` - Slack message posting

## Workflow

1. Fetch thread from Plain using GraphQL API
2. Send thread content to Sourcegraph Deep Search for analysis
3. Post formatted analysis to specified Slack channel
