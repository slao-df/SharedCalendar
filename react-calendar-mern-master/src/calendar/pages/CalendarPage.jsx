import { useState, useEffect, useMemo } from 'react';
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
  // 1. Store hooks
  const { status, user } = useAuthStore(); 
  const {
    events, 
    calendars, 
    activeCalendar, 
    setActiveEvent,
    startLoadingEvents,
    startLoadingCalendars,
    startSavingEvent,
  } = useCalendarStore();

  // 2. Local State
  const [lastView, setLastView] = useState(
     localStorage.getItem('lastView') || 'month'
  );
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [checkedState, setCheckedState] = useState({});
  
  // 3. useEffects
  // localStorage에서 체크박스 상태 로드
  useEffect(() => {
    const saved = localStorage.getItem('calendarVisibility');
    if (saved) {
      try { setCheckedState(JSON.parse(saved)); } catch { setCheckedState({}); }
    }
  }, []);

  // 캘린더 목록 로드 시 checkedState 초기화
  useEffect(() => {
    if (calendars.length > 0) {
      setCheckedState((prev) => {
        const updated = { ...prev };
        calendars.forEach((c) => {
          const id = c._id || c.id; 
          if (updated[id] === undefined) updated[id] = true;
        });
        return updated;
      });
    }
  }, [calendars]);

  // checkedState 변경 시 localStorage에 저장
  useEffect(() => {
    if (Object.keys(checkedState).length > 0) {
      localStorage.setItem('calendarVisibility', JSON.stringify(checkedState));
    }
  }, [checkedState]);

  // 인증 상태 변경 시 데이터 로딩
  useEffect(() => {
    if (status === 'authenticated') {
      startLoadingEvents();
      startLoadingCalendars();
    }
  }, [status]); 

  // 4. 권한 확인 로직 (useMemo)
  // '일정 쓰기' 및 모달용 권한 (활성 캘린더 기준)
  const canEditActiveCalendar = useMemo(() => {
    if (!activeCalendar || calendars.length === 0) return false;
    const fullActiveCal = calendars.find(
      c => (c._id || c.id) === (activeCalendar._id || activeCalendar.id)
    );
    if (!fullActiveCal) return false;
    const isOwner = (fullActiveCal.user?._id || fullActiveCal.user) === user.uid;
    const isEditor = fullActiveCal.editors?.includes(user.uid);
    return isOwner || isEditor;
  }, [activeCalendar, calendars, user.uid]);

  // 'event' 객체 기반 권한 확인 (DND 및 리사이즈용)
  const checkEventPermission = (event) => {
    const eventOriginalId = event.calendar?._id || event.calendar?.id || event.calendar;
    if (!eventOriginalId) return false;

    const calendarStub = calendars.find(c => {
      const isOriginal = (c._id || c.id).toString() === eventOriginalId.toString();
      const isShared = c.originalCalendarId?.toString() === eventOriginalId.toString();
      return isOriginal || isShared;
    });

    if (!calendarStub) return false;

    const isOwner = (calendarStub.user?._id || calendarStub.user) === user.uid;
    const isEditor = calendarStub.editors?.includes(user.uid);
    
    return isOwner || isEditor;
  };

  // 5. 핸들러 함수
  // 체크박스 상태 변경 핸들러
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

  // 드롭 핸들러 (권한 확인)
  const handleEventDrop = ({ event, start, end }) => {
    if (!checkEventPermission(event)) return; 
    startSavingEvent({ ...event, start, end });
  };

  // 리사이즈 핸들러 (권한 확인)
  const handleEventResize = ({ event, start, end }) => {
    if (!checkEventPermission(event)) return; 
    startSavingEvent({ ...event, start, end });
  };

  // DND 라이브러리용 권한 accessor 함수
  const eventCanBeModified = (event) => {
    return checkEventPermission(event);
  };

  // 이벤트 스타일
  const eventStyleGetter = (event, start, end, isSelected) => {
    const style = {
      backgroundColor: event.calendar?.color || '#367CF7', // 캘린더 색상 적용
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

  // 6. 필터링 로직 (useMemo 3단계)
  // "보이는 원본 ID" 목록을 useMemo로 생성
  const visibleOriginalIds = useMemo(() => {
    const idSet = new Set();
    const calendarMap = new Map(calendars.map(c => [(c._id || c.id), c]));
    Object.keys(checkedState).forEach(calendarId => {
      if (checkedState[calendarId]) {
        const cal = calendarMap.get(calendarId);
        if (cal) {
          if (cal.originalCalendarId) {
            idSet.add(cal.originalCalendarId);
          } else {
            idSet.add(cal._id || cal.id);
          }
        }
      }
    });
    return idSet;
  }, [calendars, checkedState]);

  // 위 Set을 기반으로 이벤트 목록을 필터링 (useMemo)
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const eventCalendarId = event.calendar?._id || event.calendar?.id || event.calendar;
      return visibleOriginalIds.has(eventCalendarId);
    });
  }, [events, visibleOriginalIds]);

  // 필터링된 이벤트를 Date 객체로 변환 (useMemo)
  const parsedEvents = useMemo(() => 
    convertEventsToDateEvents(filteredEvents),
  [filteredEvents]);

  // 7. 커스텀 컴포넌트
  const CustomEvent = ({ event }) => (
    <span>
      <strong>{event.title}</strong>
      {event.user?.name && ` - ${event.user.name}`}
    </span>
  );

  // 8. 렌더링
  return (
    <DndProvider backend={HTML5Backend}>
      <div
        className="container-fluid p-0"
        style={{ height: '100vh', overflow: 'hidden' }}
      >
        <Navbar />
        <div className="d-flex" style={{ height: 'calc(100vh - 60px)' }}>
          <Sidebar
            // "일정 쓰기" 버튼이 항상 모달을 띄우도록 수정
            setIsEventModalOpen={setIsEventModalOpen}
            checkedState={checkedState}
            handleCheckboxChange={handleCheckboxChange}
          />
          <div className="flex-grow-1 bg-white">
            <DragAndDropCalendar
              culture="ko"
              localizer={localizer}
              events={parsedEvents} 
              defaultView={lastView}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%', padding: '10px' }}
              messages={getMessagesKO()}
              eventPropGetter={eventStyleGetter}
              onSelectEvent={handleSelectEvent} 
  Vimium C: C-s
              components={{
                event: CustomEvent,
              }}
              onEventDrop={handleEventDrop}
              onEventResize={handleEventResize}
              // 'resizable'을 'accessor'로 변경하여 이벤트별로 제어
              resizable={undefined} 
              resizableAccessor={eventCanBeModified} 
              draggableAccessor={eventCanBeModified} 
            />
          </div>
        </div>
        {/* 모달에 canEdit prop 전달 (모달 내부에서 저장/삭제 버튼 비활성화) */}
        {isEventModalOpen && (
          <CalendarModal 
            onClose={handleCloseModal} 
            canEdit={canEditActiveCalendar} 
          />
        )}
      </div>
    </DndProvider>
  );
};
