/**
 * Cálculos financieros del dominio Financiamiento
 * 
 * Este archivo contiene todas las funciones de cálculo financiero:
 * amortización, mora, scoring crediticio, conversiones de tasas, etc.
 * 
 * Movido desde utils/financiamientoUtils.js para centralizar la lógica
 * del dominio compartido.
 */

/**
 * Calcula la amortización usando el método francés
 * @param {number} monto - Monto a financiar
 * @param {number} tasaMensual - Tasa de interés mensual (ej: 0.015 para 1.5%)
 * @param {number} cuotas - Número de cuotas
 * @returns {Object} Objeto con cuota mensual y desglose
 */
export function calcularAmortizacionFrancesa(monto, tasaMensual, cuotas) {
  if (monto <= 0 || cuotas <= 0) {
    return {
      cuotaMensual: 0,
      totalIntereses: 0,
      totalPagar: 0,
      cronograma: []
    }
  }

  // Si la tasa es 0, cuota fija sin intereses
  if (tasaMensual === 0) {
    const cuotaMensual = monto / cuotas
    const cronograma = []
    let saldoRestante = monto

    // Generar cronograma sin intereses
    for (let i = 1; i <= cuotas; i++) {
      const capital = cuotaMensual
      saldoRestante -= capital

      cronograma.push({
        numero: i,
        capital: Math.round(capital * 100) / 100,
        interes: 0,
        cuota: Math.round(cuotaMensual * 100) / 100,
        saldoRestante: Math.round(Math.max(0, saldoRestante) * 100) / 100
      })
    }

    return {
      cuotaMensual: Math.round(cuotaMensual * 100) / 100,
      totalIntereses: 0,
      totalPagar: monto,
      cronograma
    }
  }

  // Fórmula del método francés: Cuota = P * [r(1+r)^n] / [(1+r)^n - 1]
  const factor = Math.pow(1 + tasaMensual, cuotas)
  const cuotaMensual = monto * (tasaMensual * factor) / (factor - 1)

  // Generar cronograma
  const cronograma = []
  let saldoRestante = monto

  for (let i = 1; i <= cuotas; i++) {
    const interes = saldoRestante * tasaMensual
    const capital = cuotaMensual - interes
    saldoRestante -= capital

    cronograma.push({
      numero: i,
      capital: Math.round(capital * 100) / 100,
      interes: Math.round(interes * 100) / 100,
      cuota: Math.round(cuotaMensual * 100) / 100,
      saldoRestante: Math.round(Math.max(0, saldoRestante) * 100) / 100
    })
  }

  const totalIntereses = cronograma.reduce((sum, c) => sum + c.interes, 0)
  const totalPagar = monto + totalIntereses

  return {
    cuotaMensual: Math.round(cuotaMensual * 100) / 100,
    totalIntereses: Math.round(totalIntereses * 100) / 100,
    totalPagar: Math.round(totalPagar * 100) / 100,
    cronograma
  }
}

/**
 * Calcula la mora acumulada
 * @param {number} montoCuota - Monto de la cuota
 * @param {number} diasAtraso - Días de atraso
 * @param {number} tasaMora - Tasa de mora mensual (ej: 0.05 para 5%)
 * @param {number} diasGracia - Días de gracia antes de aplicar mora
 * @returns {number} Monto de mora
 */
export function calcularMora(montoCuota, diasAtraso, tasaMora, diasGracia = 5) {
  if (diasAtraso <= diasGracia) {
    return 0
  }

  const diasMora = diasAtraso - diasGracia
  const moraDiaria = (montoCuota * tasaMora) / 30 // Tasa mensual dividida por 30 días
  const moraTotal = moraDiaria * diasMora

  return Math.round(moraTotal * 100) / 100
}

/**
 * Ajusta el día del mes para evitar problemas con meses de 28/30/31 días
 * @param {Date} fecha - Fecha base
 * @param {number} diaDeseado - Día deseado del mes (1-31)
 * @returns {Date} Fecha ajustada
 */
export function ajustarDiaMes(fecha, diaDeseado) {
  const fechaAjustada = new Date(fecha)
  const ultimoDia = new Date(
    fechaAjustada.getFullYear(),
    fechaAjustada.getMonth() + 1,
    0
  ).getDate()
  
  fechaAjustada.setDate(Math.min(diaDeseado, ultimoDia))
  return fechaAjustada
}

/**
 * Genera cronograma de fechas de pago para un plan o contrato
 * 
 * @param {Date|string} fechaPrimerPago - Fecha del primer pago
 * @param {number} numeroCuotas - Número de cuotas
 * @param {number} diaPagoMensual - Día del mes para pagos (1-31, opcional)
 * @param {number} diasGracia - Días de gracia después del vencimiento
 * @returns {Array} Array de objetos con fechas de vencimiento y fin de gracia
 */
export function generarCronogramaFechas(fechaPrimerPago, numeroCuotas, diaPagoMensual = null, diasGracia = 5) {
  const cronograma = []
  const fechaBase = new Date(fechaPrimerPago)
  
  // Si no se especifica día mensual, usar el día de la fecha base
  const diaPago = diaPagoMensual || fechaBase.getDate()
  
  for (let i = 0; i < numeroCuotas; i++) {
    const fechaCuota = new Date(fechaBase)
    fechaCuota.setMonth(fechaBase.getMonth() + i)
    
    // Ajustar día del mes (maneja meses con 28/30/31 días)
    const fechaAjustada = ajustarDiaMes(fechaCuota, diaPago)
    
    // Calcular fecha fin de gracia
    const fechaFinGracia = new Date(fechaAjustada)
    fechaFinGracia.setDate(fechaFinGracia.getDate() + diasGracia)
    
    cronograma.push({
      numeroCuota: i + 1,
      fechaVencimiento: fechaAjustada.toISOString().split('T')[0],
      fechaFinGracia: fechaFinGracia.toISOString().split('T')[0],
      fechaVencimientoObj: new Date(fechaAjustada),
      fechaFinGraciaObj: new Date(fechaFinGracia)
    })
  }
  
  return cronograma
}

/**
 * Genera el cronograma completo de cuotas para un contrato
 * @param {Object} contrato - Objeto con datos del contrato
 * @returns {Array} Array de cuotas con fechas y montos
 */
export function generarCronograma(contrato) {
  const {
    monto_financiado,
    numero_cuotas,
    fecha_primer_pago,
    tasa_interes_mensual,
    dias_gracia = 5,
    dia_pago_mensual = null
  } = contrato

  const amortizacion = calcularAmortizacionFrancesa(
    monto_financiado,
    tasa_interes_mensual,
    numero_cuotas
  )

  // Generar fechas usando la función optimizada
  const fechas = generarCronogramaFechas(
    fecha_primer_pago,
    numero_cuotas,
    dia_pago_mensual,
    dias_gracia
  )

  const cuotas = []

  amortizacion.cronograma.forEach((item, index) => {
    const fechaInfo = fechas[index]
    
    cuotas.push({
      numero_cuota: item.numero,
      fecha_vencimiento: fechaInfo.fechaVencimiento,
      fecha_fin_gracia: fechaInfo.fechaFinGracia,
      monto_capital: item.capital,
      monto_interes: item.interes,
      monto_cuota: item.cuota,
      saldo_restante: item.saldoRestante,
      monto_pagado: 0,
      monto_mora: 0,
      total_a_pagar: item.cuota,
      estado: 'pendiente',
      dias_atraso: 0
    })
  })

  return cuotas
}

/**
 * Calcula el score crediticio de un cliente (0-100)
 * @param {Object} cliente - Datos del cliente con historial crediticio
 * @returns {Object} Score y clasificación
 */
export function calcularScoreCrediticio(cliente) {
  let score = 100 // Base

  // Factor 1: Historial de pagos (40 puntos)
  const totalCreditos = cliente.total_creditos_otorgados || 0
  const creditosPagadosTiempo = cliente.total_creditos_pagados || 0
  
  if (totalCreditos > 0) {
    const paymentRatio = creditosPagadosTiempo / totalCreditos
    const paymentScore = paymentRatio * 40
    score = score - 40 + paymentScore
  }

  // Factor 2: Días promedio de atraso (-30 puntos máx)
  const avgDelay = cliente.promedio_dias_pago || 0
  const delayPenalty = Math.min(avgDelay * 1.5, 30)
  score -= delayPenalty

  // Factor 3: Uso de crédito (20 puntos)
  const limiteCredito = cliente.limite_credito || 1
  const saldoUtilizado = cliente.saldo_utilizado || 0
  const usageRatio = saldoUtilizado / limiteCredito
  
  let usageScore = 0
  if (usageRatio < 0.3) {
    usageScore = 20
  } else if (usageRatio < 0.7) {
    usageScore = 15
  } else if (usageRatio < 0.9) {
    usageScore = 10
  } else {
    usageScore = 5
  }
  score = score - 20 + usageScore

  // Factor 4: Antigüedad (10 puntos)
  if (cliente.fecha_creacion) {
    const fechaCreacion = new Date(cliente.fecha_creacion)
    const ahora = new Date()
    const mesesDiff = (ahora.getFullYear() - fechaCreacion.getFullYear()) * 12 +
                     (ahora.getMonth() - fechaCreacion.getMonth())
    const seniorityScore = Math.min((mesesDiff / 12) * 10, 10)
    score = score - 10 + seniorityScore
  }

  // Factor 5: Créditos vencidos actuales (-50 puntos máx)
  const creditosVencidos = cliente.total_creditos_vencidos || 0
  const overduePenalty = Math.min(creditosVencidos * 25, 50)
  score -= overduePenalty

  // Normalizar score entre 0 y 100
  score = Math.max(0, Math.min(100, Math.round(score)))

  // Determinar clasificación
  let clasificacion = 'D'
  if (score >= 90) {
    clasificacion = 'A'
  } else if (score >= 75) {
    clasificacion = 'B'
  } else if (score >= 50) {
    clasificacion = 'C'
  }

  return {
    score,
    clasificacion
  }
}

/**
 * Convierte tasa anual a tasa mensual
 * @param {number} tasaAnual - Tasa de interés anual (ej: 18 para 18%)
 * @returns {number} Tasa mensual (ej: 0.015 para 1.5%)
 */
export function tasaAnualAMensual(tasaAnual) {
  if (typeof tasaAnual !== 'number' || isNaN(tasaAnual)) {
    return 0
  }
  
  // Fórmula: (1 + tasa_anual/100)^(1/12) - 1
  // Para tasas pequeñas, aproximación: tasa_anual / 12 / 100
  return tasaAnual / 12 / 100
}

/**
 * Convierte tasa mensual a tasa anual efectiva (TEA)
 * @param {number} tasaMensual - Tasa de interés mensual (ej: 0.015 para 1.5%)
 * @returns {number} Tasa anual efectiva (ej: 18.45 para 18.45%)
 */
export function tasaMensualAAnual(tasaMensual) {
  if (typeof tasaMensual !== 'number' || isNaN(tasaMensual) || tasaMensual <= 0) {
    return 0
  }
  
  // Fórmula TEA: ((1 + tasa_mensual)^12 - 1) * 100
  const tasaAnualEfectiva = (Math.pow(1 + tasaMensual, 12) - 1) * 100
  return Math.round(tasaAnualEfectiva * 100) / 100
}

/**
 * Calcula el valor presente de una serie de pagos (método francés)
 * @param {number} cuota - Monto de cada cuota
 * @param {number} tasaMensual - Tasa de interés mensual (ej: 0.015)
 * @param {number} numeroCuotas - Número de cuotas
 * @returns {number} Valor presente (monto financiado)
 */
export function calcularValorPresente(cuota, tasaMensual, numeroCuotas) {
  if (cuota <= 0 || numeroCuotas <= 0) {
    return 0
  }
  
  // Si tasa es 0, valor presente es simplemente cuota * número de cuotas
  if (tasaMensual === 0) {
    return cuota * numeroCuotas
  }
  
  // Fórmula: VP = C × [(1 - (1 + r)^(-n)) / r]
  const factor = (1 - Math.pow(1 + tasaMensual, -numeroCuotas)) / tasaMensual
  return cuota * factor
}

/**
 * Calcula la derivada de la función de valor presente (para Newton-Raphson)
 * 
 * Derivada de: VP = C × [(1 - (1 + r)^(-n)) / r]
 * 
 * Fórmula: f'(r) = C × [n(1+r)^(-n-1) × r - (1 - (1+r)^(-n))] / r²
 * 
 * @param {number} cuota - Monto de cada cuota
 * @param {number} tasaMensual - Tasa de interés mensual
 * @param {number} numeroCuotas - Número de cuotas
 * @returns {number} Derivada de la función
 */
export function calcularDerivadaValorPresente(cuota, tasaMensual, numeroCuotas) {
  if (tasaMensual === 0 || numeroCuotas <= 0) {
    return 0
  }
  
  // A = (1 + r)^(-n)
  const A = Math.pow(1 + tasaMensual, -numeroCuotas)
  // B = (1 + r)^(-n-1) = A / (1 + r)
  const B = A / (1 + tasaMensual)
  
  // Numerador: n(1+r)^(-n-1) × r - (1 - (1+r)^(-n))
  // = n × B × r - (1 - A)
  const numerador = numeroCuotas * B * tasaMensual - (1 - A)
  const denominador = tasaMensual * tasaMensual
  
  return cuota * (numerador / denominador)
}

/**
 * Calcula la tasa de interés mensual usando método híbrido optimizado (Bisección + Newton-Raphson)
 * 
 * Este es el algoritmo optimizado para cálculo inverso de planes de financiamiento.
 * Combina la seguridad de bisección con la velocidad de Newton-Raphson.
 * 
 * Características:
 * - Convergencia garantizada (bisección)
 * - Velocidad (Newton-Raphson)
 * - 8-15 iteraciones típicas vs 35-45 de bisección pura
 * - Ideal para sistemas financieros en producción
 * 
 * @param {number} cuotaMensual - Monto de cada cuota mensual
 * @param {number} numeroCuotas - Número de cuotas
 * @param {number} montoFinanciado - Monto financiado (capital)
 * @returns {Object} { tasaMensual: number, iteraciones: number, metodo: string, error?: string }
 */
export function calcularTasaMensualInversa(cuotaMensual, numeroCuotas, montoFinanciado) {
  // Validaciones básicas
  if (cuotaMensual <= 0 || numeroCuotas <= 0 || montoFinanciado <= 0) {
    return {
      tasaMensual: 0,
      iteraciones: 0,
      metodo: 'error',
      error: 'Parámetros inválidos'
    }
  }
  
  // Validación de coherencia: el total pagado debe ser >= monto financiado
  const totalPagado = cuotaMensual * numeroCuotas
  if (totalPagado < montoFinanciado) {
    return {
      tasaMensual: 0,
      iteraciones: 0,
      metodo: 'error',
      error: 'El total de cuotas es menor al monto financiado (tasa negativa)'
    }
  }
  
  // Si total pagado = monto financiado, tasa es 0%
  if (Math.abs(totalPagado - montoFinanciado) < 0.01) {
    return {
      tasaMensual: 0,
      iteraciones: 0,
      metodo: 'directo',
      error: null
    }
  }
  
  // Función objetivo: f(r) = VP(cuota, r, n) - montoFinanciado
  // Buscamos r tal que f(r) = 0
  function f(r) {
    return calcularValorPresente(cuotaMensual, r, numeroCuotas) - montoFinanciado
  }
  
  // Función derivada para Newton-Raphson
  function fDerivada(r) {
    if (r === 0) return 0
    return calcularDerivadaValorPresente(cuotaMensual, r, numeroCuotas)
  }
  
  // Rango inicial para bisección (según especificaciones)
  let rMin = 0.000001  // ~0% mensual
  let rMax = 0.15      // 15% mensual (límite duro, ~180% anual)
  
  // Verificar que la raíz esté en el rango
  const fMin = f(rMin)
  const fMax = f(rMax)
  
  if (fMin * fMax > 0) {
    // No hay raíz en el rango, intentar expandir
    rMax = 0.20  // Expandir a 20% mensual
    const fMax2 = f(rMax)
    if (fMin * fMax2 > 0) {
      return {
        tasaMensual: 0,
        iteraciones: 0,
        metodo: 'error',
        error: 'No se encontró tasa válida en el rango permitido'
      }
    }
  }
  
  // Inicializar con punto medio
  let r = (rMin + rMax) / 2
  const tolerancia = 1e-8  // Precisión: 0.000001% (según especificaciones)
  const maxIteraciones = 100  // Límite de seguridad (según especificaciones)
  let iteraciones = 0
  let metodoUsado = 'biseccion'
  
  // Algoritmo híbrido optimizado
  for (let i = 0; i < maxIteraciones; i++) {
    iteraciones = i + 1
    const fr = f(r)
    
    // Verificar convergencia
    if (Math.abs(fr) < tolerancia) {
      // Validar que la tasa esté en rango razonable
      if (r > 0.15) {
        return {
          tasaMensual: 0,
          iteraciones,
          metodo: metodoUsado,
          error: 'Tasa fuera de rango permitido (>15% mensual)'
        }
      }
      
      return {
        tasaMensual: r,
        iteraciones,
        metodo: metodoUsado,
        error: null
      }
    }
    
    // Intentar Newton-Raphson si es seguro
    const deriv = fDerivada(r)
    
    if (Math.abs(deriv) > 1e-10 && !isNaN(deriv) && isFinite(deriv)) {
      const rNewton = r - fr / deriv
      
      // Solo usar Newton si está dentro del rango y es válido
      if (rNewton > rMin && rNewton < rMax && !isNaN(rNewton) && isFinite(rNewton) && rNewton > 0) {
        r = rNewton
        metodoUsado = 'hibrido'
      } else {
        // Si Newton se sale del rango, usar bisección
        r = (rMin + rMax) / 2
        metodoUsado = 'biseccion'
      }
    } else {
      // Derivada muy pequeña o inválida, usar bisección
      r = (rMin + rMax) / 2
      metodoUsado = 'biseccion'
    }
    
    // Actualizar intervalo para bisección (asegurar convergencia)
    const frActual = f(r)
    if (frActual > 0) {
      rMin = r
    } else {
      rMax = r
    }
    
    // Asegurar que r esté en el rango válido
    r = Math.max(rMin + 1e-10, Math.min(rMax - 1e-10, r))
    
    // Verificar que el intervalo no sea demasiado pequeño
    if (rMax - rMin < 1e-12) {
      break
    }
  }
  
  // Validar resultado final
  if (r > 0.15) {
    return {
      tasaMensual: 0,
      iteraciones,
      metodo: metodoUsado,
      error: 'Tasa fuera de rango permitido (>15% mensual)'
    }
  }
  
  // Retornar mejor aproximación encontrada
  return {
    tasaMensual: r,
    iteraciones,
    metodo: metodoUsado,
    error: iteraciones >= maxIteraciones ? 'Máximo de iteraciones alcanzado' : null
  }
}

/**
 * Calcula todos los parámetros de un plan de financiamiento usando flujo inverso
 * 
 * El usuario ingresa: pago inicial, cuota mensual, número de cuotas
 * El sistema calcula: tasa de interés, monto financiado, precio total, etc.
 * 
 * Algoritmo iterativo:
 * 1. Estima precio total inicial (pagoInicial + totalCuotas)
 * 2. Calcula monto financiado = precioTotal - pagoInicial
 * 3. Calcula tasa usando método híbrido (Bisección + Newton-Raphson)
 * 4. Recalcula monto financiado con tasa encontrada (más preciso)
 * 5. Recalcula precio total
 * 6. Itera hasta convergencia (máximo 10 iteraciones)
 * 
 * @param {number} pagoInicial - Monto del pago inicial
 * @param {number} cuotaMensual - Monto de cada cuota mensual
 * @param {number} numeroCuotas - Número de cuotas
 * @returns {Object} Parámetros calculados del plan
 */
export function calcularPlanInverso(pagoInicial, cuotaMensual, numeroCuotas) {
  // Validaciones básicas
  if (pagoInicial < 0 || cuotaMensual <= 0 || numeroCuotas <= 0) {
    return {
      error: 'Parámetros inválidos',
      valido: false
    }
  }
  
  // Calcular monto total a pagar en cuotas
  const totalCuotas = cuotaMensual * numeroCuotas
  
  // Validación: el total de cuotas debe ser mayor que el pago inicial
  // (si no, no hay nada que financiar)
  if (totalCuotas <= pagoInicial) {
    return {
      error: 'El total de cuotas debe ser mayor que el pago inicial',
      valido: false
    }
  }
  
  // ENFOQUE SIMPLIFICADO Y CORRECTO:
  // El usuario define: pagoInicial, cuotaMensual, numeroCuotas
  // El sistema debe calcular: tasa, montoFinanciado, precioTotal
  //
  // La relación es:
  // - precioTotal = pagoInicial + montoFinanciado
  // - montoFinanciado = VP(cuotaMensual, tasa, numeroCuotas)
  //
  // Como el precio total no está definido, usamos un enfoque iterativo:
  // 1. Estimar monto financiado inicial (algo menos que totalCuotas por los intereses)
  // 2. Calcular tasa con ese monto
  // 3. Recalcular monto financiado con la tasa
  // 4. Iterar hasta convergencia
  
  // Estimación inicial del monto financiado
  // Si no hubiera intereses: montoFinanciado = totalCuotas
  // Con intereses: montoFinanciado < totalCuotas
  // Usamos una estimación conservadora: 85% del total
  let montoFinanciado = totalCuotas * 0.85
  let tasaMensual = 0
  let resultadoTasa = null
  const maxIteraciones = 30
  const tolerancia = 0.01  // Tolerancia de 1 centavo
  
  // Iterar hasta convergencia
  for (let iter = 0; iter < maxIteraciones; iter++) {
    // Calcular tasa mensual usando método híbrido
    resultadoTasa = calcularTasaMensualInversa(cuotaMensual, numeroCuotas, montoFinanciado)
    
    if (resultadoTasa.error) {
      // Si hay error, el monto financiado puede ser incorrecto
      // Intentar con un monto más pequeño
      if (iter < 5) {
        montoFinanciado = totalCuotas * (0.85 - iter * 0.05)
        continue
      } else {
        return {
          error: resultadoTasa.error,
          valido: false
        }
      }
    }
    
    tasaMensual = resultadoTasa.tasaMensual
    
    // Validar que la tasa sea válida
    if (tasaMensual <= 0 || isNaN(tasaMensual) || !isFinite(tasaMensual)) {
      return {
        error: 'No se pudo calcular una tasa de interés válida',
        valido: false
      }
    }
    
    // Recalcular monto financiado con la tasa encontrada
    const montoFinanciadoRecalculado = calcularValorPresente(cuotaMensual, tasaMensual, numeroCuotas)
    
    // Verificar convergencia
    const diferencia = Math.abs(montoFinanciadoRecalculado - montoFinanciado)
    
    if (diferencia < tolerancia) {
      // Convergencia alcanzada
      montoFinanciado = montoFinanciadoRecalculado
      break
    }
    
    // Actualizar monto financiado para siguiente iteración
    // Usar promedio ponderado para estabilidad
    montoFinanciado = 0.6 * montoFinanciado + 0.4 * montoFinanciadoRecalculado
    
    // Asegurar que el monto financiado sea razonable
    if (montoFinanciado <= 0) {
      montoFinanciado = totalCuotas * 0.5
    }
    if (montoFinanciado > totalCuotas) {
      montoFinanciado = totalCuotas * 0.95
    }
  }
  
  // Validar que tenemos una solución válida
  if (!resultadoTasa || resultadoTasa.error || tasaMensual <= 0) {
    return {
      error: 'No se pudo calcular la tasa de interés después de múltiples iteraciones',
      valido: false
    }
  }
  
  // Recalcular todo con la solución final para asegurar consistencia
  const montoFinanciadoFinal = calcularValorPresente(cuotaMensual, tasaMensual, numeroCuotas)
  const precioTotalFinal = pagoInicial + montoFinanciadoFinal
  
  // Validar que la tasa sea válida
  if (tasaMensual <= 0 || isNaN(tasaMensual) || !isFinite(tasaMensual)) {
    return {
      error: 'No se pudo calcular una tasa de interés válida',
      valido: false
    }
  }
  
  // Calcular porcentaje de inicial
  const porcentajeInicial = precioTotalFinal > 0 ? (pagoInicial / precioTotalFinal) * 100 : 0
  
  // Calcular tasa anual efectiva (TEA)
  const tasaAnualEfectiva = tasaMensualAAnual(tasaMensual)
  
  // Validar tasa razonable
  if (tasaAnualEfectiva > 200) {
    return {
      error: `La tasa calculada es extremadamente alta (${tasaAnualEfectiva.toFixed(2)}%). Verifique los montos ingresados.`,
      valido: false
    }
  }
  
  // Calcular total de intereses
  const totalIntereses = totalCuotas - montoFinanciadoFinal
  
  return {
    valido: true,
    pagoInicial: Math.round(pagoInicial * 100) / 100,
    cuotaMensual: Math.round(cuotaMensual * 100) / 100,
    numeroCuotas,
    montoFinanciado: Math.round(montoFinanciadoFinal * 100) / 100,
    precioTotal: Math.round(precioTotalFinal * 100) / 100,
    porcentajeInicial: Math.round(porcentajeInicial * 100) / 100,
    tasaMensual: Math.round(tasaMensual * 10000) / 10000,  // 4 decimales
    tasaAnualEfectiva: Math.round(tasaAnualEfectiva * 100) / 100,
    totalIntereses: Math.round(totalIntereses * 100) / 100,
    totalCuotas: Math.round(totalCuotas * 100) / 100,
    iteraciones: resultadoTasa.iteraciones,
    metodoCalculo: resultadoTasa.metodo
  }
}

/**
 * Calcula los días de atraso desde la fecha de vencimiento
 * @param {string|Date} fechaVencimiento - Fecha de vencimiento
 * @returns {number} Días de atraso (0 si no está vencida)
 */
export function calcularDiasAtraso(fechaVencimiento) {
  if (!fechaVencimiento) {
    return 0
  }
  
  const fechaVenc = new Date(fechaVencimiento)
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  fechaVenc.setHours(0, 0, 0, 0)

  const diffTime = hoy - fechaVenc
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  return Math.max(0, diffDays)
}

/**
 * Formatea el número de contrato
 * @param {number} empresaId - ID de la empresa
 * @param {number} secuencia - Número secuencial
 * @returns {string} Número de contrato formateado (ej: FIN-2025-00001)
 */
export function formatearNumeroContrato(empresaId, secuencia) {
  const año = new Date().getFullYear()
  const numero = String(secuencia).padStart(5, '0')
  return `FIN-${año}-${numero}`
}

/**
 * Formatea el número de recibo
 * @param {number} empresaId - ID de la empresa
 * @param {number} secuencia - Número secuencial
 * @returns {string} Número de recibo formateado (ej: REC-2025-00001)
 */
export function formatearNumeroRecibo(empresaId, secuencia) {
  const año = new Date().getFullYear()
  const numero = String(secuencia).padStart(5, '0')
  return `REC-${año}-${numero}`
}

/**
 * Distribuye un pago entre mora, interés y capital
 * @param {number} montoPago - Monto total del pago
 * @param {number} montoMoraPendiente - Mora pendiente
 * @param {number} montoInteresPendiente - Interés pendiente
 * @param {number} montoCapitalPendiente - Capital pendiente
 * @returns {Object} Distribución del pago
 */
export function distribuirPago(montoPago, montoMoraPendiente, montoInteresPendiente, montoCapitalPendiente) {
  let restante = montoPago
  const distribucion = {
    aplicado_mora: 0,
    aplicado_interes: 0,
    aplicado_capital: 0,
    aplicado_futuro: 0
  }

  // 1. Primero se paga la mora
  if (restante > 0 && montoMoraPendiente > 0) {
    distribucion.aplicado_mora = Math.min(restante, montoMoraPendiente)
    restante -= distribucion.aplicado_mora
  }

  // 2. Luego se paga el interés
  if (restante > 0 && montoInteresPendiente > 0) {
    distribucion.aplicado_interes = Math.min(restante, montoInteresPendiente)
    restante -= distribucion.aplicado_interes
  }

  // 3. Después se paga el capital
  if (restante > 0 && montoCapitalPendiente > 0) {
    distribucion.aplicado_capital = Math.min(restante, montoCapitalPendiente)
    restante -= distribucion.aplicado_capital
  }

  // 4. Lo que sobra va a pagos futuros
  if (restante > 0) {
    distribucion.aplicado_futuro = restante
  }

  // Redondear a 2 decimales
  distribucion.aplicado_mora = Math.round(distribucion.aplicado_mora * 100) / 100
  distribucion.aplicado_interes = Math.round(distribucion.aplicado_interes * 100) / 100
  distribucion.aplicado_capital = Math.round(distribucion.aplicado_capital * 100) / 100
  distribucion.aplicado_futuro = Math.round(distribucion.aplicado_futuro * 100) / 100

  return distribucion
}

