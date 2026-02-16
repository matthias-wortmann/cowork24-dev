/**
 * Redux duck for the Space Owner Landing Page.
 * This page uses hardcoded sections, so no hosted asset is fetched.
 */

// ================ Reducer ================ //

const initialState = {};

export default function reducer(state = initialState, action = {}) {
  return state;
}

// ================ loadData ================ //

export const loadData = () => () => {
  return Promise.resolve();
};
