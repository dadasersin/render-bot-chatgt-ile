const express = require('express');
const app = express();
const Binance = require('node-binance-api');

// Binance bağlantısı
const binance = new Binance().options({
  APIKEY: process.env.BINANCE_APIKEY,
  APISECRET: process.env.BINANCE_SECRET,
  useServerTime: true,
  test: true // test: true → sanal, test: false → gerçek
});

app.use(express.static('public'));

// RSI ve bakiye takibi
let rsiHistory = [];
let balance = 9;

// RSI hesaplama fonksiyonu
async function getRSI(symbol='BNBUSDT', interval='1m', limit=14){
  try {
    const candles = await binance.candlesticks(symbol, interval, {limit});
    let closes = candles.map(c => parseFloat(c[4]));

    let gains = 0, losses = 0;
    for (let i = 1; i < closes.length; i++){
      let diff = closes[i] - closes[i-1];
      if(diff > 0) gains += diff; 
      else losses -= diff;
    }

    let rs = losses === 0 ? 100 : gains/losses; // Sıfır bölmeyi önle
    let rsi = 100 - (100 / (1 + rs));
    return rsi;

  } catch(err){
    console.error("RSI alınamadı:", err.message);
    return null; // Hata durumunda null döndür
  }
}

// RSI kontrolü ve sanal alım
setInterval(async () => {
  try {
    let rsi = await getRSI();
    if (rsi !== null){
      rsiHistory.push({time: new Date().toLocaleTimeString(), rsi});
      if(rsiHistory.length > 20) rsiHistory.shift();

      if (rsi <= 16){
        balance += 0.09; // sanal alım
        console.log(`📉 RSI${rsi.toFixed(1)} → Sanal Alım Yapıldı`);
      }
    }
  } catch(err){
    console.error("RSI işlemi sırasında hata:", err.message);
  }
}, 15000); // 15 saniye aralık

// /rsi endpoint
app.get('/rsi', (req, res) => {
  res.json({rsi: rsiHistory, balance});
});

// Sunucuyu başlat
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Panel çalışıyor... PORT: ${PORT}`));
