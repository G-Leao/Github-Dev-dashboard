import { useEffect, useMemo, useRef, useState } from "react";
import { askAI } from "../services/aiApi";
import {
  buildContext,
  buildSystemInstruction,
  PRESET_QUESTIONS,
} from "../utils/aiContext";

const ERRORS = {
  NO_API_KEY:
    "Chave da IA não configurada. Crie o arquivo .env com GEMINI_API_KEY e reinicie o npm run dev.",
  AI_RATE_LIMIT: "Limite de uso da IA atingido. Aguarde um pouco e tente de novo.",
  NETWORK: "Não foi possível falar com o servidor local. Ele está rodando?",
};

// Renderizador mínimo: parágrafos, listas com "- " e **negrito**.
function inline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      part
    ),
  );
}

function Answer({ text }) {
  const lines = text.split("\n").filter((l) => l.trim());
  return (
    <div className="term-answer">
      {lines.map((line, i) => {
        const bullet = line.match(/^\s*[-*•]\s+(.*)/);
        return bullet ? (
          <p key={i} className="term-bullet">
            <span aria-hidden="true">›</span> {inline(bullet[1])}
          </p>
        ) : (
          <p key={i}>{inline(line)}</p>
        );
      })}
    </div>
  );
}

export default function AIOpinion({ user, repos, events }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const endRef = useRef(null);

  const system = useMemo(
    () => buildSystemInstruction(buildContext(user, repos, events)),
    [user, repos, events],
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, error]);

  async function ask(text) {
    const question = text.trim();
    if (!question || loading) return;

    // Só as últimas mensagens vão para a IA, para limitar custo e tamanho.
    const next = [...messages, { role: "user", text: question }];
    setMessages(next);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const answer = await askAI({ system, messages: next.slice(-10) });
      setMessages([...next, { role: "assistant", text: answer }]);
    } catch (err) {
      setError(
        ERRORS[err.message] ||
          "A IA não conseguiu responder agora. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack">
      <section className="glass card terminal" aria-label="AI Opinion">
        <div className="term-bar">
          <span className="term-dots" aria-hidden="true">
            <i /> <i /> <i />
          </span>
          <span className="term-title">AI OPINION · @{user.login}</span>
          {messages.length > 0 && (
            <button
              className="btn ghost"
              onClick={() => {
                setMessages([]);
                setError(null);
              }}
            >
              Limpar
            </button>
          )}
        </div>

        <div className="term-log" aria-live="polite">
          {messages.length === 0 && !loading && (
            <p className="muted term-hint">
              Pergunte ao AI Reviewer sobre este perfil. Ele responde apenas com
              base nos dados do GitHub carregados aqui.
            </p>
          )}
          {messages.map((m, i) =>
            m.role === "user" ? (
              <p key={i} className="term-user">
                <span aria-hidden="true">&gt;</span> {m.text}
              </p>
            ) : (
              <div key={i}>
                <p className="term-label">AI Reviewer</p>
                <Answer text={m.text} />
              </div>
            ),
          )}
          {loading && (
            <p className="term-label">
              AI Reviewer analisando<span className="term-cursor" />
            </p>
          )}
          {error && <p className="term-error">! {error}</p>}
          <div ref={endRef} />
        </div>

        <div className="term-presets">
          {PRESET_QUESTIONS.map((q) => (
            <button
              key={q}
              className="btn ghost"
              disabled={loading}
              onClick={() => ask(q)}
            >
              {q}
            </button>
          ))}
        </div>

        <form
          className="term-input"
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
        >
          <span aria-hidden="true">&gt;</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Faça outra pergunta..."
            aria-label="Pergunta para o AI Reviewer"
            maxLength={500}
            disabled={loading}
          />
          <button className="btn" type="submit" disabled={loading || !input.trim()}>
            Enviar
          </button>
        </form>
      </section>
    </div>
  );
}
