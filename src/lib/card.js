// Social cards drawn at build time: satori lays the divs out as SVG, sharp makes the JPEG
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import satori from 'satori';
import sharp from 'sharp';

const SIZE = { width: 1200, height: 630 };
const PAD = 84;
const INNER = SIZE.width - 2 * PAD;
const ICON = 150;
const GAP = 48;

// the dark theme from tokens.css
const colour = {
  surface: '#0b0a0e',
  glow: '#251b45',
  text: '#ecebf1',
  muted: '#a8a4b4',
  faint: '#8a8698',
  accent: '#ad94fb',
  accentSoft: '#1c1630',
  plate: '#f1f0f5',
};

// satori falls back through these a glyph at a time, and Martian Mono has no Greek
const subsets = ['martian-mono/latin', 'martian-mono/latin-ext', 'martian-mono/cyrillic', 'jetbrains-mono/greek'];
const fonts = [400, 700].flatMap((weight) =>
  subsets.map((name) => {
    const [family, subset] = name.split('/');
    return {
      name,
      weight,
      data: readFileSync(resolve(`node_modules/@fontsource/${family}/files/${family}-${subset}-${weight}-normal.woff`)),
    };
  }),
);

const div = (style, ...children) => ({
  type: 'div',
  props: { style: { display: 'flex', ...style }, children: children.flat().filter(Boolean) },
});
const img = (src, size) => ({ type: 'img', props: { src, width: size, height: size } });

const svgUri = (svg) => `data:image/svg+xml,${encodeURIComponent(svg)}`;
const logo = svgUri(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M7.5 3H3v18h4.5M16.5 3H21v18h-4.5" fill="none" stroke="${colour.text}" stroke-width="3"/><path d="M12 12.1V6.5M12 12.1l5.33-1.73M12 12.1l3.29 4.53M12 12.1l-3.29 4.53M12 12.1l-5.33-1.73" fill="none" stroke="${colour.accent}" stroke-width="3"/></svg>`,
);

// satori can't read webp, so each icon goes in as a png, once
const pngs = new Map();
async function iconUri(path) {
  if (!pngs.has(path)) {
    const png = await sharp(resolve('public', path.slice(1))).png().toBuffer();
    pngs.set(path, `data:image/png;base64,${png.toString('base64')}`);
  }
  return pngs.get(path);
}

async function icon(service, size = ICON) {
  const plate = {
    width: size,
    height: size,
    flex: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: size * 0.18,
  };
  if (!service.iconPath) {
    const letters = service.name.replace(/[^\p{L}\p{N}]/gu, '').slice(0, 2).toLowerCase();
    return div(
      { ...plate, background: colour.accentSoft },
      div({ color: colour.accent, fontSize: size * 0.36, fontWeight: 700 }, letters),
    );
  }
  return div({ ...plate, background: colour.plate }, img(await iconUri(service.iconPath), Math.round(size * 0.76)));
}

/** Biggest size, up to `max`, that fits `text` on one line of `width` (Martian Mono's about 0.7em a character) */
const fit = (text, width, max) => Math.max(40, Math.min(max, Math.floor(width / (text.length * 0.7))));

const frame = (...content) =>
  div(
    {
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
      flexDirection: 'column',
      padding: PAD,
      background: `radial-gradient(circle at 100% 0%, ${colour.glow}, ${colour.surface} 65%)`,
      color: colour.text,
      fontFamily: subsets[0],
    },
    div(
      { alignItems: 'center', gap: 14, fontSize: 30, fontWeight: 700 },
      img(logo, 40),
      'awesome privacy',
      div({ color: colour.faint, fontWeight: 400 }, 'guide'),
    ),
    div({ flexGrow: 1, flexDirection: 'column', justifyContent: 'center', gap: 36 }, ...content),
  );

const draw = {
  home: () =>
    frame(
      div(
        { flexDirection: 'column', fontSize: 70, fontWeight: 700, lineHeight: 1.1 },
        div({ color: colour.accent }, 'private alternatives'),
        div({}, 'to the apps you use every day'),
      ),
    ),

  service: async (svc) =>
    frame(
      div(
        { alignItems: 'center', gap: GAP },
        await icon(svc),
        div(
          { width: INNER - ICON - GAP, flexDirection: 'column', gap: 18 },
          div({ fontSize: fit(svc.name, INNER - ICON - GAP, 84), fontWeight: 700, lineHeight: 1.1 }, svc.name),
          svc.host && div({ fontSize: 32, color: colour.muted }, svc.host),
        ),
      ),
    ),

  product: async (product) =>
    frame(
      div(
        {
          fontSize: fit(product.name, INNER, 96),
          fontWeight: 700,
          color: colour.faint,
          textDecoration: 'line-through',
          textDecorationColor: colour.accent,
        },
        product.name,
      ),
      div({ gap: 28 }, await Promise.all(product.services.slice(0, 6).map((svc) => icon(svc, 120)))),
    ),

  pair: async ({ a, b }) => {
    const side = async (svc) =>
      div(
        { flex: 1, flexDirection: 'column', alignItems: 'center', gap: 28 },
        await icon(svc),
        div({ fontSize: fit(svc.name, 430, 52), fontWeight: 700, textAlign: 'center' }, svc.name),
      );
    return frame(
      div(
        { alignItems: 'center' },
        await side(a),
        div({ fontSize: 44, color: colour.accent, fontWeight: 700 }, 'vs'),
        await side(b),
      ),
    );
  },

  guide: ({ versions: { en } }) =>
    frame(
      div({ width: INNER, fontSize: en.title.length > 48 ? 60 : 72, fontWeight: 700, lineHeight: 1.15 }, en.title),
      div({ fontSize: 30, color: colour.muted }, `${en.minutes} min read`),
    ),
};

/** One page's card as a JPEG */
export async function drawCard(page) {
  const svg = await satori(await draw[page.kind](page.entity), { ...SIZE, fonts });
  return sharp(Buffer.from(svg)).jpeg({ quality: 85 }).toBuffer();
}
