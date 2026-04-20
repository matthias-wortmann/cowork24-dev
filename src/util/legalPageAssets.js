import { termsOfServicePageAsset } from '../assets/hosted-page-defaults/termsOfServicePageAsset';
import { privacyPolicyPageAsset } from '../assets/hosted-page-defaults/privacyPolicyPageAsset';

const hasUsableSections = data => data && Array.isArray(data.sections) && data.sections.length > 0;

/**
 * Ob die AGB-/Datenschutz-Seiten die Inhalte aus der Sharetribe Console (Asset Delivery)
 * statt der gebündelten Defaults aus dem Repo verwenden sollen.
 *
 * @returns {boolean}
 */
const useHostedLegalPageAssets = () =>
  typeof process !== 'undefined' && process.env.REACT_APP_USE_HOSTED_LEGAL_PAGE_ASSETS === 'true';

/**
 * @param {Object|null|undefined} hostedData Page-Builder-Daten aus `pageAssetsData.*.data`
 * @returns {Object} `sections` + `meta` für die AGB-Seite
 */
export const resolveTermsOfServicePageAssetData = hostedData => {
  if (useHostedLegalPageAssets() && hasUsableSections(hostedData)) {
    return hostedData;
  }
  return termsOfServicePageAsset;
};

/**
 * @param {Object|null|undefined} hostedData Page-Builder-Daten aus `pageAssetsData.*.data`
 * @returns {Object} `sections` + `meta` für die Datenschutz-Seite
 */
export const resolvePrivacyPolicyPageAssetData = hostedData => {
  if (useHostedLegalPageAssets() && hasUsableSections(hostedData)) {
    return hostedData;
  }
  return privacyPolicyPageAsset;
};
