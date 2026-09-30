import { Colors, Spacing, Typography, LegalStrings } from './Theme';

describe('Design System & Legal Strings (Theme.ts)', () => {
  it('defines consistent color palette tokens', () => {
    expect(Colors.primary).toBe('#00A9E0');
    expect(Colors.secondary).toBe('#FF6F00');
    expect(Colors.background).toBe('#F8F9FA');
    expect(Colors.card).toBe('#FFFFFF');
    expect(Colors.danger).toBe('#DC3545');
    expect(Colors.success).toBe('#28A745');
    expect(Colors.warning).toBe('#FFC107');
  });

  it('defines hierarchical 4pt grid spacing scale with xs through xl', () => {
    expect(Spacing.xs).toBe(4);
    expect(Spacing.s).toBe(8);
    expect(Spacing.m).toBe(16);
    expect(Spacing.l).toBe(24);
    expect(Spacing.xl).toBe(32);
  });

  it('defines typography tokens with font sizes and alignments', () => {
    expect(Typography.h1.fontSize).toBe(28);
    expect(Typography.h2.fontSize).toBe(20);
    expect(Typography.body.fontSize).toBe(16);
    expect(Typography.caption.fontSize).toBe(14);
    expect(Typography.legal.fontSize).toBe(11);
    expect(Typography.legal.textAlign).toBe('center');
  });

  it('contains mandatory medical non-diagnostic and trademark disclaimers', () => {
    expect(LegalStrings.trademarkNotice).toContain('Abbott®');
    expect(LegalStrings.trademarkNotice).toContain('Merlin.net™');
    expect(LegalStrings.trademarkNotice).toContain('not affiliated with, endorsed by, or sponsored by Abbott');

    expect(LegalStrings.disclaimer).toContain('NOT intended for the diagnosis');
    expect(LegalStrings.disclaimer).toContain('licensed physician');

    expect(LegalStrings.copyright).toContain('Hooman Parta & Contributors');
    expect(LegalStrings.copyright).toContain('MIT License');
  });
});
