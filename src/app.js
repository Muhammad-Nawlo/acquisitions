import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import logger from '#config/logger.js';
import cookieParser from 'cookie-parser';
import authRoutes from '#routes/auth.routes.js';
import usersRoutes from '#routes/auth.routes.js';
import securityMiddleware from '#middlewares/security.middleware.js';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
}));
app.use(securityMiddleware);

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'API is running perfect',
  });
});
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});
export default app;