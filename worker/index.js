const keys = require('./keys')

const redis = require('redis')
const redisClient = redis.createClient({
    url: `${keys.redisProtocal}://${keys.redisHost}:${keys.redisPort}`,
    retry_strategy: () => 1000,
});
const sub = redisClient.duplicate()

const run = async (connection)=>{
    console.log("icinde")
    await connection.connect()
}

run(redisClient)
run(sub)
redisClient.on('error', err => console.log('Redis Client Error', err));



function fib(index){
    if(index < 2) return 1
    return fib(index-1) + fib(index-2);
}

sub.on('message', (channel, message)=>{
    console.log("message", message)
    redisClient.hSet('values', message, fib(parseInt(message)))
})

sub.subscribe('insert', (message)=>{
    redisClient.hSet('values', message, fib(parseInt(message)))
})