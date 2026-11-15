import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { site } from './src/lib/site.js';

const uploadMaps = Boolean(process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_URL);
const originOf = (url) => (URL.canParse(url ?? '') ? [new URL(url).origin] : []);
const pulse = originOf(process.env.PUBLIC_PLAUSIBLE_SCRIPT);
const oops = originOf(process.env.PUBLIC_SENTRY_DSN);

export default defineConfig({
  site: site.url,
  trailingSlash: 'always',
  integrations: [svelte()],
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        ["connect-src 'self'", ...pulse, ...oops].join(' '),
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
      scriptDirective: { resources: ["'self'", ...pulse] },
    },
  },
  vite: {
    build: { assetsInlineLimit: 0, sourcemap: uploadMaps && 'hidden' },
    plugins: [
      uploadMaps &&
        sentryVitePlugin({
          telemetry: false,
          release: { create: false, finalize: false, setCommits: false, deploy: false },
          bundleSizeOptimizations: { excludeDebugStatements: true, excludeTracing: true },
          sourcemaps: { assets: './dist/**', filesToDeleteAfterUpload: './dist/**/*.map' },
        }),
    ],
  },
});
