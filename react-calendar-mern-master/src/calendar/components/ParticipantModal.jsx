// src/calendar/components/ParticipantModal.jsx (새 파일)

import React from 'react';
import './ParticipantModal.css'; // (CSS 파일도 새로 만듭니다)

export const ParticipantModal = ({ calendar, onClose }) => {
  // calendar 객체에서 소유자와 참여자 정보를 바로 사용 (이미 populate 되어 있음)
  const owner = calendar?.user;
  const participants = calendar?.participants || [];

  return (
    <div className="participant-modal-overlay">
      <div className="participant-modal">
        <h3 className="participant-modal-title">
          참여자 목록: {calendar.name}
        </h3>
        
        <div className="participant-list">
          {/* 1. 소유자 표시 */}
          {owner && (
            <div className="participant-item owner">
              <span>👑 {owner.name}</span>
              <span className="role-tag">소유자</span>
            </div>
          )}
          
          {/* 2. 참여자 목록 표시 */}
          {participants.map((participant) => (
            <div key={participant._id} className="participant-item">
              <span>👤 {participant.name}</span>
              <span className="role-tag">참여자</span>
            </div>
          ))}

          {/* 3. 참여자가 없는 경우 */}
          {participants.length === 0 && (
            <p className="no-participants">아직 참여자가 없습니다.</p>
          )}
        </div>

        <button className="participant-close-btn" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
};
