/* Shared helpers + visitor sign-in UI used across all pages. */
(function () {
  'use strict';

  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  window.MajdUI = {
    initials(name) {
      if (!name) return '?';
      return name.split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0].toUpperCase()).join('');
    },
    escapeHtml(str) {
      if (str == null) return '';
      return String(str).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      })[c]);
    },
    paragraphs(text) {
      if (!text) return '';
      return text.split(/\n\s*\n/).map(p =>
        '<p>' + this.escapeHtml(p).replace(/\n/g, '<br>') + '</p>'
      ).join('');
    },
    bulletList(text) {
      if (!text) return '';
      const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length <= 1) return '<p>' + this.escapeHtml(lines[0] || '') + '</p>';
      return '<ul>' + lines.map(l => '<li>' + this.escapeHtml(l) + '</li>').join('') + '</ul>';
    },
    toast(message, type) {
      let el = document.getElementById('toast');
      if (!el) {
        el = document.createElement('div');
        el.id = 'toast';
        el.className = 'toast';
        document.body.appendChild(el);
      }
      el.textContent = message;
      el.className = 'toast' + (type ? ' ' + type : '');
      el.style.display = 'block';
      clearTimeout(el._t);
      el._t = setTimeout(() => { el.style.display = 'none'; }, 2800);
    },
    formatDate(ts) {
      if (!ts) return '';
      const d = new Date(ts);
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    },
    showLoading() {
      const main = document.querySelector('main') || document.body;
      let el = document.getElementById('majdLoading');
      if (!el) {
        el = document.createElement('div');
        el.id = 'majdLoading';
        el.style.cssText = 'text-align:center;padding:60px 24px;color:#8b94a8;font-size:0.95rem;';
        el.textContent = 'Loading…';
        main.prepend(el);
      }
    },
    hideLoading() {
      const el = document.getElementById('majdLoading');
      if (el) el.remove();
    },
    showError(message) {
      const main = document.querySelector('main') || document.body;
      let el = document.getElementById('majdError');
      if (!el) {
        el = document.createElement('div');
        el.id = 'majdError';
        el.className = 'empty-state';
        el.style.cssText = 'margin:24px;background:#fff7f8;border-color:rgba(220,53,69,.3);color:#dc3545;';
        main.prepend(el);
      }
      el.textContent = message;
    },
    openSignIn() { openVisitorModal(); }
  };

  // ------------------- Visitor sign-in modal -------------------
  function ensureVisitorModal() {
    if (document.getElementById('visitorModal')) return;
    const html = `
      <div id="visitorModal" class="modal-backdrop" style="display:none;">
        <div class="modal" style="max-width:420px;">
          <button class="modal-close" id="visitorClose">&times;</button>
          <h2 style="margin-bottom:6px;">Sign in</h2>
          <p class="muted small" id="visitorIntro">Enter your email and a username to react and comment. One account per email.</p>
          <form id="visitorForm" autocomplete="off">
            <label>Email</label>
            <input type="email" id="visitorEmail" placeholder="you@example.com" required />
            <label>Username</label>
            <input type="text" id="visitorName" placeholder="Display name" maxlength="40" required />
            <p id="visitorError" class="error" style="display:none;"></p>
            <button type="submit" class="btn primary" id="visitorSubmit" style="margin-top:14px;">Continue</button>
          </form>
        </div>
      </div>
    `;
    const wrap = document.createElement('div');
    wrap.innerHTML = html;
    document.body.appendChild(wrap.firstElementChild);

    const modal = document.getElementById('visitorModal');
    document.getElementById('visitorClose').addEventListener('click', closeVisitorModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeVisitorModal(); });

    document.getElementById('visitorForm').addEventListener('submit', async e => {
      e.preventDefault();
      const email = document.getElementById('visitorEmail').value;
      const name = document.getElementById('visitorName').value;
      const err = document.getElementById('visitorError');
      const submitBtn = document.getElementById('visitorSubmit');
      err.style.display = 'none';
      submitBtn.disabled = true;
      try {
        const user = await MajdData.signInVisitor(email, name);
        closeVisitorModal();
        MajdUI.toast('Welcome, ' + user.userName, 'success');
      } catch (e2) {
        err.textContent = e2.message || 'Sign in failed.';
        err.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  function openVisitorModal() {
    ensureVisitorModal();
    const modal = document.getElementById('visitorModal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('visitorEmail').focus(), 50);
  }
  function closeVisitorModal() {
    const modal = document.getElementById('visitorModal');
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = '';
    const err = document.getElementById('visitorError');
    if (err) err.style.display = 'none';
  }

  function renderNavUser(visitor) {
    const slot = document.getElementById('navUser');
    if (!slot) return;
    if (visitor) {
      slot.innerHTML = `
        <span class="nav-user-name" title="${MajdUI.escapeHtml(visitor.email)}">Hi, ${MajdUI.escapeHtml(visitor.userName)}</span>
        <button class="btn small ghost" id="navSignOut">Sign out</button>
      `;
      document.getElementById('navSignOut').addEventListener('click', () => {
        MajdData.signOutVisitor();
        MajdUI.toast('Signed out');
      });
    } else {
      slot.innerHTML = `<button class="btn small primary" id="navSignIn">Sign in</button>`;
      document.getElementById('navSignIn').addEventListener('click', openVisitorModal);
    }
  }

  // ------------------- Bootstrap -------------------
  MajdUI.showLoading();
  MajdData.init().then(() => {
    MajdUI.hideLoading();

    const data = MajdData.load();
    const profileName = data.profile && data.profile.name;
    if (profileName) {
      document.querySelectorAll('.brand').forEach(el => el.textContent = profileName);
      document.querySelectorAll('.footer-name').forEach(el => el.textContent = profileName);
    }

    MajdData.onVisitorChange(renderNavUser);

    if (typeof window.MajdPage === 'function') window.MajdPage();
  }).catch(err => {
    MajdUI.hideLoading();
    console.error(err);
    MajdUI.showError('Could not connect to backend. ' + (err.message || err));
  });
})();