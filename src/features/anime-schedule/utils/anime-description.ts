export function NormalizeAnimeDescription(
  description: string | null
): string | null {
  if (description === null) {
    return null;
  }

  const plain_text = description
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.!?;:])/g, '$1')
    .trim();

  return plain_text.length > 0 ? plain_text : null;
}
