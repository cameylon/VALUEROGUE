const LEGAL_NAME_PATTERN = /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/g;
const PHONE_PATTERN = /(\+?61\s?\d{1,2}\s?\d{4}\s?\d{4})|(\b0\d{1,2}\s?\d{4}\s?\d{4}\b)/g;
const ID_PATTERN = /\b(\d{9,12})\b/g;
const ADDRESS_PATTERN = /\b\d+\s+[A-Za-z\s]+(Street|St|Road|Rd|Avenue|Ave|Boulevard|Blvd|Drive|Dr)\b/gi;

export type RedactionResult = {
  redactedText: string;
  summary: string;
};

export function redactSensitive(text: string) {
  let redactedText = text;
  const hits: string[] = [];

  if (LEGAL_NAME_PATTERN.test(redactedText)) {
    redactedText = redactedText.replace(LEGAL_NAME_PATTERN, "[PERSON]");
    hits.push("names");
  }
  if (PHONE_PATTERN.test(redactedText)) {
    redactedText = redactedText.replace(PHONE_PATTERN, "[PHONE]");
    hits.push("phones");
  }
  if (ID_PATTERN.test(redactedText)) {
    redactedText = redactedText.replace(ID_PATTERN, "[ID]");
    hits.push("ids");
  }
  if (ADDRESS_PATTERN.test(redactedText)) {
    redactedText = redactedText.replace(ADDRESS_PATTERN, "[ADDRESS]");
    hits.push("addresses");
  }

  return {
    redactedText,
    summary: hits.length ? `Redacted ${hits.join(", ")}.` : "No redaction required."
  } satisfies RedactionResult;
}
