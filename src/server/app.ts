import express from "express";
import cors from "cors";
import { registerRoutes } from "../../server/routes.js";
import fs from "fs";
import path from "path";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register all API routes first
registerRoutes(app);

// Serve static files for frontend
app.use(express.static(path.join(process.cwd(), 'dist/public')));

// For all non-API routes, serve the React app
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    try {
      const indexPath = path.join(process.cwd(), 'dist/public/index.html');
      if (fs.existsSync(indexPath)) {
        const html = fs.readFileSync(indexPath, 'utf8');
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
      } else {
        // Fallback HTML with correct asset references
        const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    <title>ServiceGuru</title>
    <script type="module" crossorigin src="/assets/index-Z7HpSreL.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-e0UFbN1B.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
      }
    } catch (error) {
      console.error('Error serving index.html:', error);
      res.status(500).json({ error: 'Failed to serve application' });
    }
  }
});

// Export the app without listening
export default app;