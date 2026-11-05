// Brand-ish hues for the small provider dots (matches the design's palette).
const KNOWN: [RegExp, number | 'gray'][] = [
  [/netflix/i, 25],
  [/crave|^max$|hbo/i, 255],
  [/amazon|prime video/i, 220],
  [/disney/i, 275],
  [/apple/i, 'gray'],
  [/paramount/i, 240],
  [/cbc|peacock/i, 35],
  [/tubi/i, 310],
  [/hulu/i, 145],
  [/bbc/i, 340],
  [/^now/i, 170],
  [/pluto/i, 55],
  [/plex/i, 75],
  [/mubi/i, 200],
  [/google/i, 140],
  [/youtube/i, 15],
];

export function serviceColor(name: string, id = 0): string {
  const hit = KNOWN.find(([re]) => re.test(name));
  if (hit?.[1] === 'gray') return 'oklch(0.85 0 0)';
  const hue = hit ? hit[1] : (id * 61 + name.length * 17) % 360;
  return `oklch(0.72 0.16 ${hue})`;
}
