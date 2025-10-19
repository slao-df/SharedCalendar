// src/calendar/components/AddCalendarModal.jsx

import React, { useRef, useState, useEffect } from 'react';
// ✅ 1. useCalendarStore 임포트
import { useCalendarStore } from '../../hooks/useCalendarStore';
import './AddCalendarModal.css';
import Swal from 'sweetalert2'; // (삭제 버튼용)

// 기본 색상 정의 (기존 코드)
const defaultColors = ['#b9d5f2ff', '#f0cfe3ff', '#cbe5d3ff', '#D3DAEA', '#c4ace6ff'];

export const AddCalendarModal = ({ onClose }) => {
  // ✅ 2. 스토어에서 필요한 함수와 activeCalendar 가져오기
  const {
    activeCalendar,
    startAddingCalendar,
    startUpdatingCalendar, // (3단계에서 추가할 함수)
    startDeletingCalendar, // (기존 함수)
  } = useCalendarStore();

  const [name, setName] = useState('');
  const [color, setColor] = useState(defaultColors[0]);
  const [memo, setMemo] = useState('');
  const [colors, setColors] = useState(defaultColors);

  // (컬러 피커 관련 state 및 핸들러 ... 생략)
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });
  const addButtonRef = useRef(null);
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (document.querySelector('.color-picker-popup')?.contains(e.target)) return;
      if (addButtonRef.current?.contains(e.target)) return;
      setShowColorPicker(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);
  const handleAddColorClick = (e) => {
    e.stopPropagation();
    const rect = addButtonRef.current.getBoundingClientRect();
    const gap = 10; const pickerWidth = 180;
    let left = rect.right + gap; let top = rect.top;
    if (rect.right + pickerWidth > window.innerWidth) {
      left = rect.left - pickerWidth - gap;
    }
    setPickerPosition({ top, left });
    setShowColorPicker((prev) => !prev);
  };
  const handleColorSelect = (e) => {
    const newColor = e.target.value;
    if (!colors.includes(newColor)) {
      setColors((prev) => [...prev, newColor]);
    }
    setColor(newColor);
    setShowColorPicker(false);
  };
  const handleDeleteColor = (targetColor) => {
    if (defaultColors.includes(targetColor)) return;
    setColors((prev) => prev.filter((c) => c !== targetColor));
    if (color === targetColor) setColor(defaultColors[0]);
  };


  // ✅ 3. [신규] activeCalendar가 있으면 폼을 채우는 useEffect
  useEffect(() => {
    if (activeCalendar) {
      // 수정 모드: 폼 채우기
      setName(activeCalendar.name);
      setColor(activeCalendar.color);
      setMemo(activeCalendar.memo || '');
      // activeCalendar의 색상이 기본 색상표에 없으면 추가
      if (!colors.includes(activeCalendar.color)) {
        setColors((prev) => [...prev, activeCalendar.color]);
      }
    } else {
      // 생성 모드: 폼 비우기 (선택사항)
      setName('');
      setColor(defaultColors[0]);
      setMemo('');
    }
  }, [activeCalendar]); // activeCalendar가 바뀔 때마다 실행

  // ✅ 4. [수정] 저장 또는 수정 핸들러
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return alert('캘린더명을 입력하세요.');

    const calendarData = { name, color, memo };

    if (activeCalendar) {
      // 수정 모드
      // (3단계에서 이 함수를 스토어에 추가해야 함)
      startUpdatingCalendar({ ...activeCalendar, ...calendarData }); 
    } else {
      // 생성 모드
      startAddingCalendar(calendarData);
    }
    onClose();
  };

  // ✅ 5. [신규] 삭제 핸들러
  const handleDelete = async () => {
    if (!activeCalendar) return;

    const result = await Swal.fire({
      title: '캘린더를 삭제하시겠습니까?',
      text: '캘린더에 속한 모든 일정이 함께 삭제됩니다!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6e7881',
      confirmButtonText: '삭제',
      cancelButtonText: '취소',
    });

    if (result.isConfirmed) {
      // (이 함수는 스토어에 이미 존재함)
      startDeletingCalendar(activeCalendar.id || activeCalendar._id);
      onClose();
    }
  };

  const handleOverlayClick = () => {
    setShowColorPicker(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ✅ 6. [수정] 제목 변경 */}
        <h2 className="modal-title">
          {activeCalendar ? '캘린더 수정' : '새 캘린더'}
        </h2>
        <hr className="modal-divider" />

        <form onSubmit={handleSubmit}>
          {/* (캘린더명, 색상 선택, 메모 ... 폼은 동일함 ... 생략) */}
          <label className="modal-label">캘린더명</label>
          <input
            type="text" className="modal-input" value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="캘린더 이름을 입력하세요"
          />
          <label className="modal-label">색상</label>
          <div className="color-options">
            {colors.map((c, i) => (
              <div key={i} className="color-wrapper">
                <div
                  className={`color-circle ${color === c ? 'selected' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
                {!defaultColors.includes(c) && (
                  <button
                    type="button" className="delete-btn"
                    onClick={() => handleDeleteColor(c)} title="삭제"
                  >✕</button>
                )}
              </div>
            ))}
            <div ref={addButtonRef} className="color-circle add" onClick={handleAddColorClick}>
              <span>＋</span>
            </div>
            {showColorPicker && (
              <div
                className="color-picker-popup"
                style={{ position: 'fixed', top: `${pickerPosition.top}px`, left: `${pickerPosition.left}px`, zIndex: 2000 }}
                onClick={(e) => e.stopPropagation()}
              >
                <input ref={colorInputRef} type="color" onChange={handleColorSelect} />
              </div>
            )}
          </div>
          <label className="modal-label">메모</label>
          <textarea
            className="modal-textarea" value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="메모를 입력하세요"
          ></textarea>

          {/* ✅ 7. [수정] 버튼 영역 (삭제 버튼 추가) */}
          <div className="modal-buttons">
            {activeCalendar && (
              <button
              type="button"
              // ✅ className 수정
              className="modal-btn danger" 
              onClick={handleDelete}
              style={{ marginRight: 'auto' }} 
            >
              삭제
            </button>
            )}
            {/* 저장/취소 버튼은 자동으로 오른쪽 정렬됨 */}
            <button
            type="button"
            // className="cancel-btn" // ❗️ 기존 클래스
            className="modal-btn ghost" // ✅ 수정된 클래스
            onClick={onClose}
          >
            취소
          </button>
            <button type="submit" className="save-btn">
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};