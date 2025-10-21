//controllers/calendars.js
const Calendar = require('../models/Calendar');
const Event = require('../models/Event'); // 👈 [추가] 이벤트 삭제를 위해 Event 모델 임포트

// 🔹 모든 캘린더 불러오기
const getCalendars = async (req, res) => {
  try {
    // [수정] 현재 로그인한 사용자의 캘린더만 불러오도록 수정
    const calendars = await Calendar.find({ user: req.uid }); 
    res.json({ ok: true, calendars });
  } catch (error) {
    console.log(error);
    res.status(500).json({ ok: false, msg: '캘린더를 불러오지 못했습니다.' });
  }
};

// 🔹 새 캘린더 생성
const createCalendar = async (req, res) => {
  try {
    // [수정] 캘린더 생성 시 사용자 정보(req.uid) 추가
    const calendar = new Calendar({
      ...req.body,
      user: req.uid 
    });
    await calendar.save();
    res.json({ ok: true, calendar });
  } catch (error) {
    console.log(error);
    res.status(500).json({ ok: false, msg: '캘린더 생성 중 오류가 발생했습니다.' });
  }
};

// ✅ [신규] 캘린더 수정
const updateCalendar = async (req, res) => {
  const calendarId = req.params.id;
  const userId = req.uid;

  try {
    const calendar = await Calendar.findById(calendarId);

    if (!calendar) {
      return res.status(404).json({ ok: false, msg: '캘린더를 찾을 수 없습니다.' });
    }

    // [수정] 캘린더 소유자 확인
    if (calendar.user.toString() !== userId) {
      return res.status(401).json({ ok: false, msg: '권한이 없습니다.' });
    }

    const newCalendarData = {
      ...req.body,
      user: userId, // 사용자 정보는 유지
    };

    const updatedCalendar = await Calendar.findByIdAndUpdate(
      calendarId,
      newCalendarData,
      { new: true } // 업데이트된 문서를 반환
    );

    res.json({ ok: true, calendar: updatedCalendar });
  } catch (error) {
    console.log(error);
    res.status(500).json({ ok: false, msg: '서버 오류 발생' });
  }
};

// ✅ [신규] 캘린더 삭제
const deleteCalendar = async (req, res) => {
  const calendarId = req.params.id;
  const userId = req.uid;

  try {
    const calendar = await Calendar.findById(calendarId);

    if (!calendar) {
      return res.status(404).json({ ok: false, msg: '캘린더를 찾을 수 없습니다.' });
    }

    // [수정] 캘린더 소유자 확인
    if (calendar.user.toString() !== userId) {
      return res.status(401).json({ ok: false, msg: '권한이 없습니다.' });
    }

    // [중요] 해당 캘린더에 속한 모든 이벤트 삭제
    await Event.deleteMany({ calendar: calendarId });

    // 캘린더 삭제
    await Calendar.findByIdAndDelete(calendarId);

    res.json({ ok: true, msg: '캘린더 및 관련 일정이 삭제되었습니다.' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ ok: false, msg: '서버 오류 발생' });
  }
};



// ✅ [수정] module.exports에 함수 추가
module.exports = { 
  getCalendars, 
  createCalendar, 
  updateCalendar, 
  deleteCalendar,
};
