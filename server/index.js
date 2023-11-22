const keys = require('./keys')

const express = require('express')
const cors = require('cors')

const app = express()
app.use(express.json())
app.use(cors())

const {Pool} = require('pg')
const pgClient = new Pool({
    user: keys.pgUser,
    host: keys.pgHost,
    database: keys.pgDatabase,
    password: keys.pgPassword,
    port: keys.pgPort
})
// console.log(keys)

pgClient.on("connect", (client) => {
    client
      .query("CREATE TABLE IF NOT EXISTS values (number INT)")
      .catch((err) => console.error(err));
  });

const redis = require('redis')
const redisClient = redis.createClient({
    url: `${keys.redisProtocal}://${keys.redisHost}:${keys.redisPort}`,
    retry_strategy: () => 1000,
});

const run = async (connection)=>{
    console.log("icinde")
    try {
        
        await connection.connect()
        console.log("Catyldy")
    } catch (error) {
        console.log("err", error)
    }
}

run(redisClient)
redisClient.on('error', err => console.log('Redis Client Error', err));

const redisPublisher = redisClient.duplicate()
run(redisPublisher)

app.get('/', (req,res)=>{
    res.send('Hi')
})

app.get('/values/all', async(req,res)=>{
    const values = await pgClient.query('select * from values')
    res.send(values.rows)
})

app.get("/values/current", async (req, res) => {
    console.log("values icinde")
    try {
        const values = await redisClient.hGetAll('values')
        console.log(values)
        res.send(values)
    } catch (error) {
        console.log(error)
        res.status(404).send(error)
    }

});
app.post('/values', async (req, res)=>{
    const index = req.body.index
    console.log(index)
    if(parseInt(index)>40){
        return res.status(422).send('Index too high')
    }

    try {
        await redisClient.hSet('values', index, 'Nothing yet!')

        await redisPublisher.publish('insert', index)
        // await redisClient.publish('insert', index)
    
        await pgClient.query('insert into values(number) values($1)', [index])
    
        res.send({working: true})     
    } catch (error) {
        console.log(error.name)
        console.log(error)
    }
   
})

app.listen(5000, err=>{
    console.log("Listening")
})