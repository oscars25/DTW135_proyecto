/**
 * Controlador de Inicio de Sesión
 * Gestiona las interacciones del formulario de autenticación e inicialización de sesiones.
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('loginEmail');
  const passwordInput = document.getElementById('loginPassword');
  const rememberCheckbox = document.getElementById('loginRemember');
  const alertBox = document.getElementById('loginAlert');

  if (!form || !emailInput || !passwordInput || !alertBox) return;

  // --- Funcionalidad de Mostrar/Ocultar Contraseña ---
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      togglePasswordBtn.textContent = isPassword ? '🙈' : '👁️';
    });
  }

  // --- Inicialización de Usuario por Defecto ---
  function initDefaultUser() {
    if (!window.authService) return;
    
    try {
      const users = window.authService.getStoredUsers();
      if (users.length === 0) {
        window.authService.registerUser({
          nombre: 'Administrador',
          email: 'admin@example.com',
          password: 'admin123'
        });
        console.debug('Usuario administrador por defecto creado: admin@example.com / admin123');
      }
    } catch (err) {
      console.warn('No se pudo inicializar el usuario por defecto:', err.message);
    }
  }

  // Ejecutar inicialización
  initDefaultUser();

  // Recuperar correo guardado al cargar
  const savedEmail = localStorage.getItem('autoreg_remember_email');
  if (savedEmail) {
    emailInput.value = savedEmail;
    if (rememberCheckbox) rememberCheckbox.checked = true;
  }

  function showAlert(message, type) {
    alertBox.textContent = message;
    alertBox.className = `form-alert ${type === 'success' ? 'alert-success' : 'alert-error'}`;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const email = String(emailInput.value || '').trim();
    const password = String(passwordInput.value || '');

    if (!email || !password) {
      showAlert('Ingresa correo y contraseña para continuar.', 'error');
      return;
    }

    if (!window.authService || typeof window.authService.validateUser !== 'function') {
      showAlert('No se pudo validar las credenciales. Intenta recargar la página.', 'error');
      return;
    }

    const user = window.authService.validateUser(email, password);
    if (!user) {
      showAlert('Correo o contraseña incorrectos.', 'error');
      return;
    }

    // Gestionar la persistencia del correo
    if (rememberCheckbox && rememberCheckbox.checked) {
      localStorage.setItem('autoreg_remember_email', email);
    } else {
      localStorage.removeItem('autoreg_remember_email');
    }

    window.authService.login(user);
    showAlert('Acceso concedido. Redirigiendo...', 'success');
    setTimeout(() => {
      window.location.href = 'pages/dashboard.html';
    }, 500);
  });
});
