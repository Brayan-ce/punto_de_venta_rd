"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { obtenerMetodos, crearMetodo, editarMetodo, eliminarMetodo } from './servidor'
import { useLanguage } from '@/_Pages/admin/i18n'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'
import estilos from './metodo.module.css'

const ICONS = ['card-outline','cash-outline','wallet-outline','phone-portrait-outline','business-outline','globe-outline','swap-horizontal-outline','barcode-outline']

export default function MetodosPago() {
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)
    const [tema, setTema]         = useState('light')
    const [cargando, setCargando] = useState(true)
    const [metodos, setMetodos]   = useState([])

    const [modal, setModal]       = useState(false)
    const [editando, setEditando] = useState(null)
    const [form, setForm]         = useState({ nombre: '' })
    const [guardando, setGuardando] = useState(false)
    const [error, setError]       = useState('')

    const [modalEliminar, setModalEliminar] = useState(null)
    const [eliminando, setEliminando]       = useState(false)
    const [errorEliminar, setErrorEliminar] = useState('')

    useEffect(() => {
        const t = localStorage.getItem('tema') || 'light'
        setTema(t)
        const fn = () => setTema(localStorage.getItem('tema') || 'light')
        window.addEventListener('temaChange', fn); window.addEventListener('storage', fn)
        return () => { window.removeEventListener('temaChange', fn); window.removeEventListener('storage', fn) }
    }, [])

    useEffect(() => { cargar() }, [])

    const cargar = async () => {
        setCargando(true)
        const r = await obtenerMetodos()
        if (r.success) setMetodos(r.metodos)
        setCargando(false)
    }

    const abrirModal = (metodo = null) => {
        setEditando(metodo)
        setForm({ nombre: metodo?.nombre || '' })
        setError('')
        setModal(true)
    }

    const handleGuardar = async () => {
        if (!form.nombre.trim()) { setError(tr('El nombre es requerido', 'Name is required')); return }
        setGuardando(true); setError('')
        const r = editando ? await editarMetodo(editando.id, form) : await crearMetodo(form)
        if (r.success) { setModal(false); cargar() }
        else setError(r.mensaje)
        setGuardando(false)
    }

    const handleEliminar = async () => {
        setEliminando(true); setErrorEliminar('')
        const r = await eliminarMetodo(modalEliminar.id)
        if (r.success) { setModalEliminar(null); cargar() }
        else setErrorEliminar(r.mensaje)
        setEliminando(false)
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>

            <div className={estilos.header}>
                <div className={estilos.headerLeft}>
                    <Link href="/admin/pagos" className={estilos.btnVolver}>
                        <ion-icon name="arrow-back-outline"></ion-icon>
                            <span>{tr('Pagos', 'Payments')}</span>
                    </Link>
                    <div className={estilos.headerInfo}>
                        <div className={estilos.headerIcono}><ion-icon name="card-outline"></ion-icon></div>
                        <div>
                            <h1 className={estilos.titulo}>{tr('Métodos de pago', 'Payment methods')}</h1>
                            <p className={estilos.subtitulo}>{language === 'en' ? `${metodos.length} method${metodos.length !== 1 ? 's' : ''} registered` : `${metodos.length} método${metodos.length !== 1 ? 's' : ''} registrado${metodos.length !== 1 ? 's' : ''}`}</p>
                        </div>
                    </div>
                </div>
                <button className={estilos.btnNuevo} onClick={() => abrirModal()}>
                    <ion-icon name="add-circle-outline"></ion-icon>
                    <span>{tr('Nuevo método', 'New method')}</span>
                </button>
            </div>

            {cargando ? <LoadingScreen /> : metodos.length === 0 ? (
                <div className={estilos.vacio}>
                    <ion-icon name="card-outline"></ion-icon>
                    <h3>{tr('Sin métodos de pago', 'No payment methods')}</h3>
                    <p>{tr('Crea el primer método para usarlo en los pagos', 'Create the first method to use it in payments')}</p>
                    <button className={estilos.btnNuevo} onClick={() => abrirModal()}>
                        <ion-icon name="add-circle-outline"></ion-icon>
                        {tr('Crear método', 'Create method')}
                    </button>
                </div>
            ) : (
                <div className={estilos.grid}>
                    {metodos.map(m => (
                        <div key={m.id} className={estilos.card}>
                            <div className={estilos.cardIcono}>
                                <ion-icon name="card-outline"></ion-icon>
                            </div>
                            <div className={estilos.cardInfo}>
                                <span className={estilos.cardNombre}>{m.nombre}</span>
                                <span className={estilos.cardPagos}>
                                    {parseInt(m.total_pagos) > 0
                                        ? (language === 'en' ? `${m.total_pagos} payment${m.total_pagos !== 1 ? 's' : ''} registered` : `${m.total_pagos} pago${m.total_pagos !== 1 ? 's' : ''} registrado${m.total_pagos !== 1 ? 's' : ''}`)
                                        : tr('Sin pagos aún', 'No payments yet')}
                                </span>
                            </div>
                            <div className={estilos.cardAcciones}>
                                <button className={estilos.btnEditar} onClick={() => abrirModal(m)} title={tr('Editar', 'Edit')}>
                                    <ion-icon name="pencil-outline"></ion-icon>
                                </button>
                                <button className={estilos.btnEliminar} onClick={() => { setModalEliminar(m); setErrorEliminar('') }} title={tr('Eliminar', 'Delete')}>
                                    <ion-icon name="trash-outline"></ion-icon>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {modal && (
                <div className={estilos.overlay} onClick={e => e.target === e.currentTarget && setModal(false)}>
                    <div className={`${estilos.modal} ${estilos[tema]}`}>
                        <div className={estilos.modalHeader}>
                            <h3 className={estilos.modalTitulo}>
                                <ion-icon name="card-outline"></ion-icon>
                                {editando ? tr('Editar método', 'Edit method') : tr('Nuevo método de pago', 'New payment method')}
                            </h3>
                            <button className={estilos.btnCerrar} onClick={() => setModal(false)}>
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>

                        <div className={estilos.modalBody}>
                            <div className={estilos.campo}>
                                <label className={estilos.label}>{tr('Nombre *', 'Name *')}</label>
                                <input
                                    type="text" className={estilos.input} autoFocus
                                    placeholder={tr('Ej: Efectivo, Transferencia, Tarjeta...', 'Ex: Cash, Transfer, Card...')}
                                    value={form.nombre}
                                    onChange={e => setForm(v => ({ ...v, nombre: e.target.value }))}
                                    onKeyDown={e => e.key === 'Enter' && handleGuardar()}
                                />
                            </div>

                            {error && (
                                <div className={estilos.errorMsg}>
                                    <ion-icon name="alert-circle-outline"></ion-icon>
                                    {error}
                                </div>
                            )}
                        </div>

                        <div className={estilos.modalFooter}>
                                <button className={estilos.btnCancelar} onClick={() => setModal(false)}>{tr('Cancelar', 'Cancel')}</button>
                            <button className={estilos.btnConfirmar} onClick={handleGuardar} disabled={guardando || !form.nombre.trim()}>
                                {guardando
                                    ? <><div className={estilos.spinnerSm}></div>{tr('Guardando...', 'Saving...')}</>
                                    : <><ion-icon name="checkmark-circle-outline"></ion-icon>{editando ? tr('Guardar cambios', 'Save changes') : tr('Crear método', 'Create method')}</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {modalEliminar && (
                <div className={estilos.overlay} onClick={e => e.target === e.currentTarget && setModalEliminar(null)}>
                    <div className={`${estilos.modal} ${estilos[tema]}`}>
                        <div className={estilos.modalIconoEliminar}>
                            <ion-icon name="trash-outline"></ion-icon>
                        </div>
                        <h3 className={estilos.modalTituloCenter}>{tr('Eliminar método', 'Delete method')}</h3>
                        <p className={estilos.modalTexto}>
                            {language === 'en' ? <>Delete <strong>"{modalEliminar.nombre}"</strong>? This action cannot be undone.</> : <>¿Eliminar <strong>"{modalEliminar.nombre}"</strong>? Esta acción no se puede deshacer.</>}
                        </p>
                        {errorEliminar && (
                            <div className={`${estilos.errorMsg} ${estilos.errorCenter}`}>
                                <ion-icon name="alert-circle-outline"></ion-icon>
                                {errorEliminar}
                            </div>
                        )}
                        <div className={estilos.modalFooter}>
                            <button className={estilos.btnCancelar} onClick={() => setModalEliminar(null)}>{tr('Cancelar', 'Cancel')}</button>
                            <button className={estilos.btnConfirmarEliminar} onClick={handleEliminar} disabled={eliminando}>
                                {eliminando
                                    ? <><div className={estilos.spinnerSm}></div>{tr('Eliminando...', 'Deleting...')}</>
                                    : <><ion-icon name="trash-outline"></ion-icon>{tr('Eliminar', 'Delete')}</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}