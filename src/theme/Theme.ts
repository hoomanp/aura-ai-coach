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
  trademarkNotice: 'Abbott®, Merlin.net™, and myMerlinPulse™ are registered trademarks of Abbott Laboratories. This project is an independent open-source educational demonstration and is not affiliated with, endorsed by, or sponsored by Abbott.',
  disclaimer: 'Aura AI is an experimental open-source wellness coach demonstration and is NOT intended for the diagnosis, cure, mitigation, treatment, or prevention of any disease or medical condition. Always consult with a licensed physician regarding your cardiac care.',
  copyright: `© ${new Date().getFullYear()} Hooman Parta & Contributors. Released under the MIT License.`,
};

export const Spacing = {
  xs: 4,
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
