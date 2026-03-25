import type { ActionAPIContext } from "astro:actions";
import { defineAction, ActionError } from "astro:actions";
import { z } from "astro:schema";
import { db, and, desc, eq, ilike, or, DictionaryEntries } from "astro:db";
import {
  maybeSendHighSignalNotification,
  pushDashboardSummary,
  shouldNotifyFirstEntry,
  shouldNotifyFirstFavorite,
} from "../lib/integrations";

const PartOfSpeechEnum = z.enum([
  "noun",
  "verb",
  "adjective",
  "adverb",
  "phrase",
  "other",
]);

function requireUser(context: ActionAPIContext) {
  const user = (context.locals as App.Locals | undefined)?.user;
  if (!user) {
    throw new ActionError({
      code: "UNAUTHORIZED",
      message: "You must be signed in to perform this action.",
    });
  }

  return user;
}

async function requireOwnedEntry(entryId: number, userId: string) {
  const [entry] = await db
    .select()
    .from(DictionaryEntries)
    .where(and(eq(DictionaryEntries.id, entryId), eq(DictionaryEntries.userId, userId)))
    .limit(1);

  if (!entry) {
    throw new ActionError({
      code: "NOT_FOUND",
      message: "Entry not found for this user.",
    });
  }

  return entry;
}

export async function listDictionaryEntries(userId: string) {
  return db
    .select()
    .from(DictionaryEntries)
    .where(eq(DictionaryEntries.userId, userId))
    .orderBy(desc(DictionaryEntries.updatedAt));
}

export async function getDictionaryEntryDetail(entryId: number, userId: string) {
  return requireOwnedEntry(entryId, userId);
}

export const server = {
  createDictionaryEntry: defineAction({
    input: z.object({
      term: z.string().trim().min(1).max(120),
      phonetic: z.string().trim().max(120).optional(),
      partOfSpeech: PartOfSpeechEnum.optional(),
      definition: z.string().trim().min(1).max(1200),
      exampleText: z.string().trim().max(800).optional(),
      category: z.string().trim().max(120).optional(),
      notes: z.string().trim().max(1200).optional(),
      synonymsText: z.string().trim().max(400).optional(),
      antonymsText: z.string().trim().max(400).optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      const now = new Date();

      const [entry] = await db
        .insert(DictionaryEntries)
        .values({
          userId: user.id,
          term: input.term,
          phonetic: input.phonetic || null,
          partOfSpeech: input.partOfSpeech || null,
          definition: input.definition,
          exampleText: input.exampleText || null,
          category: input.category || null,
          notes: input.notes || null,
          synonymsText: input.synonymsText || null,
          antonymsText: input.antonymsText || null,
          status: "active",
          isFavorite: false,
          createdAt: now,
          updatedAt: now,
          archivedAt: null,
        })
        .returning();

      if (await shouldNotifyFirstEntry(user.id)) {
        await maybeSendHighSignalNotification(user.id, "first_entry");
      }
      await pushDashboardSummary(user.id);

      return { entry };
    },
  }),

  updateDictionaryEntry: defineAction({
    input: z.object({
      id: z.number().int(),
      term: z.string().trim().min(1).max(120),
      phonetic: z.string().trim().max(120).optional(),
      partOfSpeech: PartOfSpeechEnum.optional(),
      definition: z.string().trim().min(1).max(1200),
      exampleText: z.string().trim().max(800).optional(),
      category: z.string().trim().max(120).optional(),
      notes: z.string().trim().max(1200).optional(),
      synonymsText: z.string().trim().max(400).optional(),
      antonymsText: z.string().trim().max(400).optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      await requireOwnedEntry(input.id, user.id);

      const [entry] = await db
        .update(DictionaryEntries)
        .set({
          term: input.term,
          phonetic: input.phonetic || null,
          partOfSpeech: input.partOfSpeech || null,
          definition: input.definition,
          exampleText: input.exampleText || null,
          category: input.category || null,
          notes: input.notes || null,
          synonymsText: input.synonymsText || null,
          antonymsText: input.antonymsText || null,
          updatedAt: new Date(),
        })
        .where(eq(DictionaryEntries.id, input.id))
        .returning();

      await pushDashboardSummary(user.id);
      return { entry };
    },
  }),

  archiveDictionaryEntry: defineAction({
    input: z.object({ id: z.number().int() }),
    handler: async (input, context) => {
      const user = requireUser(context);
      await requireOwnedEntry(input.id, user.id);

      const [entry] = await db
        .update(DictionaryEntries)
        .set({ status: "archived", archivedAt: new Date(), updatedAt: new Date() })
        .where(eq(DictionaryEntries.id, input.id))
        .returning();

      await pushDashboardSummary(user.id);
      return { entry };
    },
  }),

  restoreDictionaryEntry: defineAction({
    input: z.object({ id: z.number().int() }),
    handler: async (input, context) => {
      const user = requireUser(context);
      await requireOwnedEntry(input.id, user.id);

      const [entry] = await db
        .update(DictionaryEntries)
        .set({ status: "active", archivedAt: null, updatedAt: new Date() })
        .where(eq(DictionaryEntries.id, input.id))
        .returning();

      await pushDashboardSummary(user.id);
      return { entry };
    },
  }),

  toggleDictionaryEntryFavorite: defineAction({
    input: z.object({ id: z.number().int() }),
    handler: async (input, context) => {
      const user = requireUser(context);
      const current = await requireOwnedEntry(input.id, user.id);

      const [entry] = await db
        .update(DictionaryEntries)
        .set({ isFavorite: !current.isFavorite, updatedAt: new Date() })
        .where(eq(DictionaryEntries.id, input.id))
        .returning();

      if (entry.isFavorite && (await shouldNotifyFirstFavorite(user.id))) {
        await maybeSendHighSignalNotification(user.id, "first_favorite");
      }
      await pushDashboardSummary(user.id);

      return { entry };
    },
  }),

  listDictionaryEntries: defineAction({
    input: z
      .object({
        q: z.string().trim().max(120).optional(),
        status: z.enum(["active", "archived", "all"]).optional(),
        category: z.string().trim().max(120).optional(),
        favoriteOnly: z.boolean().optional(),
      })
      .optional(),
    handler: async (input, context) => {
      const user = requireUser(context);
      const filters = input ?? {};

      const whereClauses = [eq(DictionaryEntries.userId, user.id)];

      if (filters.status && filters.status !== "all") {
        whereClauses.push(eq(DictionaryEntries.status, filters.status));
      }

      if (filters.favoriteOnly) {
        whereClauses.push(eq(DictionaryEntries.isFavorite, true));
      }

      if (filters.category) {
        whereClauses.push(ilike(DictionaryEntries.category, filters.category));
      }

      if (filters.q) {
        whereClauses.push(
          or(
            ilike(DictionaryEntries.term, `%${filters.q}%`),
            ilike(DictionaryEntries.definition, `%${filters.q}%`),
            ilike(DictionaryEntries.notes, `%${filters.q}%`)
          )!
        );
      }

      const entries = await db
        .select()
        .from(DictionaryEntries)
        .where(and(...whereClauses))
        .orderBy(desc(DictionaryEntries.updatedAt));

      return { entries };
    },
  }),

  getDictionaryEntryDetail: defineAction({
    input: z.object({ id: z.number().int() }),
    handler: async (input, context) => {
      const user = requireUser(context);
      const entry = await requireOwnedEntry(input.id, user.id);
      return { entry };
    },
  }),
};
