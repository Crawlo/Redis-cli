const redis = require('ioredis')
const bluebird = require('bluebird')

bluebird.promisifyAll(redis.Cluster.prototype)
let clients = {}

module.exports = class Redis {
    /**
     * @param {array} hosts 
     * @param {string} name 
     * @param {object} redisOptions
     */
    static configure(hosts,redisOptions, name = 'default') {
        return new Promise((resolve, reject) => {

            // if you need to connect to a standalone instance
            if(hosts.length == 1){
                clients[name] = new redis(
                    hosts[0],
                    redisOptions
                )
            }else{
                clients[name] = new redis.Cluster(
                    hosts,
                    redisOptions
                )
            }
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
