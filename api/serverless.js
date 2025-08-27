import serverless from 'serverless-http';
import app from '../dist/index.js';

export default serverless(app);