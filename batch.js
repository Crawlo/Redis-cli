import Redis from './index'
import DataLoader from 'dataloader'
import TTLMap from '@oudyworks/ttlmap'

const batchs = new TTLMap()

class Batch {
    static hget(key, field, client = 'default') {
        const _key = ['hget', key, client].join(':')
        if (!batchs.get(_key))
            batchs.set(
                _key,
                new DataLoader(
                    keys => {
                        return new Promise(
                            resolve => {
                                Redis.getClient(client).hmget(
                                    key,
                                    keys,
                                    (error, values) => {
                                        resolve(values || [null])
                                    }
                                )
                            }
                        )
                    },
                    {
                        cache: false
                    }
                )
            )
        return batchs.get(_key).load(field)
    }
    static hset(key, field, value, client = 'default') {
        const _key = ['hset', key, client].join(':')
        if (!batchs.get(_key))
            batchs.set(
                _key,
                new DataLoader(
                    keys => {
                        let values = []
                        keys.forEach(
                            ([field, value]) => values.push(field, value)
                        )
                        return new Promise(
                            resolve => {
                                Redis.getClient(client).hmset(
                                    key,
                                    values,
                                    () =>
                                        resolve(keys)
                                )
                            }
                        )
                    },
                    {
                        cache: false
                    }
                )
            )
        return batchs.get(_key).load([field, value])
    }
    static sismember(key, value, client = 'default') {
        const _key = ['sismember', key, client].join(':')
        if (!batchs.get(_key))
            batchs.set(
                _key,
                new DataLoader(
                    keys => new Promise(
                        resolve => {
                            Redis.getClient(client).multi(
                                keys.map(
                                    value => [
                                        'sismember',
                                        key,
                                        value
                                    ]
                                )
                            ).exec(
                                (error, replies) =>
                                    resolve(replies)
                            )
                        }
                    ),
                    {
                        cache: false
                    }
                )
            )
        return batchs.get(_key).load(value)
    }
}

// commands without reply
[
    'hdel',
    'sadd',
    'srem',
    'lpush',
    'rpush'
].forEach(
    command => {
        Batch[command] = function (key, value, client = 'default') {

            const _key = [command, key, client].join(':')

            if (!batchs.get(_key))
                batchs.set(
                    _key,
                    new DataLoader(
                        keys =>
                            new Promise(
                                resolve => {
                                    Redis.getClient(client)[command](
                                        key,
                                        keys,
                                        () =>
                                            resolve(keys)
                                    )
                                }
                            ),
                        {
                            cache: false
                        }
                    )
                )

            return batchs.get(_key).load(value)

        }
    }
);

// commands gets with key and count
[
    'spop',
    'srandmember'
].forEach(
    command => {
        Batch[command] = function (key, client = 'default') {

            const _key = [command, key, client].join(':')

            if (!batchs.get(_key))
                batchs.set(
                    _key,
                    new DataLoader(
                        keys =>
                            new Promise(
                                resolve => {
                                    Redis.getClient(client)[command](
                                        key,
                                        keys.length,
                                        (error, values = []) =>
                                            resolve(new Array(keys.length).fill(null).map(
                                                (value, i) =>
                                                    values[i]
                                            ))
                                    )
                                }
                            ),
                        {
                            cache: false
                        }
                    )
                )

            return batchs.get(_key).load(true)

        }
    }
)

export default Batch