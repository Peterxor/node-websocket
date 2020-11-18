import _ from 'lodash'
const nextTeeth = async (redisData) => {
    let result = null
    if (!redisData.sessionRecord[2]) {
        return Promise.reject(new Error('teeth is not start'))
    }
    for (let index in global.upTeeth) {
        if (global.upTeeth.hasOwnProperty(index)) {
            if (redisData.sessionRecord[2] === global.upTeeth[index]) {
                if (global.upTeeth[index * 1 + 1]) {
                    if (!_.includes(redisData.micp, global.upTeeth[index * 1 + 1])) {
                        result = global.upTeeth[index * 1 + 1]
                        break
                    } else {
                        redisData.sessionRecord[2] = global.upTeeth[index * 1 + 1]
                    }
                }
            }
        }
    }
    for (let index in global.downTeeth) {
        if (global.downTeeth.hasOwnProperty(index)) {
            if (redisData.sessionRecord[2] === global.downTeeth[index]) {
                if (global.downTeeth[index * 1 + 1]) {
                    if (!_.includes(redisData.micp, global.downTeeth[index * 1 + 1])) {
                        result = global.downTeeth[index * 1 + 1]
                        break
                    } else {
                        redisData.sessionRecord[2] = global.downTeeth[index * 1 + 1]
                    }
                }
            }
        }
    }
    // for (let index in global.downTeeth) {
    //     if (global.downTeeth.hasOwnProperty(index)) {
    //         if (redisData.sessionRecord[2] === global.downTeeth[index]) {
    //             if (global.downTeeth[index * 1 + 1]) {
    //                 if (_.includes(redisData.micp, global.downTeeth[index * 1 + 1])) {
    //                     continue
    //                 }
    //                 result = global.downTeeth[index * 1 + 1]
    //                 break
    //             }
    //         }
    //     }
    // }
    return Promise.resolve(result)
}

export default nextTeeth