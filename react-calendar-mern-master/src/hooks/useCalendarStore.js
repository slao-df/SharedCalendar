import { useDispatch, useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import { convertEventsToDateEvents } from '../helpers';
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
} from '../store';
import { calendarApi } from '../api';

// ✅ Redux 기반 Calendar Store
export const useCalendarStore = () => {
  const dispatch = useDispatch();

  // 기존 일정(events)
  const { events, activeEvent, calendars, activeCalendar } = useSelector(
    (state) => state.calendar
  );
  const { user } = useSelector((state) => state.auth);

  // -----------------------------
  // 🔹 이벤트 관련 기능
  // -----------------------------

  const setActiveEvent = (calendarEvent) => {
    dispatch(onSetActiveEvent(calendarEvent));
  };

  const startSavingEvent = async (calendarEvent) => {
    try {
      if (calendarEvent.id) {
        // 수정
        await calendarApi.put(`/events/${calendarEvent.id}`, calendarEvent);
        dispatch(onUpdateEvent({ ...calendarEvent }));
        return;
      }

      // 새 이벤트 생성
      const { data } = await calendarApi.post('/events', calendarEvent);
      dispatch(onAddNewEvent({ ...calendarEvent, id: data.event.id, user }));
    } catch (error) {
      console.log(error);
      Swal.fire(
        '저장 오류',
        error.response?.data?.msg || '이벤트 저장 중 오류가 발생했습니다.',
        'error'
      );
    }
  };

  const startDeletingEvent = async () => {
    try {
      await calendarApi.delete(`/events/${activeEvent.id}`);
      dispatch(onDeleteEvent());
    } catch (error) {
      console.log(error);
      Swal.fire(
        '삭제 오류',
        error.response?.data?.msg || '이벤트 삭제 중 오류가 발생했습니다.',
        'error'
      );
    }
  };

  const startLoadingEvents = async () => {
    try {
      const { data } = await calendarApi.get('/events');
      const events = convertEventsToDateEvents(data.events);
      dispatch(onLoadEvents(events));
    } catch (error) {
      console.log('이벤트 로딩 중 오류 발생');
      console.log(error);
    }
  };


  // ✅ 새 캘린더 추가
  // const startAddingCalendar = async (calendar) => {
  //   try {
  //     // ※ 서버 연동이 아직 없으므로 임시 로컬 추가
  //     //   나중에 /calendars 엔드포인트 연동 시 API 호출 부분 추가
  //     dispatch(
  //       onAddCalendar({
  //         id: Date.now(),
  //         name: calendar.name,
  //         color: calendar.color,
  //         memo: calendar.memo,
  //         user,
  //       })
  //     );
  //     Swal.fire('완료', '새 캘린더가 추가되었습니다.', 'success');
  //   } catch (error) {
  //     console.log(error);
  //     Swal.fire(
  //       '추가 오류',
  //       error.response?.data?.msg || '캘린더 추가 중 오류가 발생했습니다.',
  //       'error'
  //     );
  //   }
  // };
  const startAddingCalendar = async (calendarData) => {
    try {
      const { data } = await calendarApi.post("/calendars", calendarData);
      dispatch(onAddCalendar(data.calendar));
    } catch (error) {
      console.error(error);
    }
  };

  const startLoadingCalendars = async () => {
    try {
      const { data } = await calendarApi.get("/calendars");
      dispatch(onLoadCalendars(data.calendars));
    } catch (error) {
      console.error(error);
    }
  };


  // ✅ 캘린더 삭제
  const startDeletingCalendar = async (id) => {
    try {
      // 서버 연동 시 DELETE /calendars/:id 호출 예정
      dispatch(onDeleteCalendar(id));
      Swal.fire('삭제 완료', '캘린더가 삭제되었습니다.', 'success');
    } catch (error) {
      console.log(error);
      Swal.fire(
        '삭제 오류',
        error.response?.data?.msg || '캘린더 삭제 중 오류가 발생했습니다.',
        'error'
      );
    }
  };

  // ✅ 캘린더 선택
  const setActiveCalendar = (calendar) => {
    dispatch(onSetActiveCalendar(calendar));
  };


  return {
    events,
    activeEvent,
    hasEventSelected: !!activeEvent,

    calendars,
    activeCalendar,
    hasCalendarSelected: !!activeCalendar,


    startSavingEvent,
    startDeletingEvent,
    startLoadingEvents,
    setActiveEvent,

    startAddingCalendar,
    startDeletingCalendar,
    startLoadingCalendars,
    setActiveCalendar,
  };
};
