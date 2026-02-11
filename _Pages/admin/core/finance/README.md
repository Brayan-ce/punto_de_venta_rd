# Dominio Compartido: Finance

**Ubicación:** `_Pages/admin/core/finance/`  
**Propósito:** Centralizar la lógica de negocio compartida del sistema de financiamiento

---

## Objetivo

Este módulo contiene **lógica pura de negocio** que es compartida por todos los módulos de financiamiento:
- Planes
- Contratos
- Cuotas
- Pagos
- Alertas
- Activos

**No contiene:**
- Lógica de UI
- Acceso a base de datos
- Lógica específica de un módulo

---

## 📁 Estructura

```
core/finance/
├── reglas.js          # Reglas de negocio y constantes
├── estados.js         # Estados, constantes y funciones de formateo
├── validaciones.js    # Validaciones compartidas
├── calculos.js        # Cálculos financieros
├── index.js           # Exportaciones centralizadas
└── README.md          # Esta documentación
```

---

## 📚 Módulos

### 1. `reglas.js` - Reglas de Negocio

Contiene las reglas de negocio centrales y constantes:

```javascript
import { REGLAS_NEGOCIO, validarTasaInteres, validarPlazo } from '@/Pages/admin/core/finance/reglas'

// Constantes
REGLAS_NEGOCIO.TASA_INTERES_MAXIMA
REGLAS_NEGOCIO.PLAZO_MAXIMO_MESES
REGLAS_NEGOCIO.MONTO_MINIMO_FINANCIABLE

// Funciones de validación
validarTasaInteres(18)      // { valido: true }
validarPlazo(24)            // { valido: true }
validarMontoFinanciable(5000) // { valido: true }
```

**Funciones principales:**
- `validarTasaInteres(tasa)` - Valida tasa de interés anual
- `validarPlazo(plazo)` - Valida plazo en meses
- `validarPagoInicialPct(porcentaje)` - Valida porcentaje de pago inicial
- `validarTasaMora(tasaMora)` - Valida tasa de mora
- `validarDiasGracia(diasGracia)` - Valida días de gracia
- `validarMontoFinanciable(monto)` - Valida monto financiable
- `validarMontoInicial(montoTotal, montoInicial, porcentajeMinimo)` - Valida monto inicial
- `validarPlanFinanciamiento(plan, monto, inicial)` - Valida plan completo

---

### 2. `estados.js` - Estados y Constantes

Contiene todos los estados, constantes y funciones de formateo:

```javascript
import { 
  ESTADOS_CONTRATO, 
  ESTADOS_CUOTA,
  formatearEstadoContrato,
  obtenerClasificacionPorScore 
} from '@/Pages/admin/core/finance/estados'

// Constantes
ESTADOS_CONTRATO.ACTIVO
ESTADOS_CUOTA.PENDIENTE
METODOS_PAGO.EFECTIVO
SEVERIDAD_ALERTA.CRITICA

// Funciones de formateo
formatearEstadoContrato('activo')  // { texto: 'Activo', color: 'success' }
formatearEstadoCuota('vencida')   // { texto: 'Vencida', color: 'danger' }
obtenerClasificacionPorScore(85)   // 'B'
```

**Constantes principales:**
- `ESTADOS_CONTRATO` - Estados de contratos
- `ESTADOS_CUOTA` - Estados de cuotas
- `ESTADOS_PAGO` - Estados de pagos
- `SEVERIDAD_ALERTA` - Severidad de alertas
- `METODOS_PAGO` - Métodos de pago
- `TIPOS_ALERTA` - Tipos de alertas
- `CLASIFICACION_CREDITO` - Clasificaciones crediticias

**Funciones principales:**
- `formatearEstadoContrato(estado)` - Formatea estado para UI
- `formatearEstadoCuota(estado)` - Formatea estado de cuota
- `formatearEstadoPago(estado)` - Formatea estado de pago
- `obtenerColorSeveridad(severidad)` - Obtiene color según severidad
- `formatearMetodoPago(metodo)` - Formatea método de pago
- `formatearClasificacionCredito(clasificacion)` - Formatea clasificación
- `obtenerClasificacionPorScore(score)` - Determina clasificación por score

---

### 3. `validaciones.js` - Validaciones Compartidas

Contiene validaciones complejas que pueden ser reutilizadas:

```javascript
import { 
  validarDatosPlan, 
  validarDatosContrato,
  validarDatosPago 
} from '@/Pages/admin/core/finance/validaciones'

// Validar plan completo
const resultado = validarDatosPlan({
  codigo: 'PLAN-12M',
  nombre: 'Plan 12 Meses',
  plazo_meses: 12,
  tasa_interes_anual: 18
})
// { valido: true, errores: [] }

// Validar contrato
const resultado = validarDatosContrato({
  cliente_id: 1,
  plan_id: 1,
  venta_id: 1,
  precio_producto: 50000,
  pago_inicial: 10000
})
```

**Funciones principales:**
- `validarDatosPlan(datos)` - Valida datos completos de un plan
- `validarDatosContrato(datos)` - Valida datos completos de un contrato
- `validarDatosPago(datos)` - Valida datos completos de un pago
- `validarFormatoNumeroContrato(numero)` - Valida formato de número de contrato
- `validarFormatoNumeroRecibo(numero)` - Valida formato de número de recibo
- `validarDatosRefinanciacion(datos)` - Valida datos de refinanciación

---

### 4. `calculos.js` - Cálculos Financieros

Contiene todas las funciones de cálculo financiero:

```javascript
import { 
  calcularAmortizacionFrancesa,
  calcularMora,
  generarCronograma,
  calcularScoreCrediticio,
  tasaAnualAMensual
} from '@/Pages/admin/core/finance/calculos'

// Calcular amortización
const resultado = calcularAmortizacionFrancesa(50000, 0.015, 12)
// {
//   cuotaMensual: 4562.50,
//   totalIntereses: 4750.00,
//   totalPagar: 54750.00,
//   cronograma: [...]
// }

// Calcular mora
const mora = calcularMora(4562.50, 10, 0.05, 5) // 761.04

// Generar cronograma
const cuotas = generarCronograma({
  monto_financiado: 50000,
  numero_cuotas: 12,
  fecha_primer_pago: '2025-02-01',
  tasa_interes_mensual: 0.015,
  dias_gracia: 5
})

// Calcular score crediticio
const score = calcularScoreCrediticio({
  total_creditos_otorgados: 5,
  total_creditos_pagados: 4,
  limite_credito: 100000,
  saldo_utilizado: 50000
})
// { score: 85, clasificacion: 'B' }
```

**Funciones principales:**
- `calcularAmortizacionFrancesa(monto, tasaMensual, cuotas)` - Calcula amortización método francés
- `calcularMora(montoCuota, diasAtraso, tasaMora, diasGracia)` - Calcula mora acumulada
- `generarCronograma(contrato)` - Genera cronograma completo de cuotas
- `calcularScoreCrediticio(cliente)` - Calcula score crediticio (0-100)
- `tasaAnualAMensual(tasaAnual)` - Convierte tasa anual a mensual
- `tasaMensualAAnual(tasaMensual)` - Convierte tasa mensual a anual
- `calcularDiasAtraso(fechaVencimiento)` - Calcula días de atraso
- `formatearNumeroContrato(empresaId, secuencia)` - Formatea número de contrato
- `formatearNumeroRecibo(empresaId, secuencia)` - Formatea número de recibo
- `distribuirPago(montoPago, mora, interes, capital)` - Distribuye pago entre conceptos

---

## 🔄 Compatibilidad

Para mantener compatibilidad con código existente, `utils/financiamientoUtils.js` actúa como wrapper que re-exporta todas las funciones desde `core/finance/`.

**Código antiguo (sigue funcionando):**
```javascript
import { calcularAmortizacionFrancesa } from '@/utils/financiamientoUtils'
```

**Código nuevo (recomendado):**
```javascript
import { calcularAmortizacionFrancesa } from '@/Pages/admin/core/finance/calculos'
// O usando el index
import { calcularAmortizacionFrancesa } from '@/Pages/admin/core/finance'
```

---

## ✅ Principios de Diseño

1. **Sin dependencias externas:** El core no depende de otros módulos de financiamiento
2. **Lógica pura:** No tiene efectos secundarios (no DB, no UI)
3. **Testeable:** Todas las funciones son fácilmente testeables
4. **Reutilizable:** Puede ser usado por cualquier módulo que necesite lógica financiera
5. **Neutral:** El nombre `core/finance` evita acoplamiento semántico

---

## 📝 Notas de Migración

Este módulo fue creado como parte de la refactorización del sistema de financiamiento. Las funciones fueron movidas desde:
- `utils/financiamientoUtils.js` → `core/finance/calculos.js`

El archivo `utils/financiamientoUtils.js` se mantiene como wrapper de compatibilidad temporal.

---

**Versión:** 1.0  
**Fecha:** 2025-01-25  
**Parte de:** Refactorización del Sistema de Financiamiento

