// Variables específicas de cheniles
let datos = {}; // Estructura: { chenilA1: ["LunaBella", "Max12"], ... }
let sortableInstances = [];
let modoReordenar = false;
let modalAnadirAbierto = false;
let modalEliminarAbierto = false;

// Función principal de carga
async function cargar() {
  console.log('🔄 Cargando estructura híbrida...');

  // 1. Cargar LISTA de cheniles desde GitHub
  const listaCheniles = await cargarListaCheniles();

  if (listaCheniles.length === 0) {
    document.getElementById('contenedor').innerHTML = '<p>Error cargando cheniles</p>';
    return;
  }

  // 2. Cargar perros AGRUPADOS desde Supabase
  const perrosAgrupados = await cargarPerrosAgrupados();

  // 3. Combinar: para cada chenil, usar perros de Supabase o array vacío
  datos = {};
  listaCheniles.forEach(chenil => {
    datos[chenil] = perrosAgrupados[chenil] || [];
  });

  // 4. Pintar
  pintar();
}

// Función para pintar los cheniles
function pintar() {
  const contenedor = document.getElementById('contenedor');
  contenedor.innerHTML = '';
  let seccionAnterior = '';

  Object.entries(datos).forEach(([chenil, perros]) => {
    const seccionActual = obtenerSeccion(chenil);
    if (seccionActual && seccionActual !== seccionAnterior) {
      if (seccionAnterior !== '') {
        const separador = document.createElement('div');
        separador.className = 'separador-seccion';
        contenedor.appendChild(separador);
      }
      seccionAnterior = seccionActual;
    }

    const caja = document.createElement('div');
    caja.className = 'chenil';

    const titulo = document.createElement('div');
    titulo.className = 'titulo';
    titulo.textContent = formatearNombreChenil(chenil);
    caja.appendChild(titulo);

    const zona = document.createElement('div');
    zona.className = 'contenedor-marcos';
    zona.dataset.chenil = chenil;

    if (perros.length === 0 || perros.every(n => !n.trim())) {
      zona.classList.add('vacio');
      const vacio = document.createElement('div');
      vacio.className = 'mensaje-vacio';
      vacio.textContent = '(vacío)';
      zona.appendChild(vacio);
    } else {
      perros.forEach(nombreOriginal => {
        if (nombreOriginal && nombreOriginal.trim() !== '') {
          const marco = document.createElement('div');
          marco.className = 'marco clickable';

          marco.dataset.nombreOriginal = nombreOriginal;

          const datosPerro = datosCompletosPerros[nombreOriginal];
          const nombreAMostrar = datosPerro && datosPerro.nombre && datosPerro.nombre.trim() !== ''
            ? datosPerro.nombre.toUpperCase()
            : nombreOriginal.toUpperCase();

          marco.textContent = nombreAMostrar;

          if (datosPerro && datosPerro.nivelDeDificultad !== null && datosPerro.nivelDeDificultad !== undefined) {
            const colorDificultad = determinarColorDificultad(datosPerro.nivelDeDificultad);
            if (colorDificultad) {
              marco.classList.add(`dificultad-${colorDificultad}`);
            } else {
              marco.style.backgroundColor = colorPastel(nombreOriginal);
            }
          } else {
            marco.style.backgroundColor = colorPastel(nombreOriginal);
          }

          if (Object.keys(filtrosActivos).length > 0) {
            const cumpleFiltro = aplicarFiltros(nombreOriginal);
            if (!cumpleFiltro) {
              marco.classList.add('filtrado');
            } else {
              const datosPerro = datosCompletosPerros[nombreOriginal];
              if (!datosPerro || datosPerro.nivelDeDificultad === null || datosPerro.nivelDeDificultad === undefined) {
                marco.classList.add('cumple-filtro');
              }
            }
          }

          marco.addEventListener('click', () => {
            if (!modoReordenar) {
              window.location.href = `perro.html?nombre=${encodeURIComponent(nombreOriginal)}`;
            }
          });

          zona.appendChild(marco);
        }
      });
    }

    caja.appendChild(zona);
    contenedor.appendChild(caja);

    const sortable = new Sortable(zona, {
      group: 'cheniles',
      animation: 150,
      disabled: true,
      onEnd: () => {
        limpiarVacios();
        actualizarDatos();
      }
    });

    sortableInstances.push(sortable);
  });
}

// Funciones de reordenamiento
function activarModoReordenar() {
  modoReordenar = true;

  sortableInstances.forEach(sortable => {
    sortable.option("disabled", false);
  });

  document.querySelectorAll('.marco').forEach(marco => {
    marco.classList.remove('clickable');
    marco.style.cursor = 'grab';
  });

  const botonesFlotantes = document.getElementById('botonesFlotantes');
  botonesFlotantes.innerHTML = `
    <button class="boton-flotante boton-guardar" id="btnGuardar">✓</button>
    <button class="boton-flotante boton-cancelar" id="btnCancelar">✗</button>
  `;

  document.getElementById('btnGuardar').addEventListener('click', () => desactivarModoReordenar(true));
  document.getElementById('btnCancelar').addEventListener('click', cancelarReordenar);
}

function desactivarModoReordenar(guardarEnSupabase = false) {
  modoReordenar = false;

  sortableInstances.forEach(sortable => {
    sortable.option("disabled", true);
  });

  document.querySelectorAll('.marco').forEach(marco => {
    marco.classList.add('clickable');
    marco.style.cursor = 'pointer';
  });

  const botonesFlotantes = document.getElementById('botonesFlotantes');
  botonesFlotantes.innerHTML = `
    <button class="boton-flotante boton-filtrar" id="btnFiltrar">🔍</button>
    <button class="boton-flotante boton-reordenar" id="btnReordenar">🔃</button>
    <button class="boton-flotante boton-anadir" id="btnAnadirPerro">➕</button>
    <button class="boton-flotante boton-eliminar" id="btnEliminarPerro">🗑️</button>
  `;

  agregarEventosBotones();

  if (guardarEnSupabase) {
    pushToGithub();
  }
}

function cancelarReordenar() {
  modoReordenar = false;

  sortableInstances = [];

  pintar();

  document.querySelectorAll('.marco').forEach(marco => {
    marco.classList.add('clickable');
    marco.style.cursor = 'pointer';
  });

  const botonesFlotantes = document.getElementById('botonesFlotantes');
  botonesFlotantes.innerHTML = `
    <button class="boton-flotante boton-filtrar" id="btnFiltrar">🔍</button>
    <button class="boton-flotante boton-reordenar" id="btnReordenar">🔃</button>
    <button class="boton-flotante boton-anadir" id="btnAnadirPerro">➕</button>
    <button class="boton-flotante boton-eliminar" id="btnEliminarPerro">🗑️</button>
  `;

  agregarEventosBotones();
}

function limpiarVacios() {
  document.querySelectorAll('.contenedor-marcos').forEach(zona => {
    const marcos = zona.querySelectorAll('.marco');
    const vacio = zona.querySelector('.mensaje-vacio');
    if (marcos.length === 0) {
      if (!vacio) {
        zona.classList.add('vacio');
        const nuevo = document.createElement('div');
        nuevo.className = 'mensaje-vacio';
        nuevo.textContent = '(vacío)';
        zona.appendChild(nuevo);
      }
    } else {
      zona.classList.remove('vacio');
      if (vacio) vacio.remove();
    }
  });
}

function actualizarDatos() {
  const nuevo = {};
  document.querySelectorAll('.contenedor-marcos').forEach(zona => {
    const chenil = zona.dataset.chenil;
    const perros = Array.from(zona.querySelectorAll('.marco')).map(m => m.dataset.nombreOriginal);
    nuevo[chenil] = perros.length ? perros : [];
  });
  datos = nuevo;

  // Guardar cambios en Supabase después de un breve delay
  setTimeout(() => {
    pushToGithub();
  }, 300);
}

function agregarEventosBotones() {
  document.getElementById('btnReordenar').addEventListener('click', activarModoReordenar);
  document.getElementById('btnFiltrar').addEventListener('click', mostrarModalFiltros);
  document.getElementById('btnAnadirPerro').addEventListener('click', mostrarModalAnadirPerro);
  document.getElementById('btnEliminarPerro').addEventListener('click', mostrarModalEliminarPerro);
}

async function pushToGithub() {
  try {
    console.log('💾 Guardando cambios en Supabase...');

    // Para cada chenil y sus perros, actualizar en Supabase
    for (const [chenilId, perrosIds] of Object.entries(datos)) {
      for (const perroId of perrosIds) {
        if (perroId && perroId.trim() !== '') {
          await moverPerroChenil(perroId, chenilId);
        }
      }
    }

    console.log('✅ Cambios guardados en Supabase');
    return true;

  } catch (error) {
    console.error('❌ Error guardando:', error);
    return false;
  }
}

// Función para capitalizar nombres
function capitalizarNombre(nombre) {
  return nombre
    .toLowerCase()
    .split(' ')
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join('');
}

// Función para normalizar nombre de archivo
function normalizarNombreArchivo(nombre) {
  const nombreCapitalizado = capitalizarNombre(nombre);

  return nombreCapitalizado
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/g, "n")
    .replace(/[^a-zA-Z0-9]/g, "");
}

// Función para mostrar modal de añadir perro
function mostrarModalAnadirPerro() {
  if (modalAnadirAbierto) return;
  modalAnadirAbierto = true;

  const modal = document.createElement('div');
  modal.className = 'modal-anadir-perro';
  modal.innerHTML = `
    <div class="contenido-modal-anadir">
      <h3>Añadir Nuevo Perro</h3>

      <div class="grupo-formulario">
        <label class="etiqueta-formulario" for="nombrePerro">Nombre del Perro</label>
        <input type="text" class="input-formulario" id="nombrePerro" placeholder="Ej: Maggie, Misade Domingo, Rex...">
        <div class="mensaje-error" id="errorNombre"></div>
      </div>

      <div class="grupo-formulario">
        <label class="etiqueta-formulario" for="chenilDestino">Chenil de Destino</label>
        <select class="select-formulario" id="chenilDestino">
          ${generarOpcionesCheniles()}
        </select>
      </div>

      <div class="botones-modal-anadir">
        <button class="boton-modal boton-cancelar-anadir" id="btnCancelarAnadir">Cancelar</button>
        <button class="boton-modal boton-crear" id="btnCrearPerro">Crear Perro</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#btnCancelarAnadir').addEventListener('click', () => {
    document.body.removeChild(modal);
    modalAnadirAbierto = false;
  });

  modal.querySelector('#btnCrearPerro').addEventListener('click', crearNuevoPerro);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
      modalAnadirAbierto = false;
    }
  });

  modal.querySelector('#nombrePerro').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      crearNuevoPerro();
    }
  });

  setTimeout(() => {
    modal.querySelector('#nombrePerro').focus();
  }, 100);
}

// Generar opciones de cheniles para el select
function generarOpcionesCheniles() {
  return Object.keys(datos).map(chenil =>
    `<option value="${chenil}">${formatearNombreChenil(chenil)}</option>`
  ).join('');
}

// Función para crear nuevo perro
async function crearNuevoPerro() {
  const nombreInput = document.getElementById('nombrePerro');
  const chenilSelect = document.getElementById('chenilDestino');
  const errorDiv = document.getElementById('errorNombre');

  const nombreMostrar = nombreInput.value.trim();
  const chenil = chenilSelect.value;

  if (!nombreMostrar) {
    mostrarError(errorDiv, 'El nombre es obligatorio');
    return;
  }

  if (nombreMostrar.length < 2) {
    mostrarError(errorDiv, 'El nombre debe tener al menos 2 caracteres');
    return;
  }

  const nombreArchivo = normalizarNombreArchivo(nombreMostrar);
  const nombreParaMostrar = capitalizarNombre(nombreMostrar);

  try {
    // Verificar si el perro ya existe en Supabase
    if (supabaseClient) {
      const { data: perroExistente } = await supabaseClient
        .from('perros')
        .select('id')
        .eq('id', nombreArchivo)
        .single();

      if (perroExistente) {
        mostrarError(errorDiv, 'Este perro ya existe');
        return;
      }
    }

    // Crear datos del perro
    const datosPerro = {
      nombre: nombreParaMostrar,
      chenil_id: chenil
      // Los demás campos se llenarán cuando edites el perro
    };

    // Guardar en Supabase
    const exito = await guardarPerroEnSupabase(nombreArchivo, datosPerro);

    if (exito) {
      // Actualizar datos locales
      datosCompletosPerros[nombreArchivo] = datosPerro;

      // Añadir al chenil en la vista
      if (!datos[chenil]) datos[chenil] = [];
      datos[chenil].push(nombreArchivo);

      // Cerrar modal y actualizar
      const modal = document.querySelector('.modal-anadir-perro');
      document.body.removeChild(modal);
      modalAnadirAbierto = false;
      pintar();

      console.log(`✅ ${nombreArchivo} creado exitosamente`);
    } else {
      mostrarError(errorDiv, 'Error al guardar en la base de datos');
    }

  } catch (error) {
    mostrarError(errorDiv, 'Error: ' + error.message);
  }
}

// Función auxiliar para mostrar errores
function mostrarError(elemento, mensaje) {
  elemento.textContent = mensaje;
  elemento.style.display = 'block';
  setTimeout(() => {
    elemento.style.display = 'none';
  }, 5000);
}

// Función para mostrar modal de eliminar perro
function mostrarModalEliminarPerro() {
  if (modalEliminarAbierto) return;
  modalEliminarAbierto = true;

  const modal = document.createElement('div');
  modal.className = 'modal-eliminar-perro';

  const todosLosPerros = [];
  Object.values(datos).forEach(perros => {
    perros.forEach(nombre => {
      if (nombre && nombre.trim() !== '') {
        todosLosPerros.push(nombre);
      }
    });
  });

  todosLosPerros.sort((a, b) => {
    const nombreA = datosCompletosPerros[a]?.nombre || a;
    const nombreB = datosCompletosPerros[b]?.nombre || b;
    return nombreA.localeCompare(nombreB);
  });

  modal.innerHTML = `
    <div class="contenido-modal-eliminar">
      <h3>Eliminar Perro de Cheniles</h3>

      <div class="grupo-formulario">
        <label class="etiqueta-formulario" for="perroAEliminar">Seleccionar Perro</label>
        <select class="select-formulario" id="perroAEliminar">
          <option value="">-- Selecciona un perro --</option>
          ${todosLosPerros.map(nombre => {
            const datosPerro = datosCompletosPerros[nombre];
            const nombreMostrar = datosPerro?.nombre || nombre;
            return `<option value="${nombre}">${nombreMostrar}</option>`;
          }).join('')}
        </select>
      </div>

      <div class="botones-modal-eliminar">
        <button class="boton-modal boton-cancelar-eliminar" id="btnCancelarEliminar">Cancelar</button>
        <button class="boton-modal boton-eliminar-confirmar" id="btnConfirmarEliminar">Eliminar de Cheniles</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#btnCancelarEliminar').addEventListener('click', () => {
    document.body.removeChild(modal);
    modalEliminarAbierto = false;
  });

  modal.querySelector('#btnConfirmarEliminar').addEventListener('click', eliminarPerroDeCheniles);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
      modalEliminarAbierto = false;
    }
  });
}

// Función para eliminar perro de cheniles
async function eliminarPerroDeCheniles() {
  const selectPerro = document.getElementById('perroAEliminar');
  const nombrePerro = selectPerro.value;

  if (!nombrePerro) {
    console.log('❌ No se seleccionó ningún perro');
    return;
  }

  // Buscar y eliminar el perro de todos los cheniles
  let perroEncontrado = false;

  Object.keys(datos).forEach(chenil => {
    const index = datos[chenil].indexOf(nombrePerro);
    if (index > -1) {
      datos[chenil].splice(index, 1);
      perroEncontrado = true;
    }
  });

  if (!perroEncontrado) {
    console.log('❌ No se encontró el perro en los cheniles');
    return;
  }

  try {
    // Actualizar en Supabase (poner chenil_id a null)
    if (supabaseClient) {
      const { data: perroActual } = await supabaseClient
        .from('perros')
        .select('datos')
        .eq('id', nombrePerro)
        .single();

      if (perroActual) {
        const nuevosDatos = {
          ...perroActual.datos,
          chenil_id: null
        };

        await supabaseClient
          .from('perros')
          .update({
            chenil_id: null,
            datos: nuevosDatos
          })
          .eq('id', nombrePerro);
      }
    }

    // Cerrar modal
    const modal = document.querySelector('.modal-eliminar-perro');
    document.body.removeChild(modal);
    modalEliminarAbierto = false;

    // Actualizar vista
    pintar();

    const datosPerro = datosCompletosPerros[nombrePerro];
    const nombreMostrar = datosPerro?.nombre || nombrePerro;
    console.log(`✅ Perro "${nombreMostrar}" eliminado de los cheniles`);

  } catch (error) {
    console.error('❌ Error al eliminar perro:', error);
  }
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
  agregarEventosBotones();
  cargar();
});
