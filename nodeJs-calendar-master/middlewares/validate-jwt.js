const { response } = require('express');
const jwt = require('jsonwebtoken');

// 🔹 JWT 유효성 검사 미들웨어
const validateJWT = (req, res = response, next) => {
  // 요청 헤더에서 토큰 가져오기
  const token = req.header('x-token');

  // 토큰이 없는 경우
  if (!token) {
    return res.status(401).json({
      ok: false,
      msg: '요청에 토큰이 포함되어 있지 않습니다.',
    });
  }

  try {
    // 토큰 검증 및 디코딩
    const { uid, name } = jwt.verify(token, process.env.SECRET_JWT_SEED);

    req.uid = uid;
    req.name = name;
  } catch (error) {
    return res.status(401).json({
      ok: false,
      msg: '유효하지 않은 토큰입니다.',
    });
  }

  // 다음 미들웨어로 이동
  next();
};

module.exports = {
  validateJWT,
};
