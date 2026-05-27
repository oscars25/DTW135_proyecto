// assets/js/vehiculos.js
// Renderiza la tabla de vehículos, permite eliminar y editar.

function renderizarTabla(filtro = '') {
  const vehiculos = getVehiculos();
  const tbody = document.getElementById('vehiculosTableBody');
  if (!tbody) return;

  const criterio = filtro.trim().toLowerCase();
  const lista = criterio
    ? vehiculos.filter(v => (v.placa || '').toLowerCase().includes(criterio))
    : vehiculos;

  tbody.innerHTML = '';

  if (lista.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7">No hay vehículos registrados</td></tr>';
    return;
  }

  lista.forEach(v => {
    const row = tbody.insertRow();
    const estadoClass = v.estado ? v.estado.toLowerCase().replace(/\s+/g, '-') : '';
    row.innerHTML = `
      <td>${v.placa || ''}</td>
      <td>${v.marca || ''}</td>
      <td>${v.modelo || ''}</td>
      <td>${v.anio || ''}</td>
      <td>${v.propietario || ''}</td>
      <td><span class="estado-badge ${estadoClass}">${v.estado || 'Sin estado'}</span></td>
      <td>
        <button class="btn-editar button button-secondary" data-id="${v.id}">✏️ Editar</button>
        <button class="btn-eliminar button button-secondary" data-id="${v.id}">🗑️ Eliminar</button>
      </td>
    `;
  });

  attachRowActions();
}

function attachRowActions() {
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

  if (filtroInput) {
    filtroInput.value = filtroGuardado;
    filtroInput.addEventListener('input', aplicarFiltro);
  }

  renderizarTabla(filtroGuardado);
});
