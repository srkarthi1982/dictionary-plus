import type { Alpine } from "alpinejs";

type Entry = {
  id: number;
  term: string;
  phonetic?: string | null;
  partOfSpeech?: string | null;
  definition: string;
  exampleText?: string | null;
  category?: string | null;
  notes?: string | null;
  isFavorite: boolean;
  status: "active" | "archived";
  createdAt: string | Date;
  updatedAt: string | Date;
};

type DictionaryPlusStore = {
  entries: Entry[];
  search: string;
  activeTab: string;
  categoryFilter: string;
  selectedEntryId: number | null;
  isEditorOpen: boolean;
  isSubmitting: boolean;
  flash: { type: string; message: string };
  init(entries: Entry[]): void;
  setTab(tab: string): void;
  setSearch(value: string): void;
  setCategory(value: string): void;
  openEditor(entryId?: number): void;
  closeEditor(): void;
  setFlash(type: "success" | "error", message: string): void;
  readonly categories: string[];
  readonly filteredEntries: Entry[];
};

export function registerDictionaryPlusStore(Alpine: Alpine) {
  const store: DictionaryPlusStore = {
    entries: [] as Entry[],
    search: "",
    activeTab: "overview",
    categoryFilter: "all",
    selectedEntryId: null as number | null,
    isEditorOpen: false,
    isSubmitting: false,
    flash: { type: "", message: "" },

    init(entries: Entry[]) {
      this.entries = entries;
    },

    setTab(tab: string) {
      this.activeTab = tab;
    },

    setSearch(value: string) {
      this.search = value;
    },

    setCategory(value: string) {
      this.categoryFilter = value;
    },

    openEditor(entryId?: number) {
      this.selectedEntryId = entryId ?? null;
      this.isEditorOpen = true;
    },

    closeEditor() {
      this.selectedEntryId = null;
      this.isEditorOpen = false;
    },

    setFlash(type: "success" | "error", message: string) {
      this.flash = { type, message };
      setTimeout(() => {
        this.flash = { type: "", message: "" };
      }, 2800);
    },

    get categories() {
      return [...new Set(this.entries.map((entry: Entry) => entry.category).filter(Boolean) as string[])];
    },

    get filteredEntries() {
      const query = this.search.toLowerCase();

      return this.entries.filter((entry: Entry) => {
        const matchesTab =
          this.activeTab === "favorites"
            ? entry.isFavorite && entry.status === "active"
            : this.activeTab === "archived"
              ? entry.status === "archived"
              : this.activeTab === "entries"
                ? entry.status === "active"
                : true;

        const matchesCategory =
          this.categoryFilter === "all" ||
          (entry.category ?? "").toLowerCase() === this.categoryFilter.toLowerCase();

        const matchesSearch =
          !query ||
          entry.term.toLowerCase().includes(query) ||
          entry.definition.toLowerCase().includes(query) ||
          (entry.notes ?? "").toLowerCase().includes(query);

        return matchesTab && matchesCategory && matchesSearch;
      });
    },
  };

  Alpine.store("dictionaryPlus", store);
}
