/**
 * Controlador del Formulario de Registro
 * Gestiona la captura, validación y envío de los datos para la creación de nuevas cuentas.
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registerForm');
  const nameInput = document.getElementById('registerName');
  const emailInput = document.getElementById('registerEmail');
  const passwordInput = document.getElementById('registerPassword');
  const confirmInput = document.getElementById('registerPasswordConfirm');
  const alertBox = document.getElementById('registerAlert');

  if (!form || !nameInput || !emailInput || !passwordInput || !confirmInput || !alertBox) return;

  function showAlert(message, type) {
    alertBox.textContent = message;
    alertBox.className = `form-alert ${type === 'success' ? 'alert-success' : 'alert-error'}`;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const nombre = String(nameInput.value || '').trim();
    const email = String(emailInput.value || '').trim();
    const password = String(passwordInput.value || '');
    const confirmPassword = String(confirmInput.value || '');

    if (!nombre || !email || !password || !confirmPassword) {
      showAlert('Completa todos los campos para crear tu cuenta.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showAlert('Las contraseñas no coinciden.', 'error');
      return;
    }

    if (!window.authService || typeof window.authService.registerUser !== 'function') {
      showAlert('No se pudo procesar el registro. Intenta recargar la página.', 'error');
      return;
    }

    try {
      window.authService.registerUser({ nombre, email, password });
      form.reset();
      showAlert('Cuenta creada correctamente. Ahora puedes iniciar sesión.', 'success');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1200);
    } catch (error) {
      showAlert(error?.message || 'Ocurrió un error al crear la cuenta.', 'error');
    }
  });
});
