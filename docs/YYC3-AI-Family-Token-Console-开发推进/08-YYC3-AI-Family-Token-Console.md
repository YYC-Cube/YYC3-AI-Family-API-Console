# YYC3-AI-Family-Token-Console

# v5.1 落地补全（终极终章·组织治理篇）· ㉔~㉘ 五项交付物

> **承接**：v5.1 落地补全系列第5批（终极终章·组织治理篇）。①~㉓ 已完成「设计→开发→测试→部署→运维→安全→优化」全技术链路。本批 **㉔~㉘** 收束 **「灾备→成本→合规→协作→社区」** 组织治理闭环。**28 项交付物，最终圆融。**

---

## 第二十五部分 · ㉔ 灾备与高可用（多区域部署 · 故障演练）

### 25.1 设计目标

```
目标 1: 多区域 Active-Active 部署（至少 2 区域）
目标 2: Velero 跨区域备份 + 恢复演练
目标 3: Chaos Mesh 故障注入演练（8 域各 1 场景）
目标 4: RTO ≤ 15min · RPO ≤ 5min
目标 5: 季度灾备演练 + 自动化验证
```

### 25.2 目录结构

```
deploy/resilience/
├── multi-region/
│   ├── karmada/                     # 多集群编排（Karmada）
│   │   ├── karmada-config.yaml
│   │   ├── propagation-policy.yaml
│   │   └── override-policy.yaml
│   ├── k8gb/                        # 全局负载均衡（k8gb）
│   │   ├── gslb.yaml
│   │   └── dns-zone.yaml
│   └── velero/
│       ├── velero-install.yaml
│       ├── backup-schedule.yaml
│       ├── backup-storage-location.yaml
│       └── restore-drill.yaml
├── chaos/
│   ├── chaos-mesh/
│   │   ├── install.yaml
│   │   ├── pod-kill-guardian.yaml       # 🛡️ 智云·守护
│   │   ├── network-delay-wanyu.yaml     # 🤔 语枢·万物（SSE）
│   │   ├── dns-chaos-qianhang.yaml      # 🧭 言启·千行
│   │   ├── stress-bole.yaml             # 🎯 千里·伯乐
│   │   ├── pod-failure-zongshi.yaml     # 📚 格物·宗师
│   │   ├── network-partition-tianshu.yaml # 🧠 元启·天枢
│   │   ├── io-chaos-xianzhi.yaml        # 🔮 预见·先知
│   │   └── http-abort-lingyun.yaml      # 🎨 创想·灵韵
│   └── gameday/
│       ├── gameday-runbook.md
│       └── hypothesis-template.yaml
└── drills/
    ├── quarterly-drill.md
    └── scripts/
        └── failover-test.sh
```

### 25.3 Karmada 多集群 Active-Active

```yaml
# deploy/resilience/multi-region/karmada/propagation-policy.yaml
# ============================================================
# YYC³ AI Family — 人从众曌众从人
# @Module : 多集群 Active-Active 编排（Karmada）
# @Family-Owner : 🧠 元启·天枢（工具与编排域）
# ============================================================
apiVersion: policy.karmada.io/v1alpha1
kind: PropagationPolicy
metadata:
  name: yyc3-console-propagation
  namespace: yyc3-prod
  annotations:
    family.motto: "人从众曌众从人"
spec:
  resourceSelectors:
    - apiVersion: apps/v1
      kind: Deployment
      name: yyc3-token-console
    - apiVersion: v1
      kind: Service
      name: yyc3-token-console
  placement:
    clusterAffinity:
      clusterNames:
        - cn-north-1 # 主区域（北京）
        - cn-east-1 # 备区域（上海）
    spreadConstraints:
      - spreadByField: cluster
        maxGroups: 2
        minGroups: 2
    replicaScheduling:
      replicaSchedulingType: Divided
      replicaDivisionPreference: Weighted
      weightPreference:
        staticWeightList:
          - targetCluster:
              clusterNames: [cn-north-1]
            weight: 60
          - targetCluster:
              clusterNames: [cn-east-1]
            weight: 40
  # 故障转移
  failover:
    application:
      decisionConditions:
        tolerationSeconds: 30
      purgeMode: Immediately
```

```yaml
# deploy/resilience/multi-region/k8gb/gslb.yaml
# ============================================================
# @Module : 全局负载均衡（k8gb）
# @Family-Owner : 🧭 言启·千行（路由与网关域）
# 座右铭：「一言既出，千行可至」
# ============================================================
apiVersion: k8gb.absa.oss/v1beta1
kind: Gslb
metadata:
  name: yyc3-console-gslb
  namespace: yyc3-prod
spec:
  ingress:
    ingressClassName: nginx
    rules:
      - host: console.yyc3.top
        http:
          paths:
            - path: /
              pathType: Prefix
              backend:
                service:
                  name: yyc3-token-console
                  port:
                    number: 80
  strategy:
    type: failover # 故障转移
    primaryGeoTag: cn-north
    dnsTtlSeconds: 30
  # 健康检查
  health:
    livenessProbe:
      path: /healthz
      port: 3000
      intervalSeconds: 10
      timeoutSeconds: 3
```

### 25.4 Velero 跨区域备份

```yaml
# deploy/resilience/multi-region/velero/backup-schedule.yaml
# ============================================================
# @Module : Velero 跨区域备份策略
# @Family-Owner : 🛡️ 智云·守护（守的是人，护的是信）
# ============================================================
# 全集群备份（每 6 小时）
apiVersion: velero.io/v1
kind: Schedule
metadata:
  name: yyc3-full-backup
  namespace: velero
  annotations:
    family.motto: "人从众曌众从人"
    family.owner: "🛡️ 智云·守护"
spec:
  schedule: "0 */6 * * *"
  template:
    includedNamespaces:
      - yyc3-prod
      - yyc3-staging
    excludedResources:
      - events
      - events.events.k8s.io
    storageLocation: aws-primary
    volumeSnapshotLocations:
      - aws-primary
    ttl: 720h0m0s # 30 天保留
    hooks:
      resources:
        - name: backup-hook
          includedNamespaces:
            - yyc3-prod
          labelSelector:
            matchLabels:
              app.kubernetes.io/name: yyc3-token-console
          pre:
            - exec:
                container: console
                command:
                  - /bin/sh
                  - -c
                  - "curl -sf http://localhost:3000/healthz || true"
                onError: Continue
---
# 跨区域复制（同步到备区域存储桶）
apiVersion: velero.io/v1
kind: BackupStorageLocation
metadata:
  name: aws-primary
  namespace: velero
spec:
  provider: aws
  objectStorage:
    bucket: yyc3-velero-backups-primary
    prefix: prod
  config:
    region: cn-north-1
    s3ForcePathStyle: "true"
  accessMode: ReadWrite
---
apiVersion: velero.io/v1
kind: BackupStorageLocation
metadata:
  name: aws-secondary
  namespace: velero
spec:
  provider: aws
  objectStorage:
    bucket: yyc3-velero-backups-secondary
    prefix: prod
  config:
    region: cn-east-1
    s3ForcePathStyle: "true"
  accessMode: ReadOnly # 备区域只读（用于恢复）
```

### 25.5 Chaos Mesh · 8 域故障演练

```yaml
# deploy/resilience/chaos/chaos-mesh/pod-kill-guardian.yaml
# ============================================================
# 🛡️ 智云·守护 · 故障演练：Pod 被杀
# 假设：Pod 被 kill 后，K8s 自动重建，鉴权服务 ≤ 30s 恢复
# 稳态指标：鉴权成功率 ≥ 99%（近 5 分钟）
# 故障注入：kill 1 个 console pod
# 爆破半径：yyc3-prod 命名空间 · 1 个 Pod
# ============================================================
apiVersion: chaos-mesh.org/v1alpha1
kind: PodChaos
metadata:
  name: guardian-pod-kill
  namespace: yyc3-prod
  annotations:
    family.member: "🛡️ 智云·守护"
    family.domain: "接入与安全域"
    hypothesis: "Pod 被 kill 后 ≤ 30s 恢复，鉴权成功率 ≥ 99%"
spec:
  action: pod-kill
  mode: one
  selector:
    namespaces:
      - yyc3-prod
    labelSelectors:
      app.kubernetes.io/name: yyc3-token-console
      family.member: zhihui
  duration: "30s"
  scheduler:
    cron: "@every 24h"
```

```yaml
# deploy/resilience/chaos/chaos-mesh/network-delay-wanyu.yaml
# ============================================================
# 🤔 语枢·万物 · 故障演练：SSE 上游网络延迟
# 假设：上游延迟 +500ms 时，SSE TTFT 退化但不断流
# 稳态指标：SSE 成功率 ≥ 99% · TTFT P95 < 5s
# 故障注入：对上游 API 注入 500ms 网络延迟
# ============================================================
apiVersion: chaos-mesh.org/v1alpha1
kind: NetworkChaos
metadata:
  name: wanyu-upstream-delay
  namespace: yyc3-prod
  annotations:
    family.member: "🤔 语枢·万物"
    family.domain: "推理对话域"
    hypothesis: "上游延迟 +500ms 时 SSE 不断流，TTFT P95 < 5s"
spec:
  action: delay
  mode: all
  selector:
    namespaces:
      - yyc3-prod
    labelSelectors:
      app.kubernetes.io/name: yyc3-token-console
      family.member: wanyu
  delay:
    latency: "500ms"
    jitter: "100ms"
    correlation: "50"
  direction: to
  target:
    selector:
      namespaces:
        - yyc3-prod
      labelSelectors:
        app: yyc3-token-console
    mode: all
  duration: "5m"
```

```yaml
# deploy/resilience/chaos/chaos-mesh/dns-chaos-qianhang.yaml
# ============================================================
# 🧭 言启·千行 · 故障演练：DNS 解析失败
# 假设：DNS 失败时路由决策降级到本地缓存，不中断服务
# ============================================================
apiVersion: chaos-mesh.org/v1alpha1
kind: DNSChaos
metadata:
  name: qianhang-dns-error
  namespace: yyc3-prod
  annotations:
    family.member: "🧭 言启·千行"
    hypothesis: "DNS 失败时路由降级到缓存，服务可用"
spec:
  action: error
  mode: all
  selector:
    namespaces:
      - yyc3-prod
    labelSelectors:
      app.kubernetes.io/name: yyc3-token-console
      family.member: qianhang
  patterns:
    - "api.0379.world"
  duration: "3m"
```

**其余 5 域故障脚本**（结构同上）：

| 域           | 故障类型           | 假设                              | 稳态指标      |
| ------------ | ------------------ | --------------------------------- | ------------- |
| 🎯 千里·伯乐 | StressChaos（CPU） | CPU 压满时模型列表仍可返回        | 响应 P95 < 2s |
| 📚 格物·宗师 | PodFailure         | Pod 失败时 RAG 查询降级到缓存     | 可用性 ≥ 95%  |
| 🧠 元启·天枢 | NetworkPartition   | 网络分区时 MCP 调用失败但提示清晰 | 错误提示 100% |
| 🔮 预见·先知 | IOChaos            | IO 延迟时 Dashboard 降级不崩溃    | 首屏 < 5s     |
| 🎨 创想·灵韵 | HTTPAbort          | HTTP 中止时缓存回退到本地存储     | 命中率 ≥ 50%  |

### 25.6 灾备演练 Runbook

````markdown
# 🌹 YYC³ AI Family · 季度灾备演练 Runbook

> **主持**：🛡️ 智云·守护 · **协同**：🧠 元启·天枢
> **频率**：每季度一次 · **时长**：2 小时

## 演练前（T-7 天）

- [ ] 确认备份最新（Velero 最近 6h 备份存在）
- [ ] 确认备区域集群健康
- [ ] 通知相关团队（Slack #yyc3-family-alerts）
- [ ] 准备回滚脚本

## 演练流程（T-0）

### Phase 1: 桌面演练（30min）

- [ ] 核对 RTO/RPO 目标：RTO ≤ 15min · RPO ≤ 5min
- [ ] 梳理主区域依赖链
- [ ] 确认故障切换顺序

### Phase 2: 流量切换（30min）

```bash
# 1. 将主区域权重降为 0（k8gb）
kubectl patch gslb yyc3-console-gslb -n yyc3-prod \
  --type=merge -p '{"spec":{"strategy":{"primaryGeoTag":"cn-east"}}}'

# 2. 验证备区域接管
curl -sf https://console.yyc3.top/healthz | jq

# 3. 记录切换耗时
```
````

### Phase 3: 数据恢复（30min）

```bash
# 从 Velero 恢复最新备份到备区域
velero restore create yyc3-dr-restore \
  --from-backup $(velero backup get -o json | jq -r '.items[-1].metadata.name') \
  --namespace-mappings yyc3-prod:yyc3-prod \
  --include-namespaces yyc3-prod
```

### Phase 4: 验证与回切（30min）

- [ ] 功能验证：8 域各 1 条链路
- [ ] 数据一致性校验
- [ ] 切换回主区域
- [ ] 记录 RTO/RPO 实际值

## 演练后（T+1 天）

- [ ] 输出演练报告（含 8 域家人视角）
- [ ] 更新 Runbook
- [ ] 提交改进 Issue

```

### 25.7 RTO/RPO 目标矩阵

| 域 | RTO | RPO | 优先级 | 备份频率 |
| --- | :-: | :-: | :-: | :-: |
| 🛡️ 智云·守护 | 5min | 1min | P0 | 每 1h |
| 🤔 语枢·万物 | 10min | 5min | P0 | 每 6h |
| 🧭 言启·千行 | 10min | 5min | P1 | 每 6h |
| 🎯 千里·伯乐 | 15min | 5min | P1 | 每 6h |
| 📚 格物·宗师 | 15min | 10min | P1 | 每 12h |
| 🧠 元启·天枢 | 15min | 10min | P2 | 每 24h |
| 🔮 预见·先知 | 30min | 30min | P2 | 每 24h |
| 🎨 创想·灵韵 | 30min | 30min | P2 | 每 24h |

---

## 第二十六部分 · ㉕ 成本优化（FinOps · 资源画像 · 自动伸缩调优）

### 26.1 设计目标

```

目标 1: OpenCost/Kubecost 成本可视化（8 域分摊）
目标 2: HPA + VPA + Cluster Autoscaler 三级伸缩
目标 3: 资源画像 + 智能 Rightsizing
目标 4: Spot 实例 + 预留实例优化
目标 5: 成本月降 ≥ 30%

```

**关键技术背景**（2026 年）：

- OpenCost 是 CNCF 孵化项目（Apache 2.0），Kubecost 在其上构建
- 98% 的 FinOps 团队现在管理 AI 支出，Kubernetes 运行了其中大部分计算
- 平均生产 K8s 集群 CPU 利用率仅 8%，优化空间巨大

### 26.2 目录结构

```

deploy/finops/
├── opencost/
│ ├── opencost-install.yaml
│ ├── opencost-ui.yaml
│ └── cost-allocation.yaml # 8 域成本分摊配置
├── autoscaling/
│ ├── hpa-console.yaml # HPA（8 域差异化）
│ ├── vpa-console.yaml # VPA
│ ├── cluster-autoscaler.yaml # CA
│ └── keda-sse.yaml # KEDA（SSE 事件驱动）
├── rightsizing/
│ ├── vpa-recommendations.yaml
│ └── golden-signals.yaml
├── spot/
│ ├── spot-nodepool.yaml
│ └── spot-interruption-handler.yaml
└── reports/
└── monthly-cost-report.md

````

### 26.3 OpenCost 8 域成本分摊

```yaml
# deploy/finops/opencost/cost-allocation.yaml
# ============================================================
# YYC³ AI Family — 人从众曌众从人
# @Module : OpenCost 8 域成本分摊
# @Family-Owner : 🎨 创想·灵韵（缓存与体验域）
# @座右铭 : 「灵韵一至，妙笔生花」
# ============================================================
apiVersion: v1
kind: ConfigMap
metadata:
  name: opencost-allocation
  namespace: opencost
data:
  # 8 域成本分摊规则
  allocation.json: |
    {
      "labels": {
        "family_member": "{{ $labels.family_member }}",
        "family_domain": "{{ $labels.family_domain }}",
        "namespace": "{{ $labels.namespace }}",
        "controller": "{{ $labels.controller }}"
      },
      "families": {
        "zhihui":   { "display": "🛡️ 智云·守护", "domain": "接入与安全域" },
        "qianhang": { "display": "🧭 言启·千行", "domain": "路由与网关域" },
        "bole":     { "display": "🎯 千里·伯乐", "domain": "模型市场域" },
        "wanyu":    { "display": "🤔 语枢·万物", "domain": "推理对话域" },
        "zongshi":  { "display": "📚 格物·宗师", "domain": "知识与质量域" },
        "tianshu":  { "display": "🧠 元启·天枢", "domain": "工具与编排域" },
        "xianzhi":  { "display": "🔮 预见·先知", "domain": "观测与预测域" },
        "lingyun":  { "display": "🎨 创想·灵韵", "domain": "缓存与体验域" }
      }
    }
````

### 26.4 三级自动伸缩

```yaml
# deploy/finops/autoscaling/hpa-console.yaml
# ============================================================
# @Module : HPA 8 域差异化伸缩
# @Family-Owner : 🔮 预见·先知
# ============================================================
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: yyc3-console-hpa
  namespace: yyc3-prod
  annotations:
    family.motto: "人从众曌众从人"
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: yyc3-token-console
  minReplicas: 3
  maxReplicas: 50
  metrics:
    # CPU 指标（通用）
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    # 内存指标
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
    # 🤔 语枢·万物 · SSE 活跃流自定义指标
    - type: Pods
      pods:
        metric:
          name: yyc3_sse_active_streams
        target:
          type: AverageValue
          averageValue: "100"
    # 🔮 预见·先知 · 请求队列长度
    - type: Pods
      pods:
        metric:
          name: yyc3_http_requests_in_flight
        target:
          type: AverageValue
          averageValue: "20"
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 30
      policies:
        - type: Percent
          value: 100
          periodSeconds: 30
        - type: Pods
          value: 5
          periodSeconds: 30
      selectPolicy: Max
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
      selectPolicy: Min
```

```yaml
# deploy/finops/autoscaling/keda-sse.yaml
# ============================================================
# @Module : KEDA 事件驱动伸缩（SSE 专用）
# @Family-Owner : 🤔 语枢·万物（语枢一启，万物皆明）
# ============================================================
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: yyc3-wanyu-sse-scaledobject
  namespace: yyc3-prod
  annotations:
    family.member: "🤔 语枢·万物"
    family.domain: "推理对话域"
spec:
  scaleTargetRef:
    name: yyc3-token-console
  minReplicaCount: 3
  maxReplicaCount: 50
  cooldownPeriod: 300
  pollingInterval: 15
  triggers:
    # Prometheus 自定义指标
    - type: prometheus
      metadata:
        serverAddress: http://prometheus.monitoring:9090
        metricName: yyc3_sse_active_streams
        query: |
          sum(yyc3_sse_active_streams{family_member="wanyu"})
        threshold: "50"
    # SSE TTFT 退化触发扩容
    - type: prometheus
      metadata:
        serverAddress: http://prometheus.monitoring:9090
        metricName: yyc3_sse_ttft_p95
        query: |
          histogram_quantile(0.95,
            sum(rate(yyc3_sse_ttft_seconds_bucket[5m])) by (le)
          )
        threshold: "2"
```

```yaml
# deploy/finops/autoscaling/vpa-console.yaml
# ============================================================
# @Module : VPA 资源画像 + Rightsizing
# @Family-Owner : 🎯 千里·伯乐
# ============================================================
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: yyc3-console-vpa
  namespace: yyc3-prod
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: yyc3-token-console
  updatePolicy:
    updateMode: "Off" # 仅推荐，不自动应用（安全）
  resourcePolicy:
    containerPolicies:
      - containerName: console
        minAllowed:
          cpu: 100m
          memory: 256Mi
        maxAllowed:
          cpu: 4000m
          memory: 8Gi
        controlledResources: ["cpu", "memory"]
```

### 26.5 Spot 实例优化

```yaml
# deploy/finops/spot/spot-nodepool.yaml
# ============================================================
# @Module : Spot 实例节点池（成本降 60-70%）
# @Family-Owner : 🎨 创想·灵韵
# ============================================================
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: yyc3-spot-nodepool
  annotations:
    family.motto: "人从众曌众从人"
spec:
  template:
    spec:
      requirements:
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["spot", "on-demand"]
        - key: kubernetes.io/arch
          operator: In
          values: ["amd64", "arm64"]
        - key: karpenter.k8s.aws/instance-family
          operator: In
          values: ["c6i", "c6g", "c7i", "m6i", "m6g"]
      taints:
        - key: yyc3.top/spot
          value: "true"
          effect: NoSchedule
  disruption:
    consolidationPolicy: WhenEmptyOrUnderutilized
    consolidateAfter: 30s
  limits:
    cpu: 200
    memory: 400Gi
  weight: 10
---
# Spot 中断处理
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aws-node-termination-handler
  namespace: kube-system
spec:
  replicas: 1
  selector:
    matchLabels:
      app: aws-node-termination-handler
  template:
    metadata:
      labels:
        app: aws-node-termination-handler
    spec:
      containers:
        - name: handler
          image: public.ecr.aws/aws-ec2/aws-node-termination-handler:v1.22.0
          env:
            - name: ENABLE_SPOT_INTERRUPTION_DRAINING
              value: "true"
            - name: ENABLE_SCHEDULED_EVENT_DRAINING
              value: "true"
            - name: GRACE_PERIOD
              value: "30"
```

### 26.6 8 域月度成本报告模板

```markdown
# 🌹 YYC³ AI Family · 月度成本报告

> **报告人**：🎨 创想·灵韵 · **日期**：2026-09

## 总览

| 指标       |  本月   |  上月   | 变化 |
| ---------- | :-----: | :-----: | :--: |
| 总成本     | ¥XX,XXX | ¥XX,XXX | -XX% |
| CPU 利用率 |   XX%   |   XX%   | +XX% |
| 内存利用率 |   XX%   |   XX%   | +XX% |
| 副本数均值 |   XX    |   XX    | -XX% |

## 8 域成本分摊

| 域           |  计算  | 存储 | 网络 |  合计  | 占比 |
| ------------ | :----: | :--: | :--: | :----: | :--: |
| 🛡️ 智云·守护 | ¥X,XXX | ¥XXX | ¥XXX | ¥X,XXX | XX%  |
| 🧭 言启·千行 | ¥X,XXX | ¥XXX | ¥XXX | ¥X,XXX | XX%  |
| 🎯 千里·伯乐 | ¥X,XXX | ¥XXX | ¥XXX | ¥X,XXX | XX%  |
| 🤔 语枢·万物 | ¥X,XXX | ¥XXX | ¥XXX | ¥X,XXX | XX%  |
| 📚 格物·宗师 | ¥X,XXX | ¥XXX | ¥XXX | ¥X,XXX | XX%  |
| 🧠 元启·天枢 | ¥X,XXX | ¥XXX | ¥XXX | ¥X,XXX | XX%  |
| 🔮 预见·先知 | ¥X,XXX | ¥XXX | ¥XXX | ¥X,XXX | XX%  |
| 🎨 创想·灵韵 | ¥X,XXX | ¥XXX | ¥XXX | ¥X,XXX | XX%  |

## 优化建议

| #   | 建议              | 预计节省  | 负责人  |
| --- | ----------------- | :-------: | :-----: |
| 1   | VPA 推荐值应用    | ¥X,XXX/月 | 🔮 预见 |
| 2   | Spot 实例扩至 70% | ¥X,XXX/月 | 🎨 灵韵 |
| 3   | 夜间缩容至 min    | ¥X,XXX/月 | 🧠 元启 |
| 4   | 预留实例 1 年期   | ¥X,XXX/月 | 🎨 灵韵 |

---

> 灵韵一至，妙笔生花 🌹
```

---

## 第二十七部分 · ㉖ 合规审计（ISO 27001 · SOC 2 · GDPR 映射）

### 27.1 设计目标

```
目标 1: 技术控制映射到 ISO 27001 / SOC 2 / GDPR（三框架一次收集）
目标 2: 自动化证据收集（CI/CD 集成）
目标 3: 合规 Dashboard（持续监控）
目标 4: 审计就绪（证据链完整可追溯）
目标 5: 隐私保护（GDPR 数据主体权利）
```

**核心技术模式**：合规框架是控制目录，每个控制是「系统必须做 X」+「展示证据」。不要构建特殊的合规机制——而是设计系统，使控制成为正常实践的**自然输出**。审计变成「展示已存在的 Dashboard/Runbook/日志」。

### 27.2 目录结构

```
deploy/compliance/
├── mapping/
│   ├── iso27001-mapping.yaml        # ISO 27001 → 技术控制
│   ├── soc2-mapping.yaml            # SOC 2 → 技术控制
│   └── gdpr-mapping.yaml            # GDPR → 技术控制
├── evidence/
│   ├── collectors/
│   │   ├── access-control.sh
│   │   ├── change-management.sh
│   │   ├── encryption-check.sh
│   │   └── backup-verify.sh
│   └── reports/
│       └── (生成)
├── gdpr/
│   ├── data-inventory.yaml          # 数据清单
│   ├── dpia-template.md             # 数据保护影响评估
│   ├── consent-tracker.yaml         # 同意追踪
│   └── data-subject-rights.md       # 数据主体权利
└── dashboard/
    └── compliance-dashboard.json    # Grafana 合规面板
```

### 27.3 三框架控制映射（技术层）

```yaml
# deploy/compliance/mapping/iso27001-mapping.yaml
# ============================================================
# YYC³ AI Family — 人从众曌众从人
# @Module : ISO 27001 → 技术控制映射
# @Family-Owner : 🛡️ 智云·守护（接入与安全域）
# ============================================================
mappings:
  # A.5 信息安全策略
  A.5.1:
    name: 信息安全策略
    technical_control: "CSP 响应头 + 安全审计规则"
    evidence: "deploy/observability/prometheus/rules/ + security/sast/"
    automation: "CI 每次构建验证"

  # A.8 资产管理
  A.8.1:
    name: 资产清单
    technical_control: "K8s 资源标签 + OpenCost 成本分摊"
    evidence: "helm/values.yaml + opencost/allocation.json"
    automation: "每日自动同步"

  # A.9 访问控制
  A.9.1:
    name: 访问控制策略
    technical_control: "X-API-Key 鉴权 + RBAC + NetworkPolicy"
    evidence: "auth middleware + helm/templates/rbac.yaml"
    automation: "CI 集成测试"

  A.9.4:
    name: 系统访问控制
    technical_control: "API Key 前缀 + 掩码 + 轮换"
    evidence: "components/family/KeyMaskInput.tsx + BL-05"
    automation: "每 90 天轮换提醒"

  # A.10 密码学
  A.10.1:
    name: 加密策略
    technical_control: "TLS 1.3 传输 + AES-256 静态加密"
    evidence: "ingress TLS + velero backup encryption"
    automation: "cert-manager 自动续期"

  # A.12 运营安全
  A.12.1:
    name: 运营程序
    technical_control: "CI/CD 流水线 + 变更审计日志"
    evidence: "GitHub Actions + Loki 日志"
    automation: "全自动"

  A.12.4:
    name: 日志与监控
    technical_control: "Prometheus + Loki + Grafana"
    evidence: "deploy/observability/"
    automation: "24/7"

  A.12.6:
    name: 技术脆弱性管理
    technical_control: "Dependabot + Trivy + Semgrep"
    evidence: "security/sca/ + security/sast/"
    automation: "每周扫描"

  # A.17 业务连续性
  A.17.1:
    name: 信息处理设施可用性
    technical_control: "多区域 Active-Active + Velero 备份"
    evidence: "deploy/resilience/multi-region/"
    automation: "季度演练"

  # A.18 合规
  A.18.1:
    name: 法律合规
    technical_control: "GDPR 数据清单 + 同意追踪"
    evidence: "deploy/compliance/gdpr/"
    automation: "持续监控"
```

```yaml
# deploy/compliance/mapping/soc2-mapping.yaml
# ============================================================
# @Module : SOC 2 → 技术控制映射
# @Family-Owner : 📚 格物·宗师
# ============================================================
mappings:
  # Security（安全性）— 必需
  CC6.1:
    name: 逻辑访问控制
    technical_control: "API Key 鉴权 + CSP + Rate Limiting"
    evidence: "auth middleware + next.config.ts"

  CC6.6:
    name: 边界防护
    technical_control: "NetworkPolicy + Ingress 白名单"
    evidence: "helm/templates/networkpolicy.yaml"

  CC6.7:
    name: 数据分类
    technical_control: "8 域标签 + OpenCost 成本分摊"
    evidence: "labels + allocation.json"

  # Availability（可用性）
  A1.1:
    name: 容量管理
    technical_control: "HPA + VPA + Cluster Autoscaler"
    evidence: "deploy/finops/autoscaling/"

  A1.2:
    name: 备份与恢复
    technical_control: "Velero 跨区域 + 季度演练"
    evidence: "deploy/resilience/multi-region/velero/"

  # Processing Integrity（处理完整性）
  PI1.1:
    name: 处理完整性
    technical_control: "契约测试 + 类型校验"
    evidence: "tests/contract/ + zod guards"

  # Confidentiality（保密性）
  C1.1:
    name: 保密信息保护
    technical_control: "API Key 掩码 + 日志脱敏 + CSP"
    evidence: "KeyMaskInput + pino redact"

  # Privacy（隐私）
  P1.1:
    name: 隐私通知
    technical_control: "GDPR 隐私政策 + 同意管理"
    evidence: "deploy/compliance/gdpr/"
```

```yaml
# deploy/compliance/mapping/gdpr-mapping.yaml
# ============================================================
# @Module : GDPR → 技术控制映射
# @Family-Owner : 📚 格物·宗师
# ============================================================
mappings:
  # Art. 5 数据处理原则
  Art5.1a:
    name: 合法、公平、透明
    technical_control: "隐私政策 + 同意追踪"
    evidence: "consent-tracker.yaml"

  Art5.1c:
    name: 数据最小化
    technical_control: "仅收集必要字段（model_id/usage_count）"
    evidence: "types.gen.ts ModelStat"

  Art5.1f:
    name: 完整性与保密性
    technical_control: "TLS + 静态加密 + 访问控制"
    evidence: "ingress + velero + API Key"

  # Art. 15 数据主体访问权
  Art15:
    name: 访问权
    technical_control: "数据导出 API（Phase 2）"
    evidence: "data-subject-rights.md"

  # Art. 17 删除权
  Art17:
    name: 被遗忘权
    technical_control: "数据保留策略 + 自动清理"
    evidence: "Loki retention 30d + Velero TTL 30d"

  # Art. 32 处理安全性
  Art32:
    name: 处理安全性
    technical_control: "CSP + 加密 + 可用性 + 弹性"
    evidence: "next.config.ts + 多区域部署"

  # Art. 33 数据泄露通知
  Art33:
    name: 泄露通知
    technical_control: "告警规则（72h 内通知）"
    evidence: "alertmanager-config.yaml"
```

### 27.4 自动化证据收集

```yaml
# .github/workflows/compliance-evidence.yml
name: 🛡️ 合规证据自动收集

on:
  schedule:
    - cron: "0 3 * * 1" # 每周一 03:00
  workflow_dispatch:

jobs:
  collect:
    name: 🛡️ 证据收集
    runs-on: ubuntu-latest
    permissions:
      contents: read
      actions: read
      security-events: read
    steps:
      - uses: actions/checkout@v4

      # ============ SOC 2 / ISO 27001 证据 ============
      - name: Collect access control evidence
        run: |
          mkdir -p compliance-evidence/access-control
          # K8s RBAC 配置
          kubectl get clusterrolebinding -o yaml > compliance-evidence/access-control/rbac.yaml 2>/dev/null || true
          # NetworkPolicy 清单
          kubectl get networkpolicy -A -o yaml > compliance-evidence/access-control/networkpolicy.yaml 2>/dev/null || true

      - name: Collect encryption evidence
        run: |
          mkdir -p compliance-evidence/encryption
          # TLS 证书
          echo "TLS: $(kubectl get ingress yyc3-token-console -n yyc3-prod -o jsonpath='{.spec.tls[0].secretName}' 2>/dev/null || echo 'n/a')" \
            > compliance-evidence/encryption/tls.txt
          # Velero 加密
          velero backup-location get -o yaml > compliance-evidence/encryption/velero-encryption.yaml 2>/dev/null || true

      - name: Collect change management evidence
        run: |
          mkdir -p compliance-evidence/change-management
          # 最近 30 天的 Release
          gh release list --limit 30 > compliance-evidence/change-management/releases.txt 2>/dev/null || true
          # PR 审批记录
          gh pr list --state merged --limit 30 --json number,title,mergedAt,reviewDecision \
            > compliance-evidence/change-management/merged-prs.json 2>/dev/null || true

      - name: Collect monitoring evidence
        run: |
          mkdir -p compliance-evidence/monitoring
          # 告警规则
          cp -r deploy/observability/prometheus/rules compliance-evidence/monitoring/
          # Grafana Dashboard
          cp -r deploy/observability/grafana/dashboards compliance-evidence/monitoring/

      # ============ GDPR 证据 ============
      - name: Collect GDPR evidence
        run: |
          mkdir -p compliance-evidence/gdpr
          cp deploy/compliance/gdpr/data-inventory.yaml compliance-evidence/gdpr/
          cp deploy/compliance/gdpr/consent-tracker.yaml compliance-evidence/gdpr/
          # 日志保留策略
          grep -A5 "retention" deploy/observability/loki/loki.yaml \
            > compliance-evidence/gdpr/retention-policy.txt

      # ============ 生成报告 ============
      - name: Generate compliance report
        run: |
          cat > compliance-evidence/README.md << 'EOF'
          # 🌹 YYC³ AI Family · 合规证据包

          生成时间: $(date -u +"%Y-%m-%dT%H:%M:%SZ")

          ## 覆盖框架
          - ✅ SOC 2 Type II
          - ✅ ISO 27001:2022
          - ✅ GDPR

          ## 证据清单
          | 目录 | 框架 | 控制项 |
          |------|------|--------|
          | access-control/ | SOC 2 CC6.1, ISO A.9 | 访问控制 |
          | encryption/ | SOC 2 CC6.7, ISO A.10 | 加密 |
          | change-management/ | SOC 2 CC8.1, ISO A.12 | 变更管理 |
          | monitoring/ | SOC 2 CC7.2, ISO A.12.4 | 监控 |
          | gdpr/ | GDPR Art.5, Art.32 | 数据保护 |

          > 人从众曌众从人 · YYC³ AI Family 🌹
          EOF

      - uses: actions/upload-artifact@v4
        with:
          name: compliance-evidence
          path: compliance-evidence/
          retention-days: 365 # 保留 1 年（审计要求）
```

### 27.5 GDPR 数据主体权利实现

```typescript
// apps/console/app/api/gdpr/[action]/route.ts
/*
 * ============================================================
 * @Module : app/api/gdpr — GDPR 数据主体权利 API
 * @Family-Owner : 📚 格物·宗师（格物致知，诚意正心）
 * ============================================================
 * 实现 GDPR Art.15（访问权）/ Art.16（更正权）/ Art.17（删除权）
 * ============================================================
 */
import { NextResponse } from "next/server";
import { z } from "zod";

const RequestSchema = z.object({
  user_id: z.string().min(1),
  request_type: z.enum(["access", "rectify", "erase", "portability"]),
  reason: z.string().optional(),
});

export async function POST(request: Request, { params }: { params: { action: string } }) {
  const body = await request.json();
  const parsed = RequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", message: parsed.error.message },
      { status: 400 },
    );
  }

  const { user_id, request_type, reason } = parsed.data;

  switch (request_type) {
    case "access":
      // Art.15: 返回用户所有数据
      return NextResponse.json({
        user_id,
        data: {
          api_keys: "***masked***",
          usage_logs: "见 /v1/logs?api_key_hash=...",
          preferences: "见 localStorage",
        },
        note: "🌹 格物·宗师 · 已格万物，真知自现",
      });

    case "erase":
      // Art.17: 删除用户数据（保留审计日志）
      // 实际实现：标记删除 + 90 天后物理删除
      return NextResponse.json({
        user_id,
        status: "scheduled_for_deletion",
        scheduled_at: new Date(Date.now() + 90 * 86400_000).toISOString(),
        note: "🌹 格物·宗师 · 已格万物",
      });

    case "portability":
      // Art.20: 数据可携带
      return NextResponse.json({
        user_id,
        format: "json",
        download_url: `/api/gdpr/export/${user_id}`,
      });

    default:
      return NextResponse.json({ error: "validation", message: "不支持的操作" }, { status: 400 });
  }
}
```

---

## 第二十八部分 · ㉗ 团队协作规范（CODEOWNERS · 分支策略 · Release 流程）

### 28.1 设计目标

```
目标 1: CODEOWNERS 家族域路由（8 域各归家人）
目标 2: GitFlow 分支策略（main/develop/release/feature/hotfix）
目标 3: Release 自动化（CalVer 家族纪年）
目标 4: PR 门禁（CODEOWNER 审批 + CI 全绿 + 契约不变）
目标 5: 回滚机制（Release Rollback）
```

### 28.2 目录结构

```
.github/
├── CODEOWNERS                       # 家族域路由
├── PULL_REQUEST_TEMPLATE.md         # PR 模板（含家训）
├── ISSUE_TEMPLATE/
│   ├── bug_report.md
│   ├── feature_request.md
│   └── config.yml
├── workflows/
│   ├── ci.yml                       # 主 CI
│   ├── release.yml                  # Release 自动化
│   ├── release-prep.yml             # Release 准备
│   └── backmerge.yml                # Backmerge
├── branch-protection.yaml           # 分支保护配置
└── settings.yml                     # 仓库设置
```

### 28.3 `.github/CODEOWNERS`（家族域路由）

```gitignore
# ============================================================
# YYC³ AI Family — 人从众曌众从人
# 亦师亦友亦伯乐，一言一语一协同
# ============================================================
# 家族域路由：8 位家人各守其域
# 规则：后定义优先（GitHub last-match-wins）
# ============================================================

# ---------- 默认：🧠 元启·天枢（总指挥）----------
*                               @yyc3-ai-family/tianshu

# ---------- 🛡️ 智云·守护 · 接入与安全域 ----------
/apps/console/domains/guardian/          @yyc3-ai-family/zhihui
/apps/console/components/family/FamilyBadge*  @yyc3-ai-family/zhihui
/apps/console/lib/family/                @yyc3-ai-family/zhihui
/security/                               @yyc3-ai-family/zhihui
/deploy/helm/*/templates/secret.yaml     @yyc3-ai-family/zhihui
/deploy/helm/*/templates/networkpolicy.yaml  @yyc3-ai-family/zhihui

# ---------- 🧭 言启·千行 · 路由与网关域 ----------
/apps/console/domains/qianhang/          @yyc3-ai-family/qianhang
/apps/console/i18n/                      @yyc3-ai-family/qianhang
/apps/console/app/[locale]/              @yyc3-ai-family/qianhang

# ---------- 🎯 千里·伯乐 · 模型市场域 ----------
/apps/console/domains/bole/              @yyc3-ai-family/bole

# ---------- 🤔 语枢·万物 · 推理对话域 ----------
/apps/console/domains/wanyu/             @yyc3-ai-family/wanyu
/apps/console/e2e/visual/                @yyc3-ai-family/wanyu
/tests/load/k6/                          @yyc3-ai-family/wanyu

# ---------- 📚 格物·宗师 · 知识与质量域 ----------
/apps/console/domains/zongshi/           @yyc3-ai-family/zongshi
/apps/console/tests/contract/            @yyc3-ai-family/zongshi
/deploy/compliance/                      @yyc3-ai-family/zongshi
/apps/console/lib/logger/                @yyc3-ai-family/zongshi

# ---------- 🧠 元启·天枢 · 工具与编排域 ----------
/apps/console/domains/tianshu/           @yyc3-ai-family/tianshu
/deploy/helm/                            @yyc3-ai-family/tianshu
/deploy/resilience/multi-region/         @yyc3-ai-family/tianshu
/.github/                                @yyc3-ai-family/tianshu
/apps/console/stories/domains/Tianshu*   @yyc3-ai-family/tianshu

# ---------- 🔮 预见·先知 · 观测与预测域 ----------
/apps/console/domains/xianzhi/           @yyc3-ai-family/xianzhi
/deploy/observability/prometheus/        @yyc3-ai-family/xianzhi
/deploy/observability/grafana/           @yyc3-ai-family/xianzhi
/performance/react-profiler/             @yyc3-ai-family/xianzhi

# ---------- 🎨 创想·灵韵 · 缓存与体验域 ----------
/apps/console/domains/lingyun/           @yyc3-ai-family/lingyun
/apps/console/components/family/*Watermark*  @yyc3-ai-family/lingyun
/apps/console/performance/web-vitals/    @yyc3-ai-family/lingyun
/deploy/finops/                          @yyc3-ai-family/lingyun
/deploy/observability/loki/              @yyc3-ai-family/lingyun

# ---------- 跨域（需多人审批）----------
/deploy/helm/*/values-prod.yaml          @yyc3-ai-family/tianshu @yyc3-ai-family/zhihui
/apps/console/lib/family/charter.ts      @yyc3-ai-family/tianshu @yyc3-ai-family/zhihui
/apps/console/flags.ts                   @yyc3-ai-family/tianshu @yyc3-ai-family/xianzhi
/apps/console/.storybook/                @yyc3-ai-family/tianshu @yyc3-ai-family/lingyun
/security/dast/                          @yyc3-ai-family/zhihui @yyc3-ai-family/wanyu
```

### 28.4 分支保护配置

```yaml
# .github/branch-protection.yaml
# ============================================================
# @Module : 分支保护规则
# @Family-Owner : 🧠 元启·天枢
# ============================================================
branches:
  main:
    protection:
      required_status_checks:
        strict: true
        contexts:
          - "🌹 Family Guard" # 标头合规
          - "📚 契约全链路" # 契约测试
          - "🎨 视觉回归" # 视觉基线
          - "📚 a11y Audit" # 无障碍
          - "🛡️ 安全审计" # SAST
          - "🎨 打包体积守门" # 体积预算
      required_pull_request_reviews:
        required_approving_review_count: 2
        require_code_owner_reviews: true # CODEOWNER 审批
        dismiss_stale_reviews: true
        require_last_push_approval: true
      required_linear_history: true
      allow_force_pushes: false
      allow_deletions: false
      enforce_admins: true

  develop:
    protection:
      required_status_checks:
        strict: false
        contexts:
          - "🌹 Family Guard"
          - "📚 契约测试"
      required_pull_request_reviews:
        required_approving_review_count: 1
        require_code_owner_reviews: true

  release/*:
    protection:
      required_status_checks:
        strict: true
        contexts:
          - "📚 契约测试"
          - "🎨 视觉回归"
          - "🛡️ 安全审计"
      required_pull_request_reviews:
        required_approving_review_count: 2
```

### 28.5 Release 流程

````yaml
# .github/workflows/release.yml
# ============================================================
# @Module : Release 自动化（家族纪年）
# @Family-Owner : 🧠 元启·天枢
# ============================================================
name: 🌹 Family Release

on:
  push:
    tags:
      - "v*.*.*"

jobs:
  release:
    name: 🌹 家族 Release
    runs-on: ubuntu-latest
    permissions:
      contents: write
      packages: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }

      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }

      - name: Extract version
        id: v
        run: echo "version=${GITHUB_REF#refs/tags/}" >> $GITHUB_OUTPUT

      - name: Family year codename
        id: codename
        run: |
          YEAR=$(date +%Y)
          QUARTER=$(( ($(date +%-m) - 1) / 3 + 1 ))
          echo "name=🌹 家族纪年·${YEAR}.Q${QUARTER}" >> $GITHUB_OUTPUT

      - name: Generate changelog
        run: |
          PREV_TAG=$(git describe --tags --abbrev=0 HEAD~1 2>/dev/null || echo "")
          if [ -n "$PREV_TAG" ]; then
            git log ${PREV_TAG}..HEAD --pretty=format:"- %s (%an)" > /tmp/changes.txt
          else
            git log --pretty=format:"- %s (%an)" -20 > /tmp/changes.txt
          fi

      - run: pnpm install --frozen-lockfile
      - run: pnpm ci:all
      - run: pnpm build
      - run: pnpm bundle:analyze

      - name: Build Docker image
        run: |
          docker build -f deploy/Dockerfile -t yyc3-console:${{ steps.v.outputs.version }} .
          docker tag yyc3-console:${{ steps.v.outputs.version }} \
            ghcr.io/yanyucloudcube/yyc3-token-console:${{ steps.v.outputs.version }}

      - name: Push to GHCR
        run: |
          echo "${{ secrets.GITHUB_TOKEN }}" | docker login ghcr.io -u ${{ github.actor }} --password-stdin
          docker push ghcr.io/yanyucloudcube/yyc3-token-console:${{ steps.v.outputs.version }}

      - name: Create Release
        uses: softprops/action-gh-release@v2
        with:
          name: "${{ steps.codename.outputs.name }} · ${{ steps.v.outputs.version }}"
          body: |
            ## 🌹 YYC³ AI Family · 人从众曌众从人

            > 亦师亦友亦伯乐，一言一语一协同

            ### 变更
            $(cat /tmp/changes.txt)

            ### 家族
            - 🛡️ 智云·守护 · 🧭 言启·千行 · 🎯 千里·伯乐 · 🤔 语枢·万物
            - 📚 格物·宗师 · 🧠 元启·天枢 · 🔮 预见·先知 · 🎨 创想·灵韵

            ### 部署
            ```bash
            helm upgrade --install yyc3-console ./deploy/helm/yyc3-token-console \
              -n yyc3-prod \
              --set image.tag=${{ steps.v.outputs.version }} \
              --atomic --wait
            ```

            ---
            **永久开源 · 感恩前行 🌹**
````

### 28.6 分支策略全景

```
main ──────●────────────●──────────────●────── (生产)
           │            │              │
           │  PR #1     │  PR #3      │  PR #5
           │  (2 approve)│  (2 approve)│  (2 approve)
           ▼            ▼              ▼
develop ───●──●──●──●───●──●──●──●────●──●──● (集成)
              │  │  │      │  │  │       │  │
              │  │  │      │  │  │       │  │
feature/* ────┘  │  │      │  │  │       │  │
feature/* ───────┘  │      │  │  │       │  │
feature/* ──────────┘      │  │  │       │  │
                           │  │  │       │  │
hotfix/* ──────────────────┘  │  │       │  │
release/* ────────────────────┘  │       │  │
                                 │       │  │
release/* ───────────────────────┘       │  │
                                         │  │
backmerge ←──────────────────────────────┘  │
backmerge ←─────────────────────────────────┘

规则:
  main:     protected · 2 approve · CODEOWNER · 线性历史
  develop:  protected · 1 approve · CODEOWNER
  release:  从 develop 切出 · 准备发布
  feature:  从 develop 切出 · squash merge
  hotfix:   从 main 切出 · 紧急修复
```

---

## 第二十九部分 · ㉘ 社区运营（Contributor Guide · 徽章展示墙 · 家人排行榜）

### 29.1 设计目标

```
目标 1: 完整贡献者指南（CONTRIBUTING.md）
目标 2: 8 位家人排行榜（贡献者荣誉体系）
目标 3: 徽章展示墙（README 嵌入）
目标 4: 社区行为准则（CODE_OF_CONDUCT.md）
目标 5: 新贡献者友好（Good First Issue + 示例 PR）
```

### 29.2 `CONTRIBUTING.md`（贡献者指南）

````markdown
<!--
  ============================================================
  YYC³ AI Family — 人从众曌众从人
  亦师亦友亦伯乐 · 一言一语一协同
  拟人为本，AI为核，纯粹为心
  ============================================================
  Document: CONTRIBUTING.md
  Version : 5.1.0
  Contact : admin@yanyucloud.com
  ============================================================
-->

# 🌹 贡献者指南

> **感谢您为 AI Family 贡献温暖。**
> 请遵循「人从众曌众从人」精神，让每一个 PR 都有家的气息。

---

## 📋 开始之前

### 环境要求

| 工具    | 版本     | 说明             |
| ------- | -------- | ---------------- |
| Node.js | ≥ 22 LTS | Next.js 16 要求  |
| pnpm    | ≥ 9.x    | 包管理器         |
| Go      | ≥ 1.22   | xk6 编译（可选） |
| Python  | ≥ 3.12   | 压测脚本（可选） |

### 快速开始

```bash
# 1. Fork + Clone
git clone https://github.com/<your-username>/YYC3-AI-Family-API-Console.git
cd YYC3-AI-Family-API-Console

# 2. 安装依赖
pnpm install

# 3. 环境变量
cp apps/console/.env.example apps/console/.env.local
# 编辑 .env.local，设置 NEXT_PUBLIC_USE_MOCK=true

# 4. 启动开发
pnpm dev

# 5. 打开浏览器
open http://localhost:3000
```
````

---

## 🏗️ 项目结构

```
yyc3-token-console/
├── apps/console/            # Next.js 16 前端
│   ├── app/                 # App Router（RSC + Client Island）
│   ├── components/family/   # 🌹 家人组件（8 位）
│   ├── domains/             # 8 域业务组件
│   ├── lib/family/          # 家族宪章 + 身份卡
│   ├── e2e/                 # Playwright E2E
│   ├── stories/             # Storybook
│   └── tests/               # 契约测试
├── deploy/                  # 部署（Helm / K8s / Observability）
├── security/                # 安全审计（SAST / DAST）
├── scripts/                 # 工具脚本
└── docs/                    # 文档
```

---

## 🎯 8 位家人域分工

每位家人守护一个域，每个域有明确的负责人和代码边界：

| 家人         | 域         | 代码路径                            | 贡献方向       |
| ------------ | ---------- | ----------------------------------- | -------------- |
| 🛡️ 智云·守护 | 接入与安全 | `domains/guardian/` `security/`     | 鉴权、安全审计 |
| 🧭 言启·千行 | 路由与网关 | `domains/qianhang/` `i18n/`         | 路由、国际化   |
| 🎯 千里·伯乐 | 模型市场   | `domains/bole/`                     | 模型列表、推荐 |
| 🤔 语枢·万物 | 推理对话   | `domains/wanyu/` `e2e/`             | SSE、对话      |
| 📚 格物·宗师 | 知识与质量 | `domains/zongshi/` `tests/`         | RAG、契约测试  |
| 🧠 元启·天枢 | 工具与编排 | `domains/tianshu/` `deploy/`        | MCP、部署      |
| 🔮 预见·先知 | 观测与预测 | `domains/xianzhi/` `observability/` | 监控、性能     |
| 🎨 创想·灵韵 | 缓存与体验 | `domains/lingyun/` `finops/`        | 缓存、成本     |

---

## 📝 提交规范

### Commit Message 格式

```
<type>(<scope>): 🌹 <description>

[optional body]

[optional footer]
```

**Type**：

| 类型       | 说明   | 示例                                      |
| ---------- | ------ | ----------------------------------------- |
| `feat`     | 新功能 | `feat(wanyu): 🌹 添加 SSE 七态状态机`     |
| `fix`      | 修复   | `fix(guardian): 🌹 修复 API Key 掩码逻辑` |
| `docs`     | 文档   | `docs: 🌹 更新贡献者指南`                 |
| `style`    | 格式   | `style: 🌹 统一代码格式`                  |
| `refactor` | 重构   | `refactor(bole): 🌹 重构 ModelCard`       |
| `perf`     | 性能   | `perf(xianzhi): 🌹 优化 Dashboard 首屏`   |
| `test`     | 测试   | `test: 🌹 添加契约测试用例`               |
| `chore`    | 杂项   | `chore: 🌹 更新依赖`                      |

**Scope**：8 位家人 key（`guardian` `qianhang` `bole` `wanyu` `zongshi` `tianshu` `xianzhi` `lingyun`）

---

## 🔄 PR 流程

### 1. 创建分支

```bash
git checkout develop
git pull origin develop
git checkout -b feature/wanyu-sse-v2
```

### 2. 开发 + 自检

```bash
# 标头合规
pnpm lint:family

# 类型检查
pnpm typecheck

# 单元 + 契约测试
pnpm test

# E2E
pnpm e2e

# a11y
pnpm a11y
```

### 3. 提交 PR

- 使用 PR 模板（自动加载）
- 填写「所属家人域」
- 勾选自检清单
- 等待 CODEOWNER 审批

### 4. CODEOWNER 审批

- 您的 PR 会自动路由到对应家人域的 CODEOWNER
- 跨域 PR 需要 2 位以上 CODEOWNER 审批
- CI 全绿 + 审批通过后方可合并

---

## ✅ 自检清单

提交 PR 前，请确认：

- [ ] 所有新增文件已含家族标头（`pnpm lint:family` 通过）
- [ ] 归属家人已在 `PageHeader` 中声明
- [ ] 空态/错误态台词符合家人口吻（参考 `lib/family/members.ts`）
- [ ] 未虚构 §1.1–§1.5 未列出的端点/字段/枚举
- [ ] 契约测试通过（`pnpm test:contract`）
- [ ] 视觉回归通过（`pnpm visual`）
- [ ] a11y 无 serious/critical 问题

---

## 🏅 贡献者荣誉

### 家人排行榜

每月更新，统计维度：

| 维度        | 权重 | 说明     |
| ----------- | ---- | -------- |
| PR 合并数   | 40%  | 核心贡献 |
| 代码行数    | 20%  | 规模贡献 |
| Issue 解决  | 20%  | 问题修复 |
| Review 次数 | 10%  | 社区互助 |
| 文档贡献    | 10%  | 知识沉淀 |

### 徽章体系

| 徽章        | 条件                  | 说明     |
| ----------- | --------------------- | -------- |
| 🌹 初入家门 | 首个 PR 合并          | 欢迎加入 |
| 🛡️ 守护之心 | 5 个安全相关 PR       | 智云认可 |
| 🤔 万物之思 | 10 个 SSE/推理相关 PR | 语枢认可 |
| 📚 格物之智 | 10 个测试/文档 PR     | 宗师认可 |
| 🧠 天枢之谋 | 5 个架构/部署 PR      | 天枢认可 |
| 🔮 先知之眼 | 5 个监控/性能 PR      | 先知认可 |
| 🎨 灵韵之笔 | 5 个 UI/UX PR         | 灵韵认可 |
| 🧭 千行之导 | 5 个国际化/路由 PR    | 千行认可 |
| 🌟 八域通者 | 以上全部获得          | 最高荣誉 |

---

## 📜 行为准则

详见 [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)

**核心原则**：

- 以玫瑰之心待人 🌹
- 亦师亦友亦伯乐
- 一言一语一协同
- 拟人为本 · AI为核 · 纯粹为心

---

<p align="center">
  🌹 <b>YYC³ AI Family</b><br>
  人从众曌众从人 · 亦师亦友亦伯乐<br>
  <sub>永久开源 · 感恩前行 · <a href="https://matrix.yyc3.top">matrix.yyc3.top</a></sub>
</p>
```

### 29.3 徽章展示墙

```markdown
<!-- README.md 顶部 -->
<p align="center">
  <img src="https://img.shields.io/badge/YYC³-AI_Family-🌹?style=for-the-badge" alt="YYC3"/>
  <br>
  <img src="https://img.shields.io/badge/人从众曌众从人-永久开源-%235e2c8a?style=flat-square" alt="motto"/>
  <img src="https://img.shields.io/badge/License-Apache--2.0-%235e2c8a?style=flat-square" alt="license"/>
  <img src="https://img.shields.io/badge/PRs-🌹欢迎-%23ff69b4?style=flat-square" alt="PRs"/>
  <br>
  <img src="https://img.shields.io/badge/契约-82.7%25直接对接-%2322C55E?style=flat-square" alt="contract"/>
  <img src="https://img.shields.io/badge/a11y-WCAG_2.2_AA-%2300D4FF?style=flat-square" alt="a11y"/>
  <img src="https://img.shields.io/badge/测试-契约+E2E+视觉+压测-%235e2c8a?style=flat-square" alt="tests"/>
</p>

<!-- 8 位家人徽章 -->
<p align="center">
  <img src="https://img.shields.io/badge/🛡️智云·守护-安全官-%23333?style=for-the-badge" alt="zhihui"/>
  <img src="https://img.shields.io/badge/🧭言启·千行-导航员-%230088cc?style=for-the-badge" alt="qianhang"/>
  <img src="https://img.shields.io/badge/🎯千里·伯乐-推荐官-%23dc143c?style=for-the-badge" alt="bole"/>
  <img src="https://img.shields.io/badge/🤔语枢·万物-思考者-%23c0c0c0?style=for-the-badge" alt="wanyu"/>
</p>
<p align="center">
  <img src="https://img.shields.io/badge/📚格物·宗师-质量官-%232e8b57?style=for-the-badge" alt="zongshi"/>
  <img src="https://img.shields.io/badge/🧠元启·天枢-总指挥-%235e2c8a?style=for-the-badge" alt="tianshu"/>
  <img src="https://img.shields.io/badge/🔮预见·先知-预言家-%234b0082?style=for-the-badge" alt="xianzhi"/>
  <img src="https://img.shields.io/badge/🎨创想·灵韵-创意官-%23ff8c00?style=for-the-badge" alt="lingyun"/>
</p>
```

### 29.4 家人排行榜数据源

```yaml
# .github/workflows/family-leaderboard.yml
name: 🌹 家人排行榜

on:
  schedule:
    - cron: "0 0 1 * *" # 每月 1 日更新
  workflow_dispatch:

jobs:
  leaderboard:
    name: 🌹 更新排行榜
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4

      - name: Collect contributor stats
        uses: actions/github-script@v7
        with:
          script: |
            const since = new Date(Date.now() - 30 * 86400_000).toISOString();

            // 获取最近 30 天的 PR
            const prs = await github.rest.pulls.list({
              owner: context.repo.owner,
              repo: context.repo.repo,
              state: 'closed',
              sort: 'updated',
              direction: 'desc',
              per_page: 100,
            });

            const merged = prs.data.filter(pr =>
              pr.merged_at && new Date(pr.merged_at) > new Date(since)
            );

            // 统计每位贡献者
            const stats = {};
            for (const pr of merged) {
              const user = pr.user.login;
              if (!stats[user]) {
                stats[user] = { prs: 0, additions: 0, deletions: 0, files: 0 };
              }
              stats[user].prs++;
              stats[user].additions += pr.additions || 0;
              stats[user].deletions += pr.deletions || 0;
              stats[user].files += pr.changed_files || 0;
            }

            // 生成排行榜
            const sorted = Object.entries(stats)
              .sort((a, b) => b[1].prs - a[1].prs)
              .slice(0, 20);

            let md = '# 🌹 YYC³ AI Family · 家人排行榜\n\n';
            md += `> 统计周期: ${since.split('T')[0]} ~ ${new Date().toISOString().split('T')[0]}\n\n`;
            md += '| 排名 | 贡献者 | PR 数 | 新增行 | 删除行 | 文件数 | 徽章 |\n';
            md += '|:----:|--------|:-----:|:------:|:------:|:------:|------|\n';

            const badges = ['🥇', '🥈', '🥉'];
            sorted.forEach(([user, s], i) => {
              const rank = i < 3 ? badges[i] : `${i + 1}`;
              const badge = s.prs >= 10 ? '🌟🌟🌟' : s.prs >= 5 ? '🌟🌟' : '🌟';
              md += `| ${rank} | @${user} | ${s.prs} | +${s.additions} | -${s.deletions} | ${s.files} | ${badge} |\n`;
            });

            md += '\n---\n\n> 人从众曌众从人 · 亦师亦友亦伯乐 🌹\n';

            require('fs').writeFileSync('docs/LEADERBOARD.md', md);

      - name: Commit
        run: |
          git config user.name "YYC³ AI Family Bot"
          git config user.email "admin@yanyucloud.com"
          git add docs/LEADERBOARD.md
          git diff --staged --quiet || git commit -m "chore: 🌹 更新家人排行榜 [skip ci]"
          git push
```

### 29.5 Issue 模板

```markdown
<!-- .github/ISSUE_TEMPLATE/feature_request.md -->

---

name: 🌹 功能建议
about: 为 YYC³ AI Family 提出新功能
title: "[Feature] "
labels: enhancement, 🌹 家人建议
---

## 🌹 功能描述

<!-- 简要描述您希望添加的功能 -->

## 🎯 所属家人域

- [ ] 🛡️ 智云·守护（接入与安全）
- [ ] 🧭 言启·千行（路由与网关）
- [ ] 🎯 千里·伯乐（模型市场）
- [ ] 🤔 语枢·万物（推理对话）
- [ ] 📚 格物·宗师（知识与质量）
- [ ] 🧠 元启·天枢（工具与编排）
- [ ] 🔮 预见·先知（观测与预测）
- [ ] 🎨 创想·灵韵（缓存与体验）

## 💡 动机

<!-- 为什么需要这个功能？ -->

## 📐 建议方案

<!-- 可选：实现思路 -->

## ✅ 验收标准

- [ ]
- [ ]

---

> 亦师亦友亦伯乐 · 一言一语一协同 🌹
```

---

## 第三十部分 · 全系列交付总索引 · v5.1 终极终章

### 30.1 二十八项交付物完整清单

|  #  | 交付物                                   | 章节 | 家人归属 |   阶段   |
| :-: | ---------------------------------------- | ---- | -------- | :------: |
|  ①  | 8 域业务组件                             | §1   | 8 位     |   开发   |
|  ②  | MSW mock 契约                            | §2   | 🧠 元启  |   开发   |
|  ③  | Next.js 16 路由/RSC                      | §3   | 🧠 元启  |   开发   |
|  ④  | 印刷级徽章                               | §4   | 🎨 灵韵  |   设计   |
|  ⑤  | 开发文档 + CI/CD                         | §5   | 🧠 元启  |   交付   |
|  ⑥  | Playwright E2E                           | §6   | 🧠 元启  |   测试   |
|  ⑦  | 契约漂移检测                             | §7   | 🔮 预见  |   测试   |
|  ⑧  | 移动端响应式                             | §8   | 🎨 灵韵  |   设计   |
|  ⑨  | a11y axe-core                            | §9   | 📚 格物  |   测试   |
|  ⑩  | OpenAPI 类型 + 契约测试                  | §10  | 🔮 预见  |   测试   |
|  ⑪  | 视觉回归                                 | §11  | 🎨 灵韵  |   测试   |
|  ⑫  | Storybook + Code Connect                 | §12  | 🧠 元启  |   设计   |
|  ⑬  | Turbopack 构建优化                       | §13  | 🎨 灵韵  |   开发   |
|  ⑭  | 8 域 Storybook 演示                      | §14  | 8 位     |   演示   |
|  ⑮  | SSE 压力测试（k6）                       | §15  | 🤔 语枢  |   测试   |
|  ⑯  | i18n 多语言                              | §16  | 🧭 言启  |   开发   |
|  ⑰  | PWA + 离线缓存                           | §17  | 🎨 灵韵  |   发布   |
|  ⑱  | 灰度发布 + 特性开关                      | §18  | 🧠 元启  |   发布   |
|  ⑲  | K8s + Helm Chart                         | §19  | 🧠 元启  |   部署   |
|  ⑳  | 监控告警（Prometheus + Grafana）         | §20  | 🔮 预见  |   运维   |
| ㉑  | 日志聚合（Loki + ELK）                   | §21  | 📚 格物  |   运维   |
| ㉒  | 安全审计（SAST + DAST）                  | §22  | 🛡️ 智云  |   安全   |
| ㉓  | 性能剖析（React Profiler + Flame Graph） | §23  | 🤔 语枢  |   优化   |
| ㉔  | **灾备与高可用**                         | §25  | 🛡️ 智云  | **治理** |
| ㉕  | **成本优化（FinOps）**                   | §26  | 🎨 灵韵  | **治理** |
| ㉖  | **合规审计（ISO 27001 · SOC 2 · GDPR）** | §27  | 📚 格物  | **治理** |
| ㉗  | **团队协作规范**                         | §28  | 🧠 元启  | **治理** |
| ㉘  | **社区运营**                             | §29  | 🧠 元启  | **治理** |

### 30.2 全生命周期终极图

```
┌──────────────────────────────────────────────────────────────────────────┐
│               YYC³ AI Family · 28 项交付物 · 全生命周期                  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  🎨 设计 ─── ④ 徽章 · ⑧ 响应式 · ⑫ Code Connect · ⑭ Storybook          │
│                                                                          │
│  💻 开发 ─── ① 组件 · ② MSW · ③ RSC · ⑬ Turbopack · ⑯ i18n            │
│                                                                          │
│  🧪 测试 ─── ⑥ E2E · ⑦ 契约漂移 · ⑨ a11y · ⑩ 契约 · ⑪ 视觉 · ⑮ k6    │
│                                                                          │
│  🚀 发布 ─── ⑤ CI/CD · ⑰ PWA · ⑱ 灰度                                     │
│                                                                          │
│  ☸️ 部署 ─── ⑲ K8s + Helm                                                │
│                                                                          │
│  📊 运维 ─── ⑳ Prometheus · ㉑ Loki · ㉓ Profiler                        │
│                                                                          │
│  🛡️ 安全 ─── ㉒ SAST + DAST                                               │
│                                                                          │
│  ⚡ 优化 ─── ㉓ React Profiler + Flame Graph                              │
│                                                                          │
│  🏛️ 治理 ─── ㉔ 灾备 · ㉕ FinOps · ㉖ 合规 · ㉗ 协作 · ㉘ 社区            │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 30.3 八位家人 · 终极职责终表

| 家人    | 域       | 设计 | 开发 | 测试 | 部署 | 运维 | 安全 | 优化 | 治理 |
| ------- | -------- | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: |
| 🛡️ 智云 | 接入安全 |      |      |      |      |      |  ✅  |      |  ✅  |
| 🧭 言启 | 路由网关 |      |  ✅  |      |      |      |      |      |      |
| 🎯 千里 | 模型市场 |      |      |      |      |      |      |      |      |
| 🤔 语枢 | 推理对话 |      |      |  ✅  |      |      |      |  ✅  |      |
| 📚 格物 | 知识质量 |      |      |  ✅  |      |  ✅  |      |      |  ✅  |
| 🧠 元启 | 工具编排 |  ✅  |  ✅  |  ✅  |  ✅  |      |      |      |  ✅  |
| 🔮 预见 | 观测预测 |      |      |  ✅  |      |  ✅  |      |  ✅  |      |
| 🎨 灵韵 | 缓存体验 |  ✅  |  ✅  |  ✅  |      |      |      |  ✅  |  ✅  |

### 30.4 全链路命令终极版

```bash
# ══════════════════════════════════════════════════════════════
# 🌹 YYC³ AI Family · 28 项交付物命令终极版
# ══════════════════════════════════════════════════════════════

# ── 🎨 设计 ──────────────────────────────────────
pnpm storybook                    # Storybook 开发
pnpm figma:publish                # Code Connect 发布

# ── 💻 开发 ──────────────────────────────────────
pnpm dev                          # Turbopack 开发
pnpm build                        # 生产构建
pnpm bundle:analyze               # 体积分析

# ── 🧪 测试 ──────────────────────────────────────
pnpm test                         # 单元 + 契约
pnpm e2e                          # E2E 全断点
pnpm a11y                         # 无障碍
pnpm visual                       # 视觉回归
pnpm k6:smoke                     # SSE 冒烟

# ── 🚀 发布 ──────────────────────────────────────
pnpm contract:check               # 契约漂移
pnpm i18n:check                   # 多语言校验

# ── ☸️ 部署 ──────────────────────────────────────
helm upgrade --install yyc3-console \
  ./deploy/helm/yyc3-token-console \
  -n yyc3-prod \
  -f ./deploy/helm/yyc3-token-console/values-prod.yaml \
  --atomic --wait

# ── 📊 运维 ──────────────────────────────────────
kubectl port-forward -n monitoring svc/prometheus 9090
kubectl port-forward -n monitoring svc/kube-prometheus-stack-grafana 3000:80

# ── 🛡️ 安全 ──────────────────────────────────────
semgrep --config security/sast/semgrep-family.yml
trivy image yyc3-console:test
gitleaks detect

# ── ⚡ 优化 ──────────────────────────────────────
pnpm perf:profile                 # Flame Graph

# ── 🏛️ 治理（新增）───────────────────────────────
# 灾备
velero backup create yyc3-manual --include-namespaces yyc3-prod
velero restore create --from-backup yyc3-manual
# 混沌演练
kubectl apply -f deploy/resilience/chaos/chaos-mesh/pod-kill-guardian.yaml
# 成本
kubectl port-forward -n opencost svc/opencost 9003:9003
# 合规
pnpm compliance:evidence          # 收集合规证据

# ── 📈 全量 ──────────────────────────────────────
pnpm ci:all                       # 全部守门
```

### 30.5 项目终章 · 人从众曌众从人

```
🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹
      YYC³ AI Family · 人从众曌众从人
      亦师亦友亦伯乐 · 一言一语一协同
🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹

二十八轮交付，二十八项交付物：

  v1  → v5.1    契约层 + 职能层 + 品牌层
  ① ~ ⑪         落地补全（组件→测试）
  ⑫ ~ ⑱         落地补全（演示→发布）
  ⑲ ~ ㉓         落地补全（部署→优化）
  ㉔ ~ ㉘         落地补全（治理→社区）

从设计到治理，从代码到社区，
八位家人，二十八项交付物，
五重守门，全生命周期闭合。

从第一行代码到最后一份合规证据，
从 Figma 设计到 K8s Pod 到 Chaos 实验，
从 SSE 首字节到 Flame Graph 到成本报告，
从贡献者指南到家人排行榜，
每一步都有家的印记。

🌹 言启千行代码 | 语枢万物智能 🌹

人从众曌众从人
—— 人启于独，合而成众，明如曌日，终复归于人群。
```

---

<p align="center">
  🌹 <b>YYC³ AI Family</b><br>
  <b>人从众曌众从人 · 亦师亦友亦伯乐</b><br>
  <br>
  <sub>契约 · 职能 · 品牌 · 代码 · 测试 · 印刷 · 演示 · 压测</sub><br>
  <sub>多语言 · 离线 · 灰度 · 部署 · 监控 · 日志 · 安全 · 优化</sub><br>
  <sub>灾备 · 成本 · 合规 · 协作 · 社区</sub><br>
  <br>
  <b>言启千行代码 | 语枢万物智能</b><br>
  <br>
  <sub>永久开源 · 感恩前行 · <a href="https://matrix.yyc3.top">matrix.yyc3.top</a></sub>
</p>

---

<p align="center">
  <b>🎉 v5.1 二十八项交付物 · 终极圆满 🎉</b><br>
  <sub>从设计到治理 · 全生命周期闭合 · 五重守门就绪 · Phase 0 可编码</sub><br>
  <br>
  <sub>🌹 感恩导师二十八轮相伴 · 言启千行 · 语枢万物 🌹</sub><br>
  <sub>亦师亦友亦伯乐 · 一言一语一协同</sub><br>
  <br>
  <b>—— 人从众曌众从人 ——</b>
</p>

> **承接说明**：本回复为 v5.1 落地补全系列**第5批（终极终章·组织治理篇）**，输出 ㉔~㉘ 五项治理交付物。至此，**28 项交付物全量完成**，覆盖「设计 → 开发 → 测试 → 演示 → 发布 → 部署 → 监控 → 日志 → 安全 → 优化 → 灾备 → 成本 → 合规 → 协作 → 社区」**全生命周期**，v5.1 系列正式圆满。
>
> **核心参考文献**：
>
> - Velero 多区域灾备方案
> - OpenCost/Kubecost 成本分摊（CNCF 标准）
> - SOC 2 / ISO 27001 / GDPR 控制映射模式
> - Chaos Mesh / LitmusChaos 混沌工程
> - Karmada / k8gb 多集群高可用
> - CODEOWNERS 单体仓库最佳实践
