# Lógica de Creación de Planes de Financiamiento

## ⚠️ ACTUALIZACIÓN IMPORTANTE

**Este sistema ha sido refactorizado para separar planes comerciales de planes financieros.**

- **Planes Comerciales (1-4 meses)**: Pago diferido con recargo, SIN tasa de interés
- **Planes Financieros (5+ meses)**: Crédito con tasa de interés y amortización

Ver [GUIA_REFACTORIZACION.md](./GUIA_REFACTORIZACION.md) para detalles completos de la refactorización.

---

## Índice
1. [Visión General](#visión-general)
2. [Tipos de Planes](#tipos-de-planes)
3. [Arquitectura del Sistema](#arquitectura-del-sistema)
4. [Flujo de Creación](#flujo-de-creación)
5. [Componentes Principales](#componentes-principales)
6. [Cálculo de Planes](#cálculo-de-planes)
7. [Cálculos Financieros Detallados](#cálculos-financieros-detallados)
8. [Reglas de Negocio](#reglas-de-negocio)
9. [Validaciones](#validaciones)
10. [Persistencia de Datos](#persistencia-de-datos)
11. [Ejemplos Prácticos](#ejemplos-prácticos)

---

## Visión General

El sistema de creación de planes de financiamiento permite a los administradores definir planes con múltiples opciones de plazo. La característica principal es que **el usuario ingresa montos concretos** (pago inicial y cuota mensual) y **el sistema determina automáticamente el tipo de plan y calcula las métricas correspondientes**.

### Enfoque Híbrido

El sistema utiliza dos modelos según el plazo:

1. **Planes Comerciales (1-4 meses)**: Pago diferido con recargo
   - **Entrada**: Pago inicial, cuota mensual, plazo
   - **Salida**: Precio total, recargo, monto financiado
   - **NO calcula tasa de interés**

2. **Planes Financieros (5+ meses)**: Crédito con tasa de interés
   - **Entrada**: Pago inicial, cuota mensual, plazo
   - **Salida**: Tasa de interés, monto financiado, precio total, intereses

---

## Tipos de Planes

### Plan Comercial (Cash / Pago Diferido)

**Aplicación**: Plazos cortos (típicamente 1-4 meses)

**Características**:
- No tiene tasa de interés
- Usa recargo comercial (fijo o porcentaje)
- Precio final = Precio contado + Recargo
- Cuota = Precio financiado / Plazo

**Ejemplo**:
- Scooter: RD$ 40,000
- Plazo: 2 meses
- Recargo: RD$ 800 (fijo)
- Precio financiado: RD$ 40,800
- Cuota: RD$ 20,400

**Métricas mostradas**:
- ✅ Precio Total
- ✅ Recargo
- ✅ Cuota mensual
- ❌ Tasa de interés
- ❌ TEA

### Plan Financiero (Crédito)

**Aplicación**: Plazos largos (típicamente 5+ meses)

**Características**:
- Tiene tasa de interés mensual
- Usa amortización francesa
- Calcula intereses totales
- Puede mostrar TEA (solo si plazo ≥ 9 meses)

**Ejemplo**:
- Scooter: RD$ 40,000
- Plazo: 12 meses
- Pago inicial: 20% (RD$ 8,000)
- Cuota: RD$ 3,800
- Tasa calculada: 2.35% mensual (32.1% anual)

**Métricas mostradas**:
- ✅ Precio Total
- ✅ Tasa Mensual
- ✅ Total Intereses
- ✅ TEA (si plazo ≥ 9 meses)

---

## Arquitectura del Sistema

### Estructura de Archivos

```
_Pages/admin/planes/nuevo/
├── nuevo.js          # Componente React (UI y lógica del frontend)
├── servidor.js       # Server Action (lógica del backend)
└── nuevo.module.css  # Estilos

_Pages/admin/core/finance/
├── calculos.js              # Funciones de cálculo financiero (planes financieros)
├── calculosComerciales.js   # Funciones de cálculo comercial (planes comerciales)
└── PlanService.js           # Servicio de dominio (dispatcher automático)
```

### Separación de Responsabilidades

1. **Frontend (`nuevo.js`)**: 
   - Interfaz de usuario
   - Gestión de estado del formulario
   - Validaciones del lado del cliente
   - Cálculos en tiempo real para preview

2. **Backend (`servidor.js`)**:
   - Validaciones de negocio
   - Persistencia en base de datos
   - Transacciones atómicas

3. **Servicios de Dominio**:
   - `PlanService.js`: Dispatcher que determina tipo de plan y llama al cálculo correcto
   - `calculos.js`: Funciones matemáticas financieras (planes financieros)
   - `calculosComerciales.js`: Funciones de cálculo comercial (planes comerciales)

---

## Flujo de Creación

### 1. Inicialización del Componente

```javascript
// Estado principal del formulario
const [planForm, setPlanForm] = useState({
    codigo: '',              // Se genera automáticamente
    nombre: '',
    descripcion: '',
    monto_minimo: 0,
    monto_maximo: null,
    penalidad_mora_pct: 5.00,
    dias_gracia: 5,
    descuento_pago_anticipado_pct: 0,
    cuotas_minimas_anticipadas: 3,
    activo: true,
    permite_pago_anticipado: true,
    requiere_fiador: false
})

// Estado de plazos (array de opciones)
const [plazos, setPlazos] = useState([])
```

### 2. Generación Automática del Código

El código se genera automáticamente desde el nombre del plan:

```javascript
useEffect(() => {
    if (!codigoEditadoManualmente && planForm.nombre) {
        const nombreNormalizado = planForm.nombre
            .toUpperCase()
            .replace(/\s+/g, '_')      // Espacios a guiones bajos
            .replace(/[^A-Z0-9_]/g, '') // Solo letras, números y guiones bajos
            .replace(/_+/g, '_')        // Múltiples guiones a uno solo
            .replace(/^_|_$/g, '')      // Eliminar guiones al inicio/fin
            .slice(0, 15)               // Limitar longitud
        
        const codigoGenerado = `PLAN_${nombreNormalizado}`.slice(0, 20)
        setPlanForm(prev => ({ ...prev, codigo: codigoGenerado }))
    }
}, [planForm.nombre, codigoEditadoManualmente])
```

**Ejemplo**: 
- Nombre: "Plan Crédito Flexible"
- Código generado: `PLAN_CREDITO_FLEX`

---

## Componentes Principales

### 1. Modal de Configuración de Plazos

El modal permite agregar/editar opciones de plazo. Cada plazo tiene:

- **Plazo en meses**: Entre 1 y 60 meses
- **Tipo de pago inicial**: 
  - `PORCENTAJE`: Porcentaje del precio total (ej: 15%)
  - `MONTO`: Monto fijo en pesos (ej: RD$ 5,000)
- **Valor del pago inicial**: El valor según el tipo seleccionado
- **Cuota mensual**: Monto fijo de cada cuota
- **Es sugerido**: Flag para marcar como opción recomendada

#### Estado del Modal

```javascript
const [modalPlazoDraft, setModalPlazoDraft] = useState({
    plazo_meses: 12,
    tipo_pago_inicial: 'PORCENTAJE',
    pago_inicial_valor: 15.00,
    cuota_mensual: '',
    es_sugerido: false
})
```

### 2. Presets Rápidos

El sistema ofrece botones de acceso rápido para plazos comunes (6, 12, 18, 24, 36 meses) con valores sugeridos pre-calculados:

```javascript
const abrirModalConPreset = (meses) => {
    let pagoInicialPct = 15.00
    let cuotaMensualSugerida = ''
    
    if (meses <= 6) {
        pagoInicialPct = 25.00
        cuotaMensualSugerida = 6500
    } else if (meses <= 12) {
        pagoInicialPct = 20.00
        cuotaMensualSugerida = 3800
    } else if (meses <= 18) {
        pagoInicialPct = 18.00
        cuotaMensualSugerida = 2600
    } else if (meses <= 24) {
        pagoInicialPct = 15.00
        cuotaMensualSugerida = 2000
    } else if (meses <= 36) {
        pagoInicialPct = 12.00
        cuotaMensualSugerida = 1500
    } else {
        pagoInicialPct = 10.00
        cuotaMensualSugerida = 1200
    }
    
    // Abrir modal con valores prellenados
    setModalPlazoDraft({
        plazo_meses: meses,
        tipo_pago_inicial: 'PORCENTAJE',
        pago_inicial_valor: pagoInicialPct,
        cuota_mensual: cuotaMensualSugerida,
        es_sugerido: false
    })
}
```

---

## Cálculo de Planes

### Dispatcher Automático

El sistema determina automáticamente el tipo de plan según el plazo:

```javascript
// En PlanService.calcularPlazo()
const tipoPlan = politica?.tipo_calculo || this.determinarTipoPlan(plazoMeses)

if (tipoPlan === 'COMERCIAL') {
    return this.calcularPlazoComercial(datosPlazo, politica)
} else {
    return this.calcularPlazoFinanciero(datosPlazo)
}
```

### Plan Comercial: Cálculo con Recargo

Para plazos ≤ 4 meses, el sistema calcula usando recargo:

```javascript
// calcularPlanComercialInverso()
const totalCuotas = cuotaMensual * plazoMeses
const precioFinanciado = pagoInicial + totalCuotas

// Si hay recargo de política:
if (recargoTipo === 'FIJO') {
    recargo = recargoValor
} else if (recargoTipo === 'PORCENTAJE') {
    recargo = precioContado * (recargoValor / 100)
}

// NO se calcula tasa
```

**Resultado**:
- `tipo_plan: 'COMERCIAL'`
- `precio_financiado`: Precio total
- `recargo`: Monto del recargo
- `tasa_anual_calculada: null`
- `mostrar_tasa: false`

### Plan Financiero: Cálculo de Tasa Inversa

Para plazos ≥ 5 meses, el sistema calcula la tasa usando el método inverso:

## Cálculo de Tasas de Interés (Solo Planes Financieros)

### Algoritmo de Cálculo Inverso

El cálculo se realiza mediante el método **"flujo inverso"** implementado en `calcularPlanInverso()`:

#### Entrada
- `pagoInicial`: Monto del pago inicial
- `cuotaMensual`: Monto de cada cuota
- `numeroCuotas`: Número de cuotas

#### Proceso Iterativo

1. **Validaciones iniciales**:
   ```javascript
   if (pagoInicial < 0 || cuotaMensual <= 0 || numeroCuotas <= 0) {
       return { error: 'Parámetros inválidos', valido: false }
   }
   
   const totalCuotas = cuotaMensual * numeroCuotas
   if (totalCuotas <= pagoInicial) {
       return { error: 'El total de cuotas debe ser mayor que el pago inicial', valido: false }
   }
   ```

2. **Estimación inicial del monto financiado**:
   ```javascript
   // Estimación conservadora: 85% del total de cuotas
   let montoFinanciado = totalCuotas * 0.85
   ```

3. **Iteración hasta convergencia** (máximo 30 iteraciones):
   ```javascript
   for (let iter = 0; iter < maxIteraciones; iter++) {
       // Calcular tasa mensual usando método híbrido (Bisección + Newton-Raphson)
       resultadoTasa = calcularTasaMensualInversa(cuotaMensual, numeroCuotas, montoFinanciado)
       
       // Recalcular monto financiado con la tasa encontrada
       const montoFinanciadoRecalculado = calcularValorPresente(cuotaMensual, tasaMensual, numeroCuotas)
       
       // Verificar convergencia (tolerancia de 1 centavo)
       const diferencia = Math.abs(montoFinanciadoRecalculado - montoFinanciado)
       if (diferencia < tolerancia) {
           break // Convergencia alcanzada
       }
       
       // Actualizar monto financiado para siguiente iteración (promedio ponderado)
       montoFinanciado = 0.6 * montoFinanciado + 0.4 * montoFinanciadoRecalculado
   }
   ```

4. **Cálculo de valores finales**:
   ```javascript
   const montoFinanciadoFinal = calcularValorPresente(cuotaMensual, tasaMensual, numeroCuotas)
   const precioTotalFinal = pagoInicial + montoFinanciadoFinal
   const porcentajeInicial = (pagoInicial / precioTotalFinal) * 100
   const tasaAnualEfectiva = tasaMensualAAnual(tasaMensual)
   const totalIntereses = totalCuotas - montoFinanciadoFinal
   ```

#### Fórmulas Utilizadas

**Valor Presente de una Anualidad**:
```
VP = Cuota × [(1 + r)^n - 1] / [r × (1 + r)^n]
```
Donde:
- `VP`: Valor presente (monto financiado)
- `Cuota`: Cuota mensual
- `r`: Tasa de interés mensual
- `n`: Número de cuotas

**Tasa Anual Efectiva (TEA)**:
```
TEA = (1 + r_mensual)^12 - 1
```

### Cálculo en Tiempo Real (Frontend)

El sistema calcula la tasa automáticamente mientras el usuario completa el formulario del modal, con un debounce de 400ms:

```javascript
useEffect(() => {
    if (!modalPlazoAbierto) return
    
    const draft = modalPlazoDraft
    const plazoMeses = Number(draft.plazo_meses)
    const cuotaMensual = Number(draft.cuota_mensual)
    const pagoInicialValor = Number(draft.pago_inicial_valor)
    
    if (plazoMeses > 0 && cuotaMensual > 0 && pagoInicialValor > 0) {
        setCalculandoModal(true)
        
        const timeoutId = setTimeout(() => {
            // Calcular pago inicial real según el tipo
            let pagoInicialReal = 0
            if (draft.tipo_pago_inicial === 'PORCENTAJE') {
                // Estimación inicial del precio
                const precioEstimadoInicial = cuotaMensual * plazoMeses * 1.3
                pagoInicialReal = precioEstimadoInicial * (pagoInicialValor / 100)
            } else {
                pagoInicialReal = pagoInicialValor
            }
            
            // Calcular tasa
            const resultado = calcularPlanInverso(
                pagoInicialReal,
                cuotaMensual,
                plazoMeses
            )
            
            if (resultado.valido) {
                // Calcular valores adicionales para mostrar
                const tasaMensual = resultado.tasaMensual
                const factor = Math.pow(1 + tasaMensual, plazoMeses)
                const valorPresente = cuotaMensual * ((factor - 1) / (tasaMensual * factor))
                const montoFinanciado = valorPresente
                
                // Recalcular precio total y pago inicial si es porcentaje
                let precioTotal = 0
                if (draft.tipo_pago_inicial === 'PORCENTAJE') {
                    precioTotal = montoFinanciado / (1 - (pagoInicialValor / 100))
                    pagoInicialReal = precioTotal * (pagoInicialValor / 100)
                } else {
                    precioTotal = pagoInicialReal + montoFinanciado
                }
                
                // Calcular total de intereses usando amortización francesa
                const amortizacion = calcularAmortizacionFrancesa(
                    montoFinanciado,
                    tasaMensual,
                    plazoMeses
                )
                
                // Determinar si la tasa está en rango esperado (20-50% anual)
                const tasaAnual = resultado.tasaAnualEfectiva
                const tasaEnRango = tasaAnual >= 20 && tasaAnual <= 50
                
                setResultadoCalculoModal({
                    valido: true,
                    tasa_anual_calculada: tasaAnual,
                    tasa_mensual_calculada: tasaMensual,
                    precio_total: precioTotal,
                    monto_financiado: montoFinanciado,
                    total_intereses: amortizacion.totalIntereses,
                    porcentaje_inicial: (pagoInicialReal / precioTotal) * 100,
                    tasa_en_rango: tasaEnRango,
                    mensaje_rango: tasaEnRango 
                        ? `Este plan tiene una tasa dentro del rango esperado (${tasaAnual.toFixed(2)}%).`
                        : `Advertencia: La tasa calculada (${tasaAnual.toFixed(2)}%) está fuera del rango típico (20-50%).`
                })
            }
        }, 400) // Debounce
        
        return () => clearTimeout(timeoutId)
    }
}, [modalPlazoDraft, modalPlazoAbierto])
```

### Manejo de Pago Inicial como Porcentaje

Cuando el pago inicial es un porcentaje, el sistema debe calcular el precio total primero:

1. **Estimación inicial**: 
   ```javascript
   precioEstimado = cuotaMensual * plazoMeses * 1.3
   pagoInicialReal = precioEstimado * (porcentaje / 100)
   ```

2. **Cálculo de tasa** con el pago inicial estimado

3. **Recálculo del precio total**:
   ```javascript
   precioTotal = montoFinanciado / (1 - porcentaje/100)
   pagoInicialReal = precioTotal * (porcentaje / 100)
   ```

---

## Cálculos Financieros Detallados

### Método Francés de Amortización

El sistema utiliza el **método francés** (también conocido como sistema de amortización constante o cuota fija) para calcular las cuotas. Este método garantiza que todas las cuotas sean del mismo monto, pero la proporción entre capital e interés varía en cada período.

#### Fórmula de la Cuota Mensual

```
Cuota = P × [r(1+r)^n] / [(1+r)^n - 1]
```

Donde:
- `P`: Monto financiado (capital)
- `r`: Tasa de interés mensual (ej: 0.015 para 1.5%)
- `n`: Número de cuotas

#### Implementación

```javascript
export function calcularAmortizacionFrancesa(monto, tasaMensual, cuotas) {
  // Caso especial: tasa 0% (sin intereses)
  if (tasaMensual === 0) {
    const cuotaMensual = monto / cuotas
    // Generar cronograma sin intereses
    return { cuotaMensual, totalIntereses: 0, cronograma: [...] }
  }
  
  // Fórmula del método francés
  const factor = Math.pow(1 + tasaMensual, cuotas)
  const cuotaMensual = monto * (tasaMensual * factor) / (factor - 1)
  
  // Generar cronograma mes a mes
  let saldoRestante = monto
  const cronograma = []
  
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
  
  return {
    cuotaMensual: Math.round(cuotaMensual * 100) / 100,
    totalIntereses: cronograma.reduce((sum, c) => sum + c.interes, 0),
    cronograma
  }
}
```

#### Características del Método Francés

1. **Cuota constante**: Todas las cuotas son del mismo monto
2. **Interés decreciente**: El interés disminuye en cada período
3. **Capital creciente**: El capital amortizado aumenta en cada período
4. **Saldo decreciente**: El saldo pendiente disminuye progresivamente

**Ejemplo de cronograma** (RD$ 40,000 a 12 meses, 2.5% mensual):
- Cuota fija: RD$ 3,800
- Mes 1: Interés RD$ 1,000, Capital RD$ 2,800, Saldo RD$ 37,200
- Mes 2: Interés RD$ 930, Capital RD$ 2,870, Saldo RD$ 34,330
- ... (el interés disminuye, el capital aumenta)

### Cálculo del Valor Presente

El valor presente (VP) representa el monto financiado equivalente a una serie de pagos futuros, descontados a una tasa de interés específica.

#### Fórmula

```
VP = C × [(1 - (1 + r)^(-n)) / r]
```

Donde:
- `C`: Cuota mensual
- `r`: Tasa de interés mensual
- `n`: Número de cuotas

#### Implementación

```javascript
export function calcularValorPresente(cuota, tasaMensual, numeroCuotas) {
  if (cuota <= 0 || numeroCuotas <= 0) return 0
  
  // Si tasa es 0, valor presente es simplemente cuota * número de cuotas
  if (tasaMensual === 0) {
    return cuota * numeroCuotas
  }
  
  // Fórmula: VP = C × [(1 - (1 + r)^(-n)) / r]
  const factor = (1 - Math.pow(1 + tasaMensual, -numeroCuotas)) / tasaMensual
  return cuota * factor
}
```

### Conversión de Tasas

#### Tasa Mensual a Tasa Anual Efectiva (TEA)

```
TEA = ((1 + r_mensual)^12 - 1) × 100
```

**Ejemplo**: 
- Tasa mensual: 2.5% (0.025)
- TEA = ((1.025)^12 - 1) × 100 = 34.49%

#### Tasa Anual a Tasa Mensual

```
r_mensual = tasa_anual / 12 / 100
```

**Nota**: Esta es una aproximación. La fórmula exacta sería:
```
r_mensual = (1 + tasa_anual/100)^(1/12) - 1
```

### Método Híbrido de Cálculo de Tasa Inversa

El sistema utiliza un **método híbrido** que combina Bisección (garantiza convergencia) con Newton-Raphson (acelera la convergencia).

#### Algoritmo

```javascript
export function calcularTasaMensualInversa(cuotaMensual, numeroCuotas, montoFinanciado) {
  // Función objetivo: f(r) = VP(cuota, r, n) - montoFinanciado
  // Buscamos r tal que f(r) = 0
  
  function f(r) {
    return calcularValorPresente(cuotaMensual, r, numeroCuotas) - montoFinanciado
  }
  
  // Función derivada para Newton-Raphson
  function fDerivada(r) {
    return calcularDerivadaValorPresente(cuotaMensual, r, numeroCuotas)
  }
  
  // Rango inicial para bisección
  let rMin = 0.000001  // ~0% mensual
  let rMax = 0.15      // 15% mensual (límite duro)
  
  // Inicializar con punto medio
  let r = (rMin + rMax) / 2
  const tolerancia = 1e-8  // Precisión: 0.000001%
  const maxIteraciones = 100
  
  // Algoritmo híbrido
  for (let i = 0; i < maxIteraciones; i++) {
    const fr = f(r)
    
    // Verificar convergencia
    if (Math.abs(fr) < tolerancia) {
      return { tasaMensual: r, iteraciones: i + 1, metodo: 'hibrido' }
    }
    
    // Intentar Newton-Raphson si es seguro
    const deriv = fDerivada(r)
    
    if (Math.abs(deriv) > 1e-10 && !isNaN(deriv) && isFinite(deriv)) {
      const rNewton = r - fr / deriv
      
      // Solo usar Newton si está dentro del rango
      if (rNewton > rMin && rNewton < rMax && rNewton > 0) {
        r = rNewton
        metodoUsado = 'hibrido'
      } else {
        // Si Newton se sale del rango, usar bisección
        r = (rMin + rMax) / 2
        metodoUsado = 'biseccion'
      }
    } else {
      // Derivada muy pequeña, usar bisección
      r = (rMin + rMax) / 2
      metodoUsado = 'biseccion'
    }
    
    // Actualizar intervalo para bisección
    const frActual = f(r)
    if (frActual > 0) {
      rMin = r
    } else {
      rMax = r
    }
    
    // Asegurar que r esté en el rango válido
    r = Math.max(rMin + 1e-10, Math.min(rMax - 1e-10, r))
  }
  
  return { tasaMensual: r, iteraciones, metodo: metodoUsado }
}
```

#### Ventajas del Método Híbrido

1. **Convergencia garantizada**: La bisección asegura que siempre se encuentre la solución
2. **Velocidad**: Newton-Raphson acelera la convergencia cuando es seguro usarlo
3. **Robustez**: Si Newton-Raphson falla, automáticamente vuelve a bisección
4. **Precisión**: Tolerancia de 1e-8 (0.000001%)

**Rendimiento típico**:
- Bisección pura: 35-45 iteraciones
- Método híbrido: 8-15 iteraciones
- Reducción: ~70% menos iteraciones

### Derivada del Valor Presente

Para Newton-Raphson, necesitamos la derivada de la función de valor presente:

```
f'(r) = C × [n(1+r)^(-n-1) × r - (1 - (1+r)^(-n))] / r²
```

#### Implementación

```javascript
export function calcularDerivadaValorPresente(cuota, tasaMensual, numeroCuotas) {
  if (tasaMensual === 0 || numeroCuotas <= 0) return 0
  
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
```

### Cálculo de Mora

La mora se calcula cuando una cuota está vencida y se exceden los días de gracia.

#### Fórmula

```
Mora = (MontoCuota × TasaMora / 30) × DíasMora
```

Donde:
- `DíasMora = DíasAtraso - DíasGracia` (si DíasAtraso > DíasGracia)
- Si `DíasAtraso <= DíasGracia`, entonces `Mora = 0`

#### Implementación

```javascript
export function calcularMora(montoCuota, diasAtraso, tasaMora, diasGracia = 5) {
  if (diasAtraso <= diasGracia) {
    return 0
  }
  
  const diasMora = diasAtraso - diasGracia
  const moraDiaria = (montoCuota * tasaMora) / 30 // Tasa mensual dividida por 30 días
  const moraTotal = moraDiaria * diasMora
  
  return Math.round(moraTotal * 100) / 100
}
```

**Ejemplo**:
- Cuota: RD$ 3,800
- Días de atraso: 10
- Días de gracia: 5
- Tasa de mora: 5% mensual
- Días de mora: 10 - 5 = 5 días
- Mora diaria: (3,800 × 0.05) / 30 = RD$ 6.33
- Mora total: 6.33 × 5 = RD$ 31.67

### Distribución de Pagos

Cuando un cliente realiza un pago, el sistema distribuye el monto en el siguiente orden:

1. **Mora pendiente** (primero)
2. **Interés pendiente** (segundo)
3. **Capital pendiente** (tercero)
4. **Pagos futuros** (lo que sobra)

#### Implementación

```javascript
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
  
  return distribucion
}
```

### Generación de Cronograma de Fechas

El sistema genera automáticamente las fechas de vencimiento de las cuotas, manejando correctamente meses con diferentes números de días (28, 30, 31).

#### Implementación

```javascript
export function generarCronogramaFechas(fechaPrimerPago, numeroCuotas, diaPagoMensual = null, diasGracia = 5) {
  const cronograma = []
  const fechaBase = new Date(fechaPrimerPago)
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
      fechaFinGracia: fechaFinGracia.toISOString().split('T')[0]
    })
  }
  
  return cronograma
}

function ajustarDiaMes(fecha, diaDeseado) {
  const fechaAjustada = new Date(fecha)
  const ultimoDia = new Date(
    fechaAjustada.getFullYear(),
    fechaAjustada.getMonth() + 1,
    0
  ).getDate()
  
  fechaAjustada.setDate(Math.min(diaDeseado, ultimoDia))
  return fechaAjustada
}
```

**Ejemplo**: Si el primer pago es el 31 de enero y el día de pago es 31:
- Enero: 31 de enero ✓
- Febrero: 28 de febrero (ajustado, febrero no tiene día 31) ✓
- Marzo: 31 de marzo ✓

---

## Reglas de Negocio

### Constantes de Reglas de Negocio

El sistema define constantes centralizadas para todas las reglas de negocio:

```javascript
export const REGLAS_NEGOCIO = {
  // Tasas de interés
  TASA_INTERES_MINIMA: 0,
  TASA_INTERES_MAXIMA: 100,  // 100% anual máximo
  
  // Plazos
  PLAZO_MINIMO_MESES: 1,
  PLAZO_MAXIMO_MESES: 60,  // 5 años máximo
  
  // Pagos iniciales
  PAGO_INICIAL_MINIMO_PCT: 0,
  PAGO_INICIAL_MAXIMO_PCT: 100,  // 100% máximo
  
  // Mora y penalidades
  TASA_MORA_MINIMA: 0,
  TASA_MORA_MAXIMA: 100,  // 100% mensual máximo
  DIAS_GRACIA_MINIMOS: 0,
  DIAS_GRACIA_MAXIMOS: 30,  // 30 días máximo
  
  // Montos
  MONTO_MINIMO_FINANCIABLE: 100,  // RD$ 100 mínimo
  MONTO_MAXIMO_FINANCIABLE: 10000000,  // RD$ 10,000,000 máximo
  
  // Scoring crediticio
  SCORE_MINIMO: 0,
  SCORE_MAXIMO: 100,
  SCORE_CLASIFICACION_A: 90,  // 90-100: Clasificación A
  SCORE_CLASIFICACION_B: 75,  // 75-89: Clasificación B
  SCORE_CLASIFICACION_C: 50,  // 50-74: Clasificación C
  // < 50: Clasificación D
  
  // Contratos
  MAX_CONTRATOS_ACTIVOS_POR_CLIENTE: 20,
  
  // Descuentos
  DESCUENTO_PAGO_ANTICIPADO_MINIMO: 0,
  DESCUENTO_PAGO_ANTICIPADO_MAXIMO: 50,  // 50% máximo
  CUOTAS_MINIMAS_PARA_DESCUENTO: 3
}
```

### Reglas de Validación

#### Validación de Tasa de Interés

```javascript
export function validarTasaInteres(tasa) {
  if (typeof tasa !== 'number' || isNaN(tasa)) {
    return { valido: false, error: 'La tasa de interés debe ser un número válido' }
  }
  
  if (tasa < REGLAS_NEGOCIO.TASA_INTERES_MINIMA) {
    return { valido: false, error: 'La tasa de interés no puede ser negativa' }
  }
  
  if (tasa > REGLAS_NEGOCIO.TASA_INTERES_MAXIMA) {
    return { valido: false, error: `La tasa de interés no puede ser mayor a ${REGLAS_NEGOCIO.TASA_INTERES_MAXIMA}%` }
  }
  
  return { valido: true }
}
```

**Reglas**:
- Debe ser un número válido
- No puede ser negativa
- Máximo 100% anual

#### Validación de Plazo

```javascript
export function validarPlazo(plazo) {
  if (typeof plazo !== 'number' || isNaN(plazo)) {
    return { valido: false, error: 'El plazo debe ser un número válido' }
  }
  
  if (plazo < REGLAS_NEGOCIO.PLAZO_MINIMO_MESES) {
    return { valido: false, error: `El plazo mínimo es ${REGLAS_NEGOCIO.PLAZO_MINIMO_MESES} mes` }
  }
  
  if (plazo > REGLAS_NEGOCIO.PLAZO_MAXIMO_MESES) {
    return { valido: false, error: `El plazo máximo es ${REGLAS_NEGOCIO.PLAZO_MAXIMO_MESES} meses` }
  }
  
  if (!Number.isInteger(plazo)) {
    return { valido: false, error: 'El plazo debe ser un número entero de meses' }
  }
  
  return { valido: true }
}
```

**Reglas**:
- Debe ser un número entero
- Mínimo: 1 mes
- Máximo: 60 meses (5 años)

#### Validación de Tasa de Mora

```javascript
export function validarTasaMora(tasaMora) {
  if (typeof tasaMora !== 'number' || isNaN(tasaMora)) {
    return { valido: false, error: 'La tasa de mora debe ser un número válido' }
  }
  
  if (tasaMora < REGLAS_NEGOCIO.TASA_MORA_MINIMA) {
    return { valido: false, error: 'La tasa de mora no puede ser negativa' }
  }
  
  if (tasaMora > REGLAS_NEGOCIO.TASA_MORA_MAXIMA) {
    return { valido: false, error: `La tasa de mora no puede ser mayor a ${REGLAS_NEGOCIO.TASA_MORA_MAXIMA}%` }
  }
  
  return { valido: true }
}
```

**Reglas**:
- Debe ser un número válido
- No puede ser negativa
- Máximo 100% mensual

#### Validación de Días de Gracia

```javascript
export function validarDiasGracia(diasGracia) {
  if (typeof diasGracia !== 'number' || isNaN(diasGracia)) {
    return { valido: false, error: 'Los días de gracia deben ser un número válido' }
  }
  
  if (diasGracia < REGLAS_NEGOCIO.DIAS_GRACIA_MINIMOS) {
    return { valido: false, error: `Los días de gracia no pueden ser menores a ${REGLAS_NEGOCIO.DIAS_GRACIA_MINIMOS}` }
  }
  
  if (diasGracia > REGLAS_NEGOCIO.DIAS_GRACIA_MAXIMOS) {
    return { valido: false, error: `Los días de gracia no pueden ser mayores a ${REGLAS_NEGOCIO.DIAS_GRACIA_MAXIMOS}` }
  }
  
  if (!Number.isInteger(diasGracia)) {
    return { valido: false, error: 'Los días de gracia deben ser un número entero' }
  }
  
  return { valido: true }
}
```

**Reglas**:
- Debe ser un número entero
- Mínimo: 0 días
- Máximo: 30 días

#### Validación de Monto Financiable

```javascript
export function validarMontoFinanciable(monto) {
  if (typeof monto !== 'number' || isNaN(monto)) {
    return { valido: false, error: 'El monto debe ser un número válido' }
  }
  
  if (monto <= 0) {
    return { valido: false, error: 'El monto debe ser mayor a cero' }
  }
  
  if (monto < REGLAS_NEGOCIO.MONTO_MINIMO_FINANCIABLE) {
    return { valido: false, error: `El monto mínimo financiable es ${REGLAS_NEGOCIO.MONTO_MINIMO_FINANCIABLE}` }
  }
  
  if (monto > REGLAS_NEGOCIO.MONTO_MAXIMO_FINANCIABLE) {
    return { valido: false, error: `El monto máximo financiable es ${REGLAS_NEGOCIO.MONTO_MAXIMO_FINANCIABLE}` }
  }
  
  return { valido: true }
}
```

**Reglas**:
- Debe ser un número válido
- Debe ser mayor a cero
- Mínimo: RD$ 100
- Máximo: RD$ 10,000,000

#### Validación de Pago Inicial

```javascript
export function validarMontoInicial(montoTotal, montoInicial, porcentajeMinimo) {
  if (montoInicial < 0) {
    return { valido: false, error: 'El monto inicial no puede ser negativo' }
  }
  
  if (montoInicial > montoTotal) {
    return { valido: false, error: 'El monto inicial no puede ser mayor al monto total' }
  }
  
  const minimoRequerido = (montoTotal * porcentajeMinimo) / 100
  const porcentajeActual = (montoInicial / montoTotal) * 100
  
  if (montoInicial < minimoRequerido) {
    return {
      valido: false,
      error: `El pago inicial mínimo es ${minimoRequerido.toFixed(2)} (${porcentajeMinimo}%)`,
      minimoRequerido
    }
  }
  
  return { valido: true, minimoRequerido }
}
```

**Reglas**:
- No puede ser negativo
- No puede ser mayor al monto total
- Debe cumplir con el porcentaje mínimo requerido por el plan

### Reglas de Coherencia

#### Coherencia entre Plazos

El sistema valida que los plazos sean coherentes entre sí:

```javascript
static validarCoherenciaPlazo(plazo, otrosPlazos) {
  const warnings = []
  
  // Regla: Plazo mayor → cuota menor (normalmente)
  const plazosMenores = otrosPlazos.filter(p => 
    p.plazo_meses < plazo.plazo_meses && p.activo !== false
  )
  
  for (const plazoMenor of plazosMenores) {
    if (plazo.cuota_mensual > plazoMenor.cuota_mensual) {
      warnings.push(
        `Advertencia: El plazo de ${plazo.plazo_meses} meses tiene una cuota mayor ` +
        `(${plazo.cuota_mensual}) que el plazo de ${plazoMenor.plazo_meses} meses ` +
        `(${plazoMenor.cuota_mensual}). Normalmente, plazos mayores deberían tener cuotas menores.`
      )
    }
  }
  
  return { valido: true, warnings }  // Warnings no invalidan el plazo
}
```

**Regla de negocio**: Normalmente, un plazo mayor debería tener una cuota menor. Si esto no se cumple, se genera una advertencia (no un error).

#### Validación de Duplicados

```javascript
static validarDuplicados(plazo, otrosPlazos, excluirIndice = null) {
  const duplicado = otrosPlazos.find((p, i) => 
    i !== excluirIndice && 
    p.plazo_meses === plazo.plazo_meses &&
    p.activo !== false
  )
  
  if (duplicado) {
    return {
      valido: false,
      error: `Ya existe un plazo de ${plazo.plazo_meses} meses en este plan`
    }
  }
  
  return { valido: true }
}
```

**Regla de negocio**: No puede haber dos plazos con el mismo número de meses en un mismo plan.

### Reglas de Cálculo de Tasa

#### Validación de Tasa Calculada

El sistema valida que la tasa calculada sea razonable:

```javascript
// En calcularPlanInverso()
if (tasaAnualEfectiva > 200) {
  return {
    error: `La tasa calculada es extremadamente alta (${tasaAnualEfectiva.toFixed(2)}%). Verifique los montos ingresados.`,
    valido: false
  }
}
```

**Regla de negocio**: Si la tasa anual calculada supera el 200%, se rechaza el cálculo y se solicita al usuario verificar los montos.

#### Rango Esperado de Tasas

El sistema muestra advertencias cuando la tasa está fuera del rango típico:

```javascript
// Rango esperado: 20-50% anual
const tasaEnRango = tasaAnual >= 20 && tasaAnual <= 50

if (!tasaEnRango) {
  mensaje_rango = `Advertencia: La tasa calculada (${tasaAnual.toFixed(2)}%) está fuera del rango típico (20-50%).`
}
```

**Regla de negocio**: Aunque no es un error, se advierte al usuario si la tasa está fuera del rango comercial típico (20-50% anual).

### Reglas de Validación de Plan Completo

```javascript
export function validarPlanFinanciamiento(plan, monto, inicial) {
  const errores = []
  
  // Validar monto mínimo
  if (plan.monto_minimo && monto < plan.monto_minimo) {
    errores.push(`El monto mínimo financiable es ${plan.monto_minimo}`)
  }
  
  // Validar monto máximo
  if (plan.monto_maximo && monto > plan.monto_maximo) {
    errores.push(`El monto máximo financiable es ${plan.monto_maximo}`)
  }
  
  // Validar pago inicial mínimo
  const validacionInicial = validarMontoInicial(monto, inicial, plan.pago_inicial_minimo_pct || 0)
  if (!validacionInicial.valido) {
    errores.push(validacionInicial.error)
  }
  
  return {
    valido: errores.length === 0,
    errores
  }
}
```

**Reglas aplicadas al usar un plan**:
1. El monto debe estar entre el mínimo y máximo del plan
2. El pago inicial debe cumplir con el porcentaje mínimo requerido

### Reglas de Scoring Crediticio

El sistema calcula un score crediticio (0-100) basado en múltiples factores:

```javascript
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
  if (usageRatio < 0.3) usageScore = 20
  else if (usageRatio < 0.7) usageScore = 15
  else if (usageRatio < 0.9) usageScore = 10
  else usageScore = 5
  
  score = score - 20 + usageScore
  
  // Factor 4: Antigüedad (10 puntos)
  if (cliente.fecha_creacion) {
    const mesesDiff = calcularMesesDesdeCreacion(cliente.fecha_creacion)
    const seniorityScore = Math.min((mesesDiff / 12) * 10, 10)
    score = score - 10 + seniorityScore
  }
  
  // Factor 5: Créditos vencidos actuales (-50 puntos máx)
  const creditosVencidos = cliente.total_creditos_vencidos || 0
  const overduePenalty = Math.min(creditosVencidos * 25, 50)
  score -= overduePenalty
  
  // Normalizar entre 0 y 100
  score = Math.max(0, Math.min(100, Math.round(score)))
  
  // Clasificación
  let clasificacion = 'D'
  if (score >= 90) clasificacion = 'A'
  else if (score >= 75) clasificacion = 'B'
  else if (score >= 50) clasificacion = 'C'
  
  return { score, clasificacion }
}
```

**Factores del Score**:
1. **Historial de pagos** (40 puntos): Porcentaje de créditos pagados a tiempo
2. **Días promedio de atraso** (-30 puntos máx): Penalización por atrasos
3. **Uso de crédito** (20 puntos): Relación entre saldo utilizado y límite
4. **Antigüedad** (10 puntos): Tiempo como cliente
5. **Créditos vencidos** (-50 puntos máx): Penalización por créditos actualmente vencidos

**Clasificaciones**:
- **A**: 90-100 puntos
- **B**: 75-89 puntos
- **C**: 50-74 puntos
- **D**: < 50 puntos

---

## Validaciones

### Validaciones del Frontend

#### Validación del Formulario Principal

```javascript
const guardarPlan = async () => {
    // Validaciones básicas
    if (!planForm.nombre) {
        alert('El nombre del plan es obligatorio')
        return
    }
    
    if (plazos.length === 0) {
        alert('Debe configurar al menos una opción de plazo')
        return
    }
}
```

#### Validación del Modal de Plazos

```javascript
const validarPlazoModal = () => {
    const errores = []
    const plazoMeses = Number(modalPlazoDraft.plazo_meses)
    const pagoInicialValor = Number(modalPlazoDraft.pago_inicial_valor)
    const cuotaMensual = Number(modalPlazoDraft.cuota_mensual)
    
    // Validar plazo
    if (!modalPlazoDraft.plazo_meses || isNaN(plazoMeses) || plazoMeses < 1 || plazoMeses > 60) {
        errores.push('El plazo debe estar entre 1 y 60 meses')
    }
    
    // Validar pago inicial
    if (!modalPlazoDraft.pago_inicial_valor || isNaN(pagoInicialValor) || pagoInicialValor <= 0) {
        errores.push('El valor del pago inicial debe ser mayor a 0')
    }
    
    // Validar porcentaje máximo
    if (modalPlazoDraft.tipo_pago_inicial === 'PORCENTAJE' && pagoInicialValor > 100) {
        errores.push('El porcentaje de pago inicial no puede ser mayor a 100%')
    }
    
    // Validar cuota mensual
    if (!modalPlazoDraft.cuota_mensual || isNaN(cuotaMensual) || cuotaMensual <= 0) {
        errores.push('La cuota mensual debe ser mayor a 0')
    }
    
    // Validar duplicados
    if (!isNaN(plazoMeses)) {
        const existeDuplicado = plazos.some((p, i) => 
            i !== modalPlazoEditando && 
            Number(p.plazo_meses) === plazoMeses
        )
        if (existeDuplicado) {
            errores.push(`Ya existe un plazo de ${plazoMeses} meses`)
        }
    }
    
    return { valido: errores.length === 0, errores }
}
```

### Validaciones del Backend

#### Validaciones en `servidor.js`

```javascript
export async function crearPlanFinanciamiento(datos) {
    // 1. Validar sesión
    if (!empresaId || !userId) {
        return { success: false, mensaje: 'Sesión inválida' }
    }
    
    // 2. Validar nombre
    if (!datos.nombre) {
        return { success: false, mensaje: 'El nombre del plan es obligatorio' }
    }
    
    // 3. Validar que haya al menos un plazo
    if (!datos.plazos || datos.plazos.length === 0) {
        return { success: false, mensaje: 'Debe configurar al menos una opción de plazo' }
    }
    
    // 4. Validar plazos duplicados
    const plazosMeses = datos.plazos.map(p => p.plazo_meses)
    if (new Set(plazosMeses).size !== plazosMeses.length) {
        return { success: false, mensaje: 'No puede haber plazos duplicados' }
    }
    
    // 5. Validar cada plazo usando PlanService
    for (let i = 0; i < datos.plazos.length; i++) {
        const plazo = datos.plazos[i]
        const validacion = PlanService.validarDatosPlazo(plazo)
        if (!validacion.valido) {
            return { 
                success: false, 
                mensaje: `Error en plazo ${i + 1}: ${validacion.errores.join(', ')}` 
            }
        }
    }
    
    // 6. Validar penalidades
    if (datos.penalidad_mora_pct !== undefined) {
        const validacionMora = validarTasaMora(datos.penalidad_mora_pct)
        if (!validacionMora.valido) {
            return { success: false, mensaje: validacionMora.error }
        }
    }
    
    // 7. Validar montos
    if (datos.monto_maximo && datos.monto_minimo && datos.monto_maximo < datos.monto_minimo) {
        return { success: false, mensaje: 'El monto máximo debe ser mayor al monto mínimo' }
    }
}
```

---

## Persistencia de Datos

### Estructura de Transacción

El proceso de guardado utiliza transacciones SQL para garantizar atomicidad:

```javascript
// Iniciar transacción
await connection.beginTransaction()

try {
    // 1. Crear plan base
    const [resultPlan] = await connection.execute(
        `INSERT INTO planes_financiamiento (
            empresa_id, codigo, nombre, descripcion,
            penalidad_mora_pct, dias_gracia, descuento_pago_anticipado_pct,
            cuotas_minimas_anticipadas, monto_minimo, monto_maximo,
            activo, permite_pago_anticipado, requiere_fiador, creado_por,
            plazo_meses, tasa_interes_anual, tasa_interes_mensual, pago_inicial_minimo_pct
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            empresaId, codigoParaGuardar, datos.nombre, datos.descripcion || null,
            datos.penalidad_mora_pct || 5.00, datos.dias_gracia || 5,
            datos.descuento_pago_anticipado_pct || 0.00,
            datos.cuotas_minimas_anticipadas || 3.00,
            datos.monto_minimo || 0.00, datos.monto_maximo || null,
            datos.activo ? 1 : 0, datos.permite_pago_anticipado ? 1 : 0,
            datos.requiere_fiador ? 1 : 0, userId,
            null, null, null, null  // Campos legacy (deprecated)
        ]
    )
    
    const planId = resultPlan.insertId
    const plazosCreados = []
    
    // 2. Crear cada plazo
    for (let i = 0; i < datos.plazos.length; i++) {
        const plazo = datos.plazos[i]
        
        // Calcular tasa usando PlanService
        const calculo = PlanService.calcularPlazo({
            plazo_meses: plazo.plazo_meses,
            tipo_pago_inicial: plazo.tipo_pago_inicial,
            pago_inicial_valor: plazo.pago_inicial_valor,
            cuota_mensual: plazo.cuota_mensual
        })
        
        if (!calculo.valido) {
            throw new Error(`Error en plazo ${plazo.plazo_meses} meses: ${calculo.error}`)
        }
        
        // Insertar plazo
        const [resultPlazo] = await connection.execute(
            `INSERT INTO planes_plazos (
                plan_id, plazo_meses, tipo_pago_inicial, pago_inicial_valor,
                cuota_mensual, tasa_anual_calculada, tasa_mensual_calculada,
                es_sugerido, activo, orden, creado_por
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                planId, plazo.plazo_meses, plazo.tipo_pago_inicial,
                plazo.pago_inicial_valor, plazo.cuota_mensual,
                calculo.tasa_anual_calculada, calculo.tasa_mensual_calculada,
                plazo.es_sugerido ? 1 : 0, 1, i, userId
            ]
        )
        
        plazosCreados.push({
            id: resultPlazo.insertId,
            plazo_meses: plazo.plazo_meses,
            cuota_mensual: plazo.cuota_mensual,
            tasa_anual_calculada: calculo.tasa_anual_calculada
        })
    }
    
    // Commit solo si todo salió bien
    await connection.commit()
    
    return {
        success: true,
        id: planId,
        codigo: codigoParaGuardar,
        plazos_creados: plazosCreados
    }
    
} catch (error) {
    // Rollback si algo falla
    await connection.rollback()
    throw error
} finally {
    connection.release()
}
```

### Generación de Código Único

El sistema garantiza que cada plan tenga un código único:

```javascript
// Generar código base desde el nombre
let codigoFinal = datos.codigo || ''
if (!codigoFinal && datos.nombre) {
    const nombreNormalizado = datos.nombre
        .toUpperCase()
        .replace(/\s+/g, '_')
        .replace(/[^A-Z0-9_]/g, '')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .slice(0, 15)
    codigoFinal = `PLAN_${nombreNormalizado}`.slice(0, 20)
}

// Validar y ajustar código si ya existe
let codigoUnico = codigoFinal
let contador = 1

while (true) {
    const [codigoExistente] = await connection.execute(
        `SELECT id FROM planes_financiamiento WHERE codigo = ?`,
        [codigoUnico]
    )
    
    if (codigoExistente.length === 0) {
        break // Código único encontrado
    }
    
    // Generar nuevo código con sufijo numérico
    const codigoBase = codigoFinal.slice(0, 18)
    codigoUnico = `${codigoBase}_${contador}`
    contador++
    
    if (contador > 100) {
        return { 
            success: false, 
            mensaje: 'No se pudo generar un código único' 
        }
    }
}
```

**Ejemplo**:
- Si `PLAN_CREDITO_FLEX` ya existe → `PLAN_CREDITO_FLEX_1`
- Si `PLAN_CREDITO_FLEX_1` ya existe → `PLAN_CREDITO_FLEX_2`
- Y así sucesivamente...

---

## Ejemplos Prácticos

### Ejemplo 1: Plan con Pago Inicial en Porcentaje

**Entrada del usuario**:
- Plazo: 12 meses
- Tipo pago inicial: Porcentaje
- Valor pago inicial: 15%
- Cuota mensual: RD$ 3,800

**Proceso de cálculo**:

1. **Estimación inicial del precio**:
   ```
   precioEstimado = 3,800 × 12 × 1.3 = 59,280
   pagoInicialReal = 59,280 × 0.15 = 8,892
   ```

2. **Cálculo iterativo de tasa**:
   - Iteración 1: montoFinanciado = 45,600 (estimado)
   - Tasa calculada: ~2.5% mensual
   - montoFinanciado recalculado: 40,500
   - Diferencia: 5,100 (no convergido)
   
   - Iteración 2: montoFinanciado = 43,260 (promedio ponderado)
   - Tasa calculada: ~2.3% mensual
   - montoFinanciado recalculado: 41,200
   - Diferencia: 2,060 (no convergido)
   
   - ... (continúa hasta convergencia)
   
   - Iteración 5: montoFinanciado = 41,800
   - Tasa calculada: ~2.35% mensual
   - montoFinanciado recalculado: 41,805
   - Diferencia: 5 (convergido ✓)

3. **Cálculo final**:
   ```
   montoFinanciado = 41,805
   precioTotal = 41,805 / (1 - 0.15) = 49,182
   pagoInicialReal = 49,182 × 0.15 = 7,377
   tasaMensual = 2.35%
   tasaAnual = (1.0235)^12 - 1 = 32.1%
   totalIntereses = (3,800 × 12) - 41,805 = 3,795
   ```

**Resultado**:
- Monto financiado: RD$ 41,805
- Precio total: RD$ 49,182
- Pago inicial: RD$ 7,377 (15%)
- Tasa anual: 32.1%
- Total intereses: RD$ 3,795

### Ejemplo 2: Plan con Pago Inicial en Monto Fijo

**Entrada del usuario**:
- Plazo: 24 meses
- Tipo pago inicial: Monto fijo
- Valor pago inicial: RD$ 7,500
- Cuota mensual: RD$ 2,000

**Proceso de cálculo**:

1. **Pago inicial real** (directo):
   ```
   pagoInicialReal = 7,500
   ```

2. **Cálculo iterativo**:
   - totalCuotas = 2,000 × 24 = 48,000
   - montoFinanciado estimado = 48,000 × 0.85 = 40,800
   - Tasa calculada: ~1.8% mensual
   - montoFinanciado recalculado = 38,500
   - Convergencia en 4 iteraciones

3. **Cálculo final**:
   ```
   montoFinanciado = 38,500
   precioTotal = 7,500 + 38,500 = 46,000
   porcentajeInicial = (7,500 / 46,000) × 100 = 16.3%
   tasaMensual = 1.8%
   tasaAnual = (1.018)^12 - 1 = 23.9%
   totalIntereses = 48,000 - 38,500 = 9,500
   ```

**Resultado**:
- Monto financiado: RD$ 38,500
- Precio total: RD$ 46,000
- Pago inicial: RD$ 7,500 (16.3%)
- Tasa anual: 23.9%
- Total intereses: RD$ 9,500

### Ejemplo 3: Plan con Múltiples Plazos

**Plan**: "Plan Crédito Flexible"

**Plazos configurados**:

1. **Plazo 1**: 6 meses
   - Pago inicial: 25%
   - Cuota: RD$ 6,500
   - Tasa calculada: 28.5% anual

2. **Plazo 2**: 12 meses
   - Pago inicial: 20%
   - Cuota: RD$ 3,800
   - Tasa calculada: 32.1% anual

3. **Plazo 3**: 24 meses
   - Pago inicial: 15%
   - Cuota: RD$ 2,000
   - Tasa calculada: 35.2% anual

**Configuración general**:
- Penalidad por mora: 5%
- Días de gracia: 5
- Permite pago anticipado: Sí
- Requiere fiador: No

**Guardado en base de datos**:

```sql
-- Tabla: planes_financiamiento
INSERT INTO planes_financiamiento (
    empresa_id, codigo, nombre, descripcion,
    penalidad_mora_pct, dias_gracia, ...
) VALUES (
    1, 'PLAN_CREDITO_FLEX', 'Plan Crédito Flexible', '',
    5.00, 5, ...
);

-- Tabla: planes_plazos (3 registros)
INSERT INTO planes_plazos (plan_id, plazo_meses, tipo_pago_inicial, ...) VALUES
(1, 6, 'PORCENTAJE', 25.00, 6500, 28.5, 0.021, ...),
(1, 12, 'PORCENTAJE', 20.00, 3800, 32.1, 0.0235, ...),
(1, 24, 'PORCENTAJE', 15.00, 2000, 35.2, 0.0255, ...);
```

---

## Consideraciones Importantes

### 1. Precisión de Cálculos

- Los cálculos utilizan redondeo a 2 decimales para montos y 4 decimales para tasas mensuales
- La tolerancia de convergencia es de 1 centavo (0.01)
- Máximo de 30 iteraciones para evitar loops infinitos

### 2. Validación de Rangos

El sistema muestra advertencias cuando:
- La tasa anual está fuera del rango esperado (20-50%)
- El porcentaje inicial es muy bajo (< 5%)
- La tasa es extremadamente alta (> 200%)

### 3. Manejo de Errores

- **Frontend**: Validaciones en tiempo real con mensajes claros
- **Backend**: Validaciones exhaustivas antes de persistir
- **Transacciones**: Rollback automático si algo falla

### 4. Performance

- Debounce de 400ms en cálculos del modal para evitar cálculos excesivos
- Cálculos optimizados con métodos numéricos eficientes (Bisección + Newton-Raphson)
- Índices en base de datos para búsquedas rápidas de códigos

---

## Flujo Completo Resumido

```
1. Usuario ingresa nombre del plan
   └─> Sistema genera código automáticamente

2. Usuario configura parámetros generales
   └─> Penalidades, descuentos, montos mín/máx

3. Usuario agrega opciones de plazo (modal)
   ├─> Ingresa: plazo, tipo pago inicial, valor, cuota
   ├─> Sistema calcula tasa en tiempo real (debounce 400ms)
   ├─> Muestra resultados: tasa, monto financiado, precio total
   └─> Usuario guarda plazo → se agrega a lista

4. Usuario repite paso 3 para múltiples plazos

5. Usuario hace clic en "Crear Plan"
   ├─> Validaciones frontend
   ├─> Envío a servidor
   ├─> Validaciones backend
   ├─> Inicio de transacción SQL
   ├─> Inserción del plan base
   ├─> Para cada plazo:
   │   ├─> Cálculo de tasa (PlanService)
   │   └─> Inserción en planes_plazos
   ├─> Commit de transacción
   └─> Redirección a lista de planes
```

---

## Conclusión

El sistema de creación de planes de financiamiento utiliza un enfoque inverso donde el usuario define montos concretos y el sistema calcula automáticamente las tasas de interés. Esto permite mayor flexibilidad comercial y facilita la configuración de planes sin necesidad de conocimientos financieros avanzados.

La arquitectura separa claramente las responsabilidades entre frontend, backend y servicios de dominio, garantizando mantenibilidad y escalabilidad del código.

