<script>
  import { onMount } from 'svelte';
  import { track } from '../../scripts/plausible.js';

  let { slots, labels, credit } = $props();

  let picks = $state({});
  let copied = $state('');

  const chosen = $derived(
    slots
      .map((slot) => ({ slot, option: slot.options.find((option) => option.slug === picks[slot.key]) }))
      .filter(({ option }) => option),
  );

  onMount(() => {
    const saved = new URLSearchParams(location.hash.slice(1));
    picks = Object.fromEntries(slots.map((slot) => [slot.key, saved.get(slot.key) ?? '']));
  });

  function choose(slot, slug) {
    picks[slot] = slug;
    const hash = new URLSearchParams(Object.entries(picks).filter(([, value]) => value)).toString();
    history.replaceState(null, '', hash ? `#${hash}` : location.pathname);
  }

  const markdown = () =>
    [
      `## ${labels.mine}`,
      '',
      ...chosen.map(({ slot, option }) => `- ${slot.name}: [${option.name}](${option.site})`),
      '',
      `${credit} ${location.href}`,
    ].join('\n');

  async function copy(kind) {
    const text = kind === 'link' ? location.href : markdown();
    await navigator.clipboard.writeText(text);
    copied = kind;
    track('Stack', { action: kind });
    setTimeout(() => (copied = ''), 2000);
  }

  function download() {
    const data = chosen.map(({ slot, option }) => ({ need: slot.name, pick: option.name, url: option.site }));
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    link.download = 'privacy-stack.json';
    link.click();
    URL.revokeObjectURL(link.href);
    track('Stack', { action: 'json' });
  }
</script>

<div class="builder">
  <div class="slots">
    {#each slots as slot, i (slot.key)}
      <fieldset>
        <legend>
          <span class="number">{String(i + 1).padStart(2, '0')}</span>
          <a href={slot.url}>{slot.name}</a>
        </legend>
        <div class="options">
          {#each slot.options as option (option.slug)}
            <label class:on={picks[slot.key] === option.slug}>
              <input
                type="radio"
                name={slot.key}
                value={option.slug}
                checked={picks[slot.key] === option.slug}
                onchange={() => choose(slot.key, option.slug)}
              />
              {#if option.icon}<img src={option.icon} alt="" width="20" height="20" loading="lazy" />{/if}
              {option.name}
            </label>
          {/each}
          <label class="skip" class:on={!picks[slot.key]}>
            <input type="radio" name={slot.key} value="" checked={!picks[slot.key]} onchange={() => choose(slot.key, '')} />
            {labels.none}
          </label>
        </div>
      </fieldset>
    {/each}
  </div>

  <aside class="summary" aria-labelledby="summary">
    <h2 id="summary">{labels.mine}</h2>
    {#if chosen.length}
      <ol>
        {#each chosen as { slot, option } (slot.key)}
          <li><span>{slot.name}</span> <a href={option.url}>{option.name}</a></li>
        {/each}
      </ol>
      <div class="actions">
        <button type="button" onclick={() => copy('link')}>{copied === 'link' ? labels.copied : labels.share}</button>
        <button type="button" onclick={() => copy('markdown')}>{copied === 'markdown' ? labels.copied : labels.markdown}</button>
        <button type="button" onclick={download}>{labels.json}</button>
      </div>
    {:else}
      <p class="empty">{labels.empty}</p>
    {/if}
  </aside>
</div>

<style>
  .builder {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(16rem, 22rem);
    gap: var(--space-xl);
    align-items: start;
  }

  .slots {
    display: grid;
    gap: var(--space-lg);
  }

  fieldset {
    display: grid;
    gap: var(--space-sm);
    margin: 0;
    padding: var(--space-md) var(--space-lg) var(--space-lg);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
  }

  legend {
    display: flex;
    gap: var(--space-xs);
    padding-inline: var(--space-xs);
    font: 700 var(--text-md) var(--font-mono);
    text-transform: lowercase;

    & a {
      text-decoration: none;
    }
  }

  .number {
    color: var(--accent);
  }

  .options {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }

  label {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-2xs) var(--space-sm);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    font-size: var(--text-sm);
    cursor: pointer;

    &:hover {
      border-color: var(--border-strong);
    }

    &:has(:focus-visible) {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }

    &.on {
      border-color: var(--accent);
      background: var(--accent-soft);
      font-weight: 600;
    }

    & img {
      border-radius: var(--radius-sm);
      background: var(--icon-plate);
    }
  }

  input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .skip {
    color: var(--text-faint);
  }

  .summary {
    position: sticky;
    inset-block-start: 5rem;
    display: grid;
    gap: var(--space-md);
    padding: var(--space-lg);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    background: var(--surface-raised);

    & h2 {
      font-size: var(--text-md);
      text-transform: lowercase;
    }

    & ol {
      display: grid;
      gap: var(--space-xs);
      padding: 0;
      list-style: none;
    }

    & li {
      display: grid;
    }

    & li span {
      font: var(--text-xs) var(--font-mono);
      color: var(--text-faint);
    }

    & li a {
      font-weight: 600;
      text-decoration: none;
    }
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }

  button {
    padding: var(--space-xs) var(--space-sm);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius);
    background: none;
    color: var(--text);
    font: 600 var(--text-xs) var(--font-mono);
    cursor: pointer;

    &:hover {
      border-color: var(--accent);
      color: var(--accent);
    }
  }

  .empty {
    font-size: var(--text-sm);
    color: var(--text-muted);
  }

  @media (max-width: 56rem) {
    .builder {
      grid-template-columns: 1fr;
    }

    .summary {
      position: static;
      order: -1;
    }
  }
</style>
