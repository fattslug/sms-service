import express, { Response, Request, NextFunction } from 'express';
import compression from 'compression';  // compresses requests
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cors from 'cors';
import chalk from 'chalk';

dotenv.config({ path: '.env' });

// Create Express server
const app = express();

// CORS Setup
if (process.env.USE_CORS === 'true') {
  const allowedOrigins: string[] = (process.env.ALLOWED_ORIGINS as string).split(',') as string[];
  const corsOptions = {
    origin: '',
    credentials: true,
    optionsSuccessStatus: 200
  }

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (allowedOrigins.indexOf(req.headers.origin as string) > -1 || req.headers.origin === undefined) {
      corsOptions.origin = req.headers.origin as string;
      next();
    } else {
      console.log(chalk.red('Access from invalid origin: '), req.headers.origin);
      res.sendStatus(403);
    }
  });
  app.use(cors(corsOptions));
}

// Express configuration
app.set('port', process.env.PORT || 3000);
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/**
 * API routes.
 */
const messagesRoutes = require('./messages/messages.routes');
app.use('/sms/messages', messagesRoutes);

const contactsRoutes = require('./contacts/contacts.routes');
app.use('/sms/contacts', contactsRoutes);

export default app;