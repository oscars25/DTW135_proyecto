// assets/js/worker.js
self.addEventListener('message', (e) => {
  const vehiculos = e.data;

  // Procesar datos: contar por estado
  const conteo = {
    total: vehiculos.length,
    pendiente: vehiculos.filter(v => v.estado === 'Pendiente').length,
    aprobado: vehiculos.filter(v => v.estado === 'Aprobado').length,
    observado: vehiculos.filter(v => v.estado === 'Observado').length,
    bloqueado: vehiculos.filter(v => v.estado === 'Bloqueado').length
  };

  // Simular proceso pesado (opcional, para demostrar worker)
  for (let i = 0; i < 1000000; i++) {}

  self.postMessage(conteo);
});