import { defineDb } from "astro:db";
import {
  DictionaryEntries,
  EntryVariants,
  UserWordNotes,
  LookupHistory,
} from "./tables";

export default defineDb({
  tables: {
    DictionaryEntries,
    EntryVariants,
    UserWordNotes,
    LookupHistory,
  },
});
