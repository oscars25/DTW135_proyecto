// assets/js/vehiculos.js
// Renderiza la tabla de vehículos, permite ver registro, editar, eliminar y exportar PDF.

let vehiculosFiltrados = [];
let vehiculoSeleccionadoId = null;

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(dateValue) {
  if (!dateValue) return 'Sin fecha';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';
  return date.toLocaleString('es-SV', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function estadoClassName(estado) {
  return estado ? estado.toLowerCase().replace(/\s+/g, '-') : '';
}

function getListaFiltrada(filtro = '') {
  const vehiculos = getVehiculos();
  const criterio = filtro.trim().toLowerCase();
  return criterio
    ? vehiculos.filter(v => (v.placa || '').toLowerCase().includes(criterio))
    : vehiculos;
}

function renderizarTabla(filtro = '') {
  const tbody = document.getElementById('vehiculosTableBody');
  if (!tbody) return;

  vehiculosFiltrados = getListaFiltrada(filtro);
  tbody.innerHTML = '';

  if (vehiculosFiltrados.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8">No hay vehículos registrados</td></tr>';
    ocultarDetalle();
    return;
  }

  vehiculosFiltrados.forEach(v => {
    const row = tbody.insertRow();
    const estadoClass = estadoClassName(v.estado);
    row.innerHTML = `
      <td>${escapeHtml(v.placa)}</td>
      <td>${escapeHtml(v.marca)}</td>
      <td>${escapeHtml(v.modelo)}</td>
      <td>${escapeHtml(v.anio)}</td>
      <td>${escapeHtml(v.propietario)}</td>
      <td><span class="estado-badge ${estadoClass}">${escapeHtml(v.estado || 'Sin estado')}</span></td>
      <td>${escapeHtml(formatDate(v.fechaRegistro))}</td>
      <td class="table-actions">
        <button class="btn-ver button button-secondary" data-id="${v.id}" type="button">Ver registro</button>
        <button class="btn-pdf button button-secondary" data-id="${v.id}" type="button">PDF</button>
        <button class="btn-editar button button-secondary" data-id="${v.id}" type="button">Editar</button>
        <button class="btn-eliminar button button-secondary" data-id="${v.id}" type="button">Eliminar</button>
      </td>
    `;
  });

  attachRowActions();

  if (vehiculoSeleccionadoId) {
    const sigueVisible = vehiculosFiltrados.find(v => String(v.id) === String(vehiculoSeleccionadoId));
    if (sigueVisible) {
      mostrarDetalle(String(vehiculoSeleccionadoId));
    } else {
      ocultarDetalle();
    }
  }
}

function ensureJsPdf() {
  return window.jspdf && typeof window.jspdf.jsPDF === 'function';
}

function sanitizeFileName(value) {
  return String(value || 'registro')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '');
}

function exportarVehiculoPDF(vehiculo) {
  if (!vehiculo) return;
  if (!ensureJsPdf()) {
    alert('No se pudo cargar el generador PDF. Verifique conexión a internet e intente nuevamente.');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const fecha = formatDate(vehiculo.fechaRegistro);
  const estado = vehiculo.estado || 'Sin estado';

  doc.setFontSize(16);
  doc.text('Registro de vehículo', 14, 18);
  doc.setFontSize(10);
  doc.text(`Placa: ${vehiculo.placa || 'N/A'}`, 14, 26);
  doc.text(`Estado: ${estado}`, 14, 32);
  doc.text(`Fecha de registro: ${fecha}`, 14, 38);

  const rows = [
    ['Marca', vehiculo.marca || ''],
    ['Modelo', vehiculo.modelo || ''],
    ['Año', vehiculo.anio || ''],
    ['Color', vehiculo.color || ''],
    ['Tipo', vehiculo.tipo || ''],
    ['Propietario', vehiculo.propietario || ''],
    ['Documento', vehiculo.documento || ''],
    ['Teléfono', vehiculo.telefono || ''],
    ['Correo', vehiculo.correo || ''],
    ['Categoría', vehiculo.categoria || ''],
    ['Póliza', vehiculo.poliza || ''],
    ['Revisión técnica', vehiculo.revision || ''],
    ['Observaciones', vehiculo.observaciones || '']
  ];

  if (typeof doc.autoTable === 'function') {
    doc.autoTable({
      startY: 44,
      head: [['Campo', 'Valor']],
      body: rows,
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: [159, 107, 63] }
    });
  }

  const images = Array.isArray(vehiculo.images) ? vehiculo.images.slice(0, 2) : [];
  let currentY = (typeof doc.lastAutoTable !== 'undefined' && doc.lastAutoTable.finalY)
    ? doc.lastAutoTable.finalY + 8
    : 118;

  images.forEach((src, index) => {
    if (typeof src !== 'string' || !src.startsWith('data:image')) return;
    if (currentY > 240) {
      doc.addPage();
      currentY = 20;
    }
    doc.setFontSize(10);
    doc.text(`Imagen ${index + 1}`, 14, currentY);
    try {
      doc.addImage(src, 'JPEG', 14, currentY + 4, 80, 52);
      currentY += 62;
    } catch (error) {
      console.warn('No se pudo agregar una imagen al PDF:', error);
      currentY += 10;
    }
  });

  const placaFile = sanitizeFileName(vehiculo.placa || 'vehiculo');
  doc.save(`registro-${placaFile}.pdf`);
}

function exportarListadoPDF(lista) {
  if (!ensureJsPdf()) {
    alert('No se pudo cargar el generador PDF. Verifique conexión a internet e intente nuevamente.');
    return;
  }

  if (!Array.isArray(lista) || lista.length === 0) {
    alert('No hay registros para exportar.');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(16);
  doc.text('Listado de vehículos registrados', 14, 16);
  doc.setFontSize(10);
  doc.text(`Generado: ${formatDate(new Date().toISOString())}`, 14, 22);

  const body = lista.map(v => [
    v.placa || '',
    v.marca || '',
    v.modelo || '',
    v.anio || '',
    v.propietario || '',
    v.estado || 'Sin estado',
    formatDate(v.fechaRegistro)
  ]);

  if (typeof doc.autoTable === 'function') {
    doc.autoTable({
      startY: 28,
      head: [['Placa', 'Marca', 'Modelo', 'Año', 'Propietario', 'Estado', 'Registro']],
      body,
      styles: { fontSize: 8.8, cellPadding: 2 },
      headStyles: { fillColor: [159, 107, 63] }
    });
  }

  doc.save('vehiculos-listado.pdf');
}

function crearDetalleItem(label, value) {
  return `
    <article class="detail-item">
      <small>${escapeHtml(label)}</small>
      <strong>${escapeHtml(value || 'Sin dato')}</strong>
    </article>
  `;
}

function mostrarDetalle(id) {
  const card = document.getElementById('registroDetalleCard');
  const detalleGrid = document.getElementById('detalleGrid');
  const detalleMeta = document.getElementById('detalleMeta');
  const detalleEstado = document.getElementById('detalleEstado');
  const detalleImagenes = document.getElementById('detalleImagenes');

  if (!card || !detalleGrid || !detalleMeta || !detalleEstado || !detalleImagenes) return;

  const vehiculo = getVehiculoById(id);
  if (!vehiculo) {
    ocultarDetalle();
    return;
  }

  vehiculoSeleccionadoId = vehiculo.id;
  detalleEstado.className = `estado-badge ${estadoClassName(vehiculo.estado)}`;
  detalleEstado.textContent = vehiculo.estado || 'Sin estado';

  detalleMeta.innerHTML = `
    <h3>${escapeHtml(vehiculo.placa || 'Sin placa')} · ${escapeHtml(vehiculo.marca || 'Marca')} ${escapeHtml(vehiculo.modelo || '')}</h3>
    <p>Registrado el ${escapeHtml(formatDate(vehiculo.fechaRegistro))}</p>
  `;

  detalleGrid.innerHTML = [
    crearDetalleItem('Año', vehiculo.anio),
    crearDetalleItem('Color', vehiculo.color),
    crearDetalleItem('Tipo', vehiculo.tipo),
    crearDetalleItem('Propietario', vehiculo.propietario),
    crearDetalleItem('Documento', vehiculo.documento),
    crearDetalleItem('Teléfono', vehiculo.telefono),
    crearDetalleItem('Correo', vehiculo.correo),
    crearDetalleItem('Categoría', vehiculo.categoria),
    crearDetalleItem('Póliza', vehiculo.poliza),
    crearDetalleItem('Revisión técnica', vehiculo.revision),
    crearDetalleItem('Observaciones', vehiculo.observaciones)
  ].join('');

  const images = Array.isArray(vehiculo.images) ? vehiculo.images : [];
  if (images.length > 0) {
    detalleImagenes.innerHTML = images.map((src, idx) => `
      <figure class="detail-image-card">
        <img src="${src}" alt="Imagen ${idx + 1} de ${escapeHtml(vehiculo.placa || 'vehículo')}" loading="lazy">
        <figcaption>Imagen ${idx + 1}</figcaption>
      </figure>
    `).join('');
  } else {
    detalleImagenes.innerHTML = '<p class="detail-no-images">Este registro no tiene imágenes adjuntas.</p>';
  }

  const exportarDetalleBtn = document.getElementById('exportarDetalleBtn');
  const editarDetalleBtn = document.getElementById('editarDetalleBtn');

  if (exportarDetalleBtn) {
    exportarDetalleBtn.onclick = () => exportarVehiculoPDF(vehiculo);
  }

  if (editarDetalleBtn) {
    editarDetalleBtn.onclick = () => {
      window.location.href = `registro.html?id=${vehiculo.id}`;
    };
  }

  card.hidden = false;
  card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function ocultarDetalle() {
  vehiculoSeleccionadoId = null;
  const card = document.getElementById('registroDetalleCard');
  if (card) card.hidden = true;
}

function attachRowActions() {
  document.querySelectorAll('.btn-ver').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      mostrarDetalle(id);
    });
  });

  document.querySelectorAll('.btn-pdf').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const vehiculo = getVehiculoById(id);
      exportarVehiculoPDF(vehiculo);
    });
  });

  document.querySelectorAll('.btn-editar').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      window.location.href = `registro.html?id=${id}`;
    });
  });

  document.querySelectorAll('.btn-eliminar').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      if (confirm('¿Eliminar este vehículo?')) {
        try {
          eliminarVehiculo(id);
          const filtro = document.getElementById('filtroPlaca')?.value || '';
          renderizarTabla(filtro);
          if (typeof actualizarDashboard === 'function') actualizarDashboard();
        } catch (error) {
          console.error('Error al eliminar vehículo:', error);
          alert('Error al eliminar el vehículo. Intente nuevamente.');
        }
      }
    });
  });
}

function aplicarFiltro() {
  const filtro = document.getElementById('filtroPlaca')?.value || '';
  guardarFiltroSession(filtro);
  renderizarTabla(filtro);
}

document.addEventListener('DOMContentLoaded', () => {
  const filtroInput = document.getElementById('filtroPlaca');
  const filtroGuardado = obtenerFiltroSession();
  const exportarListadoBtn = document.getElementById('exportarListadoBtn');
  const cerrarDetalleBtn = document.getElementById('cerrarDetalleBtn');

  if (filtroInput) {
    filtroInput.value = filtroGuardado;
    filtroInput.addEventListener('input', aplicarFiltro);
  }

  if (exportarListadoBtn) {
    exportarListadoBtn.addEventListener('click', () => {
      exportarListadoPDF(vehiculosFiltrados);
    });
  }

  if (cerrarDetalleBtn) {
    cerrarDetalleBtn.addEventListener('click', ocultarDetalle);
  }

  renderizarTabla(filtroGuardado);
});
