import { useEffect, useState } from 'react';
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import PropTypes from 'prop-types';

import Api from '../Api';
import { useStaticContext } from '../StaticContext';

function FontInput({ id, name, onChange, record, value }) {
  const staticContext = useStaticContext();
  const [isLoading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [options, setOptions] = useState([]);

  useEffect(() => {
    Api.google.webfonts(staticContext.env.GOOGLE_WEBFONTS_API_KEY).then((response) => {
      setItems(response.data.items);
      setLoading(false);
    });
  }, [staticContext.env.GOOGLE_WEBFONTS_API_KEY]);

  const selectedValue = record ? record[name] : value;
  let selected;
  if (selectedValue) {
    selected = options.find((o) => o.family === selectedValue.family);
    if (!selected) {
      selected = selectedValue;
      setOptions([...options, selected]);
    }
    selected = [selected];
  } else {
    selected = [];
  }

  function onChangeInternal(newSelected) {
    if (newSelected?.length) {
      const newValue = {
        family: newSelected[0].family,
        subsets: ['latin'],
      };
      onChange?.({ target: { name, value: newValue } });
    } else {
      onChange?.({ target: { name, value: null } });
    }
  }

  function onChangeSubset(event) {
    if (event.target.checked) {
      onChange?.({ target: { name, value: { ...selectedValue, subsets: [...selectedValue.subsets, event.target.value] } } });
    } else {
      onChange?.({
        target: { name, value: { ...selectedValue, subsets: selectedValue.subsets.filter((ss) => ss !== event.target.value) } },
      });
    }
  }

  async function onSearch(query) {
    setOptions(items.filter((f) => f.family.toLowerCase().includes(query.toLowerCase())));
  }

  return (
    <div>
      <AsyncTypeahead
        clearButton
        id={id ?? name}
        isLoading={isLoading}
        onChange={onChangeInternal}
        onSearch={onSearch}
        labelKey="family"
        options={options}
        selected={selected}
        filterBy={() => true}
      />
      {selected.length > 0 &&
        selected[0].subsets.map((ss) => (
          <div key={ss} className="form-check mt-2">
            <input
              onChange={onChangeSubset}
              checked={selectedValue?.subsets?.includes(ss)}
              disabled={ss === 'latin'}
              type="checkbox"
              className="form-check-input"
              value={ss}
            />
            <label className="form-check-label">{ss}</label>
          </div>
        ))}
    </div>
  );
}

FontInput.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  record: PropTypes.object,
  value: PropTypes.string,
};

export default FontInput;
