const express = require('express');
const router = express.Router();

router.get('/', function(req, res) {
  res.render('index', {
    title: 'Web 请求日志审计工具'
  });
});

router.post('/demo/login', function(req, res) {
  const { username } = req.body;
  req.session.user = {
    _id: 'demo-user-001',
    username: username || 'demo'
  };
  res.redirect('/security-audit/logs');
});

router.get('/demo/logout', function(req, res) {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;
