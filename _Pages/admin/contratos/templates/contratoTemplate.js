/**
 * Plantilla HTML profesional para contratos de financiamiento
 * Diseño legal y formal para República Dominicana
 */

export function generarHTMLContrato(datos) {
    const {
        contrato,
        empresa,
        cliente,
        cuotas,
        activos
    } = datos

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contrato de Financiamiento ${contrato.numero_contrato}</title>
    <style>
        @page {
            size: A4;
            margin: 20mm 15mm;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #1a1a1a;
            background: white;
        }

        .container {
            max-width: 100%;
            margin: 0 auto;
        }

        /* Header */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #0ea5e9;
        }

        .logo-empresa {
            flex: 1;
        }

        .logo-empresa h1 {
            font-size: 22pt;
            color: #0ea5e9;
            margin-bottom: 5px;
            font-weight: 700;
        }

        .logo-empresa p {
            font-size: 9pt;
            color: #666;
            margin: 2px 0;
        }

        .info-contrato {
            text-align: right;
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
        }

        .info-contrato h2 {
            font-size: 14pt;
            color: #0ea5e9;
            margin-bottom: 8px;
        }

        .info-contrato p {
            font-size: 10pt;
            color: #333;
            margin: 3px 0;
        }

        .info-contrato strong {
            color: #000;
        }

        /* Título principal */
        .titulo-principal {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border-left: 4px solid #0ea5e9;
        }

        .titulo-principal h1 {
            font-size: 18pt;
            color: #0369a1;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .titulo-principal p {
            font-size: 10pt;
            color: #666;
            margin-top: 5px;
        }

        /* Secciones */
        .seccion {
            margin-bottom: 25px;
            page-break-inside: avoid;
        }

        .seccion-titulo {
            font-size: 13pt;
            font-weight: 700;
            color: #0ea5e9;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e5e7eb;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .seccion-contenido {
            padding: 10px 0;
        }

        /* Grid de información */
        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin: 15px 0;
        }

        .info-item {
            display: flex;
            flex-direction: column;
            gap: 3px;
        }

        .info-label {
            font-size: 9pt;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
        }

        .info-valor {
            font-size: 11pt;
            color: #000;
            font-weight: 600;
        }

        /* Tabla */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 10pt;
        }

        thead {
            background: #0ea5e9;
            color: white;
        }

        th {
            padding: 10px 8px;
            text-align: left;
            font-weight: 600;
            font-size: 9pt;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        td {
            padding: 10px 8px;
            border-bottom: 1px solid #e5e7eb;
        }

        tbody tr:nth-child(even) {
            background: #f9fafb;
        }

        tbody tr:hover {
            background: #f0f9ff;
        }

        .tabla-total {
            background: #f0f9ff;
            font-weight: 700;
            color: #0369a1;
        }

        /* Resumen financiero */
        .resumen-financiero {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #10b981;
        }

        .resumen-fila {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 11pt;
        }

        .resumen-fila.destacado {
            font-size: 13pt;
            font-weight: 700;
            color: #0ea5e9;
            border-top: 2px solid #e5e7eb;
            padding-top: 12px;
            margin-top: 8px;
        }

        /* Cláusulas */
        .clausulas {
            margin: 25px 0;
        }

        .clausula {
            margin-bottom: 15px;
            text-align: justify;
        }

        .clausula-numero {
            font-weight: 700;
            color: #0ea5e9;
        }

        /* Firmas */
        .firmas-seccion {
            margin-top: 60px;
            page-break-inside: avoid;
        }

        .firmas-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 40px;
            margin-top: 40px;
        }

        .firma-bloque {
            text-align: center;
        }

        .firma-linea {
            border-top: 2px solid #000;
            margin: 60px 20px 10px;
        }

        .firma-label {
            font-size: 10pt;
            font-weight: 600;
            color: #333;
        }

        .firma-info {
            font-size: 9pt;
            color: #666;
            margin-top: 5px;
        }

        /* Alertas */
        .alerta {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }

        .alerta-titulo {
            font-weight: 700;
            color: #92400e;
            margin-bottom: 5px;
        }

        .alerta-texto {
            font-size: 10pt;
            color: #92400e;
        }

        /* Footer */
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            font-size: 8pt;
            color: #666;
            text-align: center;
        }

        /* Utilidades */
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: 700; }
        .text-primary { color: #0ea5e9; }
        .text-success { color: #10b981; }
        .text-danger { color: #ef4444; }
        .mb-10 { margin-bottom: 10px; }
        .mb-20 { margin-bottom: 20px; }
        .mt-20 { margin-top: 20px; }

        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="logo-empresa">
                <h1>${empresa.nombre || 'Empresa'}</h1>
                <p>${empresa.direccion || ''}</p>
                <p>RNC: ${empresa.rnc || 'N/A'}</p>
                <p>Tel: ${empresa.telefono || 'N/A'}</p>
                ${empresa.email ? `<p>Email: ${empresa.email}</p>` : ''}
            </div>
            <div class="info-contrato">
                <h2>CONTRATO DE FINANCIAMIENTO</h2>
                <p><strong>No. ${contrato.numero_contrato}</strong></p>
                <p>Fecha: ${formatearFecha(contrato.fecha_contrato)}</p>
                ${contrato.ncf ? `<p>NCF: ${contrato.ncf}</p>` : ''}
            </div>
        </div>

        <!-- Título Principal -->
        <div class="titulo-principal">
            <h1>Contrato de Financiamiento de Equipos</h1>
            <p>República Dominicana</p>
        </div>

        <!-- Partes del Contrato -->
        <div class="seccion">
            <h2 class="seccion-titulo">I. PARTES DEL CONTRATO</h2>
            <div class="seccion-contenido">
                <p class="mb-10">
                    El presente contrato de financiamiento es celebrado entre:
                </p>
                
                <div class="info-grid">
                    <div>
                        <p class="font-bold mb-10">EL ACREEDOR (Empresa):</p>
                        <div class="info-item">
                            <span class="info-label">Razón Social</span>
                            <span class="info-valor">${empresa.nombre || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">RNC</span>
                            <span class="info-valor">${empresa.rnc || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Dirección</span>
                            <span class="info-valor">${empresa.direccion || 'N/A'}</span>
                        </div>
                    </div>
                    
                    <div>
                        <p class="font-bold mb-10">EL DEUDOR (Cliente):</p>
                        <div class="info-item">
                            <span class="info-label">Nombre Completo</span>
                            <span class="info-valor">${cliente.nombre} ${cliente.apellidos || ''}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Cédula/Pasaporte</span>
                            <span class="info-valor">${cliente.numero_documento || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Teléfono</span>
                            <span class="info-valor">${cliente.telefono || 'N/A'}</span>
                        </div>
                        ${cliente.direccion ? `
                        <div class="info-item">
                            <span class="info-label">Dirección</span>
                            <span class="info-valor">${cliente.direccion}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>

                ${contrato.nombre_fiador ? `
                <div class="mt-20">
                    <p class="font-bold mb-10">FIADOR / GARANTE:</p>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Nombre Completo</span>
                            <span class="info-valor">${contrato.nombre_fiador}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Documento</span>
                            <span class="info-valor">${contrato.documento_fiador || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Teléfono</span>
                            <span class="info-valor">${contrato.telefono_fiador || 'N/A'}</span>
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>
        </div>

        <!-- Objeto del Contrato -->
        <div class="seccion">
            <h2 class="seccion-titulo">II. OBJETO DEL CONTRATO</h2>
            <div class="seccion-contenido">
                <p class="mb-10">
                    Por medio del presente contrato, <strong>EL ACREEDOR</strong> se compromete a financiar 
                    la adquisición de los siguientes equipos a favor de <strong>EL DEUDOR</strong>, 
                    bajo los términos y condiciones establecidos en este documento.
                </p>

                ${activos && activos.length > 0 ? `
                <table>
                    <thead>
                        <tr>
                            <th>Equipo</th>
                            <th>Código/Serie</th>
                            <th>Precio</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${activos.map(activo => `
                        <tr>
                            <td>${activo.producto_nombre || 'N/A'}</td>
                            <td>${activo.numero_serie || activo.codigo_activo || 'N/A'}</td>
                            <td class="text-right">${formatearMoneda(activo.precio_venta)}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
                ` : ''}
            </div>
        </div>

        <!-- Condiciones Financieras -->
        <div class="seccion">
            <h2 class="seccion-titulo">III. CONDICIONES FINANCIERAS</h2>
            <div class="seccion-contenido">
                <div class="resumen-financiero">
                    <div class="resumen-fila">
                        <span>Precio Total del Producto</span>
                        <strong>${formatearMoneda(contrato.precio_producto)}</strong>
                    </div>
                    <div class="resumen-fila">
                        <span>Pago Inicial</span>
                        <strong class="text-success">${formatearMoneda(contrato.pago_inicial)}</strong>
                    </div>
                    <div class="resumen-fila">
                        <span>Monto Financiado</span>
                        <strong>${formatearMoneda(contrato.monto_financiado)}</strong>
                    </div>
                    <div class="resumen-fila">
                        <span>Tasa de Interés Anual</span>
                        <strong>${((parseFloat(contrato.tasa_interes_mensual) * 12) * 100).toFixed(2)}%</strong>
                    </div>
                    <div class="resumen-fila">
                        <span>Tasa de Interés Mensual</span>
                        <strong>${(parseFloat(contrato.tasa_interes_mensual) * 100).toFixed(2)}%</strong>
                    </div>
                    <div class="resumen-fila">
                        <span>Plazo</span>
                        <strong>${contrato.numero_cuotas} meses</strong>
                    </div>
                    <div class="resumen-fila">
                        <span>Cuota Mensual</span>
                        <strong class="text-primary">${formatearMoneda(contrato.monto_cuota)}</strong>
                    </div>
                    <div class="resumen-fila">
                        <span>Total de Intereses</span>
                        <strong>${formatearMoneda(contrato.total_intereses)}</strong>
                    </div>
                    <div class="resumen-fila destacado">
                        <span>TOTAL A PAGAR</span>
                        <strong>${formatearMoneda(contrato.total_a_pagar)}</strong>
                    </div>
                </div>

                <p class="mt-20">
                    <strong>Plan de Financiamiento:</strong> ${contrato.plan_nombre || 'N/A'}<br>
                    <strong>Fecha del Primer Pago:</strong> ${formatearFecha(contrato.fecha_primer_pago)}<br>
                    <strong>Fecha del Último Pago:</strong> ${formatearFecha(contrato.fecha_ultimo_pago)}
                </p>
            </div>
        </div>

        <!-- Cronograma de Pagos -->
        ${cuotas && cuotas.length > 0 ? `
        <div class="seccion">
            <h2 class="seccion-titulo">IV. CRONOGRAMA DE PAGOS</h2>
            <div class="seccion-contenido">
                <table>
                    <thead>
                        <tr>
                            <th>Cuota</th>
                            <th>Fecha Vencimiento</th>
                            <th>Capital</th>
                            <th>Interés</th>
                            <th>Cuota Total</th>
                            <th>Saldo Restante</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${cuotas.map(cuota => `
                        <tr>
                            <td>${cuota.numero_cuota}</td>
                            <td>${formatearFecha(cuota.fecha_vencimiento)}</td>
                            <td class="text-right">${formatearMoneda(cuota.monto_capital)}</td>
                            <td class="text-right">${formatearMoneda(cuota.monto_interes)}</td>
                            <td class="text-right font-bold">${formatearMoneda(cuota.monto_cuota)}</td>
                            <td class="text-right">${formatearMoneda(cuota.saldo_restante)}</td>
                        </tr>
                        `).join('')}
                        <tr class="tabla-total">
                            <td colspan="2"><strong>TOTALES</strong></td>
                            <td class="text-right"><strong>${formatearMoneda(cuotas.reduce((sum, c) => sum + parseFloat(c.monto_capital), 0))}</strong></td>
                            <td class="text-right"><strong>${formatearMoneda(cuotas.reduce((sum, c) => sum + parseFloat(c.monto_interes), 0))}</strong></td>
                            <td class="text-right"><strong>${formatearMoneda(cuotas.reduce((sum, c) => sum + parseFloat(c.monto_cuota), 0))}</strong></td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        ` : ''}

        <!-- Cláusulas Legales -->
        <div class="seccion clausulas">
            <h2 class="seccion-titulo">V. CLÁUSULAS Y CONDICIONES</h2>
            
            <div class="clausula">
                <span class="clausula-numero">PRIMERA - OBJETO:</span>
                El presente contrato tiene por objeto el financiamiento de los equipos descritos en la sección II, 
                los cuales quedan en garantía hasta el pago total de la deuda.
            </div>

            <div class="clausula">
                <span class="clausula-numero">SEGUNDA - FORMA DE PAGO:</span>
                EL DEUDOR se compromete a pagar ${contrato.numero_cuotas} cuotas mensuales de ${formatearMoneda(contrato.monto_cuota)} 
                cada una, con vencimiento el día ${new Date(contrato.fecha_primer_pago).getDate()} de cada mes, 
                iniciando el ${formatearFecha(contrato.fecha_primer_pago)}.
            </div>

            <div class="clausula">
                <span class="clausula-numero">TERCERA - MORA:</span>
                En caso de mora en el pago de cualquier cuota, se aplicará un interés moratorio conforme a las 
                tasas establecidas por la Superintendencia de Bancos de la República Dominicana, sin perjuicio 
                de las acciones legales correspondientes.
            </div>

            <div class="clausula">
                <span class="clausula-numero">CUARTA - GARANTÍA:</span>
                Los equipos financiados quedan en garantía a favor de EL ACREEDOR hasta la cancelación total 
                de la deuda. EL DEUDOR no podrá vender, ceder o gravar los equipos sin autorización escrita 
                de EL ACREEDOR.
            </div>

            <div class="clausula">
                <span class="clausula-numero">QUINTA - INCUMPLIMIENTO:</span>
                El incumplimiento de tres (3) cuotas consecutivas o cinco (5) alternas dará derecho a EL ACREEDOR 
                de dar por vencido el plazo del contrato y exigir el pago inmediato del saldo pendiente, 
                más intereses y costas legales.
            </div>

            ${contrato.nombre_fiador ? `
            <div class="clausula">
                <span class="clausula-numero">SEXTA - FIADOR:</span>
                EL FIADOR se constituye en garante solidario de todas las obligaciones contraídas por EL DEUDOR 
                en virtud del presente contrato, obligándose a responder por el pago total en caso de incumplimiento.
            </div>
            ` : ''}

            <div class="clausula">
                <span class="clausula-numero">${contrato.nombre_fiador ? 'SÉPTIMA' : 'SEXTA'} - JURISDICCIÓN:</span>
                Para todos los efectos legales derivados del presente contrato, las partes se someten a la 
                jurisdicción de los tribunales de la República Dominicana, renunciando a cualquier otro fuero 
                que pudiere corresponderles.
            </div>
        </div>

        ${contrato.notas ? `
        <div class="seccion">
            <h2 class="seccion-titulo">VI. NOTAS ADICIONALES</h2>
            <div class="seccion-contenido">
                <p>${contrato.notas}</p>
            </div>
        </div>
        ` : ''}

        <!-- Alerta Legal -->
        <div class="alerta">
            <p class="alerta-titulo">IMPORTANTE</p>
            <p class="alerta-texto">
                Este contrato constituye un título ejecutivo. El incumplimiento de las obligaciones aquí 
                contraídas dará lugar a acciones legales conforme a las leyes de la República Dominicana.
            </p>
        </div>

        <!-- Firmas -->
        <div class="firmas-seccion">
            <p class="text-center mb-20">
                En prueba de conformidad y aceptación de todos los términos establecidos en el presente contrato, 
                las partes firman en la ciudad de Santo Domingo, República Dominicana, 
                a los ${new Date(contrato.fecha_contrato).getDate()} días del mes de 
                ${new Date(contrato.fecha_contrato).toLocaleDateString('es-DO', { month: 'long' })} 
                del año ${new Date(contrato.fecha_contrato).getFullYear()}.
            </p>

            <div class="firmas-grid">
                <div class="firma-bloque">
                    <div class="firma-linea"></div>
                    <p class="firma-label">Firma del Cliente</p>
                    <p class="firma-info">${cliente.nombre} ${cliente.apellidos || ''}</p>
                    <p class="firma-info">Cédula: ${cliente.numero_documento || 'N/A'}</p>
                </div>

                <div class="firma-bloque">
                    <div class="firma-linea"></div>
                    <p class="firma-label">Por la Empresa</p>
                    <p class="firma-info">${empresa.nombre || 'N/A'}</p>
                    <p class="firma-info">RNC: ${empresa.rnc || 'N/A'}</p>
                </div>

                ${contrato.nombre_fiador ? `
                <div class="firma-bloque">
                    <div class="firma-linea"></div>
                    <p class="firma-label">Firma del Fiador</p>
                    <p class="firma-info">${contrato.nombre_fiador}</p>
                    <p class="firma-info">Cédula: ${contrato.documento_fiador || 'N/A'}</p>
                </div>
                ` : ''}

                ${contrato.vendedor_nombre ? `
                <div class="firma-bloque">
                    <div class="firma-linea"></div>
                    <p class="firma-label">Vendedor</p>
                    <p class="firma-info">${contrato.vendedor_nombre}</p>
                </div>
                ` : ''}
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>
                Este documento fue generado electrónicamente el ${new Date().toLocaleDateString('es-DO', { 
                    day: '2-digit', 
                    month: 'long', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}
            </p>
            <p>Contrato No. ${contrato.numero_contrato} | ${empresa.nombre || ''}</p>
        </div>
    </div>
</body>
</html>
    `.trim()
}

// Funciones auxiliares
function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-DO', {
        style: 'currency',
        currency: 'DOP',
        minimumFractionDigits: 2
    }).format(valor || 0)
}

function formatearFecha(fecha) {
    if (!fecha) return 'N/A'
    return new Date(fecha).toLocaleDateString('es-DO', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    })
}

