// GameScene — 主要遊戲場景（動畫版）

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // ── 角色縮放比例（新 sprites 160x178，適合 832x480 的世界）──
    this.CHAR_SCALE = 0.5;

    // ── 星空背景 ──
    this.add.image(416, -80, 'night_sky_bg')
      .setScrollFactor(0.3)
      .setDepth(0)
      .setAlpha(0.6);

    // ── 背景裝飾星星 ──
    for (let i = 0; i < 60; i++) {
      const star = this.add.image(
        Phaser.Math.Between(0, 832),
        Phaser.Math.Between(-300, 480),
        'star_sd'
      );
      star.setAlpha(Phaser.Math.FloatBetween(0.2, 0.8));
      star.setScale(Phaser.Math.FloatBetween(0.004, 0.0125));
    }

    // ── 魔法粒子背景動畫 ──
    for (let i = 0; i < 25; i++) {
      const p = this.add.image(
        Phaser.Math.Between(0, 832),
        Phaser.Math.Between(-300, 480),
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

    // 地面平台（64×16 tiles 並排，不拉伸）
    for (let i = 0; i < 13; i++) {
      const pp = this.platforms.create(32 + i * 64, 464, 'platform_sd');
      pp.setScale(0.05);
      pp.refreshBody();
    }

    // 星雲森林關卡平台（重新設計：確保走路不撞頭、跳躍可到達）
    // 地面表面 y=456，平台 64×16，角色最小行走間距需 90px
    const levelData = [
      // ── 第一層（單跳從地面可到）──
      { x: 300, y: 366 },
      { x: 500, y: 366 },
      { x: 680, y: 368 },

      // ── 第二層 ──
      { x: 200, y: 262 },
      { x: 400, y: 260 },
      { x: 600, y: 261 },

      // ── 第三層 ──
      { x: 100, y: 158 },
      { x: 350, y: 156 },
      { x: 550, y: 157 },

      // ── 頂層 ──
      { x: 250, y: 54 },
      { x: 500, y: 52 },

      // ── 輔助通道 ──
      { x: 700, y: 156 },
      { x: 700, y: 262 },
    ];

    levelData.forEach(d => {
      const p = this.platforms.create(d.x, d.y, 'platform_sd');
      p.setScale(0.05);
      p.refreshBody();
    });

    // ── 收集品：星靈碎片 ──
    this.stars = this.physics.add.staticGroup();
    const starPositions = [
      { x: 250, y: 34 },   // 從頂層 (250,54) 跳一下可拿到
      { x: 500, y: 32 },   // 從頂層 (500,52) 跳一下可拿到
      { x: 700, y: 136 },  // 從第三層 (700,156) 跳一下可拿到
    ];
    starPositions.forEach(pos => {
      const s = this.stars.create(pos.x, pos.y, 'star_sd');
      s.setScale(0.01875);  // 8*1.5 / 640
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
    // 人物實際約 103x165，縮小碰撞箱到主要身體
    this.nana.body.setSize(90, 165);
    this.nana.body.setOffset(35, 13);

    // 水晶球特效（跟隨娜娜，由 update 控制位置）
    this.crystalBall = this.add.image(120, 390, 'crystal_ball_sd');
    this.crystalBall.setScale(0.025);  // 16 / 640

    // ── 布布（動畫 sprite）──
    this.bubu = this.physics.add.sprite(70, 412, 'bubu_sprites', 0);
    this.bubu.setScale(this.CHAR_SCALE);
    this.bubu.setCollideWorldBounds(true);
    this.bubu.setFlipX(false);  // 新 spritesheet 預設朝右
    // 人物實際約 159x156，縮小碰撞箱到主要身體
    this.bubu.body.setSize(90, 155);
    this.bubu.body.setOffset(35, 9);

    // ── 碰撞設定 ──
    this.physics.add.collider(this.nana, this.platforms);
    this.physics.add.collider(this.bubu, this.platforms);
    // 🎯 角色之間也要碰撞，才不會重疊
    this.physics.add.collider(this.nana, this.bubu);
    this.physics.add.overlap(this.nana, this.stars, this.collectStar, null, this);
    this.physics.add.overlap(this.bubu, this.stars, this.collectStar, null, this);

    // ── 按鍵輸入 ──
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.keyESC = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.keyQ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);  // 切角色
    this.key1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    this.key2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);   // 重新開始

    // ── 雙角色系統 ──
    this.activeChar = 'nana';       // 'nana' 或 'bubu'
    this.switchCooldown = 0;

    // ── 觸控虛擬按鍵 ──
    this.touchLeft = false;
    this.touchRight = false;
    this.touchJump = false;
    this.touchShoot = false;
    this.touchShootTrigger = false;
    this.touchJumpTrigger = false;
    this.touchSwitchTrigger = false;
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
    this.wasOnGround = true;
    this._prevOnGround = true;  // 避免開場觸發落地塵埃
    this.airFrameCount = 0;
    this._justLeftGround = false;
    this.landingCooldowns = {};
    this.dashCooldown = 0;
    this.jumpBufferTimer = 0;
    this.followerJumpCooldown = 0;
    this.isPaused = false;

    // ── UI ──
    this.scoreText = this.add.text(16, 16, '星靈碎片: 0 / 3', {
      fontSize: '16px', fill: '#d5a6e8', fontFamily: 'monospace'
    });
    this.titleText = this.add.text(416, 16, '星雲森林', {
      fontSize: '14px', fill: '#9b59b6', fontFamily: 'monospace'
    }).setOrigin(0.5, 0);

    // 角色切換指示器
    this.charSwitchText = this.add.text(700, 16, '▸ 娜娜  ◇ 布布', {
      fontSize: '12px', fill: '#d5a6e8', fontFamily: 'monospace', backgroundColor: '#1a0a3e88', padding: { x: 6, y: 2 }
    });
    this.charSwitchBtn = this.add.text(760, 36, '［Q/1/2 切換］', {
      fontSize: '10px', fill: '#9b59b6', fontFamily: 'monospace'
    });

    // 衝刺冷卻條
    this.dashStatusBg = this.add.rectangle(16, 56, 100, 8, 0x333355, 0.6).setOrigin(0, 0.5);
    this.dashStatusBar = this.add.rectangle(16, 56, 100, 8, 0x9b59b6, 1).setOrigin(0, 0.5);
    this.dashStatusText = this.add.text(120, 56, '衝刺', {
      fontSize: '10px', fill: '#9b59b6', fontFamily: 'monospace'
    }).setOrigin(0, 0.5);

    // ── 相機 ──
    this.cameras.main.startFollow(this.nana, true, 0.1, 0.1);
    // 放寬世界邊界，讓上方平台和星星都看得見
    this.cameras.main.setBounds(0, -300, 832, 780);
    this.physics.world.setBounds(0, -300, 832, 780);

    this.gameWon = false;
  }

  update() {
    if (this.gameWon) return;

    // ESC 暫停開關（不受 isPaused 影響）
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
    const dashCooldownFrames = 60; // ~1 秒

    // ── 冷卻計時器 ──
    if (this.switchCooldown > 0) this.switchCooldown--;
    if (this.dashCooldown > 0) this.dashCooldown--;
    if (this.jumpBufferTimer > 0) this.jumpBufferTimer--;
    if (this.followerJumpCooldown > 0) this.followerJumpCooldown--;

    // ── 控制角色 ──
    let active = (this.activeChar === 'nana') ? this.nana : this.bubu;
    let isNana = (active === this.nana);

    // ── 角色切換（Q / 1,2）──
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

      // 切換時清除速度
      this.nana.body.setVelocity(0, 0);
      this.bubu.body.setVelocity(0, 0);

      // 更新指示器
      this.charSwitchText.setText(
        this.activeChar === 'nana' ? '▸ 娜娜  ◇ 布布' : '◇ 娜娜  ▸ 布布'
      );

      // 更新 active 指向
      active = (this.activeChar === 'nana') ? this.nana : this.bubu;
      isNana = (active === this.nana);

      // ✨ 角色切換特效
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
    } else {
      if (this.wasOnGround) {
        this.airFrameCount = (this.airFrameCount || 0) + 1;
        if (this.airFrameCount > 3) this.wasOnGround = false;
      }
    }
    if (onGround) {
      this.airFrameCount = 0;
      this._justLeftGround = false;
    } else if (this.wasOnGround) {
      this._justLeftGround = true;
    }

    // 離開地面時設緩衝（6 幀內按跳仍算地面跳）
    if (this._justLeftGround && this.airFrameCount === 1) {
      this.jumpBufferTimer = 6;
    }

    // 🎯 落地塵埃效果
    if (justLanded) {
      const ck = isNana ? 'nana' : 'bubu';
      if (!this.landingCooldowns[ck]) {
        this.landingCooldowns[ck] = true;
        this.createLandingDust(active.x, active.y + 20);
        setTimeout(() => { this.landingCooldowns[ck] = false; }, 200);
      }
    }

    // ── 移動（鍵盤 + 觸控）──
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

    // ── 動畫切換 ──
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

    // ── 跳躍（含緩衝）──
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

    // ── 娜娜空中衝刺（Z 鍵）──
    if (isNana && !onGround && Phaser.Input.Keyboard.JustDown(this.keyZ) && this.dashCooldown === 0) {
      const dashDir = active.flipX ? -1 : 1;
      activeBody.setVelocityX(dashDir * 350);
      activeBody.setVelocityY(0);
      this.dashCooldown = dashCooldownFrames;
      active.setTint(0xffffff);
      this.createJumpEffect(active.x, active.y);
    }

    // 衝刺冷卻 UI
    const dashPct = this.dashCooldown / dashCooldownFrames;
    this.dashStatusBar.setDisplaySize(100 * (1 - dashPct), 8);
    this.dashStatusBar.setFillStyle(dashPct > 0.5 ? 0x9b59b6 : dashPct > 0.2 ? 0xe67e22 : 0xe74c3c);

    // ── 布布爬牆+滑翔 ──
    if (!isNana) {
      const touchingWall = activeBody.blocked.left || activeBody.blocked.right;
      if (touchingWall && !onGround) {
        const wallDir = activeBody.blocked.left ? 'left' : 'right';
        if ((wallDir === 'left' && leftDown) || (wallDir === 'right' && rightDown)) {
          activeBody.setVelocityY(-60);
          if (cur !== 'bubu_jump') active.play('bubu_jump');
          // 🎯 爬牆摩擦粒子
          this.createWallDust(active.x, active.y, wallDir);
        }
        // 滑翔
        if (activeBody.velocity.y > 0) {
          activeBody.setVelocityY(activeBody.velocity.y * 0.6);
        }
      }
    }

    // ── 水晶球跟隨娜娜 ──
    this.crystalBall.x = this.nana.x + (this.nana.flipX ? 16 : -16);
    this.crystalBall.y = this.nana.y - 4;

    // ── 相機跟隨控制角色 ──
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

    // 跟隨距離邏輯
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

    // 🎯 跟隨跳躍（精準：只跳當距離足夠跳到目標）
    // 最高可跳 ~103px（單跳），所以目標高於目前位置 > 90 才跳
    if (distY < -90 && fGround && this.followerJumpCooldown === 0) {
      fBody.setVelocityY(-400);
      follower.play(fJump);
      this.followerJumpCooldown = 30;
    }
    if (!fGround && fcu !== fJump) {
      follower.play(fJump);
    }

    // 跟隨掉落重置
    if (follower.y > 500) {
      follower.setPosition(active.x - 30, active.y - 20);
      fBody.setVelocity(0, 0);
    }

    // ── Z 鍵 / 觸控 魔法彈（僅娜娜 active + 地上時）──
    if (isNana && onGround && (Phaser.Input.Keyboard.JustDown(this.keyZ) || this.touchShootTrigger)) {
      this.touchShootTrigger = false;
      this.shootMagic();
    }

  }


  // ══════════════════════════════════
  // 暫停 / 重新開始
  // ══════════════════════════════════
  togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this._pauseOverlay = this.add.rectangle(416, 240, 832, 480, 0x000000, 0.7).setDepth(200).setScrollFactor(0);
      this._pauseText = this.add.text(416, 160, '⏸ 暫停中', {
        fontSize: '32px', fill: '#d5a6e8', fontFamily: 'monospace'
      }).setOrigin(0.5).setDepth(201).setScrollFactor(0);

      const btnStyle = {
        fontSize: '18px', fill: '#d5a6e8', fontFamily: 'monospace',
        backgroundColor: '#3a1a5a', padding: { x: 14, y: 8 }
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
    // 🔄 角色切換觸控按鈕（右上角）
    add(this.add.circle(770, 210, btnSize/1.3, 0x9b59b6, btnAlpha*1.5).setScrollFactor(0).setDepth(100));

    const style = { fontSize: '20px', fill: '#ffffff', fontFamily: 'monospace' };
    add(this.add.text(60, 420, '◀', style).setOrigin(0.5).setScrollFactor(0).setDepth(101));
    add(this.add.text(160, 420, '▶', style).setOrigin(0.5).setScrollFactor(0).setDepth(101));
    add(this.add.text(740, 380, '▲', style).setOrigin(0.5).setScrollFactor(0).setDepth(101));
    add(this.add.text(770, 300, '⚡', { fontSize: '16px', fill: '#ffd700', fontFamily: 'monospace' }).setOrigin(0.5).setScrollFactor(0).setDepth(101));
    add(this.add.text(770, 210, '⇄', { fontSize: '18px', fill: '#ffffff', fontFamily: 'monospace' }).setOrigin(0.5).setScrollFactor(0).setDepth(101));

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

  // ✨ 角色切換特效
  createSwitchEffect(char) {
    // 閃光
    const flash = this.add.rectangle(char.x, char.y, 60, 80, 0xd5a6e8, 0.5).setDepth(90);
    this.tweens.add({
      targets: flash,
      scaleX: 3, scaleY: 3, alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy()
    });
    // 粒子爆發
    for (let i = 0; i < 12; i++) {
      const p = this.add.image(char.x, char.y, 'particle');
      p.setTint(Phaser.Math.Between(0, 1) ? 0xd5a6e8 : 0x9b59b6);
      p.setScale(Phaser.Math.FloatBetween(0.3, 0.8));
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

  // 🌫 落地塵埃
  createLandingDust(x, y) {
    for (let i = 0; i < 4; i++) {
      const p = this.add.image(x, y, 'particle');
      p.setTint(0x8888aa);
      p.setScale(Phaser.Math.FloatBetween(0.3, 0.6));
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

  // 🧱 爬牆摩擦粒子
  createWallDust(x, y, dir) {
    const offsetX = dir === 'left' ? -8 : 8;
    for (let i = 0; i < 2; i++) {
      const p = this.add.image(x + offsetX, y, 'particle');
      p.setTint(0x6655aa);
      p.setScale(Phaser.Math.FloatBetween(0.2, 0.4));
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
    ball.setScale(0.02);  // 16*0.8 / 640
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
      const p = this.add.image(star.x, star.y, 'star_sd');
      p.setTint(0xffd700);
      p.setScale(0.00625);  // 4 / 640
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
    const text = this.add.text(416, 200, '✨ 星雲森林通關！ ✨', {
      fontSize: '28px', fill: '#d5a6e8', fontFamily: 'monospace'
    }).setOrigin(0.5).setDepth(91);
    this.add.text(416, 250, '前往水晶洞窟...', {
      fontSize: '14px', fill: '#9b59b6', fontFamily: 'monospace'
    }).setOrigin(0.5).setDepth(91);
    this.tweens.add({
      targets: text, scaleX: 1.1, scaleY: 1.1,
      duration: 800, yoyo: true, repeat: -1
    });

    // 選關按鈕
    const menuBtn = this.add.text(416, 310, '📋 選關卡', {
      fontSize: '18px', fill: '#d5a6e8', fontFamily: 'monospace', backgroundColor: '#3a1a5a', padding: { x: 12, y: 6 }
    }).setOrigin(0.5).setDepth(91).setInteractive({ useHandCursor: true });
    menuBtn.on('pointerdown', () => this.scene.start('LevelSelectScene'));
    menuBtn.on('pointerover', () => menuBtn.setStyle({ fill: '#ffffff' }));
    menuBtn.on('pointerout', () => menuBtn.setStyle({ fill: '#d5a6e8' }));

    // 下一關按鈕
    const nextBtn = this.add.text(416, 360, '➡ 下一關：水晶洞窟', {
      fontSize: '16px', fill: '#44ddff', fontFamily: 'monospace', backgroundColor: '#1a3a5a', padding: { x: 12, y: 6 }
    }).setOrigin(0.5).setDepth(91).setInteractive({ useHandCursor: true });
    nextBtn.on('pointerdown', () => this.scene.start('CrystalCavernScene'));
    nextBtn.on('pointerover', () => nextBtn.setStyle({ fill: '#ffffff' }));
    nextBtn.on('pointerout', () => nextBtn.setStyle({ fill: '#44ddff' }));
  }
}
