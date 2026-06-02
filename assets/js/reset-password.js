document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('resetForm');
  const newPasswordInput = document.getElementById('newPassword');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const alertBox = document.getElementById('resetAlert');
  
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get('email');

  if (!email) {
    alertBox.textContent = "Enlace inválido o expirado.";
    alertBox.className = "form-alert alert-error";
    form.style.display = 'none';
    return;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    
    const pass = newPasswordInput.value;
    const confirm = confirmPasswordInput.value;

    if (pass.length < 6) {
      alertBox.textContent = "La contraseña debe tener al menos 6 caracteres.";
      alertBox.className = "form-alert alert-error";
      return;
    }

    if (pass !== confirm) {
      alertBox.textContent = "Las contraseñas no coinciden.";
      alertBox.className = "form-alert alert-error";
      return;
    }

    try {
      window.authService.recoverPassword(email, pass);
      alertBox.textContent = "Contraseña actualizada. Redirigiendo...";
      alertBox.className = "form-alert alert-success";
      setTimeout(() => window.location.href = 'login.html', 2000);
    } catch (error) {
      alertBox.textContent = error.message;
      alertBox.className = "form-alert alert-error";
    }
  });
});