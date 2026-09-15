// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import ImprimirVenta from "@/_Pages/admin/ventas/imprimir/imprimir";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <ImprimirVenta></ImprimirVenta>
      </ClienteWrapper>
    </div>
  );
}
