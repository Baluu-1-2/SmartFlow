import { app } from './app.js';
import { ENV } from './config/env.js';
import { prisma } from './config/prisma.js';

async function bootstrap() {
  try {
    // Ensure database connection is ready
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection verified.');

    const server = app.listen(ENV.PORT, () => {
      console.log(`
🚀 SmartFlow Server running successfully!
--------------------------------------------------
📍 Local URL:    http://localhost:${ENV.PORT}
📊 Health Check: http://localhost:${ENV.PORT}/api/health
🌐 Client Origin: ${ENV.CLIENT_URL}
🤖 AI Status:     ${ENV.GEMINI_API_KEY ? 'Gemini API Enabled' : 'Smart Heuristics Fallback (Active)'}
--------------------------------------------------
      `);
    });

    const shutdown = async () => {
      console.log('Gracefully shutting down server...');
      server.close(async () => {
        await prisma.$disconnect();
        console.log('Server and database connections closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
