const passport = require('passport');
const AppleStrategy = require('passport-apple');
const loginWithIdp = require('./loginWithIdp');

const radix = 10;
const PORT = parseInt(process.env.REACT_APP_DEV_API_SERVER_PORT, radix);
const rootUrl = process.env.REACT_APP_MARKETPLACE_ROOT_URL;
const clientID = process.env.REACT_APP_APPLE_CLIENT_ID;
const teamID = process.env.APPLE_TEAM_ID;
const keyID = process.env.APPLE_KEY_ID;

// Apple private key from .p8 file. Multi-line keys stored in env vars
// may have literal '\n' characters that need to be converted to actual newlines.
const rawPrivateKey = process.env.APPLE_PRIVATE_KEY || '';
const privateKeyString = rawPrivateKey.includes('\\n')
  ? rawPrivateKey.split(String.raw`\n`).join('\n')
  : rawPrivateKey;

let callbackURL = null;

const useDevApiServer = process.env.NODE_ENV === 'development' && !!PORT;

if (useDevApiServer) {
  callbackURL = `http://localhost:${PORT}/api/auth/apple/callback`;
} else {
  callbackURL = `${rootUrl}/api/auth/apple/callback`;
}

const strategyOptions = {
  clientID,
  teamID,
  keyID,
  privateKeyString,
  callbackURL,
  passReqToCallback: true,
};

// #region agent log
console.error('[APPLE_DEBUG] Strategy config:', JSON.stringify({
  clientID: clientID || '(empty)',
  teamID: teamID || '(empty)',
  keyID: keyID || '(empty)',
  callbackURL,
  privateKeyFirst30: privateKeyString ? privateKeyString.substring(0, 30) : '(empty)',
  privateKeyLast30: privateKeyString ? privateKeyString.substring(privateKeyString.length - 30) : '(empty)',
  privateKeyLength: privateKeyString ? privateKeyString.length : 0,
  privateKeyHasBeginMarker: privateKeyString ? privateKeyString.includes('-----BEGIN') : false,
  privateKeyHasEndMarker: privateKeyString ? privateKeyString.includes('-----END') : false,
  privateKeyHasNewlines: privateKeyString ? privateKeyString.includes('\n') : false,
  rawKeyFirst30: rawPrivateKey ? rawPrivateKey.substring(0, 30) : '(empty)',
}));
// #endregion

/**
 * Function Passport calls when a redirect returns the user from Apple to the application.
 *
 * With Apple Sign-In, the idToken parameter is the raw JWT string. We decode it to extract
 * user claims (email, sub). Apple only provides the user's name on the very first authentication;
 * subsequent logins only include the email and subject ID.
 *
 * @param {Object} req Express request object
 * @param {String} accessToken Access token obtained from Apple
 * @param {String} refreshToken Refresh token obtained from Apple
 * @param {String} idToken Raw JWT id_token from Apple
 * @param {Object} profile Profile object (typically empty for Apple)
 * @param {Function} done Session management function, introduced in `authenticateAppleCallback`
 */
const verifyCallback = (req, accessToken, refreshToken, idToken, profile, done) => {
  // #region agent log
  console.error('[APPLE_DEBUG] verifyCallback called, idToken length:', idToken ? idToken.length : 0);
  // #endregion

  // Decode the JWT to extract claims (email, sub, etc.)
  // We use manual base64 decoding to avoid an extra dependency import.
  let decodedToken = {};
  try {
    const payloadBase64 = idToken.split('.')[1];
    decodedToken = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
  } catch (e) {
    // #region agent log
    console.error('[APPLE_DEBUG] JWT decode FAILED:', e.message);
    // #endregion
    return done(new Error('Failed to decode Apple id_token'));
  }

  const email = decodedToken.email;

  // Apple only provides user name on the first authentication.
  // passport-apple stores parsed req.body.user as req.appleProfile.
  const appleProfile = req.appleProfile || {};
  const firstName = (appleProfile.name && appleProfile.name.firstName) || '';
  const lastName = (appleProfile.name && appleProfile.name.lastName) || '';

  // passport-apple merges req.body into req.query in authenticate(),
  // so the state parameter from Apple's POST response is available in req.query.state.
  const state = req.query.state;
  const queryParams = JSON.parse(state);

  const { from, defaultReturn, defaultConfirm, userType } = queryParams;

  const userData = {
    email,
    firstName,
    lastName,
    idpToken: idToken,
    from,
    defaultReturn,
    defaultConfirm,
    userType,
  };

  done(null, userData);
};

// #region agent log
// Catch unhandled rejections from passport-apple's async token exchange
process.on('unhandledRejection', (reason) => {
  console.error('[APPLE_DEBUG] Unhandled rejection:', reason);
});
// #endregion

// ClientId is required when adding a new Apple strategy to passport
if (clientID) {
  // #region agent log
  try {
    passport.use(new AppleStrategy(strategyOptions, verifyCallback));
    console.error('[APPLE_DEBUG] Strategy registered successfully');

    // FIX: Express 5 makes req.query a read-only getter. passport-apple's
    // `req.query = { ...req.query, ...req.body }` silently fails, causing
    // OAuth2Strategy to never see the authorization code and redirect in a loop.
    // We override passport-apple's authenticate to use Object.defineProperty,
    // which forces a writable own property that shadows the Express 5 getter.
    const OAuth2Strategy = require('passport-oauth2');
    AppleStrategy.prototype.authenticate = function appleAuthWrapped(req, options) {
      // #region agent log
      console.error('[APPLE_DEBUG] PROTO_AUTH entry, req.body.code:', req.body && req.body.code ? 'len=' + req.body.code.length : 'MISSING');
      // #endregion

      // Merge req.body into req.query using Object.defineProperty (Express 5 compat)
      Object.defineProperty(req, 'query', {
        value: { ...req.query, ...req.body },
        writable: true,
        configurable: true,
        enumerable: true,
      });

      // #region agent log
      console.error('[APPLE_DEBUG] req.query.code AFTER defineProperty merge:', req.query && req.query.code ? 'len=' + req.query.code.length : 'MISSING');
      // #endregion

      if (req.body && req.body.user) {
        req.appleProfile = JSON.parse(req.body.user);
      }

      // #region agent log
      // Wrap passport action methods for verification logging
      if (typeof this.redirect === 'function') {
        const origRedir = this.redirect;
        this.redirect = function(url, status) {
          console.error('[APPLE_DEBUG] ACTION_REDIRECT:', url ? url.substring(0, 200) : '(none)');
          return origRedir.call(this, url, status);
        };
      }
      if (typeof this.error === 'function') {
        const origErr = this.error;
        this.error = function(err) {
          console.error('[APPLE_DEBUG] ACTION_ERROR:', err ? (err.message || String(err)).substring(0, 300) : '(none)');
          return origErr.call(this, err);
        };
      }
      if (typeof this.success === 'function') {
        const origSuccess = this.success;
        this.success = function(user, info) {
          console.error('[APPLE_DEBUG] ACTION_SUCCESS');
          return origSuccess.call(this, user, info);
        };
      }
      // #endregion

      // Call OAuth2Strategy directly (passport-apple's merge is replaced above)
      OAuth2Strategy.prototype.authenticate.call(this, req, options);
    };

    // Deep instrumentation: wrap getOAuthAccessToken on the strategy's _oauth2
    const registeredStrategy = passport._strategy('apple');
    if (registeredStrategy && registeredStrategy._oauth2) {
      const origGetToken = registeredStrategy._oauth2.getOAuthAccessToken;
      registeredStrategy._oauth2.getOAuthAccessToken = function(code, params, callback) {
        console.error('[APPLE_DEBUG] getOAuthAccessToken ENTRY, code len:', code ? code.length : 0);
        const wrappedCb = function(err, accessToken, refreshToken, extra) {
          console.error('[APPLE_DEBUG] getOAuthAccessToken EXIT, err:', err ? String(err).substring(0, 300) : 'null', 'hasAccessToken:', !!accessToken);
          callback(err, accessToken, refreshToken, extra);
        };
        try {
          origGetToken.call(this, code, params, wrappedCb);
        } catch (e) {
          console.error('[APPLE_DEBUG] getOAuthAccessToken THREW:', e.message);
          wrappedCb(e);
        }
      };
      console.error('[APPLE_DEBUG] Deep instrumentation installed');
    }
  } catch (e) {
    console.error('[APPLE_DEBUG] Strategy registration FAILED:', e.message, e.stack);
  }
  // #endregion
} else {
  // #region agent log
  console.error('[APPLE_DEBUG] Strategy NOT registered - clientID is empty');
  // #endregion
}

/**
 * Initiate authentication with Apple. When the function is called, Passport redirects the
 * user to Apple to perform authentication.
 *
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Call the next middleware function in the stack
 */
exports.authenticateApple = (req, res, next) => {
  const { from, defaultReturn, defaultConfirm, userType } = req.query || {};
  const params = {
    ...(from ? { from } : {}),
    ...(defaultReturn ? { defaultReturn } : {}),
    ...(defaultConfirm ? { defaultConfirm } : {}),
    ...(userType ? { userType } : {}),
  };

  const paramsAsString = JSON.stringify(params);

  // #region agent log
  console.error('[APPLE_DEBUG] authenticateApple called, state:', paramsAsString);
  const origRedirect = res.redirect.bind(res);
  res.redirect = function(url) {
    console.error('[APPLE_DEBUG] Redirect URL:', url);
    return origRedirect(url);
  };
  // #endregion

  passport.authenticate('apple', {
    state: paramsAsString,
  })(req, res, next);
};

/**
 * This function is called when user returns to this application after authenticating with
 * Apple. Apple sends the response as a POST request (response_mode=form_post). Passport
 * verifies the received tokens and calls the verify callback, then our custom session
 * management function handles the Sharetribe login.
 *
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Call the next middleware function in the stack
 */
exports.authenticateAppleCallback = (req, res, next) => {
  // #region agent log
  console.error('[APPLE_DEBUG] authenticateAppleCallback called');
  console.error('[APPLE_DEBUG] req.body keys:', Object.keys(req.body || {}));
  console.error('[APPLE_DEBUG] req.body.code length:', req.body && req.body.code ? req.body.code.length : 0);
  console.error('[APPLE_DEBUG] req.body.state:', req.body && req.body.state ? req.body.state.substring(0, 80) : '(empty)');

  // Intercept res.redirect to see where passport-apple redirects on failure
  const origRedirect2 = res.redirect.bind(res);
  res.redirect = function(statusOrUrl, url) {
    const redirectUrl = url || statusOrUrl;
    console.error('[APPLE_DEBUG] CALLBACK res.redirect called:', typeof statusOrUrl, String(statusOrUrl).substring(0, 100), url ? String(url).substring(0, 100) : '');
    return origRedirect2(statusOrUrl, url);
  };
  // #endregion

  const sessionFn = (err, user) => {
    // #region agent log
    console.error('[APPLE_DEBUG] sessionFn called, err:', err ? err.message : 'null', 'user email:', user ? user.email : 'null');
    if (err) console.error('[APPLE_DEBUG] sessionFn error stack:', err.stack);
    // #endregion
    loginWithIdp(err, user, req, res, clientID, 'apple');
  };

  try {
    passport.authenticate('apple', sessionFn)(req, res, next);
  } catch (e) {
    // #region agent log
    console.error('[APPLE_DEBUG] passport.authenticate THREW:', e.message, e.stack);
    // #endregion
    next(e);
  }
  // #endregion
};
