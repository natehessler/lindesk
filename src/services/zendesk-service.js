import fetch from 'node-fetch';
import { getConfig } from '../config.js';

export async function getZendeskTicket(ticketId) {
  const { zendeskDomain, zendeskEmail, zendeskToken } = getConfig();
  
  const auth = Buffer.from(`${zendeskEmail}/token:${zendeskToken}`).toString('base64');
  
  const response = await fetch(`https://${zendeskDomain}/api/v2/tickets/${ticketId}.json`, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch Zendesk ticket: ${response.status} ${error}`);
  }
  
  const data = await response.json();
  
  // Get ticket comments to include in the analysis
  const commentsResponse = await fetch(`https://${zendeskDomain}/api/v2/tickets/${ticketId}/comments.json`, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!commentsResponse.ok) {
    const error = await commentsResponse.text();
    throw new Error(`Failed to fetch ticket comments: ${commentsResponse.status} ${error}`);
  }
  
  const commentsData = await commentsResponse.json();
  
  // Return ticket with comments
  return {
    id: data.ticket.id,
    subject: data.ticket.subject,
    description: data.ticket.description,
    status: data.ticket.status,
    priority: data.ticket.priority,
    requester_id: data.ticket.requester_id,
    created_at: data.ticket.created_at,
    updated_at: data.ticket.updated_at,
    comments: commentsData.comments.map(comment => ({
      id: comment.id,
      author_id: comment.author_id,
      body: comment.body,
      html_body: comment.html_body,
      created_at: comment.created_at
    }))
  };
}