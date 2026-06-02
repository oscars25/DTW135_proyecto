document.addEventListener('DOMContentLoaded', () => {
  const user = window.authService?.getSessionUser?.();
  const nameField = document.getElementById('accountName');
  const emailField = document.getElementById('accountEmail');
  const form = document.getElementById('accountPasswordForm');
  const currentPassword = document.getElementById('currentPassword');
  const newPassword = document.getElementById('newPassword');
  const confirmNewPassword = document.getElementById('confirmNewPassword');
  const alertBox = document.getElementById('accountAlert');

  // Cargar información del usuario actual
  if (nameField) nameField.value = user?.nombre || user?.name || user?.email || '';
  if (emailField) emailField.value = user?.email || '';

  function showAlert(message, type) {
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.className = `form-alert ${type === 'success' ? 'alert-success' : 'alert-error'}`;
  }

  if (!form || !alertBox) return;

  // --- Cambio de contraseña ---
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const email = String(user?.email || '').trim();
    const current = String(currentPassword.value || '');
    const next = String(newPassword.value || '');
    const confirm = String(confirmNewPassword.value || '');

    if (!email) {
      showAlert('No se encontró el correo de la cuenta actual.', 'error');
      return;
    }

    if (!current || !next || !confirm) {
      showAlert('Completa todos los campos para cambiar la contraseña.', 'error');
      return;
    }

    if (next !== confirm) {
      showAlert('Las nuevas contraseñas no coinciden.', 'error');
      return;
    }

    if (!window.authService || typeof window.authService.changePassword !== 'function') {
      showAlert('No se pudo actualizar la contraseña. Intenta recargar la página.', 'error');
      return;
    }

    try {
      window.authService.changePassword(email, current, next);
      form.reset();
      showAlert('Contraseña actualizada correctamente.', 'success');
      renderUserTable(); // Refrescar tabla si se cambió la propia contraseña
    } catch (error) {
      showAlert(error?.message || 'Error al actualizar la contraseña.', 'error');
    }
  });

  // --- Gestión de Usuarios (CRUD) ---
  const USERS_KEY = 'autoreg_users';
  const tbody = document.getElementById('usersTableBody');
  const countText = document.getElementById('userCountText');

  function getStoredUsers() {
    return window.authService?.getStoredUsers?.() || [];
  }

  function saveUsersToStorage(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function renderUserTable() {
    if (!tbody) return;
    const users = getStoredUsers();

    if (countText) countText.textContent = `Total: ${users.length} usuario${users.length !== 1 ? 's' : ''}`;

    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4">No hay usuarios registrados</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    users.forEach(u => {
      const row = tbody.insertRow();
      row.insertCell(0).textContent = u.id || 'N/A';
      row.insertCell(1).textContent = u.nombre || u.name || 'Sin nombre';
      row.insertCell(2).textContent = u.email;

      const actionsCell = row.insertCell(3);
      actionsCell.className = 'action-buttons';

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '🗑️';
      deleteBtn.className = 'btn-icon btn-delete';
      deleteBtn.title = 'Eliminar usuario';
      deleteBtn.onclick = () => deleteUser(u);

      actionsCell.appendChild(deleteBtn);
    });
  }

  function deleteUser(u) {
    const isSelf = user && user.email === u.email;
    const confirmMsg = isSelf 
      ? `¿Estás seguro de eliminar tu propio usuario? Perderás el acceso al sistema.` 
      : `¿Eliminar al usuario "${u.nombre || u.email}"? Esta acción no se puede deshacer.`;

    if (confirm(confirmMsg)) {
      let users = getStoredUsers();
      users = users.filter(usr => usr.email !== u.email);
      saveUsersToStorage(users);
      
      if (isSelf) {
        window.authService.logout();
        window.authService.redirectToLogin();
      } else {
        renderUserTable();
      }
    }
  }

  // Inicializar eventos y tabla
  renderUserTable();
});
