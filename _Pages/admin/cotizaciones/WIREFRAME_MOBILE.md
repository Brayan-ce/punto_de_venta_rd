# 📱 Wireframe Mobile - Cotizaciones

## Vista Mobile First - Diseño Profesional

---

## 🎯 HEADER FIJO (Sticky)

```
┌─────────────────────────────────┐
│ ☰  Cotizaciones          🔍  ➕ │  ← Header fijo (sticky)
└─────────────────────────────────┘
│                                 │
│  [Filtros colapsables]          │
│                                 │
└─────────────────────────────────┘
```

**Componentes:**
- **Menú hamburguesa (☰)**: Sidebar navigation
- **Título**: "Cotizaciones" (font-weight: 700)
- **Búsqueda (🔍)**: Input rápido
- **Nueva (➕)**: Botón FAB o inline

---

## 🔍 FILTROS RÁPIDOS (Colapsables por defecto)

```
┌─────────────────────────────────┐
│ 🔽 Filtros                      │  ← Click para expandir
├─────────────────────────────────┤
│                                 │
│ Cliente:   [ Todos ▾ ]          │
│                                 │
│ Estado:    [ Pendiente ▾ ]      │
│   • Todos                       │
│   • Borrador                    │
│   • Enviada                     │
│   • Aprobada                    │
│   • Vencida                     │
│   • Anulada                     │
│                                 │
│ Fecha:     [ Últimos 30 días ]  │
│                                 │
│ [ Limpiar ]    [ Aplicar ]      │
│                                 │
└─────────────────────────────────┘
```

**UX:**
- ✅ Colapsado por defecto (ahorra espacio)
- ✅ Chips de estado con colores permanentes
- ✅ Filtros rápidos visibles cuando expandido

---

## 📄 LISTA DE COTIZACIONES (Cards Verticales)

### Card 1: Pendiente (Normal)

```
┌─────────────────────────────────┐
│ #COT-000245        🟡 Pendiente │
│                                 │
│ Cliente: Juan Pérez             │
│                                 │
│ Total: RD$ 3,450.00            │  ← GRANDE, protagonista
│                                 │
│ 📅 Emitida: 12/01/2026          │
│ ⏰ Vence en 5 días              │
│                                 │
│ [ 👁 ] [ ✏️ ] [ 🖨 ] [ ⋮ ]      │  ← Acciones compactas
└─────────────────────────────────┘
```

### Card 2: Aprobada (Éxito)

```
┌─────────────────────────────────┐
│ #COT-000244        🟢 Aprobada  │
│                                 │
│ Cliente: Empresa ABC SAC        │
│                                 │
│ Total: RD$ 8,120.00            │
│                                 │
│ 📅 Emitida: 10/01/2026          │
│ ✅ Vence en 12 días             │
│                                 │
│ [ 👁 ] [ ✏️ ] [ 🖨 ] [ ⋮ ]      │
└─────────────────────────────────┘
```

### Card 3: Vencida (Urgente)

```
┌─────────────────────────────────┐
│ #COT-000243        🔴 Vencida   │
│                                 │
│ Cliente: María López            │
│                                 │
│ Total: RD$ 950.00              │
│                                 │
│ 📅 Emitida: 08/01/2026          │
│ ⚠️ Vencida hace 3 días          │  ← Rojo, destacado
│                                 │
│ [ 👁 ] [ 🖨 ] [ ⋮ ]             │  ← Sin editar
└─────────────────────────────────┘
```

**Características:**
- ✅ Total grande y destacado (jerarquía visual)
- ✅ Estado con color semántico
- ✅ Vencimiento expresado como urgencia
- ✅ Acciones compactas (solo iconos)
- ✅ Card completa clickeable

---

## ⚡ ACCIONES RÁPIDAS (Bottom Sheet)

### Al hacer click en ⋮ o swipe

```
┌─────────────────────────────────┐
│ ───── Acciones ─────            │
│                                 │
│ 👁 Ver Detalle                  │
│ ✏️ Editar                       │
│ 📄 Duplicar                    │
│ 📧 Enviar por Email             │
│ 🗑 Anular                       │
│                                 │
│ [ Cancelar ]                    │
└─────────────────────────────────┘
```

**UX:**
- ✅ Bottom sheet nativo mobile
- ✅ Acciones contextuales según estado
- ✅ Swipe para abrir/cerrar

---

## ➕ BOTÓN FLOTANTE (FAB)

```
                ┌───────┐
                │   ➕   │
                │ Nueva │
                └───────┘
```

**Posición:** Fijo abajo a la derecha

**Comportamiento:**
- ✅ Siempre visible
- ✅ Elevado sobre contenido
- ✅ Animación al tocar
- ✅ Acceso rápido a crear cotización

---

## 📊 ESTADOS VISUALES (Mobile Friendly)

### Colores Semánticos

```
🟡 Pendiente   → Fondo amarillo claro (#fef3c7)
                Borde: #f59e0b
                
🟢 Aprobada    → Fondo verde claro (#d1fae5)
                Borde: #10b981
                
🔴 Vencida     → Fondo rojo claro (#fee2e2)
                Borde: #ef4444
                ⚠️ Borde más grueso
                
🔵 Enviada     → Fondo azul claro (#dbeafe)
                Borde: #3b82f6
                
⚫ Anulada     → Fondo gris (#f3f4f6)
                Borde: #6b7280
```

---

## 🚫 ESTADO VACÍO

```
┌─────────────────────────────────┐
│                                 │
│         📄                      │
│                                 │
│   No hay cotizaciones           │
│                                 │
│   Aún no se han registrado      │
│   cotizaciones                  │
│                                 │
│   [ Crear Cotización ]          │
│                                 │
└─────────────────────────────────┘
```

---

## 🔄 ESTADO DE CARGA

```
┌─────────────────────────────────┐
│                                 │
│         ⏳                      │
│                                 │
│   Cargando cotizaciones...      │
│                                 │
└─────────────────────────────────┘
```

---

## 🎨 ESPECIFICACIONES DE DISEÑO

### Tipografía

```
Título Card:    18px, weight: 700
Total:          28px, weight: 800  ← Protagonista
Cliente:        16px, weight: 600
Meta info:      13px, weight: 500
Número:         11px, weight: 600 (uppercase, muted)
```

### Espaciado

```
Padding Card:       16px
Gap entre cards:    16px
Padding interno:    12px
```

### Colores Mobile

```
Fondo claro:    #ffffff
Fondo oscuro:   #1e293b
Texto claro:    #0f172a
Texto oscuro:   #f1f5f9
Borde:          #e5e7eb (light) / #334155 (dark)
```

### Interacciones

```
Tap:            Feedback visual (scale 0.98)
Swipe:          Abre bottom sheet
Long press:     Menú contextual
Pull refresh:   Recargar lista
```

---

## 📐 LAYOUT RESPONSIVE

### Breakpoints

```
Mobile:    < 768px  → 1 columna
Tablet:    768-1024 → 2 columnas
Desktop:   > 1024   → 3+ columnas
```

### Grid Mobile

```
┌─────────────┐
│   Card 1    │
├─────────────┤
│   Card 2    │
├─────────────┤
│   Card 3    │
├─────────────┤
│   Card 4    │
└─────────────┘
```

---

## 🧠 PRINCIPIOS UX APLICADOS

### ✅ Mobile-First

1. **Cards verticales** (no tablas en mobile)
2. **Acciones críticas visibles**, secundarias ocultas
3. **Filtros colapsables** (ahorra espacio)
4. **FAB permanente** (acceso rápido)
5. **Bottom Sheet** (no rompe flujo)
6. **Lectura en 1 columna** (escaneable)

### ✅ Jerarquía Visual

1. **Total = Protagonista** (28px, weight 800)
2. **Estado = Secundario** (badge compacto)
3. **Meta info = Terciario** (13px, muted)
4. **Acciones = Solo al hover/tap**

### ✅ Micro-interacciones

1. **Card clickable** clara (cursor pointer)
2. **Feedback táctil** (scale on active)
3. **Transiciones suaves** (0.2s ease)
4. **Estados hover** (acciones aparecen)

---

## 🚀 MEJORAS FUTURAS (Nivel SaaS Top)

### Preview rápido al hover
```
Card → Muestra resumen sin abrir
```

### Selección múltiple
```
[ ] Card 1
[ ] Card 2
[✓] Card 3
```

### Acciones bulk
```
[Seleccionadas: 3]
[ Anular ] [ Exportar ] [ Enviar ]
```

### Timeline visual de estado
```
Borrador → Enviada → Aprobada
  ●─────────●─────────●
```

### Indicador "vence en X días"
```
⏰ Vence en 5 días
⚠️ Vencida hace 3 días
```

---

## 📝 NOTAS DE IMPLEMENTACIÓN

### Componentes necesarios

1. **CotizacionCardMobile.js** → Versión mobile de la card
2. **BottomSheet.js** → Componente de acciones
3. **FAB.js** → Botón flotante
4. **FiltrosColapsables.js** → Filtros expandibles

### Media Queries

```css
@media (max-width: 768px) {
    .listaCotizaciones {
        grid-template-columns: 1fr;
    }
    
    .cardActions {
        opacity: 1; /* Siempre visible en mobile */
    }
    
    .totalHero {
        font-size: 1.5rem; /* Más pequeño en mobile */
    }
}
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] Header sticky con búsqueda
- [ ] Filtros colapsables
- [ ] Cards verticales (1 columna)
- [ ] Total como protagonista
- [ ] Acciones compactas
- [ ] Bottom sheet para acciones
- [ ] FAB flotante
- [ ] Estados visuales con colores
- [ ] Pull to refresh
- [ ] Feedback táctil
- [ ] Modo oscuro completo
- [ ] Animaciones suaves

---

**Diseño inspirado en:** Odoo, Stripe, Linear, SAP Fiori

**Principio rector:** "Menos es más, pero lo importante debe gritar"

