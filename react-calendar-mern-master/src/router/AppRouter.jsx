import { Navigate, Route, Routes } from 'react-router-dom';
import { useEffect } from 'react';

import { LoginPage } from '../auth/pages/LoginPage';
import { RegisterPage } from '../auth/pages/RegisterPage';
import { CalendarPage } from '../calendar/pages/CalendarPage';

// ✅ 1. useAuthStore에서 'checkAuthToken'을 가져오도록 수정 (startLogout 제거)
import { useAuthStore } from '../hooks/useAuthStore'; 
import { SharedCalendarPage } from '../calendar/pages/SharedCalendarPage';
export const AppRouter = () => {
  // ✅ 2. status와 checkAuthToken을 가져옵니다.
  const { status, checkAuthToken } = useAuthStore();

  // ✅ 3. 앱이 처음 실행될 때 startLogout 대신 'checkAuthToken'을 호출합니다.
  useEffect(() => {
    checkAuthToken();
  }, []);

  // 4. 토큰을 확인하는 동안('checking') 로딩 화면을 표시합니다.
  if (status === 'checking') {
    return <h3>로딩 중...</h3>;
  }

  return (
    <Routes>
      {/* 5. 상태에 따라 라우트를 분기합니다. */}
      {status === 'not-authenticated' ? (
        // 5-1. 로그인 안 됨 -> 로그인/회원가입 페이지만 허용
        <>
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/*" element={<Navigate to="/auth/login" />} />
        </>
      ) : (
        // 5-2. 로그인 됨 -> 캘린더 페이지만 허용
        <>
          <Route path="/" element={<CalendarPage />} />
          <Route path="/*" element={<Navigate to="/" />} />
          <Route path="/shared/:token" element={<SharedCalendarPage />} />

        </>
      )}
    </Routes>
  );
};