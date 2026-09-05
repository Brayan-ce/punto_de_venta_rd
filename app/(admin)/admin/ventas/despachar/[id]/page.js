// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import DespacharVenta from "@/_Pages/admin/ventas/despachar/despachar";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <DespacharVenta></DespacharVenta>
      </ClienteWrapper>
    </div>
  );
}
