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
  // Decode the JWT to extract claims (email, sub, etc.)
  // We use manual base64 decoding to avoid an extra dependency import.
  let decodedToken = {};
  try {
    const payloadBase64 = idToken.split('.')[1];
    decodedToken = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
  } catch (e) {
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

// ClientId is required when adding a new Apple strategy to passport
if (clientID) {
  try {
    passport.use(new AppleStrategy(strategyOptions, verifyCallback));

    // FIX: Express 5 makes req.query a read-only getter. passport-apple's
    // `req.query = { ...req.query, ...req.body }` silently fails, causing
    // OAuth2Strategy to never see the authorization code and redirect in a loop.
    // We override passport-apple's authenticate to use Object.defineProperty,
    // which forces a writable own property that shadows the Express 5 getter.
    const OAuth2Strategy = require('passport-oauth2');
    AppleStrategy.prototype.authenticate = function appleAuthWrapped(req, options) {
      // Merge req.body into req.query using Object.defineProperty (Express 5 compat)
      Object.defineProperty(req, 'query', {
        value: { ...req.query, ...req.body },
        writable: true,
        configurable: true,
        enumerable: true,
      });

      if (req.body && req.body.user) {
        req.appleProfile = JSON.parse(req.body.user);
      }

      // Call OAuth2Strategy directly (passport-apple's merge is replaced above)
      OAuth2Strategy.prototype.authenticate.call(this, req, options);
    };
  } catch (e) {
    console.error('Apple Sign-In strategy registration failed:', e.message);
  }
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
  const sessionFn = (err, user) => {
    loginWithIdp(err, user, req, res, clientID, 'apple');
  };

  try {
    passport.authenticate('apple', sessionFn)(req, res, next);
  } catch (e) {
    next(e);
  }
};
