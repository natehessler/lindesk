import { getConfig } from '../config.js';
import { analyzeTicket } from '../services/ai-service.js';
import { getPlainThread } from '../services/plain-service.js';
import { postToSlack } from '../services/slack-service.js';
import chalk from 'chalk';

export async function processThread(threadId, channelId, customPrompt = null) {
  const config = getConfig();
  
  if (!config.plainApiKey) {
    throw new Error('Plain API key not configured. Set PLAIN_API_KEY environment variable.');
  }
  
  if (!config.slackToken) {
    throw new Error('Slack token not configured. Set SLACK_TOKEN environment variable.');
  }
  
  if (!config.sourcegraphUrl || !config.sourcegraphToken) {
    throw new Error('Sourcegraph configuration not complete. Set SOURCEGRAPH_URL and SOURCEGRAPH_TOKEN environment variables.');
  }
  
  console.log(chalk.blue(`Processing Plain thread #${threadId}...`));
  
  console.log(chalk.gray('Fetching thread from Plain...'));
  const thread = await getPlainThread(threadId);
  console.log(chalk.green('✓ Plain thread retrieved'));
  if (thread.organization) {
    console.log(chalk.gray(`Organization: ${thread.organization}`));
  }
  
  console.log(chalk.gray('Analyzing thread with Deep Search...'));
  const analysis = await analyzeTicket(thread, customPrompt);
  console.log(chalk.green('✓ Deep Search analysis complete'));
  
  console.log(chalk.gray(`Posting to Slack channel ${channelId}...`));
  const result = await postToSlack(analysis, threadId, channelId, thread);
  console.log(chalk.green('✓ Posted to Slack'));
  
  console.log('');
  console.log(chalk.green(`Successfully posted analysis to Slack channel ${channelId}`));
  console.log(chalk.gray(`Plain thread: #${threadId}`));
  
  return { 
    success: true,
    analysis,
    threadId,
    channelId
  };
}
