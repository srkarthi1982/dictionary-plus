import { db, DictionaryEntries, desc, eq, and } from "astro:db";

const DASHBOARD_WEBHOOK_URL = import.meta.env.ANSIVERSA_DASHBOARD_WEBHOOK_URL;
const NOTIFICATION_WEBHOOK_URL = import.meta.env.ANSIVERSA_NOTIFICATIONS_WEBHOOK_URL;

export async function getDashboardSummary(userId: string) {
  const entries = await db
    .select()
    .from(DictionaryEntries)
    .where(eq(DictionaryEntries.userId, userId));

  const totalEntries = entries.length;
  const favoritesCount = entries.filter((entry) => entry.isFavorite).length;
  const categories = new Set(entries.map((entry) => entry.category?.trim()).filter(Boolean));
  const categoryCount = categories.size;
  const mostRecentlyUpdatedTerm = [...entries]
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))[0]?.term;

  return { totalEntries, favoritesCount, categoryCount, mostRecentlyUpdatedTerm };
}

export async function pushDashboardSummary(userId: string) {
  if (!DASHBOARD_WEBHOOK_URL) return;

  const summary = await getDashboardSummary(userId);

  try {
    await fetch(DASHBOARD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appId: "dictionary-plus",
        userId,
        summary,
      }),
    });
  } catch (error) {
    console.warn("dictionary-plus dashboard webhook failed", error);
  }
}

export async function maybeSendHighSignalNotification(userId: string, type: "first_entry" | "first_favorite") {
  if (!NOTIFICATION_WEBHOOK_URL) return;

  try {
    await fetch(NOTIFICATION_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appId: "dictionary-plus",
        userId,
        type,
      }),
    });
  } catch (error) {
    console.warn("dictionary-plus notification webhook failed", error);
  }
}

export async function shouldNotifyFirstEntry(userId: string) {
  const entries = await db
    .select()
    .from(DictionaryEntries)
    .where(and(eq(DictionaryEntries.userId, userId), eq(DictionaryEntries.status, "active")));

  return entries.length === 1;
}

export async function shouldNotifyFirstFavorite(userId: string) {
  const favorites = await db
    .select()
    .from(DictionaryEntries)
    .where(and(eq(DictionaryEntries.userId, userId), eq(DictionaryEntries.isFavorite, true)));

  return favorites.length === 1;
}

export async function getMostRecentlyUpdatedEntry(userId: string) {
  const [entry] = await db
    .select()
    .from(DictionaryEntries)
    .where(eq(DictionaryEntries.userId, userId))
    .orderBy(desc(DictionaryEntries.updatedAt))
    .limit(1);

  return entry;
}
