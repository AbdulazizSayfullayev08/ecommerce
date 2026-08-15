export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[''`']/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function uniqueSlugify(base: string, suffix?: string | number): string {
  const slug = slugify(base);
  if (suffix === undefined || suffix === '') return slug;
  return `${slug}-${suffix}`;
}
