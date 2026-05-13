const SENSITIVE_FIELDS = [
  'password',
  'confirmpassword',
  'token',
  'authorization',
  'captcha',
  'code',
  'secret',
  'access_token',
  'refresh_token'
];

function sanitizeData(data, depth = 0) {
  if (data === null || data === undefined) return data;
  if (depth > 5) return '[Object too deep]';

  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item, depth + 1));
  }

  if (typeof data !== 'object') {
    return data;
  }

  const sanitized = {};

  for (const key of Object.keys(data)) {
    const lowerKey = key.toLowerCase();

    if (SENSITIVE_FIELDS.includes(lowerKey)) {
      sanitized[key] = '***';
    } else {
      sanitized[key] = sanitizeData(data[key], depth + 1);
    }
  }

  return sanitized;
}

module.exports = { sanitizeData };
