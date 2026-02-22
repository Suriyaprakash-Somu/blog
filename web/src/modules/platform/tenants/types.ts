export interface Tenant {
  id: string;
  name: string;
  slug: string;
  ownerId?: string | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
  domain?: string;
  status: "active" | "pending" | "suspended";
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown; // Required by DataTable's RowWithId constraint
}
