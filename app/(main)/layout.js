// app/(main)/layout.jsx
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import HeaderMain from "@/_Pages/main/header/header";
import { LanguageProvider } from "@/_Pages/main/i18n";
export default function MainLayout({ children }) {
  return (
    <LanguageProvider>
      <div>
        <ClienteWrapper>
          <HeaderMain></HeaderMain>
        </ClienteWrapper>
      </div>
      {children}
    </LanguageProvider>
  );
}