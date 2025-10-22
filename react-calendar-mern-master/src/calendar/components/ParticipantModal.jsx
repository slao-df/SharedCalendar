import React, { useState, useEffect } from 'react';
import { calendarApi } from '../../api'; // (경로 확인)
import { useAuthStore } from '../../hooks'; // ✅ 1. useAuthStore 임포트 (경로 확인)
import './ParticipantModal.css'; 

export const ParticipantModal = ({ calendar, onClose }) => {
  // ✅ 2. 현재 로그인한 사용자 정보 가져오기
  const { user } = useAuthStore(); 
  
  const [owner, setOwner] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [editors, setEditors] = useState([]); // ✅ 3. 편집자 목록 State 추가
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ 4. API 호출 함수 (재사용을 위해 분리)
  const fetchParticipants = async () => {
    if (!calendar) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const calendarId = calendar._id || calendar.id;
      const { data } = await calendarApi.get(`/calendars/${calendarId}/participants`);

      if (data.ok) {
        setOwner(data.owner); 
        setParticipants(data.participants);
        setEditors(data.editors || []); // ✅ 5. 편집자 목록 state 업데이트
      } else {
        setError(data.msg || '정보를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError('서버와 통신 중 오류가 발생했습니다.');
      console.error(err);
    }
    setIsLoading(false);
  };

  // 모달이 열릴 때 API 호출
  useEffect(() => {
    fetchParticipants();
  }, [calendar]);

  // ✅ 6. 현재 로그인한 사용자가 소유자인지 확인
  const iAmOwner = owner?._id === user.uid;

  // ✅ 7. 권한 부여/취소 API 호출 핸들러
  const handlePermissionToggle = async (participantId, hasPermission) => {
    // [중요] 권한 변경은 '원본 캘린더' ID로 요청해야 합니다.
    const originalCalendarId = calendar.originalCalendarId || calendar._id || calendar.id;

    try {
      if (hasPermission) {
        // [권한 취소]
        await calendarApi.delete(`/calendars/${originalCalendarId}/permissions`, {
          data: { participantId } // axios delete 요청 시 body는 data 객체로 감싸기
        });
      } else {
        // [권한 부여]
        await calendarApi.post(`/calendars/${originalCalendarId}/permissions`, { participantId });
      }
      
      // 성공 시: 목록을 즉시 새로고침하여 변경 사항 반영
      fetchParticipants(); 
      
    } catch (error) {
      console.error('권한 변경 실패:', error.response?.data?.msg || error);
      alert(error.response?.data?.msg || '권한 변경에 실패했습니다.');
    }
  };


  return (
    <div className="participant-modal-overlay">
      <div className="participant-modal">
        <h3 className="participant-modal-title">
          참여자 목록: {calendar.name}
        </h3>
        
        <div className="participant-list">
          {isLoading && <p>참여자 정보를 불러오는 중...</p>}
          {error && <p className="participant-error">{error}</p>}

          {!isLoading && !error && (
            <>
              {/* 소유자 표시 */}
              {owner ? (
                <div className="participant-item owner">
                  <span>👑 {owner.name}</span>
                  <span className="role-tag">소유자</span>
                </div>
              ) : (
                <p>소유자 정보가 없습니다.</p>
              )}
              
              {/* 참여자 목록 표시 */}
              {participants.length > 0 ? (
                participants.map((participant) => {
                  // ✅ 8. 이 참여자가 편집자인지 확인
                  const isEditor = editors.includes(participant._id);
                  
                  return (
                    <div key={participant._id || participant.id} className="participant-item">
                        <span>👤 {participant.name}</span>
                        {/* ✅ 9. 역할 태그 동적 표시 */}
                        <span className="role-tag">{isEditor ? '편집자' : '참여자'}</span>

                        {/* ✅ 10. [핵심] 내가 소유자일 때만 권한 버튼 표시 */}
                        {iAmOwner && (
                          <button 
                            className="permission-toggle-btn"
                            onClick={() => handlePermissionToggle(participant._id, isEditor)}
                          >
                            {isEditor ? '권한 취소' : '편집 권한 부여'}
                          </button>
                        )}
                    </div>
                  );
                })
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
