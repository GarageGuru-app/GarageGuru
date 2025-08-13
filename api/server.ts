import serverless from "serverless-http";
import app from "../src/server/app";

export default serverless(app);