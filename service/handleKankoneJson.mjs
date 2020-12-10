import _ from 'lodash'
import {to} from 'await-to-js'
import {handleMICP, checkStart, handleRP, handleMF, nextTeeth} from './index.mjs'

const repeatTag = ['missing', 'implant', 'crown', 'pontic']

const handleKankoneJson = async (redisData, data, socketType = 1) => {
    let resultText = 'E001:尚未啟動 EVAS GO'
    let result = null
    let textArray = []
    let jsonRecord = null
    let tempJsonRecord = null
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
                            if (!_.includes(redisData.jsonRecord[texts[0]], result.number)) {
                                redisData.jsonRecord[texts[0]].push(result.number)
                            }
                        }
                        break
                    case 'recession':
                    case 'pd':
                    case 'probing':
                    case 'plaque':
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
                        } else if (texts[0] === 'plaque') {
                            if (_.includes(['buccal', 'palatal', 'lingual'], texts[1])) {
                                texts[0] = 'Plaque'
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
                        tempJsonRecord = redisData.jsonRecord
                        redisData = {
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
                                        if (redisData.sessionRecord.length === 3) {
                                            // 重新開始清暫存
                                            redisData.sessionRecord[2] = result.redis.sessionRecord
                                            redisData.sessionTeeths = []
                                            // jsonRecord需要清一排的暫存18->28, 48->38
                                            redisData = clearRPjson(redisData)
                                        } else {
                                            redisData.sessionRecord.push(result.redis.sessionRecord)
                                            // jsonRecord需要清一排的暫存18->28, 48->38
                                            redisData = clearRPjson(redisData)

                                        }
                                    }
                                    if (result.redis.sessionTeeths) {
                                        redisData.sessionTeeths = result.redis.sessionTeeths
                                        let sessionTeeths = redisData.sessionTeeths
                                        for (let teeth of sessionTeeths) {
                                            if (teeth.length >= 3) {
                                                resultText = redisData.sessionRecord.join(',') + ',' + teeth.join(' ')
                                                textArray.push(resultText)
                                                redisData.sessionTeeths = _.drop(redisData.sessionTeeths)

                                                // 另存jsonRecord的紀錄
                                                redisData.jsonRecord[redisData.sessionRecord[0]].push({
                                                    direction: redisData.sessionRecord[1],
                                                    tooth: redisData.sessionRecord[2],
                                                    value: teeth.join(' '),
                                                })

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
                                    // 回給regular的字串
                                    resultText = result.redis.sessionRecord.join(',')

                                    // picture的處理 sessionRecord = ['Mobility', '12', 'degree', '2']
                                    let sessionName = result.redis.sessionRecord[0] === 'Mobility' ? 'Mobility' : (result.redis.sessionRecord[0] === 'furcation' ? 'Furcation' : null)
                                    if (sessionName) {
                                        _.remove(redisData.jsonRecord[sessionName], function (obj) {
                                            return sessionName === 'Mobility' ? obj.tooth === result.redis.sessionRecord[1] : obj.tooth === result.redis.sessionRecord[1] && obj.direction === result.redis.sessionRecord[2]
                                        })
                                        let teeth = {
                                            tooth: result.redis.sessionRecord[1],
                                            degree: sessionName === 'Mobility' ? changeToMobilityNumber(result.redis.sessionRecord[3]) : result.redis.sessionRecord[3]
                                        }
                                        if (sessionName === 'Furcation') {
                                            teeth.direction = result.redis.sessionRecord[2]
                                        }
                                        redisData.jsonRecord[sessionName].push(teeth)
                                    }
                                    // 清理session record暫存，準備接受下一個Mobility/furcation指令
                                    redisData.sessionRecord = [result.redis.sessionRecord[0]]

                                    // redisData.sessionType = ''
                                    // redisData.sessionRecord = []
                                }
                                break
                        }

                        break
                }
            }

            if (err && socketType !== 2) {
                return Promise.reject(err)
            }
        } else {
            // return Promise.reject(new Error('no text'))
            if (redisData.active) {
                resultText = ''
            }
        }
    }
    jsonRecord = redisData.jsonRecord
    if (tempJsonRecord) {
        jsonRecord = tempJsonRecord
    }
    return Promise.resolve({
        redis: redisData,
        text: {text: resultText},
        textArray,
        jsonRecord
    })
}

const clearRPjson = (redisData) => {
    let clearTeeths = null
    if (_.includes(global.upTeeth, redisData.sessionRecord[2])) {
        clearTeeths = global.upTeeth
    } else {
        clearTeeths = global.downTeeth
    }
    _.remove(redisData.jsonRecord[redisData.sessionRecord[0]], function(obj) {
        return _.includes(clearTeeths, obj.tooth) && obj.direction === redisData.sessionRecord[1]
    })
    return redisData
}

const changeToMobilityNumber = (num) => {
    switch (num) {
        case "1":
            return "I"
        case "2":
            return "II"
        case "3":
            return "III"
    }
}


export default handleKankoneJson