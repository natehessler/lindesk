import fetch from 'node-fetch';
import { getConfig } from '../config.js';

export async function analyzeTicket(ticket) {
    const { ampApiKey, ampEndpoint } = getConfig();

    if (!ampApiKey) {
        throw new Error('Amp API key is required. Please set it up with "lindesk setup"');
    }

    // Prepare the ticket data for analysis - include full conversation
    const fullConversation = buildFullConversation(ticket);
    const ticketContent = {
        id: ticket.id,
        subject: ticket.subject,
        description: fullConversation,
        organization: ticket.organization // Pass along the organization name
    };

    return await analyzeWithAmp(ticketContent, ampApiKey, ampEndpoint);
}

async function analyzeWithAmp(ticketContent, apiKey, endpoint) {
    try {
        // Use Amp CLI instead of HTTP API
        const { spawn } = await import('child_process');
        const { promisify } = await import('util');
        
        const prompt = `Analyze this complete Zendesk support ticket conversation and create a comprehensive technical summary for our engineering team. Pay special attention to any internal notes (marked as 'Internal Note') as they often contain important technical context from our support team. 

Please provide a very detailed, well-structured analysis that includes:
- Clear problem statement
- Detailed reproduction steps (numbered list)
- Technical investigation findings
- Environment details
- Impact assessment

Return only a JSON object with these fields:

{
  "title": "Clear, concise technical title for the Linear issue",
  "description": "Very detailed technical summary with proper formatting including:\n\n## Problem Summary\n[Brief overview]\n\n## Environment\n[Technical environment details]\n\n## Reproduction Steps\n1. Step one\n2. Step two\n3. Step three\n\n## Expected Behavior\n[What should happen]\n\n## Actual Behavior\n[What actually happens]\n\n## Impact\n[User/business impact]\n\n## Investigation Findings\n[Technical details discovered]\n\n## Internal Notes Summary\n[Summarize key points from internal notes]",
  "priority": "Low|Medium|High|Urgent",
  "complexity": 1-5,
  "components": ["TechnicalComponent1", "TechnicalComponent2"]
}

Take your time to analyze thoroughly. Ticket #${ticketContent.id}: ${ticketContent.subject}

${ticketContent.description}`;

        return new Promise((resolve, reject) => {
            const ampProcess = spawn('npx', ['@sourcegraph/amp'], {
                stdio: ['pipe', 'pipe', 'pipe'],
                env: {
                    ...process.env,
                    AMP_API_KEY: apiKey
                }
            });

            let output = '';
            let error = '';

            // Set a longer timeout for thorough analysis
            const timeout = setTimeout(() => {
                ampProcess.kill();
                reject(new Error('Amp analysis timed out after 5 minutes'));
            }, 300000); // 5 minutes

            ampProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            ampProcess.stderr.on('data', (data) => {
                error += data.toString();
            });

            ampProcess.on('close', (code) => {
                clearTimeout(timeout);
                if (code !== 0) {
                    reject(new Error(`Amp process exited with code ${code}: ${error}`));
                    return;
                }

                // Process Amp output
                
                try {
                    // Look for JSON content in the output - try multiple approaches
                    let jsonContent = null;
                    
                    // First, try to find JSON between curly braces
                    const jsonMatch = output.match(/\{[\s\S]*?\}/);
                    if (jsonMatch) {
                        try {
                            jsonContent = JSON.parse(jsonMatch[0]);
                        } catch (e) {
                            // Failed to parse JSON
                        }
                    }
                    
                    // If that didn't work, try to find JSON after any "Thinking" or analysis section
                    if (!jsonContent) {
                        const lines = output.split('\n');
                        let jsonStart = -1;
                        let jsonEnd = -1;
                        
                        for (let i = 0; i < lines.length; i++) {
                            const line = lines[i].trim();
                            if (line.startsWith('{') && jsonStart === -1) {
                                jsonStart = i;
                            }
                            if (line.endsWith('}') && jsonStart !== -1) {
                                jsonEnd = i;
                                break;
                            }
                        }
                        
                        if (jsonStart !== -1 && jsonEnd !== -1) {
                            const jsonLines = lines.slice(jsonStart, jsonEnd + 1);
                            try {
                                jsonContent = JSON.parse(jsonLines.join('\n'));
                            } catch (e) {
                                // Failed to parse JSON lines
                            }
                        }
                    }
                    
                    if (jsonContent) {
                        // Successfully parsed AI analysis
                        resolve(formatAmpResponse(jsonContent, ticketContent));
                    } else {
                        // Use the raw Amp output as the description
                        // No JSON found, using raw output
                        resolve({
                            title: ticketContent.subject,
                            description: output.trim(),
                            priority: 'Medium',
                            estimatedComplexity: 3,
                            components: ['General'],
                            originalSubject: ticketContent.subject,
                            ticket: ticketContent // Pass the original ticket data
                        });
                    }
                } catch (error) {
                    // Error processing output
                    reject(new Error(`Failed to process Amp response: ${error.message}`));
                }
            });

            ampProcess.on('error', (err) => {
                reject(new Error(`Failed to start Amp process: ${err.message}`));
            });

            // Send the prompt to Amp
            ampProcess.stdin.write(prompt);
            ampProcess.stdin.end();
        });
    } catch (error) {
        throw new Error(`Amp analysis failed: ${error.message}`);
    }
}

// Helper function to format Amp response into the expected Linear ticket format
function formatAmpResponse(response, ticketContent) {
    // Validate response has required fields
    if (!response) {
        throw new Error('Amp returned an empty response.');
    }

    return {
        title: response.title || ticketContent.subject, // Use AI-generated title or fallback to original
        description: response.description || 'No detailed analysis provided',
        priority: response.priority || 'Medium',
        estimatedComplexity: response.complexity || 3,
        components: Array.isArray(response.components) ? response.components : ['General'],
        originalSubject: ticketContent.subject,
        ticket: ticketContent // Pass the original ticket data for use in other services
    };
}

// Helper function to validate analysis data
function isValidAnalysis(data) {
    // Basic field validation
    if (!data ||
        !data.title ||
        typeof data.title !== 'string' ||
        data.title.length < 10 ||
        !data.description ||
        typeof data.description !== 'string' ||
        data.description.length < 100) {
        return false;
    }

    return true;
}

// Helper function to build full conversation from ticket and comments
function buildFullConversation(ticket) {
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
    if (hasInternalNotes) {
        conversation = `**ENGINEERING SUMMARY NEEDED - CONTAINS INTERNAL NOTES**\n\n${internalNotesSummary}\n${conversation}`;
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