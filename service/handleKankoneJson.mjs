import _ from 'lodash'
import logger from '../lib/logger.mjs'
import {to} from 'await-to-js'
import {handleMICP, checkStart} from './index.mjs'

const repeatTag = ['missing', 'implant', 'crown', 'pontic']

const handleKankoneJson = async (redisData, data) => {
    redisData.record.push(data)
    // console.log(data)

    let finalData = []

    //確認暫存的session
    if (redisData.session.type) {

    } else {
        // session為空值
        if (data.status === 'ok') {
            for await (let dataContent of data.data) {
                let finalText = ''
                let text = dataContent.text
                let textArray = text.split(' ')
                let putArray = []
                if (textArray.length > 0) {
                    if (redisData.info.active !== 'start') {
                        const [checkErr, response] = await to(checkStart(textArray))
                        if (checkErr) {
                            logger.error(`check evas go error: ${checkErr}`)
                            break
                        }
                        finalText = 'evas go'
                        redisData.info.active = response.active
                        putArray = response.array
                    }
                    if (redisData.info.active === 'start') {
                        const [handleErr, result] = await to(handleText(redisData.session, putArray))
                        redisData.session = result.session
                        finalText = finalText === 'evas go' ? finalText + ',' + result.text : result.text
                    }
                }
                dataContent.text = finalText
                finalData.push(dataContent)
            }
            data.data = finalData
        }
    }
    // console.log(data)
    // console.log(redisData.record[0].data)
    return Promise.resolve({
        redis: redisData,
        data,
    })
}

const handleTag = async (tag, array, tempText) => {
    let result = ''
    switch (tag) {
        case 'missing':
            let [err, text] = await to(handleMICP(array, tempText))
            if (err) {
                logger.error(err)
            }
            result = text
    }
    return Promise.resolve(result)
}

const handleText = async (session, slice) => {
    if (slice.length <= 0) {
        return Promise.resolve({
            session,
            text: ''
        })
    }
    let tag = session.type
    let finalArray = []
    let totalProgress = {
        missing: [],
        implant: [],
        crown: [],
        pontic: [],
        recession: [],
        PD: [],
        mobility: [],
        furcation: [],
        plague: [],
        BOP: [],
    }

    // 如果今天tag不再任何一個session
    if (tag === '' && !_.includes(global.sessionType, slice[0])) {
        //slice的第一個值必須是session指令
        return Promise.resolve({
            session: session,
            text: '',
        })
    } else if (tag === '') {
        tag = slice[0]
    }
    for await (let element of slice) {
        // 如果element是session指令
        if (_.includes(global.sessionType, element)) {
            let [err, result] = await to(handleTag(tag, totalProgress[tag], session.tempText))
            if (err) {
                logger.error(err)
                return Promise.reject(err)
            }
            tag = element
            session.tempText = ''
            totalProgress[tag] = []
            finalArray.push(result)
        }
        totalProgress[tag].push(element)
    }
    let [err, result] = await to(handleTag(tag, totalProgress[tag], session.tempText))
    if (err) {
        logger.error(err)
        return Promise.reject(err)
    }
    session.tempText = result
    finalArray.push(result)
    return Promise.resolve({
        session: session,
        text: finalArray.join(',')
    })
}


export default handleKankoneJson