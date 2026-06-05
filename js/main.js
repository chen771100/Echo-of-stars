// 星靈迴響：Nana & 布布
// Echo of Stars: A Digital Spirit Adventure

const config = {
  type: Phaser.AUTO,
  width: 832,
  height: 480,
  parent: 'game-container',
  backgroundColor: '#0a0a2e',
  pixelArt: true,          // 像素精靈模式，避免模糊
  roundPixels: true,       // 四捨五入像素位置，畫面更銳利
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
