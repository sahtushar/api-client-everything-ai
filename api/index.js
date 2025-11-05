/**
 * Vercel Serverless Function Entry Point
 * This file is used by Vercel to deploy the Express app as serverless functions
 */

import app from "../dist/app.js";

// Export the Express app as the default export for Vercel
export default app;

