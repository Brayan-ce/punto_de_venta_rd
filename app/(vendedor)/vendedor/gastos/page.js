// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import GastosAdmin from "@/_Pages/admin/gastos/gastos";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <GastosAdmin></GastosAdmin>
      </ClienteWrapper>
    </div>
  );
}
