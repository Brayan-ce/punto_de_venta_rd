// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import ComprasAdmin from "@/_Pages/admin/compras/compras";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <ComprasAdmin></ComprasAdmin>
      </ClienteWrapper>
    </div>
  );
}
