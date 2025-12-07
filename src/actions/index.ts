import type { ActionAPIContext } from "astro:actions";
import { defineAction, ActionError } from "astro:actions";
import { z } from "astro:schema";
import {
  db,
  eq,
  and,
  DictionaryEntries,
  EntryVariants,
  UserWordNotes,
  LookupHistory,
} from "astro:db";

function requireUser(context: ActionAPIContext) {
  const locals = context.locals as App.Locals | undefined;
  const user = locals?.user;

  if (!user) {
    throw new ActionError({
      code: "UNAUTHORIZED",
      message: "You must be signed in to perform this action.",
    });
  }

  return user;
}

export const server = {
  upsertEntry: defineAction({
    input: z.object({
      id: z.number().int().optional(),
      term: z.string().min(1, "Term is required"),
      language: z.string().optional(),
      lemma: z.string().optional(),
      payload: z.any().optional(),
      partOfSpeech: z.string().optional(),
      fetchedAt: z.coerce.date().optional(),
    }),
    handler: async (input) => {
      const baseValues = {
        term: input.term,
        language: input.language ?? "en",
        lemma: input.lemma,
        payload: input.payload,
        partOfSpeech: input.partOfSpeech,
        fetchedAt: input.fetchedAt ?? new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (input.id) {
        const [existing] = await db
          .select()
          .from(DictionaryEntries)
          .where(eq(DictionaryEntries.id, input.id))
          .limit(1);

        if (!existing) {
          throw new ActionError({ code: "NOT_FOUND", message: "Entry not found." });
        }

        const [entry] = await db
          .update(DictionaryEntries)
          .set(baseValues)
          .where(eq(DictionaryEntries.id, input.id))
          .returning();

        return { entry };
      }

      const [entry] = await db.insert(DictionaryEntries).values(baseValues).returning();
      return { entry };
    },
  }),

  addVariant: defineAction({
    input: z.object({
      entryId: z.number().int(),
      variant: z.string().min(1, "Variant is required"),
      variantType: z.string().optional(),
    }),
    handler: async (input) => {
      const [entry] = await db
        .select()
        .from(DictionaryEntries)
        .where(eq(DictionaryEntries.id, input.entryId))
        .limit(1);

      if (!entry) {
        throw new ActionError({ code: "NOT_FOUND", message: "Entry not found." });
      }

      const [variant] = await db
        .insert(EntryVariants)
        .values({
          entryId: input.entryId,
          variant: input.variant,
          variantType: input.variantType,
          createdAt: new Date(),
        })
        .returning();

      return { variant };
    },
  }),

  saveUserNote: defineAction({
    input: z.object({
      entryId: z.number().int(),
      tags: z.string().optional(),
      note: z.string().optional(),
      exampleSentence: z.string().optional(),
      isStarred: z.boolean().optional(),
      familiarity: z.enum(["new", "learning", "familiar", "mastered"]).optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      const [entry] = await db
        .select()
        .from(DictionaryEntries)
        .where(eq(DictionaryEntries.id, input.entryId))
        .limit(1);

      if (!entry) {
        throw new ActionError({ code: "NOT_FOUND", message: "Entry not found." });
      }

      const [existing] = await db
        .select()
        .from(UserWordNotes)
        .where(and(eq(UserWordNotes.entryId, input.entryId), eq(UserWordNotes.userId, user.id)))
        .limit(1);

      const baseValues = {
        entryId: input.entryId,
        userId: user.id,
        tags: input.tags ?? existing?.tags,
        note: input.note ?? existing?.note,
        exampleSentence: input.exampleSentence ?? existing?.exampleSentence,
        isStarred: input.isStarred ?? existing?.isStarred ?? false,
        familiarity: input.familiarity ?? existing?.familiarity ?? "new",
        createdAt: existing?.createdAt ?? new Date(),
        updatedAt: new Date(),
      };

      if (existing) {
        const [userNote] = await db
          .update(UserWordNotes)
          .set(baseValues)
          .where(eq(UserWordNotes.id, existing.id))
          .returning();

        return { userNote };
      }

      const [userNote] = await db.insert(UserWordNotes).values(baseValues).returning();
      return { userNote };
    },
  }),

  listUserNotes: defineAction({
    input: z.object({}).optional(),
    handler: async (_, context) => {
      const user = requireUser(context);

      const notes = await db
        .select()
        .from(UserWordNotes)
        .where(eq(UserWordNotes.userId, user.id));

      return { notes };
    },
  }),

  logLookup: defineAction({
    input: z.object({
      term: z.string().min(1, "Term is required"),
      language: z.string().optional(),
      entryId: z.number().int().optional(),
      source: z.string().optional(),
      context: z.string().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      const [history] = await db
        .insert(LookupHistory)
        .values({
          userId: user.id,
          term: input.term,
          language: input.language ?? "en",
          entryId: input.entryId,
          lookedAt: new Date(),
          source: input.source,
          context: input.context,
        })
        .returning();

      return { history };
    },
  }),

  listLookupHistory: defineAction({
    input: z.object({}).optional(),
    handler: async (_, context) => {
      const user = requireUser(context);

      const history = await db
        .select()
        .from(LookupHistory)
        .where(eq(LookupHistory.userId, user.id));

      return { history };
    },
  }),
};
