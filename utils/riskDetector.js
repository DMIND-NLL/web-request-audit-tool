function appendRisk(result, type, reason, level) {
  if (!result.riskTypes.includes(type)) {
    result.riskTypes.push(type);
  }
  if (!result.riskReasons.includes(reason)) {
    result.riskReasons.push(reason);
  }

  const order = { normal: 0, low: 1, medium: 2, high: 3 };
  if (order[level] > order[result.riskLevel]) {
    result.riskLevel = level;
  }
}

function buildDetectContent(requestData) {
  return JSON.stringify({
    url: requestData.originalUrl || '',
    path: requestData.path || '',
    query: requestData.query || {},
    body: requestData.body || {},
    userAgent: requestData.userAgent || ''
  }).toLowerCase();
}

function detectRisk(requestData, options = {}) {
  const result = {
    riskLevel: 'normal',
    riskTypes: [],
    riskReasons: []
  };

  const content = buildDetectContent(requestData);
  const path = requestData.path || '';
  const userAgent = requestData.userAgent || '';

  const sqlPatterns = [
    /\bunion\s+select\b/i,
    /\binformation_schema\b/i,
    /\bsleep\s*\(/i,
    /\bbenchmark\s*\(/i,
    /('|%27)\s*(or|and)\s+('|%27)?\d+('|%27)?\s*=\s*('|%27)?\d+/i,
    /\bselect\b.+\bfrom\b/i,
    /\bdrop\s+table\b/i
  ];

  const xssPatterns = [
    /<\s*script/i,
    /javascript\s*:/i,
    /onerror\s*=/i,
    /onclick\s*=/i,
    /onload\s*=/i,
    /<\s*iframe/i,
    /<\s*svg/i
  ];

  const pathTraversalPatterns = [
    /\.\.\//,
    /\.\.\\/,
    /%2e%2e/i,
    /\/etc\/passwd/i,
    /windows\/win\.ini/i
  ];

  const sensitivePathPatterns = [
    /^\/admin/i,
    /^\/\.env/i,
    /^\/config/i,
    /^\/backup/i,
    /^\/phpmyadmin/i,
    /^\/server-status/i,
    /^\/wp-admin/i,
    /^\/\.git/i
  ];

  const suspiciousUserAgentPatterns = [
    /sqlmap/i,
    /nikto/i,
    /acunetix/i,
    /nessus/i,
    /masscan/i,
    /nmap/i,
    /python-requests/i,
    /curl/i,
    /wget/i
  ];

  if (sqlPatterns.some(pattern => pattern.test(content))) {
    appendRisk(result, 'SQL_INJECTION', '请求内容中包含疑似 SQL 注入特征', 'high');
  }

  if (xssPatterns.some(pattern => pattern.test(content))) {
    appendRisk(result, 'XSS', '请求内容中包含疑似 XSS 特征', 'high');
  }

  if (pathTraversalPatterns.some(pattern => pattern.test(content))) {
    appendRisk(result, 'PATH_TRAVERSAL', '请求内容中包含疑似路径穿越特征', 'high');
  }

  if (sensitivePathPatterns.some(pattern => pattern.test(path))) {
    appendRisk(result, 'SENSITIVE_PATH_ACCESS', '访问了敏感路径', 'medium');
  }

  if (!userAgent.trim()) {
    appendRisk(result, 'ABNORMAL_USER_AGENT', 'User-Agent 为空', 'low');
  } else if (suspiciousUserAgentPatterns.some(pattern => pattern.test(userAgent))) {
    appendRisk(result, 'ABNORMAL_USER_AGENT', 'User-Agent 包含自动化工具或扫描器特征', 'medium');
  }

  if (requestData.statusCode >= 500) {
    appendRisk(result, 'SERVER_ERROR', '请求触发服务器错误状态码', 'medium');
  } else if (requestData.statusCode === 404) {
    appendRisk(result, 'NOT_FOUND_PROBING', '请求返回 404，可能存在路径探测行为', 'low');
  }

  if (options.isHighFrequency) {
    appendRisk(result, 'HIGH_FREQUENCY_ACCESS', '同一 IP 在短时间内访问频率过高', 'medium');
  }

  return result;
}

module.exports = { detectRisk };
