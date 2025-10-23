//useCalendarStore.js
import { useDispatch, useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import { calendarApi } from '../api';
import {
  onAddNewEvent,
  onDeleteEvent,
  onSetActiveEvent,
  onUpdateEvent,
  onLoadEvents,
  onAddCalendar,      // "새 캘린더 생성"용 (useCalendarStore.js에서 사용)
  onDeleteCalendar,
  onSetActiveCalendar,
  onLoadCalendars,
  onUpdateCalendar,
  onAddNewCalendar, // "공유 캘린더 참여"용 (이름이 다를 수 있으니 slice 확인)
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
      
      // (참고) activeCalendar가 아닌, event에 속한 calendar의 fullCalendar 정보를 찾아야 합니다.
      const fullCalendar = calendars.find((c) => (c.id || c._id) === calendarId);

      if (calendarEvent.id) { // 수정
        await calendarApi.put(`/events/${calendarEvent.id}`, { ...calendarEvent, calendar: calendarId });
        dispatch(onUpdateEvent({
          ...calendarEvent,
          start: calendarEvent.start.toISOString(), 
          end: calendarEvent.end.toISOString(),     
          user: user, calendar: fullCalendar,
        }));
        return;
      }

      const { data } = await calendarApi.post('/events', { ...calendarEvent, calendar: calendarId }); // 생성
      dispatch(onAddNewEvent({
        ...calendarEvent,
        id: data.event.id,
        start: calendarEvent.start.toISOString(), 
        end: calendarEvent.end.toISOString(),     
        user: user, calendar: fullCalendar,
      }));
    } catch (error) { 
      console.error('이벤트 저장 오류:', error);
      Swal.fire('저장 실패', error.response?.data?.msg || '이벤트 저장에 실패했습니다.', 'error');
    }
  };

  // [수정] startDeletingEvent 로직 구현
  const startDeletingEvent = async () => {
    if (!activeEvent) return;

    try {
      const eventId = activeEvent.id || activeEvent._id;
      await calendarApi.delete(`/events/${eventId}`);
      dispatch(onDeleteEvent(eventId)); // 스토어에서 삭제
      Swal.fire('삭제 완료', '일정이 삭제되었습니다.', 'success');

    } catch (error) {
      console.error('이벤트 삭제 오류:', error);
      Swal.fire('삭제 실패', error.response?.data?.msg || '이벤트 삭제에 실패했습니다.', 'error');
    }
  };

  const startLoadingEvents = async () => {
    try {
      const { data } = await calendarApi.get('/events');
      dispatch(onLoadEvents(data.events)); 
    } catch (error) {
      console.error('❗️ 이벤트 로딩 중 오류 발생:', error);
    }
  };

  // --- 캘린더 관련 함수 ---
  const startAddingCalendar = async (calendarData) => {
    try {
      const { data } = await calendarApi.post('/calendars', calendarData);
      dispatch(onAddCalendar(data.calendar)); // 👈 'onAddCalendar' 사용
      Swal.fire('성공', '새 캘린더가 생성되었습니다.', 'success');
    } catch (error) {
      console.error(error);
      Swal.fire('생성 실패', error.response?.data?.msg || '캘린더 생성에 실패했습니다.', 'error');
    }
  };

  // ✅ [신규] 공유 캘린더 참여 함수
  const startJoiningCalendar = async (shareId, password) => {
    try {
      // 1. 서버에 참여 요청
      const { data } = await calendarApi.post(`/calendars/share/${shareId}`, { password });

      if (data.ok) {
        // --- ✅ [핵심 수정] ---
        // 기존: dispatch(onAddNewCalendar(data.calendar)); // 로컬 상태만 업데이트 (실패 가능성 있음)
        // 변경: 전체 캘린더 목록을 서버에서 다시 로드합니다.
        await startLoadingCalendars(); 
        await startLoadingEvents();

        Swal.fire('성공', '공유 캘린더가 추가되었습니다.', 'success');
      } else {
        Swal.fire('오류', data.msg || '캘린더 참여에 실패했습니다.', 'error');
      }

    } catch (error) {
      console.error(error);
      Swal.fire(
        '참여 실패', 
        error.response?.data?.msg || '캘린더에 참여할 수 없습니다.', 
        'error'
      );
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

      if (!calendarId) {
        throw new Error('수정할 캘린더 ID가 없습니다.');
      }

      await calendarApi.put(`/calendars/${calendarId}`, calendarData);
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
      await calendarApi.delete(`/calendars/${id}`);
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

    setActiveEvent, 
    startSavingEvent, 
    startDeletingEvent, 
    startLoadingEvents,
    
    startAddingCalendar, 
    startLoadingCalendars,
    startUpdatingCalendar, 
    startDeletingCalendar, 
    setActiveCalendar, 
    
    startJoiningCalendar, // ✅ [신규] 반환 객체에 추가
  };
};
