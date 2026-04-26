// Variables específicas de perro
let datosOriginales = {};
let modoEdicion = false;
let nombrePerro = '';

// Función principal de carga
function cargarDatosPerro() {
    nombrePerro = new URLSearchParams(window.location.search).get('nombre');

    if (!nombrePerro) {
        document.getElementById('contenido-perro').innerHTML = '<p>Error: No se especificó el nombre del perro</p>';
    } else {
        document.title = `${nombrePerro} 🐾`;
        cargarDatosPerroDesdeAPI();
    }
}

async function cargarDatosPerroDesdeAPI() {
    // PRIMERO: Intentar cargar desde Supabase
    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient
            .from('perros')
            .select('datos')
            .eq('id', nombrePerro)
            .single();

            if (!error && data) {
                console.log(`✅ ${nombrePerro} cargado desde Supabase`);
                cargarYMostrarPerro(data.datos);
                return;
            }
        } catch (error) {
            console.warn(`⚠️ Supabase falló para ${nombrePerro}:`, error);
        }
    }

    // SEGUNDO: Si todo falla, usar el fallback
    await cargarDesdePlantilla();
}

// Función para cargar y mostrar datos del perro
function cargarYMostrarPerro(datosPerro) {
    datosOriginales = { ...datosPerro };
    mostrarDatosPerro();
    configurarEventos();
}

// Función auxiliar para cargar desde plantilla
async function cargarDesdePlantilla() {
    try {
        // Cargar plantilla de perro.json
        const plantillaUrl = 'https://raw.githubusercontent.com/pesaher/perros/refs/heads/main/archivos/perro.json';
        const respuesta = await fetch(plantillaUrl);
        const plantilla = await respuesta.json();

        // Crear datos del perro usando la plantilla + nombre
        datosOriginales = { ...plantilla };
        mostrarDatosPerro();
        configurarEventos();

        console.warn(`⚠️ Mostrando datos de plantilla para ${nombrePerro} (no encontrado)`);

    } catch (error) {
        document.getElementById('contenido-perro').innerHTML = `<p>Error: No se pudieron cargar los datos para el perro "${nombrePerro}"</p>`;
    }
}

// Función para mostrar datos del perro
function mostrarDatosPerro() {
    const contenedor = document.getElementById('contenido-perro');

    const vistaActual = window.APP_CONFIG?.VISTA;

    // Función helper para verificar si un dato debe mostrarse
    const debeMostrarDato = (dato) => {
        if (vistaActual === 'paseos') {
            const datosAMostrar = ['dificultad', 'paseo', 'sociableConPerros', 'sociableConPersonas', 'proteccionDeRecursos', 'observacionesExtra', 'protocoloParticular'];
            return datosAMostrar.includes(dato);
        }
        else if (vistaActual === 'adopciones') {
            const datosAMostrar = ['estado', 'sexo', 'edad', 'peso', 'paseo', 'sociableConPerros', 'sociableConPersonas', 'sociableConGatos', 'ppp', 'instintoDePredacion', 'problemasDeSalud', 'observacionesExtra'];
            return datosAMostrar.includes(dato);
        }
        else if (vistaActual === 'padrinos') {
            const datosAMostrar = ['estado', 'apadrinado'];
            return datosAMostrar.includes(dato);
        }
        // Por defecto, mostrar todos
        return true;
    };

    // Mapeos de valores
    const estados = {
        0: "Disponible",
        1: "Chip (preguntar)",
        2: "Reservado",
        3: "Residencia"
    };

    const nivelesPaseo = {
        0: "Pasea bien",
        1: "Miedo (gestionable)",
        2: "Miedo (bloqueo)",
        3: "Reactivo",
        4: "Tira"
    };

    const sociableConPerros = {
        0: "Sí",
        1: "Selectivo",
        2: "No",
        3: "No sabe"
    };

    const sociableConPersonas = {
        0: "Sí",
        1: "Selectivo",
        2: "Mal con hombres",
        3: "No"
    };

    const proteccionDeRecursos = {
        0: "No",
        1: "Solo con perros",
        2: "Solo con personas",
        3: "Con perros y personas"
    };

    // Estados booleanos
    const getEstadoBooleano = (valor, textoTrue, textoFalse) => {
        if (valor === true) return textoTrue;
        if (valor === false) return textoFalse;
        return '???';
    };

    // Valores formateados para modo visual
    const textoEstado = estados.hasOwnProperty(datosOriginales.estado) ? estados[datosOriginales.estado] : '???';
    const textoPaseo = nivelesPaseo.hasOwnProperty(datosOriginales.paseo) ? nivelesPaseo[datosOriginales.paseo] : '???';
    const textoSociableConPerros = sociableConPerros.hasOwnProperty(datosOriginales.sociableConPerros) ? sociableConPerros[datosOriginales.sociableConPerros] : '???';
    const textoSociableConPersonas = sociableConPersonas.hasOwnProperty(datosOriginales.sociableConPersonas) ? sociableConPersonas[datosOriginales.sociableConPersonas] : '???';
    const textoSociableConGatos = getEstadoBooleano(datosOriginales.sociableConGatos, 'Sí', 'No');
    const textoProteccionDeRecursos = proteccionDeRecursos.hasOwnProperty(datosOriginales.proteccionDeRecursos) ? proteccionDeRecursos[datosOriginales.proteccionDeRecursos] : '???';
    const textoPPP = getEstadoBooleano(datosOriginales.ppp, 'Sí', 'No');
    const textoApadrinado = getEstadoBooleano(datosOriginales.apadrinado, 'Sí', 'No');

    // Problemas de salud
    const textoProblemasDeSalud = Array.isArray(datosOriginales.problemasDeSalud) && datosOriginales.problemasDeSalud.length > 0 ? datosOriginales.problemasDeSalud.map(id => {
        const problemas = ['Leishmania', 'Ehrlichia', 'Borrelia', 'Cáncer', 'Displasia', 'Tumor benigno', 'Filaria', 'Anaplasma'];
        return problemas[id] || 'Desconocido';
    }).join(', ') : 'Ninguno';

    // Mapeo de instinto de predación
    const textoInstintoDePredacion = Array.isArray(datosOriginales.instintoDePredacion) && datosOriginales.instintoDePredacion.length > 0 ? datosOriginales.instintoDePredacion.map(id => {
        const instintos = ['Niños', 'Perros pequeños', 'Gatos'];
        return instintos[id] || 'Desconocido';
    }).join(', ') : 'Ninguno';

    // Valores por defecto y formateo
    const nombreMostrar = nombrePerro && nombrePerro.trim() !== '' ? nombrePerro.toUpperCase() : 'JOHN DOGE';
    const edadMostrar = datosOriginales.nacimiento ? calcularEdad(datosOriginales.nacimiento) : '???';
    const pesoMostrar = datosOriginales.peso !== null && datosOriginales.peso !== undefined ? `${datosOriginales.peso} kg` : '???';

    // Icono de sexo
    const iconoSexo = datosOriginales.macho === true ? '♂️' : datosOriginales.macho === false ? '♀️' : '';

    // Determinar color de dificultad
    const colorDificultad = determinarColorDificultad(datosOriginales.nivelDeDificultad);
    const claseDificultad = colorDificultad ? `dificultad-${colorDificultad}` : '';

    let html = `
    <div class="campos-grid">
    <!-- Nombre ocupa toda la fila con iconos -->
    <div class="campo-completo">
    <div class="valor nombre-perro ${!modoEdicion ? claseDificultad : ''}">
    <div class="nombre-contenedor">
    ${modoEdicion ?
        `<input type="text" data-campo="nombre" value="${nombrePerro || ''}" placeholder="Nombre del perro">` :
        nombreMostrar
    }
    ${!modoEdicion && iconoSexo ? `<span class="icono-sexo">${iconoSexo}</span>` : ''}
    </div>
    </div>
    </div>

    <!-- Campos en dos columnas -->
    ${modoEdicion ? `
    ${debeMostrarDato('dificultad') ? `
    <div class="campo ${modoEdicion ? 'campo-editable' : ''}">
    <div class="etiqueta">Nivel de Dificultad</div>
    <div class="valor">
    ${modoEdicion ? crearSelectorDificultad(datosOriginales.nivelDeDificultad) : ''}
    </div>
    </div>
    ` : ''}

    ${debeMostrarDato('sexo') ? `
    <div class="campo campo-editable">
    <div class="etiqueta">Sexo</div>
    <div class="valor">
    ${crearSelectorSexo(datosOriginales.macho)}
    </div>
    </div>
    ` : ''}
    ` : ''}

    ${debeMostrarDato('estado') ? `
    <div class="campo ${modoEdicion ? 'campo-editable' : ''}">
    <div class="etiqueta">Estado</div>
    <div class="valor ${!modoEdicion ? `estado-${determinarColorEstado('estado', datosOriginales.estado)}` : ''}">
    ${modoEdicion ? crearSelectorEstado(datosOriginales.estado) : textoEstado}
    </div>
    </div>
    ` : ''}

    ${debeMostrarDato('edad') ? `
    <div class="campo ${modoEdicion ? 'campo-editable' : ''}">
    <div class="etiqueta">${modoEdicion ? 'Fecha de Nacimiento' : 'Edad'}</div>
    <div class="valor ${!modoEdicion ? `estado-${determinarColorEstado('edad', calcularEdadEnAños(datosOriginales.nacimiento))}` : ''}">
    ${modoEdicion ?
        `<input type="text" data-campo="nacimiento" value="${datosOriginales.nacimiento || ''}" placeholder="DD/MM/YYYY, MM/YYYY o YYYY">` :
        edadMostrar
    }
    </div>
    </div>
    ` : ''}

    ${debeMostrarDato('peso') ? `
    <div class="campo ${modoEdicion ? 'campo-editable' : ''}">
    <div class="etiqueta">Peso (kg)</div>
    <div class="valor ${!modoEdicion ? `estado-${determinarColorEstado('peso', datosOriginales.peso)}` : ''}">
    ${modoEdicion ?
        `<input type="number" data-campo="peso" value="${datosOriginales.peso || ''}" placeholder="Peso en kg" step="0.1" min="0">` :
        pesoMostrar
    }
    </div>
    </div>
    ` : ''}

    ${debeMostrarDato('paseo') ? `
    <div class="campo ${modoEdicion ? 'campo-editable' : ''}">
    <div class="etiqueta">Nivel de Paseo</div>
    <div class="valor ${!modoEdicion ? `estado-${determinarColorEstado('paseo', datosOriginales.paseo)}` : ''}">
    ${modoEdicion ? crearSelectorPaseo(datosOriginales.paseo) : textoPaseo}
    </div>
    </div>
    ` : ''}

    ${debeMostrarDato('sociableConPerros') ? `
    <div class="campo ${modoEdicion ? 'campo-editable' : ''}">
    <div class="etiqueta">Sociable con Perros</div>
    <div class="valor ${!modoEdicion ? `estado-${determinarColorEstado('sociableConPerros', datosOriginales.sociableConPerros)}` : ''}">
    ${modoEdicion ? crearSelectorSociableConPerros(datosOriginales.sociableConPerros) : textoSociableConPerros}
    </div>
    </div>
    ` : ''}

    ${debeMostrarDato('sociableConPersonas') ? `
    <div class="campo ${modoEdicion ? 'campo-editable' : ''}">
    <div class="etiqueta">Sociable con Personas</div>
    <div class="valor ${!modoEdicion ? `estado-${determinarColorEstado('sociableConPersonas', datosOriginales.sociableConPersonas)}` : ''}">
    ${modoEdicion ? crearSelectorSociableConPersonas(datosOriginales.sociableConPersonas) : textoSociableConPersonas}
    </div>
    </div>
    ` : ''}

    ${debeMostrarDato('sociableConGatos') ? `
    <div class="campo ${modoEdicion ? 'campo-editable' : ''}">
    <div class="etiqueta">Sociable con Gatos</div>
    <div class="valor ${!modoEdicion ? `estado-${determinarColorEstado('sociableConGatos', datosOriginales.sociableConGatos)}` : ''}">
    ${modoEdicion ? crearSelectorBooleano('sociableConGatos', datosOriginales.sociableConGatos, true) : textoSociableConGatos}
    </div>
    </div>
    ` : ''}

    ${debeMostrarDato('proteccionDeRecursos') ? `
    <div class="campo ${modoEdicion ? 'campo-editable' : ''}">
    <div class="etiqueta">Protección de Recursos</div>
    <div class="valor ${!modoEdicion ? `estado-${determinarColorEstado('proteccionDeRecursos', datosOriginales.proteccionDeRecursos)}` : ''}">
    ${modoEdicion ? crearSelectorProteccionDeRecursos(datosOriginales.proteccionDeRecursos) : textoProteccionDeRecursos
    }
    </div>
    </div>
    ` : ''}

    ${debeMostrarDato('ppp') ? `
    <div class="campo ${modoEdicion ? 'campo-editable' : ''}">
    <div class="etiqueta">PPP</div>
    <div class="valor ${!modoEdicion ? `estado-${determinarColorEstado('ppp', datosOriginales.ppp)}` : ''}">
    ${modoEdicion ? crearSelectorBooleano('ppp', datosOriginales.ppp, false) : textoPPP}
    </div>
    </div>
    ` : ''}

    ${debeMostrarDato('apadrinado') ? `
    <div class="campo ${modoEdicion ? 'campo-editable' : ''}">
    <div class="etiqueta">Apadrinado</div>
    <div class="valor ${!modoEdicion ? `estado-${determinarColorEstado('apadrinado', datosOriginales.apadrinado)}` : ''}">
    ${modoEdicion ? crearSelectorBooleano('apadrinado', datosOriginales.apadrinado, false) : textoApadrinado}
    </div>
    </div>
    ` : ''}
    </div>

    <!-- Instinto de Predación -->
    ${debeMostrarDato('instintoDePredacion') ? `
    <div class="campo-completo ${modoEdicion ? 'campo-editable' : ''}">
    <div class="etiqueta">Instinto de Predación</div>
    <div class="valor ${!modoEdicion ? `estado-${determinarColorEstado('instintoDePredacion', datosOriginales.instintoDePredacion)}` : ''}">
    ${modoEdicion ?
        crearSelectorInstintoDePredacion(datosOriginales.instintoDePredacion) :
        textoInstintoDePredacion
    }
    </div>
    </div>
    ` : ''}

    <!-- Problemas de Salud -->
    ${debeMostrarDato('problemasDeSalud') ? `
    <div class="campo-completo ${modoEdicion ? 'campo-editable' : ''}">
    <div class="etiqueta">Problemas de Salud</div>
    <div class="valor ${!modoEdicion ? `estado-${determinarColorEstado('problemasDeSalud', datosOriginales.problemasDeSalud)}` : ''}">
    ${modoEdicion ?
        crearSelectorProblemasDeSalud(datosOriginales.problemasDeSalud) :
        textoProblemasDeSalud
    }
    </div>
    </div>
    ` : ''}
    `;

    // Observaciones Extra
    if (debeMostrarDato('observacionesExtra') && (modoEdicion || (datosOriginales.observacionesExtra && datosOriginales.observacionesExtra.toString().trim() !== ''))) {
        html += `
        <div class="campo-completo ${modoEdicion ? 'campo-editable' : ''}">
        <div class="etiqueta">Observaciones Extra</div>
        <div class="valor ${!modoEdicion ? 'protocolo-particular' : ''}">
        ${modoEdicion ?
            `<textarea data-campo="observacionesExtra" placeholder="Observaciones extra...">${datosOriginales.observacionesExtra || ''}</textarea>` :
            (datosOriginales.observacionesExtra ? datosOriginales.observacionesExtra.replace(/\n/g, '<br>') : '')
        }
        </div>
        </div>
        `;
    }

    // Protocolo particular
    if (debeMostrarDato('protocoloParticular') && (modoEdicion || (datosOriginales.protocoloParticular && datosOriginales.protocoloParticular.toString().trim() !== ''))) {
        html += `
        <div class="campo-completo ${modoEdicion ? 'campo-editable' : ''}">
        <div class="etiqueta">Protocolo Particular</div>
        <div class="valor ${!modoEdicion ? 'protocolo-particular' : ''}">
        ${modoEdicion ?
            `<textarea data-campo="protocoloParticular" placeholder="Protocolo particular...">${datosOriginales.protocoloParticular || ''}</textarea>` :
            (datosOriginales.protocoloParticular ? datosOriginales.protocoloParticular.replace(/\n/g, '<br>') : '')
        }
        </div>
        </div>
        `;
    }

    // Verificar si debe mostrar el Protocolo de Reactividad
    const debeMostrarProtocolo = debeMostrarDato('paseo') && datosOriginales.paseo === 3; // Reactivo

    // Protocolo de Reactividad (solo en modo visual)
    if (!modoEdicion && debeMostrarProtocolo) {
        html += `
        <div class="campo-completo">
        <div class="etiqueta">Protocolo de Reactividad</div>
        <div class="valor protocolo-particular">
        <p><strong>Objetivo:</strong> que el perro aprenda a mantener la calma en presencia del estímulo.</p>
        <ul>
        <li><strong>Preparación:</strong> dar un paseo previo con olfateo para reducir activación. Evitar correa tensa.</li>
        <li><strong>Distancia segura:</strong> trabajar en el punto donde detecta el estímulo sin reaccionar.</li>
        <li><strong>Si detona:</strong> retirarnos sin hablarle ni regañar.</li>
        <li><strong>Refuerzo:</strong>
        <ul>
        <li>Mira al estímulo → señal ("bien") + chuche.</li>
        <li>Mira sin reaccionar → chuche.</li>
        <li>Con práctica, reducir gradualmente la distancia. Reducir la distancia en cuestión de semanas, no en el mismo día.</li>
        </ul>
        </li>
        <li><strong>Predicción:</strong> "Mira, un perro/persona" → lo ve → premio.</li>
        <li><strong>Con personas:</strong> aprovechar visitas (adoptantes, padrinos, etc.) → pedir que tiren chuches desde lejos. Adaptar según perfil (ej. Pezu con hombres mayores, Saratoga con niños, etc.). También adaptar según perro (no pongamos a Light como figurante para Perci, etc.).</li>
        <li><strong>Distracción:</strong> si no hay posibilidad de mantener distancias y la probabilidad de detonar es muy alta, distraemos y nos vamos cagando leches. Pero cuidado con usar esto todo el rato y no dar herramientas al perro por estar continuamente huyendo de todo.</li>
        </ul>
        </div>
        </div>
        `;
    }

    // Protocolo de Protección de Recursos (solo en modo visual)
    if (!modoEdicion && debeMostrarDato('proteccionDeRecursos') && datosOriginales.proteccionDeRecursos !== null && datosOriginales.proteccionDeRecursos !== undefined && datosOriginales.proteccionDeRecursos !== 0) {
        html += `
        <div class="campo-completo">
        <div class="etiqueta">Protocolo de Protección de Recursos (PdR)</div>
        <div class="valor protocolo-particular">
        <p><strong>Objetivo:</strong> que la presencia humana se asocie siempre a algo positivo, nunca se quitan las cosas bruscamente.</p>
        <p><strong>Protocolo de intercambio positivo</strong> (con barrera al inicio, por seguridad):</p>
        <ol>
        <li><strong>Paso 1:</strong> mientras come/mastica, tirar comida extra de alto valor desde fuera.</li>
        <li><strong>Paso 2:</strong> si coge chuches o suelta el objeto, reforzar mucho más → que asocie nuestra presencia a beneficios (dependiendo del grado de tensión se puede valorar introducir el "muy bien").</li>
        <li><strong>Paso 3:</strong> cuando ya se aleje de su recurso (por ejemplo, cogiendo chuches del fondo del chenil, con el hueso en la puerta) empezar a trabajarlo desde dentro en un espacio más amplio (más adelante, atado y con supervisión).</li>
        </ol>
        <p><strong>Complementar</strong> con positivar el bozal de manera progresiva y alternando (no meterlo todo el rato).</p>
        </div>
        </div>
        `;
    }

    // Protocolo de Instinto de Predación (solo en modo visual)
    if (!modoEdicion && debeMostrarDato('instintoDePredacion') && Array.isArray(datosOriginales.instintoDePredacion) && datosOriginales.instintoDePredacion.length > 0) {
        html += `
        <div class="campo-completo">
        <div class="etiqueta">Protocolo de Instinto de Predación</div>
        <div class="valor protocolo-particular">
        <ul>
        <li><strong>Obediencia básica:</strong> reforzar “mírame”, “quieta”, “sienta” (por seguridad).</li>
        <li><strong>Exposición controlada:</strong> ver estímulos a gran distancia, reforzar cuando veamos que están tranquilos.</li>
        <li><strong>Alternativas seguras:</strong> ofrecer mordedores/juguetes/hueso suave (tipo snacks) para redirigir energía.</li>
        <li><strong>Siempre premiar la calma.</strong></li>
        </ul>
        </div>
        </div>
        `;
    }

    contenedor.innerHTML = html;
}

// Función para configurar eventos
function configurarEventos() {
    if (window.APP_CONFIG.MODO_ADMIN)
    {
        const btnEditar = document.getElementById('btnEditar');
        if (btnEditar) {
            btnEditar.addEventListener('click', activarModoEdicion);
        }
    }
}

// Funciones de edición
function activarModoEdicion() {
    if (!window.APP_CONFIG.MODO_ADMIN) return;
    modoEdicion = true;
    mostrarDatosPerro();

    document.getElementById('botonesInferiores').innerHTML = `
    <button class="boton boton-cancelar" id="btnCancelar">✗ Cancelar</button>
    <button class="boton boton-guardar" id="btnGuardar">💾 Guardar</button>
    `;

    document.getElementById('btnCancelar').addEventListener('click', cancelarEdicion);
    document.getElementById('btnGuardar').addEventListener('click', guardarCambios);
}

function cancelarEdicion() {
    modoEdicion = false;
    mostrarDatosPerro();
    restaurarBotonesNormales();
}

function restaurarBotonesNormales() {
    document.getElementById('botonesInferiores').innerHTML = `
    <a href="javascript:history.back()" class="boton boton-volver">← Volver a Cheniles</a>
    <button class="boton boton-editar" id="btnEditar">✏️ Editar</button>
    `;
    configurarEventos();
}

function preservarSiNoExiste(selector, valorOriginal) {
    const elemento = document.querySelector(selector);
    if (elemento !== null) {
        // El campo existe
        return elemento.value;
    } else {
        // El campo no está en esta vista, conservar original
        return valorOriginal;
    }
}

async function guardarCambios() {
    const datosActualizados = { ...datosOriginales };

    // Procesar campos
    const nombreAntiguo = nombrePerro;
    const nombreNuevo = capitalizarNombre(preservarSiNoExiste('input[data-campo="nombre"]', nombreAntiguo));
    datosActualizados.nacimiento = preservarSiNoExiste('input[data-campo="nacimiento"]', datosOriginales.nacimiento);

    const pesoInput = preservarSiNoExiste('input[data-campo="peso"]', datosOriginales.peso);
    datosActualizados.peso = isNaN(parseFloat(pesoInput)) ? null : parseFloat(pesoInput);

    datosActualizados.protocoloParticular = preservarSiNoExiste('textarea[data-campo="protocoloParticular"]', datosOriginales.protocoloParticular);
    datosActualizados.observacionesExtra = preservarSiNoExiste('textarea[data-campo="observacionesExtra"]', datosOriginales.observacionesExtra);

    // Procesar selectores
    const selectPaseo = preservarSiNoExiste('select[data-campo="paseo"]', datosOriginales.paseo);
    datosActualizados.paseo = isNaN(parseInt(selectPaseo)) ? null : parseInt(selectPaseo);

    const selectSociableConPerros = preservarSiNoExiste('select[data-campo="sociableConPerros"]', datosOriginales.sociableConPerros);
    datosActualizados.sociableConPerros = isNaN(parseInt(selectSociableConPerros)) ? null : parseInt(selectSociableConPerros);

    const selectSociableConPersonas = preservarSiNoExiste('select[data-campo="sociableConPersonas"]', datosOriginales.sociableConPersonas);
    datosActualizados.sociableConPersonas = isNaN(parseInt(selectSociableConPersonas)) ? null : parseInt(selectSociableConPersonas);

    const selectSociableConGatos = preservarSiNoExiste('select[data-campo="sociableConGatos"]', datosOriginales.sociableConGatos);
    datosActualizados.sociableConGatos = selectSociableConGatos === 'true' ? true :
    selectSociableConGatos === 'false' ? false : null;

    const selectProteccionDeRecursos = preservarSiNoExiste('select[data-campo="proteccionDeRecursos"]', datosOriginales.proteccionDeRecursos);
    datosActualizados.proteccionDeRecursos = isNaN(parseInt(selectProteccionDeRecursos)) ? null : parseInt(selectProteccionDeRecursos);

    const selectPPP = preservarSiNoExiste('select[data-campo="ppp"]', datosOriginales.ppp);
    datosActualizados.ppp = selectPPP === 'true' ? true :
    selectPPP === 'false' ? false : null;

    const selectApadrinado = preservarSiNoExiste('select[data-campo="apadrinado"]', datosOriginales.apadrinado);
    datosActualizados.apadrinado = selectApadrinado === 'true' ? true : false;

    const selectSexo = preservarSiNoExiste('select[data-campo="macho"]', datosOriginales.macho);
    datosActualizados.macho = selectSexo === 'true' ? true :
    selectSexo === 'false' ? false : null;

    const selectEstado = preservarSiNoExiste('select[data-campo="estado"]', datosOriginales.estado);
    datosActualizados.estado = isNaN(parseInt(selectEstado)) ? null : parseInt(selectEstado);

    const selectDificultad = preservarSiNoExiste('select[data-campo="nivelDeDificultad"]', datosOriginales.nivelDeDificultad);
    datosActualizados.nivelDeDificultad = isNaN(parseInt(selectDificultad)) ? null : parseInt(selectDificultad);

    // Procesar instinto de predación (checkboxes múltiples)
    const instintoDePredacionSeleccionados = [];
    document.querySelectorAll('input[data-campo="instintoDePredacion"]:checked').forEach(checkbox => {
        instintoDePredacionSeleccionados.push(parseInt(checkbox.value));
    });
    datosActualizados.instintoDePredacion = document.querySelector('input[data-campo="instintoDePredacion"]') ? instintoDePredacionSeleccionados : datosOriginales.instintoDePredacion;

    // Procesar problemas de salud (checkboxes múltiples)
    const problemasDeSaludSeleccionados = [];
    document.querySelectorAll('input[data-campo="problemasDeSalud"]:checked').forEach(checkbox => {
        problemasDeSaludSeleccionados.push(parseInt(checkbox.value));
    });
    datosActualizados.problemasDeSalud = document.querySelector('input[data-campo="problemasDeSalud"]') ? problemasDeSaludSeleccionados : datosOriginales.problemasDeSalud;

    try {
        // Guardar en Supabase
        if (nombreNuevo !== nombreAntiguo)
        {
            const { data, error } = await supabaseClient.rpc(
                'renombrar_perro',
                {
                    id_actual: nombreAntiguo,
                    id_nuevo: nombreNuevo
                }
            );

            if (data && data.success === true)
            {
                nombrePerro = nombreNuevo;
            }
        }

        const exito = await guardarPerroEnSupabase(nombrePerro, datosActualizados);
        if (exito) {
            // Actualizar datos locales
            datosOriginales = datosActualizados;
            cancelarEdicion();
            console.log('✅ Cambios guardados en Supabase');
        }
    } catch (error) {
        console.error('Error al guardar:', error);
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    cargarDatosPerro();
});
