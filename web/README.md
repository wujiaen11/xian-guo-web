# 商品管理系统

基于Web前端HTML数据库的商品管理系统，支持完整的CRUD操作，并与微信小程序实现实时数据同步。

## 技术栈

* **前端框架**: HTML + CSS + JavaScript (Vue.js)
* **数据库**: Firebase Realtime Database
* **小程序集成**: 微信小程序
* **数据备份**: Firebase Cloud Storage

## 系统功能

### Web端管理系统

* ✅ 商品列表展示
* ✅ 商品添加
* ✅ 商品编辑
* ✅ 商品删除
* ✅ 商品搜索
* ✅ 数据导出
* ✅ 数据导入
* ✅ 实时数据同步

### 小程序端

* ✅ 商品列表展示
* ✅ 实时数据更新
* ✅ 库存数量同步

## 快速开始

### 1. 配置Firebase

1. 访问 [Firebase Console](https://console.firebase.google.com/) 并创建一个新项目
2. 在项目设置中获取您的Firebase配置信息
3. 修改 `js/firebase.js` 文件，替换为您自己的Firebase配置

```javascript
var firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 2. 配置微信小程序

1. 修改 `utils/firebase.js` 文件，替换为您自己的Firebase配置
2. 按照 [Firebase官方文档](https://firebase.google.com/docs/reference/js/firebase) 配置微信小程序的Firebase SDK

### 3. 运行Web端管理系统

1. 使用浏览器打开 `index.html` 文件
2. 开始管理商品数据

## 数据库结构

```javascript
products: {
  productId: {
    id: String,          // 商品ID
    name: String,        // 商品名称
    description: String, // 商品描述
    price: Number,       // 商品价格
    stock: Number,       // 库存数量
    createdAt: Timestamp,// 创建时间
    updatedAt: Timestamp // 更新时间
  }
}
```

## 使用说明

### 添加商品

1. 点击 "添加商品" 按钮
2. 填写商品信息
3. 点击 "添加" 按钮

### 编辑商品

1. 在商品列表中找到要编辑的商品
2. 点击 "编辑" 按钮
3. 修改商品信息
4. 点击 "更新" 按钮

### 删除商品

1. 在商品列表中找到要删除的商品
2. 点击 "删除" 按钮
3. 确认删除操作

### 搜索商品

1. 在搜索框中输入商品名称
2. 系统会自动过滤显示匹配的商品

### 导出数据

1. 点击 "导出数据" 按钮
2. 系统会生成一个JSON文件并下载到本地

### 导入数据

1. 点击 "导入数据" 按钮
2. 选择要导入的JSON文件
3. 确认导入操作（注意：这将覆盖现有数据）

## 注意事项

1. 请确保您的Firebase项目已正确配置，并启用了Realtime Database
2. 微信小程序需要配置相应的域名白名单，才能访问Firebase服务
3. 建议定期导出数据，以防止数据丢失
4. 生产环境中，请确保Firebase数据库规则设置得当，以保护数据安全

## 系统架构

```
┌─────────────────┐      ┌─────────────────────┐      ┌─────────────────┐
│   Web管理系统   │◄────►│  Firebase数据库    │◄────►│   微信小程序    │
│ (CRUD操作)      │      │  (实时数据同步)     │      │ (商品展示/库存更新) │
└─────────────────┘      └─────────────────────┘      └─────────────────┘
         ▲                          ▲
         │                          │
         └──────────────────────────┘
                  数据备份
```

## 后续扩展

1. 添加用户权限管理
2. 支持商品分类
3. 添加销售统计功能
4. 支持图片上传
5. 优化移动端体验

## 许可证

MIT License

## 联系方式

如有问题或建议，请联系开发团队。