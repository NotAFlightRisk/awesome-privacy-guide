const today = Math.floor(Date.now() / 864e5);

/** Below the top two picks of their topic, and still maintained */
export const lesserKnown = (services) =>
  services.filter((svc) => svc.position >= 2 && !svc.github?.archived);

/** Changes once a day, so a rebuild doesn't reshuffle it */
export function pickOfTheDay(services) {
  const pool = lesserKnown(services);
  return pool[today % pool.length];
}
