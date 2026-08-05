import React, { forwardRef } from 'react';

const sizeClasses = {
  sm: 'text-sm min-h-[36px] px-4 py-2',
  md: 'min-h-[var(--touch-min)] px-5 py-2.5 text-base',
  lg: 'min-h-[52px] px-7 py-3 text-lg',
};

export default forwardRef(function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  iconOnly = false,
  type = 'button',
  ...props
}, ref) {
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      data-variant={variant}
      className={`ui-btn ${sizeClass} ${iconOnly ? 'aspect-square p-2.5' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});
