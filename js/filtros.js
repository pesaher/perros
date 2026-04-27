// Variables de filtrado
let filtrosActivos = {};
let contadorClicksModo = 0;
let timeoutReset = null;

function iniciarContadorAdmin() {
    contadorClicksModo++;
    if (timeoutReset) clearTimeout(timeoutReset);
    timeoutReset = setTimeout(() => { contadorClicksModo = 0; }, 300);

    if (contadorClicksModo >= 10) {
        localStorage.setItem('modoAdmin', 'true');
        location.reload();
    }
}

// Función para aplicar filtros a un perro
function aplicarFiltros(nombrePerro) {
    const datosPerro = datosCompletosPerros[nombrePerro];
    if (!datosPerro) return false; // Si no tenemos datos, no mostrar

    // Calcular edad si tenemos fecha de nacimiento
    let edadEnAños = null;
    if (datosPerro.nacimiento) {
        edadEnAños = calcularEdadEnAños(datosPerro.nacimiento);
    }

    for (const [filtro, valor] of Object.entries(filtrosActivos)) {
        if (valor === null || valor === undefined || valor === '') continue;

        switch (filtro) {
            case 'estado':
                if (Array.isArray(valor)) {
                    const valoresConvertidos = valor.map(v => parseInt(v));
                    if (!valoresConvertidos.includes(datosPerro.estado)) return false;
                } else if (datosPerro.estado !== valor) {
                    return false;
                }
                break;

            case 'macho':
                if (datosPerro.macho !== valor) return false;
                break;

            case 'excluirProblemasDeSalud':
                if (Array.isArray(valor) && Array.isArray(datosPerro.problemasDeSalud)) {
                    // Convertir valores del filtro a números
                    const valoresConvertidos = valor.map(v => parseInt(v));
                    const tieneProblemaExcluido = datosPerro.problemasDeSalud.some(problema => valoresConvertidos.includes(problema)
                    );
                    if (tieneProblemaExcluido) return false;
                }
                break;

            case 'excluirInstintoDePredacion':
                if (Array.isArray(valor) && Array.isArray(datosPerro.instintoDePredacion)) {
                    // Convertir valores del filtro a números
                    const valoresConvertidos = valor.map(v => parseInt(v));
                    const tieneInstintoExcluido = datosPerro.instintoDePredacion.some(instinto => valoresConvertidos.includes(instinto)
                    );
                    if (tieneInstintoExcluido) return false;
                }
                break;

            case 'sociableConPerros':
                if (Array.isArray(valor)) {
                    // Convertir valores del filtro a números
                    const valoresConvertidos = valor.map(v => parseInt(v));
                    if (!valoresConvertidos.includes(datosPerro.sociableConPerros)) return false;
                } else if (datosPerro.sociableConPerros !== valor) {
                    return false;
                }
                break;

            case 'sociableConPersonas':
                if (Array.isArray(valor)) {
                    // Convertir valores del filtro a números
                    const valoresConvertidos = valor.map(v => parseInt(v));
                    if (!valoresConvertidos.includes(datosPerro.sociableConPersonas)) return false;
                } else if (datosPerro.sociableConPersonas !== valor) {
                    return false;
                }
                break;

            case 'sociableConGatos':
                if (datosPerro.sociableConGatos !== valor) return false;
                break;

            case 'proteccionDeRecursos':
                if (Array.isArray(valor)) {
                    // Convertir valores del filtro a números
                    const valoresConvertidos = valor.map(v => parseInt(v));
                    const valorPerro = datosPerro.proteccionDeRecursos;

                    // Si el perro no tiene valor, no pasa el filtro
                    if (valorPerro === null || valorPerro === undefined) return false;

                    // El perro pasa solo si su valor está incluido en los valores seleccionados del filtro
                    if (!valoresConvertidos.includes(valorPerro)) {
                        return false;
                    }
                }
                break;

            case 'ppp':
                if (datosPerro.ppp !== valor) return false;
                break;

            case 'responsable':
                if (valor === null || valor === 'null') {
                    // Filtrar perros SIN responsable
                    if (datosPerro.responsable && datosPerro.responsable.trim()) return false;
                } else {
                    // Filtrar perros que tengan este responsable en su lista
                    if (!datosPerro.responsable) return false;
                    const nombres = datosPerro.responsable.split(/[^a-zA-ZáéíóúñÁÉÍÓÚÑ]+/).filter(n => n.trim());
                    if (!nombres.includes(valor)) return false;
                }
                break;

            case 'apadrinado':
                if (datosPerro.apadrinado !== valor) return false;
                break;

            case 'paseo':
                if (Array.isArray(valor)) {
                    // Convertir valores del filtro a números
                    const valoresConvertidos = valor.map(v => parseInt(v));
                    if (!valoresConvertidos.includes(datosPerro.paseo)) return false;
                } else if (datosPerro.paseo !== valor) {
                    return false;
                }
                break;

            case 'pesoMin':
                if (datosPerro.peso === null || datosPerro.peso === undefined || datosPerro.peso < valor) return false;
                break;

            case 'pesoMax':
                if (datosPerro.peso === null || datosPerro.peso === undefined || datosPerro.peso > valor) return false;
                break;

            case 'edadMin':
                if (edadEnAños === null) return false;
                if (Math.floor(edadEnAños) < valor) return false;
                break;

            case 'edadMax':
                if (edadEnAños === null) return false;
                if (Math.floor(edadEnAños) > valor) return false;
                break;

            case 'informacionIncompleta':
                if (valor === true) {
                    // Solo mostrar si el perro tiene información incompleta
                    return tieneInformacionIncompleta(datosPerro);
                }
                break;
        }
    }

    return true;
}

// Mostrar modal de filtros
function mostrarModalFiltros() {
    const modal = document.createElement('div');
    modal.className = 'modal-filtros';

    const vistaActual = window.APP_CONFIG?.VISTA;

    // Función helper para verificar si un filtro debe mostrarse
    const debeMostrarFiltro = (filtro) => {
        if (vistaActual === 'paseos') {
            const filtrosAMostrar = ['paseo', 'sociableConPerros', 'sociableConPersonas', 'proteccionDeRecursos', 'responsable'];
            return filtrosAMostrar.includes(filtro);
        }
        else if (vistaActual === 'adopciones') {
            const filtrosAMostrar = ['estado', 'sexo', 'edad', 'peso', 'paseo', 'sociableConPerros', 'sociableConPersonas', 'sociableConGatos', 'ppp', 'responsable', 'excluirInstintoDePredacion', 'excluirProblemasDeSalud'];
            return filtrosAMostrar.includes(filtro);
        }
        else if (vistaActual === 'padrinos') {
            const filtrosAMostrar = ['estado', 'apadrinado'];
            return filtrosAMostrar.includes(filtro);
        }
        // Por defecto, mostrar todos
        return true;
    };

    // Función helper para verificar si un valor está activo en los filtros
    const estaActivo = (filtro, valorBuscado) => {
        if (!Array.isArray(filtrosActivos[filtro])) return false;

        // Convertir valorBuscado a string para comparar con los valores guardados
        const valorBuscadoStr = String(valorBuscado);
        return filtrosActivos[filtro].some(v => String(v) === valorBuscadoStr);
    };

    let html = `
        <div class="contenido-modal">
            <h3>Cambiar Modo</h3>
            <div class="botones-modo">
                <div class="boton-modo ${window.APP_CONFIG.VISTA === 'completa' ? 'activo' : ''}" data-modo="completa">💯 Completo</div>
                <div class="boton-modo ${window.APP_CONFIG.VISTA === 'paseos' ? 'activo' : ''}" data-modo="paseos">🦮 Paseos</div>
                <div class="boton-modo ${window.APP_CONFIG.VISTA === 'adopciones' ? 'activo' : ''}" data-modo="adopciones">🏠 Adopciones</div>
                <div class="boton-modo ${window.APP_CONFIG.VISTA === 'padrinos' ? 'activo' : ''}" data-modo="padrinos">❤️ Padrinos</div>
            </div>
            <h3>Filtrar Perros</h3>
    `;

    if (debeMostrarFiltro('estado')) {
        html += `
            <!-- Estado -->
            <div class="grupo-filtros">
                <div class="titulo-filtro">Estado</div>
                <div class="opciones-filtro">
                    <div class="opcion-filtro multiple ${estaActivo('estado', 0) ? 'activa' : ''}" data-filtro="estado" data-valor="0">Disponible</div>
                    <div class="opcion-filtro multiple ${estaActivo('estado', 1) ? 'activa' : ''}" data-filtro="estado" data-valor="1">Chip (preguntar)</div>
                    <div class="opcion-filtro multiple ${estaActivo('estado', 2) ? 'activa' : ''}" data-filtro="estado" data-valor="2">Reservado</div>
                    <div class="opcion-filtro multiple ${estaActivo('estado', 3) ? 'activa' : ''}" data-filtro="estado" data-valor="3">Residencia</div>
                </div>
            </div>
        `;
    }

    if (debeMostrarFiltro('sexo')) {
        html += `
            <!-- Sexo -->
            <div class="grupo-filtros">
                <div class="titulo-filtro">Sexo</div>
                <div class="opciones-filtro">
                    <div class="opcion-filtro ${filtrosActivos.macho === true ? 'activa' : ''}" data-filtro="macho" data-valor="true">♂️ Macho</div>
                    <div class="opcion-filtro ${filtrosActivos.macho === false ? 'activa' : ''}" data-filtro="macho" data-valor="false">♀️ Hembra</div>
                </div>
            </div>
        `;
    }

    if (debeMostrarFiltro('edad')) {
        html += `
            <!-- Edad -->
            <div class="grupo-filtros">
                <div class="titulo-filtro">Edad (años)</div>
                <div class="rango-filtro">
                    <input type="number" class="input-rango" id="edadMin" placeholder="Mín" value="${filtrosActivos.edadMin !== undefined ? filtrosActivos.edadMin : ''}" step="1" min="0">
                    <span class="separador-rango">a</span>
                    <input type="number" class="input-rango" id="edadMax" placeholder="Máx" value="${filtrosActivos.edadMax !== undefined ? filtrosActivos.edadMax : ''}" step="1" min="0">
                </div>
            </div>
        `;
    }

    if (debeMostrarFiltro('peso')) {
        html += `
            <!-- Peso -->
            <div class="grupo-filtros">
                <div class="titulo-filtro">Peso (kg)</div>
                <div class="rango-filtro">
                    <input type="number" class="input-rango" id="pesoMin" placeholder="Mín" value="${filtrosActivos.pesoMin !== undefined ? filtrosActivos.pesoMin : ''}" step="1" min="0">
                    <span class="separador-rango">a</span>
                    <input type="number" class="input-rango" id="pesoMax" placeholder="Máx" value="${filtrosActivos.pesoMax !== undefined ? filtrosActivos.pesoMax : ''}" step="1" min="0">
                </div>
            </div>
        `;
    }

    if (debeMostrarFiltro('paseo')) {
        html += `
            <!-- Nivel de Paseo -->
            <div class="grupo-filtros">
                <div class="titulo-filtro">Nivel de Paseo</div>
                <div class="opciones-filtro">
                    <div class="opcion-filtro multiple ${estaActivo('paseo', 0) ? 'activa' : ''}" data-filtro="paseo" data-valor="0">Pasea bien</div>
                    <div class="opcion-filtro multiple ${estaActivo('paseo', 1) ? 'activa' : ''}" data-filtro="paseo" data-valor="1">Miedo (gestionable)</div>
                    <div class="opcion-filtro multiple ${estaActivo('paseo', 2) ? 'activa' : ''}" data-filtro="paseo" data-valor="2">Miedo (bloqueo)</div>
                    <div class="opcion-filtro multiple ${estaActivo('paseo', 3) ? 'activa' : ''}" data-filtro="paseo" data-valor="3">Reactivo</div>
                    <div class="opcion-filtro multiple ${estaActivo('paseo', 4) ? 'activa' : ''}" data-filtro="paseo" data-valor="4">Tira</div>
                </div>
            </div>
        `;
    }

    if (debeMostrarFiltro('sociableConPerros')) {
        html += `
            <!-- Sociable con Perros -->
            <div class="grupo-filtros">
                <div class="titulo-filtro">Sociable con Perros</div>
                <div class="opciones-filtro">
                    <div class="opcion-filtro multiple ${estaActivo('sociableConPerros', 0) ? 'activa' : ''}" data-filtro="sociableConPerros" data-valor="0">Sí</div>
                    <div class="opcion-filtro multiple ${estaActivo('sociableConPerros', 1) ? 'activa' : ''}" data-filtro="sociableConPerros" data-valor="1">Selectivo</div>
                    <div class="opcion-filtro multiple ${estaActivo('sociableConPerros', 2) ? 'activa' : ''}" data-filtro="sociableConPerros" data-valor="2">No</div>
                    <div class="opcion-filtro multiple ${estaActivo('sociableConPerros', 3) ? 'activa' : ''}" data-filtro="sociableConPerros" data-valor="3">No sabe</div>
                </div>
            </div>
        `;
    }

    if (debeMostrarFiltro('sociableConPersonas')) {
        html += `
            <!-- Sociable con Personas -->
            <div class="grupo-filtros">
                <div class="titulo-filtro">Sociable con Personas</div>
                <div class="opciones-filtro">
                    <div class="opcion-filtro multiple ${estaActivo('sociableConPersonas', 0) ? 'activa' : ''}" data-filtro="sociableConPersonas" data-valor="0">Sí</div>
                    <div class="opcion-filtro multiple ${estaActivo('sociableConPersonas', 1) ? 'activa' : ''}" data-filtro="sociableConPersonas" data-valor="1">Selectivo</div>
                    <div class="opcion-filtro multiple ${estaActivo('sociableConPersonas', 2) ? 'activa' : ''}" data-filtro="sociableConPersonas" data-valor="2">Mal con hombres</div>
                    <div class="opcion-filtro multiple ${estaActivo('sociableConPersonas', 3) ? 'activa' : ''}" data-filtro="sociableConPersonas" data-valor="3">No</div>
                </div>
            </div>
        `;
    }

    if (debeMostrarFiltro('sociableConGatos')) {
        html += `
            <!-- Sociable con Gatos -->
            <div class="grupo-filtros">
                <div class="titulo-filtro">Sociable con Gatos</div>
                <div class="opciones-filtro">
                    <div class="opcion-filtro ${filtrosActivos.sociableConGatos === true ? 'activa' : ''}" data-filtro="sociableConGatos" data-valor="true">✅ Sí</div>
                    <div class="opcion-filtro ${filtrosActivos.sociableConGatos === false ? 'activa' : ''}" data-filtro="sociableConGatos" data-valor="false">❌ No</div>
                </div>
            </div>
        `;
    }

    if (debeMostrarFiltro('proteccionDeRecursos')) {
        html += `
            <!-- Protección de Recursos -->
            <div class="grupo-filtros">
                <div class="titulo-filtro">Protección de Recursos</div>
                <div class="opciones-filtro">
                    <div class="opcion-filtro multiple ${estaActivo('proteccionDeRecursos', 0) ? 'activa' : ''}" data-filtro="proteccionDeRecursos" data-valor="0">No</div>
                    <div class="opcion-filtro multiple ${estaActivo('proteccionDeRecursos', 1) ? 'activa' : ''}" data-filtro="proteccionDeRecursos" data-valor="1">Solo con perros</div>
                    <div class="opcion-filtro multiple ${estaActivo('proteccionDeRecursos', 2) ? 'activa' : ''}" data-filtro="proteccionDeRecursos" data-valor="2">Solo con personas</div>
                    <div class="opcion-filtro multiple ${estaActivo('proteccionDeRecursos', 3) ? 'activa' : ''}" data-filtro="proteccionDeRecursos" data-valor="3">Con perros y personas</div>
                </div>
            </div>
        `;
    }

    if (debeMostrarFiltro('ppp')) {
        html += `
            <!-- PPP -->
            <div class="grupo-filtros">
                <div class="titulo-filtro">PPP</div>
                <div class="opciones-filtro">
                    <div class="opcion-filtro ${filtrosActivos.ppp === true ? 'activa' : ''}" data-filtro="ppp" data-valor="true">✅ Sí</div>
                    <div class="opcion-filtro ${filtrosActivos.ppp === false ? 'activa' : ''}" data-filtro="ppp" data-valor="false">❌ No</div>
                </div>
            </div>
        `;
    }

    if (debeMostrarFiltro('responsable')) {
        const responsables = obtenerResponsablesUnicos();
        html += `
        <!-- Responsable -->
        <div class="grupo-filtros">
            <div class="titulo-filtro">Responsable</div>
            <div class="opciones-filtro">
                <div class="opcion-filtro ${filtrosActivos.responsable === null ? 'activa' : ''}" data-filtro="responsable" data-valor="null">Sin responsable</div>
                ${responsables.map(r => `
                    <div class="opcion-filtro ${filtrosActivos.responsable === r ? 'activa' : ''}" data-filtro="responsable" data-valor="${r}">${r}</div>
                `).join('')}
            </div>
        </div>
        `;
    }

    if (debeMostrarFiltro('apadrinado')) {
        html += `
            <!-- Apadrinado -->
            <div class="grupo-filtros">
                <div class="titulo-filtro">Apadrinado</div>
                <div class="opciones-filtro">
                    <div class="opcion-filtro ${filtrosActivos.apadrinado === true ? 'activa' : ''}" data-filtro="apadrinado" data-valor="true">✅ Sí</div>
                    <div class="opcion-filtro ${filtrosActivos.apadrinado === false ? 'activa' : ''}" data-filtro="apadrinado" data-valor="false">❌ No</div>
                </div>
            </div>
        `;
    }

    if (debeMostrarFiltro('excluirInstintoDePredacion')) {
        html += `
            <!-- Excluir Instinto de Predación -->
            <div class="grupo-filtros">
                <div class="titulo-filtro">Excluir Instinto de Predación</div>
                <div class="opciones-filtro">
                    <div class="opcion-filtro multiple ${estaActivo('excluirInstintoDePredacion', 0) ? 'activa' : ''}" data-filtro="excluirInstintoDePredacion" data-valor="0">🚫 Niños</div>
                    <div class="opcion-filtro multiple ${estaActivo('excluirInstintoDePredacion', 1) ? 'activa' : ''}" data-filtro="excluirInstintoDePredacion" data-valor="1">🚫 Perros pequeños</div>
                    <div class="opcion-filtro multiple ${estaActivo('excluirInstintoDePredacion', 2) ? 'activa' : ''}" data-filtro="excluirInstintoDePredacion" data-valor="2">🚫 Gatos</div>
                </div>
            </div>
        `;
    }

    if (debeMostrarFiltro('excluirProblemasDeSalud')) {
        html += `
            <!-- Excluir Problemas de Salud -->
            <div class="grupo-filtros">
                <div class="titulo-filtro">Excluir Problemas de Salud</div>
                <div class="opciones-filtro">
                    <div class="opcion-filtro multiple ${estaActivo('excluirProblemasDeSalud', 0) ? 'activa' : ''}" data-filtro="excluirProblemasDeSalud" data-valor="0">🚫 Leishmania</div>
                    <div class="opcion-filtro multiple ${estaActivo('excluirProblemasDeSalud', 1) ? 'activa' : ''}" data-filtro="excluirProblemasDeSalud" data-valor="1">🚫 Ehrlichia</div>
                    <div class="opcion-filtro multiple ${estaActivo('excluirProblemasDeSalud', 2) ? 'activa' : ''}" data-filtro="excluirProblemasDeSalud" data-valor="2">🚫 Borrelia</div>
                    <div class="opcion-filtro multiple ${estaActivo('excluirProblemasDeSalud', 3) ? 'activa' : ''}" data-filtro="excluirProblemasDeSalud" data-valor="3">🚫 Cáncer</div>
                    <div class="opcion-filtro multiple ${estaActivo('excluirProblemasDeSalud', 4) ? 'activa' : ''}" data-filtro="excluirProblemasDeSalud" data-valor="4">🚫 Displasia</div>
                    <div class="opcion-filtro multiple ${estaActivo('excluirProblemasDeSalud', 5) ? 'activa' : ''}" data-filtro="excluirProblemasDeSalud" data-valor="5">🚫 Tumor benigno</div>
                    <div class="opcion-filtro multiple ${estaActivo('excluirProblemasDeSalud', 6) ? 'activa' : ''}" data-filtro="excluirProblemasDeSalud" data-valor="6">🚫 Filaria</div>
                    <div class="opcion-filtro multiple ${estaActivo('excluirProblemasDeSalud', 7) ? 'activa' : ''}" data-filtro="excluirProblemasDeSalud" data-valor="7">🚫 Anaplasma</div>
                </div>
            </div>
        `;
    }

    if (debeMostrarFiltro('informacionIncompleta')) {
        html += `
            <!-- Información incompleta -->
            <div class="grupo-filtros">
                <div class="titulo-filtro">Información</div>
                <div class="opciones-filtro">
                    <div class="opcion-filtro ${filtrosActivos.informacionIncompleta === true ? 'activa' : ''}" data-filtro="informacionIncompleta" data-valor="true">⚠️ Información Incompleta</div>
                </div>
            </div>
        `;
    }

    html += `
        </div>

        <div class="botones-filtros">
            <button class="boton-filtro boton-limpiar" id="btnLimpiarFiltros">🧹 Limpiar</button>
            <button class="boton-filtro boton-aplicar" id="btnAplicarFiltros">✅ Aplicar</button>
        </div>
    `;

    modal.innerHTML = html;
    document.body.appendChild(modal);

    // Event listeners para los botones de modo
    modal.querySelectorAll('.boton-modo[data-modo]').forEach(opcion => {
        const modo = opcion.dataset.modo;
        const esModoActivo = (modo === window.APP_CONFIG.VISTA);

        if (esModoActivo) {
            // Modo activo: click para activar admin (solo si no está ya en admin)
            if (!window.APP_CONFIG.MODO_ADMIN) {
                opcion.addEventListener('click', (e) => {
                    e.stopPropagation();
                    iniciarContadorAdmin();
                });
            }
        } else {
            // Modo inactivo: click para cambiar de vista
            opcion.addEventListener('click', () => {
                localStorage.setItem('vista', modo);
                location.reload();
            });
        }
    });

    // Event listeners para opciones de filtro múltiples
    modal.querySelectorAll('.opcion-filtro.multiple').forEach(opcion => {
        opcion.addEventListener('click', () => {
            const filtro = opcion.dataset.filtro;
            const valor = opcion.dataset.valor === 'null' ? null :
                         opcion.dataset.valor === 'true' ? true :
                         opcion.dataset.valor === 'false' ? false :
                         !isNaN(opcion.dataset.valor) ? parseInt(opcion.dataset.valor) : opcion.dataset.valor;

            // Inicializar array si no existe
            if (!Array.isArray(filtrosActivos[filtro])) {
                filtrosActivos[filtro] = [];
            }

            // Para problemas de salud, guardar como número
            let valorParaGuardar;
            if (filtro === 'excluirProblemasDeSalud') {
                valorParaGuardar = parseInt(opcion.dataset.valor);
            } else {
                valorParaGuardar = opcion.dataset.valor === 'null' ? null :
                                 opcion.dataset.valor === 'true' ? true :
                                 opcion.dataset.valor === 'false' ? false :
                                 !isNaN(opcion.dataset.valor) ? parseInt(opcion.dataset.valor) : opcion.dataset.valor;
            }

            // Toggle: si ya está activo, quitar; si no, agregar
            const index = filtrosActivos[filtro].indexOf(valorParaGuardar);

            if (index > -1) {
                filtrosActivos[filtro].splice(index, 1);
                opcion.classList.remove('activa');
            } else {
                filtrosActivos[filtro].push(valorParaGuardar);
                opcion.classList.add('activa');
            }

            // Si no hay opciones seleccionadas, eliminar el filtro
            if (filtrosActivos[filtro].length === 0) {
                delete filtrosActivos[filtro];
            }
        });
    });

    // Event listeners para opciones de filtro booleanas (exclusivas)
    modal.querySelectorAll('.opcion-filtro:not(.multiple)').forEach(opcion => {
        opcion.addEventListener('click', () => {
            const filtro = opcion.dataset.filtro;
            const valor = opcion.dataset.valor === 'null' ? null :
                         opcion.dataset.valor === 'true' ? true :
                         opcion.dataset.valor === 'false' ? false :
                         !isNaN(opcion.dataset.valor) ? parseInt(opcion.dataset.valor) : opcion.dataset.valor;

            // Toggle: si ya está activo, desactivar; si no, activar
            if (filtrosActivos[filtro] === valor) {
                delete filtrosActivos[filtro];
                opcion.classList.remove('activa');
            } else {
                filtrosActivos[filtro] = valor;
                // Remover activo de otras opciones del mismo filtro
                modal.querySelectorAll(`.opcion-filtro[data-filtro="${filtro}"]:not(.multiple)`).forEach(o => {
                    o.classList.remove('activa');
                });
                opcion.classList.add('activa');
            }
        });
    });

    // Event listeners para botones
    modal.querySelector('#btnAplicarFiltros').addEventListener('click', () => {
        // Recoger valores de los rangos
        const pesoMinSelector = modal.querySelector('#pesoMin');
        const pesoMin = pesoMinSelector ? pesoMinSelector.value : '';
        const pesoMaxSelector = modal.querySelector('#pesoMax');
        const pesoMax = pesoMaxSelector ? pesoMaxSelector.value : '';
        const edadMinSelector = modal.querySelector('#edadMin');
        const edadMin = edadMinSelector ? edadMinSelector.value : '';
        const edadMaxSelector = modal.querySelector('#edadMax');
        const edadMax = edadMaxSelector ? edadMaxSelector.value : '';

        // Actualizar filtros con los valores de los rangos
        if (pesoMin !== '') filtrosActivos.pesoMin = parseFloat(pesoMin);
        else delete filtrosActivos.pesoMin;

        if (pesoMax !== '') filtrosActivos.pesoMax = parseFloat(pesoMax);
        else delete filtrosActivos.pesoMax;

        if (edadMin !== '') filtrosActivos.edadMin = parseFloat(edadMin);
        else delete filtrosActivos.edadMin;

        if (edadMax !== '') filtrosActivos.edadMax = parseFloat(edadMax);
        else delete filtrosActivos.edadMax;

        // Repintar la vista (esta función debe estar definida en cheniles.js)
        if (typeof pintar === 'function') {
            pintar();
        }
        document.body.removeChild(modal);
    });

    modal.querySelector('#btnLimpiarFiltros').addEventListener('click', () => {
        filtrosActivos = {};
        // Limpiar también los campos de rango
        modal.querySelectorAll('.input-rango').forEach(input => {
            input.value = '';
        });
        // Desactivar todas las opciones
        modal.querySelectorAll('.opcion-filtro').forEach(opcion => {
            opcion.classList.remove('activa');
        });
        // No cerramos el modal después de limpiar
    });
}
