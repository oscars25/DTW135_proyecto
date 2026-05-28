// assets/js/login.js
// Maneja autenticacion simple para acceso al sistema.

document.addEventListener('DOMContentLoaded', () => {
  const VALID_USER = 'admin';
  const VALID_PASSWORD = 'admin';

  const form = document.getElementById('loginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const alertBox = document.getElementById('loginAlert');

  if (!form || !usernameInput || !passwordInput || !alertBox) return;

  function showAlert(message, type) {
    alertBox.textContent = message;
    alertBox.className = `form-alert ${type === 'success' ? 'alert-success' : 'alert-error'}`;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
      showAlert('Ingresa usuario y contraseña para continuar.', 'error');
      return;
    }

    if (username !== VALID_USER || password !== VALID_PASSWORD) {
      showAlert('Credenciales invalidas. Usa usuario admin y contraseña admin.', 'error');
      return;
    }

    if (window.authService && typeof window.authService.login === 'function') {
      window.authService.login(username);
      showAlert('Acceso concedido. Redirigiendo...', 'success');
      setTimeout(() => {
        window.authService.redirectToIndex();
      }, 500);
      return;
    }

    showAlert('No se pudo iniciar sesión. Intenta recargar la página.', 'error');
  });
});
