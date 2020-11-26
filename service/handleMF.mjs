import _ from "lodash";
import transferNumber from './transferNumber.mjs'

const startNumber = ['11', '12', '13', '14', '15', '16', '17', '18',
    '21', '22', '23', '24', '25', '26', '27', '28',
    '31', '32', '33', '34', '35', '36', '37', '38',
    '41', '42', '43', '44', '45', '46', '47', '48']

const handleMF = async (texts, redisData) => {
    // let number = ''
    let redis = {}
    if (redisData.sessionRecord.length < 4) {
        if (!redis.sessionRecord) {
            redis.sessionRecord = redisData.sessionRecord
        }
        let num = redis.sessionRecord[0] === 'Mobility' ? '4' : (redis.sessionRecord[0] === 'furcation' ? '5' : '')
        let middleNames = redis.sessionRecord[0] === 'Mobility' ? ['degree'] : (redis.sessionRecord[0] === 'furcation' ? ['buccal', 'distal', 'lingual', 'mesial'] : [])

        if (texts.length === 4) {
            let temp0 = transferNumber(texts[0])
            let temp1 = transferNumber(texts[1])
            let temp2 = texts[2]
            let temp3 = transferNumber(texts[3])
            if (_.includes(['1', '2', '3', '4'], temp0) &&
                _.includes(['1', '2', '3', '4', '5', '6', '7', '8'], temp1) &&
                _.includes(middleNames, temp2) &&
                _.includes(['1', '2', '3'], temp3))
            {
                if (_.includes(redisData.micp, temp0 + temp1)) {
                    return Promise.reject(new Error(`E0${num}0:錯誤的${redis.sessionRecord[0]}牙位${temp0 + temp1}`))
                }
                redis.sessionRecord.push(temp0 + temp1)
                redis.sessionRecord.push(temp2)
                redis.sessionRecord.push(temp3)
            } else {
                return Promise.reject(new Error(`E0${num}1:非${redis.sessionRecord[0]}記錄資訊`))
            }
        } else if (texts.length === 3) {
            let temp0 = transferNumber(texts[0])
            if (_.includes(redisData.micp, temp0)) {
                return Promise.reject(new Error(`E0${num}0:錯誤的${redis.sessionRecord[0]}牙位${temp0}`))
            }
            let temp1 = texts[1]
            let temp2 = transferNumber(texts[2])
            if (_.includes(startNumber, temp0) && _.includes(middleNames, temp1) && _.includes(['1', '2', '3'], temp2)) {
                redis.sessionRecord.push(temp0)
                redis.sessionRecord.push(temp1)
                redis.sessionRecord.push(temp2)
            } else {
                return Promise.reject(new Error(`E0${num}1:非${redis.sessionRecord[0]}記錄資訊`))
            }
        } else {
            return Promise.reject(new Error(`E0${num}1:非${redis.sessionRecord[0]}記錄資訊`))
        }
        // let i = 0
        // for (let t of texts) {
        //     let temp = transferNumber(t)
        //     if (temp) {
        //         number += temp
        //     } else {
        //         redis.sessionRecord.push(number)
        //         number = ''
        //         redis.sessionRecord.push(t)
        //     }
        //     if (i === texts.length - 1) {
        //         redis.sessionRecord.push(number)
        //     }
        //     i++
        // }
    }

    return Promise.resolve({
        redis,
    })
}

export default handleMF