//index.js
const express = require('express');
const { dbConnection } = require('./database/config');
const cors = require('cors');
require('dotenv').config();

// 환경 변수 확인 (개발 중 디버깅용)
console.log(process.env);

// Express 서버 생성
const app = express();

// 데이터베이스 연결
dbConnection();

// CORS 설정
app.use(cors());

// public 폴더를 정적 경로로 설정
app.use(express.static('public'));

// 요청 본문(body) 파싱
app.use(express.json());

// 라우트 설정
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));

app.use("/api/calendars", require("./routes/calendars"));


// 서버 실행
app.listen(process.env.PORT, () => {
  console.log(`서버 포트 ${process.env.PORT}`);
});
