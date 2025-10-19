// routes/calendars.js
const { Router } = require("express");
const { check } = require("express-validator");
const { validateFields } = require("../middlewares/validate-fields");
const { validateJWT } = require("../middlewares/validate-jwt");
const Calendar = require("../models/Calendar");
const {
  getCalendars,
  createCalendar,
  updateCalendar, // 👈 이 함수가 임포트되었는지 확인하세요.
  deleteCalendar, // 👈 이 함수도 확인하세요.
} = require('../controllers/calendars');
const {
  generateShareLink,
  regenerateShareCredentials,
  verifyAndAttachSharedCalendar,
  getShareInfo
} = require('../controllers/calendarShareController');


const router = Router();

// 🔒 JWT 인증 필수
router.use(validateJWT);

/**
 * 전체 캘린더 불러오기
 */
router.get("/", async (req, res) => {
  try {
    const calendars = await Calendar.find({ user: req.uid });
    res.json({
      ok: true,
      calendars,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      msg: "캘린더 목록을 불러오지 못했습니다.",
    });
  }
});

/**
 * 새 캘린더 추가
 */
router.post(
  "/",
  [check("name", "캘린더 이름은 필수입니다.").not().isEmpty(), validateFields],
  async (req, res) => {
    try {
      const calendar = new Calendar({
        ...req.body,
        user: req.uid, // JWT 토큰에서 사용자 ID 삽입
      });

      const saved = await calendar.save();
      res.status(201).json({
        ok: true,
        calendar: saved,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        ok: false,
        msg: "캘린더 저장 실패",
      });
    }
  }
);

router.put(
  '/:id', // '/:id' 경로로 PUT 요청을 받습니다.
  [ // 유효성 검사 미들웨어 (이름, 색상이 비어있지 않은지 확인)
    check('name', '이름은 필수입니다.').not().isEmpty(),
    check('color', '색상은 필수입니다.').not().isEmpty(),
    validateFields,
  ],
  updateCalendar // controllers/calendars.js의 updateCalendar 함수와 연결
);

/**
 * 캘린더 삭제
 */
router.delete("/:id", async (req, res) => {
  try {
    const calendar = await Calendar.findById(req.params.id);

    if (!calendar) {
      return res.status(404).json({
        ok: false,
        msg: "해당 캘린더를 찾을 수 없습니다.",
      });
    }

    if (calendar.user.toString() !== req.uid) {
      return res.status(401).json({
        ok: false,
        msg: "권한이 없습니다.",
      });
    }

    await Calendar.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, msg: "캘린더 삭제 실패" });
  }
});


// 공유 링크/비번 생성
router.post('/:id/share', validateJWT, generateShareLink);
router.get('/:id/share', validateJWT, getShareInfo);

// (선택) 재발급
router.post('/:id/share/regenerate', validateJWT, regenerateShareCredentials);

// 공유 링크 검증 + 내 목록에 추가
router.post('/shared/:token/verify', validateJWT, verifyAndAttachSharedCalendar);


module.exports = router;
