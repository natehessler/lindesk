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
  
  // Sourcegraph Deep Search Configuration (moved right after Zendesk)
  console.log('\n' + chalk.yellow('Sourcegraph Deep Search Configuration:'));
  console.log(chalk.gray('Configure Sourcegraph Deep Search for ticket analysis'));
  
  const sourcegraphUrl = await rl.question('Sourcegraph URL (e.g., https://your-sourcegraph-instance.com): ');
  const sourcegraphToken = await rl.question('Sourcegraph access token: ');
  
  console.log(chalk.green('✓ Sourcegraph Deep Search configured for ticket analysis'));
  
  // Ask what services they want to use
  console.log('\n' + chalk.yellow('Integration Configuration:'));
  console.log(chalk.gray('What would you like to use Lindesk with?'));
  console.log('1. Slack only (post summaries to Slack channels)');
  console.log('2. Linear only (create issues in Linear)');
  console.log('3. Both Slack and Linear');
  
  const integrationChoice = await rl.question('Choose option (1, 2, or 3): ');
  
  let linearApiKey, defaultProject, slackToken, defaultSlackChannel;
  
  // Configure based on choice
  if (integrationChoice === '1' || integrationChoice === '3') {
    // Slack Configuration
    console.log('\n' + chalk.yellow('Slack Configuration:'));
    console.log(chalk.gray('Configure Slack for posting ticket summaries'));
    
    slackToken = await rl.question('Slack Bot Token: ');
    defaultSlackChannel = await rl.question('Default Slack channel ID (optional): ');
    console.log(chalk.green('✓ Slack integration configured'));
  }
  
  if (integrationChoice === '2' || integrationChoice === '3') {
    // Linear configuration
    console.log('\n' + chalk.yellow('Linear Configuration:'));
    linearApiKey = await rl.question('Linear API key: ');
    defaultProject = await rl.question('Default Linear project key (optional): ');
    console.log(chalk.green('✓ Linear integration configured'));
  }
  
  // Save configuration
  config.set('zendeskDomain', zendeskDomain);
  config.set('zendeskEmail', zendeskEmail);
  config.set('zendeskToken', zendeskToken);
  config.set('sourcegraphUrl', sourcegraphUrl);
  config.set('sourcegraphToken', sourcegraphToken);
  
  // Save Linear config if configured
  if (linearApiKey) {
    config.set('linearApiKey', linearApiKey);
  }
  
  if (defaultProject) {
    config.set('defaultProject', defaultProject);
  }
  
  // Save Slack config if configured
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