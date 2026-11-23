import { Marked } from 'marked';

const safeUrl = (href) => /^(https?:|mailto:)/i.test(href ?? '');
const escape = (text) =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const marked = new Marked({
  gfm: true,
  renderer: {
    html: ({ text }) => (/^<br\s*\/?>$/i.test(text.trim()) ? '<br>' : escape(text)),
    link({ href, tokens }) {
      const text = this.parser.parseInline(tokens);
      return safeUrl(href) ? `<a href="${escape(href)}" rel="noopener">${text}</a>` : text;
    },
    image: ({ text }) => escape(text),
  },
});

/** Upstream markdown to HTML, with raw HTML (bar line breaks) and odd links defanged */
export const renderMarkdown = (markdown) => (markdown ? marked.parse(markdown.trim()) : '');

export const renderInline = (markdown) =>
  markdown ? marked.parseInline(markdown.trim().replace(/\s*\n\s*/g, ' ')) : '';

const entities = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", nbsp: ' ' };

/** Plain text off markdown or HTML, for meta descriptions and search */
export const plainText = (text) =>
  (text ?? '')
    .replace(/<\/?(?:a|b|code|del|em|i|span|strong)\b[^>]*>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`>]+|(?<!&)#+/g, '')
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_, name) => entities[name])
    .replace(/\s+/g, ' ')
    .trim();

/** Trims to whole words under `max` characters, for meta descriptions */
export function clip(text, max = 155) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const sentence = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('。'));
  if (sentence > max * 0.6) return cut.slice(0, sentence + 1);
  const space = cut.lastIndexOf(' ');
  return `${space > max * 0.6 ? cut.slice(0, space) : cut}...`;
}
