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

    // ── 平台 ──
    this.platforms = this.physics.add.staticGroup();

    // 地面（連續）
    const ground = this.platforms.create(720, 476, 'forest_platform');
    ground.setDisplaySize(1440, 16);
    ground.refreshBody();

    // 高低平台（樹枝、石頭平台）
    const levelData = [
      // 第一區（起點～入口）
      { x: 200, y: 380, tint: 0x3a6b35 },
      { x: 350, y: 330, tint: 0x2d5a27 },
      { x: 500, y: 380, tint: 0x3a6b35 },

      // 第二區（第一道閘門後）
      { x: 700, y: 360, tint: 0x2d5a27 },
      { x: 850, y: 310, tint: 0x3a6b35 },
      { x: 1000, y: 360, tint: 0x2d5a27 },

      // 第三區（終點前）
      { x: 1150, y: 380, tint: 0x3a6b35 },
      { x: 1300, y: 350, tint: 0x2d5a27 },
    ];

    levelData.forEach(d => {
      const p = this.platforms.create(d.x, d.y, 'forest_platform');
      p.setDisplaySize(80, 16);
      if (d.tint) p.setTint(d.tint);
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

    // ── 碰撞 ──
    this.physics.add.collider(this.nana, this.platforms);
    this.physics.add.collider(this.bubu, this.platforms);
    this.physics.add.overlap(this.nana, this.stars, this.collectWisp, null, this);
    this.physics.add.overlap(this.bubu, this.stars, this.collectWisp, null, this);

    // ── 迷霧效果 ──
    this.createFog();

    // ── 燈塔系統 ──
    this.beacons = [];
    this.gates = [];
    this.setupBeacons();

    // ── 收集品 ──
    this.stars = this.physics.add.staticGroup();
    const wispPositions = [
      { x: 350, y: 300 },
      { x: 600, y: 160 },
      { x: 850, y: 280 },
      { x: 1100, y: 420 },
      { x: 1300, y: 200 },
    ];
    wispPositions.forEach(pos => {
      const w = this.stars.create(pos.x, pos.y, 'will_o_wisp');
      w.setScale(0.3);
      w.setTint(0xccff66);
      this.tweens.add({
        targets: w,
        alpha: 0.3,
        duration: 1000,
        yoyo: true,
        repeat: -1,
      });
    });

    // ── 背景粒子（螢火蟲）──
    this.fireflies = [];
    for (let i = 0; i < 30; i++) {
      const f = this.add.image(
        Phaser.Math.Between(0, 1440),
        Phaser.Math.Between(50, 450),
        'ice_particle'
      );
      f.setScale(1.5);
      f.setTint(0xccff66);
      f.setAlpha(Phaser.Math.FloatBetween(0.1, 0.5));
      this.fireflies.push(f);
      this.tweens.add({
        targets: f,
        y: f.y + Phaser.Math.Between(-60, 60),
        x: f.x + Phaser.Math.Between(-40, 40),
        alpha: 0.1,
        duration: Phaser.Math.Between(2000, 4000),
        yoyo: true,
        repeat: -1,
      });
    }

    // ── 幽靈粒子（透明飄浮鬼火）──
    for (let i = 0; i < 15; i++) {
      const g = this.add.image(
        Phaser.Math.Between(100, 1340),
        Phaser.Math.Between(100, 400),
        'ice_particle'
      );
      g.setScale(Phaser.Math.FloatBetween(2, 4));
      g.setAlpha(Phaser.Math.FloatBetween(0.1, 0.3));
      g.setTint(0x88aaff);
      this.tweens.add({
        targets: g,
        y: g.y + Phaser.Math.Between(-40, 40),
        alpha: 0,
        duration: Phaser.Math.Between(3000, 5000),
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
    this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.keyOne = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    this.keyTwo = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    this.keyTab = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);

    // ── 狀態變數 ──
    this.switchCooldown = 0;
    this.hasDoubleJumped = false;
    this.canDoubleJump = true;
    this.dashCooldown = 0;
    this.landingCooldown = 0;
    this.jumpBufferTimer = 0;
    this.airFrameCount = 0;
    this._justLeftGround = false;

    // ── 相機 ──
    this.cameras.main.startFollow(this.nana, true, 0.1, 0.1);
  }

  // ── 角色體型設定 ──
  setupCharacters(char) {
    char.setScale(this.CHAR_SCALE);
    char.body.setSize(
      char === this.nana ? 160 : 160,
      char === this.nana ? 178 : 164
    );
    char.body.setOffset(0, 0);
    char.setCollideWorldBounds(true);
    char.setDepth(10);
  }

  // ── 迷霧（用 Canvas 畫，更可靠）──
  createFog() {
    // 建立 CanvasTexture：全黑背景 + 中間挖一個透明圓
    this.fogCanvas = this.textures.createCanvas('fog_texture', 1440, 480);
    this.fogImage = this.add.image(720, 240, 'fog_texture');
    this.fogImage.setDepth(50);
    this.fogImage.setAlpha(0.85);
  }

  updateFog() {
    const active = (this.activeChar === 'nana') ? this.nana : this.bubu;
    const ctx = this.fogCanvas.context;

    // 清除
    ctx.clearRect(0, 0, 1440, 480);

    // 畫全黑
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 1440, 480);

    // 在角色位置挖一個透明圓
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(active.x, active.y, 130, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    this.fogCanvas.refresh();
  }

  // ── 燈塔系統 ──
  setupBeacons() {
    this.beaconConfigs = [
      {
        gateX: 550,
        beacons: [
          { x: 480, y: 396, litBy: 'nana', lit: false },
          { x: 620, y: 396, litBy: 'bubu', lit: false },
        ],
        opened: false,
      },
      {
        gateX: 1050,
        beacons: [
          { x: 980, y: 340, litBy: 'nana', lit: false },
          { x: 1120, y: 340, litBy: 'bubu', lit: false },
        ],
        opened: false,
      },
    ];

    this.beaconConfigs.forEach((cfg, gi) => {
      // 閘門
      const gate = this.platforms.create(cfg.gateX, 468, 'crystal_platform');
      gate.setDisplaySize(24, 480);
      gate.setTint(0x442266);
      gate.refreshBody();
      gate.setDepth(8);

      // 燈塔視覺
      cfg.beacons.forEach((b, bi) => {
        // 底座
        const base = this.add.rectangle(b.x, b.y + 20, 12, 30, 0x556655);
        base.setDepth(4);
        // 燈光
        const light = this.add.circle(b.x, b.y + 5, 10, b.litBy === 'nana' ? 0x4488ff : 0xff8844);
        light.setDepth(5).setAlpha(0.2);
        light.setData('gateIdx', gi);
        light.setData('beaconIdx', bi);
        b._light = light;

        // 提示
        this.add.text(b.x, b.y - 18, b.litBy === 'nana' ? '🌸 娜娜' : '🐾 布布', {
          fontSize: '10px', color: '#aaccaa',
        }).setOrigin(0.5).setDepth(6).setAlpha(0.5);

        // 燈塔本身緩慢呼吸
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

      // 檢查兩座燈塔都有對應角色靠近
      let allLit = true;
      cfg.beacons.forEach((b, bi) => {
        const distToActive = Phaser.Math.Distance.Between(
          (this.activeChar === 'nana' ? this.nana : this.bubu).x,
          (this.activeChar === 'nana' ? this.nana : this.bubu).y,
          b.x, b.y
        );
        const distToFollower = Phaser.Math.Distance.Between(
          (this.activeChar === 'nana' ? this.bubu : this.nana).x,
          (this.activeChar === 'nana' ? this.bubu : this.nana).y,
          b.x, b.y
        );
        // 該燈塔需要 'nana' 或 'bubu' 靠近
        const rightCharDist = b.litBy === 'nana' ?
          Phaser.Math.Distance.Between(this.nana.x, this.nana.y, b.x, b.y) :
          Phaser.Math.Distance.Between(this.bubu.x, this.bubu.y, b.x, b.y);

        if (rightCharDist < 50) {
          b.lit = true;
          b._light.setFillStyle(b.litBy === 'nana' ? 0x66aaff : 0xffaa66);
          b._light.setAlpha(0.9);
        }
        if (!b.lit) allLit = false;
      });

      // 兩座都亮 → 開門
      if (allLit) {
        cfg.opened = true;
        this.tweens.add({
          targets: gate,
          alpha: 0,
          duration: 600,
          onComplete: () => {
            gate.body.enable = false;
            gate.setVisible(false);
          }
        });
      }
    });
  }

  // ── 角色切換 ──
  switchChar(charKey) {
    if (this.switchCooldown > 0) return;
    if (this.activeChar === charKey) return;

    const prev = (this.activeChar === 'nana') ? this.nana : this.bubu;
    const next = (charKey === 'nana') ? this.nana : this.bubu;

    // 交換位置
    const tempX = prev.x;
    const tempY = prev.y;
    prev.setPosition(next.x, next.y);
    next.setPosition(tempX, tempY);

    // 重置速度
    prev.body.setVelocity(0, 0);
    next.body.setVelocity(0, 0);

    this.activeChar = charKey;
    this.switchCooldown = 30;
    this.hasDoubleJumped = false;
    this.cameras.main.startFollow(next, true, 0.1, 0.1);

    // 切換特效
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
        alpha: 0,
        scale: 0,
        duration: 400,
        onComplete: () => p.destroy(),
      });
    }
  }

  // ── 收集 ──
  collectWisp(char, star) {
    star.destroy();
  }

  // ── 更新循環 ──
  update() {
    const active = (this.activeChar === 'nana') ? this.nana : this.bubu;
    let isNana = (this.activeChar === 'nana');
    const activeBody = active.body;
    const onGround = activeBody.blocked.down || activeBody.touching.down;
    const cur = active.anims.currentAnim?.key;

    // ── 冷卻 ──
    if (this.switchCooldown > 0) this.switchCooldown--;
    if (this.dashCooldown > 0) this.dashCooldown--;
    if (this.landingCooldown > 0) this.landingCooldown--;
    if (this.jumpBufferTimer > 0) this.jumpBufferTimer--;

    // ── 離開地面偵測 ──
    if (onGround) {
      this.airFrameCount = 0;
      this._justLeftGround = false;
    } else {
      this.airFrameCount++;
      if (this.airFrameCount === 1) this._justLeftGround = true;
    }

    // ── 左右移動 ──
    const left = this.cursors.left.isDown || this.keyA.isDown;
    const right = this.cursors.right.isDown || this.keyD.isDown;
    const speed = 200;

    if (left) {
      activeBody.setVelocityX(-speed);
      active.setFlipX(true);
    } else if (right) {
      activeBody.setVelocityX(speed);
      active.setFlipX(false);
    } else {
      activeBody.setVelocityX(0);
    }

    // ── 動畫（簡化版）──
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
    if (jumpPressed && (onGround || this.jumpBufferTimer > 0)) {
      activeBody.setVelocityY(-400);
      this.jumpBufferTimer = 0;
    } else if (jumpPressed && !onGround && isNana && !this.hasDoubleJumped) {
      activeBody.setVelocityY(-350);
      this.hasDoubleJumped = true;
    }

    // ── 衝刺（娜娜）──
    if (isNana && !onGround && Phaser.Input.Keyboard.JustDown(this.keyZ) && this.dashCooldown === 0) {
      const dashDir = active.flipX ? -1 : 1;
      activeBody.setVelocityX(dashDir * 350);
      activeBody.setVelocityY(0);
      this.dashCooldown = 30;
    }

    // ── 角色切換 ──
    if (Phaser.Input.Keyboard.JustDown(this.keyQ) || Phaser.Input.Keyboard.JustDown(this.keyTab)) {
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
      follower.body.setVelocityX(distX > 0 ? 180 : -180);
      follower.setFlipX(distX < 0);
    } else if (fGround) {
      follower.body.setVelocityX(0);
    }

    if (distY < -80 && fGround) {
      fBody.setVelocityY(-400);
    }

    // 跟隨者掉落重置
    if (follower.y > 500) {
      follower.setPosition(active.x - 30, active.y - 20);
      fBody.setVelocity(0, 0);
    }

    // ── 掉落深淵重置 ──
    if (active.y > 500) {
      this.nana.setPosition(100, 118);
      this.bubu.setPosition(70, 118);
      active = (this.activeChar === 'nana') ? this.nana : this.bubu;
      this.cameras.main.startFollow(active, true, 0.1, 0.1);
    }

    // ── 水晶球跟隨 ──
    this.crystalBall.setPosition(active.x + 20, active.y - 40);

    // ── 迷霧更新 ──
    this.updateFog();

    // ── 燈塔偵測更新 ──
    this.updateBeacons();

    // ── 跳躍緩衝 ──
    if (jumpPressed && !onGround) {
      this.jumpBufferTimer = 6;
    }
  }
}
