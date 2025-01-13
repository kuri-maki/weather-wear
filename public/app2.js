// 天気予報機能
function getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(fetchWeather, handleError);
    } else {
      document.getElementById('weather-info').innerHTML = 'このブラウザでは位置情報が取得できません。';
    }
  }
  
  function fetchWeather(position) {
    const weatherKey = '96d2c5a2ba5ffee8d61888ded058ec9f';
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${weatherKey}&lang=ja&units=metric`;
  
    fetch(apiUrl)
      .then(response => response.json())
      .then(data => {
        if (data.cod !== 200) {
          document.getElementById('weather-info').innerHTML = '天気情報を取得できませんでした。';
          return;
        }
  
        const weather = data.weather[0].description;
        const temperature = data.main.temp;
        const humidity = data.main.humidity;
        const windSpeed = data.wind.speed;
        const city = data.name;
        const icon = data.weather[0].icon;
  
        // personalizedTemperatureを加算
        const personalizedTemp = getPersonalizedTemperature();
        const clothingindex = calculateNET(temperature, windSpeed, humidity) + personalizedTemp;
  
        // 服装を決定
        const clothingAdvice = getClothingAdvice(clothingindex);
  
        document.getElementById('weather-info').innerHTML = `
          <h2>${city}の天気</h2>
          <img src="https://openweathermap.org/img/wn/${icon}.png" alt="天気アイコン">
          <p><strong>天気:</strong> ${weather}</p>
          <p><strong>気温:</strong> ${temperature}°C</p>
          <p><strong>湿度:</strong> ${humidity}%</p>
          <p><strong>風速:</strong> ${windSpeed} m/s</p>
          <p><strong>服装指数:</strong> ${clothingindex.toFixed(2)}</p>
          <p><strong>服装アドバイス:</strong> ${clothingAdvice}</p>
        `;
      })
      .catch(error => {
        document.getElementById('weather-info').innerHTML = 'エラーが発生しました。';
      });
  }
  
  // NET計算関数
  function calculateNET(temperature, windSpeed, humidity) {
    const t = temperature; // 温度 (°C)
    const v = windSpeed;   // 風速 (m/s)
    const h = humidity;    // 湿度 (%)
  
    const term1 = 37 - t;
    const term2 = 0.68 - 0.0014 * h + (1 / (1.76 + 1.4 * Math.pow(v, 0.75)));
    const term3 = 0.29 * t * (1 - h / 100);
    const NET = 37 - (term1 / term2) - term3;
    return NET;
  }
  
  // ユーザーの個別体感温度を取得
  function getPersonalizedTemperature() {
    const user = auth.currentUser;
    if (!user) return 0;
  
    // Realtime Database から personalizedTemperature を取得
    const userRef = db.ref(`users/${user.uid}/personalizedTemperature`);
    let personalizedTemp = 0;
    userRef.once("value", snapshot => {
      personalizedTemp = snapshot.val() || 0;
    });
    return personalizedTemp;
  }
  
  // 服装アドバイスを取得
  function getClothingAdvice(clothingindex) {
    if (clothingindex <= -10) {
      return "非常に寒いです。ダウンジャケット、手袋、帽子などを着用してください。";
    } else if (clothingindex <= -8) {
      return "非常に寒いです。厚手のジャケットとニットを着用してください。";
    } else if (clothingindex <= -6) {
      return "寒いです。厚手のセーターとダウンジャケットをおすすめします。";
    } else if (clothingindex <= -4) {
      return "やや寒いです。フリースと暖かいコートが必要です。";
    } else if (clothingindex <= 0) {
      return "少し寒いです。セーターと軽めのコートを着ると良いでしょう。";
    } else if (clothingindex <= 5) {
      return "涼しいです。長袖のシャツやカーディガンで過ごせます。";
    } else if (clothingindex <= 10) {
      return "暖かいです。Tシャツや薄手のシャツが快適です。";
    } else if (clothingindex <= 15) {
      return "暑いです。軽装で過ごしましょう。";
    } else if (clothingindex > 15) {
      return "非常に暑いです。ショートパンツとTシャツが最適です。";
    }
  }
  
  // 位置情報取得エラー処理
  function handleError(error) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        document.getElementById('weather-info').innerHTML = '位置情報の取得が拒否されました。';
        break;
      case error.POSITION_UNAVAILABLE:
        document.getElementById('weather-info').innerHTML = '位置情報が利用できません。';
        break;
      case error.TIMEOUT:
        document.getElementById('weather-info').innerHTML = '位置情報の取得がタイムアウトしました。';
        break;
      case error.UNKNOWN_ERROR:
        document.getElementById('weather-info').innerHTML = '不明なエラーが発生しました。';
        break;
    }
  }
  
  // DOM 要素
  const loginButton = document.getElementById("login");
  const logoutButton = document.getElementById("logout");
  const feedbackSection = document.getElementById("feedback");
  const hotButton = document.getElementById("hot");
  const coldButton = document.getElementById("cold");
  const message = document.getElementById("message");
  
  // ログイン処理
  loginButton.addEventListener("click", async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      const result = await auth.signInWithPopup(provider);
      const user = result.user;
  
      // 初回ログイン時に Realtime Database にデータを作成
      const userRef = db.ref(`users/${user.uid}`);
      const snapshot = await userRef.get();
      if (!snapshot.exists()) {
        await userRef.set({
          email: user.email,
          displayName: user.displayName,
          personalizedTemperature: 0
        });
      }
  
      alert(`Welcome, ${user.displayName}!`);
      updateUI(user);
    } catch (error) {
      console.error("Login error:", error);
    }
  });
  
  // ログイン状態の監視
  auth.onAuthStateChanged((user) => {
    updateUI(user);
  });
  
  // ログアウト処理
  logoutButton.addEventListener("click", async () => {
    await auth.signOut();
    alert("Logged out!");
    updateUI(null);
  });
  
  // フィードバック処理
  hotButton.addEventListener("click", () => updateTemperature(0.5));
  coldButton.addEventListener("click", () => updateTemperature(-0.5));
  
  // 体感温度の更新
  async function updateTemperature(change) {
    const user = auth.currentUser;
    if (!user) return;
  
    const userRef = db.ref(`users/${user.uid}/personalizedTemperature`);
    userRef.transaction((currentTemp) => {
      const newTemp = (currentTemp || 0) + change;
      message.textContent = `Your personalized temperature is now: ${newTemp}`;
      return newTemp;
    });
  }
  
  // UI 更新
  function updateUI(user) {
    if (user) {
      loginButton.style.display = "none";
      logoutButton.style.display = "block";
      feedbackSection.style.display = "block";
  
      // 現在の personalizedTemperature を表示
      const userRef = db.ref(`users/${user.uid}/personalizedTemperature`);
      userRef.on("value", (snapshot) => {
        const temp = snapshot.val() || 0;
        message.textContent = `Your personalized temperature is now: ${temp}`;
      });
    } else {
      loginButton.style.display
    };
}  