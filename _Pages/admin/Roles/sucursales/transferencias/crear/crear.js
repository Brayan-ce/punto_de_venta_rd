"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/_Pages/admin/i18n'
import { guardarTransferencia, obtenerOpciones, obtenerProductosOrigen } from './servidor'
import estilos from './crear.module.css'

export default function CrearTransferenciaSucursal() {
    const router = useRouter()
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)

    const [tema, setTema] = useState('light')
    const [mounted, setMounted] = useState(false)
    const [guardando, setGuardando] = useState(false)
    const [estado, setEstado] = useState({ tipo: '', texto: '' })

    const [sucursales, setSucursales] = useState([])
    const [productosOrigen, setProductosOrigen] = useState([])

    const [formulario, setFormulario] = useState({
        sucursal_origen_id: '',
        sucursal_destino_id: '',
        tipo_operacion: 'mover',
        prioridad: 'normal',
        observacion_origen: ''
    })

    const [item, setItem] = useState({ producto_id: '', cantidad: '' })
    const [detalle, setDetalle] = useState([])

    useEffect(() => {
        setMounted(true)
        setTema(localStorage.getItem('tema') || 'light')

        const handleTemaChange = () => setTema(localStorage.getItem('tema') || 'light')
        const cargar = async () => {
            const res = await obtenerOpciones()
            if (res?.success) {
                setSucursales(res.sucursales || [])
            }
        }

        cargar()
        window.addEventListener('temaChange', handleTemaChange)
        return () => window.removeEventListener('temaChange', handleTemaChange)
    }, [])

    useEffect(() => {
        const cargarProductos = async () => {
            if (!formulario.sucursal_origen_id) {
                setProductosOrigen([])
                return
            }

            const res = await obtenerProductosOrigen(formulario.sucursal_origen_id)
            if (res?.success) {
                setProductosOrigen(res.productos || [])
            }
        }

        cargarProductos()
    }, [formulario.sucursal_origen_id])

    const onCampo = (e) => {
        const { name, value } = e.target
        setFormulario((prev) => ({ ...prev, [name]: value }))
    }

    const onItem = (e) => {
        const { name, value } = e.target
        setItem((prev) => ({ ...prev, [name]: value }))
    }

    const productoSeleccionado = useMemo(() => {
        const id = Number(item.producto_id)
        return productosOrigen.find((p) => Number(p.id) === id) || null
    }, [item.producto_id, productosOrigen])

    const agregarItem = () => {
        const productoId = Number(item.producto_id)
        const cantidad = Number(item.cantidad || 0)

        if (!productoId || cantidad <= 0) {
            setEstado({ tipo: 'error', texto: tr('Selecciona producto y cantidad valida', 'Select product and valid quantity') })
            return
        }

        const producto = productosOrigen.find((p) => Number(p.id) === productoId)
        if (!producto) return

        const yaExiste = detalle.some((d) => Number(d.producto_id) === productoId)
        if (yaExiste) {
            setDetalle((prev) => prev.map((d) => Number(d.producto_id) === productoId ? { ...d, cantidad: d.cantidad + cantidad } : d))
        } else {
            setDetalle((prev) => ([
                ...prev,
                {
                    producto_id: productoId,
                    producto_nombre: producto.nombre,
                    producto_codigo: producto.codigo,
                    stock_disponible: Number(producto.stock_disponible || 0),
                    cantidad
                }
            ]))
        }

        setItem({ producto_id: '', cantidad: '' })
        setEstado({ tipo: '', texto: '' })
    }

    const quitarItem = (productoId) => {
        setDetalle((prev) => prev.filter((d) => Number(d.producto_id) !== Number(productoId)))
    }

    const guardar = async (e) => {
        e.preventDefault()
        setGuardando(true)
        setEstado({ tipo: '', texto: '' })

        const res = await guardarTransferencia({
            ...formulario,
            sucursal_origen_id: Number(formulario.sucursal_origen_id || 0),
            sucursal_destino_id: Number(formulario.sucursal_destino_id || 0),
            detalle: detalle.map((d) => ({ producto_id: d.producto_id, cantidad: d.cantidad }))
        })

        if (!res.success) {
            setEstado({ tipo: 'error', texto: res.mensaje || tr('No se pudo crear', 'Could not create') })
            setGuardando(false)
            return
        }

        router.push(`/sucursales/transferencias/${res.id}`)
    }

    if (!mounted) return null

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>{tr('Nueva Transferencia', 'New Transfer')}</h1>
                    <p className={estilos.subtitulo}>{tr('Comparte productos entre sucursales de forma controlada', 'Share products between branches in a controlled way')}</p>
                </div>
                <Link href="/sucursales/transferencias" className={estilos.btnSecundario}>{tr('Volver', 'Back')}</Link>
            </div>

            {estado.texto && <div className={`${estilos.alerta} ${estilos[estado.tipo]}`}>{estado.texto}</div>}

            <form onSubmit={guardar} className={estilos.form}>
                <div className={estilos.grid2}>
                    <div className={estilos.grupo}>
                        <label>{tr('Sucursal origen', 'Origin branch')} *</label>
                        <select className={estilos.select} name="sucursal_origen_id" value={formulario.sucursal_origen_id} onChange={onCampo} required>
                            <option value="">{tr('Selecciona origen', 'Select origin')}</option>
                            {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                        </select>
                    </div>

                    <div className={estilos.grupo}>
                        <label>{tr('Sucursal destino', 'Destination branch')} *</label>
                        <select className={estilos.select} name="sucursal_destino_id" value={formulario.sucursal_destino_id} onChange={onCampo} required>
                            <option value="">{tr('Selecciona destino', 'Select destination')}</option>
                            {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                        </select>
                    </div>
                </div>

                <div className={estilos.grid2}>
                    <div className={estilos.grupo}>
                        <label>{tr('Modo', 'Mode')}</label>
                        <select className={estilos.select} name="tipo_operacion" value={formulario.tipo_operacion} onChange={onCampo}>
                            <option value="mover">{tr('Mover (descuenta origen)', 'Move (decrease origin stock)')}</option>
                            <option value="compartir">{tr('Compartir (mantiene origen)', 'Share (keep origin stock)')}</option>
                        </select>
                    </div>

                    <div className={estilos.grupo}>
                        <label>{tr('Prioridad', 'Priority')}</label>
                        <select className={estilos.select} name="prioridad" value={formulario.prioridad} onChange={onCampo}>
                            <option value="baja">{tr('Baja', 'Low')}</option>
                            <option value="normal">{tr('Normal', 'Normal')}</option>
                            <option value="alta">{tr('Alta', 'High')}</option>
                            <option value="urgente">{tr('Urgente', 'Urgent')}</option>
                        </select>
                    </div>

                    <div className={estilos.grupo}>
                        <label>{tr('Nota', 'Note')}</label>
                        <input className={estilos.input} name="observacion_origen" value={formulario.observacion_origen} onChange={onCampo} placeholder={tr('Observacion opcional', 'Optional observation')} />
                    </div>
                </div>

                <div className={estilos.bloqueDetalle}>
                    <h3>{tr('Detalle de productos', 'Product detail')}</h3>
                    <div className={estilos.gridAgregar}>
                        <select className={estilos.select} name="producto_id" value={item.producto_id} onChange={onItem}>
                            <option value="">{tr('Selecciona producto', 'Select product')}</option>
                            {productosOrigen.map((p) => (
                                <option key={p.id} value={p.id}>{p.nombre} ({p.codigo})</option>
                            ))}
                        </select>
                        <input className={estilos.input} type="number" min="0.01" step="0.01" name="cantidad" value={item.cantidad} onChange={onItem} placeholder={tr('Cantidad', 'Quantity')} />
                        <button type="button" className={estilos.btnMini} onClick={agregarItem}>{tr('Agregar', 'Add')}</button>
                    </div>

                    {productoSeleccionado && (
                        <p className={estilos.hint}>{tr('Stock disponible en origen', 'Available stock in origin')}: {Number(productoSeleccionado.stock_disponible || 0).toFixed(2)}</p>
                    )}

                    {detalle.length === 0 ? (
                        <p className={estilos.vacio}>{tr('Aun no hay productos agregados', 'No products added yet')}</p>
                    ) : (
                        <div className={estilos.tabla}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>{tr('Producto', 'Product')}</th>
                                        <th>{tr('Codigo', 'Code')}</th>
                                        <th>{tr('Stock origen', 'Origin stock')}</th>
                                        <th>{tr('Cantidad', 'Quantity')}</th>
                                        <th>{tr('Accion', 'Action')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detalle.map((d) => (
                                        <tr key={d.producto_id}>
                                            <td>{d.producto_nombre}</td>
                                            <td>{d.producto_codigo}</td>
                                            <td>{Number(d.stock_disponible || 0).toFixed(2)}</td>
                                            <td>{Number(d.cantidad).toFixed(2)}</td>
                                            <td><button type="button" className={estilos.btnEliminar} onClick={() => quitarItem(d.producto_id)}>{tr('Quitar', 'Remove')}</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className={estilos.botones}>
                    <button type="submit" className={estilos.btn} disabled={guardando}>
                        {guardando ? tr('Guardando...', 'Saving...') : tr('Crear Transferencia', 'Create Transfer')}
                    </button>
                </div>
            </form>
        </div>
    )
}
