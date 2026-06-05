// HauntedForestScene — 🌲 幽靈森林（第三關）
// 核心機制：迷霧遮罩 + 燈塔解謎 + 角色切換
// 特色：視野受限，必須雙角色配合解鎖前進路線

class HauntedForestScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HauntedForestScene' });
  }

  create() {
    this.CHAR_SCALE = 0.5;

    // ── 幽靈森林背景 ──
    this.add.image(416, 240, 'haunted_forest_bg')
      .setScrollFactor(0.3)
      .setDepth(0);

    // ── 平台 ──（用幾何矩形取代貼圖，更乾淨）
    this.platforms = this.physics.add.staticGroup();

    // 地面 + 前兩段閘門地板
    this.platforms.create(200, 476, 'forest_platform').setDisplaySize(1360, 16).refreshBody();
    // 右側終點平台
    this.platforms.create(1360, 430, 'forest_platform').setDisplaySize(80, 80).refreshBody();

    // 高低平台（使用幾何矩形，視覺統一）
    const levelData = [
      // ── 第一區：起點區域（x:0~400）──
      { x: 100, y: 370, w: 80, h: 16 },   // 起點邊
      { x: 280, y: 320, w: 80, h: 16 },   // 中間
      { x: 160, y: 260, w: 80, h: 16 },   // 高處

      // ── 第二區：第一道閘門後（x:600~800）──
      { x: 650, y: 360, w: 100, h: 16 },  // 入口左
      { x: 780, y: 310, w: 80, h: 16 },   // 中間
      { x: 680, y: 240, w: 80, h: 16 },   // 高處

      // ── 第三區：第二道閘門後（x:1100~1300）──
      { x: 1150, y: 370, w: 80, h: 16 },  // 入口
      { x: 1280, y: 320, w: 80, h: 16 },  // 終點前
    ];

    levelData.forEach(d => {
      const p = this.platforms.create(d.x, d.y, 'forest_platform');
      p.setDisplaySize(d.w, d.h);
      p.refreshBody();
    });

    // ── 角色 ──
    this.nana = this.physics.add.sprite(100, 118, 'nana_sprites', 0);
    this.bubu = this.physics.add.sprite(70, 118, 'bubu_sprites', 0);
    this.setupCharacters(this.nana);
    this.setupCharacters(this.bubu);

    this.nana.setScale(this.CHAR_SCALE);
    this.bubu.setScale(this.CHAR_SCALE);

    this.activeChar = 'nana';
    this.crystalBall = this.add.image(120, 105, 'crystal_ball');

    // ── 迷霧效果（RenderTexture fill + erase）──
    this.fogRt = this.add.renderTexture(0, 0, 1440, 480);
    this.fogRt.setOrigin(0, 0);
    this.fogRt.setDepth(50);
    this.fogRt.setScrollFactor(1);

    // 生成圓形清除貼圖
    const fogGfx = this.make.graphics({ add: false });
    fogGfx.fillStyle(0xffffff);
    fogGfx.fillCircle(65, 65, 65);
    fogGfx.generateTexture('fog_clear', 130, 130);
    fogGfx.destroy();

    // ── 燈塔系統 ──
    this.setupBeacons();

    // ── 收集品（鬼火）──
    this.stars = this.physics.add.staticGroup();
    const wispPositions = [
      { x: 280, y: 280, tint: 0xccff66 },
      { x: 500, y: 160, tint: 0x88ffaa },
      { x: 780, y: 280, tint: 0xccff66 },
      { x: 1150, y: 320, tint: 0x88ffaa },
      { x: 1320, y: 260, tint: 0xccff66 },
    ];
    wispPositions.forEach(pos => {
      const w = this.stars.create(pos.x, pos.y, 'will_o_wisp');
      w.setScale(0.3);
      w.setTint(pos.tint);
      this.tweens.add({
        targets: w,
        alpha: 0.3,
        duration: 1000,
        yoyo: true,
        repeat: -1,
      });
    });

    // ── 背景粒子（螢火蟲）──
    for (let i = 0; i < 25; i++) {
      const f = this.add.image(
        Phaser.Math.Between(0, 1440),
        Phaser.Math.Between(50, 450),
        'ice_particle'
      );
      f.setScale(1.5);
      f.setTint(0xccff66);
      f.setAlpha(Phaser.Math.FloatBetween(0.1, 0.4));
      this.tweens.add({
        targets: f,
        y: f.y + Phaser.Math.Between(-50, 50),
        x: f.x + Phaser.Math.Between(-30, 30),
        alpha: 0.05,
        duration: Phaser.Math.Between(2000, 4000),
        yoyo: true,
        repeat: -1,
      });
    }

    // ── 按鍵 ──
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyQ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.keyOne = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    this.keyTwo = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);

    // ── 狀態 ──
    this.switchCooldown = 0;
    this.hasDoubleJumped = false;

    // ── 碰撞 ──
    this.physics.add.collider(this.nana, this.platforms);
    this.physics.add.collider(this.bubu, this.platforms);
    this.physics.add.overlap(this.nana, this.stars, this.collectWisp, null, this);
    this.physics.add.overlap(this.bubu, this.stars, this.collectWisp, null, this);

    // ── 相機 ──
    this.cameras.main.startFollow(this.nana, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, 1440, 480);
  }

  // ── 角色體型 ──
  setupCharacters(char) {
    char.body.setSize(
      char === this.nana ? 160 : 160,
      char === this.nana ? 178 : 164
    );
    char.body.setOffset(0, 0);
    char.setCollideWorldBounds(true);
    char.setDepth(10);
  }

  // ── 迷霧（RenderTexture fill + erase, 每幀重繪）──
  updateFog() {
    const active = (this.activeChar === 'nana') ? this.nana : this.bubu;
    this.fogRt.clear();
    this.fogRt.fill(0x000000, 0.88);
    this.fogRt.erase('fog_clear', active.x - 65, active.y - 65);
  }

  // ── 燈塔 ──
  setupBeacons() {
    this.beaconConfigs = [
      {
        gateX: 550,
        beacons: [
          { x: 480, y: 340, litBy: 'nana', lit: false },
          { x: 620, y: 340, litBy: 'bubu', lit: false },
        ],
        opened: false,
      },
      {
        gateX: 1050,
        beacons: [
          { x: 980, y: 300, litBy: 'nana', lit: false },
          { x: 1120, y: 300, litBy: 'bubu', lit: false },
        ],
        opened: false,
      },
    ];

    this.beaconConfigs.forEach((cfg, gi) => {
      // 閘門（撞到會擋住去路的矩形）
      const gate = this.physics.add.staticImage(cfg.gateX, 240, 'forest_platform');
      gate.setDisplaySize(16, 480);
      gate.setTint(0x442266);
      gate.refreshBody();
      gate.setDepth(8);

      // 閘門裝飾
      const gateTop = this.add.rectangle(cfg.gateX, 20, 20, 40, 0x555566);
      gateTop.setDepth(9);

      // 燈塔
      cfg.beacons.forEach((b, bi) => {
        // 底座（圓形）
        const base = this.add.circle(b.x, b.y + 20, 12, 0x554444);
        base.setDepth(4);
        // 燈光（發光球體）
        const light = this.add.circle(b.x, b.y + 5, 14, b.litBy === 'nana' ? 0x4488ff : 0xff8844);
        light.setDepth(5).setAlpha(0.2);
        b._light = light;

        // 提示文字
        this.add.text(b.x, b.y - 22, b.litBy === 'nana' ? '🌸 娜娜' : '🐾 布布', {
          fontSize: '10px', fontFamily: 'monospace', color: '#aaccaa',
        }).setOrigin(0.5).setDepth(6).setAlpha(0.6);

        // 呼吸
        this.tweens.add({
          targets: light,
          alpha: 0.4,
          duration: 1500,
          yoyo: true,
          repeat: -1,
        });
      });

      this.gates.push(gate);
    });
  }

  updateBeacons() {
    this.beaconConfigs.forEach((cfg, gi) => {
      if (cfg.opened) return;
      const gate = this.gates[gi];

      let allLit = true;
      cfg.beacons.forEach((b) => {
        // 判斷正確角色是否站在燈塔旁
        const char = (b.litBy === 'nana') ? this.nana : this.bubu;
        const dist = Phaser.Math.Distance.Between(char.x, char.y, b.x, b.y);

        if (dist < 50) {
          b.lit = true;
          b._light.setFillStyle(b.litBy === 'nana' ? 0x66aaff : 0xffaa66);
          b._light.setAlpha(0.9);
        }
        if (!b.lit) allLit = false;
      });

      if (allLit) {
        cfg.opened = true;
        this.tweens.add({
          targets: gate,
          alpha: 0,
          duration: 600,
          onComplete: () => {
            gate.body.enable = false;
            gate.setVisible(false);
          },
        });
      }
    });
  }

  // ── 切換角色 ──
  switchChar(charKey) {
    if (this.switchCooldown > 0) return;
    if (this.activeChar === charKey) return;

    const prev = (this.activeChar === 'nana') ? this.nana : this.bubu;
    const next = (charKey === 'nana') ? this.nana : this.bubu;

    const tempX = prev.x, tempY = prev.y;
    prev.setPosition(next.x, next.y);
    next.setPosition(tempX, tempY);

    prev.body.setVelocity(0, 0);
    next.body.setVelocity(0, 0);

    this.activeChar = charKey;
    this.switchCooldown = 30;
    this.hasDoubleJumped = false;
    this.cameras.main.startFollow(next, true, 0.1, 0.1);

    this.createSwitchEffect(prev.x, prev.y);
    this.createSwitchEffect(next.x, next.y);
  }

  createSwitchEffect(x, y) {
    for (let i = 0; i < 8; i++) {
      const p = this.add.circle(x, y, 3, 0xccff88);
      p.setDepth(15);
      this.tweens.add({
        targets: p,
        x: x + Phaser.Math.Between(-30, 30),
        y: y + Phaser.Math.Between(-30, 30),
        alpha: 0, scale: 0,
        duration: 400,
        onComplete: () => p.destroy(),
      });
    }
  }

  // ── 收集鬼火 ──
  collectWisp(char, star) {
    star.destroy();
    const count = this.stars.countActive();
    if (count === 0) {
      this.showVictory();
    }
  }

  showVictory() {
    this.fogRt.clear();
    this.add.rectangle(720, 240, 1440, 480, 0x000000, 0.7).setDepth(90);
    const text = this.add.text(720, 200, '🌲 幽靈森林通關！ 🌲', {
      fontSize: '28px', fill: '#66ff88', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(91);
    this.tweens.add({
      targets: text, scaleX: 1.1, scaleY: 1.1,
      duration: 800, yoyo: true, repeat: -1,
    });

    this.add.text(720, 260, '📋 選關卡', {
      fontSize: '20px', fill: '#66ff88', fontFamily: 'monospace',
      backgroundColor: '#1a4a2a', padding: { x: 14, y: 8 },
    }).setOrigin(0.5).setDepth(91).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('LevelSelectScene'))
      .on('pointerover', function () { this.setStyle({ fill: '#ffffff' }); })
      .on('pointerout', function () { this.setStyle({ fill: '#66ff88' }); });
  }

  // ── 更新 ──
  update() {
    const active = (this.activeChar === 'nana') ? this.nana : this.bubu;
    const isNana = (this.activeChar === 'nana');
    const body = active.body;
    const onGround = body.blocked.down || body.touching.down;

    if (this.switchCooldown > 0) this.switchCooldown--;

    // ── 左右移動 ──
    const left = this.cursors.left.isDown || this.keyA.isDown;
    const right = this.cursors.right.isDown || this.keyD.isDown;
    const speed = 200;

    if (left) {
      body.setVelocityX(-speed);
      active.setFlipX(true);
    } else if (right) {
      body.setVelocityX(speed);
      active.setFlipX(false);
    } else {
      body.setVelocityX(0);
    }

    // ── 動畫 ──
    const cur = active.anims.currentAnim?.key;
    if (!onGround) {
      if (cur !== 'nana_jump') active.play('nana_jump');
    } else if (left || right) {
      if (cur !== 'nana_run') active.play('nana_run');
    } else {
      if (cur !== 'nana_idle') active.play('nana_idle');
    }

    // ── 跳躍 ──
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up)
      || Phaser.Input.Keyboard.JustDown(this.keyW);
    if (jumpPressed && onGround) {
      body.setVelocityY(-400);
    } else if (jumpPressed && !onGround && isNana && !this.hasDoubleJumped) {
      body.setVelocityY(-350);
      this.hasDoubleJumped = true;
    }

    // ── 角色切換 ──
    if (Phaser.Input.Keyboard.JustDown(this.keyQ)) {
      this.switchChar(this.activeChar === 'nana' ? 'bubu' : 'nana');
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyOne)) this.switchChar('nana');
    if (Phaser.Input.Keyboard.JustDown(this.keyTwo)) this.switchChar('bubu');

    // ── 跟隨者 ──
    const follower = (this.activeChar === 'nana') ? this.bubu : this.nana;
    const fBody = follower.body;
    const fGround = fBody.blocked.down || fBody.touching.down;
    const distX = active.x - follower.x;
    const distY = active.y - follower.y;

    if (Math.abs(distX) > 60 && fGround) {
      fBody.setVelocityX(distX > 0 ? 180 : -180);
      follower.setFlipX(distX < 0);
    } else if (fGround) {
      fBody.setVelocityX(0);
    }

    if (distY < -80 && fGround) {
      fBody.setVelocityY(-400);
    }

    // 跟隨者掉落重置
    if (follower.y > 500) {
      follower.setPosition(active.x - 30, active.y - 20);
      fBody.setVelocity(0, 0);
    }

    // 重置
    if (active.y > 500) {
      this.nana.setPosition(100, 118);
      this.bubu.setPosition(70, 118);
      this.cameras.main.startFollow(
        (this.activeChar === 'nana') ? this.nana : this.bubu,
        true, 0.1, 0.1
      );
    }

    // ── 水晶球 ──
    this.crystalBall.setPosition(active.x + 20, active.y - 40);

    // ── 迷霧更新 ──
    this.updateFog();

    // ── 燈塔更新 ──
    this.updateBeacons();
  }
}
