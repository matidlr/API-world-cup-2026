export interface LocalizedText {
  en: string;
  es: string;
}

export interface LocalizedDictionaryItem {
  code: string;
  label: LocalizedText;
  description: LocalizedText;
  example?: LocalizedText;
}
