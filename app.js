/* eslint-disable import/no-extraneous-dependencies */

const path = require('path');
const express = require('express');
const morgan = require('morgan');
const ratelimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./utils/appError');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const viewRouter = require('./routes/viewRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const cookieParser = require('cookie-parser');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) Global Middlewares

//Middleware // A function that can modify the income response
app.use(express.static(path.join(__dirname, 'public')));

// const scriptSrcUrls = [
//   'https://api.tiles.mapbox.com/',
//   'https://api.mapbox.com/',
// ];
// const styleSrcUrls = [
//   'https://api.mapbox.com/',
//   'https://api.tiles.mapbox.com/',
//   'https://fonts.googleapis.com/',
// ];
// const connectSrcUrls = [
//   'https://api.mapbox.com/',
//   'https://a.tiles.mapbox.com/',
//   'https://b.tiles.mapbox.com/',
//   'https://events.mapbox.com/',
// ];
// const fontSrcUrls = ['fonts.googleapis.com', 'fonts.gstatic.com'];
// app.use(
//   helmet.contentSecurityPolicy({
//     directives: {
//       defaultSrc: [],
//       connectSrc: ["'self'", ...connectSrcUrls],
//       scriptSrc: ["'self'", ...scriptSrcUrls],
//       styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
//       workerSrc: ["'self'", 'blob:'],
//       objectSrc: [],
//       imgSrc: ["'self'", 'blob:', 'data:'],
//       fontSrc: ["'self'", ...fontSrcUrls],
//     },
//   })
// );
// Set security HTTP headers
// app.use(helmet()); //calling helmet() will return a function

//Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same IP
// allow 100 requests from the same IP in 1 hour
const limiter = ratelimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requestas from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter polution
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

// Serving static files
// app.use(express.static(`${__dirname}/public`));

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next(); // !!! must be called
});

// 2) Route handlers

// 3) Routes

/*
// GET
app.get('/api/v1/tours', getAllTours);
//GET by ID
app.get('/api/v1/tours/:id', getTour);
// POST
app.post('/api/v1/tours', createTour);
//PATCH
app.patch('/api/v1/tours/:id', updateTour);
//DELETE
app.delete('/api/v1/tours/:id', deleteTour);
*/
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRoutes);

// Handling unexisting routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl}`, 404));
});

//Error handling middleware
app.use(globalErrorHandler);

// 4) Start Server
module.exports = app;
