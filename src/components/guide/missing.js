/** A reference upstream data no longer has: the build says so and the page carries on without it */
export const missing = (url, component, ref) =>
  console.warn(`[guides] ${url.pathname}: <${component}> points at "${ref}", which isn't in the list any more`);
