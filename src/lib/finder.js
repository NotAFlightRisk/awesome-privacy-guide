import { translator, ui } from './i18n.js';
import { links } from './routes.js';

/** Everything the Finder island needs from the page, already translated */
export function finderProps(lang) {
  const { t, tr } = translator(lang);
  const to = links(lang);
  return {
    index: to.searchIndex,
    action: to.page('search'),
    labels: {
      label: t('finder.label'),
      placeholder: t('finder.placeholder'),
      instead: t('finder.instead'),
      found: { one: t('finder.found', { count: 1 }), other: tr(ui['finder.found.other']) },
      none: t('finder.none'),
      kinds: {
        p: t('kind.product'),
        v: t('kind.service'),
        s: t('kind.section'),
        c: t('kind.category'),
        g: t('kind.term'),
      },
    },
  };
}
