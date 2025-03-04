import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

function URLText({ url }) {
  const [text, setText] = useState();

  useEffect(() => {
    if (url) {
      fetch(url)
        .then((response) => response.text())
        .then((text) => setText(text))
        .catch((error) => console.error('Error fetching URL:', error));
    }
  }, [url]);

  return (
    <div className="h-100" style={{ whiteSpace: 'pre-wrap', overflowY: 'scroll' }}>
      {text}
    </div>
  );
}

URLText.propTypes = {
  url: PropTypes.string.isRequired,
};

export default URLText;
