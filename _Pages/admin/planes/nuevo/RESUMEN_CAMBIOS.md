# Resumen de Cambios: Refactorización de Planes

## 🎯 Objetivo

Resolver el problema de tasas anuales absurdas (271%, 168%) en plazos cortos (1-4 meses) separando planes comerciales de planes financieros.

---

## 📋 Archivos Creados

1. **`_DB/migracion_planes_comerciales.sql`**
   - Crea tabla `politica_financiamiento`
   - Modifica `planes_plazos` (agrega campos nuevos)
   - Inserta políticas iniciales para scooters
   - Migra datos existentes

2. **`_Pages/admin/core/finance/calculosComerciales.js`**
   - Funciones para planes comerciales
   - `calcularPlanComercial()` - Con precio contado
   - `calcularPlanComercialInverso()` - Sin precio contado
   - `configurarVisualizacion()` - Define qué mostrar

3. **`_Pages/admin/planes/nuevo/GUIA_REFACTORIZACION.md`**
   - Guía completa de la refactorización
   - Ejemplos de uso
   - Casos de prueba

4. **`_Pages/admin/planes/nuevo/RESUMEN_CAMBIOS.md`** (este archivo)
   - Resumen ejecutivo de cambios

---

## 🔧 Archivos Modificados

1. **`_Pages/admin/core/finance/PlanService.js`**
   - ✅ Agregado `determinarTipoPlan()`
   - ✅ Agregado `calcularPlazoComercial()`
   - ✅ Agregado `calcularPlazoFinanciero()`
   - ✅ Agregado `obtenerPolitica()`
   - ✅ `calcularPlazo()` ahora es dispatcher automático
   - ✅ `validarDatosPlazo()` valida según tipo

2. **`_Pages/admin/planes/nuevo/nuevo.js`**
   - ✅ Importa `configurarVisualizacion`
   - ✅ `useEffect` de cálculo usa `PlanService.calcularPlazo()`
   - ✅ Resultados muestran/ocultan métricas según tipo
   - ✅ `guardarPlazoModal()` guarda tipo_plan y recargos
   - ✅ Visualización de plazos muestra tipo correcto

3. **`_Pages/admin/planes/nuevo/servidor.js`**
   - ✅ Obtiene política antes de calcular
   - ✅ Guarda `tipo_plan` en BD
   - ✅ Guarda campos de recargo
   - ✅ Guarda configuración de visualización

4. **`_Pages/admin/planes/nuevo/LOGICA_CREACION_PLANES.md`**
   - ✅ Agregada sección "Tipos de Planes"
   - ✅ Actualizada arquitectura
   - ✅ Actualizado flujo de cálculo

---

## 🗄️ Cambios en Base de Datos

### Nueva Tabla: `politica_financiamiento`

```sql
CREATE TABLE politica_financiamiento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NULL,
    plazo_min INT NOT NULL,
    plazo_max INT NOT NULL,
    tipo_calculo ENUM('COMERCIAL', 'FINANCIERO'),
    recargo_tipo ENUM('FIJO', 'PORCENTAJE') NULL,
    recargo_valor DECIMAL(12,2) NULL,
    tasa_mensual DECIMAL(5,4) NULL,
    inicial_min_pct DECIMAL(5,2),
    activo TINYINT(1) DEFAULT 1,
    ...
)
```

### Modificaciones a `planes_plazos`

**Campos agregados**:
- `tipo_plan` ENUM('COMERCIAL', 'FINANCIERO')
- `recargo_tipo` ENUM('FIJO', 'PORCENTAJE') NULL
- `recargo_valor` DECIMAL(12,2) NULL
- `precio_financiado` DECIMAL(12,2) NULL
- `mostrar_tasa` TINYINT(1) DEFAULT 1
- `mostrar_tea` TINYINT(1) DEFAULT 1

**Campos modificados**:
- `tasa_anual_calculada` → NULL permitido
- `tasa_mensual_calculada` → NULL permitido

---

## 🔄 Flujo de Cálculo Actualizado

### Antes (Siempre calculaba tasa)

```
Usuario ingresa → calcularPlanInverso() → Tasa (a veces absurda)
```

### Ahora (Dispatcher automático)

```
Usuario ingresa → PlanService.calcularPlazo()
    ↓
¿Plazo ≤ 4 meses?
    ├─ SÍ → calcularPlazoComercial() → Recargo, NO tasa
    └─ NO → calcularPlazoFinanciero() → Tasa, intereses
```

---

## 📊 Comparación: Antes vs Ahora

### Caso: 2 meses, RD$ 2,500 inicial, RD$ 6,500 cuota

| Métrica | Antes | Ahora |
|---------|-------|-------|
| Tipo | FINANCIERO | COMERCIAL |
| Tasa Anual | 271.40% ❌ | N/A ✅ |
| Tasa Mensual | 11.5% | N/A |
| Recargo | N/A | RD$ 800 ✅ |
| Precio Total | RD$ 15,500 | RD$ 15,500 |
| Mensaje | "Tasa extremadamente alta" | "Pago diferido comercial" |

### Caso: 6 meses, RD$ 2,500 inicial, RD$ 6,500 cuota

| Métrica | Antes | Ahora |
|---------|-------|-------|
| Tipo | FINANCIERO | FINANCIERO |
| Tasa Anual | 76.55% | 76.55% |
| Tasa Mensual | 4.85% | 4.85% |
| Muestra TEA | ✅ | ❌ (plazo < 9 meses) |
| Mensaje | "Fuera de rango" | "TEA solo informativa" |

---

## ✅ Beneficios

1. **Elimina tasas absurdas**: Plazos cortos no calculan tasa
2. **Más claro para usuarios**: Mensajes apropiados según tipo
3. **Comercialmente correcto**: Recargo vs Interés bien diferenciado
4. **Escalable**: Políticas configurables por empresa
5. **Compatible**: Datos existentes se migran automáticamente

---

## 🚀 Pasos para Implementar

1. **Ejecutar migración SQL**:
   ```bash
   mysql -u usuario -p base_datos < _DB/migracion_planes_comerciales.sql
   ```

2. **Verificar que los archivos nuevos existen**:
   - ✅ `calculosComerciales.js`
   - ✅ `GUIA_REFACTORIZACION.md`

3. **Probar creación de plan**:
   - Crear plan con plazo 2 meses → Debe ser COMERCIAL
   - Crear plan con plazo 12 meses → Debe ser FINANCIERO

4. **Verificar visualización**:
   - Plan comercial: NO muestra tasa
   - Plan financiero corto: Muestra tasa mensual, NO TEA
   - Plan financiero largo: Muestra todo incluyendo TEA

---

## 📝 Notas Importantes

1. **Compatibilidad**: Los planes existentes seguirán funcionando (se migran automáticamente)

2. **Políticas**: Las políticas iniciales son globales (empresa_id = NULL). Puedes crear políticas específicas por empresa.

3. **Límite comercial**: Por defecto es 4 meses. Puede ajustarse en `PlanService.determinarTipoPlan()`.

4. **Validación**: Los planes comerciales NO requieren tasa para guardarse.

---

## 🐛 Troubleshooting

### Problema: "Debe calcular la tasa antes de guardar" en plan comercial

**Solución**: Verificar que `tipo_plan` se está determinando correctamente. El sistema debería detectar automáticamente que es comercial.

### Problema: No se muestra recargo en resultados

**Solución**: Verificar que la política tiene `recargo_tipo` y `recargo_valor` configurados, o que se están pasando en `datosPlazo`.

### Problema: Plan financiero no calcula tasa

**Solución**: Verificar que el plazo es ≥ 5 meses. Si es menor, se clasificará como comercial.

---

## 📚 Documentación Relacionada

- [GUIA_REFACTORIZACION.md](./GUIA_REFACTORIZACION.md) - Guía completa
- [LOGICA_CREACION_PLANES.md](./LOGICA_CREACION_PLANES.md) - Documentación técnica completa
- [migracion_planes_comerciales.sql](../../../_DB/migracion_planes_comerciales.sql) - Script de migración

---

## ✨ Conclusión

Esta refactorización resuelve el problema de tasas absurdas separando claramente dos tipos de planes:

- **Comerciales**: Para ventas casi-contado, apartados, pagos rápidos
- **Financieros**: Para créditos reales con tasa de interés

El sistema ahora es más coherente, comercialmente correcto y fácil de entender.

