import { describe, expect, it } from 'vitest';
import { makeAnswer, makeMember } from '@/test/factories';
import type { ActionRule, AttendanceStatus, SessionInput, StanceLabel } from '@/types/simulation';
import { analyzeSession } from './analyze-session';
import { outcomeHeadline, thresholdExplanation } from './session-summary';
import { buildRows } from './member-rows';
import { movability } from './pivotal';

const ORDINARY: ActionRule = {
  id: 'ordinary',
  label: 'Ordinary',
  basis: 'full',
  needed: 7,
  verified: true,
  note: '',
};
const CONSENT: ActionRule = {
  id: 'consent',
  label: 'Consent',
  basis: 'consent',
  verified: true,
  note: '',
};

function session(
  stances: (StanceLabel | Exclude<AttendanceStatus, 'present'>)[],
  ask: SessionInput['ask'] = 'Approval',
) {
  const members = stances.map((_, i) => makeMember(`m${String(i)}`, { votes: 10, positions: 3 }));
  const attendance = Object.fromEntries(
    members.map((m, i) => {
      const s = stances[i];
      return [m.id, s === 'absent' || s === 'recused' ? s : 'present'];
    }),
  ) as SessionInput['attendance'];
  const answers = members.flatMap((m, i) => {
    const s = stances[i];
    return s === 'absent' || s === 'recused' || s === undefined ? [] : [makeAnswer(m, s)];
  });
  const input = { ask, attendance } as SessionInput;
  return { members, rows: buildRows(members, attendance, answers), input };
}

describe('analyzeSession vote calculations', () => {
  it('counts leaning-yes votes against a full-membership threshold', () => {
    const { rows, input } = session([
      'Strong Support',
      'Strong Support',
      'Lean Support',
      'Lean Support',
      'Lean Support',
      'Lean Support',
      'Undecided',
      'Lean Oppose',
      'Strong Oppose',
      'Strong Oppose',
      'absent',
      'recused',
      'Undecided',
    ]);
    const a = analyzeSession({ rows, input, rule: ORDINARY, seatCount: 13 });
    expect(a.voting).toHaveLength(11);
    expect(a.notVoting).toBe(2);
    expect(a.goalCount).toBe(6);
    expect(a.target).toBe(7);
    expect(a.outcome).toBe('short');
    expect(a.breakdown).toEqual({ solid: 2, persuadable: 7, counter: 2 });
    expect(a.tally.find((s) => s.key === 'not-voting')?.count).toBe(2);
    expect(a.pivot.mode).toBe('reach');
  });

  it('meets the threshold with enough support', () => {
    const { rows, input } = session(
      Array<StanceLabel>(7).fill('Strong Support').concat(Array<StanceLabel>(6).fill('Undecided')),
    );
    expect(analyzeSession({ rows, input, rule: ORDINARY, seatCount: 13 }).outcome).toBe('met');
  });

  it('absent and recused members count toward blocking a full-membership vote', () => {
    const { rows, input } = session(
      [
        'Strong Oppose',
        'Strong Oppose',
        'absent',
        'recused',
        ...Array<StanceLabel>(9).fill('Strong Support'),
      ],
      'Oppose',
    );
    expect(analyzeSession({ rows, input, rule: ORDINARY, seatCount: 13 }).goalCount).toBe(4);
  });

  it('consent items use the objector lens', () => {
    const { rows, input } = session(['Strong Support', 'Undecided', 'Lean Oppose']);
    const a = analyzeSession({ rows, input, rule: CONSENT, seatCount: 3 });
    expect(a.outcome).toBe('consent');
    expect(a.consentObjectors.map((r) => r.stance)).toEqual(['Lean Oppose', 'Undecided']);
  });

  it('is unreachable when nobody is present', () => {
    const { rows, input } = session(['absent', 'recused']);
    expect(analyzeSession({ rows, input, rule: ORDINARY, seatCount: 2 }).outcome).toBe(
      'unreachable',
    );
  });

  it('says nobody is present, not that the rule is too high, for a full-seat rule', () => {
    const { rows, input } = session(Array<'absent'>(13).fill('absent'));
    const a = analyzeSession({ rows, input, rule: ORDINARY, seatCount: 13 });
    expect(outcomeHeadline(a)).toBe('No members present: nothing can be voted on');
  });

  it('says a present-based rule needs more than the members able to vote', () => {
    const rule: ActionRule = { ...CONSENT, id: 'defer', basis: 'present' };
    const { rows, input } = session(['Strong Support', 'recused', 'recused']);
    const a = analyzeSession({
      rows,
      input,
      rule,
      seatCount: 3,
      procedure: { recusal: 'present', tieBreak: 'fails' },
    });
    expect(a.outcome).toBe('unreachable');
    expect(outcomeHeadline(a)).toContain('more than the members able to vote');
  });
});

describe('buildRows member matching', () => {
  it('matches a member without a slug by the UUID it is keyed by', () => {
    const id = '11111111-1111-4111-8111-111111111111';
    const member = makeMember(id);
    const answer = { ...makeAnswer(member, 'Lean Support'), memberSlug: '', memberId: id };
    const [row] = buildRows([member], { [id]: 'present' }, [answer]);
    expect(row?.stance).toBe('Lean Support');
  });
});

describe('equal treatment in ranking', () => {
  it('members with the same evidence and stance get the same movability, whoever they are', () => {
    const ids = ['janika-white', 'edmund-ford-sr', 'jerri-green', 'someone-else'];
    const members = ids.map((id) => makeMember(id, { votes: 4, positions: 2 }));
    const attendance = Object.fromEntries(ids.map((id) => [id, 'present' as const]));
    const rows = buildRows(
      members,
      attendance,
      members.map((m) => makeAnswer(m, 'Undecided')),
    );
    const scores = rows.map((r) => (r.participation === 'present' ? movability(r, 'support') : -1));
    expect(new Set(scores).size).toBe(1);
  });
});

describe('thresholdExplanation for unverified rules', () => {
  const { rows, input } = session(['Strong Support', 'Lean Support', 'Undecided']);

  it('calls an unverified ordinary rule the ordinary-passage default', () => {
    const rule: ActionRule = { ...ORDINARY, verified: false };
    const text = thresholdExplanation(analyzeSession({ rows, input, rule, seatCount: 3 }));
    expect(text).toContain('ordinary-passage default');
  });

  it('names any other unverified rule instead of calling it the ordinary default', () => {
    const rule: ActionRule = {
      id: 'veto_override',
      label: 'Veto override',
      basis: 'full',
      needed: 2,
      verified: false,
      note: '',
    };
    const text = thresholdExplanation(analyzeSession({ rows, input, rule, seatCount: 3 }));
    expect(text).not.toContain('ordinary');
    expect(text).toContain('“Veto override” is not verified');
  });
});

describe('thresholdExplanation for a block', () => {
  it('explains recused members counted as present on a present-based rule', () => {
    const rule: ActionRule = { ...CONSENT, id: 'defer', basis: 'present' };
    const { rows, input } = session(
      ['Strong Oppose', 'Strong Support', 'Strong Support', 'recused', 'recused'],
      'Oppose',
    );
    const a = analyzeSession({
      rows,
      input,
      rule,
      seatCount: 5,
      procedure: { recusal: 'present', tieBreak: 'fails' },
    });
    expect(a.goalCount).toBe(3);
    expect(thresholdExplanation(a)).toContain(
      '2 recused members counted as present cannot vote yes',
    );
  });
});
