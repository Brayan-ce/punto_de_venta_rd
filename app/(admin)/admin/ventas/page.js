// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import VentasAdmin from "@/_Pages/admin/ventas/ventas";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <VentasAdmin></VentasAdmin>
      </ClienteWrapper>
    </div>
  );
}
