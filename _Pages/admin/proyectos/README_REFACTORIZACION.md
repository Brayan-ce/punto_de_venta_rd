# 🏗️ Refactorización del Módulo de Proyectos

## 📋 Resumen Ejecutivo

Se ha refactorizado completamente el módulo de Proyectos siguiendo una **arquitectura profesional por capas** que separa responsabilidades y mejora la mantenibilidad del código.

---

## 🎯 Objetivos Cumplidos

✅ **Arquitectura por Capas**: Separación clara entre Controladores, Servicios y Repositorios  
✅ **Validación Robusta**: Sistema de validación mejorado con mensajes claros  
✅ **Código Reutilizable**: Repositorio y Servicios reutilizables  
✅ **Mejor UX**: Formulario con validación en tiempo real y feedback visual  
✅ **Escalabilidad**: Estructura preparada para futuras funcionalidades  

---

## 📁 Nueva Estructura de Archivos

```
_Pages/admin/proyectos/
├── README_REFACTORIZACION.md          # Este archivo
│
├── schemas/
│   ├── proyectoSchema.js              # Esquemas Zod (opcional, para futuro)
│   └── validaciones.js                # Validaciones manuales (actual)
│
├── repositories/
│   └── ProyectoRepository.js          # Capa de acceso a datos
│
├── services/
│   └── ProyectoService.js             # Capa de lógica de negocio
│
├── servidor.js                        # Server Actions (Controladores)
│
├── proyectos.js                       # Dashboard principal
├── proyectos.module.css               # Estilos
│
├── nuevo/
│   └── nuevo.js                       # Formulario de creación (mejorado)
│
└── ver/
    └── ver.js                         # Vista de detalle
```

---

## 🏛️ Arquitectura por Capas

### 1. Capa de Controladores (`servidor.js`)

**Responsabilidades:**
- Validar sesión del usuario
- Extraer parámetros de cookies
- Delegar a la capa de servicios
- Formatear respuestas

**NO contiene:**
- ❌ Lógica de negocio
- ❌ Queries SQL
- ❌ Validaciones complejas

**Ejemplo:**
```javascript
export async function crearProyecto(datos) {
  const sesion = await obtenerSesion()
  if (!sesion) {
    return { success: false, mensaje: 'Sesión inválida' }
  }
  
  return await ProyectoService.crearProyecto(
    datos,
    sesion.empresaId,
    sesion.userId
  )
}
```

---

### 2. Capa de Servicios (`services/ProyectoService.js`)

**Responsabilidades:**
- Reglas de negocio
- Validaciones de dominio
- Generación de códigos únicos
- Orquestación de operaciones complejas
- Transiciones de estado

**NO contiene:**
- ❌ Queries SQL directas
- ❌ Gestión de conexiones de BD
- ❌ Validación de sesión

**Ejemplo:**
```javascript
static async crearProyecto(datos, empresaId, userId) {
  // 1. Validar datos
  const validacion = validarCrearProyecto(datos)
  if (!validacion.valido) {
    return { success: false, errores: validacion.errores }
  }
  
  // 2. Verificar nombre único
  const existe = await ProyectoRepository.existsByNombre(...)
  
  // 3. Generar código
  const codigo = await this.generarCodigoProyecto(empresaId)
  
  // 4. Crear proyecto
  const proyecto = await ProyectoRepository.create(...)
  
  return { success: true, proyecto }
}
```

---

### 3. Capa de Repositorio (`repositories/ProyectoRepository.js`)

**Responsabilidades:**
- Queries SQL puras
- Mapeo de resultados
- Gestión de conexiones
- Operaciones CRUD básicas

**NO contiene:**
- ❌ Lógica de negocio
- ❌ Validaciones de dominio
- ❌ Generación de códigos

**Ejemplo:**
```javascript
static async create(datos) {
  let connection
  try {
    connection = await db.getConnection()
    const [result] = await connection.query(
      'INSERT INTO proyectos (...) VALUES (...)',
      [...]
    )
    return await this.findById(result.insertId, datos.empresa_id)
  } finally {
    if (connection) connection.release()
  }
}
```

---

### 4. Capa de Validación (`schemas/validaciones.js`)

**Responsabilidades:**
- Validar estructura de datos
- Validar reglas de negocio básicas
- Retornar errores específicos por campo

**Ejemplo:**
```javascript
export function validarCrearProyecto(datos) {
  const errores = {}
  
  if (!datos.nombre || datos.nombre.trim() === '') {
    errores.nombre = 'El nombre del proyecto es obligatorio'
  }
  
  // ... más validaciones
  
  return { valido: Object.keys(errores).length === 0, errores }
}
```

---

## 🔄 Flujo de Datos

```
Usuario (Frontend)
    ↓
Server Action (servidor.js)
    ↓ Validar sesión
Servicio (ProyectoService.js)
    ↓ Validar datos
    ↓ Aplicar reglas de negocio
Repositorio (ProyectoRepository.js)
    ↓ Ejecutar query SQL
Base de Datos (MySQL)
    ↓
Respuesta (vuelve por las capas)
```

---

## ✨ Mejoras Implementadas

### 1. Validación Mejorada

**Antes:**
```javascript
// Validación básica en componente
if (!formData.nombre) {
  newErrors.nombre = 'El nombre es obligatorio'
}
```

**Ahora:**
```javascript
// Validación centralizada y reutilizable
const validacion = validarCrearProyecto(datos)
// Incluye validación de tipos, rangos, formatos, etc.
```

### 2. Generación de Códigos

**Antes:**
```javascript
// Lógica mezclada en server action
const [ultimoProyecto] = await connection.query(...)
let numero = 1
if (ultimoProyecto.length > 0) {
  const match = ultimoProyecto[0].codigo_proyecto.match(/\d+$/)
  if (match) numero = parseInt(match[0]) + 1
}
const codigoProyecto = `PRJ-${new Date().getFullYear()}-${String(numero).padStart(3, '0')}`
```

**Ahora:**
```javascript
// Método reutilizable en servicio
const codigo = await ProyectoService.generarCodigoProyecto(empresaId)
```

### 3. Manejo de Errores

**Antes:**
```javascript
// Errores genéricos
catch (error) {
  return { success: false, mensaje: 'Error al crear proyecto' }
}
```

**Ahora:**
```javascript
// Errores específicos y estructurados
if (error.name === 'ZodError') {
  // Errores de validación por campo
} else {
  // Errores de sistema con logging
  console.error('Error en ProyectoService:', error)
}
```

### 4. Formulario Mejorado

**Nuevas características:**
- ✅ Validación en tiempo real (onBlur)
- ✅ Contador de caracteres
- ✅ Scroll automático al primer error
- ✅ Campos marcados como "touched"
- ✅ Mejor feedback visual

---

## 🚀 Próximos Pasos (Opcional)

### 1. Instalar Zod y React Hook Form

Para mejorar aún más la validación y el manejo de formularios:

```bash
npm install zod react-hook-form @hookform/resolvers
```

**Beneficios:**
- Validación más robusta con esquemas TypeScript
- Mejor integración con React Hook Form
- Validación automática en frontend y backend

### 2. Migrar a Zod

Una vez instalado Zod, se puede migrar `schemas/validaciones.js` a usar `proyectoSchema.js`:

```javascript
// En ProyectoService.js
import { crearProyectoSchema } from '../schemas/proyectoSchema'

const datosValidados = crearProyectoSchema.parse(datos)
```

### 3. Agregar React Hook Form

Mejorar el componente `nuevo.js`:

```javascript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { crearProyectoSchema } from '../schemas/proyectoSchema'

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(crearProyectoSchema)
})
```

---

## 📊 Comparación: Antes vs Después

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Separación de responsabilidades** | ❌ Todo en server actions | ✅ Por capas (Controller, Service, Repository) |
| **Validación** | ⚠️ Básica, duplicada | ✅ Centralizada, reutilizable |
| **Manejo de errores** | ⚠️ Genérico | ✅ Específico, estructurado |
| **Reutilización** | ❌ Código duplicado | ✅ Métodos reutilizables |
| **Testabilidad** | ❌ Difícil de testear | ✅ Fácil de testear (cada capa independiente) |
| **Mantenibilidad** | ⚠️ Media | ✅ Alta |
| **Escalabilidad** | ⚠️ Limitada | ✅ Preparada para crecer |

---

## 🧪 Testing (Futuro)

Con esta arquitectura, es fácil agregar tests:

```javascript
// Test de servicio
describe('ProyectoService', () => {
  it('debe generar código único', async () => {
    const codigo = await ProyectoService.generarCodigoProyecto(1)
    expect(codigo).toMatch(/^PRJ-\d{4}-\d{3}$/)
  })
  
  it('debe validar nombre único', async () => {
    const resultado = await ProyectoService.crearProyecto({
      nombre: 'Proyecto Existente',
      // ...
    }, 1, 1)
    expect(resultado.success).toBe(false)
    expect(resultado.errores.nombre).toBeDefined()
  })
})
```

---

## 📝 Notas de Implementación

### Campos Pendientes de Mejorar

1. **`usuario_responsable_id`**: Actualmente es un input de texto. Debe convertirse en un select con lista de usuarios.

2. **Tags**: El campo de tags no está implementado en el formulario. Se puede agregar con un componente de tags.

3. **Ubicación**: Se puede mejorar con autocompletado o mapa.

### Funcionalidades Futuras

- [ ] Edición de proyectos
- [ ] Eliminación de proyectos
- [ ] Cambio de estado
- [ ] Creación de obras desde proyecto
- [ ] Vista de estadísticas
- [ ] Exportación a Excel/PDF

---

## 🔗 Referencias

- [Documentación Técnica del Módulo](./DOCUMENTACION_TECNICA_MODULO_PROYECTOS.md)
- [Metodología de Implementación](../../constructora/METODOLOGIA_IMPLEMENTACION.md)

---

**Versión:** 1.0  
**Fecha:** 2026-01-21  
**Autor:** Equipo de Desarrollo

