// navbar.js
// Mocked auth flag (shared across pages via localStorage) + small header behaviors.

const auth = {
    isLoggedIn() {
        return localStorage.getItem('civicpulse_logged_in') === 'true';
    },
    logIn(name, email) {
        localStorage.setItem('civicpulse_logged_in', 'true');
        localStorage.setItem('civicpulse_user_name', name || 'Alex Johnson');
        localStorage.setItem('civicpulse_user_email', email || 'alex.j@example.com');
    },
    logOut() {
        localStorage.removeItem('civicpulse_logged_in');
    },
    getUser() {
        return {
            name: localStorage.getItem('civicpulse_user_name') || 'Alex Johnson',
            email: localStorage.getItem('civicpulse_user_email') || 'alex.j@example.com',
        };
    },
};

window.auth = auth;

// Gate any action button that requires being logged in. Call this instead of
// running the action directly; it redirects to Profile with a prompt if not
// logged in.
function requireLogin(actionFn) {
    if (!auth.isLoggedIn()) {
        alert('Please log in to do that.');
        window.location.href = 'profile.html';
        return;
    }
    actionFn();
}
window.requireLogin = requireLogin;
