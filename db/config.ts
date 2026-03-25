import { defineDb } from "astro:db";
import { DictionaryEntries } from "./tables";

export default defineDb({
  tables: {
    DictionaryEntries,
  },
});
