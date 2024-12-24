import { useState } from 'react';
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import Api from '../Api';
import { useStaticContext } from '../StaticContext';

function AddressInput({ id, name, onChange, record, value }) {
  const staticContext = useStaticContext();
  const [isLoading, setLoading] = useState(false);
  const [options, setOptions] = useState([]);

  const selectedValue = record ? record[name] : value;
  let selected;
  if (selectedValue) {
    selected = options.find((o) => o.place_name === selectedValue);
    if (!selected) {
      selected = { place_name: selectedValue };
      setOptions([...options, selected]);
    }
    selected = [selected];
  } else {
    selected = [];
  }

  function onChangeInternal(newSelected) {
    if (newSelected?.length) {
      onChange?.({ target: { name, value: newSelected[0] } });
    } else {
      onChange?.({ target: { name, value: null } });
    }
  }

  async function onSearch(query) {
    setLoading(true);
    const response = await Api.mapbox.geocode(query, staticContext.env.MAPBOX_ACCESS_TOKEN);
    setOptions(response.data.features.filter((f) => f.id.startsWith('address.')));
    setLoading(false);
  }

  return (
    <AsyncTypeahead
      id={id ?? name}
      isLoading={isLoading}
      onChange={onChangeInternal}
      onSearch={onSearch}
      labelKey="place_name"
      options={options}
      defaultSelected={selected}
      filterBy={() => true}
    />
  );
}
export default AddressInput;
