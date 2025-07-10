# Posting Zendesk Ticket Summaries to Slack

## Setup

1. First, make sure you've configured Lindesk with your Slack token:

```bash
lindesk setup
```

During setup, you'll be prompted for your Slack Bot Token and an optional default Slack channel.

2. Create a Slack Bot in your workspace:
   - Go to https://api.slack.com/apps
   - Click "Create New App" and select "From scratch"
   - Name your app (e.g., "Lindesk")
   - Select your workspace
   - Under "OAuth & Permissions", add these scopes:
     - `chat:write`
     - `chat:write.public`
   - Install the app to your workspace
   - Copy the "Bot User OAuth Token" (starts with `xoxb-`)
  
 3. Add the bot to your channel:
    - Open Slack
    - Go to the channel where you want to post
    - Right-click the channel and select "View channel details"
    - Click "Integrations" tab
    - Click "Add apps" and add your bot    

## Posting to Slack

### Basic Usage

To post a Zendesk ticket summary to Slack:

```bash
lindesk transfer 12345 --channel C0123ABC456 --slack-only
```

Where:
- `12345` is your Zendesk ticket ID
- `C0123ABC456` is the Slack channel ID

### Finding Your Slack Channel ID

To get a channel ID:
1. Open Slack in a browser
2. Navigate to the channel
3. The channel ID is in the URL: `https://app.slack.com/client/T0XXX/C0123ABC456`

Or right-click on the channel in Slack and select "Copy Link" - the ID is at the end of the URL.

### Using a Default Channel

If you set a default channel during setup, you can omit the `--channel` parameter:

```bash
lindesk transfer 12345 --slack-only
```

### Posting to Multiple Channels

To post to multiple channels, run the command multiple times:

```bash
lindesk transfer 12345 --channel C0123ABC456 --slack-only
lindesk transfer 12345 --channel C9876XYZ123 --slack-only
```

### Creating Linear Issue and Posting to Slack

To do both actions at once:

```bash
lindesk transfer 12345 --project ENG --channel C0123ABC456
```

## Slack Message Format

The Slack message includes:
- Ticket title
- Problem summary
- Impact assessment
- Priority and complexity ratings
- Link to the original Zendesk ticket

## Troubleshooting

If you encounter errors:

1. Verify your Slack token is correct:
   ```bash
   lindesk setup
   ```

2. Ensure the bot has been added to the channel

3. Check that the channel ID is correct

4. Verify the bot has proper permissions in your Slack workspace
