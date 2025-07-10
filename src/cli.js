#!/usr/bin/env node

import { Command } from 'commander';
import { config } from './config.js';
import { transferTicket } from './commands/transfer.js';
import { setupConfig } from './commands/setup.js';
import { exportEnv } from './commands/export-env.js';
import chalk from 'chalk';

const program = new Command();

program
  .name('lindesk')
  .description('CLI to integrate Zendesk tickets with Linear issues')
  .version('0.1.0');

program
  .command('transfer')
  .description('Transfer a Zendesk ticket to Linear with AI summary')
  .argument('<ticketId>', 'Zendesk ticket ID to transfer')
  .option('-p, --project <project>', 'Linear project key')
  .option('-c, --channel <channel>', 'Slack channel ID to post summary to')
  .option('--linear-only', 'Only create Linear issue, skip Slack')
  .option('--slack-only', 'Only post to Slack, skip Linear')
  .action(async (ticketId, options) => {
    try {
      // Determine destination based on flags
      const createLinear = !options.slackOnly;
      const postToSlackChannel = !options.linearOnly && options.channel;
      
      await transferTicket(ticketId, options.project, options.channel, createLinear, postToSlackChannel);
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('setup')
  .description('Configure Lindesk with API keys')
  .action(async () => {
    try {
      await setupConfig();
      console.log(chalk.green('Configuration completed successfully!'));
    } catch (error) {
      console.error(chalk.red(`Error during setup: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('export-env')
  .description('Export your configuration to a .env file for automatic loading')
  .action(async () => {
    try {
      await exportEnv();
    } catch (error) {
      console.error(chalk.red(`Error exporting environment: ${error.message}`));
      process.exit(1);
    }
  });

program.parse();