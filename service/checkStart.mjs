

const checkStart = async (uncheck) => {
    let response = {
        active: 'ready',
        array: [],
    }

    if (uncheck.length >= 2) {
        for (let i = 0; i < uncheck.length; i++) {
            if (uncheck.slice(i, i + 2).join() === 'evas go') {
                response.active = 'start'
                response.array = uncheck.slice(i + 2, uncheck.length)
            }
        }
    }
    return Promise.resolve(response)
}

export default checkStart