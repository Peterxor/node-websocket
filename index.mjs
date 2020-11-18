import to from 'await-to-js'
import server from './lib/socketServer.mjs'
import logger from './lib/logger.mjs'

global.kankoneClient = {}
global.hisServer = {}
global.sessionType = ['evas go', 'missing', 'implant', 'crown', 'pontic', 'recession', 'PD', 'Probing', 'Mobility', 'furcation', 'plague', 'BOP', 'Bleeding', 'finish']
global.englishNumber = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen']
global.chineseNumber = ['一一', '一二', '一三', '一四', '一五', '一六', '一七', '一八', '二一', '二二', '二三', '二四', '二五', '二六', '二七', '二八',
    '三一', '三二', '三三', '三四', '三五', '三六', '三七', '三八', '四一', '四二', '四三', '四四', '四五', '四六', '四七', '四八']
global.upTeeth = ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28']
global.downTeeth = ['48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38']

server()
