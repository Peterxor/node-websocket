import _ from 'lodash'
import {to} from 'await-to-js'
import {handleMICP, checkStart, handleRP, handleMF, nextTeeth} from './index.mjs'

const repeatTag = ['missing', 'implant', 'crown', 'pontic']

const handleKankoneJson = async (redisData, data) => {
    let resultText = 'E001:尚未啟動 EVAS GO'
    let result = null
    let textArray = []
    if (data.status === 'ok') {
        if (data.data[0].text) {
            let texts = data.data[0].text.split(' ')
            let err = null
            if (texts[0] === 'evas' || texts[0] === 'EVAS') {
                redisData.active = true
                resultText = data.data[0].text.toLowerCase()
            } else if (redisData.active) {
                switch (texts[0]) {
                    case 'missing':
                    case 'implant':
                    case 'crown':
                    case 'pontic':
                        [err, result] = await to(handleMICP(texts, redisData))
                        if (result) {
                            resultText = result.text
                            redisData.micp.push(result.number)
                        }
                        break
                    case 'recession':
                    case 'pd':
                    case 'probing':
                    case 'plague':
                    case 'bop':
                    case 'bleeding':
                        redisData.sessionType = 'RP'
                        if (texts[0] === 'probing' && texts[1] === 'depth') {
                            if (_.includes(['buccal', 'palatal', 'lingual'], texts[2])) {
                                redisData.sessionRecord = ['PD', texts[2]]
                                resultText = redisData.sessionRecord.join(',')
                            } else {
                                err = new Error('E002:非主要記錄段落啟動關鍵字(Missing/Implant/Crown/Pontic/Recession/PD/Mobility/Furcation/Plaque/BOP)')
                            }
                        } else if (texts[0] === 'plague') {
                            if (_.includes(['buccal', 'palatal', 'lingual'], texts[1])) {
                                texts[0] = 'Plague'
                                redisData.sessionRecord = texts
                                resultText = texts.join(',')
                            } else {
                                err = new Error('E002:非主要記錄段落啟動關鍵字(Missing/Implant/Crown/Pontic/Recession/PD/Mobility/Furcation/Plaque/BOP)')
                            }
                        } else if (texts[0] === 'bleeding' && texts[1] === 'on' && texts[2] === 'probing') {
                            if (_.includes(['buccal', 'palatal', 'lingual'], texts[3])) {
                                redisData.sessionRecord = ['BOP', texts[3]]
                                resultText = redisData.sessionRecord.join(',')
                            } else {
                                err = new Error('E002:非主要記錄段落啟動關鍵字(Missing/Implant/Crown/Pontic/Recession/PD/Mobility/Furcation/Plaque/BOP)')
                            }
                        } else {
                            if (_.includes(['buccal', 'palatal', 'lingual'], texts[1])) {
                                if (texts[0] === 'bop') {
                                    texts[0] = 'BOP'
                                }
                                if (texts[0] === 'pd') {
                                    texts[0] = 'PD'
                                }
                                redisData.sessionRecord = texts
                                resultText = texts.join(',')
                            } else {
                                err = new Error('E002:非主要記錄段落啟動關鍵字(Missing/Implant/Crown/Pontic/Recession/PD/Mobility/Furcation/Plaque/BOP)')
                            }
                        }
                        redisData.sessionTeeths = []
                        break
                    case 'mobility':
                        redisData.sessionType = 'MF'
                        redisData.sessionRecord = ['Mobility']
                        resultText = 'Mobility'
                        break
                    case 'furcation':
                        redisData.sessionType = 'MF'
                        redisData.sessionRecord = [texts[0]]
                        resultText = texts[0]
                        break
                    case 'finish':
                        redisData.active = false
                        resultText = 'finish'
                        break
                    default:
                        resultText = 'E002:非主要記錄段落啟動關鍵字(Missing/Implant/Crown/Pontic/Recession/PD/Mobility/Furcation/Plaque/BOP)'
                        switch (redisData.sessionType) {
                            case 'RP':
                                [err, result] = await to(handleRP(texts, redisData))
                                if (result) {
                                    resultText = result.text
                                    if (result.redis.sessionRecord) {
                                        redisData.sessionRecord.push(result.redis.sessionRecord)
                                    }
                                    if (result.redis.sessionTeeths) {
                                        redisData.sessionTeeths = result.redis.sessionTeeths
                                        let sessionTeeths = redisData.sessionTeeths
                                        for (let teeth of sessionTeeths) {
                                            if (teeth.length >= 3) {
                                                resultText = redisData.sessionRecord.join(',') + ',' + teeth.join(' ')
                                                textArray.push(resultText)
                                                redisData.sessionTeeths = _.drop(redisData.sessionTeeths)
                                                let [nextErr, next] = await to(nextTeeth(redisData))
                                                if (nextErr) {
                                                    return Promise.reject(nextErr)
                                                }
                                                if (!next) {
                                                    redisData.sessionType = ''
                                                    redisData.sessionRecord = []
                                                    redisData.sessionTeeths = []
                                                } else {
                                                    redisData.sessionRecord[2] = next
                                                }
                                            }
                                        }
                                    }
                                }
                                break
                            case 'MF':
                                [err, result] = await to(handleMF(texts, redisData))
                                if (result) {
                                    resultText = result.redis.sessionRecord.join(',')
                                    redisData.sessionRecord = [result.redis.sessionRecord[0]]
                                    // redisData.sessionType = ''
                                    // redisData.sessionRecord = []
                                }
                                break
                        }

                        break
                }
            }

            if (err) {
                return Promise.reject(err)
            }
        } else {
            // return Promise.reject(new Error('no text'))
            if (redisData.active) {
                resultText = ''
            }
        }
    }
    return Promise.resolve({
        redis: redisData,
        text: {text: resultText},
        textArray,
    })
}


export default handleKankoneJson