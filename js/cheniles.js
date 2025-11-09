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
                        } else {
                            // Solo añadir borde verde si el perro NO tiene nivel de dificultad
                            const datosPerro = datosCompletosPerros[nombreOriginal];
                            if (!datosPerro || datosPerro.nivelDeDificultad === null || datosPerro.nivelDeDificultad === undefined) {
                                marco.classList.add('cumple-filtro');
                            }
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
    document.getElementById('btnFiltrar').addEventListener('click', mostrarModalFiltros);
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

// Generar opciones de cheniles para el select
function generarOpcionesCheniles() {
    return Object.keys(datos).map(chenil =>
        `<option value="${chenil}">${formatearNombreChenil(chenil)}</option>`
    ).join('');
}

// Función auxiliar para mostrar errores
function mostrarError(elemento, mensaje) {
    elemento.textContent = mensaje;
    elemento.style.display = 'block';
    setTimeout(() => {
        elemento.style.display = 'none';
    }, 5000);
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    agregarEventosBotones();
    cargar();
});
