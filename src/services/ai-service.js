import fetch from 'node-fetch';
import { getConfig } from '../config.js';

export async function analyzeTicket(ticket, customPrompt = null) {
    const { sourcegraphUrl, sourcegraphToken } = getConfig();

    if (!sourcegraphUrl || !sourcegraphToken) {
        throw new Error('Sourcegraph configuration is required. Please set SOURCEGRAPH_URL and SOURCEGRAPH_TOKEN in settings');
    }

    // Prepare the ticket data for analysis - include full conversation
    const fullConversation = buildFullConversation(ticket, !!customPrompt);
    const ticketContent = {
        id: ticket.id,
        subject: ticket.subject,
        description: fullConversation,
        organization: ticket.organization // Pass along the organization name
    };

    return await analyzeWithDeepSearch(ticketContent, sourcegraphUrl, sourcegraphToken, customPrompt);
}

async function analyzeWithDeepSearch(ticketContent, sourcegraphUrl, sourcegraphToken, customPrompt = null) {
    try {
        // Construct the question for Deep Search
        const defaultPrompt = `Please assist with the below issue from a customer. Analyze this complete Plain support thread conversation and provide helpful, actionable guidance. Pay special attention to any internal notes (marked as 'Internal Note') as they contain valuable context.

You have access to the Sourcegraph codebase (github.com/sourcegraph/sourcegraph) and can research the issue thoroughly. Feel free to explore the codebase, look at relevant files, and provide comprehensive analysis based on your findings.

Please provide a natural, helpful response that:
- Clearly explains the issue and its context
- Provides actionable recommendations or solutions
- References specific code or documentation when relevant
- Suggests next steps for resolution

Thread #${ticketContent.id}: ${ticketContent.subject}

${ticketContent.description}`;

        // Use custom prompt if provided, otherwise use default
        const question = customPrompt ? 
            `${customPrompt}

For the following Plain thread, please provide your analysis:

Thread #${ticketContent.id}: ${ticketContent.subject}

${ticketContent.description}` : 
            defaultPrompt;

        // Create Deep Search conversation
        const conversation = await createDeepSearchConversation(sourcegraphUrl, sourcegraphToken, question);
        
        // Poll for completion
        const result = await pollDeepSearchConversation(sourcegraphUrl, sourcegraphToken, conversation.id);
        
        // Process the Deep Search response
        return formatDeepSearchResponse(result, ticketContent);
        
    } catch (error) {
        throw new Error(`Deep Search analysis failed: ${error.message}`);
    }
}

async function createDeepSearchConversation(sourcegraphUrl, sourcegraphToken, question) {
    const response = await fetch(`${sourcegraphUrl}/.api/deepsearch/v1`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `token ${sourcegraphToken}`,
            'X-Requested-With': 'lindesk 1.0.0'
        },
        body: JSON.stringify({ question })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create Deep Search conversation: ${response.status} ${error}`);
    }

    return await response.json();
}

async function pollDeepSearchConversation(sourcegraphUrl, sourcegraphToken, conversationId, maxAttempts = 120, delayMs = 5000) {
    console.log(`🔄 Polling Deep Search conversation ${conversationId} (max ${maxAttempts} attempts, ${delayMs}ms delay)`);
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        console.log(`📡 Polling attempt ${attempt + 1}/${maxAttempts}`);
        
        const response = await fetch(`${sourcegraphUrl}/.api/deepsearch/v1/${conversationId}`, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `token ${sourcegraphToken}`,
                'X-Requested-With': 'lindesk 1.0.0'
            }
        });

        if (!response.ok) {
            const error = await response.text();
            console.error(`❌ Polling failed: ${response.status} ${error}`);
            throw new Error(`Failed to poll Deep Search conversation: ${response.status} ${error}`);
        }

        const conversation = await response.json();
        const question = conversation.questions[0];
        
        console.log(`📊 Question status: ${question.status}`);
        
        if (question.status === 'completed') {
            console.log(`✅ Deep Search analysis completed successfully`);
            return conversation;
        } else if (question.status === 'failed') {
            console.error(`❌ Deep Search analysis failed`);
            throw new Error('Deep Search analysis failed');
        }
        
        console.log(`⏳ Still processing... waiting ${delayMs}ms before next poll`);
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    
    console.error(`⏰ Deep Search analysis timed out after ${maxAttempts} attempts`);
    throw new Error('Deep Search analysis timed out');
}

// Helper function to format Deep Search response into the expected Linear ticket format
function formatDeepSearchResponse(conversation, ticketContent) {
    const question = conversation.questions[0];
    
    if (!question || !question.answer) {
        throw new Error('Deep Search returned an empty response.');
    }

    // Format the Deep Search response naturally
    const cleanOutput = formatRawOutput(question.answer.trim());
    
    // Extract a title from the response or use the ticket subject
    let title = ticketContent.subject;
    const titleMatch = question.answer.match(/^#\s*(.+)$/m);
    if (titleMatch) {
        title = titleMatch[1].trim();
    }
    
    return {
        title: title,
        description: cleanOutput,
        priority: 'Medium', // Default priority since we're not parsing structured data
        estimatedComplexity: 3, // Default complexity
        components: ['General'], // Default component
        originalSubject: ticketContent.subject,
        ticket: ticketContent, // Pass the original ticket data for use in other services
        sources: question.sources || [],
        suggestedFollowups: question.suggested_followups || []
    };
}

// Helper function to format raw output for better presentation
function formatRawOutput(rawOutput) {
    // Minimal cleaning - preserve the original formatting and structure
    let formatted = rawOutput
        .replace(/^\s*Thinking[.]*\s*$/gm, '') // Remove "Thinking..." lines
        .replace(/^\s*Let me[^.]*\.\s*$/gm, '') // Remove "Let me..." lines
        .replace(/^\s*I'll[^.]*\.\s*$/gm, '') // Remove "I'll..." lines
        .replace(/\n{4,}/g, '\n\n\n') // Limit excessive consecutive newlines but preserve structure
        .trim();

    // No truncation - return the full response
    return formatted;
}

// Helper function to build full conversation from ticket and comments
function buildFullConversation(ticket, isCustomPrompt = false) {
    let conversation = `**Initial Description:**\n${cleanText(ticket.description)}\n\n`;
    
    // Track if we have any internal notes to highlight
    let hasInternalNotes = false;
    let internalNotesSummary = '**Internal Notes Summary:**\n';
    
    if (ticket.comments && ticket.comments.length > 0) {
        conversation += `**Conversation History:**\n\n`;
        
        ticket.comments.forEach((comment, index) => {
            // Skip the first comment if it's identical to the description (common in Zendesk)
            if (index === 0 && cleanText(comment.body) === cleanText(ticket.description)) {
                return;
            }
            
            const cleanedComment = cleanText(comment.body);
            if (cleanedComment.trim()) {
                // Highlight internal notes differently
                if (comment.internal_note) {
                    hasInternalNotes = true;
                    conversation += `**Internal Note ${index + 1}:**\n${cleanedComment}\n\n`;
                    internalNotesSummary += `- ${cleanedComment.substring(0, 150)}${cleanedComment.length > 150 ? '...' : ''}\n\n`;
                } else {
                    conversation += `**Comment ${index + 1}:**\n${cleanedComment}\n\n`;
                }
            }
        });
    }
    
    // Add the internal notes summary at the beginning for quick reference
    // Skip the analysis summary note if a custom prompt is provided
    if (hasInternalNotes && !isCustomPrompt) {
        conversation = `**DETAILED ANALYSIS NEEDED - CONTAINS INTERNAL NOTES**\n\n${internalNotesSummary}\n${conversation}`;
    }
    
    return conversation.trim();
}

// Helper function to clean text by removing email signatures, legal disclaimers, etc.
function cleanText(text) {
    if (!text) return '';

    // Common patterns to detect email signatures and legal disclaimers
    const signaturePatterns = [
        /This email and any files.+are confidential/i,
        /This email and any attachments.+intended only for/i,
        /\bconfidential\b.+\bprivileged\b/i,
        /Disclaimer:?[\s\S]*/i,
        /The information contained in this.+email is confidential/i,
        /This message\s+\(.+\)\s+contains confidential information/i,
        /The contents of this email are confidential/i,
        /NOTICE:.+This e-mail message is intended only for/i,
        /This communication is intended only for use/i,
        /This email is sent by a.+group entity/i,
        /The information contained in this email/i,
        /IMPORTANT NOTICE:.+This message is intended for/i,
        /Activity and use of our email system is monitored/i
    ];

    // Check for common signature delimiters
    const delimiterPatterns = [
        /^-{3,}$/m,             // Three or more hyphens
        /^_{3,}$/m,             // Three or more underscores
        /^\*{3,}$/m,            // Three or more asterisks
        /^[\s]*--[\s]*$/m,      // Double hyphen with optional spaces
        /^[\s]*\|[\s]*$/m,      // Vertical bar with optional spaces
        /^[\s]*\+[\s]*$/m,      // Plus sign with optional spaces
        /^[\s]*=[\s]*$/m,       // Equal sign with optional spaces
        /^[\s]*Best regards,/im,// Common email closing
        /^[\s]*Regards,/im,     // Common email closing
        /^[\s]*Thank you,/im,   // Common email closing
        /^[\s]*Thanks,/im,      // Common email closing
        /^[\s]*Cheers,/im,      // Common email closing
        /^[\s]*Sincerely,/im    // Common email closing
    ];

    // First, attempt to truncate at signature patterns
    for (const pattern of signaturePatterns) {
        const match = text.match(pattern);
        if (match && match.index) {
            text = text.substring(0, match.index).trim();
        }
    }

    // Next, attempt to truncate at common delimiters
    for (const pattern of delimiterPatterns) {
        const match = text.match(pattern);
        if (match && match.index > text.length / 2) { // Only consider delimiters in the second half of the text
            text = text.substring(0, match.index).trim();
        }
    }

    // Remove any lines that look like metadata or footers
    const lines = text.split('\n');
    const cleanedLines = lines.filter(line => {
        const trimmedLine = line.trim();
        // Skip lines that look like metadata or footers
        return !(
            /^sent from/i.test(trimmedLine) ||
            /^from:/i.test(trimmedLine) ||
            /^to:/i.test(trimmedLine) ||
            /^cc:/i.test(trimmedLine) ||
            /^bcc:/i.test(trimmedLine) ||
            /^subject:/i.test(trimmedLine) ||
            /^date:/i.test(trimmedLine) ||
            /^[\s]*\[cid:/i.test(trimmedLine) ||
            /^[\s]*\[image:/i.test(trimmedLine) ||
            /^registration no\./i.test(trimmedLine) ||
            /^registered in/i.test(trimmedLine) ||
            /^registered office/i.test(trimmedLine) ||
            /^\s*This is an automated/i.test(trimmedLine) ||
            /^On .+ wrote:$/i.test(trimmedLine) ||
            /^[<>\-_=]{3,}$/i.test(trimmedLine) // Common separators
        );
    });

    return cleanedLines.join('\n').trim();
}