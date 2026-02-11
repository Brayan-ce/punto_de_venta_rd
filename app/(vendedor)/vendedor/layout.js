// app/(main)/layout.jsx
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import HeaderVendedor from "@/_Pages/vendedor/header/header";
import ModalTerminos from "@/components/ModalTerminos/ModalTerminos";

export default function MainLayout({ children }) {
  return (
    <>
      <div>
        <ClienteWrapper>
          <HeaderVendedor></HeaderVendedor>
          <ModalTerminos />
        </ClienteWrapper>
      </div>
      {children}
    </>
  );
}