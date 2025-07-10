import fetch from 'node-fetch';
import { getConfig } from '../config.js';
import { analyzeTicket } from '../services/ai-service.js';
import { getZendeskTicket } from '../services/zendesk-service.js';
import { createLinearIssue } from '../services/linear-service.js';
import { postToSlack } from '../services/slack-service.js';
import chalk from 'chalk';

export async function transferTicket(ticketId, projectKey, slackChannel, createLinear = true, postToSlackChannel = false) {
  const config = getConfig();
  
  // Validate configuration
  if (!config.zendeskDomain || !config.zendeskEmail || !config.zendeskToken) {
    throw new Error('Zendesk credentials not configured. Run "lindesk setup" first.');
  }
  
  if (createLinear && !config.linearApiKey) {
    throw new Error('Linear API key not configured. Run "lindesk setup" first.');
  }
  
  if (postToSlackChannel && !config.slackToken) {
    throw new Error('Slack token not configured. Run "lindesk setup" first.');
  }
  
  if (!config.ampApiKey) {
    throw new Error('Amp API key not configured. Run "lindesk setup" first.');
  }
  
  // Use default project if not specified for Linear
  let project = null;
  if (createLinear) {
    project = projectKey || config.defaultProject;
    if (!project) {
      throw new Error('No Linear project specified. Use --project option or set a default project.');
    }
  }
  
  // Use default channel if not specified for Slack
  if (postToSlackChannel && !slackChannel) {
    slackChannel = config.defaultSlackChannel;
    if (!slackChannel) {
      throw new Error('No Slack channel specified. Use --channel option or set a default channel.');
    }
  }
  
  // Determine what we're doing
  let actionDescription = '';
  if (createLinear && postToSlackChannel) {
    actionDescription = `Processing Zendesk ticket #${ticketId} for Linear and Slack...`;
  } else if (createLinear) {
    actionDescription = `Transferring Zendesk ticket #${ticketId} to Linear...`;
  } else if (postToSlackChannel) {
    actionDescription = `Posting Zendesk ticket #${ticketId} summary to Slack...`;
  }
  
  console.log(chalk.blue(actionDescription));
  
  // Step 1: Get the Zendesk ticket
  console.log(chalk.gray('Fetching ticket from Zendesk...'));
  const ticket = await getZendeskTicket(ticketId);
  console.log(chalk.green('✓ Zendesk ticket retrieved'));
  if (ticket.organization) {
    console.log(chalk.gray(`Organization: ${ticket.organization}`));
  }
  
  // Step 2: Analyze ticket with Amp AI
  console.log(chalk.gray('Analyzing ticket with Amp AI...'));
  const analysis = await analyzeTicket(ticket);
  console.log(chalk.green('✓ Amp AI analysis complete'));
  
  let issue = null;
  
  // Step 3: Create Linear issue if requested
  if (createLinear) {
    console.log(chalk.gray('Creating issue in Linear...'));
    issue = await createLinearIssue(analysis, project, ticketId);
    console.log(chalk.green('✓ Linear issue created'));
  }
  
  // Step 4: Post to Slack if requested
  if (postToSlackChannel) {
    console.log(chalk.gray(`Posting summary to Slack channel ${slackChannel}...`));
    try {
      // Pass the ticket organization explicitly to ensure it's available
      await postToSlack(analysis, ticketId, slackChannel, ticket.organization);
      console.log(chalk.green('✓ Posted to Slack successfully'));
    } catch (error) {
      console.warn(chalk.yellow(`Warning: Failed to post to Slack: ${error.message}`));
    }
  }
  
  // Success message
  console.log('');
  if (createLinear && issue) {
    console.log(chalk.green(`Successfully created Linear issue: ${issue.identifier} - ${issue.title}`));
    console.log(chalk.blue(`Linear issue URL: ${issue.url}`));
  }
  if (postToSlackChannel) {
    console.log(chalk.green(`Successfully posted summary to Slack channel ${slackChannel}`));
  }
  console.log(chalk.gray(`Referenced Zendesk ticket #${ticketId}`));
  
  return { issue, ticketId };
}