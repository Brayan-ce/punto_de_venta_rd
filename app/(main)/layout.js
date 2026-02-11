// app/(main)/layout.jsx
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import HeaderMain from "@/_Pages/main/header/header";
export default function MainLayout({ children }) {
  return (
    <>
      <div>
        <ClienteWrapper>
          <HeaderMain></HeaderMain>
        </ClienteWrapper>
      </div>
      {children}
    </>
  );
}