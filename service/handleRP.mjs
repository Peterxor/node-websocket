import _ from "lodash";
import transferNumber from './transferNumber.mjs'

const startNumber = ['11', '12', '13', '14', '15', '16', '17', '18',
                     '21', '22', '23', '24', '25', '26', '27', '28',
                     '31', '32', '33', '34', '35', '36', '37', '38',
                     '41', '42', '43', '44', '45', '46', '47', '48']

const handleRP = async (texts, redisData) => {
    let result = ''
    let number = ''
    let redis = {}
    let errNum = ''
    let numRange = '-5~15'
    switch (redisData.sessionRecord[0]) {
        case 'recession':
            errNum = '2'
            break
        case 'PD':
            errNum = '3'
            break
        case 'Plague':
            errNum = '6'
            numRange = '0 or 1'
            break
        case 'BOP':
            errNum = '7'
            numRange = '0 or 1'
            break
    }
    if (texts[texts.length - 1] === 'start') {
        for (let t of _.slice(texts, 0, texts.length - 1)) {
            result += transferNumber(t)
            number += transferNumber(t)
        }
        if (_.includes(redisData.micp, number) || !_.includes(startNumber, number)) {
            return Promise.reject(new Error(`E0${errNum}0:錯誤的起始牙位(${number})`))
        }
        redis.sessionRecord = number
        result += ' start'
    } else {
        let rpType = redisData.sessionRecord[0]
        if (redisData.sessionRecord.length < 3) {
            return Promise.reject(new Error(`E0${errNum}1:尚未決定報位起始方向`))
        }

        if (!redisData.sessionTeeths) {
            redis.sessionTeeths = []
        } else {
            redis.sessionTeeths = redisData.sessionTeeths
        }

        if (redis.sessionTeeths.length === 0) {
            redis.sessionTeeths.push([])
        }

        for (let index = 0; index < texts.length; index++) {
            let tempText = ''
            if (texts[index] === 'negative') {
                tempText = texts[index] + ' ' + texts[index + 1]
                index++
            } else {
                tempText = texts[index]
            }
            tempText = transferNumber(tempText)
            if (!tempText) {
                return Promise.reject(new Error(`E0${errNum}2:非${rpType}記錄資訊格式(須為${numRange}數值)`))
            }
            if (tempText * 1 < -5 || tempText * 1 > 15) {
                return Promise.reject(new Error(`E0${errNum}2:非${rpType}記錄資訊格式(須為${numRange}數值)`))
            }
            if ((_.includes(['6', '7'], errNum)) && (!_.includes(['0', '1'], tempText))) {
                return Promise.reject(new Error(`E0${errNum}2:非${rpType}記錄資訊格式(須為${numRange}數值)`))
            }
            if (redis.sessionTeeths[redis.sessionTeeths.length - 1].length >= 3) {
                redis.sessionTeeths.push([])
            }
            redis.sessionTeeths[redis.sessionTeeths.length - 1].push(tempText)
        }

        // if (redisData.sessionTeeths.length < 3) {
        //     let tempText = texts.join(' ')
        //     tempText = transferNumber(tempText)
        //     if (!tempText) {
        //         return Promise.reject(new Error(`E0${errNum}2:非${rpType}記錄資訊格式(須為${numRange}數值)`))
        //     }
        //     if (tempText * 1 < -5 || tempText * 1 > 15) {
        //         return Promise.reject(new Error(`E0${errNum}2:非${rpType}記錄資訊格式(須為${numRange}數值)`))
        //     }
        //     redis.sessionTeeths = redisData.sessionTeeths
        //     redis.sessionTeeths.push(tempText)
        // }
    }
    return Promise.resolve({
        text: result,
        redis,
    })
}

export default handleRP