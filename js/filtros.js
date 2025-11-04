// Variables de filtrado
let filtrosActivos = {};

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
            case 'reservado':
                if (!Array.isArray(valor) && datosPerro.reservado !== valor) return false;
                if (Array.isArray(valor) && !valor.includes(String(datosPerro.reservado))) return false;
                break;
            case 'macho':
                if (datosPerro.macho !== valor) return false;
                break;
            case 'leishmania':
                if (datosPerro.leishmania !== valor) return false;
                break;
            case 'sociableConPerros':
                if (!Array.isArray(valor) && datosPerro.sociableConPerros !== valor) return false;
                if (Array.isArray(valor) && !valor.includes(String(datosPerro.sociableConPerros))) return false;
                break;
            case 'sociableConPersonas':
                if (!Array.isArray(valor) && datosPerro.sociableConPersonas !== valor) return false;
                if (Array.isArray(valor) && !valor.includes(String(datosPerro.sociableConPersonas))) return false;
                break;
            case 'sociableConGatos':
                if (datosPerro.sociableConGatos !== valor) return false;
                break;
            case 'proteccionDeRecursos':
                if (datosPerro.proteccionDeRecursos !== valor) return false;
                break;
            case 'paseo':
                if (!Array.isArray(valor) && datosPerro.paseo !== valor) return false;
                if (Array.isArray(valor) && !valor.includes(String(datosPerro.paseo))) return false;
                break;
            case 'pesoMin':
                if (datosPerro.peso === null || datosPerro.peso === undefined || datosPerro.peso < valor) return false;
                break;
            case 'pesoMax':
                if (datosPerro.peso === null || datosPerro.peso === undefined || datosPerro.peso > valor) return false;
                break;
            case 'alturaMin':
                if (datosPerro.altura === null || datosPerro.altura === undefined || datosPerro.altura < valor) return false;
                break;
            case 'alturaMax':
                if (datosPerro.altura === null || datosPerro.altura === undefined || datosPerro.altura > valor) return false;
                break;
            case 'edadMin':
                if (edadEnAños === null) return false;
                if (Math.floor(edadEnAños) < valor) return false;
                break;
            case 'edadMax':
                if (edadEnAños === null) return false;
                if (Math.floor(edadEnAños) > valor) return false;
                break;
        }
    }
    
    return true;
}

// Mostrar modal de filtros
function mostrarModalFiltros() {
    const modal = document.createElement('div');
    modal.className = 'modal-filtros';
    modal.innerHTML = `
        <div class="contenido-modal">
            <h3>Filtrar Perros</h3>
            
            <!-- Estado -->
            <div class="grupo-filtros">
                <div class="titulo-filtro">Estado</div>
                <div class="opciones-filtro">
                    <div class="opcion-filtro multiple ${Array.isArray(filtrosActivos.reservado) && filtrosActivos.reservado.includes('null') ? 'activa' : ''}" data-filtro="reservado" data-valor="null">🔓 Disponible</div>
                    <div class="opcion-filtro multiple ${Array.isArray(filtrosActivos.reservado) && filtrosActivos.reservado.includes('true') ? 'activa' : ''}" data-filtro="reservado" data-valor="true">🔒 Reservado</div>
                    <div class="opcion-filtro multiple ${Array.isArray(filtrosActivos.reservado) && filtrosActivos.reservado.includes('false') ? 'activa' : ''}" data-filtro="reservado" data-valor="false">🔒 Adoptado</div>
                </div>
            </div>
            
            <!-- Sexo -->
            <div class="grupo-filtros">
                <div class="titulo-filtro">Sexo</div>
                <div class="opciones-filtro">
                    <div class="opcion-filtro ${filtrosActivos.macho === true ? 'activa' : ''}" data-filtro="macho" data-valor="true">♂️ Macho</div>
                    <div class="opcion-filtro ${filtrosActivos.macho === false ? 'activa' : ''}" data-filtro="macho" data-valor="false">♀️ Hembra</div>
                </div>
            </div>
            
            <!-- Edad -->
            <div class="grupo-filtros">
                <div class="titulo-filtro">Edad (años)</div>
                <div class="rango-filtro">
                    <input type="number" class="input-rango" id="edadMin" placeholder="Mín" value="${filtrosActivos.edadMin || ''}" step="1" min="0">
                    <span class="separador-rango">a</span>
                    <input type="number" class="input-rango" id="edadMax" placeholder="Máx" value="${filtrosActivos.edadMax || ''}" step="1" min="0">
                </div>
            </div>
            
            <!-- Peso -->
            <div class="grupo-filtros">
                <div class="titulo-filtro">Peso (kg)</div>
                <div class="rango-filtro">
                    <input type="number" class="input-rango" id="pesoMin" placeholder="Mín" value="${filtrosActivos.pesoMin || ''}" step="1" min="0">
                    <span class="separador-rango">a</span>
                    <input type="number" class="input-rango" id="pesoMax" placeholder="Máx" value="${filtrosActivos.pesoMax || ''}" step="1" min="0">
                </div>
            </div>
            
            <!-- Altura -->
            <div class="grupo-filtros">
                <div class="titulo-filtro">Altura (cm)</div>
                <div class="rango-filtro">
                    <input type="number" class="input-rango" id="alturaMin" placeholder="Mín" value="${filtrosActivos.alturaMin || ''}" step="1" min="0">
                    <span class="separador-rango">a</span>
                    <input type="number" class="input-rango" id="alturaMax" placeholder="Máx" value="${filtrosActivos.alturaMax || ''}" step="1" min="0">
                </div>
            </div>
            
            <!-- Nivel de Paseo -->
            <div class="grupo-filtros">
                <div class="titulo-filtro">Nivel de Paseo</div>
                <div class="opciones-filtro">
                    <div class="opcion-filtro multiple ${Array.isArray(filtrosActivos.paseo) && filtrosActivos.paseo.includes('0') ? 'activa' : ''}" data-filtro="paseo" data-valor="0">Pasea bien</div>
                    <div class="opcion-filtro multiple ${Array.isArray(filtrosActivos.paseo) && filtrosActivos.paseo.includes('1') ? 'activa' : ''}" data-filtro="paseo" data-valor="1">Miedo (gestionable)</div>
                    <div class="opcion-filtro multiple ${Array.isArray(filtrosActivos.paseo) && filtrosActivos.paseo.includes('2') ? 'activa' : ''}" data-filtro="paseo" data-valor="2">Miedo (bloqueo)</div>
                    <div class="opcion-filtro multiple ${Array.isArray(filtrosActivos.paseo) && filtrosActivos.paseo.includes('3') ? 'activa' : ''}" data-filtro="paseo" data-valor="3">Reactivo</div>
                    <div class="opcion-filtro multiple ${Array.isArray(filtrosActivos.paseo) && filtrosActivos.paseo.includes('4') ? 'activa' : ''}" data-filtro="paseo" data-valor="4">Tira</div>
                </div>
            </div>
            
            <!-- Sociable con Perros -->
            <div class="grupo-filtros">
                <div class="titulo-filtro">Sociable con Perros</div>
                <div class="opciones-filtro">
                    <div class="opcion-filtro multiple ${Array.isArray(filtrosActivos.sociableConPerros) && filtrosActivos.sociableConPerros.includes('0') ? 'activa' : ''}" data-filtro="sociableConPerros" data-valor="0">Sí</div>
                    <div class="opcion-filtro multiple ${Array.isArray(filtrosActivos.sociableConPerros) && filtrosActivos.sociableConPerros.includes('1') ? 'activa' : ''}" data-filtro="sociableConPerros" data-valor="1">Selectivo</div>
                    <div class="opcion-filtro multiple ${Array.isArray(filtrosActivos.sociableConPerros) && filtrosActivos.sociableConPerros.includes('2') ? 'activa' : ''}" data-filtro="sociableConPerros" data-valor="2">No</div>
                    <div class="opcion-filtro multiple ${Array.isArray(filtrosActivos.sociableConPerros) && filtrosActivos.sociableConPerros.includes('3') ? 'activa' : ''}" data-filtro="sociableConPerros" data-valor="3">No sabe</div>
                </div>
            </div>
            
            <!-- Sociable con Personas -->
            <div class="grupo-filtros">
                <div class="titulo-filtro">Sociable con Personas</div>
                <div class="opciones-filtro">
                    <div class="opcion-filtro multiple ${Array.isArray(filtrosActivos.sociableConPersonas) && filtrosActivos.sociableConPersonas.includes('0') ? 'activa' : ''}" data-filtro="sociableConPersonas" data-valor="0">Sí</div>
                    <div class="opcion-filtro multiple ${Array.isArray(filtrosActivos.sociableConPersonas) && filtrosActivos.sociableConPersonas.includes('1') ? 'activa' : ''}" data-filtro="sociableConPersonas" data-valor="1">Selectivo</div>
                    <div class="opcion-filtro multiple ${Array.isArray(filtrosActivos.sociableConPersonas) && filtrosActivos.sociableConPersonas.includes('2') ? 'activa' : ''}" data-filtro="sociableConPersonas" data-valor="2">Mal con hombres</div>
                    <div class="opcion-filtro multiple ${Array.isArray(filtrosActivos.sociableConPersonas) && filtrosActivos.sociableConPersonas.includes('3') ? 'activa' : ''}" data-filtro="sociableConPersonas" data-valor="3">No</div>
                </div>
            </div>
            
            <!-- Sociable con Gatos -->
            <div class="grupo-filtros">
                <div class="titulo-filtro">Sociable con Gatos</div>
                <div class="opciones-filtro">
                    <div class="opcion-filtro ${filtrosActivos.sociableConGatos === true ? 'activa' : ''}" data-filtro="sociableConGatos" data-valor="true">✅ Sí</div>
                    <div class="opcion-filtro ${filtrosActivos.sociableConGatos === false ? 'activa' : ''}" data-filtro="sociableConGatos" data-valor="false">❌ No</div>
                </div>
            </div>
            
            <!-- Protección de Recursos -->
            <div class="grupo-filtros">
                <div class="titulo-filtro">Protección de Recursos</div>
                <div class="opciones-filtro">
                    <div class="opcion-filtro ${filtrosActivos.proteccionDeRecursos === true ? 'activa' : ''}" data-filtro="proteccionDeRecursos" data-valor="true">✅ Sí</div>
                    <div class="opcion-filtro ${filtrosActivos.proteccionDeRecursos === false ? 'activa' : ''}" data-filtro="proteccionDeRecursos" data-valor="false">❌ No</div>
                </div>
            </div>
            
            <!-- Leishmania -->
            <div class="grupo-filtros">
                <div class="titulo-filtro">Leishmania</div>
                <div class="opciones-filtro">
                    <div class="opcion-filtro ${filtrosActivos.leishmania === true ? 'activa' : ''}" data-filtro="leishmania" data-valor="true">✅ Sí</div>
                    <div class="opcion-filtro ${filtrosActivos.leishmania === false ? 'activa' : ''}" data-filtro="leishmania" data-valor="false">❌ No</div>
                </div>
            </div>
            
            <div class="botones-filtros">
                <button class="boton-filtro boton-limpiar" id="btnLimpiarFiltros">🧹 Limpiar</button>
                <button class="boton-filtro boton-aplicar" id="btnAplicarFiltros">✅ Aplicar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
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
            
            // Toggle: si ya está activo, quitar; si no, agregar
            const valorStr = String(valor);
            const index = filtrosActivos[filtro].indexOf(valorStr);
            
            if (index > -1) {
                filtrosActivos[filtro].splice(index, 1);
                opcion.classList.remove('activa');
            } else {
                filtrosActivos[filtro].push(valorStr);
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
        const pesoMin = modal.querySelector('#pesoMin').value;
        const pesoMax = modal.querySelector('#pesoMax').value;
        const alturaMin = modal.querySelector('#alturaMin').value;
        const alturaMax = modal.querySelector('#alturaMax').value;
        const edadMin = modal.querySelector('#edadMin').value;
        const edadMax = modal.querySelector('#edadMax').value;
        
        // Actualizar filtros con los valores de los rangos
        if (pesoMin) filtrosActivos.pesoMin = parseFloat(pesoMin);
        else delete filtrosActivos.pesoMin;
        
        if (pesoMax) filtrosActivos.pesoMax = parseFloat(pesoMax);
        else delete filtrosActivos.pesoMax;
        
        if (alturaMin) filtrosActivos.alturaMin = parseFloat(alturaMin);
        else delete filtrosActivos.alturaMin;
        
        if (alturaMax) filtrosActivos.alturaMax = parseFloat(alturaMax);
        else delete filtrosActivos.alturaMax;
        
        if (edadMin) filtrosActivos.edadMin = parseFloat(edadMin);
        else delete filtrosActivos.edadMin;
        
        if (edadMax) filtrosActivos.edadMax = parseFloat(edadMax);
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
    
    // Cerrar modal al hacer click fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}
