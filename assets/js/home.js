/* Home page — renders the CV. Runs after MajdData.init() (see main.js). */
window.MajdPage = function () {
  'use strict';
  const data = MajdData.load();
  const $ = id => document.getElementById(id);
  const esc = MajdUI.escapeHtml.bind(MajdUI);

  const p = data.profile;
  $('heroName').textContent = p.name || '';
  $('heroTitle').textContent = p.title || '';
  $('sideName').textContent = p.name || '';
  $('dob').textContent = p.dob || '';
  $('pob').textContent = p.pob || '';
  $('nationality').textContent = p.nationality || '';
  $('phone').textContent = p.phone || '';
  $('motherTongue').textContent = p.motherTongue || '';

  const emailLink = $('emailLink');
  if (p.email) {
    emailLink.textContent = p.email;
    emailLink.href = 'mailto:' + p.email;
  }

  const img = $('profileImage');
  const initials = $('profileInitials');
  if (p.image) {
    img.src = p.image;
    img.style.display = 'block';
    initials.style.display = 'none';
  } else {
    initials.textContent = MajdUI.initials(p.name);
  }

  $('languagesList').innerHTML = (data.languages || []).map(l => `
    <div class="lang-block">
      <h4>${esc(l.name)}</h4>
      <div class="rows">
        ${l.listening ? `<span><strong>Listening</strong>${esc(l.listening)}</span>` : ''}
        ${l.spokenProd ? `<span><strong>Spoken prod.</strong>${esc(l.spokenProd)}</span>` : ''}
        ${l.reading ? `<span><strong>Reading</strong>${esc(l.reading)}</span>` : ''}
        ${l.spokenInter ? `<span><strong>Spoken inter.</strong>${esc(l.spokenInter)}</span>` : ''}
        ${l.writing ? `<span><strong>Writing</strong>${esc(l.writing)}</span>` : ''}
      </div>
    </div>
  `).join('');

  $('skillsList').innerHTML = (data.skills || []).map(s => `<span class="chip">${esc(s)}</span>`).join('');

  $('experienceList').innerHTML = (data.experience || []).map(e => `
    <div class="tl-item">
      <div class="tl-company">${esc(e.company)}${e.location ? ' · ' + esc(e.location) : ''}</div>
      <div class="tl-role">${esc(e.role)}</div>
      <div class="tl-period">${esc(e.period)}</div>
      <div class="tl-desc">${MajdUI.bulletList(e.description)}</div>
    </div>
  `).join('');

  $('educationList').innerHTML = (data.education || []).map(e => `
    <div class="tl-item">
      <div class="tl-period">${esc(e.period)}${e.location ? ' · ' + esc(e.location) : ''}</div>
      <div class="tl-role">${esc(e.title)}</div>
      <div class="tl-desc">${esc(e.institution)}</div>
    </div>
  `).join('');

  $('cvProjectsList').innerHTML = (data.cvProjects || []).map(p => `
    <div class="tl-item">
      <div class="tl-role">${esc(p.title)}</div>
      <div class="tl-desc">${esc(p.description)}</div>
    </div>
  `).join('');

  $('recommendationsList').innerHTML = (data.recommendations || []).map(r => `
    <div class="tl-item">
      <div class="tl-company">${esc(r.name)}</div>
      <div class="tl-role">${esc(r.role)}</div>
      <div class="tl-desc">${esc(r.description)}</div>
      <div class="tl-period">
        ${r.email ? `<span>Email: <a href="mailto:${esc(r.email)}">${esc(r.email)}</a></span>` : ''}
        ${r.phone ? `${r.email ? ' · ' : ''}<span>Phone: ${esc(r.phone)}</span>` : ''}
      </div>
    </div>
  `).join('');
};