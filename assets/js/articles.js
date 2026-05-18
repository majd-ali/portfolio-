/* Articles page — list, modal, reactions, comments. Runs after MajdData.init(). */
window.MajdPage = function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const esc = MajdUI.escapeHtml.bind(MajdUI);

  function counts(a) {
    return {
      like: MajdData.countReactionsOfType(a.reactions, 'like'),
      dislike: MajdData.countReactionsOfType(a.reactions, 'dislike'),
      comments: (a.comments || []).length
    };
  }

  function render() {
    const data = MajdData.load();
    const grid = $('articlesGrid');
    const empty = $('emptyArticles');
    const articles = (data.articles || []).slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    if (articles.length === 0) {
      empty.style.display = 'block';
      grid.innerHTML = '';
      return;
    }
    empty.style.display = 'none';
    grid.innerHTML = articles.map(a => {
      const c = counts(a);
      return `
        <div class="article-card" data-id="${esc(a.id)}">
          ${a.image
            ? `<div class="thumb" style="background-image:url('${esc(a.image)}')"></div>`
            : `<div class="thumb placeholder">No image</div>`}
          <div class="body">
            <h3>${esc(a.title)}</h3>
            ${a.subtitle ? `<p class="subtitle">${esc(a.subtitle)}</p>` : '<p class="subtitle"></p>'}
            <div class="reactions-mini">
              <span>👍 ${c.like}</span>
              <span>👎 ${c.dislike}</span>
              <span>💬 ${c.comments}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.article-card').forEach(card => {
      card.addEventListener('click', () => openArticle(card.getAttribute('data-id')));
    });
  }

  function updateMiniCounts(a) {
    const cardEl = document.querySelector(`.article-card[data-id="${a.id}"] .reactions-mini`);
    if (!cardEl) return;
    const c = counts(a);
    cardEl.innerHTML = `<span>👍 ${c.like}</span><span>👎 ${c.dislike}</span><span>💬 ${c.comments}</span>`;
  }

  let openId = null;
  const modal = $('articleModal');

  function getArticle(id) {
    return (MajdData.load().articles || []).find(x => x.id === id);
  }

  function openArticle(id) {
    const a = getArticle(id);
    if (!a) return;
    openId = id;

    $('modalTitle').textContent = a.title;
    $('modalDate').textContent = a.createdAt ? 'Published ' + MajdUI.formatDate(a.createdAt) : '';
    const modalImg = $('modalImage');
    if (a.image) { modalImg.src = a.image; modalImg.style.display = 'block'; }
    else { modalImg.removeAttribute('src'); modalImg.style.display = 'none'; }
    $('modalBody').innerHTML = MajdUI.paragraphs(a.body || '');

    renderReactions(a);
    renderComments(a);
    refreshCommentForm();
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = '';
    openId = null;
  }

  $('closeArticle').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.style.display !== 'none') closeModal();
  });

  function renderReactions(a) {
    const c = counts(a);
    $('likeCount').textContent = c.like;
    $('dislikeCount').textContent = c.dislike;
    const userR = MajdData.getVisitorReaction(a.reactions);
    $('likeBtn').classList.toggle('active', userR === 'like');
    $('dislikeBtn').classList.toggle('active', userR === 'dislike');
  }

  async function react(type) {
    if (!openId) return;
    if (!MajdData.getVisitor()) {
      MajdUI.toast('Please sign in to react.');
      MajdUI.openSignIn();
      return;
    }
    const likeBtn = $('likeBtn'); const dislikeBtn = $('dislikeBtn');
    likeBtn.disabled = true; dislikeBtn.disabled = true;
    try {
      await MajdData.reactToArticle(openId, type);
      const fresh = getArticle(openId);
      if (fresh) { renderReactions(fresh); updateMiniCounts(fresh); }
    } catch (err) {
      MajdUI.toast(err.message || String(err), 'error');
    } finally {
      likeBtn.disabled = false; dislikeBtn.disabled = false;
    }
  }

  $('likeBtn').addEventListener('click', () => react('like'));
  $('dislikeBtn').addEventListener('click', () => react('dislike'));

  function renderComments(a) {
    const list = $('commentsList');
    const comments = (a.comments || []).slice().sort((x, y) => (y.createdAt || 0) - (x.createdAt || 0));
    if (comments.length === 0) {
      list.innerHTML = '<p class="muted small">No comments yet — be the first.</p>';
      return;
    }
    list.innerHTML = comments.map(c => {
      const author = c.userName || c.name || 'Anonymous';
      return `
        <div class="comment">
          <div>
            <span class="author">${esc(author)}</span>
            <span class="date">${MajdUI.formatDate(c.createdAt)}</span>
          </div>
          <p class="text">${esc(c.text)}</p>
        </div>
      `;
    }).join('');
  }

  function refreshCommentForm() {
    const v = MajdData.getVisitor();
    const note = $('commentAs');
    const textarea = $('commentText');
    const btn = $('commentSubmit');
    if (v) {
      note.innerHTML = `Commenting as <strong>${esc(v.userName)}</strong>`;
      textarea.disabled = false;
      btn.textContent = 'Post comment';
    } else {
      note.innerHTML = `<a href="#" id="signInPrompt">Sign in</a> to leave a comment.`;
      textarea.disabled = true;
      btn.textContent = 'Sign in to comment';
      const link = document.getElementById('signInPrompt');
      if (link) link.addEventListener('click', e => { e.preventDefault(); MajdUI.openSignIn(); });
    }
  }

  // Re-render the form whenever sign-in state changes.
  MajdData.onVisitorChange(() => {
    refreshCommentForm();
    if (openId) {
      const a = getArticle(openId);
      if (a) renderReactions(a);
    }
  });

  $('commentForm').addEventListener('submit', async e => {
    e.preventDefault();
    if (!openId) return;
    if (!MajdData.getVisitor()) {
      MajdUI.openSignIn();
      return;
    }
    const text = $('commentText').value.trim();
    if (!text) return;
    const submitBtn = $('commentSubmit');
    submitBtn.disabled = true;
    try {
      await MajdData.commentOnArticle(openId, text);
      $('commentText').value = '';
      const fresh = getArticle(openId);
      if (fresh) { renderComments(fresh); updateMiniCounts(fresh); }
    } catch (err) {
      MajdUI.toast(err.message || String(err), 'error');
    } finally {
      submitBtn.disabled = false;
    }
  });

  render();
};