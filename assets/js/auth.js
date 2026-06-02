/**
 * Servicio de Autenticación Principal
 * 
 * Provee la lógica para la gestión de sesiones de usuario, persistencia de credenciales
 * seguras y control de acceso a las rutas protegidas del sistema.
 */

(function () {
  const AUTH_KEY = 'autoreg_auth_user';
  const USERS_KEY = 'autoreg_users';
  const path = String(window.location.pathname || '').replace(/\\/g, '/').toLowerCase();
  const inPagesFolder = path.includes('/pages/');
  const isLoginPage = path.endsWith('/login.html') || path.endsWith('login.html');
  const isRegisterPage = path.endsWith('/register.html') || path.endsWith('register.html');
  const isRecoverPage = path.endsWith('/recover.html') || path.endsWith('recover.html');
  const isPublicPage = isLoginPage || isRegisterPage || isRecoverPage;

  const loginPath = inPagesFolder ? '../login.html' : 'login.html';
  const indexPath = inPagesFolder ? '../index.html' : 'index.html';

  function parseJSON(value, fallback) {
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  function getStoredUsers() {
    try {
      const raw = localStorage.getItem(USERS_KEY);
      const users = parseJSON(raw, []);
      return Array.isArray(users) ? users : [];
    } catch (error) {
      console.warn('No se pudo leer los usuarios:', error);
      return [];
    }
  }

  /**
   * Persiste la lista de usuarios registrados en el sistema.
   */
  function saveStoredUsers(users) {
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (error) {
      console.error('No se pudo guardar los usuarios:', error);
      throw new Error('Error al guardar los datos del usuario. Intenta nuevamente.');
    }
  }

  function getUserByEmail(email) {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) return null;
    return getStoredUsers().find(user => normalizeEmail(user.email) === normalizedEmail) || null;
  }

  /**
   * Valida las credenciales de un usuario contra los datos almacenados.
   */
  function validateUser(email, password) {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !password) return null;

    const user = getUserByEmail(normalizedEmail);
    if (!user || user.password !== password) return null;

    return user;
  }

  /**
   * Registra un nuevo perfil de usuario realizando validaciones de seguridad y formato.
   */
  function registerUser({ nombre, email, password }) {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new Error('Ingresa un correo electrónico válido.');
    }

    if (!nombre || !nombre.trim()) {
      throw new Error('Ingresa tu nombre completo.');
    }

    if (!password || password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres.');
    }

    if (getUserByEmail(normalizedEmail)) {
      throw new Error('Ya existe una cuenta con ese correo.');
    }

    const users = getStoredUsers();
    const user = {
      nombre: nombre.trim(),
      email: normalizedEmail,
      password,
      createdAt: Date.now()
    };

    users.push(user);
    saveStoredUsers(users);
    return user;
  }

  /**
   * Actualiza la contraseña de un usuario existente previa validación de la anterior.
   */
  function changePassword(email, currentPassword, newPassword) {
    const normalizedEmail = normalizeEmail(email);
    const user = getUserByEmail(normalizedEmail);

    if (!user) {
      throw new Error('No existe una cuenta con ese correo.');
    }

    if (user.password !== currentPassword) {
      throw new Error('La contraseña actual es incorrecta.');
    }

    if (!newPassword || newPassword.length < 6) {
      throw new Error('La nueva contraseña debe tener al menos 6 caracteres.');
    }

    const users = getStoredUsers();
    const index = users.findIndex(u => normalizeEmail(u.email) === normalizedEmail);
    if (index === -1) {
      throw new Error('Usuario no encontrado en la persistencia local.');
    }

    users[index].password = newPassword;
    saveStoredUsers(users);
    return users[index];
  }

  /**
   * Restablece la contraseña de un usuario a partir de su dirección de correo.
   */
  function recoverPassword(email, newPassword) {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new Error('Ingresa un correo electrónico válido.');
    }

    if (!newPassword || newPassword.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres.');
    }

    const users = getStoredUsers();
    const index = users.findIndex(u => normalizeEmail(u.email) === normalizedEmail);
    if (index === -1) {
      throw new Error('No existe una cuenta registrada con ese correo.');
    }

    users[index].password = newPassword;
    saveStoredUsers(users);
    return users[index];
  }

  function getSessionUser() {
    try {
      const raw = sessionStorage.getItem(AUTH_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (error) {
      console.warn('No se pudo leer la sesión de usuario:', error);
      return null;
    }
  }

  function isAuthenticated() {
    return !!getSessionUser();
  }

  /**
   * Establece una sesión activa para el usuario actual.
   */
  function login(user) {
    const payload = {
      nombre: String(user?.nombre || user?.name || user?.email || 'Usuario'),
      email: normalizeEmail(user?.email),
      loginAt: Date.now()
    };
    sessionStorage.setItem(AUTH_KEY, JSON.stringify(payload));
  }

  /**
   * Finaliza la sesión del usuario y limpia los datos temporales.
   */
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
    getSessionUser,
    validateUser,
    registerUser,
    changePassword,
    recoverPassword,
    getStoredUsers,
    getUserByEmail
  };

  if (isPublicPage) {
    if (isAuthenticated() && isLoginPage) redirectToIndex();
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
