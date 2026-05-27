// assets/js/app.js
// Funciones globales para manejar datos de vehiculos y almacenamiento local

const STORAGE_KEY = 'autoreg_vehiculos';
const FILTER_KEY = 'autoreg_ultimo_filtro';

function parseJSON(value, fallback) {
  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn('JSON inválido en storage:', error);
    return fallback;
  }
}

function getVehiculos() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    const parsed = parseJSON(data, []);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.vehiculos)) return parsed.vehiculos;
      const arrayValues = Object.values(parsed).filter(value => Array.isArray(value));
      if (arrayValues.length === 1) return arrayValues[0];
    }

    return [];
  } catch (error) {
    console.error('Error leyendo vehículos de localStorage:', error);
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function saveVehiculos(vehiculos) {
  try {
    const serialized = JSON.stringify(vehiculos);
    localStorage.setItem(STORAGE_KEY, serialized);
    // verify write
    const verify = localStorage.getItem(STORAGE_KEY);
    if (!verify) throw new Error('Verificación de storage fallida: valor leído es nulo');
    try {
      JSON.parse(verify);
    } catch (err) {
      console.error('Contenido guardado inválido:', verify);
      throw new Error('Contenido guardado inválido en localStorage');
    }
    // notify other tabs/pages that data changed
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('autoreg_channel');
        bc.postMessage({ type: 'vehiculos:update', at: Date.now() });
        bc.close();
      }
    } catch (e) {
      console.warn('BroadcastChannel not available or failed to post message', e);
    }
  } catch (error) {
    console.error('Error guardando vehículos en localStorage:', error);
    throw new Error('No se pudo guardar la información. Intente nuevamente.');
  }
}

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

function eliminarVehiculo(id) {
  try {
    const vehiculos = getVehiculos().filter(v => String(v.id) !== String(id));
    saveVehiculos(vehiculos);
  } catch (error) {
    console.error('Error eliminando vehículo:', error);
    throw error;
  }
}

function getVehiculoById(id) {
  return getVehiculos().find(v => String(v.id) === String(id));
}

function guardarFiltroSession(filtro) {
  try {
    sessionStorage.setItem(FILTER_KEY, filtro);
  } catch (error) {
    console.error('Error guardando filtro en sessionStorage:', error);
  }
}

function obtenerFiltroSession() {
  try {
    return sessionStorage.getItem(FILTER_KEY) || '';
  } catch (error) {
    console.error('Error leyendo filtro de sessionStorage:', error);
    return '';
  }
}

function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

function getCookie(name) {
  return document.cookie.split('; ').reduce((prev, current) => {
    const [cookieName, cookieValue] = current.split('=');
    return cookieName === encodeURIComponent(name) ? decodeURIComponent(cookieValue) : prev;
  }, '');
}

function eraseCookie(name) {
  setCookie(name, '', -1);
}

function getEstadoCounts() {
  const vehiculos = getVehiculos();
  return {
    total: vehiculos.length,
    aprobado: vehiculos.filter(v => v.estado === 'Aprobado').length,
    pendiente: vehiculos.filter(v => v.estado === 'Pendiente').length,
    observado: vehiculos.filter(v => v.estado === 'Observado').length,
    revision: vehiculos.filter(v => v.estado === 'En revision' || v.estado === 'En revisión').length,
    bloqueado: vehiculos.filter(v => v.estado === 'Bloqueado').length
  };
}

/**
 * Redimensiona una imagen (File) y devuelve una Data URL optimizada.
 * @param {File} file - Archivo de imagen
 * @param {number} maxWidth - ancho máximo
 * @param {number} maxHeight - alto máximo
 * @param {number} quality - calidad JPEG entre 0 y 1
 * @returns {Promise<string>} dataURL
 */
function resizeImage(file, maxWidth = 1200, maxHeight = 800, quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (!(file instanceof File)) {
      return reject(new Error('El argumento debe ser un File'));
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
        ctx.drawImage(img, 0, 0, width, height);

        try {
          // Force output to JPEG to keep size small; fill white background for PNGs
          const mime = 'image/jpeg';
          // if source had transparency, paint white background first
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL(mime, quality);
          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = (e) => reject(new Error('Error cargando la imagen'));
      img.src = String(reader.result);
    };

    reader.onerror = (e) => reject(new Error('Error leyendo el archivo'));
    reader.readAsDataURL(file);
  });
}
