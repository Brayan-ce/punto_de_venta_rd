// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import CategoriasAdmin from "@/_Pages/admin/categorias/categorias";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <CategoriasAdmin></CategoriasAdmin>
      </ClienteWrapper>
    </div>
  );
}
