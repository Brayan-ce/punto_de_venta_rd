# 📦 Venta Sin Asistencia - Documentación Técnica

## 📋 Definición

**Venta Sin Asistencia** es un tipo especial de operación que permite registrar productos que no cumplen las reglas normales del sistema, como:

- ✅ Precio de venta menor al costo (margen negativo)
- ✅ Precio de venta igual o menor a cero
- ✅ Existencia negativa en el Excel
- ✅ Productos que se venderán "a pedido" sin afectar inventario físico

### 🎯 Casos de Uso

1. **Productos Promocionales**: Regalos o productos con descuentos extremos
2. **Pedidos Especiales**: Productos que se comprarán después de la venta
3. **Clientes VIP**: Descuentos especiales que generan márgenes negativos
4. **Corrección de Datos**: Productos con información incorrecta que deben importarse

---

## 🔧 Implementación Técnica

### 1. Detección Automática

El sistema detecta automáticamente productos de "venta sin asistencia" cuando:

```javascript
// Condiciones que activan venta sin asistencia:
1. Existencia negativa en Excel → esVentaSinAsistencia = true
2. Precio I <= 0 → esVentaSinAsistencia = true  
3. Precio I < Costo → esVentaSinAsistencia = true
```

**Código en `normalizadores.js`:**
```javascript
const esVentaSinAsistenciaPorPrecio = 
    precio1 <= 0 || 
    precio1 < costo;

const esVentaSinAsistencia = 
    movimiento.esVentaSinAsistencia || 
    esVentaSinAsistenciaPorPrecio;
```

### 2. Comportamiento del Sistema

#### ✅ Se Permite:
- Importar productos con precio <= 0
- Importar productos con precio < costo
- Importar productos con existencia negativa
- Registrar el movimiento en la bitácora

#### ❌ NO se Hace:
- **NO se actualiza el stock físico** del producto
- **NO se generan alertas** de margen negativo
- **NO se bloquea la importación**

### 3. Registro en Base de Datos

#### Movimiento de Inventario

```sql
INSERT INTO movimientos_inventario (
    tipo,
    cantidad,
    notas
) VALUES (
    'salida',  -- o 'entrada' según existencia
    cantidad,
    'Venta sin asistencia (importación Excel)'  -- Nota especial
)
```

**Característica clave:**
```javascript
// NO se actualiza el stock físico
if (!datos.es_venta_sin_asistencia) {
    await connection.execute(
        `UPDATE productos SET stock = ? WHERE id = ?`,
        [stockNuevo, productoId]
    );
}
```

#### Precio en Producto

Para productos con precio <= 0, se guarda `0.01` en la BD (mínimo permitido), pero se marca como venta sin asistencia:

```javascript
const precioVentaFinal = datos.es_venta_sin_asistencia && datos.precio1 <= 0
    ? 0.01  // Mínimo técnico
    : datos.precio1;
```

---

## 📊 Ejemplos de Productos Afectados

### Caso 1: Precio < Costo
```
Código: 1231
Nombre: CUCHILLO SEVILLA
Costo: 70
Precio I: 65
→ Marcado como venta sin asistencia ✅
```

### Caso 2: Precio = 0
```
Código: 7501206674741
Nombre: PISTON MANGUERA TRUPER
Costo: 150
Precio I: 0
→ Marcado como venta sin asistencia ✅
→ Precio guardado como 0.01 en BD
```

### Caso 3: Existencia Negativa
```
Código: ABC123
Nombre: PRODUCTO ESPECIAL
Costo: 100
Precio I: 120
Existencia: -5
→ Marcado como venta sin asistencia ✅
→ NO se resta del stock físico
```

---

## 🔍 Validaciones Modificadas

### Antes (Bloqueaba):
```javascript
if (fila.precio1 <= 0) {
    return "Precio I debe ser mayor a cero";  // ❌ Error
}

if (fila.precio1 < fila.costo) {
    return "Precio I es menor que el costo";  // ❌ Error
}
```

### Ahora (Permite):
```javascript
// No se valida precio <= 0 o precio < costo
// Se marca automáticamente como venta sin asistencia
// Se permite la importación ✅
```

---

## 📈 Reportes y Seguimiento

### Identificar Ventas Sin Asistencia

```sql
-- Buscar movimientos de venta sin asistencia
SELECT * FROM movimientos_inventario
WHERE notas LIKE '%Venta sin asistencia%'
ORDER BY fecha_creacion DESC;
```

### Productos con Precio < Costo

```sql
-- Productos con margen negativo
SELECT 
    id,
    codigo_barras,
    nombre,
    precio_compra,
    precio_venta,
    (precio_venta - precio_compra) as margen
FROM productos
WHERE precio_venta < precio_compra
ORDER BY margen ASC;
```

---

## ⚠️ Consideraciones Importantes

### 1. Precio Mínimo en BD
- MySQL requiere `precio_venta >= 0.01`
- Productos con precio 0 se guardan como `0.01`
- El flag `es_venta_sin_asistencia` indica el precio real

### 2. Stock Físico
- **NO se modifica** el stock físico para ventas sin asistencia
- El movimiento se registra solo para auditoría
- El stock real debe ajustarse manualmente si es necesario

### 3. Reportes Financieros
- Filtrar ventas sin asistencia en reportes de margen
- Identificar productos problemáticos
- Revisar manualmente casos especiales

---

## 🎯 Mejores Prácticas

### ✅ Recomendado:
1. **Revisar periódicamente** productos con venta sin asistencia
2. **Documentar el motivo** en notas del movimiento
3. **Ajustar precios** cuando sea posible
4. **Filtrar en reportes** para análisis separado

### ❌ Evitar:
1. Usar venta sin asistencia como solución permanente
2. Ignorar productos con precio 0 sin revisar
3. No documentar el motivo de la excepción

---

## 🔄 Flujo Completo

```
1. Usuario sube Excel
   ↓
2. Sistema normaliza filas
   ↓
3. Detecta: precio <= 0 O precio < costo O existencia < 0
   ↓
4. Marca: es_venta_sin_asistencia = true
   ↓
5. Crea/actualiza producto (precio mínimo 0.01 si es 0)
   ↓
6. Registra movimiento con nota especial
   ↓
7. NO actualiza stock físico
   ↓
8. Importación completada ✅
```

---

## 📝 Notas Técnicas

### Campos Afectados

- `productos.precio_venta`: Mínimo 0.01 (técnico)
- `movimientos_inventario.notas`: "Venta sin asistencia (importación Excel)"
- `movimientos_inventario.tipo`: "salida" o "entrada" según existencia
- `productos.stock`: **NO se modifica** para ventas sin asistencia

### Compatibilidad

- ✅ Compatible con productos existentes
- ✅ No requiere cambios en BD
- ✅ Funciona con importaciones masivas
- ✅ Mantiene trazabilidad completa

---

**Última actualización:** 2026-01-21  
**Versión:** 1.0.0 (Venta Sin Asistencia)

