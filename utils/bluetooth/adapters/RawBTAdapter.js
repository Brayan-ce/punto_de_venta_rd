/**
 * Adaptador para RawBT (sistema actual - fallback)
 * Compatible con: Android con RawBT instalado
 */
export class RawBTAdapter {
    constructor() {
        this.isConnected = false;
    }

    /**
     * Verificar si RawBT está disponible
     */
    async isSupported() {
        // RawBT solo funciona en Android
        return /Android/i.test(navigator.userAgent);
    }

    /**
     * Solicitar dispositivo (RawBT no requiere selección previa)
     */
    async requestDevice() {
        return {
            id: 'rawbt',
            name: 'RawBT (Compartir)'
        };
    }

    /**
     * Conectar (RawBT no requiere conexión explícita)
     */
    async connect() {
        this.isConnected = true;
        return true;
    }

    /**
     * Imprimir usando Web Share API o portapapeles
     */
    async print(escposCommands) {
        try {
            console.log('📤 Compartiendo con RawBT...');

            // Método 1: Compartir como archivo
            if (navigator.canShare && navigator.canShare({ files: [] })) {
                const file = new File(
                    [escposCommands],
                    'ticket.txt',
                    { type: 'text/plain' }
                );

                await navigator.share({
                    files: [file],
                    title: 'Imprimir con RawBT'
                });

                console.log('✅ Compartido como archivo');
                return true;
            }

            // Método 2: Compartir como texto
            if (navigator.share) {
                await navigator.share({
                    text: escposCommands,
                    title: 'Imprimir con RawBT'
                });

                console.log('✅ Compartido como texto');
                return true;
            }

            // Método 3: Copiar al portapapeles
            await navigator.clipboard.writeText(escposCommands);

            alert(
                'Comandos copiados al portapapeles.\n\n' +
                'Abre RawBT y pega el contenido para imprimir.'
            );

            console.log('✅ Copiado al portapapeles');
            return true;

        } catch (error) {
            throw new Error('Error al compartir con RawBT: ' + error.message);
        }
    }

    /**
     * Desconectar
     */
    async disconnect() {
        this.isConnected = false;
    }

    /**
     * Verificar si está conectado
     */
    async isDeviceConnected() {
        return this.isConnected;
    }
}
