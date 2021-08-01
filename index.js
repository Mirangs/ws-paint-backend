const fs = require('fs')
const path = require('path')
const express = require('express')
const cors = require('cors')
const app = express()
const WSServer = require('express-ws')(app)
const aWss = WSServer.getWss()

app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 5000

const broadcastConnection = (msg) => {
  aWss.clients.forEach((client) => {
    if (client.id === msg.id) {
      console.log(
        `Client with username ${msg.username} and id ${msg.id} connected to server`
      )
      client.send(`User ${msg.username} connected`)
    }
  })
}

const drawHandler = (msg) => {
  aWss.clients.forEach((client) => {
    if (client.id === msg.id) {
      client.send(JSON.stringify(msg))
    }
  })
}

const connectionHandler = (ws, msg) => {
  ws.id = msg.id
  broadcastConnection(msg)
}

app.ws('/', (ws, req) => {
  ws.on('message', (msg) => {
    msg = JSON.parse(msg)
    switch (msg.type) {
      case 'connection': {
        connectionHandler(ws, msg)
        break
      }
      case 'draw': {
        drawHandler(msg)
        break
      }
      default:
    }
  })
})

app.post('/image', (req, res) => {
  try {
    const data = req.body.img.replace('data:image/png;base64', '')
    fs.writeFileSync(
      path.resolve(__dirname, 'files', `${req.query.id}.jpg`),
      data,
      'base64'
    )
    return res.status(200).json({ message: 'ok' })
  } catch (err) {
    console.log(err)
    return res.status(500).json({ error: err })
  }
})
app.get('/image', (req, res) => {
  try {
    const file = fs.readFileSync(
      path.resolve(__dirname, 'files', `${req.query.id}.jpg`)
    )
    const data = `data:image/png;base64,${file.toString('base64')}`
    res.json(data)
  } catch (err) {
    console.log(err)
    return res.status(500).json({ error: err })
  }
})

app.listen(PORT, () => console.log(`Server started at ${PORT} port...`))
