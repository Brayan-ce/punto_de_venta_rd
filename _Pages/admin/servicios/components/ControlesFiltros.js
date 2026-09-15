"use client"
import estilos from '../servicios.module.css'

export default function ControlesFiltros({ tema, filtros, setFiltros, vista, setVista }) {
    return (
        <div className={`${estilos.controlesSeccion} ${estilos[tema]}`}>
            <div className={`${estilos.seccionHeader} ${estilos[tema]}`}>
                <h2>Todos los Servicios</h2>
                <div className={estilos.controlesDerecha}>
                    <div className={`${estilos.vistaToggle} ${estilos[tema]}`}>
                        <button
                            className={`${estilos.btnVista} ${vista === 'grid' ? estilos.vistaActiva : ''} ${estilos[tema]}`}
                            onClick={() => setVista('grid')}
                            title="Vista en cuadrícula"
                        >
                            <ion-icon name="grid-outline"></ion-icon>
                        </button>
                        <button
                            className={`${estilos.btnVista} ${vista === 'lista' ? estilos.vistaActiva : ''} ${estilos[tema]}`}
                            onClick={() => setVista('lista')}
                            title="Vista en lista"
                        >
                            <ion-icon name="list-outline"></ion-icon>
                        </button>
                    </div>
                    <button className={`${estilos.btnIcono} ${estilos[tema]}`}>
                        <ion-icon name="download-outline"></ion-icon>
                    </button>
                </div>
            </div>

            <div className={`${estilos.controles} ${estilos[tema]}`}>
                <div className={estilos.busqueda}>
                    <ion-icon name="search-outline"></ion-icon>
                    <input
                        type="text"
                        className={`${estilos.inputBusqueda} ${estilos[tema]}`}
                        placeholder="Buscar por nombre, código, ubicación o cliente..."
                        value={filtros.busqueda}
                        onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                    />
                </div>

                <select
                    className={`${estilos.selectFiltro} ${estilos[tema]}`}
                    value={filtros.tipo_servicio}
                    onChange={(e) => setFiltros(prev => ({ ...prev, tipo_servicio: e.target.value }))}
                >
                    <option value="">Todos los tipos</option>
                    <option value="electrico">Eléctrico</option>
                    <option value="plomeria">Plomería</option>
                    <option value="pintura">Pintura</option>
                    <option value="reparacion">Reparación</option>
                    <option value="instalacion">Instalación</option>
                    <option value="mantenimiento">Mantenimiento</option>
                </select>

                <select
                    className={`${estilos.selectFiltro} ${estilos[tema]}`}
                    value={filtros.prioridad}
                    onChange={(e) => setFiltros(prev => ({ ...prev, prioridad: e.target.value }))}
                >
                    <option value="">Todas las prioridades</option>
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                </select>

                {(filtros.busqueda || filtros.estado !== 'todos' || filtros.tipo_servicio || filtros.prioridad) && (
                    <button
                        className={estilos.btnLimpiar}
                        onClick={() => setFiltros({ busqueda: '', estado: 'todos', tipo_servicio: '', prioridad: '' })}
                    >
                        <ion-icon name="close-circle-outline"></ion-icon>
                        Limpiar
                    </button>
                )}
            </div>
        </div>
    )
}

