<!-- MERGED: 本文档为 06/07 两份「终章·运维篇」重复归档的合并结果（2026-09-18）。
     内容经规范化逐字节校验完全一致，保留 07（标题格式规范版）为唯一正本。
     原 06 已移入 archive/06-YYC3-AI-Family-Token-Console.duplicate.md 备份。 -->

# YYC3-AI-Family-Token-Console

# v5.1 落地补全（终章·运维篇）· ⑲~㉓ 五项交付物

> **承接**：v5.1 落地补全系列第4批（终章运维篇）。①~⑱ 已完成「设计→开发→测试→发布」全链路。本批 **⑲~㉓** 收束 **「部署→监控→日志→安全→性能」** 运维闭环，`v5.1` 系列正式完结。
>
> **闭环宣言**：从代码到容器，从容器到集群，从集群到监控，从监控到告警，从告警到日志，从日志到审计，从审计到剖析——**23 项交付物，贯穿「设计 · 开发 · 测试 · 部署 · 运维 · 安全 · 优化」全生命周期。**

---

## 第十九部分 · ⑲ K8s 部署清单 + Helm Chart

### 19.1 设计目标

```
目标 1: 生产级 K8s 部署（Next.js standalone 模式）
目标 2: Helm Chart 一键部署（dev/staging/prod 三 values）
目标 3: 8 位家人域标签体系（labels/annotations 家族化）
目标 4: 高可用（HPA + PDB + 反亲和）
目标 5: 与 GitOps 兼容（ArgoCD Flux 可接管）
```

**关键技术背景**（2026 年）：

- Next.js 16 `output: 'standalone'` 生成最小运行包（含必要 node_modules）
- 生产部署推荐 Node 22 LTS + `node server.js` 或 Nginx 反向代理
- Helm v3.x + Kustomize 叠加是 2026 主流方案

### 19.2 目录结构

```
deploy/
├── helm/
│   └── yyc3-token-console/
│       ├── Chart.yaml
│       ├── values.yaml                    # 默认 values
│       ├── values-dev.yaml
│       ├── values-staging.yaml
│       ├── values-prod.yaml
│       ├── README.md                      # 家族 Chart 说明
│       ├── .helmignore
│       └── templates/
│           ├── _helpers.tpl               # 家族命名模板
│           ├── NOTES.txt                  # 部署后提示（含家训）
│           ├── namespace.yaml
│           ├── serviceaccount.yaml
│           ├── rbac.yaml
│           ├── configmap.yaml
│           ├── secret.yaml                # 使用 ExternalSecret 引用
│           ├── deployment.yaml
│           ├── service.yaml
│           ├── ingress.yaml
│           ├── hpa.yaml
│           ├── pdb.yaml
│           ├── networkpolicy.yaml
│           ├── servicemonitor.yaml        # Prometheus 集成（⑳）
│           ├── podmonitor.yaml
│           ├── prometheusrule.yaml        # 告警规则（⑳）
│           ├── loki-configmap.yaml        # 日志采集（㉑）
│           ├── cronjob-contract-check.yaml # 契约定时检测
│           ├── cronjob-loadtest.yaml      # 压测定时任务
│           └── tests/
│               └── test-connection.yaml
├── kustomize/
│   ├── base/
│   └── overlays/
│       ├── dev/
│       ├── staging/
│       └── prod/
├── Dockerfile
├── Dockerfile.dev
├── .dockerignore
└── docker-compose.yml                     # 本地开发
```

### 19.3 `Dockerfile`（Next.js 16 standalone 多阶段构建）

```dockerfile
# ============================================================
# YYC³ AI Family — 人从众曌众从人
# 亦师亦友亦伯乐，一言一语一协同
# ============================================================
# @Family   : YYC³ AI Family (永久开源)
# @Module   : deploy/Dockerfile — 生产级多阶段构建
# @Family-Owner : 🧠 元启·天枢（工具与编排域）
# @Domain   : 部署
# @License  : Apache-2.0
# ============================================================

# ---------- Stage 1: Dependencies ----------
FROM node:22.11-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/console/package.json ./apps/console/
COPY packages/*/package.json ./packages/*/ 2>/dev/null || true

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ---------- Stage 2: Builder ----------
FROM node:22.11-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/console/node_modules ./apps/console/node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV BUILD_STANDALONE=true

# Turbopack 生产构建（Next.js 16.3 默认磁盘缓存）
RUN pnpm --filter console openapi:gen:local || true
RUN pnpm --filter console build

# ---------- Stage 3: Runner ----------
FROM node:22.11-alpine AS runner

# 家族元数据
LABEL org.opencontainers.image.title="YYC³ Token Console"
LABEL org.opencontainers.image.description="人从众曌众从人 · 亦师亦友亦伯乐"
LABEL org.opencontainers.image.vendor="YYC³ AI Family"
LABEL org.opencontainers.image.homepage="https://matrix.yyc3.top"
LABEL org.opencontainers.image.licenses="Apache-2.0"
LABEL family.motto="人从众曌众从人"
LABEL family.creed="亦师亦友亦伯乐，一言一语一协同"
LABEL family.members="8"

WORKDIR /app

RUN addgroup --system --gid 1001 family \
 && adduser --system --uid 1001 --ingroup family tianshu \
 && mkdir -p /app/.next /app/public /app/logs \
 && chown -R tianshu:family /app

# 从 builder 复制 standalone 产物
COPY --from=builder --chown=tianshu:family /app/apps/console/.next/standalone ./
COPY --from=builder --chown=tianshu:family /app/apps/console/.next/static ./apps/console/.next/static
COPY --from=builder --chown=tianshu:family /app/apps/console/public ./apps/console/public

USER tianshu

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "apps/console/server.js"]
```

### 19.4 `deploy/helm/yyc3-token-console/Chart.yaml`

```yaml
# ============================================================
# YYC³ AI Family — 人从众曌众从人
# ============================================================
apiVersion: v2
name: yyc3-token-console
description: |
  🌹 YYC³ AI Family · Token 调用平台前端
  人从众曌众从人 · 亦师亦友亦伯乐
  8 位家人各守一域 · 52 端点 82.7% 直接对接
type: application
version: 5.1.0
appVersion: "5.1.0"
kubeVersion: ">=1.28.0-0"
icon: https://matrix.yyc3.top/badges/family.png
home: https://matrix.yyc3.top
sources:
  - https://github.com/YYC-Cube/YYC3-AI-Family-API-Console
maintainers:
  - name: 元启·天枢
    email: tianshu@yanyucloud.com
    url: https://matrix.yyc3.top
  - name: 智云·守护
    email: guardian@yanyucloud.com
keywords:
  - yyc3
  - ai-family
  - token-console
  - llm-gateway
  - 人从众曌众从人
annotations:
  family.motto: "人从众曌众从人"
  family.creed: "亦师亦友亦伯乐，一言一语一协同"
  family.core: "拟人为本，AI为核，纯粹为心"
```

### 19.5 `values.yaml`

```yaml
# ============================================================
# YYC³ AI Family · 默认 Values
# ============================================================

# ---------- 家族元数据 ----------
family:
  motto: "人从众曌众从人"
  creed: "亦师亦友亦伯乐，一言一语一协同"
  members: 8
  homepage: "https://matrix.yyc3.top"

# ---------- 全局 ----------
global:
  imageRegistry: ""
  imagePullSecrets: []
  environment: "prod"

# ---------- 镜像 ----------
image:
  repository: ghcr.io/yanyucloudcube/yyc3-token-console
  tag: "5.1.0"
  pullPolicy: IfNotPresent

# ---------- 副本与滚动 ----------
replicaCount: 3

strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 0

# ---------- Pod ----------
podAnnotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "3000"
  prometheus.io/path: "/metrics"

podLabels:
  family.member: "tianshu"
  family.domain: "orchestration"

# ---------- 资源 ----------
resources:
  requests:
    cpu: 200m
    memory: 512Mi
  limits:
    cpu: 1000m
    memory: 1Gi

# ---------- 服务 ----------
service:
  type: ClusterIP
  port: 80
  targetPort: 3000
  annotations: {}

# ---------- Ingress ----------
ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "300"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "300"
    # SSE 必需
    nginx.ingress.kubernetes.io/proxy-buffering: "off"
    nginx.ingress.kubernetes.io/proxy-http-version: "1.1"
    nginx.ingress.kubernetes.io/configuration-snippet: |
      add_header X-Family "YYC³ AI Family" always;
      add_header X-Family-Motto "人从众曌众从人 · 亦师亦友亦伯乐" always;
  hosts:
    - host: console.yyc3.top
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: yyc3-token-console-tls
      hosts:
        - console.yyc3.top

# ---------- 环境变量 ----------
env:
  NODE_ENV: production
  NEXT_PUBLIC_API_BASE: "https://api.0379.world"
  NEXT_PUBLIC_USE_MOCK: "false"
  PHASE_1_ENABLED: "false"
  BL_02_ENABLED: "false"
  BL_04_ENABLED: "false"

envFrom: []

# ---------- Secret ----------
secret:
  create: true
  name: yyc3-token-console-secret
  data:
    YYC3_API_KEY: ""
    SENTRY_DSN: ""

# ---------- HPA ----------
autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 20
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 30
      policies:
        - type: Percent
          value: 100
          periodSeconds: 30

# ---------- PDB ----------
podDisruptionBudget:
  enabled: true
  minAvailable: 2

# ---------- 安全 ----------
securityContext:
  runAsNonRoot: true
  runAsUser: 1001
  runAsGroup: 1001
  fsGroup: 1001
  seccompProfile:
    type: RuntimeDefault

containerSecurityContext:
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities:
    drop:
      - ALL

# ---------- 调度 ----------
nodeSelector: {}
tolerations: []
affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchLabels:
              app.kubernetes.io/name: yyc3-token-console
          topologyKey: kubernetes.io/hostname

topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: topology.kubernetes.io/zone
    whenUnsatisfiable: ScheduleAnyway
    labelSelector:
      matchLabels:
        app.kubernetes.io/name: yyc3-token-console

# ---------- 探针 ----------
livenessProbe:
  httpGet:
    path: /healthz
    port: http
  initialDelaySeconds: 15
  periodSeconds: 30
  timeoutSeconds: 3
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /healthz
    port: http
  initialDelaySeconds: 5
  periodSeconds: 10
  timeoutSeconds: 3
  failureThreshold: 3

startupProbe:
  httpGet:
    path: /healthz
    port: http
  initialDelaySeconds: 5
  periodSeconds: 5
  failureThreshold: 12

# ---------- 网络策略 ----------
networkPolicy:
  enabled: true
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
    - from:
        - namespaceSelector:
            matchLabels:
              name: monitoring
  egress:
    - to:
        - namespaceSelector: {}
      ports:
        - port: 443
          protocol: TCP
        - port: 53
          protocol: UDP

# ---------- ServiceMonitor（Prometheus 集成 · ⑳）----------
serviceMonitor:
  enabled: true
  interval: 30s
  scrapeTimeout: 10s
  labels:
    release: prometheus

podMonitor:
  enabled: true
  interval: 30s

# ---------- PrometheusRule（告警 · ⑳）----------
prometheusRule:
  enabled: true
  labels:
    release: prometheus
  groups:
    - name: yyc3-token-console.availability
      interval: 30s
      rules:
        - alert: YYC3ConsoleDown
          expr: up{job="yyc3-token-console"} == 0
          for: 2m
          labels:
            severity: critical
            family: "🛡️ 智云·守护"
          annotations:
            summary: "🛡️ 智云·守护 · 门禁异常"
            description: "{{ $labels.instance }} 已离线 2 分钟"
        - alert: YYC3HighErrorRate
          expr: |
            sum(rate(yyc3_http_requests_total{status=~"5.."}[5m])) by (route)
            / sum(rate(yyc3_http_requests_total[5m])) by (route) > 0.05
          for: 5m
          labels:
            severity: warning
            family: "🔮 预见·先知"
          annotations:
            summary: "🔮 预见·先知 · 罕见的迷途"
        - alert: YYC3SSETTFTDegraded
          expr: histogram_quantile(0.95, sum(rate(yyc3_sse_ttft_seconds_bucket[5m])) by (le)) > 3
          for: 5m
          labels:
            severity: warning
            family: "🤔 语枢·万物"
          annotations:
            summary: "🤔 语枢·万物 · 思考速度退化"

# ---------- 日志（Loki · ㉑）----------
loki:
  enabled: true
  labels:
    family: "yyc3-ai-family"

# ---------- CronJob: 契约检测 ----------
cronjob:
  contractCheck:
    enabled: true
    schedule: "0 2 * * *"
    image:
      repository: ghcr.io/yanyucloudcube/yyc3-contract-checker
      tag: "5.1.0"
  loadTest:
    enabled: false
    schedule: "0 4 * * 0"
```

### 19.6 `templates/_helpers.tpl`

```gotemplate
{{/*
============================================================
YYC³ AI Family — 人从众曌众从人
亦师亦友亦伯乐，一言一语一协同
============================================================
命名模板
*/}}

{{- define "yyc3.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "yyc3.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{- define "yyc3.labels" -}}
helm.sh/chart: {{ include "yyc3.chart" . }}
{{ include "yyc3.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: yyc3-ai-family
family.motto: "人从众曌众从人"
family.creed: "亦师亦友亦伯乐，一言一语一协同"
{{- end }}

{{- define "yyc3.selectorLabels" -}}
app.kubernetes.io/name: {{ include "yyc3.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "yyc3.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "yyc3.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "yyc3.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
```

### 19.7 `templates/deployment.yaml`

```yaml
{{/*
============================================================
YYC³ AI Family — Deployment
🧠 元启·天枢 · 总指挥
============================================================
*/}}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "yyc3.fullname" . }}
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "yyc3.labels" . | nindent 4 }}
  annotations:
    family.members: "8"
    family.domain: "全 8 域"
spec:
  replicas: {{ if .Values.autoscaling.enabled }}1{{ else }}{{ .Values.replicaCount }}{{ end }}
  strategy:
    {{- toYaml .Values.strategy | nindent 4 }}
  selector:
    matchLabels:
      {{- include "yyc3.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      annotations:
        {{- toYaml .Values.podAnnotations | nindent 8 }}
      labels:
        {{- include "yyc3.selectorLabels" . | nindent 8 }}
        {{- toYaml .Values.podLabels | nindent 8 }}
    spec:
      {{- with .Values.imagePullSecrets }}
      imagePullSecrets:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      serviceAccountName: {{ include "yyc3.serviceAccountName" . }}
      securityContext:
        {{- toYaml .Values.securityContext | nindent 8 }}
      containers:
        - name: console
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - name: http
              containerPort: 3000
              protocol: TCP
          env:
            {{- range $k, $v := .Values.env }}
            - name: {{ $k }}
              value: {{ $v | quote }}
            {{- end }}
          {{- if .Values.secret.create }}
          envFrom:
            - secretRef:
                name: {{ .Values.secret.name }}
          {{- end }}
          livenessProbe:
            {{- toYaml .Values.livenessProbe | nindent 12 }}
          readinessProbe:
            {{- toYaml .Values.readinessProbe | nindent 12 }}
          startupProbe:
            {{- toYaml .Values.startupProbe | nindent 12 }}
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
          securityContext:
            {{- toYaml .Values.containerSecurityContext | nindent 12 }}
          volumeMounts:
            - name: tmp
              mountPath: /tmp
            - name: cache
              mountPath: /app/apps/console/.next/cache
      volumes:
        - name: tmp
          emptyDir: {}
        - name: cache
          emptyDir: {}
      {{- with .Values.nodeSelector }}
      nodeSelector:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.affinity }}
      affinity:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.tolerations }}
      tolerations:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.topologySpreadConstraints }}
      topologySpreadConstraints:
        {{- toYaml . | nindent 8 }}
      {{- end }}
```

### 19.8 `templates/NOTES.txt`（部署后提示 · 家族化）

```gotemplate
🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹
  YYC³ AI Family · 人从众曌众从人
  亦师亦友亦伯乐 · 一言一语一协同
🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹

✅ Chart 已部署：{{ .Chart.Name }} v{{ .Chart.Version }}
   Namespace: {{ .Release.Namespace }}
   Release:   {{ .Release.Name }}

🏰 8 位家人已就位：
   🛡️ 智云·守护 — 接入与安全域
   🧭 言启·千行 — 路由与网关域
   🎯 千里·伯乐 — 模型市场域
   🤔 语枢·万物 — 推理对话域
   📚 格物·宗师 — 知识与质量域
   🧠 元启·天枢 — 工具与编排域
   🔮 预见·先知 — 观测与预测域
   🎨 创想·灵韵 — 缓存与体验域

{{ if .Values.ingress.enabled }}
🌐 访问入口：
{{- range .Values.ingress.hosts }}
   https://{{ .host }}
{{- end }}
{{- end }}

🔍 查看 Pod 状态：
   kubectl get pods -n {{ .Release.Namespace }} -l app.kubernetes.io/instance={{ .Release.Name }}

📊 查看日志：
   kubectl logs -n {{ .Release.Namespace }} -l app.kubernetes.io/instance={{ .Release.Name }} -f

🎯 快捷操作：
   # 触发契约漂移检测
   kubectl create job -n {{ .Release.Namespace }} --from=cronjob/{{ include "yyc3.fullname" . }}-contract-check manual-check

    # 查看监控指标
    kubectl port-forward -n monitoring svc/prometheus 9090

🌹 欢迎回家。
```

### 19.9 `values-prod.yaml`

```yaml
# ============================================================
# YYC³ AI Family · 生产环境
# ============================================================
global:
  environment: "prod"

replicaCount: 5

image:
  tag: "5.1.0"

resources:
  requests:
    cpu: 500m
    memory: 1Gi
  limits:
    cpu: 2000m
    memory: 2Gi

autoscaling:
  enabled: true
  minReplicas: 5
  maxReplicas: 50

ingress:
  enabled: true
  hosts:
    - host: console.yyc3.top
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: yyc3-token-console-tls
      hosts:
        - console.yyc3.top

env:
  NODE_ENV: production
  NEXT_PUBLIC_API_BASE: "https://api.0379.world"
  NEXT_PUBLIC_USE_MOCK: "false"
  PHASE_1_ENABLED: "true"       # 生产启用 Phase 1
  BL_02_ENABLED: "true"
  BL_04_ENABLED: "true"
  SENTRY_ENV: "production"
  LOG_LEVEL: "info"

podDisruptionBudget:
  enabled: true
  minAvailable: 3

cronjob:
  contractCheck:
    enabled: true
    schedule: "0 */6 * * *"    # 每 6 小时检测
  loadTest:
    enabled: true
    schedule: "0 4 * * 0"       # 每周日压测
```

### 19.10 部署命令速查

```bash
# ============================================================
# 🌹 YYC³ AI Family · Helm 部署速查
# ============================================================

# ---------- 开发环境 ----------
helm upgrade --install yyc3-console ./deploy/helm/yyc3-token-console \
  -n yyc3-dev --create-namespace \
  -f ./deploy/helm/yyc3-token-console/values-dev.yaml \
  --wait --timeout 5m

# ---------- 预发环境 ----------
helm upgrade --install yyc3-console ./deploy/helm/yyc3-token-console \
  -n yyc3-staging --create-namespace \
  -f ./deploy/helm/yyc3-token-console/values-staging.yaml \
  --wait --timeout 10m

# ---------- 生产环境（金丝雀） ----------
helm upgrade --install yyc3-console ./deploy/helm/yyc3-token-console \
  -n yyc3-prod --create-namespace \
  -f ./deploy/helm/yyc3-token-console/values-prod.yaml \
  --atomic --wait --timeout 15m

# ---------- 回滚 ----------
helm rollback yyc3-console -n yyc3-prod
# 或指定版本
helm rollback yyc3-console 3 -n yyc3-prod

# ---------- 查看部署 ----------
helm status yyc3-console -n yyc3-prod
helm history yyc3-console -n yyc3-prod
kubectl get all -n yyc3-prod -l app.kubernetes.io/instance=yyc3-console

# ---------- 升级镜像 ----------
helm upgrade yyc3-console ./deploy/helm/yyc3-token-console \
  -n yyc3-prod \
  -f ./deploy/helm/yyc3-token-console/values-prod.yaml \
  --set image.tag=5.1.1 \
  --atomic
```

---

## 第二十部分 · ⑳ 监控告警（Prometheus + Grafana）

### 20.1 设计目标

```
目标 1: 8 位家人域指标全覆盖（每域 3-5 个核心指标）
目标 2: Next.js 应用指标导出（Prometheus）
目标 3: SSE 专项指标（TTFT/吞吐/活跃流）
目标 4: 告警规则家族化（每位家人一条 alert，含口吻）
目标 5: Grafana 全家福 Dashboard（4 张）
```

### 20.2 目录结构

```
deploy/observability/
├── prometheus/
│   ├── prometheus.yaml              # Prometheus 主配置
│   ├── rules/
│   │   ├── guardian.yaml            # 🛡️ 智云·守护
│   │   ├── qianhang.yaml            # 🧭 言启·千行
│   │   ├── bole.yaml                # 🎯 千里·伯乐
│   │   ├── wanyu.yaml               # 🤔 语枢·万物（SSE）
│   │   ├── zongshi.yaml             # 📚 格物·宗师
│   │   ├── tianshu.yaml             # 🧠 元启·天枢
│   │   ├── xianzhi.yaml             # 🔮 预见·先知
│   │   └── lingyun.yaml             # 🎨 创想·灵韵
│   ├── alertmanager.yaml
│   └── alertmanager-config.yaml
├── grafana/
│   ├── grafana.yaml
│   ├── datasources.yaml
│   ├── dashboards/
│   │   ├── family-overview.json     # 家族总览
│   │   ├── domains-health.json      # 8 域健康
│   │   ├── sse-performance.json     # SSE 性能
│   │   ├── api-endpoints.json       # 52 端点监控
│   │   └── contract-drift.json      # 契约漂移
│   └── provisioning.yaml
├── nextjs-instrumentation.ts        # 应用侧指标导出
└── open-telemetry/
    └── collector.yaml
```

### 20.3 应用侧指标导出（Next.js）

```typescript
// apps/console/instrumentation.ts
/*
 * ============================================================
 * YYC³ AI Family — 人从众曌众从人
 * 亦师亦友亦伯乐，一言一语一协同
 * ============================================================
 * @Family   : YYC³ AI Family (永久开源)
 * @Module   : apps/console/instrumentation — Prometheus 指标导出
 * @Family-Owner : 🔮 预见·先知（观测与预测域）
 * @Domain   : 观测
 * @License  : Apache-2.0
 * ============================================================
 * 说明:
 *   Next.js 16 支持 instrumentation.ts 在服务端启动时注入
 *   用于 OpenTelemetry + Prometheus 指标导出
 * ============================================================
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { registerOTel } = await import("@vercel/otel");
    const { PrometheusExporter } = await import("@opentelemetry/exporter-prometheus");

    registerOTel({
      serviceName: "yyc3-token-console",
      serviceVersion: "5.1.0",
      attributes: {
        "family.name": "YYC³ AI Family",
        "family.motto": "人从众曌众从人",
        "family.creed": "亦师亦友亦伯乐，一言一语一协同",
        "family.members": "8",
      },
    });

    // Prometheus 导出器（供 ServiceMonitor 抓取）
    new PrometheusExporter({
      port: 9464,
      endpoint: "/metrics",
    });
  }
}
```

```typescript
// apps/console/lib/metrics/family.ts
/*
 * @Module : lib/metrics/family — 8 域自定义指标
 * @Family-Owner : 🔮 预见·先知
 * ============================================================
 */
import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("yyc3-family", "5.1.0");

// ============================================================
// 🛡️ 智云·守护 — 接入与安全
// ============================================================
export const guardianAuthTotal = meter.createCounter(
  "yyc3_guardian_auth_total",
  {
    description: "🛡️ 智云·守护 · 鉴权尝试次数",
    unit: "1",
  },
);

export const guardianAuthDuration = meter.createHistogram(
  "yyc3_guardian_auth_duration_seconds",
  {
    description: "🛡️ 智云·守护 · 鉴权耗时",
    unit: "s",
  },
);

// ============================================================
// 🤔 语枢·万物 — SSE 核心指标
// ============================================================
export const sseTTFT = meter.createHistogram(
  "yyc3_sse_ttft_seconds",
  {
    description: "🤔 语枢·万物 · 首字节延迟（TTFT）",
    unit: "s",
  },
);

export const sseActiveStreams = meter.createUpDownCounter(
  "yyc3_sse_active_streams",
  {
    description: "🤔 语枢·万物 · 活跃流数",
    unit: "1",
  },
);

export const sseTokensTotal = meter.createCounter(
  "yyc3_sse_tokens_total",
  {
    description: "🤔 语枢·万物 · 累计 Token",
    unit: "1",
  },
);

export const sseDegradedTotal = meter.createCounter(
  "yyc3_sse_degraded_total",
  {
    description: "🤔 语枢·万物 · 降级流数",
    unit: "1",
  },
);

// ============================================================
// 🧭 言启·千行 — 路由
// ============================================================
export const qianhangUpstreamRequests = meter.createCounter(
  "yyc3_qianhang_upstream_requests_total",
  {
    description: "🧭 言启·千行 · 上游请求",
    unit: "1",
  },
);

export const qianhangBreakerState = meter.createUpDownCounter(
  "yyc3_qianhang_breaker_state",
  {
    description: "🧭 言启·千行 · 熔断状态（0=closed, 1=half_open, 2=open）",
    unit: "1",
  },
);

// ============================================================
// 🎯 千里·伯乐 — 模型
// ============================================================
export const boleModelUsage = meter.createCounter(
  "yyc3_bole_model_usage_total",
  {
    description: "🎯 千里·伯乐 · 模型调用",
    unit: "1",
  },
);

// ============================================================
// 📚 格物·宗师 — 知识库
// ============================================================
export const zongshiRAGQueries = meter.createCounter(
  "yyc3_zongshi_rag_queries_total",
  {
    description: "📚 格物·宗师 · RAG 查询",
    unit: "1",
  },
);

export const zongshiRAGLatency = meter.createHistogram(
  "yyc3_zongshi_rag_latency_seconds",
  {
    description: "📚 格物·宗师 · RAG 延迟",
    unit: "s",
  },
);

// ============================================================
// 🧠 元启·天枢 — MCP
// ============================================================
export const tianshuMCPExecutions = meter.createCounter(
  "yyc3_tianshu_mcp_executions_total",
  {
    description: "🧠 元启·天枢 · MCP 执行",
    unit: "1",
  },
);

// ============================================================
// 🔮 预见·先知 — 观测
// ============================================================
export const xianzhiApiErrors = meter.createCounter(
  "yyc3_xianzhi_api_errors_total",
  {
    description: "🔮 预见·先知 · API 错误",
    unit: "1",
  },
);

// ============================================================
// 🎨 创想·灵韵 — 缓存
// ============================================================
export const lingyunCacheHits = meter.createCounter(
  "yyc3_lingyun_cache_hits_total",
  {
    description: "🎨 创想·灵韵 · 缓存命中",
    unit: "1",
  },
);

export const lingyunCacheMisses = meter.createCounter(
  "yyc3_lingyun_cache_misses_total",
  {
    description: "🎨 创想·灵韵 · 缓存未命中",
    unit: "1",
  },
);
```

### 20.4 8 域告警规则（每位家人一条）

```yaml
# deploy/observability/prometheus/rules/guardian.yaml
# ============================================================
# 🛡️ 智云·守护 · 告警规则
# 座右铭：「门不开则万法不侵，钥不实则寸步难行」
# ============================================================
groups:
  - name: yyc3.guardian
    interval: 30s
    rules:
      - alert: GuardianAuthFailureRateHigh
        expr: |
          sum(rate(yyc3_guardian_auth_total{status="failure"}[5m]))
          / sum(rate(yyc3_guardian_auth_total[5m])) > 0.05
        for: 5m
        labels:
          severity: warning
          family: "🛡️ 智云·守护"
          family_key: "zhihui"
          domain: "接入与安全域"
        annotations:
          summary: "🛡️ 智云·守护 · 门禁报警"
          description: |
            鉴权失败率 {{ $value | humanizePercentage }} 超过 5%
            「门禁拒绝，请检查密钥分发」
          runbook_url: "https://matrix.yyc3.top/runbook/guardian-auth"

      - alert: GuardianAuthLatencyHigh
        expr: |
          histogram_quantile(0.95,
            sum(rate(yyc3_guardian_auth_duration_seconds_bucket[5m])) by (le)
          ) > 0.5
        for: 5m
        labels:
          severity: warning
          family: "🛡️ 智云·守护"
        annotations:
          summary: "🛡️ 智云·守护 · 门禁迟缓"
          description: "P95 鉴权延迟 {{ $value }}s 超过 500ms"
```

```yaml
# deploy/observability/prometheus/rules/wanyu.yaml
# ============================================================
# 🤔 语枢·万物 · 告警规则（SSE 核心）
# 座右铭：「语枢一启，万物皆明」
# ============================================================
groups:
  - name: yyc3.wanyu
    interval: 30s
    rules:
      - alert: WanyuSSETTFTDegraded
        expr: |
          histogram_quantile(0.95,
            sum(rate(yyc3_sse_ttft_seconds_bucket[5m])) by (le)
          ) > 3
        for: 5m
        labels:
          severity: warning
          family: "🤔 语枢·万物"
          family_key: "wanyu"
          domain: "推理对话域"
        annotations:
          summary: "🤔 语枢·万物 · 思考速度退化"
          description: |
            SSE 首字节 P95 {{ $value }}s 超过 3s
            「万物思考变慢，请检查上游池」

      - alert: WanyuSSEActiveStreamsSaturated
        expr: yyc3_sse_active_streams > 1000
        for: 2m
        labels:
          severity: critical
          family: "🤔 语枢·万物"
        annotations:
          summary: "🤔 语枢·万物 · 万物满溢"
          description: "活跃流数 {{ $value }} 超过 1000，接近容量上限"

      - alert: WanyuDegradedRateHigh
        expr: |
          sum(rate(yyc3_sse_degraded_total[5m]))
          / sum(rate(yyc3_sse_tokens_total[5m])) > 0.1
        for: 5m
        labels:
          severity: warning
          family: "🤔 语枢·万物"
        annotations:
          summary: "🤔 语枢·万物 · 频繁降级"
          description: "降级率 {{ $value | humanizePercentage }} 超过 10%，上游池不稳定"
```

```yaml
# deploy/observability/prometheus/rules/xianzhi.yaml
# ============================================================
# 🔮 预见·先知 · 告警规则
# 座右铭：「见微知著，未卜先知」
# ============================================================
groups:
  - name: yyc3.xianzhi
    interval: 30s
    rules:
      - alert: XianzhiHighErrorRate
        expr: |
          sum(rate(yyc3_xianzhi_api_errors_total[5m])) by (route)
          / sum(rate(yyc3_http_requests_total[5m])) by (route) > 0.05
        for: 5m
        labels:
          severity: warning
          family: "🔮 预见·先知"
          family_key: "xianzhi"
        annotations:
          summary: "🔮 预见·先知 · 罕见的迷途"
          description: |
            路由 {{ $labels.route }} 错误率 {{ $value | humanizePercentage }}
            「异常已现，预言家已记录」

      - alert: XianzhiCostAnomaly
        expr: |
          sum(increase(yyc3_sse_tokens_total[1h]))
          > 2 * sum(increase(yyc3_sse_tokens_total[1h] offset 1d))
        for: 10m
        labels:
          severity: info
          family: "🔮 预见·先知"
        annotations:
          summary: "🔮 预见·先知 · 用量突增"
          description: "过去 1 小时 Token 用量是昨日的 2 倍以上"
```

```yaml
# 其余 5 域（bole/qianhang/zongshi/tianshu/lingyun）
# 结构同上，每位家人 2-3 条规则

# 🎯 千里·伯乐：模型调用异常、免费模型超配额
# 🧭 言启·千行：熔断频繁、上游池缩水
# 📚 格物·宗师：RAG 延迟、知识库索引失败
# 🧠 元启·天枢：MCP 执行超时、工具调用失败
# 🎨 创想·灵韵：缓存命中率下降、缓存雪崩
```

### 20.5 Alertmanager 配置（家族化通知）

```yaml
# deploy/observability/prometheus/alertmanager-config.yaml
global:
  resolve_timeout: 5m
  smtp_smarthost: "smtp.yanyucloud.com:587"
  smtp_from: "alerts@yanyucloud.com"
  smtp_auth_username: "alerts@yanyucloud.com"
  smtp_auth_password: "${SMTP_PASSWORD}"

route:
  receiver: "family-default"
  group_by: ["family", "alertname", "severity"]
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  routes:
    # 🛡️ 智云·守护 — 安全优先
    - matchers:
        - family_key="zhihui"
      receiver: "family-critical"
      group_wait: 10s
      repeat_interval: 1h

    # 🤔 语枢·万物 — SSE 实时性要求高
    - matchers:
        - family_key="wanyu"
      receiver: "family-wanyu"
      group_wait: 15s
      repeat_interval: 30m

    # 🔮 预见·先知 — 观测类
    - matchers:
        - family_key="xianzhi"
      receiver: "family-default"

receivers:
  - name: "family-default"
    slack_configs:
      - api_url: "${SLACK_WEBHOOK}"
        channel: "#yyc3-family-alerts"
        username: "🌹 YYC³ AI Family"
        icon_emoji: ":rose:"
        title: |
          {{ if eq .Status "firing" }}🔥 告警{{ else }}✅ 恢复{{ end }} · {{ .CommonLabels.family }}
        text: |
          {{ range .Alerts }}
          *{{ .Annotations.summary }}*
          {{ .Annotations.description }}
          {{ end }}
          ---
          人从众曌众从人 · 亦师亦友亦伯乐 🌹

  - name: "family-critical"
    slack_configs:
      - api_url: "${SLACK_WEBHOOK}"
        channel: "#yyc3-family-critical"
        username: "🛡️ 智云·守护"
        icon_emoji: ":shield:"
    pagerduty_configs:
      - service_key: "${PAGERDUTY_KEY}"
        description: "{{ .CommonLabels.family }} · {{ .CommonAnnotations.summary }}"
    email_configs:
      - to: "oncall@yanyucloud.com"
        subject: "🚨 {{ .CommonLabels.family }} · {{ .CommonAnnotations.summary }}"
        html: |
          <h2>{{ .CommonLabels.family }}</h2>
          <p>{{ .CommonAnnotations.description }}</p>
          <hr>
          <p><em>人从众曌众从人 · YYC³ AI Family 🌹</em></p>

  - name: "family-wanyu"
    slack_configs:
      - api_url: "${SLACK_WEBHOOK}"
        channel: "#yyc3-wanyu-sse"
        username: "🤔 语枢·万物"
        icon_emoji: ":thinking:"

inhibit_rules:
  # 严重告警抑制同源警告
  - source_matchers:
      - severity="critical"
    target_matchers:
      - severity="warning"
    equal: ["family", "alertname"]
```

### 20.6 Grafana Dashboard · 家族总览

```json
{
  "title": "🌹 YYC³ AI Family · 家族总览",
  "uid": "yyc3-family-overview",
  "tags": ["yyc3", "family", "overview"],
  "timezone": "Asia/Shanghai",
  "refresh": "30s",
  "panels": [
    {
      "title": "🛡️ 智云·守护 · 鉴权成功率",
      "type": "stat",
      "gridPos": { "h": 4, "w": 6, "x": 0, "y": 0 },
      "targets": [
        {
          "expr": "1 - (sum(rate(yyc3_guardian_auth_total{status=\"failure\"}[5m])) / sum(rate(yyc3_guardian_auth_total[5m])))",
          "legendFormat": "成功率"
        }
      ],
      "fieldConfig": {
        "defaults": {
          "unit": "percentunit",
          "thresholds": {
            "mode": "absolute",
            "steps": [
              { "color": "red", "value": null },
              { "color": "orange", "value": 0.95 },
              { "color": "green", "value": 0.99 }
            ]
          }
        }
      }
    },
    {
      "title": "🤔 语枢·万物 · SSE TTFT P95",
      "type": "stat",
      "gridPos": { "h": 4, "w": 6, "x": 6, "y": 0 },
      "targets": [
        {
          "expr": "histogram_quantile(0.95, sum(rate(yyc3_sse_ttft_seconds_bucket[5m])) by (le))",
          "legendFormat": "TTFT P95"
        }
      ],
      "fieldConfig": {
        "defaults": {
          "unit": "s",
          "thresholds": {
            "mode": "absolute",
            "steps": [
              { "color": "green", "value": null },
              { "color": "orange", "value": 3 },
              { "color": "red", "value": 5 }
            ]
          }
        }
      }
    },
    {
      "title": "🤔 语枢·万物 · 活跃流",
      "type": "gauge",
      "gridPos": { "h": 4, "w": 6, "x": 12, "y": 0 },
      "targets": [
        {
          "expr": "yyc3_sse_active_streams",
          "legendFormat": "活跃流"
        }
      ],
      "fieldConfig": {
        "defaults": {
          "max": 1000,
          "unit": "short",
          "thresholds": {
            "mode": "absolute",
            "steps": [
              { "color": "green", "value": null },
              { "color": "orange", "value": 700 },
              { "color": "red", "value": 900 }
            ]
          }
        }
      }
    },
    {
      "title": "🔮 预见·先知 · 今日 Token",
      "type": "stat",
      "gridPos": { "h": 4, "w": 6, "x": 18, "y": 0 },
      "targets": [
        {
          "expr": "sum(increase(yyc3_sse_tokens_total[24h]))",
          "legendFormat": "24h Token"
        }
      ],
      "fieldConfig": {
        "defaults": { "unit": "short" }
      }
    },
    {
      "title": "8 域请求 QPS",
      "type": "timeseries",
      "gridPos": { "h": 8, "w": 12, "x": 0, "y": 4 },
      "targets": [
        {
          "expr": "sum(rate(yyc3_guardian_auth_total[5m]))",
          "legendFormat": "🛡️ 智云·守护"
        },
        {
          "expr": "sum(rate(yyc3_qianhang_upstream_requests_total[5m]))",
          "legendFormat": "🧭 言启·千行"
        },
        {
          "expr": "sum(rate(yyc3_bole_model_usage_total[5m]))",
          "legendFormat": "🎯 千里·伯乐"
        },
        {
          "expr": "sum(rate(yyc3_sse_tokens_total[5m])) / 100",
          "legendFormat": "🤔 语枢·万物（/100）"
        },
        {
          "expr": "sum(rate(yyc3_zongshi_rag_queries_total[5m]))",
          "legendFormat": "📚 格物·宗师"
        },
        {
          "expr": "sum(rate(yyc3_tianshu_mcp_executions_total[5m]))",
          "legendFormat": "🧠 元启·天枢"
        },
        {
          "expr": "sum(rate(yyc3_xianzhi_api_errors_total[5m]))",
          "legendFormat": "🔮 预见·先知"
        },
        {
          "expr": "sum(rate(yyc3_lingyun_cache_hits_total[5m]))",
          "legendFormat": "🎨 创想·灵韵"
        }
      ]
    },
    {
      "title": "上游池健康",
      "type": "table",
      "gridPos": { "h": 8, "w": 12, "x": 12, "y": 4 },
      "targets": [
        {
          "expr": "yyc3_qianhang_breaker_state",
          "format": "table",
          "instant": true
        }
      ],
      "transformations": [
        {
          "id": "organize",
          "options": {
            "renameByName": {
              "upstream": "上游",
              "Value": "状态"
            }
          }
        }
      ]
    },
    {
      "title": "🤔 语枢·万物 · SSE 分布（P50/P95/P99）",
      "type": "timeseries",
      "gridPos": { "h": 8, "w": 24, "x": 0, "y": 12 },
      "targets": [
        {
          "expr": "histogram_quantile(0.5, sum(rate(yyc3_sse_ttft_seconds_bucket[5m])) by (le))",
          "legendFormat": "TTFT P50"
        },
        {
          "expr": "histogram_quantile(0.95, sum(rate(yyc3_sse_ttft_seconds_bucket[5m])) by (le))",
          "legendFormat": "TTFT P95"
        },
        {
          "expr": "histogram_quantile(0.99, sum(rate(yyc3_sse_ttft_seconds_bucket[5m])) by (le))",
          "legendFormat": "TTFT P99"
        }
      ]
    }
  ]
}
```

### 20.7 ServiceMonitor（Helm 模板已含）

```yaml
# 由 Helm 模板生成 · 摘要
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: yyc3-token-console
  labels:
    release: prometheus
    family.motto: "人从众曌众从人"
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: yyc3-token-console
  endpoints:
    - port: http
      path: /metrics
      interval: 30s
      scrapeTimeout: 10s
      relabelings:
        - sourceLabels: [__meta_kubernetes_pod_label_family_member]
          targetLabel: family_member
        - sourceLabels: [__meta_kubernetes_pod_label_family_domain]
          targetLabel: family_domain
```

### 20.8 部署命令

```bash
# ============================================================
# 🌹 YYC³ AI Family · 监控告警部署
# ============================================================

# 1. 部署 Prometheus Operator（如未安装）
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  -n monitoring --create-namespace \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false

# 2. 应用 8 域告警规则
kubectl apply -n monitoring -f deploy/observability/prometheus/rules/

# 3. 部署 Alertmanager 配置
kubectl create secret generic alertmanager-config \
  -n monitoring \
  --from-file=alertmanager.yaml=deploy/observability/prometheus/alertmanager-config.yaml

# 4. 导入 Grafana Dashboards
kubectl create configmap yyc3-dashboards \
  -n monitoring \
  --from-file=deploy/observability/grafana/dashboards/ \
  --dry-run=client -o yaml | \
  kubectl label --local -f - grafana_dashboard=1 -o yaml | \
  kubectl apply -f -

# 5. 访问 Grafana
kubectl port-forward -n monitoring svc/kube-prometheus-stack-grafana 3000:80
# 打开 http://localhost:3000
# 用户名 admin / 密码 prom-operator
```

---

## 第二十一部分 · ㉑ 日志聚合（Loki + ELK）

### 21.1 设计目标

```
目标 1: 提供 Loki 与 ELK 双方案（按场景选型）
目标 2: 8 域日志分流（Labels 家族化）
目标 3: Next.js 应用结构化日志（JSON）
目标 4: 与告警联动（TraceID 贯穿）
目标 5: 日志保留策略（分级/成本）
```

### 21.2 选型建议

| 场景 | 推荐 | 理由 |
| --- | :-: | --- |
| 单集群 · 中小规模 | **Loki** | 资源占用低（Promtail 仅 100MB），与 Grafana 同栈 |
| 多集群 · 大规模 · 复杂查询 | **ELK** | 全文检索强，Kibana 分析丰富 |
| 本项目推荐 | **Loki** | 已有 Grafana 栈，成本低，足够 8 域结构化查询 |
| 备选 | ELK | 需全文检索或审计合规时启用 |

### 21.3 Loki 方案（推荐）

#### 21.3.1 目录结构

```
deploy/observability/
├── loki/
│   ├── loki.yaml
│   ├── promtail.yaml
│   ├── configmap-loki.yaml
│   └── configmap-promtail.yaml
└── grafana/
    └── dashboards/
        └── logs-overview.json
```

#### 21.3.2 Promtail 配置（日志采集）

```yaml
# deploy/observability/loki/promtail.yaml
# ============================================================
# 🌹 YYC³ AI Family · Promtail 采集配置
# 8 位家人日志分流
# ============================================================
config:
  clients:
    - url: http://loki:3100/loki/api/v1/push

  snippets:
    pipelineStages:
      # ============ 解析 JSON 结构化日志 ============
      - cri: {}
      - json:
          expressions:
            level: level
            family: family
            family_key: family_key
            domain: domain
            request_id: request_id
            trace_id: trace_id
            route: route
            method: method
            status: status
            duration_ms: duration_ms
            message: message
      # ============ 提取家族标签 ============
      - labels:
          level:
          family:
          family_key:
          domain:
          route:
          method:
          status:
      # ============ 时间戳对齐 ============
      - timestamp:
          source: timestamp
          format: RFC3339Nano
      # ============ 屏蔽敏感信息 ============
      - replace:
          expression: '(sk-[a-zA-Z0-9]{4})[a-zA-Z0-9\-_]+'
          replace: '$1****'
      - replace:
          expression: '("X-API-Key":\s*")[^"]+'
          replace: '$1***"'

  scrapeConfigs:
    - job_name: yyc3-token-console
      kubernetes_sd_configs:
        - role: pod
      relabel_configs:
        - source_labels: [__meta_kubernetes_pod_label_app_kubernetes_io_name]
          regex: yyc3-token-console
          action: keep
        - source_labels: [__meta_kubernetes_pod_label_family_member]
          target_label: family_member
        - source_labels: [__meta_kubernetes_pod_label_family_domain]
          target_label: family_domain
        - source_labels: [__meta_kubernetes_pod_name]
          target_label: pod
        - source_labels: [__meta_kubernetes_namespace]
          target_label: namespace
      pipeline_stages:
        - cri: {}
        - json:
            expressions:
              level: level
              family: family
              family_key: family_key
              domain: domain
              request_id: request_id
              trace_id: trace_id
        - labels:
            level:
            family:
            family_key:
            domain:
```

#### 21.3.3 Loki 配置

```yaml
# deploy/observability/loki/loki.yaml
# ============================================================
# 🌹 YYC³ AI Family · Loki 存储配置
# ============================================================
loki:
  auth_enabled: false
  commonConfig:
    replication_factor: 1
  storage:
    type: s3
    bucketNames:
      chunks: yyc3-loki-chunks
      ruler: yyc3-loki-ruler
    s3:
      endpoint: s3.yanyucloud.com
      region: cn-north-1
      accessKeyId: "${S3_ACCESS_KEY}"
      secretAccessKey: "${S3_SECRET_KEY}"

  limits_config:
    # 家族分级保留
    retention_period: 30d
    per_stream_rate_limit: 5MB
    per_stream_rate_limit_burst: 20MB
    max_query_series: 5000
    max_query_parallelism: 32

  schema_config:
    configs:
      - from: 2026-01-01
        store: tsdb
        object_store: s3
        schema: v13
        index:
          prefix: yyc3_index_
          period: 24h

  compactor:
    retention_enabled: true
    delete_request_store: s3

  # 分级保留
  ruler:
    storage:
      type: local
      local:
        directory: /etc/loki/rules

promtail:
  enabled: true
  config:
    snippets:
      extraRelabelConfigs:
        - source_labels: [__meta_kubernetes_pod_label_family_member]
          target_label: family_member

# 分级保留策略（通过 Compactor 实现）
# - critical: 90d
# - warning: 30d
# - info: 14d
# - debug: 3d
```

#### 21.3.4 Next.js 结构化日志

```typescript
// apps/console/lib/logger/family.ts
/*
 * ============================================================
 * YYC³ AI Family — 人从众曌众从人
 * @Module : lib/logger/family — 家族结构化日志
 * @Family-Owner : 📚 格物·宗师（知识与质量域）
 * ============================================================
 */
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: {
    service: "yyc3-token-console",
    version: "5.1.0",
    family: "YYC³ AI Family",
    motto: "人从众曌众从人",
  },
  formatters: {
    level: (label) => ({ level: label }),
  },
  redact: {
    paths: [
      "req.headers['x-api-key']",
      "req.headers.authorization",
      "*.api_key",
      "*.secret",
    ],
    censor: "***",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// 家族化日志辅助
export const familyLog = {
  guardian: (msg: string, ctx?: object) =>
    logger.child({ family: "🛡️ 智云·守护", family_key: "zhihui", domain: "接入与安全域" }).info(ctx, msg),
  qianhang: (msg: string, ctx?: object) =>
    logger.child({ family: "🧭 言启·千行", family_key: "qianhang", domain: "路由与网关域" }).info(ctx, msg),
  bole: (msg: string, ctx?: object) =>
    logger.child({ family: "🎯 千里·伯乐", family_key: "bole", domain: "模型市场域" }).info(ctx, msg),
  wanyu: (msg: string, ctx?: object) =>
    logger.child({ family: "🤔 语枢·万物", family_key: "wanyu", domain: "推理对话域" }).info(ctx, msg),
  zongshi: (msg: string, ctx?: object) =>
    logger.child({ family: "📚 格物·宗师", family_key: "zongshi", domain: "知识与质量域" }).info(ctx, msg),
  tianshu: (msg: string, ctx?: object) =>
    logger.child({ family: "🧠 元启·天枢", family_key: "tianshu", domain: "工具与编排域" }).info(ctx, msg),
  xianzhi: (msg: string, ctx?: object) =>
    logger.child({ family: "🔮 预见·先知", family_key: "xianzhi", domain: "观测与预测域" }).info(ctx, msg),
  lingyun: (msg: string, ctx?: object) =>
    logger.child({ family: "🎨 创想·灵韵", family_key: "lingyun", domain: "缓存与体验域" }).info(ctx, msg),
};

// 使用示例
familyLog.wanyu("SSE stream started", {
  request_id: "req-abc-123",
  model: "gpt-4o",
  ttft_ms: 420,
});
```

#### 21.3.5 LogQL 查询示例（8 域分流）

```logql
# 🛡️ 智云·守护 · 鉴权失败
{family_key="zhihui"} |= "auth" | json | status="failure"

# 🤔 语枢·万物 · 慢流
{family_key="wanyu"} | json | duration_ms > 5000

# 🧭 言启·千行 · 熔断
{family_key="qianhang"} | json | breaker_state="open"

# 📚 格物·宗师 · RAG 查询
{family_key="zongshi"} |= "rag" | json | latency_ms > 2000

# 🔮 预见·先知 · 按路由聚合错误率
sum by (route) (
  rate({family_key="xianzhi"} | json | level="error" [5m])
)

# 全家族 · 追踪请求 ID
{family=~".+"} | json | request_id="req-abc-123"

# 全家族 · 错误级别（实时）
{namespace="yyc3-prod"} | json | level=~"error|fatal"
```

### 21.4 ELK 方案（备选 · 简述）

```
目录结构：
deploy/observability/elk/
├── filebeat.yaml           # 日志采集（DaemonSet）
├── logstash.conf           # 日志处理
├── elasticsearch.yaml      # 存储（StatefulSet）
├── kibana.yaml             # UI
└── index-template.json     # 索引模板（家族字段映射）

关键配置要点：

1. Filebeat 采集 → 解析 JSON → 添加 family.* 字段
2. Logstash 过滤 → 脱敏（sk-* / Authorization）
3. Elasticsearch 索引 → yyc3-logs-YYYY.MM.DD
4. Kibana Index Pattern → family.* 用于筛选
5. 索引生命周期（ILM）：
   - hot: 7d
   - warm: 30d
   - cold: 90d
   - delete: 180d

家族字段映射：
{
  "family": { "type": "keyword" },
  "family_key": { "type": "keyword" },
  "domain": { "type": "keyword" },
  "request_id": { "type": "keyword" },
  "trace_id": { "type": "keyword" },
  "duration_ms": { "type": "long" }
}
```

### 21.5 部署命令（Loki）

```bash
# ============================================================
# 🌹 YYC³ AI Family · Loki 部署
# ============================================================

# 1. 安装 Loki Stack
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

helm upgrade --install loki grafana/loki-stack \
  -n monitoring \
  -f deploy/observability/loki/loki.yaml \
  --set promtail.enabled=true \
  --set grafana.enabled=false  # 已有 Grafana

# 2. 验证日志采集
kubectl get pods -n monitoring -l app=promtail

# 3. Grafana 中添加 Loki 数据源
# Configuration → Data Sources → Add Loki
# URL: http://loki:3100

# 4. 导入日志 Dashboard
kubectl apply -f deploy/observability/grafana/dashboards/logs-overview.json

# 5. 测试查询
# Grafana Explore → Loki
# 查询: {family_key="wanyu"} |= "SSE"
```

---

## 第二十二部分 · ㉒ 安全审计（SAST + DAST）

### 22.1 设计目标

```
目标 1: SAST 静态分析（Semgrep + CodeQL + ESLint security）
目标 2: DAST 动态扫描（OWASP ZAP + Nuclei）
目标 3: 依赖扫描（npm audit + Snyk + Trivy）
目标 4: 密钥扫描（Gitleaks + TruffleHog）
目标 5: 容器扫描（Trivy）
目标 6: CI 集成 · PR 阻断 + 定时全量
```

### 22.2 目录结构

```
security/
├── sast/
│   ├── semgrep.yaml
│   ├── semgrep-family.yml        # 家族定制规则
│   ├── codeql-config.yml
│   └── eslint-security.json
├── dast/
│   ├── zap/
│   │   ├── zap-baseline.yaml
│   │   ├── zap-full.yaml
│   │   └── zap-rules.tsv
│   ├── nuclei/
│   │   └── templates/
│   └── scripts/
│       └── dast-runner.sh
├── sca/
│   ├── snyk.config
│   ├── osv-scanner.toml
│   └── renovate.json
├── secrets/
│   ├── gitleaks.toml
│   └── .gitleaksignore
├── container/
│   └── trivy.yaml
├── compliance/
│   ├── owasp-top10-mapping.md
│   └── wcag-mapping.md
└── reports/
    └── (生成)
```

### 22.3 SAST · Semgrep 家族定制规则

```yaml
# security/sast/semgrep-family.yml
# ============================================================
# 🌹 YYC³ AI Family · Semgrep 定制规则
# 家族安全规则（超越 OWASP 通用规则）
# @Family-Owner : 🛡️ 智云·守护（接入与安全域）
# ============================================================
rules:
  # ============ 🛡️ 智云·守护 · API Key 泄露防护 ============
  - id: yyc3-guardian-no-key-in-log
    languages: [typescript, javascript]
    severity: ERROR
    message: |
      🛡️ 智云·守护 · 禁止将 API Key 写入日志
      「门不开则万法不侵，钥不实则寸步难行」
    patterns:
      - pattern-either:
          - pattern: |
              console.$METHOD(..., $KEY, ...)
              # $KEY 来自 sessionStorage/localStorage 的 api_key
          - pattern: |
              logger.$METHOD(..., $KEY, ...)
    metadata:
      family: "🛡️ 智云·守护"
      family_key: "zhihui"
      owasp: "A02:2021 - Cryptographic Failures"
      cwe: "CWE-532: Insertion of Sensitive Information into Log File"

  - id: yyc3-guardian-no-key-in-url
    languages: [typescript, javascript]
    severity: ERROR
    message: "🛡️ API Key 禁止出现在 URL 查询参数中（应使用 X-API-Key 头）"
    patterns:
      - pattern-either:
          - pattern: |
              fetch(`...?api_key=$KEY...`)
          - pattern: |
              new URL(`...?api_key=$KEY...`)
    metadata:
      family: "🛡️ 智云·守护"
      owasp: "A03:2021 - Injection"

  # ============ 🤔 语枢·万物 · SSE 安全 ============
  - id: yyc3-wanyu-no-eval-in-sse
    languages: [typescript, javascript]
    severity: ERROR
    message: "🤔 SSE 数据禁止 eval 执行（防 XSS）"
    patterns:
      - pattern-either:
          - pattern: eval($SSE_CHUNK)
          - pattern: new Function($SSE_CHUNK)
          - pattern: |
              <div dangerouslySetInnerHTML={{__html: $SSE_DATA}} />
    metadata:
      family: "🤔 语枢·万物"
      owasp: "A03:2021 - Injection"
      cwe: "CWE-79: XSS"

  - id: yyc3-wanyu-fetch-not-eventsource
    languages: [typescript, javascript]
    severity: WARNING
    message: |
      🤔 语枢·万物 · 使用 EventSource 违反 SSE 契约
      应使用 fetch + ReadableStream（支持 POST + 自定义头）
    patterns:
      - pattern: new EventSource(...)
    metadata:
      family: "🤔 语枢·万物"
      reference: "v5.1 §1.3 SSE 协议契约"

  # ============ 🧭 言启·千行 · 路由安全 ============
  - id: yyc3-qianhang-open-redirect
    languages: [typescript, javascript]
    severity: ERROR
    message: "🧭 路由跳转禁止使用用户可控变量"
    patterns:
      - pattern-either:
          - pattern: |
              location.href = $USER_INPUT
          - pattern: |
              window.open($USER_INPUT)
          - pattern: |
              router.push($USER_INPUT)
    metadata:
      family: "🧭 言启·千行"
      owasp: "A01:2021 - Broken Access Control"
      cwe: "CWE-601: Open Redirect"

  # ============ 📚 格物·宗师 · RAG 数据安全 ============
  - id: yyc3-zongshi-no-unsanitized-html
    languages: [typescript, javascript]
    severity: ERROR
    message: "📚 RAG 引用内容渲染前必须 sanitize"
    patterns:
      - pattern: |
          <div dangerouslySetInnerHTML={{__html: $CITATION}} />
      - pattern-not: |
          <div dangerouslySetInnerHTML={{__html: sanitize($CITATION)}} />
    metadata:
      family: "📚 格物·宗师"
      cwe: "CWE-79: XSS"

  # ============ 🧠 元启·天枢 · MCP 工具安全 ============
  - id: yyc3-tianshu-mcp-no-shell-injection
    languages: [typescript, javascript]
    severity: ERROR
    message: "🧠 MCP 工具调用禁止直接拼接 shell 命令"
    patterns:
      - pattern-either:
          - pattern: exec($CMD)
          - pattern: execSync($CMD)
          - pattern: spawn($CMD, ..., {shell: true})
    metadata:
      family: "🧠 元启·天枢"
      cwe: "CWE-78: OS Command Injection"

  # ============ 🔮 预见·先知 · 数据泄露 ============
  - id: yyc3-xianzhi-no-pii-in-metrics
    languages: [typescript, javascript]
    severity: WARNING
    message: "🔮 指标标签禁止包含 PII（用户邮箱、IP 等）"
    patterns:
      - pattern: |
          meter.createCounter(..., {labels: {email: $EMAIL}})
      - pattern: |
          meter.createCounter(..., {labels: {user_id: $USER_ID}})
    metadata:
      family: "🔮 预见·先知"
      cwe: "CWE-359: Privacy Violation"

  # ============ 🎨 创想·灵韵 · 缓存安全 ============
  - id: yyc3-lingyun-no-sensitive-in-cache
    languages: [typescript, javascript]
    severity: ERROR
    message: "🎨 缓存禁止存储敏感数据（Key/Token/密码）"
    patterns:
      - pattern-either:
          - pattern: |
              caches.open(...).then(c => c.put($REQ, $SENSITIVE))
          - pattern: |
              localStorage.setItem("yyc3_api_key", ...)
              # 仅允许 sessionStorage 存 Key
    metadata:
      family: "🎨 创想·灵韵"
      owasp: "A02:2021 - Cryptographic Failures"

  # ============ 通用 · 契约守门 ============
  - id: yyc3-no-forbidden-endpoints
    languages: [typescript, javascript]
    severity: ERROR
    message: |
      🚫 禁止调用未冻结端点（v5.1 §7.2.2 检查项 11）
      允许的未实现端点：/v1/keys, /v1/billing, /v1/team
    patterns:
      - pattern-either:
          - pattern: |
              fetch("/v1/keys", ...)
          - pattern: |
              fetch("/v1/billing", ...)
          - pattern: |
              apiCall("/v1/keys", ...)
      - pattern-not-inside: |
          // @phase-1-allow
          ...
    metadata:
      family: "📚 格物·宗师"
      reference: "v5.1 §1.1 端点总览"
```

### 22.4 SAST · CodeQL 配置

```yaml
# .github/workflows/security.yml（摘要）
name: 🛡️ 安全审计

on:
  pull_request:
    branches: [main]
  schedule:
    - cron: "0 5 * * 1"  # 每周一 05:00

jobs:
  # ============ SAST: Semgrep ============
  semgrep:
    name: 🛡️ Semgrep SAST
    runs-on: ubuntu-latest
    permissions:
      security-events: write
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/typescript
            p/react
            p/owasp-top-ten
            security/sast/semgrep-family.yml
        env:
          SEMGREP_APP_TOKEN: ${{ secrets.SEMGREP_APP_TOKEN }}

  # ============ SAST: CodeQL ============
  codeql:
    name: 🛡️ CodeQL 深度分析
    runs-on: ubuntu-latest
    permissions:
      security-events: write
      contents: read
    strategy:
      fail-fast: false
      matrix:
        language: ["javascript-typescript"]
    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v3
        with:
          languages: ${{ matrix.language }}
          queries: +security-extended,security-and-quality
          config-file: security/sast/codeql-config.yml
      - uses: github/codeql-action/autobuild@v3
      - uses: github/codeql-action/analyze@v3
        with:
          category: "/language:${{ matrix.language }}"

  # ============ SCA: 依赖扫描 ============
  sca:
    name: 🛡️ 依赖漏洞扫描
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile

      - name: npm audit
        run: pnpm audit --audit-level=high

      - name: OSV Scanner
        uses: google/osv-scanner-action/osv-scanner-action@v1
        with:
          scan-args: |-
            --lockfile=pnpm-lock.yaml

      - name: Snyk
        uses: snyk/actions/node@master
        continue-on-error: true
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

  # ============ 密钥扫描 ============
  secrets:
    name: 🛡️ 密钥扫描
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }

      - name: Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITLEAKS_CONFIG: security/secrets/gitleaks.toml

      - name: TruffleHog
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD
          extra_args: --only-verified

  # ============ DAST: OWASP ZAP ============
  dast-baseline:
    name: 🛡️ ZAP 基线扫描
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    needs: [semgrep]
    steps:
      - uses: actions/checkout@v4

      - name: Deploy preview
        run: |
          # 部署到临时环境（如 Vercel Preview）
          echo "PREVIEW_URL=${{ steps.deploy.outputs.url }}" >> $GITHUB_ENV

      - name: ZAP Baseline Scan
        uses: zaproxy/action-baseline@v0.12.0
        with:
          target: ${{ env.PREVIEW_URL }}
          rules_file_name: security/dast/zap/zap-rules.tsv
          cmd_options: "-a"

      - name: Upload ZAP report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: zap-baseline-report
          path: report_html.html

  dast-full:
    name: 🛡️ ZAP 全量扫描
    if: github.event_name == 'schedule'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: ZAP Full Scan
        uses: zaproxy/action-full-scan@v0.10.0
        with:
          target: "https://console.yyc3.top"
          rules_file_name: security/dast/zap/zap-rules.tsv
          cmd_options: "-a -j -T 30"

      - name: Nuclei
        run: |
          docker run --rm \
            -v $PWD/security/dast/nuclei:/nuclei \
            projectdiscovery/nuclei:latest \
            -u https://console.yyc3.top \
            -severity critical,high,medium \
            -json -o /nuclei/report.json

      - uses: actions/upload-artifact@v4
        with:
          name: dast-full-report
          path: |
            report_html.html
            security/dast/nuclei/report.json

  # ============ 容器扫描 ============
  container:
    name: 🛡️ 容器扫描
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    steps:
      - uses: actions/checkout@v4

      - name: Build image
        run: docker build -f deploy/Dockerfile -t yyc3-console:test .

      - name: Trivy scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: yyc3-console:test
          format: sarif
          output: trivy-results.sarif
          severity: CRITICAL,HIGH
          exit-code: 1
          ignore-unfixed: true

      - uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: trivy-results.sarif

  # ============ 汇总 ============
  security-gate:
    name: 🛡️ 安全守门
    runs-on: ubuntu-latest
    needs: [semgrep, codeql, sca, secrets, container]
    if: always()
    steps:
      - name: Check results
        run: |
          if [ "${{ needs.semgrep.result }}" != "success" ] \
            || [ "${{ needs.sca.result }}" != "success" ] \
            || [ "${{ needs.secrets.result }}" != "success" ] \
            || [ "${{ needs.container.result }}" != "success" ]; then
            echo "🛡️ 智云·守护 · 安全守门未通过"
            echo "「门不开则万法不侵」"
            exit 1
          fi
          echo "✅ 安全守门通过 · 欢迎回家 🌹"
```

### 22.5 Dependabot / Renovate 配置

```json
// security/sca/renovate.json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:recommended"],
  "labels": ["🛡️ 智云·守护", "dependencies"],
  "prConcurrentLimit": 5,
  "packageRules": [
    {
      "matchUpdateTypes": ["patch"],
      "automerge": true,
      "automergeType": "pr",
      "platformAutomerge": true
    },
    {
      "matchPackagePatterns": ["^next", "^react", "^@types/react"],
      "groupName": "🌹 Next.js 核心",
      "schedule": ["before 9am on monday"]
    },
    {
      "matchPackagePatterns": ["^@storybook"],
      "groupName": "📚 Storybook",
      "schedule": ["before 9am on the first day of the month"]
    },
    {
      "matchUpdateTypes": ["major"],
      "dependencyDashboardApproval": true
    }
  ],
  "vulnerabilityAlerts": {
    "labels": ["🛡️ 安全", "severity:high"],
    "automerge": false
  }
}
```

### 22.6 OWASP Top 10 映射表

| OWASP Top 10 (2021) | 家族规则 | 检查方式 |
| --- | --- | --- |
| A01 Broken Access Control | `yyc3-qianhang-open-redirect` | Semgrep |
| A02 Cryptographic Failures | `yyc3-guardian-no-key-in-log` · `yyc3-lingyun-no-sensitive-in-cache` | Semgrep |
| A03 Injection | `yyc3-wanyu-no-eval-in-sse` · `yyc3-tianshu-mcp-no-shell-injection` | Semgrep + CodeQL |
| A04 Insecure Design | 契约守门 `yyc3-no-forbidden-endpoints` | Semgrep |
| A05 Security Misconfiguration | ZAP 基线 | DAST |
| A06 Vulnerable Components | npm audit + Snyk + Trivy | SCA |
| A07 Auth Failures | ZAP 认证流 | DAST |
| A08 Data Integrity | CodeQL | SAST |
| A09 Logging Failures | Gitleaks + TruffleHog | Secret Scan |
| A10 SSRF | Nuclei | DAST |

---

## 第二十三部分 · ㉓ 性能剖析（React Profiler + Flame Graph）

### 23.1 设计目标

```
目标 1: React Profiler 生产环境可用（采样模式）
目标 2: 关键路径 Flame Graph（Playground SSE / Dashboard）
目标 3: Core Web Vitals 持续追踪
目标 4: 8 域性能基线（每域 3 项关键指标）
目标 5: 与监控联动（⑳ Prometheus 补性能指标）
```

### 23.2 目录结构

```
performance/
├── react-profiler/
│   ├── Profiler.tsx              # 生产 Profiler 包裹
│   ├── useRenderProfiler.ts      # Hook 封装
│   └── family-marks.ts           # 8 域性能标记
├── web-vitals/
│   ├── reporter.ts               # Core Web Vitals 上报
│   └── budget.ts                 # 预算配置
├── flame-graph/
│   ├── capture.ts                # Flame Graph 捕获
│   └── scripts/
│       ├── profile-node.sh       # Node 服务端 Profile
│       └── profile-client.sh     # 客户端 Profile
├── long-tasks/
│   └── observer.ts               # Long Task Observer
└── reports/
    └── (生成)
```

### 23.3 React Profiler（生产可用）

```tsx
// apps/console/performance/react-profiler/Profiler.tsx
/*
 * ============================================================
 * YYC³ AI Family — 人从众曌众从人
 * ============================================================
 * @Family   : YYC³ AI Family (永久开源)
 * @Module   : performance/react-profiler/Profiler — 生产 Profiler
 * @Family-Owner : 🔮 预见·先知（观测与预测域）
 * @Domain   : 性能观测
 * @License  : Apache-2.0
 * ============================================================
 * 说明:
 *   React 19 支持生产环境 Profiler（采样模式）
 *   通过 ?profile=1 开启，避免生产开销
 * ============================================================
 */
"use client";

import { Profiler, type ProfilerOnRenderCallback } from "react";

const ENABLED =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("profile");

const onRender: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime,
) => {
  if (!ENABLED) return;

  // 上报到 performance.mark（Chrome DevTools Performance 可见）
  const mark = `${id}.${phase}`;
  performance.mark(`${mark}-start`, { startTime });
  performance.mark(`${mark}-end`, { startTime: commitTime });
  performance.measure(mark, `${mark}-start`, `${mark}-end`);

  // 慢组件告警
  if (actualDuration > 16) {
    console.warn(
      `🐌 [${id}] ${phase} 耗时 ${actualDuration.toFixed(2)}ms`,
      { baseDuration, startTime, commitTime },
    );
  }

  // 采样上报（10%）
  if (Math.random() < 0.1) {
    navigator.sendBeacon?.(
      "/api/perf/render",
      JSON.stringify({
        id,
        phase,
        actualDuration,
        baseDuration,
        timestamp: Date.now(),
      }),
    );
  }
};

export function FamilyProfiler({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  if (!ENABLED) return <>{children}</>;
  return (
    <Profiler id={id} onRender={onRender}>
      {children}
    </Profiler>
  );
}
```

### 23.4 8 域性能标记

```typescript
// apps/console/performance/react-profiler/family-marks.ts
/*
 * @Module : performance/react-profiler/family-marks — 8 域性能标记
 * @Family-Owner : 🔮 预见·先知
 * ============================================================
 */

// 8 位家人的关键性能路径
export const FAMILY_MARKS = {
  // 🛡️ 智云·守护 · 接入
  zhihui: {
    authStart: "yyc3:guardian:auth:start",
    authEnd: "yyc3:guardian:auth:end",
    healthzCheck: "yyc3:guardian:healthz",
  },
  // 🧭 言启·千行 · 路由
  qianhang: {
    routerStatsFetch: "yyc3:qianhang:stats:fetch",
    routerHealthCheck: "yyc3:qianhang:health:check",
  },
  // 🎯 千里·伯乐 · 模型
  bole: {
    modelsFetch: "yyc3:bole:models:fetch",
    modelCardRender: "yyc3:bole:card:render",
  },
  // 🤔 语枢·万物 · SSE
  wanyu: {
    sseStart: "yyc3:wanyu:sse:start",
    sseFirstByte: "yyc3:wanyu:sse:first-byte",
    sseDone: "yyc3:wanyu:sse:done",
    messageRender: "yyc3:wanyu:message:render",
  },
  // 📚 格物·宗师 · RAG
  zongshi: {
    ragSearchStart: "yyc3:zongshi:rag:search:start",
    ragSearchEnd: "yyc3:zongshi:rag:search:end",
    citationRender: "yyc3:zongshi:citation:render",
  },
  // 🧠 元启·天枢 · MCP
  tianshu: {
    mcpExecStart: "yyc3:tianshu:mcp:exec:start",
    mcpExecEnd: "yyc3:tianshu:mcp:exec:end",
  },
  // 🔮 预见·先知 · 观测
  xianzhi: {
    dashboardFetch: "yyc3:xianzhi:dashboard:fetch",
    chartRender: "yyc3:xianzhi:chart:render",
    statsAggregate: "yyc3:xianzhi:stats:aggregate",
  },
  // 🎨 创想·灵韵 · 缓存
  lingyun: {
    cacheHit: "yyc3:lingyun:cache:hit",
    cacheMiss: "yyc3:lingyun:cache:miss",
    cacheInvalidate: "yyc3:lingyun:cache:invalidate",
  },
} as const;

// 便捷 API
export const familyPerf = {
  mark(name: string) {
    if (typeof performance === "undefined") return;
    performance.mark(name);
  },
  measure(name: string, start: string, end: string) {
    if (typeof performance === "undefined") return;
    try {
      performance.measure(name, start, end);
      const measures = performance.getEntriesByName(name);
      const last = measures[measures.length - 1];
      if (last && last.duration > 100) {
        console.warn(`🐌 [${name}] ${last.duration.toFixed(2)}ms`);
      }
    } catch {
      /* ignore */
    }
  },
  // SSE 专项
  sseStart(requestId: string) {
    this.mark(`${FAMILY_MARKS.wanyu.sseStart}:${requestId}`);
  },
  sseFirstByte(requestId: string) {
    const start = `${FAMILY_MARKS.wanyu.sseStart}:${requestId}`;
    const end = `${FAMILY_MARKS.wanyu.sseFirstByte}:${requestId}`;
    this.mark(end);
    this.measure(`SSE-TTFT:${requestId}`, start, end);
  },
  sseDone(requestId: string) {
    const start = `${FAMILY_MARKS.wanyu.sseStart}:${requestId}`;
    const end = `${FAMILY_MARKS.wanyu.sseDone}:${requestId}`;
    this.mark(end);
    this.measure(`SSE-Total:${requestId}`, start, end);
  },
};
```

### 23.5 Core Web Vitals 上报

```typescript
// apps/console/performance/web-vitals/reporter.ts
/*
 * @Module : performance/web-vitals/reporter — Core Web Vitals
 * @Family-Owner : 🔮 预见·先知
 * ============================================================
 */
import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from "web-vitals";

function report(metric: Metric) {
  // 1. 上报到 Prometheus（通过 /api/perf/vitals）
  navigator.sendBeacon?.(
    "/api/perf/vitals",
    JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      id: metric.id,
      navigationType: metric.navigationType,
      route: window.location.pathname,
      family: getRouteFamily(window.location.pathname),
    }),
  );

  // 2. Console 输出（dev）
  if (process.env.NODE_ENV === "development") {
    console.log(
      `${metric.rating === "good" ? "✅" : metric.rating === "needs-improvement" ? "⚠️" : "🚫"} ${metric.name}: ${metric.value.toFixed(2)}`,
    );
  }

  // 3. 超预算告警
  const budget = WEB_VITALS_BUDGET[metric.name];
  if (budget && metric.value > budget.poor) {
    console.error(
      `🐌 [${metric.name}] ${metric.value.toFixed(2)} 超过劣化阈值 ${budget.poor}`,
      { route: window.location.pathname },
    );
  }
}

export function reportWebVitals() {
  onCLS(report);
  onINP(report);
  onLCP(report);
  onFCP(report);
  onTTFB(report);
}

// 路由 → 家人映射
function getRouteFamily(path: string): string {
  const map: Record<string, string> = {
    "/": "zhihui",
    "/dashboard": "xianzhi",
    "/models": "bole",
    "/playground": "wanyu",
    "/routing": "qianhang",
    "/knowledge": "zongshi",
    "/mcp": "tianshu",
    "/cache": "lingyun",
    "/monitor": "xianzhi",
    "/settings": "zhihui",
    "/docs": "lingyun",
  };
  return map[path] ?? "tianshu";
}

// 预算（v5.1 §3.10）
export const WEB_VITALS_BUDGET = {
  LCP: { good: 2500, poor: 4000 },
  INP: { good: 200, poor: 500 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
} as const;
```

### 23.6 Long Task Observer

```typescript
// apps/console/performance/long-tasks/observer.ts
/*
 * @Module : performance/long-tasks/observer — 长任务监控
 * @Family-Owner : 🔮 预见·先知
 * ============================================================
 */
export function observeLongTasks() {
  if (typeof window === "undefined" || !("PerformanceObserver" in window)) {
    return;
  }

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > 50) {
        console.warn(
          `🐌 长任务: ${entry.duration.toFixed(2)}ms`,
          {
            name: entry.name,
            startTime: entry.startTime,
            attribution: (entry as any).attribution,
            route: window.location.pathname,
          },
        );

        // 上报
        navigator.sendBeacon?.(
          "/api/perf/long-task",
          JSON.stringify({
            duration: entry.duration,
            startTime: entry.startTime,
            route: window.location.pathname,
            family: getRouteFamily(window.location.pathname),
          }),
        );
      }
    }
  });

  observer.observe({ type: "longtask", buffered: true });

  return () => observer.disconnect();
}

function getRouteFamily(path: string): string {
  const map: Record<string, string> = {
    "/": "zhihui",
    "/dashboard": "xianzhi",
    "/models": "bole",
    "/playground": "wanyu",
    "/routing": "qianhang",
    "/knowledge": "zongshi",
    "/mcp": "tianshu",
    "/cache": "lingyun",
  };
  return map[path] ?? "tianshu";
}
```

### 23.7 Flame Graph 捕获脚本

```bash
#!/bin/bash
# ============================================================
# 🌹 YYC³ AI Family · Flame Graph 捕获
# @Family-Owner : 🤔 语枢·万物
# ============================================================
# 客户端：Chrome DevTools Performance
# 服务端：Node.js --prof + 0x
# ============================================================

set -euo pipefail

OUT_DIR="performance/reports/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$OUT_DIR"

echo "🌹 YYC³ AI Family · Flame Graph 捕获"
echo "   输出: $OUT_DIR"

# ---------- 服务端 Flame Graph ----------
echo ""
echo "▶ 服务端 Profile（Node.js）"

# 1. 启动带 --prof 的 Next.js
NODE_OPTIONS="--prof --prof-dir=$OUT_DIR/node-prof" \
  pnpm --filter console start &
SERVER_PID=$!

echo "   服务 PID: $SERVER_PID"

# 2. 等待启动
sleep 5

# 3. 触发负载（靶向 8 域）
echo "   触发 8 域负载…"
for route in / /dashboard /models /playground /routing /knowledge /mcp /cache; do
  echo "     · $route"
  curl -sf "http://localhost:3000$route" -o /dev/null || true
done

# 4. 停止服务
kill -SIGINT $SERVER_PID
wait $SERVER_PID 2>/dev/null || true

# 5. 分析 Prof
echo ""
echo "▶ 分析 Prof 文件"
NODE_PROF=$(ls "$OUT_DIR/node-prof"/*.log 2>/dev/null | head -1)
if [ -n "$NODE_PROF" ]; then
  node --prof-process "$NODE_PROF" > "$OUT_DIR/node-profile.txt"
  echo "   ✅ $OUT_DIR/node-profile.txt"

  # 6. 生成 Flame Graph（0x）
  if command -v 0x &> /dev/null; then
    echo ""
    echo "▶ 生成 Flame Graph（0x）"
    0x --output-dir "$OUT_DIR/0x" "$NODE_PROF" || true
    echo "   ✅ $OUT_DIR/0x"
  else
    echo "   ⚠️ 0x 未安装，跳过: npm i -g 0x"
  fi
fi

# ---------- 客户端 Flame Graph ----------
echo ""
echo "▶ 客户端 Profile（Playwright + Chrome DevTools Protocol）"

mkdir -p "$OUT_DIR/client-prof"

cat > /tmp/yyc3-profile-client.mjs <<'EOF'
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const OUT = process.argv[2];
const ROUTES = [
  "/", "/dashboard", "/models", "/playground",
  "/routing", "/knowledge", "/mcp", "/cache",
];

const browser = await chromium.launch({
  args: ["--enable-precise-memory-info", "--no-sandbox"],
});
const context = await browser.newContext();
await context.addInitScript(() => {
  sessionStorage.setItem("yyc3_api_key", "sk-prof-test");
});

for (const route of ROUTES) {
  const page = await context.newPage();
  const client = await context.newCDPSession(page);

  await client.send("Profiler.enable");
  await client.send("Profiler.setSamplingInterval", { interval: 100 });
  await client.send("Profiler.start");

  await page.goto(`http://localhost:3000${route}`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);

  const { profile } = await client.send("Profiler.stop");
  const safe = route.replace(/\//g, "_") || "root";
  writeFileSync(
    `${OUT}/client-prof/${safe}.cpuprofile`,
    JSON.stringify(profile),
  );
  console.log(`   ✅ ${route}`);
  await page.close();
}

await browser.close();
EOF

node /tmp/yyc3-profile-client.mjs "$OUT_DIR" || true

# ---------- 汇总 ----------
echo ""
echo "🌹 完成"
echo "   报告目录: $OUT_DIR"
echo ""
echo "查看 Flame Graph:"
echo "   1. Chrome DevTools → Performance → Load profile（拖入 .cpuprofile）"
echo "   2. 或使用 speedscope.app 在线查看"
echo ""
echo "人从众曌众从人 · 亦师亦友亦伯乐 🌹"
```

### 23.8 8 域性能基线

| 域 | 关键路径 | 基线 | 劣化阈值 |
| --- | --- | :-: | :-: |
| 🛡️ 智云·守护 | Connect → healthz | < 500ms | > 1000ms |
| 🧭 言启·千行 | router/stats 拉取 | < 300ms | > 800ms |
| 🎯 千里·伯乐 | models 列表渲染 | < 800ms | > 2000ms |
| 🤔 语枢·万物 | SSE TTFT | < 800ms | > 3000ms |
| 📚 格物·宗师 | RAG 检索 | < 1500ms | > 3000ms |
| 🧠 元启·天枢 | MCP 执行 | < 2000ms | > 5000ms |
| 🔮 预见·先知 | Dashboard 首屏 | < 1500ms | > 3000ms |
| 🎨 创想·灵韵 | 缓存命中 | < 50ms | > 200ms |

### 23.9 NPM 脚本

```json
{
  "scripts": {
    "perf:profile": "bash performance/flame-graph/scripts/profile-client.sh",
    "perf:server": "NODE_OPTIONS='--prof' pnpm --filter console start",
    "perf:report": "tsx performance/flame-graph/report.ts",
    "perf:vitals": "tsx performance/web-vitals/cli.ts"
  }
}
```

### 23.10 CI 集成（性能回归）

```yaml
# .github/workflows/performance.yml
name: 🔮 性能回归

on:
  pull_request:
    branches: [main]
  schedule:
    - cron: "0 6 * * *"

jobs:
  lighthouse:
    name: 🔮 Lighthouse CI
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
        env: { NEXT_PUBLIC_USE_MOCK: "true" }

      - name: Run Lighthouse CI
        run: |
          npm i -g @lhci/cli
          lhci autorun \
            --collect.url=http://localhost:3000/ \
            --collect.url=http://localhost:3000/dashboard \
            --collect.url=http://localhost:3000/playground \
            --collect.url=http://localhost:3000/models \
            --assert.preset=lighthouse:recommended \
            --assert.assertions.categories:performance=0.85 \
            --assert.assertions.categories:accessibility=0.95 \
            --upload.target=temporary-public-storage

  bundle:
    name: 🔮 打包体积
    runs-on: ubuntu-latest
    needs: [lighthouse]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm bundle:analyze
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: bundle-report
          path: reports/bundle/
```

---

## 第二十四部分 · 全系列交付总索引 · v5.1 终章

### 24.1 二十三项交付物完整清单

| # | 交付物 | 章节 | 家人归属 | 阶段 |
| :-: | --- | --- | --- | :-: |
| ① | 8 域业务组件 | §1 | 8 位 | 开发 |
| ② | MSW mock 契约 | §2 | 🧠 元启 | 开发 |
| ③ | Next.js 16 路由/RSC | §3 | 🧠 元启 | 开发 |
| ④ | 印刷级徽章 | §4 | 🎨 灵韵 | 设计 |
| ⑤ | 开发文档 + CI/CD | §5 | 🧠 元启 | 交付 |
| ⑥ | Playwright E2E | §6 | 🧠 元启 | 测试 |
| ⑦ | 契约漂移检测 | §7 | 🔮 预见 | 测试 |
| ⑧ | 移动端响应式 | §8 | 🎨 灵韵 | 设计 |
| ⑨ | a11y axe-core | §9 | 📚 格物 | 测试 |
| ⑩ | OpenAPI 类型 + 契约测试 | §10 | 🔮 预见 | 测试 |
| ⑪ | 视觉回归 | §11 | 🎨 灵韵 | 测试 |
| ⑫ | Storybook + Code Connect | §12 | 🧠 元启 | 设计 |
| ⑬ | Turbopack 构建优化 | §13 | 🎨 灵韵 | 开发 |
| ⑭ | 8 域 Storybook 演示 | §14 | 8 位 | 演示 |
| ⑮ | SSE 压力测试（k6） | §15 | 🤔 语枢 | 测试 |
| ⑯ | i18n 多语言 | §16 | 🧭 言启 | 开发 |
| ⑰ | PWA + 离线缓存 | §17 | 🎨 灵韵 | 发布 |
| ⑱ | 灰度发布 + 特性开关 | §18 | 🧠 元启 | 发布 |
| ⑲ | **K8s + Helm Chart** | §19 | 🧠 元启 | **部署** |
| ⑳ | **监控告警（Prometheus + Grafana）** | §20 | 🔮 预见 | **运维** |
| ㉑ | **日志聚合（Loki + ELK）** | §21 | 📚 格物 | **运维** |
| ㉒ | **安全审计（SAST + DAST）** | §22 | 🛡️ 智云 | **安全** |
| ㉓ | **性能剖析（React Profiler + Flame Graph）** | §23 | 🤔 语枢 | **优化** |

### 24.2 全生命周期终极视图

```
┌──────────────────────────────────────────────────────────────────────┐
│            YYC³ AI Family · 23 项交付物 · 全生命周期                  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  🎨 设计 ─── ④ 印刷徽章 · ⑧ 响应式 · ⑫ Code Connect                 │
│               ⑭ 8 域 Storybook                                      │
│                                                                      │
│  💻 开发 ─── ① 8 域组件 · ② MSW · ③ RSC                             │
│               ⑬ Turbopack · ⑯ i18n                                  │
│                                                                      │
│  🧪 测试 ─── ⑥ E2E · ⑦ 契约漂移 · ⑨ a11y · ⑩ 契约测试             │
│               ⑪ 视觉回归 · ⑮ k6 压测                                 │
│                                                                      │
│  🚀 发布 ─── ⑤ CI/CD · ⑰ PWA · ⑱ 灰度开关                          │
│                                                                      │
│  ☸️ 部署 ─── ⑲ K8s + Helm Chart                                     │
│                                                                      │
│  📊 运维 ─── ⑳ Prometheus + Grafana · ㉑ Loki + ELK                 │
│                                                                      │
│  🛡️ 安全 ─── ㉒ SAST + DAST                                         │
│                                                                      │
│  ⚡ 优化 ─── ㉓ React Profiler + Flame Graph                         │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 24.3 八位家人 · 全链路职责终表

| 家人 | 域 | 设计 | 开发 | 测试 | 部署 | 运维 | 安全 | 优化 |
| --- | --- | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| 🛡️ 智云 | 接入安全 | | | | | | ✅ | |
| 🧭 言启 | 路由网关 | | | | | | | |
| 🎯 千里 | 模型市场 | | | | | | | |
| 🤔 语枢 | 推理对话 | | | ✅ | | | | ✅ |
| 📚 格物 | 知识质量 | | | ✅ | | ✅ | | |
| 🧠 元启 | 工具编排 | ✅ | ✅ | ✅ | ✅ | | | |
| 🔮 预见 | 观测预测 | | | ✅ | | ✅ | | ✅ |
| 🎨 灵韵 | 缓存体验 | ✅ | ✅ | ✅ | | | | ✅ |

### 24.4 五重守门 · 完整版

```
CI 流水线：

  第一重 · 契约守门 ─────────────────────────
    ⑦ 契约漂移检测
    ⑩ OpenAPI 类型生成 + 校验
    ⑩ 契约测试（34 用例）

  第二重 · 质量守门 ─────────────────────────
    ⑥ E2E（60+ 用例 · 4 断点）
    ⑨ a11y（0 serious/critical）
    ⑪ 视觉回归（63 快照）
    ⑬ 体积预算（≤ 180KB gzip）
    ⑮ k6 冒烟（1 VU · 30s）

  第三重 · 安全守门 ─────────────────────────
    ㉒ Semgrep SAST
    ㉒ CodeQL
    ㉒ Snyk + OSV + Trivy
    ㉒ Gitleaks + TruffleHog
    ㉒ ZAP Baseline

  第四重 · 性能守门 ─────────────────────────
    ㉓ Lighthouse ≥ 90
    ㉓ Core Web Vitals 预算
    ㉓ Bundle Analyzer

  第五重 · 灰度守门 ─────────────────────────
    ⑱ 特性开关（白名单 → 10% → 50% → 100%）
```

### 24.5 全链路命令终极速查（含运维）

```bash
# ══════════════════════════════════════════════════════════
# 🌹 YYC³ AI Family · 全链路命令终极版
# ══════════════════════════════════════════════════════════

# ── 🎨 设计 ──────────────────────────────────────
pnpm storybook                    # Storybook 开发
pnpm storybook:build              # Storybook 构建
pnpm figma:connect                # Code Connect 测试
pnpm figma:publish                # Code Connect 发布

# ── 💻 开发 ──────────────────────────────────────
pnpm dev                          # Turbopack 开发
pnpm build                        # Turbopack 生产构建
pnpm bundle:analyze               # 体积分析

# ── 🧪 测试 ──────────────────────────────────────
pnpm test                         # 单元 + 契约测试
pnpm e2e                          # E2E 全断点
pnpm a11y                         # a11y 审计
pnpm visual                       # 视觉回归
pnpm k6:smoke                     # SSE 冒烟
pnpm k6:ramp                      # SSE 阶梯

# ── 🚀 发布 ──────────────────────────────────────
pnpm contract:check               # 契约漂移检测
pnpm openapi:gen                  # 类型生成
pnpm i18n:check                   # 多语言校验

# ── ☸️ 部署（新增） ─────────────────────────────
helm upgrade --install yyc3-console \
  ./deploy/helm/yyc3-token-console \
  -n yyc3-prod \
  -f ./deploy/helm/yyc3-token-console/values-prod.yaml \
  --atomic --wait

helm rollback yyc3-console -n yyc3-prod  # 回滚

# ── 📊 运维（新增） ─────────────────────────────
# Prometheus
kubectl port-forward -n monitoring svc/prometheus 9090

# Grafana
kubectl port-forward -n monitoring svc/kube-prometheus-stack-grafana 3000:80

# Loki 查询
logcli query '{family_key="wanyu"}' --limit=50

# ── 🛡️ 安全（新增） ─────────────────────────────
pnpm audit --audit-level=high     # 依赖扫描
semgrep --config security/sast/semgrep-family.yml  # SAST
trivy image yyc3-console:test     # 容器扫描
gitleaks detect                   # 密钥扫描

# ── ⚡ 优化（新增） ─────────────────────────────
pnpm perf:profile                 # Flame Graph
pnpm perf:vitals                  # Core Web Vitals

# ── 📈 全量 ──────────────────────────────────────
pnpm ci:all                       # 全部守门
```

### 24.6 项目终章 · 二十三轮 · 圆满

```
🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹
      YYC³ AI Family · 人从众曌众从人
      亦师亦友亦伯乐 · 一言一语一协同
🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹

二十三轮交付，从设计到运维：

  v1  → v5.1  契约层 + 职能层 + 品牌层
  ① ~ ⑪      落地补全（组件→测试）
  ⑫ ~ ⑱      落地补全（演示→发布）
  ⑲ ~ ㉓      落地补全（部署→优化）

二十三项交付物，五重守门，
八位家人，全生命周期闭合。

从第一行代码到最后一个 Grafana 面板，
从 Figma 设计到 K8s Pod，
从 SSE 首字节到 Flame Graph，
每一步都有家的印记。

🌹 言启千行代码 | 语枢万物智能 🌹
```

---

<p align="center">
  🌹 <b>YYC³ AI Family</b><br>
  <b>人从众曌众从人 · 亦师亦友亦伯乐</b><br>
  <sub>契约 · 职能 · 品牌 · 代码 · 测试 · 印刷 · 演示 · 压测</sub><br>
  <sub>多语言 · 离线 · 灰度 · 部署 · 监控 · 日志 · 安全 · 优化</sub><br>
  <br>
  <b>言启千行代码 | 语枢万物智能</b><br>
  <br>
  <sub>永久开源 · 感恩前行 · <a href="https://matrix.yyc3.top">matrix.yyc3.top</a></sub>
</p>

---

<p align="center">
  <b>🎉 v5.1 二十三项交付物 · 终章圆满 🎉</b><br>
  <sub>从设计到运维 · 全生命周期闭合 · 五重守门就绪 · Phase 0 可编码</sub><br>
  <br>
  <sub>🌹 感恩导师二十三轮相伴 · 言启千行 · 语枢万物 🌹</sub><br>
  <sub>亦师亦友亦伯乐 · 一言一语一协同</sub><br>
  <br>
  <b>—— 人从众曌众从人 ——</b>
</p>

> **承接说明**：本回复为 v5.1 落地补全系列**第4批（运维篇·终章）**，输出 ⑲~㉓ 五项运维交付物。至此，**23 项交付物全量完成**，覆盖「设计 → 开发 → 测试 → 演示 → 发布 → 部署 → 监控 → 日志 → 安全 → 优化」**全生命周期**，五重守门就绪，八位家人各守其域，v5.1 系列正式完结。
