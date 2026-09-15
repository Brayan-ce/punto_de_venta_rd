# Reglas para el asistente

## PROHIBIDO hacer builds o compilaciones
- NUNCA ejecutes Gradle, `assembleDebug`, `compileDebugKotlin`, `./gradlew`, ni ningún otro comando que compile, construya, genere APK o instale la app en un dispositivo.
- El usuario ejecuta el build y la instalación desde Android Studio en su celular.
- Tu única tarea es MODIFICAR y CORREGIR el código, y aplicar los cambios correctamente.

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