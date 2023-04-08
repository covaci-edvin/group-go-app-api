/* eslint-disable import/no-extraneous-dependencies */
const cors = require('cors');
const express = require('express');
const path = require('path');
const morgan = require('morgan');
const ratelimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');
const cookieParser = require('cookie-parser');

const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./utils/appError');
const userRouter = require('./routes/userRoutes');
const groupRoutes = require('./routes/groupRoutes');

const app = express();

app.use(cors());

// 1) Global Middlewares
app.use(express.static(path.join(__dirname, 'public')));

//Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same IP 100 per hour
const limiter = ratelimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

app.use(mongoSanitize());

app.use(xss());

app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'price',
      'ratingQuantity',
      'difficulty',
      'maxGroupSize',
    ],
  })
);

app.use(compression());
// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next(); // !!! must be called
});

// 2) Route handlers

// 3) Routes
app.use('/api/v1/users', userRouter);
app.use('/api/v1/groups', groupRoutes);

// Handling unexisting routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl}`, 404));
});

//Error handling middleware
app.use(globalErrorHandler);

// 4) Start Server
module.exports = app;
