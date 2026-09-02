// home.js

const SECTORS = [
    { name: 'Roads', icon: 'directions_car' },
    { name: 'Electricity', icon: 'bolt' },
    { name: 'Water', icon: 'water_drop' },
    { name: 'Sanitation', icon: 'delete' },
    { name: 'Public Safety', icon: 'shield' },
    { name: 'Other', icon: 'apps' },
];

let allIssues = [];
let pinnedIds = new Set();
let activeCategory = '';
let activeSort = 'trending';

async function loadPinnedIds() {
    try {
        const pinned = await window.issueStore.getPinnedIssues();
        pinnedIds = new Set(pinned.map((p) => p.id));
    } catch (e) {
        pinnedIds = new Set();
    }
}

function renderSectorTiles() {
    const grid = document.getElementById('sector-grid');
    grid.innerHTML = SECTORS.map((sector) => {
        const count = allIssues.filter((i) => i.category === sector.name && i.status !== 'resolved').length;
        const isActive = activeCategory === sector.name;
        return `
        <button class="sector-tile ${isActive ? 'active' : ''}" data-category="${sector.name}">
          <span class="material-symbols-outlined sector-icon">${sector.icon}</span>
          <div>
            <h2 class="sector-title">${sector.name}</h2>
            <p class="sector-desc">${count} active issue${count === 1 ? '' : 's'}</p>
          </div>
        </button>`;
    }).join('');

    grid.querySelectorAll('.sector-tile').forEach((tile) => {
        tile.addEventListener('click', () => {
            const cat = tile.dataset.category;
            activeCategory = activeCategory === cat ? '' : cat;
            document.getElementById('category-select').value = activeCategory;
            refreshFeed();
        });
    });
}

function renderTrendingDefault() {
    document.getElementById('trending-title').textContent = 'Trending high-priority';
    document.getElementById('trending-stats').classList.add('hidden');

    const top = [...allIssues].sort((a, b) => b.upvote_count - a.upvote_count).slice(0, 6);
    renderTrendingCards(top);
}

function renderTrendingForCategory(category) {
    document.getElementById('trending-title').textContent = `${category}: status breakdown`;

    const inCategory = allIssues.filter((i) => i.category === category);
    const counts = { green: 0, yellow: 0, orange: 0, red: 0 };
    inCategory.forEach((i) => counts[window.dateHelpers.badgeLevel(i)]++);

    const statsEl = document.getElementById('trending-stats');
    statsEl.classList.remove('hidden');
    statsEl.innerHTML = `
      <span class="stat-pill">${counts.green} solved</span>
      <span class="stat-pill">${counts.yellow} recent</span>
      <span class="stat-pill">${counts.orange} moderate</span>
      <span class="stat-pill">${counts.red} neglected</span>`;

    const top = [...inCategory].sort((a, b) => b.upvote_count - a.upvote_count).slice(0, 6);
    renderTrendingCards(top);
}

function renderTrendingCards(issues) {
    const scroll = document.getElementById('trending-scroll');
    if (issues.length === 0) {
        scroll.innerHTML = '<p class="empty-state">No issues to show yet.</p>';
        return;
    }
    scroll.innerHTML = issues.map((issue) => {
        const level = window.dateHelpers.badgeLevel(issue);
        const badgeClass = level === 'green' ? 'solved' : level === 'red' ? 'error' : level === 'orange' ? 'warning' : 'moderate';
        const badgeText = level === 'green' ? 'Solved' : level === 'red' ? 'High priority' : level === 'orange' ? 'Moderate' : 'Recent';
        return `
        <div class="trending-card" data-id="${issue.id}">
          <div class="trending-img" style="${issue.photo_url ? `background-image:url('${issue.photo_url}')` : ''}"></div>
          <div class="trending-body">
            <div class="trending-meta">
              <span class="badge ${badgeClass}">${badgeText}</span>
              <span class="meta-text">${issue.category}</span>
            </div>
            <h4 class="trending-card-title">${escapeHtml(issue.title)}</h4>
            <p class="trending-card-desc">${issue.upvote_count} upvotes &middot; ${window.dateHelpers.daysOpen(issue.created_at)}d open</p>
          </div>
        </div>`;
    }).join('');

    scroll.querySelectorAll('.trending-card').forEach((card) => {
        card.addEventListener('click', () => {
            const id = card.dataset.id;
            const target = document.querySelector(`.issue-card[data-id="${id}"]`);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const commentsEl = target.querySelector('.comments-section');
                if (commentsEl) openComments(commentsEl, id);
            }
        });
    });
}

function renderFeed(issues) {
    const feed = document.getElementById('issue-feed');
    document.getElementById('results-count').textContent = `Showing ${issues.length} citizen report${issues.length === 1 ? '' : 's'}`;

    if (issues.length === 0) {
        feed.innerHTML = '<p class="empty-state">No issues match this filter yet. Be the first to report one.</p>';
        return;
    }

    feed.innerHTML = issues.map((issue) => {
        const level = window.dateHelpers.badgeLevel(issue);
        const isPinned = pinnedIds.has(issue.id);
        return `
        <div class="issue-card" data-id="${issue.id}">
          <div class="issue-header">
            <div class="avatar"><span class="material-symbols-outlined">person</span></div>
            <div class="author-info">
              <p class="author-name">Citizen report</p>
              <p class="author-meta">${window.dateHelpers.relativeTime(issue.created_at)}</p>
            </div>
          </div>
          <div class="issue-media">
            <div class="issue-img" style="${issue.photo_url ? `background-image:url('${issue.photo_url}')` : ''}">
              ${issue.photo_url ? '' : '<span class="material-symbols-outlined" style="font-size:2.5rem;">image</span>'}
            </div>
            ${window.statusBadge.renderStatusBadgeHTML(issue)}
          </div>
          <div class="issue-body">
            <div class="issue-category">${issue.category}</div>
            <h3 class="issue-title">${escapeHtml(issue.title)}</h3>
            <p class="issue-desc">${escapeHtml(issue.description || '')}</p>
            <div class="issue-actions">
              <div class="action-group">
                <button class="action-btn upvote-btn" data-id="${issue.id}">
                  <span class="material-symbols-outlined">thumb_up</span>
                  <span class="upvote-count">${issue.upvote_count}</span>
                </button>
                <button class="action-btn comment-toggle-btn" data-id="${issue.id}">
                  <span class="material-symbols-outlined">chat_bubble</span>
                  <span class="comment-count">&hellip;</span>
                </button>
                <button class="action-btn pin-btn ${isPinned ? 'pinned active' : ''}" data-id="${issue.id}">
                  <span class="material-symbols-outlined">${isPinned ? 'bookmark' : 'bookmark_border'}</span>
                </button>
              </div>
              <button class="action-btn" onclick="navigator.share ? navigator.share({title: '${escapeHtml(issue.title)}'}) : alert('Link copied (demo)')">
                <span class="material-symbols-outlined">share</span>
              </button>
            </div>
            <div class="comments-section" id="comments-${issue.id}">
              <div class="comments-inner">
                <p class="empty-state" style="padding:0.5rem 0;">Loading comments...</p>
              </div>
            </div>
          </div>
        </div>`;
    }).join('');

    wireFeedInteractions();
}

function wireFeedInteractions() {
    document.querySelectorAll('.upvote-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            window.requireLogin(async () => {
                const id = btn.dataset.id;
                const updated = await window.issueStore.upvote(id);
                btn.querySelector('.upvote-count').textContent = updated.upvote_count;
                btn.classList.add('active');
                const issue = allIssues.find((i) => i.id == id);
                if (issue) issue.upvote_count = updated.upvote_count;
            });
        });
    });

    document.querySelectorAll('.pin-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            window.requireLogin(async () => {
                const id = btn.dataset.id;
                const isPinned = pinnedIds.has(Number(id));
                if (isPinned) {
                    await window.issueStore.unpinIssue(id);
                    pinnedIds.delete(Number(id));
                } else {
                    await window.issueStore.pinIssue(id);
                    pinnedIds.add(Number(id));
                }
                btn.classList.toggle('pinned');
                btn.classList.toggle('active');
                btn.querySelector('.material-symbols-outlined').textContent = pinnedIds.has(Number(id)) ? 'bookmark' : 'bookmark_border';
            });
        });
    });

    document.querySelectorAll('.comment-toggle-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const section = document.getElementById(`comments-${id}`);
            openComments(section, id);
        });
    });
}

async function openComments(section, issueId) {
    const willOpen = !section.classList.contains('open');
    section.classList.toggle('open');
    if (!willOpen) return;

    if (section.dataset.loaded === 'true') return;
    section.dataset.loaded = 'true';

    try {
        const comments = await window.issueStore.getComments(issueId);
        const commentBtn = document.querySelector(`.comment-toggle-btn[data-id="${issueId}"] .comment-count`);
        if (commentBtn) commentBtn.textContent = comments.length;

        const inner = section.querySelector('.comments-inner');
        inner.innerHTML = (comments.length === 0
            ? '<p class="empty-state" style="padding:0.5rem 0;">No comments yet. Be the first.</p>'
            : comments.map((c) => `
              <div class="comment">
                <div class="comment-avatar"></div>
                <div class="comment-body">
                  <p class="comment-author">${escapeHtml(c.author_name)}
                    <span class="comment-time">${window.dateHelpers.relativeTime(c.created_at)}</span>
                    ${c.is_resolution_confirmation ? '<span class="official-badge">CONFIRMED FIX</span>' : ''}
                  </p>
                  <p class="comment-text">${escapeHtml(c.text)}</p>
                </div>
              </div>`).join('')
        ) + `
          <div>
            <div class="comment-input-area">
              <input class="comment-input" type="text" placeholder="Add a comment..." id="comment-input-${issueId}">
              <button class="send-btn" data-id="${issueId}"><span class="material-symbols-outlined">send</span></button>
            </div>
            <label class="confirm-resolved-row">
              <input type="checkbox" id="confirm-resolved-${issueId}"> This confirms the issue is resolved
            </label>
          </div>`;

        inner.querySelector('.send-btn').addEventListener('click', () => submitComment(issueId));
        inner.querySelector(`#comment-input-${issueId}`).addEventListener('keydown', (e) => {
            if (e.key === 'Enter') submitComment(issueId);
        });
    } catch (e) {
        section.querySelector('.comments-inner').innerHTML = '<p class="empty-state">Could not load comments.</p>';
    }
}

async function submitComment(issueId) {
    window.requireLogin(async () => {
        const input = document.getElementById(`comment-input-${issueId}`);
        const confirmBox = document.getElementById(`confirm-resolved-${issueId}`);
        const text = input.value.trim();
        if (!text) return;

        const user = window.auth.getUser();
        await window.issueStore.postComment(issueId, user.name, text, confirmBox.checked);
        if (confirmBox.checked) {
            await window.issueStore.markResolved(issueId);
        }
        // Force the comment thread to reload fresh, then re-run the whole
        // feed fetch so upvote/status/badge changes (e.g. now resolved) show up too.
        const section = document.getElementById(`comments-${issueId}`);
        if (section) section.dataset.loaded = 'false';
        await refreshFeed();
        const reopened = document.getElementById(`comments-${issueId}`);
        if (reopened) await openComments(reopened, issueId);
    });
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

async function refreshFeed() {
    document.getElementById('issue-feed').innerHTML = '<p class="empty-state">Loading issues...</p>';
    try {
        allIssues = await window.issueStore.getIssues({ category: activeCategory, sort: activeSort });
        await loadPinnedIds();
        renderSectorTiles();
        if (activeCategory) {
            renderTrendingForCategory(activeCategory);
        } else {
            renderTrendingDefault();
        }
        renderFeed(allIssues);
    } catch (e) {
        document.getElementById('issue-feed').innerHTML = `<p class="empty-state">Could not reach the backend. Is it running at localhost:4000?</p>`;
        document.getElementById('results-count').textContent = '';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('sort-select').addEventListener('change', (e) => {
        activeSort = e.target.value;
        refreshFeed();
    });
    document.getElementById('category-select').addEventListener('change', (e) => {
        activeCategory = e.target.value;
        refreshFeed();
    });
    refreshFeed();
});
