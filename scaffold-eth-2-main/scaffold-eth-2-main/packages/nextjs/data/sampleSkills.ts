import { SkillItem } from "~~/hooks/useSkillsData";

const toTimestamp = (isoDate: string) => new Date(isoDate).getTime();

export const SAMPLE_SKILLS: SkillItem[] = [
  {
    tokenId: 900000000000001n,
    tokenURI: "demo://skill/meta-creative-coach",
    listed: true,
    price: 180000000000000000n,
    priceEth: 0.18,
    creator: "0xDEMO000000000000000000000000000000000001",
    owner: "0xDEMO000000000000000000000000000000000001",
    metadata: {
      name: "AI 创意脚本教练",
      description: "快速生成短视频、直播脚本，并根据观众反馈实时优化叙事节奏的智能技能包。",
      category: "creative",
      tags: ["短视频", "文案", "脚本", "AI助手"],
      keywords: ["creative", "script", "ai", "video"],
      license: "CC BY 4.0",
      createdAt: "2024-04-18T09:00:00.000Z",
      mediaUrl:
        "https://images.unsplash.com/photo-1483478550801-ceba5fe50e8e?auto=format&fit=crop&w=1200&q=80",
    },
    category: "creative",
    tags: ["短视频", "文案", "脚本", "AI助手"],
    keywords: ["creative", "script", "ai", "video"],
    createdTimestamp: toTimestamp("2024-04-18T09:00:00.000Z"),
    popularityScore: 340,
    isDemo: true,
  },
  {
    tokenId: 900000000000002n,
    tokenURI: "demo://skill/multilingual-support-copilot",
    listed: true,
    price: 420000000000000000n,
    priceEth: 0.42,
    creator: "0xDEMO000000000000000000000000000000000002",
    owner: "0xDEMO000000000000000000000000000000000002",
    metadata: {
      name: "多语言客服 Copilot",
      description:
        "覆盖 9 种语言的客服对话机器人，自动总结 CRM 线索并触发 Zapier 工作流，专为跨境电商打造。",
      category: "assistant",
      tags: ["客服", "多语言", "自动化"],
      keywords: ["support", "workflow", "automation"],
      license: "商业授权",
      createdAt: "2024-05-12T10:00:00.000Z",
      mediaUrl:
        "https://images.unsplash.com/photo-1526378722484-bd91ca387e72?auto=format&fit=crop&w=1200&q=80",
    },
    category: "assistant",
    tags: ["客服", "多语言", "自动化"],
    keywords: ["support", "workflow", "automation"],
    createdTimestamp: toTimestamp("2024-05-12T10:00:00.000Z"),
    popularityScore: 410,
    isDemo: true,
  },
  {
    tokenId: 900000000000003n,
    tokenURI: "demo://skill/data-insight-engine",
    listed: false,
    price: 0n,
    priceEth: 0,
    creator: "0xDEMO000000000000000000000000000000000003",
    owner: "0xDEMO000000000000000000000000000000000003",
    metadata: {
      name: "数据洞察预测引擎",
      description:
        "基于链上数据和销售看板的多模态预测器，自动输出增长建议与风险预警，适合运营团队快速决策。",
      category: "analytics",
      tags: ["数据分析", "预测", "BI"],
      keywords: ["analytics", "prediction", "growth"],
      license: "CC BY-NC 4.0",
      createdAt: "2024-06-03T08:00:00.000Z",
      mediaUrl:
        "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80",
    },
    category: "analytics",
    tags: ["数据分析", "预测", "BI"],
    keywords: ["analytics", "prediction", "growth"],
    createdTimestamp: toTimestamp("2024-06-03T08:00:00.000Z"),
    popularityScore: 295,
    isDemo: true,
  },
  {
    tokenId: 900000000000004n,
    tokenURI: "demo://skill/solidity-audit-assistant",
    listed: true,
    price: 1500000000000000000n,
    priceEth: 1.5,
    creator: "0xDEMO000000000000000000000000000000000004",
    owner: "0xDEMO000000000000000000000000000000000004",
    metadata: {
      name: "Solidity 安全审计助手",
      description:
        "对接 Foundry 和 Slither 的自动化审计流程，一键生成风险报告及修复建议，提升 Web3 团队交付效率。",
      category: "tools",
      tags: ["审计", "安全", "Solidity"],
      keywords: ["security", "audit", "solidity"],
      license: "商业授权",
      createdAt: "2024-07-20T12:00:00.000Z",
      mediaUrl:
        "https://images.unsplash.com/photo-1545239351-7a424c1a69d1?auto=format&fit=crop&w=1200&q=80",
    },
    category: "tools",
    tags: ["审计", "安全", "Solidity"],
    keywords: ["security", "audit", "solidity"],
    createdTimestamp: toTimestamp("2024-07-20T12:00:00.000Z"),
    popularityScore: 365,
    isDemo: true,
  },
];

