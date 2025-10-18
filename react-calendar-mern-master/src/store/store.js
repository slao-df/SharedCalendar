import { configureStore } from '@reduxjs/toolkit';
import { uiSlice, calendarSlice, authSlice } from './';

// 🔹 Redux 전역 상태 저장소 설정
export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,       // 인증 관련 상태
    calendar: calendarSlice.reducer, // 캘린더 관련 상태
    ui: uiSlice.reducer,           // UI(모달 등) 관련 상태
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // 직렬화 경고 비활성화
    }),
});
