/* Knowledge Base selector (section 03).

   A numbered list on the left drives a detail panel on the right. It advances
   on its own every 6s, and the rule under the active row is the progress bar —
   it fills over that interval, so the change is signalled before it happens
   rather than surprising the reader. Click or arrow keys select directly and
   restart the interval.

   Hovering the list pauses it: the panel changing mid-sentence while someone is
   reading is the main failure mode of an auto-advancing control.

   Under prefers-reduced-motion it does not advance or animate at all — the bar
   is drawn full width as a plain underline and selection is click-only.

   Rendered from a data array rather than markup so the list and the panel
   cannot drift apart. */
(function () {
  'use strict';

  var DURATION = 6000;
  var REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

  var ITEMS = [
    {
      title: 'Centralizes knowledge, with continuous sync',
      tags: ['Incremental sync', 'Change detection', 'Deletion propagation', 'Permission refresh', 'Entity resolution'],
      body: 'Scheduled and incremental sync across AFAS, Exact, DATEV, Personio, SharePoint, Drive, Slack and your file shares, with change detection, deletion propagation and permission refresh on every pass. Entities and typed edges are extracted as content lands and resolved into canonical nodes, so one customer is one node across all of them. The unit is the entity, not the chunk. No manual uploads, no stale context, no migration project.'
    },
    {
      title: 'Finds the complete answer, with proof',
      tags: ['Exhaustive scan', 'Multi-hop reasoning', 'Temporality', 'Provenance', 'Coverage reporting'],
      body: 'A subscription assistant fires one query and cannot tell you what it missed, because it has nothing to enumerate. This layer knows the boundary of its own corpus, so it can walk all of it, carry a complex question across multiple hops, and report what it has covered. Older versions are retained rather than overwritten, so an answer can be asked for as of any date. Every claim comes back pinned to the passage it came from.'
    },
    {
      title: 'Gives access to answers AND sources',
      tags: ['Ranked source set', 'Direct document access', 'Passage-level citations', 'Wiki pages', 'Editable in place'],
      body: 'Answers arrive with the ranked source set behind them and direct access to the documents themselves, which almost nothing on the market returns. What the system derives on top, the summaries, connections and conclusions, is written to a wiki: one page per customer, product, process or policy, every claim linked back to its source. Humans can browse it, search it, and even correct it in place. No embeddings-only store, no query language, no black box.'
    },
    {
      title: 'Maintains and optimizes knowledge',
      tags: ['Gap & contradiction detection', 'Graph inference', 'Draft & human approval', 'Write-back to your files', 'Org-level learning'],
      body: 'Continuous detection of gaps, contradictions and stale pages, each queued with the missing piece already drafted; a person approves, and it lands in the knowledge base and, where you want it, in your own canonical files. It learns from everyday communication too, deriving new knowledge across the graph rather than only retrieving what a vector store already holds. Those learnings are written to the organisation’s knowledge, never to a private per-user memory. Claude, ChatGPT and Copilot learn into a store no colleague can read; this one warms up for whoever asks next.'
    },
    {
      title: 'Makes no compromises to security & control',
      tags: ['Fact-level permissions', 'Permission propagation', 'Sensitivity tagging', 'Source-side rerouting', 'Retrieval logging', 'Full export'],
      body: 'Fact-level access control that propagates into everything derived from it: a summary carries the combined permissions of its sources, and revoking one document withdraws access to every answer built on it since. Sensitivity is tagged and rerouted at the source, so confidential content never reaches a model that should not see it. Your knowledge stays yours, with full export in open formats at any time. No lock-in, no vendor-held copy, no export project.'
    }
  ];

  var list = document.getElementById('kb-list');
  var detail = document.getElementById('kb-detail');
  var text = document.getElementById('kb-text');
  if (!list || !detail || !text) return;

  var active = 0;
  var buttons = [];
  var progress = null;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function pad(i) { return ('0' + (i + 1)).slice(-2); }

  ITEMS.forEach(function (item, i) {
    var btn = el('button', 'kb-item');
    btn.type = 'button';
    btn.id = 'kb-tab-' + i;
    btn.setAttribute('role', 'tab');
    btn.appendChild(el('span', 'kb-item__num', pad(i)));
    btn.appendChild(el('span', 'kb-item__title', item.title));
    btn.appendChild(el('span', 'kb-item__mark'));
    btn.appendChild(el('span', 'kb-item__bar'));

    btn.addEventListener('click', function () { select(i, false); });
    btn.addEventListener('keydown', onKeydown);

    buttons.push(btn);
    list.appendChild(btn);
  });

  detail.setAttribute('role', 'tabpanel');

  /* Reading should not be interrupted by the thing you are reading about. */
  list.addEventListener('mouseenter', function () { if (progress) progress.pause(); });
  list.addEventListener('mouseleave', function () { if (progress) progress.play(); });
  list.addEventListener('focusin', function () { if (progress) progress.pause(); });
  list.addEventListener('focusout', function () { if (progress) progress.play(); });

  function runProgress(btn) {
    if (progress) { progress.onfinish = null; progress.cancel(); progress = null; }
    var bar = btn.querySelector('.kb-item__bar');
    if (!bar || REDUCED) return;
    progress = bar.animate(
      [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }],
      { duration: DURATION, easing: 'linear', fill: 'forwards' }
    );
    progress.onfinish = function () { select((active + 1) % ITEMS.length, false); };
  }

  function onKeydown(e) {
    var delta = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1
              : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1
              : 0;
    if (!delta) return;
    e.preventDefault();
    select((active + delta + ITEMS.length) % ITEMS.length, true);
  }

  function select(i, moveFocus) {
    active = i;
    var item = ITEMS[i];

    buttons.forEach(function (b, n) {
      var on = n === i;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
    if (moveFocus) buttons[i].focus();
    runProgress(buttons[i]);

    detail.setAttribute('aria-labelledby', 'kb-tab-' + i);
    text.textContent = '';
    /* The reference repeats the title in the eyebrow, but its titles are one
       word. These are sentences, so the eyebrow carries the position only. */
    text.appendChild(el('span', 'eyebrow', pad(i) + ' / ' + pad(ITEMS.length - 1)));
    text.appendChild(el('h3', 'h3-fixed', item.title));

    var tags = el('div', 'chip-row kb-tags');
    item.tags.forEach(function (t) { tags.appendChild(el('span', 'chip-outline', t)); });
    text.appendChild(tags);

    text.appendChild(el('p', 'body', item.body));
  }

  select(0, false);
})();
