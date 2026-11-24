import { Document, Link, Page, Path, Svg, Text, View, type TextProps } from '@react-pdf/renderer';
import { Children, type ReactNode } from 'react';
import { EVIDENCE_PIECE_KIND_LABELS } from '@/data/evidence-kinds';
import { formatDateTime } from '@/features/dossiers/dossier-format';
import type { SimulationAnswer } from '@/features/simulation/simulation-api';
import { NOT_A_QUOTE, NOTHING_IN_EVIDENCE } from '@/features/simulation/simulation-text';
import { initials } from '@/lib/members';
import { isHttpUrl } from '@/lib/url';
import type { StanceLabel } from '@/types/simulation';
import {
  absoluteLineHeight,
  COLORS,
  isStanceLabel,
  NOT_VOTING_BAR,
  pdfText,
  STANCE_COLORS,
  styles,
} from './pdf-theme';
import type { ReportMember, SessionReport } from './session-report';

const OUTCOME_COLORS = { positive: COLORS.pine, negative: COLORS.brick, neutral: COLORS.navy };

function Txt({ children, style }: { children: string; style?: TextProps['style'] }) {
  const own = Array.isArray(style) ? style : style ? [style] : [];
  const merged = own.reduce<{ fontSize?: unknown; lineHeight?: unknown }>(
    (all, s) => ({ ...all, ...s }),
    {},
  );
  const lineHeight = absoluteLineHeight(merged);
  return <Text style={[...own, { lineHeight }]}>{pdfText(children)}</Text>;
}

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  const [first, ...rest] = Children.toArray(children);
  return (
    <View style={styles.section}>
      <View wrap={false} minPresenceAhead={140}>
        <View style={styles.sectionHeader}>
          <Txt style={styles.sectionTitle}>{title}</Txt>
          {note && <Txt style={styles.sectionNote}>{note}</Txt>}
        </View>
        {first}
      </View>
      {rest}
    </View>
  );
}

function AlertGlyph() {
  return (
    <Svg width={10} height={10} viewBox="0 0 24 24" style={{ marginTop: 0.5 }}>
      <Path
        d="M10.3 3.9 2.4 17.6A2 2 0 0 0 4.1 20.6h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
        stroke={COLORS.gold}
        strokeWidth={2.2}
        fill="none"
      />
      <Path
        d="M12 9v4m0 4h.01"
        stroke={COLORS.gold}
        strokeWidth={2.2}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

function StancePill({ stance }: { stance: StanceLabel }) {
  const { bg, text } = STANCE_COLORS[stance];
  const border = stance === 'Undecided' ? { borderWidth: 0.5, borderColor: COLORS.line } : {};
  return (
    <View style={{ flexDirection: 'row' }}>
      <Txt style={[styles.pill, { backgroundColor: bg, color: text }, border]}>{stance}</Txt>
    </View>
  );
}

function BulletItems({ items, size = 8 }: { items: readonly string[]; size?: number }) {
  if (items.length === 0) {
    return <Txt style={[styles.small, { fontStyle: 'italic' }]}>{NOTHING_IN_EVIDENCE}</Txt>;
  }
  return (
    <View>
      {items.map((item) => (
        <View key={item} style={styles.listItem}>
          <View style={styles.bullet} />
          <Txt style={{ flex: 1, fontSize: size, color: COLORS.ink }}>{item}</Txt>
        </View>
      ))}
    </View>
  );
}

function SourceName({ name, url }: { name: string; url: string }) {
  if (!isHttpUrl(url)) return <Txt style={styles.small}>{name}</Txt>;
  return (
    <Link src={url} style={[styles.small, styles.link]}>
      {pdfText(name)}
    </Link>
  );
}

function Footer({ report }: { report: SessionReport }) {
  return (
    <View style={styles.footer} fixed>
      <Text>{pdfText(`Seventh Vote · Rehearsal brief · ${report.councilName}`)}</Text>
      <Text
        render={({ pageNumber, totalPages }) =>
          `Page ${String(pageNumber)} of ${String(totalPages)}`
        }
      />
    </View>
  );
}

function detail(report: SessionReport, label: string): string {
  return report.details.find((d) => d.label === label)?.value ?? '';
}

function Header({ report }: { report: SessionReport }) {
  const { attendance } = report;
  const notVoting = attendance.absent + attendance.recused;
  const badges = [
    `Committee: ${detail(report, 'Committee referral')}`,
    `Chair: ${detail(report, 'Committee chair')}`,
    `${String(attendance.present)} present · ${String(notVoting)} not voting`,
  ];
  return (
    <View style={styles.header} wrap={false}>
      <View style={{ flex: 1 }}>
        <Txt style={styles.eyebrow}>Simulation result</Txt>
        <Txt style={styles.headerTitle}>{report.title}</Txt>
        <Txt style={styles.headerMeta}>{report.meta}</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 9 }}>
          {badges.map((b) => (
            <Txt key={b} style={styles.tag}>
              {b}
            </Txt>
          ))}
        </View>
        <Txt style={styles.headerStamp}>
          {`${report.councilName} · Generated ${formatDateTime(report.generatedAt.toISOString())}`}
        </Txt>
      </View>
      <View style={styles.figureBox}>
        <Txt style={styles.figure}>{report.figure.figure}</Txt>
        <Txt style={styles.figureCaption}>{report.figure.caption}</Txt>
      </View>
    </View>
  );
}

/** Notices side by side, as the callout row under the header. */
function Notices({ report }: { report: SessionReport }) {
  if (report.notices.length === 0) return null;
  return (
    <View style={[styles.row, { marginTop: 12 }]} wrap={false}>
      {report.notices.map((notice) => (
        <View key={notice.title} style={styles.notice}>
          <AlertGlyph />
          <View style={{ flex: 1 }}>
            <Txt style={styles.noticeTitle}>{notice.title}</Txt>
            <Txt style={styles.noticeBody}>{notice.body}</Txt>
          </View>
        </View>
      ))}
    </View>
  );
}

function Tally({ report }: { report: SessionReport }) {
  const { outcome } = report;
  const segments = report.tally.filter((s) => s.count > 0);
  const color = (key: string) => (isStanceLabel(key) ? STANCE_COLORS[key].bar : NOT_VOTING_BAR);
  return (
    <View style={[styles.card, { marginTop: 12 }]} wrap={false}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 12,
        }}
      >
        <Txt
          style={{
            fontFamily: 'Helvetica-Bold',
            fontSize: 12.5,
            color: OUTCOME_COLORS[outcome.tone],
          }}
        >
          {outcome.headline}
        </Txt>
        {outcome.detail && (
          <Txt style={[styles.small, { flexShrink: 1, textAlign: 'right' }]}>{outcome.detail}</Txt>
        )}
      </View>
      <View style={{ flexDirection: 'row', gap: 3, height: 9, marginTop: 12 }}>
        {segments.map((s) => (
          <View
            key={s.key}
            style={{
              flexGrow: s.count,
              flexBasis: 0,
              borderRadius: 4.5,
              backgroundColor: color(s.key),
            }}
          />
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
        {report.tally.map((s) => (
          <View
            key={s.key}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              backgroundColor: COLORS.paper,
              borderRadius: 7,
              paddingVertical: 5,
              paddingHorizontal: 8,
            }}
          >
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color(s.key) }} />
            <Txt style={[styles.strong, { fontSize: 8.5 }]}>{String(s.count)}</Txt>
            <Txt style={styles.small}>{s.label}</Txt>
          </View>
        ))}
      </View>
    </View>
  );
}

function AgendaItem({ report }: { report: SessionReport }) {
  const items = [
    ...report.details,
    { label: 'Threshold', value: `${report.threshold.label} · ${report.threshold.note}` },
    {
      label: 'Attendance',
      value: `${String(report.attendance.present)} present · ${String(report.attendance.absent)} absent · ${String(report.attendance.recused)} recused`,
    },
  ];
  return (
    <Section title="Agenda item">
      <View style={styles.card} wrap={false}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 9 }}>
          {items.map(({ label, value }) => (
            <View key={label} style={{ width: '25%', paddingRight: 10 }}>
              <Txt style={styles.label}>{label}</Txt>
              <Txt style={[styles.body, { color: COLORS.navy }]}>{value}</Txt>
            </View>
          ))}
        </View>
        <View
          style={{
            marginTop: 12,
            paddingTop: 10,
            borderTopWidth: 0.75,
            borderTopColor: COLORS.line2,
          }}
        >
          <Txt style={styles.label}>Description</Txt>
          <Txt style={[styles.body, { lineHeight: 1.45 }]}>{report.description}</Txt>
        </View>
      </View>
    </Section>
  );
}

function Pivotal({ pivotal }: { pivotal: NonNullable<SessionReport['pivotal']> }) {
  return (
    <Section title="Who is pivotal?" note="One-member threshold test">
      <View style={styles.card} wrap={false}>
        <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Txt style={styles.eyebrow}>Pivotal-voter view</Txt>
            <Txt style={[styles.strong, { fontSize: 12.5, marginTop: 4 }]}>{pivotal.title}</Txt>
            <Txt style={[styles.small, { fontSize: 8, marginTop: 4 }]}>{pivotal.desc}</Txt>
          </View>
          <View style={[styles.panel, { width: 130, alignItems: 'center', paddingVertical: 11 }]}>
            <Txt style={[styles.strong, { fontSize: 20 }]}>{String(pivotal.members.length)}</Txt>
            <Txt style={[styles.strong, { fontSize: 6.5, textAlign: 'center', marginTop: 3 }]}>
              single-member flips change result
            </Txt>
          </View>
        </View>

        <View style={{ marginTop: 12 }}>
          {pivotal.members.length === 0 ? (
            <View style={styles.emptyBox}>
              <Txt style={[styles.strong, { fontSize: 8.5 }]}>
                There is no marginal one-member meeting in this projection.
              </Txt>
              <Txt style={[styles.small, { marginTop: 2 }]}>
                Use the member reads below to build or defend a broader coalition.
              </Txt>
            </View>
          ) : (
            <View style={{ borderWidth: 0.75, borderColor: COLORS.line, borderRadius: 8 }}>
              <View style={styles.tableHead}>
                <Txt style={[styles.th, { width: '30%' }]}>Member</Txt>
                <Txt style={[styles.th, { width: '20%' }]}>Stance</Txt>
                <Txt style={[styles.th, { width: '12%' }]}>Priority</Txt>
                <Txt style={[styles.th, { width: '38%' }]}>{pivotal.action}</Txt>
              </View>
              {pivotal.members.map((m) => (
                <View key={m.name} style={styles.tableRow} wrap={false}>
                  <View style={{ width: '30%', paddingRight: 6 }}>
                    <Txt style={[styles.strong, { fontSize: 8.5 }]}>{m.name}</Txt>
                    <Txt style={styles.small}>{m.district}</Txt>
                  </View>
                  <View style={{ width: '20%' }}>
                    <StancePill stance={m.stance} />
                  </View>
                  <Txt style={[styles.strong, { width: '12%', fontSize: 9.5 }]}>
                    {String(m.priority)}
                  </Txt>
                  <Txt style={[styles.body, { width: '38%', fontSize: 8 }]}>
                    {m.lever ?? NOTHING_IN_EVIDENCE}
                  </Txt>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </Section>
  );
}

function Objectors({ report }: { report: SessionReport }) {
  return (
    <Section title="Who might object?" note="Consent lens">
      <View style={styles.card} wrap={false}>
        {report.objectors.length === 0 ? (
          <View style={styles.emptyBox}>
            <Txt style={[styles.small, { textAlign: 'center' }]}>
              No likely objector appears in this projection, but one objection is still enough to
              remove the item.
            </Txt>
          </View>
        ) : (
          <View style={{ borderWidth: 0.75, borderColor: COLORS.line, borderRadius: 8 }}>
            <View style={styles.tableHead}>
              <Txt style={[styles.th, { width: '32%' }]}>Member</Txt>
              <Txt style={[styles.th, { width: '22%' }]}>Stance</Txt>
              <Txt style={[styles.th, { width: '46%' }]}>Likely objection</Txt>
            </View>
            {report.objectors.map((o) => (
              <View key={o.name} style={styles.tableRow} wrap={false}>
                <Txt style={[styles.strong, { width: '32%', fontSize: 8.5 }]}>{o.name}</Txt>
                <View style={{ width: '22%' }}>
                  <StancePill stance={o.stance} />
                </View>
                <Txt style={[styles.body, { width: '46%', fontSize: 8 }]}>
                  {o.concern ?? NOTHING_IN_EVIDENCE}
                </Txt>
              </View>
            ))}
          </View>
        )}
      </View>
    </Section>
  );
}

function DetailPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View
      style={[
        styles.panel,
        { flex: 1, borderWidth: 0.75, borderColor: COLORS.line, paddingVertical: 10 },
      ]}
    >
      <Txt style={styles.columnTitle}>{title}</Txt>
      {children}
    </View>
  );
}

function Evidence({ answer }: { answer: SimulationAnswer }) {
  return (
    <View wrap={false} style={[styles.panel, { marginTop: 8, paddingVertical: 10 }]}>
      <Txt style={[styles.strong, { fontSize: 8, marginBottom: 6 }]}>Evidence trace</Txt>
      {answer.citations.length === 0 && (
        <Txt style={[styles.small, { fontStyle: 'italic' }]}>No dossier evidence was cited.</Txt>
      )}
      {answer.citations.map((c, i) => (
        <View key={c.label} style={{ flexDirection: 'row', gap: 7, marginTop: i === 0 ? 0 : 6 }}>
          <View style={styles.evidenceLabel}>
            <Txt style={styles.evidenceLabelText}>{c.label}</Txt>
          </View>
          <View style={{ flex: 1 }}>
            <Txt style={[styles.body, { fontSize: 8 }]}>{c.text}</Txt>
            <Text
              style={[
                styles.small,
                { marginTop: 1, lineHeight: absoluteLineHeight({ fontSize: 7.5 }) },
              ]}
            >
              {pdfText(EVIDENCE_PIECE_KIND_LABELS[c.kind])}
              {c.sourceName && pdfText(' · ')}
              {c.sourceName && <SourceName name={c.sourceName} url={c.sourceUrl} />}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function MemberRead({ member, answer }: { member: ReportMember; answer: SimulationAnswer }) {
  return (
    <View style={[styles.card, { padding: 14, marginBottom: 10 }]}>
      <View wrap={false}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 9,
            paddingBottom: 11,
            marginBottom: 11,
            borderBottomWidth: 0.75,
            borderBottomColor: COLORS.line2,
          }}
        >
          <View style={styles.avatar}>
            <Txt style={styles.avatarText}>{initials(member.name)}</Txt>
          </View>
          <View style={{ flex: 1 }}>
            <Txt style={[styles.strong, { fontSize: 10.5 }]}>{member.name}</Txt>
            <Txt style={styles.small}>
              {`${member.district} · dossier version ${String(answer.versionNo)}`}
            </Txt>
          </View>
          <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
            <StancePill stance={answer.stance} />
            <Txt style={styles.confidence}>{`${answer.confidence} confidence`}</Txt>
            {member.unreviewed && <Txt style={styles.unreviewed}>Unreviewed draft</Txt>}
          </View>
        </View>

        <View style={[styles.row, { gap: 7 }]}>
          <DetailPanel title="In their voice">
            <Txt style={[styles.body, { fontSize: 8 }]}>{answer.answer}</Txt>
            <Txt style={[styles.small, { fontSize: 7, marginTop: 5, fontStyle: 'italic' }]}>
              {NOT_A_QUOTE}
            </Txt>
          </DetailPanel>
          <DetailPanel title="Top concerns">
            <BulletItems items={answer.concerns} />
          </DetailPanel>
          <DetailPanel title="Questions they may ask">
            <BulletItems items={answer.questions} />
          </DetailPanel>
          <DetailPanel title="What could move them">
            <BulletItems items={answer.levers} />
          </DetailPanel>
        </View>
      </View>

      <View
        wrap={false}
        style={{
          marginTop: 8,
          borderWidth: 0.75,
          borderColor: COLORS.line,
          borderRadius: 8,
          paddingVertical: 9,
          paddingHorizontal: 10,
        }}
      >
        <Text
          style={[
            styles.body,
            { lineHeight: absoluteLineHeight({ fontSize: 8.5, lineHeight: 1.45 }) },
          ]}
        >
          <Text style={styles.strong}>Why this read · </Text>
          {pdfText(answer.reasoning)}
        </Text>
      </View>

      <Evidence answer={answer} />
    </View>
  );
}

function MemberReads({ report }: { report: SessionReport }) {
  const simulated = report.members.flatMap((m) =>
    m.answer ? [{ member: m, answer: m.answer }] : [],
  );
  const notVoting = report.members.filter((m) => !m.answer);
  return (
    <Section title="Member-by-member read" note="Simulated by AI from each dossier">
      <Txt style={[styles.small, { marginBottom: 9 }]}>
        Present members, most supportive first. Each read is simulated from the member’s own
        dossier; the labels E1, E2… point to the evidence listed under each read.
      </Txt>
      {simulated.map(({ member, answer }) => (
        <MemberRead key={member.name} member={member} answer={answer} />
      ))}
      {notVoting.length > 0 && (
        <View style={styles.card} wrap={false}>
          <Txt style={styles.columnTitle}>Not voting · not simulated</Txt>
          {notVoting.map((m) => (
            <Txt key={m.name} style={[styles.body, { marginTop: 2 }]}>
              {`${m.name} (${m.district}) — ${m.participation === 'recused' ? 'Recused' : 'Absent'}`}
            </Txt>
          ))}
        </View>
      )}
    </Section>
  );
}

function Outreach({ report }: { report: SessionReport }) {
  const { members, note } = report.outreach;
  return (
    <Section title="First three conversations" note={note}>
      {members.length === 0 ? (
        <View style={styles.emptyBox}>
          <Txt style={styles.small}>No voting member is currently ranked for outreach.</Txt>
        </View>
      ) : (
        <View style={styles.row} wrap={false}>
          {members.map((m, i) => (
            <View key={m.name} style={[styles.card, { flex: 1, padding: 13 }]}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 6,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Txt style={[styles.eyebrow, { fontSize: 6.5, letterSpacing: 1 }]}>
                    {`Approach ${String(i + 1)} · Priority ${String(m.priority)}`}
                  </Txt>
                  <Txt style={[styles.strong, { fontSize: 11.5, marginTop: 3 }]}>{m.name}</Txt>
                </View>
                <View style={styles.stepBadge}>
                  <Txt style={styles.avatarText}>{String(i + 1)}</Txt>
                </View>
              </View>
              <View style={{ marginTop: 8 }}>
                <StancePill stance={m.stance} />
              </View>
              <View style={{ marginTop: 10 }}>
                <Txt style={styles.columnTitle}>Lead with</Txt>
                <BulletItems items={m.levers} />
              </View>
              <View style={{ marginTop: 6 }}>
                <Txt style={styles.columnTitle}>Avoid</Txt>
                <Txt style={styles.avoid}>{m.avoid ?? NOTHING_IN_EVIDENCE}</Txt>
              </View>
              <View style={[styles.panel, { marginTop: 10 }]}>
                <Txt style={[styles.small, { color: COLORS.muted }]}>
                  {m.citationLabels.length > 0
                    ? `Evidence trace · ${m.citationLabels.join(', ')} (see member read)`
                    : 'Evidence trace · No dossier evidence was cited'}
                </Txt>
              </View>
            </View>
          ))}
        </View>
      )}
    </Section>
  );
}

export function SessionReportPdf({ report }: { report: SessionReport }) {
  return (
    <Document
      title={pdfText(`Rehearsal brief — ${report.title}`)}
      author="Seventh Vote"
      subject={pdfText(report.meta)}
      creator="Seventh Vote"
      producer="Seventh Vote"
    >
      <Page size="LETTER" style={styles.page}>
        <Footer report={report} />
        <Header report={report} />
        <Notices report={report} />
        <Tally report={report} />
        <AgendaItem report={report} />
        {report.pivotal && <Pivotal pivotal={report.pivotal} />}
        {report.consent && <Objectors report={report} />}
        <MemberReads report={report} />
        <Outreach report={report} />
        <View
          style={{
            marginTop: 18,
            paddingTop: 10,
            borderTopWidth: 0.75,
            borderTopColor: COLORS.line,
          }}
          wrap={false}
        >
          <Txt style={[styles.small, { fontSize: 8 }]}>{report.disclaimer}</Txt>
        </View>
      </Page>
    </Document>
  );
}
