/**
 * Controlador del Panel de Control (Dashboard)
 * Gestiona métricas en tiempo real, sincronización de la interfaz e integración con APIs externas.
 * Todas las funciones están encapsuladas para evitar contaminación global.
 */

(function() {
    // --- Variables privadas ---
    let worker = null;
    let updateInterval = null;
    let pendingTimeout = null;
    let isDemoDataLoaded = false;

    // --- Funciones auxiliares privadas ---

    /**
     * Escapa texto para prevenir XSS
     */
    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Verifica disponibilidad de localStorage
     */
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

    /**
     * Obtiene vehículos con validación de existencia de la función global
     */
    function safeGetVehiculos() {
        if (typeof getVehiculos === 'function') {
            return getVehiculos();
        }
        console.error('[Dashboard] getVehiculos no está definida');
        return [];
    }

    /**
     * Obtiene conteos con validación
     */
    function safeGetEstadoCounts() {
        if (typeof getEstadoCounts === 'function') {
            try {
                return getEstadoCounts();
            } catch (e) {
                console.error('[Dashboard] Error en getEstadoCounts:', e);
            }
        }
        return { total: 0, aprobado: 0, pendiente: 0, observado: 0, revision: 0, bloqueado: 0 };
    }

    /**
     * Guarda vehículos (si existe la función)
     */
    function safeSaveVehiculos(vehiculos) {
        if (typeof saveVehiculos === 'function') {
            return saveVehiculos(vehiculos);
        }
        console.error('[Dashboard] saveVehiculos no está definida');
        return false;
    }

    /**
     * Toast mejorado: crea el contenedor si no existe
     */
    function showToast(message, ms = 2800, actionLabel = '', actionCallback = null) {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.style.position = 'fixed';
            container.style.bottom = '20px';
            container.style.right = '20px';
            container.style.zIndex = '9999';
            document.body.appendChild(container);
        }

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
        requestAnimationFrame(() => t.classList.add('show'));
        setTimeout(() => {
            t.classList.remove('show');
            setTimeout(() => {
                if (container.contains(t)) container.removeChild(t);
            }, 260);
        }, ms);
    }

    // --- Funciones principales del dashboard ---

    function renderUltimosRegistros() {
        const tbody = document.getElementById('latestRecordsBody');
        if (!tbody) return;

        const vehiculos = safeGetVehiculos();
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

            const status = (v.estado || '').toLowerCase();
            let estadoClass = '';
            if (status.includes('aprob')) estadoClass = 'approved';
            else if (status.includes('pend')) estadoClass = 'pending';
            else if (status.includes('revis')) estadoClass = 'review';
            else if (status.includes('observ')) estadoClass = 'warning';
            else if (status.includes('bloq')) estadoClass = 'blocked';

            const cellPlaca = row.insertCell(0);
            cellPlaca.textContent = v.placa || '';
            
            const cellMarca = row.insertCell(1);
            cellMarca.textContent = v.marca || '';
            
            const cellModelo = row.insertCell(2);
            cellModelo.textContent = v.modelo || '';
            
            const cellEstado = row.insertCell(3);
            const estadoSpan = document.createElement('span');
            estadoSpan.className = `table-badge ${estadoClass}`;
            estadoSpan.textContent = v.estado || 'Sin estado';
            cellEstado.appendChild(estadoSpan);
            
            const cellFecha = row.insertCell(4);
            cellFecha.textContent = fecha;
        });
    }

    /**
     * Estructura los datos de registros diarios para los últimos 7 días.
     */
    function getWeeklyTrendData() {
        const vehiculos = safeGetVehiculos();
        const now = new Date();

        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
            days.push({
                date: date,
                label: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][date.getUTCDay()],
                count: 0
            });
        }

        vehiculos.forEach(vehiculo => {
            const fechaRaw = vehiculo.fechaRegistro || vehiculo.creadoEn;
            if (!fechaRaw) return;
            const fecha = new Date(fechaRaw);
            if (isNaN(fecha.getTime())) return;

            const fechaUTC = new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));
            const dia = days.find(day => day.date.getTime() === fechaUTC.getTime());
            if (dia) dia.count++;
        });
        return days;
    }

    /**
     * Dibuja el gráfico de barras de tendencia semanal.
     */
    function renderWeeklyTrend() {
        const weeklyTrendBars = document.getElementById('weeklyTrendBars');
        if (!weeklyTrendBars) return;

        const trend = getWeeklyTrendData();
        const maxCount = Math.max(...trend.map(day => day.count), 1);
        weeklyTrendBars.innerHTML = '';

        trend.forEach(day => {
            const heightPct = Math.round((day.count / maxCount) * 100);
            const row = document.createElement('div');
            row.className = 'bar-row bar-vertical';
            row.innerHTML = `
                <span>${escapeHtml(day.label)}</span>
                <div class="bar"><i style="height:${heightPct}%"></i></div>
                <strong>${day.count}</strong>
            `;
            weeklyTrendBars.appendChild(row);
        });
    }

    /**
     * Ejecuta la actualización global de todos los componentes visuales del Dashboard.
     * Sincroniza métricas, gráficos de dona, barras de capacidad y lista de actividad.
     */
    function actualizarDashboard() {
        const totalRegistrosEl = document.getElementById('totalRegistros');
        const aprobadosEl = document.getElementById('aprobados');
        const pendientesEl = document.getElementById('pendientes');
        const revisionesEl = document.getElementById('revisiones');
        const observadosEl = document.getElementById('observados');
        const bloqueadosEl = document.getElementById('bloqueados');
        const donutCenterPercent = document.getElementById('donut-center-percent');
        const donutCenterLabel = document.getElementById('donut-center-label');
        const legendApproved = document.getElementById('legend-approved-pct');
        const legendPending = document.getElementById('legend-pending-pct');
        const legendReview = document.getElementById('legend-review-pct');
        const legendWarning = document.getElementById('legend-warning-pct');
        const legendBlocked = document.getElementById('legend-blocked-pct');
        const capacityTotalPct = document.getElementById('capacityTotalPct');
        const capacityTotalBar = document.getElementById('capacityTotalBar');
        const capacityDocPct = document.getElementById('capacityDocPct');
        const capacityDocBar = document.getElementById('capacityDocBar');
        const capacityResolvePct = document.getElementById('capacityResolvePct');
        const capacityResolveBar = document.getElementById('capacityResolveBar');
        const storageStatusEl = document.getElementById('storageStatus');

        const contador = safeGetEstadoCounts();
        const total = contador.total || 0;
        const aprobado = contador.aprobado || 0;
        const pendiente = contador.pendiente || 0;
        const revision = contador.revision || 0;
        const observado = contador.observado || 0;
        const bloqueado = contador.bloqueado || 0;

        if (totalRegistrosEl) totalRegistrosEl.textContent = total;
        if (aprobadosEl) aprobadosEl.textContent = aprobado;
        if (pendientesEl) pendientesEl.textContent = pendiente;
        if (revisionesEl) revisionesEl.textContent = revision;
        if (observadosEl) observadosEl.textContent = observado;
        if (bloqueadosEl) bloqueadosEl.textContent = bloqueado;

        const pAprobado = total ? (aprobado / total) * 100 : 0;
        const pPendiente = total ? (pendiente / total) * 100 : 0;
        const pRevision = total ? (revision / total) * 100 : 0;
        const pObservado = total ? (observado / total) * 100 : 0;
        const pBloqueado = total ? (bloqueado / total) * 100 : 0;

        if (donutCenterPercent) donutCenterPercent.textContent = `${Math.round(pAprobado)}%`;
        if (donutCenterLabel) donutCenterLabel.textContent = total ? 'Aprobados' : 'Sin datos';
        if (legendApproved) legendApproved.textContent = `${Math.round(pAprobado)}%`;
        if (legendPending) legendPending.textContent = `${Math.round(pPendiente)}%`;
        if (legendReview) legendReview.textContent = `${Math.round(pRevision)}%`;
        if (legendWarning) legendWarning.textContent = `${Math.round(pObservado)}%`;
        if (legendBlocked) legendBlocked.textContent = `${Math.round(pBloqueado)}%`;

        const donutChart = document.querySelector('.donut-chart');
        if (donutChart) {
            if (total > 0) {
                donutChart.style.background = `conic-gradient(
                    #9f6b3f 0% ${pAprobado}%, 
                    #e6c9a8 ${pAprobado}% ${pAprobado + pPendiente}%,
                    #c28b5a ${pAprobado + pPendiente}% ${pAprobado + pPendiente + pRevision}%,
                    #d98736 ${pAprobado + pPendiente + pRevision}% ${pAprobado + pPendiente + pRevision + pObservado}%,
                    #a34c17 ${pAprobado + pPendiente + pRevision + pObservado}% ${pAprobado + pPendiente + pRevision + pObservado + pBloqueado}%,
                    #f0e2d1 ${pAprobado + pPendiente + pRevision + pObservado + pBloqueado}% 100%
                )`;
            } else {
                donutChart.style.background = '#f0e2d1';
            }
        }

        const docVal = total ? Math.round(((aprobado + revision + pendiente) / total) * 100) : 0;
        const resVal = total ? Math.round(((total - observado) / total) * 100) : 0;
        const totVal = total ? 100 : 0;

        if (capacityTotalPct) capacityTotalPct.textContent = `${totVal}%`;
        if (capacityTotalBar) capacityTotalBar.style.width = `${totVal}%`;
        if (capacityDocPct) capacityDocPct.textContent = `${docVal}%`;
        if (capacityDocBar) capacityDocBar.style.width = `${docVal}%`;
        if (capacityResolvePct) capacityResolvePct.textContent = `${resVal}%`;
        if (capacityResolveBar) capacityResolveBar.style.width = `${resVal}%`;

        if (storageStatusEl) {
            const available = isLocalStorageAvailable();
            if (!available) {
                storageStatusEl.textContent = 'Error: Almacenamiento local no disponible.';
            } else if (total === 0) {
                storageStatusEl.textContent = 'Sincronizado: No se encontraron registros.';
            } else {
                storageStatusEl.textContent = `Sincronizado: ${total} vehículos procesados.`;
            }
        }

        const recentActivityList = document.getElementById('recentActivityList');
        if (recentActivityList) {
            const latest = safeGetVehiculos().slice().sort((a, b) => {
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
                    } else if (estado.includes('pend') || estado.includes('revis')) {
                        description = 'Registro pendiente de validación.';
                    } else if (estado.includes('observ')) {
                        description = 'Observado por inconsistencias en documentos.';
                    } else if (estado.includes('bloque')) {
                        description = 'Registro bloqueado para revisión adicional.';
                    }
                    const item = document.createElement('div');
                    item.innerHTML = `
                        <strong>${escapeHtml(v.placa || 'Sin placa')}</strong>
                        <p>${escapeHtml(description)}</p>
                    `;
                    recentActivityList.appendChild(item);
                });
            }
        }

        if (worker) {
            try {
                worker.postMessage(safeGetVehiculos());
            } catch (err) {
                console.warn('[Dashboard] Error al comunicar con worker:', err);
            }
        }
    }

    function forceRefreshDashboard() {
        actualizarDashboard();
        renderUltimosRegistros();
        renderWeeklyTrend();
    }

    /**
     * Inyecta un conjunto de datos predefinidos para pruebas de visualización.
     */
    function cargarDatosDemo() {
        const vehiculosExistentes = safeGetVehiculos();
        if (vehiculosExistentes.length > 0 && !isDemoDataLoaded) {
            const confirmar = confirm('Ya hay registros en el sistema. ¿Deseas reemplazarlos por los datos de demostración? Esta acción no se puede deshacer.');
            if (!confirmar) return;
        }

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
            },
            {
                id: Date.now() + 3,
                placa: 'BLK-999',
                marca: 'Jeep',
                modelo: 'Wrangler',
                anio: 2021,
                color: 'Rojo',
                tipo: 'SUV',
                propietario: 'Ana Smith',
                documento: '00000000-K',
                telefono: '+503 7000 0000',
                correo: 'ana@example.com',
                estado: 'Bloqueado',
                categoria: 'Particular',
                poliza: 'POL-2023-004',
                revision: 'Vencida',
                observaciones: 'Reporte de robo o fraude detectado',
                fechaRegistro: new Date().toISOString(),
                images: []
            }
        ];

        if (safeSaveVehiculos(datosDemo)) {
            isDemoDataLoaded = true;
            console.log('[autoreg] Datos de demostración cargados');
            forceRefreshDashboard();
            showToast('Datos de demostración cargados correctamente', 5000);
        } else {
            showToast('Error al cargar datos de demostración', 3000);
        }
    }

    /**
     * Muestra el contenido crudo del LocalStorage para propósitos de depuración técnica.
     */
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

    /**
     * Consume servicios externos de geolocalización y meteorología para mostrar datos del entorno.
     */
    function obtenerUbicacionYClima() {
        const climaEl = document.getElementById('clima');
        if (!climaEl) return;

        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;

                try {
                    const controller = new AbortController();
                    const timeout = setTimeout(() => controller.abort(), 8000);
                    const response = await fetch(url, { signal: controller.signal });
                    clearTimeout(timeout);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    const data = await response.json();
                    const temp = data.current_weather?.temperature;
                    climaEl.innerHTML = temp !== undefined
                        ? `🌡️ Temperatura actual: ${temp}°C (Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)})`
                        : '📍 No se pudo obtener la temperatura actual';
                } catch (error) {
                    if (error.name === 'AbortError') {
                        climaEl.innerHTML = '⏱️ Tiempo de espera agotado para el clima';
                    } else {
                        climaEl.innerHTML = '❌ No se pudo obtener clima';
                        console.error('Error consumiendo API de clima:', error);
                    }
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

    /**
     * Configuración inicial del panel: Workers, Canales de Comunicación y Eventos de Usuario.
     */
    function init() {
        if (window.Worker) {
            try {
                if (window.location.protocol === 'file:') {
                    throw new Error('Los Web Workers no funcionan con el protocolo file://. Usa un servidor local (Live Server).');
                }

                let workerPath = '../assets/js/worker.js';
                worker = new Worker(workerPath);
                
                worker.onerror = (err) => {
                    console.error('[Dashboard] El archivo worker.js no se pudo cargar. Revisa la ruta:', workerPath, err);
                    const workerStatsEl = document.getElementById('workerStats');
                    if (workerStatsEl) {
                        workerStatsEl.textContent = window.location.protocol === 'file:' 
                            ? '⚠️ Error: Ejecuta el proyecto con un servidor local' 
                            : '⚠️ Error: No se encontró worker.js';
                    }
                };
                worker.onmessage = (e) => {
                    const workerStatsEl = document.getElementById('workerStats');
                    if (workerStatsEl) {
                        workerStatsEl.innerHTML = `📊 Procesado por Worker: Total ${e.data.total} | Pendientes ${e.data.pendiente} | Aprobados ${e.data.aprobado} | Observados ${e.data.observado} | Bloqueados ${e.data.bloqueado || 0}`;
                    }
                };
            } catch (err) {
                const workerStatsEl = document.getElementById('workerStats');
                if (workerStatsEl) {
                    workerStatsEl.textContent = window.location.protocol === 'file:' 
                        ? '⚠️ Requiere Servidor Local: Haz clic derecho y selecciona "Open with Live Server"' 
                        : `⚠️ Error al iniciar: ${err.message}`;
                }
            }
        } else {
            const workerStatsEl = document.getElementById('workerStats');
            if (workerStatsEl) workerStatsEl.textContent = 'Worker no soportado';
        }

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
            console.warn('BroadcastChannel no disponible', e);
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
                if (pendingTimeout) clearTimeout(pendingTimeout);
                pendingTimeout = setTimeout(() => { refreshBtn.textContent = 'Actualizar datos'; }, 1200);
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

        const main = document.querySelector('.page-main');
        if (main && !document.getElementById('demoBtnCreated')) {
            const demoActions = document.createElement('div');
            demoActions.className = 'dashboard-demo-actions';
            const demoBtn = document.createElement('button');
            demoBtn.id = 'demoBtnCreated';
            demoBtn.className = 'button button-secondary';
            demoBtn.type = 'button';
            demoBtn.textContent = 'Cargar datos de demostración';
            demoBtn.addEventListener('click', cargarDatosDemo);
            demoActions.appendChild(demoBtn);
            main.appendChild(demoActions);
        }

        window.addEventListener('storage', (e) => {
            if (e.key === 'autoreg_vehiculos') {
                try {
                    actualizarDashboard();
                    renderUltimosRegistros();
                    renderWeeklyTrend();
                } catch (err) {
                    console.error("Error en actualización por storage:", err);
                }
            }
        });

        function startPolling() {
            if (updateInterval) clearInterval(updateInterval);
            updateInterval = setInterval(() => {
                if (document.visibilityState === 'visible') {
                    actualizarDashboard();
                    renderUltimosRegistros();
                    renderWeeklyTrend();
                }
            }, 5000);
        }
        startPolling();
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                forceRefreshDashboard();
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
