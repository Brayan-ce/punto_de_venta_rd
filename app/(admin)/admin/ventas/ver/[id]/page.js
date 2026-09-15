// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import VerVentaAdmin from "@/_Pages/admin/ventas/ver/ver";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <VerVentaAdmin></VerVentaAdmin>
      </ClienteWrapper>
    </div>
  );
}
