import { useEffect, useRef } from 'react';
import classNames from 'classnames';

function FormGroup({
  children,
  disabled,
  id,
  type = 'text',
  name,
  label,
  helpText,
  placeholder,
  plaintext,
  record,
  value,
  error,
  onChange,
}) {
  const ref = useRef();

  useEffect(() => {
    if (type === 'textarea' && ref.current) {
      ref.current.style.height = 'auto';
      const { scrollHeight } = ref.current;
      ref.current.style.height = `${scrollHeight + 2}px`;
    }
  }, [type, value]);

  return (
    <div className="mb-3">
      <label className="form-label" htmlFor={id ?? name}>
        {label}
      </label>
      {type === 'select' && (
        <select
          className={classNames({
            'form-select': !plaintext,
            'form-control-plaintext': plaintext,
            'is-invalid': error?.errorsFor?.(name),
          })}
          disabled={!!disabled}
          id={id ?? name}
          name={name}
          placeholder={placeholder}
          readOnly={plaintext}
          onChange={onChange}
          value={record ? record[name] : value}>
          {children}
        </select>
      )}
      {type === 'textarea' && (
        <textarea
          ref={ref}
          className={classNames({
            'form-control': !plaintext,
            'form-control-plaintext': plaintext,
            'is-invalid': error?.errorsFor?.(name),
          })}
          disabled={!!disabled}
          id={id ?? name}
          name={name}
          placeholder={placeholder}
          readOnly={plaintext}
          onChange={onChange}
          value={record ? record[name] : value}></textarea>
      )}
      {type !== 'textarea' && type !== 'select' && (
        <input
          type={type}
          className={classNames({
            'form-control': !plaintext,
            'form-control-plaintext': plaintext,
            'is-invalid': error?.errorsFor?.(name),
          })}
          disabled={!!disabled}
          id={id ?? name}
          name={name}
          placeholder={placeholder}
          readOnly={plaintext}
          onChange={onChange}
          value={record ? record[name] : value}
        />
      )}
      {error?.errorMessagesHTMLFor?.(name)}
      {helpText && <div className="form-text">{helpText}</div>}
    </div>
  );
}
export default FormGroup;
