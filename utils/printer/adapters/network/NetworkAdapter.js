import { PrinterAdapter } from '@/utils/types/PrinterAdapter.interface'

export class NetworkAdapter extends PrinterAdapter {
    supportsESCPOS() {
        return true
    }

    printsFromTicketData() {
        return true
    }

    async listPrinters() {
        return ['LAN thermal printer']
    }

    async connect() {
        return true
    }

    async print(ticketData) {
        const response = await fetch('/api/printer/print', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ticketData)
        })
        const result = await response.json()
        if (!response.ok || !result.success) {
            throw new Error(result.error || 'La impresora LAN no respondió')
        }
        return result
    }

    async disconnect() {
        return true
    }

    async isConnected() {
        return true
    }
}