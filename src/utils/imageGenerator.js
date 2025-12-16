const Jimp = require('jimp');
const { AttachmentBuilder } = require('discord.js');

/**
 * Check if point is inside rounded rect
 */
function isInsideRoundedRect(px, py, x, y, w, h, radius) {
    if (px < x + radius && py < y + radius) {
        const dx = px - (x + radius);
        const dy = py - (y + radius);
        return dx * dx + dy * dy <= radius * radius;
    }
    if (px > x + w - radius && py < y + radius) {
        const dx = px - (x + w - radius);
        const dy = py - (y + radius);
        return dx * dx + dy * dy <= radius * radius;
    }
    if (px < x + radius && py > y + h - radius) {
        const dx = px - (x + radius);
        const dy = py - (y + h - radius);
        return dx * dx + dy * dy <= radius * radius;
    }
    if (px > x + w - radius && py > y + h - radius) {
        const dx = px - (x + w - radius);
        const dy = py - (y + h - radius);
        return dx * dx + dy * dy <= radius * radius;
    }
    return (px >= x && px < x + w && py >= y && py < y + h);
}

/**
 * Draw a rounded glass panel
 */
function drawRoundedPanel(image, x, y, w, h, radius, borderColor, fillR, fillG, fillB, fillAlpha) {
    const borderWidth = 2;

    for (let py = y; py < y + h; py++) {
        for (let px = x; px < x + w; px++) {
            if (!isInsideRoundedRect(px, py, x, y, w, h, radius)) continue;

            const onBorder = !isInsideRoundedRect(px, py, x + borderWidth, y + borderWidth,
                w - borderWidth * 2, h - borderWidth * 2,
                Math.max(0, radius - borderWidth));

            if (onBorder) {
                image.setPixelColor(borderColor, px, py);
            } else {
                const current = Jimp.intToRGBA(image.getPixelColor(px, py));
                const alpha = fillAlpha / 255;
                const newR = Math.round(current.r * (1 - alpha) + fillR * alpha);
                const newG = Math.round(current.g * (1 - alpha) + fillG * alpha);
                const newB = Math.round(current.b * (1 - alpha) + fillB * alpha);
                image.setPixelColor(Jimp.rgbaToInt(newR, newG, newB, 255), px, py);
            }
        }
    }
}

/**
 * Draw rounded progress bar
 */
function drawRoundedProgressBar(image, x, y, w, h, progress) {
    const radius = h / 2;

    // Background
    for (let py = y; py < y + h; py++) {
        for (let px = x; px < x + w; px++) {
            if (isInsideRoundedRect(px, py, x, y, w, h, radius)) {
                image.setPixelColor(Jimp.rgbaToInt(30, 30, 50, 255), px, py);
            }
        }
    }

    // Fill
    if (progress > 0) {
        const fillW = Math.max(h, Math.floor(w * progress));
        for (let py = y + 2; py < y + h - 2; py++) {
            for (let px = x + 2; px < x + 2 + fillW - 4; px++) {
                if (isInsideRoundedRect(px, py, x + 2, y + 2, fillW - 4, h - 4, (h - 4) / 2)) {
                    const ratio = (px - x) / w;
                    const r = Math.round(255 - ratio * 30);
                    const g = Math.round(180 + ratio * 40);
                    const b = Math.round(50 + ratio * 80);
                    image.setPixelColor(Jimp.rgbaToInt(r, g, b, 255), px, py);
                }
            }
        }
    }
}

/**
 * Creates a modern achievement card with rounded panels
 */
async function createAchievementCard(user, achievements, stats) {
    try {
        const width = 500;
        const height = 400;
        const image = new Jimp(width, height);

        // Dark gradient background
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const ratio = (x * 0.3 + y * 0.7) / (width + height);
                const r = Math.round(18 + ratio * 15);
                const g = Math.round(12 + ratio * 12);
                const b = Math.round(35 + ratio * 25);
                image.setPixelColor(Jimp.rgbaToInt(r, g, b, 255), x, y);
            }
        }

        // Load fonts
        const fontMedium = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
        const fontSmall = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);

        const unlocked = achievements.filter(a => a.unlocked).length;
        const total = achievements.length;
        const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;

        // Header panel
        drawRoundedPanel(image, 15, 10, 470, 70, 12, 0x5B6EAEFF, 40, 45, 80, 150);

        // Avatar
        const avatarSize = 50;
        try {
            const avatarUrl = user.displayAvatarURL({ extension: 'png', size: 256, forceStatic: true });
            const avatar = await Jimp.read(avatarUrl);
            avatar.resize(avatarSize, avatarSize);
            avatar.circle();
            image.composite(avatar, 25, 20);
        } catch (e) {
            // Avatar failed, continue without
        }

        // Username and stats
        const username = (user.displayName || user.username || 'User').substring(0, 15);
        image.print(fontMedium, 85, 18, username);
        image.print(fontSmall, 85, 52, `Unlocked (${unlocked}/${total})`);
        image.print(fontSmall, 420, 35, `${percentage}%`);

        // In Progress section
        drawRoundedPanel(image, 15, 90, 470, 270, 12, 0x8B5CF6FF, 35, 35, 60, 160);
        image.print(fontSmall, 25, 100, 'In Progress');

        // Achievement list with progress bars
        const inProgress = achievements.filter(a => !a.unlocked).slice(0, 5);
        let itemY = 125;

        for (const ach of inProgress) {
            const current = ach.current || 0;
            const required = ach.required || 1;
            const progress = Math.min(current / required, 1);

            // Achievement name (strip emoji characters)
            const displayName = (ach.name || 'Achievement').replace(/[^\w\s']/g, '').trim().substring(0, 18);
            image.print(fontSmall, 25, itemY, `* ${displayName}`);

            // Progress bar
            drawRoundedProgressBar(image, 25, itemY + 22, 320, 14, progress);

            // Progress text
            const progressText = `${Math.round(progress * 100)}% (${current}/${required})`;
            image.print(fontSmall, 355, itemY + 18, progressText);

            itemY += 50;
        }

        // Footer - Total XP
        drawRoundedPanel(image, 15, 370, 470, 22, 8, 0x6366F1FF, 45, 40, 90, 170);
        image.print(fontSmall, 25, 372, `Total XP from achievements: ${stats.totalXP || 0} XP`);

        const buffer = await image.getBufferAsync(Jimp.MIME_PNG);
        return new AttachmentBuilder(buffer, { name: 'achievements.png' });

    } catch (error) {
        console.error('Achievement card error:', error);
        return null;
    }
}

module.exports = { createAchievementCard };
