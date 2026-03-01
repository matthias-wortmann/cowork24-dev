import React from 'react';
import { Heading } from '../../components';
import { richText } from '../../util/richText';
import { sanitizeHtml } from '../../util/sanitize';

import css from './ListingPage.module.css';

const MIN_LENGTH_FOR_LONG_WORDS = 20;

const ALLOWED_HTML_TAG_REGEX = /<\/?(p|strong|em|u|s|ul|ol|li|blockquote|br|hr)\b[^>]*>/i;

/**
 * Renders listing description text. Supports both plain text (legacy)
 * and HTML content from the rich text editor.
 */
const SectionTextMaybe = props => {
  const { text, heading, showAsIngress = false } = props;

  if (!text) return null;

  const isHtml = ALLOWED_HTML_TAG_REGEX.test(text);

  const textClass = showAsIngress ? css.ingress : css.text;

  const renderContent = () => {
    if (isHtml) {
      const cleanHtml = sanitizeHtml(text);
      return (
        <div
          className={showAsIngress ? css.richContentIngress : css.richContent}
          dangerouslySetInnerHTML={{ __html: cleanHtml }}
        />
      );
    }

    const content = richText(text, {
      linkify: true,
      longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS,
      longWordClass: css.longWord,
      breakChars: '/',
    });

    return <p className={textClass}>{content}</p>;
  };

  return (
    <section className={css.sectionText}>
      {heading ? (
        <Heading as="h2" rootClassName={css.sectionHeading}>
          {heading}
        </Heading>
      ) : null}
      {renderContent()}
    </section>
  );
};

export default SectionTextMaybe;
