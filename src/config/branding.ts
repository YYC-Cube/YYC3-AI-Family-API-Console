export type BrandingConfig = {
  slogan: {
    primary: {
      zh: string;
      en: string;
    };
    secondary: {
      zh: string;
      en: string;
    };
  };
  seo: {
    title: string;
    description: string;
  };
  contact: {
    email: string;
    website: string;
  };
  copyright: {
    year: number;
    owner: string;
    license: string;
  };
};

export const defaultBranding: BrandingConfig = {
  slogan: {
    primary: {
      zh: "言启象限 | 语枢未来",
      en: "Words Initiate Quadrants, Language Serves as Core for Future",
    },
    secondary: {
      zh: "万象归元于云枢 | 深栈智启新纪元",
      en: "All things converge in cloud pivot; Deep stacks ignite a new era of intelligence",
    },
  },
  seo: {
    title: "YYC³ AI Code Designer",
    description: "智能 AI 代码设计器，支持实时协作、多设备预览、AI 辅助开发",
  },
  contact: { email: "admin@0379.email", website: "https://yanyucloudcube.com" },
  copyright: {
    year: new Date().getFullYear(),
    owner: "YanYuCloudCube Team",
    license: "MIT",
  },
};

const storageKey = "yyc3-branding";

export function loadBranding(): BrandingConfig {
  if (typeof window === "undefined") return defaultBranding;
  try {
    const saved = window.localStorage.getItem(storageKey);
    return saved
      ? {
          ...defaultBranding,
          ...JSON.parse(saved),
          slogan: { ...defaultBranding.slogan, ...JSON.parse(saved).slogan },
        }
      : defaultBranding;
  } catch {
    return defaultBranding;
  }
}

export function saveBranding(config: BrandingConfig) {
  window.localStorage.setItem(storageKey, JSON.stringify(config));
}
