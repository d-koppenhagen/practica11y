import { marked } from 'marked';

/**
 * Renders Markdown source to sanitized HTML.
 * Strips <script> tags, event handler attributes (on*), and javascript: URLs.
 */
export function renderMarkdown(source: string): string {
  const rawHtml = marked.parse(source, { async: false }) as string;
  return sanitizeHtml(rawHtml);
}

/**
 * Removes executable content from HTML:
 * - <script>...</script> tags
 * - on* event handler attributes (onclick, onerror, etc.)
 * - javascript: protocol in href/src attributes
 */
function sanitizeHtml(html: string): string {
  let result = html;
  // Remove script tags (including content)
  result = result.replace(/<script[\s\S]*?<\/script>/gi, '');
  result = result.replace(/<script[^>]*\/>/gi, '');
  // Remove event handler attributes
  result = result.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
  result = result.replace(/\s+on\w+\s*=\s*\S+/gi, '');
  // Remove javascript: protocol
  result = result.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href=""');
  result = result.replace(/src\s*=\s*["']javascript:[^"']*["']/gi, 'src=""');
  return result;
}
