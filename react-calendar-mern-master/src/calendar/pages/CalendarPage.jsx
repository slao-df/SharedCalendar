import { useState, useEffect, useMemo } from 'react'; // ✅ 1. useMemo 임포트 추가
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
import { useCalendarStore, useAuthStore } from '../../hooks'; 

const DragAndDropCalendar = withDragAndDrop(Calendar);

export const CalendarPage = () => {
  const { status } = useAuthStore(); 
  const {
    events, 
    calendars, 
    setActiveEvent,
    startLoadingEvents,
    startLoadingCalendars,
    startSavingEvent,
  } = useCalendarStore();

  const [lastView, setLastView] = useState(
     localStorage.getItem('lastView') || 'month'
  );
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // [유지] Sidebar에서 사용하던 checkedState 로직 (체크박스 상태)
  const [checkedState, setCheckedState] = useState({});
  
  // localStorage에서 로드
  useEffect(() => {
    const saved = localStorage.getItem('calendarVisibility');
    if (saved) {
      try { setCheckedState(JSON.parse(saved)); } catch { setCheckedState({}); }
    }
  }, []);

  // calendars 로드 시 checkedState 초기화
  useEffect(() => {
    if (calendars.length > 0) {
      setCheckedState((prev) => {
        const updated = { ...prev };
        calendars.forEach((c) => {
          // ✅ [수정] ID 추출 방식을 _id || id 로 통일합니다.
          const id = c._id || c.id; 
          if (updated[id] === undefined) updated[id] = true;
        });
        return updated;
      });
    }
  }, [calendars]);

  // localStorage에 저장
  useEffect(() => {
    // checkedState가 비어있지 않을 때만 저장 (초기 렌더링 방지)
    if (Object.keys(checkedState).length > 0) {
      localStorage.setItem('calendarVisibility', JSON.stringify(checkedState));
    }
  }, [checkedState]);

  // 데이터 로딩 (로그인 상태 확인 후)
  useEffect(() => {
    if (status === 'authenticated') {
      startLoadingEvents();
      startLoadingCalendars();
    }
  }, [status]); 

  // [유지] 체크박스 상태 변경 핸들러
  const handleCheckboxChange = (calendarId) => {
    setCheckedState((prevState) => ({
      ...prevState,
      [calendarId]: !prevState[calendarId],
    }));
  };

  // [유지] 일정 클릭 핸들러
  const handleSelectEvent = (event) => {
    setActiveEvent(event);
    setIsEventModalOpen(true);
  };

  // [유지] 모달 닫기 핸들러
  const handleCloseModal = () => {
    setIsEventModalOpen(false);
  };

  // [유지] 드롭 핸들러
  const handleEventDrop = ({ event, start, end }) => {
    startSavingEvent({ ...event, start, end });
  };

  // [유지] 리사이즈 핸들러
  const handleEventResize = ({ event, start, end }) => {
    startSavingEvent({ ...event, start, end });
  };

  // [유지] 이벤트 스타일
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

  // [유지] 뷰 변경 핸들러
  const onViewChanged = (event) => {
    localStorage.setItem('lastView', event);
    setLastView(event);
  };

  // ---
  // ✅ 2. [핵심 수정] 필터링 로직 (useMemo 3단계)
  // ---

  // [수정 1] "보이는 원본 ID" 목록을 useMemo로 생성
  const visibleOriginalIds = useMemo(() => {
    const idSet = new Set();
    
    // 캘린더 목록을 Map으로 만들어 빠른 탐색
    const calendarMap = new Map(calendars.map(c => [(c._id || c.id), c]));

    // checkedState 객체 (예: { id_11: true, id_shared_1: false }) 를 순회
    Object.keys(checkedState).forEach(calendarId => {
      // 만약 캘린더가 체크되어 있다면 (true)
      if (checkedState[calendarId]) {
        const cal = calendarMap.get(calendarId);
        if (cal) {
          // 공유 캘린더면 '원본 ID'를, 아니면 '자신 ID'를 Set에 추가
          if (cal.originalCalendarId) {
            idSet.add(cal.originalCalendarId);
          } else {
            idSet.add(cal._id || cal.id);
          }
        }
      }
    });
    return idSet;
  }, [calendars, checkedState]); // calendars 목록이나 checkedState가 바뀔 때만 재계산

  // [수정 2] 위 Set을 기반으로 이벤트 목록을 필터링 (useMemo)
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // 이벤트가 속한 캘린더의 ID (원본 ID)
      const eventCalendarId = event.calendar?._id || event.calendar?.id || event.calendar;
      
      // 이 ID가 "보이는 원본 ID" Set에 있는지 확인
      return visibleOriginalIds.has(eventCalendarId);
    });
  }, [events, visibleOriginalIds]); // events나 visibleOriginalIds가 바뀔 때만 재계산

  // [수정 3] 필터링된 이벤트를 Date 객체로 변환 (useMemo)
  const parsedEvents = useMemo(() => 
    convertEventsToDateEvents(filteredEvents),
  [filteredEvents]); // filteredEvents가 바뀔 때만 재계산

  // --- (필터링 로직 끝) ---


  // [유지] 커스텀 이벤트 컴포넌트
  const CustomEvent = ({ event }) => (
    <span>
      <strong>{event.title}</strong>
      {event.user?.name && ` - ${event.user.name}`}
    </span>
  );

  // ❌ 3. [삭제] 기존의 잘못된 필터링 로직 2줄을 삭제합니다.
  // const filteredEvents = events.filter(...);
  // const parsedEvents = convertEventsToDateEvents(filteredEvents);

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        className="container-fluid p-0"
        style={{ height: '100vh', overflow: 'hidden' }}
      >
        <Navbar />
        <div className="d-flex" style={{ height: 'calc(100vh - 60px)' }}>
          {/* ✅ 4. Sidebar에 checkedState와 핸들러 전달 */}
          <Sidebar
            setIsEventModalOpen={setIsEventModalOpen}
            checkedState={checkedState}
            handleCheckboxChange={handleCheckboxChange}
          />
          <div className="flex-grow-1 bg-white">
            <DragAndDropCalendar
              culture="ko"
              localizer={localizer}
              // ✅ 5. 필터링 + 변환된 이벤트를 전달
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
