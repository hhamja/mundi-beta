let player;
let captions = [
  { start: 0, end: 2, text: "Welcome to the video!" },
  { start: 2, end: 6, text: "This is an example caption." },
  { start: 6, end: 10, text: "Captions appear at the bottom." },
  { start: 10, end: 14, text: "They sync with the video." },
];

let currentCaptionIndex = -1; // 처음에 -1로 설정하여 처음 자막이 표시되지 않도록 함
let intervalId;

// SRT 파일을 로드하여 파싱합니다.
fetch("./files/output_ko.srt")
  .then((response) => response.text())
  .then((data) => {
    captions = parseSRT(data);
    onYouTubeIframeAPIReady(); // YouTube API 준비 후 자막 동기화 시작
  })
  .catch((error) => console.error("Error loading SRT file:", error));

// SRT 파일 파싱 함수
function parseSRT(srtContent) {
  const captions = [];
  const srtArray = srtContent.split("\n\n");

  srtArray.forEach((entry) => {
    const lines = entry.split("\n");
    if (lines.length >= 3) {
      const times = lines[1].split(" --> ");
      const start = parseTime(times[0]);
      const end = parseTime(times[1]);
      const text = lines.slice(2).join("\n");
      captions.push({ start, end, text });
    }
  });

  return captions;
}

function parseTime(timeString) {
  const [hours, minutes, seconds] = timeString.split(":");
  const [secs, millis] = seconds.split(",");
  return (
    parseInt(hours) * 3600 +
    parseInt(minutes) * 60 +
    parseInt(secs) +
    parseInt(millis) / 1000
  );
}

function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
    },
  });
}

function onPlayerReady(event) {
  console.log("Player is ready!");
  updateCaptions();
}

function onPlayerStateChange(event) {
  if (event.data == YT.PlayerState.PLAYING) {
    updateCaptions();
  } else if (
    event.data == YT.PlayerState.PAUSED ||
    event.data == YT.PlayerState.ENDED
  ) {
    clearInterval(intervalId);

    if (event.data == YT.PlayerState.ENDED) {
      document.getElementById("caption").innerText = ""; // 동영상이 끝나면 자막 초기화
      currentCaptionIndex = -1; // 자막 인덱스 초기화
    }
  }
}

function updateCaptions() {
  clearInterval(intervalId); // 기존 인터벌을 초기화하여 중복 실행 방지
  intervalId = setInterval(() => {
    const currentTime = player.getCurrentTime();

    let foundCaption = false;
    for (let i = 0; i < captions.length; i++) {
      if (currentTime >= captions[i].start && currentTime <= captions[i].end) {
        if (currentCaptionIndex !== i) {
          currentCaptionIndex = i;
          document.getElementById("caption").innerText = captions[i].text;
        }
        foundCaption = true;
        break;
      }
    }

    // 자막이 없는 경우 자막 창을 비우거나 다른 동작을 수행
    if (!foundCaption) {
      document.getElementById("caption").innerText = "";
      currentCaptionIndex = -1; // 자막이 없을 때 인덱스를 초기화
    }
  }, 100); // 0.1초마다 확인 (더 짧은 간격으로 동기화 정확도 향상)
}
