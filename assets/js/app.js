/**
 * Módulo de Persistencia y Utilidades Globales
 * 
 * Este archivo centraliza el acceso al almacenamiento local (LocalStorage), 
 * la gestión de cookies y el procesamiento de recursos multimedia.
 */

const STORAGE_KEY = 'autoreg_vehiculos';
const FILTER_KEY = 'autoreg_ultimo_filtro';

/**
 * Intenta parsear una cadena JSON con manejo de excepciones.
 */
function parseJSON(value, fallback) {
  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn('JSON inválido en storage:', error);
    return fallback;
  }
}

/**
 * Recupera la colección completa de vehículos desde el almacenamiento local.
 * Garantiza el retorno de una estructura de arreglo válida.
 */
function getVehiculos() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : (parsed.vehiculos || []);
  } catch (error) {
    console.error('Error leyendo vehículos de localStorage:', error);
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

/**
 * Persiste la colección de vehículos en LocalStorage y notifica
 * los cambios a otras pestañas activas del navegador.
 */
function saveVehiculos(vehiculos) {
  try {
    const serialized = JSON.stringify(vehiculos);
    localStorage.setItem(STORAGE_KEY, serialized);
    
    const verify = localStorage.getItem(STORAGE_KEY);
    if (!verify) throw new Error('Verificación de storage fallida: valor leído es nulo');
    try {
      JSON.parse(verify);
    } catch (err) {
      console.error('Contenido guardado inválido:', verify);
      throw new Error('Contenido guardado inválido en localStorage');
    }

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('autoreg_channel');
        bc.postMessage({ type: 'vehiculos:update', at: Date.now() });
        bc.close();
      }
    } catch (e) {
      console.warn('BroadcastChannel no disponible o error al enviar mensaje', e);
    }
  } catch (error) {
    console.error('Error guardando vehículos en localStorage:', error);
    throw new Error('No se pudo guardar la información. Intente nuevamente.');
  }
}

/**
 * Crea o actualiza un registro de vehículo individual.
 * Si el objeto cuenta con ID, se actualiza el existente; de lo contrario, se genera uno nuevo.
 */
function guardarVehiculo(vehiculo) {
  let vehiculos = getVehiculos();
  console.log('[autoreg] guardarVehiculo called. incoming vehiculo:', vehiculo);

  if (vehiculo.id) {
    const index = vehiculos.findIndex(v => String(v.id) === String(vehiculo.id));
    if (index !== -1) {
      vehiculos[index] = vehiculo;
    } else {
      vehiculo.id = Number(vehiculo.id) || Date.now();
      vehiculos.push(vehiculo);
    }
  } else {
    vehiculo.id = Date.now();
    vehiculos.push(vehiculo);
  }

  try {
    saveVehiculos(vehiculos);
    console.log('[autoreg] saveVehiculos successful. total stored:', vehiculos.length);
  } catch (err) {
    console.error('[autoreg] error saving vehicles:', err);
    throw err;
  }

  return vehiculo;
}

/**
 * Elimina un registro del almacenamiento basándose en su identificador único.
 */
function eliminarVehiculo(id) {
  try {
    const vehiculos = getVehiculos().filter(v => String(v.id) !== String(id));
    saveVehiculos(vehiculos);
  } catch (error) {
    console.error('Error eliminando vehículo:', error);
    throw error;
  }
}

/**
 * Busca un vehículo específico por su ID.
 */
function getVehiculoById(id) {
  return getVehiculos().find(v => String(v.id) === String(id));
}

/**
 * Almacena el estado de los filtros de búsqueda en SessionStorage.
 */
function guardarFiltroSession(filtro) {
  try {
    sessionStorage.setItem(FILTER_KEY, filtro);
  } catch (error) {
    console.error('Error guardando filtro en sessionStorage:', error);
  }
}

/**
 * Recupera el último filtro aplicado durante la sesión actual.
 */
function obtenerFiltroSession() {
  try {
    return sessionStorage.getItem(FILTER_KEY) || '';
  } catch (error) {
    console.error('Error leyendo filtro de sessionStorage:', error);
    return '';
  }
}

/**
 * Utilidad para la creación de cookies con tiempo de expiración.
 */
function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

/**
 * Recupera el valor de una cookie específica por su nombre.
 */
function getCookie(name) {
  return document.cookie.split('; ').reduce((prev, current) => {
    const [cookieName, cookieValue] = current.split('=');
    return cookieName === encodeURIComponent(name) ? decodeURIComponent(cookieValue) : prev;
  }, '');
}

/**
 * Elimina una cookie invalidando su fecha de expiración.
 */
function eraseCookie(name) {
  setCookie(name, '', -1);
}

/**
 * Genera estadísticas cuantitativas de los vehículos segmentadas por su estado actual.
 * Realiza una normalización de texto para asegurar la precisión del conteo.
 */
function getEstadoCounts() {
  try {
    const vehiculos = getVehiculos() || [];

    const check = (estado, busqueda) => {
      const normalize = (str) => {
        if (!str) return '';
        return String(str).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      };
      return normalize(estado).includes(normalize(busqueda));
    };

    return {
      total: vehiculos.length,
      aprobado: vehiculos.filter(v => check(v.estado, 'aprob')).length,
      pendiente: vehiculos.filter(v => check(v.estado, 'pend')).length,
      observado: vehiculos.filter(v => check(v.estado, 'observ')).length,
      revision: vehiculos.filter(v => check(v.estado, 'revis')).length,
      bloqueado: vehiculos.filter(v => check(v.estado, 'bloque')).length
    };
  } catch (error) {
    console.error("Error al calcular conteos:", error);
    return { total: 0, aprobado: 0, pendiente: 0, observado: 0, revision: 0, bloqueado: 0 };
  }
}

/**
 * Procesa y redimensiona archivos de imagen en el cliente para optimizar el almacenamiento.
 */
function resizeImage(file, maxWidth = 1200, maxHeight = 800, quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (!(file instanceof File)) {
      return reject(new Error('El argumento debe ser un objeto de tipo File'));
    }

    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      img.onload = () => {
        let { width, height } = img;
        const aspect = width / height;

        if (width > maxWidth) {
          width = maxWidth;
          height = Math.round(width / aspect);
        }

        if (height > maxHeight) {
          height = maxHeight;
          width = Math.round(height * aspect);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        try {
          const mime = 'image/jpeg';
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL(mime, quality);
          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => reject(new Error('Error al cargar la imagen'));
      img.src = String(reader.result);
    };

    reader.onerror = () => reject(new Error('Error al leer el archivo físico'));
    reader.readAsDataURL(file);
  });
}
