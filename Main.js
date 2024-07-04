window.dataLayer = window.dataLayer || [];
function gtag() {
dataLayer.push(arguments);
}

gtag('js', new Date());
gtag('config', 'G-19JL5PQZ6V');
    
document.addEventListener('DOMContentLoaded', () => {
const musicInput = document.getElementById('musicInput');
  const musicList = document.getElementById('musicList');
let db;
  
musicInput.addEventListener('change', () => {
   const files = musicInput.files;
      for (const file of files) {
         addMusicToList(file);
                }
            });
 
function addMusicToList(file) {
  const audio = document.createElement('audio');
  audio.controls = true;
  audio.src = URL.createObjectURL(file);
const listItem = document.createElement('div');
listItem.classList.add('song-item');
 const fileName = document.createElement('span');
 fileName.textContent = file.name;
listItem.appendChild(audio);
listItem.appendChild(fileName);
  musicList.appendChild(listItem);
}
  
const musicListDB = document.getElementById('musicList');
  const addMusicBtnDB = document.getElementById('addMusicBtn');
const fileInputDB = document.getElementById('musicInput');
const coverCanvasDB = document.getElementById('cover-canvas');
const ctxDB = coverCanvasDB.getContext('2d');
const storedCoverURL = localStorage.getItem('albumCover');
if (storedCoverURL) {
    const img = new Image();
      img.onload = function() {
    ctxDB.drawImage(img, 0, 0, coverCanvasDB.width, coverCanvasDB.height);
      }.img.src = storedCoverURL;
}
 addMusicBtnDB.addEventListener('click', () => {
 const file = fileInputDB.files[0];
       if (!file) {
         alert('Por favor, selecione uma música.');
            return;
    }
                const songName = file.name.split('.').slice(0, -1).join('.');
                const reader = new FileReader();
                reader.onload = () => {
                    const arrayBuffer = reader.result;
                    const dataView = new DataView(arrayBuffer);
                    let offset = 0;
                    let found = false;
                    let isJPEG = false;
                    while (offset < dataView.byteLength - 10) {
                        const marker = dataView.getUint32(offset);
                        isJPEG = (marker & 0xFFFFFF00) === 0xFFD8FF00 && ((marker & 0xFF) === 0xDB || (marker & 0xFF) === 0xE0 || (marker & 0xFF) === 0xE1);
                        const isPNG = marker === 0x89504E47;
                        if (isJPEG || isPNG) {
                            found = true;
                            break;
                        }
                        offset++;
                    }
                    if (found) {
                        const blob = new Blob([arrayBuffer.slice(offset)], {
                            type: isJPEG ? 'image/jpeg' : 'image/png'
                        });
                        const imageURL = URL.createObjectURL(blob);
                        localStorage.setItem('albumCover', imageURL);
                        ctxDB.clearRect(0, 0, coverCanvasDB.width, coverCanvasDB.height);
                        const img = new Image();
                        img.onload = function() {
                            ctxDB.drawImage(img, 0, 0, coverCanvasDB.width, coverCanvasDB.height);
                        };
                        img.src = imageURL;
                        const transaction = db.transaction(['songs'], 'readwrite');
                        const objectStore = transaction.objectStore('songs');
                        const request = objectStore.add({
                            name: songName,
                            cover: imageURL,
                            file: file
                        });
                        request.onsuccess = function() {
                            displayData();
                        };
                        request.onerror = function() {
                            console.log('Erro ao adicionar música.');
                        };
                    }
                };
                reader.readAsArrayBuffer(file);
            });
            const request = window.indexedDB.open('music_player', 1);
            request.onerror = function() {
                console.log('Erro ao abrir o banco de dados.');
            };
            request.onsuccess = function() {
                db = request.result;
                displayData();
            };
            request.onupgradeneeded = function(e) {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('songs')) {
                    const objectStore = db.createObjectStore('songs', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    objectStore.createIndex('name', 'name', {
                        unique: false
                    });
                    objectStore.createIndex('cover', 'cover', {
                        unique: false
                    });
                }
            };
 
            function displayData() {
                while (musicListDB.firstChild) {
                    musicListDB.removeChild(musicListDB.firstChild);
                }
                const objectStore = db.transaction('songs').objectStore('songs');
                objectStore.openCursor().onsuccess = function(e) {
                    const cursor = e.target.result;
                    if (cursor) {
                        const songItem = document.createElement('div');
                        songItem.classList.add('song-item');
                        const img = document.createElement('img');
                        img.src = cursor.value.cover;
                        img.alt = cursor.value.name;
                        const p = document.createElement('p');
                        p.textContent = cursor.value.name;
                        const playButton = document.createElement('button');
                        playButton.textContent = 'Play';
                        playButton.onclick = function(file) {
                            let audioPlayer = document.getElementById('audioPlayer');
                            return function() {
                                if (audioPlayer.src !== URL.createObjectURL(file)) {
                                    audioPlayer.src = URL.createObjectURL(file);
                                    audioPlayer.play();
                                } else {
                                    if (audioPlayer.paused) {
                                        audioPlayer.play();
                                    } else {
                                        audioPlayer.pause();
                                    }
                                }
                            };
                        }(cursor.value.file);
                        songItem.appendChild(img);
                        songItem.appendChild(p);
                        songItem.appendChild(playButton);
                        musicListDB.appendChild(songItem);
                        cursor.continue();
                    }
                };
            }
        }); 
