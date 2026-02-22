"use client";

import { Sidebar } from "@/components/sidebar/Sidebar";
import type { MenuItem } from "@/components/sidebar/types";

import {
  Users,
  Settings,
  FileText,
  BarChart,
  Package,
  Inbox,
  Calendar,
  MessageSquare,
  Bell,
  Shield,
  CreditCard,
  Database,
  GitBranch,
  Globe,
  Lock,
  Zap,
  Target,
  Briefcase,
} from "lucide-react";

export const menuItems: MenuItem[] = [
  // =============================================================================
  // 1. SIMPLE LINK - No children, just navigates
  // =============================================================================
  {
    id: "dashboard",
    title: "Dashboard",
    path: "/dashboard",
    icon: BarChart,
    section: "Main",
    hotkey: "mod+d",
  },

  // =============================================================================
  // 2. SIMPLE LINK WITH BADGE - Shows notification count
  // =============================================================================
  {
    id: "inbox",
    title: "Inbox",
    path: "/inbox",
    icon: Inbox,
    section: "Main",
    badge: 12,
    hotkey: "mod+i",
  },

  // =============================================================================
  // 3. DROPDOWN MENU - Has children, expands inline (no useSecondary)
  // =============================================================================
  {
    id: "users",
    title: "Users",
    path: "/users",
    icon: Users,
    section: "Admin",
    children: [
      {
        title: "All Users",
        path: "/users/all",
        icon: Users,
      },
      {
        title: "Active Users",
        path: "/users/active",
        icon: Users,
      },
      {
        title: "Pending Users",
        path: "/users/pending",
        icon: Users,
        badge: 5,
      },
    ],
  },

  // =============================================================================
  // 4. SECONDARY SIDEBAR - Explicitly uses secondary sidebar (useSecondary: true)
  // =============================================================================
  {
    id: "products",
    title: "Products",
    path: "/products",
    icon: Package,
    section: "Inventory",
    useSecondary: true,
    children: [
      {
        title: "All Products",
        path: "/products/all",
        icon: Package,
      },
      {
        title: "Categories",
        path: "/products/categories",
        icon: Package,
      },
      {
        title: "Stock Alerts",
        path: "/products/stock-alerts",
        icon: Bell,
        badge: 3,
      },
    ],
  },

  // =============================================================================
  // 5. DEEPLY NESTED - Automatically uses secondary sidebar (hasDeepChildren)
  // =============================================================================
  {
    id: "settings",
    title: "Settings",
    path: "/settings",
    icon: Settings,
    section: "Configuration",
    hotkey: "mod+,",
    children: [
      {
        title: "General",
        path: "/settings/general",
        icon: Settings,
      },
      {
        title: "Security",
        path: "/settings/security",
        icon: Shield,
        children: [
          {
            title: "Authentication",
            path: "/settings/security/authentication",
            icon: Lock,
          },
          {
            title: "API Keys",
            path: "/settings/security/api-keys",
            icon: Lock,
          },
          {
            title: "Audit Logs",
            path: "/settings/security/audit-logs",
            icon: FileText,
          },
        ],
      },
      {
        title: "Billing",
        path: "/settings/billing",
        icon: CreditCard,
        children: [
          {
            title: "Plans",
            path: "/settings/billing/plans",
            icon: CreditCard,
          },
          {
            title: "Invoices",
            path: "/settings/billing/invoices",
            icon: FileText,
          },
          {
            title: "Payment Methods",
            path: "/settings/billing/payment-methods",
            icon: CreditCard,
          },
        ],
      },
    ],
  },

  // =============================================================================
  // 6. PERMISSION-BASED - Only visible if user has permission
  // =============================================================================
  {
    id: "admin-panel",
    title: "Admin Panel",
    path: "/admin",
    icon: Shield,
    section: "Admin",
    permission: {
      action: "manage",
      subject: "Admin",
    },
    children: [
      {
        title: "System Logs",
        path: "/admin/logs",
        icon: FileText,
      },
      {
        title: "Database",
        path: "/admin/database",
        icon: Database,
      },
    ],
  },

  // =============================================================================
  // 7. DISABLED ITEM - Visible but not clickable
  // =============================================================================
  {
    id: "reports-disabled",
    title: "Reports (Coming Soon)",
    path: "#",
    icon: FileText,
    section: "Analytics",
    disabled: true,
  },

  // =============================================================================
  // 8. MULTIPLE SECTIONS - Items in different sections
  // =============================================================================
  {
    id: "calendar",
    title: "Calendar",
    path: "/calendar",
    icon: Calendar,
    section: "Productivity",
    hotkey: "mod+k",
  },
  {
    id: "messages",
    title: "Messages",
    path: "/messages",
    icon: MessageSquare,
    section: "Productivity",
    badge: 7,
  },

  // =============================================================================
  // 9. COMPLEX NESTED WITH MIXED FEATURES
  // =============================================================================
  {
    id: "integrations",
    title: "Integrations",
    path: "/integrations",
    icon: Zap,
    section: "Tools",
    badge: "New",
    useSecondary: true,
    children: [
      {
        title: "Connected Apps",
        path: "/integrations/connected",
        icon: Globe,
      },
      {
        title: "API",
        path: "/integrations/api",
        icon: GitBranch,
        children: [
          {
            title: "REST API",
            path: "/integrations/api/rest",
            icon: GitBranch,
          },
          {
            title: "GraphQL",
            path: "/integrations/api/graphql",
            icon: GitBranch,
          },
          {
            title: "Webhooks",
            path: "/integrations/api/webhooks",
            icon: Zap,
            badge: 2,
          },
        ],
      },
      {
        title: "OAuth Apps",
        path: "/integrations/oauth",
        icon: Lock,
      },
    ],
  },

  // =============================================================================
  // 10. ITEM WITHOUT SECTION (Goes to "General")
  // =============================================================================
  {
    id: "projects",
    title: "Projects",
    path: "/projects",
    icon: Briefcase,
    hotkey: "mod+p",
    children: [
      {
        title: "Active Projects",
        path: "/projects/active",
        icon: Target,
      },
      {
        title: "Archived Projects",
        path: "/projects/archived",
        icon: Package,
      },
    ],
  },

  // =============================================================================
  // 11. SIMPLE LINK WITH ALL FEATURES
  // =============================================================================
  {
    id: "notifications",
    title: "Notifications",
    path: "/notifications",
    icon: Bell,
    section: "Main",
    badge: 99,
    hotkey: "mod+n",
    permission: {
      action: "read",
      subject: "Notifications",
    },
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <Sidebar
      menuItems={menuItems}
      title="Turf Demo"
      homeLink="/admin/users"
      showOrganizationSwitcher={false}
    >
      {children}
    </Sidebar>
  );
}
