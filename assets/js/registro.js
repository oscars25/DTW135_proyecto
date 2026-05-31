"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("vehiculoForm");
  const title = document.getElementById("formTitle");
  const idField = document.getElementById("vehiculoId");
  const alertBox = document.getElementById("registro-alert");
  const imageInput = document.getElementById("imagenesInput");
  const imagePreview = document.getElementById("imagenesPreview");
  const fileSummary = document.getElementById("file-summary");

  if (!form || !title || !idField || !alertBox) {
    return;
  }

  let currentVehicle = null;
  let selectedImages = [];
  let existingImages = [];
  const removedExisting = new Set();

  const showAlert = (message, variant = "error") => {
    alertBox.textContent = message;
    alertBox.className = `form-alert ${variant === "success" ? "alert-success" : "alert-error"}`;
  };

  const clearAlert = () => {
    alertBox.textContent = "";
    alertBox.className = "form-alert";
  };

  const getField = (id) => document.getElementById(id);
  const getValue = (id) => String(getField(id)?.value || "").trim();
  const setValue = (id, value) => {
    const field = getField(id);
    if (field) {
      field.value = value || "";
    }
  };

  const normalizePlate = (value) => value.toUpperCase().replace(/\s+/g, "");

  const readFileAsDataURL = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
      reader.readAsDataURL(file);
    });

  const optimizeImage = async (file) => {
    if (typeof resizeImage === "function") {
      return resizeImage(file, 1200, 800, 0.75);
    }

    return readFileAsDataURL(file);
  };

  const keptExistingImages = () => existingImages.filter((src) => !removedExisting.has(src));

  const updateFileSummary = () => {
    if (!fileSummary) {
      return;
    }

    const total = keptExistingImages().length + selectedImages.length;

    if (total === 0) {
      fileSummary.textContent = "Sin im\u00e1genes seleccionadas.";
    } else if (total === 1) {
      fileSummary.textContent = "1 imagen lista.";
    } else {
      fileSummary.textContent = `${total} im\u00e1genes listas.`;
    }
  };

  const createPreviewCard = (src, label, onRemove) => {
    const card = document.createElement("figure");
    card.className = "image-preview-card";

    const image = document.createElement("img");
    image.src = src;
    image.alt = label;
    image.loading = "lazy";

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "image-preview-remove";
    removeButton.textContent = "x";
    removeButton.setAttribute("aria-label", `Eliminar ${label.toLowerCase()}`);
    removeButton.addEventListener("click", onRemove);

    const caption = document.createElement("figcaption");
    caption.textContent = label;

    card.append(image, removeButton, caption);
    return card;
  };

  const renderPreview = () => {
    if (!imagePreview) {
      return;
    }

    imagePreview.innerHTML = "";

    keptExistingImages().forEach((src, index) => {
      imagePreview.appendChild(
        createPreviewCard(src, `Imagen guardada ${index + 1}`, () => {
          removedExisting.add(src);
          renderPreview();
        })
      );
    });

    selectedImages.forEach((src, index) => {
      imagePreview.appendChild(
        createPreviewCard(src, `Imagen nueva ${index + 1}`, () => {
          selectedImages.splice(index, 1);
          renderPreview();
        })
      );
    });

    updateFileSummary();
  };

  const splitPhone = (phone) => {
    const parts = String(phone || "").trim().split(/\s+/);
    const prefix = parts[0]?.startsWith("+") ? parts[0] : "+503";
    const number = parts[0]?.startsWith("+") ? parts.slice(1).join(" ") : parts.join(" ");
    return { prefix, number };
  };

  const loadVehicleForEdit = () => {
    const editId = new URLSearchParams(window.location.search).get("id");

    if (!editId) {
      return;
    }

    if (typeof getVehiculoById !== "function") {
      showAlert("No se pudo cargar el registro para editar.");
      return;
    }

    const vehicle = getVehiculoById(editId);

    if (!vehicle) {
      showAlert("No se encontr\u00f3 el veh\u00edculo a editar. Puedes crear uno nuevo.");
      return;
    }

    currentVehicle = vehicle;
    title.textContent = "Editar veh\u00edculo";
    idField.value = vehicle.id || "";

    setValue("placa", vehicle.placa);
    setValue("marca", vehicle.marca);
    setValue("modelo", vehicle.modelo);
    setValue("anio", vehicle.anio);
    setValue("color", vehicle.color);
    setValue("tipo", vehicle.tipo || "Automovil");
    setValue("propietario", vehicle.propietario);
    setValue("documento", vehicle.documento);
    setValue("correo", vehicle.correo);
    setValue("estado", vehicle.estado || "Pendiente");
    setValue("categoria", vehicle.categoria || "Particular");
    setValue("poliza", vehicle.poliza);
    setValue("revision", vehicle.revision);
    setValue("observaciones", vehicle.observaciones);

    const { prefix, number } = splitPhone(vehicle.telefono);
    setValue("phonePrefix", prefix);
    setValue("telefonoNumber", number);

    existingImages = Array.isArray(vehicle.images) ? vehicle.images.slice() : [];
    renderPreview();
  };

  if (imageInput) {
    imageInput.addEventListener("change", async () => {
      clearAlert();

      const availableSlots = Math.max(0, 8 - selectedImages.length - keptExistingImages().length);
      const files = Array.from(imageInput.files || []).slice(0, availableSlots);

      if (files.length === 0 && imageInput.files?.length) {
        showAlert("Puedes adjuntar hasta 8 im\u00e1genes por registro.");
        imageInput.value = "";
        return;
      }

      for (const file of files) {
        try {
          selectedImages.push(await optimizeImage(file));
        } catch (error) {
          console.warn("No se pudo procesar la imagen.", error);
          showAlert("Una imagen no se pudo procesar. Intenta con otro archivo.");
        }
      }

      imageInput.value = "";
      renderPreview();
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearAlert();

    if (!form.checkValidity()) {
      form.reportValidity();
      showAlert("Completa todos los campos obligatorios antes de guardar.");
      return;
    }

    if (typeof guardarVehiculo !== "function") {
      showAlert("No se encontr\u00f3 el m\u00f3dulo de guardado.");
      return;
    }

    const anio = Number.parseInt(getValue("anio"), 10);
    const currentYear = new Date().getFullYear();

    if (Number.isNaN(anio) || anio < 1900 || anio > currentYear + 1) {
      showAlert(`A\u00f1o inv\u00e1lido. Ingresa un a\u00f1o entre 1900 y ${currentYear + 1}.`);
      return;
    }

    const vehicle = {
      id: idField.value || null,
      placa: normalizePlate(getValue("placa")),
      marca: getValue("marca"),
      modelo: getValue("modelo"),
      anio,
      color: getValue("color"),
      tipo: getValue("tipo"),
      propietario: getValue("propietario"),
      documento: getValue("documento"),
      telefono: `${getValue("phonePrefix")} ${getValue("telefonoNumber")}`.trim(),
      correo: getValue("correo"),
      estado: getValue("estado"),
      categoria: getValue("categoria"),
      poliza: getValue("poliza"),
      revision: getValue("revision"),
      observaciones: getValue("observaciones"),
      fechaRegistro: currentVehicle?.fechaRegistro || new Date().toISOString(),
      images: keptExistingImages().concat(selectedImages)
    };

    try {
      const saved = guardarVehiculo(vehicle);
      showAlert(`Veh\u00edculo ${saved.placa} guardado correctamente.`, "success");
      window.setTimeout(() => {
        window.location.href = "vehiculos.html";
      }, 700);
    } catch (error) {
      console.error("Error al guardar el vehiculo:", error);
      showAlert(error?.message || "Ocurri\u00f3 un error al guardar el veh\u00edculo.");
    }
  });

  form.addEventListener("reset", () => {
    window.setTimeout(() => {
      clearAlert();
      currentVehicle = null;
      selectedImages = [];
      existingImages = [];
      removedExisting.clear();
      renderPreview();
    }, 0);
  });

  loadVehicleForEdit();
  renderPreview();
});
