// controllers/events.js
const { response } = require('express');
const Event = require('../models/Event');

// 🔹 모든 이벤트 조회
const getEvents = async (req, res = response) => {
  const events = await Event.find().populate('user', 'name');

  res.json({
    ok: true,
    events,
  });
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
const deleteEvent = async (req, res = response) => {
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

    // 다른 사용자가 삭제하려는 경우
    if (event.user.toString() !== uid) {
      return res.status(401).json({
        ok: false,
        msg: '이 이벤트를 삭제할 권한이 없습니다.',
      });
    }

    // 이벤트 삭제
    await Event.findByIdAndDelete(eventId);

    res.json({ ok: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      msg: '서버 오류가 발생했습니다. 관리자에게 문의하세요.',
    });
  }
};

module.exports = {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
};
