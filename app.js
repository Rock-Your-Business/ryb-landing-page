(() => {
  const menuButton = document.getElementById('menu-button');
  const mobileMenu = document.getElementById('mobile-menu');
  const year = document.getElementById('year');

  if (year) year.textContent = new Date().getFullYear();

  if (menuButton && mobileMenu) {
    menuButton.addEventListener('click', () => {
      const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!isOpen));
      menuButton.setAttribute('aria-label', isOpen ? 'Abrir menu' : 'Fechar menu');
      mobileMenu.classList.toggle('hidden');
    });

    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
        menuButton.setAttribute('aria-expanded', 'false');
        menuButton.setAttribute('aria-label', 'Abrir menu');
      });
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const targetId = anchor.getAttribute('href');
      if (!targetId || targetId === '#') return;
      const target = document.querySelector(targetId);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', targetId);
    });
  });

  document.querySelectorAll('[data-accordion]').forEach((accordion) => {
    const items = [...accordion.querySelectorAll('details')];
    items.forEach((item) => {
      item.addEventListener('toggle', () => {
        if (!item.open) return;
        items.forEach((other) => {
          if (other !== item) other.open = false;
        });
      });
    });
  });


  // Partner attribution for institutional links such as /hub4seg.
  // The app remains the source of truth: this page only validates the slug,
  // stores the canonical first-touch cookie and adds ?partner= as a CTA fallback.
  const PARTNER_COOKIE = 'ryb_partner_slug';
  const PARTNER_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
  const PARTNER_VALIDATE_URL = 'https://app.rockyourbusiness.com.br/api/public/partners/validate';
  const PARTNER_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  const readCookie = (name) => {
    const prefix = `${encodeURIComponent(name)}=`;
    const raw = document.cookie.split(';').map((item) => item.trim()).find((item) => item.startsWith(prefix));
    return raw ? decodeURIComponent(raw.slice(prefix.length)) : null;
  };

  const writePartnerCookie = (slug) => {
    const parts = [
      `${PARTNER_COOKIE}=${encodeURIComponent(slug)}`,
      'Path=/',
      `Max-Age=${PARTNER_COOKIE_MAX_AGE}`,
      'SameSite=Lax'
    ];

    if (location.protocol === 'https:') parts.push('Secure');
    if (location.hostname === 'rockyourbusiness.com.br' || location.hostname.endsWith('.rockyourbusiness.com.br')) {
      parts.push('Domain=.rockyourbusiness.com.br');
    }

    document.cookie = parts.join('; ');
  };

  const validStoredPartner = () => {
    const slug = readCookie(PARTNER_COOKIE);
    return slug && PARTNER_SLUG_RE.test(slug) ? slug : null;
  };

  const partnerSlugFromPath = () => {
    const path = location.pathname.replace(/^\/+|\/+$/g, '');
    if (!path || path.includes('/')) return null;
    return PARTNER_SLUG_RE.test(path) ? path : null;
  };

  const addPartnerToSignupLinks = (slug) => {
    if (!slug) return;
    document.querySelectorAll('a[href]').forEach((anchor) => {
      try {
        const url = new URL(anchor.href, location.href);
        if (url.hostname !== 'app.rockyourbusiness.com.br' || url.pathname !== '/signup') return;
        url.searchParams.set('partner', slug);
        anchor.href = url.toString();
      } catch (_) {
        // Ignore malformed/non-http links.
      }
    });
  };

  const showPartnerNotFound = () => {
    const originalPath = `${location.pathname}${location.search}${location.hash}`;
    const target = `/__partner-not-found__?path=${encodeURIComponent(originalPath)}`;
    location.replace(target);
  };

  const initialPartnerCandidate = partnerSlugFromPath();

  const initializePartnerAttribution = async () => {
    // A previously captured first-touch always wins.
    const existing = validStoredPartner();
    if (existing) addPartnerToSignupLinks(existing);

    if (!initialPartnerCandidate) {
      return { state: 'ready', slug: existing };
    }

    try {
      const endpoint = new URL(PARTNER_VALIDATE_URL);
      endpoint.searchParams.set('slug', initialPartnerCandidate);

      const response = await fetch(endpoint.toString(), {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) {
        // Fail closed for attribution, but keep the landing page usable on a
        // temporary validation outage.
        return { state: 'unavailable', slug: existing };
      }

      const data = await response.json();
      if (!data || data.valid !== true) {
        showPartnerNotFound();
        return { state: 'invalid', slug: null };
      }

      const canonical = existing || initialPartnerCandidate;
      if (!existing) writePartnerCookie(initialPartnerCandidate);
      addPartnerToSignupLinks(canonical);
      return { state: 'ready', slug: canonical };
    } catch (_) {
      // Network/5xx outage: do not create attribution and do not break the LP.
      return { state: 'unavailable', slug: existing };
    }
  };

  const partnerInitialization = initializePartnerAttribution();

  // On a partner alias, don't let a very fast click outrun slug validation.
  // Once validation settles, use the (possibly augmented) current href.
  if (initialPartnerCandidate) {
    document.addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!target) return;

      let url;
      try {
        url = new URL(target.href, location.href);
      } catch (_) {
        return;
      }

      if (url.hostname !== 'app.rockyourbusiness.com.br' || url.pathname !== '/signup') return;

      event.preventDefault();
      void partnerInitialization.then((result) => {
        if (result.state === 'invalid') return;
        location.href = target.href;
      });
    }, true);
  }

  if (window.lucide) window.lucide.createIcons();
})();
