export type Block = any; // Replace with a proper BlockNote type if available

// Very basic serializers; can be replaced with real BlockNote utils later
export function blocksToHtml(blocks: Block[] | object): string {
  try {
    // Placeholder: stringify for now; frontend renders real HTML
    return Array.isArray(blocks) || typeof blocks === 'object'
      ? `<pre>${escapeHtml(JSON.stringify(blocks, null, 2))}</pre>`
      : '';
  } catch {
    return '';
  }
}

export function blocksToPlainText(blocks: Block[] | object): string {
  try {
    if (Array.isArray(blocks)) {
      return JSON.stringify(blocks);
    }
    if (typeof blocks === 'object') {
      return JSON.stringify(blocks);
    }
    return '';
  } catch {
    return '';
  }
}

export function htmlToBlocks(html: string): Block[] | null {
  // Minimal fallback: cannot reliably parse; return null
  return null;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


