import fs from 'fs/promises';
import { getConfig } from '../config.js';
import chalk from 'chalk';
import path from 'path';

export async function exportEnv() {
  const config = getConfig();
  
  // Create .env file content (in setup order)
  let envContent = '';
  
  // Add Zendesk config if available
  if (config.zendeskDomain) envContent += `ZENDESK_DOMAIN=${config.zendeskDomain}\n`;
  if (config.zendeskEmail) envContent += `ZENDESK_EMAIL=${config.zendeskEmail}\n`;
  if (config.zendeskToken) envContent += `ZENDESK_TOKEN=${config.zendeskToken}\n`;
  
  // Add Sourcegraph config if available
  if (config.sourcegraphUrl) envContent += `SOURCEGRAPH_URL=${config.sourcegraphUrl}\n`;
  if (config.sourcegraphToken) envContent += `SOURCEGRAPH_TOKEN=${config.sourcegraphToken}\n`;
  
  // Add Slack config if available
  if (config.slackToken) envContent += `SLACK_TOKEN=${config.slackToken}\n`;
  if (config.defaultSlackChannel) envContent += `DEFAULT_SLACK_CHANNEL=${config.defaultSlackChannel}\n`;
  
  // Add Linear config if available
  if (config.linearApiKey) envContent += `LINEAR_API_KEY=${config.linearApiKey}\n`;
  if (config.defaultProject) envContent += `DEFAULT_LINEAR_PROJECT=${config.defaultProject}\n`;
  
  // Get the current working directory
  const cwd = process.cwd();
  const envFilePath = path.join(cwd, '.env');
  
  try {
    // Check if file exists
    let fileExists = false;
    try {
      await fs.access(envFilePath);
      fileExists = true;
    } catch (e) {
      // File doesn't exist, which is fine
    }
    
    // Warn if overwriting
    if (fileExists) {
      console.log(chalk.yellow('Warning: .env file already exists and will be overwritten.'));
    }
    
    // Write the file
    await fs.writeFile(envFilePath, envContent);
    console.log(chalk.green(`u2713 Environment variables exported to ${envFilePath}`));
    console.log(chalk.gray('You can now use these environment variables automatically'));
  } catch (error) {
    console.error(chalk.red(`Error writing .env file: ${error.message}`));
    throw error;
  }
}