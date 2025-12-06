import { column, defineTable, NOW } from "astro:db";

/**
 * Cached dictionary entry for a given word in a given language.
 * We can store the full API/model response as JSON.
 */
export const DictionaryEntries = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),

    // Word in its lookup form (e.g., "running")
    term: column.text(),

    // Language code, e.g. "en", "fr", "ta"
    language: column.text({ default: "en" }),

    // Normalized base form, e.g., "run"
    lemma: column.text({ optional: true }),

    // Full structured data from dictionary API/model:
    // definitions, phonetics, examples, parts of speech, etc.
    payload: column.json({ optional: true }),

    // For quick filters
    partOfSpeech: column.text({ optional: true }), // e.g. "noun", "verb"

    // When we last refreshed this from external source
    fetchedAt: column.date({ default: NOW }),

    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
});

/**
 * Optional: variants of the word (plurals, conjugations, etc.)
 * All attached to a DictionaryEntries row.
 */
export const EntryVariants = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),

    entryId: column.number({ references: () => DictionaryEntries.columns.id }),

    // Variant spelling or form
    variant: column.text(),
    // e.g. "plural", "past_tense", "gerund", etc.
    variantType: column.text({ optional: true }),

    createdAt: column.date({ default: NOW }),
  },
});

/**
 * A user’s personal attachment to a word:
 * notes, example sentences, “starred” status, etc.
 */
export const UserWordNotes = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),

    userId: column.text(),
    entryId: column.number({ references: () => DictionaryEntries.columns.id }),

    // For quick tagging ("exam", "work", "travel", etc.)
    tags: column.text({ optional: true }),

    // The user’s own explanation or mnemonic
    note: column.text({ optional: true }),

    // Example sentence written by the user
    exampleSentence: column.text({ optional: true }),

    // Favorite/starred word
    isStarred: column.boolean({ default: false }),

    // Optional difficulty or familiarity rating
    familiarity: column.text({
      enum: ["new", "learning", "familiar", "mastered"],
      default: "new",
    }),

    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
});

/**
 * Search history for each user.
 * Helps show recent lookups and build "learning journeys".
 */
export const LookupHistory = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),

    userId: column.text({ optional: true }),

    // We store the raw query text for transparency
    term: column.text(),
    language: column.text({ default: "en" }),

    // Link to cached entry if it exists
    entryId: column.number({
      references: () => DictionaryEntries.columns.id,
      optional: true,
    }),

    lookedAt: column.date({ default: NOW }),
    source: column.text({ optional: true }), // e.g. "web", "mobile", "extension"

    // Optional : store quick context
    context: column.text({ optional: true }),
  },
});

export const dictionaryPlusTables = {
  DictionaryEntries,
  EntryVariants,
  UserWordNotes,
  LookupHistory,
} as const;
