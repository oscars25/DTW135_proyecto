// assets/js/auth.js
// Gestiona autenticacion basica por sesion y protege las paginas internas.

(function () {
  const AUTH_KEY = 'autoreg_auth_user';
  const path = String(window.location.pathname || '').replace(/\\/g, '/').toLowerCase();
  const inPagesFolder = path.includes('/pages/');
  const isLoginPage = path.endsWith('/login.html') || path.endsWith('login.html');

  const loginPath = inPagesFolder ? '../login.html' : 'login.html';
  const indexPath = inPagesFolder ? '../index.html' : 'index.html';

  function getSessionUser() {
    try {
      const raw = sessionStorage.getItem(AUTH_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (error) {
      console.warn('No se pudo leer la sesion de usuario:', error);
      return null;
    }
  }

  function isAuthenticated() {
    return !!getSessionUser();
  }

  function login(username) {
    const payload = {
      username: username || 'usuario',
      loginAt: Date.now()
    };
    sessionStorage.setItem(AUTH_KEY, JSON.stringify(payload));
  }

  function logout() {
    sessionStorage.removeItem(AUTH_KEY);
  }

  function redirectToLogin() {
    window.location.href = loginPath;
  }

  function redirectToIndex() {
    window.location.href = indexPath;
  }

  window.authService = {
    isAuthenticated,
    login,
    logout,
    redirectToLogin,
    redirectToIndex,
    getSessionUser
  };

  if (isLoginPage) {
    if (isAuthenticated()) redirectToIndex();
  } else if (!isAuthenticated()) {
    redirectToLogin();
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-logout="true"]').forEach(link => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        logout();
        redirectToLogin();
      });
    });
  });
})();
