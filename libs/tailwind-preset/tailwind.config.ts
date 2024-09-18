import type { Config } from 'tailwindcss'

export default {
  content: [],
  daisyui: {
    themes: ["light", "dark", "cupcake", "dracula", "black"],
  },
  theme: {
    extend: {},
  },
  plugins: [require("@tailwindcss/typography"), require("daisyui")],
} satisfies Config

