const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Calendar = require('../models/Calendar');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// 공유 링크/비밀번호 최초 생성(이미 있으면 재사용)
exports.generateShareLink = async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  const uid = req.uid;

  try {
    const calendar = await Calendar.findById(id);
    if (!calendar) return res.status(404).json({ ok: false, msg: '캘린더를 찾을 수 없습니다.' });
    if (calendar.user.toString() !== uid) return res.status(403).json({ ok: false, msg: '권한이 없습니다.' });

    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

    // 기존 링크가 없을 때만 생성
    if (!calendar.shareLink) {
      calendar.shareLink = `${FRONTEND_URL}/share-calendar/${calendar.id}`;
    }

    // ✅ 비밀번호 수정 시에만 변경
    if (password && password.trim() !== '') {
      calendar.sharePassword = password.trim();
    }

    await calendar.save();

    return res.json({
      ok: true,
      shareUrl: calendar.shareLink,
      sharePassword: calendar.sharePassword,
    });
  } catch (error) {
    console.error('❌ 공유 링크 저장 오류:', error);
    return res.status(500).json({ ok: false, msg: '서버 오류' });
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
