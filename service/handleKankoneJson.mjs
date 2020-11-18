import _ from 'lodash'
import {to} from 'await-to-js'
import {handleMICP, checkStart, handleRP, handleMF, nextTeeth} from './index.mjs'

const repeatTag = ['missing', 'implant', 'crown', 'pontic']

const handleKankoneJson = async (redisData, data) => {
    let resultText = 'still not begin, please say evas go to start'
    let result = null
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
                    case 'PD':
                    case 'Probing':
                    case 'plague':
                    case 'BOP':
                    case 'Bleeding':
                        redisData.sessionType = 'RP'
                        if (texts[0] === 'Probing') {
                            redisData.sessionRecord = ['PD', texts[2]]
                            resultText = redisData.sessionRecord.join(',')
                        } else if (texts[0] === 'plague') {
                            texts[0] = 'Plague'
                            redisData.sessionRecord = texts
                            resultText = texts.join(',')
                        } else if (texts[0] === 'Bleeding') {
                            redisData.sessionRecord = ['BOP', texts[3]]
                            resultText = redisData.sessionRecord.join(',')
                        } else {
                            redisData.sessionRecord = texts
                            resultText = texts.join(',')
                        }
                        redisData.sessionTeeths = []
                        break
                    case 'Mobility':
                    case 'furcation':
                        redisData.sessionType = 'MF'
                        redisData.sessionRecord.push(texts[0])
                        resultText = texts[0]
                        break
                    case 'finish':
                        redisData.active = false
                        break
                    default:
                        resultText = 'it cant be identified'
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
                                        if (redisData.sessionTeeths.length >= 3) {
                                            resultText = redisData.sessionRecord.join(',') + ',' + redisData.sessionTeeths.join(' ')
                                            let [nextErr, next] = await to(nextTeeth(redisData))
                                            if (nextErr) {
                                                return Promise.reject(nextErr)
                                            }
                                            redisData.sessionRecord[2] = next
                                            redisData.sessionTeeths = []
                                            if (!next) {
                                                redisData.sessionType = ''
                                                redisData.sessionRecord = []
                                                redisData.sessionTeeths = []
                                            }
                                        } else {
                                            resultText = ''
                                        }
                                    }

                                }
                                break
                            case 'MF':
                                [err, result] = await to(handleMF(texts, redisData))
                                if (result) {
                                    resultText = result.redis.sessionRecord.join(',')
                                    redisData.sessionType = ''
                                    redisData.sessionRecord = []
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
            return Promise.reject(new Error('no text'))
        }
    }
    return Promise.resolve({
        redis: redisData,
        text: {text: resultText},
    })
}


export default handleKankoneJson