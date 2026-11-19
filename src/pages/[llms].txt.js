import { getGuides } from '../lib/data/guides.js';
import { guideMarkdown } from '../lib/guide-markdown.js';
import { site } from '../lib/site.js';

export const getStaticPaths = () => (getGuides().length ? [{ params: { llms: 'llms-full' } }] : []);

export function GET() {
  const text = [`# ${site.name}: guides`, '', ...getGuides().map(guideMarkdown)].join('\n');
  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
