import React, { useMemo, useState } from 'react';
import classNames from 'classnames';
import { bool } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { useConfiguration } from '../../context/configurationContext';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { createResourceLocatorString } from '../../util/routes';

import { Page, H1, LayoutSingleColumn, NamedLink } from '../../components';
import { isScrollingDisabled } from '../../ducks/ui.duck';
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';

import css from './FAQLandingPage.module.css';

const SEGMENT_BOOKERS = 'bookers';
const SEGMENT_HOSTS = 'hosts';

const BOOKER_FAQS = [
  ['LandingPage.faq1Question', 'LandingPage.faq1Answer'],
  ['LandingPage.faq2Question', 'LandingPage.faq2Answer'],
  ['LandingPage.faq3Question', 'LandingPage.faq3Answer'],
  ['LandingPage.faq4Question', 'LandingPage.faq4Answer'],
  ['FAQLandingPage.bookers.q5', 'FAQLandingPage.bookers.a5'],
  ['FAQLandingPage.bookers.q6', 'FAQLandingPage.bookers.a6'],
];

const HOST_FAQS = [
  ['SpaceOwnerLandingPage.faq1Question', 'SpaceOwnerLandingPage.faq1Answer'],
  ['SpaceOwnerLandingPage.faq2Question', 'SpaceOwnerLandingPage.faq2Answer'],
  ['SpaceOwnerLandingPage.faq3Question', 'SpaceOwnerLandingPage.faq3Answer'],
  ['SpaceOwnerLandingPage.faq4Question', 'SpaceOwnerLandingPage.faq4Answer'],
  ['SpaceOwnerLandingPage.faq5Question', 'SpaceOwnerLandingPage.faq5Answer'],
  ['FAQLandingPage.hosts.q6', 'FAQLandingPage.hosts.a6'],
];

const toFaqEntities = (intl, entries) =>
  entries.map(([questionId, answerId]) => ({
    '@type': 'Question',
    name: intl.formatMessage({ id: questionId }),
    acceptedAnswer: {
      '@type': 'Answer',
      text: intl.formatMessage({ id: answerId }),
    },
  }));

const FAQLandingPageComponent = props => {
  const { scrollingDisabled } = props;
  const intl = useIntl();
  const config = useConfiguration();
  const routeConfiguration = useRouteConfiguration();

  const [segment, setSegment] = useState(SEGMENT_BOOKERS);
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState(null);

  const pageTitle = intl.formatMessage({ id: 'FAQLandingPage.meta.title' });
  const pageDescription = intl.formatMessage({ id: 'FAQLandingPage.meta.description' });

  const entries = segment === SEGMENT_BOOKERS ? BOOKER_FAQS : HOST_FAQS;
  const filteredEntries = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return entries;
    }
    return entries.filter(([qId, aId]) => {
      const q = intl.formatMessage({ id: qId }).toLowerCase();
      const a = intl.formatMessage({ id: aId }).toLowerCase();
      return q.includes(term) || a.includes(term);
    });
  }, [entries, intl, query]);

  const marketplaceRootURL = config.marketplaceRootURL.replace(/\/$/, '');
  const faqPath = createResourceLocatorString('FAQLandingPage', routeConfiguration, {}, {});
  const faqUrl = `${marketplaceRootURL}${faqPath}`;

  const schema = useMemo(() => {
    const faqEntities = [...toFaqEntities(intl, BOOKER_FAQS), ...toFaqEntities(intl, HOST_FAQS)];
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        '@id': `${faqUrl}#webpage`,
        url: faqUrl,
        name: pageTitle,
        description: pageDescription,
        inLanguage: intl.locale,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        '@id': `${faqUrl}#faq`,
        mainEntity: faqEntities,
      },
    ];
  }, [faqUrl, intl, pageDescription, pageTitle]);

  const toggle = id => setOpenId(prev => (prev === id ? null : id));
  const resetView = nextSegment => {
    setSegment(nextSegment);
    setOpenId(null);
    setQuery('');
  };

  return (
    <Page
      className={css.root}
      title={pageTitle}
      description={pageDescription}
      scrollingDisabled={scrollingDisabled}
      schema={schema}
    >
      <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
        <main className={css.content}>
          <section className={css.hero}>
            <p className={css.eyebrow}>
              <FormattedMessage id="FAQLandingPage.eyebrow" />
            </p>
            <H1 as="h1" className={css.title}>
              <FormattedMessage id="FAQLandingPage.title" />
            </H1>
            <p className={css.lead}>
              <FormattedMessage id="FAQLandingPage.lead" />
            </p>
          </section>

          <section className={css.tools}>
            <div
              className={css.segmentTabs}
              role="tablist"
              aria-label={intl.formatMessage({ id: 'FAQLandingPage.segmentAriaLabel' })}
            >
              <button
                type="button"
                role="tab"
                aria-selected={segment === SEGMENT_BOOKERS}
                className={classNames(css.segmentTab, {
                  [css.segmentTabActive]: segment === SEGMENT_BOOKERS,
                })}
                onClick={() => resetView(SEGMENT_BOOKERS)}
              >
                <FormattedMessage id="FAQLandingPage.segmentBookers" />
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={segment === SEGMENT_HOSTS}
                className={classNames(css.segmentTab, {
                  [css.segmentTabActive]: segment === SEGMENT_HOSTS,
                })}
                onClick={() => resetView(SEGMENT_HOSTS)}
              >
                <FormattedMessage id="FAQLandingPage.segmentHosts" />
              </button>
            </div>

            <input
              type="search"
              className={css.search}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={intl.formatMessage({ id: 'FAQLandingPage.searchPlaceholder' })}
              aria-label={intl.formatMessage({ id: 'FAQLandingPage.searchAriaLabel' })}
            />
          </section>

          <section className={css.faqSection}>
            {filteredEntries.length === 0 ? (
              <p className={css.emptyState}>
                <FormattedMessage id="FAQLandingPage.noResults" />
              </p>
            ) : (
              <dl className={css.list}>
                {filteredEntries.map(([questionId, answerId], idx) => {
                  const id = `${segment}-${idx}`;
                  const isOpen = openId === id;
                  return (
                    <div key={id} className={css.item}>
                      <dt className={css.dt}>
                        <button
                          type="button"
                          className={classNames(css.question, { [css.questionOpen]: isOpen })}
                          onClick={() => toggle(id)}
                          aria-expanded={isOpen}
                          aria-controls={`${id}-answer`}
                          id={`${id}-question`}
                        >
                          <FormattedMessage id={questionId} />
                          <span className={css.icon} aria-hidden>
                            {isOpen ? '−' : '+'}
                          </span>
                        </button>
                      </dt>
                      <dd
                        id={`${id}-answer`}
                        className={classNames(css.answerWrap, { [css.answerWrapOpen]: isOpen })}
                        aria-labelledby={`${id}-question`}
                      >
                        <div className={css.answer}>
                          <FormattedMessage id={answerId} />
                        </div>
                      </dd>
                    </div>
                  );
                })}
              </dl>
            )}
          </section>

          <section className={css.ctaRow}>
            <NamedLink name="SearchPage" className={css.ctaPrimary}>
              <FormattedMessage id="FAQLandingPage.ctaBookers" />
            </NamedLink>
            <NamedLink name="SpaceOwnerLandingPage" className={css.ctaSecondary}>
              <FormattedMessage id="FAQLandingPage.ctaHosts" />
            </NamedLink>
          </section>
        </main>
      </LayoutSingleColumn>
    </Page>
  );
};

FAQLandingPageComponent.propTypes = {
  scrollingDisabled: bool,
};

const mapStateToProps = state => ({
  scrollingDisabled: isScrollingDisabled(state),
});

const FAQLandingPage = compose(connect(mapStateToProps))(FAQLandingPageComponent);

export { FAQLandingPageComponent };
export default FAQLandingPage;
