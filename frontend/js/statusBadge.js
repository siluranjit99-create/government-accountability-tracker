// statusBadge.js
// Renders the green/yellow/orange/red aging badge used across Home and Profile.

const BADGE_CONFIG = {
    green: { icon: 'check_circle', label: 'Solved' },
    yellow: { icon: 'schedule', label: 'days open' },
    orange: { icon: 'warning', label: 'days open, moderate neglect' },
    red: { icon: 'error', label: 'days open, neglected' },
};

/**
 * Returns an HTML string for the small pill badge overlaid on a card's photo.
 */
function renderStatusBadgeHTML(issue) {
    const level = window.dateHelpers.badgeLevel(issue);
    const days = window.dateHelpers.daysOpen(issue.created_at);
    const cfg = BADGE_CONFIG[level];
    const text = level === 'green' ? cfg.label : `${days}d ${cfg.label}`;
    return `<div class="status-badge ${level}"><span class="material-symbols-outlined">${cfg.icon}</span> ${text}</div>`;
}

/**
 * Returns just { level, days } for callers that want to build their own markup
 * (e.g. the small status-bar strip on Profile's saved cards).
 */
function getBadgeInfo(issue) {
    return {
        level: window.dateHelpers.badgeLevel(issue),
        days: window.dateHelpers.daysOpen(issue.created_at),
    };
}

window.statusBadge = { renderStatusBadgeHTML, getBadgeInfo, BADGE_CONFIG };
