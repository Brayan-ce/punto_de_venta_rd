# Funcionamiento de Cajas (Admin y Vendedor)

Este documento detalla la lógica de funcionamiento, implementación técnica y estructura de datos del sistema de Cajas (Turnos de Caja) en la aplicación.

## 1. Visión General

El módulo de Cajas permite gestionar los turnos de trabajo de los usuarios (cajeros/administradores), controlando el flujo de efectivo y auditoría de ventas.

**Flujo Principal:**
1. **Apertura**: El usuario abre una caja asignándose un número físico (ej. Caja 1) y declarando un monto inicial en efectivo.
2. **Operación**: Durante el turno, todas las ventas realizadas se asocian a esta sesión de caja (`caja_id`).
3. **Cierre**: El usuario declara el monto final físico. El sistema compara lo esperado vs. lo real y calcula faltantes/sobrantes.

---

## 2. Frontend: Interfaz de Gestión (`cajas.js`)

El frontend está construido con React/Next.js y gestiona el estado de la UI y la interacción con el usuario.

### Estados Principales
El componente `CajaPageAdmin` maneja los siguientes estados críticos:
- `cajaActiva`: Objeto con la información de la sesión actual (si existe).
- `ventasCaja`: Lista de ventas asociadas a la sesión actual.
- `cajasDisponibles`: Lista de números de caja físicos libres para ser ocupados.

### Lógica de Interfaz
- **Dashboard Activo**: Si `cajaActiva` existe, muestra métricas en tiempo real (Ventas del día, Gastos, Total en Caja). Los totales se calculan sumando `monto_inicial + total_ventas - total_gastos`.
- **Sin Caja**: Si es `null`, muestra el botón para "Abrir Caja", validando que existan cajas físicas disponibles.
- **Historial**: Muestra sesiones pasadas (`cerrada`) con sus diferencias y métricas finales.

---

## 3. Backend: Lógica de Negocio (`servidor.js`)

La lógica reside en Server Actions de Next.js (`use server`), interactuando directamente con MySQL.

### A. Obtención de Totales en Tiempo Real
Esta es la parte más crítica. Cuando una caja está **ABIERTA**, los totales no se leen de una columna fija en la tabla `cajas`, sino que se calculan dinámicamente sumando las ventas asociadas.

**Consulta SQL (Simplificada):**
```sql
SELECT c.*,
    -- Suma dinámica de ventas emitidas asociadas a esta caja
    COALESCE(SUM(CASE WHEN v.estado = 'emitida' AND v.caja_id = c.id THEN v.total ELSE 0 END), 0) as total_ventas_real,
    
    -- Desglose por método de pago (dinámico)
    COALESCE(SUM(CASE WHEN v.metodo_pago = 'efectivo' THEN v.total ELSE 0 END), 0) as total_efectivo_real,
    -- ... (otros métodos de pago)
    
    -- Suma de gastos registrados manualmente
    COALESCE(SUM(CASE WHEN g.caja_id = c.id THEN g.monto ELSE 0 END), 0) as total_gastos_real
FROM cajas c
LEFT JOIN ventas v ON v.caja_id = c.id AND v.estado = 'emitida'
LEFT JOIN gastos g ON g.caja_id = c.id
WHERE c.estado = 'abierta'
GROUP BY c.id
```
*Esto garantiza que si se realiza una venta en otra pestaña, al refrescar la caja, el total siempre es exacto.*

### B. Apertura de Caja
1. Verifica si el usuario ya tiene una caja abierta.
2. Verifica si el `numero_caja` físico solicitado está ocupado por otro usuario hoy.
3. Inserta un nuevo registro en `cajas` con `empresa_id`, `usuario_id`, `monto_inicial` y estado `abierta`.

### C. Cierre de Caja (Persistencia Histórica)
Al cerrar, los valores dinámicos se "congelan" y se guardan en la base de datos para auditoría futura.

**Algoritmo de Cierre:**
1. Recalcula por última vez los totales reales desde la tabla `ventas` y `gastos`.
2. Calcula lo esperado: `Monto Inicial + Ventas - Gastos`.
3. Calcula la diferencia: `Monto Final Declarado - Monto Esperado`.
4. Actualiza el registro de la caja con estos valores finales y cambia estado a `cerrada`.

**Código de Cierre (Snippet):**
```javascript
// Servidor.js
const esperado = parseFloat(cajaData.monto_inicial) + totalVentasReal - totalGastosReal
const diferencia = parseFloat(datos.monto_final) - esperado

await connection.execute(
    `UPDATE cajas
     SET monto_final = ?, total_ventas = ?, total_gastos = ?, diferencia = ?, estado = 'cerrada' ...
     WHERE id = ?`,
    [datos.monto_final, totalVentasReal, totalGastosReal, diferencia, cajaData.id]
)
```

---

## 4. Persistencia de Datos y Relaciones

El sistema se basa en una base de datos relacional (MySQL).

### Tabla: `cajas`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INT | PK |
| `usuario_id` | INT | FK -> Usuario responsable |
| `numero_caja` | INT | Identificador físico de la estación |
| `monto_inicial`| DECIMAL | Dinero base al abrir |
| `monto_final` | DECIMAL | Dinero contado al cerrar |
| `total_ventas` | DECIMAL | **Snapshot** al cerrar (calculado dinámicamente mientras está abierta) |
| `diferencia` | DECIMAL | Faltante o sobrante calculado |
| `estado` | ENUM | 'abierta', 'cerrada' |

### Relación con Ventas
La tabla `ventas` tiene una columna `caja_id`.
- Cuando se crea una venta (en el módulo POS), se asigna el `caja_id` de la sesión activa del usuario.
- **Integridad**: Esto permite saber exactamente qué usuario y en qué turno se realizó cada venta.

### Relación con Gastos
La tabla `gastos` también tiene `caja_id`.
- Los retiros de dinero (sangrías) o gastos de caja chica se restan del efectivo esperado al cierre.

---

## 5. Resumen del Ciclo de Vida

1. **Estado ABIERTA**:
   - `total_ventas` en DB es NULL o irrelevante.
   - El frontend muestra `SUM(ventas)` en tiempo real.
   - Ventas nuevas ganan `caja_id = ID_Actual`.

2. **Acción CIERRE**:
   - Se calcula `SUM(ventas)` final.
   - Se guarda en la columna `total_ventas`.
   - Se calcula `Diferencia`.

3. **Estado CERRADA**:
   - Es un registro histórico estático.
   - No acepta nuevas ventas.
