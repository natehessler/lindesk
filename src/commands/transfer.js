import fetch from 'node-fetch';
import { getConfig } from '../config.js';
import { analyzeTicket } from '../services/ai-service.js';
import { getPlainThread } from '../services/plain-service.js';
import { createLinearIssue } from '../services/linear-service.js';
import { postToSlack } from '../services/slack-service.js';
import chalk from 'chalk';

export async function transferTicket(threadId, projectKey, slackChannel, createLinear = true, postToSlackChannel = false, customPrompt = null) {
  const config = getConfig();
  
  if (!config.plainApiKey) {
    throw new Error('Plain API key not configured. Run "lindesk setup" first.');
  }
  
  if (createLinear && !config.linearApiKey) {
    throw new Error('Linear API key not configured. Run "lindesk setup" first.');
  }
  
  if (postToSlackChannel && !config.slackToken) {
    throw new Error('Slack token not configured. Run "lindesk setup" first.');
  }
  
  if (!config.sourcegraphUrl || !config.sourcegraphToken) {
    throw new Error('Sourcegraph configuration not complete. Run "lindesk setup" first.');
  }
  
  let project = null;
  if (createLinear) {
    project = projectKey || config.defaultProject;
    if (!project) {
      throw new Error('No Linear project specified. Use --project option or set a default project.');
    }
  }
  
  if (postToSlackChannel && !slackChannel) {
    slackChannel = config.defaultSlackChannel;
    if (!slackChannel) {
      throw new Error('No Slack channel specified. Use --channel option or set a default channel.');
    }
  }
  
  let actionDescription = '';
  if (createLinear && postToSlackChannel) {
    actionDescription = `Processing Plain thread #${threadId} for Linear and Slack...`;
  } else if (createLinear) {
    actionDescription = `Transferring Plain thread #${threadId} to Linear...`;
  } else if (postToSlackChannel) {
    actionDescription = `Posting Plain thread #${threadId} summary to Slack...`;
  }
  
  console.log(chalk.blue(actionDescription));
  
  console.log(chalk.gray('Fetching thread from Plain...'));
  const thread = await getPlainThread(threadId);
  console.log(chalk.green('✓ Plain thread retrieved'));
  if (thread.organization) {
    console.log(chalk.gray(`Organization: ${thread.organization}`));
  }
  
  console.log(chalk.gray('Analyzing thread with Deep Search...'));
  const analysis = await analyzeTicket(thread, customPrompt);
  console.log(chalk.green('✓ Deep Search analysis complete'));
  
  let issue = null;
  
  if (createLinear) {
    console.log(chalk.gray('Creating issue in Linear...'));
    issue = await createLinearIssue(analysis, project, threadId);
    console.log(chalk.green('✓ Linear issue created'));
  }
  
  if (postToSlackChannel) {
    console.log(chalk.gray(`Posting summary to Slack channel ${slackChannel}...`));
    try {
      await postToSlack(analysis, threadId, slackChannel, thread.organization);
      console.log(chalk.green('✓ Posted to Slack successfully'));
    } catch (error) {
      console.warn(chalk.yellow(`Warning: Failed to post to Slack: ${error.message}`));
    }
  }
  
  console.log('');
  if (createLinear && issue) {
    console.log(chalk.green(`Successfully created Linear issue: ${issue.identifier} - ${issue.title}`));
    console.log(chalk.blue(`Linear issue URL: ${issue.url}`));
  }
  if (postToSlackChannel) {
    console.log(chalk.green(`Successfully posted summary to Slack channel ${slackChannel}`));
  }
  console.log(chalk.gray(`Referenced Plain thread #${threadId}`));
  
  return { 
    success: true,
    analysis,
    issue, 
    threadId,
    thread: {
      id: thread.id,
      subject: thread.subject,
      organization: thread.organization
    },
    actions: {
      createdLinear: createLinear,
      postedToSlack: postToSlackChannel,
      slackChannel,
      linearProject: project
    }
  };
}
