function Chat() {
    this.userName // Currently logged in user name;
    this.userImg; // profile picture
    this.id; // user socketId
    this.userList = []; // Friends List
    this.chatGroupList = []; // Group Chat List
    this.sendFriend = ''; // Users who are currently chatting with friendssocketId
    this.sendChatGroup = ''; // Of the current group chatroomId
    this.messageJson = {}; // Friends message list
    this.msgGroupJson = {}; // Group chat message list
    this.tag = 0; // 0 My friends panel  1 Group chat panel
}
Chat.prototype = {
    init() {
        this.userName = localStorage.getItem('userName');
        this.userImg = localStorage.getItem('userImg');
        this.selectClick();
        this.setAllPorarait();
        if (this.userName && this.userImg) {
            $("#login-wrap").style.display = 'none';
            this.login(this.userName, this.userImg);
        } else {
            $('.chat-btn').onclick = () => {
                let userName = $('.user-name').value;
                let userImg = $('.my-por').getAttribute('src');
                this.login(userName, userImg);
            }
        }
    },
    setAllPorarait() {
        $.ajax({
            type: 'get',
            url: '/loadImg',
            success: function (data) {
                let emoji = data.emoji;
                let portrait = data.portrait;
                let emot = data.emot;

                let str = '';
                portrait.forEach(item => {
                    str += `<img style="width: 60px;height: 60px;" src="static/portrait/${item}" />`
                });
                document.getElementById('portrait').innerHTML = str;

                str = '';
                emoji.forEach(item => {
                    str += `<img style="width: 30px;height: 30px;" src="static/emoticon/emoji/${item}" />`
                });
                $('.emoji').innerHTML = str;

                str = '';
                emot.forEach(item => {
                    str += `<img style="width: 70px;height: 70px;" src="static/emoticon/emot/${item}" />`
                });
                $('.emot').innerHTML = str;
            }
        })
    },
    selectClick() {
        $('.group-chat-wrap').style.display = 'none';
        $('.select').onclick = function (e) {
            $('.my-por').setAttribute('src', e.target.getAttribute('src'))
        }

        $('.inp').onkeydown = (e) => {
            // Carriage return event
            if (e.code === 'Enter') {
                e.preventDefault ? e.preventDefault() : e.returnValue = false
                this.sendMessage();
            }
        }

        $('.send-message').onclick = () => {
            this.sendMessage();
        }

        $('.send-message-group-chat').onclick = () => {
            this.sendMessageGroup();
        }
        $('.group-chat-inp').onkeydown = (e) => {
            // Carriage return event
            if (e.code === 'Enter') {
                e.preventDefault ? e.preventDefault() : e.returnValue = false
                this.sendMessageGroup();
            }
        }

        $('.emoji').onclick = (e) => {
            this.chooseEmoji(e);
        }

        $('.emot').onclick = (e) => {
            this.chooseEmot(e);
        }
    },
    login(userName, userImg) {
        if (userName && userImg) {
            // login
            this.initSocket(userName, userImg);
        }
    },
    initSocket(userName, userImg) {
        window.socket = io();
        window.socket.on('connect', () => {
            $("#login-wrap").style.display = 'none';
            $('.chat-panel').style.display = 'block';
            this.userName = userName;
            this.userImg = userImg;
            this.id =  window.socket.id;
            let userInfo = {
                id:  window.socket.id,
                userName: userName,
                userImg: userImg
            }
            localStorage.setItem('userName', userName);
            localStorage.setItem('userImg', userImg);
            window.socket.emit('login', userInfo);

            this.setMyInfo();
        })
        window.socket.on('userList', (userList) => {
            this.userList = userList;
            this.drawUserList();
        })

        window.socket.on('quit', (id) => {
            this.userList = this.userList.filter(item => item.id != id)
            this.drawUserList();
        })
        window.socket.on('receiveMsg', data => {
            this.setMessageJson(data);
            if (this.tag) {
                // Currently receiving a single chat message on the group chat panel
                $('.me-friend-tab').innerHTML = parseInt($('.me-friend-tab').innerHTML) + 1;
                $('.me-friend-tab').style.display = 'block';

                // The corresponding friend in the friend list prompts new messages
                $('.me_' + data.sendId).innerHTML = parseInt($('.me_' + data.sendId).innerHTML) + 1;
                $('.me_' + data.sendId).style.display = 'block';

            } else {
                if (data.sendId === this.sendFriend) {
                    this.drawMessageList();
                } else {
                    $('.me_' + data.sendId).innerHTML = parseInt($('.me_' + data.sendId).innerHTML) + 1;
                    $('.me_' + data.sendId).style.display = 'block';
                }
            }

        })

        window.socket.on('receiveMsgGroup', (data) => {
            // Currently in the group chat panel
            this.setMsgGroupJson(data);
            if (this.tag) {
                // Determine if the received is from the current group chat，Not just mark the red dot，Draw the chat content
                if (data.roomId === this.sendChatGroup) {
                    this.drawChatGroupMsgList();
                } else {
                    $('.me_' + data.roomId).innerHTML = parseInt($('.me_' + data.roomId).innerHTML) + 1;
                    $('.me_' + data.roomId).style.display = 'block';
                }
            } else {
                // Currently on the personal chat page，Group chat prompts new messages, and the corresponding group chat in the group chat list prompts new messages
                $('.me-group-chat-tab').innerHTML = parseInt($('.me-group-chat-tab').innerHTML) + 1;
                $('.me-group-chat-tab').style.display = 'block';

                $('.me_' + data.roomId).innerHTML = parseInt($('.me_' + data.roomId).innerHTML) + 1;
                $('.me_' + data.roomId).style.display = 'block';
            }
        })

        window.socket.on('chatGroupList', chatGroup => {
            this.chatGroupList.push(chatGroup);
            this.drawChatGroupList();
        })

        window.socket.on('createChatGroup', (data) => {
            socket.emit('joinChatGroup', {
                id: this.id,
                userName: this.userName,
                info: data
            })
        })
        window.socket.on('chatGrSystemNotice', data => {
            this.setMsgGroupJson(data);
            if (this.tag) {
                $('.me_' + data.roomId).innerHTML = parseInt($('.me_' + data.roomId).innerHTML) + 1;
                $('.me_' + data.roomId).style.display = 'block';
                this.drawChatGroupMsgList();
            } else {
                $('.me-group-chat-tab').innerHTML = parseInt($('.me-group-chat-tab').innerHTML) + 1;
                $('.me-group-chat-tab').style.display = 'block';

                $('.me_' + data.roomId).innerHTML = parseInt($('.me_' + data.roomId).innerHTML) + 1;
                $('.me_' + data.roomId).style.display = 'block';
            }
        })

        window.socket.on('leaveChatGroup', data => {
            // The current client exits the group chat
            if (data.id === this.id) {
                this.chatGroupList = this.chatGroupList.filter(item => item.roomId !== data.roomId)
                this.drawChatGroupList();
            } else {
                this.setMsgGroupJson(data);
                if (this.tag) {
                    $('.me_' + data.roomId).innerHTML = parseInt($('.me_' + data.roomId).innerHTML) + 1;
                    $('.me_' + data.roomId).style.display = 'block';
                    this.drawChatGroupMsgList();
                } else {
                    $('.me-group-chat-tab').innerHTML = parseInt($('.me-group-chat-tab').innerHTML) + 1;
                    $('.me-group-chat-tab').style.display = 'block';

                    $('.me_' + data.roomId).innerHTML = parseInt($('.me_' + data.roomId).innerHTML) + 1;
                    $('.me_' + data.roomId).style.display = 'block';
                }
            }
        })
    },
    setMessageJson(data) {
        if (this.messageJson[data.sendId]) {
            this.messageJson[data.sendId].push(data)
        } else {
            this.messageJson[data.sendId] = [data];
        }
    },
    setMsgGroupJson(data) {
        if (this.msgGroupJson[data.roomId]) {
            this.msgGroupJson[data.roomId].push(data)
        } else {
            this.msgGroupJson[data.roomId] = [data];
        }
    },
    setMyInfo() {
        $('.my-info').innerHTML = `<div class="user-item" style="border-bottom: 1px solid #eee;margin-bottom: 30px;">
                            <img src="${this.userImg}"  style="width: 60px;height: 60px;">
                            <span>${this.userName}</span>
                        </div>`;
    },
    drawUserList() {
        let str = '';
        this.userList.forEach(item => {
            if (item.id !== this.id) {
                str += `<div class="user-item friend-item" onclick="changeChat(this)">
                            <img src="${item.userImg}"  style="width: 60px;height: 60px;">
                            <span>${item.userName}${item.id}</span>
                            <input type="hidden" value="${item.id}">
                            <div class="circle me_${item.id}" style="display: none;">0</div>
                        </div>`;
            }
        })
        $('.friends-info').innerHTML = str;
    },
    drawChatGroupList() {
        if (this.chatGroupList.length > 0) {
            $('.now-select').style.display = 'none';
            $('.create-group').style.display = 'none';
            $('.select-chat-group').style.display = 'none';
            let str = '';
            this.chatGroupList.forEach(item => {
                str += `<div class="chat-group-item" onclick="changeChatGroup(this)" style="border-bottom: 1px solid #eee;margin-bottom: 30px;">
                            <span style="padding-left: 20px;">${item.chatGroupName}</span>
                            <input type="hidden" value="${item.roomId}">
                            <div class="circle me_${item.roomId}" style="display: none;">0</div>
                            <button onclick="exit('${item.roomId}')">Drop Out</button>
                        </div>`;
            });
            $('.chat-group-list').innerHTML = str;
        } else {
            $('.now-select').style.display = 'block';
            $('.create-group').style.display = 'block';
            $('.select-chat-group').style.display = 'block';
            $('.chat-group-list').innerHTML = '';
            $('.group-chat-default').style.display = 'block'
            $('.group-chat-group-box').style.display = 'none';
        }
    },
    drawMessageList() {
        let msg = '';
        if (!this.messageJson[this.sendFriend]) return;
        this.messageJson[this.sendFriend].forEach(item => {
            if (item.sendId === this.id) {
                msg += `<div class="msg-box right">
                            <div class="msg">${item.msg}</div>
                            <img src="${item.img}"  style="width: 60px;height: 60px;">
                        </div>`
            } else {
                msg += `<div class="msg-box left">
                            <img src="${item.img}"  style="width: 60px;height: 60px;">
                            <div class="msg">${item.msg}</div>
                        </div>`
            }
        })
        $('.message-box').innerHTML = msg;
        $('.message-box').scrollTop = $('.message-box').scrollHeight;
        $('.inp').innerHTML = '';
        $('.inp').focus();
    },
    drawChatGroupMsgList() {
        if (!this.msgGroupJson[this.sendChatGroup]) return;
        let msg = '';
        this.msgGroupJson[this.sendChatGroup].forEach(item => {
            if (item.system) {
                msg += `<span class="system">${item.msg}</span><br>`;
            }
            else if (item.sendId === this.id) {
                msg += `<div class="msg-box right">
                            <div class="msg">${item.msg}</div>
                            <img src="${item.img}"  style="width: 60px;height: 60px;">
                        </div>`
            } else {
                msg += `<div class="msg-box left">
                            <img src="${item.img}"  style="width: 60px;height: 60px;">
                            <div class="msg">${item.msg}</div>
                        </div>`
            }
        })
        $('.group-chat-box').innerHTML = msg;
        $('.group-chat-box').scrollTop = $('.group-chat-box').scrollHeight;
        $('.group-chat-inp').innerHTML = '';
        $('.group-chat-inp').focus();
    },
    sendMessage() {
        if (!this.sendFriend) {
            alert('请选择好友！');
        } else {
            let info = {
                sendId: this.id, // senderid
                id: this.sendFriend, // Recipientid
                userName: this.userName,
                img: this.userImg, // Sender avatar
                msg: $('.inp').innerHTML // Send Content
            }
            window.socket.emit('sendMsg', info)
            // Set chat message list data
            if (this.messageJson[this.sendFriend]) {
                this.messageJson[this.sendFriend].push(info)
            } else {
                this.messageJson[this.sendFriend] = [info];
            }
            // Page drawing chat message
            this.drawMessageList();
        }
    },
    sendMessageGroup() {
        let info = {
            roomId: this.sendChatGroup,
            sendId: this.id,
            userName: this.userName,
            img: this.userImg,
            msg: $('.group-chat-inp').innerHTML
        };
        window.socket.emit('sendMsgGroup', info)
        if (this.msgGroupJson[this.sendChatGroup]) {
            this.msgGroupJson[this.sendChatGroup].push(info)
        } else {
            this.msgGroupJson[this.sendChatGroup] = [info];
        }
        this.drawChatGroupMsgList();
    },
    changeChat(e) {
        $('.message-default').style.display = 'none';
        $('.message-wrapper').style.display = 'block';
        $('.friend').innerHTML = e.children[1].innerHTML;
        $('.inp').focus()

        if (e.children[2].value !== this.sendFriend){
            $('.message-box').innerHTML = '';
            $('.message-box').scrollTop = 0;
            this.sendFriend = e.children[2].value;

            this.drawMessageList();
            $('.me_' + this.sendFriend).innerHTML = 0;
            $('.me_' + this.sendFriend).style.display = 'none';
        }
    },
    changeChatGroup(e) {
        $('.group-chat-default').style.display = 'none';
        $('.group-chat-group-box').style.display = 'block';
        $('.chatGroupName').innerText = e.children[0].innerHTML;
        $('.group-chat-inp').focus()

        $('.group-chat-box').innerHTML = '';
        $('.group-chat-box').scrollTop = 0;
        this.sendChatGroup = e.children[1].value;

        this.drawChatGroupMsgList();

        $('.me_' + this.sendChatGroup).innerHTML = 0;
        $('.me_' + this.sendChatGroup).style.display = 'none';
    },
    chooseEmoji(e) {
        hiddenBox();
        let path = e.target.getAttribute('src');
        if (this.tag) {
            $('.group-chat-inp').innerHTML += `<img style="width: 24px;height: 24px;" src="${path}" />`;
        } else {
            $('.inp').innerHTML += `<img style="width: 24px;height: 24px;" src="${path}" />`;
        }
    },
    chooseEmot(e) {
        hiddenBox();
        let path = e.target.getAttribute('src');
        if (this.tag) {
            $('.group-chat-inp').innerHTML += `<img style="width: 70px;height: 70px;" src="${path}" />`;
            this.sendMessageGroup();
        } else {
            $('.inp').innerHTML += `<img style="width: 70px;height: 70px;" src="${path}" />`;
            this.sendMessage();
        }
    },
    exit(roomId) {
        window.socket.emit('leave', {
            roomId: roomId,
            id: this.id,
            userName: this.userName
        })
    }
}
function changeChat(e) {
    chat.changeChat(e)
}
function changeChatGroup(e) {
    chat.changeChatGroup(e)
}
function changeTab(cls, listCls, tag) {
    chat.tag = tag;
    if (tag) {
        $('.friends-info').style.display = 'none';
        $('.message-wrap').style.display = 'none';

        $('.group-chat-info').style.display = 'block';
        $('.group-chat-wrap').style.display = 'block';

        $('.me-group-chat-tab').innerHTML = 0;
        $('.me-group-chat-tab').style.display = 'none';

        $('.friend-tab').style.color = '#000';
        $('.group-chat-tab').style.color = '#308e56';
    } else {
        $('.friends-info').style.display = 'block';
        $('.message-wrap').style.display = 'block';

        $('.group-chat-info').style.display = 'none';
        $('.group-chat-wrap').style.display = 'none';

        $('.me-friend-tab').innerHTML = 0;
        $('.me-friend-tab').style.display = 'none';

        $('.group-chat-tab').style.color = '#000';
        $('.friend-tab').style.color = '#308e56';

    }
}
function showEmojiBox() {
    $('.emoji').style.display = 'block';
    $('.mask').style.display = 'block';
}
function showEmotBox() {
    $('.mask').style.display = 'block';
    $('.emot').style.display = 'block';
}
function hiddenBox() {
    $('.emoji').style.display = 'none';
    $('.emot').style.display = 'none';
    $('.mask').style.display = 'none';
}
function createChatGroup() {
    $('.create-group').style.display = 'block';
    let str = '';
    chat.userList.forEach(item => {
        if (item.id !== chat.id) {
            str += `<div class="user-item friend-item" onclick="selectChatGroup(this)">
                            <img src="${item.userImg}"  style="width: 60px;height: 60px;">
                            <span>${item.userName}</span>
                            <input type="hidden" value="${item.id}">
                            <div class="circle me_${item.id}" style="display: none;">0</div>
                        </div>`;
        }
    })
    $('.select-chat-group').style.display = 'block';
    $('.select-chat-group').innerHTML = str;
}
function selectChatGroup(e) {
    if (e.getAttribute('isSelect') === 'true') return;
    let img = e.children[0].getAttribute('src');
    let userName = e.children[1].innerHTML;
    let id = e.children[2].getAttribute('value');
    $('.now-select').innerHTML += `<div>${userName}</div>`
    $('.now-select').style.display = 'block'
    if (chat.chatGroupArr) {
        chat.chatGroupArr.push({
            img,
            id,
            userName
        })
    } else {
        chat.chatGroupArr = [{
            img,
            id,
            userName
        }]
    }
    e.setAttribute('isSelect', true)
}
function confirmChatGroup() {
    chat.chatGroupArr.push({
        img: chat.userImg,
        id: chat.id,
        userName: chat.userName
    })
    window.socket.emit('createChatGroup', {
        masterId: chat.id,
        masterName: chat.userName,
        roomId: 'room_' + chat.id + (Date.now()),
        chatGroupName: $('.chatGroupNameInput').value,
        member: chat.chatGroupArr
    })
    $('.now-select').innerHTML = '';
    $('.chatGroupNameInput').value = '';
    chat.chatGroupArr = [];
}
function exit(roomId) {
    chat.exit(roomId);
}
let chat = new Chat();
chat.init()
