import { createSlice } from '@reduxjs/toolkit';

// ================ Module name ================ //

const moduleName = 'SoftBookingCheckoutPage';

// ================ Slice ================ //

const initialState = {};

const softBookingCheckoutPageSlice = createSlice({
  name: moduleName,
  initialState,
  reducers: {
    setInitialValues(state, action) {
      return { ...initialState, ...action.payload };
    },
  },
});

export const { setInitialValues } = softBookingCheckoutPageSlice.actions;

export default softBookingCheckoutPageSlice.reducer;
