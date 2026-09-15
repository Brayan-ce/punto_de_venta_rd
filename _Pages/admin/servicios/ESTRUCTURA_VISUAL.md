# 📊 Estructura Visual de Servicios

## 🗂️ Árbol de Archivos Completo

```
_Pages/admin/servicios/
│
├── 📄 servicios.js                    ← Vista principal (LISTAR)
├── 📄 servicios.module.css           ← Estilos del listado
├── 📄 servidor.js                    ← Server actions: obtenerServicios()
├── 📄 ARQUITECTURA.md                ← Documentación
│
├── 📁 nuevo/
│   ├── 📄 nuevo.js                   ← Vista CREAR servicio
│   ├── 📄 nuevo.module.css          ← Estilos crear
│   └── 📄 servidor.js                ← Server actions: crearServicio()
│
├── 📁 editar/
│   ├── 📄 editar.js                 ← Vista EDITAR servicio
│   ├── 📄 editar.module.css         ← Estilos editar
│   └── 📄 servidor.js                ← Server actions: actualizarServicio()
│
├── 📁 ver/
│   ├── 📄 ver.js                    ← Vista VER detalle
│   ├── 📄 ver.module.css            ← Estilos detalle
│   └── 📄 servidor.js               ← Server actions: obtenerServicioPorId()
│
└── 📁 plantillas/
    ├── 📄 plantillas.js             ← Vista LISTAR plantillas
    ├── 📄 plantillas.module.css     ← Estilos plantillas
    ├── 📄 servidor.js                ← Server actions: obtenerPlantillas(), eliminarPlantilla()
    │
    ├── 📁 nuevo/
    │   ├── 📄 nuevo.js              ← Vista CREAR plantilla
    │   ├── 📄 nuevo.module.css
    │   └── 📄 servidor.js            ← Server actions: crearPlantillaServicio()
    │
    └── 📁 editar/
        ├── 📄 editar.js              ← Vista EDITAR plantilla
        ├── 📄 editar.module.css
        └── 📄 servidor.js             ← Server actions: actualizarPlantillaServicio(), obtenerPlantillaServicio()
```

---

## 🛣️ Rutas en `app/(admin)/admin/servicios/`

```
app/(admin)/admin/servicios/
│
├── 📄 page.js                        ← /admin/servicios
│   └── Renderiza: servicios.js
│
├── 📁 nuevo/
│   └── 📄 page.js                    ← /admin/servicios/nuevo
│       └── Renderiza: nuevo/nuevo.js
│
├── 📁 editar/
│   └── 📁 [id]/
│       └── 📄 page.js                 ← /admin/servicios/editar/[id]
│           └── Renderiza: editar/editar.js
│
├── 📁 ver/
│   └── 📁 [id]/
│       └── 📄 page.js                  ← /admin/servicios/ver/[id]
│           └── Renderiza: ver/ver.js
│
└── 📁 plantillas/
    ├── 📄 page.js                    ← /admin/servicios/plantillas
    │   └── Renderiza: plantillas/plantillas.js
    │
    ├── 📁 nuevo/
    │   └── 📄 page.js                 ← /admin/servicios/plantillas/nuevo
    │       └── Renderiza: plantillas/nuevo/nuevo.js
    │
    └── 📁 editar/
        └── 📁 [id]/
            └── 📄 page.js             ← /admin/servicios/plantillas/editar/[id]
                └── Renderiza: plantillas/editar/editar.js
```

---

## 🔄 Flujo de Funciones del Servidor

### Migración desde `servidor.js` actual:

```
┌─────────────────────────────────────────────────────────┐
│  _Pages/admin/servicios/servidor.js (ACTUAL)          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  obtenerServicios()          → servicios/servidor.js    │
│  crearServicio()             → nuevo/servidor.js        │
│  obtenerServicioPorId()      → ver/servidor.js          │
│  crearPlantillaServicio()    → plantillas/nuevo/servidor.js │
│  actualizarPlantillaServicio() → plantillas/editar/servidor.js │
│  eliminarPlantillaServicio() → plantillas/servidor.js  │
│  obtenerPlantillasServicio() → plantillas/servidor.js  │
│  obtenerPlantillaServicio()  → plantillas/editar/servidor.js │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Mapeo de Imports

### Antes (Todo en un servidor.js):
```javascript
// En nuevo/nuevo.js
import { crearServicio, obtenerPlantillasServicio } from '../servidor'
```

### Después (Separado por caso):
```javascript
// En nuevo/nuevo.js
import { crearServicio } from './servidor'  // mismo directorio
import { obtenerPlantillasServicio } from '../plantillas/servidor'
```

---

## 🎯 Casos de Uso y Sus Archivos

| Caso de Uso | Vista | Server Actions | Ruta |
|-------------|-------|----------------|------|
| **Listar Servicios** | `servicios.js` | `servidor.js` | `/admin/servicios` |
| **Crear Servicio** | `nuevo/nuevo.js` | `nuevo/servidor.js` | `/admin/servicios/nuevo` |
| **Editar Servicio** | `editar/editar.js` | `editar/servidor.js` | `/admin/servicios/editar/[id]` |
| **Ver Servicio** | `ver/ver.js` | `ver/servidor.js` | `/admin/servicios/ver/[id]` |
| **Listar Plantillas** | `plantillas/plantillas.js` | `plantillas/servidor.js` | `/admin/servicios/plantillas` |
| **Crear Plantilla** | `plantillas/nuevo/nuevo.js` | `plantillas/nuevo/servidor.js` | `/admin/servicios/plantillas/nuevo` |
| **Editar Plantilla** | `plantillas/editar/editar.js` | `plantillas/editar/servidor.js` | `/admin/servicios/plantillas/editar/[id]` |

---

## ✅ Checklist de Implementación

### Fase 1: Estructura Base
- [x] Crear `ARQUITECTURA.md`
- [x] Crear `ESTRUCTURA_VISUAL.md`
- [ ] Crear carpeta `editar/`
- [ ] Crear carpetas `plantillas/nuevo/` y `plantillas/editar/`

### Fase 2: Migración de Server Actions
- [ ] Crear `servicios/servidor.js` con `obtenerServicios()`
- [ ] Crear `nuevo/servidor.js` con `crearServicio()`
- [ ] Crear `ver/servidor.js` con `obtenerServicioPorId()`
- [ ] Crear `editar/servidor.js` con `actualizarServicio()`
- [ ] Crear `plantillas/servidor.js` con funciones de listado
- [ ] Crear `plantillas/nuevo/servidor.js` con `crearPlantillaServicio()`
- [ ] Crear `plantillas/editar/servidor.js` con funciones de edición

### Fase 3: Rutas en App
- [ ] Crear `app/(admin)/admin/servicios/editar/[id]/page.js`
- [ ] Crear `app/(admin)/admin/servicios/plantillas/nuevo/page.js`
- [ ] Crear `app/(admin)/admin/servicios/plantillas/editar/[id]/page.js`

### Fase 4: Actualización de Imports
- [ ] Actualizar imports en `servicios.js`
- [ ] Actualizar imports en `nuevo/nuevo.js`
- [ ] Actualizar imports en `ver/ver.js`
- [ ] Actualizar imports en `plantillas/plantillas.js`

### Fase 5: Limpieza
- [ ] Eliminar funciones migradas del `servidor.js` antiguo
- [ ] Verificar que todo funciona
- [ ] Eliminar `servidor.js` antiguo si está vacío

---

**Última actualización**: 2024

