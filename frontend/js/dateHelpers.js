// dateHelpers.js
// Days-open calculation and aging-badge threshold logic, shared by every page.

/**
 * Number of whole days between an ISO timestamp and now.
 */
function daysOpen(createdAt) {
    const created = new Date(createdAt).getTime();
    const now = Date.now();
    const diffMs = Math.max(0, now - created);
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Maps an issue's status + age to one of: green, yellow, orange, red.
 *   green  = solved
 *   yellow = 0-14 days open
 *   orange = 15-45 days open
 *   red    = 45+ days open
 */
function badgeLevel(issue) {
    if (issue.status === 'resolved') return 'green';
    const days = daysOpen(issue.created_at);
    if (days <= 14) return 'yellow';
    if (days <= 45) return 'orange';
    return 'red';
}

/**
 * Human-readable relative time, e.g. "2h ago", "3d ago".
 */
function relativeTime(createdAt) {
    const diffMs = Date.now() - new Date(createdAt).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${Math.max(mins, 1)}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

window.dateHelpers = { daysOpen, badgeLevel, relativeTime };
