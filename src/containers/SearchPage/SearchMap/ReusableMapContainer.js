import React from 'react';
import ReactDOMClient from 'react-dom/client';

import { IntlProvider } from '../../../util/reactIntl';

import css from './SearchMap.module.css';

/**
 * ReusableMapContainer makes Google Map usage more effective. This improves:
 * - Performance: no need to load dynamic map every time user enters the search page view on SPA.
 * - Efficient Google Maps usage: less unnecessary calls to instantiate a dynamic map.
 * - Reaction to a bug when removing Google Map instance
 *   https://issuetracker.google.com/issues/35821412
 *
 * @component
 * @param {Object} props
 * @param {React.Node} props.children - The children
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} props.reusableMapHiddenHandle - The handle for the reusable map hidden
 * @param {Object} props.messages - The messages for IntlProvider
 * @param {Object} props.config - The config
 * @returns {JSX.Element}
 */
class ReusableMapContainer extends React.Component {
  constructor(props) {
    super(props);

    if (typeof window !== 'undefined') {
      window.reusableSearchMapElement =
        window.reusableSearchMapElement || document.createElement('div');

      if (!props.className) {
        console.warn('ReusableMapContainer should get className prop which defines its layout');
      }

      this.el = window.reusableSearchMapElement;
      this.el.id = 'search-map';
      // Layout classes are applied in renderSearchMap via sync (avoids stacking Search vs City CSS).
    }

    this.mountNode = null;
    this._mountRetryCount = 0;
    this.renderSearchMap = this.renderSearchMap.bind(this);
  }

  /**
   * #search-map is a singleton across SPA routes. Never stack layout classes from different
   * CSS modules (e.g. SearchPage map 100vh + CityLanding shell) — that fills the viewport.
   * Keeps off-screen utility classes when the map is parked hidden.
   */
  syncReusableMapElementLayoutClasses() {
    if (!this.el) {
      return;
    }
    const layoutClass = this.props.className || css.defaultMapLayout;
    const hadHidden = this.el.classList.contains(css.reusableMapHidden);
    const hadHandle = this.el.classList.contains(this.props.reusableMapHiddenHandle);

    this.el.className = '';
    this.el.id = 'search-map';
    if (hadHidden) {
      this.el.classList.add(css.reusableMapHidden);
    }
    if (hadHandle) {
      this.el.classList.add(this.props.reusableMapHiddenHandle);
    }
    this.el.classList.add(layoutClass);
  }

  componentDidMount() {
    this.renderSearchMap();
  }

  componentDidUpdate() {
    this.renderSearchMap();
  }

  componentWillUnmount() {
    this.el.classList.add(css.reusableMapHidden);
    this.el.classList.add(this.props.reusableMapHiddenHandle);
    this.mountNode.removeChild(this.el);
    document.body.appendChild(this.el);
  }

  renderSearchMap() {
    if (typeof window === 'undefined' || !this.el) {
      return;
    }

    this.syncReusableMapElementLayoutClasses();

    if (!this.mountNode) {
      if (this._mountRetryCount < 8) {
        this._mountRetryCount += 1;
        queueMicrotask(() => this.renderSearchMap());
        return;
      }
      /* After retries, fall through — same as legacy body-append path (avoids stuck map).
       * Reset so a later componentDidUpdate can run the microtask retries again if ref appears. */
      this._mountRetryCount = 0;
    } else {
      this._mountRetryCount = 0;
    }

    // Prepare rendering child (MapWithGoogleMap component) to new location
    // We need to add translations (IntlProvider) for map overlay components
    //
    // NOTICE: Children rendered with ReactDOM.render doesn't have Router access
    // You need to provide onClick functions and URLs as props.
    const renderChildren = () => {
      const { config, messages } = this.props;
      const children = (
        <IntlProvider locale={config.localization.locale} messages={messages} textComponent="span">
          {this.props.children}
        </IntlProvider>
      );

      // Render children to created element
      // TODO: Perhaps this should use createPortal instead of createRoot.
      // (The question is if portal re-initializes the map - which is pricing factor.)
      window.mapRoot = window.mapRoot || ReactDOMClient.createRoot(this.el);
      window.mapRoot.render(children);
    };

    const targetDomNode = document.getElementById(this.el.id);

    // Check if we have already added map somewhere on the DOM
    if (!targetDomNode) {
      if (this.mountNode && !this.mountNode.firstChild) {
        // If mountable, but not yet mounted, append rendering context inside SPA rendering tree.
        this.mountNode.appendChild(this.el);
      } else if (!this.mountNode) {
        // if no mountNode is found, append this outside SPA rendering tree (to document body)
        document.body.appendChild(this.el);
      }
      renderChildren();
    } else {
      this.el.classList.remove(css.reusableMapHidden);
      this.el.classList.remove(this.props.reusableMapHiddenHandle);

      if (this.mountNode && !this.mountNode.firstChild) {
        // Move the map to correct location if we have rendered the map before
        // (but it's not yet moved to correct location of rendering tree).
        document.body.removeChild(this.el);
        this.mountNode.appendChild(this.el);

        // render children and call reattach
        renderChildren();
        this.props.onReattach();
      } else {
        renderChildren();
      }
    }
  }

  render() {
    return (
      <div
        className={css.reusableMap}
        ref={node => {
          this.mountNode = node;
        }}
      />
    );
  }
}

export default ReusableMapContainer;
