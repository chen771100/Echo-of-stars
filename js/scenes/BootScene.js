// BootScene — 載入資源 + 建立動畫 + 程式繪製所有關卡貼圖
class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // ══ 角色 SpriteSheet（指揮官提供）══
    this.load.spritesheet('nana_sprites', 'img/nana_spritesheet.png', { frameWidth: 160, frameHeight: 178 });
    this.load.spritesheet('bubu_sprites', 'img/bubu_spritesheet.png', { frameWidth: 160, frameHeight: 164 });
    // ══ 背景圖（大尺寸，SD生成效果好）══
    this.load.image('night_sky_bg', 'img/night_sky_bg.png');
    this.load.image('cavern_bg', 'img/cavern_bg.png');
    this.load.image('haunted_forest_bg', 'img/haunted_forest_bg.png');
  }

  create() {
    // ══ 娜娜動畫 ══
    this.anims.create({ key: 'nana_idle', frames: [{ key: 'nana_sprites', frame: 0 }] });
    this.anims.create({
      key: 'nana_run',
      frames: this.anims.generateFrameNumbers('nana_sprites', { start: 1, end: 7 }),
      frameRate: 10, repeat: -1
    });
    this.anims.create({ key: 'nana_jump', frames: [{ key: 'nana_sprites', frame: 1 }] });

    // ══ 布布動畫 ══
    this.anims.create({ key: 'bubu_idle', frames: [{ key: 'bubu_sprites', frame: 0 }] });
    this.anims.create({
      key: 'bubu_run',
      frames: this.anims.generateFrameNumbers('bubu_sprites', { start: 0, end: 6 }),
      frameRate: 10, repeat: -1
    });
    this.anims.create({ key: 'bubu_jump', frames: [{ key: 'bubu_sprites', frame: 0 }] });

    // ══ 所有關卡貼圖（程式繪製，原生尺寸不拉伸）══
    this.genTexture('crystal_ball', 16, 16, (g) => {
      g.fillStyle(0x9b59b6, 0.6);
      g.fillCircle(8, 8, 8);
      g.fillStyle(0xd5a6e8, 0.8);
      g.fillCircle(6, 6, 3);
    });

    // 共用粒子（小亮點）
    this.genTexture('ice_particle', 4, 4, (g) => {
      g.fillStyle(0xd5a6e8);
      g.fillCircle(2, 2, 2);
    });
    this.genTexture('particle', 6, 6, (g) => {
      g.fillStyle(0xd5a6e8);
      g.fillCircle(3, 3, 3);
    });

    // ══ 第一關：星雲森林 ══
    // 平台 64x16（紫色石頭風格）
    this.genTexture('platform', 64, 16, (g) => {
      g.fillStyle(0x1a0a3e);
      g.fillRect(0, 0, 64, 16);
      g.fillStyle(0x6b2fa0);
      g.fillRect(0, 0, 64, 2);
      g.lineStyle(1, 0x3d1a6e);
      for (let x = 0; x < 64; x += 16) g.lineBetween(x, 2, x, 16);
    });

    // 星星 8x8（白色圓形）
    this.genTexture('star', 8, 8, (g) => {
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(4, 4, 4);
    });

    // ══ 第二關：水晶洞窟 ══
    // 入口地面 832×16（橫跨整畫面）
    this.genTexture('crystal_floor', 832, 16, (g) => {
      g.fillStyle(0x0a2a4a);
      g.fillRect(0, 0, 832, 16);
      g.fillStyle(0x4488cc);
      g.fillRect(0, 0, 832, 2);
      g.fillStyle(0x3366aa, 0.3);
      g.fillRect(0, 4, 832, 2);
    });

    // 水晶平台 64×16
    this.genTexture('crystal_platform', 64, 16, (g) => {
      g.fillStyle(0x0a2a4a);
      g.fillRect(0, 0, 64, 16);
      g.fillStyle(0x44aadd);
      g.fillRect(0, 0, 64, 2);
      g.fillStyle(0x3388bb, 0.5);
      g.fillRect(0, 3, 64, 2);
    });

    // 崩塌平台 64×16（有裂痕）
    this.genTexture('cracked_platform', 64, 16, (g) => {
      g.fillStyle(0x0a2a4a);
      g.fillRect(0, 0, 64, 16);
      g.fillStyle(0x44aadd);
      g.fillRect(0, 0, 64, 2);
      g.lineStyle(1, 0xaa4444);
      g.lineBetween(10, 4, 20, 12);
      g.lineBetween(30, 2, 35, 10);
      g.lineBetween(50, 6, 55, 14);
    });

    // 水晶碎片 16×16（菱形）
    this.genTexture('crystal_shard', 16, 16, (g) => {
      g.fillStyle(0x44ddff, 0.8);
      g.fillTriangle(8, 0, 0, 8, 16, 8);
      g.fillStyle(0x88eeff, 0.9);
      g.fillTriangle(8, 16, 0, 8, 16, 8);
      g.fillStyle(0xffffff, 0.6);
      g.fillRect(6, 4, 4, 4);
    });

    // ══ 第三關：幽靈森林 ══
    // 森林平台 160×80（原生尺寸，不縮放）
    this.genTexture('forest_platform', 160, 80, (g) => {
      // 主體
      g.fillStyle(0x2a3a1a);
      g.fillRect(0, 0, 160, 80);
      // 頂部青苔
      g.fillStyle(0x3a6b35);
      g.fillRect(0, 0, 160, 6);
      // 石頭紋理
      g.lineStyle(1, 0x1a2a0a, 0.4);
      for (let x = 0; x < 160; x += 40) g.lineBetween(x, 6, x, 80);
      for (let y = 0; y < 80; y += 20) g.lineBetween(0, y + 6, 160, y + 6);
      // 亮點裝飾
      g.fillStyle(0x66ff88, 0.2);
      g.fillRect(10, 15, 6, 6);
      g.fillRect(80, 35, 6, 6);
      g.fillRect(130, 55, 6, 6);
    });

    // 鬼火 64×64（發光球體）
    this.genTexture('will_o_wisp', 64, 64, (g) => {
      // 外圍光暈
      g.fillStyle(0xccff66, 0.15);
      g.fillCircle(32, 32, 32);
      g.fillStyle(0x88ffaa, 0.3);
      g.fillCircle(32, 32, 22);
      // 核心
      g.fillStyle(0xccff66, 0.8);
      g.fillCircle(32, 32, 12);
      g.fillStyle(0xffffff, 0.6);
      g.fillCircle(28, 28, 6);
    });

    this.scene.start('LevelSelectScene');
  }

  // 輔助：建立貼圖
  genTexture(key, w, h, drawFn) {
    const g = this.make.graphics({ add: false });
    drawFn(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }
}
