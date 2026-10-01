import react from '@vitejs/plugin-react'
import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import { createAiHandler } from "./api/ask-ai.js";

function aiApiPlugin(apiKey) {
  const registerEndpoint = (server) => {
    server.middlewares.use('/api/ask-ai', createAiHandler(apiKey))
  }

  return {
    name: 'local-gemini-api',
    configureServer: registerEndpoint,
    configurePreviewServer: registerEndpoint,
  }
}

export default defineConfig(({ mode }) => {
  const { GEMINI_API_KEY } = loadEnv(mode, process.cwd(), 'GEMINI_')

  return {
    plugins: [react(), aiApiPlugin(GEMINI_API_KEY)],
  }
})
