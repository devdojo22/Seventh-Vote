import { describe, expect, it } from 'vitest';
import { councilConfig, MEMPHIS_SNAPSHOT_MEMBER_SLUGS } from '@/data/council';
import { SESSION_DEFAULTS } from '@/data/session-defaults';
import { makeMember } from '@/test/factories';
import { DEFAULT_PROCEDURE, thresholdFor } from '@/lib/simulation/thresholds';
import type { ActionRule } from '@/types/simulation';
import { councilProfile, holdsSnapshot, type WorkspaceInfo } from './council-profile';

const WORKSPACE = { name: 'Test Council', voteRules: null };

const VOTE_RULES = {
  bodySize: 13,
  majorityThreshold: 7,
  actions: [],
  recusal: 'excluded',
  tieBreak: 'fails',
} satisfies NonNullable<WorkspaceInfo['voteRules']>;

describe('holdsSnapshot (temporary Memphis marker, replaced in M5)', () => {
  it.each(MEMPHIS_SNAPSHOT_MEMBER_SLUGS)('a workspace holding %s is the snapshot', (slug) => {
    expect(holdsSnapshot([makeMember('someone-else'), makeMember(slug)])).toBe(true);
  });

  it('any other workspace is not', () => {
    expect(holdsSnapshot([makeMember('a'), makeMember('b')])).toBe(false);
    expect(holdsSnapshot([])).toBe(false);
  });
});

describe('councilProfile', () => {
  it('the snapshot gets the Memphis configuration', () => {
    const profile = councilProfile([makeMember('jerri-green')], WORKSPACE);
    expect(profile.snapshot).toBe(true);
    expect(profile.config.councilName).toBe(councilConfig.councilName);
    expect(profile.sessionDefaults).toEqual(SESSION_DEFAULTS);
  });

  it('another workspace gets neutral defaults named after the workspace', () => {
    const profile = councilProfile([makeMember('a')], WORKSPACE);
    expect(profile.snapshot).toBe(false);
    expect(profile.config.councilName).toBe('Test Council');
    expect(profile.sessionDefaults.title).toBe('');
  });

  it('seat count comes from the workspace vote rules, else the member count', () => {
    const members = [makeMember('a'), makeMember('b'), makeMember('c')];
    expect(councilProfile(members, WORKSPACE).config.seatCount).toBe(3);
    expect(
      councilProfile(members, { name: 'X', voteRules: { ...VOTE_RULES, bodySize: 9 } }).config
        .seatCount,
    ).toBe(9);
  });
});

describe('councilProfile with saved vote rules', () => {
  const members = [makeMember('a'), makeMember('b'), makeMember('c')];

  it('builds the rules from the saved actions, not the built-in list', () => {
    const profile = councilProfile(members, {
      name: 'X',
      voteRules: {
        ...VOTE_RULES,
        actions: [
          {
            id: 'veto_override',
            label: 'Veto override',
            threshold: { type: 'fraction', numerator: 2, denominator: 3, of: 'seats' },
            note: '',
            verified: true,
          },
          {
            id: 'reconsider',
            label: 'Reconsider',
            threshold: { type: 'fraction', numerator: 2, denominator: 3, of: 'present' },
            note: '',
            verified: false,
          },
        ],
      },
    });
    expect(profile.rules.map((r) => r.id)).toEqual(['ordinary', 'veto_override', 'reconsider']);
    expect(profile.rules[1]).toMatchObject({ basis: 'full', needed: 9 });
    expect(profile.rules[2]).toMatchObject({
      basis: 'present',
      fraction: { numerator: 2, denominator: 3 },
    });
  });

  it('no saved actions means ordinary passage only', () => {
    const profile = councilProfile(members, { name: 'X', voteRules: VOTE_RULES });
    expect(profile.rules.map((r) => r.id)).toEqual(['ordinary']);
  });

  it('carries the recusal mode and tie-break', () => {
    const profile = councilProfile(members, {
      name: 'X',
      voteRules: { ...VOTE_RULES, recusal: 'present', tieBreak: 'passes' },
    });
    expect(profile.procedure).toEqual({ recusal: 'present', tieBreak: 'passes' });
    expect(councilProfile(members, WORKSPACE).procedure).toEqual(DEFAULT_PROCEDURE);
  });
});

describe('thresholdFor with a workspace procedure', () => {
  const MAJORITY: ActionRule = { id: 'm', label: 'M', basis: 'present', verified: true, note: '' };

  it('ties pass when the workspace says so', () => {
    const fails = thresholdFor(MAJORITY, 6, 13);
    const passes = thresholdFor(MAJORITY, 6, 13, {
      procedure: { recusal: 'excluded', tieBreak: 'passes' },
    });
    expect([fails.needed, passes.needed]).toEqual([4, 3]);
  });

  it('recused members count as present abstentions only in "present" mode', () => {
    const excluded = thresholdFor(MAJORITY, 6, 13, { recused: 2 });
    const present = thresholdFor(MAJORITY, 6, 13, {
      recused: 2,
      procedure: { recusal: 'present', tieBreak: 'fails' },
    });
    expect(excluded).toMatchObject({ needed: 4, denominator: 6, abstentions: 0 });
    expect(present).toMatchObject({ needed: 5, denominator: 8, abstentions: 2 });
  });

  it('a fraction of members present rounds up', () => {
    const rule: ActionRule = { ...MAJORITY, fraction: { numerator: 2, denominator: 3 } };
    expect(thresholdFor(rule, 7, 13).needed).toBe(5);
  });
});
