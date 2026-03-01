import React, { useCallback, useEffect } from 'react';
import { Field } from 'react-final-form';
import classNames from 'classnames';

import { ValidationError } from '../../components';

import css from './FieldRichTextEditor.module.css';

let tiptapModules = null;

const loadTiptapModules = () => {
  if (tiptapModules) return tiptapModules;

  // Lazy-load only in browser runtime to keep Jest/SSR from parsing ESM-only tiptap internals.
  const { useEditor, EditorContent } = require('@tiptap/react');
  const starterKitModule = require('@tiptap/starter-kit');
  const underlineModule = require('@tiptap/extension-underline');

  tiptapModules = {
    useEditor,
    EditorContent,
    StarterKit: starterKitModule.default || starterKitModule,
    Underline: underlineModule.default || underlineModule,
  };

  return tiptapModules;
};

const BoldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" />
  </svg>
);

const ItalicIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z" />
  </svg>
);

const UnderlineIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z" />
  </svg>
);

const StrikethroughIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z" />
  </svg>
);

const BulletListIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z" />
  </svg>
);

const OrderedListIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z" />
  </svg>
);

const BlockquoteIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
  </svg>
);

const EditorToolbar = ({ editor }) => {
  if (!editor) return null;

  const btnClass = active => (active ? css.toolbarButtonActive : css.toolbarButton);

  return (
    <div className={css.toolbar}>
      <div className={css.toolbarGroup}>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btnClass(editor.isActive('bold'))}
          title="Fett"
        >
          <BoldIcon />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btnClass(editor.isActive('italic'))}
          title="Kursiv"
        >
          <ItalicIcon />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={btnClass(editor.isActive('underline'))}
          title="Unterstrichen"
        >
          <UnderlineIcon />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={btnClass(editor.isActive('strike'))}
          title="Durchgestrichen"
        >
          <StrikethroughIcon />
        </button>
      </div>

      <div className={css.toolbarDivider} />

      <div className={css.toolbarGroup}>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={btnClass(editor.isActive('bulletList'))}
          title="Aufzählung"
        >
          <BulletListIcon />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={btnClass(editor.isActive('orderedList'))}
          title="Nummerierung"
        >
          <OrderedListIcon />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={btnClass(editor.isActive('blockquote'))}
          title="Zitat"
        >
          <BlockquoteIcon />
        </button>
      </div>
    </div>
  );
};

/**
 * Strip HTML tags to get plain text content for validation.
 */
const stripHtml = html => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
};

const RichTextEditorComponent = props => {
  const {
    rootClassName,
    className,
    id,
    label,
    labelClassName,
    input,
    meta,
    placeholder,
    hideErrorMessage,
    customErrorText,
  } = props;

  const canUseRichEditor = typeof window !== 'undefined' && process.env.NODE_ENV !== 'test';
  if (!canUseRichEditor) {
    const { value, onChange, onBlur, onFocus, name } = input;
    const { invalid, touched, error } = meta;
    const errorText = customErrorText || error;
    const hasError = !!customErrorText || !!(touched && invalid && error);
    const fieldMeta = { touched: hasError, error: errorText };

    if (label && !id) {
      throw new Error('id required when a label is given');
    }

    const wrapperClasses = classNames(css.editorWrapper, {
      [css.editorWrapperError]: hasError,
    });
    const labelClassMaybe = labelClassName ? { className: labelClassName } : {};
    const classes = classNames(rootClassName || css.root, className);

    return (
      <div className={classes}>
        {label ? (
          <label htmlFor={id} {...labelClassMaybe}>
            {label}
          </label>
        ) : null}
        <div className={wrapperClasses}>
          <div className={css.editor}>
            <textarea
              id={id}
              name={name}
              className={css.fallbackTextarea}
              value={value || ''}
              onFocus={() => onFocus?.()}
              onBlur={() => onBlur?.()}
              onChange={event => onChange(event.target.value)}
              placeholder={placeholder || ''}
            />
          </div>
        </div>
        {hideErrorMessage ? null : <ValidationError fieldMeta={fieldMeta} />}
      </div>
    );
  }

  const { useEditor, EditorContent, StarterKit, Underline } = loadTiptapModules();

  const { value, onChange, onBlur, onFocus } = input;
  const { invalid, touched, error } = meta;
  const errorText = customErrorText || error;
  const hasError = !!customErrorText || !!(touched && invalid && error);
  const fieldMeta = { touched: hasError, error: errorText };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      Underline,
    ],
    content: value || '',
    onFocus: () => onFocus?.(),
    onBlur: () => onBlur?.(),
    editorProps: {
      attributes: {
        'data-placeholder': placeholder || '',
      },
    },
  });

  const syncRef = React.useRef(value);
  useEffect(() => {
    if (editor && value !== syncRef.current) {
      syncRef.current = value;
      const { from, to } = editor.state.selection;
      editor.commands.setContent(value || '', false);
      try {
        editor.commands.setTextSelection({ from, to });
      } catch {
        // Selection might be out of range after content change
      }
    }
  }, [value, editor]);

  const handleUpdate = useCallback(
    ({ editor: e }) => {
      const html = e.getHTML();
      const isEmpty = !stripHtml(html);
      const newValue = isEmpty ? '' : html;
      syncRef.current = newValue;
      onChange(newValue);
    },
    [onChange]
  );

  useEffect(() => {
    if (editor) {
      editor.on('update', handleUpdate);
      return () => editor.off('update', handleUpdate);
    }
  }, [editor, handleUpdate]);

  if (label && !id) {
    throw new Error('id required when a label is given');
  }

  const wrapperClasses = classNames(css.editorWrapper, {
    [css.editorWrapperError]: hasError,
  });
  const labelClassMaybe = labelClassName ? { className: labelClassName } : {};
  const classes = classNames(rootClassName || css.root, className);

  return (
    <div className={classes}>
      {label ? (
        <label htmlFor={id} {...labelClassMaybe}>
          {label}
        </label>
      ) : null}
      <div className={wrapperClasses}>
        <EditorToolbar editor={editor} />
        <div className={css.editor}>
          <EditorContent editor={editor} />
        </div>
      </div>
      {hideErrorMessage ? null : <ValidationError fieldMeta={fieldMeta} />}
    </div>
  );
};

/**
 * Rich text editor field for React Final Form using Tiptap.
 * Provides formatting options: bold, italic, underline, strikethrough,
 * bullet/ordered lists, and blockquote.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Additional class for the root element
 * @param {string} [props.rootClassName] - Overwrite root class
 * @param {string} props.name - Field name for Final Form
 * @param {string} [props.id] - Input id (required when label is given)
 * @param {string} [props.label] - Field label
 * @param {string} [props.placeholder] - Placeholder text
 * @param {Function} [props.validate] - Validation function
 * @returns {JSX.Element}
 */
const FieldRichTextEditor = props => {
  return <Field component={RichTextEditorComponent} {...props} />;
};

export default FieldRichTextEditor;
