# Visualized-Deadline

**可视化 Deadline，非传统 Todo List。**

Visualized-Deadline（VD）是一个帮助用户观察 Deadline、认知压力与生活动量的前端 MVP。它不是传统待办列表；系统记录任务、时间压力与人生节奏，用户只需要观察状态，选择下一步。

## v0.5-alpha：Pressure Calibration + Achievement System

- 创建项目：标题、描述、重要性（1-10）、截止时间、进度（0-100）、活动类型。
- 管理项目：新增、编辑、删除、完成、放弃，并保留基础生命日志。
- 首次压力校准：首次进入时询问“你近期主观生活压力有多大？”，保存为 `baselinePressure`。
- 实时压力指数：以压力基线、进行中项目的紧急度/重要性、完成项目与恢复/娱乐活动的释放共同估算。
- 压力状态：平稳、可控、高压、过载，以及 raw pressure 超过 100 时的“压力爆表 / Burnout Risk”。
- 轻量成就系统：记录首次进入、首次创建/完成/放弃低价值任务、压力回到可控区等生活动量事件。
- 紧急重要矩阵：用二维压力场展示进行中项目，并清晰呈现四个象限。
- 倒计时：展示“还剩 6天 12小时”或“已超时 3小时”等截止时间状态。
- 本地持久化：使用 `localStorage` 保存项目、压力基线、成就，并兼容旧版本任务数据。

## 压力模型

每个进行中项目会计算：

```text
itemPressure = urgencyWeight * importanceWeight * unfinishedWeight
```

总压力会计算：

```text
rawPressure = baselinePressure + weightedActiveItemPressure - relief
```

其中：

- `baselinePressure` 来自首次进入时的主观压力校准。
- `urgencyWeight` 根据截止时间远近计算，超期和 24 小时内更高。
- `importanceWeight` 来自 1-10 的重要性。
- `unfinishedWeight` 随进度降低，但保留最小未完成权重。
- `relief` 来自完成项目，以及恢复 / 娱乐活动带来的轻微减压。
- 常规显示归一到 0-100；raw pressure 超过 100 时会显示 100+ 的 burnout risk 状态。

压力状态分区：

- 0-30：平稳
- 31-60：可控
- 61-80：高压
- 81-100：过载
- >100：压力爆表 / Burnout Risk

## 成就列表

- 初次进入 VD
- 第一次创建任务
- 第一次完成任务
- 第一次放弃低价值任务
- 第一次压力降到可控区
- 第一次完成 3 个任务
- 第一次完成 7 天内任务推进
- 第一次使用恢复/娱乐活动降低压力

## 技术栈

- React
- TypeScript
- Vite
- Tailwind CSS
- localStorage

## 快速开始

```powershell
npm install
npm run dev
```

默认开发服务器会在终端输出本地访问地址，通常是：

```powershell
http://localhost:5173
```

## 可用脚本

```powershell
npm run dev
```

启动 Vite 本地开发服务器。

```powershell
npm run build
```

执行 TypeScript 编译检查并构建生产资源。

```powershell
npm run preview
```

预览生产构建结果。

## GitHub Pages 部署

本项目已配置 GitHub Actions 工作流。推送到 `main` 分支后，工作流会自动安装依赖、构建项目，并把 `dist` 部署到 GitHub Pages。

Vite 的 `base` 已设置为 `/Visualized-Deadline/`，适配仓库 Pages 地址。

## 数据兼容

旧版本 `localStorage` 任务会被自动兼容：

- 旧的 1-5 重要性会迁移到 1-10。
- 缺失的 `progress` 会补为 0。
- 缺失的 `activityType` 会补为 `task`。
- 缺失的 `lifecycleStatus` 会补为 `active`。
- 旧的 `done` 状态会视为 100% 进度和已完成。
- 如果没有 `baselinePressure`，会显示首次压力校准。
- 如果没有成就数据，会初始化为空数组。
