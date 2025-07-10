import readline from 'readline/promises';
import { config } from '../config.js';
import chalk from 'chalk';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

export async function setupConfig() {
  console.log(chalk.blue('Lindesk Setup'));
  console.log(chalk.gray('Configure your API keys and settings'));
  console.log('');
  
  // Zendesk configuration
  console.log(chalk.yellow('Zendesk Configuration:'));
  const zendeskDomain = await rl.question('Zendesk domain (e.g., company.zendesk.com): ');
  const zendeskEmail = await rl.question('Zendesk email: ');
  const zendeskToken = await rl.question('Zendesk API token: ');
  
  // Linear configuration
  console.log('\n' + chalk.yellow('Linear Configuration:'));
  const linearApiKey = await rl.question('Linear API key: ');
  const defaultProject = await rl.question('Default Linear project key (optional): ');
  
  // Amp AI Configuration
  console.log('\n' + chalk.yellow('Amp AI Configuration:'));
  console.log(chalk.gray('Configure Amp AI for ticket analysis'));
  console.log(chalk.blue('DEBUG: About to ask for Amp path'));
  
  const ampApiKey = await rl.question('Amp API key: ');
  console.log(chalk.blue('DEBUG: Got Amp API key'));
  const ampEndpoint = await rl.question('Amp endpoint (optional, press Enter for default): ');
  console.log(chalk.blue('DEBUG: Got Amp endpoint'));
  const ampPath = await rl.question('Path to Amp CLI (e.g., /opt/homebrew/bin/amp or leave empty to use "amp" from PATH): ');
  console.log(chalk.blue('DEBUG: Got Amp path: ' + ampPath));
  
  console.log(chalk.green('✓ Amp AI configured for ticket analysis'));
  
  // Slack Configuration
  console.log('\n' + chalk.yellow('Slack Configuration:'));
  console.log(chalk.gray('Configure Slack for posting ticket summaries'));
  
  const slackToken = await rl.question('Slack Bot Token: ');
  const defaultSlackChannel = await rl.question('Default Slack channel ID (optional): ');
  
  if (slackToken) {
    console.log(chalk.green('✓ Slack integration configured'));
  }
  
  // Save configuration
  config.set('zendeskDomain', zendeskDomain);
  config.set('zendeskEmail', zendeskEmail);
  config.set('zendeskToken', zendeskToken);
  config.set('linearApiKey', linearApiKey);
  config.set('ampApiKey', ampApiKey);
  if (ampEndpoint) {
    config.set('ampEndpoint', ampEndpoint);
  }
  if (ampPath) {
    config.set('ampPath', ampPath);
  }
  
  if (defaultProject) {
    config.set('defaultProject', defaultProject);
  }
  
  if (slackToken) {
    config.set('slackToken', slackToken);
  }
  
  if (defaultSlackChannel) {
    config.set('defaultSlackChannel', defaultSlackChannel);
  }
  
  // Ask if user wants to generate .env file
  const generateEnv = await rl.question(chalk.blue('\nGenerate .env file with these settings? (y/n): '));
  
  rl.close();
  
  if (generateEnv.toLowerCase() === 'y') {
    try {
      const { exportEnv } = await import('./export-env.js');
      await exportEnv();
    } catch (error) {
      console.error(chalk.red(`Error generating .env file: ${error.message}`));
    }
  }
}