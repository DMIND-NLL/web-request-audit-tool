const RequestLog = require('../models/RequestLog');
const { detectRisk } = require('../utils/riskDetector');
const { sanitizeData } = require('../utils/sanitizeData');

const HIGH_FREQUENCY_WINDOW_MS = 60 * 1000;
const HIGH_FREQUENCY_LIMIT = 60;
const ipAccessMap = new Map();

function normalizeIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || 'unknown';
}

function shouldSkip(req) {
  const logStatic = String(process.env.LOG_STATIC || 'false').toLowerCase() === 'true';
  if (logStatic) return false;

  return req.path.startsWith('/stylesheets') ||
    req.path.startsWith('/javascripts') ||
    req.path.startsWith('/images') ||
    req.path === '/favicon.ico';
}

function checkHighFrequency(ip) {
  const now = Date.now();
  const records = ipAccessMap.get(ip) || [];
  const freshRecords = records.filter(time => now - time <= HIGH_FREQUENCY_WINDOW_MS);
  freshRecords.push(now);
  ipAccessMap.set(ip, freshRecords);
  return freshRecords.length > HIGH_FREQUENCY_LIMIT;
}

async function securityLogger(req, res, next) {
  if (shouldSkip(req)) {
    return next();
  }

  const startTime = Date.now();

  res.on('finish', async () => {
    try {
      const responseTime = Date.now() - startTime;
      const ip = normalizeIp(req);
      const isHighFrequency = checkHighFrequency(ip);

      const requestData = {
        ip,
        method: req.method,
        path: req.path,
        originalUrl: req.originalUrl,
        query: sanitizeData(req.query),
        body: sanitizeData(req.body),
        userAgent: req.headers['user-agent'] || '',
        referer: req.headers.referer || req.headers.referrer || '',
        statusCode: res.statusCode,
        responseTime,
        userId: req.session?.user?._id || null
      };

      const riskResult = detectRisk(requestData, { isHighFrequency });

      await RequestLog.create({
        ...requestData,
        riskLevel: riskResult.riskLevel,
        riskTypes: riskResult.riskTypes,
        riskReasons: riskResult.riskReasons
      });
    } catch (err) {
      console.error('请求日志记录失败:', err.message);
    }
  });

  next();
}

module.exports = securityLogger;
