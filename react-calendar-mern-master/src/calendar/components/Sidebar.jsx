import { useState, useEffect, useRef } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./Sidebar.css";
import { CalendarModal } from "./CalendarModal";
import { AddCalendarModal } from "./AddCalendarModal";
import { useCalendarStore } from "../../hooks/useCalendarStore";

export const Sidebar = () => {
  const [date, setDate] = useState(new Date());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null); // ⋯ 메뉴 열린 캘린더 ID
  const menuRef = useRef(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  const { calendars, startLoadingCalendars } = useCalendarStore();

  // ✅ 개별 캘린더 표시 여부 관리
  const [checkedState, setCheckedState] = useState({});

  // ✅ 최초 실행 시: 로컬 저장된 표시 상태 불러오기
  useEffect(() => {
    const saved = localStorage.getItem("calendarVisibility");
    if (saved) {
      try {
        setCheckedState(JSON.parse(saved));
      } catch {
        console.warn("calendarVisibility 데이터 손상 → 초기화");
        setCheckedState({});
      }
    }
  }, []);

  // ✅ 캘린더 목록이 바뀔 때 (새로 불러오거나 추가된 경우)
  useEffect(() => {
    if (calendars.length > 0) {
      setCheckedState((prev) => {
        const updated = { ...prev };
        calendars.forEach((c) => {
          const id = c.id || c._id || c.name;
          if (updated[id] === undefined) updated[id] = true; // 기본값 true
        });
        return updated;
      });
    }
  }, [calendars]);

  // ✅ 체크 상태가 바뀔 때마다 localStorage에 저장
  useEffect(() => {
    localStorage.setItem("calendarVisibility", JSON.stringify(checkedState));
  }, [checkedState]);

  // ✅ 체크박스 토글
  const handleCheckboxChange = (calendarId) => {
    setCheckedState((prevState) => ({
      ...prevState,
      [calendarId]: !prevState[calendarId],
    }));
  };

  useEffect(() => {
    startLoadingCalendars();
  }, []);

  // ✅ 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);



  const handleAddCalendarClick = () => setIsAddModalOpen(true);

   const handleNewEventClick = () => {
    setIsEventModalOpen(true);
   };

  return (
    <aside className="sidebar-container">
      {/* 일정쓰기 버튼 */}
      <button className="new-event-button" onClick={handleNewEventClick}>+ 일정쓰기</button>

      {/* 미니 캘린더 */}
      <div className="mini-calendar-container">
        <Calendar
          onChange={setDate}
          value={date}
          locale="ko-KR"
          formatDay={(locale, date) => date.getDate()}
          next2Label="»"
          prev2Label="«"
          nextLabel="›"
          prevLabel="‹"
        />
      </div>

      {/* 내 캘린더 헤더 */}
      <div className="calendar-header">
        <h5 className="calendar-title">내 캘린더</h5>
        <div className="calendar-actions">
          <button className="add-calendar" onClick={handleAddCalendarClick}>
            +
          </button>
          <button className="settings-calendar">
            <i className="fas fa-cog"></i>
          </button>
        </div>
      </div>

      {/* 캘린더 목록 */}
      <div className="calendar-list">
        {calendars.length === 0 ? (
          <p className="empty-text">등록된 캘린더가 없습니다.</p>
        ) : (
          calendars.map((cal) => {
            const id = cal.id || cal._id || cal.name;
            const isChecked =
              checkedState[id] !== undefined ? checkedState[id] : true;

            return (
              <div key={id} className="calendar-item">
                <label className="calendar-label">
                  <input
                    type="checkbox"
                    className="calendar-checkbox"
                    style={{
                      accentColor: cal.color,
                    }}
                    checked={isChecked}
                    onChange={() => handleCheckboxChange(id)}
                  />
                  <span className="calendar-name">{cal.name}</span>
                </label>

                {/* ⋯ 메뉴 버튼 */}
                <span
                  className="calendar-menu"
                  onClick={() =>
                    setMenuOpenId(menuOpenId === id ? null : id)
                  }
                >
                  <i className="fas fa-ellipsis-h"></i>
                </span>

                {/* ⋯ 메뉴 팝업 */}
                {menuOpenId === id && (
                  <div className="calendar-menu-popup" ref={menuRef}>
                    <button className="menu-item">캘린더 공유하기</button>
                    <hr />
                    <button className="menu-item">수정 / 삭제</button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 새 캘린더 추가 모달 */}
      {isAddModalOpen && (
        <AddCalendarModal onClose={() => setIsAddModalOpen(false)} />
      )}
      {isEventModalOpen && (
        <CalendarModal onClose={() => setIsEventModalOpen(false)} />
      )}
    </aside>
  );
};
