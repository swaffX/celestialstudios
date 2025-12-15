# 🤖 Celestial Studios Discord Bot

Roblox anime oyun geliştiricileri topluluğu için tasarlanmış kapsamlı Discord botu.

## 🚀 Özellikler

### 📊 Seviye Sistemi
- Mesaj ve ses aktivitesiyle XP kazanma
- Adaletli XP sistemi (spam koruması, günlük limit)
- Otomatik seviye rolleri
- Detaylı sıralama tablosu

### 🎁 Çekiliş Sistemi
- Katılım şartları (rol, seviye, mesaj, hesap yaşı)
- Çoklu kazanan desteği
- Otomatik bitiş ve bildirim
- Yeniden çekim özelliği

### 🏆 Başarım & Rozet Sistemi
- 12 farklı başarım
- Otomatik rozet ödülleri
- İlerleme takibi

### 🛡️ Moderasyon
- Ban, kick, mute (timeout)
- Uyarı sistemi
- Mod log kanalı

### 🎫 Ticket Sistemi
- Tek tuşla ticket açma
- Özel kanal oluşturma
- Kullanıcı ekleme

### ⚙️ Ek Özellikler
- Hoşgeldin/Güle güle mesajları
- Otomatik rol
- Detaylı istatistikler

## 📋 Kurulum

### 1. Gereksinimleri Yükle
```bash
npm install
```

### 2. Ortam Değişkenlerini Ayarla
`.env` dosyasını düzenle:
```env
DISCORD_TOKEN=your_token_here
CLIENT_ID=your_client_id
MONGODB_URI=mongodb://localhost:27017/celestialstudios
```

### 3. Botu Başlat
```bash
npm start
```

### 4. PM2 ile Çalıştır (VPS için)
```bash
npm install -g pm2
pm2 start src/index.js --name "celestial-bot"
pm2 save
pm2 startup
```

## 📝 Komutlar

### Seviye
- `/rank` - Seviye ve XP bilgilerini gösterir
- `/leaderboard` - Sunucu sıralamasını gösterir
- `/setlevelchannel` - Seviye bildirim kanalını ayarlar
- `/addlevelrole` - Seviye rolü ekler

### Çekiliş
- `/giveaway create` - Yeni çekiliş oluşturur
- `/giveaway end` - Çekilişi erken bitirir
- `/giveaway reroll` - Yeniden çekim yapar
- `/giveaway list` - Aktif çekilişleri listeler

### Başarım
- `/achievements` - Başarımlarını gösterir
- `/badges` - Rozetlerini gösterir

### Moderasyon
- `/ban` - Kullanıcıyı yasaklar
- `/kick` - Kullanıcıyı atar
- `/mute` - Kullanıcıyı susturur
- `/warn` - Uyarı verir
- `/warnings` - Uyarıları gösterir
- `/clearwarnings` - Uyarıları temizler

### Ticket
- `/ticket setup` - Ticket sistemini kurar
- `/ticket close` - Ticket'ı kapatır
- `/ticket add` - Kullanıcı ekler

### Ayarlar
- `/setwelcome` - Hoşgeldin kanalını ayarlar
- `/setfarewell` - Güle güle kanalını ayarlar
- `/setautorole` - Otomatik rol ayarlar
- `/setmodlog` - Mod log kanalını ayarlar
- `/settings` - Tüm ayarları gösterir

### Yardımcı
- `/ping` - Bot gecikmesini gösterir
- `/help` - Tüm komutları gösterir
- `/info` - Sunucu bilgilerini gösterir
- `/userinfo` - Kullanıcı bilgilerini gösterir
- `/avatar` - Avatar gösterir
- `/stats` - Bot istatistiklerini gösterir

## 🔧 Geliştirme

```bash
npm run dev
```

## 📄 Lisans

MIT License - Celestial Studios
