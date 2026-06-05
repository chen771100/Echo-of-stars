// HauntedForestScene — 🌲 幽靈森林（第三關）
// 所有物件使用 SD.Next 原生尺寸，不後製不拉伸

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

    // ── 平台 ──（forest_platform = 160x80 原生尺寸，絕不拉伸）
    this.platforms = this.physics.add.staticGroup();

    // 地面：tiles 160x80 並排，14 片 = 1120px 寬
    const TILE = 160, TH = 80;
    for (let i = 0; i < 9; i++) {
      this.platforms.create(TILE/2 + i * TILE, 480 - TH/2, 'forest_platform');
    }

    // 右側終點平台（80x80 縮放成正方形？算了，直接用 160x80 tile）
    this.platforms.create(1360, 430, 'forest_platform');

    // 各關卡段的高台平台（160x80 原生）
    const levelData = [
      // 第一區：起點區域
      { x: 160, y: 350 },  // 起點旁
      { x: 80,  y: 280 },  // 高處

      // 第二區：第一閘門後
      { x: 720, y: 340 },
      { x: 640, y: 260 },

      // 第三區：第二閘門後
      { x: 1200, y: 350 },
      { x: 1280, y: 280 },
    ];

    levelData.forEach(d => {
      this.platforms.create(d.x, d.y, 'forest_platform');
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

    // ── 迷霧（RenderTexture fill + erase）──
    const fogGfx = this.make.graphics({ add: false });
    fogGfx.fillStyle(0xffffff);
    fogGfx.fillCircle(65, 65, 65);
    fogGfx.generateTexture('fog_clear', 130, 130);
    fogGfx.destroy();

    this.fogRt = this.add.renderTexture(0, 0, 1440, 480);
    this.fogRt.setOrigin(0, 0).setDepth(50);

    // ── 燈塔系統 ──
    this.beaconConfigs = [];
    this.gates = [];

    // 閘門1
    this.setupBeaconGroup(500, [
      { x: 430, y: 370, char: 'nana' },
      { x: 570, y: 370, char: 'bubu' },
    ]);
    // 閘門2
    this.setupBeaconGroup(1000, [
      { x: 930, y: 300, char: 'nana' },
      { x: 1070, y: 300, char: 'bubu' },
    ]);

    // ── 收集品（will_o_wisp = 64x64 原生）──
    this.stars = this.physics.add.staticGroup();
    const wispPos = [
      { x: 100, y: 240, tint: 0xccff66 },
      { x: 480, y: 180, tint: 0x88ffaa },
      { x: 760, y: 220, tint: 0xccff66 },
      { x: 1100, y: 380, tint: 0x88ffaa },
      { x: 1320, y: 240, tint: 0xccff66 },
    ];
    wispPos.forEach(p => {
      const w = this.stars.create(p.x, p.y, 'will_o_wisp');
      w.setTint(p.tint);
      this.tweens.add({ targets: w, alpha: 0.4, duration: 1000, yoyo: true, repeat: -1 });
    });

    // ── 背景粒子（螢火蟲）──
    for (let i = 0; i < 20; i++) {
      const f = this.add.image(
        Phaser.Math.Between(0, 1440),
        Phaser.Math.Between(50, 450),
        'ice_particle'
      );
      f.setScale(1.5).setTint(0xccff66).setAlpha(Phaser.Math.FloatBetween(0.1, 0.4));
      this.tweens.add({
        targets: f, y: f.y + Phaser.Math.Between(-50, 50),
        x: f.x + Phaser.Math.Between(-30, 30), alpha: 0.05,
        duration: Phaser.Math.Between(2000, 4000), yoyo: true, repeat: -1,
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

    this.switchCooldown = 0;
    this.hasDoubleJumped = false;

    // ── 觸控虛擬按鍵 ──
    this.touchLeft = false;
    this.touchRight = false;
    this.touchJump = false;
    this.touchJumpTrigger = false;
    this.touchSwitchTrigger = false;
    this.touchPadVisible = false;
    this._padObjects = null;
    const isTouch = this.sys.game.device.input.touch;
    // 切換按鈕
    this.togglePadBtn = this.add.circle(806, 16, 12, 0x66ff88, 0.5).setScrollFactor(0).setDepth(200).setInteractive();
    this.add.text(806, 16, '⚙', { fontSize: '14px', fill: '#fff', fontFamily: 'monospace' }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
    this.togglePadBtn.on('pointerdown', () => {
      this.touchPadVisible = !this.touchPadVisible;
      if (this.touchPadVisible) this.createVirtualDPad();
      else this.destroyVirtualDPad();
    });
    if (isTouch) {
      this.touchPadVisible = true;
      this.createVirtualDPad();
    }

    // ── 碰撞 ──
    this.physics.add.collider(this.nana, this.platforms);
    this.physics.add.collider(this.bubu, this.platforms);
    this.physics.add.overlap(this.nana, this.stars, this.collectWisp, null, this);
    this.physics.add.overlap(this.bubu, this.stars, this.collectWisp, null, this);

    // ── 相機 ──
    this.cameras.main.startFollow(this.nana, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, 1440, 480);
  }

  setupCharacters(char) {
    char.body.setSize(160, char === this.nana ? 178 : 164);
    char.body.setOffset(0, 0);
    char.setCollideWorldBounds(true);
    char.setDepth(10);
  }

  // ── 燈塔閘門 ──
  setupBeaconGroup(gateX, beacons) {
    // 閘門：用平台當門
    const gate = this.platforms.create(gateX, 240, 'forest_platform');
    gate.setDepth(8);

    // 燈塔標記
    beacons.forEach(b => {
      const color = b.char === 'nana' ? 0x4488ff : 0xff8844;
      const label = b.char === 'nana' ? '🌸 娜娜' : '🐾 布布';

      const base = this.add.circle(b.x, b.y + 20, 10, 0x554444).setDepth(4);
      const light = this.add.circle(b.x, b.y + 5, 12, color).setDepth(5).setAlpha(0.2);
      b._light = light;
      b._gateIdx = this.gates.length;

      this.add.text(b.x, b.y - 22, label, {
        fontSize: '10px', fontFamily: 'monospace', color: '#aaccaa',
      }).setOrigin(0.5).setDepth(6).setAlpha(0.6);

      this.tweens.add({ targets: light, alpha: 0.4, duration: 1500, yoyo: true, repeat: -1 });
    });

    this.beaconConfigs.push({ gateX, beacons, opened: false });
    this.gates.push(gate);
  }

  updateBeacons() {
    this.beaconConfigs.forEach((cfg, gi) => {
      if (cfg.opened) return;
      const gate = this.gates[gi];
      let allLit = true;

      cfg.beacons.forEach(b => {
        const char = b.char === 'nana' ? this.nana : this.bubu;
        const dist = Phaser.Math.Distance.Between(char.x, char.y, b.x, b.y);
        if (dist < 60) {
          b.lit = true;
          b._light.setFillStyle(b.char === 'nana' ? 0x66aaff : 0xffaa66);
          b._light.setAlpha(0.9);
        }
        if (!b.lit) allLit = false;
      });

      if (allLit) {
        cfg.opened = true;
        this.tweens.add({
          targets: gate, alpha: 0, duration: 600,
          onComplete: () => { gate.body.enable = false; gate.setVisible(false); },
        });
      }
    });
  }

  // ── 迷霧 ──
  updateFog() {
    const active = this.activeChar === 'nana' ? this.nana : this.bubu;
    this.fogRt.clear();
    this.fogRt.fill(0x000000, 0.88);
    this.fogRt.erase('fog_clear', active.x - 65, active.y - 65);
  }

  // ── 切換角色 ──
  switchChar(key) {
    if (this.switchCooldown > 0 || this.activeChar === key) return;
    const prev = this.activeChar === 'nana' ? this.nana : this.bubu;
    const next = key === 'nana' ? this.nana : this.bubu;
    const tx = prev.x, ty = prev.y;
    prev.setPosition(next.x, next.y);
    next.setPosition(tx, ty);
    prev.body.setVelocity(0, 0);
    next.body.setVelocity(0, 0);
    this.activeChar = key;
    this.switchCooldown = 30;
    this.hasDoubleJumped = false;
    this.cameras.main.startFollow(next, true, 0.1, 0.1);
    [prev, next].forEach(s => {
      for (let i = 0; i < 6; i++) {
        const p = this.add.circle(s.x, s.y, 3, 0xccff88).setDepth(15);
        this.tweens.add({
          targets: p,
          x: p.x + Phaser.Math.Between(-25, 25),
          y: p.y + Phaser.Math.Between(-25, 25),
          alpha: 0, scale: 0, duration: 350,
          onComplete: () => p.destroy(),
        });
      }
    });
  }

  // ── 收集鬼火 ──
  collectWisp(char, star) {
    star.destroy();
    if (this.stars.countActive() === 0) {
      this.fogRt.clear();
      this.add.rectangle(720, 240, 1440, 480, 0x000000, 0.7).setDepth(90);
      const txt = this.add.text(720, 200, '🌲 幽靈森林通關！ 🌲', {
        fontSize: '28px', fill: '#66ff88', fontFamily: 'monospace',
      }).setOrigin(0.5).setDepth(91);
      this.tweens.add({ targets: txt, scaleX: 1.1, scaleY: 1.1, duration: 800, yoyo: true, repeat: -1 });
      this.add.text(720, 260, '📋 選關卡', {
        fontSize: '20px', fill: '#66ff88', fontFamily: 'monospace',
        backgroundColor: '#1a4a2a', padding: { x: 14, y: 8 },
      }).setOrigin(0.5).setDepth(91).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.scene.start('LevelSelectScene'));
    }
  }

  // ── 虛擬觸控按鍵 ──
  createVirtualDPad() {
    if (this._padObjects && this._padObjects.length > 0) return;
    this._padObjects = [];
    const add = (o) => { o.setScrollFactor(0).setDepth(100); this._padObjects.push(o); return o; };
    const a = 0.35, c = 0x66ff88, s = 48;

    add(this.add.circle(60, 420, s, c, a));
    add(this.add.circle(160, 420, s, c, a));
    add(this.add.circle(740, 380, s, c, a));
    add(this.add.circle(770, 290, s/1.3, c, a));

    const st = { fontSize:'20px', fill:'#fff', fontFamily:'monospace' };
    add(this.add.text(60,420,'◀',st).setDepth(101));
    add(this.add.text(160,420,'▶',st).setDepth(101));
    add(this.add.text(740,380,'▲',st).setDepth(101));
    add(this.add.text(770,290,'⇄',{...st,fontSize:'18px'}).setDepth(101));

    if (!this._touchEventsBound) {
      this._touchEventsBound = true;
      this.input.on('pointerdown', (p) => {
        if (!this.touchPadVisible) return;
        const x=p.x, y=p.y;
        if (Phaser.Math.Distance.Between(x,y,60,420)<s) this.touchLeft=true;
        if (Phaser.Math.Distance.Between(x,y,160,420)<s) this.touchRight=true;
        if (Phaser.Math.Distance.Between(x,y,740,380)<s){this.touchJump=true;this.touchJumpTrigger=true;}
        if (Phaser.Math.Distance.Between(x,y,770,290)<s/1.3) this.touchSwitchTrigger=true;
      });
      this.input.on('pointerup',()=>{this.touchLeft=false;this.touchRight=false;this.touchJump=false;});
    }
  }

  destroyVirtualDPad() {
    if (this._padObjects) { this._padObjects.forEach(o=>o.destroy()); this._padObjects=null; }
    this.touchLeft=false; this.touchRight=false; this.touchJump=false;
  }

  // ── 更新 ──
  update() {
    const active = this.activeChar === 'nana' ? this.nana : this.bubu;
    const isNana = this.activeChar === 'nana';
    const body = active.body;
    const onGround = body.blocked.down || body.touching.down;

    if (this.switchCooldown > 0) this.switchCooldown--;

    const left = this.cursors.left.isDown || this.keyA.isDown || this.touchLeft;
    const right = this.cursors.right.isDown || this.keyD.isDown || this.touchRight;
    const speed = 200;

    if (left) { body.setVelocityX(-speed); active.setFlipX(true); }
    else if (right) { body.setVelocityX(speed); active.setFlipX(false); }
    else { body.setVelocityX(0); }

    const prefix = this.activeChar === 'nana' ? 'nana' : 'bubu';
    const cur = active.anims.currentAnim?.key;
    if (!onGround) { if (cur !== `${prefix}_jump`) active.play(`${prefix}_jump`); }
    else if (left || right) { if (cur !== `${prefix}_run`) active.play(`${prefix}_run`); }
    else { if (cur !== `${prefix}_idle`) active.play(`${prefix}_idle`); }

    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up)
      || Phaser.Input.Keyboard.JustDown(this.keyW) || this.touchJumpTrigger;
    if (this.touchJumpTrigger) this.touchJumpTrigger = false;
    if (jumpPressed && onGround) body.setVelocityY(-400);
    else if (jumpPressed && !onGround && isNana && !this.hasDoubleJumped) {
      body.setVelocityY(-350);
      this.hasDoubleJumped = true;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyQ))
      this.switchChar(this.activeChar === 'nana' ? 'bubu' : 'nana');
    if (Phaser.Input.Keyboard.JustDown(this.keyOne)) this.switchChar('nana');
    if (Phaser.Input.Keyboard.JustDown(this.keyTwo)) this.switchChar('bubu');
    if (this.touchSwitchTrigger) {
      this.touchSwitchTrigger = false;
      this.switchChar(this.activeChar === 'nana' ? 'bubu' : 'nana');
    }

    // 跟隨者
    const follower = this.activeChar === 'nana' ? this.bubu : this.nana;
    const fBody = follower.body;
    const fGround = fBody.blocked.down || fBody.touching.down;
    const dx = active.x - follower.x, dy = active.y - follower.y;

    if (Math.abs(dx) > 60 && fGround) {
      fBody.setVelocityX(dx > 0 ? 180 : -180);
      follower.setFlipX(dx < 0);
    } else if (fGround) fBody.setVelocityX(0);
    if (dy < -80 && fGround) fBody.setVelocityY(-400);
    if (follower.y > 500) { follower.setPosition(active.x - 30, active.y - 20); fBody.setVelocity(0, 0); }

    // 掉落重置
    if (active.y > 500) {
      this.nana.setPosition(100, 118);
      this.bubu.setPosition(70, 118);
      this.cameras.main.startFollow(this.activeChar === 'nana' ? this.nana : this.bubu, true, 0.1, 0.1);
    }

    this.crystalBall.setPosition(active.x + 20, active.y - 40);
    this.updateFog();
    this.updateBeacons();
  }
}
