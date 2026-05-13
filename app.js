require('dotenv').config();

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');

const connectDB = require('./config/db');
const securityLogger = require('./middlewares/securityLogger');
const indexRouter = require('./routes/index');
const securityAuditRouter = require('./routes/securityAudit');

connectDB();

const app = express();

if (String(process.env.TRUST_PROXY || 'false').toLowerCase() === 'true') {
  app.set('trust proxy', 1);
}

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'web-security-audit-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax'
  }
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use(securityLogger);

app.use('/', indexRouter);
app.use('/security-audit', securityAuditRouter);

app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error', {
    title: '错误',
    message: err.message,
    error: res.locals.error
  });
});

module.exports = app;
