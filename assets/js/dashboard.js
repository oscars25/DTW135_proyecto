// assets/js/dashboard.js
let worker;

function isLocalStorageAvailable() {
  try {
    const key = '__autoreg_storage_test__';
    localStorage.setItem(key, key);
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    return false;
  }
}

function actualizarDashboard() {
  const vehiculos = typeof getVehiculos === 'function' ? getVehiculos() : [];
  const totalRegistrosEl = document.getElementById('totalRegistros');
  const aprobadosEl = document.getElementById('aprobados');
  const pendientesEl = document.getElementById('pendientes');
  const observadosEl = document.getElementById('observados');
  const bloqueadosEl = document.getElementById('bloqueados');
  const donutCenterPercent = document.getElementById('donut-center-percent');
  const donutCenterLabel = document.getElementById('donut-center-label');
  const legendApproved = document.getElementById('legend-approved-pct');
  const legendReview = document.getElementById('legend-review-pct');
  const legendWarning = document.getElementById('legend-warning-pct');

  const contador = getEstadoCounts();
  const total = contador.total || 0;
  const aprobado = contador.aprobado;
  const pendiente = contador.pendiente;
  const observado = contador.observado;
  const bloqueado = contador.bloqueado || 0;

  const capacityTotalPct = document.getElementById('capacityTotalPct');
  const capacityTotalBar = document.getElementById('capacityTotalBar');
  const capacityDocPct = document.getElementById('capacityDocPct');
  const capacityDocBar = document.getElementById('capacityDocBar');
  const capacityResolvePct = document.getElementById('capacityResolvePct');
  const capacityResolveBar = document.getElementById('capacityResolveBar');
  const recentActivityList = document.getElementById('recentActivityList');
  const storageStatusEl = document.getElementById('storageStatus');

  if (totalRegistrosEl) totalRegistrosEl.textContent = total;
  if (aprobadosEl) aprobadosEl.textContent = aprobado;
  if (pendientesEl) pendientesEl.textContent = pendiente;
  if (observadosEl) observadosEl.textContent = observado;
  if (bloqueadosEl) bloqueadosEl.textContent = bloqueado;

  const aprobadoPct = total ? Math.round((aprobado / total) * 100) : 0;
  const reviewPct = total ? Math.round((contador.revision / total) * 100) : 0;
  const warningPct = total ? Math.round((observado / total) * 100) : 0;
  const capacityDocValue = total ? Math.round(((aprobado + contador.revision) / total) * 100) : 0;
  const capacityResolveValue = total ? Math.round((observado / total) * 100) : 0;
  const capacityTotalValue = total ? 100 : 0;

  if (donutCenterPercent) donutCenterPercent.textContent = `${aprobadoPct}%`;
  if (donutCenterLabel) donutCenterLabel.textContent = total ? 'Aprobados' : 'Sin datos';
  if (legendApproved) legendApproved.textContent = `${aprobadoPct}%`;
  if (legendReview) legendReview.textContent = `${reviewPct}%`;
  if (legendWarning) legendWarning.textContent = `${warningPct}%`;

  if (capacityTotalPct) capacityTotalPct.textContent = `${capacityTotalValue}%`;
  if (capacityTotalBar) capacityTotalBar.style.width = `${capacityTotalValue}%`;
  if (capacityDocPct) capacityDocPct.textContent = `${capacityDocValue}%`;
  if (capacityDocBar) capacityDocBar.style.width = `${capacityDocValue}%`;
  if (capacityResolvePct) capacityResolvePct.textContent = `${capacityResolveValue}%`;
  if (capacityResolveBar) capacityResolveBar.style.width = `${capacityResolveValue}%`;

  if (storageStatusEl) {
    const available = isLocalStorageAvailable();
    const rawStorage = available ? localStorage.getItem('autoreg_vehiculos') : null;
    if (!available) {
      storageStatusEl.textContent = 'localStorage no disponible o bloqueado. Abre el proyecto desde un servidor local para compartir datos entre páginas.';
    } else if (!rawStorage) {
      storageStatusEl.textContent = 'No se han guardado registros aún. Usa la página de registro para capturar datos reales.';
    } else if (vehiculos.length === 0) {
      storageStatusEl.textContent = 'Se encontró storage, pero no se pudieron interpretar registros. Revisa los datos crudos o recarga la página.';
    } else {
      storageStatusEl.textContent = `Se cargaron ${vehiculos.length} registros reales desde almacenamiento.`;
    }
    if (window.location.protocol === 'file:' && available) {
      storageStatusEl.textContent += ' (Estás usando file://; localStorage puede estar aislado entre archivos.)';
    }
  }

  if (recentActivityList) {
    const latest = getVehiculos().slice().sort((a, b) => {
      const fechaA = new Date(a.fechaRegistro || a.creadoEn || 0).getTime();
      const fechaB = new Date(b.fechaRegistro || b.creadoEn || 0).getTime();
      return fechaB - fechaA;
    }).slice(0, 3);

    recentActivityList.innerHTML = '';

    if (latest.length === 0) {
      recentActivityList.innerHTML = '<div>No hay actividad reciente</div>';
    } else {
      latest.forEach(v => {
        const estado = (v.estado || 'Sin estado').toLowerCase();
        let description = 'Registro actualizado recientemente.';

        if (estado.includes('aprob')) {
          description = 'Vehículo aprobado y listo para operar.';
        } else if (estado.includes('pend')) {
          description = 'Registro pendiente de validación.';
        } else if (estado.includes('observ')) {
          description = 'Observado por inconsistencias en documentos.';
        } else if (estado.includes('bloque')) {
          description = 'Registro bloqueado para revisión adicional.';
        }

        const item = document.createElement('div');
        item.innerHTML = `
          <strong>${v.placa || 'Sin placa'}</strong>
          <p>${description}</p>
        `;
        recentActivityList.appendChild(item);
      });
    }
  }

  if (worker) {
    worker.postMessage(getVehiculos());
  }
}

function cargarDatosDemo() {
  const datosDemo = [
    {
      id: Date.now(),
      placa: 'ABC-001',
      marca: 'Toyota',
      modelo: 'Corolla',
      anio: 2023,
      color: 'Gris',
      tipo: 'Automovil',
      propietario: 'Juan García',
      documento: '12345678-A',
      telefono: '+503 7123 4567',
      correo: 'juan@example.com',
      estado: 'Aprobado',
      categoria: 'Particular',
      poliza: 'POL-2023-001',
      revision: 'Vigente',
      observaciones: 'Vehículo en excelente estado',
      fechaRegistro: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      images: []
    },
    {
      id: Date.now() + 1,
      placa: 'XYZ-234',
      marca: 'Honda',
      modelo: 'Civic',
      anio: 2022,
      color: 'Negro',
      tipo: 'Automovil',
      propietario: 'María López',
      documento: '87654321-B',
      telefono: '+503 7654 3210',
      correo: 'maria@example.com',
      estado: 'Pendiente',
      categoria: 'Particular',
      poliza: 'POL-2023-002',
      revision: 'Vigente',
      observaciones: 'En espera de documentación',
      fechaRegistro: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      images: []
    },
    {
      id: Date.now() + 2,
      placa: 'DEF-567',
      marca: 'Nissan',
      modelo: 'Altima',
      anio: 2024,
      color: 'Blanco',
      tipo: 'Automovil',
      propietario: 'Carlos Rodríguez',
      documento: '11223344-C',
      telefono: '+503 7890 1234',
      correo: 'carlos@example.com',
      estado: 'Observado',
      categoria: 'Comercial',
      poliza: 'POL-2023-003',
      revision: 'Vigente',
      observaciones: 'Requiere ajuste en documentación',
      fechaRegistro: new Date().toISOString(),
      images: []
    }
  ];
  try {
    saveVehiculos(datosDemo);
    console.log('[autoreg] Datos de demostración cargados');
    forceRefreshDashboard();
    showToast('Datos de demostración cargados. El dashboard ahora muestra la visión general del sistema.', 5000);
  } catch (err) {
    console.error('[autoreg] Error al cargar datos demo:', err);
    showToast('Error al cargar datos de demostración', 3000);
  }
}


function showToast(message, ms = 2800, actionLabel = '', actionCallback = null) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const t = document.createElement('div');
  t.className = 'toast';

  const text = document.createElement('div');
  text.textContent = message;
  t.appendChild(text);

  if (actionLabel && typeof actionCallback === 'function') {
    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'toast-action';
    action.textContent = actionLabel;
    action.addEventListener('click', () => {
      actionCallback();
      t.classList.remove('show');
      setTimeout(() => container.removeChild(t), 260);
    });
    t.appendChild(action);
  }

  container.appendChild(t);
  // trigger show transition
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => {
      if (container.contains(t)) container.removeChild(t);
    }, 260);
  }, ms);
}

function populateStorageDebug() {
  const debugEl = document.getElementById('storageDebug');
  if (!debugEl) return;
  try {
    if (!isLocalStorageAvailable()) {
      debugEl.textContent = 'localStorage no disponible o bloqueado. Abre el proyecto desde un servidor local.';
      return;
    }
    const raw = localStorage.getItem('autoreg_vehiculos');
    if (!raw) {
      debugEl.textContent = 'localStorage key `autoreg_vehiculos` no encontrada.';
      return;
    }
    const parsed = JSON.parse(raw);
    debugEl.textContent = JSON.stringify(parsed, null, 2);
  } catch (err) {
    debugEl.textContent = `Error parseando storage: ${err.message}`;
  }
}

function getWeeklyTrendData() {
  const vehiculos = getVehiculos();
  const now = new Date();
  const labels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const trend = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    day.setDate(now.getDate() - (6 - index));
    return {
      date: day,
      label: labels[day.getDay()],
      count: 0
    };
  });

  vehiculos.forEach((vehiculo) => {
    const fechaRaw = vehiculo.fechaRegistro || vehiculo.creadoEn;
    if (!fechaRaw) return;

    const fecha = new Date(fechaRaw);
    if (Number.isNaN(fecha.getTime())) return;
    fecha.setHours(0, 0, 0, 0);

    trend.forEach((day) => {
      if (fecha.getTime() === day.date.getTime()) {
        day.count += 1;
      }
    });
  });

  return trend;
}

function renderWeeklyTrend() {
  const weeklyTrendBars = document.getElementById('weeklyTrendBars');
  if (!weeklyTrendBars) return;

  const trend = getWeeklyTrendData();
  const maxCount = Math.max(...trend.map(day => day.count), 1);
  weeklyTrendBars.innerHTML = '';

  trend.forEach((day) => {
    const heightPct = maxCount > 0 ? Math.round((day.count / maxCount) * 100) : 0;
    const row = document.createElement('div');
    row.className = 'bar-row bar-vertical';
    row.innerHTML = `
      <span>${day.label}</span>
      <div class="bar"><i style="height:${heightPct}%"></i></div>
      <strong>${day.count}</strong>
    `;
    weeklyTrendBars.appendChild(row);
  });
}

function obtenerUbicacionYClima() {
  const climaEl = document.getElementById('clima');

  if (!climaEl) return;

  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const temp = data.current_weather?.temperature;
        climaEl.innerHTML = temp !== undefined
          ? `🌡️ Temperatura actual: ${temp}°C (Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)})`
          : '📍 No se pudo obtener la temperatura actual';
      } catch (error) {
        climaEl.innerHTML = '❌ No se pudo obtener clima';
        console.error('Error consumiendo API de clima:', error);
      }
    }, (error) => {
      climaEl.innerHTML = error.code === 1
        ? '📍 Permiso de ubicación denegado'
        : '📍 No se pudo obtener la ubicación';
    });
  } else {
    climaEl.innerHTML = '🌐 Geolocalización no soportada';
  }
}

function renderUltimosRegistros() {
  const tbody = document.getElementById('latestRecordsBody');
  if (!tbody) return;

  const vehiculos = getVehiculos();
  const ordenados = vehiculos.slice().sort((a, b) => {
    const fechaA = new Date(a.fechaRegistro || a.creadoEn || 0).getTime();
    const fechaB = new Date(b.fechaRegistro || b.creadoEn || 0).getTime();
    return fechaB - fechaA;
  }).slice(0, 5);

  tbody.innerHTML = '';

  if (ordenados.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5">No hay vehículos registrados</td></tr>';
    return;
  }

  ordenados.forEach(v => {
    const row = tbody.insertRow();
    const fecha = (v.fechaRegistro || v.creadoEn) ? new Date(v.fechaRegistro || v.creadoEn).toLocaleDateString('es-ES') : 'Sin fecha';
    const estadoClass = v.estado ? v.estado.toLowerCase().replace(/\s+/g, '-') : '';

    row.innerHTML = `
      <td>${v.placa || ''}</td>
      <td>${v.marca || ''}</td>
      <td>${v.modelo || ''}</td>
      <td><span class="table-badge ${estadoClass}">${v.estado || 'Sin estado'}</span></td>
      <td>${fecha}</td>
    `;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.Worker) {
    worker = new Worker('../assets/js/worker.js');
    worker.onmessage = (e) => {
      const workerStatsEl = document.getElementById('workerStats');
      if (workerStatsEl) {
        workerStatsEl.innerHTML = `📊 Procesado por Worker: Total ${e.data.total} | Pendientes ${e.data.pendiente} | Aprobados ${e.data.aprobado} | Observados ${e.data.observado} | Bloqueados ${e.data.bloqueado || 0}`;
      }
    };
  } else {
    const workerStatsEl = document.getElementById('workerStats');
    if (workerStatsEl) workerStatsEl.textContent = 'Worker no soportado';
  }

  // Listen for BroadcastChannel updates from other tabs/pages
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('autoreg_channel');
      bc.onmessage = (msg) => {
        if (msg?.data?.type === 'vehiculos:update') {
          forceRefreshDashboard();
          const storageStatusEl = document.getElementById('storageStatus');
          if (storageStatusEl) storageStatusEl.textContent = 'Datos actualizados en otra ventana, cargando...';
          showToast('Datos actualizados desde otra ventana', 3800, 'Ver registros', () => window.location.href = 'vehiculos.html');
        }
      };
    }
  } catch (e) {
    console.warn('BroadcastChannel not available', e);
  }

  window.actualizarDashboard = actualizarDashboard;
  actualizarDashboard();
  renderUltimosRegistros();
  renderWeeklyTrend();
  obtenerUbicacionYClima();
  const refreshBtn = document.getElementById('refreshDashboardBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      forceRefreshDashboard();
      refreshBtn.textContent = 'Actualizado';
      showToast('Dashboard actualizado', 2800, 'Ver registros', () => window.location.href = 'vehiculos.html');
      setTimeout(() => { refreshBtn.textContent = 'Actualizar datos'; }, 1200);
    });
  }
  const toggleRaw = document.getElementById('toggleRawBtn');
  if (toggleRaw) {
    toggleRaw.addEventListener('click', () => {
      const debugEl = document.getElementById('storageDebug');
      if (!debugEl) return;
      if (debugEl.style.display === 'none' || debugEl.style.display === '') {
        populateStorageDebug();
        debugEl.style.display = 'block';
        toggleRaw.textContent = 'Ocultar datos crudos';
      } else {
        debugEl.style.display = 'none';
        toggleRaw.textContent = 'Mostrar datos crudos';
      }
    });
  }
  
  // Demo data button
  const demoBtnContainer = document.getElementById('storageStatus')?.parentElement;
  if (demoBtnContainer && !document.getElementById('demoBtnCreated')) {
    const demoBtn = document.createElement('button');
    demoBtn.id = 'demoBtnCreated';
    demoBtn.className = 'button button-secondary';
    demoBtn.type = 'button';
    demoBtn.textContent = 'Cargar datos de demostración';
    demoBtn.style.marginTop = '12px';
    demoBtn.addEventListener('click', cargarDatosDemo);
    demoBtnContainer.appendChild(demoBtn);
  }
  
window.addEventListener('storage', () => {
    actualizarDashboard();
    renderUltimosRegistros();
    renderWeeklyTrend();
  });
  // polling to keep dashboard updated in (near) real-time
  setInterval(() => {
    actualizarDashboard();
    renderUltimosRegistros();
    renderWeeklyTrend();
  }, 2000);
});
