import Conf from 'conf';
// Environment variables can be loaded either through dotenv or by sourcing env.sh
import dotenv from 'dotenv';

// Try to load from .env file if it exists (won't override existing env vars)
try {
  dotenv.config({ silent: true });
} catch (e) {
  // Continue if .env file doesn't exist or can't be loaded
  console.log('No .env file found, using environment variables directly');
}

export const config = new Conf({
  projectName: 'lindesk',
  schema: {
    zendeskDomain: {
      type: 'string',
      default: process.env.ZENDESK_DOMAIN || ''
    },
    zendeskEmail: {
      type: 'string',
      default: process.env.ZENDESK_EMAIL || ''
    },
    zendeskToken: {
      type: 'string',
      default: process.env.ZENDESK_TOKEN || ''
    },
    linearApiKey: {
      type: 'string',
      default: process.env.LINEAR_API_KEY || ''
    },
    // Sourcegraph Deep Search is the AI provider
    sourcegraphUrl: {
      type: 'string',
      default: process.env.SOURCEGRAPH_URL || ''
    },
    sourcegraphToken: {
      type: 'string',
      default: process.env.SOURCEGRAPH_TOKEN || ''
    },
    defaultProject: {
      type: 'string',
      default: process.env.DEFAULT_LINEAR_PROJECT || ''
    },
    slackToken: {
      type: 'string',
      default: process.env.SLACK_TOKEN || ''
    },
    defaultSlackChannel: {
      type: 'string',
      default: process.env.DEFAULT_SLACK_CHANNEL || ''
    },
  }
});

export function getConfig() {
  return {
    zendeskDomain: config.get('zendeskDomain'),
    zendeskEmail: config.get('zendeskEmail'),
    zendeskToken: config.get('zendeskToken'),
    linearApiKey: config.get('linearApiKey'),
    sourcegraphUrl: config.get('sourcegraphUrl'),
    sourcegraphToken: config.get('sourcegraphToken'),
    defaultProject: config.get('defaultProject'),
    slackToken: config.get('slackToken'),
    defaultSlackChannel: config.get('defaultSlackChannel')
  };
}