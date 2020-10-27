import _ from 'lodash'
import WinstonGraylog2 from 'winston-graylog2'
import winston from 'winston'
import config from '../config/index.mjs'


const { createLogger, format, transports } = winston
let loggerCore = null

const logger = {
  init: () => {
    if (!loggerCore) {
      const colorizer = format.colorize()
      let transportsArr = []
      let logTypes = config.logTypes.split(',')
      for (let logType of logTypes) {
        transportsArr.push(
            new transports.File({
              level: logType,
              filename: `logs/winston-${logType}.log`,
              format: format.combine(
                  format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss',
                  }),
                  format.printf(
                      (info) => {
                        if (_.isObject(info.message)) {
                          info.message = JSON.stringify(info.message)
                        }
                        const { level, message, timestamp } = info
                        return `[ LOG_LEVEL: ${level.toUpperCase()} LOG_TIME: ${timestamp} ] - ${(message)} \n`
                      },
                  ),
              ),
            }),
        )
        if (config.nodeEnv !== 'production') {
          transportsArr.push(
              new transports.Console({
                level: logType,
                filename: `logs/winston-${logType}.log`,
                format: format.combine(
                    format.timestamp({
                      format: 'YYYY-MM-DD HH:mm:ss',
                    }),
                    format.printf(
                        (info) => {
                          if (_.isObject(info.message)) {
                            info.message = JSON.stringify(info.message)
                          }
                          const { level, message, timestamp } = info
                          return colorizer.colorize(level, `[ LOG_LEVEL: ${level.toUpperCase()} LOG_TIME: ${timestamp} ] - ${(message)} \n`)
                        },
                    ),
                ),
              }),
          )
        }
        if (config.grayLog.isOpen) {
          transportsArr.push(
              new WinstonGraylog2({
                name: 'Graylog',
                level: logType,
                silent: false,
                handleExceptions: true,
                graylog: {
                  servers: [config.grayLog.connect],
                  facility: config.grayLog.facility,
                  bufferSize: config.grayLog.bufferSize,
                },
              }),
          )
        }
      }
      loggerCore = createLogger({
        transports: transportsArr,
        exitOnError: false,
      })
    }
  },
  error: (...args) => {
    args = _.map(args, arg => (_.isError(arg) ? arg.message : arg))
    if (!loggerCore) {
      logger.init()
    }
    loggerCore.error(...args)
  },
  info: (...args) => {
    args = _.map(args, arg => (_.isError(arg) ? arg.message : arg))
    if (!loggerCore) {
      logger.init()
    }
    loggerCore.info(...args)
  },
}

export default logger
