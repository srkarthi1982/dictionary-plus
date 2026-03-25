import type { Alpine } from "alpinejs";
import { registerDictionaryPlusStore } from "./stores/dictionary-plus";

export default function initAlpine(Alpine: Alpine) {
  registerDictionaryPlusStore(Alpine);
}
