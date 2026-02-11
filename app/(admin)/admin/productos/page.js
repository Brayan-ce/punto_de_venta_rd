// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import ProductosAdmin from "@/_Pages/admin/productos/productos";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <ProductosAdmin></ProductosAdmin>
      </ClienteWrapper>
    </div>
  );
}
