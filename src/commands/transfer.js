import fetch from 'node-fetch';
import { getConfig } from '../config.js';
import { analyzeTicket } from '../services/ai-service.js';
import { getZendeskTicket } from '../services/zendesk-service.js';
import { createLinearIssue } from '../services/linear-service.js';
import chalk from 'chalk';

export async function transferTicket(ticketId, projectKey) {
  const config = getConfig();
  
  // Validate configuration
  if (!config.zendeskDomain || !config.zendeskEmail || !config.zendeskToken) {
    throw new Error('Zendesk credentials not configured. Run "lindesk setup" first.');
  }
  
  if (!config.linearApiKey) {
    throw new Error('Linear API key not configured. Run "lindesk setup" first.');
  }
  
  if (!config.ampApiKey) {
    throw new Error('Amp API key not configured. Run "lindesk setup" first.');
  }
  
  // Use default project if not specified
  const project = projectKey || config.defaultProject;
  if (!project) {
    throw new Error('No Linear project specified. Use --project option or set a default project.');
  }
  
  console.log(chalk.blue(`Transferring Zendesk ticket #${ticketId} to Linear...`));
  
  // Step 1: Get the Zendesk ticket
  console.log(chalk.gray('Fetching ticket from Zendesk...'));
  const ticket = await getZendeskTicket(ticketId);
  console.log(chalk.green('✓ Zendesk ticket retrieved'));
  
  // Step 2: Analyze ticket with Amp AI
  console.log(chalk.gray('Analyzing ticket with Amp AI...'));
  const analysis = await analyzeTicket(ticket);
  console.log(chalk.green('✓ Amp AI analysis complete'));
  
  // Step 3: Create Linear issue
  console.log(chalk.gray('Creating issue in Linear...'));
  const issue = await createLinearIssue(analysis, project, ticketId);
  console.log(chalk.green('✓ Linear issue created'));
  
  // Success message
  console.log('');
  console.log(chalk.green(`Successfully created Linear issue: ${issue.identifier} - ${issue.title}`));
  console.log(chalk.blue(`Linear issue URL: ${issue.url}`));
  console.log(chalk.gray(`Linked to Zendesk ticket #${ticketId}`));
  
  return issue;
}