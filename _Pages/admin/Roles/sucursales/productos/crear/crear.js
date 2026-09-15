"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { crearProducto, obtenerOpcionesFormularioProducto } from './servidor'
import { useLanguage } from '@/_Pages/admin/i18n'
import estilos from './crear.module.css'

const inicial = {
    nombre: '',
    descripcion: '',
    codigo_barras: '',
    sku: '',
    precio_compra: '',
    precio_venta: '',
    stock: '1000',
    stock_minimo: '0',
    stock_maximo: '1000',
    sucursal_id: '',
    activo: true
}

export default function CrearProductoSucursal() {
    const router = useRouter()
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)

    const [tema, setTema] = useState('light')
    const [mounted, setMounted] = useState(false)
    const [formulario, setFormulario] = useState(inicial)
    const [guardando, setGuardando] = useState(false)
    const [estado, setEstado] = useState({ tipo: '', texto: '' })
    const [sucursales, setSucursales] = useState([])

    useEffect(() => {
        setMounted(true)
        setTema(localStorage.getItem('tema') || 'light')

        const cargarOpciones = async () => {
            const res = await obtenerOpcionesFormularioProducto()
            if (res?.success) {
                setSucursales(res.sucursales || [])
            }
        }

        cargarOpciones()

        const handleTemaChange = () => {
            setTema(localStorage.getItem('tema') || 'light')
        }

        window.addEventListener('temaChange', handleTemaChange)
        return () => window.removeEventListener('temaChange', handleTemaChange)
    }, [])

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

        const res = await crearProducto({
            ...formulario,
            sucursal_id: formulario.sucursal_id ? Number(formulario.sucursal_id) : null,
            precio_compra: Number(formulario.precio_compra || 0),
            precio_venta: Number(formulario.precio_venta || 0),
            stock: Number(formulario.stock === '' ? 1000 : formulario.stock),
            stock_minimo: Number(formulario.stock_minimo || 0),
            stock_maximo: formulario.stock_maximo === '' ? null : Number(formulario.stock_maximo)
        })

        if (!res.success) {
            setEstado({ tipo: 'error', texto: res.mensaje || tr('No se pudo crear', 'Could not create') })
            setGuardando(false)
            return
        }

        setEstado({ tipo: 'ok', texto: res.mensaje || tr('Producto creado', 'Product created') })
        router.push(`/sucursales/productos/ver/${res.id}`)
    }

    if (!mounted) return null

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div className={estilos.headerTexto}>
                    <h1 className={estilos.titulo}>{tr('Crear Producto', 'Create Product')}</h1>
                    <p className={estilos.subtitulo}>{tr('Registra un producto para tu sucursal', 'Register a product for your branch')}</p>
                </div>
                <div className={estilos.headerAcciones}>
                    <Link href="/sucursales/productos" className={estilos.btnSecundario}>{tr('Volver', 'Back')}</Link>
                </div>
            </div>

            {estado.texto && <div className={`${estilos.alerta} ${estilos[estado.tipo]}`}>{estado.texto}</div>}

            <form onSubmit={onSubmit} className={estilos.form}>
                <div className={estilos.grupo}>
                    <label>{tr('Nombre', 'Name')} *</label>
                    <input className={estilos.input} name="nombre" value={formulario.nombre} onChange={onChange} required />
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

                <div className={estilos.grupo}>
                    <label>{tr('Descripcion', 'Description')}</label>
                    <textarea className={estilos.textarea} name="descripcion" value={formulario.descripcion} onChange={onChange} rows={3} />
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
                        <label>{tr('Stock inicial', 'Initial stock')}</label>
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

                <div className={estilos.grid2}>
                    <div className={estilos.grupo}>
                        <label>{tr('Codigo de barras', 'Barcode')}</label>
                        <input className={`${estilos.input} ${estilos.readonly}`} name="codigo_barras" value={tr('Auto-generado al guardar', 'Auto-generated on save')} readOnly disabled />
                    </div>
                    <div className={estilos.grupo}>
                        <label>SKU</label>
                        <input className={`${estilos.input} ${estilos.readonly}`} name="sku" value={tr('Auto-generado al guardar', 'Auto-generated on save')} readOnly disabled />
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
                        {guardando ? tr('Guardando...', 'Saving...') : tr('Guardar Producto', 'Save Product')}
                    </button>
                </div>
            </form>
        </div>
    )
}
