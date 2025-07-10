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
  
  // Fetch the organization information if available
  let organization = null;
  if (data.ticket.organization_id) {
    try {
      const orgResponse = await fetch(`https://${zendeskDomain}/api/v2/organizations/${data.ticket.organization_id}.json`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (orgResponse.ok) {
        const orgData = await orgResponse.json();
        organization = orgData.organization;
        console.log('Found organization:', organization.name);
      }
    } catch (error) {
      console.log('Error fetching organization:', error.message);
    }
  }
  
  // Return ticket with comments and organization
  return {
    id: data.ticket.id,
    subject: data.ticket.subject,
    description: data.ticket.description,
    status: data.ticket.status,
    priority: data.ticket.priority,
    requester_id: data.ticket.requester_id,
    created_at: data.ticket.created_at,
    updated_at: data.ticket.updated_at,
    organization: organization ? organization.name : null,
    comments: commentsData.comments.map(comment => ({
      // Add all fields so we can debug
      ...comment,
      id: comment.id,
      author_id: comment.author_id,
      body: comment.body,
      html_body: comment.html_body,
      created_at: comment.created_at,
      public: comment.public !== undefined ? comment.public : !comment.metadata?.is_private,
      internal_note: comment.public !== undefined ? !comment.public : comment.metadata?.is_private
    }))
  };
}