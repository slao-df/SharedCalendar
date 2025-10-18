import { useState, useEffect } from 'react';
import { Calendar } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { Navbar, CalendarModal, FabAddNew, FabDelete } from '../';
import { Sidebar } from '../components/Sidebar';
import { localizer, getMessagesKO } from '../../helpers';
import { useUiStore, useCalendarStore, useAuthStore } from '../../hooks';

export const CalendarPage = () => {

  const { user } = useAuthStore();
  const { openDateModal } = useUiStore();
  const { events, setActiveEvent, startLoadingEvents } = useCalendarStore();

  const [lastView, setLastView] = useState(localStorage.getItem('lastView') || 'month');

  useEffect(() => {
    startLoadingEvents();
  }, []);

  // 일정 색상 스타일
  const eventStyleGetter = (event) => {
    const isMyEvent = (user.uid === event.user._id) || (user.uid === event.user.uid);
    return {
      style: {
        backgroundColor: isMyEvent ? '#4e73df' : '#6c757d',
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        border: 'none',
      },
    };
  };

  // 더블클릭 → 모달 열기
  const onDoubleClick = (event) => {
    openDateModal();
  };

  // 일정 클릭 → 활성화
  const onSelect = (event) => {
    setActiveEvent(event);
  };

  // 뷰 변경 시
  const onViewChanged = (event) => {
    localStorage.setItem('lastView', event);
    setLastView(event);
  };

  // “+ 일정쓰기” 클릭 시
  const onAddEventClick = () => {
    openDateModal();
  };

  return (
    <div className="container-fluid p-0" style={{ height: '100vh', overflow: 'hidden' }}>
      {/* 상단 네비게이션 */}
      <Navbar />

      <div className="d-flex" style={{ height: 'calc(100vh - 60px)' }}>
        {/* ✅ 좌측 사이드바 */}
        <Sidebar onAddEventClick={onAddEventClick} />

        {/* ✅ 메인 캘린더 */}
        <div className="flex-grow-1 bg-white">
          <Calendar
            culture="ko"
            localizer={localizer}
            events={events}
            defaultView={lastView}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%', padding: '10px' }}
            messages={getMessagesKO()}
            eventPropGetter={eventStyleGetter}
            onDoubleClickEvent={onDoubleClick}
            onSelectEvent={onSelect}
            onView={onViewChanged}
            formats={{
              monthHeaderFormat: (date, culture, localizer) =>
                localizer.format(date, 'yyyy년 M월', culture),
              dayHeaderFormat: (date, culture, localizer) =>
                localizer.format(date, 'M월 d일 (EEE)', culture),
            }}
          />
        </div>
      </div>

      {/* 모달 + 플로팅버튼 */}
      {/* <CalendarModal /> */}
      {/* <FabAddNew />
      <FabDelete /> */}
    </div>
  );
};
