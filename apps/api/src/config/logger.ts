import winston from 'winston';

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console({
      level: 'info',
    }),
    new winston.transports.Console({
      level: 'error',
      stderrLevels: ['error'],
    }),
  ],
});

export default logger;
