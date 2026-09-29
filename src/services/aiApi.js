// Chama o endpoint local /api/ai (proxy do Vite), que guarda a chave da IA.
export async function askAI({ system, messages }) {
  let response;
  try {
    response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system, messages }),
    });
  } catch {
    throw new Error("NETWORK");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "AI_REQUEST_FAILED");
  return data.text;
}
