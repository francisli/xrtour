import { OverlayTrigger, Popover } from 'react-bootstrap';
import QRCode from 'react-qr-code';
import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';

function PreviewButton({ href }) {
  const location = useLocation();

  const previewPopover = (
    <Popover>
      <Popover.Body>
        <QRCode size={244} value={`${location.protocol}//${location.host}${href}`} />
      </Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger trigger={['hover', 'focus']} placement="right" overlay={previewPopover}>
      <a className="btn btn-secondary me-2" href={href} rel="noreferrer" target="_blank">
        Preview
      </a>
    </OverlayTrigger>
  );
}

PreviewButton.propTypes = {
  href: PropTypes.string.isRequired,
};

export default PreviewButton;
