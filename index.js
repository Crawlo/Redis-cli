import redis from 'ioRedis'

let clients = {}

export default class Redis {
    /**
     * @param {array} options 
     * @param {string} name 
     */
    static configure(options, name = 'default') {
        return new Promise((resolve, reject) => {
            clients[name] = redis.Cluster(options)
            clients[name].on('connect', () => {
                console.log(`redis ${name} connected`)
                resolve(clients[name])
            })
            clients[name].on('error', error => {
                console.log(`redis ${name} error `, error)
                reject(error)
            })
        })
    }
    static get client() {
        return this.getClient()
    }
    static getClient(name = 'default') {
        return clients[name]
    }
}