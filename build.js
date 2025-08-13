import { build } from 'vite'

async function buildProject() {
  try {
    await build({
      build: {
        outDir: 'dist',
        emptyOutDir: true
      }
    })
    console.log('Build completed successfully!')
  } catch (error) {
    console.error('Build failed:', error)
    process.exit(1)
  }
}

buildProject()