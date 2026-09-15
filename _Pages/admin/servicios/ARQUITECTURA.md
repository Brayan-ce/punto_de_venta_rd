# 🏗️ Arquitectura de Servicios - Metodología

## 📋 Índice
1. [Decisión: Plantillas como Página](#decisión-plantillas-como-página)
2. [Estructura Conceptual](#estructura-conceptual)
3. [Estructura de Archivos](#estructura-de-archivos)
4. [Principios y Convenciones](#principios-y-convenciones)
5. [Flujo de Datos](#flujo-de-datos)
6. [Guía de Implementación](#guía-de-implementación)

---

## 🎯 Decisión: Plantillas como Página

### ✅ **Plantillas = Página Separada** (NO Modal)

**Razones:**
- ✅ **Escalabilidad**: Las plantillas pueden crecer (recursos, configuraciones complejas)
- ✅ **Navegación clara**: URL dedicada `/admin/servicios/plantillas`
- ✅ **Consistencia**: Sigue el mismo patrón que `clientes/credito`
- ✅ **Mejor UX**: No sobrecarga la página principal con modales complejos
- ✅ **Ya implementado**: Ya existe como página separada

**Cuándo usar Modal:**
- Acciones rápidas (confirmar eliminación, ver detalles simples)
- Formularios simples de 1-2 campos
- No aplica para plantillas (tienen recursos, configuraciones)

---

## 🧱 Estructura Conceptual

```
Servicios
├── 📋 Listar servicios
│   └── (usa Plantilla para crear)
├── ➕ Crear servicio
│   └── (usa Plantilla)
├── 👁️ Ver servicio
├── ✏️ Editar servicio
└── 📄 Plantillas de servicio
    ├── ➕ Crear plantilla
    ├── ✏️ Editar plantilla
    └── 🗑️ Eliminar plantilla
```

### Relaciones:
- **Crear Servicio** → Selecciona una **Plantilla** → Pre-llena datos
- **Listar Servicios** → Botón "Plantillas" → Navega a página de plantillas
- **Plantillas** → Independiente, puede tener CRUD completo

---

## 📁 Estructura de Archivos

### `_Pages/admin/servicios/` (Lógica + UI)

```
_Pages/
  admin/
    servicios/
      ├── servicios.js              # Vista principal (listar)
      ├── servicios.module.css      # Estilos del listado
      ├── servidor.js               # Server actions SOLO del listado
      │
      ├── nuevo/
      │   ├── nuevo.js              # Vista crear servicio
      │   ├── nuevo.module.css      # Estilos crear
      │   └── servidor.js           # Server actions crear
      │
      ├── editar/
      │   ├── editar.js             # Vista editar servicio
      │   ├── editar.module.css     # Estilos editar
      │   └── servidor.js           # Server actions editar
      │
      ├── ver/
      │   ├── ver.js                # Vista detalle servicio
      │   ├── ver.module.css        # Estilos detalle
      │   └── servidor.js           # Server actions ver
      │
      └── plantillas/
          ├── plantillas.js         # Vista listar plantillas
          ├── plantillas.module.css # Estilos plantillas
          ├── servidor.js           # Server actions plantillas
          │
          ├── nuevo/
          │   ├── nuevo.js          # Vista crear plantilla
          │   ├── nuevo.module.css
          │   └── servidor.js
          │
          └── editar/
              ├── editar.js          # Vista editar plantilla
              ├── editar.module.css
              └── servidor.js
```

### `app/(admin)/admin/servicios/` (Enrutamiento)

```
app/
  (admin)/
    admin/
      servicios/
        ├── page.js                 # Ruta: /admin/servicios
        │
        ├── nuevo/
        │   └── page.js             # Ruta: /admin/servicios/nuevo
        │
        ├── editar/
        │   └── [id]/
        │       └── page.js         # Ruta: /admin/servicios/editar/[id]
        │
        ├── ver/
        │   └── [id]/
        │       └── page.js         # Ruta: /admin/servicios/ver/[id]
        │
        └── plantillas/
            ├── page.js             # Ruta: /admin/servicios/plantillas
            │
            ├── nuevo/
            │   └── page.js         # Ruta: /admin/servicios/plantillas/nuevo
            │
            └── editar/
                └── [id]/
                    └── page.js     # Ruta: /admin/servicios/plantillas/editar/[id]
```

---

## 🎨 Principios y Convenciones

### 1. **Separación por Caso de Uso**
Cada carpeta (`nuevo/`, `editar/`, `ver/`, `plantillas/`) es un caso de uso independiente.

### 2. **Nombres Simples**
- ✅ `servidor.js` (NO `service.js`, `actions.js`, `repository.js`)
- ✅ `page.js` (NO `route.js`, `layout.js`)
- ✅ `*.module.css` (CSS Modules)

### 3. **Server Actions por Caso**
Cada `servidor.js` contiene SOLO las acciones de su caso de uso:
- `servicios/servidor.js` → `obtenerServicios()`
- `nuevo/servidor.js` → `crearServicio()`
- `ver/servidor.js` → `obtenerServicioPorId()`
- `editar/servidor.js` → `actualizarServicio()`
- `plantillas/servidor.js` → `obtenerPlantillas()`, `crearPlantilla()`, etc.

### 4. **Vistas Client-Side**
Todas las vistas (`*.js`) son `"use client"`:
- Manejan estado local
- Usan hooks de React
- Llaman a server actions

### 5. **Rutas Delgadas**
Los `page.js` en `app/` son wrappers simples:
```javascript
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import ServiciosAdmin from "@/_Pages/admin/servicios/servicios";

export default function Page() {
  return (
    <ClienteWrapper>
      <ServiciosAdmin />
    </ClienteWrapper>
  );
}
```

---

## 🔄 Flujo de Datos

### Ejemplo: Crear Servicio

```
1. Usuario → /admin/servicios/nuevo
   ↓
2. app/(admin)/admin/servicios/nuevo/page.js
   ↓ (renderiza)
3. _Pages/admin/servicios/nuevo/nuevo.js
   ↓ (llama a)
4. _Pages/admin/servicios/nuevo/servidor.js
   ↓ (ejecuta)
5. Base de Datos
   ↓ (retorna)
6. nuevo.js → Muestra resultado
```

### Ejemplo: Listar Servicios

```
1. Usuario → /admin/servicios
   ↓
2. app/(admin)/admin/servicios/page.js
   ↓ (renderiza)
3. _Pages/admin/servicios/servicios.js
   ↓ (llama a)
4. _Pages/admin/servicios/servidor.js → obtenerServicios()
   ↓ (ejecuta)
5. Base de Datos
   ↓ (retorna)
6. servicios.js → Renderiza lista
```

---

## 📝 Guía de Implementación

### Paso 1: Crear Estructura Base
```bash
_Pages/admin/servicios/
  ├── servicios.js
  ├── servicios.module.css
  ├── servidor.js
  ├── nuevo/
  ├── editar/
  ├── ver/
  └── plantillas/
```

### Paso 2: Migrar Funciones del Servidor Actual

**Desde `_Pages/admin/servicios/servidor.js`:**

| Función Actual | Nuevo Ubicación |
|----------------|-----------------|
| `obtenerServicios()` | `servicios/servidor.js` |
| `crearServicio()` | `nuevo/servidor.js` |
| `obtenerServicioPorId()` | `ver/servidor.js` |
| `crearPlantillaServicio()` | `plantillas/servidor.js` |
| `actualizarPlantillaServicio()` | `plantillas/editar/servidor.js` |
| `eliminarPlantillaServicio()` | `plantillas/servidor.js` |
| `obtenerPlantillasServicio()` | `plantillas/servidor.js` |
| `obtenerPlantillaServicio()` | `plantillas/editar/servidor.js` |

### Paso 3: Crear Rutas en `app/`

Cada `page.js` sigue el mismo patrón:
```javascript
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import Componente from "@/_Pages/admin/servicios/[carpeta]/[archivo]";

export default function Page() {
  return (
    <ClienteWrapper>
      <Componente />
    </ClienteWrapper>
  );
}
```

### Paso 4: Actualizar Imports

**Antes:**
```javascript
import { crearServicio } from '../servidor'
```

**Después:**
```javascript
import { crearServicio } from './servidor'  // mismo directorio
```

---

## ✅ Checklist de Refactorización

- [ ] Crear estructura de carpetas
- [ ] Migrar `obtenerServicios()` a `servicios/servidor.js`
- [ ] Migrar `crearServicio()` a `nuevo/servidor.js`
- [ ] Migrar `obtenerServicioPorId()` a `ver/servidor.js`
- [ ] Crear `editar/servidor.js` con `actualizarServicio()`
- [ ] Migrar funciones de plantillas a `plantillas/servidor.js`
- [ ] Crear rutas en `app/(admin)/admin/servicios/`
- [ ] Actualizar imports en todas las vistas
- [ ] Probar cada caso de uso
- [ ] Eliminar `servidor.js` antiguo (después de migrar todo)

---

## 🎯 Beneficios de Esta Arquitectura

1. ✅ **Mantenibilidad**: Cada caso de uso está aislado
2. ✅ **Escalabilidad**: Fácil agregar nuevos casos de uso
3. ✅ **Claridad**: Nombres simples y consistentes
4. ✅ **Consistencia**: Mismo patrón que `clientes`
5. ✅ **Separación de Responsabilidades**: Server actions separadas por caso
6. ✅ **Testabilidad**: Cada módulo puede probarse independientemente

---

## 📚 Referencias

- Patrón base: `_Pages/admin/clientes/`
- Enrutamiento: `app/(admin)/admin/clientes/`
- Server Actions: Next.js 13+ App Router

---

**Última actualización**: 2024
**Versión**: 1.0

