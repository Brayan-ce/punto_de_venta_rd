"use server"

import {
    obtenerTodosModulos as obtenerTodosModulosServidor,
    obtenerModulosEmpresa as obtenerModulosEmpresaServidor,
    toggleModuloEmpresa as toggleModuloEmpresaServidor,
    obtenerPermisoImpresionEmpresa as obtenerPermisoImpresionEmpresaServidor,
    togglePermisoImpresionEmpresa as togglePermisoImpresionEmpresaServidor
} from '@/lib/modulos/servidor'
import { cookies } from 'next/headers'

/**
 * Obtener todos los módulos disponibles (con validación de superadmin)
 */
export async function obtenerTodosModulos() {
    try {
        const cookieStore = await cookies()
        const userTipo = cookieStore.get('userTipo')?.value

        if (userTipo !== 'superadmin') {
            return {
                success: false,
                mensaje: 'Acceso no autorizado'
            }
        }

        const modulos = await obtenerTodosModulosServidor()
        return {
            success: true,
            modulos
        }
    } catch (error) {
        console.error('Error al obtener todos los módulos:', error)
        return {
            success: false,
            mensaje: 'Error al cargar módulos'
        }
    }
}

/**
 * Obtener módulos de una empresa (con validación de superadmin)
 */
export async function obtenerModulosEmpresa(empresaId) {
    try {
        const cookieStore = await cookies()
        const userTipo = cookieStore.get('userTipo')?.value

        if (userTipo !== 'superadmin') {
            return {
                success: false,
                mensaje: 'Acceso no autorizado'
            }
        }

        if (!empresaId) {
            return {
                success: false,
                mensaje: 'empresaId es requerido'
            }
        }

        const modulos = await obtenerModulosEmpresaServidor(parseInt(empresaId))
        return {
            success: true,
            modulos
        }
    } catch (error) {
        console.error('Error al obtener módulos de empresa:', error)
        return {
            success: false,
            mensaje: 'Error al cargar módulos de la empresa'
        }
    }
}

/**
 * Habilitar/deshabilitar módulo para empresa (con validación de superadmin)
 */
export async function toggleModuloEmpresa(empresaId, moduloId, habilitado) {
    try {
        const cookieStore = await cookies()
        const userTipo = cookieStore.get('userTipo')?.value

        if (userTipo !== 'superadmin') {
            return {
                success: false,
                mensaje: 'Acceso no autorizado'
            }
        }

        if (!empresaId || !moduloId) {
            return {
                success: false,
                mensaje: 'empresaId y moduloId son requeridos'
            }
        }

        const resultado = await toggleModuloEmpresaServidor(
            parseInt(empresaId),
            parseInt(moduloId),
            habilitado
        )

        return resultado
    } catch (error) {
        console.error('Error al toggle módulo:', error)
        return {
            success: false,
            mensaje: 'Error al actualizar módulo'
        }
    }
}

/**
 * Obtener el estado de permite_impresion de una empresa
 */
export async function obtenerPermisoImpresionEmpresa(empresaId) {
    try {
        const cookieStore = await cookies()
        const userTipo = cookieStore.get('userTipo')?.value

        if (userTipo !== 'superadmin') {
            return {
                success: false,
                mensaje: 'Acceso no autorizado'
            }
        }

        if (!empresaId) {
            return {
                success: false,
                mensaje: 'empresaId es requerido'
            }
        }

        const valor = await obtenerPermisoImpresionEmpresaServidor(parseInt(empresaId))
        return {
            success: true,
            permite_impresion: valor
        }
    } catch (error) {
        console.error('Error al obtener permiso impresión:', error)
        return {
            success: false,
            mensaje: 'Error al cargar permiso de impresión'
        }
    }
}

/**
 * Cambiar permite_impresion de una empresa en cascada a todos sus usuarios
 */
export async function togglePermisoImpresionEmpresa(empresaId, habilitado) {
    try {
        const cookieStore = await cookies()
        const userTipo = cookieStore.get('userTipo')?.value

        if (userTipo !== 'superadmin') {
            return {
                success: false,
                mensaje: 'Acceso no autorizado'
            }
        }

        if (!empresaId) {
            return {
                success: false,
                mensaje: 'empresaId es requerido'
            }
        }

        const resultado = await togglePermisoImpresionEmpresaServidor(
            parseInt(empresaId),
            habilitado
        )

        return resultado
    } catch (error) {
        console.error('Error al toggle permiso impresión:', error)
        return {
            success: false,
            mensaje: 'Error al actualizar permiso de impresión'
        }
    }
}

