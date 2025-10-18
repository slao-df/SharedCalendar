import React, { useRef, useState, useEffect } from 'react';
import { useCalendarStore } from '../../hooks/useCalendarStore';
import './AddCalendarModal.css';

export const AddCalendarModal = ({ onClose }) => {
  const { startAddingCalendar } = useCalendarStore();

  // ✅ 1. defaultColors를 먼저 정의합니다.
  const defaultColors = ['#cdb4db', '#ffc8dd', '#bde0fe', '#a2d2ff', '#b5ead7'];

  const [name, setName] = useState('');
  // ✅ 2. 기본 선택 색상을 defaultColors의 첫 번째 값으로 설정합니다.
  const [color, setColor] = useState(defaultColors[0]);
  const [memo, setMemo] = useState('');

  // ✅ 3. colors state의 초기값을 defaultColors로 설정합니다.
  // (이제 defaultColors에 포함된 색상은 삭제 버튼이 나타나지 않습니다)
  const [colors, setColors] = useState(defaultColors);

  // 컬러 피커
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });
  const addButtonRef = useRef(null);
  const colorInputRef = useRef(null);

  // ✅ 외부 클릭 시 컬러 피커 닫기
  useEffect(() => {
    const handleOutsideClick = (e) => {
      // 팝업 내부 클릭은 무시
      if (
        document.querySelector('.color-picker-popup')?.contains(e.target)
      ) {
        return;
      }
      // + 버튼 클릭은 handleAddColorClick에서 처리하므로 무시
      if (addButtonRef.current?.contains(e.target)) {
        return;
      }
      // 그 외의 모든 클릭은 닫기
      setShowColorPicker(false);
    };
    
    // mousedown이 click보다 이벤트가 빨라서 외부 클릭 닫기가 더 잘됩니다.
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // ✅ + 버튼 클릭 시 컬러 피커 표시
  const handleAddColorClick = (e) => {
    e.stopPropagation(); // 모달 닫힘 방지
    const rect = addButtonRef.current.getBoundingClientRect();
    const gap = 10;
    const pickerWidth = 180; // 컬러 피커의 대략적인 너비

    let left = rect.right + gap;
    let top = rect.top;
    
    // 화면 오른쪽에 닿으면 왼쪽으로 표시
    if (rect.right + pickerWidth > window.innerWidth) {
      left = rect.left - pickerWidth - gap;
    }

    setPickerPosition({ top, left });
    setShowColorPicker((prev) => !prev); // 토글 방식
  };

  // ✅ 색상 선택
  const handleColorSelect = (e) => {
    const newColor = e.target.value;
    if (!colors.includes(newColor)) {
      setColors((prev) => [...prev, newColor]);
    }
    setColor(newColor); // 선택한 색으로 변경
    setShowColorPicker(false); // 피커 닫기
  };

  // ✅ 색상 삭제 (이제 defaultColors가 아닌 색상만 삭제 가능)
  const handleDeleteColor = (targetColor) => {
    // 혹시 모를 방어 코드: defaultColors에 포함된 건 삭제하지 않음
    if (defaultColors.includes(targetColor)) return; 
    
    setColors((prev) => prev.filter((c) => c !== targetColor));
    
    // 만약 삭제한 색상이 현재 선택된 색상이라면, 기본 색상으로 변경
    if (color === targetColor) {
      setColor(defaultColors[0]);
    }
  };

  // ✅ 저장 시 캘린더 목록 추가
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) return alert("캘린더명을 입력하세요.");

    startAddingCalendar({
      name,
      color,
      memo,
    });

    onClose();
  };
  
  // 모달 오버레이 클릭 시
  const handleOverlayClick = () => {
    setShowColorPicker(false); // 컬러 피커 닫기
    onClose(); // 모달 닫기
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()} // 모달 내부 클릭 시 닫히지 않게
      >
        <h2 className="modal-title">새 캘린더</h2>
        <hr className="modal-divider" />

        <form onSubmit={handleSubmit}>
          {/* 캘린더명 */}
          <label className="modal-label">캘린더명</label>
          <input
            type="text"
            className="modal-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="캘린더 이름을 입력하세요"
          />

          {/* 색상 선택 */}
          <label className="modal-label">색상</label>
          <div className="color-options">
            {colors.map((c, i) => (
              <div key={i} className="color-wrapper">
                <div
                  className={`color-circle ${color === c ? 'selected' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
                {/* ✅ 로직 수정: defaultColors에 포함되지 않은 색상만 삭제 버튼 표시 */}
                {!defaultColors.includes(c) && (
                  <button
                    type="button"
                    className="delete-btn"
                    onClick={() => handleDeleteColor(c)}
                    title="삭제"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}

            {/* + 버튼 */}
            <div
              ref={addButtonRef}
              className="color-circle add"
              onClick={handleAddColorClick}
            >
              <span>＋</span>
            </div>

            {/* 컬러 피커 (모달 오른쪽 위치) */}
            {showColorPicker && (
              <div
                className="color-picker-popup"
                style={{
                  position: 'fixed',
                  top: `${pickerPosition.top}px`,
                  left: `${pickerPosition.left}px`,
                  zIndex: 2000,
                }}
                onClick={(e) => e.stopPropagation()} // 피커 내부 클릭이 닫히지 않게
              >
                <input
                  ref={colorInputRef}
                  type="color"
                  onChange={handleColorSelect}
                  // autoFocus // 클릭 시 바로 피커가 뜨도록 유도
                />
              </div>
            )}
          </div>

          {/* 메모 */}
          <label className="modal-label">메모</label>
          <textarea
            className="modal-textarea"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="메모를 입력하세요"
          ></textarea>

          {/* 버튼 */}
          <div className="modal-buttons">
            <button type="submit" className="save-btn">
              저장
            </button>
            <button type="button" className="cancel-btn" onClick={onClose}>
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};