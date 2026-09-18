<!-- 标题格式 Title: <type>(<scope>): <subject>  e.g. feat(qianxing): add weighted fallback routing -->

## 📌 变更类型 | Type of Change
<!-- 必选一个类型标签 + 模块标签 Pick one type label + module label(s) -->

- [ ] `feature` 新功能 New feature
- [ ] `enhancement` 功能增强 Enhancement
- [ ] `bug` 缺陷修复 Bug fix
- [ ] `documentation` 文档 Documentation
- [ ] `performance` 性能 Performance
- [ ] `security` 安全 Security
- [ ] `ci` 流水线 Pipeline
- [ ] `breaking-change` 破坏性变更 Breaking change

## 🎯 目标模块 | Module(s)
<!-- e.g. mod:tianshu / mod:contract / mod:infra -->

## 📝 变更说明 | Description
<!-- 中文在上，英文在下 Chinese first, English second -->

**中文**: 

**English**: 

## 🔗 关联 Issue | Related Issues
<!-- e.g. Closes #123 -->

## ✅ 自检清单 | Checklist

- [ ] 基于最新 `develop`（或 `main`）分支 Based on latest branch
- [ ] 提交符合 Conventional Commits Commit messages follow Conventional Commits
- [ ] `make check` 本地通过（lint + typecheck）Local gates pass
- [ ] `pnpm test:e2e` a11y 门禁通过（serious/critical = 0）A11y gate pass
- [ ] UI 变更已更新视觉基线并审阅 diff Visual baselines updated & reviewed（如涉及）
- [ ] API 变更已执行 `pnpm contract:freeze` 并复核影响面 Contract snapshot frozen（如涉及）
- [ ] 已按标签规范打标签 Labels applied per policy
- [ ] 文档同步更新（如涉及）Docs updated if applicable
- [ ] 无硬编码密钥（gitleaks 闸也会拦截）No hardcoded secrets

## ⚠️ 破坏性变更 | Breaking Changes（如无请删除本节 Remove if none）

**迁移说明 | Migration notes**:

## 📸 截图/示例 | Screenshots / Examples（可选 Optional）
