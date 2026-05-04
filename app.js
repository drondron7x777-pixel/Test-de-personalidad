// ====================================
// ⚙️ CONFIGURACIÓN
// ====================================

const GOOGLE_CLIENT_ID = '146633258411-eeofj09ibpegkkt05spuasng9ehd8oc1.apps.googleusercontent.com';
const GOOGLE_FORMS_URL = 'https://forms.gle/JUcApe71bW88FaUYA';
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyrPUJ9w_ApeLgR67qD8ci9wLMNKO847hpp9quK8cILeuFrUUc7iWUkJDr0gx5x0aVczg/exec';
const TU_EMAIL = 'drondron7x7@gmail.com'; // Email para PDFs

// Variables globales
var usuarioActual = null;
var formularioCompletado = false;

// ====================================
// 🎬 INICIALIZACIÓN
// ====================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Aplicación iniciada');
    inicializarApp();
});

function inicializarApp() {
    // Verificar si hay usuario guardado
    var usuarioGuardado = localStorage.getItem('usuarioActual');
    if (usuarioGuardado) {
        usuarioActual = JSON.parse(usuarioGuardado);
        console.log('✅ Usuario recuperado:', usuarioActual.email);
        
        // Verificar si el formulario fue completado
        var completado = localStorage.getItem('formularioCompletado');
        if (completado) {
            localStorage.removeItem('formularioCompletado');
            cambiarPantalla('pago');
            mostrarDatosPago();
            return;
        }
        
        // Verificar estado del usuario
        if (usuarioActual.pagado && usuarioActual.puntaje) {
            cambiarPantalla('resultados');
            mostrarResultados();
        } else if (usuarioActual.nombre) {
            cambiarPantalla('instrucciones');
        } else {
            cambiarPantalla('instrucciones');
        }
        return;
    }
    
    // Si no hay usuario, mostrar portada
    cambiarPantalla('portada');
}

// ====================================
// 🔄 CAMBIAR DE PANTALLA
// ====================================

function cambiarPantalla(nombrePantalla) {
    var pantallas = document.querySelectorAll('.pantalla');
    for (var i = 0; i < pantallas.length; i++) {
        pantallas[i].classList.remove('activa');
    }
    
    var pantalla = document.getElementById('pantalla-' + nombrePantalla);
    if (pantalla) {
        pantalla.classList.add('activa');
        console.log('📍 Pantalla: ' + nombrePantalla);
    }
}

// ====================================
// 🔗 NAVEGACIÓN
// ====================================

function irAPortada() {
    cambiarPantalla('portada');
}

function irALogin() {
    cambiarPantalla('login');
    inicializarGoogle();
}

function irAlFormulario() {
    var urlFormulario = GOOGLE_FORMS_URL;
    
    console.log('🔗 Abriendo formulario...');
    
    // Marcar que el usuario va a completar el formulario
    localStorage.setItem('formularioCompletado', 'true');
    
    window.location.href = urlFormulario;
}

// ====================================
// 🔐 GOOGLE SIGN-IN
// ====================================

function inicializarGoogle() {
    console.log('🔐 Inicializando Google Sign-In...');
    
    if (!window.google) {
        setTimeout(() => inicializarGoogle(), 500);
        return;
    }

    try {
        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: procesarLoginGoogle,
            auto_select: false
        });

        var elemento = document.getElementById('google-button');
        
        if (elemento) {
            elemento.innerHTML = '';
            
            google.accounts.id.renderButton(elemento, {
                type: 'standard',
                theme: 'outline',
                size: 'large'
            });
        }
    } catch (error) {
        console.error('❌ Error inicializando Google:', error);
        mostrarNotificacion('Error al cargar Google Sign-In', 'error');
    }
}

function procesarLoginGoogle(response) {
    console.log('📥 Respuesta de Google recibida');
    
    try {
        var token = response.credential;
        var datosGoogle = decodificarToken(token);
        
        usuarioActual = {
            email: datosGoogle.email,
            nombre: datosGoogle.name || null,
            foto: datosGoogle.picture,
            loginFecha: new Date().toISOString(),
            pagado: false,
            puntaje: 0,
            tipoPersonalidad: null
        };
        
        localStorage.setItem('usuarioActual', JSON.stringify(usuarioActual));
        console.log('✅ Login exitoso:', usuarioActual.email);
        
        // Ir directamente a instrucciones
        cambiarPantalla('instrucciones');
        
    } catch (error) {
        console.error('❌ Error procesando login:', error);
        mostrarNotificacion('Error en el login', 'error');
    }
}

function decodificarToken(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(
        atob(base64)
            .split('')
            .map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join('')
    );
    return JSON.parse(jsonPayload);
}

// ====================================
// 📤 PROCESAR RESPUESTAS DEL FORMULARIO
// ====================================

window.addEventListener('load', function() {
    procesarRespuestasFormulario();
});

function procesarRespuestasFormulario() {
    var url = window.location.href;
    console.log('🔍 URL recibida:', url);
    
    // Verificar si hay flag de formulario completado en localStorage
    var completado = localStorage.getItem('formularioCompletado');
    
    if (completado || url.includes('formResponse')) {
        console.log('✅ Formulario completado');
        
        if (completado) {
            localStorage.removeItem('formularioCompletado');
        }
        
        mostrarNotificacion('✅ Test completado', 'success');
        cambiarPantalla('pago');
        mostrarDatosPago();
        
        // Limpiar URL
        window.history.pushState({}, document.title, window.location.pathname);
    }
}

function mostrarDatosPago() {
    if (usuarioActual) {
        document.getElementById('nombre-pago').textContent = usuarioActual.nombre || 'Usuario';
        document.getElementById('email-pago').textContent = usuarioActual.email;
    }
}

// ====================================
// 💰 VERIFICAR PAGO
// ====================================

function verificarPago() {
    if (!usuarioActual) {
        mostrarNotificacion('Por favor completa el test primero', 'error');
        return;
    }

    // Abrir Gmail directamente
    window.open('https://mail.google.com/mail/u/0/?tab=rm&ogbl#inbox', '_blank');
}
// ====================================
// 📊 MOSTRAR RESULTADOS
// ====================================

function mostrarResultados() {
    console.log('📊 Mostrando resultados...');
    
    if (!usuarioActual || !usuarioActual.tipoPersonalidad) {
        mostrarNotificacion('Error: No hay datos de resultados', 'error');
        return;
    }
    
    var personalidad = usuarioActual.tipoPersonalidad;
    var descripcion = usuarioActual.descripcion || 'Sin descripción';
    var puntaje = usuarioActual.puntaje || 0;
    var respuestas = usuarioActual.respuestas || [];
    
    document.getElementById('tipo-personalidad').textContent = personalidad;
    document.getElementById('descripcion-resultado').textContent = descripcion;
    document.getElementById('puntaje-total').textContent = puntaje;
    
    var detalleHtml = '';
    if (respuestas.length > 0) {
        for (var i = 0; i < respuestas.length; i++) {
            detalleHtml += '<div class="respuesta-item">';
            detalleHtml += 'Pregunta ' + (i + 1) + ': <strong>' + respuestas[i] + '/4</strong>';
            detalleHtml += '</div>';
        }
    }
    
    document.getElementById('detalle-respuestas').innerHTML = detalleHtml || '<p>No hay respuestas registradas</p>';
}

// ====================================
// 📥 DESCARGAR PDF (Se envía a tu email)
// ====================================

function descargarPDF() {
    if (!usuarioActual) {
        mostrarNotificacion('Error: No hay datos para descargar', 'error');
        return;
    }

    console.log('📥 Generando PDF...');
    
    mostrarSpinner(true);
    
    var payload = {
        action: 'generarPDF',
        email: usuarioActual.email,
        nombre: usuarioActual.nombre,
        tipoPersonalidad: usuarioActual.tipoPersonalidad,
        descripcion: usuarioActual.descripcion,
        puntaje: usuarioActual.puntaje,
        respuestas: usuarioActual.respuestas
    };
    
    fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(result => {
        mostrarSpinner(false);
        if (result.success) {
            mostrarNotificacion('✅ PDF enviado a tu email', 'success');
        } else {
            mostrarNotificacion('Error generando PDF', 'error');
        }
    })
    .catch(error => {
        mostrarSpinner(false);
        console.error('Error:', error);
        mostrarNotificacion('Error generando PDF', 'error');
    });
}

// ====================================
// 📤 COMPARTIR RESULTADO
// ====================================

function compartirResultado() {
    var personalidad = document.getElementById('tipo-personalidad').textContent;
    var puntaje = document.getElementById('puntaje-total').textContent;
    var texto = '¡Completé el Test de Personalidad! Soy: ' + personalidad + ' (Puntaje: ' + puntaje + '/60) 🧠';
    
    if (navigator.share) {
        navigator.share({
            title: 'Test de Personalidad',
            text: texto
        });
    } else {
        mostrarNotificacion('📋 ' + texto, 'info');
    }
}

// ====================================
// 🔄 REPETIR TEST
// ====================================

function repetirTest() {
    if (confirm('¿Repetir test? Se borrará el resultado anterior')) {
        usuarioActual.puntaje = 0;
        usuarioActual.tipoPersonalidad = null;
        usuarioActual.respuestas = [];
        usuarioActual.pagado = false;
        
        localStorage.setItem('usuarioActual', JSON.stringify(usuarioActual));
        cambiarPantalla('instrucciones');
    }
}

// ====================================
// 🚪 LOGOUT
// ====================================

function logout() {
    if (confirm('¿Cerrar sesión?')) {
        try {
            google.accounts.id.disableAutoSelect();
        } catch(e) {}
        
        localStorage.clear();
        usuarioActual = null;
        
        cambiarPantalla('portada');
        console.log('🚪 Sesión cerrada');
    }
}

// ====================================
// 📢 NOTIFICACIONES
// ====================================

function mostrarNotificacion(mensaje, tipo = 'success') {
    var notif = document.getElementById('notificacion');
    notif.textContent = mensaje;
    notif.className = 'notificacion mostrar ' + tipo;
    
    setTimeout(function() {
        notif.classList.remove('mostrar');
    }, 3000);
}

// ====================================
// ⏳ SPINNER
// ====================================

function mostrarSpinner(mostrar) {
    var spinner = document.getElementById('spinner');
    if (mostrar) {
        spinner.classList.add('mostrar');
    } else {
        spinner.classList.remove('mostrar');
    }
}
