//controllers/calendars.js
const Calendar = require('../models/Calendar');
const Event = require('../models/Event'); // 👈 [추가] 이벤트 삭제를 위해 Event 모델 임포트

// 🔹 모든 캘린더 불러오기
const getCalendars = async (req, res) => {
 try {
    // ✅ [수정] 내가 소유하거나 참여한 모든 캘린더 조회
    const calendars = await Calendar.find({ user: req.uid })
    .populate('user', 'name') // 👑 소유자 정보 (이름)
    .populate('participants', 'name'); // 👤 참여자 목록 (이름)
    
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
  const calendarIdToDelete = req.params.id; // 삭제할 캘린더 ID (예: '[공유] 1'의 ID)
  const userId = req.uid; // 현재 로그인한 사용자 ID

  try {
    // 1. 삭제할 캘린더 문서를 찾습니다.
    const calendarToDelete = await Calendar.findById(calendarIdToDelete);

    if (!calendarToDelete) {
      return res.status(404).json({ ok: false, msg: '캘린더를 찾을 수 없습니다.' });
    }

    // 2. [소유권 확인] 내가 이 캘린더(껍데기 또는 원본)의 소유자인지 확인합니다.
    if (calendarToDelete.user.toString() !== userId) {
      return res.status(401).json({ ok: false, msg: '이 캘린더를 삭제할 권한이 없습니다.' });
    }

    // --- ✅ [핵심 로직 추가] ---
    // 3. 만약 이 캘린더가 '공유받은 캘린더(껍데기)'라면,
    if (calendarToDelete.originalCalendarId) {
      // 4. '원본 캘린더'를 찾아서 내 ID를 'participants' 배열에서 제거합니다.
      await Calendar.findByIdAndUpdate(
        calendarToDelete.originalCalendarId, // 원본 캘린더 ID
        { $pull: { participants: userId } } // participants 배열에서 내 userId 제거
      );
      // (오류 처리는 선택적으로 추가 가능)
    } else {
      // --- (기존 로직: 내가 '원본' 캘린더를 삭제하는 경우) ---
      // 5. 이 캘린더가 '원본'이면, 이 캘린더에 속한 모든 '일정(Event)'도 삭제합니다.
      // (주의: 공유받은 사람이 있다면 그들의 캘린더 목록에서도 사라지게 됩니다.)
      await Event.deleteMany({ calendar: calendarIdToDelete });

      // (선택) 이 원본 캘린더를 참조하는 모든 '[공유]' 캘린더(껍데기)도 삭제할 수 있습니다.
      // await Calendar.deleteMany({ originalCalendarId: calendarIdToDelete });
    }
    // --- [로직 추가 끝] ---

    // 6. 마지막으로, 요청된 캘린더(껍데기 또는 원본) 자체를 삭제합니다.
    await Calendar.findByIdAndDelete(calendarIdToDelete);

    res.json({ ok: true, msg: '캘린더가 삭제되었습니다.' }); // (메시지 수정)

  } catch (error) {
    console.error('❌ 캘린더 삭제 오류:', error); // (콘솔 로그 개선)
    res.status(500).json({ ok: false, msg: '캘린더 삭제 중 서버 오류 발생' }); // (메시지 수정)
  }
};

const getCalendarParticipants = async (req, res) => {
  const { id } = req.params; // 프론트에서 클릭한 캘린더의 ID (예: '[공유] 1'의 ID)

  try {
    // 1. 프론트가 보낸 ID로 캘린더를 찾습니다.
    const calendarToShow = await Calendar.findById(id);

    if (!calendarToShow) {
      return res.status(404).json({ ok: false, msg: '캘린더를 찾을 수 없습니다.' });
    }

    // 2. [핵심] 
    // 만약 이 캘린더가 공유 캘린더면(originalCalendarId가 있으면),
    // 실제 정보를 담고 있는 '원본 캘린더 ID'를 사용합니다.
    // 일반 캘린더면, '자기 ID'를 사용합니다.
    const targetCalendarId = calendarToShow.originalCalendarId 
                             ? calendarToShow.originalCalendarId 
                             : calendarToShow._id;

    // 3. '원본 캘린더'의 소유자와 참여자 목록을 DB에서 조회(populate)합니다.
    const targetCalendar = await Calendar.findById(targetCalendarId)
                                    .populate('user', 'name') // 소유자 정보
                                    .populate('participants', 'name'); // 참여자 목록

    if (!targetCalendar) {
      return res.status(404).json({ ok: false, msg: '원본 캘린더 정보를 찾을 수 없습니다.' });
    }

    // 4. 원본 캘린더의 소유주와 참여자 목록을 클라이언트에 반환
    res.json({
      ok: true,
      owner: targetCalendar.user, // 원본 소유자 (예: 'test')
      participants: targetCalendar.participants, // 원본 참여자 목록
    });

  } catch (error) {
    console.error('❌ 참여자 목록 조회 오류:', error);
    res.status(500).json({ ok: false, msg: '서버 오류 발생' });
  }
};

// ✅ [수정] module.exports에 함수 추가
module.exports = { 
  getCalendars, 
  createCalendar, 
  updateCalendar, 
  deleteCalendar,
  getCalendarParticipants,
  
};
