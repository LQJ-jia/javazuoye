# 陆勤家的空间 Java Web

这是新增的 Java Web 版本，保留原来的 GitHub Pages/VitePress 配置文件不改动。页面配色为蓝白，入口首页显示“欢迎来到陆勤家的空间”，点击“进入”后进入资料管理界面。

## 功能

- 左侧侧边栏包含“平时作业”和“获奖证明”两个按钮。
- 右侧按分类展示内容，支持新增、修改、删除、查询。
- 支持上传本地图片，图片保存在 `uploads` 目录。
- 每条内容都可以填写备注文字说明。
- 后端使用 Java 8 自带 HTTP 服务，数据库使用 MySQL 和 JDBC。
- 前端使用 Vue + JavaScript，Vue 文件已放在 `web/assets/vue.global.prod.js`，不依赖外网 CDN。

## 数据库

先在 MySQL 中执行：

```sql
source database/schema.sql;
```

默认连接信息：

```text
DB_URL=jdbc:mysql://localhost:3306/luqin_space?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&useSSL=false
DB_USER=root
DB_PASSWORD=123456
APP_PORT=8080
```

如果你的 MySQL 密码不同，可以在 PowerShell 里临时设置环境变量，不需要修改配置文件：

```powershell
$env:DB_USER="root"
$env:DB_PASSWORD="你的密码"
$env:APP_PORT="8080"
```

## 启动

1. 安装 JDK 8 或更高版本，确保 `javac` 可用。
2. 下载 MySQL JDBC 驱动 `mysql-connector-j-*.jar`，放到 `lib` 目录。
3. 在项目根目录运行：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\start.ps1
```

启动后访问：

```text
http://localhost:8080
```
