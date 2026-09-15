import fs from 'fs/promises'
import path from 'path'

/**
 * Servicio centralizado para manejo de imágenes de productos
 * Siguiendo metodología profesional (estilo Odoo/ERP)
 * 
 * Este servicio es el único punto de verdad para todo lo relacionado con imágenes
 */

// Detectar si estamos en producción
const isProduction = process.env.NODE_ENV === 'production'

// =====================================================
// RUTAS PARA PRODUCTOS
// =====================================================
const PRODUCTOS_IMAGES_DIR_PRODUCTION = '/var/data/pdv_images/productos'
const PRODUCTOS_IMAGES_DIR_DEVELOPMENT = path.join(process.cwd(), 'public', 'images', 'productos')
const IMAGES_DIR = isProduction ? PRODUCTOS_IMAGES_DIR_PRODUCTION : PRODUCTOS_IMAGES_DIR_DEVELOPMENT
const PUBLIC_PATH = '/images/productos'

// =====================================================
// RUTAS PARA CLIENTES (separadas de productos)
// =====================================================
const CLIENTES_IMAGES_DIR_PRODUCTION = '/var/data/pdv_images/clientes'
const CLIENTES_IMAGES_DIR_DEVELOPMENT = path.join(process.cwd(), 'public', 'images', 'clientes')
const CLIENTES_IMAGES_DIR = isProduction ? CLIENTES_IMAGES_DIR_PRODUCTION : CLIENTES_IMAGES_DIR_DEVELOPMENT
const CLIENTES_PUBLIC_PATH = '/images/clientes'

/**
 * Asegura que la carpeta de imágenes existe
 */
async function ensureDirExists() {
    try {
        await fs.mkdir(IMAGES_DIR, { recursive: true })
    } catch (error) {
        console.error('Error al crear directorio de imágenes:', error)
        throw new Error('No se pudo crear el directorio de imágenes')
    }
}

/**
 * Guarda una imagen y retorna la ruta relativa
 * @param {string} base64Data - Cadena base64 de la imagen (data:image/...)
 * @param {number|string} productoId - ID del producto
 * @returns {Promise<string>} - Ruta relativa de la imagen (/images/productos/...)
 */
export async function guardarImagenProducto(base64Data, productoId) {
    // Validación
    if (!base64Data || !base64Data.startsWith('data:image/')) {
        throw new Error('Formato de imagen inválido')
    }

    // Crear directorio si no existe
    await ensureDirExists()

    // Extraer información
    const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/)
    if (!matches) {
        throw new Error('Base64 inválido')
    }

    const [, extension, data] = matches
    const buffer = Buffer.from(data, 'base64')

    // Validar extensión permitida
    const extensionesPermitidas = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    if (!extensionesPermitidas.includes(extension.toLowerCase())) {
        throw new Error(`Extensión ${extension} no permitida. Use: ${extensionesPermitidas.join(', ')}`)
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (buffer.length > maxSize) {
        throw new Error('La imagen es demasiado grande. Máximo 5MB')
    }

    // Nombre único
    const timestamp = Date.now()
    const fileName = `producto_${productoId}_${timestamp}.${extension}`
    const filePath = path.join(IMAGES_DIR, fileName)

    // Guardar archivo
    await fs.writeFile(filePath, buffer)

    // Retornar ruta RELATIVA
    return `${PUBLIC_PATH}/${fileName}`
}

/**
 * Elimina una imagen física si es local
 * @param {string} imagenUrl - Ruta relativa de la imagen (/images/productos/...)
 * @returns {Promise<void>}
 */
export async function eliminarImagenProducto(imagenUrl) {
    if (!imagenUrl || !imagenUrl.startsWith(PUBLIC_PATH)) {
        return // No es local, no hacer nada
    }

    try {
        const fileName = path.basename(imagenUrl)
        const filePath = path.join(IMAGES_DIR, fileName)
        await fs.unlink(filePath)
    } catch (error) {
        console.error('Error al eliminar imagen:', error)
        // No lanzar error, es tolerante a fallos
    }
}

/**
 * Valida si una URL de imagen es accesible (solo estructura, no existencia física)
 * @param {string} imagenUrl - URL o ruta de la imagen
 * @returns {string|null} - URL válida o null
 */
export function obtenerUrlValida(imagenUrl) {
    if (!imagenUrl) return null
    
    // Si es local (empieza con /images/)
    if (imagenUrl.startsWith('/images/')) {
        return imagenUrl
    }
    
    // Si es URL externa válida
    try {
        new URL(imagenUrl)
        return imagenUrl
    } catch {
        return null
    }
}

/**
 * Asegura que la carpeta de imágenes de clientes existe
 */
async function ensureClientesDirExists() {
    try {
        await fs.mkdir(CLIENTES_IMAGES_DIR, { recursive: true })
    } catch (error) {
        console.error('Error al crear directorio de imágenes de clientes:', error)
        throw new Error('No se pudo crear el directorio de imágenes de clientes')
    }
}

/**
 * Guarda una imagen de cliente y retorna la ruta relativa
 * @param {string} base64Data - Cadena base64 de la imagen (data:image/...)
 * @param {number|string} clienteId - ID del cliente
 * @returns {Promise<string>} - Ruta relativa de la imagen (/images/clientes/...)
 */
export async function guardarImagenCliente(base64Data, clienteId) {
    // Validación
    if (!base64Data || !base64Data.startsWith('data:image/')) {
        throw new Error('Formato de imagen inválido')
    }

    await ensureClientesDirExists()

    // Extraer extensión y datos
    const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/)
    if (!matches) {
        throw new Error('Base64 inválido')
    }

    const [, extension, data] = matches
    const buffer = Buffer.from(data, 'base64')

    // Validar extensión permitida
    const extensionesPermitidas = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    if (!extensionesPermitidas.includes(extension.toLowerCase())) {
        throw new Error(`Extensión ${extension} no permitida. Use: ${extensionesPermitidas.join(', ')}`)
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (buffer.length > maxSize) {
        throw new Error('La imagen es demasiado grande. Máximo 5MB')
    }

    // Nombre único para cliente
    const timestamp = Date.now()
    const fileName = `cliente_${clienteId}_${timestamp}.${extension}`
    const filePath = path.join(CLIENTES_IMAGES_DIR, fileName)

    // Guardar archivo
    await fs.writeFile(filePath, buffer)

    // Retornar ruta RELATIVA
    return `${CLIENTES_PUBLIC_PATH}/${fileName}`
}

/**
 * Elimina una imagen de cliente si es local
 * @param {string} imagenUrl - Ruta relativa de la imagen (/images/clientes/... o /images/productos/...)
 * @returns {Promise<void>}
 */
export async function eliminarImagenCliente(imagenUrl) {
    if (!imagenUrl) return
    
    // Soportar tanto la nueva ruta (/images/clientes/) como la antigua (/images/productos/)
    let targetDir = null
    if (imagenUrl.startsWith(CLIENTES_PUBLIC_PATH)) {
        targetDir = CLIENTES_IMAGES_DIR
    } else if (imagenUrl.startsWith(PUBLIC_PATH) && imagenUrl.includes('cliente_')) {
        // Compatibilidad con imágenes antiguas guardadas en /images/productos/
        targetDir = IMAGES_DIR
    }
    
    if (!targetDir) return

    try {
        const fileName = path.basename(imagenUrl)
        const filePath = path.join(targetDir, fileName)
        await fs.unlink(filePath)
    } catch (error) {
        console.error('Error al eliminar imagen de cliente:', error)
        // No lanzar error, tolerante a fallos
    }
}

/**
 * Valida si una URL de imagen es accesible (estructura)
 * @param {string} imagenUrl - URL o ruta de la imagen
 * @returns {string|null} - URL válida o null
 */
export function obtenerUrlValidaCliente(imagenUrl) {
    if (!imagenUrl) return null
    if (imagenUrl.startsWith('/images/')) return imagenUrl
    try {
        new URL(imagenUrl)
        return imagenUrl
    } catch {
        return null
    }
}

/**
 * Valida que una imagen local de cliente existe físicamente
 * @param {string} imagenUrl - Ruta relativa de la imagen
 * @returns {Promise<boolean>} - true si existe
 */
export async function existeImagenCliente(imagenUrl) {
    if (!imagenUrl) return false
    
    // Soportar tanto la nueva ruta (/images/clientes/) como la antigua (/images/productos/)
    let targetDir = null
    if (imagenUrl.startsWith(CLIENTES_PUBLIC_PATH)) {
        targetDir = CLIENTES_IMAGES_DIR
    } else if (imagenUrl.startsWith(PUBLIC_PATH) && imagenUrl.includes('cliente_')) {
        targetDir = IMAGES_DIR
    }
    
    if (!targetDir) return false
    
    try {
        const fileName = path.basename(imagenUrl)
        const filePath = path.join(targetDir, fileName)
        await fs.access(filePath)
        return true
    } catch {
        return false
    }
}

/**
 * Valida que una imagen local existe físicamente
 * @param {string} imagenUrl - Ruta relativa de la imagen
 * @returns {Promise<boolean>} - true si la imagen existe
 */
export async function existeImagenLocal(imagenUrl) {
    if (!imagenUrl || !imagenUrl.startsWith(PUBLIC_PATH)) {
        return false
    }

    try {
        const fileName = path.basename(imagenUrl)
        const filePath = path.join(IMAGES_DIR, fileName)
        await fs.access(filePath)
        return true
    } catch {
        return false
    }
}

// =====================================================
// FUNCIONES PARA OBRAS
// =====================================================

// Directorios para obras
const OBRAS_IMAGES_DIR_PRODUCTION = '/var/data/pdv_images/obras'
const OBRAS_IMAGES_DIR_DEVELOPMENT = path.join(process.cwd(), 'public', 'images', 'obras')
const OBRAS_DOCS_DIR_PRODUCTION = '/var/data/pdv_documents/obras'
const OBRAS_DOCS_DIR_DEVELOPMENT = path.join(process.cwd(), 'public', 'documents', 'obras')

const OBRAS_IMAGES_DIR = isProduction ? OBRAS_IMAGES_DIR_PRODUCTION : OBRAS_IMAGES_DIR_DEVELOPMENT
const OBRAS_DOCS_DIR = isProduction ? OBRAS_DOCS_DIR_PRODUCTION : OBRAS_DOCS_DIR_DEVELOPMENT

const OBRAS_IMAGES_PUBLIC_PATH = '/images/obras'
const OBRAS_DOCS_PUBLIC_PATH = '/documents/obras'

/**
 * Asegura que la carpeta de imágenes de obras existe
 */
async function ensureObrasImagesDirExists() {
    try {
        await fs.mkdir(OBRAS_IMAGES_DIR, { recursive: true })
    } catch (error) {
        console.error('Error al crear directorio de imágenes de obras:', error)
        throw new Error('No se pudo crear el directorio de imágenes de obras')
    }
}

/**
 * Asegura que la carpeta de documentos de obras existe
 */
async function ensureObrasDocsDirExists() {
    try {
        await fs.mkdir(OBRAS_DOCS_DIR, { recursive: true })
    } catch (error) {
        console.error('Error al crear directorio de documentos de obras:', error)
        throw new Error('No se pudo crear el directorio de documentos de obras')
    }
}

/**
 * Guarda una imagen de obra y retorna la ruta relativa
 * @param {string} base64Data - Cadena base64 de la imagen (data:image/...)
 * @param {number|string} obraId - ID de la obra
 * @returns {Promise<string>} - Ruta relativa de la imagen (/images/obras/...)
 */
export async function guardarImagenObra(base64Data, obraId) {
    // Validación
    if (!base64Data || !base64Data.startsWith('data:image/')) {
        throw new Error('Formato de imagen inválido')
    }

    await ensureObrasImagesDirExists()

    // Extraer información
    const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/)
    if (!matches) {
        throw new Error('Base64 inválido')
    }

    const [, extension, data] = matches
    const buffer = Buffer.from(data, 'base64')

    // Validar extensión permitida
    const extensionesPermitidas = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    if (!extensionesPermitidas.includes(extension.toLowerCase())) {
        throw new Error(`Extensión ${extension} no permitida. Use: ${extensionesPermitidas.join(', ')}`)
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (buffer.length > maxSize) {
        throw new Error('La imagen es demasiado grande. Máximo 5MB')
    }

    // Nombre único para obra
    const timestamp = Date.now()
    const fileName = `obra_${obraId}_${timestamp}.${extension}`
    const filePath = path.join(OBRAS_IMAGES_DIR, fileName)

    // Guardar archivo
    await fs.writeFile(filePath, buffer)

    // Retornar ruta RELATIVA
    return `${OBRAS_IMAGES_PUBLIC_PATH}/${fileName}`
}

/**
 * Guarda un documento de obra y retorna la ruta relativa
 * @param {string} base64Data - Cadena base64 del documento (data:application/... o data:image/...)
 * @param {number|string} obraId - ID de la obra
 * @param {string} tipo - Tipo de documento (contrato, presupuesto, etc.)
 * @param {string} nombre - Nombre del documento
 * @returns {Promise<{ruta: string, extension: string, tamaño_kb: number}>} - Información del documento guardado
 */
export async function guardarDocumentoObra(base64Data, obraId, tipo, nombre) {
    // Validación
    if (!base64Data || (!base64Data.startsWith('data:application/') && !base64Data.startsWith('data:image/'))) {
        throw new Error('Formato de documento inválido')
    }

    await ensureObrasDocsDirExists()

    // Extraer información
    const matches = base64Data.match(/^data:(application|image)\/(\w+);base64,(.+)$/)
    if (!matches) {
        throw new Error('Base64 inválido')
    }

    const [, , extension, data] = matches
    const buffer = Buffer.from(data, 'base64')

    // Validar extensión permitida
    const extensionesPermitidas = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'dwg', 'dwt']
    if (!extensionesPermitidas.includes(extension.toLowerCase())) {
        throw new Error(`Extensión ${extension} no permitida. Use: ${extensionesPermitidas.join(', ')}`)
    }

    // Validar tamaño (máximo 10MB para documentos)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (buffer.length > maxSize) {
        throw new Error('El documento es demasiado grande. Máximo 10MB')
    }

    // Nombre único para documento
    const timestamp = Date.now()
    const sanitizedNombre = nombre.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 100)
    const fileName = `obra_${obraId}_${tipo}_${sanitizedNombre}_${timestamp}.${extension}`
    const filePath = path.join(OBRAS_DOCS_DIR, fileName)

    // Guardar archivo
    await fs.writeFile(filePath, buffer)

    const tamaño_kb = Math.ceil(buffer.length / 1024)

    // Retornar información del documento
    return {
        ruta: `${OBRAS_DOCS_PUBLIC_PATH}/${fileName}`,
        extension: extension.toLowerCase(),
        tamaño_kb
    }
}