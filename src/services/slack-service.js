import fetch from 'node-fetch';
import { getConfig } from '../config.js';

/**
 * Posts a summary of a Zendesk ticket to a Slack channel
 * @param {Object} analysis - The AI-generated analysis of the ticket
 * @param {string} ticketId - The Zendesk ticket ID
 * @param {string} teamChannel - The Slack channel ID to post to
 * @param {string} organizationName - The organization name from Zendesk
 * @returns {Promise<Object>} - The Slack message response
 */
export async function postToSlack(analysis, ticketId, teamChannel, organizationName) {
  // Get access to the ticket for organization information
  const ticket = analysis.ticket;
  // Access the ticket info for organization data
  const { slackToken, zendeskDomain } = getConfig();
  
  if (!slackToken) {
    throw new Error('Slack token not configured. Run "lindesk setup" first.');
  }

  if (!teamChannel) {
    throw new Error('Slack channel not specified. Use --channel option.');
  }

  // Use the AI-generated title if available, otherwise fall back to generic title
  const customerName = organizationName || ((ticket && ticket.organization) ? ticket.organization : 'Customer');
  console.log('Using customer name for Slack message:', customerName);
  
  // Use the AI-generated title, or fall back to generic title with customer name
  let slackTitle = analysis.title || `Need help with below support issue for ${customerName}`;
  
  // Truncate title if it's too long for Slack header (max 150 characters)
  if (slackTitle.length > 150) {
    slackTitle = slackTitle.substring(0, 147) + '...';
  }
  
  console.log('Using title for Slack message:', slackTitle);
  
  let slackBlocks = [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": slackTitle
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "View Zendesk Ticket"
          },
          "url": `https://${zendeskDomain}/agent/tickets/${ticketId}`
        }
      ]
    }
  ];

  // Add the full analysis description as a series of message blocks
  // Break the content into smaller chunks to fit Slack message limits
  const fullDescription = analysis.description;
  // Format the description for Slack

  // Process the description to properly format Markdown for Slack
  // Slack requires different markdown formatting
  
  // Remove the Engineering Recommendations section if present
  let descriptionWithoutRecommendations = fullDescription;
  const recommendationsRegex = /## Engineering Recommendations[\s\S]*?(?=## |$)/;
  descriptionWithoutRecommendations = descriptionWithoutRecommendations.replace(recommendationsRegex, '');
  
  // Format for Slack
  let processedDescription = descriptionWithoutRecommendations
    .replace(/## ([^\n]+)/g, '*$1*') // Make headers bold
    .replace(/\*\*/g, '*')         // Replace ** with * for bold
    .replace(/\*\*/g, '*')         // Do it again to catch any remaining
    .replace(/\n\n/g, '\n')       // Reduce excessive newlines
    .trim();                     // Remove trailing whitespace
  
  // Split the description into chunks of approximately 3000 characters
  // This ensures we stay under Slack's message size limits
  const MAX_CHUNK_SIZE = 2800;
  let startIndex = 0;
  
  while (startIndex < processedDescription.length) {
    // Get the next chunk of text
    const endIndex = Math.min(startIndex + MAX_CHUNK_SIZE, processedDescription.length);
    let chunk = processedDescription.substring(startIndex, endIndex);
    
    // If we're in the middle of a line, try to end at a newline
    if (endIndex < processedDescription.length) {
      const lastNewline = chunk.lastIndexOf('\n');
      if (lastNewline > 0 && lastNewline > MAX_CHUNK_SIZE - 500) {
        chunk = chunk.substring(0, lastNewline);
        startIndex += lastNewline + 1;
      } else {
        startIndex = endIndex;
      }
    } else {
      startIndex = endIndex;
    }
    
    // Add this chunk as a section
    slackBlocks.push({
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": chunk
      }
    });
  }
  
  // Post message to Slack
  console.log('Posting to Slack channel...');
  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${slackToken}`
    },
    body: JSON.stringify({
      channel: teamChannel,
      blocks: slackBlocks
    })
  });

  const data = await response.json();
  
  // Process API response

  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error || JSON.stringify(data)}`);
  }
  
  return data;
}

/**
 * Extracts a section from the analysis description
 * @param {string} description - The full ticket description
 * @param {string} sectionName - The name of the section to extract
 * @returns {string} - The extracted section text
 */
function extractSection(description, sectionName) {
  if (!description) return "No information available";
  
  // Extract section with flexible pattern matching
  
  // More flexible regex that matches section headings with or without ## and variable whitespace
  const sectionRegex = new RegExp(`(?:##\s*|\n)${sectionName}[:\s]*\n([\s\S]*?)(?=\n(?:##\s*|\n)[A-Za-z]|$)`, 'i');
  const match = description.match(sectionRegex);
  
  if (match) {
    return match[1].trim();
  } else {
    return "No information available";
  }
}