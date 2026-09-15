"use client"
import estilos from '../constructora.module.css'

export default function GraficaDistribucion({ dashboard, porcentajes, tema }) {
    return (
        <div className={`${estilos.cardGrafica} ${estilos[tema]}`}>
            <div className={estilos.cardGraficaHeader}>
                <div>
                    <h3 className={estilos.cardGraficaTitulo}>Distribución de Recursos</h3>
                    <p className={estilos.cardGraficaSubtitulo}>Vista general de actividades</p>
                </div>
            </div>

            <div className={estilos.graficaCircular}>
                <svg className={estilos.donaChart} viewBox="0 0 200 200">
                    <circle
                        cx="100"
                        cy="100"
                        r="80"
                        fill="none"
                        stroke={tema === 'light' ? '#f1f5f9' : '#1e293b'}
                        strokeWidth="40"
                    />
                    {/* Obras - Azul */}
                    <circle
                        cx="100"
                        cy="100"
                        r="80"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="40"
                        strokeDasharray={`${(porcentajes.obras * 5.024).toFixed(2)} 502.4`}
                        strokeDashoffset="0"
                        className={estilos.donaSegmento}
                    />
                    {/* Personal - Verde */}
                    <circle
                        cx="100"
                        cy="100"
                        r="80"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="40"
                        strokeDasharray={`${(porcentajes.personal * 5.024).toFixed(2)} 502.4`}
                        strokeDashoffset={`-${(porcentajes.obras * 5.024).toFixed(2)}`}
                        className={estilos.donaSegmento}
                    />
                    {/* Servicios - Naranja */}
                    <circle
                        cx="100"
                        cy="100"
                        r="80"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="40"
                        strokeDasharray={`${(porcentajes.servicios * 5.024).toFixed(2)} 502.4`}
                        strokeDashoffset={`-${((parseFloat(porcentajes.obras) + parseFloat(porcentajes.personal)) * 5.024).toFixed(2)}`}
                        className={estilos.donaSegmento}
                    />
                    <text x="100" y="95" textAnchor="middle" className={estilos.donaTextoValor}>
                        {dashboard.estadisticas.obras_activas + dashboard.estadisticas.personal_campo + dashboard.estadisticas.servicios_pendientes}
                    </text>
                    <text x="100" y="115" textAnchor="middle" className={estilos.donaTextoLabel}>
                        Total
                    </text>
                </svg>

                <div className={estilos.leyendaCircular}>
                    <div className={estilos.leyendaItem}>
                        <div className={`${estilos.leyendaDot} ${estilos.obras}`}></div>
                        <div className={estilos.leyendaInfo}>
                            <span className={estilos.leyendaLabel}>Obras Activas</span>
                            <span className={estilos.leyendaValor}>{dashboard.estadisticas.obras_activas || 0}</span>
                        </div>
                        <span className={estilos.leyendaPorcentaje}>{porcentajes.obras}%</span>
                    </div>
                    <div className={estilos.leyendaItem}>
                        <div className={`${estilos.leyendaDot} ${estilos.personal}`}></div>
                        <div className={estilos.leyendaInfo}>
                            <span className={estilos.leyendaLabel}>Personal</span>
                            <span className={estilos.leyendaValor}>{dashboard.estadisticas.personal_campo || 0}</span>
                        </div>
                        <span className={estilos.leyendaPorcentaje}>{porcentajes.personal}%</span>
                    </div>
                    <div className={estilos.leyendaItem}>
                        <div className={`${estilos.leyendaDot} ${estilos.servicios}`}></div>
                        <div className={estilos.leyendaInfo}>
                            <span className={estilos.leyendaLabel}>Servicios</span>
                            <span className={estilos.leyendaValor}>{dashboard.estadisticas.servicios_pendientes || 0}</span>
                        </div>
                        <span className={estilos.leyendaPorcentaje}>{porcentajes.servicios}%</span>
                    </div>
                </div>
            </div>

            {/* Ilustración decorativa */}
            <div className={estilos.ilustracionGrafica}>
                <img
                    src="/lustracion_reparaciones/Hammer_3D.svg"
                    alt="Construcción"
                    width={120}
                    height={120}
                    className={estilos.ilustracion3D}
                    loading="lazy"
                    decoding="async"
                />
            </div>
        </div>
    )
}

