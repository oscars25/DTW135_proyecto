// assets/js/index.js
// Muestra métricas reales basadas en los registros guardados en localStorage.

document.addEventListener('DOMContentLoaded', () => {
  const heroValues = document.querySelectorAll('.hero-meta strong');
  const heroLabels = document.querySelectorAll('.hero-meta span');
  const summaryNew = document.getElementById('newVehicles');
  const summaryReview = document.getElementById('inReview');
  const summaryObserved = document.getElementById('observedSummary');
  const completitudPct = document.getElementById('completitudPct');
  const completitudBar = document.getElementById('completitudBar');
  const validacionPct = document.getElementById('validacionPct');
  const validacionBar = document.getElementById('validacionBar');

  const counts = getEstadoCounts();
  const total = counts.total || 0;
  const aprobado = counts.aprobado || 0;
  const revision = counts.revision || 0;
  const observado = counts.observado || 0;
  const bloqueado = counts.bloqueado || 0;

  if (heroValues.length >= 3) {
    heroValues[0].textContent = total;
    heroValues[1].textContent = revision;
    heroValues[2].textContent = observado;
  }

  if (heroLabels.length >= 3) {
    heroLabels[0].textContent = 'Vehículos registrados';
    heroLabels[1].textContent = 'En revisión';
    heroLabels[2].textContent = 'Observados';
  }

  if (summaryNew) summaryNew.textContent = total;
  if (summaryReview) summaryReview.textContent = revision;
  if (summaryObserved) summaryObserved.textContent = observado;

  const completitud = total ? Math.round((aprobado / total) * 100) : 0;
  const validacion = total ? Math.round(((aprobado + revision) / total) * 100) : 0;

  if (completitudPct) completitudPct.textContent = `${completitud}%`;
  if (completitudBar) completitudBar.style.width = `${completitud}%`;
  if (validacionPct) validacionPct.textContent = `${validacion}%`;
  if (validacionBar) validacionBar.style.width = `${validacion}%`;
});
