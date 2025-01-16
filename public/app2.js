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
    const fapiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${weatherKey}&lang=ja`;
    
    Promise.all([fetch(apiUrl), fetch(fapiUrl)])
    .then(responses => Promise.all(responses.map(response => response.json())))
    .then(data => {
      const weatherData = data[0]; // 現在の天気データ
      const forecastData = data[1]; // 予報データ

      // 現在の天気データが正しく取得できていない場合の処理
      if (weatherData.cod !== 200) {
        document.getElementById('weather-info').innerHTML = '天気情報を取得できませんでした。';
        return;
      }  
        //現在の気象データの定義
        const weathernow = weatherData.weather[0].description;
        const temperaturenow = weatherData.main.temp_min;
        const humiditynow = weatherData.main.humidity;
        const windSpeednow = weatherData.wind.speed;
        const city = weatherData.name;
        const iconnow = weatherData.weather[0].icon;

        //予報データの定義
        let weatherfor = [weathernow];
        let humidityfor = 0;
        let windSpeedfor = 0;
        let iconfor =[iconnow];
        let temperaturefor = 0;
        let Pp = [];
        let Rt = [];

        //配列内の要素の最大値とその位置をとる関数
        const aryMax = function(ary){
          let maximum = ary[0];
          let order = 0;

          for(let i = 0; i < maximum.length; i++){
            if(ary[i] > maximum){
              maximum = ary[i];
              order = i;
            }
          }
          return [maximum, order]
        };

        //配列の要素の最頻値をとる関数
        Array.prototype.Mode = function() {
          if (this.length === 0) return null;
          const frequency = {};
          let maxCount = 0;
          let maxItem = null;

          for (let i = 0; i < this.length; i++) {
              const item = this[i];
              frequency[item] = (frequency[item] || 0) + 1;
              if (frequency[item] > maxCount) {
                  maxCount = frequency[item];
                  maxItem = item;
              }
          }
          return maxItem;
      }

        //9:00~21:00(活動時間)のデータをまとめる
        for(let i = 0; i < 5; i++){
          humidityfor += forecastData.list[i].main.humidity;
          windSpeedfor += forecastData.list[i].wind.speed;
          temperaturefor += forecastData.list[i].main.temp_min;   //気温は最低気温に合わせました
          Pp.push(forecastData.list[i].pop * 100);
          Rt.push(forecastData.list[i].dt_txt);
          weatherfor.push(forecastData.list[i].weather[0].description);
          iconfor.push(forecastData.list[i].weather[0].icon);
        }

        let temperature = Math.round((temperaturenow + temperaturefor) / 6);
        let windSpeed = (Math.round(((windSpeednow + windSpeedfor) / 6) * 10) / 10);
        let humidity = Math.round((humiditynow + humidityfor) / 6);
        let pop = aryMax(Pp)[0];
        let jtime = aryMax(Pp)[1];
        let time = Rt[jtime].slice(11, 16);
        let weather = weatherfor.Mode();
        let icon =iconfor.Mode();  
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