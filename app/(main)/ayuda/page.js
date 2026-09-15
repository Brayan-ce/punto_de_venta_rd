// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import Ayuda from "@/_Pages/main/ayuda/ayuda";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <Ayuda></Ayuda>
      </ClienteWrapper>
    </div>
  );
}
