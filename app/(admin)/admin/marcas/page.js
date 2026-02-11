// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import MarcasAdmin from "@/_Pages/admin/marcas/marcas";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <MarcasAdmin></MarcasAdmin>
      </ClienteWrapper>
    </div>
  );
}
