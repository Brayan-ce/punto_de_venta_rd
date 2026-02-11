'use client'

import { useState, useEffect } from 'react'
import {
    Search,
    Database,
    User,
    Building,
    Eye,
    X,
    Calendar,
    ArrowRight
} from 'lucide-react'
import { obtenerRegistrosAuditoria } from '@/_Pages/superadmin/depuracion/auditoria/servidor'
import s from './auditoria.module.css'

export default function Auditoria({ registrosIniciales = [] }) {
    const [registros, setRegistros] = useState(registrosIniciales)
    const [filtros, setFiltros] = useState({
        modulo: 'todos',
        accion: 'todas',
        empresa: '',
        usuario: '',
        fechaDesde: '',
        fechaHasta: ''
    })
    const [cargando, setCargando] = useState(false)
    const [registroSeleccionado, setRegistroSeleccionado] = useState(null)
    const [tema, setTema] = useState('light')

    useEffect(() => {
        const checkTheme = () => {
            const isDark = document.body.classList.contains('dark-mode') ||
                document.documentElement.classList.contains('dark')
            setTema(isDark ? 'dark' : 'light')
        }
        checkTheme()
        const observer = new MutationObserver(checkTheme)
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })
        return () => observer.disconnect()
    }, [])

    const modulos = ['clientes', 'cajas', 'suscripciones', 'alertas', 'ventas', 'seguridad']

    const handleBuscar = async (e) => {
        if (e) e.preventDefault()
        setCargando(true)

        try {
            const params = {
                modulo: filtros.modulo,
                accion: filtros.accion,
                fechaDesde: filtros.fechaDesde || null,
                fechaHasta: filtros.fechaHasta || null
            }

            const res = await obtenerRegistrosAuditoria(params)

            if (res.success) {
                let resultadoFinal = res.registros

                if (filtros.empresa) {
                    const term = filtros.empresa.toLowerCase()
                    resultadoFinal = resultadoFinal.filter(r =>
                        (r.nombre_empresa || '').toLowerCase().includes(term) ||
                        String(r.empresa_id).includes(term)
                    )
                }

                if (filtros.usuario) {
                    const term = filtros.usuario.toLowerCase()
                    resultadoFinal = resultadoFinal.filter(r =>
                        (r.usuario_nombre || '').toLowerCase().includes(term) ||
                        String(r.usuario_id).includes(term)
                    )
                }

                setRegistros(resultadoFinal)
            }
        } catch (error) {
            console.error(error)
            alert('Error al buscar registros')
        } finally {
            setCargando(false)
        }
    }

    return (
        <div className={`${s.contenedor} ${s[tema]}`}>
            <div className={s.header}>
                <h1 className={s.titulo}><Database size={32} className="text-blue-600" /> Auditoría del Sistema</h1>
                <p className={s.subtitulo}>Registro histórico de cambios y acciones críticas</p>
            </div>

            {/* Filtros */}
            <div className={`${s.filtrosBar} ${s[tema]}`}>
                <form onSubmit={handleBuscar} className="space-y-4">
                    <div className={s.gridFiltros}>
                        <div className={s.inputGrupo}>
                            <label className={s.label}>Módulo</label>
                            <select value={filtros.modulo} onChange={e => setFiltros({ ...filtros, modulo: e.target.value })} className={s.select}>
                                <option value="todos">Todos</option>
                                {modulos.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                            </select>
                        </div>
                        <div className={s.inputGrupo}>
                            <label className={s.label}>Desde</label>
                            <input type="date" value={filtros.fechaDesde} onChange={e => setFiltros({ ...filtros, fechaDesde: e.target.value })} className={s.input} />
                        </div>
                        <div className={s.inputGrupo}>
                            <label className={s.label}>Hasta</label>
                            <input type="date" value={filtros.fechaHasta} onChange={e => setFiltros({ ...filtros, fechaHasta: e.target.value })} className={s.input} />
                        </div>
                        <button type="submit" disabled={cargando} className={s.btnBuscar}>
                            {cargando ? '...' : <><Search size={18} /> Buscar</>}
                        </button>
                    </div>
                    <div className={`${s.extraFiltros} ${s[tema]}`}>
                        <input type="text" placeholder="Empresa (Nombre o ID)" value={filtros.empresa} onChange={e => setFiltros({ ...filtros, empresa: e.target.value })} className={s.input} />
                        <input type="text" placeholder="Usuario (Nombre o ID)" value={filtros.usuario} onChange={e => setFiltros({ ...filtros, usuario: e.target.value })} className={s.input} />
                    </div>
                </form>
            </div>

            {/* Tabla */}
            <div className={`${s.tablaContenedor} ${s[tema]}`}>
                <div className={s.tablaScroll}>
                    <table className={s.tabla}>
                        <thead>
                            <tr>
                                <th>Fecha/Hora</th>
                                <th>Módulo</th>
                                <th>Acción</th>
                                <th>Entidad / Usuario</th>
                                <th>Descripción</th>
                                <th style={{ textAlign: 'right' }}>Ver</th>
                            </tr>
                        </thead>
                        <tbody>
                            {registros.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No se encontraron registros.</td></tr>
                            ) : (
                                registros.map(reg => (
                                    <tr key={reg.id} className={s.fila} onClick={() => setRegistroSeleccionado(reg)}>
                                        <td>{new Date(reg.fecha_accion).toLocaleString('es-DO')}</td>
                                        <td>
                                            <span className={`${s.badgeModulo} ${s[reg.modulo] || s.default}`}>{reg.modulo}</span>
                                        </td>
                                        <td><strong>{reg.accion.replace(/_/g, ' ')}</strong></td>
                                        <td>
                                            <div className={s.infoEntidad}>
                                                <span className={s.entidadNombre}><Building size={12} /> {reg.nombre_empresa || 'N/A'}</span>
                                                <span className={s.actorName}><User size={12} /> {reg.usuario_nombre}</span>
                                            </div>
                                        </td>
                                        <td><div className={s.descripcion}>{reg.descripcion}</div></td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button className={s.btnVer}><Eye size={18} /></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {registroSeleccionado && (
                <div className={s.modalOverlay}>
                    <div className={`${s.modal} ${s[tema]}`}>
                        <div className={s.modalHeader}>
                            <h3 className={s.modalTitle}>Detalle Auditoría #{registroSeleccionado.id}</h3>
                            <button onClick={() => setRegistroSeleccionado(null)} className={s.btnVer}><X size={24} /></button>
                        </div>
                        <div className={s.modalBody}>
                            <div className={s.detalleGrid}>
                                <div className={s.detalleItem}>
                                    <span className={s.detLabel}>Fecha</span>
                                    <span className={s.detVal}>{new Date(registroSeleccionado.fecha_accion).toLocaleString()}</span>
                                </div>
                                <div className={s.detalleItem}>
                                    <span className={s.detLabel}>Tipo</span>
                                    <span className={s.detVal} style={{ textTransform: 'capitalize' }}>{registroSeleccionado.tipo_accion}</span>
                                </div>
                                <div className={s.detalleItem}>
                                    <span className={s.detLabel}>Módulo</span>
                                    <span className={s.detVal} style={{ textTransform: 'capitalize' }}>{registroSeleccionado.modulo}</span>
                                </div>
                                <div className={s.detalleItem}>
                                    <span className={s.detLabel}>Acción</span>
                                    <span className={s.detVal}>{registroSeleccionado.accion}</span>
                                </div>
                            </div>

                            <div className={s.resumenBox}>{registroSeleccionado.descripcion}</div>

                            <div className={s.gridFiltros} style={{ gridTemplateColumns: '1fr 1fr' }}>
                                <div className={s.detalleItem}>
                                    <span className={s.detLabel}>Actor (Usuario)</span>
                                    <div className="flex gap-2"><User size={16} className="text-gray-400" /> <div>{registroSeleccionado.usuario_nombre}<br /><small className="text-gray-500">ID: {registroSeleccionado.usuario_id}</small></div></div>
                                </div>
                                <div className={s.detalleItem}>
                                    <span className={s.detLabel}>Empresa</span>
                                    <div className="flex gap-2"><Building size={16} className="text-gray-400" /> <div>{registroSeleccionado.nombre_empresa || 'N/A'}<br /><small className="text-gray-500">ID: {registroSeleccionado.empresa_id || 'N/A'}</small></div></div>
                                </div>
                            </div>

                            <div className={s.jsonGrid}>
                                <div className={s.jsonBox}>
                                    <div className={s.jsonTitle}>Anterior</div>
                                    <div className={s.jsonValue}>{JSON.stringify(registroSeleccionado.datos_anteriores, null, 2) || 'null'}</div>
                                </div>
                                <div className={s.jsonBox}>
                                    <div className={s.jsonTitle}>Nuevo</div>
                                    <div className={s.jsonValue + ' ' + s.nuevo}>{JSON.stringify(registroSeleccionado.datos_nuevos, null, 2) || 'null'}</div>
                                </div>
                            </div>
                        </div>
                        <div className={s.modalFooter}>
                            <button onClick={() => setRegistroSeleccionado(null)} className={s.btnCerrar}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
