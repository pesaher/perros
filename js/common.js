// Variables globales compartidas
let datosCompletosPerros = {};

// Funciones de utilidad
function urlSinCache(base) {
    return base + '?v=' + Date.now();
}

function colorPastel(nombre) {
    let hash = 0;
    for (let i = 0; i < nombre.length; i++) {
        hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = hash % 360;
    const s = 65 + (hash % 10);
    const l = 85;
    return `hsl(${h}, ${s}%, ${l}%)`;
}

function formatearNombreChenil(nombre) {
    return nombre.replace(/([a-zA-Z]+)(\d+)/, (_, letras, num) =>
        letras.charAt(0).toUpperCase() + letras.slice(1).toLowerCase() + ' ' + num
    );
}

// Funciones de cálculo de edad
function calcularEdadEnAños(nacimiento) {
    if (!nacimiento) return null;
    
    const hoy = new Date();
    let fechaNacimiento;
    
    // Detectar el formato de la fecha
    if (nacimiento.match(/^\d{4}$/)) {
        // Formato YYYY - considerar como 1 de enero
        fechaNacimiento = new Date(parseInt(nacimiento), 0, 1);
    } else if (nacimiento.match(/^\d{4}-\d{2}$/)) {
        // Formato YYYY-MM - considerar como primer día del mes
        const [año, mes] = nacimiento.split('-');
        fechaNacimiento = new Date(parseInt(año), parseInt(mes) - 1, 1);
    } else if (nacimiento.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Formato YYYY-MM-DD - fecha exacta
        fechaNacimiento = new Date(nacimiento);
    } else {
        // Formato no reconocido
        return null;
    }
    
    // Calcular diferencia en milisegundos
    const diffTiempo = hoy - fechaNacimiento;
    // Convertir a años con decimales para mayor precisión
    const edadEnAños = diffTiempo / (1000 * 60 * 60 * 24 * 365.25);
    
    return Math.max(0, edadEnAños);
}

function calcularEdad(nacimiento) {
    if (!nacimiento) return '???';
    
    const hoy = new Date();
    let fechaNacimiento;
    
    // Detectar el formato de la fecha
    if (nacimiento.match(/^\d{4}$/)) {
        // Formato YYYY
        fechaNacimiento = new Date(parseInt(nacimiento), 0, 1); // 1 de enero del año
        const años = hoy.getFullYear() - fechaNacimiento.getFullYear();
        return `Unos ${años} años`;
        
    } else if (nacimiento.match(/^\d{4}-\d{2}$/)) {
        // Formato YYYY-MM
        const [año, mes] = nacimiento.split('-');
        fechaNacimiento = new Date(parseInt(año), parseInt(mes) - 1, 1);
        const diffMeses = (hoy.getFullYear() - fechaNacimiento.getFullYear()) * 12 + (hoy.getMonth() - fechaNacimiento.getMonth());
        const años = Math.floor(diffMeses / 12);
        const meses = diffMeses % 12;
        
        if (meses === 0) {
            return `${años} años`;
        } else if (años === 0) {
            return `${meses} ${meses === 1 ? 'mes' : 'meses'}`;
        } else {
            return `${años} ${años === 1 ? 'año' : 'años'} y ${meses} ${meses === 1 ? 'mes' : 'meses'}`;
        }
        
    } else if (nacimiento.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Formato YYYY-MM-DD
        fechaNacimiento = new Date(nacimiento);
        const diffTiempo = hoy - fechaNacimiento;
        const diffDias = Math.floor(diffTiempo / (1000 * 60 * 60 * 24));
        const años = Math.floor(diffDias / 365);
        const meses = Math.floor((diffDias % 365) / 30);
        
        if (años === 0 && meses === 0) {
            const semanas = Math.floor(diffDias / 7);
            if (semanas === 0) {
                return `${diffDias} ${diffDias === 1 ? 'día' : 'días'}`;
            } else {
                return `${semanas} ${semanas === 1 ? 'semana' : 'semanas'}`;
            }
        } else if (años === 0) {
            return `${meses} ${meses === 1 ? 'mes' : 'meses'}`;
        } else if (meses === 0) {
            return `${años} ${años === 1 ? 'año' : 'años'}`;
        } else {
            return `${años} ${años === 1 ? 'año' : 'años'} y ${meses} ${meses === 1 ? 'mes' : 'meses'}`;
        }
        
    } else {
        // Formato no reconocido
        return nacimiento;
    }
}

// Función para cargar datos completos de perros
async function cargarDatosCompletosPerros(datos) {
    datosCompletosPerros = {};
    const nombresPerros = new Set();
    
    // Recoger todos los nombres únicos de perros
    Object.values(datos).forEach(perros => {
        perros.forEach(nombre => {
            if (nombre && nombre.trim() !== '') {
                nombresPerros.add(nombre);
            }
        });
    });
    
    // Cargar datos de cada perro
    for (let nombre of nombresPerros) {
        try {
            const url = `https://raw.githubusercontent.com/pesaher/perros/refs/heads/main/archivos/perros/${encodeURIComponent(nombre)}.json?v=${Date.now()}`;
            const respuesta = await fetch(url);
            if (respuesta.ok) {
                const datosPerro = await respuesta.json();
                datosCompletosPerros[nombre] = datosPerro;
            }
        } catch (error) {
            console.warn(`No se pudieron cargar los datos de ${nombre}:`, error);
        }
    }
}

// Funciones para crear selectores en modo edición
function crearSelectorGenerico(nombre, opciones, valorActual) {
    let html = `<select name="${nombre}">`;
    
    for (const [valor, texto] of Object.entries(opciones)) {
        // Convertir el valor actual a string para comparar correctamente
        let valorActualStr;
        
        if (valorActual === null || valorActual === undefined) {
            // Si el valor actual es null/undefined, seleccionar la opción "???" (valor vacío)
            valorActualStr = '';
        } else {
            valorActualStr = String(valorActual);
        }
        
        const seleccionado = valor === valorActualStr ? 'selected' : '';
        html += `<option value="${valor}" ${seleccionado}>${texto}</option>`;
    }
    
    html += '</select>';
    return html;
}

function crearSelectorPaseo(valorActual) {
    const opciones = {
        '0': 'Pasea bien',
        '1': 'Miedo (gestionable)',
        '2': 'Miedo (bloqueo)',
        '3': 'Reactivo',
        '4': 'Tira',
        '': '???'
    };
    
    return crearSelectorGenerico('paseo', opciones, valorActual);
}

function crearSelectorSociablePerros(valorActual) {
    const opciones = {
        '0': 'Sí',
        '1': 'Selectivo',
        '2': 'No',
        '3': 'No sabe',
        '': '???'
    };
    
    return crearSelectorGenerico('sociableConPerros', opciones, valorActual);
}

function crearSelectorSociablePersonas(valorActual) {
    const opciones = {
        '0': 'Sí',
        '1': 'Selectivo',
        '2': 'Mal con hombres',
        '3': 'No',
        '': '???'
    };
    
    return crearSelectorGenerico('sociableConPersonas', opciones, valorActual);
}

function crearSelectorBooleano(nombre, valorActual, permitirNull = true) {
    let html = `<select name="${nombre}">`;
    
    if (permitirNull) {
        // Opciones con "???"
        html += `<option value="" ${(valorActual === null || valorActual === undefined) ? 'selected' : ''}>???</option>`;
        html += `<option value="true" ${valorActual === true ? 'selected' : ''}>✅ Sí</option>`;
        html += `<option value="false" ${valorActual === false ? 'selected' : ''}>❌ No</option>`;
    } else {
        // Opciones sin "???" - Chip no puede ser null
        html += `<option value="true" ${valorActual === true ? 'selected' : ''}>✅ Sí</option>`;
        html += `<option value="false" ${valorActual === false || valorActual === null || valorActual === undefined ? 'selected' : ''}>❌ No</option>`;
    }
    
    html += '</select>';
    return html;
}

function crearSelectorSexo(valorActual) {
    const opciones = {
        'true': 'Macho',
        'false': 'Hembra',
        '': '???'
    };
    
    return crearSelectorGenerico('macho', opciones, valorActual);
}

function crearSelectorReservado(valorActual) {
    const opciones = {
        'null': '🔓 Disponible',
        'true': '🔒 Reservado',
        'false': '🔒 Adoptado',
        '': '???'
    };
    
    return crearSelectorGenerico('reservado', opciones, valorActual);
}

// Función para crear selector de problemas de salud
function crearSelectorProblemasSalud(valorActual) {
    // ValorActual debe ser un array de integers
    let problemasArray = Array.isArray(valorActual) ? valorActual : [];
    
    const problemas = [
        {id: 0, nombre: 'Leishmania'},
        {id: 1, nombre: 'Ehrlichia'},
        {id: 2, nombre: 'Borrelia'},
        {id: 3, nombre: 'Cáncer'},
        {id: 4, nombre: 'Displasia'},
        {id: 5, nombre: 'Tumor benigno'}
    ];
    
    let html = `<div class="selector-multiple">`;
    
    problemas.forEach(problema => {
        const estaSeleccionado = problemasArray.includes(problema.id);
        html += `
            <label class="opcion-multiple">
                <input type="checkbox" name="problemasSalud" value="${problema.id}" ${estaSeleccionado ? 'checked' : ''}>
                ${problema.nombre}
            </label>
        `;
    });
    
    html += `</div>`;
    return html;
}
