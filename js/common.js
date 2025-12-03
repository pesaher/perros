// ==================== CONFIGURACIÓN SUPABASE ====================
const SUPABASE_CONFIG = {
  url: 'https://qduokhbrlfhjvbtaylud.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkdW9raGJybGZoanZidGF5bHVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NjY1NzYsImV4cCI6MjA4MDM0MjU3Nn0.lLUH2pB9S9uWRsRN4Yo6Vqypdr1qROQT-6rwyMjxLpM'
};

let supabaseClient = null;
let datosCompletosPerros = {};

// Inicializar Supabase
function inicializarSupabase() {
  if (window.supabase && SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey) {
    supabaseClient = window.supabase.createClient(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.anonKey
    );
    console.log('✅ Supabase inicializado');
    return true;
  }
  return false;
}

// Cargar script de Supabase automáticamente
function cargarSupabase() {
  if (window.supabase) {
    inicializarSupabase();
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://unpkg.com/@supabase/supabase-js@2.38.0/dist/umd/supabase.min.js';
  script.onload = () => {
    console.log('📦 Supabase SDK cargado');
    inicializarSupabase();
  };
  script.onerror = () => {
    console.warn('❌ No se pudo cargar Supabase SDK');
  };
  document.head.appendChild(script);
}

// Llamar al cargar la página
cargarSupabase();
// ==================== FIN CONFIGURACIÓN ====================

// ==================== FUNCIONES UTILIDAD ====================
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
  const nombreModificado = nombre.charAt(0).toUpperCase() + nombre.slice(1).toLowerCase();
  return nombreModificado.replace(/([a-zA-Z]+)(\d+)/, (_, letras, num) =>
    letras + ' ' + num
  );
}

function obtenerSeccion(nombre) {
  return nombre.replace(/([a-zA-Z]+)(\d+)/, (_, letras, num) =>
    letras.toLowerCase()
  );
}

// ==================== FUNCIONES DE EDAD ====================
function calcularEdadEnAños(nacimiento) {
  if (!nacimiento) return null;
  const hoy = new Date();
  let fechaNacimiento;

  const parsed = nacimiento.replace(/[\/\.]/g, '-');

  if (parsed.match(/^\d{4}$/)) {
    fechaNacimiento = new Date(parseInt(parsed), 0, 1);
  } else if (parsed.match(/^\d{1,2}-\d{4}$/)) {
    const [mes, año] = parsed.split('-');
    fechaNacimiento = new Date(parseInt(año), parseInt(mes) - 1, 1);
  } else if (parsed.match(/^\d{4}-\d{1,2}$/)) {
    const [año, mes] = parsed.split('-');
    fechaNacimiento = new Date(parseInt(año), parseInt(mes) - 1, 1);
  } else if (parsed.match(/^\d{1,2}-\d{1,2}-\d{4}$/)) {
    const [dia, mes, año] = parsed.split('-');
    fechaNacimiento = new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia));
  } else if (parsed.match(/^\d{4}-\d{1,2}-\d{1,2}$/)) {
    const [año, mes, dia] = parsed.split('-');
    fechaNacimiento = new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia));
  } else {
    return null;
  }

  const diffTiempo = hoy - fechaNacimiento;
  return diffTiempo / (1000 * 60 * 60 * 24 * 365.25);
}

function calcularEdad(nacimiento) {
  if (!nacimiento) return '???';

  const hoy = new Date();
  let fechaNacimiento;

  const parsedNacimiento = nacimiento.replace(/[\/\.]/g, '-');

  if (parsedNacimiento.match(/^\d{4}$/)) {
    fechaNacimiento = new Date(parseInt(parsedNacimiento), 0, 1);
    const años = hoy.getFullYear() - fechaNacimiento.getFullYear();
    return `Unos ${años} años`;

  } else if (parsedNacimiento.match(/^\d{1,2}-\d{4}$/)) {
    const [mes, año] = parsedNacimiento.split('-');
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

  } else if (parsedNacimiento.match(/^\d{4}-\d{1,2}$/)) {
    const [año, mes] = parsedNacimiento.split('-');
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

  } else if (parsedNacimiento.match(/^\d{1,2}-\d{1,2}-\d{4}$/)) {
    const [dia, mes, año] = parsedNacimiento.split('-');
    fechaNacimiento = new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia));
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

  } else if (parsedNacimiento.match(/^\d{4}-\d{1,2}-\d{1,2}$/)) {
    const [año, mes, dia] = parsedNacimiento.split('-');
    fechaNacimiento = new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia));
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
    return nacimiento;
  }
}

// ==================== FUNCIONES SUPABASE ====================
// Cargar lista de cheniles desde GitHub (estructura fija)
async function cargarListaCheniles() {
  try {
    const resp = await fetch('https://raw.githubusercontent.com/pesaher/perros/main/archivos/cheniles.json?v=' + Date.now());
    const estructura = await resp.json();
    return Object.keys(estructura); // Devuelve array: ["chenilA1", "chenilA2", ...]
  } catch (error) {
    console.error('❌ Error cargando cheniles:', error);
    return [];
  }
}

// Cargar perros desde Supabase y agrupar por chenil
async function cargarPerrosAgrupados() {
  if (!supabaseClient) {
    console.warn('Supabase no disponible');
    return {};
  }

  try {
    console.log('🐕 Cargando perros desde Supabase...');

    const { data: perros, error } = await supabaseClient
      .from('perros')
      .select('id, chenil_id, datos');

    if (error) throw error;

    // Resetear datos globales
    datosCompletosPerros = {};
    const estructura = {};

    // Procesar cada perro
    perros.forEach(perro => {
      // Guardar datos completos
      datosCompletosPerros[perro.id] = perro.datos;

      // Agrupar por chenil
      if (perro.chenil_id) {
        if (!estructura[perro.chenil_id]) {
          estructura[perro.chenil_id] = [];
        }
        estructura[perro.chenil_id].push(perro.id);
      }
    });

    console.log(`✅ ${perros.length} perros cargados`);
    return estructura;

  } catch (error) {
    console.error('❌ Error cargando perros:', error);
    return {};
  }
}

// Guardar/actualizar perro en Supabase
async function guardarPerroEnSupabase(id, datos) {
  if (!supabaseClient) {
    console.warn('Supabase no disponible');
    return false;
  }

  try {
    const { error } = await supabaseClient
      .from('perros')
      .upsert({
        id: id,
        datos: datos,
        chenil_id: datos.chenil_id || null
      }, { onConflict: 'id' });

    if (error) throw error;

    console.log(`💾 ${id} guardado en Supabase`);
    return true;

  } catch (error) {
    console.error('❌ Error guardando:', error);
    return false;
  }
}

// Mover perro a otro chenil
async function moverPerroChenil(perroId, nuevoChenilId) {
  if (!supabaseClient) return false;

  try {
    // Obtener datos actuales
    const { data: perroActual } = await supabaseClient
      .from('perros')
      .select('datos')
      .eq('id', perroId)
      .single();

    if (!perroActual) return false;

    // Actualizar
    const nuevosDatos = {
      ...perroActual.datos,
      chenil_id: nuevoChenilId
    };

    const { error } = await supabaseClient
      .from('perros')
      .update({
        chenil_id: nuevoChenilId,
        datos: nuevosDatos
      })
      .eq('id', perroId);

    return !error;

  } catch (error) {
    console.error('❌ Error moviendo perro:', error);
    return false;
  }
}

// Cargar datos completos de perros (para compatibilidad)
async function cargarDatosCompletosPerros(datosEstructura) {
  // Esta función ya no es necesaria con Supabase,
  // pero la mantenemos por compatibilidad
  console.log('📋 Datos ya cargados via cargarPerrosAgrupados()');
}

// ==================== FUNCIONES DE SELECTORES ====================
function crearSelectorGenerico(nombre, opciones, valorActual) {
  let html = `<select name="${nombre}">`;

  for (const [valor, texto] of Object.entries(opciones)) {
    let valorActualStr;

    if (valorActual === null || valorActual === undefined) {
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
    html += `<option value="true" ${valorActual === true ? 'selected' : ''}>✅ Sí</option>`;
    html += `<option value="false" ${valorActual === false ? 'selected' : ''}>❌ No</option>`;
    html += `<option value="" ${(valorActual === null || valorActual === undefined) ? 'selected' : ''}>???</option>`;
  } else {
    html += `<option value="true" ${valorActual === true ? 'selected' : ''}>✅ Sí</option>`;
    html += `<option value="false" ${valorActual === false || valorActual === null || valorActual === undefined ? 'selected' : ''}>❌ No</option>`;
  }

  html += '</select>';
  return html;
}

function crearSelectorSexo(valorActual) {
  const opciones = {
    'true': 'Macho',
    'false': 'Hembra'
  };

  return crearSelectorGenerico('macho', opciones, valorActual === null || valorActual === undefined ? true : valorActual);
}

function crearSelectorEstado(valorActual) {
  const opciones = {
    '0': 'Disponible',
    '1': 'Chip (preguntar)',
    '2': 'Reservado',
    '3': 'Residencia',
    '': '???'
  };

  return crearSelectorGenerico('estado', opciones, valorActual);
}

function crearSelectorProblemasSalud(valorActual) {
  let problemasArray = Array.isArray(valorActual) ? valorActual : [];

  const problemas = [
    {id: 0, nombre: 'Leishmania'},
    {id: 1, nombre: 'Ehrlichia'},
    {id: 2, nombre: 'Borrelia'},
    {id: 3, nombre: 'Cáncer'},
    {id: 4, nombre: 'Displasia'},
    {id: 5, nombre: 'Tumor benigno'},
    {id: 6, nombre: 'Filaria'},
    {id: 7, nombre: 'Anaplasma'}
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

function crearSelectorDificultad(valorActual) {
  const opciones = {
    '0': '🟢 Fácil',
    '1': '🟡 Medio',
    '2': '🔴 Difícil',
    '': '???'
  };

  return crearSelectorGenerico('nivelDeDificultad', opciones, valorActual);
}

function crearSelectorProteccionRecursos(valorActual) {
  const opciones = {
    '0': 'No',
    '1': 'Solo con perros',
    '2': 'Solo con personas',
    '3': 'Con perros y personas',
    '': '???'
  };

  return crearSelectorGenerico('proteccionDeRecursos', opciones, valorActual);
}

function crearSelectorInstintoPredacion(valorActual) {
  let instintoArray = Array.isArray(valorActual) ? valorActual : [];

  const instintos = [
    {id: 0, nombre: 'Niños'},
    {id: 1, nombre: 'Perros pequeños'},
    {id: 2, nombre: 'Gatos'}
  ];

  let html = `<div class="selector-multiple">`;

  instintos.forEach(instinto => {
    const estaSeleccionado = instintoArray.includes(instinto.id);
    html += `
      <label class="opcion-multiple">
        <input type="checkbox" name="instintoDePredacion" value="${instinto.id}" ${estaSeleccionado ? 'checked' : ''}>
        ${instinto.nombre}
      </label>
    `;
  });

  html += `</div>`;
  return html;
}

// ==================== FUNCIONES DE COLOR ====================
function determinarColorEstado(campo, valor, datosCompletos = {}) {
  if (valor === null || valor === undefined || valor === '') {
    return 'neutral';
  }

  switch (campo) {
    case 'estado':
      if (valor === 0) return 'bueno';
      if (valor === 1) return 'medio';
      if (valor === 2 || valor === 3) return 'malo';
      break;

    case 'paseo':
      if (valor === 0) return 'bueno';
      if (valor === 1) return 'medio';
      if (valor === 2 || valor === 3 || valor === 4) return 'malo';
      break;

    case 'sociableConPerros':
      if (valor === 0) return 'bueno';
      if (valor === 1) return 'medio';
      if (valor === 2 || valor === 3) return 'malo';
      break;

    case 'sociableConPersonas':
      if (valor === 0) return 'bueno';
      if (valor === 1) return 'medio';
      if (valor === 2 || valor === 3) return 'malo';
      break;

    case 'sociableConGatos':
      if (valor === true) return 'bueno';
      if (valor === false) return 'malo';
      break;

    case 'proteccionDeRecursos':
      if (valor === 0) return 'bueno';
      if (valor === 1 || valor === 2 || valor === 3) return 'malo';
      break;

    case 'ppp':
      if (valor === true) return 'malo';
      if (valor === false) return 'bueno';
      break;

    case 'apadrinado':
      if (valor === true) return 'bueno';
      if (valor === false) return 'malo';
      break;

    case 'instintoDePredacion':
      if (!Array.isArray(valor) || valor.length === 0) return 'bueno';
      return 'malo';

    case 'problemasDeSalud':
      if (!Array.isArray(valor) || valor.length === 0) return 'bueno';
      return 'malo';

    case 'peso':
    case 'altura':
    case 'edad':
      return 'bueno';
  }

  return 'neutral';
}

function determinarColorDificultad(nivel) {
  if (nivel === null || nivel === undefined) return null;

  switch(nivel) {
    case 0: return 'bueno';
    case 1: return 'medio';
    case 2: return 'malo';
    default: return null;
  }
}

function tieneInformacionIncompleta(datosPerro) {
  if (!datosPerro) return false;

  const camposRequeridos = [
    'nombre',
    'estado',
    'macho',
    'nacimiento',
    'peso',
    'altura',
    'paseo',
    'sociableConPerros',
    'sociableConPersonas',
    'proteccionDeRecursos',
    'ppp',
    'apadrinado',
    'nivelDeDificultad'
  ];

  return camposRequeridos.some(campo => {
    const valor = datosPerro[campo];
    if (valor === null || valor === undefined) return true;
    if (typeof valor === 'string' && valor.trim() === '') return true;
    if (Array.isArray(valor) && valor.length === 0) return true;
    return false;
  });
}
