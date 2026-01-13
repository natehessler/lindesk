import fetch from 'node-fetch';
import { getConfig } from '../config.js';

const PLAIN_API_URL = 'https://core-api.uk.plain.com/graphql/v1';

async function graphqlRequest(query, variables = {}) {
  const config = getConfig();
  const token = config.plainApiKey;

  if (!token) {
    throw new Error('Plain API key not configured. Set PLAIN_API_KEY or configure via settings.');
  }

  const response = await fetch(PLAIN_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();

  if (result.errors && result.errors.length > 0) {
    const errorMessages = result.errors.map(e => e.message).join(', ');
    throw new Error(`Plain GraphQL error: ${errorMessages}`);
  }

  if (!response.ok) {
    throw new Error(`Plain API request failed: ${response.status} ${response.statusText}`);
  }

  return result.data;
}

const THREAD_QUERY = `
  query getThread($threadId: ID!) {
    thread(threadId: $threadId) {
      id
      ref
      title
      description
      previewText
      status
      priority
      customer {
        id
        fullName
        shortName
        email {
          email
        }
      }
      createdAt {
        iso8601
      }
      updatedAt {
        iso8601
      }
      timelineEntries(first: 50) {
        edges {
          node {
            id
            timestamp {
              iso8601
            }
            actor {
              ... on UserActor {
                user {
                  fullName
                  email
                }
              }
              ... on CustomerActor {
                customer {
                  fullName
                  email {
                    email
                  }
                }
              }
              ... on MachineUserActor {
                machineUser {
                  fullName
                }
              }
              ... on SystemActor {
                systemId
              }
            }
            entry {
              ... on ChatEntry {
                chatId
                chatText: text
              }
              ... on EmailEntry {
                emailId
                subject
                textContent
                to {
                  email
                  name
                }
                from {
                  email
                  name
                }
              }
              ... on NoteEntry {
                noteId
                noteText: text
                markdown
              }
              ... on CustomEntry {
                title
                components {
                  ... on ComponentText {
                    componentText: text
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

function extractActorInfo(actor) {
  if (!actor) {
    return { name: 'System', email: null, isAgent: true };
  }

  if (actor.customer) {
    return {
      name: actor.customer.fullName || actor.customer.shortName || 'Customer',
      email: actor.customer.email?.email || null,
      isAgent: false,
    };
  }

  if (actor.user) {
    return {
      name: actor.user.fullName || 'Agent',
      email: actor.user.email || null,
      isAgent: true,
    };
  }

  if (actor.machineUser) {
    return {
      name: actor.machineUser.fullName || 'Bot',
      email: null,
      isAgent: true,
    };
  }

  return { name: 'System', email: null, isAgent: true };
}

function normalizeTimelineEntry(node) {
  if (!node || !node.entry) {
    return null;
  }

  const entry = node.entry;
  let body = '';
  let isPublic = true;

  if (entry.chatText !== undefined) {
    // ChatEntry
    body = entry.chatText || '';
    isPublic = true;
  } else if (entry.noteText !== undefined || entry.markdown !== undefined) {
    // NoteEntry (internal)
    body = entry.noteText || entry.markdown || '';
    isPublic = false;
  } else if (entry.textContent !== undefined) {
    // EmailEntry
    body = entry.textContent || '';
    if (entry.subject) {
      body = `Subject: ${entry.subject}\n\n${body}`;
    }
    isPublic = true;
  } else if (entry.title !== undefined && entry.components) {
    // CustomEntry
    const textComponents = entry.components
      .filter(c => c.componentText)
      .map(c => c.componentText)
      .join('\n');
    body = `${entry.title}\n${textComponents}`;
    isPublic = false;
  } else {
    return null;
  }

  const author = extractActorInfo(node.actor);

  return {
    id: node.id,
    body,
    author: {
      name: author.name,
      email: author.email,
    },
    is_agent: author.isAgent,
    public: isPublic,
    created_at: node.timestamp?.iso8601 || null,
  };
}

function normalizeStatus(status) {
  if (!status) return 'open';
  const statusLower = status.toLowerCase();
  if (statusLower === 'done') {
    return 'solved';
  }
  if (statusLower === 'snoozed' || statusLower === 'waiting') {
    return 'pending';
  }
  return 'open';
}

function normalizePriority(priority) {
  if (priority === null || priority === undefined) return 'normal';
  switch (priority) {
    case 0: return 'urgent';
    case 1: return 'high';
    case 2: return 'normal';
    case 3: return 'low';
    default: return 'normal';
  }
}

export async function getPlainThread(threadId) {
  if (!threadId) {
    throw new Error('Thread ID is required');
  }

  console.log(`Fetching Plain thread: ${threadId}`);
  
  const data = await graphqlRequest(THREAD_QUERY, { threadId });

  const thread = data.thread;
  if (!thread) {
    throw new Error(`Thread not found: ${threadId}`);
  }

  const timelineEntries = thread.timelineEntries?.edges || [];
  const comments = timelineEntries
    .map(edge => normalizeTimelineEntry(edge.node))
    .filter(Boolean);

  console.log(`Found ${comments.length} timeline entries`);

  return {
    id: thread.id,
    ref: thread.ref,
    subject: thread.title || 'No subject',
    description: thread.description || thread.previewText || '',
    status: normalizeStatus(thread.status),
    priority: normalizePriority(thread.priority),
    created_at: thread.createdAt?.iso8601 || null,
    updated_at: thread.updatedAt?.iso8601 || null,
    customer: {
      id: thread.customer?.id || null,
      name: thread.customer?.fullName || thread.customer?.shortName || 'Unknown',
      email: thread.customer?.email?.email || null,
    },
    organization: null,
    comments,
  };
}
