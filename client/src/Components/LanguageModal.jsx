import { useState } from 'react';
import { Modal } from 'react-bootstrap';
import PropTypes from 'prop-types';

import FormGroup from './FormGroup';

const SUPPORTED_LANGUAGES = [
  ['Afrikaans', 'af', 'Afrikaans'],
  ['Albanian', 'sq', 'Shqip'],
  ['Amharic', 'am', 'አማርኛ'],
  ['Arabic', 'ar', 'العربية'],
  ['Armenian', 'hy', 'Հայերեն'],
  ['Azerbaijani', 'az', 'Azərbaycan'],
  ['Bengali', 'bn', 'বাংলা'],
  ['Bosnian', 'bs', 'Bosanski'],
  ['Bulgarian', 'bg', 'Български'],
  ['Catalan', 'ca', 'Català'],
  ['Chinese (Simplified)', 'zh', '简体中文'],
  ['Chinese (Traditional)', 'zh-TW', '繁體中文'],
  ['Croatian', 'hr', 'Hrvatski'],
  ['Czech', 'cs', 'Čeština'],
  ['Danish', 'da', 'Dansk'],
  ['Dari', 'fa-AF', 'دری'],
  ['Dutch', 'nl', 'Nederlands'],
  ['English', 'en', 'English'],
  ['Estonian', 'et', 'Eesti'],
  ['Farsi (Persian)', 'fa', 'فارسی'],
  ['Filipino, Tagalog', 'tl', 'Tagalog'],
  ['Finnish', 'fi', 'Suomi'],
  ['French', 'fr', 'Français'],
  ['French (Canada)', 'fr-CA', 'Français (Canada)'],
  ['Georgian', 'ka', 'ქართული'],
  ['German', 'de', 'Deutsch'],
  ['Greek', 'el', 'Ελληνικά'],
  ['Gujarati', 'gu', 'ગુજરાતી'],
  ['Haitian Creole', 'ht', 'Kreyòl Ayisyen'],
  ['Hausa', 'ha', 'Hausa'],
  ['Hebrew', 'he', 'עברית'],
  ['Hindi', 'hi', 'हिन्दी'],
  ['Hungarian', 'hu', 'Magyar'],
  ['Icelandic', 'is', 'Íslenska'],
  ['Indonesian', 'id', 'Bahasa Indonesia'],
  ['Irish', 'ga', 'Gaeilge'],
  ['Italian', 'it', 'Italiano'],
  ['Japanese', 'ja', '日本語'],
  ['Kannada', 'kn', 'ಕನ್ನಡ'],
  ['Kazakh', 'kk', 'Қазақ'],
  ['Korean', 'ko', '한국어'],
  ['Latvian', 'lv', 'Latviešu'],
  ['Lithuanian', 'lt', 'Lietuvių'],
  ['Macedonian', 'mk', 'Македонски'],
  ['Malay', 'ms', 'Bahasa Melayu'],
  ['Malayalam', 'ml', 'മലയാളം'],
  ['Maltese', 'mt', 'Malti'],
  ['Marathi', 'mr', 'मराठी'],
  ['Mongolian', 'mn', 'Монгол'],
  ['Norwegian (Bokmål)', 'no', 'Norsk Bokmål'],
  ['Pashto', 'ps', 'پښتو'],
  ['Polish', 'pl', 'Polski'],
  ['Portuguese (Brazil)', 'pt', 'Português (Brasil)'],
  ['Portuguese (Portugal)', 'pt-PT', 'Português (Portugal)'],
  ['Punjabi', 'pa', 'ਪੰਜਾਬੀ'],
  ['Romanian', 'ro', 'Română'],
  ['Russian', 'ru', 'Русский'],
  ['Serbian', 'sr', 'Српски'],
  ['Sinhala', 'si', 'සිංහල'],
  ['Slovak', 'sk', 'Slovenčina'],
  ['Slovenian', 'sl', 'Slovenščina'],
  ['Somali', 'so', 'Soomaali'],
  ['Spanish', 'es', 'Español'],
  ['Spanish (Mexico)', 'es-MX', 'Español (México)'],
  ['Swahili', 'sw', 'Kiswahili'],
  ['Swedish', 'sv', 'Svenska'],
  ['Tamil', 'ta', 'தமிழ்'],
  ['Telugu', 'te', 'తెలుగు'],
  ['Thai', 'th', 'ไทย'],
  ['Turkish', 'tr', 'Türkçe'],
  ['Ukrainian', 'uk', 'Українська'],
  ['Urdu', 'ur', 'اردو'],
  ['Uzbek', 'uz', 'Oʻzbek'],
  ['Vietnamese', 'vi', 'Tiếng Việt'],
  ['Welsh', 'cy', 'Cymraeg'],
];

function LanguageModal({ onCancel, onOK, variants }) {
  const [language, setLanguage] = useState({
    code: '',
    name: '',
    displayName: '',
  });

  const variantCodes = variants.map((v) => v.code);
  const languages = SUPPORTED_LANGUAGES.filter((l) => !variantCodes.includes(l[1]));

  function onChange(event) {
    const newLanguage = { ...language };
    const { name, value } = event.target;
    newLanguage[name] = value;
    if (name === 'code') {
      if (value) {
        const selectedLanguage = SUPPORTED_LANGUAGES.find((l) => l[1] === value);
        newLanguage.name = selectedLanguage[0];
        newLanguage.displayName = selectedLanguage[2];
      } else {
        newLanguage.name = '';
        newLanguage.displayName = '';
      }
    }
    setLanguage(newLanguage);
  }

  return (
    <Modal centered show onHide={onCancel ?? onOK}>
      <Modal.Header closeButton>
        <Modal.Title>Add Language</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <form>
          <FormGroup type="select" name="code" label="Language" onChange={onChange} value={language.code}>
            <option value="">Select a language</option>
            {languages.map((l) => (
              <option key={l[1]} value={l[1]}>
                {l[0]}
              </option>
            ))}
          </FormGroup>
          <FormGroup
            name="displayName"
            label="Display Name"
            helpText="The name of the language as it appears to the public"
            onChange={onChange}
            placeholder={language.name}
            value={language.displayName}
          />
        </form>
      </Modal.Body>
      <fieldset>
        <Modal.Footer>
          {!!onCancel && (
            <button onClick={() => onCancel()} className="btn btn-secondary">
              Cancel
            </button>
          )}
          {!!onOK && (
            <button disabled={!language.code} onClick={() => onOK(language)} className="btn btn-primary">
              OK
            </button>
          )}
        </Modal.Footer>
      </fieldset>
    </Modal>
  );
}

LanguageModal.propTypes = {
  onCancel: PropTypes.func,
  onOK: PropTypes.func,
  variants: PropTypes.array,
};

export default LanguageModal;
