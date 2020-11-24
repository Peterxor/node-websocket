import dotenv from 'dotenv'
dotenv.config()
const config = {
  nodeEnv: process.env.NODE_ENV,
  logTypes: process.env.LOG_TYPES,
  grayLog: {
    isOpen: process.env.GRAYLOG_OPEN * 1,
    connect: {
      host: process.env.GRAYLOG_HOST,
      port: process.env.GRAYLOG_PORT,
    },
    facility: process.env.GRAYLOG_FACILITY,
    bufferSize: process.env.GRAYLOG_BUFFERSIZE,
  },
  socketServer: {
    port: process.env.SOCKET_SERVER_PORT * 1,
    // host: process.env.SOCKET_SERVER_ADDRESS,
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },

  // 要連結到語音辨識系統的client
  socketClient: {
    address: process.env.SOCKET_CLIENT_ADDRESS
  }
}

export default config
