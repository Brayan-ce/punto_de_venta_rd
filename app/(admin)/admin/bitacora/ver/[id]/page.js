import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import VerBitacora from "@/_Pages/admin/bitacora/ver/ver";


export default async function Page({ params }) {
  const { id } = await params
  
  return (
    <ClienteWrapper>
      <VerBitacora id={id} />
    </ClienteWrapper>
  )
}