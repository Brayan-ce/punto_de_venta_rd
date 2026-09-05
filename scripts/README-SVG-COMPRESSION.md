# Compresión de SVGs

## Uso

Para comprimir todos los SVGs en el proyecto, ejecuta:

```bash
npm run compress-svgs
```

O directamente:

```bash
node scripts/compress-svgs.js
```

## Directorios procesados

El script comprime automáticamente los SVGs en:
- `public/illustrations3D/` (27 archivos)
- `public/lustracion_reparaciones/` (25 archivos)

## Configuración

La configuración de optimización está en `svgo.config.js`. Actualmente:
- ✅ Mantiene `viewBox` para responsividad
- ✅ Mantiene IDs (por si se usan en CSS/JS)
- ✅ Aplica todas las optimizaciones del preset-default
- ✅ Usa multipass para máxima compresión

## Resultados

Si ves **0.0% de ahorro**, significa que los SVGs ya están completamente optimizados. Esto es normal para:
- SVGs ya procesados anteriormente
- Ilustraciones 3D complejas con muchos paths
- Archivos con contenido embebido (base64)

## Si los SVGs son muy grandes (>5MB)

Si tus SVGs son muy grandes, considera:

1. **Convertir a formatos más eficientes**:
   - Para ilustraciones complejas: usar WebP o AVIF
   - Para iconos simples: mantener SVG

2. **Optimizar en el origen**:
   - Exportar desde el editor con menos decimales
   - Reducir la complejidad de paths
   - Remover elementos ocultos

3. **Usar lazy loading** (ya implementado):
   - Los SVGs se cargan solo cuando son visibles
   - Usa `loading="lazy"` en las etiquetas `<img>`

4. **Considerar sprites SVG**:
   - Para iconos repetitivos, usar un sprite sheet
   - Reduce el número de requests HTTP

## Notas

- El script **sobrescribe** los archivos originales
- Se recomienda hacer commit antes de ejecutar
- Los archivos se procesan en paralelo para mayor velocidad

