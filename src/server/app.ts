import express from "express";
import cors from "cors";
import { registerRoutes } from "../../server/routes";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register all routes
registerRoutes(app);

// Export the app without listening
export default app;