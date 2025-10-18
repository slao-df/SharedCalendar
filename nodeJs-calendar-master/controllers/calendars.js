const Calendar = require('../models/Calendar');

// 🔹 모든 캘린더 불러오기
const getCalendars = async (req, res) => {
  try {
    const calendars = await Calendar.find();
    res.json({ ok: true, calendars });
  } catch (error) {
    console.log(error);
    res.status(500).json({ ok: false, msg: '캘린더를 불러오지 못했습니다.' });
  }
};

// 🔹 새 캘린더 생성
const createCalendar = async (req, res) => {
  try {
    const calendar = new Calendar(req.body);
    await calendar.save();
    res.json({ ok: true, calendar });
  } catch (error) {
    console.log(error);
    res.status(500).json({ ok: false, msg: '캘린더 생성 중 오류가 발생했습니다.' });
  }
};

module.exports = { getCalendars, createCalendar };
