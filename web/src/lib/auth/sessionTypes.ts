import type { RawRuleOf } from "@casl/ability";
import type { AppAbility } from "@/lib/casl";

export interface ServerMenuPermission {
  action: string;
  subject: string;
}

export interface ServerMenuItem {
  moduleKey: string;
  id: string;
  title: string;
  path: string;
  section?: string;
  iconKey?: string;
  order?: number;
  permission?: ServerMenuPermission;
  children?: ServerMenuItem[];
}

export interface TenantSessionData {
  user: {
    id: string;
    name: string;
    email: string;
    tenantId: string;
    roleId: string;
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
    status: string;
  };
  role: {
    id: string;
    name: string;
    slug: string;
  } | null;
  impersonator?: {
    adminId: string;
  } | null;
  permissions: RawRuleOf<AppAbility>[];
  navigation: ServerMenuItem[];
}

export interface PlatformSessionData {
  user: {
    id: string;
    name: string;
    email: string;
  };
  role: {
    slug: string;
    name: string;
  };
  permissions: RawRuleOf<AppAbility>[];
  navigation: ServerMenuItem[];
  session: {
    id: string;
    expiresAt: string;
  };
}
