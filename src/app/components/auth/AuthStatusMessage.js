const VARIANT_STYLES = {
  danger: {
    backgroundColor: '#fef2f2',
    borderColor: '#dc2626',
    textColor: '#b91c1c',
  },
  success: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    textColor: '#15803d',
  },
  warning: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    textColor: '#92400e',
  },
  info: {
    backgroundColor: '#f0f9ff',
    borderColor: '#bae6fd',
    textColor: '#075985',
  },
};

export default function AuthStatusMessage({
  variant = 'danger',
  children,
  className = '',
}) {
  if (!children) {
    return null;
  }

  const tone = VARIANT_STYLES[variant] || VARIANT_STYLES.danger;

  return (
    <div
      role="alert"
      className={['rounded-2xl px-4 py-3 text-sm', className].join(' ')}
      style={{
        backgroundColor: tone.backgroundColor,
        borderColor: tone.borderColor,
        borderStyle: 'solid',
        borderWidth: '1.5px',
      }}
    >
      <span style={{ color: tone.textColor }}>{children}</span>
    </div>
  );
}
