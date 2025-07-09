# Lindesk

A CLI tool to integrate Zendesk tickets with Linear issues using AI summarization.

## Features

- Fetch ticket details from Zendesk
- Analyze complete ticket conversations using Amp AI
- Generate detailed, well-structured technical summaries for engineers
- Create a Linear issue with the AI-generated summary
- Link back to the original Zendesk ticket

## Prerequisites

- Node.js 16+ 
- Access to Zendesk (admin privileges to generate API tokens)
- Linear workspace access (ability to create API keys)
- Amp account with API access

## Installation

```bash
npm install -g lindesk
```

Or run directly:

```bash
npx lindesk
```

## Setup

Before using Lindesk, you need to configure your API credentials:

```bash
lindesk setup
```

This will prompt you for:
- Zendesk domain, email and API token
- Linear API key
- Amp API key and endpoint
- Optional default Linear project

Alternatively, you can use environment variables:

```
ZENDESK_DOMAIN=your-company.zendesk.com
ZENDESK_EMAIL=your-email@example.com
ZENDESK_TOKEN=your-zendesk-token
LINEAR_API_KEY=your-linear-api-key
AMP_API_KEY=your-amp-api-key
# AMP_ENDPOINT is optional, uses Amp CLI by default
DEFAULT_LINEAR_PROJECT=TEAM  # Optional
```

## Usage

### Transfer a Zendesk ticket to Linear

```bash
lindesk transfer <ticketId> --project <linearProjectKey>
```

Example:

```bash
lindesk transfer 12345 --project ENG
```

If you've set a default project during setup, you can omit the --project flag:

```bash
lindesk transfer 12345
```

## How it works

1. Fetches the complete ticket details and conversation history from Zendesk
2. Analyzes the entire conversation using Amp AI to create a comprehensive technical analysis
3. Generates a detailed, well-structured technical summary including:
   - Problem summary and environment details
   - Step-by-step reproduction instructions
   - Investigation findings and root cause analysis
   - Suggested solutions and impact assessment
   - Priority and complexity assessment
4. Creates a new Linear issue with the AI-generated analysis and sets appropriate priority
5. Links back to the original Zendesk ticket for reference

## Output Format

Lindesk creates Linear tickets with structured, detailed descriptions that include:
- **Problem Summary**: Clear overview of the issue
- **Environment**: Technical environment details
- **Reproduction Steps**: Numbered, step-by-step instructions
- **Expected vs Actual Behavior**: What should happen vs what actually happens
- **Investigation Findings**: Technical details discovered during analysis
- **Root Cause**: Analysis of the underlying cause
- **Suggested Solutions**: Recommended fixes or next steps
- **Impact**: Assessment of user and business impact

## License

MIT