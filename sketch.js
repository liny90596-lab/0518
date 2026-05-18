let video;
let handpose;
let hands = [];
let gameState = "START"; // START, PLAY, END
let userChoice = "等待出拳...";
let aiChoice = "";
let gameResult = "";
let scoreUser = 0;
let scoreAI = 0;

function setup() {
  // 建立全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  
  // 初始化視訊擷取
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide(); // 隱藏原本的 HTML video 標籤，我們要在畫布上自己畫

  // 初始化 ml5.js Handpose 手部偵測模型
  handpose = ml5.handPose(video, modelLoaded);
  handpose.detectStart(video, results => {
    hands = results;
  });
}

function modelLoaded() {
  console.log("手勢辨識模型已載入！");
}

function draw() {
  background('#e7c6ff'); // 設定畫布顏色為 e7c6ff
  
  if (gameState === "START") {
    drawStartScreen();
  } else if (gameState === "PLAY") {
    drawPlayScreen();
  } else if (gameState === "END") {
    drawEndScreen();
  }
}

// === 1. 開始畫面 ===
function drawStartScreen() {
  // 在開始畫面也顯示視訊預覽，讓玩家可以先調整位置
  drawVideoWindow();
  
  push();
  textAlign(CENTER, TOP);
  fill(80, 50, 120);
  textSize(max(24, width * 0.04)); // 標題大小隨視窗縮放
  text("剪刀石頭布 AI 大對決", width / 2, 30);

  textSize(18);
  text("請對準鏡頭，準備好後按「開始遊戲」", width / 2, 80);
  pop();
  
  drawButton(width / 2, height - 60, 200, 50, "開始遊戲", color(255), color(80, 50, 120));
}

// === 2. 遊戲畫面 ===
function drawPlayScreen() {
  // 計算視訊要在正中央顯示的寬高與位置 (全螢幕的 50%)
  drawVideoWindow();

  let vW = width * 0.5;
  let vH = height * 0.5;
  let vX = (width - vW) / 2;
  let vY = (height - vH) / 2;
  
  // 偵測並繪製手部骨架與判定手勢
  if (hands.length > 0) {
    let hand = hands[0];
    
    // 依據指定編號串接骨架線條
    drawSkeleton(hand, vX, vY, vW, vH);
    
    // 辨識手勢（大約每 10 幀判斷一次避免畫面閃爍）
    if (frameCount % 10 === 0) {
      userChoice = analyzeGesture(hand);
    }
  } else {
    userChoice = "等待出拳...";
  }
  
  // 顯示上方資訊與即時得分
  textAlign(CENTER, TOP);
  fill(80, 50, 120);
  textSize(28);
  text("你出的是：" + userChoice, width / 2, 40);
  
  textSize(22);
  text(`目前比分 - 你: ${scoreUser} 點 | AI: ${scoreAI} 點`, width / 2, 90);
  
  // 出拳確認與回報按鈕
  drawButton(width / 2, height - 80, 200, 50, "確認出拳對決", color(255), color(80, 50, 120));
}

// === 提取出來的視訊繪製功能 ===
function drawVideoWindow() {
  push();
  let vW = width * 0.5;
  let vH = height * 0.5;
  let vX = (width - vW) / 2;
  let vY = (height - vH) / 2;

  // 繪製視訊視窗裝飾
  rectMode(CORNER);
  noStroke();
  fill(80, 50, 120);
  rect(vX, vY - 30, vW, 30, 10, 10, 0, 0);
  fill(255);
  textSize(16);
  textAlign(LEFT, CENTER);
  text("  📸 鏡像視訊預覽", vX + 5, vY - 15);

  // 檢查視訊是否已載入，readyState >= 2 表示已有影像資料
  if (video.elt && video.elt.readyState >= 2) {
    translate(vX + vW, vY);
    scale(-1, 1);
    image(video, 0, 0, vW, vH);
  } else {
    // 載入中的提示
    rectMode(CORNER);
    fill(200);
    rect(vX, vY, vW, vH);
    fill(80);
    textAlign(CENTER, CENTER);
    text("正在啟動攝影機...", vX + vW/2, vY + vH/2);
  }

  stroke(80, 50, 120);
  strokeWeight(2);
  noFill();
  rectMode(CORNER);
  rect(vX, vY, vW, vH);
  pop();
}

// === 3. 結束畫面 ===
function drawEndScreen() {
  textAlign(CENTER, CENTER);
  fill(80, 50, 120);
  
  let resultEmoji = userChoice === aiChoice ? "😮" : (gameResult.includes("你贏") ? "🎉" : "🤖");
  textSize(56);
  text(`${gameResult} ${resultEmoji}`, width / 2, height / 2 - 120);
  
  textSize(26);
  text(`你出了: ${userChoice}  vs  AI 出了: ${aiChoice}`, width / 2, height / 2 - 40);
  
  textSize(32);
  text(`最終總比分 -> 你: ${scoreUser} | AI: ${scoreAI}`, width / 2, height / 2 + 30);
  
  drawButton(width / 2 - 120, height / 2 + 140, 180, 55, "再玩一次", color(255), color(80, 50, 120));
  drawButton(width / 2 + 120, height / 2 + 140, 180, 55, "返回首頁", color(240, 150, 150), color(255));
}

// === 輔助功能：通用按鈕繪製 ===
function drawButton(x, y, w, h, label, bgColor, txtColor) {
  push();
  rectMode(CENTER);
  noStroke();
  // 簡單的懸停效果
  if (mouseX > x - w/2 && mouseX < x + w/2 && mouseY > y - h/2 && mouseY < y + h/2) {
    fill(red(bgColor) * 0.9, green(bgColor) * 0.9, blue(bgColor) * 0.9);
    cursor(HAND);
  } else {
    fill(bgColor);
  }
  rect(x, y, w, h, 15);
  fill(txtColor);
  textSize(20);
  textAlign(CENTER, CENTER);
  text(label, x, y);
  pop();
}

// === 骨架繪製功能 ===
function drawSkeleton(hand, vX, vY, vW, vH) {
  stroke(255, 214, 165); // 骨架顏色
  strokeWeight(5);
  noFill();
  
  // 原本 Handpose 輸出的座標是基於 640x480 的視訊大小，
  // 我們需要將它對應（map）到網頁中央 50% 寬高的縮放畫布上。
  // 在 ml5 v1 中，座標存放在 keypoints 物件中
  let kp = hand.keypoints;
  
  // 依據指定規則串接五根手指的點 (0-4, 5-8, 9-12, 13-16, 17-20)
  drawSegment(kp, 0, 4, vX, vY, vW, vH);
  drawSegment(kp, 5, 8, vX, vY, vW, vH);
  drawSegment(kp, 9, 12, vX, vY, vW, vH);
  drawSegment(kp, 13, 16, vX, vY, vW, vH);
  drawSegment(kp, 17, 20, vX, vY, vW, vH);
  
  // 順便把手腕(0)與指根(5, 9, 13, 17)連起來，讓手掌更完整（可選）
  beginShape();
  let pts = [0, 5, 9, 13, 17, 0];
  for(let idx of pts) {
    let scrX = map(kp[idx].x, 0, video.width, vX + vW, vX); // 修正為鏡像座標對應
    let scrY = map(kp[idx].y, 0, video.height, vY, vY + vH);
    vertex(scrX, scrY);
  }
  endShape();

  // 繪製關節點
  noStroke();
  fill(255, 107, 107);
  for (let i = 0; i < kp.length; i++) {
    let scrX = map(kp[i].x, 0, video.width, vX + vW, vX); // 修正為鏡像座標對應
    let scrY = map(kp[i].y, 0, video.height, vY, vY + vH);
    ellipse(scrX, scrY, 10, 10);
  }
}

// 畫出單條指節串接線
function drawSegment(kp, start, end, vX, vY, vW, vH) {
  beginShape();
  for (let i = start; i <= end; i++) {
    let scrX = map(kp[i].x, 0, video.width, vX + vW, vX); // 修正為鏡像座標對應
    let scrY = map(kp[i].y, 0, video.height, vY, vY + vH);
    vertex(scrX, scrY);
  }
  endShape();
}

// === 剪刀石頭布 簡易手勢演算法 ===
function analyzeGesture(hand) {
  let lm = hand.keypoints;
  
  // 藉由判斷 20 個點中，手指尖端（8, 12, 16, 20）是否高於各自指根（6, 10, 14, 18）來得知手指是否伸直
  // 註：在螢幕座標中，Y軸越小代表位置越高
  let indexOpen = lm[8].y < lm[6].y;
  let middleOpen = lm[12].y < lm[10].y;
  let ringOpen = lm[16].y < lm[14].y;
  let pinkyOpen = lm[20].y < lm[18].y;
  
  // 統計伸直的手指數（不包含大拇指，簡化辨識）
  let openedFingers = 0;
  if (indexOpen) openedFingers++;
  if (middleOpen) openedFingers++;
  if (ringOpen) openedFingers++;
  if (pinkyOpen) openedFingers++;
  
  // 手勢判斷邏輯
  if (openedFingers >= 3) {
    return "布";
  } else if (indexOpen && middleOpen) {
    return "剪刀";
  } else {
    return "石頭";
  }
}

// === 電腦出拳與結果計算 ===
function runMatch() {
  if (userChoice === "等待出拳..." || userChoice === "未知手勢") {
    alert("請先在鏡頭前擺出正確的手勢（剪刀、石頭或布）！");
    return;
  }
  
  let options = ["剪刀", "石頭", "布"];
  aiChoice = random(options);
  
  if (userChoice === aiChoice) {
    gameResult = "平手！";
  } else if (
    (userChoice === "石頭" && aiChoice === "剪刀") ||
    (userChoice === "剪刀" && aiChoice === "布") ||
    (userChoice === "布" && aiChoice === "石頭")
  ) {
    gameResult = "你贏了！";
    scoreUser++;
  } else {
    gameResult = "AI 贏了！";
    scoreAI++;
  }
  
  gameState = "END";
}

// === 視窗點擊事件處理（控制畫面切換） ===
function mousePressed() {
  cursor(ARROW);
  if (gameState === "START") {
    // 點擊「開始遊戲」按鈕範圍
    if (mouseX > width / 2 - 100 && mouseX < width / 2 + 100 &&
        mouseY > height / 2 + 70 && mouseY < height / 2 + 130) {
      gameState = "PLAY";
    }
  } else if (gameState === "PLAY") {
    // 點擊「確認出拳對決」按鈕範圍
    if (mouseX > width / 2 - 100 && mouseX < width / 2 + 100 &&
        mouseY > height - 105 && mouseY < height - 55) {
      runMatch();
    }
  } else if (gameState === "END") {
    // 點擊「再玩一次」
    if (mouseX > width / 2 - 210 && mouseX < width / 2 - 30 &&
        mouseY > height / 2 + 112 && mouseY < height / 2 + 168) {
      gameState = "PLAY";
      userChoice = "等待出拳...";
    }
    // 點擊「返回首頁」清空得分
    if (mouseX > width / 2 + 30 && mouseX < width / 2 + 210 &&
        mouseY > height / 2 + 112 && mouseY < height / 2 + 168) {
      gameState = "START";
      scoreUser = 0;
      scoreAI = 0;
      userChoice = "等待出拳...";
    }
  }
}

// 支援視窗縮放自動調整畫布
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}