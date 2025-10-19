import { useDispatch, useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import { calendarApi } from '../api';
// ❌ 1. 여기서 convertEventsToDateEvents 임포트 제거
// import { convertEventsToDateEvents } from '../helpers'; 
import {
  onAddNewEvent,
  onDeleteEvent,
  onSetActiveEvent,
  onUpdateEvent,
  onLoadEvents,
  onAddCalendar,
  onDeleteCalendar,
  onSetActiveCalendar,
  onLoadCalendars,
  onUpdateCalendar,
} from '../store';
import { useAuthStore } from './useAuthStore';

export const useCalendarStore = () => {
  const dispatch = useDispatch();
  const { events, activeEvent, calendars, activeCalendar } = useSelector(
    (state) => state.calendar
  );
  const { user } = useAuthStore();

  const setActiveEvent = (calendarEvent) => {
    dispatch(onSetActiveEvent(calendarEvent));
  };

  const startSavingEvent = async (calendarEvent) => {
    try {
      const calendarId =
        calendarEvent.calendarId || calendarEvent.calendar?._id || calendarEvent.calendar?.id;
      const fullCalendar = calendars.find((c) => (c.id || c._id) === calendarId);

      if (calendarEvent.id) { // 수정
        await calendarApi.put(`/events/${calendarEvent.id}`, { ...calendarEvent, calendar: calendarId });
        dispatch(onUpdateEvent({
          ...calendarEvent,
          start: calendarEvent.start.toISOString(), // String으로 변환하여 저장
          end: calendarEvent.end.toISOString(),     // String으로 변환하여 저장
          user: user, calendar: fullCalendar,
        }));
        return;
      }
      
      const { data } = await calendarApi.post('/events', { ...calendarEvent, calendar: calendarId }); // 생성
      dispatch(onAddNewEvent({
        ...calendarEvent,
        id: data.event.id,
        start: calendarEvent.start.toISOString(), // String으로 변환하여 저장
        end: calendarEvent.end.toISOString(),     // String으로 변환하여 저장
        user: user, calendar: fullCalendar,
      }));
    } catch (error) { /* ... */ }
  };

  const startDeletingEvent = async () => { /* ... */ };

  // 👇👇👇 [핵심 수정] 이 함수를 수정합니다.
  const startLoadingEvents = async () => {
    try {
      const { data } = await calendarApi.get('/events');
      
      // ❌ 2. 날짜 변환 함수 호출 제거
      // const convertedEvents = convertEventsToDateEvents(data.events);

      // ✅ 3. 서버에서 받은 원본 데이터(날짜가 문자열)를 그대로 스토어로 전달
      dispatch(onLoadEvents(data.events)); 

    } catch (error) {
      console.error('❗️ 이벤트 로딩 중 오류 발생:', error);
    }
  };
  // 👆👆👆

  // --- 캘린더 관련 함수 (이전과 동일) ---
  const startAddingCalendar = async (calendarData) => {
    try {
      const { data } = await calendarApi.post('/calendars', calendarData);
      dispatch(onAddCalendar(data.calendar));
    } catch (error) {
      console.error(error);
    }
  };
  const startLoadingCalendars = async () => {
    try {
      const { data } = await calendarApi.get('/calendars');
      dispatch(onLoadCalendars(data.calendars));
    } catch (error) {
      console.error(error);
    }
  };
 
  const startUpdatingCalendar = async (calendarData) => {
    try {
      const calendarId = calendarData.id || calendarData._id;

      // [방어 코드] ID가 없으면 에러 처리
      if (!calendarId) {
        throw new Error('수정할 캘린더 ID가 없습니다.');
      }

      // 1. 백엔드 API 호출
      await calendarApi.put(`/calendars/${calendarId}`, calendarData);

      // 2. 스토어 업데이트
      dispatch(onUpdateCalendar(calendarData));

      Swal.fire('수정 완료', '캘린더가 수정되었습니다.', 'success');
    } catch (error) {
      console.error(error);
      Swal.fire(
        '수정 오류',
        error.response?.data?.msg || '캘린더 수정 중 오류가 발생했습니다.',
        'error'
      );
    }
  };
  const startDeletingCalendar = async (id) => {
    try {
      // 1. 백엔드 API 호출
      await calendarApi.delete(`/calendars/${id}`);
      
      // 2. 스토어 업데이트
      dispatch(onDeleteCalendar(id));
      Swal.fire('삭제 완료', '캘린더 및 관련 일정이 삭제되었습니다.', 'success');
    } catch (error) {
      console.log(error);
      Swal.fire(
        '삭제 오류',
        error.response?.data?.msg || '캘린더 삭제 중 오류가 발생했습니다.',
        'error'
      );
    }
  };
  const setActiveCalendar = (calendar) => {
    dispatch(onSetActiveCalendar(calendar));
  };


  return {
    events, activeEvent, hasEventSelected: !!activeEvent,
    calendars, activeCalendar, hasCalendarSelected: !!activeCalendar,
    setActiveEvent, startSavingEvent, startDeletingEvent, startLoadingEvents,
    startAddingCalendar, startDeletingCalendar, startLoadingCalendars,
    setActiveCalendar, startUpdatingCalendar,
  };
};