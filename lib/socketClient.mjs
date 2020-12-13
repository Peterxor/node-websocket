import ws from 'ws'
import logger from './logger.mjs'
import config from '../config/index.mjs'
import {to} from 'await-to-js'
import redisClient from "./redis.mjs";
import handleKankoneJson from "../service/handleKankoneJson.mjs";

// ws://192.168.222.184:8081/WEBService/ServiceServer
const socketClient = async (uuid) => {
    let temp = new ws(config.socketClient.address)
    // 監聽socket連線開啟
    temp.on('open', function open() {
        logger.info(`client ${uuid} open connection with ${config.socketClient.address} success`)
    })

    // 監聽傳來client的資料
    temp.on('message', async function incoming(data) {
        logger.info(`socket server client(${uuid}) get data, then redirect to his server, data => ${data}`)
        // 處理資料的service由此開始
        let [err, rData] = await to(redisClient.get(uuid))

        if (err) {
            logger.error(`redis get error: ${err.message}`)
            return
        }
        logger.info(`redis get data ${rData}`)
        if (rData) {
            rData = JSON.parse(rData)
            // rData.record.push(JSON.parse(data))
        } else {
            rData = {
                active: false,
                sessionType: '',
                micp: [],
                jsonRecord: {
                    missing: [],
                    implant: [],
                    crown: [],
                    pontic: [],
                    recession: [],
                    PD: [],
                    Mobility: [],
                    Furcation: [],
                    Plaque: [],
                    BOP: []
                }
            }

        }
        let parseData = JSON.parse(data)
        let [handleErr, transferedData] = await to(handleKankoneJson(rData, parseData, global.socketType[uuid]))
        if (handleErr && global.socketType[uuid] !== 2) {
            logger.error(`handle kankone json data error: ${handleErr.message}`)
            global.hisServer[uuid].send(JSON.stringify({text: handleErr.message}))
            return
        }

        const [setErr] = await to(redisClient.set(uuid, JSON.stringify(transferedData.redis)))
        logger.info(`data save to redis -> key: ${uuid}`)
        if (setErr && global.socketType[uuid] !== 2) {
            logger.error(`data save to redis error, ${err.message}`)
            global.hisServer[uuid].send(JSON.stringify({error: err.message}))
            return
        }

        // console.log(global.socketType[uuid], transferedData)

        if (global.socketType[uuid] === 1) {
            if (transferedData.textArray && transferedData.textArray.length > 0) {
                for (let t of transferedData.textArray) {
                    global.hisServer[uuid].send(JSON.stringify({text: t}))
                }
            } else {
                if (transferedData.text.text !== '') {
                    global.hisServer[uuid].send(JSON.stringify(transferedData.text))
                }
            }
        } else if (global.socketType[uuid] === 2 && transferedData.jsonRecord) {
            transferedData.jsonRecord.text = parseData.data[0].text
            global.hisServer[uuid].send(JSON.stringify(transferedData.jsonRecord))
        }
    })

    // 監聽socket連線關閉
    temp.on('close', async () => {
        logger.error(`client ${uuid} with ${config.socketClient.address} socket close`)
    })

    // 監聽錯誤資訊
    temp.on('error', (error) => {
        logger.error(`socket client ${uuid} error: ${error.message}`)
    })
    //暫停5秒
    return Promise.resolve(temp)
}


export default socketClient