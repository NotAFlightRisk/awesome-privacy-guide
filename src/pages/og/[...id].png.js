import { drawCard } from '../../lib/card.js';
import { cardPages } from '../../lib/og.js';

export const getStaticPaths = () => cardPages().map((page) => ({ params: { id: page.id }, props: { page } }));

export const GET = async ({ props }) => new Response(await drawCard(props.page));
