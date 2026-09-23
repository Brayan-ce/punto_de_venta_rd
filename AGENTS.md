# Reglas para el asistente

## PROHIBIDO hacer builds, compilaciones o instalaciones
- NUNCA ejecutes Gradle, `assembleDebug`, `compileDebugKotlin`, `./gradlew`, ni ningún otro comando que compile, construya, genere APK o instale la app en un dispositivo.
- NUNCA ejecutes `npm install`, `npm i`, `yarn add`, `pnpm add`, ni instales ninguna dependencia. El usuario lo hace manualmente.
- NUNCA ejecutes `npm run build`, `next build`, `npm run dev`, `npm start`, `pm2 restart`, ni ningún comando de inicialización o arranque del servidor. El usuario lo hace manualmente.
- El usuario ejecuta el build, la instalación, las dependencias y el arranque manualmente desde su terminal/Android Studio.
- Tu única tarea es MODIFICAR y CORREGIR el código (web y/o móvil), y aplicar los cambios en los archivos fuente.

## NO tocar Android sin que lo pidan explícitamente
- NO edites archivos en `_Aplicacion_Movil/`, `android/`, ni ningún `.kt`/`.gradle`/`.xml` de Android, salvo que el usuario te lo pida con claridad.
- Si el pedido es sobre la web (`_Pages/`, `app/`, `lib/`, etc.), SOLO toca esos archivos.
- Si dudas si un archivo pertenece al móvil o a la web, pregunta antes de editar.

## Qué debes hacer
- Editar archivos de código fuente (Kotlin, XML, etc.) de forma correcta y coherente con el proyecto.
- Verificar la coherencia de los cambios leyendo el código relacionado.
- Al terminar, resume brevemente qué cambiaste para que el usuario lo compile e instale.

## REGLAS OBLIGATORIAS
- Una misma herramienta con los mismos argumentos: máximo 2 intentos.
- Si falla o no devuelve información útil después de 2 intentos, CAMBIA DE ESTRATEGIA.
- No repitas frases como "Déjame buscar...", "Déjame verificar..." o "Déjame agregar..." si no vas a realizar una acción nueva.
- Cada llamada a una herramienta debe tener un propósito diferente.
- Si ya verificaste algo y está correcto, NO lo vuelvas a verificar.
- Si encontraste el archivo, función o referencia que buscabas, usa ese resultado y continúa trabajando.
- Si una herramienta falla, no entres en un ciclo infinito intentando lo mismo.
- Si detectas que llevas varias acciones consecutivas haciendo lo mismo, DETENTE y continúa desde el último resultado válido.