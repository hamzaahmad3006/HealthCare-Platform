import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { BookingStatus } from '../../types/booking.types';

export interface BookingFilterState {
  activeTab: BookingStatus | 'ALL';
  searchQuery: string;
  selectedCityId: string | null;
  selectedServiceTypeId: string | null;
  page: number;
}

const initialState: BookingFilterState = {
  activeTab: 'PENDING',
  searchQuery: '',
  selectedCityId: null,
  selectedServiceTypeId: null,
  page: 1,
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    setActiveTab(state, action: PayloadAction<BookingStatus | 'ALL'>) {
      state.activeTab = action.payload;
      state.page = 1;
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
      state.page = 1;
    },
    setCityFilter(state, action: PayloadAction<string | null>) {
      state.selectedCityId = action.payload;
      state.page = 1;
    },
    setServiceFilter(state, action: PayloadAction<string | null>) {
      state.selectedServiceTypeId = action.payload;
      state.page = 1;
    },
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
    resetFilters() {
      return initialState;
    },
  },
});

export const {
  setActiveTab,
  setSearchQuery,
  setCityFilter,
  setServiceFilter,
  setPage,
  resetFilters,
} = bookingSlice.actions;

export default bookingSlice.reducer;
