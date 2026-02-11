// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import CajaPageAdmin from "@/_Pages/admin/cajas/cajas";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <CajaPageAdmin></CajaPageAdmin>
      </ClienteWrapper>
    </div>
  );
}
