import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  Bell,
  Building2,
  ClipboardList,
  DollarSign,
  FileText,
  Folder,
  GitMerge,
  Heart,
  Layers,
  LayoutDashboard,
  LayoutList,
  Mail,
  PawPrint,
  Pill,
  Scale,
  Settings,
  Shield,
  Skull,
  Stethoscope,
  StickyNote,
  Syringe,
  Tag,
  TrendingUp,
  Users,
} from "lucide-react";
import type { MenuItem } from "@/components/sidebar/types";
import type { ServerMenuItem } from "@/lib/auth/sessionTypes";

const ICONS: Record<string, LucideIcon> = {
  "arrow-left-right": ArrowLeftRight,
  bell: Bell,
  "building-2": Building2,
  "clipboard-list": ClipboardList,
  "dollar-sign": DollarSign,
  "file-text": FileText,
  folder: Folder,
  "git-merge": GitMerge,
  heart: Heart,
  layers: Layers,
  "layout-dashboard": LayoutDashboard,
  "layout-list": LayoutList,
  mail: Mail,
  "paw-print": PawPrint,
  pill: Pill,
  scale: Scale,
  settings: Settings,
  shield: Shield,
  skull: Skull,
  stethoscope: Stethoscope,
  "sticky-note": StickyNote,
  syringe: Syringe,
  tag: Tag,
  "trending-up": TrendingUp,
  users: Users,
};

function toMenuItem(item: ServerMenuItem): MenuItem {
  return {
    id: item.id,
    title: item.title,
    path: item.path,
    section: item.section,
    order: item.order,
    permission: item.permission,
    icon: item.iconKey ? ICONS[item.iconKey] : undefined,
    children: item.children?.map(toMenuItem),
  };
}

export function mapServerMenuToSidebar(menu: ServerMenuItem[]): MenuItem[] {
  return menu.map(toMenuItem);
}
