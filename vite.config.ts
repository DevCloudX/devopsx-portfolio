import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
const hasCustomDomain = existsSync(resolve(process.cwd(), 'public/CNAME'))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.GITHUB_REPOSITORY && !hasCustomDomain
    ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
    : '/',
})
