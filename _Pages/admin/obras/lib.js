import db from "@/_DB/db"
import { cookies } from 'next/headers'

/**
 * Helpers compartidos para el módulo de Obras
 * Funciones de utilidad y adaptadores para mapeo de datos
 * NOTA: Este archivo NO usa "use server" porque contiene funciones de utilidad síncronas
 */

/**
 * Obtiene el usuario actual desde las cookies
 * @returns {Object} { id, tipo, empresaId }
 */
export async function obtenerUsuarioActual() {
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value
    const userTipo = cookieStore.get('userTipo')?.value
    const empresaId = cookieStore.get('empresaId')?.value

    if (!userId) {
        throw new Error('No autenticado')
    }

    return {
        id: parseInt(userId),
        tipo: userTipo,
        empresaId: userTipo === 'superadmin' ? null : parseInt(empresaId)
    }
}

/**
 * Valida permisos para operaciones de obras
 * @param {Object} usuario - Usuario actual
 */
export function validarPermisoObras(usuario) {
    // Por ahora, permitimos a admin y vendedor
    // En el futuro se puede agregar validación de systemMode
    if (usuario.tipo === 'vendedor' && usuario.tipo !== 'admin') {
        // Permitir por ahora, pero se puede restringir después
    }
}

/**
 * Formatea una obra desde la base de datos para el frontend
 * @param {Object} obra - Obra desde la BD
 * @returns {Object} Obra formateada
 */
export function formatearObra(obra) {
    return {
        id: obra.id,
        codigo: obra.codigo_obra || obra.codigo || '',
        nombre: obra.nombre || '',
        tipo: obra.tipo_obra || obra.tipo || 'construccion',
        ubicacion: obra.ubicacion || '',
        zona: obra.zona || null,
        municipio: obra.municipio || null,
        provincia: obra.provincia || null,
        presupuesto_aprobado: Number(obra.presupuesto_aprobado) || 0,
        costo_real: Number(obra.costo_ejecutado || obra.costo_total || 0),
        costo_ejecutado: Number(obra.costo_ejecutado || 0),
        porcentaje_ejecutado: obra.porcentaje_ejecutado || 0,
        fecha_inicio: obra.fecha_inicio || null,
        fecha_fin_estimada: obra.fecha_fin_estimada || null,
        fecha_fin_real: obra.fecha_fin_real || null,
        estado: obra.estado || 'activa',
        descripcion: obra.descripcion || null,
        observaciones: obra.observaciones || null,
        proyecto_id: obra.proyecto_id || null,
        cliente_id: obra.cliente_id || null,
        responsable_id: obra.usuario_responsable_id || null,
        fecha_creacion: obra.fecha_creacion || null,
        // Campos adicionales de joins
        proyecto_nombre: obra.proyecto_nombre || null,
        cliente_nombre: obra.cliente_nombre || null,
        creador_nombre: obra.creador_nombre || obra.responsable_nombre || null,
        trabajadores_activos: obra.trabajadores_activos || 0
    }
}

/**
 * Mapea datos del formulario a formato de BD
 * @param {Object} datos - Datos del formulario
 * @returns {Object} Datos mapeados para BD
 */
export function mapearDatosFormularioABD(datos) {
    return {
        nombre: datos.nombre,
        descripcion: datos.descripcion || null,
        tipo_obra: datos.tipo || datos.tipo_obra || 'construccion',
        ubicacion: datos.ubicacion,
        zona: datos.zona || null,
        municipio: datos.municipio || null,
        provincia: datos.provincia || null,
        presupuesto_aprobado: datos.presupuesto_aprobado,
        fecha_inicio: datos.fecha_inicio,
        fecha_fin_estimada: datos.fecha_fin_estimada || null,
        cliente_id: datos.cliente_id || null,
        usuario_responsable_id: datos.responsable_id || datos.usuario_responsable_id || null,
        proyecto_id: datos.proyecto_id || null,
        observaciones: datos.observaciones || null,
        max_trabajadores: datos.max_trabajadores || 50
    }
}

