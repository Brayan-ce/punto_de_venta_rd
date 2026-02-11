"use server"

/**
 * Barrel file para compatibilidad hacia atrás
 * Wraps todas las funciones de los casos de uso como async functions
 */

// Listar
export async function obtenerObras(filtros) {
    const { obtenerObras: obtenerObrasImpl } = await import('./listar/servidor')
    return await obtenerObrasImpl(filtros)
}

// Nuevo
export async function crearObra(datos) {
    const { crearObra: crearObraImpl } = await import('./nuevo/servidor')
    return await crearObraImpl(datos)
}

// Editar
export async function obtenerObraPorIdEditar(obraId) {
    const { obtenerObraPorId } = await import('./editar/servidor')
    return await obtenerObraPorId(obraId)
}

export async function actualizarObra(obraId, datos) {
    const { actualizarObra: actualizarObraImpl } = await import('./editar/servidor')
    return await actualizarObraImpl(obraId, datos)
}

// Ver
export async function obtenerObraPorId(obraId) {
    const { obtenerObraPorId: obtenerObraPorIdImpl } = await import('./ver/servidor')
    return await obtenerObraPorIdImpl(obraId)
}

// Estado
export async function cambiarEstadoObra(obraId, nuevoEstado, razon) {
    const { cambiarEstadoObra: cambiarEstadoObraImpl } = await import('./estado/servidor')
    return await cambiarEstadoObraImpl(obraId, nuevoEstado, razon)
}

// Estadísticas
export async function obtenerEstadisticasObra(obraId) {
    const { obtenerEstadisticasObra: obtenerEstadisticasObraImpl } = await import('./estadisticas/servidor')
    return await obtenerEstadisticasObraImpl(obraId)
}

// Formulario
export async function obtenerDatosFormulario() {
    const { obtenerDatosFormulario: obtenerDatosFormularioImpl } = await import('./formulario/servidor')
    return await obtenerDatosFormularioImpl()
}

// Bitácora
export async function obtenerTrabajadoresAsignados(obraId) {
    const { obtenerTrabajadoresAsignados: obtenerTrabajadoresAsignadosImpl } = await import('./bitacora/servidor')
    return await obtenerTrabajadoresAsignadosImpl(obraId)
}

export async function registrarBitacora(datos) {
    const { registrarBitacora: registrarBitacoraImpl } = await import('./bitacora/servidor')
    return await registrarBitacoraImpl(datos)
}

// Mantener funciones legacy para compatibilidad
export async function guardarObra(datos) {
    const { crearObra: crearObraImpl } = await import('./nuevo/servidor')
    return await crearObraImpl(datos)
}

// =====================================================
// OBRAS PLANTILLA
// =====================================================

// =====================================================
// OBRAS PLANTILLA
// =====================================================

/**
 * Obtiene todas las obras plantilla de la empresa del usuario
 */
export async function obtenerObrasPlantilla() {
    try {
        const { obtenerUsuarioActual } = await import('./lib')
        const usuario = await obtenerUsuarioActual()
        
        if (!usuario || !usuario.empresaId) {
            return {
                success: false,
                mensaje: 'Usuario no autenticado',
                obras: []
            }
        }

        const { ObraRepository } = await import('./repositories/ObraRepository')
        const obras = await ObraRepository.findAllPlantillas(usuario.empresaId)
        
        return {
            success: true,
            obras
        }
    } catch (error) {
        console.error('Error al obtener obras plantilla:', error)
        return {
            success: false,
            mensaje: 'Error al obtener obras plantilla',
            obras: []
        }
    }
}

/**
 * Crea una obra desde una plantilla
 */
export async function crearObraDesdePlantilla(datos) {
    try {
        const { obtenerUsuarioActual } = await import('./lib')
        const usuario = await obtenerUsuarioActual()
        
        if (!usuario || !usuario.empresaId) {
            return {
                success: false,
                mensaje: 'Usuario no autenticado'
            }
        }

        // Validar datos requeridos
        if (!datos.obra_plantilla_id) {
            return {
                success: false,
                mensaje: 'Debe seleccionar una obra plantilla'
            }
        }

        if (!datos.proyecto_id) {
            return {
                success: false,
                mensaje: 'Debe especificar un proyecto'
            }
        }

        const { ObraService } = await import('./services/ObraService')
        const resultado = await ObraService.clonarObraDesdePlantilla(
            datos.obra_plantilla_id,
            datos.proyecto_id,
            {
                nombre: datos.nombre,
                descripcion: datos.descripcion,
                ubicacion: datos.ubicacion,
                zona: datos.zona,
                municipio: datos.municipio,
                provincia: datos.provincia,
                fecha_inicio: datos.fecha_inicio,
                fecha_fin_estimada: datos.fecha_fin_estimada
            },
            usuario.empresaId,
            usuario.id
        )

        return resultado
    } catch (error) {
        console.error('Error al crear obra desde plantilla:', error)
        return {
            success: false,
            mensaje: 'Error al crear obra desde plantilla',
            error: error.message
        }
    }
}

/**
 * Guarda una obra existente como plantilla
 */
export async function guardarObraComoPlantilla(obraId) {
    try {
        const { obtenerUsuarioActual } = await import('./lib')
        const usuario = await obtenerUsuarioActual()
        
        if (!usuario || !usuario.empresaId) {
            return {
                success: false,
                mensaje: 'Usuario no autenticado'
            }
        }

        if (!obraId) {
            return {
                success: false,
                mensaje: 'Debe especificar una obra'
            }
        }

        const { ObraService } = await import('./services/ObraService')
        const resultado = await ObraService.guardarObraComoPlantilla(
            obraId,
            usuario.empresaId,
            usuario.id
        )

        return resultado
    } catch (error) {
        console.error('Error al guardar obra como plantilla:', error)
        return {
            success: false,
            mensaje: 'Error al guardar obra como plantilla',
            error: error.message
        }
    }
}