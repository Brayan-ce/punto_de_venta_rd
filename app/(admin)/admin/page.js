import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import NuevaVenta from "@/_Pages/admin/ventas/nueva/nueva";

export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <NuevaVenta></NuevaVenta>
      </ClienteWrapper>
    </div>
  );
}
