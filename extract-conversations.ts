#!/usr/bin/env npx tsx

/**
 * Extract conversation bodies from ChatGPT export JSON
 * Usage: npx tsx extract-conversations.ts [input.json] [output.md]
 */

import fs from 'fs';

interface Author {
  role: 'user' | 'assistant' | 'system' | 'tool';
  name: string | null;
  metadata: Record<string, unknown>;
}

interface MessageContent {
  content_type: string;
  parts: string[];
}

interface Message {
  id: string;
  author: Author;
  create_time: number | null;
  update_time: number | null;
  content: MessageContent;
  status: string;
  end_turn: boolean | null;
  weight: number;
  metadata: Record<string, unknown>;
  recipient: string;
  channel: string | null;
}

interface MappingNode {
  id: string;
  message: Message | null;
  parent: string | null;
  children: string[];
}

interface Conversation {
  title: string;
  create_time: number;
  update_time: number;
  mapping: Record<string, MappingNode>;
}

interface ExtractedMessage {
  role: string;
  content: string;
  create_time: number | null;
}

const inputFile = process.argv[2] || 'conversations.json';
const outputFile = process.argv[3] || 'conversations-extracted.md';

// Read the JSON file
const data: Conversation[] = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

/**
 * Walk the message tree to get messages in order
 */
function getMessagesInOrder(mapping: Record<string, MappingNode>): ExtractedMessage[] {
  const messages: ExtractedMessage[] = [];

  // Find the root node (no parent or parent is null)
  let rootId: string | null = null;
  for (const [id, node] of Object.entries(mapping)) {
    if (!node.parent) {
      rootId = id;
      break;
    }
  }

  if (!rootId) return messages;

  // BFS through the tree following children
  const queue: string[] = [rootId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const node = mapping[currentId];
    if (!node) continue;

    // Extract message if it exists and has content
    if (node.message && node.message.content) {
      const msg = node.message;
      const role = msg.author?.role || 'unknown';
      const parts = msg.content.parts || [];
      const text = parts.join('\n').trim();

      // Skip empty messages and hidden system messages
      const isHidden = msg.metadata?.is_visually_hidden_from_conversation as boolean;
      if (text && !isHidden) {
        messages.push({
          role,
          content: text,
          create_time: msg.create_time,
        });
      }
    }

    // Add children to queue (take first child for linear path)
    if (node.children && node.children.length > 0) {
      // Follow the first child path (main conversation thread)
      queue.push(node.children[0]);
    }
  }

  return messages;
}

/**
 * Format a single conversation
 */
function formatConversation(conv: Conversation, index: number): string {
  const lines: string[] = [];
  const title = conv.title || `Conversation ${index + 1}`;
  const date = conv.create_time
    ? new Date(conv.create_time * 1000).toISOString().split('T')[0]
    : 'Unknown date';

  lines.push(`# ${title}`);
  lines.push(`*Created: ${date}*`);
  lines.push('');
  lines.push('---');
  lines.push('');

  const messages = getMessagesInOrder(conv.mapping);

  for (const msg of messages) {
    const roleLabels: Record<string, string> = {
      user: '**User:**',
      assistant: '**Assistant:**',
      system: '**System:**',
      tool: '**Tool:**',
    };
    const roleLabel = roleLabels[msg.role] || `**${msg.role}:**`;

    // Skip tool messages (thinking/reasoning traces) for cleaner output
    if (msg.role === 'tool') continue;

    lines.push(roleLabel);
    lines.push('');
    lines.push(msg.content);
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}

// Process all conversations
const output: string[] = [];
output.push('# Extracted Conversations');
output.push('');
output.push(`*Extracted from ${inputFile} on ${new Date().toISOString().split('T')[0]}*`);
output.push('');
output.push('---');
output.push('');

for (let i = 0; i < data.length; i++) {
  output.push(formatConversation(data[i], i));
  output.push('\n---\n');
}

// Write output
fs.writeFileSync(outputFile, output.join('\n'), 'utf8');

console.log(`Extracted ${data.length} conversation(s) to ${outputFile}`);
console.log(`Total size: ${(fs.statSync(outputFile).size / 1024).toFixed(1)} KB`);
