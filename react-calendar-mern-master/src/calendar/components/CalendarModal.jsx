import React, { useEffect, useState, useCallback } from 'react';
// ✅ 1. 스토어 훅 임포트
import { useCalendarStore } from '../../hooks/useCalendarStore';
import DatePicker, { registerLocale } from 'react-datepicker';
import ko from 'date-fns/locale/ko';
import 'react-datepicker/dist/react-datepicker.css';
import './CalendarModal.css';
import Swal from 'sweetalert2'; // ✅ 2. 확인 창을 위해 Swal 임포트

registerLocale('ko', ko);

export const CalendarModal = ({ onClose }) => {
  // ✅ 3. 스토어에서 startDeletingEvent 함수 가져오기
  const {
    calendars,
    startLoadingCalendars,
    startSavingEvent,
    activeEvent,
    setActiveEvent,
    startDeletingEvent, // ✅ 삭제 함수
  } = useCalendarStore();

  // (폼 상태 ... 생략)
  const [isOpen, setIsOpen] = useState(true);
  const [title, setTitle] = useState('');
  const [start, setStart] = useState(new Date());
  const [end, setEnd] = useState(new Date());
  const [memo, setMemo] = useState('');
  const [calendarId, setCalendarId] = useState('');

  // 10분 단위 반올림 함수
  const roundTo10Minutes = (date = new Date()) => {
    const ms = 1000 * 60 * 10;
    return new Date(Math.floor(date.getTime() / ms) * ms);
  };

  // activeEvent가 바뀌면 폼 채우기
  useEffect(() => {
    if (activeEvent) {
      // (수정 모드 ... 생략)
      setTitle(activeEvent.title);
      setStart(new Date(activeEvent.start));
      setEnd(new Date(activeEvent.end));
      setMemo(activeEvent.memo || '');
      setCalendarId(activeEvent.calendar?.id || activeEvent.calendar?._id || '');
    } else {
      // (새 일정 모드 ... 생략)
      const now = new Date();
      setStart(roundTo10Minutes(now));
      setEnd(roundTo10Minutes(new Date(now.getTime() + 60 * 60 * 1000)));
      setTitle('');
      setMemo('');
      if (calendars.length > 0) {
        setCalendarId(calendars[0].id || calendars[0]._id);
      }
    }
  }, [activeEvent, calendars]);

  // 캘린더 목록 로딩
  useEffect(() => {
    startLoadingCalendars();
  }, []);

  // 모달 닫기 함수 (safeClose)
  const safeClose = useCallback(() => {
    if (typeof onClose === 'function') {
      onClose();
    }
    setActiveEvent(null);
    setIsOpen(false);
  }, [onClose, setActiveEvent]);

  // ESC로 닫기
  useEffect(() => {
    const handleEsc = (e) => e.key === 'Escape' && safeClose();
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [safeClose]);

  // 폼 제출 (저장/수정)
  const handleSubmit = (e) => {
    e.preventDefault();
    // (유효성 검사 ... 생략)
    if (!title.trim()) return alert('제목을 입력하세요.');
    if (!calendarId) return alert('캘린더를 선택하세요.');
    if (end < start) return alert('종료 시간은 시작 시간보다 빨라야 합니다.');

    startSavingEvent({
      id: activeEvent ? activeEvent.id : null,
      title,
      start,
      end,
      memo,
      calendarId,
    });

    safeClose();
  };

  // ✅ 4. 삭제 버튼 핸들러
  const handleDelete = () => {
    // 4-1. (선택) 사용자에게 삭제 확인
    Swal.fire({
      title: '일정을 삭제하시겠습니까?',
      text: '삭제된 일정은 복구할 수 없습니다.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33', // 삭제 버튼 색상
      cancelButtonColor: '#6e7881', // 취소 버튼 색상
      confirmButtonText: '삭제',
      cancelButtonText: '취소',
    }).then((result) => {
      // 4-2. 사용자가 '삭제'를 클릭했을 때
      if (result.isConfirmed) {
        startDeletingEvent(); // 스토어의 삭제 함수 호출
        safeClose(); // 모달 닫기
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={safeClose}>
      <div
        className="modal-container wide"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="modal-title">{activeEvent ? '일정 수정' : '새 일정'}</h2>
        <hr className="modal-divider" />

        <form onSubmit={handleSubmit} className="modal-form">
          {/* ... (폼 내용: 제목, 캘린더, 시간, 메모) ... 생략 ... */}
          <label className="modal-label">제목</label>
          <input
            type="text"
            className="modal-input"
            placeholder="일정 제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <label className="modal-label">캘린더</label>
          <select
            className="modal-input"
            value={calendarId}
            onChange={(e) => setCalendarId(e.target.value)}
          >
            {calendars.length === 0 ? (
              <option value="">캘린더 없음</option>
            ) : (
              calendars.map((cal) => (
                <option
                  key={cal.id || cal._id}
                  value={cal.id || cal._id}
                  style={{ color: cal.color }}
                >
                  {cal.name}
                </option>
              ))
            )}
          </select>

          <div className="datetime-row">
            <div className="datetime-group">
              <label className="modal-label">시작</label>
              <DatePicker
                locale="ko"
                selected={start}
                onChange={(date) => setStart(date)}
                showTimeSelect
                timeIntervals={10}
                dateFormat="yyyy. MM. dd. aa hh:mm"
                dateFormatCalendar="yyyy년 MMMM"
                className="modal-input"
                timeCaption="시간"
              />
            </div>
            <div className="datetime-group">
              <label className="modal-label">종료</label>
              <DatePicker
                locale="ko"
                selected={end}
                onChange={(date) => setEnd(date)}
                showTimeSelect
                timeIntervals={10}
                dateFormat="yyyy. MM. dd. aa hh:mm"
                dateFormatCalendar="yyyy년 MMMM"
                className="modal-input"
                timeCaption="시간"
              />
            </div>
          </div>

          <label className="modal-label">메모</label>
          <textarea
            className="modal-textarea"
            placeholder="메모를 입력하세요"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          ></textarea>

          {/* ✅ 5. 버튼 영역 수정 */}
          <div className="modal-actions">
            {/* 5-1. 삭제 버튼 (수정 모드일 때만 보임) */}
            {activeEvent && (
              <button
                type="button"
                className="modal-btn danger" // (CSS에 .danger 스타일 필요)
                onClick={handleDelete}
                // (버튼을 왼쪽으로 보내기 위한 인라인 스타일 예시)
                style={{ marginRight: 'auto' }}
              >
                삭제
              </button>
            )}

            {/* 5-2. 취소 및 저장 버튼 (오른쪽 정렬) */}
            <button
              type="button"
              className="modal-btn ghost"
              onClick={safeClose}
            >
              취소
            </button>
            <button type="submit" className="modal-btn primary">
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};