# Dashboard统计功能实现说明

## 功能概述

实现了Dashboard的数据统计展示,支持权限区分:
- **普通用户**: 只显示自己创建的数据统计
- **超级管理员**: 显示所有用户的数据总和

## 统计内容

### 1. Issues统计
- 待处理数量 (pending)
- 处理中数量 (processing)
- 总数量

### 2. Nodes统计
- 空闲节点数 (idle - 在线但未分配任务)
- 运行中节点数 (running - 正在执行任务)
- 离线节点数 (offline)
- 总节点数

### 3. Projects统计
- 项目总数

### 4. Prompts统计
- 提示词总数

### 5. Credentials统计
- 凭证总数

### 6. Repositories统计
- 仓库总数

### 7. 运行中的任务列表
显示最近10条运行中的任务:
- Issue标题
- 节点名称
- 已运行时间 (自动格式化为 h:m:s)
- 状态

## 后端实现

### API端点
**GET /api/v1/dashboard/stats**

返回数据结构:
```json
{
  "issues": {
    "pending": 5,
    "processing": 2,
    "total": 20
  },
  "nodes": {
    "idle": 3,
    "running": 2,
    "offline": 1,
    "total": 6
  },
  "projects_count": 10,
  "prompts_count": 15,
  "credentials_count": 8,
  "repositories_count": 12,
  "running_tasks": [
    {
      "task_id": "uuid",
      "issue_id": "uuid",
      "issue_title": "Fix authentication bug",
      "node_name": "AI Node 1",
      "running_time": "5m 30s",
      "started_at": "2025-11-21T10:00:00"
    }
  ]
}
```

### 权限控制
- 检测 `current_user.is_superuser`
- 普通用户: 添加 `owner_id` 过滤条件
- 超级管理员: 不添加过滤,查询所有数据

### 文件位置
- 后端路由: `backend/app/api/routes/dashboard.py`
- 路由注册: `backend/app/api/main.py`

## 前端实现

### UI组件

1. **统计卡片 (StatCard)**
   - 标题
   - 数值(大字体显示)
   - 副标题(详细信息)
   - 图标
   - 颜色主题

2. **任务列表表格**
   - Issue标题
   - 节点名称(Badge显示)
   - 运行时间
   - 状态(Badge显示)

### 特性
- ✅ 自动刷新 (10秒间隔)
- ✅ 加载状态显示
- ✅ 响应式布局
- ✅ 空状态提示
- ✅ 使用生成的API client

### 文件位置
- Dashboard页面: `frontend/src/routes/_layout/index.tsx`

## 使用方法

### 1. 访问Dashboard

登录后默认进入Dashboard页面: http://localhost:5173

### 2. 查看统计

- 顶部显示6个统计卡片
- 底部显示运行中的任务列表
- 数据每10秒自动更新

### 3. 权限区别

**普通用户登录**:
```
显示: "欢迎回来！"
统计: 只统计该用户自己创建的数据
```

**管理员登录**:
```
显示: "管理员视图 - 显示所有用户的统计数据"
统计: 统计系统中所有用户的数据总和
```

## 测试

### 后端API测试

```bash
# 获取dashboard统计
curl -X GET "http://localhost:8000/api/v1/dashboard/stats" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 前端测试

1. 登录系统
2. 查看Dashboard
3. 创建一些测试数据:
   - 添加issues
   - 添加nodes
   - 启动任务
4. 观察统计数据变化
5. 切换不同权限的用户查看差异

## 运行时间格式化

自动格式化任务运行时间:
- `5s` - 小于1分钟
- `2m 30s` - 小于1小时
- `1h 15m 30s` - 超过1小时

## 下一步优化

1. **图表可视化**
   - 添加echarts/recharts
   - 显示趋势图表
   - Issues处理速率

2. **更多统计维度**
   - 成功率统计
   - 平均处理时间
   - Node使用率

3. **实时更新**
   - WebSocket推送
   - 无需轮询

4. **时间范围筛选**
   - 今天/本周/本月
   - 自定义时间范围

## 注意事项

1. **性能优化**: 对于大数据量,考虑添加缓存
2. **数据一致性**: 使用事务确保统计准确
3. **权限验证**: 前后端都要验证权限

## 总结

✅ 后端API实现完成
✅ 前端UI实现完成
✅ 权限区分完成
✅ 自动刷新完成
✅ 运行时间格式化完成

Dashboard现在可以完整展示系统运行状态!
