/**
 * Controlador de la Vista Principal (Home)
 * 
 * Gestiona la sincronización de las métricas de alto nivel mostradas en el Hero
 * y los paneles de resumen basados en los datos persistidos.
 */

function actualizarMétricasInicio() {
  const heroValues = document.querySelectorAll('.hero-meta strong');
  const heroLabels = document.querySelectorAll('.hero-meta span');
  const summaryNew = document.getElementById('newVehicles');
  const summaryReview = document.getElementById('inReview');
  const summaryObserved = document.getElementById('observedSummary');
  const summaryApproved = document.getElementById('approvedSummary');
  const summaryBlocked = document.getElementById('blockedSummary');
  const summaryPending = document.getElementById('pendingSummary');
  const completitudPct = document.getElementById('completitudPct');
  const completitudBar = document.getElementById('completitudBar');
  const validacionPct = document.getElementById('validacionPct');
  const validacionBar = document.getElementById('validacionBar');

  const counts = getEstadoCounts();
  const total = counts.total || 0;
  const aprobado = counts.aprobado || 0;
  const pendiente = counts.pendiente || 0;
  const revision = counts.revision || 0;
  const observado = counts.observado || 0;
  const bloqueado = counts.bloqueado || 0;

  const metrics = [
    { val: total, label: 'Vehículos registrados' },
    { val: aprobado, label: 'Aprobados' },
    { val: pendiente, label: 'Pendientes' },
    { val: revision, label: 'En revisión' },
    { val: observado, label: 'Observados' },
    { val: bloqueado, label: 'Bloqueados' }
  ];

  const metricsMap = {
    'Vehículos registrados': total,
    'Aprobados': aprobado,
    'Pendientes': pendiente,
    'En revisión': revision,
    'Observados': observado,
    'Bloqueados': bloqueado
  };

  heroValues.forEach((el, index) => {
    const label = heroLabels[index]?.textContent?.trim();
    if (metricsMap[label] !== undefined) {
      el.textContent = metricsMap[label];
    }
  });

  try {
    if (summaryNew) summaryNew.textContent = total;
    if (summaryReview) summaryReview.textContent = revision;
    if (summaryObserved) summaryObserved.textContent = observado;
    if (summaryApproved) summaryApproved.textContent = aprobado;
    if (summaryBlocked) summaryBlocked.textContent = bloqueado;
    if (summaryPending) summaryPending.textContent = pendiente;
  } catch (e) { console.warn("Error actualizando etiquetas de resumen"); }

  const completitud = total ? Math.round((aprobado / total) * 100) : 0;
  const validacion = total ? Math.round(((aprobado + revision) / total) * 100) : 0;

  if (completitudPct) completitudPct.textContent = `${completitud}%`;
  if (completitudBar) completitudBar.style.width = `${completitud}%`;
  if (validacionPct) validacionPct.textContent = `${validacion}%`;
  if (validacionBar) validacionBar.style.width = `${validacion}%`;
}

document.addEventListener('DOMContentLoaded', () => {
  actualizarMétricasInicio();

  window.addEventListener('storage', (e) => {
    if (e.key === 'autoreg_vehiculos') {
      actualizarMétricasInicio();
    }
  });
});
