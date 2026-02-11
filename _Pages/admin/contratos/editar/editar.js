"use client"
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { obtenerContratoPorId, actualizarContratoFinanciamiento, obtenerPlanesActivos } from './servidor'
import { ESTADOS_CONTRATO } from '../../core/finance/estados'
import { calcularAmortizacionFrancesa, tasaAnualAMensual } from '../../core/finance/calculos'
import estilos from './editar.module.css'

export default function EditarContrato() {
    const router = useRouter()
    const params = useParams()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
    const [contrato, setContrato] = useState(null)
    const [planes, setPlanes] = useState([])
    const [planSeleccionado, setPlanSeleccionado] = useState(null)
    const [mostrarFiador, setMostrarFiador] = useState(false)
    const [formData, setFormData] = useState({
        plan_id: '',
        notas: '',
        notas_internas: '',
        estado: '',
        razon_estado: '',
        nombre_fiador: '',
        documento_fiador: '',
        telefono_fiador: ''
    })
    const [vistaPreviaPlan, setVistaPreviaPlan] = useState(null)

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
        // Calcular vista previa cuando cambia el plan seleccionado
        if (planSeleccionado && contrato) {
            calcularVistaPrevia()
        }
    }, [planSeleccionado, contrato])

    const cargarDatos = async () => {
        setCargando(true)
        try {
            // Cargar planes activos
            const resultadoPlanes = await obtenerPlanesActivos()
            if (resultadoPlanes.success) {
                setPlanes(resultadoPlanes.planes || [])
            }

            // Cargar contrato
            const resultado = await obtenerContratoPorId(params.id)
            if (resultado.success) {
                setContrato(resultado.contrato)
                
                // Encontrar el plan actual
                const planActual = resultadoPlanes.planes?.find(p => p.id === resultado.contrato.plan_id)
                if (planActual) {
                    setPlanSeleccionado(planActual)
                }

                // Determinar si mostrar campos de fiador
                const tieneFiador = resultado.contrato.nombre_fiador || 
                                   resultado.contrato.documento_fiador || 
                                   resultado.contrato.telefono_fiador
                setMostrarFiador(tieneFiador || (planActual?.requiere_fiador === 1))

                setFormData({
                    plan_id: resultado.contrato.plan_id || '',
                    notas: resultado.contrato.notas || '',
                    notas_internas: resultado.contrato.notas_internas || '',
                    estado: resultado.contrato.estado || '',
                    razon_estado: resultado.contrato.razon_estado || '',
                    nombre_fiador: resultado.contrato.nombre_fiador || '',
                    documento_fiador: resultado.contrato.documento_fiador || '',
                    telefono_fiador: resultado.contrato.telefono_fiador || ''
                })
            } else {
                alert(resultado.mensaje || 'No se pudo cargar el contrato')
                router.push('/admin/contratos')
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Error al cargar datos')
            router.push('/admin/contratos')
        } finally {
            setCargando(false)
        }
    }

    const calcularVistaPrevia = () => {
        if (!planSeleccionado || !contrato) return

        const montoFinanciado = parseFloat(contrato.monto_financiado || 0)
        const numeroCuotas = planSeleccionado.plazo_meses
        const tasaMensual = tasaAnualAMensual(planSeleccionado.tasa_interes_anual)
        
        const amortizacion = calcularAmortizacionFrancesa(montoFinanciado, tasaMensual, numeroCuotas)

        setVistaPreviaPlan({
            numero_cuotas: numeroCuotas,
            tasa_interes_anual: planSeleccionado.tasa_interes_anual,
            tasa_interes_mensual: tasaMensual * 100,
            cuota_mensual: amortizacion.cuotaMensual,
            total_intereses: amortizacion.totalIntereses,
            total_a_pagar: amortizacion.totalPagar,
            requiere_fiador: planSeleccionado.requiere_fiador === 1 || planSeleccionado.requiere_fiador === true
        })
    }

    const manejarCambio = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))

        // Si cambia el plan, actualizar plan seleccionado
        if (name === 'plan_id') {
            const plan = planes.find(p => p.id === parseInt(value))
            setPlanSeleccionado(plan || null)
        }
    }

    const seleccionarPlan = (plan) => {
        setPlanSeleccionado(plan)
        setFormData(prev => ({
            ...prev,
            plan_id: plan.id.toString()
        }))
        
        // Si el plan requiere fiador, mostrar campos
        if (plan.requiere_fiador === 1 || plan.requiere_fiador === true) {
            setMostrarFiador(true)
        }
    }

    const guardarCambios = async () => {
        if (!contrato) return

        // Validar que no se esté editando un contrato pagado o cancelado
        if (contrato.estado === ESTADOS_CONTRATO.PAGADO || contrato.estado === ESTADOS_CONTRATO.CANCELADO) {
            alert('No se puede editar un contrato pagado o cancelado')
            return
        }

        // Validar fiador si el plan lo requiere
        if (planSeleccionado && (planSeleccionado.requiere_fiador === 1 || planSeleccionado.requiere_fiador === true)) {
            if (!formData.nombre_fiador || !formData.documento_fiador) {
                alert('Este plan requiere un fiador. Complete los datos del fiador.')
                return
            }
        }

        // Validar razón de cambio de estado
        if (formData.estado && formData.estado !== contrato.estado && !formData.razon_estado) {
            alert('Debe proporcionar una razón para el cambio de estado')
            return
        }

        setProcesando(true)
        try {
            const datosActualizacion = {}
            
            // Cambio de plan
            if (formData.plan_id && parseInt(formData.plan_id) !== contrato.plan_id) {
                datosActualizacion.plan_id = parseInt(formData.plan_id)
            }

            // Notas
            if (formData.notas !== contrato.notas) {
                datosActualizacion.notas = formData.notas
            }
            if (formData.notas_internas !== (contrato.notas_internas || '')) {
                datosActualizacion.notas_internas = formData.notas_internas
            }

            // Fiador
            if (formData.nombre_fiador !== (contrato.nombre_fiador || '')) {
                datosActualizacion.nombre_fiador = formData.nombre_fiador || null
            }
            if (formData.documento_fiador !== (contrato.documento_fiador || '')) {
                datosActualizacion.documento_fiador = formData.documento_fiador || null
            }
            if (formData.telefono_fiador !== (contrato.telefono_fiador || '')) {
                datosActualizacion.telefono_fiador = formData.telefono_fiador || null
            }

            // Estado
            if (formData.estado && formData.estado !== contrato.estado) {
                datosActualizacion.estado = formData.estado
                if (formData.razon_estado) {
                    datosActualizacion.razon_estado = formData.razon_estado
                }
            }

            if (Object.keys(datosActualizacion).length === 0) {
                alert('No hay cambios para guardar')
                setProcesando(false)
                return
            }

            const resultado = await actualizarContratoFinanciamiento(params.id, datosActualizacion)

            if (resultado.success) {
                alert(resultado.mensaje || 'Contrato actualizado exitosamente')
                router.push(`/admin/contratos/ver/${params.id}`)
            } else {
                alert(resultado.mensaje || 'Error al actualizar contrato')
            }
        } catch (error) {
            console.error('Error al actualizar contrato:', error)
            alert('Error al actualizar contrato')
        } finally {
            setProcesando(false)
        }
    }

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 2
        }).format(monto || 0)
    }

    const formatearFecha = (fecha) => {
        if (!fecha) return 'N/A'
        return new Date(fecha).toLocaleDateString('es-DO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })
    }

    const obtenerColorEstado = (estado) => {
        const colores = {
            activo: 'success',
            pagado: 'info',
            incumplido: 'danger',
            reestructurado: 'warning',
            cancelado: 'secondary'
        }
        return colores[estado] || 'secondary'
    }

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <div className={estilos.spinner}></div>
                    <span>Cargando contrato...</span>
                </div>
            </div>
        )
    }

    if (!contrato) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.error}>
                    <ion-icon name="alert-circle-outline"></ion-icon>
                    <span>Contrato no encontrado</span>
                    <Link href="/admin/contratos" className={estilos.btnVolver}>
                        Volver a contratos
                    </Link>
                </div>
            </div>
        )
    }

    const puedeEditar = contrato.estado !== ESTADOS_CONTRATO.PAGADO && contrato.estado !== ESTADOS_CONTRATO.CANCELADO
    const planActual = planes.find(p => p.id === contrato.plan_id)

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            {/* Breadcrumb */}
            <nav className={estilos.breadcrumb}>
                <Link href="/admin">Administración</Link>
                <span>/</span>
                <Link href="/admin/contratos">Contratos</Link>
                <span>/</span>
                <Link href={`/admin/contratos/ver/${params.id}`}>{contrato.numero_contrato}</Link>
                <span>/</span>
                <span className={estilos.breadcrumbActivo}>Editar</span>
            </nav>

            {/* Header Principal */}
            <header className={estilos.headerPrincipal}>
                <div className={estilos.headerTop}>
                    <Link href={`/admin/contratos/ver/${params.id}`} className={estilos.btnBack}>
                        <ion-icon name="arrow-back-outline"></ion-icon>
                    </Link>
                    
                    <div className={estilos.clienteInfo}>
                        <div className={estilos.clienteAvatar}>
                            {contrato.cliente_foto ? (
                                <img src={contrato.cliente_foto} alt={contrato.cliente_nombre} />
                            ) : (
                                <span>{contrato.cliente_nombre?.charAt(0) || 'C'}</span>
                            )}
                        </div>
                        <div className={estilos.clienteDatos}>
                            <h1 className={estilos.clienteNombre}>
                                Editar Contrato: {contrato.numero_contrato}
                            </h1>
                            <div className={estilos.clienteBadges}>
                                <span className={`${estilos.estadoBadge} ${estilos[obtenerColorEstado(contrato.estado)]}`}>
                                    <span className={estilos.badgeDot}></span>
                                    {contrato.estado}
                                </span>
                                <span className={estilos.clienteNombreSecundario}>
                                    {contrato.cliente_nombre} {contrato.cliente_apellidos || ''}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fila de metadatos */}
                <div className={estilos.headerMetas}>
                    <div className={estilos.metaItem}>
                        <span className={estilos.metaLabel}>Monto Financiado</span>
                        <span className={estilos.metaValue}>{formatearMoneda(contrato.monto_financiado)}</span>
                    </div>
                    <div className={estilos.metaItem}>
                        <span className={estilos.metaLabel}>Saldo Pendiente</span>
                        <span className={estilos.metaValue}>{formatearMoneda(contrato.saldo_pendiente || contrato.saldo_total)}</span>
                    </div>
                    <div className={estilos.metaItem}>
                        <span className={estilos.metaLabel}>Plan Actual</span>
                        <span className={estilos.metaValue}>{planActual?.nombre || contrato.plan_nombre || 'N/A'}</span>
                    </div>
                    <div className={estilos.metaItem}>
                        <span className={estilos.metaLabel}>Fecha Contrato</span>
                        <span className={estilos.metaValue}>{formatearFecha(contrato.fecha_contrato)}</span>
                    </div>
                </div>
            </header>

            {/* Alerta si no se puede editar */}
            {!puedeEditar && (
                <div className={estilos.alerta}>
                    <ion-icon name="warning-outline"></ion-icon>
                    <div className={estilos.alertaContenido}>
                        <strong>Contrato no editable</strong>
                        <span>Este contrato está {contrato.estado} y no puede ser editado</span>
                    </div>
                </div>
            )}

            {/* Contenido Principal */}
            <div className={estilos.mainContent}>
                {/* Sección: Cambiar Plan */}
                <section className={estilos.seccion}>
                    <div className={estilos.seccionHeader}>
                        <div className={estilos.seccionTitulo}>
                            <ion-icon name="card-outline"></ion-icon>
                            <h2>Plan de Financiamiento</h2>
                        </div>
                        <span className={estilos.seccionBadge}>
                            {planActual?.nombre || 'Plan actual'}
                        </span>
                    </div>
                    <div className={estilos.seccionContenido}>
                        <div className={estilos.formGroup}>
                            <label className={estilos.label}>
                                <ion-icon name="swap-horizontal-outline"></ion-icon>
                                Seleccionar Nuevo Plan
                            </label>
                            <div className={estilos.planesGrid}>
                                {planes.map(plan => (
                                    <div 
                                        key={plan.id}
                                        className={`${estilos.planCard} ${planSeleccionado?.id === plan.id ? estilos.planActivo : ''} ${plan.id === contrato.plan_id ? estilos.planActual : ''}`}
                                        onClick={() => puedeEditar && seleccionarPlan(plan)}
                                    >
                                        <div className={estilos.planIcono}>
                                            <ion-icon name="trending-up-outline"></ion-icon>
                                        </div>
                                        <div className={estilos.planContenido}>
                                            <h4>{plan.nombre}</h4>
                                            {plan.id === contrato.plan_id && (
                                                <span className={estilos.planBadgeActual}>Plan Actual</span>
                                            )}
                                            <div className={estilos.planDetalles}>
                                                <div className={estilos.planDetalle}>
                                                    <ion-icon name="calendar-outline"></ion-icon>
                                                    <span>{plan.plazo_meses} meses</span>
                                                </div>
                                                <div className={estilos.planDetalle}>
                                                    <ion-icon name="analytics-outline"></ion-icon>
                                                    <span>{plan.tasa_interes_anual}% anual</span>
                                                </div>
                                                <div className={estilos.planDetalle}>
                                                    <ion-icon name="cash-outline"></ion-icon>
                                                    <span>{plan.pago_inicial_minimo_pct}% inicial</span>
                                                </div>
                                                {plan.requiere_fiador && (
                                                    <div className={`${estilos.planDetalle} ${estilos.requiereFiador}`}>
                                                        <ion-icon name="shield-checkmark-outline"></ion-icon>
                                                        <span>Requiere fiador</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {planSeleccionado?.id === plan.id && (
                                            <div className={estilos.planCheck}>
                                                <ion-icon name="checkmark-circle"></ion-icon>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            {planSeleccionado && planSeleccionado.id !== contrato.plan_id && vistaPreviaPlan && (
                                <div className={estilos.vistaPreviaPlan}>
                                    <h4>
                                        <ion-icon name="eye-outline"></ion-icon>
                                        Vista Previa del Nuevo Plan
                                    </h4>
                                    <div className={estilos.vistaPreviaGrid}>
                                        <div className={estilos.vistaPreviaItem}>
                                            <span className={estilos.vistaPreviaLabel}>Cuotas</span>
                                            <strong>{vistaPreviaPlan.numero_cuotas} meses</strong>
                                        </div>
                                        <div className={estilos.vistaPreviaItem}>
                                            <span className={estilos.vistaPreviaLabel}>Tasa Mensual</span>
                                            <strong>{vistaPreviaPlan.tasa_interes_mensual.toFixed(2)}%</strong>
                                        </div>
                                        <div className={estilos.vistaPreviaItem}>
                                            <span className={estilos.vistaPreviaLabel}>Cuota Mensual</span>
                                            <strong className={estilos.destacado}>{formatearMoneda(vistaPreviaPlan.cuota_mensual)}</strong>
                                        </div>
                                        <div className={estilos.vistaPreviaItem}>
                                            <span className={estilos.vistaPreviaLabel}>Total Intereses</span>
                                            <strong>{formatearMoneda(vistaPreviaPlan.total_intereses)}</strong>
                                        </div>
                                    </div>
                                    <div className={estilos.alertaCambioPlan}>
                                        <ion-icon name="information-circle-outline"></ion-icon>
                                        <span>Al cambiar el plan, se recalcularán las cuotas pendientes del contrato</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Sección: Fiador */}
                <section className={estilos.seccion}>
                    <div className={estilos.seccionHeader}>
                        <div className={estilos.seccionTitulo}>
                            <ion-icon name="shield-checkmark-outline"></ion-icon>
                            <h2>Fiador / Garante</h2>
                        </div>
                        {(planSeleccionado?.requiere_fiador || mostrarFiador) && (
                            <span className={`${estilos.seccionBadge} ${planSeleccionado?.requiere_fiador ? estilos.badgeRequerido : ''}`}>
                                {planSeleccionado?.requiere_fiador ? 'Requerido' : 'Opcional'}
                            </span>
                        )}
                    </div>
                    <div className={estilos.seccionContenido}>
                        {(planSeleccionado?.requiere_fiador || mostrarFiador) ? (
                            <>
                                {planSeleccionado?.requiere_fiador && (
                                    <div className={estilos.alertaFiador}>
                                        <ion-icon name="information-circle-outline"></ion-icon>
                                        <span>Este plan requiere un fiador o garante</span>
                                    </div>
                                )}
                                <div className={estilos.formGrid}>
                                    <div className={estilos.formGroup}>
                                        <label className={estilos.label}>
                                            <ion-icon name="person-outline"></ion-icon>
                                            Nombre Completo {planSeleccionado?.requiere_fiador ? '*' : ''}
                                        </label>
                                        <input
                                            type="text"
                                            name="nombre_fiador"
                                            value={formData.nombre_fiador}
                                            onChange={manejarCambio}
                                            placeholder="Nombre completo del fiador"
                                            disabled={!puedeEditar}
                                            className={estilos.input}
                                            required={planSeleccionado?.requiere_fiador}
                                        />
                                    </div>
                                    <div className={estilos.formGroup}>
                                        <label className={estilos.label}>
                                            <ion-icon name="card-outline"></ion-icon>
                                            Documento {planSeleccionado?.requiere_fiador ? '*' : ''}
                                        </label>
                                        <input
                                            type="text"
                                            name="documento_fiador"
                                            value={formData.documento_fiador}
                                            onChange={manejarCambio}
                                            placeholder="Cédula del fiador"
                                            disabled={!puedeEditar}
                                            className={estilos.input}
                                            required={planSeleccionado?.requiere_fiador}
                                        />
                                    </div>
                                    <div className={estilos.formGroup}>
                                        <label className={estilos.label}>
                                            <ion-icon name="call-outline"></ion-icon>
                                            Teléfono {planSeleccionado?.requiere_fiador ? '*' : ''}
                                        </label>
                                        <input
                                            type="tel"
                                            name="telefono_fiador"
                                            value={formData.telefono_fiador}
                                            onChange={manejarCambio}
                                            placeholder="Teléfono del fiador"
                                            disabled={!puedeEditar}
                                            className={estilos.input}
                                            required={planSeleccionado?.requiere_fiador}
                                        />
                                    </div>
                                </div>
                                {!planSeleccionado?.requiere_fiador && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMostrarFiador(false)
                                            setFormData(prev => ({
                                                ...prev,
                                                nombre_fiador: '',
                                                documento_fiador: '',
                                                telefono_fiador: ''
                                            }))
                                        }}
                                        className={estilos.btnQuitarFiador}
                                        disabled={!puedeEditar}
                                    >
                                        <ion-icon name="close-outline"></ion-icon>
                                        Quitar Fiador
                                    </button>
                                )}
                            </>
                        ) : (
                            <div className={estilos.noFiador}>
                                <ion-icon name="checkmark-circle-outline"></ion-icon>
                                <p>Este plan no requiere fiador</p>
                                <button
                                    type="button"
                                    onClick={() => setMostrarFiador(true)}
                                    className={estilos.btnAgregarFiador}
                                    disabled={!puedeEditar}
                                >
                                    <ion-icon name="add-outline"></ion-icon>
                                    Agregar fiador opcional
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {/* Sección: Notas Públicas */}
                <section className={estilos.seccion}>
                    <div className={estilos.seccionHeader}>
                        <div className={estilos.seccionTitulo}>
                            <ion-icon name="document-text-outline"></ion-icon>
                            <h2>Notas Públicas</h2>
                        </div>
                        <span className={estilos.seccionBadge}>Visible para el cliente</span>
                    </div>
                    <div className={estilos.seccionContenido}>
                        <div className={estilos.formGroup}>
                            <label className={estilos.label}>
                                <ion-icon name="information-circle-outline"></ion-icon>
                                Notas que el cliente puede ver
                            </label>
                            <textarea
                                name="notas"
                                value={formData.notas}
                                onChange={manejarCambio}
                                rows="6"
                                placeholder="Ingrese notas públicas que serán visibles para el cliente..."
                                disabled={!puedeEditar}
                                className={estilos.textarea}
                            />
                            <span className={estilos.helperText}>
                                Estas notas aparecerán en los documentos y comunicaciones con el cliente
                            </span>
                        </div>
                    </div>
                </section>

                {/* Sección: Notas Internas */}
                <section className={estilos.seccion}>
                    <div className={estilos.seccionHeader}>
                        <div className={estilos.seccionTitulo}>
                            <ion-icon name="lock-closed-outline"></ion-icon>
                            <h2>Notas Internas</h2>
                        </div>
                        <span className={`${estilos.seccionBadge} ${estilos.badgePrivado}`}>Solo administradores</span>
                    </div>
                    <div className={estilos.seccionContenido}>
                        <div className={estilos.formGroup}>
                            <label className={estilos.label}>
                                <ion-icon name="eye-off-outline"></ion-icon>
                                Notas privadas para uso interno
                            </label>
                            <textarea
                                name="notas_internas"
                                value={formData.notas_internas}
                                onChange={manejarCambio}
                                rows="6"
                                placeholder="Ingrese notas internas que solo los administradores pueden ver..."
                                disabled={!puedeEditar}
                                className={estilos.textarea}
                            />
                            <span className={estilos.helperText}>
                                Estas notas son privadas y no serán visibles para el cliente
                            </span>
                        </div>
                    </div>
                </section>

                {/* Sección: Cambiar Estado */}
                <section className={estilos.seccion}>
                    <div className={estilos.seccionHeader}>
                        <div className={estilos.seccionTitulo}>
                            <ion-icon name="swap-horizontal-outline"></ion-icon>
                            <h2>Cambiar Estado del Contrato</h2>
                        </div>
                        <span className={estilos.seccionBadge}>Estado actual: {contrato.estado}</span>
                    </div>
                    <div className={estilos.seccionContenido}>
                        <div className={estilos.formGrid}>
                            <div className={estilos.formGroup}>
                                <label className={estilos.label}>
                                    <ion-icon name="flag-outline"></ion-icon>
                                    Nuevo Estado
                                </label>
                                <select
                                    name="estado"
                                    value={formData.estado}
                                    onChange={manejarCambio}
                                    disabled={!puedeEditar}
                                    className={estilos.select}
                                >
                                    <option value="">Mantener estado actual ({contrato.estado})</option>
                                    <option value="activo">Activo</option>
                                    <option value="incumplido">Incumplido</option>
                                    <option value="reestructurado">Reestructurado</option>
                                    <option value="pagado">Pagado</option>
                                    <option value="cancelado">Cancelado</option>
                                </select>
                                <span className={estilos.helperText}>
                                    Seleccione un nuevo estado solo si necesita cambiarlo
                                </span>
                            </div>
                            
                            {formData.estado && formData.estado !== contrato.estado && (
                                <div className={estilos.formGroup}>
                                    <label className={estilos.label}>
                                        <ion-icon name="document-text-outline"></ion-icon>
                                        Razón del Cambio *
                                    </label>
                                    <input
                                        type="text"
                                        name="razon_estado"
                                        value={formData.razon_estado}
                                        onChange={manejarCambio}
                                        placeholder="Explique el motivo del cambio de estado..."
                                        disabled={!puedeEditar}
                                        className={estilos.input}
                                        required
                                    />
                                    <span className={estilos.helperText}>
                                        Es obligatorio explicar el motivo del cambio de estado
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Acciones */}
                <div className={estilos.acciones}>
                    <Link 
                        href={`/admin/contratos/ver/${params.id}`} 
                        className={estilos.btnCancelar}
                    >
                        <ion-icon name="close-outline"></ion-icon>
                        Cancelar
                    </Link>
                    <button
                        className={estilos.btnGuardar}
                        onClick={guardarCambios}
                        disabled={procesando || !puedeEditar}
                    >
                        {procesando ? (
                            <>
                                <div className={estilos.spinnerBtn}></div>
                                Guardando...
                            </>
                        ) : (
                            <>
                                <ion-icon name="checkmark-outline"></ion-icon>
                                Guardar Cambios
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
