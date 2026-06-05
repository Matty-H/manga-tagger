import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonSaverPlugin = () => ({
  name: 'json-saver',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      // Écoute uniquement les requêtes POST sur /api/save
      if (req.url === '/api/save' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            // type sera soit 'annotations' soit 'cache'
            const { type, content } = data; 
            
            // Les fichiers seront sauvegardés à la racine du projet
            const filePath = path.resolve(__dirname, `data_${type}.json`);
            fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
            
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true }));
          } catch (e) {
            console.error("Erreur serveur Vite:", e);
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: e.message }));
          }
        });
      } else {
        next();
      }
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), jsonSaverPlugin()],
  server: {
    watch: {
      ignored: ['**/data_annotations.json', '**/data_cache.json']
    }
  }
})
