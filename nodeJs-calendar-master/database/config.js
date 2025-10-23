const mongoose = require('mongoose');

// MongoDB 데이터베이스 연결 함수
const dbConnection = async () => {
  try {
    await mongoose.connect(process.env.DB_CNN, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      /* useCreateIndex: true */ // 최신 버전에서는 자동 적용
    });

    console.log('Database connected');
  } catch (error) {
    console.log(error);
    // 데이터베이스 초기화 중 오류 발생 시
    throw new Error('데이터베이스 초기화 중 오류가 발생했습니다.');
  }
};

module.exports = {
  dbConnection,
};
