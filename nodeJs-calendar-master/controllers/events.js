// controllers/events.js
const { response } = require('express');
const Event = require('../models/Event');

// 🔹 모든 이벤트 조회
const getEvents = async (req, res) => {
  try {
    const events = await Event.find({ user: req.uid })
      .populate('user', 'name') // user 필드에서 'name'만 가져오기
      .populate('calendar', 'name color'); // calendar 필드에서 'name'과 'color' 가져오기
    // 👆👆👆

    res.json({ events }); // 프론트엔드로 events 전송
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: '서버 오류 발생' });
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
