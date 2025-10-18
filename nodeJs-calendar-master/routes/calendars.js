// routes/calendars.js
const { Router } = require("express");
const { check } = require("express-validator");
const { validateFields } = require("../middlewares/validate-fields");
const { validateJWT } = require("../middlewares/validate-jwt");
const Calendar = require("../models/Calendar");

const router = Router();

// 🔒 JWT 인증 필수
router.use(validateJWT);

/**
 * 📌 [GET] /api/calendars
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
 * 📌 [POST] /api/calendars
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

/**
 * 📌 [DELETE] /api/calendars/:id
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

module.exports = router;
