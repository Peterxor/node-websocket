import express from 'express'
import ws from 'ws'
import moment from 'moment'
// import WebSocket from 'websocket'
import {v4 as uuidv4} from 'uuid'
import fs from 'fs'
import {promisify} from 'util'
import {to} from 'await-to-js'
import config from '../config/index.mjs'
import logger from './logger.mjs'
import redisClient from './redis.mjs'
import socketClient from "./socketClient.mjs";

redisClient.Init()


const server = async () => {
    //創建 express 的物件，並綁定及監聽 port ，且設定開啟後在 console 中提示
    const server = express()
        .listen(config.socketServer.port, () => logger.info(`Listening ${config.socketServer.port}`))
    //將 express 交給 SocketServer 開啟 WebSocket 的服務
    const wss = new ws.Server({server})

    // 開始傳送資料給kankone語音辨識系統
    //當 WebSocket 從外部連結時執行
    wss.on('connection', async ws => {

        //連結時執行此 console 提示
        let uuid = uuidv4()
        logger.info(`Client(${uuid}) connected`)

        global.hisServer[uuid] = ws
        const [err, temp] = await to(socketClient(uuid))
        if (err) {
            logger.error(`建立websocket client 錯誤： ${err.message}, uuid: ${uuid}`)
            ws.close()
            return
        }
        global.kankoneClient[uuid] = temp
        await new Promise(resolve => setTimeout(resolve, config.socketServer.waitTime));

        //對 message 設定監聽，接收從 Client(ws) 發送的訊息
        ws.on('message', async data => {
            logger.info(`Outside Client(${uuid}) send data to here`)
            if (+global.kankoneClient[uuid].readyState !== 1) {
                logger.error(`client socket to ${config.socketClient.address} is disconnected, reconnect start`)
                const [err, temp] = await to(socketClient(uuid))
                if (err) {
                    logger.error(`reconnect error: ${err.message}`)
                } else {
                    global.kankoneClient[uuid] = temp
                    //暫停5秒
                    await new Promise(resolve => setTimeout(resolve, config.socketServer.waitTime));
                }
            }

            if (+global.kankoneClient[uuid].readyState === 1) {
                logger.info(`send media to ${config.socketClient.address}`)
                if (!Buffer.isBuffer(data)) {
                    logger.error('data is not buffer')
                    return
                }

                let writeFilePromise = promisify(fs.writeFile).bind(fs)
                // 將fs.writeFile方法包promise
                // 先將聲音存檔
                let [err] = await to(writeFilePromise(`./media/${moment().format('YYYY-MM-DD HH:mm:ss')}-${uuid}.wav`, data))
                if (err) {
                    logger.error(err)
                }
                // 必須將音檔的buffer加為8192的倍數，否則語音識別系統不吃
                // 1.先算出還差多少
                let padding = Math.ceil(data.length/8192) * 8192 - data.length
                // 2.空的buffer
                let paddingBuffer = Buffer.alloc(padding)
                // 3.buffer 相加
                let newData = Buffer.concat([data, paddingBuffer], data.length + paddingBuffer.length)
                global.kankoneClient[uuid].send(newData)

            } else {
                logger.error(`重新建立連線中`)
                let resError = {
                    status: "fail",
                    data: "重新建立連線中"
                }
                logger.error(JSON.stringify(resError))
                ws.send(JSON.stringify(resError))
                return Promise.resolve()
            }
        })

        //當 WebSocket 的連線關閉時執行
        ws.on('close', () => {
            logger.info('Client close connected')
        })

        ws.on('error', (err) => {
            logger.error(`client connect server error: ${err.message}`)
        })
    })
    return wss
}

export default server







