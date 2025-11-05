/**
 * Vercel Serverless Function Entry Point
 * This file is used by Vercel to deploy the Express app as serverless functions
 * Vercel will automatically compile this TypeScript file
 */

import app from "../src/app.js";

// Export the Express app as the default export for Vercel
export default app;

