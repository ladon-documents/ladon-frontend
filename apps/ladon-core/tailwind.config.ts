import type { Config } from 'tailwindcss'
import { join } from 'path'
import { createGlobPatternsForDependencies } from '@nx/angular/tailwind'
import SharedTailwindConfig from "../../libs/tailwind-preset/tailwind.config"

export default {
  presets: [SharedTailwindConfig],
  content: [
    join(__dirname, 'src/**/!(*.stories|*.spec).{ts,html}'),
    ...createGlobPatternsForDependencies(__dirname),
		join(__dirname, '../filemanager/src/**/!(*.stories|*.spec).{ts,html}')
  ],
} satisfies Config

