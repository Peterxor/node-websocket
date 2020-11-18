import _ from "lodash";
import transferNumber from './transferNumber.mjs'


const handleMF = async (texts, redisData) => {
    let number = ''
    let redis = {}
    if (redisData.sessionRecord.length < 4) {
        if (!redis.sessionRecord) {
            redis.sessionRecord = redisData.sessionRecord
        }
        let i = 0
        for (let t of texts) {
            let temp = transferNumber(t)
            if (temp) {
                number += temp
            } else {
                redis.sessionRecord.push(number)
                number = ''
                redis.sessionRecord.push(t)
            }
            if (i === texts.length - 1) {
                redis.sessionRecord.push(number)
            }
            i++
        }
    }


    return Promise.resolve({
        redis,
    })
}

export default handleMF