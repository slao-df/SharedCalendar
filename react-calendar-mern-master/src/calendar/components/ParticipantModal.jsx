import React, { useState, useEffect, useCallback } from 'react'; // ✅ useCallback 추가
import { calendarApi } from '../../api'; 
import { useAuthStore } from '../../hooks'; 
import './ParticipantModal.css'; 

export const ParticipantModal = ({ calendar, onClose }) => {
  const { user } = useAuthStore(); 
  
  const [owner, setOwner] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [editors, setEditors] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ [신규 1] 편집 모드 상태
  const [isEditMode, setIsEditMode] = useState(false);
  // ✅ [신규 2] 편집 모드에서의 권한 상태 (체크박스 상태 관리)
  // { participantId1: true, participantId2: false, ... } (true = 편집자)
  const [editablePermissions, setEditablePermissions] = useState({});

  // API 호출 함수 (fetchParticipants)
  const fetchParticipants = useCallback(async () => { // ✅ useCallback으로 감싸기 (의존성 관리)
    if (!calendar) return;
    setIsLoading(true);
    setError(null);
    try {
      const calendarId = calendar._id || calendar.id;
      const { data } = await calendarApi.get(`/calendars/${calendarId}/participants`);
      if (data.ok) {
        setOwner(data.owner); 
        setParticipants(data.participants);
        const currentEditors = data.editors || [];
        setEditors(currentEditors); 
        
        // ✅ [신규 3] API 로드 시, 편집 모드용 초기 권한 상태 설정
        const initialPermissions = {};
        data.participants.forEach(p => {
          initialPermissions[p._id] = currentEditors.includes(p._id);
        });
        setEditablePermissions(initialPermissions);

        setIsEditMode(false); // API 로드 후 항상 보기 모드로 시작

      } else { setError(data.msg || '정보 로딩 실패'); }
    } catch (err) { setError('서버 통신 오류'); console.error(err); }
    setIsLoading(false);
  }, [calendar]); // ✅ calendar가 바뀔 때만 함수 재생성
  
  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]); // ✅ fetchParticipants 의존

  // 현재 내가 소유자인지 확인
  const iAmOwner = owner?._id === user.uid;

  // ✅ [신규 4] 편집 모드 진입 핸들러
  const handleEnterEditMode = () => {
    // API 로드 시 설정된 초기값으로 편집 상태 복원
    const initialPermissions = {};
    participants.forEach(p => {
      initialPermissions[p._id] = editors.includes(p._id);
    });
    setEditablePermissions(initialPermissions);
    setIsEditMode(true);
  };

  // ✅ [신규 5] 편집 모드 취소/닫기 핸들러
  const handleCancelEdit = () => {
    setIsEditMode(false);
    // 필요하면 onClose() 호출하여 모달 자체를 닫을 수도 있음
  };

  // ✅ [신규 6] 편집 모드 체크박스 변경 핸들러
  const handlePermissionCheckboxChange = (participantId) => {
    setEditablePermissions(prev => ({
      ...prev,
      [participantId]: !prev[participantId] // 현재 상태 반전
    }));
  };

  // ✅ [신규 7] 변경사항 저장 핸들러
  const handleSaveChanges = async () => {
    const originalCalendarId = calendar.originalCalendarId || calendar._id || calendar.id;
    
    // 변경된 권한 정보만 추출 (API 부하 감소)
    const changes = {};
    participants.forEach(p => {
      const initialPermission = editors.includes(p._id); // 원래 권한
      const currentPermission = editablePermissions[p._id]; // 현재 체크박스 상태
      if (initialPermission !== currentPermission) {
        changes[p._id] = currentPermission; // 변경된 경우만 추가 (true or false)
      }
    });

    if (Object.keys(changes).length === 0) {
      setIsEditMode(false); // 변경사항 없으면 그냥 보기 모드로 전환
      return;
    }

    try {
      // ❗️ 백엔드에 새로운 일괄 업데이트 API 엔드포인트 필요
      // 예: PUT /api/calendars/:id/permissions/bulk 
      // body: { changes: { userId1: true, userId2: false } }
      await calendarApi.put(`/calendars/${originalCalendarId}/permissions/bulk`, { changes });

      // 성공 시: 목록 새로고침 (변경된 내용 반영)
      await fetchParticipants(); 
      // 보기 모드로 전환은 fetchParticipants 내부에서 자동으로 처리됨 (setIsEditMode(false))
      alert('권한이 성공적으로 저장되었습니다.');

    } catch (error) {
      console.error('권한 저장 실패:', error);
      alert(error.response?.data?.msg || '권한 저장에 실패했습니다.');
    }
  };

  return (
    <div className="participant-modal-overlay">
      <div className="participant-modal">
        <h3 className="participant-modal-title">
          참여자 목록: {calendar.name}
        </h3>

        {/* === 참여자 목록 === */}
        <div className="participant-list">
          {isLoading && <p>참여자 정보를 불러오는 중...</p>}
          {error && <p className="participant-error">{error}</p>}

          {!isLoading && !error && (
            <>
              {/* 소유자 표시 */}
              {owner && (
                <div className="participant-item owner">
                  <span>👑 {owner.name}</span>
                  <span className="role-tag">소유자</span>
                </div>
              )}
              
              {/* 참여자 목록 표시 */}
              {participants.length > 0 ? (
                participants.map((participant) => {
                  // 현재 역할 확인 (API 로드된 editors 기준)
                  const isEditor = editors.includes(participant._id);
                  // 편집 모드에서의 체크박스 상태
                  const isCheckedInEditMode = editablePermissions[participant._id] || false; 

                  return (
                    <div key={participant._id} className="participant-item">
                      {/* ✅ [신규 8] 편집 모드일 때만 체크박스 표시 (소유자만 조작 가능) */}
                      {isEditMode && iAmOwner && (
                        <input 
                          type="checkbox"
                          checked={isCheckedInEditMode} // 편집 상태 반영
                          onChange={() => handlePermissionCheckboxChange(participant._id)}
                          className="participant-checkbox"
                        />
                      )}
                      {/* 보기 모드이거나 내가 소유자가 아닐 때는 빈 공간 (정렬용) */}
                      {(!isEditMode || !iAmOwner) && <div className="checkbox-placeholder"></div>}

                        <span>👤 {participant.name}</span>
                        {/* 역할 태그는 항상 표시 */}
                        <span className="role-tag">{isEditor ? '편집자' : '참여자'}</span>
                    </div>
                  );
                })
              ) : (
                <p className="no-participants">아직 참여자가 없습니다.</p>
              )}
            </>
          )}
        </div>

        {/* === ✅ [신규 9] 버튼 영역 (모드에 따라 변경) === */}
        <div className="modal-footer-buttons">
          {!isEditMode ? (
            // --- 보기 모드 버튼 ---
            <>
              {/* 소유자일 때만 '편집 권한 설정' 버튼 표시 */}
              {iAmOwner && participants.length > 0 && (
                <button 
                  className="participant-edit-btn" 
                  onClick={handleEnterEditMode}
                >
                  편집 권한 설정
                </button>
              )}
              <button className="participant-close-btn" onClick={onClose}>
                닫기
              </button>
            </>
          ) : (
            // --- 편집 모드 버튼 ---
            <>
              <button className="participant-cancel-btn" onClick={handleCancelEdit}>
                취소
              </button>
              <button className="participant-save-btn" onClick={handleSaveChanges}>
                저장
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
