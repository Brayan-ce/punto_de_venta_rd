import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.isiweek.pos',
    appName: 'Punto de Venta RD',
    webDir: 'out',
    server: {
        androidScheme: 'https'
    },
    plugins: {
        CapacitorThermalPrinter: {
            // Configuración opcional si la hay
        }
    }
};

export default config;
