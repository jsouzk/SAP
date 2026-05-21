import { useMemo } from "react";
import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";

const publicKey = import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY || "";

if (publicKey) {
  initMercadoPago(publicKey, { locale: "pt-BR" });
}

export default function MercadoPagoWallet({ preferenceId }) {
  const initialization = useMemo(() => ({ preferenceId }), [preferenceId]);

  if (!publicKey) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Configure VITE_MERCADO_PAGO_PUBLIC_KEY no frontend/.env para renderizar o botão oficial do Mercado Pago.
      </div>
    );
  }

  if (!preferenceId) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Gere uma preferência de pagamento para habilitar o botão do Mercado Pago.
      </div>
    );
  }

  return (
    <div className="min-h-12 w-full">
      <Wallet initialization={initialization} />
    </div>
  );
}
