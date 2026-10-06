import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { config } from './config.js';
import { prisma } from './db.js';
import { errorHandler, notFound } from './middleware/error.js';
import authRouter from './routes/auth.js';

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(pinoHttp({ redact: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'] }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.get('/auth/health', async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: 'ok' });
});
app.use('/auth', authRouter);
app.use(notFound);
app.use(errorHandler);

app.listen(config.port, () => console.log(`auth listening on :${config.port}`));
