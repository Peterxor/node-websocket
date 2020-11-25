import _ from "lodash";
import transferNumber from './transferNumber.mjs'


const handleMICP = async (texts, redisData) => {
    let text = ''
    let number = ''
    for (let t of texts) {
        if (_.includes(sessionType, t)) {
            text += t + ','
        }
        if (_.includes(englishNumber, t)) {
            text += transferNumber(t)
            number += transferNumber(t)
        }

        if (_.includes(chineseNumber, t)) {
            text += transferNumber(t)
            number += transferNumber(t)
        }
    }
    // console.log(3, redisData)
    if (_.includes(redisData.micp, number)) {
        return Promise.reject(new Error(`E011:出現重複Missing/Implant/Crown/Pontic牙位`))
    }
    return Promise.resolve({text, number})
}

export default handleMICP