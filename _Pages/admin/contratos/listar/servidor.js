"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

async function getEmpresaId() {
    const cookieStore = await cookies()
    return cookieStore.get('empresaId')?.value
}
async function getUserId() {
    const cookieStore = await cookies()
    return cookieStore.get('userId')?.value
}

export async function obtenerDatosEmpresa() {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }
        connection = await db.getConnection()
        const [rows] = await connection.execute(
            `SELECT moneda, simbolo_moneda, impuesto_porcentaje, nombre_empresa, direccion, telefono, email, rnc FROM empresas WHERE id = ?`,
            [empresaId]
        )
        connection.release()
        const e = rows[0]
        return {
            success: true,
            empresa: {
                moneda: e?.moneda || 'DOP',
                simbolo_moneda: e?.simbolo_moneda || 'RD$',
                locale: e?.moneda === 'USD' ? 'en-US' : 'es-DO',
                itbis_incluido: true,
                nombre: e?.nombre_empresa || '',
                direccion: e?.direccion || '',
                telefono: e?.telefono || '',
                email: e?.email || '',
                rnc: e?.rnc || ''
            }
        }
    } catch (error) {
        console.error('obtenerDatosEmpresa:', error)
        if (connection) connection.release()
        return { success: false, mensaje: error.message }
    }
}

export async function obtenerContratosAgrupados(filtros = {}) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        let where = 'c.empresa_id = ?'
        const params = [empresaId]

        if (filtros.estado) { where += ' AND c.estado = ?'; params.push(filtros.estado) }
        if (filtros.buscar) {
            where += ' AND (c.numero LIKE ? OR cl.nombre LIKE ? OR cl.apellidos LIKE ?)'
            const b = `%${filtros.buscar}%`
            params.push(b, b, b)
        }
        if (filtros.categoria_id) {
            if (filtros.categoria_id === 'sin') {
                where += ' AND cc.categoria_id IS NULL'
            } else {
                where += ' AND cc.categoria_id = ?'
                params.push(filtros.categoria_id)
            }
        }

        const [contratos] = await connection.execute(
            `SELECT c.id, c.numero, c.monto_total, c.monto_financiado,
                    c.total_intereses, c.total_pagar, c.saldo_pendiente,
                    c.meses, c.frecuencia, c.tasa_interes, c.cuota_mensual,
                    c.fecha_inicio, c.fecha_fin, c.estado, c.created_at,
                    cl.nombre as cliente_nombre, cl.apellidos as cliente_apellidos,
                    cl.numero_documento as cliente_documento, cl.telefono as cliente_telefono,
                    p.nombre as plan_nombre,
                    cat.id as categoria_id, cat.nombre as categoria_nombre, cat.color as categoria_color,
                    (SELECT COUNT(*) FROM fin_cuotas fq WHERE fq.contrato_id = c.id AND fq.estado = 'vencida') as cuotas_vencidas,
                    (SELECT COUNT(*) FROM fin_cuotas fq WHERE fq.contrato_id = c.id AND fq.estado = 'pendiente') as cuotas_pendientes
            FROM fin_contratos c
            LEFT JOIN clientes cl ON c.cliente_id = cl.id
            LEFT JOIN fin_planes p ON c.plan_id = p.id
            LEFT JOIN fin_contrato_categorias cc ON c.id = cc.contrato_id
            LEFT JOIN fin_categorias cat ON cc.categoria_id = cat.id
            WHERE ${where}
            ORDER BY cat.orden ASC, cat.nombre ASC, c.created_at DESC`,
            params
        )

        const [categorias] = await connection.execute(
            `SELECT * FROM fin_categorias WHERE empresa_id = ? ORDER BY orden ASC, nombre ASC`,
            [empresaId]
        )

        connection.release()

        const grupos = []
        const usadas = new Set()

        for (const cat of categorias) {
            const items = contratos.filter(c => c.categoria_id === cat.id)
            if (items.length > 0 || !filtros.categoria_id) {
                grupos.push({ categoria: cat, contratos: items })
                usadas.add(cat.id)
            }
        }

        const sinCategoria = contratos.filter(c => !c.categoria_id)
        if (sinCategoria.length > 0) {
            grupos.push({ categoria: null, contratos: sinCategoria })
        }

        return { success: true, grupos, categorias, total: contratos.length }

    } catch (error) {
        console.error('obtenerContratosAgrupados:', error)
        if (connection) connection.release()
        return { success: false, mensaje: error.message, grupos: [], categorias: [], total: 0 }
    }
}

export async function obtenerCategorias() {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, categorias: [] }

        connection = await db.getConnection()
        const [categorias] = await connection.execute(
            `SELECT c.*, COUNT(cc.id) as total_contratos
            FROM fin_categorias c
            LEFT JOIN fin_contrato_categorias cc ON c.id = cc.categoria_id
            WHERE c.empresa_id = ?
            GROUP BY c.id
            ORDER BY c.orden ASC, c.nombre ASC`,
            [empresaId]
        )
        connection.release()
        return { success: true, categorias }
    } catch (error) {
        if (connection) connection.release()
        return { success: false, categorias: [] }
    }
}

export async function crearCategoria(datos) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }
        if (!datos.nombre?.trim()) return { success: false, mensaje: 'El nombre es requerido' }

        connection = await db.getConnection()
        const [[{ max }]] = await connection.execute(
            `SELECT COALESCE(MAX(orden), 0) as max FROM fin_categorias WHERE empresa_id = ?`,
            [empresaId]
        )
        await connection.execute(
            `INSERT INTO fin_categorias (empresa_id, nombre, color, descripcion, orden) VALUES (?,?,?,?,?)`,
            [empresaId, datos.nombre.trim(), datos.color || '#6b7280', datos.descripcion || null, max + 1]
        )
        connection.release()
        return { success: true, mensaje: 'Categoría creada' }
    } catch (error) {
        if (connection) connection.release()
        return { success: false, mensaje: error.message }
    }
}

export async function editarCategoria(id, datos) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }
        if (!datos.nombre?.trim()) return { success: false, mensaje: 'El nombre es requerido' }

        connection = await db.getConnection()
        await connection.execute(
            `UPDATE fin_categorias SET nombre = ?, color = ?, descripcion = ? WHERE id = ? AND empresa_id = ?`,
            [datos.nombre.trim(), datos.color || '#6b7280', datos.descripcion || null, id, empresaId]
        )
        connection.release()
        return { success: true, mensaje: 'Categoría actualizada' }
    } catch (error) {
        if (connection) connection.release()
        return { success: false, mensaje: error.message }
    }
}

export async function eliminarCategoria(id) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()
        await connection.execute(
            `DELETE FROM fin_categorias WHERE id = ? AND empresa_id = ?`,
            [id, empresaId]
        )
        connection.release()
        return { success: true, mensaje: 'Categoría eliminada' }
    } catch (error) {
        if (connection) connection.release()
        return { success: false, mensaje: error.message }
    }
}

export async function asignarCategoria(contratoId, categoriaId) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()
        if (!categoriaId) {
            await connection.execute(
                `DELETE FROM fin_contrato_categorias WHERE contrato_id = ? AND empresa_id = ?`,
                [contratoId, empresaId]
            )
        } else {
            await connection.execute(
                `INSERT INTO fin_contrato_categorias (contrato_id, categoria_id, empresa_id)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE categoria_id = VALUES(categoria_id)`,
                [contratoId, categoriaId, empresaId]
            )
        }
        connection.release()
        return { success: true, mensaje: 'Categoría asignada' }
    } catch (error) {
        if (connection) connection.release()
        return { success: false, mensaje: error.message }
    }
}

export async function obtenerContratos(filtros = {}) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        const pagina = filtros.pagina || 1
        const limite = filtros.limite || 20
        const offset = (pagina - 1) * limite

        let where = 'c.empresa_id = ?'
        const params = [empresaId]

        if (filtros.estado) { where += ' AND c.estado = ?'; params.push(filtros.estado) }
        if (filtros.buscar) {
            where += ' AND (c.numero LIKE ? OR cl.nombre LIKE ? OR cl.apellidos LIKE ?)'
            const b = `%${filtros.buscar}%`
            params.push(b, b, b)
        }
        if (filtros.cliente_id) { where += ' AND c.cliente_id = ?'; params.push(filtros.cliente_id) }

        const [[{ total }]] = await connection.execute(
            `SELECT COUNT(*) as total
            FROM fin_contratos c
            LEFT JOIN clientes cl ON c.cliente_id = cl.id
            WHERE ${where}`,
            params
        )

        const [contratos] = await connection.execute(
            `SELECT c.id, c.numero, c.monto_total, c.monto_inicial, c.monto_financiado,
                    c.total_intereses, c.total_pagar, c.saldo_pendiente,
                    c.meses, c.frecuencia, c.tasa_interes, c.cuota_mensual,
                    c.fecha_inicio, c.fecha_fin, c.estado, c.notas,
                    cl.nombre as cliente_nombre, cl.apellidos as cliente_apellidos,
                    cl.numero_documento as cliente_documento, cl.telefono as cliente_telefono,
                    p.nombre as plan_nombre, p.codigo as plan_codigo,
                    u.nombre as vendedor_nombre
            FROM fin_contratos c
            LEFT JOIN clientes cl ON c.cliente_id = cl.id
            LEFT JOIN fin_planes p ON c.plan_id = p.id
            LEFT JOIN usuarios u ON c.usuario_id = u.id
            WHERE ${where}
            ORDER BY c.created_at DESC
            LIMIT ? OFFSET ?`,
            [...params, limite, offset]
        )

        connection.release()

        return {
            success: true,
            contratos,
            paginacion: { pagina, limite, total: parseInt(total), totalPaginas: Math.ceil(total / limite) }
        }

    } catch (error) {
        console.error('obtenerContratos:', error)
        if (connection) connection.release()
        return { success: false, mensaje: error.message, contratos: [] }
    }
}