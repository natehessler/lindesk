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
    // Amp is the AI provider
    ampApiKey: {
      type: 'string',
      default: process.env.AMP_API_KEY || ''
    },
    ampEndpoint: {
      type: 'string',
      default: process.env.AMP_ENDPOINT || 'https://ampcode.com/api/v1/chat/completions'
    },
    defaultProject: {
      type: 'string',
      default: process.env.DEFAULT_LINEAR_PROJECT || ''
    }
  }
});

export function getConfig() {
  return {
    zendeskDomain: config.get('zendeskDomain'),
    zendeskEmail: config.get('zendeskEmail'),
    zendeskToken: config.get('zendeskToken'),
    linearApiKey: config.get('linearApiKey'),
    ampApiKey: config.get('ampApiKey'),
    ampEndpoint: config.get('ampEndpoint'),
    defaultProject: config.get('defaultProject')
  };
}