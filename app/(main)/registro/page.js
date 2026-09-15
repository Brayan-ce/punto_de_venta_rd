// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import Registro from "@/_Pages/main/registro/registro";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <Registro></Registro>
      </ClienteWrapper>
    </div>
  );
}
