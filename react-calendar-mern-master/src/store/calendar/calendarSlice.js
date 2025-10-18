import { createSlice } from '@reduxjs/toolkit';

export const calendarSlice = createSlice({
  name: 'calendar',
  initialState: {
    // ✅ 이벤트 관련
    isLoadingEvents: true,
    events: [],
    activeEvent: null,

    // ✅ 캘린더 관련
    calendars: [],         // 내 캘린더 목록
    activeCalendar: null,  // 선택된 캘린더
  },

  reducers: {
    // ----------------------------
    // 🔹 이벤트 관련 리듀서
    // ----------------------------
    onSetActiveEvent: (state, { payload }) => {
      state.activeEvent = payload;
    },

    onAddNewEvent: (state, { payload }) => {
      state.events.push(payload);
      state.activeEvent = null;
    },

    onUpdateEvent: (state, { payload }) => {
      state.events = state.events.map((event) =>
        event.id === payload.id ? payload : event
      );
    },

    onDeleteEvent: (state) => {
      if (state.activeEvent) {
        state.events = state.events.filter(
          (event) => event.id !== state.activeEvent.id
        );
        state.activeEvent = null;
      }
    },

    onLoadEvents: (state, { payload = [] }) => {
      state.isLoadingEvents = false;
      payload.forEach((event) => {
        const exists = state.events.some(
          (dbEvent) => dbEvent.id === event.id
        );
        if (!exists) {
          state.events.push(event);
        }
      });
    },

    onLogoutCalendar: (state) => {
      state.isLoadingEvents = true;
      state.events = [];
      state.activeEvent = null;
      state.calendars = [];
      state.activeCalendar = null;
    },

    // ----------------------------
    // 🔹 캘린더 관련 리듀서 (새로 추가)
    // ----------------------------

    // ✅ 새 캘린더 추가
    onAddCalendar: (state, { payload }) => {
      state.calendars.push(payload);
    },

    // ✅ 캘린더 삭제
    onDeleteCalendar: (state, { payload }) => {
      state.calendars = state.calendars.filter((c) => c.id !== payload);
      if (state.activeCalendar?.id === payload) {
        state.activeCalendar = null;
      }
    },

    // ✅ 캘린더 선택
    onSetActiveCalendar: (state, { payload }) => {
      state.activeCalendar = payload;
    },

    // ✅ 캘린더 초기 로드
    onLoadCalendars: (state, { payload = [] }) => {
      state.calendars = payload;
    },
  },
});

export const {
  // 🔹 이벤트 관련
  onSetActiveEvent,
  onAddNewEvent,
  onUpdateEvent,
  onDeleteEvent,
  onLoadEvents,
  onLogoutCalendar,

  // 🔹 캘린더 관련
  onAddCalendar,
  onDeleteCalendar,
  onSetActiveCalendar,
  onLoadCalendars,
} = calendarSlice.actions;
