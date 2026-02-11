# Guía de Refactorización: Planes Comerciales vs Financieros

## Resumen Ejecutivo

Esta refactorización implementa la separación entre **planes comerciales** (cash/diferido) y **planes financieros** (crédito largo plazo) para resolver el problema de tasas anuales absurdas en plazos cortos.

### Problema Resuelto

- ❌ **Antes**: Plazos de 1-4 meses generaban tasas anuales absurdas (271%, 168%, etc.)
- ✅ **Ahora**: Plazos cortos se clasifican como comerciales y NO calculan tasa

---

## Cambios Implementados

### 1. Base de Datos

#### Nueva Tabla: `politica_financiamiento`

Define reglas por rango de plazos:

```sql
CREATE TABLE politica_financiamiento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NULL,  -- NULL = política global
    plazo_min INT NOT NULL,
    plazo_max INT NOT NULL,
    tipo_calculo ENUM('COMERCIAL', 'FINANCIERO') NOT NULL,
    recargo_tipo ENUM('FIJO', 'PORCENTAJE') NULL,  -- Solo para COMERCIAL
    recargo_valor DECIMAL(12,2) NULL,
    tasa_mensual DECIMAL(5,4) NULL,  -- Solo para FINANCIERO
    inicial_min_pct DECIMAL(5,2) DEFAULT 0.00,
    activo TINYINT(1) DEFAULT 1,
    ...
)
```

#### Modificaciones a `planes_plazos`

Nuevos campos agregados:

- `tipo_plan` ENUM('COMERCIAL', 'FINANCIERO')
- `recargo_tipo` ENUM('FIJO', 'PORCENTAJE') NULL
- `recargo_valor` DECIMAL(12,2) NULL
- `precio_financiado` DECIMAL(12,2) NULL
- `mostrar_tasa` TINYINT(1) DEFAULT 1
- `mostrar_tea` TINYINT(1) DEFAULT 1

Campos modificados:

- `tasa_anual_calculada` → NULL permitido (para planes comerciales)
- `tasa_mensual_calculada` → NULL permitido (para planes comerciales)

### 2. Nuevos Archivos de Cálculo

#### `calculosComerciales.js`

Funciones para planes comerciales:

- `calcularPlanComercial()` - Con precio contado conocido
- `calcularPlanComercialInverso()` - Sin precio contado (creación de planes)
- `esPlanComercial()` - Determina si es comercial
- `configurarVisualizacion()` - Define qué métricas mostrar

**Características**:
- NO calcula tasa de interés
- Solo aplica recargo (fijo o porcentaje)
- Precio final = Precio contado + Recargo

### 3. PlanService Refactorizado

#### Nuevos Métodos

- `determinarTipoPlan(plazoMeses)` - Determina tipo según plazo
- `calcularPlazoComercial()` - Calcula plan comercial
- `calcularPlazoFinanciero()` - Calcula plan financiero
- `obtenerPolitica()` - Obtiene política de BD

#### Método Principal Actualizado

`calcularPlazo()` ahora es un **dispatcher** que:
1. Determina el tipo de plan (automático o desde política)
2. Llama al método correspondiente
3. Retorna resultado con configuración de visualización

### 4. Componente Frontend (`nuevo.js`)

#### Cambios en el Modal

- **Cálculo**: Usa `PlanService.calcularPlazo()` (dispatcher automático)
- **Resultados**: Muestra/oculta métricas según `tipo_plan`
- **Validación**: No requiere tasa para planes comerciales

#### Métricas Mostradas por Tipo

**Plan Comercial (≤4 meses)**:
- ✅ Precio Total
- ✅ Monto Financiado
- ✅ Recargo
- ✅ % Inicial
- ❌ Tasa Mensual
- ❌ Tasa Anual
- ❌ Total Intereses

**Plan Financiero (5-8 meses)**:
- ✅ Precio Total
- ✅ Monto Financiado
- ✅ Tasa Mensual
- ✅ Total Intereses
- ✅ % Inicial
- ❌ Tasa Anual (TEA)

**Plan Financiero (≥9 meses)**:
- ✅ Todas las métricas incluyendo TEA

### 5. Backend (`servidor.js`)

#### Cambios en `crearPlanFinanciamiento()`

- Obtiene política aplicable para cada plazo
- Guarda `tipo_plan` en la BD
- Guarda campos de recargo (para comerciales)
- Guarda configuración de visualización

---

## Reglas de Negocio Implementadas

### Clasificación Automática

| Plazo | Tipo | Cálculo |
|-------|------|---------|
| 1-4 meses | COMERCIAL | Recargo (fijo o %) |
| 5+ meses | FINANCIERO | Tasa de interés |

### Políticas Predefinidas (Scooters)

```sql
-- 1-2 meses: RD$ 800 recargo fijo
-- 3 meses: RD$ 1,500 recargo fijo
-- 4 meses: 5% recargo porcentaje
-- 5-6 meses: 3.5% mensual
-- 7-9 meses: 4.0% mensual
-- 10-12 meses: 4.8% mensual
```

### Validaciones

**Planes Comerciales**:
- ✅ No requiere tasa
- ✅ Requiere recargo (de política o manual)
- ✅ Validación: cuota > 0

**Planes Financieros**:
- ✅ Requiere tasa calculada
- ✅ Validación de rango (advertencia si > 50% anual)
- ✅ Validación: cuota > 0, pago inicial > 0

---

## Flujo de Uso

### Crear Plan con Plazo Corto (Ej: 2 meses)

1. Usuario ingresa:
   - Plazo: 2 meses
   - Pago inicial: RD$ 2,500
   - Cuota: RD$ 6,500

2. Sistema:
   - Detecta: `tipo_plan = 'COMERCIAL'`
   - Obtiene política: recargo RD$ 800
   - Calcula: `calcularPlanComercialInverso()`
   - NO calcula tasa

3. Resultado mostrado:
   - Precio Total: RD$ 15,500
   - Recargo: RD$ 800
   - Mensaje: "Pago diferido comercial. No se aplican intereses."

### Crear Plan con Plazo Largo (Ej: 12 meses)

1. Usuario ingresa:
   - Plazo: 12 meses
   - Pago inicial: 20%
   - Cuota: RD$ 3,800

2. Sistema:
   - Detecta: `tipo_plan = 'FINANCIERO'`
   - Obtiene política: tasa 4.8% mensual (o calcula inverso)
   - Calcula: `calcularPlanFinanciero()`
   - Calcula tasa usando método inverso

3. Resultado mostrado:
   - Tasa Mensual: 2.35%
   - Tasa Anual: 32.1%
   - Total Intereses: RD$ 3,795
   - Todas las métricas visibles

---

## Migración de Datos Existentes

El script `migracion_planes_comerciales.sql`:

1. Crea tabla `politica_financiamiento`
2. Modifica `planes_plazos` (agrega campos)
3. Inserta políticas iniciales
4. Migra datos existentes:
   - Plazos ≤ 4 meses → `tipo_plan = 'COMERCIAL'`
   - Plazos ≥ 5 meses → `tipo_plan = 'FINANCIERO'`

**⚠️ IMPORTANTE**: Ejecutar el script de migración antes de usar la nueva funcionalidad.

---

## Ejemplos de Cálculo

### Ejemplo 1: Plan Comercial (2 meses)

**Entrada**:
- Plazo: 2 meses
- Pago inicial: RD$ 2,500
- Cuota: RD$ 6,500
- Política: Recargo fijo RD$ 800

**Cálculo**:
```
Total cuotas = 6,500 × 2 = 13,000
Precio financiado = 2,500 + 13,000 = 15,500
Recargo = 800 (de política)
Precio contado estimado = 15,500 - 800 = 14,700
```

**Resultado**:
- Tipo: COMERCIAL
- Precio Total: RD$ 15,500
- Recargo: RD$ 800
- NO muestra tasa

### Ejemplo 2: Plan Financiero (6 meses)

**Entrada**:
- Plazo: 6 meses
- Pago inicial: RD$ 2,500
- Cuota: RD$ 6,500

**Cálculo** (método inverso):
```
Total cuotas = 6,500 × 6 = 39,000
Monto financiado ≈ 33,150.85 (iterativo)
Tasa mensual ≈ 4.85%
Tasa anual = (1.0485)^12 - 1 = 76.55%
```

**Resultado**:
- Tipo: FINANCIERO
- Tasa Mensual: 4.85%
- Tasa Anual: 76.55% (alta por plazo corto)
- Mensaje: "Plazo corto. TEA solo informativa."
- NO muestra TEA (plazo < 9 meses)

---

## Configuración de Políticas

### Crear Política Personalizada

```sql
INSERT INTO politica_financiamiento 
    (empresa_id, plazo_min, plazo_max, tipo_calculo, recargo_tipo, recargo_valor, inicial_min_pct, descripcion, creado_por)
VALUES
    (1, 1, 2, 'COMERCIAL', 'FIJO', 1000.00, 0.00, 'Recargo especial para scooters premium', 1);
```

### Modificar Política Existente

```sql
UPDATE politica_financiamiento
SET recargo_valor = 1200.00
WHERE plazo_min = 1 AND plazo_max = 2 AND empresa_id = 1;
```

---

## Validaciones Implementadas

### Frontend (`nuevo.js`)

```javascript
// No requiere tasa para planes comerciales
if (tipoPlan === 'FINANCIERO' && !resultadoCalculoModal.tasa_anual_calculada) {
    alert('Debe calcular la tasa antes de guardar un plan financiero.')
    return
}
```

### Backend (`servidor.js`)

```javascript
// Validación según tipo
const validacion = PlanService.validarDatosPlazo(plazo)
// Esta función ahora valida según tipo_plan
```

### PlanService

```javascript
static validarDatosPlazo(plazo) {
    // ...
    if (tipoPlan === 'COMERCIAL') {
        // No requiere tasa
    } else {
        // Requiere tasa calculada
    }
}
```

---

## Mensajes al Usuario

### Plan Comercial

```
"Este plan corresponde a un pago diferido comercial.
No se aplican intereses financieros."
```

### Plan Financiero Corto (5-8 meses)

```
"Este plan tiene un plazo corto (6 meses). 
La tasa anual es solo informativa. 
El costo real del crédito se muestra en intereses totales."
```

### Plan Financiero Largo (≥9 meses)

```
"Este plan tiene una tasa dentro del rango esperado (32.1%)."
```

---

## Testing

### Casos de Prueba

1. **Plan Comercial 2 meses**:
   - ✅ No calcula tasa
   - ✅ Muestra recargo
   - ✅ Guarda tipo_plan = 'COMERCIAL'

2. **Plan Financiero 6 meses**:
   - ✅ Calcula tasa
   - ✅ NO muestra TEA
   - ✅ Muestra intereses totales

3. **Plan Financiero 12 meses**:
   - ✅ Calcula tasa
   - ✅ Muestra TEA
   - ✅ Valida rango

---

## Compatibilidad

### Datos Existentes

- ✅ Planes existentes se migran automáticamente
- ✅ Si `tipo_plan` es NULL, se determina por plazo
- ✅ Campos nuevos son NULL por defecto (compatibilidad)

### API

- ✅ `PlanService.calcularPlazo()` mantiene compatibilidad
- ✅ Parámetros opcionales para políticas
- ✅ Fallback a determinación automática

---

## Próximos Pasos (Opcional)

1. **UI para gestionar políticas**: Crear interfaz para editar políticas
2. **Reportes separados**: Reportes distintos para comerciales vs financieros
3. **Validación de políticas**: Validar que no haya solapamiento de rangos
4. **Historial de cambios**: Auditoría de cambios en políticas

---

## Soporte

Para dudas o problemas:
1. Revisar logs de consola para errores de cálculo
2. Verificar que la migración se ejecutó correctamente
3. Validar que las políticas están activas en BD

---

## Conclusión

Esta refactorización resuelve el problema de tasas absurdas en plazos cortos separando claramente:

- **Planes Comerciales**: Pago diferido, recargo, sin tasa
- **Planes Financieros**: Crédito real, tasa de interés, amortización

El sistema ahora es más coherente, comercialmente correcto y fácil de entender para usuarios y auditores.

