const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()

const dbPath = path.join(__dirname, 'userData.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body

  const hashedPassword = await bcrypt.hash(request.body.password, 10)
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    const createUserQuery = `
      INSERT INTO 
        user (username, name, password, gender, location) 
      VALUES 
        (
          '${username}', 
          '${name}',
          '${hashedPassword}', 
          '${gender}',
          '${location}'
        )`
    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const dbResponse = await db.run(createUserQuery)
      response.status(200)
      response.send(`User created successfully`)
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid User')
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatched === true) {
      response.status(200)
      response.send('Login Success!')
    } else {
      response.status(400)
      response.send('Invalid Password')
    }
  }
})

app.post('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const checkUserQuery = `select * from user where username='${username}';`
  const user = db.get(checkUserQuery)
  if (user === undefined) {
    response.status(400)
    response.send("User doesn't exist")
  } else {
    const isPasswordMatched = await bcrypt.compare(oldPassword, db.password)
    if (isPasswordMatched === false) {
      response.status(400)
      resposne.send('Invalid current password')
    } else if (newPassword.length < 5) {
      response.status(400)
      resposne.send('Password is too short')
    } else {
      const hashedPassword = await bcrypt.hash(request.body.newPassword, 10)
      const updateUserQuery = `update user set password='${hashedPassword}' WHERE username = '${username}'`
      await db.run(updateUserQuery)
      response.status(200)
      response.send('Password updated')
    }
  }
})
module.exports = app
