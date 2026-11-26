<script>
  import { onMount } from 'svelte';
  import { trackSearch } from '../../scripts/plausible.js';

  let { index, labels, action, big = false, fromUrl = false } = $props();

  const WEIGHT = { p: 6, d: 5, v: 4, s: 3, c: 2, g: 1 };
  const id = `finder-${Math.random().toString(36).slice(2, 8)}`;
  const normalise = (text) =>
    text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  let query = $state('');
  let items = $state();
  let list = $state();
  let pending;

  const load = () =>
    (pending ??= fetch(index)
      .then((res) => {
        if (!res.ok) throw new Error(`Search index said ${res.status}`);
        return res.json();
      })
      .then((data) => (items = data))
      .catch((error) => {
        pending = undefined;
        throw error;
      }));

  const score = (item, q) => {
    const base = item.s === q ? 100 : item.s.startsWith(q) ? 60 : item.s.includes(q) ? 40 : 0;
    const extra = !base && item.k?.includes(q) ? 15 : 0;
    return base || extra ? base + extra + WEIGHT[item.t] : 0;
  };

  const results = $derived.by(() => {
    const q = normalise(query);
    if (!q || !items) return [];
    return items
      .map((item) => ({ item, rank: score(item, q) }))
      .filter(({ rank }) => rank)
      .sort((a, b) => b.rank - a.rank || a.item.n.localeCompare(b.item.n))
      .slice(0, 8)
      .map(({ item }) => item);
  });

  onMount(() => {
    const asked = fromUrl && new URLSearchParams(location.search).get('q');
    if (asked) {
      query = asked;
      load();
    }
  });

  $effect(() => {
    const q = normalise(query);
    if (q && items) trackSearch(q, results.length > 0);
  });

  const links = () => [...(list?.querySelectorAll('a') ?? [])];

  function move(event) {
    const all = links();
    const at = all.indexOf(document.activeElement);
    const input = event.currentTarget.querySelector('input');
    if (event.key === 'ArrowDown' && all.length) {
      event.preventDefault();
      all[Math.min(at + 1, all.length - 1)].focus();
    } else if (event.key === 'ArrowUp' && at >= 0) {
      event.preventDefault();
      (at ? all[at - 1] : input).focus();
    } else if (event.key === 'Escape') {
      query = '';
      input.focus();
    }
  }

  function submit(event) {
    if (!results.length) return;
    event.preventDefault();
    location.href = results[0].u;
  }
</script>

<form class="finder" class:big role="search" {action} method="get" onsubmit={submit} onkeydown={move}>
  <label class="visually-hidden" for={id}>{labels.label}</label>
  <div class="field">
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
    <input
      {id}
      name="q"
      type="search"
      autocomplete="off"
      spellcheck="false"
      placeholder={labels.placeholder}
      aria-describedby={`${id}-status`}
      aria-controls={results.length ? `${id}-results` : undefined}
      bind:value={query}
      onfocus={load}
      oninput={load}
    />
  </div>
  <p id={`${id}-status`} class="visually-hidden" role="status">
    {normalise(query) && items
      ? results.length === 1 ? labels.found.one : labels.found.other.replace('{count}', results.length)
      : ''}
  </p>
  {#if results.length}
    <ul id={`${id}-results`} aria-label={labels.label} bind:this={list}>
      {#each results as item (item.u)}
        <li>
          <a href={item.u}>
            <span class="name">{item.t === 'p' ? labels.instead.replace('{name}', item.n) : item.n}</span>
            <span class="detail">{item.d}</span>
            <span class="kind">{labels.kinds[item.t]}</span>
          </a>
        </li>
      {/each}
    </ul>
  {:else if normalise(query) && items}
    <p class="none">{labels.none}</p>
  {/if}
</form>

<style>
  .finder {
    position: relative;
    width: 100%;
  }

  .field {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding-inline: var(--space-md);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-lg);
    background: var(--surface-raised);
    transition: border-color var(--quick) var(--ease);

    &:focus-within {
      border-color: var(--accent);
      outline: 2px solid color-mix(in srgb, var(--accent) 30%, transparent);
    }

    & svg {
      flex: none;
      fill: none;
      stroke: var(--text-faint);
      stroke-width: 2;
    }
  }

  input {
    flex: 1;
    min-width: 0;
    padding-block: var(--space-sm);
    border: 0;
    background: none;
    color: var(--text);
    font: inherit;
    outline: none;

    &::placeholder {
      color: var(--text-faint);
    }
  }

  .big input {
    padding-block: var(--space-md);
    font-size: var(--text-lg);
  }

  ul,
  .none {
    position: absolute;
    inset-inline: 0;
    inset-block-start: calc(100% + var(--space-2xs));
    z-index: 5;
    margin: 0;
    padding: var(--space-2xs);
    list-style: none;
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    background: var(--surface-raised);
    box-shadow: var(--shadow);
  }

  a {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0 var(--space-sm);
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius);
    text-decoration: none;

    &:hover,
    &:focus-visible {
      background: var(--accent-soft);
      color: var(--text);
    }
  }

  .name {
    font-weight: 600;
  }

  .detail {
    grid-row: 2;
    font-size: var(--text-xs);
    color: var(--text-muted);
  }

  .kind {
    grid-row: 1 / span 2;
    align-self: center;
    font: var(--text-xs) var(--font-mono);
    color: var(--text-faint);
  }

  .none {
    padding: var(--space-sm) var(--space-md);
    font-size: var(--text-sm);
    color: var(--text-muted);
  }
</style>
