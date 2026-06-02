/**
 * Procesador de Datos en Segundo Plano
 * Libera al hilo principal de tareas de cálculo intensivo.
 */

self.addEventListener('message', (e) => {
  const vehiculos = e.data;

  const check = (estado, busqueda) => {
    const e = String(estado || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const b = busqueda.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return e.includes(b);
  };

  const conteo = {
    total: vehiculos.length,
    pendiente: vehiculos.filter(v => check(v.estado, 'pend')).length,
    revision: vehiculos.filter(v => check(v.estado, 'revis')).length,
    aprobado: vehiculos.filter(v => check(v.estado, 'aprob')).length,
    observado: vehiculos.filter(v => check(v.estado, 'observ')).length,
    bloqueado: vehiculos.filter(v => check(v.estado, 'bloque')).length
  };

  self.postMessage(conteo);
});