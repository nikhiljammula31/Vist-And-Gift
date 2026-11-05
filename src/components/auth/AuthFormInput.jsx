import { forwardRef } from 'react';
import clsx from 'clsx';

const AuthFormInput = forwardRef(
  (
    {
      label,
      type = 'text',
      id,
      name,
      value,
      onChange,
      placeholder,
      required = false,
      error,
      leftIcon: LeftIcon,
      rightElement,
      disabled = false,
      className = '',
      autoComplete,
      ...rest
    },
    ref
  ) => {
    const inputId = id || name;

    return (
      <div className="w-full text-left space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-secondary-dark/70 font-body"
          >
            {label} {required && <span className="text-accent-dark">*</span>}
          </label>
        )}

        <div className="relative rounded-2xl transition-all duration-200">
          {LeftIcon && (
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-secondary-dark/40">
              <LeftIcon className="w-5 h-5 transition-colors group-focus-within:text-accent" />
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            autoComplete={autoComplete}
            className={clsx(
              'w-full py-3.5 px-4 font-body text-sm rounded-2xl bg-white/80 backdrop-blur-sm',
              'text-secondary-dark placeholder-gray-400',
              'border transition-all duration-300 outline-none',
              LeftIcon ? 'pl-11' : 'pl-4',
              rightElement ? 'pr-12' : 'pr-4',
              error
                ? 'border-red-400 bg-red-50/30 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                : 'border-pink-100 hover:border-accent/50 focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/20 shadow-sm',
              disabled && 'opacity-60 cursor-not-allowed bg-gray-50',
              className
            )}
            {...rest}
          />

          {rightElement && (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
              {rightElement}
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs font-medium text-red-500 flex items-center gap-1 font-body pl-1 animate-fadeIn">
            <span>•</span> {error}
          </p>
        )}
      </div>
    );
  }
);

AuthFormInput.displayName = 'AuthFormInput';

export default AuthFormInput;

