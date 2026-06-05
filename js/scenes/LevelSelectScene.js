// LevelSelectScene — 選關卡畫面
// 開頭顯示三個關卡按鈕，手機友善

class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelSelectScene' });
  }

  create() {
    // 背景
    this.cameras.main.setBackgroundColor('#0a0a2e');

    // 標題
    this.add.text(416, 60, '星靈迴響：Nana & 布布', {
      fontSize: '22px', fill: '#d5a6e8', fontFamily: 'monospace'
    }).setOrigin(0.5);

    this.add.text(416, 95, '選擇關卡', {
      fontSize: '14px', fill: '#9b59b6', fontFamily: 'monospace'
    }).setOrigin(0.5);

    // 關卡按鈕
    const levels = [
      { key: 'GameScene',          name: '🌟 星雲森林',   desc: '經典向上跳躍',    color: 0xd5a6e8, y: 170 },
      { key: 'CrystalCavernScene', name: '💎 水晶洞窟',   desc: '向下探索崩塌平台', color: 0x44ddff, y: 270 },
      { key: 'HauntedForestScene', name: '🌲 幽靈森林',   desc: '迷霧燈塔解謎',    color: 0x66ff88, y: 370 },
    ];

    levels.forEach(l => {
      // 按鈕背景
      const btn = this.add.rectangle(416, l.y, 350, 70, l.color, 0.15)
        .setInteractive({ useHandCursor: true })
        .setStrokeStyle(1, l.color, 0.5);

      // 關卡名稱
      this.add.text(416, l.y - 12, l.name, {
        fontSize: '20px', fill: '#ffffff', fontFamily: 'monospace'
      }).setOrigin(0.5);

      // 關卡說明
      this.add.text(416, l.y + 14, l.desc, {
        fontSize: '12px', fill: '#aaaacc', fontFamily: 'monospace'
      }).setOrigin(0.5);

      // 點擊事件
      btn.on('pointerdown', () => {
        this.scene.start(l.key);
      });
      btn.on('pointerover', () => {
        btn.setFillStyle(l.color, 0.3);
        btn.setStrokeStyle(2, l.color, 0.8);
      });
      btn.on('pointerout', () => {
        btn.setFillStyle(l.color, 0.15);
        btn.setStrokeStyle(1, l.color, 0.5);
      });
    });
  }
}
