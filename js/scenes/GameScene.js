// GameScene — 主要遊戲場景（動畫版）

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // ── 角色縮放比例（新 sprites 160x178，適合 832x480 的世界）──
    this.CHAR_SCALE = 0.5;

    // ── 背景星空 ──
    this.cameras.main.setBackgroundColor('#0a0a2e');
    for (let i = 0; i < 50; i++) {
      const star = this.add.image(
        Phaser.Math.Between(0, 832),
        Phaser.Math.Between(0, 480),
        'star'
      );
      star.setAlpha(Phaser.Math.FloatBetween(0.2, 0.8));
      star.setScale(Phaser.Math.FloatBetween(0.3, 1));
    }

    // ── 魔法粒子背景動畫 ──
    for (let i = 0; i < 15; i++) {
      const p = this.add.image(
        Phaser.Math.Between(0, 832),
        Phaser.Math.Between(0, 480),
        'particle'
      );
      p.setAlpha(0.4);
      p.setScale(Phaser.Math.FloatBetween(0.5, 1.5));
      this.tweens.add({
        targets: p,
        y: p.y - Phaser.Math.Between(50, 150),
        alpha: 0,
        duration: Phaser.Math.Between(2000, 4000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000)
      });
    }

    // ── 平台群組 ──
    this.platforms = this.physics.add.staticGroup();

    // 地面平台
    const ground = this.platforms.create(416, 464, 'platform');
    ground.setScale(832 / 64, 1).refreshBody();
    ground.setDisplaySize(832, 16);

    // 星雲森林關卡平台
    const levelData = [
      { x: 200, y: 380 },
      { x: 350, y: 320 },
      { x: 500, y: 380 },
      { x: 150, y: 260 },
      { x: 400, y: 220 },
      { x: 600, y: 280 },
      { x: 700, y: 360 },
      { x: 300, y: 160 },
      { x: 550, y: 140 },
      { x: 750, y: 220 },
      { x: 100, y: 160 },
      { x: 650, y: 80 },
    ];

    levelData.forEach(d => {
      const p = this.platforms.create(d.x, d.y, 'platform');
      p.refreshBody();
    });

    // ── 收集品：星靈碎片 ──
    this.stars = this.physics.add.staticGroup();
    const starPositions = [
      { x: 200, y: 350 },
      { x: 380, y: 190 },
      { x: 600, y: 250 },
    ];
    starPositions.forEach(pos => {
      const s = this.stars.create(pos.x, pos.y, 'star');
      s.setScale(1.5);
      s.setTint(0xffd700);
      this.tweens.add({
        targets: s,
        scaleX: 2,
        scaleY: 2,
        duration: 800,
        yoyo: true,
        repeat: -1
      });
    });

    // ── 娜娜（動畫 sprite）──
    // 初始站在地面：地面 surface = 456，角色腳底放在地面
    this.nana = this.physics.add.sprite(100, 412, 'nana_sprites', 0);
    this.nana.setScale(this.CHAR_SCALE);
    this.nana.setCollideWorldBounds(true);
    this.nana.setFlipX(false);  // 新 spritesheet 預設朝右，無需翻轉
    // body 等於 sprite 顯示尺寸，確保腳底對齊地面
    this.nana.body.setSize(160, 178);
    this.nana.body.setOffset(0, 0);

    // 水晶球特效
    this.crystalBall = this.add.image(120, 390, 'crystal_ball');
    this.tweens.add({
      targets: this.crystalBall,
      y: 385,
      x: 125,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // ── 布布（動畫 sprite）──
    this.bubu = this.physics.add.sprite(70, 412, 'bubu_sprites', 0);
    this.bubu.setScale(this.CHAR_SCALE);
    this.bubu.setCollideWorldBounds(true);
    this.bubu.setFlipX(false);  // 新 spritesheet 預設朝右
    this.bubu.body.setSize(160, 164);
    this.bubu.body.setOffset(0, 0);

    // ── 碰撞設定 ──
    this.physics.add.collider(this.nana, this.platforms);
    this.physics.add.collider(this.bubu, this.platforms);
    this.physics.add.overlap(this.nana, this.stars, this.collectStar, null, this);

    // ── 按鍵輸入 ──
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.keyESC = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // ── 觸控虛擬按鍵 ──
    this.touchLeft = false;
    this.touchRight = false;
    this.touchJump = false;
    this.touchShoot = false;
    this.touchPadVisible = false;
    this._padObjects = null;
    const isTouch = this.sys.game.device.input.touch;
    // 切換按鈕（齒輪）
    this.togglePadBtn = this.add.circle(806, 16, 12, 0x9b59b6, 0.6).setScrollFactor(0).setDepth(200).setInteractive();
    this.add.text(806, 16, '⚙', { fontSize: '14px', fill: '#fff', fontFamily: 'monospace' }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
    this.togglePadBtn.on('pointerdown', () => {
      this.touchPadVisible = !this.touchPadVisible;
      if (this.touchPadVisible) this.createVirtualDPad();
      else this.destroyVirtualDPad();
    });
    // 觸控裝置或設定已啟用才自動開
    if (isTouch || this._padEnabled) {
      this.touchPadVisible = true;
      this.createVirtualDPad();
    }

    // ── 狀態 ──
    this.canDoubleJump = false;
    this.hasDoubleJumped = false;
    this.score = 0;
    this.wasOnGround = true;  // 地面滯後用

    // ── UI ──
    this.scoreText = this.add.text(16, 16, '星靈碎片: 0 / 3', {
      fontSize: '16px', fill: '#d5a6e8', fontFamily: 'monospace'
    });
    this.titleText = this.add.text(416, 16, '星雲森林', {
      fontSize: '14px', fill: '#9b59b6', fontFamily: 'monospace'
    }).setOrigin(0.5, 0);

    // ── 相機 ──
    this.cameras.main.startFollow(this.nana, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, 832, 480);

    this.gameWon = false;
  }

  update() {
    if (this.gameWon) return;

    const body = this.nana.body;
    const speed = 200;

    // ── 地面檢測（含滯後避免快速切換）──
    const onGround = body.blocked.down || body.touching.down;

    if (onGround) {
      this.canDoubleJump = true;
      this.hasDoubleJumped = false;
      this.wasOnGround = true;
    } else {
      // 在空中連續 5 幀以上才觸發空中動畫
      if (this.wasOnGround) {
        this.airFrameCount = (this.airFrameCount || 0) + 1;
        if (this.airFrameCount > 3) this.wasOnGround = false;
      }
    }
    if (onGround) this.airFrameCount = 0;

    // ── 娜娜移動（鍵盤 + 觸控）──
    const leftDown  = this.cursors.left.isDown  || this.touchLeft;
    const rightDown = this.cursors.right.isDown || this.touchRight;
    const jumpDown  = this.cursors.up.isDown    || this.keyW.isDown || this.touchJump;

    if (leftDown) {
      body.setVelocityX(-speed);
      this.nana.setFlipX(true);   // 左移：翻轉朝左
    } else if (rightDown) {
      body.setVelocityX(speed);
      this.nana.setFlipX(false);  // 右移：維持朝右
    } else {
      body.setVelocityX(0);
    }

    // ── 動畫切換（只有不同才切）──
    const cur = this.nana.anims.currentAnim?.key;
    if (onGround || this.wasOnGround) {
      this.airFrameCount = 0;
      if (Math.abs(body.velocity.x) > 10) {
        if (cur !== 'nana_run') this.nana.play('nana_run');
      } else {
        if (cur !== 'nana_idle') this.nana.play('nana_idle');
      }
    } else {
      if (this.hasDoubleJumped) {
        if (cur !== 'nana_jump') this.nana.play('nana_jump');
      } else {
        if (cur !== 'nana_jump') this.nana.play('nana_jump');
      }
    }

    // ── 娜娜跳躍 + 二段跳（鍵盤 + 觸控）──
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.keyW) || this.touchJumpTrigger) {
      this.touchJumpTrigger = false;
      if (onGround) {
        body.setVelocityY(-400);
      } else if (this.canDoubleJump && !this.hasDoubleJumped) {
        body.setVelocityY(-350);
        this.hasDoubleJumped = true;
        this.nana.play('nana_doublejump');
        this.createJumpEffect(this.nana.x, this.nana.y + 10);
      }
    }

    // ── 水晶球跟隨 ──
    this.crystalBall.x = this.nana.x + (this.nana.flipX ? 16 : -16);
    this.crystalBall.y = this.nana.y - 4;

    // ── 布布 AI ──
    const bubuBody = this.bubu.body;
    const distX = this.nana.x - this.bubu.x;
    const distY = this.nana.y - this.bubu.y;
    const bubuGround = bubuBody.blocked.down || bubuBody.touching.down;
    const bcu = this.bubu.anims.currentAnim?.key;

    // 布布跟隨娜娜（含滯後區間防閃爍）
    if (this.bubu._followState === undefined) this.bubu._followState = 'idle';

    if (distX > 60) {
      bubuBody.setVelocityX(150);
      this.bubu.setFlipX(false);  // 朝右
      this.bubu._followState = 'run';
    } else if (distX < -60) {
      bubuBody.setVelocityX(-150);
      this.bubu.setFlipX(true);   // 朝左
      this.bubu._followState = 'run';
    } else if (this.bubu._followState === 'run' && Math.abs(distX) > 20) {
      // 滯後：正在跑時，距離縮到 20 內才停
      bubuBody.setVelocityX(distX > 0 ? 150 : -150);
      this.bubu.setFlipX(distX < 0);
    } else {
      bubuBody.setVelocityX(0);
      this.bubu._followState = 'idle';
    }

    if (bubuGround) {
      if (this.bubu._followState === 'run') {
        if (bcu !== 'bubu_run') this.bubu.play('bubu_run');
      } else {
        if (bcu !== 'bubu_idle') this.bubu.play('bubu_idle');
      }
    }

    if (Math.abs(distY) > 20 && Math.random() < 0.02) {
      if (bubuGround) {
        bubuBody.setVelocityY(-350);
        this.bubu.play('bubu_jump');
      }
    }

    if (!bubuGround && bcu !== 'bubu_jump') {
      this.bubu.play('bubu_jump');
    }

    if (this.bubu.y > 500) {
      this.bubu.setPosition(this.nana.x - 30, this.nana.y - 20);
      bubuBody.setVelocity(0, 0);
    }

    // ── Z 鍵 / 觸控 魔法彈 ──
    if (Phaser.Input.Keyboard.JustDown(this.keyZ) || this.touchShootTrigger) {
      this.touchShootTrigger = false;
      this.shootMagic();
    }
    // ── ESC 暫停 ──
    if (Phaser.Input.Keyboard.JustDown(this.keyESC)) {
      this.scene.pause();
    }
  }
  // ── 虛擬 D-Pad（觸控用）──
  createVirtualDPad() {
    if (this._padObjects && this._padObjects.length > 0) return;
    this._padObjects = [];
    const btnAlpha = 0.35;
    const btnColor = 0xd5a6e8;
    const btnSize = 48;
    const add = (o) => { this._padObjects.push(o); return o; };

    add(this.add.circle(60, 420, btnSize, btnColor, btnAlpha).setScrollFactor(0).setDepth(100));
    add(this.add.circle(160, 420, btnSize, btnColor, btnAlpha).setScrollFactor(0).setDepth(100));
    add(this.add.circle(740, 380, btnSize, btnColor, btnAlpha).setScrollFactor(0).setDepth(100));
    add(this.add.circle(770, 300, btnSize/1.3, btnColor, btnAlpha).setScrollFactor(0).setDepth(100));

    const style = { fontSize: '20px', fill: '#ffffff', fontFamily: 'monospace' };
    add(this.add.text(60, 420, '◀', style).setOrigin(0.5).setScrollFactor(0).setDepth(101));
    add(this.add.text(160, 420, '▶', style).setOrigin(0.5).setScrollFactor(0).setDepth(101));
    add(this.add.text(740, 380, '▲', style).setOrigin(0.5).setScrollFactor(0).setDepth(101));
    add(this.add.text(770, 300, '⚡', { fontSize: '16px', fill: '#ffd700', fontFamily: 'monospace' }).setOrigin(0.5).setScrollFactor(0).setDepth(101));

    // 觸控事件（只綁一次）
    if (!this._touchEventsBound) {
      this._touchEventsBound = true;
      this.input.on('pointerdown', (pointer) => {
        if (!this.touchPadVisible) return;
        const x = pointer.x, y = pointer.y;
        if (Phaser.Math.Distance.Between(x, y, 60, 420) < btnSize) this.touchLeft = true;
        if (Phaser.Math.Distance.Between(x, y, 160, 420) < btnSize) this.touchRight = true;
        if (Phaser.Math.Distance.Between(x, y, 740, 380) < btnSize) { this.touchJump = true; this.touchJumpTrigger = true; }
        if (Phaser.Math.Distance.Between(x, y, 770, 300) < btnSize/1.3) { this.touchShootTrigger = true; }
      });
      this.input.on('pointerup', () => {
        this.touchLeft = false;
        this.touchRight = false;
        this.touchJump = false;
      });
    }
  }

  destroyVirtualDPad() {
    if (this._padObjects) {
      this._padObjects.forEach(o => o.destroy());
      this._padObjects = null;
    }
    this.touchLeft = false;
    this.touchRight = false;
    this.touchJump = false;
  }

  createJumpEffect(x, y) {
    for (let i = 0; i < 6; i++) {
      const p = this.add.image(x, y, 'particle');
      p.setTint(0xd5a6e8);
      p.setScale(Phaser.Math.FloatBetween(0.5, 1));
      this.tweens.add({
        targets: p,
        x: x + Phaser.Math.Between(-20, 20),
        y: y + Phaser.Math.Between(-20, 0),
        alpha: 0, scale: 0,
        duration: 500,
        onComplete: () => p.destroy()
      });
    }
  }

  shootMagic() {
    const dir = this.nana.flipX ? -1 : 1;
    const bx = this.nana.x + dir * 20;
    const by = this.nana.y;
    const ball = this.add.image(bx, by, 'crystal_ball');
    ball.setScale(0.8);
    ball.setTint(0x9b59b6);
    this.tweens.add({
      targets: ball,
      x: bx + dir * 200,
      duration: 600,
      onComplete: () => ball.destroy()
    });
  }

  collectStar(nana, star) {
    star.destroy();
    this.score++;
    this.scoreText.setText(`星靈碎片: ${this.score} / 3`);

    this.createJumpEffect(star.x, star.y);
    for (let i = 0; i < 8; i++) {
      const p = this.add.image(star.x, star.y, 'star');
      p.setTint(0xffd700);
      p.setScale(0.5);
      this.tweens.add({
        targets: p,
        x: p.x + Phaser.Math.Between(-30, 30),
        y: p.y + Phaser.Math.Between(-30, 30),
        alpha: 0, scale: 0,
        duration: 600,
        onComplete: () => p.destroy()
      });
    }

    if (this.score >= 3) {
      this.gameWon = true;
      this.showVictory();
    }
  }

  showVictory() {
    this.add.rectangle(416, 240, 832, 480, 0x000000, 0.7);
    const text = this.add.text(416, 200, '✨ 星雲森林通關！ ✨', {
      fontSize: '28px', fill: '#d5a6e8', fontFamily: 'monospace'
    }).setOrigin(0.5);
    this.add.text(416, 250, '星靈碎片已收集，前往下一個世界...', {
      fontSize: '14px', fill: '#9b59b6', fontFamily: 'monospace'
    }).setOrigin(0.5);
    this.tweens.add({
      targets: text, scaleX: 1.1, scaleY: 1.1,
      duration: 800, yoyo: true, repeat: -1
    });
  }
}
