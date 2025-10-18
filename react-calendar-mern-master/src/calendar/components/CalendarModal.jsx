import React, { useEffect, useState, useCallback } from "react";
import { useCalendarStore } from "../../hooks/useCalendarStore";
import DatePicker, { registerLocale } from "react-datepicker";
import ko from "date-fns/locale/ko";
import "react-datepicker/dist/react-datepicker.css";
import "./CalendarModal.css";

registerLocale("ko", ko);

export const CalendarModal = ({ onClose }) => {
  const { calendars, startLoadingCalendars } = useCalendarStore();
  const [calendarId, setCalendarId] = useState("");

  const [isOpen, setIsOpen] = useState(true);
  const [title, setTitle] = useState("");
  const [start, setStart] = useState(new Date());
  const [end, setEnd] = useState(new Date());
  const [memo, setMemo] = useState("");

  const safeClose = useCallback(() => {
    if (typeof onClose === "function") {
      onClose();
    }
    setIsOpen(false);
  }, [onClose]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") safeClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [safeClose]);

  const roundTo10Minutes = (date = new Date()) => {
    const ms = 1000 * 60 * 10;
    return new Date(Math.floor(date.getTime() / ms) * ms);
  };

  useEffect(() => {
    startLoadingCalendars();
  }, []);

  useEffect(() => {
    if (calendars.length > 0) {
      setCalendarId(calendars[0].id || calendars[0]._id);
    }
  }, [calendars]);

  useEffect(() => {
    const now = new Date();
    const startTime = roundTo10Minutes(now);
    const endTime = roundTo10Minutes(new Date(now.getTime() + 60 * 60 * 1000));
    setStart(startTime);
    setEnd(endTime);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("🗓️ 새 일정:", { title, calendarId, start, end, memo });
    safeClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={safeClose}>
      <div
        className="modal-container wide"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="modal-title">새 일정</h2>
        <hr className="modal-divider" />

        <form onSubmit={handleSubmit} className="modal-form">
          {/* 제목 */}
          <label className="modal-label">제목</label>
          <input
            type="text"
            className="modal-input"
            placeholder="일정 제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {/* 캘린더 선택 드롭다운 */}
          <label className="modal-label">캘린더</label>
          <select
            className="modal-input"
            value={calendarId}
            onChange={(e) => setCalendarId(e.target.value)}
          >
            {calendars.length === 0 ? (
              <option value="">캘린더를 불러오는 중...</option>
            ) : (
              calendars.map((cal) => (
                <option
                  key={cal.id || cal._id}
                  value={cal.id || cal._id}
                  style={{ color: cal.color }}
                >
                  {cal.name}
                </option> // ✅ </Hoption> -> </option> 으로 수정
              ))
            )}
          </select>

          {/* 시작/종료 같은 줄 */}
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
                className="modal-input"
                timeCaption="시간"
              />
            </div>
          </div>

          {/* 메모 */}
          <label className="modal-label">메모</label>
          <textarea
            className="modal-textarea"
            placeholder="메모를 입력하세요"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          ></textarea>

          {/* 버튼 */}
          <div className="modal-actions">
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