// controllers/calendarShareController.js

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Calendar = require('../models/Calendar');
// const SharedCalendar = require('../models/SharedCalendar'); // 이 모델은 현재 로직에서 사용되지 않는 것 같습니다.
const { v4: uuidv4 } = require('uuid'); // uuid 임포트

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/** ✅ 공유 링크 생성/수정 (비밀번호 저장) */
const generateShareLink = async (req, res) => {
  const { id: calendarId } = req.params;
  const { password } = req.body; // 프론트엔드에서 보낸 비밀번호
  const userId = req.uid;

  try {
    const calendar = await Calendar.findById(calendarId);

    if (!calendar) {
      return res.status(404).json({ ok: false, msg: '캘린더를 찾을 수 없습니다.' });
    }
    if (calendar.user.toString() !== userId) {
      return res.status(401).json({ ok: false, msg: '권한이 없습니다.' });
    }

    // shareId 대신 calendar ID를 사용한 링크 생성
    const shareUrl = `${FRONTEND_URL}/share-calendar/${calendar.id}`; // 또는 calendar._id

    // 모델 스키마에 정의된 최상위 필드에 직접 저장
    calendar.shareLink = shareUrl;
    calendar.sharePassword = password; // 요청받은 비밀번호로 저장

    await calendar.save(); // DB에 저장

    res.json({
      ok: true,
      shareUrl: shareUrl,
      sharePassword: password, // 저장된 비밀번호 반환
    });

  } catch (error) {
    console.error(`❌ 공유 링크 생성/수정 오류 (캘린더 ID: ${calendarId}):`, error);
    res.status(500).json({ ok: false, msg: '서버 오류 발생' });
  }
};

/** ✅ 공유 캘린더 참여 (비밀번호 입력 → 내 계정에 추가) */
const joinSharedCalendar = async (req, res) => {
  // 1. 라우터가 '/join/:shareId' 이므로, shareId는 URL에서 받은 캘린더의 ID입니다.
  const { shareId } = req.params; 
  const { password } = req.body; // 사용자가 입력한 비밀번호
  const userId = req.uid; // 참여하려는 사용자 (로그인된 사용자)

  try {
    // 2. shareId (calendar.id)로 원본 캘린더를 찾습니다.
    const originalCalendar = await Calendar.findById(shareId);

    // 3. 캘린더가 없거나, 공유 링크(shareLink)가 생성된 적 없는 캘린더인지 확인
    if (!originalCalendar || !originalCalendar.shareLink) {
      return res.status(404).json({ ok: false, msg: '공유 정보를 찾을 수 없습니다.' });
    }

    // 4. 모델 스키마에 맞는 'sharePassword'로 비밀번호를 비교합니다.
    if (originalCalendar.sharePassword !== password) {
      return res.status(401).json({ ok: false, msg: '비밀번호가 일치하지 않습니다.' });
    }
    
    // 5. 자기 자신의 캘린더에는 참여할 수 없습니다.
    if (originalCalendar.user.toString() === userId) {
      return res.status(400).json({ ok: false, msg: '자신의 캘린더에는 참여할 수 없습니다.' });
    }

    // 6. 이미 공유받은 캘린더인지 중복 체크 (이름 기반)
    const existing = await Calendar.findOne({
      user: userId, // 현재 로그인한 사용자의 캘린더 중에서
      name: `[공유] ${originalCalendar.name}`, // 이름이 일치하는 것이 있는지
    });
    if (existing) {
      return res.status(200).json({
        ok: true,
        msg: '이미 공유받은 캘린더입니다.',
        calendar: existing,
      });
    }

    // 7. 새 캘린더 생성 (참여자의 캘린더 목록에 추가)
    console.log('>>> DB 저장 시도 전:', { name: `[공유] ${originalCalendar.name}`, user: userId }); // 로그 추가
    const newCalendar = new Calendar({
      name: `[공유] ${originalCalendar.name}`,
      color: originalCalendar.color,
      memo: originalCalendar.memo,
      user: userId, // 소유자는 참여자
      originalCalendarId: originalCalendar._id // ✅ 원본 캘린더의 ID 저장
    });
    
    // 이 save()가 문제일 수 있습니다.
    const savedCalendar = await newCalendar.save(); // save 결과를 변수에 받아봅니다.
    
    console.log('>>> DB 저장 시도 후:', savedCalendar); // 로그 추가 (null이면 저장 실패)

    if (!savedCalendar) { // 만약 저장이 실패했다면
        console.error('❗️❗️❗️ newCalendar.save() 실패!');
        return res.status(500).json({ ok: false, msg: '캘린더 저장 중 오류 발생' });
    }

    return res.json({
      ok: true,
      msg: '공유 캘린더가 내 목록에 추가되었습니다.',
      calendar: savedCalendar, // 저장된 객체를 반환
    });
  } catch (error) {
    console.error('❌ 공유 캘린더 참여 catch 오류:', error); // catch 블록 로그 강화
    res.status(500).json({ ok: false, msg: '공유 캘린더 참여 실패' });
  }
};

/** ✅ 공유 정보 조회 (링크, 비밀번호) */
const getShareInfo = async (req, res) => {
  const { id } = req.params; // 캘린더 ID
  const uid = req.uid; // 사용자 ID

  try {
    const calendar = await Calendar.findById(id);
    if (!calendar) return res.status(404).json({ ok: false, msg: '캘린더를 찾을 수 없습니다.' });
    if (calendar.user.toString() !== uid) return res.status(403).json({ ok: false, msg: '권한이 없습니다.' });

    // DB 조회 직후 로그 (디버깅용)
    // console.log('--- getShareInfo ---');
    // console.log('DB calendar:', JSON.stringify(calendar, null, 2));
    // console.log('calendar.shareLink:', calendar.shareLink);
    // console.log('calendar.sharePassword:', calendar.sharePassword);
    // console.log('--- /getShareInfo ---');

    // 모델 스키마에 정의된 shareLink 필드가 있는지 확인
    if (calendar.shareLink) {
      return res.json({
        ok: true,
        shareUrl: calendar.shareLink,
        sharePassword: calendar.sharePassword || "",
      });
    } else {
      // 정보가 없으면 빈 값 반환
      return res.json({
        ok: true,
        shareUrl: "",
        sharePassword: "",
      });
    }

  } catch (error) {
    console.error(`❌ 공유 정보 조회 오류 (캘린더 ID: ${id}):`, error);
    return res.status(500).json({ ok: false, msg: '서버 오류 발생' });
  }
};


// (선택) 재발급 API: 이 함수는 현재 shareLink/sharePassword 모델과 호환되지 않음
// 필요하다면 generateShareLink 함수와 유사하게 수정 필요
const regenerateShareCredentials = async (req, res) => {
   // TODO: 현재 모델 구조에 맞게 수정 필요 (shareLink, sharePassword 사용)
   return res.status(501).json({ ok: false, msg: '구현되지 않은 기능입니다.' });
};

// 공유 링크 접속 후(로그인 상태) 비밀번호 검증 + 내 목록에 추가
// 이 기능은 joinSharedCalendar 함수와 중복되므로 제거하거나 수정 필요
const verifyAndAttachSharedCalendar = async (req, res) => {
   // TODO: joinSharedCalendar 함수 사용 또는 현재 모델 구조에 맞게 수정 필요
   return res.status(501).json({ ok: false, msg: '구현되지 않은 기능입니다.' });
};


// ✅ 파일 맨 아래에서 모든 함수를 한 번에 export
module.exports = {
  generateShareLink,
  getShareInfo,
  joinSharedCalendar,
  regenerateShareCredentials, // (수정 필요)
  verifyAndAttachSharedCalendar, // (수정 필요)
};
