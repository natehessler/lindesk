import fetch from 'node-fetch';
import { getConfig } from '../config.js';

const LINEAR_API_URL = 'https://api.linear.app/graphql';

export async function createLinearIssue(analysis, teamKey, threadId) {
  const { linearApiKey } = getConfig();
  
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
  
  const teamId = await getTeamId(teamKey);
  
  // Create a focused Linear issue description with actionable next steps
  const linearDescription = formatLinearDescription(analysis, threadId);
  
  const variables = {
    title: `[Support] ${analysis.title || analysis.originalSubject}`,
    description: linearDescription,
    teamId: teamId,
    labelIds: [],
    estimate: analysis.estimatedComplexity || undefined,
    priority: convertPriorityToLinearValue(analysis.priority)
  };
  
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

function formatLinearDescription(analysis, threadId) {
  const ticket = analysis.ticket || {};
  const customerName = ticket.organization || 'Customer';
  
  let description = `## Customer Issue\n\n`;
  description += `**Customer:** ${customerName}\n`;
  description += `**Plain Thread:** #${threadId}\n`;
  description += `**Original Subject:** ${analysis.originalSubject || 'N/A'}\n\n`;
  
  // Add a brief summary extracted from the analysis
  description += `## Summary\n\n`;
  description += extractSummary(analysis.description) + '\n\n';
  
  // Add recommended next steps
  description += `## Recommended Next Steps\n\n`;
  description += extractNextSteps(analysis.description) + '\n\n';
  
  // Add context about what Deep Search found
  if (analysis.sources && analysis.sources.length > 0) {
    description += `## Related Code References\n\n`;
    const topSources = analysis.sources.slice(0, 5);
    topSources.forEach(source => {
      if (source.url) {
        description += `- [${source.title || source.url}](${source.url})\n`;
      }
    });
    description += '\n';
  }
  
  // Link to full analysis
  description += `---\n`;
  description += `*This issue was created from Plain thread #${threadId} using Lindesk AI analysis.*`;
  
  return description;
}

function extractSummary(fullDescription) {
  if (!fullDescription) return 'No summary available.';
  
  // Try to find the first meaningful paragraph
  const lines = fullDescription.split('\n').filter(line => line.trim());
  
  // Skip header lines and find first content
  let summary = '';
  for (const line of lines) {
    // Skip markdown headers
    if (line.startsWith('#')) continue;
    // Skip bullet points that are too short
    if (line.startsWith('-') && line.length < 50) continue;
    
    // Found a good content line
    summary = line.replace(/^\*\*[^*]+\*\*\s*/, '').trim();
    if (summary.length > 50) break;
  }
  
  // If we found a summary, truncate if needed
  if (summary) {
    if (summary.length > 500) {
      summary = summary.substring(0, 497) + '...';
    }
    return summary;
  }
  
  // Fallback: first 500 chars of the description
  return fullDescription.substring(0, 500).trim() + '...';
}

function extractNextSteps(fullDescription) {
  if (!fullDescription) return '- Review the thread and respond to customer\n- Investigate the reported issue';
  
  // Look for sections that might contain recommendations
  const patterns = [
    /(?:next steps|recommendations|suggested actions|action items)[:\s]*\n([\s\S]*?)(?=\n##|\n\*\*[A-Z]|$)/i,
    /(?:to resolve|to fix|solution)[:\s]*\n([\s\S]*?)(?=\n##|\n\*\*[A-Z]|$)/i,
  ];
  
  for (const pattern of patterns) {
    const match = fullDescription.match(pattern);
    if (match && match[1]) {
      const steps = match[1].trim();
      if (steps.length > 50) {
        // Limit to first 5 bullet points
        const bullets = steps.split('\n').filter(l => l.trim().startsWith('-') || l.trim().match(/^\d+\./));
        if (bullets.length > 0) {
          return bullets.slice(0, 5).join('\n');
        }
        return steps.substring(0, 500);
      }
    }
  }
  
  // Default next steps
  return `- Review the Deep Search analysis for root cause details
- Investigate the identified code areas
- Respond to customer with findings
- Consider creating a fix if a bug is confirmed`;
}

async function getTeamId(teamKey) {
  const { linearApiKey } = getConfig();
  
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
  
  const teams = result.data.teams.nodes;
  const team = teams.find(t => t.key.toLowerCase() === teamKey.toLowerCase());
  
  if (!team) {
    const availableTeams = teams.map(t => t.key).join(', ');
    throw new Error(`Team with key "${teamKey}" not found. Available teams: ${availableTeams}`);
  }
  
  return team.id;
}

function convertPriorityToLinearValue(priority) {
  if (!priority) return 0;
  
  const priorityLower = priority.toLowerCase();
  
  switch (priorityLower) {
    case 'urgent': return 1;
    case 'high': return 2;
    case 'medium': return 3;
    case 'low': return 4;
    default: return 0;
  }
}
