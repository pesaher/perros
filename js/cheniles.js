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

function desactivarModoReordenar() {
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
    `;

    agregarEventosBotones();

    guardarOrdenEnSupabase();
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
}

function agregarEventosBotones() {
    document.getElementById('btnFiltrar').addEventListener('click', mostrarModalFiltros);
}

async function guardarOrdenEnSupabase() {
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

// Generar opciones de cheniles para el select
function generarOpcionesCheniles() {
    return Object.keys(datos).map(chenil =>
        `<option value="${chenil}">${formatearNombreChenil(chenil)}</option>`
    ).join('');
}

// Función auxiliar para mostrar errores
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

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    agregarEventosBotones();
    cargar();
});
