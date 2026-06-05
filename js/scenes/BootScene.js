// BootScene — 載入資源 + 建立動畫
class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // ══ 全新 SpriteSheet（指揮官提供）══
    this.load.spritesheet('nana_sprites', 'img/nana_spritesheet.png', { frameWidth: 160, frameHeight: 178 });
    this.load.spritesheet('bubu_sprites', 'img/bubu_spritesheet.png', { frameWidth: 160, frameHeight: 164 });
  }

  create() {
    // ══ 娜娜動畫 ══
    // 8 幀：站立→走路→跑步循環
    this.anims.create({
      key: 'nana_idle',
      frames: [{ key: 'nana_sprites', frame: 0 }],  // 靜態單幀
    });
    this.anims.create({
      key: 'nana_run',
      frames: this.anims.generateFrameNumbers('nana_sprites', { start: 1, end: 7 }),
      frameRate: 10, repeat: -1
    });
    this.anims.create({
      key: 'nana_jump',
      frames: [{ key: 'nana_sprites', frame: 1 }],  // 跳躍用走路幀代替
    });

    // ══ 布布動畫 ══
    // 7 幀：正面→側面→背面→側面的走路循環
    this.anims.create({
      key: 'bubu_idle',
      frames: [{ key: 'bubu_sprites', frame: 0 }],  // 靜態單幀
    });
    this.anims.create({
      key: 'bubu_run',
      frames: this.anims.generateFrameNumbers('bubu_sprites', { start: 0, end: 6 }),
      frameRate: 10, repeat: -1
    });
    this.anims.create({
      key: 'bubu_jump',
      frames: [{ key: 'bubu_sprites', frame: 0 }],
    });

    // ══ 通用物件貼圖（程式繪製） ══
    this.createCrystalBallTexture();
    this.createPlatformTexture();
    this.createStarTexture();
    this.createParticleTexture();

    this.scene.start('GameScene');
  }

  // ── 水晶球 ──
  createCrystalBallTexture() {
    const g = this.make.graphics({ add: false });
    g.fillStyle(0x9b59b6, 0.6);
    g.fillCircle(8, 8, 8);
    g.fillStyle(0xd5a6e8, 0.8);
    g.fillCircle(6, 6, 3);
    g.generateTexture('crystal_ball', 16, 16);
    g.destroy();
  }

  // ── 平台 ──
  createPlatformTexture() {
    const g = this.make.graphics({ add: false });
    g.fillStyle(0x1a0a3e);
    g.fillRect(0, 0, 64, 16);
    g.fillStyle(0x6b2fa0);
    g.fillRect(0, 0, 64, 2);
    g.lineStyle(1, 0x3d1a6e);
    for (let x = 0; x < 64; x += 16) g.lineBetween(x, 2, x, 16);
    g.generateTexture('platform', 64, 16);
    g.destroy();
  }

  // ── 星星 ──
  createStarTexture() {
    const g = this.make.graphics({ add: false });
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(4, 4, 4);
    g.generateTexture('star', 8, 8);
    g.destroy();
  }

  // ── 粒子 ──
  createParticleTexture() {
    const g = this.make.graphics({ add: false });
    g.fillStyle(0xd5a6e8);
    g.fillCircle(3, 3, 3);
    g.generateTexture('particle', 6, 6);
    g.destroy();
  }
}
