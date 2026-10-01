import { Buffer } from "node:buffer";
import process from "node:process";

const GEMINI_MODEL = "gemini-3.5-flash";
const MAX_REQUEST_BYTES = 1_000_000;
const MAX_UPSTREAM_ATTEMPTS = 3;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
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
              systemInstruction: { parts: [{ text: system }] },
              contents: messages.map((message) => ({
                role: message.role === "assistant" ? "model" : "user",
                parts: [{ text: message.text }],
              })),
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

    const parts = result.candidates?.[0]?.content?.parts;
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

    sendJson(res, 200, { text });
  };
}

export default function handler(req, res) {
  return createAiHandler(process.env.GEMINI_API_KEY)(req, res);
}
