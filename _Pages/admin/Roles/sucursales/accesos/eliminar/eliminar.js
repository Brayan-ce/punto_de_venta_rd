"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useLanguage } from '@/_Pages/admin/i18n'
import { eliminarAccesoPorId, obtenerAcceso } from './servidor'
import estilos from './eliminar.module.css'

export default function EliminarAccesoSucursalPage() {
    const { id } = useParams()
    const router = useRouter()
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)

    const [tema, setTema] = useState('light')
    const [acceso, setAcceso] = useState(null)
    const [error, setError] = useState('')
    const [eliminando, setEliminando] = useState(false)

    useEffect(() => {
        setTema(localStorage.getItem('tema') || 'light')
        const cargar = async () => {
            const res = await obtenerAcceso(id)
            if (!res.success) {
                setError(res.mensaje || tr('No encontrado', 'Not found'))
                return
            }
            setAcceso(res.acceso)
        }
        if (id) cargar()
    }, [id])

    const eliminar = async () => {
        if (!acceso?.id) return
        setEliminando(true)
        const res = await eliminarAccesoPorId(acceso.id)
        if (!res.success) {
            setError(res.mensaje || tr('No se pudo eliminar', 'Could not delete'))
            setEliminando(false)
            return
        }
        router.push('/sucursales/accesos')
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            {error && <div className={estilos.error}>{error}</div>}
            {acceso && (
                <div className={estilos.card}>
                    <h1>{tr('Eliminar Acceso', 'Delete Access')}</h1>
                    <p>{tr('Vas a eliminar el acceso de', 'You are deleting access for')} <strong>{acceso.usuario_nombre}</strong> {tr('en', 'in')} <strong>{acceso.sucursal_nombre}</strong>.</p>
                    <div className={estilos.acciones}>
                        <Link href="/sucursales/accesos" className={estilos.btnSecundario}>{tr('Cancelar', 'Cancel')}</Link>
                        <button type="button" className={estilos.btn} onClick={eliminar} disabled={eliminando}>
                            {eliminando ? tr('Eliminando...', 'Deleting...') : tr('Confirmar Eliminación', 'Confirm Delete')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
