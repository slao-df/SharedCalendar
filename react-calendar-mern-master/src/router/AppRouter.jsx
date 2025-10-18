import { Navigate, Route, Routes } from 'react-router-dom';
import { useEffect } from 'react';

import { LoginPage } from '../auth/pages/LoginPage';
import { RegisterPage } from '../auth/pages/RegisterPage';
import { CalendarPage } from '../calendar/pages/CalendarPage';
import { useAuthStore } from '../hooks/useAuthStore';

export const AppRouter = () => {
  const { status, checkAuthToken, startLogout } = useAuthStore();

  useEffect(() => {
    checkAuthToken();
  }, []);

  useEffect(() => {
    startLogout();
  }, []);

  if (status === 'checking') {
    return <h3>로딩 중...</h3>;
  }

  return (
    <Routes>
      {/* ✅ 인증되지 않은 사용자 (로그인/회원가입 전) */}
      {status === 'not-authenticated' ? (
        <>
          {/* 🔹 로그인 & 회원가입 페이지 라우트 */}
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />

          {/* 🔹 기타 모든 경로 → 로그인으로 리다이렉트 */}
          <Route path="/*" element={<Navigate to="/auth/login" />} />
        </>
      ) : (
        <>
          {/* ✅ 인증된 사용자 */}
          <Route path="/" element={<CalendarPage />} />
          <Route path="/*" element={<Navigate to="/" />} />
        </>
      )}
    </Routes>
  );
};
