// controllers/events.js
const { response } = require('express');
const Event = require('../models/Event');
const Calendar = require('../models/Calendar');

// 🔹 모든 이벤트 조회
const getEvents = async (req, res) => {
  const userId = req.uid; // 현재 로그인한 사용자 ID

  try {
    // 1. 내가 소유하거나 참여 중인 모든 캘린더의 ID 목록을 찾습니다.
    const myCalendars = await Calendar.find({
      $or: [
        { user: userId },         // 내가 소유한 캘린더
        { participants: userId }  // 내가 참여자로 포함된 캘린더
      ]
    }).select('_id'); // 성능을 위해 ID 필드만 선택

    // 2. 찾은 캘린더 문서에서 ID 값만 추출하여 배열로 만듭니다.
    const myCalendarIds = myCalendars.map(cal => cal._id);

    // 3. 해당 캘린더 ID 목록에 속한 모든 이벤트를 조회합니다.
    const events = await Event.find({ calendar: { $in: myCalendarIds } })
                              .populate('user', 'name')        // 이벤트 작성자 이름 포함
                              .populate('calendar', 'name color'); // 이벤트가 속한 캘린더의 이름/색상 포함

    res.json({ events }); // 조회된 이벤트 목록 반환

  } catch (error) {
    console.error('❌ 이벤트 로딩 오류 (getEvents):', error);
    res.status(500).json({ msg: '서버 오류 발생' });
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
