import { StyleSheet } from '@react-pdf/renderer';
import { STANCE_LABELS, type StanceLabel } from '@/types/simulation';

export const COLORS = {
  navy: '#0d2438',
  ink: '#142332',
  muted: '#5a6b7a',
  paper: '#f4f6f8',
  line: '#dde4ea',
  line2: '#edf1f4',
  gold: '#c89b3c',
  gold2: '#f0dfb3',
  pine: '#23725a',
  pineBg: '#e7f2ed',
  brick: '#a2473d',
  brickBg: '#f8ebe8',
  amber: '#7a5419',
  amberBg: '#fbf3e2',
  steel: '#346785',
  white: '#ffffff',
} as const;

export const STANCE_COLORS: Record<StanceLabel, { bg: string; text: string; bar: string }> = {
  'Strong Oppose': { bg: COLORS.brick, text: COLORS.white, bar: COLORS.brick },
  'Lean Oppose': { bg: COLORS.brickBg, text: COLORS.brick, bar: '#d0a39e' },
  Undecided: { bg: COLORS.paper, text: COLORS.navy, bar: '#9ab3c2' },
  'Lean Support': { bg: COLORS.pineBg, text: COLORS.pine, bar: '#91b9ad' },
  'Strong Support': { bg: COLORS.pine, text: COLORS.white, bar: COLORS.pine },
};
export const NOT_VOTING_BAR = '#cfd3d7';

export function isStanceLabel(value: string): value is StanceLabel {
  return (STANCE_LABELS as readonly string[]).includes(value);
}

const REPLACEMENTS: Record<string, string> = {
  '→': '->',
  '←': '<-',
  '↑': '^',
  '↓': 'v',
  '≥': '>=',
  '≤': '<=',
  '≈': '~',
  '≠': '!=',
  '−': '-',
  '✓': 'v',
  '✔': 'v',
  '✗': 'x',
  ' ': ' ',
  ' ': ' ',
  '​': '',
};
const WIN_ANSI_EXTRAS = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ');

function encodable(char: string): boolean {
  const code = char.codePointAt(0) ?? 0;
  return (
    char === '\n' ||
    (code >= 0x20 && code <= 0x7e) ||
    (code >= 0xa0 && code <= 0xff) ||
    WIN_ANSI_EXTRAS.has(char)
  );
}

export function pdfText(text: string): string {
  return Array.from(text.normalize('NFC'), (char) => {
    if (encodable(char)) return char;
    return REPLACEMENTS[char] ?? '?';
  }).join('');
}

export const FONT = { regular: 'Helvetica', bold: 'Helvetica-Bold', italic: 'Helvetica-Oblique' };

const BASE_FONT_SIZE = 9.5;
const BASE_LINE_HEIGHT = 1.4;

export function absoluteLineHeight(style: { fontSize?: unknown; lineHeight?: unknown }): string {
  const fontSize = typeof style.fontSize === 'number' ? style.fontSize : BASE_FONT_SIZE;
  const multiplier = typeof style.lineHeight === 'number' ? style.lineHeight : BASE_LINE_HEIGHT;
  return `${(fontSize * multiplier).toFixed(2)}pt`;
}

const CARD = {
  backgroundColor: COLORS.white,
  borderWidth: 0.75,
  borderColor: COLORS.line,
  borderRadius: 10,
};

const EYEBROW = {
  fontFamily: FONT.bold,
  fontSize: 7,
  letterSpacing: 1.4,
  textTransform: 'uppercase' as const,
  color: COLORS.gold,
};

const PILL = {
  lineHeight: 1,
  borderRadius: 9,
  paddingVertical: 3.5,
  paddingHorizontal: 7,
  fontSize: 7.5,
};

export const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 58,
    paddingHorizontal: 40,
    fontFamily: FONT.regular,
    fontSize: BASE_FONT_SIZE,
    color: COLORS.ink,
    backgroundColor: COLORS.paper,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.75,
    borderTopColor: COLORS.line,
    paddingTop: 8,
    fontSize: 7.5,
    color: COLORS.muted,
  },

  header: { ...CARD, padding: 20, flexDirection: 'row', gap: 18, alignItems: 'center' },
  eyebrow: EYEBROW,
  headerTitle: {
    fontFamily: FONT.bold,
    fontSize: 18,
    lineHeight: 1.25,
    color: COLORS.navy,
    marginTop: 6,
  },
  headerMeta: { fontSize: 8.5, color: COLORS.muted, marginTop: 6 },
  headerStamp: { fontSize: 7.5, color: COLORS.muted, marginTop: 8 },
  figureBox: {
    backgroundColor: COLORS.navy,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    width: 136,
    alignItems: 'center',
  },
  figure: { fontFamily: FONT.bold, fontSize: 25, color: '#f2c46b', lineHeight: 1.1 },
  figureCaption: {
    fontFamily: FONT.bold,
    fontSize: 6.5,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: COLORS.white,
    textAlign: 'center',
    marginTop: 6,
  },

  section: { marginTop: 20 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 9,
  },
  sectionTitle: { fontFamily: FONT.bold, fontSize: 14, color: COLORS.navy },
  sectionNote: { fontSize: 7.5, color: COLORS.muted },

  row: { flexDirection: 'row', gap: 10 },
  card: { ...CARD, padding: 16 },
  panel: {
    backgroundColor: COLORS.paper,
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  small: { fontSize: 7.5, color: COLORS.muted },
  body: { fontSize: 8.5, color: COLORS.ink },
  strong: { fontFamily: FONT.bold, color: COLORS.navy },
  label: {
    fontFamily: FONT.bold,
    fontSize: 6.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: COLORS.muted,
    marginBottom: 3,
  },
  columnTitle: {
    fontFamily: FONT.bold,
    fontSize: 6.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: COLORS.navy,
    marginBottom: 6,
  },

  notice: {
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    backgroundColor: COLORS.amberBg,
    borderWidth: 0.75,
    borderColor: '#ecd6a4',
    borderRadius: 10,
    padding: 11,
  },
  noticeTitle: { fontFamily: FONT.bold, fontSize: 8, color: COLORS.amber },
  noticeBody: { fontSize: 8, color: COLORS.amber, marginTop: 2 },

  pill: { ...PILL, fontFamily: FONT.bold },
  tag: {
    ...PILL,
    backgroundColor: COLORS.paper,
    color: COLORS.muted,
    borderWidth: 0.5,
    borderColor: COLORS.line,
  },
  confidence: {
    ...PILL,
    backgroundColor: COLORS.white,
    color: COLORS.navy,
    borderWidth: 0.75,
    borderColor: COLORS.line,
  },
  unreviewed: {
    ...PILL,
    fontFamily: FONT.bold,
    backgroundColor: COLORS.amberBg,
    color: COLORS.amber,
    borderWidth: 0.5,
    borderColor: '#e6cf98',
  },

  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: FONT.bold, fontSize: 8, color: COLORS.white, lineHeight: 1 },
  stepBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },

  listItem: { flexDirection: 'row', gap: 5, marginBottom: 4 },
  bullet: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: COLORS.gold, marginTop: 4 },
  /** E1, E2… evidence labels: small navy squares, as on the Prep brief. */
  evidenceLabel: {
    width: 16,
    height: 13,
    borderRadius: 3,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  evidenceLabelText: { fontFamily: FONT.bold, fontSize: 6.5, color: COLORS.white, lineHeight: 1 },
  link: { color: COLORS.steel, textDecoration: 'underline' },

  avoid: {
    fontSize: 8,
    color: COLORS.brick,
    backgroundColor: COLORS.brickBg,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 9,
  },
  emptyBox: {
    borderWidth: 0.75,
    borderStyle: 'dashed',
    borderColor: COLORS.line,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
  },

  tableHead: {
    flexDirection: 'row',
    backgroundColor: COLORS.paper,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.line2,
  },
  th: {
    fontFamily: FONT.bold,
    fontSize: 6.5,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: COLORS.muted,
  },
});
