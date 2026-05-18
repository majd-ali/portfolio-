/* Projects page — list and modal. Runs after MajdData.init(). */
window.MajdPage = function () {
  'use strict';
  const data = MajdData.load();
  const $ = id => document.getElementById(id);
  const esc = MajdUI.escapeHtml.bind(MajdUI);

  const grid = $('projectsGrid');
  const empty = $('emptyProjects');
  const projects = (data.projects || []).slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  if (projects.length === 0) {
    empty.style.display = 'block';
  } else {
    grid.innerHTML = projects.map(p => `
      <div class="project-card" data-id="${esc(p.id)}">
        ${p.image
          ? `<div class="thumb" style="background-image:url('${esc(p.image)}')"></div>`
          : `<div class="thumb placeholder">No image</div>`}
        <div class="body">
          <h3>${esc(p.title)}</h3>
          ${p.tech ? `<p class="tech">${esc(p.tech)}</p>` : ''}
          <p class="desc">${esc((p.description || '').slice(0, 160))}${(p.description || '').length > 160 ? '…' : ''}</p>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('.project-card').forEach(c => {
      c.addEventListener('click', () => openProject(c.getAttribute('data-id')));
    });
  }

  const modal = $('projectModal');
  function openProject(id) {
    const p = projects.find(x => x.id === id);
    if (!p) return;
    $('pmTitle').textContent = p.title || '';
    $('pmTech').textContent = p.tech ? 'Tech: ' + p.tech : '';
    $('pmBody').innerHTML = MajdUI.paragraphs(p.description || '');
    const img = $('pmImage');
    if (p.image) { img.src = p.image; img.style.display = 'block'; }
    else { img.removeAttribute('src'); img.style.display = 'none'; }
    const linkWrap = $('pmLinkWrap');
    const link = $('pmLink');
    if (p.link) {
      link.href = p.link;
      linkWrap.style.display = 'block';
    } else {
      linkWrap.style.display = 'none';
    }
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  $('closeProject').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.style.display !== 'none') closeModal();
  });
};