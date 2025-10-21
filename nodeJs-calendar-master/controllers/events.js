// controllers/events.js
const { response } = require('express');
const Event = require('../models/Event');
const Calendar = require('../models/Calendar');

// 🔹 모든 이벤트 조회
const getEvents = async (req, res) => {
  const userId = req.uid; // 현재 로그인한 사용자 ID
  console.log(`\n--- [getEvents] 사용자 ID: ${userId} ---`); // 로그 추가

  try {
    // 1. 내가 직접 소유한 캘린더 ID 목록 찾기
    const ownedCalendars = await Calendar.find({ user: userId, originalCalendarId: null }).select('_id');
    const ownedCalendarIds = ownedCalendars.map(cal => cal._id);
    console.log('1. 소유 캘린더 ID 목록:', ownedCalendarIds.map(id => id.toString())); // 로그 추가

    // 2. 내가 참여 중인 공유 캘린더 복사본들 찾기 (원본 ID 포함)
    const sharedCalendarCopies = await Calendar.find({ user: userId, originalCalendarId: { $ne: null } }).select('originalCalendarId');
    const originalCalendarIds = sharedCalendarCopies.map(cal => cal.originalCalendarId);
    console.log('2. 공유된 원본 캘린더 ID 목록:', originalCalendarIds.map(id => id.toString())); // 로그 추가

    // 3. 두 목록을 합쳐서 조회할 캘린더 ID 목록 생성 (중복 제거)
    const relevantCalendarIds = [...new Set([...ownedCalendarIds, ...originalCalendarIds])];
    console.log('3. 조회할 전체 캘린더 ID 목록:', relevantCalendarIds.map(id => id.toString())); // 로그 추가

    // 4. 해당 캘린더 ID들에 속한 모든 이벤트 조회
    console.log('4. 이벤트 조회 시작...'); // 로그 추가
    const events = await Event.find({ calendar: { $in: relevantCalendarIds } })
                              .populate('user', 'name')
                              .populate('calendar', 'name color');
    console.log(`5. 조회된 이벤트 ${events.length}개`); // 로그 추가
    // console.log('   조회된 이벤트 상세:', events); // (선택) 필요시 상세 로그 확인

    res.json({ events }); // 조회된 이벤트 목록 반환

  } catch (error) {
    console.error('❌ 이벤트 로딩 오류 (getEvents):', error);
    res.status(500).json({ msg: '서버 오류 발생' });
  } finally {
    console.log('--- [getEvents] 완료 ---'); // 로그 추가
  }
};

// 🔹 새 이벤트 생성
const createEvent = async (req, res = response) => {
  const event = new Event(req.body);

  try {
    // 현재 로그인한 사용자의 UID를 이벤트에 연결
    event.user = req.uid;

    const savedEvent = await event.save();

    res.json({
      ok: true,
      event: savedEvent,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      msg: '서버 오류가 발생했습니다. 관리자에게 문의하세요.',
    });
  }
};

// 🔹 이벤트 수정
const updateEvent = async (req, res = response) => {
  const eventId = req.params.id;
  const uid = req.uid;

  try {
    const event = await Event.findById(eventId);

    // 이벤트가 존재하지 않을 경우
    if (!event) {
      return res.status(404).json({
        ok: false,
        msg: '해당 ID의 이벤트가 존재하지 않습니다.',
      });
    }

    // 다른 사용자가 수정하려는 경우
    if (event.user.toString() !== uid) {
      return res.status(401).json({
        ok: false,
        msg: '이 이벤트를 수정할 권한이 없습니다.',
      });
    }

    // 수정된 이벤트 정보 구성
    const newEvent = {
      ...req.body,
      user: uid,
    };

    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      newEvent,
      { new: true }
    );

    res.json({
      ok: true,
      event: updatedEvent,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      msg: '서버 오류가 발생했습니다. 관리자에게 문의하세요.',
    });
  }
};

// 🔹 이벤트 삭제
const deleteEvent = async (req, res) => {
    const eventId = req.params.id;
    const userId = req.uid; // (토큰에서 온 사용자 ID)

    try {
      const event = await Event.findById(eventId); // (여긴 이제 통과)

      if (!event) {
        return res.status(404).json({ msg: '이벤트를 찾을 수 없습니다.' });
      }

      // ❗️❗️❗️
      // ❗️ 바로 이 부분에서 새로운 오류가 발생하고 있습니다.
      // ❗️ (예: event.user가 없는데 toString()을 호출 / userId가 없음)
      // ❗️❗️❗️
      if (event.user.toString() !== userId) {
        return res.status(401).json({ msg: '권한이 없습니다.' });
      }

      await Event.findByIdAndDelete(eventId);
      res.json({ msg: '이벤트 삭제됨' });
      
    } catch (error) {
      // ❗️ 지금 이 catch 블록이 실행되고 500 에러를 보낸 것입니다.
      console.log(error); // 👈 백엔드 서버 터미널에 새 오류가 찍혔습니다.
      return res.status(500).json({ msg: 'Hable con el administrador' });
    }
  };



module.exports = {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
};
