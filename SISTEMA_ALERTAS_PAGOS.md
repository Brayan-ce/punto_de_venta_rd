# Sistema Integrado de Alertas y Pagos

## 📋 Descripción General

El sistema de alertas está completamente integrado con el módulo de pagos de financiamiento para garantizar que:

1. ✅ Las alertas se crean automáticamente cuando las cuotas están próximas a vencer
2. ✅ Las alertas se resuelven automáticamente cuando se registra un pago
3. ✅ Los clientes con alto riesgo de mora son identificados automáticamente
4. ✅ El cliente siempre tiene visibilidad de lo que debe pagar

---

## 🔔 Tipos de Alertas Automáticas

### 1. **Alertas por Vencimiento de Cuotas**

Se crean automáticamente cuando una cuota:

| Tipo | Severidad | Cuándo se crea |
|------|-----------|----------------|
| `vence_10_dias` | 🟡 Baja | 10 días antes del vencimiento |
| `vence_5_dias` | 🟠 Media | 5 días antes del vencimiento |
| `vence_3_dias` | 🔴 Alta | 3 días antes del vencimiento |
| `vence_hoy` | 🔴 Crítica | **HOY** es el día de vencimiento |
| `vencida` | 🔴 Crítica/Alta | Después del vencimiento (severidad aumenta con días) |

**Ubicación del código:**
- Función: `verificarYCrearAlertasCuotas()` en [alertas/servidor.js](alertas/servidor.js#L239)
- Se ejecuta automáticamente cada vez que se carga la sección de alertas
- Se llama ANTES de obtener las alertas para garantizar que siempre estén actualizadas

### 2. **Alertas por Cliente de Alto Riesgo**

Se crea cuando un cliente tiene:
- 1 o más cuotas vencidas
- Severidad: 🔴 **Crítica**
- Incluye: número de cuotas vencidas y saldo total

**Ubicación del código:**
- Función: `verificarYCrearAlertasCuotas()` en [alertas/servidor.js](alertas/servidor.js#L307)

---

## 💰 Integración con Pagos

### Flujo de Pago Completo

```
1. Usuario abre contrato en /admin/contratos/ver/[id]
   ↓
2. Usuario hace clic en "Registrar Pago" 
   ↓
3. Se abre modal con cuota y monto sugerido
   ↓
4. Usuario ingresa datos y confirma
   ↓
5. Función registrarPagoCuota() se ejecuta:
   - ✅ Crea entrada en pagos_financiamiento
   - ✅ Actualiza monto_pagado en cuotas_financiamiento
   - ✅ Actualiza monto_pagado en contratos_financiamiento
   - ✅ RESUELVE AUTOMÁTICAMENTE las alertas de vencimiento
   ↓
6. usuario ve confirmación: "✅ Pago registrado"
   ↓
7. Cliente ya no ve alertas de esa cuota en /admin/alertas
```

### Código de Resolución Automática

Ubicación: [contratos/servidor.js](contratos/servidor.js#L1850)

```javascript
// Marcar alertas relacionadas como resueltas automáticamente
await connection.execute(
    `UPDATE alertas_financiamiento
     SET estado = 'resuelta',
         accion_realizada = 'Pago registrado automáticamente',
         resuelta_por = ?,
         fecha_resolucion = NOW()
     WHERE cuota_id = ? AND empresa_id = ? AND estado IN ('activa', 'vista')`,
    [userId, cuotaId, empresaId]
)
```

**Alertas que se resuelven:**
- `vence_10_dias`
- `vence_5_dias`
- `vence_3_dias`
- `vence_hoy`

---

## 📊 Dashboard de Alertas

**Ubicación:** `/admin/alertas`

### ¿Qué ve el cliente?

1. **Estadísticas en tiempo real:**
   - Total de alertas
   - Alertas activas (nuevas)
   - Alertas críticas
   - Alertas resueltas

2. **Lista de alertas ordenadas por:**
   - Severidad (Crítica → Alta → Media → Baja)
   - Fecha más reciente primero

3. **Para cada alerta puede:**
   - Ver detalles completos (cliente, contrato, cuota)
   - Llamar o enviar WhatsApp a cliente
   - Ver contrato asociado
   - Marcar como vista
   - Resolver manualmente
   - Descartar con motivo

### Flujo de actualización:

1. Usuario entra a `/admin/alertas`
2. Se llama `verificarYCrearAlertasCuotas()` ← **Crea alertas nuevas que falten**
3. Se llama `obtenerAlertas()` ← **Carga todas las alertas**
4. Se llama `obtenerEstadisticasAlertas()` ← **Calcula números**
5. UI se renderiza con datos frescos

---

## 🔄 Ciclo de Vida de una Alerta

```
CREACIÓN (automática)
    ↓
    ├─→ Estado: "activa"
    ├─→ Severidad: según tipo
    ├─→ Se muestra en dashboard
    ↓
POSIBLES FINALES:
    ├─→ ✅ "resuelta" - Pago realizado (automática)
    ├─→ 👁️  "vista" - Usuario marca como vista
    ├─→ 🗑️ "descartada" - Usuario la rechaza
    └─→ Si no se resuelve con pago, usuario debe marcar manualmente
```

---

## 📁 Archivos Relacionados

### Frontend (Client Components)
- [_Pages/admin/alertas/alertas.js](_Pages/admin/alertas/alertas.js) - UI principal
- [_Pages/admin/contratos/ver/[id]/ver.js](_Pages/admin/contratos/ver/[id]/ver.js) - Modal de pago

### Backend (Server Functions)
- [_Pages/admin/alertas/servidor.js](_Pages/admin/alertas/servidor.js) - Funciones de alertas
- [_Pages/admin/contratos/servidor.js](_Pages/admin/contratos/servidor.js) - Función de pago con resolución automática
- [_Pages/admin/pagos/servidor.js](_Pages/admin/pagos/servidor.js) - Queries de pagos

### Tablas de base de datos
- `alertas_financiamiento` - Registro de todas las alertas
- `cuotas_financiamiento` - Cuotas (estado, monto_pagado, vencimiento)
- `pagos_financiamiento` - Transacciones de pagos
- `contratos_financiamiento` - Contratos y agregados

---

## ✨ Características Clave

### 1. **Sin duplicados de alertas**
Cada alerta se crea una sola vez gracias a validaciones WITH NOT EXISTS

### 2. **Resolución automática**
No requiere que el usuario cierre alerts manualmente tras pagar

### 3. **Escalabilidad de severidad**
- Alertas por vencimiento: severidad fija según días
- Alertas por mora: severidad aumenta con días de retraso

### 4. **Auditoría completa**
- `resuelta_por` - Quién resolvió
- `accion_realizada` - Cómo se resolvió
- `fecha_resolucion` - Cuándo se resolvió
- `registrado_por` - Quién registró el pago

### 5. **Contexto rico**
Cada alerta incluye:
- Nombre del cliente
- Teléfono (para llamar/WhatsApp)
- Número de contrato
- Número de cuota
- Saldo pendiente
- Fecha de vencimiento

---

## 🚀 Próximas Mejoras

- [ ] Notificaciones por email cuando se crea alerta crítica
- [ ] SMS automático 3 días antes de vencimiento
- [ ] Reportes de alertas por período
- [ ] Predicción de mora basada en histórico
- [ ] Asignación automática de alertas a gestores
- [ ] Estadísticas por equipo

---

## 🔧 Configuración y Personalización

Para cambiar los días de vencimiento, editar en [alertas/servidor.js](alertas/servidor.js#L246):

```javascript
const cuotasVencimiento = [
    { dias: 10, tipo: 'vence_10_dias', severidad: 'baja', titulo: 'Cuota vence en 10 días' },
    { dias: 5, tipo: 'vence_5_dias', severidad: 'media', titulo: 'Cuota vence en 5 días' },
    // Puedes agregar más umbrales aquí
]
```

---

**Última actualización:** 21 de febrero de 2026
**Sistema:** RD Punto de Venta - Módulo de Financiamiento
**Desarrollador:** Tu nombre aquí 😎
