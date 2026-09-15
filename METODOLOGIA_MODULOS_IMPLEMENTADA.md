# 🏗️ METODOLOGÍA: Sistema Modular por Empresa - Implementación Completa

## 📋 Resumen Ejecutivo

Se ha implementado un sistema completo de modularización que permite a cada empresa tener habilitados solo los módulos que necesita, evitando que se sientan abrumados con funcionalidades que no utilizan.

## 🎯 Objetivos Cumplidos

✅ **Modularización por Dominio**: Cada módulo es independiente y puede habilitarse/deshabilitarse por empresa  
✅ **Activación por Empresa**: Cada empresa ve solo los módulos que tiene habilitados  
✅ **Protección de Rutas**: El middleware protege automáticamente las rutas según módulos habilitados  
✅ **Interfaz Dinámica**: El header y menú se adaptan automáticamente según módulos habilitados  
✅ **Panel de Administración**: Superadmin puede gestionar módulos por empresa fácilmente  

## 📁 Estructura de Archivos Implementados

```
_DB/
├── migracion_modulos_sistema.sql          # Migración de tablas
└── scripts/
    ├── migracion_modulos_por_perfil.sql   # Scripts de migración por perfil
    └── README_MODULOS.md                   # Documentación técnica

lib/
└── modulos/
    ├── catalogo.js                         # Catálogo de módulos y rutas
    └── servidor.js                         # Funciones del servidor

hooks/
└── useModulos.js                           # Hook para cliente

app/
└── api/
    └── modulos/
        ├── route.js                        # API principal
        └── verificar/route.js              # API de verificación

_Pages/
├── admin/
│   └── header/
│       └── header.js                       # Header actualizado con módulos dinámicos
└── superadmin/
    └── empresas/
        └── modulos/
            ├── modulos.js                  # Panel de administración
            ├── modulos.module.css          # Estilos
            └── servidor.js                 # Funciones del servidor

middleware.js                                # Middleware actualizado
```

## 🗄️ Modelo de Datos

### Tabla: `modulos`
Catálogo de todos los módulos disponibles en el sistema.

**Campos principales:**
- `codigo`: Identificador único (ej: 'pos', 'financiamiento')
- `nombre`: Nombre descriptivo
- `categoria`: Categoría del módulo
- `siempre_habilitado`: Si es TRUE, siempre está habilitado (ej: core)
- `ruta_base`: Ruta principal del módulo

### Tabla: `empresa_modulos`
Relación entre empresas y módulos habilitados.

**Campos principales:**
- `empresa_id`: ID de la empresa
- `modulo_id`: ID del módulo
- `habilitado`: TRUE/FALSE

### Tabla: `empresa_modulo_config` (Opcional)
Configuraciones específicas por módulo y empresa.

## 🔧 Componentes Implementados

### 1. Catálogo de Módulos (`lib/modulos/catalogo.js`)

Define todos los módulos disponibles y sus rutas asociadas:

```javascript
export const MODULOS = {
    CORE: { codigo: 'core', rutas: [...] },
    POS: { codigo: 'pos', rutas: [...] },
    CREDITO: { codigo: 'credito', rutas: [...] },
    FINANCIAMIENTO: { codigo: 'financiamiento', rutas: [...] },
    CONSTRUCTORA: { codigo: 'constructora', rutas: [...] },
    CATALOGO: { codigo: 'catalogo', rutas: [...] }
}
```

**Funciones principales:**
- `obtenerModuloPorRuta(ruta)`: Obtiene el módulo al que pertenece una ruta
- `obtenerRutasModulo(codigo)`: Obtiene todas las rutas de un módulo
- `rutaPerteneceAModulo(ruta, codigo)`: Verifica si una ruta pertenece a un módulo

### 2. Funciones del Servidor (`lib/modulos/servidor.js`)

Funciones server-side para gestionar módulos:

- `obtenerModulosEmpresa(empresaId)`: Obtiene módulos habilitados para una empresa
- `verificarModuloHabilitado(empresaId, codigoModulo)`: Verifica si un módulo está habilitado
- `toggleModuloEmpresa(empresaId, moduloId, habilitado)`: Habilita/deshabilita módulo
- `verificarRutaPermitida(empresaId, ruta)`: Verifica si una ruta está permitida

### 3. Hook del Cliente (`hooks/useModulos.js`)

Hook React para usar módulos en componentes del cliente:

```javascript
const { tieneModulo, filtrarPorModulos } = useModulos()

// Verificar módulo
if (tieneModulo('financiamiento')) {
    // Mostrar contenido
}

// Filtrar navegación
const itemsFiltrados = filtrarPorModulos(itemsNavegacion)
```

### 4. API Endpoints (`app/api/modulos/`)

- `GET /api/modulos`: Obtiene módulos habilitados para la empresa del usuario
- `GET /api/modulos?todos=true`: Obtiene todos los módulos (solo superadmin)
- `POST /api/modulos/toggle`: Habilita/deshabilita módulo (solo superadmin)
- `GET /api/modulos/verificar?codigo=pos`: Verifica si un módulo está habilitado

### 5. Middleware de Protección (`middleware.js`)

Protege automáticamente las rutas según módulos habilitados:

- Verifica autenticación
- Superadmin tiene acceso a todo
- Verifica módulos habilitados para rutas de admin
- Redirige al dashboard si el módulo no está habilitado

### 6. Header Dinámico (`_Pages/admin/header/header.js`)

El header se actualiza automáticamente según módulos habilitados:

- Navegación principal filtrada por módulos
- Menú lateral agrupado por categorías
- Solo muestra módulos habilitados

### 7. Panel de Administración (`_Pages/superadmin/empresas/modulos/`)

Interfaz para que superadmin gestione módulos:

- Lista todos los módulos disponibles
- Agrupa por categorías
- Toggle para habilitar/deshabilitar
- Muestra módulos siempre habilitados

## 🚀 Flujo de Funcionamiento

### 1. Usuario Accede al Sistema

```
Usuario → Login → Cookies (empresaId, userId, userTipo)
```

### 2. Carga de Módulos

```
Header → useModulos() → GET /api/modulos → obtenerModulosEmpresa()
```

### 3. Navegación Dinámica

```
Header → filtrarPorModulos() → Solo muestra módulos habilitados
```

### 4. Protección de Rutas

```
Usuario → Navega a /admin/financiamiento → Middleware → verificarRutaPermitida()
→ Si no habilitado → Redirige a /admin/dashboard?error=modulo_no_disponible
```

### 5. Gestión de Módulos (Superadmin)

```
Superadmin → Panel Módulos → toggleModuloEmpresa() → Actualiza BD → Recarga módulos
```

## 📊 Perfiles de Negocio Predefinidos

### 1. POS Básico
```sql
CALL habilitar_modulos_por_perfil(EMPRESA_ID, 'pos_basico');
```
**Módulos**: Core + POS  
**Ideal para**: Tiendas pequeñas, negocios de retail básico

### 2. POS con Crédito
```sql
CALL habilitar_modulos_por_perfil(EMPRESA_ID, 'pos_credito');
```
**Módulos**: Core + POS + Crédito  
**Ideal para**: Negocios que venden a crédito

### 3. Financiamiento de Scooters
```sql
CALL habilitar_modulos_por_perfil(EMPRESA_ID, 'financiamiento_scooters');
```
**Módulos**: Core + POS + Financiamiento  
**Ideal para**: Negocios que financian scooters u otros activos

### 4. Constructora
```sql
CALL habilitar_modulos_por_perfil(EMPRESA_ID, 'constructora');
```
**Módulos**: Core + POS + Construcción  
**Ideal para**: Empresas constructoras, control de obras

### 5. Completo
```sql
CALL habilitar_modulos_por_perfil(EMPRESA_ID, 'completo');
```
**Módulos**: Todos los módulos  
**Ideal para**: Empresas grandes que necesitan todas las funcionalidades

## 🔒 Seguridad

1. **Validación de Permisos**: Solo superadmin puede gestionar módulos
2. **Protección de Rutas**: Middleware verifica módulos antes de permitir acceso
3. **Validación en Servidor**: Todas las funciones del servidor validan permisos
4. **Fail-Safe**: En caso de error, el sistema permite acceso (fail-open) para evitar bloqueos

## 📈 Ventajas del Sistema

1. **Escalabilidad**: Agregar nuevos módulos es fácil y no afecta a todos
2. **Personalización**: Cada empresa ve solo lo que necesita
3. **Mantenibilidad**: Módulos independientes, fácil de mantener
4. **Performance**: Menos código cargado = mejor rendimiento
5. **UX Mejorada**: Interfaz más clara y menos abrumadora
6. **Retrocompatibilidad**: Las empresas existentes siguen funcionando

## 🛠️ Instalación y Configuración

### Paso 1: Ejecutar Migración

```bash
mysql -u usuario -p punto_venta_rd < _DB/migracion_modulos_sistema.sql
```

### Paso 2: Habilitar Módulos para Empresas Existentes

```sql
-- Habilitar POS básico para todas las empresas
INSERT INTO empresa_modulos (empresa_id, modulo_id, habilitado)
SELECT e.id, m.id, TRUE
FROM empresas e
CROSS JOIN modulos m
WHERE m.codigo IN ('core', 'pos')
ON DUPLICATE KEY UPDATE habilitado = TRUE;
```

### Paso 3: Verificar Instalación

```sql
-- Ver módulos habilitados por empresa
SELECT 
    e.nombre_empresa,
    m.codigo,
    m.nombre,
    em.habilitado
FROM empresas e
JOIN empresa_modulos em ON e.id = em.empresa_id
JOIN modulos m ON em.modulo_id = m.id
WHERE e.activo = TRUE
ORDER BY e.nombre_empresa, m.categoria, m.nombre;
```

## 📝 Ejemplos de Uso

### En Componentes del Cliente

```javascript
import { useModulos } from '@/hooks/useModulos'

function MiComponente() {
    const { tieneModulo } = useModulos()
    
    if (!tieneModulo('financiamiento')) {
        return <div>Este módulo no está disponible para tu empresa</div>
    }
    
    return <div>Contenido del módulo de financiamiento</div>
}
```

### En Funciones del Servidor

```javascript
import { verificarModuloHabilitado } from '@/lib/modulos/servidor'

export async function miFuncionServidor(empresaId) {
    const tieneFinanciamiento = await verificarModuloHabilitado(
        empresaId, 
        'financiamiento'
    )
    
    if (!tieneFinanciamiento) {
        throw new Error('Módulo no habilitado')
    }
    
    // Continuar con la lógica...
}
```

### En el Header

```javascript
const navegacion = [
    { href: '/admin/financiamiento', modulo: 'financiamiento' },
    { href: '/admin/constructora', modulo: 'constructora' }
]

const navegacionFiltrada = filtrarPorModulos(navegacion)
```

## 🔄 Mantenimiento Futuro

### Agregar un Nuevo Módulo

1. Insertar en BD:
```sql
INSERT INTO modulos (codigo, nombre, categoria, ruta_base, activo)
VALUES ('nuevo_modulo', 'Nuevo Módulo', 'categoria', '/admin/nuevo', TRUE);
```

2. Agregar al catálogo (`lib/modulos/catalogo.js`):
```javascript
NUEVO_MODULO: {
    codigo: 'nuevo_modulo',
    nombre: 'Nuevo Módulo',
    categoria: 'categoria',
    rutas: ['/admin/nuevo', '/admin/nuevo/otra']
}
```

3. Actualizar header si es necesario

### Deshabilitar un Módulo Globalmente

```sql
UPDATE modulos SET activo = FALSE WHERE codigo = 'modulo_codigo';
```

## ⚠️ Consideraciones Importantes

1. **Módulos Core**: Siempre habilitados, no pueden deshabilitarse
2. **Datos Existentes**: Al deshabilitar un módulo, los datos NO se eliminan
3. **Dependencias**: Algunos módulos pueden depender de otros
4. **Migración**: Las empresas existentes mantienen POS habilitado por defecto
5. **Performance**: Las verificaciones se cachean cuando es posible

## 🐛 Troubleshooting

### Los módulos no aparecen
- Verificar que la migración se ejecutó correctamente
- Verificar cookies de sesión (empresaId)
- Verificar logs del servidor

### Las rutas no están protegidas
- Verificar que el middleware esté activo
- Verificar que las rutas estén en el catálogo
- Verificar logs del middleware

### Error al habilitar módulos
- Verificar permisos de superadmin
- Verificar que el módulo exista en BD
- Verificar logs del servidor

## 📚 Documentación Adicional

- `_DB/scripts/README_MODULOS.md`: Documentación técnica completa
- `_DB/migracion_modulos_sistema.sql`: Script de migración
- `_DB/scripts/migracion_modulos_por_perfil.sql`: Scripts de perfiles

## ✅ Checklist de Implementación

- [x] Tablas de base de datos creadas
- [x] Catálogo de módulos definido
- [x] Funciones del servidor implementadas
- [x] API endpoints creados
- [x] Hook del cliente creado
- [x] Middleware actualizado
- [x] Header actualizado con módulos dinámicos
- [x] Panel de administración creado
- [x] Scripts de migración creados
- [x] Documentación completa

## 🎉 Conclusión

El sistema modular está completamente implementado y listo para usar. Cada empresa puede tener solo los módulos que necesita, mejorando la experiencia de usuario y facilitando el mantenimiento del sistema.

