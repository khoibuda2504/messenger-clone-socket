const mongoose = require("mongoose");
const User = require("./models/User")

require("dotenv").config()

mongoose.connect(
  process.env.MONGO_URL,
  { useNewUrlParser: true, useUnifiedTopology: true }
);

const io = require("socket.io")(8900, {
  cors: {
    origin: "http://localhost:3000",
  }
})

const getUsers = async () => await User.find()

const addUser = async (userId, socketId) => {
  const findedUser = await User.findOne({ userId })
  if (findedUser) return
  const newUser = new User({
    userId,
    socketId
  })
  await newUser.save()
  return await getUsers()
}

const removeUser = async (socketId) => {
  await User.deleteOne({
    socketId
  })
  return await getUsers()
}

const getUser = async (userId) => await User.findOne({ userId })

io.on('connection', (socket) => {
  // connected
  console.log('a user connected');
  socket.on('addUser', async (userId) => {
    const users = await addUser(userId, socket.id)
    io.emit("getUsers", users)
  })

  //send and get message
  socket.on("sendMessage", async (res) => {
    const user = await getUser(res.receiverId)
    if (!user?.socketId) return
    io.to(user.socketId).emit("getMessage", res)
  })

  // disconnect
  socket.on('disconnect', async () => {
    console.log('a user disconnected')
    const users = await removeUser(socket.id)
    io.emit("getUsers", users)
  })
})