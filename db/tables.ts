import { column, defineTable, NOW } from "astro:db";

export const DictionaryEntries = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),
    userId: column.text(),
    term: column.text(),
    phonetic: column.text({ optional: true }),
    partOfSpeech: column.text({
      optional: true,
      enum: ["noun", "verb", "adjective", "adverb", "phrase", "other"],
    }),
    definition: column.text(),
    exampleText: column.text({ optional: true }),
    category: column.text({ optional: true }),
    notes: column.text({ optional: true }),
    synonymsText: column.text({ optional: true }),
    antonymsText: column.text({ optional: true }),
    isFavorite: column.boolean({ default: false }),
    status: column.text({ enum: ["active", "archived"], default: "active" }),
    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
    archivedAt: column.date({ optional: true }),
  },
  indexes: [
    { on: ["userId", "status"], name: "idx_entries_user_status" },
    { on: ["userId", "isFavorite"], name: "idx_entries_user_favorite" },
    { on: ["userId", "category"], name: "idx_entries_user_category" },
    { on: ["userId", "term"], name: "idx_entries_user_term" },
    { on: ["userId", "updatedAt"], name: "idx_entries_user_updated" },
  ],
});

export const dictionaryPlusTables = {
  DictionaryEntries,
} as const;
