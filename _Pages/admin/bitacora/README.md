# 📋 Módulo de Bitácora Diaria

**Versión:** 2.0 (Refactorizado)  
**Última actualización:** 2026-01-28

---

## 🎯 ¿Qué es este módulo?

El módulo de bitácora permite registrar diariamente las actividades realizadas en **obras** y **servicios**. Funciona como un diario de campo digital con:

- Registro de trabajo realizado
- Control de personal presente
- Evidencia fotográfica
- Condiciones climáticas
- Observaciones

---

## 🗂️ Estructura de Archivos

```
bitacora/
├── README.md                    ← Estás aquí
├── bitacora.js                  ← Listado con filtros avanzados
├── bitacora.module.css          ← Estilos del listado
├── servidor.js                  ← Server actions polimórficas
├── nuevo/
│   ├── nuevo.js                ← Wizard de 4 pasos
│   └── nuevo.module.css        ← Estilos del wizard
└── ver/
    ├── ver.js                  ← Vista detallada
    └── ver.module.css          ← Estilos de detalle
```

---

## 🚀 Quick Start

### Para usar el módulo:

```javascript
// En tu routing (app router)
import BitacoraAdmin from "@/_Pages/admin/bitacora/bitacora"

export default function Page() {
  return <BitacoraAdmin />
}
```

### Para crear una bitácora:

```javascript
import { crearBitacora } from "@/_Pages/admin/bitacora/servidor"

const resultado = await crearBitacora({
    tipo_destino: 'obra', // o 'servicio'
    destino_id: 123,
    fecha_bitacora: '2026-01-28',
    trabajo_realizado: 'Instalación de...',
    trabajadores_presentes: [1, 2, 3],
    zona_sitio: 'Segundo piso',
    condiciones_clima: 'soleado',
    observaciones: 'Opcional...'
})
```

---

## 🔑 Características Clave

### 1. Diseño Polimórfico

El módulo soporta dos tipos de destino:

- **🏗️ Obras:** Construcciones continuas (bitácora obligatoria)
- **⚡ Servicios:** Intervenciones puntuales (bitácora opcional)

### 2. Validación Robusta

Antes de guardar, valida:
- ✅ Tipo de destino y destino válidos
- ✅ Fecha no futura
- ✅ Trabajo descrito (mínimo 10 caracteres)
- ✅ Al menos 1 trabajador presente
- ✅ No duplicados (1 bitácora por día/destino)

### 3. Wizard de 4 Pasos

**Paso 1:** Seleccionar tipo (Obra/Servicio) y destino  
**Paso 2:** Describir trabajo y clima  
**Paso 3:** Marcar trabajadores presentes y subir fotos  
**Paso 4:** Revisar y confirmar

### 4. Filtros Avanzados

- Por tipo de destino (obra/servicio)
- Por destino específico
- Por rango de fechas
- Por búsqueda de texto
- Limpiar filtros con un click

---

## 🔧 Server Actions Disponibles

### `obtenerBitacoras(filtros)`

**Obtiene lista de bitácoras con filtros opcionales**

```javascript
const { bitacoras } = await obtenerBitacoras({
    tipo_destino: 'obra', // opcional
    destino_id: 123,      // opcional
    fecha_desde: '2026-01-01', // opcional
    fecha_hasta: '2026-01-31', // opcional
    busqueda: 'instalación'    // opcional
})
```

### `crearBitacora(datos)`

**Crea nueva bitácora con validación de unicidad**

```javascript
const resultado = await crearBitacora({
    tipo_destino: 'obra',
    destino_id: 123,
    fecha_bitacora: '2026-01-28',
    zona_sitio: 'Segundo piso',
    trabajo_realizado: '...',
    trabajadores_presentes: [1, 2],
    condiciones_clima: 'soleado',
    observaciones: '...',
    fotos: [] // URLs procesadas
})
```

### `obtenerBitacoraPorId(id)`

**Obtiene bitácora completa con trabajadores y fotos**

```javascript
const { bitacora, trabajadores, fotos } = await obtenerBitacoraPorId(123)
```

### `obtenerTrabajadoresAsignados({ tipo_destino, destino_id, fecha })`

**Obtiene trabajadores asignados a un destino en una fecha**

```javascript
const { trabajadores } = await obtenerTrabajadoresAsignados({
    tipo_destino: 'obra',
    destino_id: 123,
    fecha: '2026-01-28'
})
```

### `obtenerObrasActivas()`

**Obtiene lista de obras activas para selector**

### `obtenerServiciosActivos()`

**Obtiene lista de servicios activos para selector**

---

## 🗄️ Estructura de Base de Datos

### Tabla Principal: `bitacora_diaria`

```sql
bitacora_diaria (
    id,
    empresa_id,
    tipo_destino,        ← 'obra' o 'servicio'
    destino_id,          ← ID de obra o servicio
    fecha_bitacora,
    zona_sitio,
    trabajo_realizado,
    observaciones,
    condiciones_clima,
    usuario_id,
    fecha_creacion,
    fecha_actualizacion
)

UNIQUE (tipo_destino, destino_id, fecha_bitacora)
```

### Tablas Relacionadas

**`bitacora_trabajadores`**
- Trabajadores presentes en la bitácora
- Relación: 1 bitácora → N trabajadores

**`bitacora_fotos`**
- Fotos de evidencia
- Relación: 1 bitácora → N fotos (máx 5)

---

## 🧩 Integración con Otros Módulos

### Con Módulo de Obras

```javascript
// Bitácoras de una obra específica
const { bitacoras } = await obtenerBitacoras({
    tipo_destino: 'obra',
    destino_id: obraId
})
```

### Con Módulo de Servicios

```javascript
// Bitácoras de un servicio específico
const { bitacoras } = await obtenerBitacoras({
    tipo_destino: 'servicio',
    destino_id: servicioId
})
```

### Con Módulo de Personal

```javascript
// Trabajadores asignados se cargan automáticamente
// al seleccionar destino y fecha
```

---

## 🎨 Componentes UI

### BitacoraAdmin (Listado)

**Ubicación:** `bitacora.js`

**Features:**
- Filtros avanzados (tipo, destino, fecha, texto)
- Estadísticas en tiempo real
- Cards visuales con badges
- Responsive

### NuevaBitacora (Formulario)

**Ubicación:** `nuevo/nuevo.js`

**Features:**
- Wizard de 4 pasos
- Validación progresiva
- Selector visual de tipo
- Grid de trabajadores
- Upload de fotos
- Pantalla de revisión

### VerBitacora (Detalle)

**Ubicación:** `ver/ver.js`

**Features:**
- Vista completa de bitácora
- Lista de trabajadores
- Galería de fotos con lightbox
- Metadata de auditoría

---

## 🔍 Ejemplos de Uso

### Ejemplo 1: Crear bitácora de obra del día

```javascript
// En el frontend
const handleCrearBitacora = async () => {
    const datos = {
        tipo_destino: 'obra',
        destino_id: obraId,
        fecha_bitacora: new Date().toISOString().split('T')[0],
        trabajo_realizado: document.getElementById('trabajo').value,
        trabajadores_presentes: trabajadoresSeleccionados,
        condiciones_clima: climaSeleccionado
    }
    
    const result = await crearBitacora(datos)
    
    if (result.success) {
        router.push('/admin/bitacora')
    } else {
        alert(result.mensaje)
    }
}
```

### Ejemplo 2: Filtrar bitácoras del mes

```javascript
const { bitacoras } = await obtenerBitacoras({
    fecha_desde: '2026-01-01',
    fecha_hasta: '2026-01-31'
})

console.log(`Bitácoras del mes: ${bitacoras.length}`)
```

### Ejemplo 3: Obtener detalles de bitácora

```javascript
const { bitacora, trabajadores, fotos } = await obtenerBitacoraPorId(123)

console.log('Destino:', bitacora.destino_nombre)
console.log('Trabajadores presentes:', trabajadores.length)
console.log('Fotos:', fotos.length)
```

---

## 🐛 Troubleshooting

### Error: "Ya existe una bitácora..."

**Causa:** Constraint de unicidad (tipo_destino + destino_id + fecha)

**Solución:** Cambiar fecha o editar bitácora existente

### Error: "Debe seleccionar al menos un trabajador"

**Causa:** Validación de trabajadores_presentes

**Solución:** Seleccionar al menos 1 trabajador en el paso 3

### No se cargan trabajadores

**Causa:** No hay trabajadores asignados a ese destino en esa fecha

**Solución:** El sistema mostrará todos los trabajadores activos disponibles

---

## 📚 Documentación Relacionada

- `documentacion/constructora/MODULO_BITACORA.md` - Metodología completa
- `documentacion/constructora/INTEGRACION_BITACORA.md` - Guía de integración
- `documentacion/constructora/REFACTORIZACION_BITACORA.md` - Resumen de cambios
- `_DB/migracion_bitacora_polimorfica.sql` - Script de migración

---

## 🤝 Contribuir

Para hacer cambios en este módulo:

1. **Leer documentación:** Empezar por `MODULO_BITACORA.md`
2. **Entender el core:** Revisar `core/construction/bitacora.js`
3. **Seguir patrones:** Usar constantes y validaciones del core
4. **Probar:** Verificar obras y servicios
5. **Documentar:** Actualizar README y docs

---

**Módulo refactorizado:** 2026-01-28  
**Estado:** ✅ Producción Ready  
**Mantenedor:** Equipo de Construcción

