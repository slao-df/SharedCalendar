import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

import { LoginPage } from '../auth/pages/LoginPage';
import { RegisterPage } from '../auth/pages/RegisterPage';
import { CalendarPage } from '../calendar/pages/CalendarPage';

import { useAuthStore } from '../hooks/useAuthStore'; 
import { SharedCalendarPage } from '../calendar/pages/SharedCalendarPage';
import { SharedCalendarAccessPage } from '../calendar/pages/SharedCalendarAccessPage';

export const AppRouter = () => {
  const { status, checkAuthToken } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    checkAuthToken();
  }, []);

  if (status === 'checking') {
    return <h3>로딩 중...</h3>;
  }

  return (
    <Routes>
      {/* ✅ 공유 접근은 무조건 최우선 (로그인 여부 무관) */}
      <Route path="/share-calendar/:shareId" element={<SharedCalendarAccessPage />} />

      {status === 'not-authenticated' ? (
        <>
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          {/* 로그인 후 원래 가려던 곳으로 돌려보내기 */}
          <Route
            path="/*"
            element={
              <Navigate
                to={`/auth/login?redirectTo=${encodeURIComponent(
                  location.pathname + location.search
                )}`}
              />
            }
          />
        </>
      ) : (
        <>
          <Route path="/" element={<CalendarPage />} />
          <Route path="/*" element={<Navigate to="/" />} />
        </>
      )}
    </Routes>
  );
};
