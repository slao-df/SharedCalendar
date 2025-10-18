const { response } = require('express');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { generateJWT } = require('../helpers/jwt');

// 🔹 회원가입
const createUser = async (req, res = response) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });

    // 이미 존재하는 사용자일 경우
    if (user) {
      return res.status(400).json({
        ok: false,
        msg: '이미 등록된 사용자입니다.',
      });
    }

    user = new User(req.body);

    // 비밀번호 암호화
    const salt = bcrypt.genSaltSync();
    user.password = bcrypt.hashSync(password, salt);

    await user.save();

    // JWT 생성
    const token = await generateJWT(user.id, user.name);

    res.status(201).json({
      ok: true,
      uid: user.id,
      name: user.name,
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      msg: '서버 오류가 발생했습니다. 관리자에게 문의하세요.',
    });
  }
};

// 🔹 로그인
const loginUser = async (req, res = response) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    // 해당 이메일의 사용자가 없을 경우
    if (!user) {
      return res.status(400).json({
        ok: false,
        msg: '해당 이메일로 등록된 사용자가 없습니다.',
      });
    }

    // 비밀번호 확인
    const validPassword = bcrypt.compareSync(password, user.password);

    if (!validPassword) {
      return res.status(400).json({
        ok: false,
        msg: '비밀번호가 올바르지 않습니다.',
      });
    }

    // JWT 생성
    const token = await generateJWT(user.id, user.name);

    res.json({
      ok: true,
      uid: user.id,
      name: user.name,
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      msg: '서버 오류가 발생했습니다. 관리자에게 문의하세요.',
    });
  }
};

// 🔹 토큰 재검증 (재발급)
const revalidateToken = async (req, res = response) => {
  const { uid, name } = req;

  // 새로운 JWT 생성
  const token = await generateJWT(uid, name);

  res.json({
    ok: true,
    uid,
    name,
    token,
  });
};

module.exports = {
  createUser,
  loginUser,
  revalidateToken,
};
