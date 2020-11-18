import _ from "lodash";
import transferNumber from './transferNumber.mjs'


const handleRP = async (texts, redisData) => {
    let result = ''
    let number = ''
    let redis = {}
    if (texts[texts.length - 1] === 'start') {
        for (let t of _.slice(texts, 0, texts.length - 1)) {
            result += transferNumber(t)
            number += transferNumber(t)
        }
        if (_.includes(redisData.micp, number)) {
            return Promise.reject(new Error('it is in missing, implant, crown, pontic tooth'))
        }
        redis.sessionRecord = number
        result += ' start'
    } else {
        if (redisData.sessionTeeths.length < 3) {
            let tempText = texts.join(' ')
            tempText = transferNumber(tempText)
            if (tempText && !_.includes(redisData.micp, tempText)) {
                redis.sessionTeeths = redisData.sessionTeeths
                redis.sessionTeeths.push(tempText)
            }
        }
    }
    return Promise.resolve({
        text: result,
        redis,
    })
}

export default handleRP