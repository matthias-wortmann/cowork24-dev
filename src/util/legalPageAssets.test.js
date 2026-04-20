import { termsOfServicePageAsset } from '../assets/hosted-page-defaults/termsOfServicePageAsset';
import { privacyPolicyPageAsset } from '../assets/hosted-page-defaults/privacyPolicyPageAsset';
import {
  resolvePrivacyPolicyPageAssetData,
  resolveTermsOfServicePageAssetData,
} from './legalPageAssets';

describe('legalPageAssets', () => {
  const prevHosted = process.env.REACT_APP_USE_HOSTED_LEGAL_PAGE_ASSETS;

  afterEach(() => {
    process.env.REACT_APP_USE_HOSTED_LEGAL_PAGE_ASSETS = prevHosted;
  });

  it('returns bundled terms asset when hosted flag is not true', () => {
    delete process.env.REACT_APP_USE_HOSTED_LEGAL_PAGE_ASSETS;
    const hosted = { sections: [{ sectionType: 'article', sectionId: 'x' }], meta: {} };
    expect(resolveTermsOfServicePageAssetData(hosted)).toBe(termsOfServicePageAsset);
  });

  it('returns hosted terms asset when flag is true and sections exist', () => {
    process.env.REACT_APP_USE_HOSTED_LEGAL_PAGE_ASSETS = 'true';
    const hosted = { sections: [{ sectionType: 'article', sectionId: 'x' }], meta: {} };
    expect(resolveTermsOfServicePageAssetData(hosted)).toBe(hosted);
  });

  it('returns bundled privacy asset when hosted is empty', () => {
    delete process.env.REACT_APP_USE_HOSTED_LEGAL_PAGE_ASSETS;
    expect(resolvePrivacyPolicyPageAssetData(null)).toBe(privacyPolicyPageAsset);
  });
});
