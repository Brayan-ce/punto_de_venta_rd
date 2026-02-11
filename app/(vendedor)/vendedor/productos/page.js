// app/(vendedor)/vendedor/productos/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import ProductosVendedor from "@/_Pages/vendedor/productos/productos";

export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <ProductosVendedor></ProductosVendedor>
      </ClienteWrapper>
    </div>
  );
}
