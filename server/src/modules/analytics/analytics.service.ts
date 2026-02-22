import { and, asc, desc, eq, gte, lte, sql, type SQL } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { db } from "../../db/index.js";
import { analyticsEvents } from "./analytics.schema.js";

export interface AnalyticsRange {
  start?: Date;
  end?: Date;
}

export interface AnalyticsFilters extends AnalyticsRange {
  tenantId?: string;
  eventType?: string;
  userId?: string;
  sessionId?: string;
  path?: string;
}

function asNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildBaseWhere(filters: AnalyticsFilters, forceTenantId?: string) {
  const where: SQL<unknown>[] = [];

  const tenantId = forceTenantId || filters.tenantId;
  if (tenantId) {
    where.push(eq(analyticsEvents.tenantId, tenantId));
  }
  if (filters.start) {
    where.push(gte(analyticsEvents.timestamp, filters.start));
  }
  if (filters.end) {
    where.push(lte(analyticsEvents.timestamp, filters.end));
  }
  if (filters.eventType) {
    where.push(eq(analyticsEvents.eventType, filters.eventType));
  }
  if (filters.userId) {
    where.push(eq(analyticsEvents.userId, filters.userId));
  }
  if (filters.sessionId) {
    where.push(eq(analyticsEvents.sessionId, filters.sessionId));
  }
  if (filters.path) {
    where.push(sql`${analyticsEvents.eventData} ->> 'path' ILIKE ${`%${filters.path}%`}`);
  }

  return where;
}

export class AnalyticsService {
  async trackEvent(payload: {
    tenantId?: string;
    eventType: string;
    eventData?: Record<string, unknown>;
    userId?: string;
    sessionId?: string;
    ip?: string;
    timestamp?: Date | string;
  }) {
    const id = uuidv7();
    await db.insert(analyticsEvents).values({
      id,
      tenantId: payload.tenantId,
      eventType: payload.eventType,
      eventData: payload.eventData ?? {},
      userId: payload.userId,
      sessionId: payload.sessionId,
      ip: payload.ip,
      timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
    });
    return id;
  }

  async trackBatch(
    events: Array<{
      tenantId?: string;
      eventType: string;
      eventData?: Record<string, unknown>;
      userId?: string;
      sessionId?: string;
      ip?: string;
      timestamp?: Date | string;
    }>,
  ) {
    if (!events.length) return 0;

    await db.insert(analyticsEvents).values(
      events.map((event) => ({
        id: uuidv7(),
        tenantId: event.tenantId,
        eventType: event.eventType,
        eventData: event.eventData ?? {},
        userId: event.userId,
        sessionId: event.sessionId,
        ip: event.ip,
        timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
      })),
    );

    return events.length;
  }

  async getDashboardMetrics(tenantId: string, filters: AnalyticsFilters = {}) {
    return this.getDashboardMetricsInternal(filters, tenantId);
  }

  async getGlobalDashboard(filters: AnalyticsFilters = {}) {
    return this.getDashboardMetricsInternal(filters);
  }

  private async getDashboardMetricsInternal(filters: AnalyticsFilters, tenantId?: string) {
    const whereClause = buildBaseWhere(filters, tenantId);
    const where = whereClause.length ? and(...whereClause) : undefined;

    const eventCountsRows = await db
      .select({
        eventType: analyticsEvents.eventType,
        count: sql`count(*)`,
      })
      .from(analyticsEvents)
      .where(where)
      .groupBy(analyticsEvents.eventType);

    const [totalsRow] = await db
      .select({
        totalEvents: sql`coalesce(count(*), 0)`,
        uniqueUsers: sql`coalesce(count(distinct ${analyticsEvents.userId}) filter (where ${analyticsEvents.userId} is not null), 0)`,
        uniqueSessions: sql`coalesce(count(distinct ${analyticsEvents.sessionId}) filter (where ${analyticsEvents.sessionId} is not null), 0)`,
      })
      .from(analyticsEvents)
      .where(where);

    const trendDailyRows = await db
      .select({
        date: sql<string>`to_char(date_trunc('day', ${analyticsEvents.timestamp}), 'YYYY-MM-DD')`,
        count: sql`count(*)`,
      })
      .from(analyticsEvents)
      .where(where)
      .groupBy(sql`date_trunc('day', ${analyticsEvents.timestamp})`)
      .orderBy(asc(sql`date_trunc('day', ${analyticsEvents.timestamp})`));

    const heatmapData = await this.getHeatmapData(tenantId ?? null, {
      start: filters.start,
      end: filters.end,
      eventType: filters.eventType,
      path: filters.path,
      userId: filters.userId,
      sessionId: filters.sessionId,
    });

    const [tenantCountRow] = await db
      .select({
        tenantCount: sql`coalesce(count(distinct ${analyticsEvents.tenantId}), 0)`,
      })
      .from(analyticsEvents)
      .where(where);

    return {
      eventCounts: eventCountsRows.reduce<Record<string, number>>((acc, row) => {
        acc[row.eventType] = asNumber(row.count);
        return acc;
      }, {}),
      totalEvents: asNumber(totalsRow?.totalEvents),
      uniqueUsers: asNumber(totalsRow?.uniqueUsers),
      uniqueSessions: asNumber(totalsRow?.uniqueSessions),
      topEventTypes: eventCountsRows
        .map((row) => ({ eventType: row.eventType, count: asNumber(row.count) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      trendDaily: trendDailyRows.map((row) => ({
        date: row.date,
        count: asNumber(row.count),
      })),
      heatmapData,
      tenantCount: asNumber(tenantCountRow?.tenantCount),
    };
  }

  async getHeatmapData(tenantId: string | null, filters: AnalyticsFilters = {}) {
    const whereClause = buildBaseWhere(filters, tenantId ?? undefined);

    const rows = await db
      .select({
        day: sql`extract(dow from ${analyticsEvents.timestamp})`,
        hour: sql`extract(hour from ${analyticsEvents.timestamp})`,
        count: sql`count(*)`,
      })
      .from(analyticsEvents)
      .where(whereClause.length ? and(...whereClause) : undefined)
      .groupBy(sql`extract(dow from ${analyticsEvents.timestamp})`, sql`extract(hour from ${analyticsEvents.timestamp})`)
      .orderBy(asc(sql`extract(dow from ${analyticsEvents.timestamp})`), asc(sql`extract(hour from ${analyticsEvents.timestamp})`));

    return rows.map((row) => ({
      day: asNumber(row.day),
      hour: asNumber(row.hour),
      count: asNumber(row.count),
    }));
  }

  async getFunnelData(tenantId: string | null, filters: AnalyticsFilters = {}) {
    const whereClause = buildBaseWhere(filters, tenantId ?? undefined);

    const [row] = await db
      .select({
        pageViews: sql`coalesce(count(*) filter (where ${analyticsEvents.eventType} = 'PAGE_VIEW'), 0)`,
        impressions: sql`coalesce(count(*) filter (where ${analyticsEvents.eventType} = 'IMPRESSION'), 0)`,
        ctaClicks: sql`coalesce(count(*) filter (where ${analyticsEvents.eventType} = 'CTA_CLICK'), 0)`,
      })
      .from(analyticsEvents)
      .where(whereClause.length ? and(...whereClause) : undefined);

    return {
      pageViews: asNumber(row?.pageViews),
      impressions: asNumber(row?.impressions),
      ctaClicks: asNumber(row?.ctaClicks),
    };
  }

  async getLeadTimeMetrics(tenantId: string | null, filters: AnalyticsFilters = {}) {
    const whereClause = buildBaseWhere(filters, tenantId ?? undefined);

    const sessionDepthRows = await db
      .select({
        sessionId: analyticsEvents.sessionId,
        eventCount: sql`count(*)`,
      })
      .from(analyticsEvents)
      .where(
        whereClause.length
          ? and(...whereClause, sql`${analyticsEvents.sessionId} is not null`)
          : sql`${analyticsEvents.sessionId} is not null`,
      )
      .groupBy(analyticsEvents.sessionId)
      .orderBy(desc(sql`count(*)`));

    const buckets: Record<string, number> = {
      "1": 0,
      "2-3": 0,
      "4-7": 0,
      "8-15": 0,
      "16+": 0,
    };

    for (const row of sessionDepthRows) {
      const n = asNumber(row.eventCount);
      if (n <= 1) buckets["1"] += 1;
      else if (n <= 3) buckets["2-3"] += 1;
      else if (n <= 7) buckets["4-7"] += 1;
      else if (n <= 15) buckets["8-15"] += 1;
      else buckets["16+"] += 1;
    }

    return Object.entries(buckets).map(([bucket, sessions]) => ({ bucket, sessions }));
  }
}
