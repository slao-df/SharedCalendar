const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Calendar = require('../models/Calendar');
const SharedCalendar = require('../models/SharedCalendar');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// 공유 링크/비밀번호 최초 생성(이미 있으면 재사용)
/** ✅ 공유 링크 생성 */
exports.generateShareLink = async (req, res) => {
  const { id } = req.params; // calendar의 id
  const { password } = req.body;
  const uid = req.uid;

  try {
    const calendar = await Calendar.findById(id);
    if (!calendar)
      return res.status(404).json({ ok: false, msg: '캘린더를 찾을 수 없습니다.' });

    if (calendar.user.toString() !== uid)
      return res.status(403).json({ ok: false, msg: '권한이 없습니다.' });

    // ✅ 이미 존재하는 공유정보 확인
    let shared = await SharedCalendar.findOne({ calendarId: id });

    if (!shared) {
      const passwordHash = await bcrypt.hash(password, 10);

      // ✅ 1. 공유 문서 생성 및 저장 (이때 _id 생성)
      shared = new SharedCalendar({
        calendarId: id,
        ownerId: uid,
        passwordHash,
      });
      await shared.save();

      // ✅ 2. 링크는 SharedCalendar의 _id로 생성해야 함
      shared.shareLink = `${FRONTEND_URL}/share-calendar/${shared._id}`;
      await shared.save();
    }

    res.json({
      ok: true,
      shareUrl: shared.shareLink,
    });
  } catch (error) {
    console.error('공유 생성 오류:', error);
    res.status(500).json({ ok: false, msg: '서버 오류' });
  }
};




/** ✅ 공유 캘린더 참여 (비밀번호 입력 → 내 계정에 추가) */
exports.joinSharedCalendar = async (req, res) => {
  const { shareId } = req.params;
  const { password } = req.body;
  const userId = req.uid;

  try {
    const shared = await SharedCalendar.findById(shareId);
    if (!shared)
      return res.status(404).json({ ok: false, msg: '공유 정보를 찾을 수 없습니다.' });

    // 비밀번호 검증
    const valid = await bcrypt.compare(password, shared.passwordHash);
    if (!valid)
      return res.status(401).json({ ok: false, msg: '비밀번호가 일치하지 않습니다.' });

    // 원본 캘린더 불러오기
    const originalCalendar = await Calendar.findById(shared.calendarId);
    if (!originalCalendar)
      return res.status(404).json({ ok: false, msg: '원본 캘린더를 찾을 수 없습니다.' });

    // ✅ 이미 공유받은 캘린더인지 중복 체크
    const existing = await Calendar.findOne({
      user: userId,
      sharedFrom: originalCalendar.user,
      name: `[공유] ${originalCalendar.name}`,
    });
    if (existing)
      return res.status(200).json({
        ok: true,
        msg: '이미 공유받은 캘린더입니다.',
        calendar: existing,
      });

    // ✅ 새 캘린더 생성
    const newCalendar = new Calendar({
      name: `[공유] ${originalCalendar.name}`,
      color: originalCalendar.color,
      memo: originalCalendar.memo,
      user: userId, // 로그인한 사용자로 소유자 변경
      sharedFrom: originalCalendar.user, // 공유자 UID 저장
    });

    await newCalendar.save();

    return res.json({
      ok: true,
      msg: '공유 캘린더가 내 목록에 추가되었습니다.',
      calendar: newCalendar,
    });
  } catch (error) {
    console.error('공유 캘린더 접근 오류:', error);
    res.status(500).json({ ok: false, msg: '공유 캘린더 접근 실패' });
  }
};



/** ✅ 공유 정보 조회 (매번 새로 생성 X) */
exports.getShareInfo = async (req, res) => {
  const { id } = req.params;
  const uid = req.uid;

  try {
    const calendar = await Calendar.findById(id);
    if (!calendar) return res.status(404).json({ ok: false, msg: '캘린더를 찾을 수 없습니다.' });
    if (calendar.user.toString() !== uid) return res.status(403).json({ ok: false, msg: '권한이 없습니다.' });

    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

    // ✅ 링크나 비밀번호가 아예 없을 때만 한 번 생성
    let updated = false;

    if (!calendar.shareLink) {
      calendar.shareLink = `${FRONTEND_URL}/share-calendar/${calendar.id}`;
      updated = true;
    }

    if (!calendar.sharePassword) {
      calendar.sharePassword = crypto.randomBytes(3).toString('hex');
      updated = true;
    }

    if (updated) await calendar.save();

    return res.json({
      ok: true,
      shareUrl: calendar.shareLink,
      sharePassword: calendar.sharePassword,
    });
  } catch (error) {
    console.error('❌ 공유 정보 조회 오류:', error);
    return res.status(500).json({ ok: false, msg: '서버 오류' });
  }
};


// (선택) 재발급 API: 링크/비번 새로 생성
exports.regenerateShareCredentials = async (req, res) => {
  const { id } = req.params;
  const uid = req.uid;

  try {
    const calendar = await Calendar.findById(id);
    if (!calendar) return res.status(404).json({ ok: false, msg: '캘린더를 찾을 수 없습니다.' });
    if (String(calendar.user) !== String(uid)) {
      return res.status(403).json({ ok: false, msg: '권한이 없습니다.' });
    }

    const token = crypto.randomBytes(16).toString('hex');
    const plainPassword = crypto.randomBytes(4).toString('hex');
    const hash = bcrypt.hashSync(plainPassword, 10);

    calendar.shareToken = token;
    calendar.sharePasswordHash = hash;
    await calendar.save();

    return res.json({
      ok: true,
      link: `${FRONTEND_URL}/shared/${token}`,
      password: plainPassword,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, msg: '서버 오류' });
  }
};

// 공유 링크 접속 후(로그인 상태) 비밀번호 검증 + 내 목록에 추가
exports.verifyAndAttachSharedCalendar = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  const uid = req.uid;

  try {
    const calendar = await Calendar.findOne({ shareToken: token });
    if (!calendar) return res.status(404).json({ ok: false, msg: '캘린더를 찾을 수 없습니다.' });

    const ok = bcrypt.compareSync(password, calendar.sharePasswordHash || '');
    if (!ok) return res.status(401).json({ ok: false, msg: '비밀번호 불일치' });

    // 이미 추가되어 있는지 체크
    const already = calendar.sharedWith.some(u => String(u) === String(uid));
    if (!already) {
      calendar.sharedWith.push(uid);
      await calendar.save();
    }

    return res.json({ ok: true, msg: '공유 캘린더가 내 목록에 추가되었습니다.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, msg: '서버 오류' });
  }
};

// ✅ 공유 캘린더 참여
// exports.joinSharedCalendar = async (req, res) => {
//   const { shareId } = req.params;
//   const { password } = req.body;
//   const userId = req.uid; // ✅ JWT에서 로그인한 사용자 ID 가져오기

//   try {
//     // 1. 공유 정보 확인
//     const shared = await SharedCalendar.findOne({ shareLink: shareId });
//     if (!shared)
//       return res.status(404).json({ ok: false, msg: "공유 링크를 찾을 수 없습니다." });

//     // 2. 비밀번호 검증
//     const valid = await bcrypt.compare(password, shared.passwordHash);
//     if (!valid)
//       return res.status(400).json({ ok: false, msg: "비밀번호가 일치하지 않습니다." });

//     // 3. 원본 캘린더 찾기 (공유자의)
//     const originalCalendar = await Calendar.findById(shared.calendarId);
//     if (!originalCalendar)
//       return res.status(404).json({ ok: false, msg: "캘린더를 찾을 수 없습니다." });

//     // 4. 로그인한 사용자에게 동일한 캘린더 복제 or 연결
//     const newCalendar = new Calendar({
//       name: `[공유] ${originalCalendar.name}`,
//       color: originalCalendar.color,
//       memo: originalCalendar.memo,
//       owner: userId, // ✅ 현재 로그인한 사용자로 소유자 변경
//       sharedFrom: originalCalendar.owner, // 공유자 정보 기록
//     });

//     await newCalendar.save();

//     res.status(200).json({
//       ok: true,
//       msg: "공유 캘린더 추가 완료",
//       calendar: newCalendar,
//     });
//   } catch (error) {
//     console.error("공유 캘린더 접근 오류:", error);
//     res.status(500).json({ ok: false, msg: "공유 캘린더 접근 실패" });
//   }
// };
