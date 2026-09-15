"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { actualizarProducto, obtenerOpcionesFormularioProducto, obtenerProducto } from './servidor'
import { useLanguage } from '@/_Pages/admin/i18n'
import estilos from './editar.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function EditarProductoSucursal() {
    const { id } = useParams()
    const router = useRouter()
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)

    const [tema, setTema] = useState('light')
    const [mounted, setMounted] = useState(false)
    const [cargando, setCargando] = useState(true)
    const [guardando, setGuardando] = useState(false)
    const [estado, setEstado] = useState({ tipo: '', texto: '' })
    const [formulario, setFormulario] = useState(null)
    const [sucursales, setSucursales] = useState([])

    useEffect(() => {
        setMounted(true)
        setTema(localStorage.getItem('tema') || 'light')

        const handleTemaChange = () => {
            setTema(localStorage.getItem('tema') || 'light')
        }

        const cargar = async () => {
            const [res, opciones] = await Promise.all([
                obtenerProducto(id),
                obtenerOpcionesFormularioProducto()
            ])

            if (opciones?.success) {
                setSucursales(opciones.sucursales || [])
            }

            if (!res.success) {
                setEstado({ tipo: 'error', texto: res.mensaje || tr('No encontrado', 'Not found') })
                setCargando(false)
                return
            }

            const p = res.producto
            setFormulario({
                nombre: p.nombre || '',
                descripcion: p.descripcion || '',
                codigo_barras: p.codigo_barras || '',
                sku: p.sku || '',
                precio_compra: p.precio_compra ?? 0,
                precio_venta: p.precio_venta ?? 0,
                stock: p.stock ?? 0,
                stock_minimo: p.stock_minimo ?? 0,
                stock_maximo: p.stock_maximo ?? 1000,
                sucursal_id: p.sucursal_id ? String(p.sucursal_id) : '',
                aplica_itbis: Boolean(p.aplica_itbis),
                activo: Boolean(p.activo)
            })
            setCargando(false)
        }

        window.addEventListener('temaChange', handleTemaChange)
        if (id) cargar()
        return () => window.removeEventListener('temaChange', handleTemaChange)
    }, [id])

    const onChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormulario((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    const onSubmit = async (e) => {
        e.preventDefault()
        setGuardando(true)
        setEstado({ tipo: '', texto: '' })

        const res = await actualizarProducto(id, {
            ...formulario,
            sucursal_id: formulario.sucursal_id ? Number(formulario.sucursal_id) : null,
            precio_compra: Number(formulario.precio_compra || 0),
            precio_venta: Number(formulario.precio_venta || 0),
            stock: Number(formulario.stock || 0),
            stock_minimo: Number(formulario.stock_minimo || 0),
            stock_maximo: formulario.stock_maximo === '' ? null : Number(formulario.stock_maximo)
        })

        if (!res.success) {
            setEstado({ tipo: 'error', texto: res.mensaje || tr('No se pudo actualizar', 'Could not update') })
            setGuardando(false)
            return
        }

        router.push(`/sucursales/productos/ver/${id}`)
    }

    if (cargando) {
        return <LoadingScreen />
    }

    if (!formulario) {
        return <div className={`${estilos.contenedor} ${estilos[tema]}`}><div className={estilos.cargando}>{estado.texto}</div></div>
    }

    if (!mounted) return null

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div className={estilos.headerTexto}>
                    <h1 className={estilos.titulo}>{tr('Editar Producto', 'Edit Product')}</h1>
                    <p className={estilos.subtitulo}>{tr('Actualiza precios, stock y estado del producto', 'Update product pricing, stock and status')}</p>
                </div>
                <div className={estilos.headerAcciones}>
                    <Link href={`/sucursales/productos/ver/${id}`} className={estilos.btnSecundario}>{tr('Cancelar', 'Cancel')}</Link>
                </div>
            </div>

            {estado.texto && <div className={`${estilos.alerta} ${estilos[estado.tipo]}`}>{estado.texto}</div>}

            <form onSubmit={onSubmit} className={estilos.form}>
                <div className={estilos.grupo}>
                    <label>{tr('Nombre', 'Name')} *</label>
                    <input className={estilos.input} name="nombre" value={formulario.nombre} onChange={onChange} required />
                </div>

                <div className={estilos.grupo}>
                    <label>{tr('Descripcion', 'Description')}</label>
                    <textarea className={estilos.textarea} name="descripcion" value={formulario.descripcion} onChange={onChange} rows={3} />
                </div>

                <div className={estilos.grupo}>
                    <label>{tr('Sucursal (opcional)', 'Branch (optional)')}</label>
                    <select className={estilos.select} name="sucursal_id" value={formulario.sucursal_id} onChange={onChange}>
                        <option value="">{tr('Sin sucursal', 'No branch')}</option>
                        {sucursales.map((sucursal) => (
                            <option key={sucursal.id} value={sucursal.id}>{sucursal.nombre}</option>
                        ))}
                    </select>
                </div>

                <div className={estilos.grid2}>
                    <div className={estilos.grupo}>
                        <label>{tr('Codigo de barras', 'Barcode')}</label>
                        <input className={`${estilos.input} ${estilos.readonly}`} name="codigo_barras" value={formulario.codigo_barras || tr('Auto-generado', 'Auto-generated')} readOnly disabled />
                    </div>
                    <div className={estilos.grupo}>
                        <label>SKU</label>
                        <input className={`${estilos.input} ${estilos.readonly}`} name="sku" value={formulario.sku || tr('Auto-generado', 'Auto-generated')} readOnly disabled />
                    </div>
                </div>

                <div className={estilos.grid3}>
                    <div className={estilos.grupo}>
                        <label>{tr('Precio compra', 'Cost price')}</label>
                        <input className={estilos.input} type="number" step="0.01" min="0" name="precio_compra" value={formulario.precio_compra} onChange={onChange} />
                    </div>
                    <div className={estilos.grupo}>
                        <label>{tr('Precio venta', 'Sale price')} *</label>
                        <input className={estilos.input} type="number" step="0.01" min="0" name="precio_venta" value={formulario.precio_venta} onChange={onChange} required />
                    </div>
                    <div className={estilos.grupo}>
                        <label>{tr('Stock', 'Stock')}</label>
                        <input className={estilos.input} type="number" min="0" name="stock" value={formulario.stock} onChange={onChange} />
                    </div>
                </div>

                <div className={estilos.grid2}>
                    <div className={estilos.grupo}>
                        <label>{tr('Stock minimo', 'Minimum stock')}</label>
                        <input className={estilos.input} type="number" min="0" name="stock_minimo" value={formulario.stock_minimo} onChange={onChange} />
                    </div>
                    <div className={estilos.grupo}>
                        <label>{tr('Stock maximo', 'Maximum stock')}</label>
                        <input className={estilos.input} type="number" min="0" name="stock_maximo" value={formulario.stock_maximo} onChange={onChange} />
                    </div>
                </div>

                <div className={estilos.checks}>
                    <label className={estilos.checkActivo}>
                        <input className={estilos.checkInput} type="checkbox" name="activo" checked={formulario.activo} onChange={onChange} />
                        <span className={estilos.checkSwitch} aria-hidden="true"></span>
                        <span className={estilos.checkTexto}>{tr('Activo', 'Active')}</span>
                    </label>
                </div>

                <div className={estilos.botones}>
                    <button type="submit" className={estilos.btn} disabled={guardando}>
                        {guardando ? tr('Guardando...', 'Saving...') : tr('Actualizar Producto', 'Update Product')}
                    </button>
                </div>
            </form>
        </div>
    )
}
