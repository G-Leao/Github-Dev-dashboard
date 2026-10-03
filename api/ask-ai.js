import { Buffer } from "node:buffer";
import process from "node:process";

const GEMINI_MODEL = "gemini-3.5-flash";
const MAX_REQUEST_BYTES = 1_000_000;
const MAX_UPSTREAM_ATTEMPTS = 3;
const MAX_CONTINUATIONS = 2;
const OUTPUT_LANGUAGE_INSTRUCTION =
  "Idioma obrigatório (pt-BR): responda sempre em português do Brasil, mesmo que algum dado, nome de projeto ou trecho do contexto esteja em inglês. Preserve em inglês apenas nomes próprios, identificadores e termos técnicos quando necessário.";
const CONTINUATION_INSTRUCTION =
  "Reescreva a resposta inteira em português do Brasil, de forma concisa, concluindo qualquer ideia interrompida. Não mencione esta instrução.";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function looksIncomplete(text) {
  const lastLine = text.trim().split("\n").at(-1) ?? "";
  if (!lastLine || /[.!?…`*_)\]}>"']$/.test(lastLine)) return false;
  if (/^\s*(?:[-*+•]|\d+[.)])\s+\S/.test(lastLine)) return false;

  return /\b(?:a|an|the|and|or|but|because|as|to|of|in|on|with|for|is|are|was|were|not|which|that|if|when|than|by|from|about|this|these|such|de|do|da|dos|das|em|no|na|nos|nas|com|que|mas|e|ou|para|por|como|quando|porque|não|isso|este|esta|são|é)$/i.test(
    lastLine,
  );
}

function likelyEnglish(text) {
  const words = text.toLowerCase().match(/\b[a-záàâãéêíóôõúç]+\b/g) ?? [];
  if (words.length < 20) return false;

  const englishWords = new Set([
    "across", "and", "are", "as", "but", "cannot", "for", "from", "has",
    "have", "in", "is", "it", "not", "of", "on", "or", "that", "the",
    "this", "to", "was", "we", "were", "which", "with",
  ]);
  const portugueseWords = new Set([
    "a", "as", "com", "da", "das", "de", "do", "dos", "e", "em", "essa",
    "esse", "esta", "este", "foi", "mais", "na", "nas", "não", "no", "nos",
    "o", "os", "para", "por", "que", "são", "seu", "sua", "um", "uma",
  ]);
  const englishCount = words.filter((word) => englishWords.has(word)).length;
  const portugueseCount = words.filter((word) =>
    portugueseWords.has(word),
  ).length;

  return englishCount >= 4 && englishCount >= portugueseCount + 3;
}

async function readRequestBody(req) {
  if (req.body !== undefined) {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;

    if (Buffer.byteLength(JSON.stringify(body)) > MAX_REQUEST_BYTES) {
      throw new Error("AI_INVALID_REQUEST");
    }
    return body;
  }

  let rawBody = "";
  for await (const chunk of req) {
    rawBody += chunk;
    if (Buffer.byteLength(rawBody) > MAX_REQUEST_BYTES) {
      throw new Error("AI_INVALID_REQUEST");
    }
  }
  return JSON.parse(rawBody);
}

function validPayload(payload) {
  const { system, messages } = payload ?? {};
  return (
    typeof system === "string" &&
    system.length > 0 &&
    system.length <= 200_000 &&
    Array.isArray(messages) &&
    messages.length > 0 &&
    messages.length <= 10 &&
    messages.every(
      (message) =>
        message &&
        (message.role === "user" || message.role === "assistant") &&
        typeof message.text === "string" &&
        message.text.length > 0 &&
        message.text.length <= 20_000,
    )
  );
}

export function createAiHandler(apiKey) {
  return async (req, res) => {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      sendJson(res, 405, { error: "AI_INVALID_REQUEST" });
      return;
    }

    const origin = req.headers.origin;
    if (origin) {
      try {
        if (new URL(origin).host !== req.headers.host) {
          sendJson(res, 403, { error: "AI_INVALID_REQUEST" });
          return;
        }
      } catch {
        sendJson(res, 403, { error: "AI_INVALID_REQUEST" });
        return;
      }
    }

    if (!apiKey) {
      sendJson(res, 503, { error: "NO_API_KEY" });
      return;
    }

    let payload;
    try {
      payload = await readRequestBody(req);
    } catch {
      sendJson(res, 400, { error: "AI_INVALID_REQUEST" });
      return;
    }

    if (!validPayload(payload)) {
      sendJson(res, 400, { error: "AI_INVALID_REQUEST" });
      return;
    }

    const { system, messages } = payload;
    const contents = messages.map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.text }],
    }));

    for (let continuation = 0; continuation <= MAX_CONTINUATIONS; continuation += 1) {
      let upstream;
      let result;

      for (let attempt = 0; attempt < MAX_UPSTREAM_ATTEMPTS; attempt += 1) {
        try {
          upstream = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": apiKey,
              },
              signal: AbortSignal.timeout(30_000),
              body: JSON.stringify({
                systemInstruction: {
                  parts: [{ text: `${system}\n\n${OUTPUT_LANGUAGE_INSTRUCTION}` }],
                },
                contents,
                generationConfig: { maxOutputTokens: 1200 },
              }),
            },
          );
        } catch {
          if (attempt === MAX_UPSTREAM_ATTEMPTS - 1) {
            sendJson(res, 503, { error: "AI_TEMPORARY_UNAVAILABLE" });
            return;
          }
          await wait(1000 * 2 ** attempt);
          continue;
        }

        try {
          result = await upstream.json();
        } catch {
          sendJson(res, 502, { error: "AI_INVALID_RESPONSE" });
          return;
        }

        const isTransient =
          upstream.status === 429 || upstream.status === 503;

        if (!isTransient || attempt === MAX_UPSTREAM_ATTEMPTS - 1) break;
        await wait(1000 * 2 ** attempt);
      }

      if (!upstream.ok) {
        const upstreamMessage =
          typeof result.error?.message === "string" ? result.error.message : "";
        const invalidApiKey =
          /api[\s_-]*key.*(invalid|not valid)|invalid.*api[\s_-]*key/i.test(
            upstreamMessage,
          );

        if (
          upstream.status === 429 ||
          result.error?.status === "RESOURCE_EXHAUSTED"
        ) {
          sendJson(res, 429, { error: "AI_RATE_LIMIT" });
        } else if (
          upstream.status === 503 ||
          result.error?.status === "UNAVAILABLE"
        ) {
          sendJson(res, 503, { error: "AI_TEMPORARY_UNAVAILABLE" });
        } else if (
          upstream.status === 401 ||
          upstream.status === 403 ||
          invalidApiKey
        ) {
          sendJson(res, 502, { error: "AI_AUTH" });
        } else if (upstream.status === 404) {
          sendJson(res, 502, { error: "AI_MODEL_UNAVAILABLE" });
        } else {
          console.error(
            `[Gemini API] upstream status=${upstream.status} code=${result.error?.status ?? "unknown"}`,
          );
          sendJson(res, 502, { error: "AI_UPSTREAM_UNAVAILABLE" });
        }
        return;
      }

      const candidate = result.candidates?.[0];
      const parts = candidate?.content?.parts;
      if (!Array.isArray(parts)) {
        sendJson(res, 502, { error: "AI_INVALID_RESPONSE" });
        return;
      }

      const text = parts
        .filter((part) => part && typeof part.text === "string")
        .map((part) => part.text)
        .join("");

      if (!text) {
        sendJson(res, 502, { error: "AI_INVALID_RESPONSE" });
        return;
      }

      const truncated = candidate.finishReason === "MAX_TOKENS";
      const needsRewrite =
        truncated || looksIncomplete(text) || likelyEnglish(text);
      if (needsRewrite && continuation < MAX_CONTINUATIONS) {
        contents.push(
          { role: "model", parts: [{ text }] },
          { role: "user", parts: [{ text: CONTINUATION_INSTRUCTION }] },
        );
        continue;
      }

      if (needsRewrite) {
        sendJson(res, 502, { error: "AI_RESPONSE_INCOMPLETE" });
        return;
      }

      if (candidate.finishReason !== "STOP") {
        sendJson(res, 502, { error: "AI_RESPONSE_BLOCKED" });
        return;
      }

      sendJson(res, 200, { text });
      return;
    }
  };
}

export default function handler(req, res) {
  return createAiHandler(process.env.GEMINI_API_KEY)(req, res);
}
