# 矿助 (Mine Assist) - 个人信息整理与导航网站

本项目是一个纯前端静态网站，采用极简的 **HTML + CSS + Vanilla JS** 架构构建，专为长期迭代和 GitHub -> Cloudflare Pages 自动部署设计。

无需安装任何后端依赖或框架，双击即可查看基础界面（由于使用了 Fetch API 获取数据，建议使用本地服务器运行）。

## 📁 1. 项目结构树

```text
├── index.html        # 页面主骨架，包含顶导航、搜索框和主内容挂载点
├── style.css         # 核心样式文件，使用原生 CSS 变量设计，方便维护配色
├── script.js         # 前端逻辑脚本，负责路由模拟、实时搜索和卡片渲染
├── data/
│   └── content.json  # 核心数据源文件，所有内容均从此处动态读取
└── README.md         # 项目使用和部署说明
```

## 🚀 2. 本地运行方法

由于项目使用原生 `fetch('./data/content.json')` 读取数据，直接双击 `index.html` 打开可能会因为浏览器的跨域/本地文件安全策略 (CORS) 导致数据加载失败。

**解决方法：使用本地 HTTP 服务器运行**
- **方法一 (VS Code)**: 安装扩展 [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)，右键 `index.html` 点击 "Open with Live Server"。
- **方法二 (Python)**: 打开终端，在项目根目录运行 `python3 -m http.server 8000`，然后在浏览器访问 `http://localhost:8000`。
- **方法三 (Node.js)**: 如果你装了 npm，可以在项目根目录运行 `npx serve .`

## ☁️ 3. 数据维护

网站的所有卡片内容均在 `data/content.json` 中配置。格式如下：

```json
{
  "id": "唯一标识",
  "module": "学习/旅行/饮食 等模块名",
  "title": "卡片文章标题",
  "content": "卡片内容...",
  "tags": ["标签1", "标签2"]
}
```
后续想要增加新内容、新模块，**只需修改即可自动在对应分类和搜索中展示，无需更改 HTML 和 JS 代码**。

## 🐙 4. 如何上传到 GitHub

如果你尚未初始化 GitHub 仓库，请按照以下步骤执行：

1. 在 [GitHub 官网](https://github.com/) 登录你的账号。
2. 点击右上角 "+" -> **New repository**。
3. 填写 Repository name（比如 `kuang-zhu-web`），设置为 **Public** 或 **Private** 均可，点击 Create repository。
4. 在你本地电脑的该项目文件夹下打开终端，依次运行：
   ```bash
   git init
   git add .
   git commit -m "init: 矿助项目首次提交"
   git branch -M main
   git remote add origin https://github.com/你的用户名/kuang-zhu-web.git
   git push -u origin main
   ```
至此，你的代码就已经成功推送到 GitHub。

## ⚡ 5. 如何连接 Cloudflare Pages 实现自动部署

1. 登录到 [Cloudflare 控制台](https://dash.cloudflare.com/)。
2. 左侧导航栏找到并点击 **Workers & Pages**。
3. 点击 **Create**（创建应用）按钮，然后选择 **Pages** 选项卡。
4. 点击 **Connect to Git**（连接到 Git）。
5. 授权连接你的 GitHub 账号，并在列表中选择你刚刚创建的仓库（如 `kuang-zhu-web`）。
6. 点击 **Begin setup** 进入设置环节：
   - **Project name**: 填你喜欢的名字。
   - **Production branch**: 默认 `main`。
   - **Framework preset**: 选择 **None**（因为我们是纯静态文件）。
   - **Build command**: 留空（不填）。
   - **Build output directory**: 留空（不填，或填 `/`，因为我们 `index.html` 就在根目录）。
7. 点击 **Save and Deploy**。等几十秒后，页面即可上线，并获得一个类似 `xxxx.pages.dev` 的外网链接。

**✅ 后续自动化**：以后你只要往 GitHub `main` 分支 push 更新的 JSON 数据，Cloudflare 就会在几十秒内自动部署最新版本，无需手动干预。不需要配置任何后端环境变量。

## 💡 6. 后续扩展建议

本项目架构非常简单且易于扩展，如果你想要在未来丰富功能，可以沿着以下思路：

1. **添加详情页模式**: 可以在 `content.json` 中给卡片增加一个 `markdown` 或 `html` 字段。在 `script.js` 中增加点击卡片弹出全屏弹窗（Modal）的逻辑来显示长文。
2. **移动端手势和动画**: 引入轻量级的动画库（如 `anime.js`）给卡片增加流畅体验。
3. **书签/收藏功能**: 使用浏览器的 `localStorage` 在用户本地保存点击过的大红心收藏卡片 ID。
4. **分类与排序**: 可以在 json 里增加 `date` 字段，并在页面上增加一个按时间排序或按标签（Tag）二次过滤的下拉框。
