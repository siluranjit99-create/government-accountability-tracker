// issueStore.js
// Single point of contact with the backend. Every page talks to the API only
// through these functions.
//
// Locally (opened via Live Server / npx serve on your laptop) the backend runs
// as its own process on port 4000, so we call it directly.
// Once deployed to EC2, nginx reverse-proxies /api/* to the backend on the
// same box - so the browser should call a relative path, not localhost.
const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:4000'
    : '';

async function request(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: { 'Content-Type': 'application/json' },

        ...options,
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Request failed (${res.status}): ${text}`);
    }
    return res.json();
}

const issueStore = {
    // GET /api/issues?category=&sort=
    async getIssues(filters = {}) {
        const params = new URLSearchParams();
        if (filters.category) params.set('category', filters.category);
        if (filters.sort) params.set('sort', filters.sort);
        const qs = params.toString();
        return request(`/api/issues${qs ? `?${qs}` : ''}`);
    },

    // POST /api/issues
    async postIssue(data) {
        return request('/api/issues', { method: 'POST', body: JSON.stringify(data) });
    },

    // POST /api/issues/:id/upvote
    async upvote(issueId) {
        return request(`/api/issues/${issueId}/upvote`, { method: 'POST' });
    },

    // POST /api/issues/:id/resolve
    async markResolved(issueId) {
        return request(`/api/issues/${issueId}/resolve`, { method: 'POST' });
    },

    // GET /api/issues/:id/comments
    async getComments(issueId) {
        return request(`/api/issues/${issueId}/comments`);
    },

    // POST /api/issues/:id/comments
    async postComment(issueId, authorName, text, isResolutionConfirmation = false) {
        return request(`/api/issues/${issueId}/comments`, {
            method: 'POST',
            body: JSON.stringify({
                author_name: authorName,
                text,
                is_resolution_confirmation: isResolutionConfirmation,
            }),
        });
    },

    // POST /api/pins/:id
    async pinIssue(issueId) {
        return request(`/api/pins/${issueId}`, { method: 'POST' });
    },

    // DELETE /api/pins/:id
    async unpinIssue(issueId) {
        return request(`/api/pins/${issueId}`, { method: 'DELETE' });
    },

    // GET /api/pins
    async getPinnedIssues() {
        return request('/api/pins');
    },
};

window.issueStore = issueStore;
