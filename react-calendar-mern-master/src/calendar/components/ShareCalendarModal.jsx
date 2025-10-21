import { useState, useEffect } from "react";
import calendarApi from "../../api/calendarApi";
import "./ShareCalendarModal.css";

export const ShareCalendarModal = ({ calendarId, onClose }) => {
  const [shareLink, setShareLink] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 🔹 공유 정보 불러오기 (기존 정보 있으면 그대로 표시)
  const fetchShareInfo = async () => {
    try {
      const { data } = await calendarApi.get(`/calendars/${calendarId}/share`);
      
      console.log('✅ API 응답 (getShareInfo):', data);
      if (data.ok) {
        setShareLink(data.shareUrl);
        setPassword(data.sharePassword);
      } else {
        alert("공유 정보를 불러오지 못했습니다.");
      }
    } catch (error) {
      console.error("❌ 공유 정보 조회 오류:", error);
      alert("공유 정보 불러오기 실패");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 모달 열릴 때 실행
  useEffect(() => {
    fetchShareInfo();
  }, [calendarId]);

  // 🔹 비밀번호 수정 저장
  const handleSave = async () => {
    if (!password || password.trim().length < 4) {
      alert("비밀번호를 4자 이상 입력해주세요.");
      return;
    }

    try {
      setSaving(true);
      
      // ✅ [수정] PUT을 다시 POST로 변경합니다.
      // const { data } = await calendarApi.put(`/calendars/${calendarId}/share`, { password }); // (PUT 아님)
      const { data } = await calendarApi.post(`/calendars/${calendarId}/share`, { password }); // ✅ POST 사용
      
      if (data.ok) {
        alert("✅ 비밀번호가 성공적으로 변경되었습니다.");
        // (선택) 변경된 비밀번호를 state에 다시 반영
        setPassword(data.sharePassword);
      } else {
        alert("비밀번호 저장 실패: " + (data.msg || ''));
      }
    } catch (error) {
      console.error("❌ 비밀번호 저장 오류:", error);
      alert("비밀번호 저장 실패: " + (error.response?.data?.msg || error.message));
    } finally {
      setSaving(false);
    }
  };

  // 🔹 복사 기능
  const handleCopy = () => {
    navigator.clipboard.writeText(`링크: ${shareLink}\n비밀번호: ${password}`);
    alert("공유 링크와 비밀번호가 복사되었습니다.");
  };

  if (loading) {
    return (
      <div className="share-modal-overlay">
        <div className="share-modal">
          <h3 className="share-modal-title">📅 캘린더 공유</h3>
          <p style={{ textAlign: "center" }}>로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="share-modal-overlay">
      <div className="share-modal">
        <h3 className="share-modal-title">캘린더 공유</h3>

        <div className="share-result">
          <label>공유 링크</label>
          <input type="text" value={shareLink} readOnly className="share-input" />

          <label>비밀번호</label>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="share-input"
            placeholder="비밀번호를 입력하세요"
          />
        </div>

        <div className="share-btn-container">
          <button className="share-copy-btn" onClick={handleCopy}>
            복사
          </button>
          <button
            className="share-save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "저장 중..." : "저장"}
          </button>
          <button className="share-close-btn" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
