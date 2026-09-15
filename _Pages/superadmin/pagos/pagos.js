"use client"

import { useEffect, useState } from 'react'
import {
    crearPagoPendiente,
    confirmarPagoPlataforma,
    obtenerClientesAdministradoresPago,
    obtenerPagosPlataforma,
    rechazarPagoPlataforma,
    regenerarFacturaPlataforma,
    reenviarFacturaPorCorreo
} from './servidor'
import estilos from './pagos.module.css'

const crearFormularioInicial = () => ({
    empresa_id: '',
    administrador_id: '',
    cliente_nombre: '',
    cliente_email: '',
    cliente_telefono: '',
    negocio_nombre: '',
    concepto: 'Suscripción IsiWeek',
    descripcion: '',
    moneda: 'DOP',
    monto: '',
    descuento: '0',
    impuestos: '0',
    metodo_pago: 'transferencia',
    referencia: '',
    fecha_pago: new Date().toISOString().slice(0, 16)
})

export default function PagosPlataformaSuperAdmin() {
    const [tema, setTema] = useState('light')
    const [pagos, setPagos] = useState([])
    const [empresas, setEmpresas] = useState([])
    const [administradores, setAdministradores] = useState([])
    const [paginaClientes, setPaginaClientes] = useState(1)
    const [filtros, setFiltros] = useState({ estado: 'pending', buscar: '', metodo: '', desde: '', hasta: '' })
    const [seleccionado, setSeleccionado] = useState(null)
    const [mostrarNuevo, setMostrarNuevo] = useState(false)
    const [formulario, setFormulario] = useState(crearFormularioInicial)
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
    const [mensaje, setMensaje] = useState('')

    useEffect(() => {
        const actualizarTema = () => setTema(localStorage.getItem('tema') || 'light')
        actualizarTema()
        window.addEventListener('temaChange', actualizarTema)
        return () => window.removeEventListener('temaChange', actualizarTema)
    }, [])

    useEffect(() => {
        cargarPagos()
    }, [filtros.estado, filtros.metodo, filtros.desde, filtros.hasta])

    useEffect(() => {
        cargarClientesAdministradores()
    }, [])

    async function cargarPagos() {
        setCargando(true)
        const resultado = await obtenerPagosPlataforma(filtros)
        setPagos(resultado.pagos || [])
        setCargando(false)
    }

    async function cargarClientesAdministradores() {
        const resultado = await obtenerClientesAdministradoresPago()
        if (resultado.success) {
            setEmpresas(resultado.empresas)
            setAdministradores(resultado.administradores)
            setPaginaClientes(1)
        } else {
            setMensaje(resultado.mensaje || 'No se pudieron cargar los clientes administradores')
        }
    }

    function seleccionarEmpresa(empresaId) {
        const empresa = empresas.find(item => String(item.id) === empresaId)
        setFormulario(previo => ({
            ...previo,
            empresa_id: empresaId,
            administrador_id: '',
            negocio_nombre: empresa?.nombre_empresa || '',
            cliente_nombre: '',
            cliente_email: '',
            cliente_telefono: ''
        }))
    }

    function seleccionarAdministrador(administradorId) {
        const administrador = administradores.find(item => String(item.id) === administradorId)
        if (!administrador) return
        setFormulario(previo => ({
            ...previo,
            empresa_id: String(administrador.empresa_id),
            administrador_id: administradorId,
            negocio_nombre: administrador.nombre_empresa,
            cliente_nombre: administrador.nombre,
            cliente_email: administrador.email || '',
            cliente_telefono: administrador.telefono || ''
        }))
    }

    function registrarPagoAdministrador(administrador) {
        setFormulario({
            ...crearFormularioInicial(),
            empresa_id: String(administrador.empresa_id),
            administrador_id: String(administrador.id),
            cliente_nombre: administrador.nombre,
            cliente_email: administrador.email || '',
            cliente_telefono: administrador.telefono || '',
            negocio_nombre: administrador.nombre_empresa
        })
        setMostrarNuevo(true)
    }

    const administradoresEmpresa = administradores.filter(item => String(item.empresa_id) === String(formulario.empresa_id))
    const clientesPorPagina = 9
    const totalPaginasClientes = Math.max(1, Math.ceil(administradores.length / clientesPorPagina))
    const clientesPagina = administradores.slice((paginaClientes - 1) * clientesPorPagina, paginaClientes * clientesPorPagina)
    const moneda = pago => new Intl.NumberFormat('es-DO', { style: 'currency', currency: pago.moneda || 'DOP' }).format(Number(pago.monto || 0))
    const estado = valor => ({ pending: 'Pendiente', confirmed: 'Confirmado', rejected: 'Rechazado' }[valor] || valor)

    async function crear(evento) {
        evento.preventDefault()
        setProcesando(true)
        const resultado = await crearPagoPendiente({ ...formulario, fecha_pago: formulario.fecha_pago.replace('T', ' ') })
        setProcesando(false)
        setMensaje(resultado.mensaje)
        if (resultado.success) {
            setMostrarNuevo(false)
            setFormulario(crearFormularioInicial())
            await cargarPagos()
        }
    }

    async function confirmar() {
        if (!seleccionado || !confirm('¿Confirmar este pago? Se registrará el administrador, se generará un PDF único y se intentará enviar por correo.')) return
        setProcesando(true)
        const resultado = await confirmarPagoPlataforma(seleccionado.id)
        setProcesando(false)
        setMensaje(resultado.mensaje)
        await cargarPagos()
        setSeleccionado(null)
    }

    async function rechazar() {
        const motivo = prompt('Motivo del rechazo')
        if (!motivo || !seleccionado) return
        setProcesando(true)
        const resultado = await rechazarPagoPlataforma(seleccionado.id, motivo)
        setProcesando(false)
        setMensaje(resultado.mensaje)
        await cargarPagos()
        setSeleccionado(null)
    }

    async function reprocesar(accion) {
        if (!seleccionado) return
        setProcesando(true)
        const resultado = accion === 'pdf'
            ? await regenerarFacturaPlataforma(seleccionado.id)
            : await reenviarFacturaPorCorreo(seleccionado.id)
        setProcesando(false)
        setMensaje(resultado.mensaje || (resultado.success ? 'Proceso completado' : 'No se pudo completar el proceso'))
        await cargarPagos()
    }

    return (
        <main className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.encabezado}>
                <div>
                    <span className={estilos.eyebrow}>Control de plataforma</span>
                    <h1>Confirmación de pagos</h1>
                    <p>Registra lo recibido de cada administrador y envía su factura al confirmar el pago.</p>
                </div>
                <div className={estilos.accionesModal}>
                    <button className={estilos.primario} onClick={() => setMostrarNuevo(true)}>
                        <ion-icon name="add-outline"></ion-icon> Registrar pago pendiente
                    </button>
                </div>
            </div>

            {mensaje && <div className={estilos.mensaje}>{mensaje}<button onClick={() => setMensaje('')} aria-label="Cerrar">×</button></div>}

            <section className={estilos.clientes}>
                <div className={estilos.tituloSeccion}><div><span className={estilos.eyebrow}>Tus clientes</span><h2>Administradores registrados</h2></div><strong>{administradores.length} activos</strong></div>
                {administradores.length === 0 ? <p className={estilos.vacio}>Cargando administradores...</p> : <><div className={estilos.listaClientes}>{clientesPagina.map(administrador => <article className={estilos.cliente} key={administrador.id}><div className={estilos.avatar}>{administrador.nombre?.slice(0, 1).toUpperCase()}</div><div><strong>{administrador.nombre}</strong><small>{administrador.nombre_empresa}</small><small>{administrador.email}</small>{administrador.ultima_factura ? <div className={estilos.facturaCliente}><span>Factura {administrador.ultima_factura}</span><small className={administrador.ultimo_correo_estado === 'sent' ? estilos.correoEnviado : estilos.correoPendiente}>Correo: {administrador.ultimo_correo_estado === 'sent' ? 'enviado' : administrador.ultimo_correo_estado || 'pendiente'}</small><a href={`/api/superadmin/pagos/${administrador.ultimo_pago_id}/factura`} target="_blank">Ver PDF</a></div> : <small className={estilos.sinFactura}>Sin factura enviada</small>}</div><button className={estilos.confirmar} onClick={() => registrarPagoAdministrador(administrador)}><ion-icon name="cash-outline"></ion-icon> Registrar pago</button></article>)}</div><nav className={estilos.paginacion} aria-label="Paginación de administradores"><button className={estilos.secundario} disabled={paginaClientes === 1} onClick={() => setPaginaClientes(pagina => pagina - 1)} aria-label="Página anterior"><ion-icon name="chevron-back-outline"></ion-icon></button><span>Página {paginaClientes} de {totalPaginasClientes}</span><button className={estilos.secundario} disabled={paginaClientes === totalPaginasClientes} onClick={() => setPaginaClientes(pagina => pagina + 1)} aria-label="Página siguiente"><ion-icon name="chevron-forward-outline"></ion-icon></button></nav></>}
            </section>

            <div className={estilos.tituloSeccion}><div><span className={estilos.eyebrow}>Historial</span><h2>Pagos registrados</h2></div></div>

            <section className={estilos.filtros}>
                <input value={filtros.buscar} onChange={evento => setFiltros({ ...filtros, buscar: evento.target.value })} onKeyDown={evento => evento.key === 'Enter' && cargarPagos()} placeholder="Buscar cliente, negocio, referencia o ID" />
                <select value={filtros.estado} onChange={evento => setFiltros({ ...filtros, estado: evento.target.value })}><option value="pending">Pendientes</option><option value="confirmed">Confirmados</option><option value="rejected">Rechazados</option><option value="todos">Todos</option></select>
                <select value={filtros.metodo} onChange={evento => setFiltros({ ...filtros, metodo: evento.target.value })}><option value="">Todos los métodos</option><option value="transferencia">Transferencia</option><option value="tarjeta">Tarjeta</option><option value="efectivo">Efectivo</option><option value="cheque">Cheque</option></select>
                <input type="date" value={filtros.desde} onChange={evento => setFiltros({ ...filtros, desde: evento.target.value })} />
                <input type="date" value={filtros.hasta} onChange={evento => setFiltros({ ...filtros, hasta: evento.target.value })} />
                <button onClick={cargarPagos} className={estilos.secundario} aria-label="Buscar pagos"><ion-icon name="search-outline"></ion-icon></button>
            </section>

            <section className={estilos.tablaWrap}>
                {cargando ? <p className={estilos.vacio}>Cargando pagos...</p> : pagos.length === 0 ? <p className={estilos.vacio}>No hay pagos para los filtros seleccionados.</p> : <table><thead><tr><th>Pago</th><th>Cliente / negocio</th><th>Concepto</th><th>Monto</th><th>Método</th><th>Fecha</th><th>Estado</th><th>Factura / correo</th><th></th></tr></thead><tbody>{pagos.map(pago => <tr key={pago.id}><td>ISW-PAY-{String(pago.id).padStart(6, '0')}</td><td><strong>{pago.cliente_nombre}</strong><small>{pago.negocio_nombre}</small></td><td>{pago.concepto}<small>{pago.referencia || 'Sin referencia'}</small></td><td>{moneda(pago)}</td><td>{pago.metodo_pago}</td><td>{new Date(pago.fecha_pago).toLocaleDateString('es-DO')}</td><td><span className={`${estilos.badge} ${estilos[pago.estado]}`}>{estado(pago.estado)}</span></td><td><small>{pago.numero_factura || 'Sin factura'}</small><small>PDF: {pago.invoice_status}</small><small>Correo: {pago.email_status}</small></td><td><button className={estilos.ver} onClick={() => setSeleccionado(pago)} aria-label={`Ver pago ${pago.id}`}><ion-icon name="eye-outline"></ion-icon></button></td></tr>)}</tbody></table>}
            </section>

            {seleccionado && <div className={estilos.fondoModal} onClick={() => !procesando && setSeleccionado(null)}><section className={estilos.modal} onClick={evento => evento.stopPropagation()}><button className={estilos.cerrar} onClick={() => setSeleccionado(null)}>×</button><span className={`${estilos.badge} ${estilos[seleccionado.estado]}`}>{estado(seleccionado.estado)}</span><h2>PAGO #ISW-PAY-{String(seleccionado.id).padStart(6, '0')}</h2><div className={estilos.detalle}><p><b>Cliente</b>{seleccionado.cliente_nombre}</p><p><b>Correo</b>{seleccionado.cliente_email || 'No registrado'}</p><p><b>Teléfono</b>{seleccionado.cliente_telefono || 'No registrado'}</p><p><b>Negocio</b>{seleccionado.negocio_nombre}</p><p><b>Concepto</b>{seleccionado.concepto}</p><p><b>Monto</b>{moneda(seleccionado)}</p><p><b>Método</b>{seleccionado.metodo_pago}</p><p><b>Referencia</b>{seleccionado.referencia || 'No registrada'}</p><p><b>Factura</b>{seleccionado.numero_factura || 'Pendiente'}</p><p><b>Correo</b>{seleccionado.email_status}</p><p><b>Confirmado por</b>{seleccionado.confirmado_por_nombre || 'Pendiente'}</p><p><b>Fecha confirmación</b>{seleccionado.fecha_confirmacion ? new Date(seleccionado.fecha_confirmacion).toLocaleString('es-DO') : 'Pendiente'}</p>{seleccionado.motivo_rechazo && <p><b>Motivo de rechazo</b>{seleccionado.motivo_rechazo}</p>}</div><div className={estilos.accionesModal}>{seleccionado.estado === 'pending' && <><button disabled={procesando} className={estilos.rechazar} onClick={rechazar}>Rechazar pago</button><button disabled={procesando} className={estilos.confirmar} onClick={confirmar}>Confirmar pago</button></>}{seleccionado.estado === 'confirmed' && <><a className={estilos.secundario} href={`/api/superadmin/pagos/${seleccionado.id}/factura`} target="_blank">Ver factura</a><button disabled={procesando} className={estilos.secundario} onClick={() => reprocesar('pdf')}>Generar factura nuevamente</button><button disabled={procesando} className={estilos.confirmar} onClick={() => reprocesar('email')}>Reenviar por correo</button></>}</div></section></div>}

            {mostrarNuevo && <div className={estilos.fondoModal}><form className={estilos.modal} onSubmit={crear}><button type="button" className={estilos.cerrar} onClick={() => setMostrarNuevo(false)}>×</button><h2>Registrar pago pendiente</h2><p className={estilos.ayudaFormulario}>Selecciona el negocio y su administrador para completar automáticamente los datos de cobro.</p><div className={estilos.formulario}><label>Negocio registrado<select required value={formulario.empresa_id} onChange={evento => seleccionarEmpresa(evento.target.value)}><option value="">Selecciona un negocio</option>{empresas.map(empresa => <option key={empresa.id} value={empresa.id}>{empresa.nombre_empresa}</option>)}</select></label><label>Administrador del negocio<select required disabled={!formulario.empresa_id} value={formulario.administrador_id} onChange={evento => seleccionarAdministrador(evento.target.value)}><option value="">{formulario.empresa_id ? 'Selecciona un administrador' : 'Primero selecciona un negocio'}</option>{administradoresEmpresa.map(administrador => <option key={administrador.id} value={administrador.id}>{administrador.nombre} · {administrador.email}</option>)}</select></label><label>Cliente<input required value={formulario.cliente_nombre} onChange={evento => setFormulario({ ...formulario, cliente_nombre: evento.target.value })} /></label><label>Correo<input type="email" value={formulario.cliente_email} onChange={evento => setFormulario({ ...formulario, cliente_email: evento.target.value })} /></label><label>Teléfono<input value={formulario.cliente_telefono} onChange={evento => setFormulario({ ...formulario, cliente_telefono: evento.target.value })} /></label><label>Concepto<input required value={formulario.concepto} onChange={evento => setFormulario({ ...formulario, concepto: evento.target.value })} /></label><label>Referencia<input value={formulario.referencia} onChange={evento => setFormulario({ ...formulario, referencia: evento.target.value })} /></label><label>Monto<input required type="number" min="0.01" step="0.01" value={formulario.monto} onChange={evento => setFormulario({ ...formulario, monto: evento.target.value })} /></label><label>Método<select value={formulario.metodo_pago} onChange={evento => setFormulario({ ...formulario, metodo_pago: evento.target.value })}><option value="transferencia">Transferencia</option><option value="tarjeta">Tarjeta</option><option value="efectivo">Efectivo</option><option value="cheque">Cheque</option></select></label><label>Fecha de pago<input type="datetime-local" value={formulario.fecha_pago} onChange={evento => setFormulario({ ...formulario, fecha_pago: evento.target.value })} /></label><label>Descripción<textarea value={formulario.descripcion} onChange={evento => setFormulario({ ...formulario, descripcion: evento.target.value })} /></label></div><button disabled={procesando} className={estilos.confirmar} type="submit">Guardar como pendiente</button></form></div>}
        </main>
    )
}
