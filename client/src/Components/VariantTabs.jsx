import classNames from 'classnames';
import PropTypes from 'prop-types';

function VariantTabs({ variants, current, setVariant }) {
  return (
    <ul className="nav nav-tabs mb-3">
      {variants.map((v) => (
        <li key={v.code} className="nav-item">
          <a
            onClick={(event) => {
              event.preventDefault();
              setVariant(v);
            }}
            className={classNames('nav-link', { active: v === current })}
            aria-current="page"
            href={`#${v.code}`}>
            {v.name}
          </a>
        </li>
      ))}
    </ul>
  );
}

VariantTabs.propTypes = {
  variants: PropTypes.array.isRequired,
  current: PropTypes.object.isRequired,
  setVariant: PropTypes.func.isRequired,
};

export default VariantTabs;
