// Generador de tonos de notificacion via Web Audio API (sin archivos de audio).
// El sonido solo se reproduce si el usuario activo la opcion en Configuracion
// Y ya interactuo con la pagina (los navegadores bloquean audio sin gesto previo).

let audioCtx = null
let desbloqueado = false

function obtenerContexto() {
    if (typeof window === 'undefined') return null
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return null
    if (!audioCtx) audioCtx = new AudioContextClass()
    return audioCtx
}

export function desbloquearAudio() {
    desbloqueado = true
    const ctx = obtenerContexto()
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {})
}

export function audioEstaDesbloqueado() {
    return desbloqueado
}

function tono(ctx, frecuencia, inicio, duracion, tipo, volumenMax) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = tipo
    osc.frequency.value = frecuencia
    const t0 = ctx.currentTime + inicio
    gain.gain.setValueAtTime(0.0001, t0)
    gain.gain.linearRampToValueAtTime(volumenMax, t0 + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duracion)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t0)
    osc.stop(t0 + duracion + 0.05)
}

const PATRONES = {
    campanilla: (ctx) => {
        tono(ctx, 880, 0, 0.18, 'sine', 0.22)
        tono(ctx, 1318.5, 0.1, 0.28, 'sine', 0.18)
    },
    suave: (ctx) => {
        tono(ctx, 523.25, 0, 0.4, 'sine', 0.16)
    },
    alerta: (ctx) => {
        tono(ctx, 987.77, 0, 0.12, 'square', 0.14)
        tono(ctx, 987.77, 0.18, 0.12, 'square', 0.14)
    },
    digital: (ctx) => {
        tono(ctx, 660, 0, 0.08, 'square', 0.12)
        tono(ctx, 990, 0.09, 0.1, 'square', 0.12)
    },
}

export const TONOS_DISPONIBLES = [
    { valor: 'campanilla', label: 'Campanilla' },
    { valor: 'suave', label: 'Suave' },
    { valor: 'alerta', label: 'Alerta' },
    { valor: 'digital', label: 'Digital' },
]

export function reproducirTono(nombre = 'campanilla') {
    const ctx = obtenerContexto()
    if (!ctx) return
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    const patron = PATRONES[nombre] || PATRONES.campanilla
    try {
        patron(ctx)
    } catch (error) {
        console.error('Error al reproducir tono de notificacion:', error)
    }
}
