# 📋 Cómo Gestionar Módulos por Empresa

## 🎯 Acceso a la Gestión de Módulos

Para habilitar o deshabilitar módulos para una empresa, sigue estos pasos:

### Paso 1: Iniciar Sesión como Superadmin

1. Inicia sesión en el sistema con una cuenta de **superadmin**
2. Ve al menú de **Superadmin** en la barra de navegación

### Paso 2: Ir a la Sección de Empresas

1. En el menú lateral de Superadmin, haz clic en **"Empresas"**
2. O navega directamente a: `/superadmin/empresas`

### Paso 3: Seleccionar una Empresa

1. En la lista de empresas, localiza la empresa para la cual quieres gestionar módulos
2. En la tarjeta de la empresa, verás varios botones:
   - **Editar** (azul)
   - **Módulos** (morado) ⭐ **Este es el botón que necesitas**
   - **Activar/Desactivar** (verde/rojo)
   - **Eliminar** (rojo)

### Paso 4: Abrir el Panel de Módulos

1. Haz clic en el botón **"Módulos"** (botón morado con icono de apps)
2. Se abrirá un modal grande con el panel de gestión de módulos

### Paso 5: Gestionar Módulos

En el panel de módulos verás:

- **Módulos agrupados por categoría:**
  - Core (Sistema Base) - Siempre habilitado
  - Punto de Venta
  - Control de Crédito
  - Financiamiento
  - Construcción
  - Catálogo Online

- **Para cada módulo:**
  - Nombre y descripción
  - Código del módulo
  - Ruta base
  - **Switch (toggle)** para habilitar/deshabilitar

### Paso 6: Habilitar o Deshabilitar Módulos

1. **Para habilitar un módulo:**
   - Activa el switch (toggle) del módulo que quieres habilitar
   - El módulo se habilitará inmediatamente para esa empresa

2. **Para deshabilitar un módulo:**
   - Desactiva el switch (toggle) del módulo que quieres deshabilitar
   - El módulo se deshabilitará inmediatamente

3. **Módulos siempre habilitados:**
   - Los módulos marcados con "Siempre habilitado" (como Core) no pueden deshabilitarse
   - Estos switches aparecerán deshabilitados (grises)

### Paso 7: Cerrar el Panel

1. Haz clic en el botón **"X"** en la esquina superior derecha del modal
2. O haz clic fuera del modal (en el overlay oscuro)

## 📍 Ubicación Visual

```
Superadmin Dashboard
    └── Empresas (menú lateral)
        └── Lista de Empresas
            └── [Tarjeta de Empresa]
                └── Botón "Módulos" (morado) ⭐
                    └── Modal de Gestión de Módulos
```

## 🎨 Interfaz del Panel de Módulos

El panel muestra:

- **Header**: Título "Gestionar Módulos" y nombre de la empresa
- **Mensajes**: Notificaciones de éxito o error al cambiar módulos
- **Categorías**: Módulos agrupados por tipo
- **Lista de Módulos**: Cada módulo con:
  - Nombre y descripción
  - Badge "Siempre habilitado" (si aplica)
  - Código y ruta
  - Switch para habilitar/deshabilitar

## ⚠️ Consideraciones Importantes

1. **Cambios Inmediatos**: Los cambios se aplican inmediatamente
2. **Sin Reinicio**: No necesitas reiniciar el servidor
3. **Datos Preservados**: Al deshabilitar un módulo, los datos existentes NO se eliminan
4. **Módulos Core**: No pueden deshabilitarse (son esenciales para el sistema)
5. **Efecto en Usuarios**: Los usuarios de la empresa verán los cambios inmediatamente en su interfaz

## 🔄 Flujo Completo

```
1. Superadmin → Empresas
2. Seleccionar Empresa
3. Clic en "Módulos"
4. Modal se abre
5. Activar/Desactivar switches
6. Cambios se guardan automáticamente
7. Cerrar modal
8. Usuarios de la empresa ven cambios inmediatamente
```

## 💡 Ejemplo Práctico

**Escenario**: Quieres habilitar el módulo de Financiamiento para una empresa que solo tiene POS básico.

1. Ve a `/superadmin/empresas`
2. Encuentra la empresa "Tienda XYZ"
3. Haz clic en el botón **"Módulos"** (morado)
4. En la sección "Financiamiento", activa el switch del módulo "Financiamiento"
5. Verás un mensaje de éxito: "Módulo habilitado exitosamente"
6. Cierra el modal
7. Los usuarios de "Tienda XYZ" ahora verán el módulo de Financiamiento en su menú

## 🆘 Solución de Problemas

### No veo el botón "Módulos"
- Verifica que estés logueado como **superadmin**
- Verifica que la página de empresas esté cargada correctamente
- Recarga la página (F5)

### El modal no se abre
- Verifica la consola del navegador para errores
- Asegúrate de que la migración de módulos se haya ejecutado
- Verifica que las tablas `modulos` y `empresa_modulos` existan en la BD

### Los cambios no se guardan
- Verifica la consola del navegador
- Verifica los logs del servidor
- Asegúrate de tener permisos de superadmin

### Los usuarios no ven los cambios
- Los cambios son inmediatos, pero pueden necesitar:
  - Recargar la página (F5)
  - Cerrar sesión y volver a iniciar sesión

## 📞 Soporte

Si tienes problemas, verifica:
1. Que la migración de módulos se haya ejecutado correctamente
2. Que tengas permisos de superadmin
3. Los logs del servidor para errores específicos

