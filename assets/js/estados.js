// assets/js/estados.js
// Actualiza los totales de estados en la página de estados.

function actualizarEstadoPage() {
  const totalEl = document.getElementById('estadoTotal');
  const totalText = document.getElementById('estadoTotalText');
  const aprobadoEl = document.getElementById('estadoAprobado');
  const revisionEl = document.getElementById('estadoRevision');
  const observadoEl = document.getElementById('estadoObservado');

  const estados = getEstadoCounts();
  const total = estados.total || 0;

  if (totalEl) totalEl.textContent = total;
  if (aprobadoEl) aprobadoEl.textContent = estados.aprobado || 0;
  if (revisionEl) revisionEl.textContent = estados.revision || 0;
  if (observadoEl) observadoEl.textContent = estados.observado || 0;
  if (totalText) {
    totalText.textContent = total
      ? `Hay ${total} vehículos registrados en el sistema.`
      : 'No hay registros de vehículos en este momento.';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  actualizarEstadoPage();
  window.addEventListener('storage', actualizarEstadoPage);
});
