async function loadStatistics() {
  const response = await fetch('/security-audit/statistics/data');
  const data = await response.json();

  renderDailyChart(data.dailyRequests || []);
  renderRiskTypeChart(data.riskTypes || []);
  renderTopIpChart(data.topIps || []);
  renderTopPathChart(data.topPaths || []);
}

function renderDailyChart(rows) {
  const chart = echarts.init(document.getElementById('dailyChart'));
  chart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: rows.map(item => item._id) },
    yAxis: { type: 'value' },
    series: [{ name: '请求数', type: 'line', smooth: true, data: rows.map(item => item.count) }]
  });
}

function renderRiskTypeChart(rows) {
  const chart = echarts.init(document.getElementById('riskTypeChart'));
  chart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      name: '风险类型',
      type: 'pie',
      radius: ['40%', '70%'],
      data: rows.map(item => ({ name: item._id, value: item.count }))
    }]
  });
}

function renderTopIpChart(rows) {
  const chart = echarts.init(document.getElementById('topIpChart'));
  chart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: rows.map(item => item._id).reverse() },
    series: [{ name: '请求数', type: 'bar', data: rows.map(item => item.count).reverse() }]
  });
}

function renderTopPathChart(rows) {
  const chart = echarts.init(document.getElementById('topPathChart'));
  chart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: rows.map(item => item._id).reverse() },
    series: [{ name: '请求数', type: 'bar', data: rows.map(item => item.count).reverse() }]
  });
}

window.addEventListener('load', loadStatistics);
window.addEventListener('resize', () => {
  ['dailyChart', 'riskTypeChart', 'topIpChart', 'topPathChart'].forEach(id => {
    const el = document.getElementById(id);
    if (el) echarts.getInstanceByDom(el)?.resize();
  });
});
