import redis from 'redis'
import { promisify } from 'util'
import { to } from 'await-to-js'
import logger from './logger.mjs'
import config from '../config/index.mjs'


let client = null
let getPromise = null
let setPromise = null

const redisClient = {
    Init: async () => {
        client = redis.createClient(config.redisHost)
        client.on('error', function(error) {
            logger.error(error.message)
        })
        getPromise = promisify(client.get).bind(client) // 因為redis.get沒有做promise, 所以先用promisify 把只有callback的get方法promise化
        setPromise = promisify(client.set).bind(client) // 因為redis.set沒有做promise, 所以先用promisify 把只有callback的set方法promise化
    },

    // getClient: () => {
    //     return client
    // },

    set: async (key, value) => {
        const [err] = await to(setPromise(key, value, 'EX', 30 * 60))
        if (err) {
            return Promise.reject(err)
        }
        return Promise.resolve()
    }
    ,

    get: async (key) => {
        const [err, data] = await to(getPromise(key))
        if (err) {
            return Promise.reject(err)
        }
        return Promise.resolve(data)
    }
}

export default redisClient

