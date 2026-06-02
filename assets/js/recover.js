/**
 * Gestor de Recuperación de Contraseña
 * Maneja la solicitud de recuperación y el restablecimiento mediante tokens simulados.
 */

(function() {
  const RESET_TOKEN_KEY = 'autoreg_reset_token';

  /**
   * Muestra notificaciones temporales en los contenedores de alerta.
   */
  function showAlert(element, message, type) {
    if (!element) return;
    element.textContent = message;
    element.className = `form-alert ${type === 'success' ? 'alert-success' : 'alert-error'}`;
    setTimeout(() => {
      if (element.textContent === message) {
        element.textContent = '';
        element.className = 'form-alert';
      }
    }, 6000);
  }

  /**
   * Simula el envío de un correo generando un token de acceso único.
   */
  async function sendResetEmail(email) {
    if (!window.authService) return { success: false, message: 'Error de sistema.' };
    
    const user = window.authService.getUserByEmail(email);
    if (!user) {
      return { success: false, message: 'No existe una cuenta con ese correo.' };
    }

    const token = btoa(`${user.email}_${Date.now()}_${Math.random()}`);
    const resetData = {
      email: user.email,
      token: token,
      expires: Date.now() + 3600000 // 1 hora de validez
    };
    
    localStorage.setItem(RESET_TOKEN_KEY, JSON.stringify(resetData));

    const resetLink = `${window.location.origin}${window.location.pathname}?token=${token}`;
    console.debug(`[DEBUG] Enlace generado: ${resetLink}`);

    return { 
      success: true, 
      message: `Simulación: Enlace enviado. <a href="${resetLink}" style="color:var(--accent); font-weight:bold;">Hacer clic aquí para restablecer</a>`
    };
  }

  /**
   * Verifica si existe un token válido en la URL para mostrar el formulario de reseteo.
   */
  function checkResetToken() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (!token) return false;

    const stored = localStorage.getItem(RESET_TOKEN_KEY);
    if (!stored) return false;

    try {
      const resetData = JSON.parse(stored);
      if (resetData.token !== token || Date.now() > resetData.expires) {
        localStorage.removeItem(RESET_TOKEN_KEY);
        return false;
      }

      document.getElementById('requestContainer').classList.add('hidden');
      const resetContainer = document.getElementById('resetContainer');
      resetContainer.classList.remove('hidden');
      resetContainer.dataset.email = resetData.email;
      return true;
    } catch (e) {
      return false;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Toggle de visibilidad de contraseña
    document.querySelectorAll('.toggle-password').forEach(btn => {
      btn.addEventListener('click', function() {
        const input = document.getElementById(this.dataset.target);
        if (input) {
          const isPass = input.type === 'password';
          input.type = isPass ? 'text' : 'password';
          this.textContent = isPass ? '🙈' : '👁️';
        }
      });
    });

    const tokenValid = checkResetToken();
    const requestForm = document.getElementById('recoverRequestForm');
    const resetForm = document.getElementById('resetPasswordForm');

    requestForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const alertBox = document.getElementById('requestAlert');
      const email = document.getElementById('recoveryEmail').value.trim();
      
      const result = await sendResetEmail(email);
      showAlert(alertBox, result.message, result.success ? 'success' : 'error');
    });

    resetForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const alertBox = document.getElementById('resetAlert');
      const email = document.getElementById('resetContainer').dataset.email;
      const pass = document.getElementById('newPassword').value;
      const confirm = document.getElementById('confirmPassword').value;

      try {
        window.authService.recoverPassword(email, pass);
        localStorage.removeItem(RESET_TOKEN_KEY);
        showAlert(alertBox, 'Contraseña actualizada. Redirigiendo...', 'success');
        setTimeout(() => window.location.href = 'login.html', 2500);
      } catch (err) {
        showAlert(alertBox, err.message, 'error');
      }
    });
  });
})();
