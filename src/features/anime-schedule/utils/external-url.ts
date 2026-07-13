export function NormalizeHttpUrl(candidate_url: string | null): string | null {
  if (candidate_url === null) {
    return null;
  }

  try {
    const parsed_url = new URL(candidate_url);

    if (parsed_url.protocol !== 'http:' && parsed_url.protocol !== 'https:') {
      return null;
    }

    return parsed_url.toString();
  } catch {
    return null;
  }
}
