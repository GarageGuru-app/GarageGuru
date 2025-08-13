import serverless from "serverless-http";
import app from "../src/server/app.js";

export default serverless(app);