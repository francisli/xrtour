import { OverlayTrigger, Popover } from 'react-bootstrap';
import ColorPicker from '@rc-component/color-picker';
import PropTypes from 'prop-types';

function ColorInput({ name, value, onChange }) {
  function onChangeInternal(newValue) {
    onChange?.({ target: { name, value: newValue.toHexString() } });
  }

  const style = {
    backgroundColor: value,
    borderColor: 'var(--bs-border-color)',
  };
  if (!value) {
    style.borderColor = 'var(--bs-border-color)';
  }

  return (
    <div className="d-flex">
      <OverlayTrigger
        trigger={['click']}
        placement="top"
        overlay={
          <Popover style={{ maxWidth: 'none' }}>
            <Popover.Body>
              <ColorPicker value={value} onChange={onChangeInternal} />
            </Popover.Body>
          </Popover>
        }>
        <button type="button" className="btn" style={style}>
          &nbsp;&nbsp;&nbsp;
        </button>
      </OverlayTrigger>
      <input type="text" name={name} value={value} onChange={onChange} className="form-control ms-2" />
    </div>
  );
}
ColorInput.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default ColorInput;
