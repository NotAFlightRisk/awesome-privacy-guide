import { pagesFor } from './routes.js';

const KINDS = new Set(['service', 'product', 'pair']);

/** Pages that get a social card of their own. Names and icons only, so one per page in every language */
export const cardPages = () => pagesFor('en').filter((page) => KINDS.has(page.kind));

let ids;
export const ogImage = (id) => {
  ids ??= new Set(cardPages().map((page) => page.id));
  return ids.has(id) ? `/og/${id}.png` : '/og.png';
};
