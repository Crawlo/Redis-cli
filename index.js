const redis = require('ioredis')
const redisStandAlong = require('redis')
const bluebird = require('bluebird')

bluebird.promisifyAll(redis.Cluster.prototype)
bluebird.promisifyAll(redisStandAlong.RedisClient.prototype)
bluebird.promisifyAll(redisStandAlong.Multi.prototype)

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
            if(hosts.host){
                clients[name] = redisStandAlong.createClient(hosts)
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
                clients[name].quit();
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
