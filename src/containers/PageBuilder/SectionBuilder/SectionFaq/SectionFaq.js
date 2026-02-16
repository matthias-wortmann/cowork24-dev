import React, { useState } from 'react';
import classNames from 'classnames';
import { FormattedMessage } from '../../../../util/reactIntl';
import SectionContainer from '../SectionContainer';
import css from './SectionFaq.module.css';

const FAQ_ITEMS = [
  { id: 'faq1', questionId: 'LandingPage.faq1Question', answerId: 'LandingPage.faq1Answer' },
  { id: 'faq2', questionId: 'LandingPage.faq2Question', answerId: 'LandingPage.faq2Answer' },
  { id: 'faq3', questionId: 'LandingPage.faq3Question', answerId: 'LandingPage.faq3Answer' },
  { id: 'faq4', questionId: 'LandingPage.faq4Question', answerId: 'LandingPage.faq4Answer' },
];

/**
 * FAQ-Section mit aufklappbaren Einträgen (alles auf Deutsch).
 */
const SectionFaq = props => {
  const { sectionId, className, rootClassName, defaultClasses, appearance, options } = props;
  const [openId, setOpenId] = useState(null);

  const toggle = id => {
    setOpenId(prev => (prev === id ? null : id));
  };

  return (
    <SectionContainer
      id={sectionId}
      className={className}
      rootClassName={classNames(rootClassName, css.root)}
      appearance={appearance}
      options={options}
    >
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
