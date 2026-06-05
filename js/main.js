// 星靈迴響：Nana & 布布
// Echo of Stars: A Digital Spirit Adventure

const config = {
  type: Phaser.AUTO,
  width: 832,
  height: 480,
  parent: 'game-container',
  backgroundColor: '#0a0a2e',
  pixelArt: true,          // 像素精靈模式
  roundPixels: true,       // 畫面更銳利
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 800 },
      debug: false
    }
  },
  scene: [BootScene, GameScene]
};

const game = new Phaser.Game(config);
