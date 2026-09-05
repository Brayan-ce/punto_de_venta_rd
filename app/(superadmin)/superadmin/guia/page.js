// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import GuiaPage from "@/_Pages/superadmin/guia/guia";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <GuiaPage></GuiaPage>
      </ClienteWrapper>
    </div>
  );
}
