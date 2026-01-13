import Conf from 'conf';
import dotenv from 'dotenv';

try {
  dotenv.config({ silent: true });
} catch (e) {
  // Continue if .env file doesn't exist
}

export const config = new Conf({
  projectName: 'lindesk',
  schema: {
    plainApiKey: {
      type: 'string',
      default: process.env.PLAIN_API_KEY || ''
    },
    plainWorkspaceId: {
      type: 'string',
      default: process.env.PLAIN_WORKSPACE_ID || ''
    },
    sourcegraphUrl: {
      type: 'string',
      default: process.env.SOURCEGRAPH_URL || ''
    },
    sourcegraphToken: {
      type: 'string',
      default: process.env.SOURCEGRAPH_TOKEN || ''
    },
    slackToken: {
      type: 'string',
      default: process.env.SLACK_TOKEN || ''
    }
  }
});

export function getConfig() {
  return {
    plainApiKey: process.env.PLAIN_API_KEY || config.get('plainApiKey'),
    plainWorkspaceId: process.env.PLAIN_WORKSPACE_ID || config.get('plainWorkspaceId'),
    sourcegraphUrl: process.env.SOURCEGRAPH_URL || config.get('sourcegraphUrl'),
    sourcegraphToken: process.env.SOURCEGRAPH_TOKEN || config.get('sourcegraphToken'),
    slackToken: process.env.SLACK_TOKEN || config.get('slackToken')
  };
}
