export type ModelAsset = {
  name: string
  family: string
  location: "yyc3-22 主开发机" | "yyc3-45 NAS"
  path: string
  capability: string
}

export const modelAssets: ModelAsset[] = [
  {
    name: "YYC3-Family-Coder-14B-F16.gguf",
    family: "YYC3 Family",
    location: "yyc3-22 主开发机",
    path: "/Users/yanyu/models/YYC3-Family-Coder-14B-F16.gguf",
    capability: "代码",
  },
  {
    name: "YYC3-Family-Coder-14B-Q4_K_M.gguf",
    family: "YYC3 Family",
    location: "yyc3-22 主开发机",
    path: "/Users/yanyu/models/YYC3-Family-Coder-14B-Q4_K_M.gguf",
    capability: "代码",
  },
  {
    name: "MiniMax-H3-NF4",
    family: "MiniMax",
    location: "yyc3-22 主开发机",
    path: "/Volumes/Max/models/MiniMax-H3-NF4",
    capability: "通用推理",
  },
  {
    name: "MiniCPM-V-4.6",
    family: "MiniCPM",
    location: "yyc3-22 主开发机",
    path: "/Volumes/Max/models/MiniCPM-V-4.6",
    capability: "视觉语言",
  },
  {
    name: "GLM-5.3-Flash",
    family: "GLM",
    location: "yyc3-22 主开发机",
    path: "/Volumes/Max/models/GLM/GLM-5.3-Flash",
    capability: "通用推理",
  },
  {
    name: "Nemotron-3.5-Content-Safety",
    family: "NVIDIA",
    location: "yyc3-22 主开发机",
    path: "/Volumes/Max/models/NVIDIA/Nemotron-3.5-Content-Safety",
    capability: "内容安全",
  },
  {
    name: "Qwen3-Coder-30B-A3B-Q4",
    family: "Qwen",
    location: "yyc3-22 主开发机",
    path: "/Volumes/Max/models/Qwen/Qwen3-Coder-30B-A3B-Q4",
    capability: "代码",
  },
  {
    name: "Qwen3-Embedding-8B",
    family: "Qwen",
    location: "yyc3-22 主开发机",
    path: "/Volumes/Max/models/Qwen/Qwen3-Embedding-8B",
    capability: "嵌入",
  },
  {
    name: "Qwen3-Reranker-8B",
    family: "Qwen",
    location: "yyc3-22 主开发机",
    path: "/Volumes/Max/models/Qwen/Qwen3-Reranker-8B",
    capability: "重排",
  },
  {
    name: "Qwen3.5-397B-A17B",
    family: "Qwen",
    location: "yyc3-45 NAS",
    path: "/Volume1/yyc3_hd/data/Qwen/Qwen3.5-397B-A17B",
    capability: "通用推理",
  },
  {
    name: "DeepSeek-V4-Pro",
    family: "DeepSeek",
    location: "yyc3-45 NAS",
    path: "/Volume1/yyc3_hd/data/DeepSeek/DeepSeek-V4-Pro",
    capability: "通用推理",
  },
  {
    name: "GLM-5.1-FP8",
    family: "GLM",
    location: "yyc3-45 NAS",
    path: "/Volume1/yyc3_hd/data/GLM/GLM-5.1-FP8",
    capability: "通用推理",
  },
  {
    name: "Kimi-K2.6",
    family: "Kimi",
    location: "yyc3-45 NAS",
    path: "/Volume1/yyc3_hd/data/Kimi-K2.6",
    capability: "多模态",
  },
  {
    name: "Ring-2.6-1T",
    family: "Ring",
    location: "yyc3-45 NAS",
    path: "/Volume1/yyc3_hd/data/Ring-2.6-1T",
    capability: "通用推理",
  },
]

export const nimCategories = [
  ["大语言模型", 32],
  ["多模态与视觉语言", 18],
  ["RAG 知识库组件", 21],
  ["语音音频", 15],
  ["图像生成与编辑", 9],
  ["视频与媒体处理", 10],
  ["生物科技与药物发现", 13],
  ["自动驾驶与物理 AI", 9],
  ["安全合规模型", 8],
  ["行业专用工具", 3],
] as const
