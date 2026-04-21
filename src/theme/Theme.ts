export const Colors = {
  primary: '#00A9E0', // Official Abbott Blue
  secondary: '#FF6F00', // Wellness Orange
  background: '#F8F9FA',
  card: '#FFFFFF',
  text: '#212529',
  textSecondary: '#6C757D',
  success: '#28A745',
  warning: '#FFC107',
  danger: '#DC3545',
  legalGray: '#ADB5BD',
};

export const LegalStrings = {
  trademarkNotice: 'Abbott®, Merlin.net™, and myMerlinPulse™ are trademarks of the Abbott Group of Companies.',
  disclaimer: 'Aura AI is an experimental wellness coach and is not intended for the diagnosis or treatment of any medical condition. Always consult with your healthcare professional regarding your heart health.',
  copyright: `© ${new Date().getFullYear()} Abbott. All rights reserved.`,
};

export const Spacing = {
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
};

export const Typography = {
  h1: { fontSize: 28, fontWeight: '700' as const },
  h2: { fontSize: 20, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  caption: { fontSize: 14, fontWeight: '400' as const, color: Colors.textSecondary },
  legal: { fontSize: 11, color: Colors.legalGray, textAlign: 'center' as const },
};
