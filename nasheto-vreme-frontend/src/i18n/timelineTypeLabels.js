const TIMELINE_TYPE_LABELS = {
  bg: {
    ANSWER: "Отговор",
    MOMENT: "Момент"
  },
  en: {
    ANSWER: "Answer",
    MOMENT: "Moment"
  }
};

export function localizeTimelineType(type, language = "bg") {
  const key = String(type || "").toUpperCase();
  const dictionary = TIMELINE_TYPE_LABELS[language] || TIMELINE_TYPE_LABELS.bg;
  return dictionary[key] || key || "-";
}

