/**
 * Controlador de la Vista de Estados
 * Actualiza los contadores detallados en la página específica de auditoría de estados.
 */

function actualizarEstadoPage() {
  const totalEl = document.getElementById('estadoTotal');
  const totalText = document.getElementById('estadoTotalText');
  const aprobadoEl = document.getElementById('estadoAprobado');
  const pendienteEl = document.getElementById('estadoPendiente');
  const revisionEl = document.getElementById('estadoRevision');
  const observadoEl = document.getElementById('estadoObservado');
  const bloqueadoEl = document.getElementById('estadoBloqueado');

  const estados = getEstadoCounts();
  const total = estados.total || 0;

  if (totalEl) totalEl.textContent = total;
  if (aprobadoEl) aprobadoEl.textContent = estados.aprobado || 0;
  if (pendienteEl) pendienteEl.textContent = estados.pendiente || 0;
  if (revisionEl) revisionEl.textContent = estados.revision || 0;
  if (observadoEl) observadoEl.textContent = estados.observado || 0;
  if (bloqueadoEl) bloqueadoEl.textContent = estados.bloqueado || 0;
  if (totalText) {
    totalText.textContent = total
      ? `Hay ${total} vehículos registrados en el sistema.`
      : 'No hay registros de vehículos en este momento.';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  actualizarEstadoPage();
  window.addEventListener('storage', actualizarEstadoPage);
  // Actualización periódica para asegurar sincronización en la pestaña actual
  setInterval(actualizarEstadoPage, 5000);
});
