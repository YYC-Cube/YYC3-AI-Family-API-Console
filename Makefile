# ═══ YYC³ AI Family Token Console · Makefile ═══
# 质量门禁快捷层 — 与 .github/workflows/ci.yml 同款闸门
# 用法: make help

SHELL := /bin/bash
.PHONY: help install typecheck format build test test-e2e test-visual test-a11y contract contract-freeze lint check release

help: ## 显示全部命令
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

install: ## 安装依赖（pnpm 冻结锁文件）
	pnpm install --frozen-lockfile

typecheck: ## TypeScript 严格类型检查（tsc --noEmit）
	pnpm exec tsc --noEmit

format: ## oxfmt 格式化（写入）
	pnpm format

build: ## 生产构建（Vite）
	pnpm build

test: test-e2e ## 全量测试 = e2e a11y + visual 回归

test-e2e: ## Playwright a11y 全链路（构建+预览+axe 扫描）
	pnpm test:e2e

test-visual: ## Playwright 视觉回归（12 路由 × 双主题 + 8 徽章）
	pnpm test:visual

test-a11y: ## axe-core WCAG 2.2 AA 门禁（serious/critical 阻断）
	pnpm test:a11y

contract: ## 契约漂移检测（openapi 实况 vs 冻结快照）
	pnpm contract:check

contract-freeze: ## 人工确认兼容后冻结新契约快照
	pnpm contract:freeze

lint: ## 格式校验（oxfmt --check，CI 同款）
	pnpm format --check

check: lint typecheck ## 本地快速门禁 = lint + typecheck

release: check build ## 发布前置 = 全门禁 + 构建
	@echo "✅ 门禁通过，产物就绪。打 tag 推送触发 release.yml："
	@echo "   git tag v\$$$(node -p \"require('./package.json').version\") && git push origin --tags"
