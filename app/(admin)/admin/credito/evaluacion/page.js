import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import EvaluacionRapida from "@/_Pages/admin/credito/evaluacion/page";

export default function EvaluacionPage() {
  return (
    <div>
      <ClienteWrapper>
        <EvaluacionRapida />
      </ClienteWrapper>
    </div>
  );
}
