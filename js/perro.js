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
        cargarDatosPerroDesdeAPI(nombrePerro);
    }
}

// Función para cargar y mostrar datos del perro
function cargarYMostrarPerro(nombre, datosPerro) {
    datosOriginales = JSON.parse(JSON.stringify(datosPerro));
    document.title = `${datosPerro.nombre && datosPerro.nombre.trim() !== '' ? datosPerro.nombre.toUpperCase() : 'JOHN DOGE'} 🐾`;
    mostrarDatosPerro(nombre, datosPerro, false);
    configurarEventos();
}

// Función para manejar la carga cuando GitHub falla
async function manejarCargaFallback(nombre) {
    // Primero intentar con datosCompletosPerros
    if (datosCompletosPerros[nombre]) {
        const datosPerro = datosCompletosPerros[nombre];
        cargarYMostrarPerro(nombre, datosPerro);
        return;
    }

    // Si no hay datos locales, usar plantilla
    await cargarDesdePlantilla(nombre);
}

async function cargarDatosPerroDesdeAPI(nombre) {
    try {
        // PRIMERO: Intentar cargar desde GitHub (datos reales)
        const url = urlSinCache(`https://raw.githubusercontent.com/pesaher/perros/refs/heads/main/archivos/perros/${encodeURIComponent(nombre)}.json`);
        const respuesta = await fetch(url);

        if (respuesta.ok) {
            // Perro encontrado en GitHub
            const datosPerro = await respuesta.json();
            cargarYMostrarPerro(nombre, datosPerro);
            return;
        }

        // SEGUNDO: Si no está en GitHub, buscar en datosCompletosPerros
        await manejarCargaFallback(nombre);

    } catch (error) {
        // TERCERO: Si hay error, usar el fallback
        await manejarCargaFallback(nombre);
    }
}

// Función auxiliar para cargar desde plantilla (igual que antes)
async function cargarDesdePlantilla(nombre) {
    try {
        // Cargar plantilla de perro.json
        const plantillaUrl = 'https://raw.githubusercontent.com/pesaher/perros/refs/heads/main/archivos/perro.json';
        const respuesta = await fetch(plantillaUrl);
        const plantilla = await respuesta.json();

        // Crear datos del perro usando la plantilla + nombre
        const datosPerro = {
            ...plantilla,
            nombre: nombre
        };

        datosOriginales = JSON.parse(JSON.stringify(datosPerro));
        document.title = `${nombre.toUpperCase()} 🐾`;
        mostrarDatosPerro(nombre, datosPerro, false);
        configurarEventos();

        console.warn(`Mostrando datos de plantilla para ${nombre} (no encontrado en GitHub)`);

    } catch (error) {
        // Si falla incluso la plantilla, mostrar error
        document.getElementById('contenido-perro').innerHTML = `<p>Error: No se pudieron cargar los datos para el perro "${nombre}"</p>`;
    }
}

// Función para configurar eventos
function configurarEventos() {
    const btnEditar = document.getElementById('btnEditar');
    if (btnEditar) {
        btnEditar.addEventListener('click', activarModoEdicion);
    }
}

// Función para mostrar datos del perro
function mostrarDatosPerro(nombre, datos, modoEdicion = false) {
    const contenedor = document.getElementById('contenido-perro');

    // Mapeos de valores
    const nivelesPaseo = {
        0: "Pasea bien",
        1: "Miedo (gestionable)",
        2: "Miedo (bloqueo)",
        3: "Reactivo",
        4: "Tira"
    };

    const sociablePerros = {
        0: "Sí",
        1: "Selectivo",
        2: "No",
        3: "No sabe"
    };

    const sociablePersonas = {
        0: "Sí",
        1: "Selectivo",
        2: "Mal con hombres",
        3: "No"
    };

    // Estados booleanos
    const getEstadoBooleano = (valor, textoTrue, textoFalse) => {
        if (valor === true) return textoTrue;
        if (valor === false) return textoFalse;
        return '???';
    };

    // Valores formateados para modo visual
    const textoPaseo = nivelesPaseo.hasOwnProperty(datos.paseo) ? nivelesPaseo[datos.paseo] : '???';
    const textoSociablePerros = sociablePerros.hasOwnProperty(datos.sociableConPerros) ? sociablePerros[datos.sociableConPerros] : '???';
    const textoSociablePersonas = sociablePersonas.hasOwnProperty(datos.sociableConPersonas) ? sociablePersonas[datos.sociableConPersonas] : '???';
    const textoSociableGatos = getEstadoBooleano(datos.sociableConGatos, '✅ Sí', '❌ No');
    const textoProteccionRecursos = getEstadoBooleano(datos.proteccionDeRecursos, '✅ Sí', '❌ No');
    const textoChip = getEstadoBooleano(datos.chip, '✅ Sí', '❌ No');
    const textoPPP = getEstadoBooleano(datos.ppp, '✅ Sí', '❌ No');
    const textoApadrinado = getEstadoBooleano(datos.apadrinado, '✅ Sí', '❌ No');

    // Problemas de salud
    const textoProblemasSalud = Array.isArray(datos.problemasDeSalud) && datos.problemasDeSalud.length > 0
        ? datos.problemasDeSalud.map(id => {
            const problemas = ['Leishmania', 'Ehrlichia', 'Borrelia', 'Cáncer', 'Displasia', 'Tumor benigno'];
            return problemas[id] || 'Desconocido';
        }).join(', ')
        : 'Ninguno';

    // Valores por defecto y formateo
    const nombreMostrar = datos.nombre && datos.nombre.trim() !== '' ? datos.nombre.toUpperCase() : 'JOHN DOGE';
    const edadMostrar = datos.nacimiento ? calcularEdad(datos.nacimiento) : '???';
    const pesoMostrar = datos.peso !== null && datos.peso !== undefined ? `${datos.peso} kg` : '???';
    const alturaMostrar = datos.altura !== null && datos.altura !== undefined ? `${datos.altura} cm` : '???';

    // Icono de sexo
    const iconoSexo = datos.macho === true ? '♂️' : datos.macho === false ? '♀️' : '';

    // Icono y color de reservado
    let iconoReservado = '';
    let claseReservado = '';

    if (datos.reservado === null) {
        iconoReservado = '🔓';
        claseReservado = 'marco-reservado-null';
    } else if (datos.reservado === false) {
        iconoReservado = '🔒';
        claseReservado = 'marco-reservado-false';
    } else if (datos.reservado === true) {
        iconoReservado = '🔒';
        claseReservado = 'marco-reservado-true';
    }

    let html = `
        <div class="campos-grid">
            <!-- Nombre ocupa toda la fila con iconos -->
            <div class="campo-completo">
                <div class="valor nombre-perro ${claseReservado}">
                    ${iconoReservado ? `<span class="icono-reservado">${iconoReservado}</span>` : ''}
                    <div class="nombre-contenedor">
                        ${modoEdicion ?
                          `<input type="text" value="${datos.nombre || ''}" placeholder="Nombre del perro">` :
                          nombreMostrar
                        }
                        ${!modoEdicion && iconoSexo ? `<span class="icono-sexo">${iconoSexo}</span>` : ''}
                    </div>
                </div>
            </div>

            <!-- Campos en dos columnas -->
            <div class="campo ${modoEdicion ? 'campo-editable' : ''}">
                <div class="etiqueta">${modoEdicion ? 'Fecha de Nacimiento' : 'Edad'}</div>
                <div class="valor">
                    ${modoEdicion ?
                      `<input type="text" value="${datos.nacimiento || ''}" placeholder="YYYY, YYYY-MM o YYYY-MM-DD">` :
                      edadMostrar
                    }
                </div>
            </div>

            <div class="campo ${modoEdicion ? 'campo-editable' : ''}">
                <div class="etiqueta">Peso (kg)</div>
                <div class="valor">
                    ${modoEdicion ?
                      `<input type="number" value="${datos.peso || ''}" placeholder="Peso en kg">` :
                      pesoMostrar
                    }
                </div>
            </div>

            <div class="campo ${modoEdicion ? 'campo-editable' : ''}">
                <div class="etiqueta">Altura (cm)</div>
                <div class="valor">
                    ${modoEdicion ?
                      `<input type="number" value="${datos.altura || ''}" placeholder="Altura en cm">` :
                      alturaMostrar
                    }
                </div>
            </div>

            <div class="campo ${modoEdicion ? 'campo-editable' : ''}">
                <div class="etiqueta">Nivel de Paseo</div>
                <div class="valor">
                    ${modoEdicion ? crearSelectorPaseo(datos.paseo) : textoPaseo}
                </div>
            </div>

            <div class="campo ${modoEdicion ? 'campo-editable' : ''}">
                <div class="etiqueta">Sociable con Perros</div>
                <div class="valor">
                    ${modoEdicion ? crearSelectorSociablePerros(datos.sociableConPerros) : textoSociablePerros}
                </div>
            </div>

            <div class="campo ${modoEdicion ? 'campo-editable' : ''}">
                <div class="etiqueta">Sociable con Personas</div>
                <div class="valor">
                    ${modoEdicion ? crearSelectorSociablePersonas(datos.sociableConPersonas) : textoSociablePersonas}
                </div>
            </div>

            <div class="campo ${modoEdicion ? 'campo-editable' : ''}">
                <div class="etiqueta">Sociable con Gatos</div>
                <div class="valor">
                    ${modoEdicion ? crearSelectorBooleano('sociableConGatos', datos.sociableConGatos, true) : textoSociableGatos}
                </div>
            </div>

            <div class="campo ${modoEdicion ? 'campo-editable' : ''}">
                <div class="etiqueta">Protección de Recursos</div>
                <div class="valor">
                    ${modoEdicion ? crearSelectorBooleano('proteccionDeRecursos', datos.proteccionDeRecursos, true) : textoProteccionRecursos}
                </div>
            </div>

            <div class="campo ${modoEdicion ? 'campo-editable' : ''}">
                <div class="etiqueta">Chip</div>
                <div class="valor">
                    ${modoEdicion ? crearSelectorBooleano('chip', datos.chip, false) : textoChip}
                </div>
            </div>

            <div class="campo ${modoEdicion ? 'campo-editable' : ''}">
                <div class="etiqueta">PPP</div>
                <div class="valor">
                    ${modoEdicion ? crearSelectorBooleano('ppp', datos.ppp, true) : textoPPP}
                </div>
            </div>

            <div class="campo ${modoEdicion ? 'campo-editable' : ''}">
                <div class="etiqueta">Apadrinado</div>
                <div class="valor">
                    ${modoEdicion ? crearSelectorBooleano('apadrinado', datos.apadrinado, false) : textoApadrinado}
                </div>
            </div>

            ${modoEdicion ? `
                <div class="campo campo-editable">
                    <div class="etiqueta">Sexo</div>
                    <div class="valor">
                        ${crearSelectorSexo(datos.macho)}
                    </div>
                </div>

                <div class="campo campo-editable">
                    <div class="etiqueta">Estado</div>
                    <div class="valor">
                        ${crearSelectorReservado(datos.reservado)}
                    </div>
                </div>
            ` : ''}
        </div>

        <!-- Problemas de Salud -->
        <div class="campo-completo ${modoEdicion ? 'campo-editable' : ''}">
            <div class="etiqueta">Problemas de Salud</div>
            <div class="valor ${!modoEdicion ? 'protocolo-particular' : ''}">
                ${modoEdicion ?
                  crearSelectorProblemasSalud(datos.problemasDeSalud) :
                  textoProblemasSalud
                }
            </div>
        </div>
    `;

    // Observaciones Extra
    if (modoEdicion || (datos.observacionesExtra && datos.observacionesExtra.toString().trim() !== '')) {
        html += `
            <div class="campo-completo ${modoEdicion ? 'campo-editable' : ''}">
                <div class="etiqueta">Observaciones Extra</div>
                <div class="valor ${!modoEdicion ? 'protocolo-particular' : ''}">
                    ${modoEdicion ?
                      `<textarea placeholder="Observaciones extra...">${datos.observacionesExtra || ''}</textarea>` :
                      (datos.observacionesExtra ? datos.observacionesExtra.replace(/\n/g, '<br>') : '')
                    }
                </div>
            </div>
        `;
    }

    // Protocolo particular
    if (modoEdicion || (datos.protocoloParticular && datos.protocoloParticular.toString().trim() !== '')) {
        html += `
            <div class="campo-completo ${modoEdicion ? 'campo-editable' : ''}">
                <div class="etiqueta">Protocolo Particular</div>
                <div class="valor ${!modoEdicion ? 'protocolo-particular' : ''}">
                    ${modoEdicion ?
                      `<textarea placeholder="Protocolo particular...">${datos.protocoloParticular || ''}</textarea>` :
                      (datos.protocoloParticular ? datos.protocoloParticular.replace(/\n/g, '<br>') : '')
                    }
                </div>
            </div>
        `;
    }

    // Verificar si debe mostrar el Protocolo de Reactividad
    const debeMostrarProtocolo = datos.paseo === 3; // Reactivo

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
                        <li><strong>Con personas:</strong> aprovechar visitas (adoptantes, padrinos, etc.) → pedir que tiren chuches desde lejos. Adaptar según perfil (ej. Pezu con hombres mayores, Saratoga con niños, etc.). También adaptar según perro (no pongamos a Light como figurante para Perci, etc).</li>
                        <li><strong>Distracción:</strong> si no hay posibilidad de mantener distancias y la probabilidad de detonar es muy alta, distraemos y nos vamos cagando leches. Pero cuidado con usar esto todo el rato y no dar herramientas al perro por estar continuamente huyendo de todo.</li>
                    </ul>
                </div>
            </div>
        `;
    }

    // Protocolo de Protección de Recursos (solo en modo visual)
    if (!modoEdicion && datos.proteccionDeRecursos === true) {
        html += `
            <div class="campo-completo">
                <div class="etiqueta">Protocolo de Protección de Recursos (PdR)</div>
                <div class="valor protocolo-particular">
                    <p><strong>Objetivo:</strong> que la presencia humana se asocie siempre a algo positivo, nunca se quitan las cosas bruscamente.</p>
                    <p><strong>Protocolo de intercambio positivo</strong> (con barrera al inicio, por seguridad):</p>
                    <ol>
                        <li><strong>Paso 1:</strong> mientras come/mastica, tirar comida extra de alto valor desde fuera.</li>
                        <li><strong>Paso 2:</strong> si coge chuches o suelta el objeto, reforzar mucho más → que asocie nuestra presencia a beneficios. (Dependiendo del grado de tensión, se puede valorar introducir el "muy bien").</li>
                        <li><strong>Paso 3:</strong> cuando ya se aleje de su recurso (por ejemplo cogiendo chuches del fondo del chenil, con el hueso en la puerta), empezar a trabajarlo desde dentro en un espacio más amplio (más adelante, atado y con supervisión).</li>
                    </ol>
                    <p><strong>Complementar</strong> con positivar el bozal de manera progresiva y alternando (no meterlo todo el rato).</p>
                </div>
            </div>
        `;
    }

    contenedor.innerHTML = html;
}

// Funciones de edición
function activarModoEdicion() {
    modoEdicion = true;
    mostrarDatosPerro(nombrePerro, datosOriginales, true);

    // Cambiar botones
    document.getElementById('botonesInferiores').innerHTML = `
        <button class="boton boton-cancelar" id="btnCancelar">✗ Cancelar</button>
        <button class="boton boton-guardar" id="btnGuardar">💾 Guardar</button>
    `;

    document.getElementById('btnCancelar').addEventListener('click', cancelarEdicion);
    document.getElementById('btnGuardar').addEventListener('click', guardarCambios);
}

function cancelarEdicion() {
    modoEdicion = false;
    mostrarDatosPerro(nombrePerro, datosOriginales, false);
    restaurarBotonesNormales();
}

function restaurarBotonesNormales() {
    document.getElementById('botonesInferiores').innerHTML = `
        <a href="javascript:history.back()" class="boton boton-volver">← Volver a Cheniles</a>
        <button class="boton boton-editar" id="btnEditar">✏️ Editar</button>
    `;

    // Re-configurar el evento del botón de editar
    configurarEventos();
}

async function guardarCambios() {
    const datosActualizados = { ...datosOriginales };

    // Procesar campos
    datosActualizados.nombre = document.querySelector('.nombre-perro input')?.value || '';
    datosActualizados.nacimiento = document.querySelector('input[placeholder*="YYYY"]')?.value || '';

    const pesoInput = document.querySelector('input[placeholder*="Peso"]');
    datosActualizados.peso = pesoInput?.value ? parseFloat(pesoInput.value) : null;

    const alturaInput = document.querySelector('input[placeholder*="Altura"]');
    datosActualizados.altura = alturaInput?.value ? parseFloat(alturaInput.value) : null;

    datosActualizados.protocoloParticular = document.querySelector('textarea[placeholder*="Protocolo particular"]')?.value || '';
    datosActualizados.observacionesExtra = document.querySelector('textarea[placeholder*="Observaciones extra"]')?.value || '';

    // Procesar selectores
    const selectPaseo = document.querySelector('select[name="paseo"]');
    datosActualizados.paseo = selectPaseo?.value ? parseInt(selectPaseo.value) : null;

    const selectSociablePerros = document.querySelector('select[name="sociableConPerros"]');
    datosActualizados.sociableConPerros = selectSociablePerros?.value ? parseInt(selectSociablePerros.value) : null;

    const selectSociablePersonas = document.querySelector('select[name="sociableConPersonas"]');
    datosActualizados.sociableConPersonas = selectSociablePersonas?.value ? parseInt(selectSociablePersonas.value) : null;

    const selectSociableGatos = document.querySelector('select[name="sociableConGatos"]');
    datosActualizados.sociableConGatos = selectSociableGatos?.value === 'true' ? true :
                                        selectSociableGatos?.value === 'false' ? false : null;

    const selectProteccion = document.querySelector('select[name="proteccionDeRecursos"]');
    datosActualizados.proteccionDeRecursos = selectProteccion?.value === 'true' ? true :
                                            selectProteccion?.value === 'false' ? false : null;

    const selectChip = document.querySelector('select[name="chip"]');
    datosActualizados.chip = selectChip?.value === 'true' ? true : false;

    const selectPPP = document.querySelector('select[name="ppp"]');
    datosActualizados.ppp = selectPPP?.value === 'true' ? true :
                           selectPPP?.value === 'false' ? false : null;

    const selectApadrinado = document.querySelector('select[name="apadrinado"]');
    datosActualizados.apadrinado = selectApadrinado?.value === 'true' ? true : false;

    const selectSexo = document.querySelector('select[name="macho"]');
    datosActualizados.macho = selectSexo?.value === 'true' ? true :
                             selectSexo?.value === 'false' ? false : null;

    const selectReservado = document.querySelector('select[name="reservado"]');
    datosActualizados.reservado = selectReservado?.value === 'null' ? null :
                                 selectReservado?.value === 'true' ? true :
                                 selectReservado?.value === 'false' ? false : null;

    // Procesar problemas de salud (checkboxes múltiples)
    const problemasSaludSeleccionados = [];
    document.querySelectorAll('input[name="problemasSalud"]:checked').forEach(checkbox => {
        problemasSaludSeleccionados.push(parseInt(checkbox.value));
    });
    datosActualizados.problemasDeSalud = problemasSaludSeleccionados;

    console.log(datosActualizados);
    try {
        // Guardar en GitHub
        const respuesta = await fetch('/.netlify/functions/save-perro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombrePerro: nombrePerro,
                datosPerro: datosActualizados
            })
        });

        const resultado = await respuesta.json();

        if (resultado.ok) {
            // Actualizar datos locales
            datosOriginales = datosActualizados;
            cancelarEdicion();

            // Actualizar datosCompletosPerros
            datosCompletosPerros[nombrePerro] = datosActualizados;
        }
    } catch (error) {
        console.error('Error al guardar:', error);
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    cargarDatosPerro();
});
