#!/usr/bin/env node

import { Command } from 'commander';
import { processThread } from './commands/transfer.js';
import chalk from 'chalk';

const program = new Command();

program
  .name('lindesk')
  .description('CLI to analyze Plain threads with Deep Search and post to Slack')
  .version('1.0.0')
  .argument('<threadId>', 'Plain thread ID to analyze')
  .option('-c, --channel <channelId>', 'Slack channel ID to post to (required)')
  .option('--prompt <prompt>', 'Custom prompt for AI analysis (optional)')
  .action(async (threadId, options) => {
    try {
      if (!options.channel) {
        console.error(chalk.red('Error: --channel option is required'));
        console.log(chalk.gray('Usage: lindesk <threadId> --channel <SLACK_CHANNEL_ID>'));
        process.exit(1);
      }
      
      await processThread(threadId, options.channel, options.prompt);
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

program.parse();
