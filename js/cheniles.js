// Variables específicas de cheniles
let datosCheniles = {}; // Estructura: { chenilA1: ["LunaBella", "Max12"], ... }
let copiaDatosCheniles = {};
let sortableInstances = [];
let modoReordenar = false;
let modalAnadirAbierto = false;
let modalEliminarAbierto = false;

// Función principal de carga
async function cargar() {
    datosCheniles = {};

    // 1. Cargar lista de cheniles desde GitHub
    const listaCheniles = await cargarListaCheniles();
    if (listaCheniles.length === 0) {
        document.getElementById('contenedor').innerHTML = '<p>Error cargando cheniles</p>';
        return;
    }

    const estructuraInicial = listaCheniles.reduce((obj, chenil) => {
        obj[chenil] = []; // Chenil vacío por defecto
        return obj;
    }, {});

    // 2. Cargar perros con una query desde Supabase
    datosCheniles = await cargarPerrosAgrupados(estructuraInicial);

    // 3. Pintar
    pintar();
}

// Función para pintar los cheniles
function pintar() {
    const contenedor = document.getElementById('contenedor');
    contenedor.innerHTML = '';
    let seccionAnterior = '';

    Object.entries(datosCheniles).forEach(([chenil, perros]) => {
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
                    const nombreAMostrar = nombreOriginal.toUpperCase();

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
    copiaDatosCheniles = JSON.parse(JSON.stringify(datosCheniles));

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

    document.getElementById('btnGuardar').addEventListener('click', () => desactivarModoReordenar());
    document.getElementById('btnCancelar').addEventListener('click', cancelarReordenar);
}

function desactivarModoReordenar() {
    modoReordenar = false;
    copiaDatosCheniles = {};

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

    guardarOrdenEnSupabase();
}

function cancelarReordenar() {
    modoReordenar = false;
    datosCheniles = JSON.parse(JSON.stringify(copiaDatosCheniles));
    copiaDatosCheniles = {};

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
    datosCheniles = nuevo;
}

function agregarEventosBotones() {
    document.getElementById('btnReordenar').addEventListener('click', activarModoReordenar);
    document.getElementById('btnFiltrar').addEventListener('click', mostrarModalFiltros);
    document.getElementById('btnAnadirPerro').addEventListener('click', mostrarModalAnadirPerro);
    document.getElementById('btnEliminarPerro').addEventListener('click', mostrarModalEliminarPerro);
}

async function guardarOrdenEnSupabase() {
    try {
        console.log('💾 Guardando cambios en Supabase...');

        // Para cada chenil y sus perros, actualizar en Supabase
        for (const [chenilId, perrosIds] of Object.entries(datosCheniles)) {
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

// Función para mostrar modal de añadir perro
function mostrarModalAnadirPerro() {
    if (modalAnadirAbierto) return;
    modalAnadirAbierto = true;

    const modal = document.createElement('div');
    modal.className = 'modal-anadir-perro';

    // Crear contenido inicial
    modal.innerHTML = `
    <div class="contenido-modal-anadir">
    <h3>Añadir Nuevo Perro</h3>

    <div class="grupo-formulario">
    <label class="etiqueta-formulario" for="nombrePerro">Nombre del Perro</label>
    <input type="text" class="input-formulario" id="nombrePerro" placeholder="Ej: Maggie, Misade Domingo, Rex...">
    <div class="mensaje-error" id="errorNombre"></div>
    <div class="sugerencias" id="sugerencias"></div>
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

    // Referencias a elementos
    const nombreInput = modal.querySelector('#nombrePerro');
    const sugerenciasDiv = modal.querySelector('#sugerencias');
    const btnCrear = modal.querySelector('#btnCrearPerro');

    // Función para buscar y mostrar sugerencias
    async function buscarSugerencias() {
        const texto = nombreInput.value.trim();

        if (texto.length < 2) {
            sugerenciasDiv.innerHTML = '';
            sugerenciasDiv.style.display = 'none';
            return;
        }

        try {
            // Buscar perros existentes
            const perrosEncontrados = await buscarPerroPorNombre(texto);

            if (!perrosEncontrados || perrosEncontrados.length === 0) {
                sugerenciasDiv.innerHTML = '<div class="sugerencia-vacia">No se encontraron perros existentes</div>';
                sugerenciasDiv.style.display = 'block';
                return;
            }

            // Filtrar perros que no están en cheniles
            const perrosDisponibles = perrosEncontrados.filter(perro =>
                perro.chenil_id === null || perro.chenil_id === undefined
            );

            const perrosEnCheniles = perrosEncontrados.filter(perro =>
                perro.chenil_id !== null && perro.chenil_id !== undefined
            );

            let html = '';

            if (perrosDisponibles.length > 0) {
                html += '<div class="grupo-sugerencias">';
                html += '<div class="titulo-sugerencias">Perros disponibles (sin chenil):</div>';

                perrosDisponibles.forEach(perro => {
                    const nombreMostrar = perro.id;
                    html += `
                    <div class="sugerencia-item disponible" data-id="${nombreMostrar}" data-nombre="${nombreMostrar}">
                    <span class="sugerencia-nombre">${nombreMostrar}</span>
                    <span class="sugerencia-estado">(sin chenil)</span>
                    </div>
                    `;
                });

                html += '</div>';
            }

            if (perrosEnCheniles.length > 0) {
                html += '<div class="grupo-sugerencias">';
                html += '<div class="titulo-sugerencias">Perros ya asignados:</div>';

                perrosEnCheniles.forEach(perro => {
                    const nombreMostrar = perro.id;
                    html += `
                    <div class="sugerencia-item asignado" data-id="${nombreMostrar}">
                    <span class="sugerencia-nombre">${nombreMostrar}</span>
                    <span class="sugerencia-estado">(en ${formatearNombreChenil(perro.chenil_id)})</span>
                    </div>
                    `;
                });

                html += '</div>';
            }

            sugerenciasDiv.innerHTML = html;
            sugerenciasDiv.style.display = 'block';

            // Agregar eventos a las sugerencias disponibles
            sugerenciasDiv.querySelectorAll('.sugerencia-item.disponible').forEach(item => {
                item.addEventListener('click', () => {
                    const id = item.dataset.id;

                    nombreInput.value = id;
                    sugerenciasDiv.innerHTML = '';
                    sugerenciasDiv.style.display = 'none';

                    // Cambiar texto del botón
                    btnCrear.textContent = 'Añadir al Chenil';
                });
            });

        } catch (error) {
            console.error('Error buscando sugerencias:', error);
        }
    }

    // Event listener para búsqueda en tiempo real
    let timeoutBusqueda;
    nombreInput.addEventListener('input', () => {
        clearTimeout(timeoutBusqueda);
        timeoutBusqueda = setTimeout(buscarSugerencias, 300);
    });

    // Event listener para tecla Enter
    nombreInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            crearNuevoPerro();
        }
    });

    // Botón Cancelar
    modal.querySelector('#btnCancelarAnadir').addEventListener('click', () => {
        document.body.removeChild(modal);
        modalAnadirAbierto = false;
    });

    // Botón Crear/Añadir
    btnCrear.addEventListener('click', crearNuevoPerro);

    // Enfocar el input
    setTimeout(() => {
        nombreInput.focus();
    }, 100);
}

// Generar opciones de cheniles para el select
function generarOpcionesCheniles() {
    return Object.keys(datosCheniles).map(chenil =>
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

    const nombreCapitalizado = capitalizarNombre(nombreMostrar);

    try {
        // Verificar si el perro ya existe en Supabase
        if (supabaseClient) {
            const { data: perroExistente, error } = await supabaseClient
            .from('perros')
            .select('id, chenil_id, datos')
            .eq('id', nombreCapitalizado)
            .single();

            if (!error && perroExistente) {
                // El perro existe, verificar si ya está en un chenil
                if (perroExistente.chenil_id !== null && perroExistente.chenil_id !== undefined) {
                    // El perro ya está en un chenil
                    mostrarError(errorDiv, `Este perro ya está en "${formatearNombreChenil(perroExistente.chenil_id)}"`);
                    return;
                } else {
                    await moverPerroChenil(nombreCapitalizado, chenil);

                    // Actualizar datos locales
                    datosCompletosPerros[nombreCapitalizado] = perroExistente.datos;

                    // Añadir al chenil en la vista
                    if (!datosCheniles[chenil]) datosCheniles[chenil] = [];
                    datosCheniles[chenil].push(nombreCapitalizado);

                    // Cerrar modal y actualizar
                    const modal = document.querySelector('.modal-anadir-perro');
                    document.body.removeChild(modal);
                    modalAnadirAbierto = false;
                    pintar();

                    console.log(`✅ ${nombreCapitalizado} añadido al chenil ${chenil}`);
                    return;
                }
            }
        }

        // Si llegamos aquí, el perro no existe o no hay conexión a Supabase
        // Guardar en Supabase
        const exito = await guardarPerroEnSupabase(nombreCapitalizado, {}, chenil);

        if (exito) {
            // Actualizar datos locales
            datosCompletosPerros[nombreCapitalizado] = {};

            // Añadir al chenil en la vista
            if (!datosCheniles[chenil]) datosCheniles[chenil] = [];
            datosCheniles[chenil].push(nombreCapitalizado);

            // Cerrar modal y actualizar
            const modal = document.querySelector('.modal-anadir-perro');
            document.body.removeChild(modal);
            modalAnadirAbierto = false;
            pintar();

            console.log(`✅ ${nombreCapitalizado} creado exitosamente`);
        } else {
            mostrarError(errorDiv, 'Error al guardar en la base de datos');
        }

    } catch (error) {
        mostrarError(errorDiv, 'Error: ' + error.message);
    }
}

// Función auxiliar para mostrar errores (actualizada)
function mostrarError(elemento, mensaje, tipo = 'error') {
    elemento.textContent = mensaje;
    elemento.style.display = 'block';

    // Remover clases anteriores
    elemento.classList.remove('mensaje-error', 'mensaje-info', 'mensaje-error-basico');

    // Agregar clase correcta según el tipo
    if (tipo === 'error') {
        elemento.classList.add('mensaje-error');
    } else if (tipo === 'info') {
        elemento.classList.add('mensaje-info');
    } else {
        elemento.classList.add('mensaje-error-basico');
    }

    // Auto-ocultar después de 5 segundos (solo para errores/info, no para validación)
    if (tipo !== 'validation') {
        setTimeout(() => {
            elemento.style.display = 'none';
        }, 5000);
    }
}

// Función para mostrar modal de eliminar perro
function mostrarModalEliminarPerro() {
    if (modalEliminarAbierto) return;
    modalEliminarAbierto = true;

    const modal = document.createElement('div');
    modal.className = 'modal-eliminar-perro';

    const todosLosPerros = [];
    Object.values(datosCheniles).forEach(perros => {
        perros.forEach(nombre => {
            if (nombre && nombre.trim() !== '') {
                todosLosPerros.push(nombre);
            }
        });
    });

    todosLosPerros.sort((a, b) => {
        return a.localeCompare(b);
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
        return `<option value="${nombre}">${nombre}</option>`;
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

    Object.keys(datosCheniles).forEach(chenil => {
        const index = datosCheniles[chenil].indexOf(nombrePerro);
        if (index > -1) {
            datosCheniles[chenil].splice(index, 1);
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
            const { error } = await supabaseClient
            .from('perros')
            .update({
                chenil_id: null
            })
            .eq('id', nombrePerro);

            if (error) {
                console.error('❌ Error actualizando chenil_id:', error);
            }
        }

        // Cerrar modal y actualizar
        const modal = document.querySelector('.modal-eliminar-perro');
        document.body.removeChild(modal);
        modalEliminarAbierto = false;

        // Actualizar vista
        pintar();

        const datosPerro = datosCompletosPerros[nombrePerro];
        console.log(`✅ Perro "${nombrePerro}" eliminado de los cheniles`);

    } catch (error) {
        console.error('❌ Error al eliminar perro:', error);
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    agregarEventosBotones();
    cargar();

    // Recargar al volver con back/forward
    window.addEventListener('pageshow', function(event) {
        cargar();
    });
});
