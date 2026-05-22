/* ============================================================
   Canberra Modern — Front-end JavaScript
   Plain vanilla. No frameworks. Loaded with `defer`.
   1. Mobile menu toggle
   2. Combined filter state system (chips + toggle + search)
   3. Subscribe form feedback
   4. Contact form feedback
   5. "View Past Events" shortcut
   ============================================================ */

(function () {
  'use strict';

  /*  1. Mobile menu  */
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const menuClose  = document.querySelector('[data-menu-close]');
  const menu       = document.querySelector('[data-menu]');

  function setMenu(open) {
    if (!menu || !menuToggle) return;
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      const firstFocusable = menu.querySelector('a, button');
      if (firstFocusable) firstFocusable.focus();
    } else {
      menuToggle.focus();
    }
  }

  if (menuToggle && menu) {
    menuToggle.addEventListener('click', () => {
      const open = menu.getAttribute('aria-hidden') === 'true';
      setMenu(open);
    });
  }
  if (menuClose) menuClose.addEventListener('click', () => setMenu(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenu(false);
  });

  /*  2. Combined filter state system 
     Each card set (e.g. '.event-card', '.place-card') gets a shared state
     object so that category chips, upcoming/past toggle, and search all
     cooperate — none can overwrite a filter set by another control.
  ---- */
  const _state = {};

  function getState(sel) {
    return (_state[sel] = _state[sel] || { cat: 'all', toggle: null, query: '' });
  }

  function applyFilters(sel) {
    const s     = getState(sel);
    const empty = document.querySelector('[data-search-empty]');
    let   n     = 0;

    document.querySelectorAll(sel).forEach((el) => {
      const cats   = (el.dataset.cat || '').split(/\s+/);
      const catOk  = s.cat === 'all' || cats.includes(s.cat);
      const togOk  = s.toggle === null || el.dataset.state === s.toggle;
      const q      = s.query;
      const srchOk = !q || (el.textContent || '').toLowerCase().includes(q);
      const show   = catOk && togOk && srchOk;
      el.classList.toggle('is-hidden', !show);
      if (show) n++;
    });

    if (empty) empty.hidden = n > 0;
  }

  /* Filter chips (Events, Explore) and story tabs */
  document.querySelectorAll('[data-filter-group]').forEach((grp) => {
    const sel   = grp.dataset.filterTarget;
    if (!sel) return;
    const chips = grp.querySelectorAll('[data-filter]');

    /* Read initial pressed chip into shared state */
    const init = grp.querySelector('[aria-pressed="true"]');
    if (init) getState(sel).cat = init.dataset.filter;

    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        getState(sel).cat = chip.dataset.filter;
        chips.forEach((c) => c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'));
        applyFilters(sel);
      });
    });
  });

  /* Search (Explore) */
  document.querySelectorAll('[data-search-input]').forEach((inp) => {
    const sel = inp.dataset.searchTarget;
    if (!sel) return;
    inp.addEventListener('input', () => {
      getState(sel).query = inp.value.trim().toLowerCase();
      applyFilters(sel);
    });
  });

  /* Upcoming / Past toggle (Events hub) — shares state with chip filter */
  document.querySelectorAll('[data-toggle-group]').forEach((grp) => {
    const container = document.querySelector(grp.dataset.toggleTarget);
    if (!container) return;

    /* Find which chip-filter targets cards inside this container,
       so both controls share the same state key. */
    let cardSel = null;
    document.querySelectorAll('[data-filter-group]').forEach((fg) => {
      if (fg.dataset.filterTarget && container.querySelector(fg.dataset.filterTarget)) {
        cardSel = fg.dataset.filterTarget;
      }
    });
    if (!cardSel) return;

    const btns = grp.querySelectorAll('[data-toggle]');

    /* Initialise from the already-pressed button */
    const initBtn = grp.querySelector('[aria-pressed="true"]');
    if (initBtn) {
      getState(cardSel).toggle = initBtn.dataset.toggle;
      applyFilters(cardSel);
    }

    btns.forEach((btn) => {
      btn.addEventListener('click', () => {
        getState(cardSel).toggle = btn.dataset.toggle;
        btns.forEach((b) => b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'));
        applyFilters(cardSel);
      });
    });
  });

  /*  3. Subscribe form feedback  */
  document.querySelectorAll('[data-subscribe-form]').forEach((form) => {
    const feedback = form.querySelector('[data-form-feedback]');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = form.querySelector('input[type="email"]');
      const val   = email && email.value ? email.value.trim() : '';
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      if (!feedback) return;
      if (!valid) {
        feedback.dataset.state = 'error';
        feedback.textContent   = 'Please enter a valid email address.';
      } else {
        feedback.dataset.state = 'success';
        feedback.textContent   = 'Thanks — you are subscribed. Watch your inbox for the next dispatch.';
        form.reset();
      }
    });
  });

  /*  4. Contact form feedback  */
  document.querySelectorAll('[data-contact-form]').forEach((form) => {
    const feedback = form.querySelector('[data-form-feedback]');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!feedback) return;
      const nameInput  = form.querySelector('input[type="text"]');
      const emailInput = form.querySelector('input[type="email"]');
      const msgInput   = form.querySelector('textarea');
      const nameVal    = nameInput  ? nameInput.value.trim()  : '';
      const emailVal   = emailInput ? emailInput.value.trim() : '';
      const msgVal     = msgInput   ? msgInput.value.trim()   : '';
      const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
      if (!nameVal) {
        feedback.dataset.state = 'error';
        feedback.textContent   = 'Please enter your name.';
      } else if (!emailValid) {
        feedback.dataset.state = 'error';
        feedback.textContent   = 'Please enter a valid email address so we can reply.';
      } else if (!msgVal) {
        feedback.dataset.state = 'error';
        feedback.textContent   = 'Please add a message before sending.';
      } else {
        feedback.dataset.state = 'success';
        feedback.textContent   = 'Message received — we read everything and will be in touch shortly.';
        form.reset();
      }
    });
  });

  /*  5. "View Past Events" shortcut 
     Clicking [data-show-past] activates the Past toggle and scrolls to it.
  ---- */
  document.querySelectorAll('[data-show-past]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pastBtn = document.querySelector('[data-toggle="past"]');
      if (pastBtn) {
        pastBtn.click();
        const filterSection = document.querySelector('[data-toggle-group]')?.closest('section');
        if (filterSection) filterSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

})();
