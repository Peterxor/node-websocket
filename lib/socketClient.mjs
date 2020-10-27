import ws from 'ws'
import logger from './logger.mjs'
import config from '../config/index.mjs'
import {to} from 'await-to-js'

// ws://192.168.222.184:8081/WEBService/ServiceServer
const socketClient = async (address) => {
    let client = new ws(address)

    // 監聽socket連線開啟
    client.on('open', function open() {
        logger.info(`open connection with ${address} success`)
    })

    // 監聽傳來client的資料
    client.on('message', async function incoming(data) {
        logger.info(`redirect to other server => ${data}`)
        // console.log(Date.now())
        // 處理資料的service有此開始
    })

    // 監聽socket連線關閉
    client.on('close', async () => {
        logger.error(`client with ${address} socket close`)
    })

    // 監聽錯誤資訊
    client.on('error', (error) => {
        logger.error(`socket client error: ${error.message}`)
    })
    return Promise.resolve(client)
}


export default socketClient