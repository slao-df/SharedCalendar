import { useState, useEffect, useRef, useMemo } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './Sidebar.css';
import { AddCalendarModal } from './AddCalendarModal';
import { useCalendarStore } from '../../hooks/useCalendarStore';
import { ShareCalendarModal } from '../components/ShareCalendarModal';
import { ParticipantModal } from './ParticipantModal';

// ✅ 1. props로 checkedState와 handleCheckboxChange 받기
export const Sidebar = ({ setIsEventModalOpen, checkedState, handleCheckboxChange }) => {
  const [date, setDate] = useState(new Date());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [menuOpenState, setMenuOpenState] = useState(null); // { id: string, top: number } | null
  const menuRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');

  // ✅ 2. 스토어에서 캘린더 목록 및 필요한 함수 가져오기 (startLoadingCalendars는 제거)
  const { calendars, setActiveEvent, setActiveCalendar } = useCalendarStore();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedCalendarId, setSelectedCalendarId] = useState(null);

  const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState(null);

  const handleShareClick = (calendarId) => {
    console.log('📤 공유하기 클릭됨', calendarId);
    setSelectedCalendarId(calendarId);
    setIsShareModalOpen(true);
  };
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpenState(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // '+' 버튼 핸들러 (새 캘린더 모달 열기)
  const handleAddCalendarClick = () => {
    setActiveCalendar(null); // 새 캘린더 모드
    setIsAddModalOpen(true);
  };

  // '+ 일정쓰기' 버튼 핸들러 (새 일정 모달 열기)
  const handleNewEventClick = () => {
    setActiveEvent(null); // 새 일정 모드
    setIsEventModalOpen(true); // 부모에게 모달 열기 요청
  };

  // 검색어에 따라 캘린더 목록 필터링
  const filteredCalendars = useMemo(
    () =>
      calendars.filter((cal) =>
        cal.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [calendars, searchTerm]
  );

  // '...' 메뉴 버튼 클릭 핸들러
  const handleMenuClick = (e, id) => {
    const sidebarRect = e.currentTarget.closest('.sidebar-container').getBoundingClientRect();
    const buttonRect = e.currentTarget.getBoundingClientRect();
    const top = buttonRect.top - sidebarRect.top;
    setMenuOpenState(prevState => (prevState?.id === id ? null : { id, top }));
  };

  // '수정 / 삭제' 팝업 버튼 클릭 핸들러
  const handleEditCalendarClick = (calendar) => {
    setActiveCalendar(calendar); // 수정할 캘린더 설정
    setIsAddModalOpen(true); // 수정 모드로 모달 열기
    setMenuOpenState(null); // 팝업 닫기
  };
  // ✅ 3. 참여자 목록 모달 열기 핸들러
  const handleParticipantClick = (calendar) => {
    setSelectedCalendar(calendar); // 캘린더 객체(user, participants 포함)를 state에 저장
    setIsParticipantModalOpen(true);
    setMenuOpenState(null);
  };

  return (
    <aside className="sidebar-container">
      {/* 일정쓰기 버튼 */}
      <button className="new-event-button" onClick={handleNewEventClick}>
        + 일정쓰기
      </button>

      {/* 미니 캘린더 */}
      <div className="mini-calendar-container">
        <Calendar
          onChange={setDate}
          value={date}
          locale="ko-KR"
          formatDay={(locale, date) => date.getDate()}
          next2Label="»" prev2Label="«" nextLabel="›" prevLabel="‹"
        />
      </div>

      {/* 캘린더 검색창 */}
      <div className="calendar-search-container">
        <i className="fas fa-search"></i>
        <input
          type="text"
          className="calendar-search-input"
          placeholder="캘린더 검색"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            type="button"
            className="calendar-search-clear"
            onClick={() => setSearchTerm('')}
          >
            ✕
          </button>
        )}
      </div>

      {/* 내 캘린더 헤더 */}
      <div className="calendar-header">
        <h5 className="calendar-title">내 캘린더</h5>
        <div className="calendar-actions">
          <button className="add-calendar" onClick={handleAddCalendarClick}>+</button>
          <button className="settings-calendar"><i className="fas fa-cog"></i></button>
        </div>
      </div>

      {/* 캘린더 목록 */}
      <div className="calendar-list">
        {filteredCalendars.length === 0 ? (
          <p className="empty-text">
            {searchTerm
              ? '일치하는 캘린더가 없습니다.'
              : '등록된 캘린더가 없습니다.'}
          </p>
        ) : (
          filteredCalendars.map((cal) => {
            const id = cal.id || cal._id || cal.name;
            // ✅ 5. isChecked를 props로 받은 checkedState에서 가져옴
            const isChecked = checkedState[id] !== undefined ? checkedState[id] : true;

            return (
              <div key={id} className="calendar-item">
                <label className="calendar-label">
                  <input
                    type="checkbox"
                    className="calendar-checkbox"
                    style={{ accentColor: cal.color }}
                    checked={isChecked}
                    // ✅ 6. onChange에 props로 받은 handleCheckboxChange 연결
                    onChange={() => handleCheckboxChange(id)}
                  />
                  <span className="calendar-name">{cal.name}</span>
                </label>
                <span
                  className="calendar-menu"
                  onClick={(e) => handleMenuClick(e, id)}
                >
                  <i className="fas fa-ellipsis-h"></i>
                </span>
                {menuOpenState?.id === id && (
                  <div
                    className="calendar-menu-popup"
                    ref={menuRef}
                    style={{ top: `${menuOpenState.top}px` }}
                  >
                    <button 
                      className="menu-item share-button"
                      onClick={() => handleShareClick(id)}
                    >
                      공유하기
                    </button>
                    <hr />
                    <button className="menu-item" onClick={() => handleParticipantClick(cal)}>
                      참여자 목록
                    </button>
                    <hr />
                    <button
                      className="menu-item"
                      onClick={() => handleEditCalendarClick(cal)}
                    >
                      수정 / 삭제
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 새 캘린더 추가/수정 모달 */}
      {isAddModalOpen && (
        <AddCalendarModal
          onClose={() => {
            setIsAddModalOpen(false);
            setActiveCalendar(null); // 모달 닫힐 때 active 비우기
          }}
        />
      )}
      {isShareModalOpen && (
        <ShareCalendarModal
          calendarId={selectedCalendarId}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
      {isParticipantModalOpen && (
        <ParticipantModal
          calendar={selectedCalendar}
          onClose={() => setIsParticipantModalOpen(false)}
        />
      )}
    </aside>
  );
};
