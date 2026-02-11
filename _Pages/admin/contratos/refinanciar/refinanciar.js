"use client"
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
    obtenerDatosRefinanciacion,
    refinanciarContrato
} from './servidor'
import { calcularAmortizacionFrancesa, tasaAnualAMensual } from '../../core/finance/calculos'
import estilos from './refinanciar.module.css'

export default function RefinanciarContrato() {
    const router = useRouter()
    const params = useParams()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
    const [contrato, setContrato] = useState(null)
    const [planes, setPlanes] = useState([])
    const [formData, setFormData] = useState({
        nuevo_plan_id: '',
        nuevo_plazo_meses: 12,
        motivo: ''
    })
    const [vistaPrevia, setVistaPrevia] = useState(null)

    useEffect(() => {
        const temaLocal = localStorage.getItem('tema') || 'light'
        setTema(temaLocal)

        const manejarCambioTema = () => {
            const nuevoTema = localStorage.getItem('tema') || 'light'
            setTema(nuevoTema)
        }

        window.addEventListener('temaChange', manejarCambioTema)
        window.addEventListener('storage', manejarCambioTema)

        return () => {
            window.removeEventListener('temaChange', manejarCambioTema)
            window.removeEventListener('storage', manejarCambioTema)
        }
    }, [])

    useEffect(() => {
        if (params.id) {
            cargarDatos()
        }
    }, [params.id])

    useEffect(() => {
        calcularVistaPrevia()
    }, [formData.nuevo_plan_id, formData.nuevo_plazo_meses, contrato])

    const cargarDatos = async () => {
        setCargando(true)
        try {
            const resultado = await obtenerDatosRefinanciacion(parseInt(params.id))

            if (resultado.success) {
                setContrato(resultado.contrato)
                setPlanes(resultado.planes)
                
                // Establecer valores por defecto
                if (resultado.planes.length > 0) {
                    setFormData(prev => ({
                        ...prev,
                        nuevo_plan_id: resultado.planes[0].id.toString()
                    }))
                }
            } else {
                alert(resultado.mensaje || 'Error al cargar datos')
                router.push(`/admin/contratos/ver/${params.id}`)
            }
        } catch (error) {
            console.error('Error al cargar datos:', error)
            alert('Error al cargar datos')
            router.push(`/admin/contratos/ver/${params.id}`)
        } finally {
            setCargando(false)
        }
    }

    const calcularVistaPrevia = () => {
        if (!contrato || !formData.nuevo_plan_id || !formData.nuevo_plazo_meses) {
            setVistaPrevia(null)
            return
        }

        const planSeleccionado = planes.find(p => p.id === parseInt(formData.nuevo_plan_id))
        if (!planSeleccionado) {
            setVistaPrevia(null)
            return
        }

        const tasaMensual = tasaAnualAMensual(planSeleccionado.tasa_interes_anual)
        const amortizacion = calcularAmortizacionFrancesa(
            contrato.saldo_pendiente_real,
            tasaMensual,
            formData.nuevo_plazo_meses
        )

        setVistaPrevia({
            plan: planSeleccionado,
            amortizacion,
            saldo_actual: contrato.saldo_pendiente_real,
            capital_pendiente: contrato.capital_pendiente,
            mora_pendiente: contrato.mora_pendiente
        })
    }

    const manejarCambio = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: name === 'nuevo_plazo_meses' ? parseInt(value) : value
        }))
    }

    const manejarSubmit = async (e) => {
        e.preventDefault()

        if (!formData.motivo.trim()) {
            alert('Debe ingresar un motivo para la refinanciación')
            return
        }

        if (!confirm('¿Está seguro de que desea refinanciar este contrato? Esta acción no se puede deshacer.')) {
            return
        }

        setProcesando(true)
        try {
            const resultado = await refinanciarContrato({
                contrato_id: parseInt(params.id),
                nuevo_plan_id: parseInt(formData.nuevo_plan_id),
                nuevo_plazo_meses: formData.nuevo_plazo_meses,
                motivo: formData.motivo.trim()
            })

            if (resultado.success) {
                alert(`Contrato refinanciado exitosamente. Nuevo contrato: ${resultado.numero_contrato}`)
                router.push(`/admin/contratos/ver/${resultado.nuevo_contrato_id}`)
            } else {
                alert(resultado.mensaje || 'Error al refinanciar contrato')
            }
        } catch (error) {
            console.error('Error al refinanciar:', error)
            alert('Error al refinanciar contrato')
        } finally {
            setProcesando(false)
        }
    }

    const formatearMonedaLocal = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 2
        }).format(monto || 0)
    }

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando datos...</span>
                </div>
            </div>
        )
    }

    if (!contrato) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.error}>
                    <ion-icon name="alert-circle-outline"></ion-icon>
                    <p>No se pudo cargar la información del contrato</p>
                    <Link href={`/admin/contratos/ver/${params.id}`} className={estilos.btnVolver}>
                        Volver al contrato
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Refinanciar Contrato</h1>
                    <p className={estilos.subtitulo}>
                        Contrato: {contrato.numero_contrato} - Cliente: {contrato.cliente_nombre}
                    </p>
                </div>
                <Link href={`/admin/contratos/ver/${params.id}`} className={estilos.btnVolver}>
                    <ion-icon name="arrow-back-outline"></ion-icon>
                    Volver
                </Link>
            </div>

            {/* Información del contrato actual */}
            <div className={estilos.infoContrato}>
                <h2 className={estilos.subtituloSeccion}>Contrato Actual</h2>
                <div className={estilos.gridInfo}>
                    <div className={estilos.infoItem}>
                        <span className={estilos.infoLabel}>Plan Actual:</span>
                        <span className={estilos.infoValor}>{contrato.plan_nombre}</span>
                    </div>
                    <div className={estilos.infoItem}>
                        <span className={estilos.infoLabel}>Saldo Pendiente:</span>
                        <span className={`${estilos.infoValor} ${estilos.monto}`}>
                            {formatearMonedaLocal(contrato.saldo_pendiente_real)}
                        </span>
                    </div>
                    <div className={estilos.infoItem}>
                        <span className={estilos.infoLabel}>Capital Pendiente:</span>
                        <span className={estilos.infoValor}>
                            {formatearMonedaLocal(contrato.capital_pendiente)}
                        </span>
                    </div>
                    <div className={estilos.infoItem}>
                        <span className={estilos.infoLabel}>Mora Pendiente:</span>
                        <span className={`${estilos.infoValor} ${estilos.mora}`}>
                            {formatearMonedaLocal(contrato.mora_pendiente)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Formulario de refinanciación */}
            <form onSubmit={manejarSubmit} className={estilos.formulario}>
                <h2 className={estilos.subtituloSeccion}>Nuevas Condiciones</h2>

                <div className={estilos.formGrid}>
                    <div className={estilos.formGroup}>
                        <label>Nuevo Plan de Financiamiento *</label>
                        <select
                            name="nuevo_plan_id"
                            value={formData.nuevo_plan_id}
                            onChange={manejarCambio}
                            required
                            className={estilos.select}
                        >
                            <option value="">Seleccione un plan</option>
                            {planes.map(plan => (
                                <option key={plan.id} value={plan.id}>
                                    {plan.nombre} - {plan.plazo_meses} meses - {plan.tasa_interes_anual}% anual
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={estilos.formGroup}>
                        <label>Nuevo Plazo (meses) *</label>
                        <input
                            type="number"
                            name="nuevo_plazo_meses"
                            value={formData.nuevo_plazo_meses}
                            onChange={manejarCambio}
                            min="1"
                            max="60"
                            required
                            className={estilos.input}
                        />
                    </div>

                    <div className={`${estilos.formGroup} ${estilos.fullWidth}`}>
                        <label>Motivo de la Refinanciación *</label>
                        <textarea
                            name="motivo"
                            value={formData.motivo}
                            onChange={manejarCambio}
                            rows="4"
                            placeholder="Describa el motivo de la refinanciación..."
                            required
                            className={estilos.textarea}
                        />
                    </div>
                </div>

                {/* Vista previa */}
                {vistaPrevia && (
                    <div className={estilos.vistaPrevia}>
                        <h3 className={estilos.tituloVistaPrevia}>Vista Previa del Nuevo Contrato</h3>
                        <div className={estilos.gridVistaPrevia}>
                            <div className={estilos.vistaItem}>
                                <span className={estilos.vistaLabel}>Plan:</span>
                                <span className={estilos.vistaValor}>{vistaPrevia.plan.nombre}</span>
                            </div>
                            <div className={estilos.vistaItem}>
                                <span className={estilos.vistaLabel}>Tasa Anual:</span>
                                <span className={estilos.vistaValor}>{vistaPrevia.plan.tasa_interes_anual}%</span>
                            </div>
                            <div className={estilos.vistaItem}>
                                <span className={estilos.vistaLabel}>Plazo:</span>
                                <span className={estilos.vistaValor}>{formData.nuevo_plazo_meses} meses</span>
                            </div>
                            <div className={estilos.vistaItem}>
                                <span className={estilos.vistaLabel}>Monto a Refinanciar:</span>
                                <span className={estilos.vistaValor}>
                                    {formatearMonedaLocal(vistaPrevia.saldo_actual)}
                                </span>
                            </div>
                            <div className={estilos.vistaItem}>
                                <span className={estilos.vistaLabel}>Cuota Mensual:</span>
                                <span className={`${estilos.vistaValor} ${estilos.monto}`}>
                                    {formatearMonedaLocal(vistaPrevia.amortizacion.cuotaMensual)}
                                </span>
                            </div>
                            <div className={estilos.vistaItem}>
                                <span className={estilos.vistaLabel}>Total Intereses:</span>
                                <span className={estilos.vistaValor}>
                                    {formatearMonedaLocal(vistaPrevia.amortizacion.totalIntereses)}
                                </span>
                            </div>
                            <div className={estilos.vistaItem}>
                                <span className={estilos.vistaLabel}>Total a Pagar:</span>
                                <span className={`${estilos.vistaValor} ${estilos.monto}`}>
                                    {formatearMonedaLocal(vistaPrevia.amortizacion.totalPagar)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                <div className={estilos.acciones}>
                    <Link href={`/admin/contratos/ver/${params.id}`} className={estilos.btnCancelar}>
                        Cancelar
                    </Link>
                    <button type="submit" className={estilos.btnRefinanciar} disabled={procesando}>
                        {procesando ? 'Procesando...' : 'Refinanciar Contrato'}
                    </button>
                </div>
            </form>
        </div>
    )
}

