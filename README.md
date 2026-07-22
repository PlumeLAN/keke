# keke

一个轻量的个人展示页 + Flask 点赞接口示例项目。

## 项目简介

前端是单页静态网站，用于展示 PlumeLAN 的平台入口、作品轮播、语言切换、主题切换和点赞交互；后端是一个极简 Flask API，只负责保存点赞数和当前表情展示进度。

## 目录说明

```text
.
├── assets/
│   ├── backgrounds/   # 页面背景图
│   ├── icons/         # 平台图标与点赞表情
│   ├── name/          # 站点标题图片
│   └── portfolio/     # 作品轮播图片
├── i18n/              # 中英文文案
├── config.json        # 前端运行时配置
├── index.html         # 页面结构
├── script.js          # 前端交互逻辑
├── server.py          # Flask 点赞接口
├── style.css          # 页面样式
└── requirements.txt   # Python 依赖
```

## 前后端关系

- `index.html + style.css + script.js` 组成前端单页。
- `script.js` 会在运行时读取 `config.json`，并据此加载背景图、平台链接、轮播图片、轮播自动播放配置以及点赞 API 地址。
- `server.py` 提供 `/api/likes` 接口：
  - `GET /api/likes`：读取点赞数据
  - `POST /api/likes`：提交 `{ "action": "like" }` 或 `{ "action": "reset" }`
- 点赞数据默认保存在仓库根目录的 `likes.json` 中。

## 依赖安装

建议使用 Python 3.10+。

```bash
pip install -r requirements.txt
```

## 启动方式

### 1. 启动后端

```bash
python server.py
```

可选环境变量：

- `PORT`：后端端口，默认 `5000`
- `FLASK_HOST`：监听地址，默认 `0.0.0.0`
- `FLASK_DEBUG`：设为 `1` 时开启调试模式，默认关闭
- `LIKES_DATA_FILE`：自定义点赞数据文件路径
- `CORS_ALLOWED_ORIGINS`：逗号分隔的允许跨域来源；默认只允许 `localhost` 和 `127.0.0.1` 的本机开发端口。前后端分离部署时必须显式设置，例如 `https://example.com`

### 2. 启动前端静态服务

前端需要通过静态服务器访问，不能直接双击 `index.html`，因为页面会在运行时请求 `config.json` 和 `i18n/*.json`。

```bash
python -m http.server 8000
```

然后打开：

- 前端：`http://127.0.0.1:8000`
- 后端：`http://127.0.0.1:5000`

## 配置说明

`config.json` 支持以下主要字段：

```json
{
  "siteName": "PlumeLAN",
  "background": "assets/backgrounds/default.jpg",
  "portfolioImages": ["assets/portfolio/work1.jpg"],
  "socialLinks": {
    "pixiv": "https://example.com",
    "bilibili": "https://example.com",
    "twitter": "https://example.com",
    "fanbox": "https://example.com"
  },
  "portfolio": {
    "autoPlay": true,
    "autoPlayInterval": 5000
  },
  "apiBaseUrl": "auto"
}
```

说明：

- `background`：页面背景图路径
- `portfolioImages`：轮播图片数组
- `socialLinks`：平台卡片跳转地址
- `portfolio.autoPlay`：是否自动播放
- `portfolio.autoPlayInterval`：自动播放间隔（毫秒）
- `apiBaseUrl`：点赞接口基础地址
  - 设为 `"auto"` 时：
    - 同域部署默认使用当前站点的 `/api`
    - 本地在 `localhost/127.0.0.1` 上以非 `5000` 端口运行前端时，会自动尝试 `:5000/api`
  - 如果前后端分开部署，可直接改成完整地址，例如 `https://example.com/api`

## 兼容性与部署说明

- 保持与现有 Flask `/api/likes` 接口兼容。
- 如果 `likes.json` 缺失、为空或内容损坏，后端会自动回退到默认值并重新写入文件。
- 点赞数据使用进程内锁和原子替换文件写入，适合单进程部署；多进程或多实例部署应改用数据库或托管存储。
- 该项目适合轻量展示或演示部署；若需要长期线上持久化，建议将点赞数据迁移到数据库或托管存储。

## 基础校验

当前仓库可用的轻量校验命令：

```bash
node --check script.js
python -m py_compile server.py
python -m unittest discover -s tests
```
