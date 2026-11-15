import { drawCard } from '../lib/card.js';

export const GET = async () => new Response(await drawCard({ kind: 'home' }));
