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
    console.log(3, redisData)
    if (_.includes(redisData.micp, number)) {
        return Promise.reject(new Error(`${number} have missing , implant , crown , pontic status`))
    }
    return Promise.resolve({text, number})
}

export default handleMICP