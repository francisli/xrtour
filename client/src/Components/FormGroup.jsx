import { useEffect, useRef } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

import AddressInput from './AddressInput';

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
          value={record ? record[name] ?? '' : value}>
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
          value={record ? record[name] ?? '' : value}></textarea>
      )}
      {type === 'address' && <AddressInput id={id} name={name} record={record} value={value} onChange={onChange} />}
      {type !== 'address' && type !== 'textarea' && type !== 'select' && (
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
          value={record ? record[name] ?? '' : value}
        />
      )}
      {error?.errorMessagesHTMLFor?.(name)}
      {helpText && <div className="form-text">{helpText}</div>}
    </div>
  );
}

FormGroup.propTypes = {
  children: PropTypes.node,
  disabled: PropTypes.bool,
  id: PropTypes.string,
  type: PropTypes.string,
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  helpText: PropTypes.string,
  placeholder: PropTypes.string,
  plaintext: PropTypes.bool,
  record: PropTypes.object,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  error: PropTypes.object,
  onChange: PropTypes.func.isRequired,
};

export default FormGroup;
