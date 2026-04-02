# Cloudflare Pages 部署指南

本指南将指导您如何在 Cloudflare Pages 上部署商品管理系统，并解决访问问题。

## 前提条件

- 已注册 Cloudflare 账号
- 项目代码已准备就绪
- 了解基本的 Git 操作（如果使用 Git 部署）

## 步骤 1：部署网站到 Cloudflare Pages

### 方法 A：通过 Cloudflare Pages 控制台部署

1. **登录 Cloudflare 控制台**
   - 访问 [Cloudflare 官网](https://dash.cloudflare.com/) 并登录您的账号

2. **创建 Pages 项目**
   - 在左侧菜单中选择 "Workers & Pages"
   - 点击 "Create application" 按钮
   - 选择 "Pages" 选项

3. **选择部署方式**
   - **选项 1：通过 Git 仓库部署**（推荐）
     - 连接您的 Git 仓库（GitHub、GitLab 或 Bitbucket）
     - 选择包含 `web` 目录的仓库
     - 配置部署设置
   
   - **选项 2：直接上传文件**
     - 选择 "Upload assets"
     - 进入 `web` 目录，选择所有文件（包括 index.html、css/、js/ 等）
     - 点击 "Deploy"

4. **配置部署设置**
   - 项目名称：设置为 `xian-guo-web` 或其他您喜欢的名称
   - 生产分支：如果使用 Git，选择您的主分支（如 main 或 master）
   - **构建配置**：
     - 框架预设：选择 "None"
     - 构建命令：留空（静态网站不需要构建）
     - 构建输出目录：留空（默认根目录）
   - 点击 "Save and Deploy"

5. **等待部署完成**
   - Cloudflare 会自动部署您的网站
   - 部署完成后，您会看到一个成功页面，显示您的网站 URL（如 `xian-guo-web.pages.dev`）

## 步骤 2：配置自定义域名（可选）

1. **进入 Pages 项目设置**
   - 在 Cloudflare 控制台中，找到您刚部署的 Pages 项目
   - 点击项目进入详情页
   - 点击左侧菜单中的 "Custom domains"

2. **添加自定义域名**
   - 点击 "Add custom domain" 按钮
   - 输入您的域名（例如：`xianguo.site`）
   - 点击 "Continue"

3. **配置 DNS 记录**
   - Cloudflare 会自动为您的域名添加 DNS 记录（如果您的域名已在 Cloudflare 中管理）
   - 如果您的域名不在 Cloudflare 中管理，您需要在域名注册商的控制面板中添加以下 DNS 记录：
     - **CNAME 记录**：将您的域名指向 `xian-guo-web.pages.dev`（使用您实际的 Pages 子域名）

4. **验证域名**
   - 等待 DNS 记录生效（通常需要几分钟到几小时）
   - Cloudflare 会自动验证域名配置
   - 验证成功后，您的自定义域名将显示为 "Active"

## 步骤 3：配置 API 地址

1. **修改 API_BASE_URL 配置**
   - 打开 `web/js/app.js` 文件
   - 找到第 11-15 行的 API_BASE_URL 配置
   - 确保 API 地址正确指向您的后端服务

   ```javascript
   // 使用环境变量或默认值，支持 Vercel 和 Cloudflare Pages 部署
   const API_BASE_URL = (typeof process !== 'undefined' && process.env && process.env.API_BASE_URL)
       ? process.env.API_BASE_URL
       : (window.ENV && window.ENV.API_BASE_URL)
           ? window.ENV.API_BASE_URL
           : 'https://xianguo.site'; // 替换为您的后端 API 地址
   ```

2. **修改 index.html 中的环境变量**
   - 打开 `web/index.html` 文件
   - 找到第 417-419 行的 window.ENV 配置
   - 更新 API_BASE_URL 为您的后端服务地址

   ```html
   <script>
       // 设置客户端环境变量
       window.ENV = {
           API_BASE_URL: 'https://xianguo-217100-7-1320842230.sh.run.tcloudbase.com/api' // 替换为您的后端 API 地址
       };
   </script>
   ```

## 步骤 4：解决访问问题

### 常见问题及解决方案

1. **无法访问 Cloudflare Pages 提供的域名**
   - **原因**：部署过程中可能出现错误，或者 DNS 记录尚未生效
   - **解决方案**：
     - 检查部署状态，确保部署成功
     - 清除浏览器缓存后重试
     - 尝试使用不同的浏览器或设备访问
     - 等待一段时间后再尝试（DNS 记录可能需要时间生效）

2. **API 调用失败**
   - **原因**：API_BASE_URL 配置错误，或者后端服务未运行
   - **解决方案**：
     - 检查 API_BASE_URL 是否正确配置
     - 确保后端服务正在运行且可访问
     - 检查浏览器控制台是否有网络错误信息

3. **页面加载但功能不正常**
   - **原因**：JavaScript 错误或 API 调用失败
   - **解决方案**：
     - 打开浏览器开发者工具，查看控制台错误
     - 检查 API_BASE_URL 配置
     - 确保后端服务正常运行

4. **自定义域名无法访问**
   - **原因**：DNS 记录未正确配置或未生效
   - **解决方案**：
     - 检查 DNS 记录是否正确添加
     - 等待 DNS 记录生效（通常需要 1-24 小时）
     - 在 Cloudflare 控制台中检查域名状态

## 步骤 5：验证部署

1. **访问网站**
   - 使用 Cloudflare Pages 提供的域名（如 `xian-guo-web.pages.dev`）访问网站
   - 如果配置了自定义域名，也可以使用自定义域名访问

2. **测试功能**
   - 测试商品管理、订单管理等功能
   - 确保所有功能正常运行
   - 检查浏览器控制台是否有错误信息

## 步骤 6：持续部署（使用 Git 时）

如果您使用 Git 部署，Cloudflare Pages 会在您推送代码到指定分支时自动重新部署网站。这样，您可以通过简单的 Git 推送来更新网站。

1. **修改代码**
   - 在本地修改代码
   - 提交更改到 Git 仓库

2. **推送代码**
   - 推送到您配置的生产分支
   - Cloudflare Pages 会自动检测更改并开始部署

3. **查看部署状态**
   - 在 Cloudflare 控制台的 Pages 项目中查看部署状态
   - 部署完成后，您的更改将生效

## 项目结构说明

```
web/
├── index.html          # 主页面
├── css/               # 样式文件
├── js/                # JavaScript 文件
│   └── app.js         # 主应用逻辑（包含 API_BASE_URL 配置）
├── package.json       # 项目配置
├── vercel.json        # Vercel 配置（可选，Cloudflare Pages 不需要）
├── DEPLOYMENT.md      # Vercel 部署指南
└── CLOUDFLARE_DEPLOYMENT.md # Cloudflare Pages 部署指南
```

## 注意事项

1. **API 地址配置**：确保 API_BASE_URL 正确指向您的后端服务，否则前端无法正常获取数据

2. **跨域问题**：如果您的后端服务和前端部署在不同域名下，可能会遇到跨域问题。需要在后端服务中配置 CORS 头。

3. **HTTPS**：Cloudflare Pages 会自动为您的网站配置 HTTPS，确保网站安全访问

4. **缓存**：Cloudflare 会自动缓存您的静态资源，提高网站加载速度

5. **监控**：使用 Cloudflare 的 Analytics 功能监控网站访问情况

## 常见错误排查

### 部署失败
- **检查**：确保您上传了所有必要的文件
- **解决**：重新部署，确保包含所有文件

### 404 错误
- **检查**：确保 index.html 文件存在且位于根目录
- **解决**：重新上传文件，确保文件结构正确

### API 调用失败
- **检查**：确保 API_BASE_URL 配置正确
- **解决**：修改 API_BASE_URL 为正确的后端服务地址

### 跨域错误
- **检查**：确保后端服务配置了正确的 CORS 头
- **解决**：在后端服务中添加 CORS 配置

## 后续维护

- **更新代码**：通过 Git 推送或重新上传文件来更新网站
- **监控网站**：使用 Cloudflare 的 Analytics 功能监控网站访问情况
- **安全更新**：定期检查并更新依赖项，确保网站安全
- **备份数据**：定期导出数据，以防止数据丢失

## 联系方式

如有问题，请联系开发团队。