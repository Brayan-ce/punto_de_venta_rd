export class ImageEncoder {
    /**
     * Codificar ticket a imagen PNG
     * Importación dinámica para evitar SSR
     */
    static async encode(ticketData) {
        if (typeof window === 'undefined') {
            throw new Error('ImageEncoder solo disponible en navegador');
        }

        // Importación dinámica (SSR-safe)
        const { default: html2canvas } = await import('html2canvas');

        const ticketHTML = this.renderTicketHTML(ticketData);

        // Crear elemento temporal
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = ticketHTML;
        tempDiv.style.cssText = `
      position: fixed;
      top: -9999px;
      left: -9999px;
      width: 300px;
      background: white;
      padding: 20px;
    `;
        document.body.appendChild(tempDiv);

        try {
            // Capturar como canvas
            const canvas = await html2canvas(tempDiv, {
                scale: 2,
                backgroundColor: '#ffffff',
            });

            // Convertir a base64
            return canvas.toDataURL('image/png');
        } finally {
            // Limpiar siempre
            document.body.removeChild(tempDiv);
        }
    }

    static renderTicketHTML(data) {
        return `
      <div style="font-family: monospace; font-size: 12px;">
        <div style="text-align: center; font-weight: bold;">
          ${data.empresa.nombre}
        </div>
        <div style="text-align: center;">
          ${data.empresa.direccion}<br>
          RNC: ${data.empresa.rnc}
        </div>
        <hr>
        <div>Fecha: ${data.fecha}</div>
        <div>NCF: ${data.ncf || 'N/A'}</div>
        <hr>
        ${data.productos
            .map(
                (p) => `
          <div>
            ${p.cantidad}x ${p.nombre}<br>
            @RD$${p.precio} = RD$${p.subtotal}
          </div>
        `
            )
            .join('')}
        <hr>
        <div style="font-weight: bold;">
          SUBTOTAL: RD$${data.subtotal}<br>
          ITBIS: RD$${data.itbis}<br>
          <div style="font-size: 16px;">TOTAL: RD$${data.total}</div>
        </div>
        <hr>
        <div style="text-align: center;">
          ¡Gracias por su compra!
        </div>
      </div>
    `;
    }
}