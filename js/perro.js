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

async function cargarDatosPerroDesdeAPI(nombre) {
    try {
        const url = urlSinCache(`https://raw.githubusercontent.com/pesaher/perros/refs/heads/main/archivos/perros/${encodeURIComponent(nombre)}.json`);
        const respuesta = await fetch(url);
        
        if (!respuesta.ok) throw new Error('Perro no encontrado');
        
        const datosPerro = await respuesta.json();
        datosOriginales = JSON.parse(JSON.stringify(datosPerro));
        
        document.title = `${datosPerro.nombre && datosPerro.nombre.trim() !== '' ? datosPerro.nombre.toUpperCase() : 'JOHN DOGE'} 🐾`;
        mostrarDatosPerro(nombre, datosPerro, false);
        
    } catch (error) {
        document.getElementById('contenido-perro').innerHTML = `<p>Error al cargar los datos de ${nombre}: ${error.message}</p>`;
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
    const textoSociableGatos = getEstadoBooleano(datos.sociableConGatos, 'Sí', 'No');
    const textoProteccionRecursos = getEstadoBooleano(datos.proteccionDeRecursos, 'Sí', 'No');
    const textoLeishmania = getEstadoBooleano(datos.leishmania, 'Sí', 'No');
    
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
                    ${modoEdicion ? crearSelectorBooleano('sociableConGatos', datos.sociableConGatos) : textoSociableGatos}
                </div>
            </div>
            
            <div class="campo ${modoEdicion ? 'campo-editable' : ''}">
                <div class="etiqueta">Protección de Recursos</div>
                <div class="valor">
                    ${modoEdicion ? crearSelectorBooleano('proteccionDeRecursos', datos.proteccionDeRecursos) : textoProteccionRecursos}
                </div>
            </div>
            
            <div class="campo ${modoEdicion ? 'campo-editable' : ''}">
                <div class="etiqueta">Leishmania</div>
                <div class="valor">
                    ${modoEdicion ? crearSelectorBooleano('leishmania', datos.leishmania) : textoLeishmania}
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
    `;
    
    // Observaciones Extra
    if (modoEdicion || (datos.observacionesExtra && datos.observacionesExtra.toString().trim() !== '')) {
        html += `
            <div class="campo-completo ${modoEdicion ? 'campo-editable' : ''}">
                <div class="etiqueta">Observaciones Extra</div>
                <div class="valor ${!modoEdicion ? 'protocolo-particular' : ''}">
                    ${modoEdicion ? 
                      `<textarea placeholder="Observaciones extra...">${datos.observacionesExtra || ''}</textarea>` : 
                      datos.observacionesExtra.replace(/\n/g, '<br>')
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
                      datos.protocoloParticular.replace(/\n/g, '<br>')
                    }
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
    document.getElementById('btnEditar').addEventListener('click', activarModoEdicion);
}

function guardarCambios() {
    // Recoger datos del formulario
    const formData = new FormData(document.querySelector('.campos-grid'));
    const datosActualizados = { ...datosOriginales };
    
    // Procesar campos
    datosActualizados.nombre = document.querySelector('input[type="text"]')?.value || '';
    datosActualizados.nacimiento = document.querySelector('input[placeholder*="YYYY"]')?.value || '';
    datosActualizados.peso = document.querySelector('input[placeholder*="Peso"]')?.value ? 
        parseInt(document.querySelector('input[placeholder*="Peso"]').value) : null;
    datosActualizados.altura = document.querySelector('input[placeholder*="Altura"]')?.value ? 
        parseInt(document.querySelector('input[placeholder*="Altura"]').value) : null;
    datosActualizados.protocoloParticular = document.querySelector('textarea[placeholder*="Protocolo particular"]')?.value || '';
    datosActualizados.observacionesExtra = document.querySelector('textarea[placeholder*="Observaciones extra"]')?.value || '';
    
    // Procesar selectores
    datosActualizados.paseo = formData.get('paseo') ? parseInt(formData.get('paseo')) : null;
    datosActualizados.sociableConPerros = formData.get('sociableConPerros') ? parseInt(formData.get('sociableConPerros')) : null;
    datosActualizados.sociableConPersonas = formData.get('sociableConPersonas') ? parseInt(formData.get('sociableConPersonas')) : null;
    datosActualizados.sociableConGatos = formData.get('sociableConGatos') === 'true' ? true : 
                                        formData.get('sociableConGatos') === 'false' ? false : null;
    datosActualizados.proteccionDeRecursos = formData.get('proteccionDeRecursos') === 'true' ? true : 
                                            formData.get('proteccionDeRecursos') === 'false' ? false : null;
    datosActualizados.leishmania = formData.get('leishmania') === 'true' ? true : 
                                  formData.get('leishmania') === 'false' ? false : null;
    datosActualizados.macho = formData.get('macho') === 'true' ? true : 
                             formData.get('macho') === 'false' ? false : null;
    datosActualizados.reservado = formData.get('reservado') === 'null' ? null : 
                                 formData.get('reservado') === 'true' ? true : 
                                 formData.get('reservado') === 'false' ? false : null;
    
    // Actualizar y salir del modo edición
    datosOriginales = datosActualizados;
    modoEdicion = false;
    mostrarDatosPerro(nombrePerro, datosActualizados, false);
    restaurarBotonesNormales();
    
    alert('Cambios guardados localmente');
    // Aquí podrías añadir la lógica para guardar en GitHub
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('btnEditar').addEventListener('click', activarModoEdicion);
    cargarDatosPerro();
});
