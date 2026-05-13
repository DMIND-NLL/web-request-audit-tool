const express = require('express');
const router = express.Router();
const RequestLog = require('../models/RequestLog');

function buildFilter(query, onlyRisk = false) {
  const filter = {};

  if (onlyRisk) {
    filter.riskLevel = { $ne: 'normal' };
  }

  if (query.ip) filter.ip = new RegExp(query.ip.trim(), 'i');
  if (query.path) filter.path = new RegExp(query.path.trim(), 'i');
  if (query.method) filter.method = query.method;
  if (query.statusCode) filter.statusCode = Number(query.statusCode);
  if (query.riskLevel) filter.riskLevel = query.riskLevel;
  if (query.riskType) filter.riskTypes = query.riskType;

  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = new Date(query.startDate + 'T00:00:00');
    if (query.endDate) filter.createdAt.$lte = new Date(query.endDate + 'T23:59:59');
  }

  return filter;
}

function getPageInfo(query) {
  const page = Math.max(parseInt(query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || '10', 10), 5), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

router.get('/', (req, res) => {
  res.redirect('/security-audit/logs');
});

router.get('/logs', async (req, res, next) => {
  try {
    const filter = buildFilter(req.query, false);
    const { page, limit, skip } = getPageInfo(req.query);

    const [logs, total] = await Promise.all([
      RequestLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      RequestLog.countDocuments(filter)
    ]);

    res.render('security-audit/logs', {
      title: '请求日志',
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      query: req.query
    });
  } catch (err) {
    next(err);
  }
});

router.get('/risks', async (req, res, next) => {
  try {
    const filter = buildFilter(req.query, true);
    const { page, limit, skip } = getPageInfo(req.query);

    const [logs, total] = await Promise.all([
      RequestLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      RequestLog.countDocuments(filter)
    ]);

    res.render('security-audit/risks', {
      title: '风险请求',
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      query: req.query
    });
  } catch (err) {
    next(err);
  }
});

router.get('/detail/:id', async (req, res, next) => {
  try {
    const log = await RequestLog.findById(req.params.id).lean();
    if (!log) {
      return res.status(404).render('error', {
        message: '日志不存在',
        error: { status: 404 }
      });
    }

    res.render('security-audit/detail', {
      title: '日志详情',
      log
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/logs/:id', async (req, res, next) => {
  try {
    await RequestLog.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.get('/statistics', async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayTotal, todayRisk, riskIpAgg, latestRisks] = await Promise.all([
      RequestLog.countDocuments({ createdAt: { $gte: today } }),
      RequestLog.countDocuments({ createdAt: { $gte: today }, riskLevel: { $ne: 'normal' } }),
      RequestLog.aggregate([
        { $match: { riskLevel: { $ne: 'normal' } } },
        { $group: { _id: '$ip' } },
        { $count: 'count' }
      ]),
      RequestLog.find({ riskLevel: { $ne: 'normal' } }).sort({ createdAt: -1 }).limit(8).lean()
    ]);

    res.render('security-audit/statistics', {
      title: '统计分析',
      cards: {
        todayTotal,
        todayRisk,
        riskIpCount: riskIpAgg[0]?.count || 0
      },
      latestRisks
    });
  } catch (err) {
    next(err);
  }
});

router.get('/statistics/data', async (req, res, next) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [dailyRequests, riskTypes, topIps, topPaths] = await Promise.all([
      RequestLog.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Shanghai' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      RequestLog.aggregate([
        { $match: { riskLevel: { $ne: 'normal' } } },
        { $unwind: '$riskTypes' },
        { $group: { _id: '$riskTypes', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      RequestLog.aggregate([
        { $group: { _id: '$ip', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      RequestLog.aggregate([
        { $group: { _id: '$path', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.json({ dailyRequests, riskTypes, topIps, topPaths });
  } catch (err) {
    next(err);
  }
});

router.get('/export', async (req, res, next) => {
  try {
    const filter = buildFilter(req.query, false);
    const logs = await RequestLog.find(filter).sort({ createdAt: -1 }).limit(5000).lean();

    const headers = ['时间', 'IP', '方法', '路径', '状态码', '响应时间ms', '风险等级', '风险类型', '风险原因'];
    const rows = logs.map(log => [
      new Date(log.createdAt).toLocaleString('zh-CN'),
      log.ip,
      log.method,
      log.path,
      log.statusCode,
      log.responseTime,
      log.riskLevel,
      (log.riskTypes || []).join('|'),
      (log.riskReasons || []).join('|')
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(value => `"${String(value || '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="request-logs.csv"');
    res.send('\ufeff' + csv);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
