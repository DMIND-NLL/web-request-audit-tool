# Web 请求日志审计工具

这是一个用 **Node.js + Express + EJS + MongoDB** 做的 Web 安全小项目。

项目主要用于记录 Web 请求日志，并用简单规则标记一些可疑请求。

## 项目内容

本项目通过 Express 中间件记录访问请求，并把日志保存到 MongoDB 中。后台页面可以查看请求日志、筛选风险请求、查看单条请求详情，并展示一些简单统计数据。

目前包含的功能有：

- 自动记录请求日志
- 对密码、token 等字段进行脱敏
- 根据规则标记可疑请求
- 查看全部请求日志
- 查看风险请求列表
- 查看请求详情
- 按 IP、路径、方法、状态码、风险等级等条件筛选
- 查看简单统计图表
- 导出 CSV 日志

当前支持的异常标记包括：

- 疑似 SQL 注入请求
- 疑似 XSS 请求
- 疑似路径穿越请求
- 敏感路径访问
- 高频访问
- User-Agent 为空或异常
- 4xx、5xx 状态码请求



## 技术栈

- Node.js
- Express
- EJS
- MongoDB
- Mongoose
- Express Session
- ECharts
- HTML / CSS / JavaScript



## 项目结构

```text
web-request-audit-tool
├── app.js
├── package.json
├── .env.example
├── README.md
├── bin
│   └── www
├── config
│   └── db.js
├── middlewares
│   └── securityLogger.js
├── models
│   └── RequestLog.js
├── routes
│   ├── index.js
│   └── securityAudit.js
├── utils
│   ├── riskDetector.js
│   └── sanitizeData.js
├── views
│   ├── index.ejs
│   ├── error.ejs
│   ├── partials
│   │   ├── header.ejs
│   │   └── footer.ejs
│   └── security-audit
│       ├── logs.ejs
│       ├── risks.ejs
│       ├── detail.ejs
│       └── statistics.ejs
└── public
    ├── stylesheets
    │   └── style.css
    └── javascripts
        └── statistics.js
```



## 使用方法

### 1. 安装依赖

进入项目目录后执行：

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 文件，并改名为 `.env`。

Linux / macOS：

```bash
cp .env.example .env
```

Windows PowerShell：

```powershell
copy .env.example .env
```

`.env` 示例：

```env
MONGODB_URI=mongodb://127.0.0.1:27017/web_request_audit_tool
PORT=3000
SESSION_SECRET=replace-this-secret
```

如果本机 MongoDB 使用默认端口，一般只需要保持上面的配置即可。

### 3. 启动 MongoDB

请先确认 MongoDB 已经启动。

如果使用本机 MongoDB，可以检查服务是否正在运行。不同系统的启动方式可能不同，这里不做额外限制。

### 4. 启动项目

开发模式：

```bash
npm run dev
```

普通启动：

```bash
npm start
```

启动后访问：

```text
http://localhost:3000
```



## 页面地址

| 页面 | 地址 |
|---|---|
| 首页 | `/` |
| 请求日志 | `/security-audit/logs` |
| 风险请求 | `/security-audit/risks` |
| 统计分析 | `/security-audit/statistics` |
| 请求详情 | `/security-audit/detail/:id` |
| 导出日志 | `/security-audit/export` |



## 使用示例

打开首页后，可以先点击页面中的“提交演示请求”。该操作会向 `/demo/login` 发送一次 POST 请求。

请求体中的密码字段会被脱敏保存，例如：

```json
{
  "username": "admin",
  "password": "***"
}
```

然后进入“请求日志”页面，就可以看到刚才生成的日志。

也可以手动访问一些不存在的地址，例如：

```text
http://localhost:3000/test
```

这会生成一条 404 请求日志。



## 主要文件说明

### `middlewares/securityLogger.js`

请求日志中间件。每次请求结束后，它会记录请求信息、计算响应时间，并调用风险检测方法。

### `utils/sanitizeData.js`

用于处理敏感字段。当前会对以下字段进行脱敏：

```text
password
confirmPassword
token
authorization
captcha
code
secret
```

### `utils/riskDetector.js`

用于判断请求是否存在可疑特征。当前主要通过规则匹配完成，不涉及复杂算法。

### `models/RequestLog.js`

请求日志的数据模型。日志会保存到 MongoDB 中。

### `routes/securityAudit.js`

安全审计相关页面和接口，包括日志列表、风险列表、详情页、统计接口和导出接口。



## 说明

这个项目的重点是“记录”和“查看”，不是拦截请求。

也就是说，即使某个请求被标记为高风险，项目默认也只是把它记录下来，方便后续查看。这样更适合用作学习项目或审计工具。

如需进一步扩展，可以在中间件中加入拦截逻辑、IP 黑名单、登录失败统计、邮件提醒等功能。



## 可扩展方向

后续可以继续加入：

- 管理员登录
- IP 黑名单和白名单
- 登录失败次数记录
- 邮件提醒
- Webhook 提醒
- Nginx 日志导入
- 更细的风险规则配置
- 日志定期清理
