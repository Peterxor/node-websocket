import express from 'express'
import ws from 'ws'
import fs from 'fs'
import { to } from 'await-to-js'
import config from '../config/index.mjs'
import logger from './logger.mjs'

let client = null // 連結到語音辨識系統
let hisServer = null // 連結到his server 的socket
let parseData = null


const makeClient = async () => {
    let temp = new ws(config.socketClient.address)
    // 監聽socket連線開啟
    temp.on('open', function open() {
        logger.info(`open connection with ${config.socketClient.address} success`)
    })

    // 監聽傳來client的資料
    temp.on('message', async function incoming(data) {
        logger.info(`redirect to other server => ${data}`)
        // 處理資料的service有此開始
        parseData = data
        hisServer.send(parseData)
    })

    // 監聽socket連線關閉
    temp.on('close', async () => {
        logger.error(`client with ${config.socketClient.address} socket close`)
    })

    // 監聽錯誤資訊
    temp.on('error', (error) => {
        logger.error(`socket client error: ${error.message}`)
    })
    //暫停5秒
    return Promise.resolve(temp)
}

const server = async () => {
    //創建 express 的物件，並綁定及監聽 port ，且設定開啟後在 console 中提示
    const server = express()
        .listen(config.socketServer.port, () => logger.info(`Listening ${config.socketServer.port}`))
    //將 express 交給 SocketServer 開啟 WebSocket 的服務
    const wss = new ws.Server({server})
    const [err, temp] = await to(makeClient())
    if (err) {
        logger.error(err)
    }
    client = temp
    // 開始傳送資料給kankone語音辨識系統
    //當 WebSocket 從外部連結時執行
    wss.on('connection', ws => {

        //連結時執行此 console 提示
        logger.info(`Client connected`)
        hisServer = ws

        //對 message 設定監聽，接收從 Client(ws) 發送的訊息
        ws.on('message', async data => {
            logger.info(`Outside Client connect Server`)



            if (+client.readyState !== 1) {
                logger.error(`client socket to ${config.socketClient.address} is disconnected, reconnect start`)
                const [err, temp] = await to(makeClient())
                if (err) {
                    logger.error(`reconnect error: ${err.message}`)
                } else {
                    client = temp
                    //暫停5秒
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }


                // console.log(`new client readyState: ${temp.readyState}`)
            }

            if (+client.readyState === 1) {
                logger.info(`send media to ${config.socketClient.address}`)
                client.send(data)
                fs.writeFile('./media/test123.wav', data, (err) => {
                    if (err) {
                        logger.error('write file error')
                    } else {
                        logger.info('write file success')
                    }
                })
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







