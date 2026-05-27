// assets/js/registro.js
// Manejo de formulario de registro/edición usando app.js

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('vehiculoForm');
  const titulo = document.getElementById('formTitle');
  const idField = document.getElementById('vehiculoId');
  const alertBox = document.getElementById('registro-alert');

  if (!form || !titulo || !idField || !alertBox) return;

  // image management state
  let selectedImages = []; // data URLs for newly selected files
  let existingImages = []; // data URLs loaded from vehicle when editing
  const removedExisting = new Set();

  const imagenesInput = document.getElementById('imagenesInput');
  const imagenesPreview = document.getElementById('imagenesPreview');

  function mostrarAlerta(message, variant = 'error') {
    alertBox.textContent = message;
    alertBox.className = `form-alert ${variant === 'success' ? 'alert-success' : 'alert-error'}`;
  }

  function limpiarAlerta() {
    alertBox.textContent = '';
    alertBox.className = 'form-alert';
  }

  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('id');

  function renderPreview() {
    if (!imagenesPreview) return;
    imagenesPreview.innerHTML = '';

    // existing images first
    existingImages.forEach((src, idx) => {
      if (removedExisting.has(src)) return;
      const wrap = document.createElement('div');
      wrap.style.position = 'relative';
      wrap.style.display = 'inline-block';
      wrap.style.marginRight = '8px';

      const img = document.createElement('img');
      img.src = src;
      img.style.width = '96px';
      img.style.height = '64px';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '8px';
      wrap.appendChild(img);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = '✖';
      btn.title = 'Eliminar imagen';
      btn.style.position = 'absolute';
      btn.style.top = '4px';
      btn.style.right = '4px';
      btn.style.background = 'rgba(0,0,0,0.6)';
      btn.style.color = '#fff';
      btn.style.border = 'none';
      btn.style.borderRadius = '50%';
      btn.style.width = '22px';
      btn.style.height = '22px';
      btn.style.cursor = 'pointer';
      btn.addEventListener('click', () => {
        removedExisting.add(src);
        renderPreview();
      });
      wrap.appendChild(btn);
      imagenesPreview.appendChild(wrap);
    });

    // newly selected images
    selectedImages.forEach((dataUrl, idx) => {
      const wrap = document.createElement('div');
      wrap.style.position = 'relative';
      wrap.style.display = 'inline-block';
      wrap.style.marginRight = '8px';

      const img = document.createElement('img');
      img.src = dataUrl;
      img.style.width = '96px';
      img.style.height = '64px';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '8px';
      wrap.appendChild(img);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = '✖';
      btn.title = 'Eliminar imagen';
      btn.style.position = 'absolute';
      btn.style.top = '4px';
      btn.style.right = '4px';
      btn.style.background = 'rgba(0,0,0,0.6)';
      btn.style.color = '#fff';
      btn.style.border = 'none';
      btn.style.borderRadius = '50%';
      btn.style.width = '22px';
      btn.style.height = '22px';
      btn.style.cursor = 'pointer';
      btn.addEventListener('click', () => {
        selectedImages.splice(idx, 1);
        renderPreview();
      });
      wrap.appendChild(btn);
      imagenesPreview.appendChild(wrap);
    });
  }

  if (editId) {
    titulo.textContent = 'Editar vehículo';
    try {
      const vehiculo = getVehiculoById(editId);
      if (!vehiculo) {
        mostrarAlerta('No se encontró el vehículo a editar. Puedes crear uno nuevo.', 'error');
      } else {
        idField.value = vehiculo.id;
        document.getElementById('placa').value = vehiculo.placa || '';
        document.getElementById('marca').value = vehiculo.marca || '';
        document.getElementById('modelo').value = vehiculo.modelo || '';
        document.getElementById('anio').value = vehiculo.anio || '';
        document.getElementById('color').value = vehiculo.color || '';
        document.getElementById('tipo').value = vehiculo.tipo || 'Automovil';
        document.getElementById('propietario').value = vehiculo.propietario || '';
        document.getElementById('documento').value = vehiculo.documento || '';
        // split telefono into prefix and number when possible
        if (vehiculo.telefono) {
          const parts = String(vehiculo.telefono).split(/\s+/, 2);
          const prefix = parts[0] && parts[0].startsWith('+') ? parts[0] : '+503';
          const number = parts.slice(1).join(' ') || parts[1] || '';
          const prefixEl = document.getElementById('phonePrefix');
          const numberEl = document.getElementById('telefonoNumber');
          if (prefixEl) prefixEl.value = prefix;
          if (numberEl) numberEl.value = number || vehiculo.telefono;
        }
        document.getElementById('correo').value = vehiculo.correo || '';
        document.getElementById('estado').value = vehiculo.estado || 'Pendiente';
        document.getElementById('categoria').value = vehiculo.categoria || 'Particular';
        document.getElementById('poliza').value = vehiculo.poliza || '';
        document.getElementById('revision').value = vehiculo.revision || '';
        document.getElementById('observaciones').value = vehiculo.observaciones || '';

        // prepare existing images
        existingImages = Array.isArray(vehiculo.images) ? vehiculo.images.slice() : [];
        renderPreview();
      }
    } catch (error) {
      console.error('Error cargando vehículo:', error);
      mostrarAlerta('Ocurrió un error al cargar los datos del vehículo.', 'error');
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    limpiarAlerta();

    const placa = document.getElementById('placa').value.trim();
    const marca = document.getElementById('marca').value.trim();
    const modelo = document.getElementById('modelo').value.trim();
    const anio = document.getElementById('anio').value.trim();
    const propietario = document.getElementById('propietario').value.trim();
    const estado = document.getElementById('estado').value;
    const documento = document.getElementById('documento').value.trim();
    const phonePrefix = document.getElementById('phonePrefix') ? document.getElementById('phonePrefix').value.trim() : '';
    const telefonoNumber = document.getElementById('telefonoNumber') ? document.getElementById('telefonoNumber').value.trim() : '';
    const correo = document.getElementById('correo').value.trim();
    const poliza = document.getElementById('poliza').value.trim();
    const revision = document.getElementById('revision').value.trim();
    const observaciones = document.getElementById('observaciones').value.trim();

    // Validar que todos los campos esten completos
    if (!placa || !marca || !modelo || !anio || !propietario || !documento || !phonePrefix || !telefonoNumber || !correo || !poliza || !revision) {
      mostrarAlerta('Completa todos los campos obligatorios antes de guardar.', 'error');
      return;
    }

    const anioNum = parseInt(anio, 10);
    const currentYear = new Date().getFullYear();
    if (isNaN(anioNum) || anioNum < 1900 || anioNum > currentYear + 1) {
      mostrarAlerta(`Año inválido. Ingrese un año entre 1900 y ${currentYear + 1}.`, 'error');
      return;
    }

    const vehiculo = {
      id: idField.value ? parseInt(idField.value, 10) : null,
      placa,
      marca,
      modelo,
      anio: anioNum,
      color: document.getElementById('color').value.trim(),
      tipo: document.getElementById('tipo').value,
      propietario,
      documento: document.getElementById('documento').value.trim(),
      telefono: `${phonePrefix} ${telefonoNumber}`,
      correo: correo,
      estado,
      categoria: document.getElementById('categoria').value,
      poliza: document.getElementById('poliza').value.trim(),
      revision: document.getElementById('revision').value.trim(),
      observaciones: document.getElementById('observaciones').value.trim(),
      fechaRegistro: new Date().toISOString(),
      images: []
    };

    // build final images array: existing (except removed) + newly selected
    const keptExisting = existingImages.filter(src => !removedExisting.has(src));
    const newImages = selectedImages.slice();
    const finalImages = keptExisting.concat(newImages);

    if (finalImages.length === 0) {
      // allow saving without images for debugging, but ask confirmation
      const saveWithoutImages = confirm('No ha adjuntado imágenes. ¿Desea guardar el registro de todos modos?');
      if (!saveWithoutImages) {
        mostrarAlerta('Adjunta al menos una imagen del vehículo o confirma guardar sin imágenes.', 'error');
        return;
      }
    }

    vehiculo.images = finalImages;

    try {
      console.log('[autoreg] registro submit - saving vehiculo:', vehiculo);
      const saved = guardarVehiculo(vehiculo);
      console.log('[autoreg] registro saved:', saved);
      mostrarAlerta('Vehículo guardado correctamente.', 'success');
      setTimeout(() => window.location.href = 'vehiculos.html', 700);
    } catch (error) {
      console.error('[autoreg] Error al guardar:', error);
      mostrarAlerta(`Ocurrió un error al guardar el vehículo. ${error?.message || 'Intenta nuevamente.'}`, 'error');
    }
  });

  form.addEventListener('reset', () => {
    limpiarAlerta();
    selectedImages = [];
    existingImages = [];
    removedExisting.clear();
    if (imagenesPreview) imagenesPreview.innerHTML = '';
  });

  // preview de imágenes al seleccionar (append mode)
  if (imagenesInput) {
    imagenesInput.addEventListener('change', async () => {
      const files = Array.from(imagenesInput.files || []).slice(0, 8 - selectedImages.length);
      for (const file of files) {
        try {
          // resize before storing to keep localStorage reasonable; force JPEG output
          const resized = await resizeImage(file, 1200, 800, 0.75);
          if (resized) selectedImages.push(resized);
        } catch (err) {
          console.warn('No se pudo redimensionar imagen, usando original', err);
          // fallback to original data URL
          const fr = await new Promise((res, rej) => {
            const r = new FileReader();
            r.onload = () => res(r.result);
            r.onerror = () => rej(new Error('Error leyendo archivo'));
            r.readAsDataURL(file);
          });
          if (fr) selectedImages.push(fr);
        }
        renderPreview();
      }
      // clear native file input so same file can be reselected if needed
      imagenesInput.value = '';
    });
  }

  // initialize preview
  renderPreview();
});
