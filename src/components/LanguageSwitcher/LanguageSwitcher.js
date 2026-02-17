import React from 'react';
import classNames from 'classnames';

import { useLocale } from '../../context/localeContext';
import { useIntl } from '../../util/reactIntl';

import { Menu, MenuLabel, MenuContent, MenuItem, InlineTextButton } from '../../components';

import css from './LanguageSwitcher.module.css';

const SUPPORTED_LANGUAGES = [
  { code: 'de', flag: '\u{1F1E9}\u{1F1EA}', labelKey: 'LanguageSwitcher.de' },
  { code: 'en', flag: '\u{1F1EC}\u{1F1E7}', labelKey: 'LanguageSwitcher.en' },
  { code: 'es', flag: '\u{1F1EA}\u{1F1F8}', labelKey: 'LanguageSwitcher.es' },
  { code: 'fr', flag: '\u{1F1EB}\u{1F1F7}', labelKey: 'LanguageSwitcher.fr' },
];

/**
 * Language switcher dropdown that allows users to change the UI language.
 * Uses LocaleContext to read and update the active locale.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className - additional CSS class
 * @param {string?} props.rootClassName - overwrite root CSS class
 * @returns {JSX.Element}
 */
const LanguageSwitcher = props => {
  const { className, rootClassName } = props;
  const { locale, setLocale } = useLocale();
  const intl = useIntl();

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === locale) || SUPPORTED_LANGUAGES[0];
  const classes = classNames(rootClassName || css.root, className);

  return (
    <div className={classes}>
      <Menu contentPosition="left">
        <MenuLabel
          className={css.menuLabel}
          isOpenClassName={css.menuLabelOpen}
          ariaLabel={intl.formatMessage({ id: 'LanguageSwitcher.label' })}
        >
          <span className={css.labelContent}>
            <span className={css.flag}>{currentLang.flag}</span>
            <span className={css.code}>{currentLang.code.toUpperCase()}</span>
          </span>
        </MenuLabel>
        <MenuContent className={css.menuContent}>
          {SUPPORTED_LANGUAGES.map(lang => {
            const isActive = lang.code === locale;
            return (
              <MenuItem key={lang.code}>
                <InlineTextButton
                  rootClassName={classNames(css.menuItem, {
                    [css.menuItemActive]: isActive,
                  })}
                  onClick={() => setLocale(lang.code)}
                >
                  <span className={css.menuItemBorder} />
                  <span className={css.menuItemFlag}>{lang.flag}</span>
                  <span className={css.menuItemLabel}>
                    {intl.formatMessage({ id: lang.labelKey })}
                  </span>
                </InlineTextButton>
              </MenuItem>
            );
          })}
        </MenuContent>
      </Menu>
    </div>
  );
};

export default LanguageSwitcher;
