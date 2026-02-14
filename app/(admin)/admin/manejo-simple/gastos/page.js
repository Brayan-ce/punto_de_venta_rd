// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import Gastos from "@/_Pages/admin/Roles/Obras/Secciones_Simples/Gastos/gastos";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <Gastos></Gastos>
      </ClienteWrapper>
    </div>
  );
}
