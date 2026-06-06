// CrystalCavernScene — 💎 水晶洞窟（第二關）
// 向下探索型關卡，特色：崩塌平台 + 冰晶收集

class CrystalCavernScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CrystalCavernScene' });
  }

  create() {
    // ── 角色縮放 ──
    this.CHAR_SCALE = 0.5;

    // ── 水晶洞窟背景 ──
    this.add.image(416, 240, 'cavern_bg')
      .setScrollFactor(0.3)
      .setDepth(0);
      for (let i = 0; i < 30; i++) {
      const p = this.add.image(
        Phaser.Math.Between(0, 832),
        Phaser.Math.Between(-50, 580),
        'ice_particle'
      );
      p.setAlpha(Phaser.Math.FloatBetween(0.2, 0.6));
      p.setScale(Phaser.Math.FloatBetween(0.5, 1.5));
      p.setTint(0x88ddff);
      this.tweens.add({
        targets: p,
        y: p.y + Phaser.Math.Between(30, 80),
        alpha: 0,
        duration: Phaser.Math.Between(3000, 5000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000)
      });
    }

    // 背景水晶柱裝飾
    for (let i = 0; i < 8; i++) {
      const pillar = this.add.rectangle(
        Phaser.Math.Between(20, 800),
        Phaser.Math.Between(-30, 550),
        8, Phaser.Math.Between(40, 120),
        0x3366aa, 0.2
      );
      this.tweens.add({
        targets: pillar,
        alpha: 0.4,
        duration: Phaser.Math.Between(2000, 4000),
        yoyo: true,
        repeat: -1
      });
    }

    // ── 平台群組 ──
    this.platforms = this.physics.add.staticGroup();
    // 崩塌平台群組
    this.crackedPlatforms = this.physics.add.staticGroup();

    // 入口高處平台
    const ground = this.platforms.create(416, 140, 'crystal_platform');
    ground.setDisplaySize(832, 16);
    ground.refreshBody();

    // 間距拉大到 130px（跳得下也跳得上）
    // 按下鍵可以穿過平台往下掉
    const levelData = [
      // 第一階
      { x: 150, y: 270, cracked: false },
      { x: 350, y: 270, cracked: true },
      { x: 550, y: 270, cracked: false },

      // 第二階
      { x: 200, y: 400, cracked: false },
      { x: 400, y: 400, cracked: true },
      { x: 600, y: 400, cracked: false },

      // 最底層
      { x: 250, y: 492, cracked: false },
      { x: 550, y: 492, cracked: false },
    ];

    levelData.forEach(d => {
      const textureKey = d.cracked ? 'cracked_platform' : 'crystal_platform';
      const p = this.platforms.create(d.x, d.y, textureKey);
      p.refreshBody();
      // 崩塌平台標記
      if (d.cracked) {
        p.setData('cracked', true);
        p.setData('touched', false);
        p.setData('collapseTimer', 0);
      }
    });

    // ── 收集品：水晶碎片 ──
    this.stars = this.physics.add.staticGroup();
    const shardPositions = [
      { x: 350, y: 260 },   // 第一階崩塌平台旁邊
      { x: 400, y: 390 },   // 第二階崩塌平台旁邊
      { x: 550, y: 482 },   // 最底層
    ];
    shardPositions.forEach(pos => {
      const s = this.stars.create(pos.x, pos.y, 'crystal_shard');
      s.setTint(0x44ddff);
      this.tweens.add({
        targets: s,
        scaleX: 2,
        scaleY: 2,
        duration: 800,
        yoyo: true,
        repeat: -1
      });
    });

    // ── 角色 ──
    // 角色
    this.nana = this.physics.add.sprite(100, 88, 'nana_sprites', 0);
    this.nana.setScale(this.CHAR_SCALE);
    this.nana.setCollideWorldBounds(true);
    this.nana.setFlipX(false);
    this.nana.body.setSize(90, 165);
    this.nana.body.setOffset(35, 13);

    this.bubu = this.physics.add.sprite(70, 88, 'bubu_sprites', 0);
    this.bubu.setScale(this.CHAR_SCALE);
    this.bubu.setCollideWorldBounds(true);
    this.bubu.setFlipX(false);
    this.bubu.body.setSize(90, 155);
    this.bubu.body.setOffset(35, 9);

    // 水晶球跟隨娜娜
    // 水晶球跟隨娜娜
    this.crystalBall = this.add.image(120, 75, 'crystal_ball_sd');
    this.crystalBall.setScale(0.0625);

    // ── 碰撞設定（含穿過平台往下掉）──
    this._nanaDrop = 0;
    this._bubuDrop = 0;
    this.physics.add.collider(this.nana, this.platforms, null, (nana, plat) => {
      return this._nanaDrop <= 0;
    });
    this.physics.add.collider(this.bubu, this.platforms, null, (bubu, plat) => {
      return this._bubuDrop <= 0;
    });
    // 🎯 角色間碰撞
    this.physics.add.collider(this.nana, this.bubu);
    this.physics.add.overlap(this.nana, this.stars, this.collectShard, null, this);
    this.physics.add.overlap(this.bubu, this.stars, this.collectShard, null, this);

    // ── 按鍵 ──
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S); // 往下掉
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.keyESC = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.keyQ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.key1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    this.key2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    // ── 雙角色系統 ──
    this.activeChar = 'nana';
    this.switchCooldown = 0;

    // ── 觸控 ──
    this.touchLeft = false;
    this.touchRight = false;
    this.touchJump = false;
    this.touchShoot = false;
    this.touchShootTrigger = false;
    this.touchJumpTrigger = false;
    this.touchSwitchTrigger = false;
    this.touchDownTrigger = false;
    this.touchPadVisible = false;
    this._padObjects = null;
    const isTouch = this.sys.game.device.input.touch;
    this.togglePadBtn = this.add.circle(806, 16, 12, 0x4488cc, 0.6).setScrollFactor(0).setDepth(200).setInteractive();
    this.add.text(806, 16, '⚙', { fontSize: '14px', fill: '#fff', fontFamily: 'monospace' }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
    this.togglePadBtn.on('pointerdown', () => {
      this.touchPadVisible = !this.touchPadVisible;
      if (this.touchPadVisible) this.createVirtualDPad();
      else this.destroyVirtualDPad();
    });
    if (isTouch || this._padEnabled) {
      this.touchPadVisible = true;
      this.createVirtualDPad();
    }

    // ── 角色狀態 ──
    this.canDoubleJump = false;
    this.hasDoubleJumped = false;
    this.score = 0;
    this.wasOnGround = true;
    this._prevOnGround = true;
    this.airFrameCount = 0;
    this._justLeftGround = false;
    this.landingCooldowns = {};
    this.dashCooldown = 0;
    this.jumpBufferTimer = 0;
    this.followerJumpCooldown = 0;
    this.isPaused = false;

    // ── UI ──
    this.scoreText = this.add.text(16, 16, '💠 水晶碎片: 0 / 3', {
      fontSize: '16px', fill: '#88ddff', fontFamily: 'monospace'
    });
    this.titleText = this.add.text(416, 16, '💎 水晶洞窟', {
      fontSize: '14px', fill: '#4499cc', fontFamily: 'monospace'
    }).setOrigin(0.5, 0);

    // 角色切換指示器
    this.charSwitchText = this.add.text(700, 16, '▸ 娜娜  ◇ 布布', {
      fontSize: '12px', fill: '#88ddff', fontFamily: 'monospace', backgroundColor: '#0a0a3e88', padding: { x: 6, y: 2 }
    });
    this.charSwitchBtn = this.add.text(760, 36, '［Q/1/2 切換］', {
      fontSize: '10px', fill: '#4499cc', fontFamily: 'monospace'
    });

    // 衝刺冷卻條
    this.dashStatusBg = this.add.rectangle(16, 56, 100, 8, 0x1a1a4e, 0.6).setOrigin(0, 0.5);
    this.dashStatusBar = this.add.rectangle(16, 56, 100, 8, 0x4488cc, 1).setOrigin(0, 0.5);
    this.dashStatusText = this.add.text(120, 56, '衝刺', {
      fontSize: '10px', fill: '#4488cc', fontFamily: 'monospace'
    }).setOrigin(0, 0.5);

    // ── 相機（往下探索，跟上角色）──
    this.cameras.main.startFollow(this.nana, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, -50, 832, 620);
    this.physics.world.setBounds(0, -50, 832, 620);

    // ── 崩塌平台狀態記錄 ──
    this._crackingPlatforms = []; // 正在崩塌中的平台

    this.gameWon = false;
  }

  update() {
    if (this.gameWon) return;

    // ESC 暫停
    if (Phaser.Input.Keyboard.JustDown(this.keyESC)) {
      this.togglePause();
      return;
    }
    if (this.isPaused) return;

    // R 重新開始
    if (Phaser.Input.Keyboard.JustDown(this.keyR)) {
      this.scene.restart();
      return;
    }

    const speed = 200;
    const dashCooldownFrames = 60;

    // ── 冷卻計時器 ──
    if (this.switchCooldown > 0) this.switchCooldown--;
    if (this.dashCooldown > 0) this.dashCooldown--;
    if (this.jumpBufferTimer > 0) this.jumpBufferTimer--;
    if (this.followerJumpCooldown > 0) this.followerJumpCooldown--;

    // ── 崩塌平台邏輯 ──
    this.updateCrackingPlatforms();

    // ── 控制角色 ──
    let active = (this.activeChar === 'nana') ? this.nana : this.bubu;
    let isNana = (active === this.nana);

    // ── 角色切換 ──
    const wantSwitch = Phaser.Input.Keyboard.JustDown(this.keyQ)
      || Phaser.Input.Keyboard.JustDown(this.key1)
      || Phaser.Input.Keyboard.JustDown(this.key2)
      || this.touchSwitchTrigger;
    if (wantSwitch && this.switchCooldown === 0) {
      this.touchSwitchTrigger = false;
      this.activeChar = (this.activeChar === 'nana') ? 'bubu' : 'nana';
      this.switchCooldown = 15;
      this.canDoubleJump = false;
      this.hasDoubleJumped = false;
      this.wasOnGround = true;
      this.airFrameCount = 0;
      this.jumpBufferTimer = 0;

      active = (this.activeChar === 'nana') ? this.nana : this.bubu;
      isNana = (active === this.nana);

      this.nana.body.setVelocity(0, 0);
      this.bubu.body.setVelocity(0, 0);

      this.charSwitchText.setText(
        this.activeChar === 'nana' ? '▸ 娜娜  ◇ 布布' : '◇ 娜娜  ▸ 布布'
      );
      this.createSwitchEffect(active);
    }

    const activeBody = active.body;

    // ── 地面檢測 ──
    const onGround = activeBody.blocked.down || activeBody.touching.down;
    const justLanded = !this._prevOnGround && onGround;
    this._prevOnGround = onGround;

    if (onGround) {
      this.canDoubleJump = true;
      this.hasDoubleJumped = false;
      this.wasOnGround = true;
      this.airFrameCount = 0;
      this._justLeftGround = false;
    } else if (this.wasOnGround) {
      this._justLeftGround = true;
    }
    if (onGround) this.airFrameCount = 0;
    if (this._justLeftGround && this.airFrameCount === 1) {
      this.jumpBufferTimer = 6;
    }

    // 🎯 落地塵埃
    if (justLanded) {
      const ck = isNana ? 'nana' : 'bubu';
      if (!this.landingCooldowns[ck]) {
        this.landingCooldowns[ck] = true;
        this.createLandingDust(active.x, active.y + 20);
        setTimeout(() => { this.landingCooldowns[ck] = false; }, 200);
      }
    }

    // ── 移動 ──
    const leftDown  = this.cursors.left.isDown  || this.touchLeft;
    const rightDown = this.cursors.right.isDown || this.touchRight;

    if (leftDown) {
      activeBody.setVelocityX(-speed);
      active.setFlipX(true);
    } else if (rightDown) {
      activeBody.setVelocityX(speed);
      active.setFlipX(false);
    } else {
      activeBody.setVelocityX(0);
    }

    // ── 動畫 ──
    const cur = active.anims.currentAnim?.key;
    const runAnim  = isNana ? 'nana_run'  : 'bubu_run';
    const idleAnim = isNana ? 'nana_idle' : 'bubu_idle';
    const jumpAnim = isNana ? 'nana_jump' : 'bubu_jump';

    if (onGround || this.wasOnGround) {
      this.airFrameCount = 0;
      if (Math.abs(activeBody.velocity.x) > 10) {
        if (cur !== runAnim) active.play(runAnim);
      } else {
        if (cur !== idleAnim) active.play(idleAnim);
      }
    } else {
      if (cur !== jumpAnim) active.play(jumpAnim);
    }

    // ── 跳躍 ──
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up)
      || Phaser.Input.Keyboard.JustDown(this.keyW)
      || this.touchJumpTrigger;
    if (jumpPressed) {
      this.touchJumpTrigger = false;
      const canGroundJump = onGround || this.jumpBufferTimer > 0;
      if (canGroundJump) {
        activeBody.setVelocityY(-400);
        this.jumpBufferTimer = 0;
      } else if (this.canDoubleJump && !this.hasDoubleJumped) {
        // 二段跳（娜娜 & 布布都有）
        activeBody.setVelocityY(-350);
        this.hasDoubleJumped = true;
        active.play(isNana ? 'nana_doublejump' : 'bubu_doublejump');
        this.createJumpEffect(active.x, active.y + 10);
      }
    }

    // ── 按 ↓/S 穿過平台往下掉 ──
    // 兩個角色的掉落倒數都跑
    if (this._nanaDrop > 0) this._nanaDrop--;
    if (this._bubuDrop > 0) this._bubuDrop--;
    if (isNana) {
      if (onGround && (Phaser.Input.Keyboard.JustDown(this.cursors.down) || Phaser.Input.Keyboard.JustDown(this.keyS) || this.touchDownTrigger)) {
        this.touchDownTrigger = false;
        this._nanaDrop = 10;
        activeBody.setVelocityY(100);
        this._bubuDrop = 10;  // 布布也一起掉
        this.bubu.body.setVelocityY(100);
      }
    } else {
      if (onGround && (Phaser.Input.Keyboard.JustDown(this.cursors.down) || Phaser.Input.Keyboard.JustDown(this.keyS) || this.touchDownTrigger)) {
        this.touchDownTrigger = false;
        this._bubuDrop = 10;
        activeBody.setVelocityY(100);
        this._nanaDrop = 10;  // 娜娜也一起掉
        this.nana.body.setVelocityY(100);
      }
    }

    // ── 空中衝刺 ──
    if (isNana && !onGround && Phaser.Input.Keyboard.JustDown(this.keyZ) && this.dashCooldown === 0) {
      const dashDir = active.flipX ? -1 : 1;
      activeBody.setVelocityX(dashDir * 350);
      activeBody.setVelocityY(0);
      this.dashCooldown = dashCooldownFrames;
      this.createJumpEffect(active.x, active.y);
    }

    // 冷卻 UI
    const dashPct = this.dashCooldown / dashCooldownFrames;
    this.dashStatusBar.setDisplaySize(100 * (1 - dashPct), 8);
    this.dashStatusBar.setFillStyle(dashPct > 0.5 ? 0x4488cc : dashPct > 0.2 ? 0xe67e22 : 0xe74c3c);

    // ── 布布爬牆 ──
    if (!isNana) {
      const touchingWall = activeBody.blocked.left || activeBody.blocked.right;
      if (touchingWall && !onGround) {
        const wallDir = activeBody.blocked.left ? 'left' : 'right';
        if ((wallDir === 'left' && leftDown) || (wallDir === 'right' && rightDown)) {
          activeBody.setVelocityY(-60);
          if (cur !== 'bubu_jump') active.play('bubu_jump');
          this.createWallDust(active.x, active.y, wallDir);
        }
        if (activeBody.velocity.y > 0) {
          activeBody.setVelocityY(activeBody.velocity.y * 0.6);
        }
      }
    }

    // ── 水晶球 ──
    this.crystalBall.x = this.nana.x + (this.nana.flipX ? 16 : -16);
    this.crystalBall.y = this.nana.y - 4;

    // ── 相機 ──
    this.cameras.main.startFollow(active, true, 0.1, 0.1);

    // ── 非控制角色的 AI 跟隨 ──
    const follower = (this.activeChar === 'nana') ? this.bubu : this.nana;
    const fBody = follower.body;
    const fGround = fBody.blocked.down || fBody.touching.down;
    const distX = active.x - follower.x;
    const distY = active.y - follower.y;
    const fcu = follower.anims.currentAnim?.key;
    const isFollowerNana = (follower === this.nana);
    const fRun  = isFollowerNana ? 'nana_run'  : 'bubu_run';
    const fIdle = isFollowerNana ? 'nana_idle' : 'bubu_idle';
    const fJump = isFollowerNana ? 'nana_jump' : 'bubu_jump';

    if (follower._followState === undefined) follower._followState = 'idle';

    if (distX > 60) {
      fBody.setVelocityX(150);
      follower.setFlipX(false);
      follower._followState = 'run';
    } else if (distX < -60) {
      fBody.setVelocityX(-150);
      follower.setFlipX(true);
      follower._followState = 'run';
    } else if (follower._followState === 'run' && Math.abs(distX) > 20) {
      fBody.setVelocityX(distX > 0 ? 150 : -150);
      follower.setFlipX(distX < 0);
    } else {
      fBody.setVelocityX(0);
      follower._followState = 'idle';
    }

    if (fGround) {
      if (follower._followState === 'run') {
        if (fcu !== fRun) follower.play(fRun);
      } else {
        if (fcu !== fIdle) follower.play(fIdle);
      }
    }

    if (distY < -90 && fGround && this.followerJumpCooldown === 0) {
      fBody.setVelocityY(-400);
      follower.play(fJump);
      this.followerJumpCooldown = 30;
    }
    if (!fGround && fcu !== fJump) follower.play(fJump);

    if (follower.y > 590) {
      follower.setPosition(active.x - 30, active.y - 20);
      fBody.setVelocity(0, 0);
    }

    // ── Z 鍵魔法彈 ──
    if (isNana && onGround && (Phaser.Input.Keyboard.JustDown(this.keyZ) || this.touchShootTrigger)) {
      this.touchShootTrigger = false;
      this.shootMagic();
    }

    // ── 掉落深淵重置 ──
    if (active.y > 590) {
      // 掉到底部 → 回到起點
      this.nana.setPosition(100, 88);
      this.bubu.setPosition(70, 88);
      this.nana.body.setVelocity(0, 0);
      this.bubu.body.setVelocity(0, 0);
      this.activeChar = 'nana';
      this.cameras.main.startFollow(this.nana, true, 0.1, 0.1);
    }
  }

  // ══════════════════════════════════
  // 崩塌平台機制
  // ══════════════════════════════════
  updateCrackingPlatforms() {
    const toRemove = [];

    this.platforms.getChildren().forEach(p => {
      if (!p.getData('cracked') || !p.active) return;

      // 檢查是否有角色站在上面
      const nanaOn = this.checkStandingOn(this.nana, p);
      const bubuOn = this.checkStandingOn(this.bubu, p);
      const someoneOn = nanaOn || bubuOn;

      if (someoneOn && !p.getData('touched')) {
        // 👣 剛踩上去：開始倒數
        p.setData('touched', true);
        p.setData('collapseTimer', 60); // ~1 秒後崩塌
        p.setTint(0xff6666); // 變紅警告
      }

      if (p.getData('touched')) {
        let timer = p.getData('collapseTimer');
        timer--;
        p.setData('collapseTimer', timer);

        // 震動效果
        if (timer > 0 && timer < 50) {
          p.x += Phaser.Math.Between(-1, 1);
        }

        if (timer <= 0) {
          // 💥 崩塌！
          this.createJumpEffect(p.x, p.y);
          p.setVisible(false);
          p.body.enable = false;
          p.setActive(false);
          toRemove.push(p);
        }
      }
    });

    // 把崩塌的平台移到 crackedPlatforms 群組復活用（3 秒後重生）
    toRemove.forEach(p => {
      setTimeout(() => {
        this.respawnCrackedPlatform(p);
      }, 3000);
    });
  }

  checkStandingOn(char, platform) {
    if (!char.body) return false;
    const body = char.body;
    // 站在平台上：腳底高度在平台範圍內
    const pTop = platform.y - 8;
    const pBottom = platform.y + 8;
    const pLeft = platform.x - 32;
    const pRight = platform.x + 32;

    return body.bottom >= pTop - 2
      && body.bottom <= pTop + 4
      && char.x >= pLeft
      && char.x <= pRight
      && (body.blocked.down || body.touching.down);
  }

  respawnCrackedPlatform(p) {
    p.setVisible(true);
    p.body.enable = true;
    p.setActive(true);
    p.clearTint();
    p.setData('touched', false);
    p.setData('collapseTimer', 0);
    p.refreshBody();
    this.createJumpEffect(p.x, p.y);
  }

  // ══════════════════════════════════
  // 觸控虛擬 D-Pad
  // ══════════════════════════════════
  createVirtualDPad() {
    if (this._padObjects && this._padObjects.length > 0) return;
    this._padObjects = [];
    const btnAlpha = 0.35;
    const btnColor = 0x4488cc;
    const btnSize = 48;
    const add = (o) => { this._padObjects.push(o); return o; };

    add(this.add.circle(60, 420, btnSize, btnColor, btnAlpha).setScrollFactor(0).setDepth(100));
    add(this.add.circle(160, 420, btnSize, btnColor, btnAlpha).setScrollFactor(0).setDepth(100));
    add(this.add.circle(400, 420, btnSize, btnColor, btnAlpha).setScrollFactor(0).setDepth(100));  // ⬇ 掉落
    add(this.add.circle(740, 380, btnSize, btnColor, btnAlpha).setScrollFactor(0).setDepth(100));
    add(this.add.circle(770, 300, btnSize/1.3, btnColor, btnAlpha).setScrollFactor(0).setDepth(100));
    add(this.add.circle(770, 210, btnSize/1.3, 0x4488cc, btnAlpha*1.5).setScrollFactor(0).setDepth(100));

    const style = { fontSize: '20px', fill: '#ffffff', fontFamily: 'monospace' };
    add(this.add.text(60, 420, '◀', style).setOrigin(0.5).setScrollFactor(0).setDepth(101));
    add(this.add.text(160, 420, '▶', style).setOrigin(0.5).setScrollFactor(0).setDepth(101));
    add(this.add.text(400, 420, '▼', style).setOrigin(0.5).setScrollFactor(0).setDepth(101));
    add(this.add.text(740, 380, '▲', style).setOrigin(0.5).setScrollFactor(0).setDepth(101));
    add(this.add.text(770, 300, '⚡', { fontSize: '16px', fill: '#ffd700', fontFamily: 'monospace' }).setOrigin(0.5).setScrollFactor(0).setDepth(101));
    add(this.add.text(770, 210, '⇄', { fontSize: '18px', fill: '#ffffff', fontFamily: 'monospace' }).setOrigin(0.5).setScrollFactor(0).setDepth(101));

    if (!this._touchEventsBound) {
      this._touchEventsBound = true;
      this.input.on('pointerdown', (pointer) => {
        if (!this.touchPadVisible) return;
        const x = pointer.x, y = pointer.y;
        if (Phaser.Math.Distance.Between(x, y, 60, 420) < btnSize) this.touchLeft = true;
        if (Phaser.Math.Distance.Between(x, y, 160, 420) < btnSize) this.touchRight = true;
        if (Phaser.Math.Distance.Between(x, y, 400, 420) < btnSize) { this.touchDownTrigger = true; }
        if (Phaser.Math.Distance.Between(x, y, 740, 380) < btnSize) { this.touchJump = true; this.touchJumpTrigger = true; }
        if (Phaser.Math.Distance.Between(x, y, 770, 300) < btnSize/1.3) { this.touchShootTrigger = true; }
        if (Phaser.Math.Distance.Between(x, y, 770, 210) < btnSize/1.3) { this.touchSwitchTrigger = true; }
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

  // ══════════════════════════════════
  // 特效
  // ══════════════════════════════════
  createJumpEffect(x, y) {
    for (let i = 0; i < 6; i++) {
      const p = this.add.image(x, y, 'ice_particle');
      p.setTint(0x88ddff);
      p.setScale(Phaser.Math.FloatBetween(0.25, 0.5));
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

  createSwitchEffect(char) {
    const flash = this.add.rectangle(char.x, char.y, 60, 80, 0x4488cc, 0.5).setDepth(90);
    this.tweens.add({
      targets: flash,
      scaleX: 3, scaleY: 3, alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy()
    });
    for (let i = 0; i < 12; i++) {
      const p = this.add.image(char.x, char.y, 'ice_particle');
      p.setTint(Phaser.Math.Between(0, 1) ? 0x44ddff : 0x88ddff);
      p.setScale(Phaser.Math.FloatBetween(0.15, 0.4));
      this.tweens.add({
        targets: p,
        x: p.x + Phaser.Math.Between(-40, 40),
        y: p.y + Phaser.Math.Between(-40, 40),
        alpha: 0, scale: 0,
        duration: 400,
        onComplete: () => p.destroy()
      });
    }
  }

  createLandingDust(x, y) {
    for (let i = 0; i < 4; i++) {
      const p = this.add.image(x, y, 'ice_particle');
      p.setTint(0x6688aa);
      p.setScale(Phaser.Math.FloatBetween(0.15, 0.3));
      p.setAlpha(0.5);
      this.tweens.add({
        targets: p,
        x: p.x + Phaser.Math.Between(-10, 10),
        y: p.y + Phaser.Math.Between(5, 15),
        alpha: 0, scale: 0,
        duration: 300,
        onComplete: () => p.destroy()
      });
    }
  }

  createWallDust(x, y, dir) {
    const offsetX = dir === 'left' ? -8 : 8;
    for (let i = 0; i < 2; i++) {
      const p = this.add.image(x + offsetX, y, 'ice_particle');
      p.setTint(0x4488cc);
      p.setScale(Phaser.Math.FloatBetween(0.1, 0.2));
      p.setAlpha(0.4);
      this.tweens.add({
        targets: p,
        x: p.x + (dir === 'left' ? -8 : 8) * Phaser.Math.FloatBetween(0.5, 1.5),
        y: p.y - Phaser.Math.Between(0, 5),
        alpha: 0, scale: 0,
        duration: 200,
        onComplete: () => p.destroy()
      });
    }
  }

  shootMagic() {
    const dir = this.nana.flipX ? -1 : 1;
    const bx = this.nana.x + dir * 20;
    const by = this.nana.y;
    const ball = this.add.image(bx, by, 'crystal_ball_sd');
    ball.setScale(0.05);
    ball.setTint(0x4488cc);
    this.tweens.add({
      targets: ball,
      x: bx + dir * 200,
      duration: 600,
      onComplete: () => ball.destroy()
    });
  }

  collectShard(char, shard) {
    shard.destroy();
    this.score++;
    this.scoreText.setText(`💠 水晶碎片: ${this.score} / 3`);

    this.createJumpEffect(shard.x, shard.y);
    for (let i = 0; i < 8; i++) {
      const p = this.add.image(shard.x, shard.y, 'crystal_shard');
      p.setTint(0x44ddff);
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
    this.add.rectangle(416, 240, 832, 480, 0x000000, 0.7).setDepth(90);
    const text = this.add.text(416, 200, '💎 水晶洞窟通關！ 💎', {
      fontSize: '28px', fill: '#44ddff', fontFamily: 'monospace'
    }).setOrigin(0.5).setDepth(91);
    this.add.text(416, 250, '前往幽靈森林...', {
      fontSize: '14px', fill: '#4488cc', fontFamily: 'monospace'
    }).setOrigin(0.5).setDepth(91);
    this.tweens.add({
      targets: text, scaleX: 1.1, scaleY: 1.1,
      duration: 800, yoyo: true, repeat: -1
    });

    // 選關按鈕
    const menuBtn = this.add.text(416, 310, '📋 選關卡', {
      fontSize: '18px', fill: '#44ddff', fontFamily: 'monospace', backgroundColor: '#1a3a5a', padding: { x: 12, y: 6 }
    }).setOrigin(0.5).setDepth(91).setInteractive({ useHandCursor: true });
    menuBtn.on('pointerdown', () => this.scene.start('LevelSelectScene'));
    menuBtn.on('pointerover', () => menuBtn.setStyle({ fill: '#ffffff' }));
    menuBtn.on('pointerout', () => menuBtn.setStyle({ fill: '#44ddff' }));

    // 下一關按鈕
    const nextBtn = this.add.text(416, 360, '➡ 下一關：幽靈森林', {
      fontSize: '16px', fill: '#66ff88', fontFamily: 'monospace', backgroundColor: '#1a4a2a', padding: { x: 12, y: 6 }
    }).setOrigin(0.5).setDepth(91).setInteractive({ useHandCursor: true });
    nextBtn.on('pointerdown', () => this.scene.start('HauntedForestScene'));
    nextBtn.on('pointerover', () => nextBtn.setStyle({ fill: '#ffffff' }));
    nextBtn.on('pointerout', () => nextBtn.setStyle({ fill: '#66ff88' }));
  }

  // ══════════════════════════════════
  // 暫停 / 重新開始
  // ══════════════════════════════════
  togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this._pauseOverlay = this.add.rectangle(416, 240, 832, 480, 0x000000, 0.7).setDepth(200).setScrollFactor(0);
      this._pauseText = this.add.text(416, 160, '⏸ 暫停中', {
        fontSize: '32px', fill: '#44ddff', fontFamily: 'monospace'
      }).setOrigin(0.5).setDepth(201).setScrollFactor(0);

      const btnStyle = {
        fontSize: '18px', fill: '#44ddff', fontFamily: 'monospace',
        backgroundColor: '#0a3a5a', padding: { x: 14, y: 8 }
      };

      const resumeBtn = this.add.text(416, 240, '▶ 繼續', btnStyle)
        .setOrigin(0.5).setDepth(201).setScrollFactor(0).setInteractive({ useHandCursor: true });
      resumeBtn.on('pointerdown', () => this.togglePause());

      const restartBtn = this.add.text(416, 290, '🔄 重新開始', btnStyle)
        .setOrigin(0.5).setDepth(201).setScrollFactor(0).setInteractive({ useHandCursor: true });
      restartBtn.on('pointerdown', () => { this.isPaused = false; this.scene.restart(); });

      const menuBtn = this.add.text(416, 340, '📋 選關卡', btnStyle)
        .setOrigin(0.5).setDepth(201).setScrollFactor(0).setInteractive({ useHandCursor: true });
      menuBtn.on('pointerdown', () => { this.isPaused = false; this.scene.start('LevelSelectScene'); });
    } else {
      if (this._pauseOverlay) { this._pauseOverlay.destroy(); this._pauseOverlay = null; }
      if (this._pauseText) { this._pauseText.destroy(); this._pauseText = null; }
    }
  }
}
