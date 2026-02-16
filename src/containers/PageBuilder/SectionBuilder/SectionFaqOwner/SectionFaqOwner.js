import React, { useState } from 'react';
import classNames from 'classnames';

import { useIntl, FormattedMessage } from '../../../../util/reactIntl';

import SectionContainer from '../SectionContainer';
import css from './SectionFaqOwner.module.css';

const FAQ_ITEMS = [
  {
    id: 'ownerFaq1',
    questionId: 'SpaceOwnerLandingPage.faq1Question',
    answerId: 'SpaceOwnerLandingPage.faq1Answer',
  },
  {
    id: 'ownerFaq2',
    questionId: 'SpaceOwnerLandingPage.faq2Question',
    answerId: 'SpaceOwnerLandingPage.faq2Answer',
  },
  {
    id: 'ownerFaq3',
    questionId: 'SpaceOwnerLandingPage.faq3Question',
    answerId: 'SpaceOwnerLandingPage.faq3Answer',
  },
  {
    id: 'ownerFaq4',
    questionId: 'SpaceOwnerLandingPage.faq4Question',
    answerId: 'SpaceOwnerLandingPage.faq4Answer',
  },
  {
    id: 'ownerFaq5',
    questionId: 'SpaceOwnerLandingPage.faq5Question',
    answerId: 'SpaceOwnerLandingPage.faq5Answer',
  },
];

/**
 * FAQ section with accordion and FAQPage JSON-LD schema for Google AI Search.
 *
 * @component
 * @param {Object} props
 * @param {string} props.sectionId
 * @param {string?} props.className
 * @param {string?} props.rootClassName
 * @param {Object?} props.defaultClasses
 * @param {Object?} props.appearance
 * @param {Object?} props.options
 * @returns {JSX.Element}
 */
const SectionFaqOwner = props => {
  const { sectionId, className, rootClassName, defaultClasses, appearance, options } = props;
  const [openId, setOpenId] = useState(null);
  const intl = useIntl();

  const toggle = id => {
    setOpenId(prev => (prev === id ? null : id));
  };

  // Build FAQPage JSON-LD for Google structured data
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
      rootClassName={classNames(rootClassName, css.root)}
      appearance={appearance}
      options={options}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className={css.wrapper}>
        <h2 className={classNames(defaultClasses?.title, css.title)}>
          <FormattedMessage id="SpaceOwnerLandingPage.faqTitle" />
        </h2>
        <p className={classNames(defaultClasses?.description, css.description)}>
          <FormattedMessage id="SpaceOwnerLandingPage.faqSubtitle" />
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
                    <span className={css.icon} aria-hidden="true">
                      {isOpen ? '\u2212' : '+'}
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

export default SectionFaqOwner;
