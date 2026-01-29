"use client"
import { useState } from "react";
import { processAiJson } from "@/actions/ai-process"; // Importamos la acción

export default function TestAiPage() {
  const [jsonInput, setJsonInput] = useState(JSON.stringify({
    user_email: "tucorreo@gmail.com",
    bank_name: "Banco Popular",
    transaction_type: "credit_card_payment",
    source_currency: "DOP",
    target_currency: "USD",
    amount_paid: 2500.00,
    source_last_4: "1234",  // Debe coincidir con tu cuenta de ahorros
    target_last_4: "4288",  // Debe coincidir con tu tarjeta USD
    date: new Date().toISOString(),
    description: "Pago Tarjeta Automático (AI Test)"
  }, null, 2));

  const [result, setResult] = useState<any>(null);

  const handleTest = async () => {
    setResult("Procesando...");
    const response = await processAiJson(jsonInput);
    setResult(response);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">🧪 Simulador de IA yBank</h1>
      <p className="text-gray-500">Pega aquí el JSON que generaría la IA para probar si el sistema calcula bien la tasa.</p>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">JSON de Entrada (Payload)</label>
        <textarea
          rows={12}
          className="w-full p-4 font-mono text-sm bg-slate-900 text-green-400 rounded-xl border border-slate-700"
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
        />
      </div>

      <button
        onClick={handleTest}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition"
      >
        🔄 Ejecutar Prueba
      </button>

      {result && (
        <div className={`p-4 rounded-xl border ${result.success ? 'bg-green-50 border-green-200 text-neutral-800' : 'bg-red-50 border-red-200'}`}>
          <h3 className="font-bold mb-2">{result.success ? '✅ Éxito' : '❌ Error'}</h3>
          <pre className="text-sm whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}