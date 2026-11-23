// Every audio file in /sounds is bundled at build time and becomes a soundboard button.
const files = import.meta.glob('/sounds/*.{mp3,ogg,wav,m4a,aac,flac,opus}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export interface Sound {
  id: string;
  url: string;
  label: string;
}

function labelOf(path: string) {
  const name = path.split('/').pop()!.replace(/\.[^.]+$/, '');
  return name.replace(/^\d+[\s._-]+/, '').replace(/_+/g, ' ').trim() || name;
}

export const sounds: Sound[] = Object.entries(files)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, url]) => ({ id: path, url, label: labelOf(path) }));
