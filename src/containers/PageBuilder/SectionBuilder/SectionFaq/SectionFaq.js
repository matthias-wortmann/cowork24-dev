import React, { useState } from 'react';
import classNames from 'classnames';
import { useIntl, FormattedMessage } from '../../../../util/reactIntl';
import { landingSectionSurfaceClassName } from '../../../LandingPage/landingSectionSurface';
import SectionContainer from '../SectionContainer';
import css from './SectionFaq.module.css';

const FAQ_ITEMS = [
  { id: 'faq1', questionId: 'LandingPage.faq1Question', answerId: 'LandingPage.faq1Answer' },
  { id: 'faq2', questionId: 'LandingPage.faq2Question', answerId: 'LandingPage.faq2Answer' },
  { id: 'faq3', questionId: 'LandingPage.faq3Question', answerId: 'LandingPage.faq3Answer' },
  { id: 'faq4', questionId: 'LandingPage.faq4Question', answerId: 'LandingPage.faq4Answer' },
];

/**
 * FAQ-Section mit aufklappbaren Einträgen und FAQPage JSON-LD für Rich Results / KI-Suche.
 */
const SectionFaq = props => {
  const { sectionId, className, rootClassName, defaultClasses, appearance, options, landingSurface } =
    props;
  const [openId, setOpenId] = useState(null);
  const intl = useIntl();

  const toggle = id => {
    setOpenId(prev => (prev === id ? null : id));
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map(({ questionId, answerId }) => ({
      '@type': 'Question',
      name: intl.formatMessage({ id: questionId }),
      acceptedAnswer: {
        '@type': 'Answer',
        text: intl.formatMessage({ id: answerId }),
      },
    })),
  };

  return (
    <SectionContainer
      id={sectionId}
      className={className}
      rootClassName={classNames(
        rootClassName,
        landingSectionSurfaceClassName(landingSurface)
      )}
      appearance={appearance}
      options={options}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className={css.wrapper}>
        <h2 className={classNames(defaultClasses?.title, css.title)}>
          <FormattedMessage id="LandingPage.faqTitle" />
        </h2>
        <p className={classNames(defaultClasses?.description, css.description)}>
          <FormattedMessage id="LandingPage.faqDescription" />
        </p>
        <dl className={css.list}>
          {FAQ_ITEMS.map(({ id, questionId, answerId }) => {
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
      </div>
    </SectionContainer>
  );
};

export default SectionFaq;
