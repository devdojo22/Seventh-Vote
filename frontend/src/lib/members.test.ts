import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { makeMember } from '@/test/factories';
import { memberSchema } from '@/types/member';
import { recordDepth } from './members';

describe('recordDepth', () => {
  it('scores votes, issue positions (double) and sourced quotes', () => {
    // 6 + 5 * 2 + 2 = 18 of 20
    expect(recordDepth(makeMember('a', { votes: 6, positions: 5, sourcedQuotes: 2 }))).toEqual({
      label: 'Strong',
      percent: 90,
    });
  });

  it('does not count quotes without a source link', () => {
    const withUnsourced = makeMember('a', { votes: 4, sourcedQuotes: 1, unsourcedQuotes: 5 });
    expect(recordDepth(withUnsourced)).toEqual(
      recordDepth(makeMember('b', { votes: 4, sourcedQuotes: 1 })),
    );
  });

  it.each([
    [16, 'Strong'],
    [15, 'Moderate'],
    [11, 'Moderate'],
    [10, 'Thin'],
    [0, 'Thin'],
  ] as const)('a score of %i is %s', (votes, label) => {
    expect(recordDepth(makeMember('a', { votes })).label).toBe(label);
  });

  it('caps the percentage at 100', () => {
    expect(recordDepth(makeMember('a', { votes: 40 })).percent).toBe(100);
  });

  it('treats an empty dossier as Thin, 0%', () => {
    expect(recordDepth(makeMember('a'))).toEqual({ label: 'Thin', percent: 0 });
  });

  it('gives every member the same result for the same evidence, whoever they are', () => {
    const evidence = { votes: 4, positions: 3, sourcedQuotes: 1 };
    const results = ['janika-white', 'edmund-ford-sr', 'jerri-green', 'someone-else'].map((id) =>
      recordDepth(makeMember(id, evidence, { name: id, district: `D-${id}`, data_gaps: ['gap'] })),
    );
    expect(new Set(results.map((r) => JSON.stringify(r))).size).toBe(1);
  });

  it('is unaffected by data gaps, workspace basis or version', () => {
    const base = recordDepth(makeMember('a', { votes: 5, positions: 2 }));
    expect(
      recordDepth(
        makeMember(
          'a',
          { votes: 5, positions: 2 },
          { data_gaps: ['x', 'y', 'z'], basis: 'unreviewed', version_no: 4 },
        ),
      ),
    ).toEqual(base);
  });

  it('scores the Memphis snapshot by evidence alone (no member-specific adjustment)', () => {
    const file = new URL(
      '../../../services/api/council/fixtures/memphis_snapshot.json',
      import.meta.url,
    );
    const raw = JSON.parse(readFileSync(file, 'utf8')) as unknown[];
    const members = raw.map((m) =>
      memberSchema.parse({ ...(m as object), basis: 'approved', version_no: 1 }),
    );
    const depth = Object.fromEntries(members.map((m) => [m.id, recordDepth(m)]));

    // Formerly reduced by hard-coded IDs; now scored like everyone else.
    expect(depth['janika-white']).toEqual({ label: 'Moderate', percent: 55 });
    expect(depth['edmund-ford-sr']).toEqual({ label: 'Moderate', percent: 75 });
    expect(members).toHaveLength(13);
  });
});
