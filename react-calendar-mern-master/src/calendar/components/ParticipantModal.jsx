import React, { useState, useEffect } from 'react';
import { calendarApi } from '../../api'; // ✅ 1. API 임포트 (경로 확인 필요)
import './ParticipantModal.css'; 

export const ParticipantModal = ({ calendar, onClose }) => {
  // ✅ 2. API 응답을 저장할 State 추가
  const [owner, setOwner] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ 3. 모달이 열릴 때 API를 호출하는 useEffect 추가
  useEffect(() => {
    // 캘린더 prop이 없으면 아무것도 안 함
    if (!calendar) return;

    const fetchParticipants = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // 4. [핵심] 현재 캘린더 ID (공유 캘린더 ID일 수 있음)로 API 호출
        const calendarId = calendar._id || calendar.id;
        const { data } = await calendarApi.get(`/calendars/${calendarId}/participants`);

        if (data.ok) {
          // 5. 서버가 반환한 "원본" 소유자/참여자로 state 업데이트
          setOwner(data.owner); 
          setParticipants(data.participants);
        } else {
          setError(data.msg || '정보를 불러오는데 실패했습니다.');
        }
      } catch (err) {
        setError('서버와 통신 중 오류가 발생했습니다.');
        console.error(err);
      }
      setIsLoading(false);
    };

    fetchParticipants();
  }, [calendar]); // calendar prop이 바뀔 때마다 (모달이 열릴 때마다) 실행


  // ✅ 6. API 응답 상태(loading, error)에 따라 UI 분기 처리
  return (
    <div className="participant-modal-overlay">
      <div className="participant-modal">
        <h3 className="participant-modal-title">
          참여자 목록: {calendar.name}
        </h3>
        
        <div className="participant-list">

          {/* 로딩 중일 때 */}
          {isLoading && <p>참여자 정보를 불러오는 중...</p>}

          {/* 에러 발생 시 */}
          {error && <p className="participant-error">{error}</p>}

          {/* 로딩 성공 시 (기존 로직) */}
          {!isLoading && !error && (
            <>
              {/* 7. 소유자 표시 (API에서 받은 owner) */}
              {owner ? (
                <div className="participant-item owner">
                  <span>👑 {owner.name}</span>
                  <span className="role-tag">소유자</span>
                </div>
              ) : (
                <p>소유자 정보가 없습니다.</p>
              )}
              
              {/* 8. 참여자 목록 표시 (API에서 받은 participants) */}
              {participants.length > 0 ? (
                participants.map((participant) => (
                  <div key={participant._id || participant.id} className="participant-item">
                      <span>👤 {participant.name}</span>
                      <span className="role-tag">참여자</span>
                    </div>
                ))
              ) : (
                <p className="no-participants">아직 참여자가 없습니다.</p>
              )}
            </>
          )}

        </div>

        <button className="participant-close-btn" onClick={onClose}>
           닫기
        </button>
      </div>
    </div>
  );
};
