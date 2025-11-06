// Variables específicas de cheniles
let datos = {};
let sortableInstances = [];
let modoReordenar = false;
let modalAnadirAbierto = false;
let modalEliminarAbierto = false;
let datosOriginales = {};

// Función principal de carga
async function cargar() {
    const resp = await fetch(urlSinCache('https://raw.githubusercontent.com/pesaher/perros/refs/heads/main/archivos/cheniles.json'));
    datos = await resp.json();
    await cargarDatosCompletosPerros(datos);
    pintar();
}

// Función para pintar los cheniles
function pintar() {
    const contenedor = document.getElementById('contenedor');
    contenedor.innerHTML = '';

    Object.entries(datos).forEach(([chenil, perros]) => {
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

                    // Guardar el nombre original en un atributo data
                    marco.dataset.nombreOriginal = nombreOriginal;

                    // Usar el nombre del JSON si está disponible, si no usar el original
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

                    // Aplicar filtros si existen
                    if (Object.keys(filtrosActivos).length > 0) {
                        const cumpleFiltro = aplicarFiltros(nombreOriginal);
                        if (!cumpleFiltro) {
                            marco.classList.add('filtrado');
                        }
                    }

                    // Agregar evento de click para los nombres
                    marco.addEventListener('click', () => {
                        if (!modoReordenar) {
                            // Usar el nombre original (camelCase) para la redirección
                            window.location.href = `perro.html?nombre=${encodeURIComponent(nombreOriginal)}`;
                        }
                    });

                    zona.appendChild(marco);
                }
            });
        }

        caja.appendChild(zona);
        contenedor.appendChild(caja);

        // Crear instancia de Sortable pero deshabilitada inicialmente
        const sortable = new Sortable(zona, {
            group: 'cheniles',
            animation: 150,
            disabled: true, // Deshabilitado por defecto
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

    // Guardar estado original para posible cancelación
    datosOriginales = JSON.parse(JSON.stringify(datos));

    // Activar todas las instancias de Sortable
    sortableInstances.forEach(sortable => {
        sortable.option("disabled", false);
    });

    // Cambiar cursores y clases
    document.querySelectorAll('.marco').forEach(marco => {
        marco.classList.remove('clickable');
        marco.style.cursor = 'grab';
    });

    // Actualizar botones flotantes
    const botonesFlotantes = document.getElementById('botonesFlotantes');
    botonesFlotantes.innerHTML = `
        <button class="boton-flotante boton-guardar" id="btnGuardar">✓</button>
        <button class="boton-flotante boton-cancelar" id="btnCancelar">✗</button>
    `;

    // Agregar eventos a los nuevos botones
    document.getElementById('btnGuardar').addEventListener('click', () => desactivarModoReordenar(true));
    document.getElementById('btnCancelar').addEventListener('click', cancelarReordenar);
}

function desactivarModoReordenar(guardarEnGitHub = false) {
    modoReordenar = false;

    // Desactivar todas las instancias de Sortable
    sortableInstances.forEach(sortable => {
        sortable.option("disabled", true);
    });

    // Restaurar cursores y clases
    document.querySelectorAll('.marco').forEach(marco => {
        marco.classList.add('clickable');
        marco.style.cursor = 'pointer';
    });

    // Actualizar botones flotantes
    const botonesFlotantes = document.getElementById('botonesFlotantes');
    botonesFlotantes.innerHTML = `
        <button class="boton-flotante boton-filtrar" id="btnFiltrar">🔍</button>
        <button class="boton-flotante boton-reordenar" id="btnReordenar">🔃</button>
        <button class="boton-flotante boton-anadir" id="btnAnadirPerro">➕</button>
        <button class="boton-flotante boton-eliminar" id="btnEliminarPerro">🗑️</button>
    `;

    // Agregar eventos a los botones
    agregarEventosBotones();

    // Guardar cambios en GitHub solo si se especifica
    if (guardarEnGitHub) {
        pushToGithub();
    }
}

function cancelarReordenar() {
    modoReordenar = false;

    // Restaurar datos originales
    datos = JSON.parse(JSON.stringify(datosOriginales));

    // Limpiar instancias de Sortable antes de repintar
    sortableInstances = [];

    // Volver a pintar con los datos originales
    pintar();

    // Restaurar cursores y clases
    document.querySelectorAll('.marco').forEach(marco => {
        marco.classList.add('clickable');
        marco.style.cursor = 'pointer';
    });

    // Desactivar modo reordenar sin guardar - Y RESTAURAR BOTÓN AÑADIR
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
        nuevo[chenil] = perros.length ? perros : [""];
    });
    datos = nuevo;
    localStorage.setItem('chenilesDrag', JSON.stringify(datos));
}

function agregarEventosBotones() {
    document.getElementById('btnReordenar').addEventListener('click', activarModoReordenar);
    document.getElementById('btnFiltrar').addEventListener('click', mostrarModalFiltros);
    document.getElementById('btnAnadirPerro').addEventListener('click', mostrarModalAnadirPerro);
    document.getElementById('btnEliminarPerro').addEventListener('click', mostrarModalEliminarPerro);
}

async function pushToGithub() {
    try {
        const resp = await fetch('/.netlify/functions/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        const result = await resp.json();
        if (resp.ok && result.ok) {
            console.log('✅ Cheniles guardados correctamente');
            return true;
        } else {
            console.error('❌ Error guardando cheniles:', result.error);
            return false;
        }
    } catch (error) {
        console.error('❌ Error de conexión:', error);
        return false;
    }
}

// Función para capitalizar nombres (CadaPalabraConMayúscula)
function capitalizarNombre(nombre) {
    return nombre
        .toLowerCase() // Primero todo a minúsculas
        .split(' ') // Dividir por espacios
        .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1)) // Capitalizar cada palabra
        .join(''); // Unir sin espacios
}

// Función para normalizar nombre de archivo
function normalizarNombreArchivo(nombre) {
    const nombreCapitalizado = capitalizarNombre(nombre);

    return nombreCapitalizado
        .normalize("NFD") // Separar acentos
        .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
        .replace(/ñ/g, "n") // ñ -> n
        .replace(/[^a-zA-Z0-9]/g, ""); // quitar caracteres especiales
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

    // Event listeners
    modal.querySelector('#btnCancelarAnadir').addEventListener('click', () => {
        document.body.removeChild(modal);
        modalAnadirAbierto = false;
    });

    modal.querySelector('#btnCrearPerro').addEventListener('click', crearNuevoPerro);

    // Cerrar modal al hacer click fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
            modalAnadirAbierto = false;
        }
    });

    // Enter para crear
    modal.querySelector('#nombrePerro').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            crearNuevoPerro();
        }
    });

    // Enfocar input de nombre
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

    // Validaciones
    if (!nombreMostrar) {
        mostrarError(errorDiv, 'El nombre es obligatorio');
        return;
    }

    if (nombreMostrar.length < 2) {
        mostrarError(errorDiv, 'El nombre debe tener al menos 2 caracteres');
        return;
    }

    const nombreArchivo = normalizarNombreArchivo(nombreMostrar);

    try {
        // 1. Primero verificar si el JSON del perro ya existe en GitHub
        const urlPerro = `https://raw.githubusercontent.com/pesaher/perros/refs/heads/main/archivos/perros/${encodeURIComponent(nombreArchivo)}.json`;
        const respuesta = await fetch(urlPerro);

        let datosPerro;
        let esPerroExistente = false;

        if (respuesta.ok) {
            // El perro YA EXISTE en GitHub
            datosPerro = await respuesta.json();
            esPerroExistente = true;

            // 2. Verificar si ya está en algún chenil actual
            const yaEstaEnChenil = Object.values(datos).some(perros =>
                perros.some(perro => perro && normalizarNombreArchivo(perro) === nombreArchivo)
            );

            if (yaEstaEnChenil) {
                mostrarError(errorDiv, 'Este perro ya existe y está en un chenil');
                return;
            }

        } else {
            // El perro NO EXISTE en GitHub - crear nuevo perro
            const plantillaUrl = 'https://raw.githubusercontent.com/pesaher/perros/refs/heads/main/archivos/perro.json';
            const respuestaPlantilla = await fetch(plantillaUrl);
            const plantilla = await respuestaPlantilla.json();

            datosPerro = {
                ...plantilla,
                nombre: nombreMostrar
            };

            // Guardar el JSON del perro en GitHub
            try {
                const respuesta = await fetch('/.netlify/functions/save-perro', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nombrePerro: nombreArchivo,
                        datosPerro: datosPerro
                    })
                });

                const resultado = await respuesta.json();

                if (!resultado.ok) {
                    console.warn('No se pudo guardar el JSON del perro en GitHub:', resultado.error);
                    // Continuamos de todas formas, el perro se creó localmente
                }
            } catch (error) {
                console.warn('Error al guardar perro en GitHub:', error);
                // Continuamos de todas formas
            }
        }

        // CÓDIGO COMÚN PARA AMBOS CASOS (perro existente o nuevo)

        // 1. Guardar en datosCompletosPerros
        datosCompletosPerros[nombreArchivo] = datosPerro;

        // 2. Añadir perro al chenil seleccionado
        if (!datos[chenil]) {
            datos[chenil] = [];
        }
        datos[chenil].push(nombreArchivo);

        // 3. Guardar cambios
        localStorage.setItem('chenilesDrag', JSON.stringify(datos));
        pushToGithub();

        // 4. Cerrar modal y actualizar vista
        const modal = document.querySelector('.modal-anadir-perro');
        document.body.removeChild(modal);
        modalAnadirAbierto = false;
        pintar();

    } catch (error) {
        // Manejo de errores de red
        if (error.message.includes('fetch') || error.message.includes('network')) {
            mostrarError(errorDiv, 'Error de conexión. Inténtalo de nuevo.');
        } else {
            mostrarError(errorDiv, 'Error: ' + error.message);
        }
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

    // Obtener lista de todos los perros
    const todosLosPerros = [];
    Object.values(datos).forEach(perros => {
        perros.forEach(nombre => {
            if (nombre && nombre.trim() !== '') {
                todosLosPerros.push(nombre);
            }
        });
    });

    // Ordenar alfabéticamente
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

    // Event listeners
    modal.querySelector('#btnCancelarEliminar').addEventListener('click', () => {
        document.body.removeChild(modal);
        modalEliminarAbierto = false;
    });

    modal.querySelector('#btnConfirmarEliminar').addEventListener('click', eliminarPerroDeCheniles);

    // Cerrar modal al hacer click fuera
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

            // Si el chenil queda vacío, poner array vacío
            if (datos[chenil].length === 0) {
                datos[chenil] = [""];
            }
        }
    });

    if (!perroEncontrado) {
        console.log('❌ No se encontró el perro en los cheniles');
        return;
    }

    try {
        // Guardar cambios en GitHub
        const guardadoExitoso = await pushToGithub();

        if (guardadoExitoso) {
            // Cerrar modal
            const modal = document.querySelector('.modal-eliminar-perro');
            document.body.removeChild(modal);
            modalEliminarAbierto = false;

            // Actualizar vista
            pintar();

            const datosPerro = datosCompletosPerros[nombrePerro];
            const nombreMostrar = datosPerro?.nombre || nombrePerro;
            console.log(`✅ Perro "${nombreMostrar}" eliminado de los cheniles`);
        } else {
            console.error('❌ Error al guardar los cambios en GitHub');
        }

    } catch (error) {
        console.error('❌ Error al eliminar perro:', error);
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    agregarEventosBotones();
    cargar();
});
