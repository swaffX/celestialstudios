# Celestial Studios Discord Bot

A feature-rich Discord bot built with discord.js v14 for Roblox game communities.

## Features

### 📊 Leveling System
- XP per message and voice time
- Anti-spam and daily limits
- Level-up notifications
- Level roles auto-assignment
- Leaderboard system

### 🎁 Giveaway System
- Multiple requirements (role, level, messages, account age, invites)
- Multiple winners support
- Timed auto-endings
- Reroll functionality

### 🏆 Achievement System
- 16+ achievements to unlock
- Badge rewards
- XP rewards
- Progress tracking

### 📨 Invite System
- Invite tracking
- Fake invite detection & penalty
- Bonus invites (admin)
- Special giveaway access for top inviters

### 🛡️ Moderation
- Ban, Kick, Mute (timeout)
- Warning system
- Mod log channel

### 🎫 Ticket System
- Ticket panel with buttons
- Add users to tickets
- Auto transcript logging

### 👋 Welcome & Farewell
- Customizable messages
- Auto-role assignment

## Commands

| Category | Commands |
|----------|----------|
| Leveling | `/rank`, `/leaderboard`, `/setlevelchannel`, `/addlevelrole` |
| Giveaways | `/giveaway create/end/reroll/list` |
| Achievements | `/achievements`, `/badges` |
| Invites | `/invites`, `/inviteleaderboard`, `/addinvites` |
| Moderation | `/ban`, `/kick`, `/mute`, `/warn`, `/warnings`, `/clearwarnings` |
| Settings | `/settings`, `/setwelcome`, `/setfarewell`, `/setautorole`, `/setmodlog` |
| Tickets | `/ticket setup/close/add` |
| Utility | `/help`, `/ping`, `/info`, `/userinfo`, `/avatar`, `/stats` |

## Installation

### Prerequisites
- Node.js 18+
- MongoDB (Atlas or local)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/swaffX/celestialstudios.git
cd celestialstudios
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
# Discord Bot
DISCORD_TOKEN=your_discord_bot_token
CLIENT_ID=your_client_id

# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/celestialstudios
```

4. Start the bot:
```bash
npm start
```

## VPS Deployment

### Step 1: Connect to VPS
```bash
ssh root@your-vps-ip
```

### Step 2: Install Requirements
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Install PM2
npm install -g pm2

# Install Git
apt install -y git
```

### Step 3: Clone and Setup
```bash
# Clone repository
git clone https://github.com/swaffX/celestialstudios.git
cd celestialstudios

# Install dependencies
npm install

# Create .env file
nano .env
# Add your environment variables
```

### Step 4: Start with PM2
```bash
# Start bot
pm2 start src/index.js --name celestialbot

# Save PM2 config
pm2 save

# Setup auto-restart on reboot
pm2 startup
```

### PM2 Commands
```bash
pm2 status          # View status
pm2 logs celestialbot    # View logs
pm2 restart celestialbot # Restart bot
pm2 stop celestialbot    # Stop bot
```

### Updating the Bot
```bash
cd celestialstudios
git pull
npm install
pm2 restart celestialbot
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DISCORD_TOKEN` | Your Discord bot token |
| `CLIENT_ID` | Your Discord application client ID |
| `MONGODB_URI` | MongoDB connection string |

## Database

The bot uses MongoDB with the following collections:
- `users` - User data (XP, level, achievements, invites)
- `guilds` - Server settings and configurations
- `giveaways` - Active and ended giveaways
- `tickets` - Ticket records

## License

MIT License

## Support

For issues or questions, create an issue on GitHub.
