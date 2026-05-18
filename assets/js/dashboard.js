/* Admin dashboard — Firebase Auth + Firestore writes. Runs after MajdData.init(). */
window.MajdPage = function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const esc = MajdUI.escapeHtml.bind(MajdUI);
  const toast = MajdUI.toast.bind(MajdUI);

  let data = MajdData.load();

  const loginScreen = $('loginScreen');
  const dashScreen = $('dashboardScreen');

  function showDashboard() {
    loginScreen.style.display = 'none';
    dashScreen.style.display = 'grid';
    data = MajdData.load();
    renderAll();
  }
  function showLogin() {
    loginScreen.style.display = 'block';
    dashScreen.style.display = 'none';
  }

  MajdData.onAuthChange(isAdmin => {
    if (isAdmin) showDashboard(); else showLogin();
  });

  $('loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('loginEmail').value.trim();
    const password = $('loginPassword').value;
    const errEl = $('loginError');
    errEl.style.display = 'none';
    try {
      await MajdData.login(email, password);
      $('loginPassword').value = '';
    } catch (err) {
      let msg = err.message || 'Sign-in failed.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') msg = 'Wrong email or password.';
      else if (err.code === 'auth/user-not-found') msg = 'No user with that email.';
      else if (err.code === 'auth/too-many-requests') msg = 'Too many attempts. Try again later.';
      errEl.textContent = msg;
      errEl.style.display = 'block';
    }
  });

  $('logoutBtn').addEventListener('click', async () => {
    await MajdData.logout();
  });

  document.querySelectorAll('.dash-link').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      document.querySelectorAll('.dash-link').forEach(b => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.tab').forEach(t => {
        t.style.display = t.getAttribute('data-tab') === tab ? 'block' : 'none';
      });
    });
  });

  async function withBusy(btn, fn) {
    if (btn) { btn.disabled = true; }
    try {
      return await fn();
    } catch (err) {
      console.error(err);
      toast('Error: ' + (err.message || err), 'error');
      throw err;
    } finally {
      if (btn) { btn.disabled = false; }
    }
  }

  function renderAll() {
    data = MajdData.load();
    renderProfile();
    renderExperience();
    renderEducation();
    renderLanguages();
    renderSkills();
    renderCvProjects();
    renderRecommendations();
    renderArticles();
    renderProjects();
  }

  // ==================== PROFILE ====================
  function renderProfile() {
    const p = data.profile || {};
    $('fName').value = p.name || '';
    $('fTitle').value = p.title || '';
    $('fDob').value = p.dob || '';
    $('fPob').value = p.pob || '';
    $('fNationality').value = p.nationality || '';
    $('fEmail').value = p.email || '';
    $('fPhone').value = p.phone || '';
    $('fMother').value = p.motherTongue || '';

    const img = $('dashProfileImg');
    const initials = $('dashProfileInitials');
    if (p.image) {
      img.src = p.image; img.style.display = 'block';
      initials.style.display = 'none';
    } else {
      img.style.display = 'none';
      initials.style.display = 'block';
      initials.textContent = MajdUI.initials(p.name);
    }
  }

  $('saveProfileBtn').addEventListener('click', async e => {
    await withBusy(e.target, async () => {
      data.profile = {
        ...data.profile,
        name: $('fName').value.trim(),
        title: $('fTitle').value.trim(),
        dob: $('fDob').value.trim(),
        pob: $('fPob').value.trim(),
        nationality: $('fNationality').value.trim(),
        email: $('fEmail').value.trim(),
        phone: $('fPhone').value.trim(),
        motherTongue: $('fMother').value.trim()
      };
      await MajdData.saveSiteContent();
      toast('Profile saved', 'success');
      renderProfile();
    });
  });

  $('profileImageInput').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      toast('Uploading image…');
      const url = await MajdData.uploadImage(file, 'profile', 600, 0.9);
      data.profile.image = url;
      await MajdData.saveSiteContent();
      toast('Image uploaded', 'success');
      renderProfile();
    } catch (err) {
      toast('Upload failed: ' + (err.message || err), 'error');
    }
    e.target.value = '';
  });

  $('removeProfileImg').addEventListener('click', async e => {
    await withBusy(e.target, async () => {
      data.profile.image = null;
      await MajdData.saveSiteContent();
      toast('Image removed', 'success');
      renderProfile();
    });
  });

  // ==================== EXPERIENCE ====================
  let editingExpId = null;

  function renderExperience() {
    const list = data.experience || [];
    $('expList').innerHTML = list.map(e => `
      <div class="admin-item">
        <div class="info">
          <h4>${esc(e.role)} — ${esc(e.company)}</h4>
          <p>${esc(e.period)}${e.location ? ' · ' + esc(e.location) : ''}</p>
        </div>
        <div class="actions">
          <button class="btn small" data-edit="${esc(e.id)}">Edit</button>
          <button class="btn small danger" data-del="${esc(e.id)}">Delete</button>
        </div>
      </div>
    `).join('') || '<p class="muted small">No entries yet.</p>';

    $('expList').querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => editExp(b.getAttribute('data-edit'))));
    $('expList').querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
      if (!confirm('Delete this experience?')) return;
      await withBusy(b, async () => {
        data.experience = data.experience.filter(x => x.id !== b.getAttribute('data-del'));
        await MajdData.saveSiteContent();
        toast('Deleted', 'success');
        renderExperience();
      });
    }));
  }

  function clearExpForm() {
    editingExpId = null;
    ['expCompany','expLocation','expRole','expPeriod','expDescription'].forEach(i => $(i).value = '');
    $('addExpBtn').textContent = 'Add experience';
    $('cancelExpBtn').style.display = 'none';
  }

  function editExp(id) {
    const e = data.experience.find(x => x.id === id);
    if (!e) return;
    editingExpId = id;
    $('expCompany').value = e.company || '';
    $('expLocation').value = e.location || '';
    $('expRole').value = e.role || '';
    $('expPeriod').value = e.period || '';
    $('expDescription').value = e.description || '';
    $('addExpBtn').textContent = 'Update experience';
    $('cancelExpBtn').style.display = 'inline-block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  $('addExpBtn').addEventListener('click', async e => {
    const payload = {
      company: $('expCompany').value.trim(),
      location: $('expLocation').value.trim(),
      role: $('expRole').value.trim(),
      period: $('expPeriod').value.trim(),
      description: $('expDescription').value.trim()
    };
    if (!payload.company || !payload.role) { toast('Company and role are required', 'error'); return; }
    await withBusy(e.target, async () => {
      if (editingExpId) {
        const idx = data.experience.findIndex(x => x.id === editingExpId);
        data.experience[idx] = { ...data.experience[idx], ...payload };
      } else {
        data.experience.push({ id: MajdData.uid(), ...payload });
      }
      await MajdData.saveSiteContent();
      toast(editingExpId ? 'Updated' : 'Added', 'success');
      clearExpForm();
      renderExperience();
    });
  });
  $('cancelExpBtn').addEventListener('click', clearExpForm);

  // ==================== EDUCATION ====================
  let editingEduId = null;

  function renderEducation() {
    $('eduList').innerHTML = (data.education || []).map(e => `
      <div class="admin-item">
        <div class="info">
          <h4>${esc(e.title)}</h4>
          <p>${esc(e.institution)}${e.period ? ' · ' + esc(e.period) : ''}${e.location ? ' · ' + esc(e.location) : ''}</p>
        </div>
        <div class="actions">
          <button class="btn small" data-edit="${esc(e.id)}">Edit</button>
          <button class="btn small danger" data-del="${esc(e.id)}">Delete</button>
        </div>
      </div>
    `).join('') || '<p class="muted small">No entries yet.</p>';

    $('eduList').querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => {
      const e = data.education.find(x => x.id === b.getAttribute('data-edit'));
      if (!e) return;
      editingEduId = e.id;
      $('eduTitle').value = e.title || '';
      $('eduInstitution').value = e.institution || '';
      $('eduPeriod').value = e.period || '';
      $('eduLocation').value = e.location || '';
      $('addEduBtn').textContent = 'Update education';
      $('cancelEduBtn').style.display = 'inline-block';
    }));
    $('eduList').querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
      if (!confirm('Delete this entry?')) return;
      await withBusy(b, async () => {
        data.education = data.education.filter(x => x.id !== b.getAttribute('data-del'));
        await MajdData.saveSiteContent();
        renderEducation();
      });
    }));
  }

  function clearEduForm() {
    editingEduId = null;
    ['eduTitle','eduInstitution','eduPeriod','eduLocation'].forEach(i => $(i).value = '');
    $('addEduBtn').textContent = 'Add education';
    $('cancelEduBtn').style.display = 'none';
  }

  $('addEduBtn').addEventListener('click', async e => {
    const payload = {
      title: $('eduTitle').value.trim(),
      institution: $('eduInstitution').value.trim(),
      period: $('eduPeriod').value.trim(),
      location: $('eduLocation').value.trim()
    };
    if (!payload.title) { toast('Title required', 'error'); return; }
    await withBusy(e.target, async () => {
      if (editingEduId) {
        const idx = data.education.findIndex(x => x.id === editingEduId);
        data.education[idx] = { ...data.education[idx], ...payload };
      } else {
        data.education.push({ id: MajdData.uid(), ...payload });
      }
      await MajdData.saveSiteContent();
      toast('Saved', 'success');
      clearEduForm();
      renderEducation();
    });
  });
  $('cancelEduBtn').addEventListener('click', clearEduForm);

  // ==================== LANGUAGES ====================
  let editingLangId = null;

  function renderLanguages() {
    $('langList').innerHTML = (data.languages || []).map(l => `
      <div class="admin-item">
        <div class="info">
          <h4>${esc(l.name)}</h4>
          <p>L: ${esc(l.listening)} · SP: ${esc(l.spokenProd)} · R: ${esc(l.reading)} · SI: ${esc(l.spokenInter)} · W: ${esc(l.writing)}</p>
        </div>
        <div class="actions">
          <button class="btn small" data-edit="${esc(l.id)}">Edit</button>
          <button class="btn small danger" data-del="${esc(l.id)}">Delete</button>
        </div>
      </div>
    `).join('') || '<p class="muted small">No entries yet.</p>';

    $('langList').querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => {
      const l = data.languages.find(x => x.id === b.getAttribute('data-edit'));
      if (!l) return;
      editingLangId = l.id;
      $('langName').value = l.name || '';
      $('langListening').value = l.listening || '';
      $('langSpokenProd').value = l.spokenProd || '';
      $('langReading').value = l.reading || '';
      $('langSpokenInter').value = l.spokenInter || '';
      $('langWriting').value = l.writing || '';
      $('addLangBtn').textContent = 'Update language';
      $('cancelLangBtn').style.display = 'inline-block';
    }));
    $('langList').querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
      if (!confirm('Delete this language?')) return;
      await withBusy(b, async () => {
        data.languages = data.languages.filter(x => x.id !== b.getAttribute('data-del'));
        await MajdData.saveSiteContent();
        renderLanguages();
      });
    }));
  }

  function clearLangForm() {
    editingLangId = null;
    ['langName','langListening','langSpokenProd','langReading','langSpokenInter','langWriting'].forEach(i => $(i).value = '');
    $('addLangBtn').textContent = 'Add language';
    $('cancelLangBtn').style.display = 'none';
  }

  $('addLangBtn').addEventListener('click', async e => {
    const payload = {
      name: $('langName').value.trim(),
      listening: $('langListening').value.trim(),
      spokenProd: $('langSpokenProd').value.trim(),
      reading: $('langReading').value.trim(),
      spokenInter: $('langSpokenInter').value.trim(),
      writing: $('langWriting').value.trim()
    };
    if (!payload.name) { toast('Language name required', 'error'); return; }
    await withBusy(e.target, async () => {
      if (editingLangId) {
        const idx = data.languages.findIndex(x => x.id === editingLangId);
        data.languages[idx] = { ...data.languages[idx], ...payload };
      } else {
        data.languages.push({ id: MajdData.uid(), ...payload });
      }
      await MajdData.saveSiteContent();
      toast('Saved', 'success');
      clearLangForm();
      renderLanguages();
    });
  });
  $('cancelLangBtn').addEventListener('click', clearLangForm);

  // ==================== SKILLS ====================
  function renderSkills() {
    $('skillsTextarea').value = (data.skills || []).join(', ');
  }
  $('saveSkillsBtn').addEventListener('click', async e => {
    await withBusy(e.target, async () => {
      data.skills = $('skillsTextarea').value.split(',').map(s => s.trim()).filter(Boolean);
      await MajdData.saveSiteContent();
      toast('Skills saved', 'success');
    });
  });

  // ==================== CV PROJECTS ====================
  let editingCvpId = null;

  function renderCvProjects() {
    $('cvpList').innerHTML = (data.cvProjects || []).map(p => `
      <div class="admin-item">
        <div class="info">
          <h4>${esc(p.title)}</h4>
          <p>${esc((p.description || '').slice(0, 140))}${(p.description || '').length > 140 ? '…' : ''}</p>
        </div>
        <div class="actions">
          <button class="btn small" data-edit="${esc(p.id)}">Edit</button>
          <button class="btn small danger" data-del="${esc(p.id)}">Delete</button>
        </div>
      </div>
    `).join('') || '<p class="muted small">No entries yet.</p>';

    $('cvpList').querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => {
      const p = data.cvProjects.find(x => x.id === b.getAttribute('data-edit'));
      if (!p) return;
      editingCvpId = p.id;
      $('cvpTitle').value = p.title || '';
      $('cvpDescription').value = p.description || '';
      $('addCvpBtn').textContent = 'Update CV project';
      $('cancelCvpBtn').style.display = 'inline-block';
    }));
    $('cvpList').querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
      if (!confirm('Delete?')) return;
      await withBusy(b, async () => {
        data.cvProjects = data.cvProjects.filter(x => x.id !== b.getAttribute('data-del'));
        await MajdData.saveSiteContent();
        renderCvProjects();
      });
    }));
  }

  function clearCvpForm() {
    editingCvpId = null;
    $('cvpTitle').value = '';
    $('cvpDescription').value = '';
    $('addCvpBtn').textContent = 'Add CV project';
    $('cancelCvpBtn').style.display = 'none';
  }

  $('addCvpBtn').addEventListener('click', async e => {
    const payload = { title: $('cvpTitle').value.trim(), description: $('cvpDescription').value.trim() };
    if (!payload.title) { toast('Title required', 'error'); return; }
    await withBusy(e.target, async () => {
      if (editingCvpId) {
        const idx = data.cvProjects.findIndex(x => x.id === editingCvpId);
        data.cvProjects[idx] = { ...data.cvProjects[idx], ...payload };
      } else {
        data.cvProjects.push({ id: MajdData.uid(), ...payload });
      }
      await MajdData.saveSiteContent();
      toast('Saved', 'success');
      clearCvpForm();
      renderCvProjects();
    });
  });
  $('cancelCvpBtn').addEventListener('click', clearCvpForm);

  // ==================== RECOMMENDATIONS ====================
  let editingRecId = null;

  function renderRecommendations() {
    $('recList').innerHTML = (data.recommendations || []).map(r => `
      <div class="admin-item">
        <div class="info">
          <h4>${esc(r.name)}</h4>
          <p>${esc(r.role)}</p>
        </div>
        <div class="actions">
          <button class="btn small" data-edit="${esc(r.id)}">Edit</button>
          <button class="btn small danger" data-del="${esc(r.id)}">Delete</button>
        </div>
      </div>
    `).join('') || '<p class="muted small">No entries yet.</p>';

    $('recList').querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => {
      const r = data.recommendations.find(x => x.id === b.getAttribute('data-edit'));
      if (!r) return;
      editingRecId = r.id;
      $('recName').value = r.name || '';
      $('recRole').value = r.role || '';
      $('recEmail').value = r.email || '';
      $('recPhone').value = r.phone || '';
      $('recDesc').value = r.description || '';
      $('addRecBtn').textContent = 'Update recommendation';
      $('cancelRecBtn').style.display = 'inline-block';
    }));
    $('recList').querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
      if (!confirm('Delete?')) return;
      await withBusy(b, async () => {
        data.recommendations = data.recommendations.filter(x => x.id !== b.getAttribute('data-del'));
        await MajdData.saveSiteContent();
        renderRecommendations();
      });
    }));
  }

  function clearRecForm() {
    editingRecId = null;
    ['recName','recRole','recEmail','recPhone','recDesc'].forEach(i => $(i).value = '');
    $('addRecBtn').textContent = 'Add recommendation';
    $('cancelRecBtn').style.display = 'none';
  }

  $('addRecBtn').addEventListener('click', async e => {
    const payload = {
      name: $('recName').value.trim(),
      role: $('recRole').value.trim(),
      email: $('recEmail').value.trim(),
      phone: $('recPhone').value.trim(),
      description: $('recDesc').value.trim()
    };
    if (!payload.name) { toast('Name required', 'error'); return; }
    await withBusy(e.target, async () => {
      if (editingRecId) {
        const idx = data.recommendations.findIndex(x => x.id === editingRecId);
        data.recommendations[idx] = { ...data.recommendations[idx], ...payload };
      } else {
        data.recommendations.push({ id: MajdData.uid(), ...payload });
      }
      await MajdData.saveSiteContent();
      toast('Saved', 'success');
      clearRecForm();
      renderRecommendations();
    });
  });
  $('cancelRecBtn').addEventListener('click', clearRecForm);

  // ==================== ARTICLES ====================
  let editingArticleId = null;
  let articleImageUrl = null;
  let articleImageFile = null;

  function renderArticles() {
    const list = (data.articles || []).slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    $('articlesAdminList').innerHTML = list.map(a => `
      <div class="admin-item">
        <div class="info">
          <h4>${esc(a.title)}</h4>
          <p>${a.subtitle ? esc(a.subtitle) + ' · ' : ''}👍 ${(a.reactions && a.reactions.like) || 0} · 👎 ${(a.reactions && a.reactions.dislike) || 0} · 💬 ${(a.comments || []).length}</p>
          ${a.image ? `<img class="thumb-mini" src="${a.image}" alt="">` : ''}
        </div>
        <div class="actions">
          <button class="btn small" data-edit="${esc(a.id)}">Edit</button>
          <button class="btn small danger" data-del="${esc(a.id)}">Delete</button>
        </div>
      </div>
    `).join('') || '<p class="muted small">No articles yet.</p>';

    $('articlesAdminList').querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => editArticle(b.getAttribute('data-edit'))));
    $('articlesAdminList').querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
      if (!confirm('Delete this article? Comments and reactions will be lost.')) return;
      await withBusy(b, async () => {
        await MajdData.deleteArticle(b.getAttribute('data-del'));
        data = MajdData.load();
        toast('Deleted', 'success');
        renderArticles();
      });
    }));
  }

  function clearArticleForm() {
    editingArticleId = null;
    articleImageUrl = null;
    articleImageFile = null;
    $('artTitle').value = '';
    $('artSubtitle').value = '';
    $('artBody').value = '';
    $('artImageInput').value = '';
    $('artImagePreview').style.display = 'none';
    $('artImagePreview').removeAttribute('src');
    $('saveArticleBtn').textContent = 'Publish article';
    $('cancelArticleBtn').style.display = 'none';
  }

  function editArticle(id) {
    const a = data.articles.find(x => x.id === id);
    if (!a) return;
    editingArticleId = id;
    articleImageUrl = a.image || null;
    articleImageFile = null;
    $('artTitle').value = a.title || '';
    $('artSubtitle').value = a.subtitle || '';
    $('artBody').value = a.body || '';
    if (a.image) {
      $('artImagePreview').src = a.image;
      $('artImagePreview').style.display = 'block';
    } else {
      $('artImagePreview').style.display = 'none';
    }
    $('saveArticleBtn').textContent = 'Update article';
    $('cancelArticleBtn').style.display = 'inline-block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  $('artImageInput').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    articleImageFile = file;
    const reader = new FileReader();
    reader.onload = ev => {
      $('artImagePreview').src = ev.target.result;
      $('artImagePreview').style.display = 'block';
    };
    reader.readAsDataURL(file);
  });

  $('saveArticleBtn').addEventListener('click', async e => {
    const title = $('artTitle').value.trim();
    const subtitle = $('artSubtitle').value.trim();
    const body = $('artBody').value.trim();
    if (!title || !body) { toast('Title and body are required', 'error'); return; }

    await withBusy(e.target, async () => {
      if (articleImageFile) {
        toast('Uploading image…');
        articleImageUrl = await MajdData.uploadImage(articleImageFile, 'articles', 1400, 0.82);
      }
      const existing = editingArticleId ? data.articles.find(a => a.id === editingArticleId) : null;
      const article = {
        id: editingArticleId || undefined,
        title, subtitle, body,
        image: articleImageUrl,
        createdAt: existing ? existing.createdAt : Date.now(),
        reactions: existing ? existing.reactions : { like: 0, dislike: 0 },
        comments: existing ? existing.comments : []
      };
      await MajdData.saveArticle(article);
      data = MajdData.load();
      toast(editingArticleId ? 'Updated' : 'Published', 'success');
      clearArticleForm();
      renderArticles();
    });
  });

  $('cancelArticleBtn').addEventListener('click', clearArticleForm);

  // ==================== PORTFOLIO PROJECTS ====================
  let editingProjectId = null;
  let projectImageUrl = null;
  let projectImageFile = null;

  function renderProjects() {
    const list = (data.projects || []).slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    $('projectsAdminList').innerHTML = list.map(p => `
      <div class="admin-item">
        <div class="info">
          <h4>${esc(p.title)}</h4>
          <p>${p.tech ? esc(p.tech) : ''}</p>
          ${p.image ? `<img class="thumb-mini" src="${p.image}" alt="">` : ''}
        </div>
        <div class="actions">
          <button class="btn small" data-edit="${esc(p.id)}">Edit</button>
          <button class="btn small danger" data-del="${esc(p.id)}">Delete</button>
        </div>
      </div>
    `).join('') || '<p class="muted small">No projects yet.</p>';

    $('projectsAdminList').querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => editProject(b.getAttribute('data-edit'))));
    $('projectsAdminList').querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
      if (!confirm('Delete this project?')) return;
      await withBusy(b, async () => {
        await MajdData.deleteProject(b.getAttribute('data-del'));
        data = MajdData.load();
        toast('Deleted', 'success');
        renderProjects();
      });
    }));
  }

  function clearProjectForm() {
    editingProjectId = null;
    projectImageUrl = null;
    projectImageFile = null;
    $('projTitle').value = '';
    $('projTech').value = '';
    $('projLink').value = '';
    $('projDescription').value = '';
    $('projImageInput').value = '';
    $('projImagePreview').style.display = 'none';
    $('projImagePreview').removeAttribute('src');
    $('saveProjectBtn').textContent = 'Save project';
    $('cancelProjectBtn').style.display = 'none';
  }

  function editProject(id) {
    const p = data.projects.find(x => x.id === id);
    if (!p) return;
    editingProjectId = id;
    projectImageUrl = p.image || null;
    projectImageFile = null;
    $('projTitle').value = p.title || '';
    $('projTech').value = p.tech || '';
    $('projLink').value = p.link || '';
    $('projDescription').value = p.description || '';
    if (p.image) {
      $('projImagePreview').src = p.image;
      $('projImagePreview').style.display = 'block';
    } else {
      $('projImagePreview').style.display = 'none';
    }
    $('saveProjectBtn').textContent = 'Update project';
    $('cancelProjectBtn').style.display = 'inline-block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  $('projImageInput').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    projectImageFile = file;
    const reader = new FileReader();
    reader.onload = ev => {
      $('projImagePreview').src = ev.target.result;
      $('projImagePreview').style.display = 'block';
    };
    reader.readAsDataURL(file);
  });

  $('saveProjectBtn').addEventListener('click', async e => {
    const title = $('projTitle').value.trim();
    const tech = $('projTech').value.trim();
    const link = $('projLink').value.trim();
    const description = $('projDescription').value.trim();
    if (!title) { toast('Title required', 'error'); return; }

    await withBusy(e.target, async () => {
      if (projectImageFile) {
        toast('Uploading image…');
        projectImageUrl = await MajdData.uploadImage(projectImageFile, 'projects', 1400, 0.82);
      }
      const existing = editingProjectId ? data.projects.find(p => p.id === editingProjectId) : null;
      const project = {
        id: editingProjectId || undefined,
        title, tech, link, description,
        image: projectImageUrl,
        createdAt: existing ? existing.createdAt : Date.now()
      };
      await MajdData.saveProject(project);
      data = MajdData.load();
      toast(editingProjectId ? 'Updated' : 'Saved', 'success');
      clearProjectForm();
      renderProjects();
    });
  });

  $('cancelProjectBtn').addEventListener('click', clearProjectForm);

  // ==================== SETTINGS ====================
  $('changePasswordBtn').addEventListener('click', async e => {
    const newP = $('newPassword').value;
    if (!newP || newP.length < 6) {
      $('pwdMsg').textContent = 'Firebase requires at least 6 characters.';
      return;
    }
    await withBusy(e.target, async () => {
      try {
        await MajdData.changePassword(newP);
        $('newPassword').value = '';
        $('pwdMsg').textContent = 'Password updated.';
        toast('Password updated', 'success');
      } catch (err) {
        $('pwdMsg').textContent = err.message;
        if (err.code === 'auth/requires-recent-login') {
          $('pwdMsg').textContent = 'Please log out and sign in again before changing your password.';
        }
      }
    });
  });

  $('exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'portfolio-backup-' + new Date().toISOString().slice(0,10) + '.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('Exported', 'success');
  });

  $('importInput').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || typeof parsed !== 'object') throw new Error('Invalid JSON');
        if (!confirm('Replace all current content with this backup?')) return;
        toast('Importing… this may take a moment.');
        await MajdData.importData(parsed);
        data = MajdData.load();
        toast('Imported', 'success');
        renderAll();
      } catch (err) {
        toast('Import failed: ' + (err.message || err), 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  $('seedBtn').addEventListener('click', async e => {
    if (!confirm('Publish the default CV content to your Firebase project?')) return;
    await withBusy(e.target, async () => {
      await MajdData.seedDefaults();
      data = MajdData.load();
      toast('Default CV published', 'success');
      renderAll();
    });
  });

  $('resetBtn').addEventListener('click', async e => {
    if (!confirm('Reset CV content (profile, experience, education, etc.) to defaults? Articles and projects will be kept.')) return;
    await withBusy(e.target, async () => {
      const defaults = MajdData.DEFAULTS;
      data.profile = JSON.parse(JSON.stringify(defaults.profile));
      data.experience = JSON.parse(JSON.stringify(defaults.experience));
      data.education = JSON.parse(JSON.stringify(defaults.education));
      data.languages = JSON.parse(JSON.stringify(defaults.languages));
      data.skills = defaults.skills.slice();
      data.cvProjects = JSON.parse(JSON.stringify(defaults.cvProjects));
      data.recommendations = JSON.parse(JSON.stringify(defaults.recommendations));
      await MajdData.saveSiteContent();
      toast('Reset complete', 'success');
      renderAll();
    });
  });
};