"use strict";

const form = document.querySelector("#vehicle-registration-form");
const fileInput = document.querySelector("#imagenes");
const fileSummary = document.querySelector("#file-summary");
const feedback = document.querySelector("#form-feedback");

const buildId = () => {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `vehiculo_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

const normalizeValue = (value) => String(value ?? "").trim();

const normalizePlate = (value) => normalizeValue(value).toUpperCase().replace(/\s+/g, "");

const slugify = (value) =>
  normalizeValue(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

const getStoredVehicles = (storageKey) => {
  const rawVehicles = localStorage.getItem(storageKey);

  if (!rawVehicles) {
    return [];
  }

  try {
    const vehicles = JSON.parse(rawVehicles);
    return Array.isArray(vehicles) ? vehicles : [];
  } catch (error) {
    console.warn("No se pudo leer el JSON de vehiculos guardados.", error);
    return [];
  }
};

const saveStoredVehicles = (storageKey, vehicles) => {
  localStorage.setItem(storageKey, JSON.stringify(vehicles));
};

const getImageMetadata = () =>
  Array.from(fileInput?.files ?? []).map((file) => ({
    id: buildId(),
    nombre: file.name,
    tipo: file.type,
    pesoBytes: file.size,
    pesoKb: Number((file.size / 1024).toFixed(2)),
    ultimaModificacion: new Date(file.lastModified).toISOString(),
  }));

const buildVehicleRecord = (formData, storageKey) => {
  const now = new Date().toISOString();
  const estadoNombre = normalizeValue(formData.get("estadoActual"));
  const estadoCodigo = slugify(estadoNombre);
  const placa = normalizePlate(formData.get("placa"));
  const marca = normalizeValue(formData.get("marca"));
  const modelo = normalizeValue(formData.get("modelo"));
  const propietarioNombre = normalizeValue(formData.get("propietarioNombre"));
  const propietarioDocumento = normalizeValue(formData.get("propietarioDocumento"));

  return {
    id: buildId(),
    folio: `AR-${Date.now()}`,
    version: 1,
    fechas: {
      creadoEn: now,
      actualizadoEn: now,
    },
    vehiculo: {
      placa,
      marca,
      modelo,
      anio: Number(formData.get("anio")),
      color: normalizeValue(formData.get("color")),
      tipo: normalizeValue(formData.get("tipo")),
    },
    propietario: {
      nombreCompleto: propietarioNombre,
      documento: propietarioDocumento,
      telefono: normalizeValue(formData.get("propietarioTelefono")),
      correo: normalizeValue(formData.get("propietarioCorreo")).toLowerCase(),
    },
    estado: {
      codigo: estadoCodigo,
      nombre: estadoNombre,
      actualizadoEn: now,
    },
    documentos: {
      categoria: normalizeValue(formData.get("categoria")),
      poliza: normalizeValue(formData.get("poliza")),
      revisionTecnica: normalizeValue(formData.get("revisionTecnica")),
    },
    evidencias: {
      imagenes: getImageMetadata(),
    },
    observaciones: normalizeValue(formData.get("observaciones")),
    historial: [
      {
        id: buildId(),
        tipo: "creacion",
        estado: {
          codigo: estadoCodigo,
          nombre: estadoNombre,
        },
        fecha: now,
        detalle: "Registro inicial desde formulario.",
      },
    ],
    busqueda: [
      placa,
      marca,
      modelo,
      propietarioNombre,
      propietarioDocumento,
      estadoNombre,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
    metadata: {
      origen: "pages/registro.html",
      storageKey,
    },
  };
};

const setFeedback = (message, type = "success") => {
  if (!feedback) {
    return;
  }

  feedback.textContent = message;
  feedback.className = message ? `form-feedback is-${type}` : "form-feedback";
};

const updateFileSummary = () => {
  if (!fileSummary || !fileInput) {
    return;
  }

  const files = Array.from(fileInput.files);

  if (files.length === 0) {
    fileSummary.textContent = "Sin imagenes seleccionadas.";
    return;
  }

  if (files.length === 1) {
    fileSummary.textContent = `1 imagen seleccionada: ${files[0].name}`;
    return;
  }

  fileSummary.textContent = `${files.length} imagenes seleccionadas.`;
};

if (fileInput) {
  fileInput.addEventListener("change", updateFileSummary);
}

if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      setFeedback("Completa los campos requeridos antes de guardar.", "error");
      return;
    }

    const storageKey = form.dataset.storageKey || "autoreg.vehiculos";
    const formData = new FormData(form);
    const vehicleRecord = buildVehicleRecord(formData, storageKey);
    const vehicles = getStoredVehicles(storageKey);
    const alreadyExists = vehicles.some(
      (vehicle) => vehicle?.vehiculo?.placa === vehicleRecord.vehiculo.placa
    );

    if (alreadyExists) {
      setFeedback(`Ya existe un vehiculo con la placa ${vehicleRecord.vehiculo.placa}.`, "error");
      return;
    }

    vehicles.push(vehicleRecord);

    try {
      saveStoredVehicles(storageKey, vehicles);
    } catch (error) {
      console.error("No se pudo guardar el vehiculo en localStorage.", error);
      setFeedback("No se pudo guardar. Revisa el espacio disponible del navegador.", "error");
      return;
    }

    form.reset();
    window.setTimeout(() => {
      updateFileSummary();
      setFeedback(`Vehiculo ${vehicleRecord.vehiculo.placa} guardado. Total local: ${vehicles.length}.`);
    }, 0);
  });

  form.addEventListener("reset", () => {
    window.setTimeout(() => {
      updateFileSummary();
      setFeedback("");
    }, 0);
  });
}
