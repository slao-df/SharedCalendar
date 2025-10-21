import { useState, useEffect } from 'react'; // ✅ useEffect 임포트 확인
import { Calendar } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// DND
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

import { Navbar, CalendarModal } from '../';
import { Sidebar } from '../components/Sidebar';
import { localizer, getMessagesKO, convertEventsToDateEvents } from '../../helpers';
import { useCalendarStore, useAuthStore } from '../../hooks'; // ✅ useAuthStore 임포트 확인

const DragAndDropCalendar = withDragAndDrop(Calendar);

export const CalendarPage = () => {
  const { status } = useAuthStore(); // ✅ 로그인 상태 가져오기
  const {
    events, // 스토어의 전체 이벤트 목록
    calendars, // ✅ 캘린더 목록 가져오기 (필터링 기준)
    setActiveEvent,
    startLoadingEvents,
    startLoadingCalendars,
    startSavingEvent,
  } = useCalendarStore();

  const [lastView, setLastView] = useState(
     localStorage.getItem('lastView') || 'month'
  );
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // ✅ 1. [이동] Sidebar에서 checkedState 관련 로직을 가져옵니다.
  const [checkedState, setCheckedState] = useState({});
  // localStorage에서 로드
  useEffect(() => {
    const saved = localStorage.getItem('calendarVisibility');
    if (saved) {
      try { setCheckedState(JSON.parse(saved)); } catch { setCheckedState({}); }
    }
  }, []);
  // calendars 로드 시 초기화
  useEffect(() => {
    if (calendars.length > 0) {
      setCheckedState((prev) => {
        const updated = { ...prev };
        calendars.forEach((c) => {
          const id = c.id || c._id || c.name; // ID 추출 방식 통일
          if (updated[id] === undefined) updated[id] = true;
        });
        return updated;
      });
    }
  }, [calendars]);
  // localStorage에 저장
  useEffect(() => {
    localStorage.setItem('calendarVisibility', JSON.stringify(checkedState));
  }, [checkedState]);

  // 데이터 로딩 (로그인 상태 확인 후)
  useEffect(() => {
    if (status === 'authenticated') {
      startLoadingEvents();
      startLoadingCalendars();
    }
  }, [status]); // status가 변경될 때마다 실행

  // ✅ 2. [신규] 체크박스 상태 변경 핸들러
  const handleCheckboxChange = (calendarId) => {
    setCheckedState((prevState) => ({
      ...prevState,
      [calendarId]: !prevState[calendarId],
    }));
  };

  // 일정 클릭 핸들러
  const handleSelectEvent = (event) => {
    setActiveEvent(event);
    setIsEventModalOpen(true);
  };

  // 모달 닫기 핸들러
  const handleCloseModal = () => {
    setIsEventModalOpen(false);
  };

  // 드롭 핸들러
  const handleEventDrop = ({ event, start, end }) => {
    startSavingEvent({ ...event, start, end });
  };

  // 리사이즈 핸들러
  const handleEventResize = ({ event, start, end }) => {
    startSavingEvent({ ...event, start, end });
  };

  // 이벤트 스타일
  const eventStyleGetter = (event, start, end, isSelected) => {
    const style = {
      backgroundColor: event.calendar?.color || '#367CF7',
      borderRadius: '2px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block',
    };
    return { style };
  };

  // 뷰 변경 핸들러
  const onViewChanged = (event) => {
    localStorage.setItem('lastView', event);
    setLastView(event);
  };

  // 커스텀 이벤트 컴포넌트
  const CustomEvent = ({ event }) => (
    <span>
      <strong>{event.title}</strong>
      {event.user?.name && ` - ${event.user.name}`}
    </span>
  );

  // ✅ 3. [핵심 수정] 필터링된 이벤트만 캘린더에 표시
  const filteredEvents = events.filter(event => {
    const eventCalendarId = event.calendar?.id || event.calendar?._id;
    // checkedState에 id가 없으면 기본값 true 사용
    return checkedState[eventCalendarId] !== undefined ? checkedState[eventCalendarId] : true;
  });

  // ✅ 4. 필터링된 이벤트를 Date 객체로 변환
  const parsedEvents = convertEventsToDateEvents(filteredEvents);

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        className="container-fluid p-0"
        style={{ height: '100vh', overflow: 'hidden' }}
      >
        <Navbar />
        <div className="d-flex" style={{ height: 'calc(100vh - 60px)' }}>
          {/* ✅ 5. Sidebar에 checkedState와 핸들러 전달 */}
          <Sidebar
            setIsEventModalOpen={setIsEventModalOpen}
            checkedState={checkedState}
            handleCheckboxChange={handleCheckboxChange}
          />
          <div className="flex-grow-1 bg-white">
            <DragAndDropCalendar
              culture="ko"
              localizer={localizer}
              // ✅ 6. 필터링 + 변환된 이벤트를 전달
              events={parsedEvents}
              defaultView={lastView}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%', padding: '10px' }}
              messages={getMessagesKO()}
              eventPropGetter={eventStyleGetter}
              onSelectEvent={handleSelectEvent}
              onView={onViewChanged}
              formats={{
                monthHeaderFormat: (date, culture, localizer) =>
                  localizer.format(date, 'yyyy년 M월', culture),
                dayHeaderFormat: (date, culture, localizer) =>
                  localizer.format(date, 'M월 d일 (EEE)', culture),
              }}
              components={{
                event: CustomEvent,
              }}
              onEventDrop={handleEventDrop}
              onEventResize={handleEventResize}
              resizable
            />
          </div>
        </div>
        {/* 모달 렌더링 */}
        {isEventModalOpen && <CalendarModal onClose={handleCloseModal} />}
      </div>
    </DndProvider>
  );
};
