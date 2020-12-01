const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const myPeer = new Peer(undefined, {
  host: '/',
  port: '443',
  path: '/peerjs'
})
let myVideoStream;
let videoStreamArray;
let isSharing;
let webcamsRemovedBySharing = [];
let myName = 'user';
const myVideo = document.createElement('video')
myVideo.muted = true;
const peers = {}
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  myVideoStream = stream;
  addVideoStream(myVideo, stream)
  myPeer.on('call', call => {
    call.answer(stream)
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream)
    })
  })

  socket.on('user-connected', userId => {
    connectToNewUser(userId, stream)
  })
  // input value
  let text = $("input");
  // when press enter send message
  $('html').keydown(function (e) {
    if (e.which == 13 && text.val().length !== 0) {
      socket.emit('message', text.val());
      text.val('')
    }
  });
  socket.on("createMessage", message => {
    $("ul").append(`<li class="message"><b>${myName}</b><br/>${message}</li>`);
    scrollToBottom()
  })
  
})

socket.on('screen-share', stream => {
  console.log('Somebody is sharing the screen');
})

socket.on('stop-screen-share', stream => {
  console.log('Somebody has stopped sharing');
})

socket.on('user-disconnected', userId => {
  console.log(userId);
  if (peers[userId]) {
    peers[userId].close();
  }
})

myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id)
})

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream)
  const video = document.createElement('video')
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream)
  })
  call.on('close', () => {
    video.remove()
  })

  peers[userId] = call
}

function addVideoStream(video, stream) {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  videoGrid.append(video)
}



const scrollToBottom = () => {
  var d = $('.main__chat_window');
  d.scrollTop(d.prop("scrollHeight"));
}


const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
}

const playStop = () => {
  console.log('object')
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo()
  } else {
    setStopVideo()
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
}

const shareScreen = () => {
  console.log("Sharing the screen");
  let shareBtn = document.querySelector('.fa-angle-up');

  if(shareBtn) {
    startSharing();
  } else {
    stopSharing();
  }
}

const startSharing = () => {
  isSharing = true;
    let webcams = videoGrid.getElementsByTagName('video')

    for(let i = 0; i < webcams.length; i++) {
      webcamsRemovedBySharing.push(webcams[i].srcObject);  
    }

    videoGrid.innerHTML = '';

    navigator.mediaDevices.getDisplayMedia({cursor: true}).then(stream => {
      video = document.createElement('video');
      video.classList.add('sharing');
      addVideoStream(video, stream);
      console.log('emitting..')
      socket.emit('share', stream);
    })
    setStopSharing();
}

const stopSharing = () => {
  isSharing = false;
    let sharingBlockObject = videoGrid.getElementsByTagName('video')[0].srcObject;
    sharingBlockObject.getTracks()[0].stop();
    videoGrid.innerHTML = '';
    webcamsRemovedBySharing.forEach(videoStream => {
      let video = document.createElement('video');
      addVideoStream(video, videoStream);
      socket.emit('stop-share', videoStream);
    });
    webcamsRemovedBySharing = [];
    setStartSharing();
}

const handleChat = () => {
  console.log('Hiding the chat panel')
  let chatDisplay = document.querySelector('.main__right').style.display;

  if(chatDisplay === '' || chatDisplay === 'flex') {
    document.querySelector('.main__right').style.display = 'none';
  } else {
    document.querySelector('.main__right').style.display = 'flex';
  }
}

const leaveMeeting = () => {
  socket.disconnect();
  socket.emit('user-disconnected');
  setEmptyPage();
}

const setStopSharing = () => {
  const html = `
  <i class="fas fa-ban"></i>
  <span>Stop sharing</span>
  `

  document.querySelector('.main__share_button').innerHTML = html;
}

const setStartSharing = () => {
  const html = `
  <i class="fas fa-angle-up"></i>
  <span>Share</span>
  `

  document.querySelector('.main__share_button').innerHTML = html;
}

const setEmptyPage = () => {
  const html = `
    <div class="leave-text">You left the meeting!</div>
  `

  document.querySelector('.main').innerHTML = html;
}

const setMuteButton = () => {
  const html = `
    <i class="fas fa-microphone"></i>
    <span>Mute</span>
  `
  document.querySelector('.main__mute_button').innerHTML = html;
}

const setUnmuteButton = () => {
  const html = `
    <i class="unmute fas fa-microphone-slash"></i>
    <span>Unmute</span>
  `
  document.querySelector('.main__mute_button').innerHTML = html;
}

const setStopVideo = () => {
  const html = `
    <i class="fas fa-video"></i>
    <span>Stop Video</span>
  `
  document.querySelector('.main__video_button').innerHTML = html;
}

const setPlayVideo = () => {
  const html = `
  <i class="stop fas fa-video-slash"></i>
    <span>Play Video</span>
  `
  document.querySelector('.main__video_button').innerHTML = html;
}
