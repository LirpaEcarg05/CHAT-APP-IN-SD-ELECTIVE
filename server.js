const fs = require('fs');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require("socket.io")(http);
// Route to/default www static folder
app.use('/', express.static(__dirname + '/src'));

// Background interface, read local image resources
let portrait = fs.readdirSync('./src/static/portrait')
let emoji = fs.readdirSync('./src/static/emoticon/emoji')
let emot = fs.readdirSync('./src/static/emoticon/emot')
app.get('*', (req, res) => {
    const assetsType = req.url.split('/')[1];
    if (assetsType === 'loadImg') {
        res.send({
            code: 0,
            data: {
                portrait,
                emoji,
                emot
            },
            msg: 'Successful operation'
        })
    }
})

let userList = [];
let chatGroupList = {};
io.on('connection', (socket) => {
	// The front-end calls the sending message interface, and the back-end receives and broadcasts
	socket.on('login', (userInfo) => {
        userList.push(userInfo);
        io.emit('userList', userList);
        // socket.emit(Send a message to the client of the socket) + socket.broadcast.emit(Send to all clients, not innot icluding yourself)  = io.emit(Broadcast messages to all clients)
	})

    socket.on('sendMsg', (data) => {
        socket.to(data.id).emit('receiveMsg', data)
	})

    socket.on('sendMsgGroup', (data) => {
        socket.to(data.roomId).emit('receiveMsgGroup', data);
    })

    // Create group chat
    socket.on('createChatGroup', data => {
        socket.join(data.roomId);

        chatGroupList[data.roomId] = data;
        data.member.forEach(item => {
            io.to(item.id).emit('chatGroupList', data)
            io.to(item.id).emit('createChatGroup', data)
            // socket.to I did not receive
            // io.to Everyone received
        });
    })

    // Join group chat
    socket.on('joinChatGroup', data => {
        socket.join(data.info.roomId);
        io.to(data.info.roomId).emit('chatGrSystemNotice', {
            roomId: data.info.roomId,
            msg: data.userName+'Joined the group chat!',
            system: true
        });//Send messages for all sockets in the room, Including myself
    })

    socket.on('leave', data => {
        socket.leave(data.roomId, () => {
            let member = chatGroupList[data.roomId].member;
            let i = -1;
            member.forEach((item, index) => {
                if (item.id === socket.id) {
                    i = index;
                }
                io.to(item.id).emit('leaveChatGroup', {
                    id: socket.id, // Quit the group chatid
                    roomId: data.roomId,
                    msg: data.userName+'Left the group chat!',
                    system: true
                })
            });
            if (i !== -1) {
                member.splice(i)
            }
        });
    })

    // drop out（Built-in event）
    socket.on('disconnect', () => {
        chatGroupList = {};
        userList = userList.filter(item => item.id != socket.id)
        io.emit('quit', socket.id)
    })
})

http.listen(3001, () => {
	console.log('http://localhost:3001/index.html')
});
