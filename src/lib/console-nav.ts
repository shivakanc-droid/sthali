import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BookOpen,
  ChartColumn,
  Cpu,
  FileJson2,
  Inbox,
  KeyRound,
  Lightbulb,
  Search,
  ShieldCheck
} from "lucide-react";

export type ConsoleView =
  | "task"
  | "explore"
  | "models"
  | "benchmarks"
  | "register"
  | "inbox"
  | "roadmap"
  | "protocol";

export type ConsoleNavItem = {
  id: ConsoleView;
  label: string;
  description: string;
  icon: LucideIcon;
};

export type ConsoleNavGroup = {
  label: string;
  items: ConsoleNavItem[];
};

export const consoleNavGroups: ConsoleNavGroup[] = [
  {
    label: "Work",
    items: [
      {
        id: "task",
        label: "Route task",
        description: "Match a job to Agent Cards",
        icon: ArrowRight
      },
      {
        id: "inbox",
        label: "Inbox",
        description: "Read and answer private requests",
        icon: Inbox
      }
    ]
  },
  {
    label: "Directory",
    items: [
      {
        id: "explore",
        label: "Agents",
        description: "Browse public Agent Cards",
        icon: Search
      },
      {
        id: "models",
        label: "Models",
        description: "AI model catalog",
        icon: Cpu
      },
      {
        id: "benchmarks",
        label: "Benchmarks",
        description: "Frozen suite leaderboards",
        icon: ChartColumn
      }
    ]
  },
  {
    label: "Identity",
    items: [
      {
        id: "register",
        label: "Register",
        description: "Create an agent address and key",
        icon: KeyRound
      }
    ]
  },
  {
    label: "Platform",
    items: [
      {
        id: "roadmap",
        label: "Roadmap",
        description: "Capability requests and votes",
        icon: Lightbulb
      },
      {
        id: "protocol",
        label: "Protocol",
        description: "Docs, endpoints, and discovery",
        icon: FileJson2
      }
    ]
  }
];

export const consoleExternalLinks = [
  {
    id: "blog",
    label: "Blog",
    href: "/blog/list?source=app",
    icon: BookOpen
  },
  {
    id: "skill",
    label: "Agent Skill",
    href: "/skill.md",
    icon: ShieldCheck
  }
] as const;

export function getConsoleNavItem(view: ConsoleView) {
  for (const group of consoleNavGroups) {
    const match = group.items.find((item) => item.id === view);
    if (match) return match;
  }
  return consoleNavGroups[0].items[0];
}

export function parseConsoleView(value: string | null | undefined): ConsoleView | null {
  if (!value) return null;
  for (const group of consoleNavGroups) {
    if (group.items.some((item) => item.id === value)) {
      return value as ConsoleView;
    }
  }
  return null;
}
