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
  AI_AUTH:
    "O Gemini recusou a chave ou a permissão da API. Confira se a chave foi criada no Google AI Studio e se a Gemini API está habilitada.",
  AI_MODEL_UNAVAILABLE:
    "O modelo Gemini configurado não está disponível para esta API. Verifique se o nome do modelo ainda é aceito.",
  AI_TEMPORARY_UNAVAILABLE:
    "O Gemini está com alta demanda no momento. Aguarde um pouco e tente novamente.",
  AI_UPSTREAM_UNAVAILABLE:
    "Não foi possível obter uma resposta do Gemini. Tente novamente em instantes.",
  AI_INVALID_RESPONSE:
    "O Gemini retornou uma resposta inválida. Tente novamente.",
  AI_INVALID_REQUEST: "A solicitação de análise é inválida. Tente novamente.",
  NETWORK: "Não foi possível falar com o servidor local. Ele está rodando?",
};

const INLINE_MARKDOWN =
  /(`+)(.+?)\1|\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*\n]+)\*|_([^_\n]+)_/g;

function inline(text) {
  const nodes = [];
  let cursor = 0;

  for (const match of text.matchAll(INLINE_MARKDOWN)) {
    const [token, ticks, code, linkText, href, boldA, boldB, italicA, italicB] =
      match;
    const index = match.index;

    if (index > cursor) nodes.push(text.slice(cursor, index));
    if (ticks) {
      nodes.push(<code key={index}>{code}</code>);
    } else if (linkText) {
      nodes.push(
        <a key={index} href={href} target="_blank" rel="noreferrer">
          {linkText}
        </a>,
      );
    } else if (boldA || boldB) {
      nodes.push(<strong key={index}>{boldA || boldB}</strong>);
    } else {
      nodes.push(<em key={index}>{italicA || italicB}</em>);
    }

    cursor = index + token.length;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

function Answer({ text }) {
  const lines = String(text ?? "").replace(/\r\n?/g, "\n").split("\n");
  const blocks = [];
  let index = 0;

  const isBlockStart = (line) =>
    /^\s*```/.test(line) ||
    /^\s{0,3}#{1,6}\s+/.test(line) ||
    /^\s{0,3}(?:[-*+•]\s+|\d+[.)]\s+)/.test(line) ||
    /^\s{0,3}>/.test(line) ||
    /^\s{0,3}(?:[-*_]\s*){3,}$/.test(line);

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const fence = line.match(/^\s*```([\w.+-]*)\s*$/);
    if (fence) {
      const codeLines = [];
      index += 1;
      while (index < lines.length && !/^\s*```\s*$/.test(lines[index])) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push({
        type: "code",
        language: fence[1],
        text: codeLines.join("\n"),
      });
      continue;
    }

    const heading = line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      blocks.push({
        type: "heading",
        level: Math.min(heading[1].length, 4),
        text: heading[2],
      });
      index += 1;
      continue;
    }

    if (/^\s{0,3}(?:[-*_]\s*){3,}$/.test(line)) {
      blocks.push({ type: "rule" });
      index += 1;
      continue;
    }

    const listItem = line.match(/^(\s{0,6})([-*+•]|(\d+)[.)])\s+(.*)$/);
    if (listItem) {
      const ordered = Boolean(listItem[3]);
      const items = [];
      while (index < lines.length) {
        const item = lines[index].match(
          /^(\s{0,6})([-*+•]|(\d+)[.)])\s+(.*)$/,
        );
        if (!item || Boolean(item[3]) !== ordered) break;
        items.push({ depth: Math.floor(item[1].length / 2), text: item[4] });
        index += 1;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }

    const quote = line.match(/^\s{0,3}>\s?(.*)$/);
    if (quote) {
      const quoteLines = [];
      while (index < lines.length) {
        const quotedLine = lines[index].match(/^\s{0,3}>\s?(.*)$/);
        if (!quotedLine) break;
        quoteLines.push(quotedLine[1]);
        index += 1;
      }
      blocks.push({ type: "quote", text: quoteLines.join(" ") });
      continue;
    }

    const paragraphLine = (value) => ({
      text: value.replace(/(?: {2,}|\\)$/, "").trim(),
      hardBreak: /(?: {2,}|\\)$/.test(value),
    });
    const paragraph = [paragraphLine(line)];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !isBlockStart(lines[index])
    ) {
      paragraph.push(paragraphLine(lines[index]));
      index += 1;
    }
    blocks.push({ type: "paragraph", lines: paragraph });
  }

  return (
    <div className="term-answer">
      {blocks.map((block, i) => {
        if (block.type === "heading") {
          const Tag = `h${block.level}`;
          return (
            <Tag key={i} className="term-heading">
              {inline(block.text)}
            </Tag>
          );
        }
        if (block.type === "code") {
          return (
            <div className="term-code-wrap" key={i}>
              <div className="term-code-header">
                <span>{block.language || "CODE"}</span>
              </div>
              <pre className="term-code" tabIndex={0}>
                <code>{block.text}</code>
              </pre>
            </div>
          );
        }
        if (block.type === "list") {
          const Tag = block.ordered ? "ol" : "ul";
          return (
            <Tag className="term-list" key={i}>
              {block.items.map((item, itemIndex) => (
                <li
                  key={itemIndex}
                  style={{ "--list-depth": Math.min(item.depth, 3) }}
                >
                  {inline(item.text)}
                </li>
              ))}
            </Tag>
          );
        }
        if (block.type === "quote") {
          return (
            <blockquote className="term-quote" key={i}>
              {inline(block.text)}
            </blockquote>
          );
        }
        if (block.type === "rule") return <hr className="term-rule" key={i} />;

        return (
          <p className="term-paragraph" key={i}>
            {block.lines.map((paragraphLine, lineIndex) => (
              <span key={lineIndex}>
                {lineIndex > 0 && " "}
                {inline(paragraphLine.text)}
                {paragraphLine.hardBreak && <br />}
              </span>
            ))}
          </p>
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
          <span className="term-title">
            AI OPINION · <span className="term-username">@{user.login}</span>
          </span>
          {messages.length > 0 && (
            <button
              className="btn ghost"
              type="button"
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
            <p className="term-label term-loading" role="status">
              AI Reviewer analisando<span className="term-cursor" />
            </p>
          )}
          {error && (
            <p className="term-error" role="alert">
              <span aria-hidden="true">!</span>
              {error}
            </p>
          )}
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
