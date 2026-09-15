"use client"

import { useEffect, useState } from 'react'
import { listarEntregas, buscarClientesDelivery, registrarEntrega, tomarPedidoDelivery } from './servidor'
import { useLanguage } from '@/_Pages/admin/i18n'
import estilos from './delivery.module.css'

function abrirMapa(lat, lng, app = 'google') {
    if (!lat || !lng) return
    const url = app === 'waze'
        ? `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
        : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    window.open(url, '_blank', 'noopener,noreferrer')
}

export default function Delivery() {
    const { language } = useLanguage()
    const tr = (es, en) => language === 'en' ? en : es
    const [pedidos, setPedidos] = useState([])
    const [clientes, setClientes] = useState([])
    const [busqueda, setBusqueda] = useState('')
    const [busquedaCliente, setBusquedaCliente] = useState('')
    const [estado, setEstado] = useState('todos')
    const [cargando, setCargando] = useState(true)
    const [tema, setTema] = useState('light')
    const [procesando, setProcesando] = useState(null)
    const [gpsPedido, setGpsPedido] = useState(null)

    useEffect(() => {
        setTema(localStorage.getItem('tema') || 'light')
        const onTema = () => setTema(localStorage.getItem('tema') || 'light')
        window.addEventListener('temaChange', onTema)
        return () => window.removeEventListener('temaChange', onTema)
    }, [])

    useEffect(() => {
        cargarPedidos()
    }, [estado, busqueda])

    async function cargarPedidos() {
        setCargando(true)
        const res = await listarEntregas({ estado, busqueda })
        if (res.success) setPedidos(res.pedidos)
        setCargando(false)
    }

    async function buscarClientes() {
        const res = await buscarClientesDelivery(busquedaCliente)
        if (res.success) setClientes(res.clientes)
    }

    async function tomarPedido(pedido) {
        const res = await tomarPedidoDelivery(pedido.id)
        alert(res.mensaje || tr('Pedido tomado', 'Order claimed'))
        if (res.success) cargarPedidos()
    }

    function solicitarGps(pedido) {
        if (!navigator.geolocation) return alert(tr('Este dispositivo no permite GPS', 'This device does not support GPS'))
        setProcesando(pedido.id)
        navigator.geolocation.getCurrentPosition(async ({ coords }) => {
            const res = await registrarEntrega({ pedidoId: pedido.id, latitud: coords.latitude, longitud: coords.longitude })
            alert(res.mensaje || tr('Entrega registrada', 'Delivery recorded'))
            setProcesando(null)
            if (res.success) cargarPedidos()
        }, () => {
            alert(tr('No se pudo obtener la ubicación. Activa el GPS y vuelve a intentar.', 'Could not get location. Enable GPS and try again.'))
            setProcesando(null)
        }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 })
    }

    const etiquetaEstado = (value) => ({ listo: tr('Listo para entregar', 'Ready for delivery'), entregado: tr('Entregado', 'Delivered') }[value] || value)

    return (
        <main className={`${estilos.contenedor} ${estilos[tema]}`}>
            <header className={estilos.header}>
                <div>
                    <p className={estilos.eyebrow}>{tr('Logística de última milla', 'Last-mile logistics')}</p>
                    <h1>{tr('Delivery', 'Delivery')}</h1>
                    <p>{tr('Clientes frecuentes, pedidos listos y rutas de entrega en un solo lugar.', 'Frequent customers, ready orders and delivery routes in one place.')}</p>
                </div>
                <div className={estilos.headerIcon}><ion-icon name="navigate-outline"></ion-icon></div>
            </header>

            <section className={estilos.clientesPanel}>
                <div className={estilos.sectionTitle}>
                    <div><span>{tr('Acceso rápido', 'Quick access')}</span><h2>{tr('Clientes frecuentes', 'Frequent customers')}</h2></div>
                    <span className={estilos.hint}>{tr('Busca por nombre, apodo o teléfono', 'Search by name, nickname or phone')}</span>
                </div>
                <form className={estilos.searchRow} onSubmit={e => { e.preventDefault(); buscarClientes() }}>
                    <ion-icon name="search-outline"></ion-icon>
                    <input value={busquedaCliente} onChange={e => setBusquedaCliente(e.target.value)} placeholder={tr('Nombre del cliente...', 'Customer name...')} />
                    <button type="submit">{tr('Buscar', 'Search')}</button>
                </form>
                {clientes.length > 0 && <div className={estilos.clientesGrid}>{clientes.map(cliente => {
                    const lat = cliente.latitud, lng = cliente.longitud
                    return <article className={estilos.clienteCard} key={cliente.id}>
                        <div className={estilos.avatar}>{cliente.foto_url ? <img src={cliente.foto_url} alt={cliente.nombre} /> : <ion-icon name="person-outline"></ion-icon>}</div>
                        <div className={estilos.clienteData}><h3>{cliente.nombre}</h3><p>{cliente.telefono || tr('Sin teléfono', 'No phone')}</p><div className={estilos.score}>★ {cliente.score || 100}</div></div>
                        <button className={estilos.mapButton} disabled={!lat || !lng} onClick={() => abrirMapa(lat, lng)} title={tr('Ir a ubicación del cliente', 'Go to customer location')}><ion-icon name="navigate-outline"></ion-icon></button>
                    </article>
                })}</div>}
            </section>

            <section className={estilos.pedidosPanel}>
                <div className={estilos.sectionTitle}><div><span>{tr('Pedidos online', 'Online orders')}</span><h2>{tr('Entregas disponibles', 'Available deliveries')}</h2></div><div className={estilos.filters}><input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder={tr('Buscar pedido o cliente...', 'Search order or customer...')} /><select value={estado} onChange={e => setEstado(e.target.value)}><option value="todos">{tr('Todos', 'All')}</option><option value="listo">{tr('Listos', 'Ready')}</option><option value="entregado">{tr('Entregados', 'Delivered')}</option></select></div></div>
                {cargando ? <div className={estilos.empty}>{tr('Cargando entregas...', 'Loading deliveries...')}</div> : pedidos.length === 0 ? <div className={estilos.empty}>{tr('No hay pedidos listos para entregar.', 'There are no ready deliveries.')}</div> : <div className={estilos.pedidosGrid}>{pedidos.map(pedido => {
                    const lat = pedido.latitud_entrega || pedido.direccion_latitud
                    const lng = pedido.longitud_entrega || pedido.direccion_longitud
                    return <article className={estilos.pedidoCard} key={pedido.id}>
                        <div className={estilos.pedidoTop}><span className={estilos.pedidoNumero}>{pedido.numero_pedido}</span><span className={`${estilos.estado} ${estilos[pedido.estado]}`}>{etiquetaEstado(pedido.estado)}</span></div>
                        <div className={estilos.pedidoCliente}><div className={estilos.avatarSmall}>{pedido.cliente_foto ? <img src={pedido.cliente_foto} alt="" /> : <ion-icon name="person-outline"></ion-icon>}</div><div><strong>{pedido.cliente_nombre || tr('Cliente de catálogo', 'Catalog customer')}</strong><small>{pedido.cliente_telefono || ''}</small></div></div>
                        <div className={estilos.address}><ion-icon name="location-outline"></ion-icon><span>{pedido.cliente_direccion || tr('Sin dirección escrita', 'No written address')}<small>{pedido.referencia_entrega || pedido.direccion_alias || ''}</small></span></div>
                        <div className={estilos.pedidoActions}><button className={estilos.mapAction} disabled={!lat || !lng} onClick={() => abrirMapa(lat, lng)}><ion-icon name="navigate-outline"></ion-icon>{tr('Ir a ubicación', 'Go to location')}</button><button className={estilos.wazeAction} disabled={!lat || !lng} onClick={() => abrirMapa(lat, lng, 'waze')}>Waze</button>{pedido.estado === 'listo' && <><button className={estilos.takeAction} onClick={() => tomarPedido(pedido)}><ion-icon name="hand-left-outline"></ion-icon>{tr('Tomar pedido', 'Take order')}</button><button className={estilos.deliverAction} disabled={procesando === pedido.id} onClick={() => { setGpsPedido(pedido); solicitarGps(pedido) }}><ion-icon name="checkmark-done-outline"></ion-icon>{tr('Registrar entrega', 'Record delivery')}</button></>}</div>
                    </article>
                })}</div>}
            </section>
            {gpsPedido && <p className={estilos.gpsNotice}>{procesando === gpsPedido.id ? tr('Obteniendo GPS y registrando entrega...', 'Getting GPS and recording delivery...') : ''}</p>}
        </main>
    )
}
