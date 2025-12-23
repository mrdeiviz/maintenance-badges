import 'dotenv/config';
import { loadConfig } from './core/config.js';
import { createLogger } from './core/logger.js';
import { startServer } from './core/server.js';

// Load configuration
loadConfig();

// Create logger
createLogger();

// Start server
startServer();
