import _ from "lodash";
import transferNumber from './transferNumber.mjs'


const handleMICP = async (slice, tempText = '') => {
    let returnText
    if (tempText !== '') {
        returnText = tempText
    }
    for (let i = 0; i < slice.length; i++) {
        if (_.includes(englishNumber, slice[i])) {
            returnText += transferNumber(slice[i])
            if (slice[i + 1] && _.includes(englishNumber, slice[i + 1])) {
                returnText += transferNumber
            }
        } else if (_.includes(chineseNumber, slice[i])) {
            returnText += transferNumber(slice[i])
        }
    }
    return Promise.resolve(returnText)
}

export default handleMICP