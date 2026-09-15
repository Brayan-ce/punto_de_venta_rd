# Sistema Modular por Empresa - Documentación

## 📋 Descripción General

Este sistema permite que cada empresa tenga habilitados solo los módulos que necesita, evitando que se sientan abrumados con funcionalidades que no utilizan.

## 🏗️ Arquitectura

### Tablas de Base de Datos

1. **`modulos`**: Catálogo de todos los módulos disponibles en el sistema
2. **`empresa_modulos`**: Relación entre empresas y módulos habilitados
3. **`empresa_modulo_config`**: Configuraciones específicas por módulo y empresa (opcional)

### Módulos Disponibles

- **Core**: Módulo base (siempre habilitado)
  - Dashboard
  - Configuración
  - Perfil
  - Usuarios

- **POS**: Punto de Venta
  - Ventas
  - Productos
  - Clientes
  - Inventario
  - Compras
  - Proveedores
  - Cotizaciones
  - Conduces
  - Categorías
  - Marcas
  - Cajas
  - Gastos

- **Crédito**: Control de Crédito
  - Control de Crédito
  - Cuentas por Cobrar
  - Depuración de Crédito

- **Financiamiento**: Sistema de Financiamiento
  - Dashboard Financiamiento
  - Planes
  - Contratos
  - Cuotas
  - Pagos
  - Alertas
  - Equipos
  - Activos

- **Constructora**: Control de Obras y Construcción
  - Dashboard Construcción
  - Obras
  - Proyectos
  - Servicios
  - Bitácora
  - Personal
  - Presupuesto
  - Compras Obra
  - Conduces Obra

- **Catálogo**: Catálogo Online y B2B
  - Catálogo Online
  - Pedidos
  - Tienda IsiWeek

## 🚀 Instalación

### Paso 1: Ejecutar Migración de Base de Datos

```bash
mysql -u usuario -p punto_venta_rd < _DB/migracion_modulos_sistema.sql
```

### Paso 2: Verificar Instalación

```sql
-- Verificar que las tablas se crearon correctamente
SHOW TABLES LIKE '%modulo%';

-- Verificar módulos insertados
SELECT * FROM modulos;
```

### Paso 3: Habilitar Módulos para Empresas Existentes

```sql
-- Habilitar POS básico para todas las empresas existentes
-- (Esto mantiene la funcionalidad actual)

-- Opción 1: Usar el procedimiento almacenado
CALL habilitar_modulos_por_perfil(EMPRESA_ID, 'pos_basico');

-- Opción 2: Habilitar manualmente
INSERT INTO empresa_modulos (empresa_id, modulo_id, habilitado)
SELECT e.id, m.id, TRUE
FROM empresas e
CROSS JOIN modulos m
WHERE m.codigo IN ('core', 'pos')
ON DUPLICATE KEY UPDATE habilitado = TRUE;
```

## 📖 Uso

### Para Superadmin: Gestionar Módulos de una Empresa

1. Ir a `/superadmin/empresas`
2. Seleccionar una empresa
3. Ir a la sección "Módulos"
4. Habilitar/deshabilitar módulos según necesidad

### Para Desarrolladores: Verificar Módulos en Código

```javascript
// En componentes del cliente
import { useModulos } from '@/hooks/useModulos'

function MiComponente() {
    const { tieneModulo } = useModulos()
    
    if (!tieneModulo('financiamiento')) {
        return <div>Módulo no disponible</div>
    }
    
    return <div>Contenido del módulo</div>
}
```

```javascript
// En funciones del servidor
import { verificarModuloHabilitado } from '@/lib/modulos/servidor'

const habilitado = await verificarModuloHabilitado(empresaId, 'pos')
```

## 🔒 Protección de Rutas

El middleware protege automáticamente las rutas según los módulos habilitados:

- Si un usuario intenta acceder a una ruta de un módulo no habilitado, será redirigido al dashboard
- El mensaje de error se muestra en la URL: `?error=modulo_no_disponible&modulo=Nombre del Módulo`

## 📊 Perfiles de Negocio Predefinidos

### 1. POS Básico
```sql
CALL habilitar_modulos_por_perfil(EMPRESA_ID, 'pos_basico');
```
**Módulos**: Core + POS

### 2. POS con Crédito
```sql
CALL habilitar_modulos_por_perfil(EMPRESA_ID, 'pos_credito');
```
**Módulos**: Core + POS + Crédito

### 3. Financiamiento de Scooters
```sql
CALL habilitar_modulos_por_perfil(EMPRESA_ID, 'financiamiento_scooters');
```
**Módulos**: Core + POS + Financiamiento

### 4. Constructora
```sql
CALL habilitar_modulos_por_perfil(EMPRESA_ID, 'constructora');
```
**Módulos**: Core + POS + Construcción

### 5. Completo
```sql
CALL habilitar_modulos_por_perfil(EMPRESA_ID, 'completo');
```
**Módulos**: Todos los módulos

## 🔧 Mantenimiento

### Agregar un Nuevo Módulo

1. Insertar en la tabla `modulos`:
```sql
INSERT INTO modulos (codigo, nombre, descripcion, categoria, icono, ruta_base, orden, activo)
VALUES ('nuevo_modulo', 'Nuevo Módulo', 'Descripción', 'categoria', 'icon-outline', '/admin/nuevo', 10, TRUE);
```

2. Agregar rutas en `lib/modulos/catalogo.js`:
```javascript
NUEVO_MODULO: {
    codigo: 'nuevo_modulo',
    nombre: 'Nuevo Módulo',
    categoria: 'categoria',
    rutas: ['/admin/nuevo', '/admin/nuevo/otra-ruta']
}
```

3. Actualizar el header si es necesario

### Deshabilitar un Módulo Globalmente

```sql
UPDATE modulos SET activo = FALSE WHERE codigo = 'modulo_codigo';
```

Esto deshabilitará el módulo para todas las empresas.

## ⚠️ Consideraciones Importantes

1. **Módulos Core**: Siempre están habilitados y no pueden deshabilitarse
2. **Datos Existentes**: Al deshabilitar un módulo, los datos existentes NO se eliminan
3. **Dependencias**: Algunos módulos pueden depender de otros (ej: Crédito depende de POS)
4. **Migración**: Las empresas existentes mantienen POS habilitado por defecto

## 🐛 Troubleshooting

### Los módulos no aparecen en el header

1. Verificar que el hook `useModulos` esté funcionando
2. Verificar que la API `/api/modulos` retorne los módulos correctamente
3. Verificar cookies de sesión (empresaId debe estar presente)

### Las rutas no están protegidas

1. Verificar que el middleware esté activo
2. Verificar que las rutas estén definidas en `lib/modulos/catalogo.js`
3. Verificar logs del servidor para errores

### Error al habilitar/deshabilitar módulos

1. Verificar permisos de superadmin
2. Verificar que el módulo exista en la base de datos
3. Verificar logs del servidor

## 📝 Notas Adicionales

- El sistema es retrocompatible: las empresas existentes seguirán funcionando normalmente
- Los cambios de módulos son inmediatos (no requieren reinicio del servidor)
- Se recomienda hacer backup antes de cambiar perfiles de empresas grandes

