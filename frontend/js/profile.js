// profile.js

let savedIssues = [];
let expandedId = null;

function renderAuthState() {
    const loggedIn = window.auth.isLoggedIn();
    document.getElementById('logged-out-view').classList.toggle('hidden', loggedIn);
    document.getElementById('login-form-section').classList.add('hidden');
    document.getElementById('logged-in-view').classList.toggle('hidden', !loggedIn);
    document.getElementById('saved-issues-section').classList.toggle('hidden', !loggedIn);

    if (loggedIn) {
        const user = window.auth.getUser();
        document.getElementById('profile-name').textContent = user.name;
        document.getElementById('profile-email').textContent = user.email;
        loadSavedIssues();
    }
}

async function loadSavedIssues() {
    const grid = document.getElementById('saved-issues-grid');
    grid.innerHTML = '<p class="empty-state">Loading saved issues...</p>';
    try {
        savedIssues = await window.issueStore.getPinnedIssues();
        document.getElementById('stat-saved').textContent = savedIssues.length;
        document.getElementById('stat-posted').textContent = '-';
        renderSavedGrid();
    } catch (e) {
        grid.innerHTML = '<p class="empty-state">Could not reach the backend.</p>';
    }
}

function renderSavedGrid() {
    const grid = document.getElementById('saved-issues-grid');
    if (savedIssues.length === 0) {
        grid.innerHTML = '<p class="empty-state">No saved issues yet. Pin issues from the home feed to see them here.</p>';
        return;
    }

    grid.innerHTML = savedIssues.map((issue) => {
        const info = window.statusBadge.getBadgeInfo(issue);
        const isExpanded = expandedId === issue.id;
        const badgeLabel = info.level === 'green' ? 'Solved'
            : info.level === 'red' ? 'Neglected'
            : info.level === 'orange' ? 'Moderate' : 'Recent';

        if (isExpanded) {
            return `
            <div class="saved-card expanded" data-id="${issue.id}">
              <div class="status-bar ${info.level}"></div>
              <div class="saved-card-inner">
                <div class="saved-content">
                  <div class="saved-header">
                    <div>
                      <h3 class="saved-category">${badgeLabel} &middot; ${issue.category}</h3>
                      <h4 class="saved-title">${escapeHtml(issue.title)}</h4>
                    </div>
                    <button class="action-btn unpin-btn" data-id="${issue.id}" title="Remove from saved">
                      <span class="material-symbols-outlined">bookmark</span>
                    </button>
                  </div>
                  <p class="saved-meta">${info.days} days open &middot; ${issue.upvote_count} upvotes &middot; ${issue.resolve_confirmations} resolution confirmations</p>
                  <div class="issue-desc-box" style="background:var(--surface-container);padding:0.75rem;border-radius:var(--border-radius);margin-top:0.75rem;">
                    <p class="issue-desc" style="margin:0;">${escapeHtml(issue.description || 'No description provided.')}</p>
                  </div>
                </div>
                <div class="saved-image-wrapper">
                  <div class="saved-image" style="${issue.photo_url ? `background-image:url('${issue.photo_url}');background-size:cover;background-position:center;` : ''}"></div>
                </div>
              </div>
            </div>`;
        }

        return `
        <div class="saved-card" data-id="${issue.id}">
          <div class="status-bar ${info.level}"></div>
          <div class="saved-card-inner">
            <div class="saved-header">
              <span class="badge ${info.level === 'green' ? 'solved' : info.level === 'red' ? 'error' : info.level === 'orange' ? 'warning' : 'moderate'}">${badgeLabel}</span>
              <button class="action-btn unpin-btn" data-id="${issue.id}" title="Remove from saved">
                <span class="material-symbols-outlined">bookmark</span>
              </button>
            </div>
            <p class="saved-title">${escapeHtml(issue.title)}</p>
            <p class="saved-meta">${issue.category}</p>
          </div>
        </div>`;
    }).join('');

    grid.querySelectorAll('.saved-card').forEach((card) => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.unpin-btn')) return;
            const id = Number(card.dataset.id);
            expandedId = expandedId === id ? null : id;
            renderSavedGrid();
        });
    });

    grid.querySelectorAll('.unpin-btn').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = Number(btn.dataset.id);
            await window.issueStore.unpinIssue(id);
            savedIssues = savedIssues.filter((i) => i.id !== id);
            if (expandedId === id) expandedId = null;
            document.getElementById('stat-saved').textContent = savedIssues.length;
            renderSavedGrid();
        });
    });
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {
    renderAuthState();

    document.getElementById('show-login-btn').addEventListener('click', () => {
        document.getElementById('login-form-section').classList.remove('hidden');
    });

    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('login-name').value.trim();
        const email = document.getElementById('login-email').value.trim();
        window.auth.logIn(name, email);
        renderAuthState();
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        window.auth.logOut();
        renderAuthState();
    });
});
