
const express = require('express');
const app = express();
const Binance = require('node-binance-api');

const binance = new Binance().options({
  APIKEY: process.env.BINANCE_APIKEY,
  APISECRET: process.env.BINANCE_SECRET,
  useServerTime: true,
  test: true // test modunu başlat
});

app.use(express.static('public'));

let rsiHistory = [];
let balance = 9;

async function getRSI(symbol='BNBUSDT', interval='1m', limit=14){
  const candles = await binance.candlesticks(symbol, interval, {limit});
  let closes = candles.map(c=>parseFloat(c[4]));
  let gains = 0, losses = 0;
  for(let i=1;i<closes.length;i++){
    let diff = closes[i] - closes[i-1];
    if(diff>0) gains+=diff; else losses-=diff;
  }
  let rs = gains/losses;
  let rsi = 100 - (100 / (1 + rs));
  return rsi;
}

setInterval(async()=>{
  try{
    let rsi = await getRSI();
    rsiHistory.push({time:new Date().toLocaleTimeString(), rsi});
    if(rsiHistory.length>20) rsiHistory.shift();

    if(rsi <=16){
      balance += 0.09;
      console.log(`📉 RSI${rsi.toFixed(1)} → Sanal Alım Yapıldı`);
    }
  } catch(err){
    console.log("RSI verisi alınamadı:", err.message);
  }
},15000);

app.get('/rsi', (req,res)=>{
  res.json({rsi:rsiHistory, balance});
});

app.listen(process.env.PORT || 3000, ()=>console.log('Panel çalışıyor...'));
