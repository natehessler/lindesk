import fetch from 'node-fetch';
import { getConfig } from '../config.js';

// GraphQL API endpoint for Linear
const LINEAR_API_URL = 'https://api.linear.app/graphql';

export async function createLinearIssue(analysis, teamKey, zendeskTicketId) {
  const { linearApiKey } = getConfig();
  
  // GraphQL mutation to create an issue
  const mutation = `
    mutation CreateIssue($title: String!, $description: String!, $teamId: String!, $labelIds: [String!], $estimate: Int, $priority: Int) {
      issueCreate(input: {
        title: $title,
        description: $description,
        teamId: $teamId,
        labelIds: $labelIds,
        estimate: $estimate,
        priority: $priority
      }) {
        success
        issue {
          id
          identifier
          title
          url
        }
      }
    }
  `;
  
  // First, we need to get the team ID from the team key
  const teamId = await getTeamId(teamKey);
  
  // Create variables for the mutation
  const variables = {
    title: analysis.title,
    description: `${analysis.description}\n\n---\n**Source:** Zendesk ticket #${zendeskTicketId}\n**Original Subject:** ${analysis.originalSubject}`,
    teamId: teamId,
    labelIds: [], // You could add labels based on AI analysis
    estimate: analysis.estimatedComplexity || undefined,
    priority: convertPriorityToLinearValue(analysis.priority)
  };
  
  // Execute the mutation
  const response = await fetch(LINEAR_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': linearApiKey
    },
    body: JSON.stringify({
      query: mutation,
      variables
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create Linear issue: ${response.status} ${error}`);
  }
  
  const result = await response.json();
  
  if (result.errors) {
    throw new Error(`GraphQL error: ${JSON.stringify(result.errors)}`);
  }
  
  if (!result.data.issueCreate.success) {
    throw new Error('Failed to create Linear issue');
  }
  
  return result.data.issueCreate.issue;
}

async function getTeamId(teamKey) {
  const { linearApiKey } = getConfig();
  
  // GraphQL query to get team ID from team key
  const query = `
    query FindTeamByKey {
      teams {
        nodes {
          id
          key
          name
        }
      }
    }
  `;
  
  const response = await fetch(LINEAR_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': linearApiKey
    },
    body: JSON.stringify({
      query
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get team ID: ${response.status} ${error}`);
  }
  
  const result = await response.json();
  
  if (result.errors) {
    throw new Error(`GraphQL error: ${JSON.stringify(result.errors)}`);
  }
  
  // Find the team with the matching key
  const teams = result.data.teams.nodes;
  const team = teams.find(t => t.key.toLowerCase() === teamKey.toLowerCase());
  
  if (!team) {
    // Log available teams to help debug
    const availableTeams = teams.map(t => t.key).join(', ');
    throw new Error(`Team with key "${teamKey}" not found. Available teams: ${availableTeams}`);
  }
  
  return team.id;
}

// Convert priority text to Linear's priority number system
function convertPriorityToLinearValue(priority) {
  if (!priority) return 0; // No priority
  
  const priorityLower = priority.toLowerCase();
  
  switch (priorityLower) {
    case 'urgent':
      return 1;
    case 'high':
      return 2;
    case 'medium':
      return 3;
    case 'low':
      return 4;
    default:
      return 0; // No priority
  }
}