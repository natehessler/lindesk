# Lindesk

Lindesk is an AI CLI tool powered by Amp that streamlines cross-functional support by automating conversations with other teams based on Zendesk tickets. It intelligently interprets ticket context and generates clear, actionable messages to Slack and/or Linear—saving time, reducing back-and-forth, and keeping workflows moving.

## Features

- Fetch ticket details from Zendesk
- Analyze complete ticket conversations using Amp AI
- Generate comprehensive issue analysis with root causes, solutions, and next steps
- Create a Linear issue with the AI-generated summary
- Post ticket summaries to Slack channels
- Link back to the original Zendesk ticket

## Prerequisites

- Node.js 16+ 
- Access to Zendesk (admin privileges to generate API tokens)
- Amp account with API access
- Slack workspace access (ability to create bot tokens)
- Linear workspace access (ability to create API keys)

## Installation

```bash
npm install -g lindesk
```

## Setup

### 1. Clone Sourcegraph Repository

For optimal AI analysis with proper codebase context, clone and navigate to the main Sourcegraph repository:

```bash
git clone https://github.com/sourcegraph/sourcegraph.git
cd sourcegraph
```

Run all `lindesk` commands from within this directory to ensure Amp has access to the full Sourcegraph codebase for context-aware analysis.

### 2. Configure API Credentials

Before using Lindesk, you need to configure your API credentials:

```bash
lindesk setup
```

This will prompt you for:
- Zendesk domain, email and API token
- Amp API key for AI analysis
- Integration choice (Slack only, Linear only, or both)
- Slack bot token and default channel (if Slack selected)
- Linear API key and default project (if Linear selected)

Alternatively, you can use environment variables:

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

### Post a Zendesk ticket summary to Slack

```bash
lindesk ticket <ticketId> --channel <slackChannelId>
```

Example:

```bash
lindesk ticket 12345 --channel C0123ABC456
```

### Transfer a Zendesk ticket to Linear

```bash
lindesk ticket <ticketId> --project <linearProjectKey>
```

Example:

```bash
lindesk ticket 12345 --project ENG
```

If you've set a default project during setup, you can omit the --project flag:

```bash
lindesk ticket 12345
```

### Create Linear issue AND post to Slack

```bash
lindesk ticket <ticketId> --project <linearProjectKey> --channel <slackChannelId>
```

Example:

```bash
lindesk ticket 12345 --project ENG --channel C0123ABC456
```

### Custom AI Analysis Prompts

You can provide custom instructions for the AI analysis by adding a prompt as the second argument:

```bash
lindesk ticket <ticketId> "<custom-prompt>" --channel <slackChannelId>
```

Examples:

```bash
# Custom analysis for management summary
lindesk ticket 12345 "create a brief executive summary of this issue" --channel C0123ABC456

# Root cause analysis
lindesk ticket 12345 "analyze the root cause and suggest fixes" --channel C0123ABC456

# Customer-facing response
lindesk ticket 12345 "summarize this issue and provide potential reasonings for this, along with a customer facing response" --channel C0123ABC456
```

The custom prompt will be processed by Amp AI while maintaining the structured output format for clean Slack messages and Linear tickets.

### Command Options

- `--channel <id>` - Slack channel ID (posts to Slack only unless combined with --project)
- `--project <key>` - Linear project key (creates Linear issue only unless combined with --channel)

## How it works

1. Fetches the complete ticket details and conversation history from Zendesk
2. Analyzes the entire conversation using Amp AI to create a comprehensive issue analysis
3. Generates a detailed, well-structured analysis including:
   - Deep issue analysis and root cause investigation
   - Multiple potential reasons and concrete solutions
   - Immediate workarounds and next steps
   - Impact assessment and priority evaluation
4. Creates a new Linear issue with the AI-generated analysis and sets appropriate priority (if Linear option enabled)
5. Posts a formatted summary to Slack channel (if Slack option enabled)
6. Links back to the original Zendesk ticket for reference

## Output Format

Lindesk creates Linear tickets and Slack messages with structured, detailed analyses that include:
- **Issue Analysis**: Deep dive into what's happening and why
- **Potential Root Causes**: List of possible reasons this issue occurred
- **Recommended Solutions**: Concrete steps to resolve the issue, ordered by effectiveness
- **Immediate Workarounds**: Quick fixes or temporary solutions users can implement
- **Next Steps**: Clear action items with owners and timeline
- **Impact Assessment**: User/business impact and urgency justification
- **Additional Context**: Key insights from internal notes and conversation history

## Slack Integration

Lindesk can post ticket summaries to Slack channels with formatted messages that include:
- Ticket title and priority
- Problem summary
- Impact assessment  
- Link to original Zendesk ticket
- Linear issue link (if created)

### Slack Setup

1. **Create a Slack Bot:**
   - Go to https://api.slack.com/apps
   - Click "Create New App" → "From scratch"
   - Name your app (e.g., "Lindesk") and select your workspace
   - Under "OAuth & Permissions", add these scopes:
     - `chat:write`
     - `chat:write.public`
   - Install the app to your workspace
   - Copy the "Bot User OAuth Token" (starts with `xoxb-`)

2. **Add bot to channels:**
   - Go to the Slack channel where you want to post
   - Right-click the channel → "View channel details" → "Integrations" → "Add apps"
   - Add your Lindesk bot

3. **Configure Lindesk:**
   ```bash
   lindesk setup
   ```
   Enter your Slack bot token when prompted.

### Finding Slack Channel IDs

To get a channel ID:
- Open Slack in a browser and navigate to the channel
- The channel ID is in the URL: `https://app.slack.com/client/T0XXX/C0123ABC456`
- Or right-click the channel and "Copy Link" - the ID is at the end

For detailed Slack setup and usage instructions, see [SLACK_GUIDE.md](./lindesk/SLACK_GUIDE.md).

## License

MIT