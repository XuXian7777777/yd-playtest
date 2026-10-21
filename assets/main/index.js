System.register("chunks:///_virtual/Anvil.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './Rng.ts', './ForgeParams.ts', './LotsTube.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, _createClass, cclegacy, createForgeRng, APPRENTICE_BLADE, tierOf, TUTORIAL_I_GREAT_EXTRA, TUTORIAL_I_SUCCESS, TUTORIAL_II, tierKey, FORGE_RESULTS, pityEligible, LotsTube, emptyCounts;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      createForgeRng = module.createForgeRng;
    }, function (module) {
      APPRENTICE_BLADE = module.APPRENTICE_BLADE;
      tierOf = module.tierOf;
      TUTORIAL_I_GREAT_EXTRA = module.TUTORIAL_I_GREAT_EXTRA;
      TUTORIAL_I_SUCCESS = module.TUTORIAL_I_SUCCESS;
      TUTORIAL_II = module.TUTORIAL_II;
      tierKey = module.tierKey;
      FORGE_RESULTS = module.FORGE_RESULTS;
    }, function (module) {
      pityEligible = module.pityEligible;
      LotsTube = module.LotsTube;
      emptyCounts = module.emptyCounts;
    }],
    execute: function () {
      cclegacy._RF.push({}, "9a3a5SNwrBGdpX6mz+1r89f", "Anvil", undefined);

      /** Coin wallet the hammer is paid from (loot's `ILootInfo`). */

      /**
       * What the anvil needs from the game. Deliberately narrow: nothing here can
       * reach ads, saves or player history (docs/design/P1-tasks.md P1-04 红线;
       * docs/design/GDD.md §9.7, §13.3).
       */

      /** How the tube changed after a strike or a new sword (GDD §9.3: 抽空重新洗 / 跨档重建). */

      /** Where the current main sword came from (GDD §9.2 学徒剑, §9.6 提拔 / 断剑). */

      /**
       * Main sword, its public tube and the strike rules (docs/design/GDD.md §9.3,
       * §9.5, §9.6; docs/design/P1-tasks.md P1-04). Every draw uses
       * `createForgeRng(sessionSeed, k)` and nothing else.
       */
      var Anvil = exports('Anvil', /*#__PURE__*/function () {
        function Anvil(ports) {
          this.ports = void 0;
          this.seed = 1;
          this.tutorial = false;
          this.k = 1;
          this.level = 0;
          this.W = APPRENTICE_BLADE.W;
          this.Lg = APPRENTICE_BLADE.Lg;
          this.Cv = APPRENTICE_BLADE.Cv;
          this.origin = 'apprentice';
          this.affixes = [];
          this.streak = 0;
          this.strikes = 0;
          this.rng = void 0;
          this.current = null;
          this.shattered = null;
          this.ports = ports;
          this.rng = createForgeRng(this.seed, this.k);
        }

        /**
         * New run: main sword #1, a +0 学徒剑 (GDD §9.2; P1-tasks: 1 个剑胚). `tutorial`
         * is the run mode only (新手局三条例外, GDD §5.5); nothing about the player feeds in.
         */
        var _proto = Anvil.prototype;
        _proto.reset = function reset(sessionSeed, tutorial) {
          this.seed = sessionSeed;
          this.tutorial = tutorial;
          this.k = 1;
          this.level = 0;
          this.W = APPRENTICE_BLADE.W;
          this.Lg = APPRENTICE_BLADE.Lg;
          this.Cv = APPRENTICE_BLADE.Cv;
          this.origin = 'apprentice';
          this.affixes = [];
          this.streak = 0;
          this.strikes = 0;
          this.shattered = null;
          this.rng = createForgeRng(this.seed, this.k);
          this.current = null;
          this.ensureTube();
        };
        /** The live tube, shared with the view so the table shows exactly what is drawn from. */
        _proto.lots = function lots() {
          this.ensureTube();
          var tube = this.current;
          if (!tube) throw new Error('forge tube missing');
          return tube;
        }

        /** GDD §9.5 保底 is active: the damage streak is full. */;
        _proto.pityActive = function pityActive() {
          return this.streak >= Math.max(1, Math.round(this.ports.param('forge.pityStreak')));
        }

        /**
         * Probability denominator of each lot for the next strike (GDD §9.5 显示 = 实际结算):
         * 0 = cannot come out this strike (drawn, skipped by 保底, or behind the pinned 教学签).
         */;
        _proto.lotOdds = function lotOdds() {
          var tube = this.lots();
          var out = tube.lots.map(function () {
            return 0;
          });
          var pinned = tube.pinnedIndex();
          if (pinned >= 0) {
            out[pinned] = 1;
            return out;
          }
          var live = tube.live(this.pityActive());
          for (var _iterator = _createForOfIteratorHelperLoose(live), _step; !(_step = _iterator()).done;) {
            var i = _step.value;
            out[i] = live.length;
          }
          return out;
        }

        /** Chance of each result on the next strike, from `lotOdds`. */;
        _proto.resultOdds = function resultOdds() {
          var tube = this.lots();
          var odds = this.lotOdds();
          var out = emptyCounts();
          for (var i = 0; i < odds.length; i++) {
            if (odds[i] > 0) out[tube.lots[i].result] += 1 / odds[i];
          }
          if (this.judgedHoldNext()) out.hold = 1;
          return out;
        }

        /** GDD §9.5: no eligible lot left, so the next strike is hold and uses no lot. */;
        _proto.judgedHoldNext = function judgedHoldNext() {
          var tube = this.lots();
          if (tube.pinnedIndex() >= 0) return false;
          return tube.live(this.pityActive()).length === 0;
        };
        _proto.strike = function strike() {
          if (this.shattered) return {
            ok: false,
            reason: 'shattered'
          };
          var cost = this.hammerCost;
          var wallet = this.ports.wallet();
          if (wallet && !wallet.spendCoins(cost, 'hammer')) return {
            ok: false,
            reason: 'coins'
          };
          var tube = this.lots();
          var pityActive = this.pityActive();
          var lotIndex = tube.pinnedIndex();
          var pity = false;
          if (lotIndex < 0) {
            var live = tube.live(false);
            var eligible = pityActive ? tube.live(true) : live;
            if (eligible.length === 0) {
              pity = pityActive;
            } else {
              lotIndex = live[this.rng.nextInt(live.length)];
              if (pityActive && !pityEligible(tube.lots[lotIndex].result)) {
                // 放回重抽 (GDD §9.5): one redraw among the eligible lots has the same distribution as repeated redraws.
                pity = true;
                lotIndex = eligible[this.rng.nextInt(eligible.length)];
              }
            }
          }
          var drawn = lotIndex >= 0;
          var lot = drawn ? tube.lots[lotIndex] : null;
          if (lot) lot.drawn = true;
          var result = lot ? lot.result : 'hold';
          var levelBefore = this.level;
          var affix = null;
          switch (result) {
            case 'greatSuccess':
              this.level += 2;
              affix = lot && lot.pinned ? 'Lg' : this.rng.next() < this.ports.param('forge.affixWChance') ? 'W' : 'Lg';
              if (affix === 'W') this.W += this.ports.param('forge.affixW');else this.Lg += this.ports.param('forge.affixLg');
              this.affixes.push(affix);
              break;
            case 'success':
              this.level += 1;
              break;
            case 'damage':
              this.level = Math.max(0, this.level - 1);
              break;
          }
          this.streak = result === 'damage' ? this.streak + 1 : 0;
          this.strikes += 1;
          this.ports.emit('forge:strike', {
            k: this.k,
            levelBefore: levelBefore,
            levelAfter: this.level,
            result: result,
            cost: cost,
            pity: pity,
            drawn: drawn,
            affix: affix
          });
          var tubeChange = 'none';
          if (result === 'shatter') {
            this.shattered = {
              k: this.k,
              level: levelBefore
            };
            this.ports.emit('forge:shatter', {
              k: this.k,
              level: levelBefore
            });
          } else {
            if (result === 'greatSuccess') {
              var count = Math.max(0, Math.round(this.ports.param('forge.splashCount')));
              if (count > 0) {
                this.ports.emit('forge:linkSword', {
                  count: count,
                  grade: Math.max(0, Math.round(this.ports.param('forge.splashGrade'))),
                  reason: 'splash'
                });
              }
            }
            if (this.level !== levelBefore || affix) this.ports.emit('forge:sword', this.sword);
            tubeChange = this.ensureTube();
          }
          return {
            ok: true,
            result: result,
            levelBefore: levelBefore,
            levelAfter: this.level,
            cost: cost,
            pity: pity,
            drawn: drawn,
            affix: affix,
            lotIndex: lotIndex,
            tubeChange: tubeChange
          };
        }

        /** 提拔 (GDD §9.6): link sword `slotIndex` becomes main sword k + 1 at its grade, with 学徒剑 stats. */;
        _proto.choosePromote = function choosePromote(slotIndex) {
          if (!this.shattered) return false;
          var grades = this.ports.linkGrades();
          if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= grades.length) return false;
          var level = Math.max(0, Math.floor(grades[slotIndex]));
          this.ports.emit('forge:shatterChoice', {
            choice: 'promote',
            slotIndex: slotIndex
          });
          this.nextSword('promoted', level, null);
          return true;
        }

        /** 断剑 (GDD §9.6): a +0 断剑 of the same blank, keeping 1 random affix of the shattered sword, if it had any. */;
        _proto.chooseBroken = function chooseBroken() {
          if (!this.shattered) return false;
          var kept = this.affixes.length > 0 ? this.affixes[this.rng.nextInt(this.affixes.length)] : null;
          this.ports.emit('forge:shatterChoice', {
            choice: 'broken',
            slotIndex: null
          });
          this.nextSword('broken', 0, kept);
          return true;
        };
        _proto.nextSword = function nextSword(origin, level, kept) {
          this.shattered = null;
          this.origin = origin;
          this.k += 1;
          this.rng = createForgeRng(this.seed, this.k);
          this.level = level;
          this.W = APPRENTICE_BLADE.W;
          this.Lg = APPRENTICE_BLADE.Lg;
          this.Cv = APPRENTICE_BLADE.Cv;
          this.affixes = [];
          if (kept === 'W') this.W += this.ports.param('forge.affixW');
          if (kept === 'Lg') this.Lg += this.ports.param('forge.affixLg');
          if (kept) this.affixes.push(kept);
          this.streak = 0;
          this.current = null;
          this.ensureTube();
          this.ports.emit('forge:sword', this.sword);
        }

        /** 新手局: strike 1 uses 教学签筒 I, strike 2 教学签筒 II, then tier tubes (GDD §9.3, §9.7). */;
        _proto.desiredKind = function desiredKind() {
          if (this.tutorial && this.strikes === 0) return 'tutorialI';
          if (this.tutorial && this.strikes === 1) return 'tutorialII';
          return 'tier';
        };
        _proto.ensureTube = function ensureTube() {
          var kind = this.desiredKind();
          var tier = kind === 'tier' ? tierOf(this.level) : -1;
          var tube = this.current;
          if (tube && tube.kind === kind && tube.tier === tier && tube.remainingTotal() > 0) return 'none';
          var change = tube && tube.kind === kind && tube.tier === tier ? 'reshuffle' : 'rebuild';
          this.current = this.build(kind, tier);
          return tube ? change : 'none';
        };
        _proto.build = function build(kind, tier) {
          if (kind === 'tutorialI') return LotsTube.tutorialI(TUTORIAL_I_GREAT_EXTRA, TUTORIAL_I_SUCCESS);
          if (kind === 'tutorialII') return LotsTube.fromCounts('tutorialII', -1, TUTORIAL_II, false, 'damage');
          var counts = emptyCounts();
          for (var _iterator2 = _createForOfIteratorHelperLoose(FORGE_RESULTS), _step2; !(_step2 = _iterator2()).done;) {
            var result = _step2.value;
            counts[result] = Math.max(0, Math.round(this.ports.param(tierKey(tier, result))));
          }
          if (this.tutorial) {
            counts.hold += counts.shatter;
            counts.shatter = 0;
          }
          return LotsTube.fromCounts('tier', tier, counts, this.tutorial);
        };
        _createClass(Anvil, [{
          key: "sword",
          get: function get() {
            return {
              k: this.k,
              level: this.level,
              W: this.W,
              Lg: this.Lg,
              Cv: this.Cv
            };
          }

          /** GDD §7.6 / P1-tasks P1-04: 5 + 2 × 等级. */
        }, {
          key: "hammerCost",
          get: function get() {
            return Math.max(0, Math.round(this.ports.param('forge.hammerBase') + this.ports.param('forge.hammerPerLevel') * this.level));
          }
        }, {
          key: "damageStreak",
          get: function get() {
            return this.streak;
          }
        }, {
          key: "tube",
          get: function get() {
            var tube = this.lots();
            return {
              kind: tube.kind,
              tier: tube.tier,
              remaining: tube.remaining(),
              pinnedNext: tube.pinnedIndex() >= 0,
              shatterSwapped: tube.shatterSwapped
            };
          }
        }, {
          key: "pendingShatter",
          get: function get() {
            return this.shattered;
          }
        }, {
          key: "swordOrigin",
          get: function get() {
            return this.origin;
          }
        }, {
          key: "tutorialRun",
          get: function get() {
            return this.tutorial;
          }
        }, {
          key: "swordAffixes",
          get: function get() {
            return this.affixes;
          }
        }]);
        return Anvil;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/App.ts", ['cc', './Arena.ts', './Camera.ts', './CoreParams.ts', './ForgeContract.ts', './DebugInputSource.ts', './FxDriver.ts', './FixedLoop.ts', './LocalPlatform.ts', './Modules.ts', './Rng.ts', './Session.ts', './SessionWatch.ts', './ServiceRegistry.ts', './StepProbe.ts', './SystemOrder.ts', './Tunables.ts', './TypedEventBus.ts'], function (exports) {
  var cclegacy, createArena, Camera, CORE_PARAMS, MAP_DEFAULT_HEIGHT, MAP_DEFAULT_WIDTH, FORGE_CONTRACT_PARAMS, DebugInputSource, FxDriver, FixedLoop, LocalPlatform, installModules, createSessionRng, Session, createSessionWatch, ServiceRegistry, StepProbe, SystemOrder, Tunables, TypedEventBus;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      createArena = module.createArena;
    }, function (module) {
      Camera = module.Camera;
    }, function (module) {
      CORE_PARAMS = module.CORE_PARAMS;
      MAP_DEFAULT_HEIGHT = module.MAP_DEFAULT_HEIGHT;
      MAP_DEFAULT_WIDTH = module.MAP_DEFAULT_WIDTH;
    }, function (module) {
      FORGE_CONTRACT_PARAMS = module.FORGE_CONTRACT_PARAMS;
    }, function (module) {
      DebugInputSource = module.DebugInputSource;
    }, function (module) {
      FxDriver = module.FxDriver;
    }, function (module) {
      FixedLoop = module.FixedLoop;
    }, function (module) {
      LocalPlatform = module.LocalPlatform;
    }, function (module) {
      installModules = module.installModules;
    }, function (module) {
      createSessionRng = module.createSessionRng;
    }, function (module) {
      Session = module.Session;
    }, function (module) {
      createSessionWatch = module.createSessionWatch;
    }, function (module) {
      ServiceRegistry = module.ServiceRegistry;
    }, function (module) {
      StepProbe = module.StepProbe;
    }, function (module) {
      SystemOrder = module.SystemOrder;
    }, function (module) {
      Tunables = module.Tunables;
    }, function (module) {
      TypedEventBus = module.TypedEventBus;
    }],
    execute: function () {
      exports('createApp', createApp);
      cclegacy._RF.push({}, "2c78cqejZpI4rsvRUCsx0LE", "App", undefined);
      var DEFAULT_SESSION_LENGTH = 180;
      /**
       * Wires the pure core objects into a GameContext.
       * Cocos nodes stay in the view; this file does not import `cc` at runtime.
       */
      function createApp(ports) {
        var _ports$storage;
        var events = new TypedEventBus();
        var tunables = new Tunables(function (key, from, to) {
          events.emit('tuning:changed', {
            key: key,
            from: from,
            to: to
          });
        });
        var services = new ServiceRegistry();
        var loop = new FixedLoop();
        var debugInput = new DebugInputSource();
        var localPlatform = new LocalPlatform((_ports$storage = ports.storage) != null ? _ports$storage : null);
        var fx = new FxDriver();
        var rng = createSessionRng(1);
        var probe = new StepProbe();
        var arena = createArena(MAP_DEFAULT_WIDTH, MAP_DEFAULT_HEIGHT);
        var camera = new Camera();
        tunables.define(CORE_PARAMS);
        tunables.define(FORGE_CONTRACT_PARAMS);
        var cameraTarget = function cameraTarget() {
          return services.has('player') ? services.get('player').pos : {
            x: arena.width / 2,
            y: arena.height / 2
          };
        };
        var session = new Session({
          resolveSeed: function resolveSeed() {
            return tunables.has('session.seed') ? tunables.get('session.seed') : 0;
          },
          paramsHash: function paramsHash() {
            return tunables.hash();
          },
          simTime: function simTime() {
            return loop.simTime;
          },
          prepare: function prepare() {
            loop.resetClock();
            fx.reset();
            probe.reset();
            arena.resize(tunables.get('map.width'), tunables.get('map.height'));
          },
          onStart: function onStart(info) {
            var next = createSessionRng(info.seed);
            rng.spawn = next.spawn;
            rng.loot = next.loot;
            rng.fx = next.fx;
            rng.shop = next.shop;
            debugInput.beginSession();
            events.emit('session:start', info);
            // Listeners have placed the pet; start the session already centered on it.
            camera.snap(cameraTarget());
          },
          onEnd: function onEnd(info) {
            events.emit('session:end', info);
          }
        });
        var loopFacade = {
          addSystem: function addSystem(system) {
            return loop.addSystem(system);
          },
          get simTime() {
            return loop.simTime;
          },
          get paused() {
            return loop.paused;
          },
          pause: function pause() {
            return loop.pause();
          },
          resume: function resume() {
            return loop.resume();
          },
          hitstop: function hitstop(frames, kind) {
            return loop.hitstop(frames, kind);
          }
        };
        var servicesFacade = {
          provide: function provide(key, value) {
            return services.provide(key, value);
          },
          get: function get(key) {
            return services.get(key);
          },
          has: function has(key) {
            return services.has(key);
          }
        };
        var sessionFacade = {
          get sid() {
            return session.sid;
          },
          get seed() {
            return session.seed;
          },
          restart: function restart() {
            return session.restart();
          },
          end: function end(reason) {
            return session.end(reason);
          }
        };
        var ctx = {
          events: events,
          services: servicesFacade,
          tunables: tunables,
          loop: loopFacade,
          rng: rng,
          arena: arena,
          camera: camera,
          layers: ports.layers,
          toPx: function toPx(p) {
            return ports.toPx({
              x: p.x - camera.center.x + camera.viewW / 2,
              y: p.y - camera.center.y + camera.viewH / 2
            });
          },
          session: sessionFacade
        };
        services.provide('input', debugInput);
        services.provide('platform', localPlatform);
        installModules(ctx);
        var usingDebugInput = services.get('input') === debugInput;
        var usingLocalPlatform = services.get('platform') === localPlatform;
        loop.addSystem(probe);
        loop.addSystem({
          id: 'core.camera',
          order: SystemOrder.Camera,
          fixedUpdate: function fixedUpdate(dt) {
            return camera.follow(cameraTarget(), dt, tunables.get('camera.lerp'));
          }
        });
        if (usingDebugInput) {
          loop.addSystem({
            id: 'core.debugInput',
            order: SystemOrder.Input,
            fixedUpdate: function fixedUpdate() {
              var radiusU = tunables.has('input.joyRadius') ? tunables.get('input.joyRadius') : 1.2;
              var deadZone = tunables.has('input.deadZone') ? tunables.get('input.deadZone') : 0.08;
              var followCenter = !tunables.has('input.followCenter') || tunables.getBool('input.followCenter');
              debugInput.setConfig({
                radiusPx: Math.max(0, radiusU) * Math.max(0, ports.pxPerUnit()),
                deadZone: deadZone,
                followCenter: followCenter
              });
              debugInput.fixedUpdate(loop.simTime);
            }
          });
        }
        loop.addSystem(createSessionWatch({
          session: session,
          hasDirector: function hasDirector() {
            return services.has('director');
          },
          elapsed: function elapsed() {
            return services.get('director').elapsed;
          },
          length: function length() {
            return tunables.has('session.length') ? tunables.get('session.length') : DEFAULT_SESSION_LENGTH;
          },
          // A run ends its own session (victory / death / abandon); the P0 timeout is sandbox only.
          endless: function endless() {
            return services.has('run') || tunables.has('session.endless') && tunables.getBool('session.endless');
          }
        }));
        var unsubs = [];
        var attached = false;
        var attach = function attach() {
          if (attached) return;
          attached = true;
          unsubs.push(events.on('player:died', function () {
            return session.end('died');
          }));
          unsubs.push(events.on('debug:command', function (payload) {
            if (payload.cmd === 'restart') session.restart();
          }));
          unsubs.push(events.on('fx:hitstop', function (payload) {
            var kind = payload.kind === 'major' ? 'major' : 'minor';
            loop.hitstop(payload.frames, kind);
          }));
          unsubs.push(events.on('fx:shake', function (payload) {
            return fx.requestShake(payload.amp, payload.dur);
          }));
        };
        var detach = function detach() {
          if (!attached) return;
          attached = false;
          for (var _i = 0, _unsubs = unsubs; _i < _unsubs.length; _i++) {
            var unsub = _unsubs[_i];
            unsub();
          }
          unsubs.length = 0;
        };
        return {
          ctx: ctx,
          camera: camera,
          debugInput: debugInput,
          usingDebugInput: usingDebugInput,
          localPlatform: localPlatform,
          usingLocalPlatform: usingLocalPlatform,
          tick: function tick(frameDt) {
            var result = loop.tick(frameDt);
            ports.setShake == null || ports.setShake(fx.update(frameDt, rng.fx));
            return result;
          },
          start: function start() {
            return session.start();
          },
          attach: attach,
          detach: detach
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/Arena.ts", ['cc', './Vec2.ts'], function (exports) {
  var cclegacy, vec2;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      vec2 = module.vec2;
    }],
    execute: function () {
      exports({
        arenaClamp: arenaClamp,
        arenaContains: arenaContains,
        createArena: createArena
      });
      cclegacy._RF.push({}, "6a0a1H9DTpIFboXNABVVNWX", "Arena", undefined);

      /** Bounded map in u. Origin is the bottom-left corner; walls on all four sides. */

      /** True when the circle of radius `r` lies entirely inside a `width`×`height` map. */
      function arenaContains(p, r, width, height) {
        return p.x - r >= 0 && p.y - r >= 0 && p.x + r <= width && p.y + r <= height;
      }

      /**
       * Push a circle back inside a `width`×`height` map. Returns a new vector.
       * A radius larger than half the shorter side is shrunk so a center still exists.
       */
      function arenaClamp(p, r, width, height) {
        var limit = Math.min(width, height) * 0.5;
        var radius = Math.max(0, Math.min(r, limit));
        return vec2(Math.min(width - radius, Math.max(radius, p.x)), Math.min(height - radius, Math.max(radius, p.y)));
      }
      function createArena(width, height) {
        var w = sanitize(width);
        var h = sanitize(height);
        return {
          get width() {
            return w;
          },
          get height() {
            return h;
          },
          contains: function contains(p, r) {
            return arenaContains(p, r, w, h);
          },
          clamp: function clamp(p, r) {
            return arenaClamp(p, r, w, h);
          },
          resize: function resize(nextWidth, nextHeight) {
            w = sanitize(nextWidth);
            h = sanitize(nextHeight);
          }
        };
      }
      function sanitize(v) {
        return Number.isFinite(v) && v > 0 ? v : 0;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/BattleSwordLook.ts", ['cc', './ForgeContract.ts'], function (exports) {
  var cclegacy, swordLook, FORGE_CONTRACT_DEFAULTS;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      swordLook = module.swordLook;
      FORGE_CONTRACT_DEFAULTS = module.FORGE_CONTRACT_DEFAULTS;
    }],
    execute: function () {
      exports({
        battleSwordLook: battleSwordLook,
        battleSwordPaint: battleSwordPaint,
        bladeTintRgb: bladeTintRgb,
        forgeSwordPath: forgeSwordPath
      });
      cclegacy._RF.push({}, "5a290ilclhD+bcjFctj5j9H", "BattleSwordLook", undefined);

      /**
       * Battle / main-sword look (issue #108 PR4). One path with forge: this is
       * `swordLook(level)`, not a second table. Peak tracking is not on the run
       * state yet, so battle paints whatever level the rig currently has (starter
       * +0, a forged main, or the reserve white sword if that is what is equipped).
       */
      function battleSwordLook(level, params) {
        if (params === void 0) {
          params = FORGE_CONTRACT_DEFAULTS;
        }
        return swordLook(level, params);
      }

      /** resources path for a contract `spriteId` (`sword_01` → `forge/sword_01`). */
      function forgeSwordPath(spriteId) {
        return "forge/" + spriteId;
      }
      function bladeTintRgb(bladeTint) {
        var rgb = bladeTint >>> 0;
        return {
          r: rgb >> 16 & 255,
          g: rgb >> 8 & 255,
          b: rgb & 255
        };
      }
      /**
       * View-facing paint for one look row. Glow stays off at the starter / +0
       * reserve row (`glow === 0`); later rows use the contract glow and bladeTint
       * instead of the old hard-coded gold ring.
       */
      function battleSwordPaint(look, glowOpacity) {
        var glow = look.glow;
        var visible = glow > 0;
        var strength = glow < 1 ? glow : 1;
        var alpha = visible ? Math.max(0, Math.min(255, Math.round(glowOpacity * strength))) : 0;
        return {
          look: look,
          path: forgeSwordPath(look.spriteId),
          tint: bladeTintRgb(look.bladeTint),
          glowVisible: visible,
          glowAlpha: alpha
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/Boss.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './Geom2.ts'], function (exports) {
  var _extends, _createForOfIteratorHelperLoose, _createClass, cclegacy, pointSegmentDistance;
  return {
    setters: [function (module) {
      _extends = module.extends;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      pointSegmentDistance = module.pointSegmentDistance;
    }],
    execute: function () {
      exports({
        bossHp: bossHp,
        pickBossSpawn: pickBossSpawn
      });
      cclegacy._RF.push({}, "c21f0u9jLFM7KqIxLX9nu6R", "Boss", undefined);

      /**
       * 滚石巨轮 phases (P1-tasks P1-07; P1-numbers-batch1 §3.2–§3.3):
       * `warn` S13 预警 → `windup` 折返前停顿 → `roll` 直线滚过宠物 → (滚出 leashDist 或撞墙 = 弹跳) → `windup` …
       * Breaking the stone skin goes to `breathe` from any phase.
       */

      /** Hit feedback for the view: `ding` 石皮挡下, `crack` 扣一层, `break` 破皮, `loop` 被圈住 ×1.5. */

      /** P1-numbers-batch1 §3.4: Boss 散剑等级 1–3. */
      var DROP_GRADE_MIN = 1;
      var DROP_GRADE_MAX = 3;
      /** Loose swords land on a small ring around the boss instead of one stacked point. */
      var DROP_RING = 0.6;
      /** Rut polyline sample spacing in u; well under the narrowest `boss.rutWidth` (0.2). */
      var RUT_STEP = 0.1;
      var SPAWN_TRIES = 16;
      /** drag.vRef from P0 (P1-numbers-batch1 §0) when sword is absent. */
      var V_REF_FALLBACK = 6;
      /**
       * P1-tasks Q5 / P1-numbers-batch1 §3.3 `boss.spawnDist`: `dist` from the pet,
       * off view, inside the map. Falls back to the off-view-first, farthest in-map candidate.
       */
      function pickBossSpawn(o) {
        var _best;
        var r = o.radius;
        var clamp = function clamp(p) {
          return {
            x: Math.max(r, Math.min(o.mapWidth - r, p.x)),
            y: Math.max(r, Math.min(o.mapHeight - r, p.y))
          };
        };
        var best = null;
        var bestOff = false;
        var bestDist = -1;
        for (var i = 0; i < SPAWN_TRIES; i++) {
          var angle = o.rng.next() * Math.PI * 2;
          var raw = {
            x: o.pet.x + Math.cos(angle) * o.dist,
            y: o.pet.y + Math.sin(angle) * o.dist
          };
          var _p = clamp(raw);
          var off = !o.inView(_p, r);
          if (off && _p.x === raw.x && _p.y === raw.y) return _p;
          var d = Math.hypot(_p.x - o.pet.x, _p.y - o.pet.y);
          if (best && (bestOff && !off || bestOff === off && d <= bestDist)) continue;
          best = _p;
          bestOff = off;
          bestDist = d;
        }
        return (_best = best) != null ? _best : clamp({
          x: o.pet.x,
          y: o.pet.y + o.dist
        });
      }

      /** P1-numbers-batch1 §3.1 bossHp = hpBase × D × (第 10 波 ? wave10HpMul : 1) × (新手局 ? tutorialHpMul : 1). */
      function bossHp(hpBase, danger, wave, mode, wave10HpMul, tutorialHpMul) {
        return hpBase * danger * (wave >= 10 ? wave10HpMul : 1) * (mode === 'tutorial' ? tutorialHpMul : 1);
      }
      var BossController = exports('BossController', /*#__PURE__*/function () {
        function BossController(ctx, world, chest) {
          this.stateValue = null;
          this.rutList = [];
          this.rutTail = null;
          this.clockValue = 0;
          this.epoch = 0;
          this.ctx = void 0;
          this.world = void 0;
          this.chest = void 0;
          this.ctx = ctx;
          this.world = world;
          this.chest = chest;
        }
        var _proto = BossController.prototype;
        /** The live boss entity, or null. */
        _proto.enemy = function enemy() {
          var s = this.stateValue;
          var e = s ? this.world.enemies.get(s.id) : undefined;
          return e && e.alive ? e : null;
        }

        /** Edge-arrow target (GDD §4.4; UI R7). */;
        _proto.indicatorPos = function indicatorPos() {
          var e = this.enemy();
          return e ? e.pos : null;
        };
        _proto.spawn = function spawn(wave, danger) {
          var _this = this;
          var t = this.ctx.tunables;
          var pet = this.world.player().pos;
          var pos = pickBossSpawn({
            pet: pet,
            dist: t.get('boss.spawnDist'),
            radius: t.get('boss.radius'),
            mapWidth: this.ctx.arena.width,
            mapHeight: this.ctx.arena.height,
            inView: function inView(p, margin) {
              return _this.ctx.camera.inView(p, margin);
            },
            rng: this.ctx.rng.spawn
          });
          var mode = this.ctx.services.has('run') ? this.ctx.services.get('run').mode : 'standard';
          var hp = bossHp(t.get('boss.hpBase'), danger, wave, mode, t.get('boss.wave10HpMul'), t.get('boss.tutorialHpMul'));
          var damage = t.get('boss.dmg') * (1 + t.get('diff.dmgK') * (danger - 1));
          this.cleared();
          var e = this.world.spawnBoss(pos, hp, damage);
          if (!e) return null;
          this.stateValue = {
            id: e.id,
            wave: wave,
            maxHp: hp,
            phase: 'warn',
            phaseLeft: t.get('boss.warnTime'),
            skinLeft: Math.max(1, Math.floor(t.get('boss.skinHits'))),
            speed: t.get('boss.speedBase'),
            bounces: 0,
            aim: {
              x: 0,
              y: -1
            },
            passed: false,
            aliveTime: 0,
            rolled: 0,
            feedback: null,
            feedbackAt: 0
          };
          return e;
        };
        _proto.step = function step(e, pet, dt, moveDt) {
          var s = this.stateValue;
          if (!s || s.id !== e.id || dt <= 0) return;
          this.clockValue += dt;
          s.aliveTime += dt;
          this.pruneRuts();
          if (s.phase === 'roll') {
            this.roll(s, e, pet, moveDt);
            return;
          }
          s.phaseLeft -= dt;
          if (s.phaseLeft > 1e-9) return;
          if (s.phase === 'windup') {
            s.phase = 'roll';
            s.passed = false;
          } else {
            if (s.phase === 'breathe') {
              // §3.2 skinRegen 0: 喘气结束石皮立刻回满, 速度回到 speedBase.
              s.skinLeft = Math.max(1, Math.floor(this.ctx.tunables.get('boss.skinHits')));
              s.speed = this.ctx.tunables.get('boss.speedBase');
            }
            this.windup(s, e);
          }
        };
        _proto.damageMul = function damageMul(e, req) {
          var s = this.stateValue;
          if (!s || s.id !== e.id) return 1;
          var t = this.ctx.tunables;
          var breathe = s.phase === 'breathe' ? t.get('boss.breatheDmgTakenMul') : 1;
          // §3.2 loopMul 随时有效; the doc's 不合格 list (慢拖 / 链剑 / 飞剑 / 爪击) leaves the loop out of the armour.
          if (req.source === 'loop') {
            this.mark(s, 'loop');
            return t.get('boss.loopMul') * breathe;
          }
          if (s.phase === 'breathe') return breathe;
          if (!this.qualifies(req)) {
            this.mark(s, 'ding');
            return t.get('boss.armorMul');
          }
          var cost = req.source === 'whip' ? Math.max(1, Math.floor(t.get('boss.whipSkinHits'))) : 1;
          s.skinLeft = Math.max(0, s.skinLeft - cost);
          if (s.skinLeft > 0) {
            this.mark(s, 'crack');
            return 1;
          }
          this.mark(s, 'break');
          this.flushRut();
          s.phase = 'breathe';
          s.phaseLeft = t.get('boss.breatheTime');
          var frames = Math.max(0, Math.min(9, Math.floor(t.get('enemy.bossBreakHitstopFrames'))));
          if (frames > 0 && (this.ctx.tunables.has('fx.hitstop') === false || this.ctx.tunables.getBool('fx.hitstop'))) {
            this.ctx.events.emit('fx:hitstop', {
              frames: frames,
              kind: 'major'
            });
          }
          return 1;
        };
        _proto.died = function died(e) {
          var _this$chest;
          var s = this.stateValue;
          if (!s || s.id !== e.id) return;
          this.flushRut(e);
          this.stateValue = null;
          var epoch = this.epoch;
          var count = Math.max(0, Math.floor(this.ctx.tunables.get('boss.swordDrop')));
          for (var i = 0; i < count; i++) {
            var angle = i / count * Math.PI * 2;
            var pos = this.ctx.arena.clamp({
              x: e.pos.x + Math.cos(angle) * DROP_RING,
              y: e.pos.y + Math.sin(angle) * DROP_RING
            }, 0);
            var grade = DROP_GRADE_MIN + this.ctx.rng.loot.nextInt(DROP_GRADE_MAX - DROP_GRADE_MIN + 1);
            this.ctx.events.emit('loot:sword', {
              pos: pos,
              grade: grade
            });
            if (epoch !== this.epoch) return;
          }
          (_this$chest = this.chest) == null || _this$chest.arm();
          this.ctx.events.emit('boss:defeated', {
            wave: s.wave,
            pos: _extends({}, e.pos),
            chest: this.chest !== null
          });
        };
        _proto.cleared = function cleared() {
          this.epoch += 1;
          this.stateValue = null;
          this.rutList.length = 0;
          this.rutTail = null;
        }

        /** §3.3 rutSlow, not stacking. */;
        _proto.slowAt = function slowAt(p) {
          var t = this.ctx.tunables;
          var half = t.get('boss.rutWidth') / 2;
          var life = t.get('boss.rutLife');
          for (var _iterator = _createForOfIteratorHelperLoose(this.rutList), _step; !(_step = _iterator()).done;) {
            var rut = _step.value;
            if (this.clockValue - rut.t <= life && pointSegmentDistance(p, rut.a, rut.b) <= half) return t.get('boss.rutSlow');
          }
          return 0;
        }

        /** §3.2 合格命中: main-sword drag / whip hit with v_tip ≥ boss.skinSpeedMul × drag.vRef. */;
        _proto.qualifies = function qualifies(req) {
          if (req.source !== 'drag' && req.source !== 'whip') return false;
          if (!this.ctx.services.has('swordRig')) return false;
          var t = this.ctx.tunables;
          var vRef = t.has('drag.vRef') ? t.get('drag.vRef') : V_REF_FALLBACK;
          return this.ctx.services.get('swordRig').vTip + 1e-9 >= t.get('boss.skinSpeedMul') * vRef;
        };
        _proto.mark = function mark(s, feedback) {
          s.feedback = feedback;
          s.feedbackAt = this.clockValue;
        }

        /** §3.3: aim at where the pet will be `boss.rollAimLead` s from now. */;
        _proto.windup = function windup(s, e) {
          var player = this.world.player();
          var lead = this.ctx.tunables.get('boss.rollAimLead');
          var dx = player.pos.x + player.vel.x * lead - e.pos.x;
          var dy = player.pos.y + player.vel.y * lead - e.pos.y;
          var len = Math.hypot(dx, dy);
          s.aim = len > 1e-6 ? {
            x: dx / len,
            y: dy / len
          } : _extends({}, e.facing);
          e.facing = _extends({}, s.aim);
          s.phase = 'windup';
          s.phaseLeft = this.ctx.tunables.get('boss.bounceWindup');
        };
        _proto.roll = function roll(s, e, pet, dt) {
          if (dt <= 0) return;
          var start = {
            x: e.pos.x,
            y: e.pos.y
          };
          var dest = {
            x: e.pos.x + s.aim.x * s.speed * dt,
            y: e.pos.y + s.aim.y * s.speed * dt
          };
          var wall = !this.ctx.arena.contains(dest, e.radius);
          e.pos = this.ctx.arena.clamp(dest, e.radius);
          e.facing = _extends({}, s.aim);
          s.rolled += Math.hypot(e.pos.x - start.x, e.pos.y - start.y);
          this.layRut(start, e.pos);
          var tx = pet.x - e.pos.x;
          var ty = pet.y - e.pos.y;
          if (!s.passed && tx * s.aim.x + ty * s.aim.y < 0) s.passed = true;
          if (wall || s.passed && Math.hypot(tx, ty) > this.ctx.tunables.get('boss.leashDist')) this.bounce(s, e);
        }

        /** §3.3 弹跳: 越撞越快, capped by speedMax (× boss.enrageMul after enrageTime). */;
        _proto.bounce = function bounce(s, e) {
          var t = this.ctx.tunables;
          this.flushRut();
          s.bounces += 1;
          var enraged = s.aliveTime + 1e-9 >= t.get('boss.enrageTime');
          var cap = t.get('boss.speedMax') * (enraged ? t.get('boss.enrageMul') : 1);
          s.speed = Math.min(cap, s.speed + t.get('boss.speedPerBounce'));
          this.windup(s, e);
        };
        _proto.layRut = function layRut(from, to) {
          var _this$rutTail;
          if (this.ctx.tunables.get('boss.rutLife') <= 0) return;
          var tail = (_this$rutTail = this.rutTail) != null ? _this$rutTail : {
            x: from.x,
            y: from.y
          };
          if (Math.hypot(to.x - tail.x, to.y - tail.y) + 1e-9 >= RUT_STEP) {
            this.rutList.push({
              a: tail,
              b: {
                x: to.x,
                y: to.y
              },
              t: this.clockValue
            });
            this.rutTail = {
              x: to.x,
              y: to.y
            };
          } else {
            this.rutTail = tail;
          }
        };
        _proto.flushRut = function flushRut(e) {
          if (e === void 0) {
            e = this.enemy();
          }
          var tail = this.rutTail;
          this.rutTail = null;
          if (!tail || !e || Math.hypot(e.pos.x - tail.x, e.pos.y - tail.y) <= 1e-9) return;
          this.rutList.push({
            a: tail,
            b: {
              x: e.pos.x,
              y: e.pos.y
            },
            t: this.clockValue
          });
        };
        _proto.pruneRuts = function pruneRuts() {
          var life = this.ctx.tunables.get('boss.rutLife');
          var drop = 0;
          while (drop < this.rutList.length) {
            var rut = this.rutList[drop];
            if (!rut || this.clockValue - rut.t <= life) break;
            drop += 1;
          }
          if (drop > 0) this.rutList.splice(0, drop);
        };
        _createClass(BossController, [{
          key: "state",
          get: function get() {
            return this.stateValue;
          }
        }, {
          key: "ruts",
          get: function get() {
            return this.rutList;
          }
        }, {
          key: "clock",
          get: function get() {
            return this.clockValue;
          }
        }]);
        return BossController;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/BossChest.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _createForOfIteratorHelperLoose, _extends, _createClass, cclegacy;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _extends = module.extends;
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports({
        chestChoice: chestChoice,
        chestItem: chestItem,
        drawChest: drawChest
      });
      cclegacy._RF.push({}, "4ea0aoRRYlHIbdA1RJtnjeZ", "BossChest", undefined);
      /**
       * The 12 P1 items (P1-tasks Q8【提案】) with their GDD §7.3 rarity. S15 shows
       * items only: no materials, nothing forge related (UI S15; P1-tasks P1-07).
       */
      var CHEST_ITEMS = exports('CHEST_ITEMS', [{
        id: 'whetstone',
        name: '磨刀石',
        green: false
      }, {
        id: 'ironWeight',
        name: '铁球坠',
        green: false
      }, {
        id: 'firecracker',
        name: '鞭炮',
        green: true
      }, {
        id: 'knot',
        name: '结绳',
        green: false
      }, {
        id: 'snakeSlough',
        name: '蛇蜕',
        green: true
      }, {
        id: 'resonanceBell',
        name: '共鸣铃',
        green: true
      }, {
        id: 'slingBracer',
        name: '弹弓护腕',
        green: false
      }, {
        id: 'returnBracer',
        name: '回力护腕',
        green: true
      }, {
        id: 'ricochetSpring',
        name: '弹射簧',
        green: true
      }, {
        id: 'inkPot',
        name: '墨斗',
        green: false
      }, {
        id: 'swordTassel',
        name: '剑穗',
        green: true
      }, {
        id: 'foodCan',
        name: '狗粮罐',
        green: false
      }]);
      var CHEST_SIZE = 3;

      /** P1-numbers-batch1 §3.4: 3 distinct items, 白 / 绿, at least one 绿. */
      function drawChest(rng, items) {
        if (items === void 0) {
          items = CHEST_ITEMS;
        }
        var greens = items.filter(function (item) {
          return item.green;
        });
        var out = [];
        if (greens.length > 0) {
          var green = greens[rng.nextInt(greens.length)];
          if (green) out.push(green);
        }
        var rest = items.filter(function (item) {
          return out.indexOf(item) < 0;
        });
        while (out.length < CHEST_SIZE && rest.length > 0) {
          var _rest$splice = rest.splice(rng.nextInt(rest.length), 1),
            item = _rest$splice[0];
          if (item) out.push(item);
        }
        // The guaranteed green must not always sit in the first slot.
        for (var i = out.length - 1; i > 0; i--) {
          var j = rng.nextInt(i + 1);
          var a = out[i];
          var b = out[j];
          if (a && b) {
            out[i] = b;
            out[j] = a;
          }
        }
        return out;
      }
      function chestChoice(item) {
        // UpgradeChoice carries a tier, not a rarity: 白 → common, 绿 → rare.
        return {
          id: "item:" + item.id,
          tier: item.green ? 'rare' : 'common',
          value: 0
        };
      }
      function chestItem(choiceId) {
        var _CHEST_ITEMS$find;
        return (_CHEST_ITEMS$find = CHEST_ITEMS.find(function (item) {
          return "item:" + item.id === choiceId;
        })) != null ? _CHEST_ITEMS$find : null;
      }

      /**
       * S15 Boss 宝箱三选一 (P1-tasks P1-07; UI S15). Armed by the boss's death, opened
       * when run enters `chest`, resolved with `upgrade:offer → upgrade:chosen →
       * upgrade:done {source:'bossChest'}`. Draws use `ctx.rng.loot`. Item stacks are
       * upgrade's: it applies `upgrade:chosen {source:'bossChest'}`. No ad button (S15 广告按钮 P2).
       */
      var BossChest = exports('BossChest', /*#__PURE__*/function () {
        function BossChest(ctx) {
          this.armed = false;
          this.openValue = false;
          this.choiceList = [];
          this.pausedHere = false;
          this.attached = false;
          this.unsubs = [];
          this.ctx = void 0;
          this.ctx = ctx;
        }
        var _proto = BossChest.prototype;
        _proto.attach = function attach() {
          var _this = this;
          if (this.attached) return;
          this.attached = true;
          var events = this.ctx.events;
          this.unsubs.push(events.on('run:phase', function (_ref) {
            var to = _ref.to;
            if (to === 'chest') _this.openChest();else _this.close();
          }));
          this.unsubs.push(events.on('session:start', function () {
            return _this.close();
          }));
          this.unsubs.push(events.on('session:end', function () {
            return _this.close();
          }));
          this.unsubs.push(events.on('run:end', function () {
            return _this.close();
          }));
        };
        _proto.detach = function detach() {
          if (!this.attached) return;
          this.attached = false;
          for (var _iterator = _createForOfIteratorHelperLoose(this.unsubs), _step; !(_step = _iterator()).done;) {
            var off = _step.value;
            off();
          }
          this.unsubs.length = 0;
          this.close();
        }

        /** The boss died; the next `chest` phase opens this chest. */;
        _proto.arm = function arm() {
          this.armed = true;
        }

        /** Resolve the displayed choice `id`. Stale or repeated input is ignored. */;
        _proto.choose = function choose(id) {
          if (!this.openValue) return false;
          var choice = this.choiceList.find(function (c) {
            return c.id === id;
          });
          if (!choice) return false;
          this.openValue = false;
          this.choiceList = [];
          // Resume first, so whatever the next phase pauses for is its own pause.
          this.resume();
          this.ctx.events.emit('upgrade:chosen', {
            source: 'bossChest',
            pick: 1,
            picks: 1,
            choice: _extends({}, choice)
          });
          this.ctx.events.emit('upgrade:done', {
            source: 'bossChest',
            picks: 1
          });
          return true;
        };
        _proto.openChest = function openChest() {
          if (!this.armed || this.openValue) return;
          this.armed = false;
          this.choiceList = drawChest(this.ctx.rng.loot).map(chestChoice);
          this.openValue = true;
          if (!this.ctx.loop.paused) {
            this.ctx.loop.pause();
            this.pausedHere = true;
          }
          // S15 has no reroll, so the cost is 0.
          this.ctx.events.emit('upgrade:offer', {
            source: 'bossChest',
            pick: 1,
            picks: 1,
            choices: this.choiceList.map(function (c) {
              return _extends({}, c);
            }),
            rerollCost: 0
          });
        };
        _proto.close = function close() {
          this.armed = false;
          this.openValue = false;
          this.choiceList = [];
          this.resume();
        };
        _proto.resume = function resume() {
          if (!this.pausedHere) return;
          this.pausedHere = false;
          if (this.ctx.loop.paused) this.ctx.loop.resume();
        };
        _createClass(BossChest, [{
          key: "open",
          get: function get() {
            return this.openValue;
          }
        }, {
          key: "choices",
          get: function get() {
            return this.choiceList;
          }
        }]);
        return BossChest;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/BossChestView.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './BossChest.ts'], function (exports) {
  var _inheritsLoose, cclegacy, _decorator, Color, view, BlockInputEvents, Node, Graphics, UITransform, Label, Component, chestItem;
  return {
    setters: [function (module) {
      _inheritsLoose = module.inheritsLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
      _decorator = module._decorator;
      Color = module.Color;
      view = module.view;
      BlockInputEvents = module.BlockInputEvents;
      Node = module.Node;
      Graphics = module.Graphics;
      UITransform = module.UITransform;
      Label = module.Label;
      Component = module.Component;
    }, function (module) {
      chestItem = module.chestItem;
    }],
    execute: function () {
      exports('mountBossChestView', mountBossChestView);
      cclegacy._RF.push({}, "023c3vDOyJIxaww1YQNtzYO", "BossChestView", undefined);
      var ccclass = _decorator.ccclass;
      var DIM = new Color(0, 0, 0, 170);
      var PANEL = new Color(44, 30, 20, 240);
      var BONE = new Color(232, 224, 206, 255);
      var HIGHLIGHT = new Color(255, 238, 196, 255);
      var WOOD = new Color(120, 80, 44, 255);
      var WOOD_DARK = new Color(70, 46, 26, 255);
      var BRASS = new Color(214, 170, 82, 255);
      /** GDD §7.3 稀有度色: 白 / 绿. */
      var WHITE_ITEM = new Color(88, 62, 40, 255);
      var GREEN_ITEM = new Color(52, 96, 56, 255);
      var PANEL_W = 600;
      var PANEL_H = 640;
      var CARD_W = 170;
      var CARD_H = 220;

      /**
       * S15 Boss 宝箱三选一, greybox (runtime nodes, no prefab; `assets/art/ui/chest`
       * is not in a loadable bundle). Modal while the chest is open: the run is in
       * `chest` and the loop is paused. S15 的广告按钮 is P2 and not built.
       */
      var BossChestGreyboxView = exports('BossChestGreyboxView', /*#__PURE__*/function (_Component) {
        _inheritsLoose(BossChestGreyboxView, _Component);
        function BossChestGreyboxView() {
          var _this;
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          _this = _Component.call.apply(_Component, [this].concat(args)) || this;
          _this.ctx = null;
          _this.chest = null;
          _this.panel = null;
          return _this;
        }
        var _proto = BossChestGreyboxView.prototype;
        _proto.configure = function configure(ctx, chest) {
          this.ctx = ctx;
          this.chest = chest;
        };
        _proto.onDisable = function onDisable() {
          this.closePanel();
        };
        _proto.onDestroy = function onDestroy() {
          this.closePanel();
          this.ctx = null;
          this.chest = null;
        };
        _proto.update = function update() {
          var chest = this.chest;
          if (!chest) return;
          if (chest.open && !this.panel) this.openPanel(chest);else if (!chest.open && this.panel) this.closePanel();
        };
        _proto.openPanel = function openPanel(chest) {
          var _this2 = this;
          var ctx = this.ctx;
          if (!ctx) return;
          var size = view.getVisibleSize();
          var root = box(ctx.layers.get('hud'), 'BossChestPanel', 0, 0, size.width, size.height, DIM);
          root.addComponent(BlockInputEvents);
          box(root, 'Panel', 0, 0, PANEL_W, PANEL_H, PANEL, HIGHLIGHT);
          text(root, 'Boss 宝箱', 0, PANEL_H / 2 - 50, PANEL_W - 40, 50, 34, HIGHLIGHT);
          text(root, '选 1 件道具', 0, PANEL_H / 2 - 100, PANEL_W - 40, 36, 22, BONE);
          drawChest(root, 0, 90);
          var choices = chest.choices;
          var gap = 18;
          var total = choices.length * CARD_W + Math.max(0, choices.length - 1) * gap;
          choices.forEach(function (choice, i) {
            var item = chestItem(choice.id);
            var x = -total / 2 + CARD_W / 2 + i * (CARD_W + gap);
            var green = item ? item.green : choice.tier !== 'common';
            var card = box(root, "Choice" + i, x, -150, CARD_W, CARD_H, green ? GREEN_ITEM : WHITE_ITEM, HIGHLIGHT);
            card.addComponent(BlockInputEvents);
            text(card, item ? item.name : choice.id, 0, 30, CARD_W - 16, 60, 28, BONE);
            text(card, green ? '绿' : '白', 0, -50, CARD_W - 16, 40, 22, HIGHLIGHT);
            card.on(Node.EventType.TOUCH_END, function () {
              var _this2$chest;
              (_this2$chest = _this2.chest) == null || _this2$chest.choose(choice.id);
            });
          });
          this.panel = root;
        };
        _proto.closePanel = function closePanel() {
          var _this$panel;
          (_this$panel = this.panel) == null || _this$panel.destroy();
          this.panel = null;
        };
        return BossChestGreyboxView;
      }(Component));
      ccclass('BossChestGreyboxView')(BossChestGreyboxView);

      /** Open chest silhouette: body, raised lid, brass lock. */
      function drawChest(parent, x, y) {
        var node = box(parent, 'Chest', x, y, 200, 160);
        var g = node.addComponent(Graphics);
        if (!g) return;
        g.fillColor = WOOD;
        g.rect(-90, -70, 180, 90);
        g.fill();
        g.fillColor = WOOD_DARK;
        g.rect(-90, 30, 180, 40);
        g.fill();
        g.fillColor = HIGHLIGHT;
        g.rect(-80, 20, 160, 10);
        g.fill();
        g.fillColor = BRASS;
        g.rect(-14, -30, 28, 30);
        g.fill();
      }
      function box(parent, name, x, y, w, h, fill, stroke) {
        var node = new Node(name);
        node.layer = parent.layer;
        parent.addChild(node);
        node.setPosition(x, y, 0);
        node.addComponent(UITransform).setContentSize(w, h);
        if (fill || stroke) {
          // A node carries one renderer, so the fill lives on a child.
          var paint = new Node('Paint');
          paint.layer = parent.layer;
          node.addChild(paint);
          paint.addComponent(UITransform).setContentSize(w, h);
          var g = paint.addComponent(Graphics);
          g.rect(-w / 2, -h / 2, w, h);
          if (fill) {
            g.fillColor = fill;
            g.fill();
          }
          if (stroke) {
            g.lineWidth = 4;
            g.strokeColor = stroke;
            g.stroke();
          }
        }
        return node;
      }
      function text(parent, str, x, y, w, h, size, color) {
        var node = box(parent, 'Text', x, y, w, h);
        var label = node.addComponent(Label);
        label.fontSize = size;
        label.lineHeight = size + 6;
        label.color = color;
        label.overflow = Label.Overflow.SHRINK;
        label.enableWrapText = true;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.string = str;
        return label;
      }
      function mountBossChestView(ctx, chest) {
        var parent = ctx.layers.get('hud');
        // Core's headless ports supply only { name }, not a Cocos Node.
        if (typeof parent.addChild !== 'function') return;
        var node = new Node('BossChestGreybox');
        node.layer = parent.layer;
        node.addComponent(UITransform);
        parent.addChild(node);
        var component = node.addComponent(BossChestGreyboxView);
        if (component) component.configure(ctx, chest);
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/BossParams.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "7af44Db6LtK6qzxjPVvPlk/", "BossParams", undefined);
      /**
       * 滚石巨轮 (P1-tasks P1-07). Every value is 【提案】【待试玩】 from P1-numbers-batch1 §3;
       * the range is the doc's min–max. `boss.swordDrop` (§3.4) is in `EnemyParams`.
       * Not registered: `boss.knockback` (no pet knockback interface yet) and
       * `boss.skinRegen` (§3.3 预留; skin refills at once when breathing ends).
       */
      var BOSS_PARAMS = exports('BOSS_PARAMS', [
      // §3.1 血量: hpBase × D(出场) × (第 10 波 ? wave10HpMul : 1) × (新手局 ? tutorialHpMul : 1).
      param('boss.hpBase', '基础血量(D=1)', 2200, 500, 10000, 10, '§3.1'), param('boss.wave10HpMul', '第10波血量倍率', 1.5, 1, 3, 0.05, '§3.1；P1-tasks Q2'), param('boss.tutorialHpMul', '新手局血量倍率', 0.7, 0.3, 1, 0.05, '§3.1'),
      // §3.2 石皮与喘气.
      param('boss.skinSpeedMul', '破皮剑速(×drag.vRef)', 1.5, 1, 3, 0.05, '§3.2；GDD §8.3'), param('boss.skinHits', '石皮层数', 3, 1, 10, 1, '§3.2'), param('boss.whipSkinHits', '鞭响一次扣层', 2, 1, 5, 1, '§3.2'), param('boss.armorMul', '石皮完好时不合格命中伤害', 0.1, 0, 1, 0.05, '§3.2'), param('boss.breatheTime', '破皮喘气(s)', 3, 1, 8, 0.1, '§3.2'), param('boss.breatheDmgTakenMul', '喘气受伤倍率', 1, 1, 3, 0.05, '§3.2'), param('boss.loopMul', '被圈住伤害倍率', 1.5, 1, 3, 0.05, '§3.2；GDD §8.3'),
      // §3.3 移动与伤害: rolls past the pet and turns back (弹跳), faster every bounce.
      param('boss.radius', '半径(u)', 1.2, 0.6, 2.5, 0.05, '§3.3'), param('boss.speedBase', '起步速度(u/s)', 3.5, 1, 8, 0.05, '§3.3'), param('boss.speedPerBounce', '每次弹跳加速(u/s)', 0.35, 0, 1.5, 0.05, '§3.3'), param('boss.speedMax', '最高速度(u/s)', 7, 3, 15, 0.05, '§3.3'), param('boss.rollAimLead', '瞄准提前量(s)', 0.5, 0, 1.5, 0.05, '§3.3'), param('boss.leashDist', '滚过后折返距离(u)', 7, 3, 15, 0.05, '§3.3'), param('boss.bounceWindup', '折返前停顿(s)', 0.4, 0, 1.5, 0.05, '§3.3'), param('boss.dmg', '接触伤害', 18, 0, 100, 1, '§3.3；× (1 + diff.dmgK × (D − 1))'), param('boss.kbResist', '击退抗性', 1, 0, 1, 0.05, '§3.3'), param('boss.rutLife', '车辙保留(s)', 4, 0, 10, 0.1, '§3.3'), param('boss.rutWidth', '车辙宽度(u)', 0.8, 0.2, 2, 0.05, '§3.3'), param('boss.rutSlow', '车辙减速', 0.35, 0, 0.8, 0.05, '§3.3；宠物读 enemies.slowAt'), param('boss.spawnDist', '出场距宠物(u)', 10, 8, 20, 0.5, '§3.3；P1-tasks Q5 视野外'), param('boss.warnTime', 'S13 预警(s)', 2, 0, 5, 0.1, '§3.3'), param('boss.addBudgetMul', 'Boss 波小怪预算倍率', 0.4, 0, 1, 0.05, '§3.3；只刷软团子 / 群聚羊'), param('boss.enrageTime', '狂暴时间(s)', 120, 30, 600, 5, '§3.3；之后最高速度 ×enrageMul'), param('boss.enrageMul', '狂暴速度倍率', 1.3, 1, 3, 0.05, '§3.3；原硬编码 1.3')]);
      function param(key, label, value, min, max, step, source) {
        return {
          key: key,
          group: 'Boss',
          label: label,
          kind: 'number',
          "default": value,
          min: min,
          max: max,
          step: step,
          note: "\u3010\u63D0\u6848\u3011P1-numbers-batch1 " + source
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/BossView.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './ScreenLayout.ts', './HudArt3.ts'], function (exports) {
  var _inheritsLoose, _createForOfIteratorHelperLoose, cclegacy, _decorator, Color, Graphics, view, Sprite, Node, UITransform, Label, resources, SpriteFrame, Component, layoutScreen, hudFillWidth, BOSS_HUD_LAYOUT, hudFillRect, bossPipRect, hudDesignToLocal, BOSS_HUD_ART;
  return {
    setters: [function (module) {
      _inheritsLoose = module.inheritsLoose;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
      _decorator = module._decorator;
      Color = module.Color;
      Graphics = module.Graphics;
      view = module.view;
      Sprite = module.Sprite;
      Node = module.Node;
      UITransform = module.UITransform;
      Label = module.Label;
      resources = module.resources;
      SpriteFrame = module.SpriteFrame;
      Component = module.Component;
    }, function (module) {
      layoutScreen = module.layoutScreen;
    }, function (module) {
      hudFillWidth = module.hudFillWidth;
      BOSS_HUD_LAYOUT = module.BOSS_HUD_LAYOUT;
      hudFillRect = module.hudFillRect;
      bossPipRect = module.bossPipRect;
      hudDesignToLocal = module.hudDesignToLocal;
      BOSS_HUD_ART = module.BOSS_HUD_ART;
    }],
    execute: function () {
      exports('mountBossView', mountBossView);
      cclegacy._RF.push({}, "bd207w0XChGtba30arRx7gN", "BossView", undefined);
      var ccclass = _decorator.ccclass;
      var STONE = new Color(128, 118, 104, 255);
      var STONE_EDGE = new Color(70, 62, 52, 255);
      var CRACK = new Color(40, 32, 26, 255);
      var FLASH = new Color(255, 255, 255, 255);
      /** P1-tasks P1-12 S14: 喘气时整条血条金白闪烁. */
      var GOLD = new Color(255, 214, 120, 255);
      var GOLD_WHITE = new Color(255, 248, 224, 255);
      var WARNING = new Color(255, 89, 72, 255);
      var RUT = new Color(72, 52, 36, 255);
      var BAR_BG = new Color(30, 24, 20, 220);
      var BAR_FILL = new Color(200, 64, 48, 255);
      var BAR_FRAME = new Color(232, 224, 206, 255);
      var PIP_FULL = new Color(150, 140, 124, 255);
      var PIP_BROKEN = new Color(60, 52, 44, 160);
      var TEXT = new Color(255, 255, 255, 255);
      /** Bar centre distance below the top of the view, in px; below the run status line (64 px). */
      var BAR_TOP_INSET = 112;
      var BAR_HEIGHT = 18;
      var PIP_SIZE = 22;
      var BANNER_TOP_INSET = 230;
      /** Seconds a hit-feedback word stays up, and a broken pip flashes (S14 开裂闪). Visual only. */
      var FEEDBACK_TIME = 0.45;
      var FEEDBACK_TEXT = {
        ding: '叮',
        crack: '裂！',
        "break": '破皮！',
        loop: '圈住！'
      };

      /**
       * Runtime S14 bar: art slices from resources/ui/hud, Graphics fallback if a
       * load fails. Also draws the ruts, the wheel, the S13 warning, and hit words.
       */
      var BossGreyboxView = exports('BossGreyboxView', /*#__PURE__*/function (_Component) {
        _inheritsLoose(BossGreyboxView, _Component);
        function BossGreyboxView() {
          var _this;
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          _this = _Component.call.apply(_Component, [this].concat(args)) || this;
          _this.ctx = null;
          _this.boss = null;
          _this.graphics = null;
          _this.ground = null;
          _this.hud = null;
          _this.artRoot = null;
          _this.fillNode = null;
          _this.breathNode = null;
          _this.pips = [];
          _this.skinFull = null;
          _this.skinCracking = null;
          _this.skinBroken = null;
          _this.artReady = false;
          _this.title = null;
          _this.banner = null;
          _this.feedback = null;
          _this.owned = [];
          return _this;
        }
        var _proto = BossGreyboxView.prototype;
        _proto.configure = function configure(ctx, boss) {
          var _this2 = this;
          this.ctx = ctx;
          this.boss = boss;
          this.graphics = this.node.addComponent(Graphics);
          var groundNode = makeNode(ctx.layers.get('arena'), 'BossRuts');
          this.ground = groundNode.addComponent(Graphics);
          var hudLayer = ctx.layers.get('hud');
          var hudNode = makeNode(hudLayer, 'BossBar');
          this.hud = hudNode.addComponent(Graphics);
          this.artRoot = makeNode(hudNode, 'BossArt');
          makeHudSprite(this.artRoot, 'BossBg', BOSS_HUD_ART.bossBg, BAR_BG, function () {
            _this2.artReady = true;
          });
          this.fillNode = makeHudSprite(this.artRoot, 'BossFill', BOSS_HUD_ART.bossFill, BAR_FILL, function () {
            _this2.artReady = true;
          });
          this.breathNode = makeHudSprite(this.artRoot, 'BossBreath', BOSS_HUD_ART.bossBreath, GOLD_WHITE, function () {
            _this2.artReady = true;
          });
          makeHudSprite(this.artRoot, 'BossFrame', BOSS_HUD_ART.bossFrame, BAR_FRAME, function () {
            _this2.artReady = true;
          });
          loadHudFrame(BOSS_HUD_ART.skinFull, function (frame) {
            _this2.skinFull = frame;
          });
          loadHudFrame(BOSS_HUD_ART.skinCracking, function (frame) {
            _this2.skinCracking = frame;
          });
          loadHudFrame(BOSS_HUD_ART.skinBroken, function (frame) {
            _this2.skinBroken = frame;
          });
          this.title = makeLabel(hudLayer, 'BossName', 17);
          if (this.title) {
            this.title.color = TEXT;
            this.title.enableOutline = true;
            this.title.outlineColor = new Color(44, 30, 20, 255);
            this.title.outlineWidth = 2;
          }
          // UI S13: 名称 + 关键机制提示; 非模态 (no input blocker), 自动消失 after boss.warnTime.
          this.banner = makeLabel(ctx.layers.get('hud'), 'BossWarning', 30);
          if (this.banner) this.banner.string = '滚石巨轮 来袭！\n高速命中才能破石皮';
          this.feedback = makeLabel(ctx.layers.get('fx'), 'BossFeedback', 26);
          this.owned.push(groundNode, hudNode);
          for (var _i = 0, _arr = [this.title, this.banner, this.feedback]; _i < _arr.length; _i++) {
            var label = _arr[_i];
            if (label) this.owned.push(label.node);
          }
        };
        _proto.onEnable = function onEnable() {
          for (var _iterator = _createForOfIteratorHelperLoose(this.owned), _step; !(_step = _iterator()).done;) {
            var node = _step.value;
            node.active = true;
          }
        };
        _proto.onDisable = function onDisable() {
          for (var _iterator2 = _createForOfIteratorHelperLoose(this.owned), _step2; !(_step2 = _iterator2()).done;) {
            var node = _step2.value;
            node.active = false;
          }
        };
        _proto.onDestroy = function onDestroy() {
          for (var _iterator3 = _createForOfIteratorHelperLoose(this.owned), _step3; !(_step3 = _iterator3()).done;) {
            var node = _step3.value;
            node.destroy();
          }
          this.owned.length = 0;
          this.ctx = null;
          this.boss = null;
        };
        _proto.update = function update() {
          var _this$ground, _this$hud;
          var ctx = this.ctx;
          var boss = this.boss;
          var g = this.graphics;
          if (!ctx || !boss || !g) return;
          g.clear();
          (_this$ground = this.ground) == null || _this$ground.clear();
          (_this$hud = this.hud) == null || _this$hud.clear();
          var scale = ctx.toPx({
            x: 1,
            y: 0
          }).x - ctx.toPx({
            x: 0,
            y: 0
          }).x;
          this.drawRuts(ctx, boss, scale);
          var s = boss.state;
          var e = boss.enemy();
          if (!s || !e) {
            this.show(this.title, false);
            this.show(this.banner, false);
            this.show(this.feedback, false);
            if (this.artRoot) this.artRoot.active = false;
            return;
          }
          var clock = boss.clock;
          var p = ctx.toPx(e.pos);
          var r = e.radius * scale;
          if (s.phase === 'windup') {
            var len = ctx.tunables.get('boss.leashDist');
            var end = ctx.toPx({
              x: e.pos.x + s.aim.x * len,
              y: e.pos.y + s.aim.y * len
            });
            g.strokeColor = WARNING;
            g.lineWidth = Math.max(3, r * 0.2);
            g.moveTo(p.x, p.y);
            g.lineTo(end.x, end.y);
            g.stroke();
          }
          var breathe = s.phase === 'breathe';
          var blink = Math.sin(clock * 20) > 0;
          g.fillColor = e.flashLeft > 0 ? FLASH : breathe ? blink ? GOLD : GOLD_WHITE : STONE;
          g.circle(p.x, p.y, r);
          g.fill();
          g.strokeColor = STONE_EDGE;
          g.lineWidth = Math.max(3, r * 0.12);
          g.circle(p.x, p.y, r);
          g.stroke();
          // Spokes turn with the roll distance so speed reads at a glance.
          var spin = s.rolled / Math.max(1e-6, e.radius);
          g.lineWidth = Math.max(2, r * 0.08);
          for (var i = 0; i < 3; i++) {
            var a = spin + i * Math.PI / 3;
            g.moveTo(p.x - Math.cos(a) * r * 0.85, p.y - Math.sin(a) * r * 0.85);
            g.lineTo(p.x + Math.cos(a) * r * 0.85, p.y + Math.sin(a) * r * 0.85);
          }
          g.stroke();
          var skinMax = Math.max(1, Math.floor(ctx.tunables.get('boss.skinHits')));
          if (!breathe) {
            g.strokeColor = CRACK;
            g.lineWidth = Math.max(2, r * 0.06);
            for (var _i2 = s.skinLeft; _i2 < skinMax; _i2++) {
              var _a = _i2 / skinMax * Math.PI * 2 + 0.4;
              g.moveTo(p.x + Math.cos(_a) * r * 0.2, p.y + Math.sin(_a) * r * 0.2);
              g.lineTo(p.x + Math.cos(_a + 0.3) * r * 0.95, p.y + Math.sin(_a + 0.3) * r * 0.95);
            }
            g.stroke();
          }
          this.drawBar(e.hp / Math.max(1e-6, s.maxHp), s.skinLeft, skinMax, breathe, blink, s.feedback === 'crack' || s.feedback === 'break' ? clock - s.feedbackAt : Infinity);
          this.show(this.banner, s.phase === 'warn');
          if (this.banner && s.phase === 'warn') this.place(this.banner.node, BANNER_TOP_INSET);
          var age = clock - s.feedbackAt;
          var fb = this.feedback;
          if (fb && s.feedback && age <= FEEDBACK_TIME) {
            fb.node.active = true;
            fb.string = FEEDBACK_TEXT[s.feedback];
            fb.color = s.feedback === 'ding' ? new Color(200, 200, 200, 255) : s.feedback === 'loop' ? new Color(80, 230, 230, 255) : GOLD;
            fb.node.setPosition(p.x, p.y + r + 30 + age * 40, 0);
          } else {
            this.show(fb, false);
          }
        };
        _proto.drawRuts = function drawRuts(ctx, boss, scale) {
          var g = this.ground;
          if (!g) return;
          var life = Math.max(1e-6, ctx.tunables.get('boss.rutLife'));
          g.lineWidth = Math.max(2, ctx.tunables.get('boss.rutWidth') * scale);
          for (var _iterator4 = _createForOfIteratorHelperLoose(boss.ruts), _step4; !(_step4 = _iterator4()).done;) {
            var rut = _step4.value;
            var fade = 1 - Math.min(1, (boss.clock - rut.t) / life);
            if (fade <= 0) continue;
            g.strokeColor = new Color(RUT.r, RUT.g, RUT.b, Math.round(170 * fade));
            var a = ctx.toPx(rut.a);
            var b = ctx.toPx(rut.b);
            g.moveTo(a.x, a.y);
            g.lineTo(b.x, b.y);
            g.stroke();
          }
        }

        /** UI S14 / P1-tasks P1-12: top bar + 3 stone-skin pips (完好 / 开裂闪 / 碎掉), 喘气 gold-white flash. */;
        _proto.drawBar = function drawBar(ratio, skinLeft, skinMax, breathe, blink, crackAge) {
          var g = this.hud;
          if (!g) return;
          var size = view.getVisibleSize();
          var hud = layoutScreen(size.width, size.height).hud;
          if (this.artReady && this.artRoot) {
            this.artRoot.active = true;
            this.layoutBossArt(ratio, skinLeft, skinMax, breathe, blink, crackAge, size, hud);
            return;
          }
          if (this.artRoot) this.artRoot.active = false;
          var layout = layoutScreen(size.width, size.height);
          var cx = layout.arenaOriginX + layout.arenaWidthPx / 2 - size.width / 2;
          var cy = layout.arenaOriginY + layout.arenaHeightPx - BAR_TOP_INSET - size.height / 2;
          var pipsW = skinMax * (PIP_SIZE + 6);
          var w = layout.arenaWidthPx * 0.62;
          var x0 = cx - (w + pipsW) / 2;
          g.fillColor = BAR_BG;
          g.rect(x0, cy - BAR_HEIGHT / 2, w, BAR_HEIGHT);
          g.fill();
          // P1-12: low values are clipped by proportion, not squashed.
          g.fillColor = breathe ? blink ? GOLD : GOLD_WHITE : BAR_FILL;
          g.rect(x0, cy - BAR_HEIGHT / 2, w * Math.max(0, Math.min(1, ratio)), BAR_HEIGHT);
          g.fill();
          g.strokeColor = BAR_FRAME;
          g.lineWidth = 2;
          g.rect(x0, cy - BAR_HEIGHT / 2, w, BAR_HEIGHT);
          g.stroke();
          var shown = breathe ? 0 : skinLeft;
          for (var i = 0; i < skinMax; i++) {
            var px = x0 + w + 8 + i * (PIP_SIZE + 6);
            var cracking = i === shown && crackAge <= FEEDBACK_TIME && !breathe;
            g.fillColor = breathe ? blink ? GOLD : GOLD_WHITE : i < shown ? PIP_FULL : cracking ? FLASH : PIP_BROKEN;
            g.rect(px, cy - PIP_SIZE / 2, PIP_SIZE, PIP_SIZE);
            g.fill();
            g.strokeColor = BAR_FRAME;
            g.rect(px, cy - PIP_SIZE / 2, PIP_SIZE, PIP_SIZE);
            g.stroke();
          }
          var label = this.title;
          if (label) {
            label.node.active = true;
            label.string = breathe ? '滚石巨轮 · 喘气！' : '滚石巨轮';
            label.node.setPosition(x0 + w / 2, cy + BAR_HEIGHT + 4, 0);
          }
        };
        _proto.layoutBossArt = function layoutBossArt(ratio, skinLeft, skinMax, breathe, blink, crackAge, size, hud) {
          placeHudChild(this.artRoot, 'BossBg', BOSS_HUD_LAYOUT.bossBg, size, hud);
          placeHudChild(this.artRoot, 'BossFrame', BOSS_HUD_LAYOUT.bossFrame, size, hud);
          var fillW = hudFillWidth(BOSS_HUD_LAYOUT.bossFill.width, ratio, BOSS_HUD_LAYOUT.fillMin);
          resizeHudFill(this.fillNode, hudFillRect(BOSS_HUD_LAYOUT.bossFill, fillW), size, hud, BAR_FILL);
          if (this.breathNode) {
            this.breathNode.active = breathe;
            if (breathe) {
              resizeHudFill(this.breathNode, BOSS_HUD_LAYOUT.bossBreath, size, hud, blink ? GOLD : GOLD_WHITE);
              var sprite = this.breathNode.getComponent(Sprite);
              if (sprite) sprite.color = blink ? GOLD : GOLD_WHITE;
            }
          }
          this.ensurePips(skinMax);
          var shown = breathe ? 0 : skinLeft;
          for (var i = 0; i < this.pips.length; i++) {
            var pip = this.pips[i];
            if (!pip) continue;
            var on = i < skinMax;
            pip.active = on;
            if (!on) continue;
            placeHudChild(this.artRoot, pip.name, bossPipRect(i), size, hud);
            var cracking = i === shown && crackAge <= FEEDBACK_TIME && !breathe;
            var _frame = i < shown ? this.skinFull : cracking ? this.skinCracking : this.skinBroken;
            var _sprite = pip.getComponent(Sprite);
            if (_sprite && _frame) _sprite.spriteFrame = _frame;
          }
          var label = this.title;
          if (label) {
            label.node.active = true;
            label.string = breathe ? '滚石巨轮 · 喘气！' : '滚石巨轮';
            var pos = hudDesignToLocal(BOSS_HUD_LAYOUT.bossText, size.width, size.height, hud);
            label.node.setPosition(pos.x, pos.y, 0);
          }
        };
        _proto.ensurePips = function ensurePips(count) {
          var parent = this.artRoot;
          if (!parent) return;
          while (this.pips.length < count) {
            var index = this.pips.length;
            var pip = makeHudSprite(parent, "BossSkin" + index, BOSS_HUD_ART.skinFull, PIP_FULL);
            this.pips.push(pip);
          }
        };
        _proto.place = function place(node, topInset) {
          var size = view.getVisibleSize();
          var layout = layoutScreen(size.width, size.height);
          node.setPosition(layout.arenaOriginX + layout.arenaWidthPx / 2 - size.width / 2, layout.arenaOriginY + layout.arenaHeightPx - topInset - size.height / 2, 0);
        };
        _proto.show = function show(label, on) {
          if (label) label.node.active = on;
        };
        return BossGreyboxView;
      }(Component));
      ccclass('BossGreyboxView')(BossGreyboxView);
      function makeNode(parent, name) {
        var node = new Node(name);
        node.layer = parent.layer;
        node.addComponent(UITransform);
        parent.addChild(node);
        return node;
      }
      function makeLabel(parent, name, size) {
        var label = makeNode(parent, name).addComponent(Label);
        if (!label) return null;
        label.fontSize = size;
        label.lineHeight = size + 6;
        label.color = TEXT;
        label.node.active = false;
        return label;
      }
      function loadHudFrame(spec, done) {
        resources.load(spec.path + "/spriteFrame", SpriteFrame, function (error, frame) {
          if (error || !frame) {
            done(null);
            return;
          }
          if (spec.slice) {
            frame.insetTop = spec.slice.top;
            frame.insetBottom = spec.slice.bottom;
            frame.insetLeft = spec.slice.left;
            frame.insetRight = spec.slice.right;
          }
          done(frame);
        });
      }
      function makeHudSprite(parent, name, spec, fallback, onReady) {
        var _node$getComponent;
        var node = makeNode(parent, name);
        (_node$getComponent = node.getComponent(UITransform)) == null || _node$getComponent.setContentSize(spec.width, spec.height);
        loadHudFrame(spec, function (frame) {
          var _node$getComponent2;
          if (node.isValid === false) return;
          if (frame === null) {
            var graphics = node.addComponent(Graphics);
            graphics.rect(-spec.width / 2, -spec.height / 2, spec.width, spec.height);
            graphics.fillColor = fallback;
            graphics.fill();
            return;
          }
          var sprite = node.addComponent(Sprite);
          sprite.spriteFrame = frame;
          sprite.type = spec.slice === null ? Sprite.Type.SIMPLE : Sprite.Type.SLICED;
          sprite.sizeMode = Sprite.SizeMode.CUSTOM;
          (_node$getComponent2 = node.getComponent(UITransform)) == null || _node$getComponent2.setContentSize(spec.width, spec.height);
          if (onReady) onReady();
        });
        return node;
      }
      function placeHudChild(parent, name, rect, size, hud) {
        var _child$getComponent;
        if (!parent) return;
        var child = parent.getChildByName(name);
        if (!child) return;
        var pos = hudDesignToLocal(rect, size.width, size.height, hud);
        child.setPosition(pos.x, pos.y, 0);
        (_child$getComponent = child.getComponent(UITransform)) == null || _child$getComponent.setContentSize(rect.width, rect.height);
      }
      function resizeHudFill(node, rect, size, hud, fallback) {
        var _node$getComponent3;
        if (!node) return;
        node.active = rect.width > 0;
        if (rect.width <= 0) return;
        var pos = hudDesignToLocal(rect, size.width, size.height, hud);
        node.setPosition(pos.x, pos.y, 0);
        (_node$getComponent3 = node.getComponent(UITransform)) == null || _node$getComponent3.setContentSize(rect.width, rect.height);
        var graphics = node.getComponent(Graphics);
        if (graphics) {
          graphics.clear();
          graphics.rect(-rect.width / 2, -rect.height / 2, rect.width, rect.height);
          graphics.fillColor = fallback;
          graphics.fill();
        }
      }
      function mountBossView(ctx, boss) {
        var parent = ctx.layers.get('enemies');
        // Core's headless ports supply only { name }, not a Cocos Node.
        if (typeof parent.addChild !== 'function') return;
        var node = makeNode(parent, 'BossGreybox');
        var component = node.addComponent(BossGreyboxView);
        if (component) component.configure(ctx, boss);
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/Camera.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _createForOfIteratorHelperLoose, cclegacy;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports('edgeArrow', edgeArrow);
      cclegacy._RF.push({}, "9a3e9xsMpJFto3yMmofvL5S", "Camera", undefined);
      /** Visible range in u (P0 §3 镜头: 10u × 15u, Fit Width). Independent of the map size. */
      var VIEW_WIDTH = exports('VIEW_WIDTH', 10);
      var VIEW_HEIGHT = exports('VIEW_HEIGHT', 15);
      /**
       * Follow camera. `center` is the simulated view center; shake is display-only
       * and never written here (P0 §4.2 `ctx.camera`).
       */
      var Camera = exports('Camera', /*#__PURE__*/function () {
        function Camera() {
          this.center = {
            x: 0,
            y: 0
          };
          this.viewW = VIEW_WIDTH;
          this.viewH = VIEW_HEIGHT;
          this.targets = [];
        }
        var _proto = Camera.prototype;
        _proto.inView = function inView(p, margin) {
          if (margin === void 0) {
            margin = 0;
          }
          return Math.abs(p.x - this.center.x) < this.viewW / 2 + margin && Math.abs(p.y - this.center.y) < this.viewH / 2 + margin;
        };
        _proto.snap = function snap(target) {
          this.center.x = target.x;
          this.center.y = target.y;
        }

        /**
         * `lerp` is a time constant in seconds; 0 hard-locks onto the target.
         * P0 未定义，自选: exponential smoothing, the same form as pet acceleration.
         */;
        _proto.follow = function follow(target, dt, lerp) {
          if (!(lerp > 0) || !(dt > 0)) {
            this.snap(target);
            return;
          }
          var alpha = 1 - Math.exp(-dt / lerp);
          this.center.x += (target.x - this.center.x) * alpha;
          this.center.y += (target.y - this.center.y) * alpha;
        };
        _proto.addIndicator = function addIndicator(kind, pos) {
          var _this = this;
          var target = {
            kind: kind,
            pos: pos
          };
          this.targets.push(target);
          return function () {
            var i = _this.targets.indexOf(target);
            if (i >= 0) _this.targets.splice(i, 1);
          };
        }

        /** Arrows for every registered target that is currently outside the view. */;
        _proto.arrows = function arrows(inset) {
          var out = [];
          for (var _iterator = _createForOfIteratorHelperLoose(this.targets), _step; !(_step = _iterator()).done;) {
            var target = _step.value;
            var p = target.pos();
            if (!p) continue;
            var arrow = edgeArrow(this.center, this.viewW, this.viewH, p, inset);
            if (arrow) out.push({
              kind: target.kind,
              x: arrow.x,
              y: arrow.y,
              angle: arrow.angle
            });
          }
          return out;
        };
        return Camera;
      }());

      /**
       * Point on the view rectangle, `inset` u inside its edge, along the ray from the
       * view center toward `target`. Null when the target is inside the view.
       */
      function edgeArrow(center, viewW, viewH, target, inset) {
        var dx = target.x - center.x;
        var dy = target.y - center.y;
        if (Math.abs(dx) < viewW / 2 && Math.abs(dy) < viewH / 2) return null;
        var hw = Math.max(0, viewW / 2 - inset);
        var hh = Math.max(0, viewH / 2 - inset);
        var sx = Math.abs(dx) > 1e-9 ? hw / Math.abs(dx) : Infinity;
        var sy = Math.abs(dy) > 1e-9 ? hh / Math.abs(dy) : Infinity;
        var s = Math.min(sx, sy);
        return {
          x: viewW / 2 + dx * s,
          y: viewH / 2 + dy * s,
          angle: Math.atan2(dy, dx)
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/ChainCamera.ts", ['cc', './ForgeContract.ts', './ScreenLayout.ts'], function (exports) {
  var cclegacy, FORGE_CONTRACT_DEFAULTS, swordSlots, UNIT_PX;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      FORGE_CONTRACT_DEFAULTS = module.FORGE_CONTRACT_DEFAULTS;
      swordSlots = module.swordSlots;
    }, function (module) {
      UNIT_PX = module.UNIT_PX;
    }],
    execute: function () {
      exports({
        chainCameraZoom: chainCameraZoom,
        chainLengthU: chainLengthU,
        chainOccupancySlots: chainOccupancySlots,
        collectChainLevels: collectChainLevels,
        forgeZoomParams: forgeZoomParams,
        smoothZoom: smoothZoom,
        worldZoomOffset: worldZoomOffset
      });
      cclegacy._RF.push({}, "7ba1cQx4txNDL9I5Uy/6gv0", "ChainCamera", undefined);

      /**
       * Visual camera zoom for a long sword chain (#108 PR5).
       *
       * `ctx.camera` (core) stays a fixed 10u × 15u follow view: spawn, `inView` and
       * `toPx` keep that contract. Run pulls the *picture* out by scaling the world
       * layers around the view center so a slots × 72px chain can stay on screen.
       * Chain stack / break / rope rules are not changed to squeeze it.
       */

      function forgeZoomParams(tunables) {
        return tunables.has('forge.chainSlotPx') && tunables.has('forge.slotMax') ? tunables : FORGE_CONTRACT_DEFAULTS;
      }
      function chainOccupancySlots(levels, params) {
        if (params === void 0) {
          params = FORGE_CONTRACT_DEFAULTS;
        }
        var sum = 0;
        for (var i = 0; i < levels.length; i++) sum += swordSlots(levels[i], params);
        return sum;
      }
      function chainLengthU(occupancy, slotPx) {
        if (slotPx === void 0) {
          slotPx = UNIT_PX;
        }
        var px = Number.isFinite(slotPx) && slotPx > 0 ? slotPx : UNIT_PX;
        return occupancy * px / UNIT_PX;
      }
      function collectChainLevels(linkGrades, slots, mainLevel) {
        var levels = [];
        if (linkGrades && linkGrades.length > 0) {
          for (var i = 0; i < linkGrades.length; i++) levels.push(linkGrades[i]);
        } else {
          var n = Math.max(0, Math.floor(slots));
          for (var _i = 0; _i < n; _i++) levels.push(0);
        }
        if (mainLevel !== null && Number.isFinite(mainLevel)) levels.push(mainLevel);
        return levels;
      }

      /**
       * Zoom is 1 while the chain fits. Past the fit length (half the shorter view
       * side, or `startSlots` × slot-u if that is tighter) zoom = fit / length,
       * clamped to `zoomMin`. Longer chains may leave the screen — that is the
       * "carrying too much" signal, not a reason to shrink the swords.
       */
      function chainCameraZoom(args) {
        var slotPx = args.slotPx !== undefined && Number.isFinite(args.slotPx) && args.slotPx > 0 ? args.slotPx : UNIT_PX;
        var slotU = slotPx / UNIT_PX;
        var viewFit = Math.min(args.viewW, args.viewH) / 2;
        var startU = Number.isFinite(args.startSlots) && args.startSlots > 0 ? args.startSlots * slotU : viewFit;
        var fitU = Math.min(startU, viewFit);
        if (!(args.lengthU > fitU) || !(fitU > 0)) return 1;
        var raw = fitU / args.lengthU;
        var min = Number.isFinite(args.zoomMin) && args.zoomMin > 0 ? Math.min(1, args.zoomMin) : 0;
        return Math.max(min, Math.min(1, raw));
      }

      /** Same exponential smoothing as `Camera.follow` (`1 - exp(-dt / tau)`). */
      function smoothZoom(current, target, dt, smoothS) {
        if (!(smoothS > 0) || !(dt > 0)) return target;
        var alpha = 1 - Math.exp(-dt / smoothS);
        return current + (target - current) * alpha;
      }

      /** Keep the view center fixed while the world layers scale by `zoom`. */
      function worldZoomOffset(viewW, viewH, ppu, zoom) {
        var cx = viewW / 2 * ppu;
        var cy = viewH / 2 * ppu;
        return {
          x: cx * (1 - zoom),
          y: cy * (1 - zoom)
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/ChainLayout.ts", ['cc', './ForgeContract.ts', './ScreenLayout.ts'], function (exports) {
  var cclegacy, FORGE_CONTRACT_DEFAULTS, swordSlots, swordLook, UNIT_PX;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      FORGE_CONTRACT_DEFAULTS = module.FORGE_CONTRACT_DEFAULTS;
      swordSlots = module.swordSlots;
      swordLook = module.swordLook;
    }, function (module) {
      UNIT_PX = module.UNIT_PX;
    }],
    execute: function () {
      exports({
        chainFitsView: chainFitsView,
        chainLengthPx: chainLengthPx,
        chainLengthU: chainLengthU,
        chainOccupancySlots: chainOccupancySlots,
        collectChainLevels: collectChainLevels,
        forgeLayoutParams: forgeLayoutParams,
        swordChainLengthPx: swordChainLengthPx,
        swordOccupancySlots: swordOccupancySlots,
        viewFitLengthU: viewFitLengthU
      });
      cclegacy._RF.push({}, "716c03JQSRF5ILoweg+kbdD", "ChainLayout", undefined);

      /**
       * Battle chain layout (#108 PR5). Each sword occupies
       * `swordSlots(level)` from the forge contract (at most 2). Display length is
       * slots × `forge.chainSlotPx` (72px = 1u). Chain rules (stack / break / rope)
       * stay in sword/chain; this file only measures length.
       */

      var CHAIN_SLOT_PX = exports('CHAIN_SLOT_PX', 72);
      function forgeLayoutParams(tunables) {
        return tunables.has('forge.chainSlotPx') && tunables.has('forge.slotMax') ? tunables : FORGE_CONTRACT_DEFAULTS;
      }

      /** Occupancy of one sword: `min(slotMax, base + level × perLevel)`, cap 2. */
      function swordOccupancySlots(level, params) {
        if (params === void 0) {
          params = FORGE_CONTRACT_DEFAULTS;
        }
        return swordSlots(level, params);
      }

      /** One sword's chain length in px. Same number as `swordLook(level).chainLengthPx`. */
      function swordChainLengthPx(level, params) {
        if (params === void 0) {
          params = FORGE_CONTRACT_DEFAULTS;
        }
        return swordLook(level, params).chainLengthPx;
      }
      function chainOccupancySlots(levels, params) {
        if (params === void 0) {
          params = FORGE_CONTRACT_DEFAULTS;
        }
        var sum = 0;
        for (var i = 0; i < levels.length; i++) sum += swordOccupancySlots(levels[i], params);
        return sum;
      }
      function chainLengthPx(levels, params) {
        if (params === void 0) {
          params = FORGE_CONTRACT_DEFAULTS;
        }
        return chainOccupancySlots(levels, params) * params.get('forge.chainSlotPx');
      }

      /** Map units. Default 72px = 1u, so occupancy 1 → 1u. */
      function chainLengthU(levels, params) {
        if (params === void 0) {
          params = FORGE_CONTRACT_DEFAULTS;
        }
        return chainLengthPx(levels, params) / UNIT_PX;
      }

      /** Nearest view edge from a centered pet: half the shorter side. */
      function viewFitLengthU(viewW, viewH) {
        return Math.min(viewW, viewH) / 2;
      }

      /** True when the chain is no longer than the centered view (no zoom needed). */
      function chainFitsView(lengthU, viewW, viewH) {
        return lengthU <= viewFitLengthU(viewW, viewH) + 1e-9;
      }

      /**
       * Levels that make up the dragged chain: each visible link, then the main
       * sword when `mainLevel` is known. Missing `linkGrades` counts each slot as +0.
       */
      function collectChainLevels(linkGrades, slots, mainLevel) {
        var levels = [];
        if (linkGrades && linkGrades.length > 0) {
          for (var i = 0; i < linkGrades.length; i++) levels.push(linkGrades[i]);
        } else {
          var n = Math.max(0, Math.floor(slots));
          for (var _i = 0; _i < n; _i++) levels.push(0);
        }
        if (mainLevel !== null && Number.isFinite(mainLevel)) levels.push(mainLevel);
        return levels;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/contracts.ts", ['cc'], function () {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "dc49fV1Q5tLWZbMmU0pXRY3", "contracts", undefined);
      /**
       * `boss` is 滚石巨轮 (docs/design/P1-tasks.md P1-07; docs/design/GDD.md §8.3).
       * It answers the same queries and `hit` as other enemies, but its death emits
       * `boss:defeated` instead of `enemy:died`: its reward is not cost based
       * (docs/design/P1-numbers-batch1.md §1.1 `xp.boss`, §2.1 `loot.bossCoin`).
       */
      /**
       * A boar that is currently in its charge phase.
       * Windup and stun do not qualify. Declared here so sword/loop can ask
       * without importing the enemy module (issue #3 correction).
       * The enemy module implements this; core does not.
       */
      /** Read-only rig snapshot for the HUD, telemetry, and the enemy module. */
      /** 新手 5 波局 / 标准 10 波局 (docs/design/GDD.md §5.2, §5.5, §14.1; docs/design/P1-tasks.md P1-01). */
      /**
       * Run state machine phases (docs/design/GDD.md §5.2 单局结构; docs/design/P1-tasks.md P1-01).
       * 选宠 → 战斗波 → (炉门) → 三选一 → 铁匠铺 → 下一波 / Boss 波 → 宝箱 → 结算.
       * The forge door is not a phase: it opens inside `combat` (`IRunInfo.doorOpen`).
       * `result` covers both death (S19) and the settlement page (S20).
       */
      /**
       * How a run ended (docs/design/P1-tasks.md P1-01, Q2; docs/design/UI-requirements.md §3 S17 / S19 / S20).
       * `victory`: 最后一波 Boss 后撤离结算. `abandoned`: 暂停页放弃本局.
       */
      /**
       * Read-only run snapshot (docs/design/GDD.md §5.2, §8.4; docs/design/P1-tasks.md P1-01).
       * Provided by run (issue #59).
       */
      /** Key-value save storage (docs/design/GDD.md §13.6 `storage`). Never throws; a failed write is dropped. */
      /**
       * Which adapter is running (docs/design/GDD.md §13.6 平台适配层 + 浏览器模拟实现;
       * docs/design/P1-tasks.md P1-13 抖音测试包). `web` is core's `LocalPlatform`.
       */
      /** Rewarded video placements (docs/design/GDD.md §13.6 `showRewarded`, §12.1 广告点位). */
      /** Rewarded video outcome (docs/design/GDD.md §13.6 `showRewarded`). Only `rewarded` grants the reward. */
      /**
       * Platform adapter (docs/design/GDD.md §13.6; docs/design/P1-tasks.md P1-13).
       * Provided by platform (issue #60); core provides `LocalPlatform` until then.
       * P1 implements only `storage`, `healthAdvice` and the lifecycle hooks (not in
       * §13.6; added for P1-01 切后台自动暂停 and the mini-game onHide/onShow); the
       * members §13.6 lists for ads, sidebar, rank, recorder and content check are
       * optional until P2 (GDD §14.1, P1-tasks Q3).
       */
      /**
       * What the pet collects (docs/design/P1-tasks.md P1-02; docs/design/P1-numbers-batch1.md §1.1, §2.1).
       * Coins drop and are picked up; XP is credited on the kill with no drop, so it
       * only appears in `loot:pickup`.
       */
      /** Coin sinks (docs/design/GDD.md §7.6; docs/design/P1-numbers-batch1.md §2.2 金币用途 ①–⑤). */
      /**
       * Reason of every coin change (docs/design/P1-tasks.md P1-02 埋点记录金币收支).
       * There is no ad reason (docs/design/GDD.md §12.2: 广告不给金币).
       */
      /**
       * Run wallet and level (docs/design/P1-tasks.md P1-02; docs/design/P1-numbers-batch1.md §1–§2;
       * docs/design/GDD.md §7.5, §11.1). Provided by loot. Coins reset on `run:start`.
       */
      /** Pick-1-of-3 tiers (docs/design/GDD.md §7.5 档次; docs/design/P1-tasks.md P1-03, Q9). P1 legendary is limited to the two Q9 examples. */
      /**
       * Where a pick-1-of-3 comes from (docs/design/GDD.md §7.5; docs/design/P1-tasks.md P1-03, P1-07).
       * `levelUp`: 波末三选一. `bossChest`: S15 Boss 宝箱三选一, items only.
       */
      /**
       * One option of a pick-1-of-3 (docs/design/GDD.md §7.5 选项池; docs/design/UI-requirements.md §3 S08).
       * `id` is a stable key the UI maps to text, e.g. `dmgAll`, `item:whetstone`.
       */
      /** Item rarity (docs/design/GDD.md §7.3 稀有度; docs/design/P1-tasks.md P1-06). P1 ships white and green only. */
      /**
       * Stacking type (docs/design/GDD.md §7.2 叠加类型): linear, hyperbolic,
       * diminishing, multiplicative. 质变 is reported by `upgrade:quality`.
       */
      /**
       * An item on the shelf (docs/design/GDD.md §7.6 货架; docs/design/P1-tasks.md P1-05, P1-06).
       * Upgrade owns the item table and draws the candidates; forge owns the shelf
       * UI, the price `basePrice × (1 + 0.1 × wave)`, locks and the reroll fee.
       */
      /**
       * An owned item and its stacks (docs/design/GDD.md §7.2–§7.3; docs/design/P1-tasks.md P1-06;
       * docs/design/UI-requirements.md §8 Q14 暂停页道具与层数). `basePrice` lets forge price 半价卖回.
       */
      /**
       * Items for the pause page and the shelf (docs/design/P1-tasks.md P1-03, P1-05, P1-06;
       * docs/design/GDD.md §7.6). Provided by upgrade. Stacks change only through
       * pick-1-of-3 and `forge:buyItem` / `forge:sellItem`.
       */
      /**
       * Stat modifiers from upgrades and items (docs/design/P1-numbers-batch1.md §4.1;
       * docs/design/P1-tasks.md P1-03 / P1-06: 效果走调参项 / 修正值，不改公式). Provided by upgrade, read by
       * the module that owns the stat: effective = base × (1 + add(key)) × mul(key).
       * Keys are the owning module's tunable keys (`pet.speed`, `pet.maxHp`, ...) or
       * damage keys `dmg.all` / `dmg.<DamageSource>`. `upgrade:modifier` fires on change.
       */
      /** Five strike results (docs/design/GDD.md §9.3 五种结果: +2 / +1 / 0 / −1 / 碎裂; docs/design/P1-tasks.md P1-04). */
      /**
       * Forge rework outcomes (issue #108): great +2, success +1, keep 0, damage −1, break.
       * Distinct from `ForgeResult` (P1-04 lot-tube names). PR2 maps draws onto this.
       */
      /** Percentage weights for the five `ForgeOutcome`s; the five values always sum to 100. */
      /**
       * Shared look row (issue #108). `swordLook(level)` fills `chainLengthPx` and
       * post-20 `glow` from the level; other fields come from the matching row.
       */
      /**
       * In-run sword identity for the forge rework (issue #108). Look, slots and
       * odds are derived from `level` only; no peak, name, or affix on this object.
       */
      /**
       * 大成功 small affix (docs/design/GDD.md §9.3; docs/design/P1-tasks.md P1-04):
       * W +0.5 or Lg +0.5, 50 / 50. Element affixes are backlog after P1.
       */
      /**
       * Tube kind (docs/design/GDD.md §9.3, §5.5; docs/design/P1-tasks.md P1-04 新手局三条例外):
       * tutorial tubes I / II (publicly labelled) or a level-tier tube.
       */
      /**
       * The public tube (docs/design/GDD.md §9.3: 20 支签，全部公开显示; §9.5 剩余签数一直可见;
       * docs/design/P1-tasks.md P1-04).
       */
      /**
       * Main sword after forging (docs/design/GDD.md §9.1, §9.2 学徒剑 W2 / Lg2 / Cv1, §13.3;
       * docs/design/P1-tasks.md P1-04). Sword applies it.
       */
      /**
       * Anvil snapshot (docs/design/GDD.md §7.6 铁砧, §9.3, §9.5; docs/design/P1-tasks.md P1-04 / P1-05).
       * Provided by forge. Draws use `createForgeRng(session seed, k)` only; forge
       * never reads `platform` (P1-tasks P1-04 红线, GDD §9.7 / §12.2).
       */
      /**
       * Hook for the future seamless ground renderer: large seamless textures,
       * irregular blends between terrain regions, decals to break repetition
       * (GDD §4.4 地形, 2026-10-19 补充决策; UI R9). Interface only; no shader yet.
       * Presentation only: terrain never blocks or slows movement.
       */
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/CoreArenaView.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _inheritsLoose, cclegacy, _decorator, Color, UITransform, Graphics, Component;
  return {
    setters: [function (module) {
      _inheritsLoose = module.inheritsLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
      _decorator = module._decorator;
      Color = module.Color;
      UITransform = module.UITransform;
      Graphics = module.Graphics;
      Component = module.Component;
    }],
    execute: function () {
      var _dec, _class;
      cclegacy._RF.push({}, "7ab89q8c/ZAH4LGqMci4lbI", "CoreArenaView", undefined);
      var ccclass = _decorator.ccclass;
      var FILL = new Color(36, 36, 42, 255);
      var BORDER = new Color(196, 196, 204, 255);
      var GRID = new Color(46, 46, 54, 255);
      var OUTSIDE = new Color(12, 12, 16, 255);
      /** How far past the walls the dark outside area is drawn, in u. Covers half a view plus shake. */
      var OUTSIDE_PAD = 15;

      /**
       * Greybox map (P0 §5 地图): dark-grey floor with a low-contrast 1 u grid so
       * camera motion is visible, light wall line, darker area outside the walls.
       * The node origin is the map's bottom-left; CoreBootstrap moves it with the camera.
       */
      var CoreArenaView = exports('CoreArenaView', (_dec = ccclass('CoreArenaView'), _dec(_class = /*#__PURE__*/function (_Component) {
        _inheritsLoose(CoreArenaView, _Component);
        function CoreArenaView() {
          return _Component.apply(this, arguments) || this;
        }
        var _proto = CoreArenaView.prototype;
        _proto.redraw = function redraw(pxPerUnit, mapWidth, mapHeight) {
          var _this$getComponent, _this$getComponent2;
          var width = mapWidth * pxPerUnit;
          var height = mapHeight * pxPerUnit;
          var pad = OUTSIDE_PAD * pxPerUnit;
          // addComponent returns null when the node cannot take the component (e.g. a conflicting one is present).
          var transform = (_this$getComponent = this.getComponent(UITransform)) != null ? _this$getComponent : this.addComponent(UITransform);
          if (!transform) {
            console.warn('[CoreArenaView] missing UITransform; skipping redraw');
            return;
          }
          transform.setAnchorPoint(0, 0);
          transform.setContentSize(width, height);
          var graphics = (_this$getComponent2 = this.getComponent(Graphics)) != null ? _this$getComponent2 : this.addComponent(Graphics);
          if (!graphics) {
            console.warn('[CoreArenaView] missing Graphics; skipping redraw');
            return;
          }
          graphics.clear();
          graphics.fillColor = OUTSIDE;
          graphics.rect(-pad, -pad, width + 2 * pad, height + 2 * pad);
          graphics.fill();
          graphics.fillColor = FILL;
          graphics.rect(0, 0, width, height);
          graphics.fill();
          graphics.strokeColor = GRID;
          graphics.lineWidth = 1;
          for (var x = 1; x < mapWidth; x++) {
            graphics.moveTo(x * pxPerUnit, 0);
            graphics.lineTo(x * pxPerUnit, height);
          }
          for (var y = 1; y < mapHeight; y++) {
            graphics.moveTo(0, y * pxPerUnit);
            graphics.lineTo(width, y * pxPerUnit);
          }
          graphics.stroke();
          graphics.strokeColor = BORDER;
          graphics.lineWidth = 2;
          graphics.rect(0, 0, width, height);
          graphics.stroke();
        };
        return CoreArenaView;
      }(Component)) || _class));
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/CoreBootstrap.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './App.ts', './Layers.ts', './ScreenLayout.ts', './CoreArenaView.ts', './CoreDebugInput.ts'], function (exports) {
  var _inheritsLoose, _createForOfIteratorHelperLoose, _createClass, cclegacy, _decorator, Color, Vec3, sys, view, game, Game, Graphics, Node, UITransform, screen, Component, createApp, LAYER_NAMES, layoutScreen, CoreArenaView, CoreDebugInput;
  return {
    setters: [function (module) {
      _inheritsLoose = module.inheritsLoose;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
      _decorator = module._decorator;
      Color = module.Color;
      Vec3 = module.Vec3;
      sys = module.sys;
      view = module.view;
      game = module.game;
      Game = module.Game;
      Graphics = module.Graphics;
      Node = module.Node;
      UITransform = module.UITransform;
      screen = module.screen;
      Component = module.Component;
    }, function (module) {
      createApp = module.createApp;
    }, function (module) {
      LAYER_NAMES = module.LAYER_NAMES;
    }, function (module) {
      layoutScreen = module.layoutScreen;
    }, function (module) {
      CoreArenaView = module.CoreArenaView;
    }, function (module) {
      CoreDebugInput = module.CoreDebugInput;
    }],
    execute: function () {
      var _dec, _dec2, _class;
      cclegacy._RF.push({}, "da87c0RRPFDUI5WRfmR19hv", "CoreBootstrap", undefined);
      var ccclass = _decorator.ccclass,
        executionOrder = _decorator.executionOrder;
      var HUD_TINT = new Color(90, 140, 200, 48);
      var THUMB_TINT = new Color(200, 170, 90, 36);
      /** Greybox edge arrows (P0 §5 屏幕边缘指示): distance inside the view edge and size, in u. */
      var ARROW_INSET = 0.4;
      var ARROW_SIZE = 0.3;
      var ARROW_STYLE = {
        boss: {
          color: new Color(255, 80, 72, 255),
          scale: 1.5,
          filled: true
        },
        elite: {
          color: new Color(255, 170, 60, 255),
          scale: 1.2,
          filled: true
        },
        mainSword: {
          color: new Color(225, 232, 240, 255),
          scale: 1,
          filled: false
        },
        forgeDoor: {
          color: new Color(255, 214, 90, 255),
          scale: 1.2,
          filled: false
        }
      };

      /**
       * Builds the layer tree, draws the bounded map around the follow camera,
       * draws screen-edge arrows, and runs the fixed step.
       * Attach this to the Canvas of Main.scene. It does not load another scene.
       * Unsubscribe happens in onDisable and onDestroy.
       * Runs before default-order components so every view reads the post-tick camera.
       */
      var CoreBootstrap = exports('CoreBootstrap', (_dec = ccclass('CoreBootstrap'), _dec2 = executionOrder(-1), _dec(_class = _dec2(_class = /*#__PURE__*/function (_Component) {
        _inheritsLoose(CoreBootstrap, _Component);
        function CoreBootstrap() {
          var _this;
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          _this = _Component.call.apply(_Component, [this].concat(args)) || this;
          /** Optional seamless ground renderer; the greybox map is drawn when absent. */
          _this.groundBlend = null;
          _this.app = null;
          _this.started = false;
          _this.world = null;
          _this.arenaView = null;
          _this.arrows = null;
          _this.hudGuide = null;
          _this.thumbGuide = null;
          _this.layerNodes = new Map();
          _this.baseX = 0;
          _this.baseY = 0;
          _this.pixelsPerUnit = 72;
          _this.drawnMap = {
            width: -1,
            height: -1,
            ppu: -1
          };
          return _this;
        }
        var _proto = CoreBootstrap.prototype;
        _proto.onLoad = function onLoad() {
          var _this2 = this,
            _sys$localStorage;
          this.buildTree();
          this.app = createApp({
            layers: {
              get: function get(name) {
                var node = _this2.layerNodes.get(name);
                if (!node) throw new Error("Missing layer: " + name);
                return node;
              }
            },
            toPx: function toPx(p) {
              return new Vec3(p.x * _this2.pixelsPerUnit, p.y * _this2.pixelsPerUnit, 0);
            },
            pxPerUnit: function pxPerUnit() {
              return _this2.pixelsPerUnit;
            },
            setShake: function setShake(offset) {
              return _this2.applyShake(offset);
            },
            storage: (_sys$localStorage = sys.localStorage) != null ? _sys$localStorage : null
          });
          if (this.app.usingDebugInput) this.mountDebugInput(this.app);
        };
        _proto.onEnable = function onEnable() {
          var _this$app;
          view.on('canvas-resize', this.onResize, this);
          game.on(Game.EVENT_HIDE, this.onAppHide, this);
          game.on(Game.EVENT_SHOW, this.onAppShow, this);
          this.onResize();
          (_this$app = this.app) == null || _this$app.attach();
          if (!this.started) {
            var _this$app2;
            (_this$app2 = this.app) == null || _this$app2.start();
            this.started = true;
          }
        };
        _proto.onDisable = function onDisable() {
          var _this$app3;
          view.off('canvas-resize', this.onResize, this);
          this.offAppLifecycle();
          (_this$app3 = this.app) == null || _this$app3.detach();
        };
        _proto.onDestroy = function onDestroy() {
          var _this$app4;
          view.off('canvas-resize', this.onResize, this);
          this.offAppLifecycle();
          (_this$app4 = this.app) == null || _this$app4.detach();
          this.app = null;
        }

        /** Only the fallback platform needs the engine's events; a real platform module listens itself. */;
        _proto.onAppHide = function onAppHide() {
          var _this$app5;
          if ((_this$app5 = this.app) != null && _this$app5.usingLocalPlatform) this.app.localPlatform.hide();
        };
        _proto.onAppShow = function onAppShow() {
          var _this$app6;
          if ((_this$app6 = this.app) != null && _this$app6.usingLocalPlatform) this.app.localPlatform.show();
        };
        _proto.offAppLifecycle = function offAppLifecycle() {
          game.off(Game.EVENT_HIDE, this.onAppHide, this);
          game.off(Game.EVENT_SHOW, this.onAppShow, this);
        };
        _proto.update = function update(dt) {
          var app = this.app;
          if (!app) return;
          app.tick(dt);
          this.syncMap(app);
          this.drawArrows(app);
        };
        _proto.onResize = function onResize() {
          var _this$world, _this$arrows;
          var visible = view.getVisibleSize();
          var layout = layoutScreen(visible.width, visible.height, readSafeArea(visible.width, visible.height));
          this.pixelsPerUnit = layout.pxPerUnit;
          var origin = this.toParent(layout.arenaOriginX, layout.arenaOriginY, visible.width, visible.height);
          this.baseX = origin.x;
          this.baseY = origin.y;
          (_this$world = this.world) == null || _this$world.setPosition(this.baseX, this.baseY, 0);
          (_this$arrows = this.arrows) == null || _this$arrows.node.setPosition(this.baseX, this.baseY, 0);
          if (this.app) this.syncMap(this.app);
          paintGuide(this.hudGuide, layout.hud, HUD_TINT, visible.width, visible.height);
          paintGuide(this.thumbGuide, layout.thumb, THUMB_TINT, visible.width, visible.height);
        }

        /** Keep the map under the camera; redraw only when the map size or scale changes. */;
        _proto.syncMap = function syncMap(app) {
          var _this$arenaView2, _this$groundBlend2;
          var _app$ctx = app.ctx,
            arena = _app$ctx.arena,
            camera = _app$ctx.camera;
          var drawn = this.drawnMap;
          if (drawn.width !== arena.width || drawn.height !== arena.height || drawn.ppu !== this.pixelsPerUnit) {
            var _this$arenaView, _this$groundBlend;
            drawn.width = arena.width;
            drawn.height = arena.height;
            drawn.ppu = this.pixelsPerUnit;
            (_this$arenaView = this.arenaView) == null || _this$arenaView.redraw(this.pixelsPerUnit, arena.width, arena.height);
            (_this$groundBlend = this.groundBlend) == null || _this$groundBlend.setMap(arena.width, arena.height);
          }
          (_this$arenaView2 = this.arenaView) == null || _this$arenaView2.node.setPosition(app.ctx.toPx({
            x: 0,
            y: 0
          }));
          (_this$groundBlend2 = this.groundBlend) == null || _this$groundBlend2.setView(camera.center, camera.viewW, camera.viewH);
        };
        _proto.drawArrows = function drawArrows(app) {
          var g = this.arrows;
          if (!g) return;
          g.clear();
          var ppu = this.pixelsPerUnit;
          for (var _iterator = _createForOfIteratorHelperLoose(app.camera.arrows(ARROW_INSET)), _step; !(_step = _iterator()).done;) {
            var arrow = _step.value;
            var style = ARROW_STYLE[arrow.kind];
            var size = ARROW_SIZE * style.scale * ppu;
            var cx = arrow.x * ppu;
            var cy = arrow.y * ppu;
            var dx = Math.cos(arrow.angle);
            var dy = Math.sin(arrow.angle);
            g.moveTo(cx + dx * size, cy + dy * size);
            g.lineTo(cx - dx * size * 0.6 - dy * size * 0.7, cy - dy * size * 0.6 + dx * size * 0.7);
            g.lineTo(cx - dx * size * 0.6 + dy * size * 0.7, cy - dy * size * 0.6 - dx * size * 0.7);
            g.close();
            if (style.filled) {
              g.fillColor = style.color;
              g.fill();
            } else {
              g.strokeColor = style.color;
              g.lineWidth = 3;
              g.stroke();
            }
          }
        };
        _proto.applyShake = function applyShake(offset) {
          var _this$world2;
          (_this$world2 = this.world) == null || _this$world2.setPosition(this.baseX + offset.x * this.pixelsPerUnit, this.baseY + offset.y * this.pixelsPerUnit, 0);
        };
        _proto.buildTree = function buildTree() {
          var world = this.makeChild(this.node, 'World');
          this.world = world;
          for (var _iterator2 = _createForOfIteratorHelperLoose(LAYER_NAMES), _step2; !(_step2 = _iterator2()).done;) {
            var name = _step2.value;
            var parent = name === 'hud' || name === 'debug' ? this.node : world;
            var node = this.makeChild(parent, name);
            this.layerNodes.set(name, node);
          }
          var arena = this.layerNodes.get('arena');
          if (arena) this.arenaView = this.makeChild(arena, 'Map').addComponent(CoreArenaView);
          var hud = this.layerNodes.get('hud');
          var debug = this.layerNodes.get('debug');
          if (hud) this.hudGuide = addGuide(hud, 'HudGuide');
          if (hud) this.arrows = addGuide(hud, 'EdgeIndicators');
          if (debug) this.thumbGuide = addGuide(debug, 'ThumbGuide');
        };
        _proto.mountDebugInput = function mountDebugInput(app) {
          var node = this.makeChild(this.node, 'DebugInput');
          var component = node.addComponent(CoreDebugInput);
          component.source = app.debugInput;
        };
        _proto.makeChild = function makeChild(parent, name) {
          var node = new Node(name);
          node.layer = parent.layer;
          var transform = node.addComponent(UITransform);
          transform.setAnchorPoint(0, 0);
          parent.addChild(node);
          return node;
        };
        _proto.toParent = function toParent(x, y, visibleWidth, visibleHeight) {
          return {
            x: x - visibleWidth / 2,
            y: y - visibleHeight / 2
          };
        };
        _createClass(CoreBootstrap, [{
          key: "ctx",
          get: /** Context for scene components. Null before onLoad and after onDestroy. */
          function get() {
            var _this$app$ctx, _this$app7;
            return (_this$app$ctx = (_this$app7 = this.app) == null ? void 0 : _this$app7.ctx) != null ? _this$app$ctx : null;
          }
        }]);
        return CoreBootstrap;
      }(Component)) || _class) || _class));
      function addGuide(parent, name) {
        var node = new Node(name);
        node.layer = parent.layer;
        var transform = node.addComponent(UITransform);
        transform.setAnchorPoint(0, 0);
        parent.addChild(node);
        return node.addComponent(Graphics);
      }
      function paintGuide(graphics, rect, color, visibleWidth, visibleHeight) {
        if (!graphics) return;
        var node = graphics.node;
        node.setPosition(rect.x - visibleWidth / 2, rect.y - visibleHeight / 2, 0);
        var transform = node.getComponent(UITransform);
        transform == null || transform.setContentSize(Math.max(0, rect.width), Math.max(0, rect.height));
        graphics.clear();
        if (rect.width <= 0 || rect.height <= 0) return;
        graphics.fillColor = color;
        graphics.rect(0, 0, rect.width, rect.height);
        graphics.fill();
      }
      function readSafeArea(visibleWidth, visibleHeight) {
        var safe = sys.getSafeAreaRect();
        var windowSize = screen.windowSize;
        var scaleX = windowSize.width > 0 ? visibleWidth / windowSize.width : 1;
        var scaleY = windowSize.height > 0 ? visibleHeight / windowSize.height : 1;
        var rect = {
          x: safe.x * scaleX,
          y: safe.y * scaleY,
          width: safe.width * scaleX,
          height: safe.height * scaleY
        };
        if (rect.width <= 0 || rect.height <= 0) {
          return {
            x: 0,
            y: 0,
            width: visibleWidth,
            height: visibleHeight
          };
        }
        return rect;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/CoreDebugInput.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _inheritsLoose, cclegacy, _decorator, input, Input, EventMouse, Component;
  return {
    setters: [function (module) {
      _inheritsLoose = module.inheritsLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
      _decorator = module._decorator;
      input = module.input;
      Input = module.Input;
      EventMouse = module.EventMouse;
      Component = module.Component;
    }],
    execute: function () {
      var _dec, _class;
      cclegacy._RF.push({}, "e3850/ICLRMmaCsl9G0LUvv", "CoreDebugInput", undefined);
      var ccclass = _decorator.ccclass;
      var MOUSE_ID = -1;

      /**
       * Feeds pointer events into `DebugInputSource`.
       * The first touch owns the stick. Mouse events are ignored after any touch,
       * so a phone that also synthesizes mouse events cannot add a second pointer.
       * Listeners are removed in onDisable.
       */
      var CoreDebugInput = exports('CoreDebugInput', (_dec = ccclass('CoreDebugInput'), _dec(_class = /*#__PURE__*/function (_Component) {
        _inheritsLoose(CoreDebugInput, _Component);
        function CoreDebugInput() {
          var _this;
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          _this = _Component.call.apply(_Component, [this].concat(args)) || this;
          _this.source = null;
          _this.sawTouch = false;
          _this.mouseDown = false;
          return _this;
        }
        var _proto = CoreDebugInput.prototype;
        _proto.onEnable = function onEnable() {
          input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
          input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
          input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
          input.on(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
          input.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
          input.on(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
          input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);
        };
        _proto.onDisable = function onDisable() {
          input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
          input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
          input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
          input.off(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
          input.off(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
          input.off(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
          input.off(Input.EventType.MOUSE_UP, this.onMouseUp, this);
          this.mouseDown = false;
        };
        _proto.onDestroy = function onDestroy() {
          this.source = null;
        };
        _proto.onTouchStart = function onTouchStart(event) {
          var _this$source;
          this.sawTouch = true;
          var loc = event.getUILocation();
          (_this$source = this.source) == null || _this$source.pointerDown(touchId(event), loc.x, loc.y);
        };
        _proto.onTouchMove = function onTouchMove(event) {
          var _this$source2;
          var loc = event.getUILocation();
          (_this$source2 = this.source) == null || _this$source2.pointerMove(touchId(event), loc.x, loc.y);
        };
        _proto.onTouchEnd = function onTouchEnd(event) {
          var _this$source3;
          (_this$source3 = this.source) == null || _this$source3.pointerUp(touchId(event));
        };
        _proto.onMouseDown = function onMouseDown(event) {
          var _this$source4;
          if (this.sawTouch || event.getButton() !== EventMouse.BUTTON_LEFT) return;
          this.mouseDown = true;
          var loc = event.getUILocation();
          (_this$source4 = this.source) == null || _this$source4.pointerDown(MOUSE_ID, loc.x, loc.y);
        };
        _proto.onMouseMove = function onMouseMove(event) {
          var _this$source5;
          if (this.sawTouch || !this.mouseDown) return;
          var loc = event.getUILocation();
          (_this$source5 = this.source) == null || _this$source5.pointerMove(MOUSE_ID, loc.x, loc.y);
        };
        _proto.onMouseUp = function onMouseUp(event) {
          var _this$source6;
          if (!this.mouseDown || event.getButton() !== EventMouse.BUTTON_LEFT) return;
          this.mouseDown = false;
          (_this$source6 = this.source) == null || _this$source6.pointerUp(MOUSE_ID);
        };
        return CoreDebugInput;
      }(Component)) || _class));
      function touchId(event) {
        return event.touch ? event.touch.getID() : 0;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/CoreParams.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "717c5b/j4NCoJpgF3HKl2jW", "CoreParams", undefined);
      /** P0 §8 调参表 (2026-10-19 12:05 product: 60u × 90u; later product update: minimum 20u × 30u). */
      var MAP_DEFAULT_WIDTH = exports('MAP_DEFAULT_WIDTH', 60);
      var MAP_DEFAULT_HEIGHT = exports('MAP_DEFAULT_HEIGHT', 90);

      /**
       * Map and camera rows. Core owns these because `ctx.arena` / `ctx.camera` are
       * core objects (P0 §12 T1 地图与镜头). Map size applies on the next session.
       */
      var CORE_PARAMS = exports('CORE_PARAMS', [{
        key: 'map.width',
        group: '地图/镜头',
        label: '地图宽(u)',
        kind: 'number',
        "default": MAP_DEFAULT_WIDTH,
        min: 20,
        max: 120,
        step: 1,
        restart: true
      }, {
        key: 'map.height',
        group: '地图/镜头',
        label: '地图高(u)',
        kind: 'number',
        "default": MAP_DEFAULT_HEIGHT,
        min: 30,
        max: 180,
        step: 1,
        restart: true
      },
      // P0 未定义，自选范围: registered only, nothing reads it yet.
      {
        key: 'map.borderDecorWidth',
        group: '地图/镜头',
        label: '边界装饰宽度(u)',
        kind: 'number',
        "default": 2,
        min: 0,
        max: 10,
        step: 0.5,
        restart: true
      },
      // P0 §8: 0 = hard lock. P0 未定义，自选: read as a smoothing time constant in seconds.
      {
        key: 'camera.lerp',
        group: '地图/镜头',
        label: '镜头平滑(s, 0=硬锁)',
        kind: 'number',
        "default": 0,
        min: 0,
        max: 0.5,
        step: 0.01
      }]);
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/Damage.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _createForOfIteratorHelperLoose, cclegacy;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports({
        baseDamage: baseDamage,
        contactDamage: contactDamage,
        dragAtTier: dragAtTier,
        dragDamage: dragDamage,
        linkDamage: linkDamage,
        ropeLength: ropeLength,
        slotDamage: slotDamage,
        speedTier: speedTier
      });
      cclegacy._RF.push({}, "6164fPZnh5CTK9HTsnfdBZe", "Damage", undefined);
      /** P0 §6.2; properties W/Lg/Cv are independent tunables, never level/velocity proxies. */
      function baseDamage(p, level) {
        if (level === void 0) {
          level = p.get('sword.level');
        }
        return p.get('sword.baseDmg') * Math.pow(p.get('sword.levelGrowth'), level);
      }
      function speedTier(p, vTip) {
        return vTip < p.get('drag.vDead') ? 0 : Math.max(0, Math.min(p.get('drag.qCap'), vTip / p.get('drag.vRef')));
      }
      function dragAtTier(p, q, W, level) {
        if (W === void 0) {
          W = p.get('sword.W');
        }
        if (level === void 0) {
          level = p.get('sword.level');
        }
        return baseDamage(p, level) * Math.pow(W, p.get('drag.weightExp')) * Math.pow(q, p.get('drag.speedExp'));
      }
      function dragDamage(p, vTip, W, level) {
        if (W === void 0) {
          W = p.get('sword.W');
        }
        if (level === void 0) {
          level = p.get('sword.level');
        }
        return dragAtTier(p, speedTier(p, vTip), W, level);
      }
      /** P0 §6.3: the growth base here is explicitly 1.12, independent of sword.levelGrowth. */
      function linkDamage(p, grade, N, mainLevel) {
        if (mainLevel === void 0) {
          mainLevel = p.get('sword.level');
        }
        return p.get('chain.baseDmg') * Math.pow(1.12, grade + p.get('chain.mainLevelShare') * mainLevel) * (1 + p.get('chain.resonPer') * Math.min(N, p.get('chain.resonCount')));
      }
      function slotDamage(p, grades, N, mainLevel) {
        if (mainLevel === void 0) {
          mainLevel = p.get('sword.level');
        }
        if (grades.length === 0) return 0;
        var highest = 0;
        for (var _iterator = _createForOfIteratorHelperLoose(grades), _step; !(_step = _iterator()).done;) {
          var grade = _step.value;
          highest = Math.max(highest, linkDamage(p, grade, N, mainLevel));
        }
        return highest * (1 + p.get('chain.stackBonus') * (grades.length - 1));
      }
      function contactDamage(p, damage, speed) {
        return damage * p.get('chain.contactMul') * speed / p.get('drag.vRef');
      }
      function ropeLength(p, slots, Lg) {
        if (Lg === void 0) {
          Lg = p.get('sword.Lg');
        }
        return Math.min(p.get('rope.baseLen') + p.get('rope.lenPerLg') * Lg + p.get('rope.lenPerSlot') * slots, p.get('rope.lenCap'));
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/DebugInputSource.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './Vec2.ts'], function (exports) {
  var _extends, _createForOfIteratorHelperLoose, _createClass, cclegacy, vec2;
  return {
    setters: [function (module) {
      _extends = module.extends;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      vec2 = module.vec2;
    }],
    execute: function () {
      cclegacy._RF.push({}, "98b339MoJdGr7b/qGihYL9O", "DebugInputSource", undefined);

      /** How long input samples are kept, in seconds. */
      var INPUT_HISTORY_SECONDS = exports('INPUT_HISTORY_SECONDS', 0.5);
      var DEFAULT_CONFIG = {
        radiusPx: 72 * 1.2,
        deadZone: 0.08,
        followCenter: true
      };
      function emptyFrame(time) {
        if (time === void 0) {
          time = 0;
        }
        return {
          touching: false,
          dir: vec2(),
          mag: 0,
          pressedThisTick: false,
          releasedThisTick: false,
          time: time
        };
      }

      /**
       * Fallback `IInputSource` until the input module provides its own.
       * One pointer: the first finger (or the mouse) wins; later pointers are ignored.
       * History queries use samples with `t < endTime`, so the release step still
       * sees the values from before the finger came up.
       */
      var DebugInputSource = exports('DebugInputSource', /*#__PURE__*/function () {
        function DebugInputSource() {
          this.samples = [];
          this.config = _extends({}, DEFAULT_CONFIG);
          this.frameValue = emptyFrame();
          this.lastRelease = -1;
          this.down = false;
          this.pointerId = 0;
          this.centerX = 0;
          this.centerY = 0;
          this.pointerX = 0;
          this.pointerY = 0;
        }
        var _proto = DebugInputSource.prototype;
        _proto.setConfig = function setConfig(config) {
          this.config = config;
        };
        _proto.pointerDown = function pointerDown(id, x, y) {
          if (this.down) return;
          this.down = true;
          this.pointerId = id;
          this.centerX = x;
          this.centerY = y;
          this.pointerX = x;
          this.pointerY = y;
        };
        _proto.pointerMove = function pointerMove(id, x, y) {
          if (!this.down || id !== this.pointerId) return;
          this.pointerX = x;
          this.pointerY = y;
          if (!this.config.followCenter || this.config.radiusPx <= 0) return;
          var dx = x - this.centerX;
          var dy = y - this.centerY;
          var dist = Math.hypot(dx, dy);
          if (dist > this.config.radiusPx) {
            var scale = (dist - this.config.radiusPx) / dist;
            this.centerX += dx * scale;
            this.centerY += dy * scale;
          }
        };
        _proto.pointerUp = function pointerUp(id) {
          if (!this.down || id !== this.pointerId) return;
          this.down = false;
        }

        /**
         * Sample the pointer and store one history row for this sim time.
         * A second call at the same time (hit-stop, while sim time is frozen)
         * replaces that row instead of stacking duplicates.
         */;
        _proto.fixedUpdate = function fixedUpdate(time) {
          var previous = this.frameValue.touching;
          var stick = this.readStick();
          var touching = this.down;
          var pressedThisTick = touching && !previous;
          var releasedThisTick = !touching && previous;
          if (releasedThisTick) this.lastRelease = time;
          this.frameValue = {
            touching: touching,
            dir: stick.mag === 0 ? vec2() : vec2(stick.x, stick.y),
            mag: touching ? stick.mag : 0,
            pressedThisTick: pressedThisTick,
            releasedThisTick: releasedThisTick,
            time: time
          };
          var row = {
            time: time,
            x: this.frameValue.dir.x,
            y: this.frameValue.dir.y,
            mag: this.frameValue.mag,
            touching: touching
          };
          var last = this.samples[this.samples.length - 1];
          if (last && last.time === time) this.samples[this.samples.length - 1] = row;else this.samples.push(row);
          var cutoff = time - INPUT_HISTORY_SECONDS;
          while (this.samples.length > 0) {
            var head = this.samples[0];
            if (!head || head.time >= cutoff) break;
            this.samples.shift();
          }
        }

        /** Drop history and edge flags. Keeps a finger that is still down. */;
        _proto.beginSession = function beginSession() {
          this.samples.length = 0;
          this.lastRelease = -1;
          this.frameValue = emptyFrame();
          this.frameValue = _extends({}, this.frameValue, {
            touching: this.down
          });
        };
        _proto.avgDir = function avgDir(windowS, endTime) {
          var rows = this.windowRows(windowS, endTime != null ? endTime : this.frameValue.time);
          var x = 0;
          var y = 0;
          for (var _iterator = _createForOfIteratorHelperLoose(rows), _step; !(_step = _iterator()).done;) {
            var row = _step.value;
            x += row.x;
            y += row.y;
          }
          var len = Math.hypot(x, y);
          if (len <= 1e-8) return vec2();
          return vec2(x / len, y / len);
        };
        _proto.minMag = function minMag(windowS, endTime) {
          var rows = this.windowRows(windowS, endTime != null ? endTime : this.frameValue.time);
          var first = rows[0];
          if (!first) return 0;
          var min = first.mag;
          for (var _iterator2 = _createForOfIteratorHelperLoose(rows), _step2; !(_step2 = _iterator2()).done;) {
            var row = _step2.value;
            min = Math.min(min, row.mag);
          }
          return min;
        };
        _proto.magDrop = function magDrop(windowS, endTime) {
          var end = endTime != null ? endTime : this.frameValue.time;
          var rows = this.windowRows(windowS, end);
          if (rows.length === 0) return 0;
          var max = 0;
          for (var _iterator3 = _createForOfIteratorHelperLoose(rows), _step3; !(_step3 = _iterator3()).done;) {
            var row = _step3.value;
            max = Math.max(max, row.mag);
          }
          return max - this.magAt(end);
        };
        _proto.reset = function reset() {
          this.samples.length = 0;
          this.frameValue = emptyFrame();
          this.lastRelease = -1;
          this.down = false;
        };
        _proto.readStick = function readStick() {
          if (!this.down || this.config.radiusPx <= 0) return {
            x: 0,
            y: 0,
            mag: 0
          };
          var dx = this.pointerX - this.centerX;
          var dy = this.pointerY - this.centerY;
          var dist = Math.hypot(dx, dy);
          var dead = Math.max(0, Math.min(1, this.config.deadZone)) * this.config.radiusPx;
          if (dist <= dead) return {
            x: 0,
            y: 0,
            mag: 0
          };
          var span = Math.max(1e-6, this.config.radiusPx - dead);
          return {
            x: dx / dist,
            y: dy / dist,
            mag: Math.min(1, (dist - dead) / span)
          };
        }

        /** Touching samples with start <= t < endTime. */;
        _proto.windowRows = function windowRows(windowS, endTime) {
          var start = endTime - windowS;
          var rows = [];
          for (var _iterator4 = _createForOfIteratorHelperLoose(this.samples), _step4; !(_step4 = _iterator4()).done;) {
            var sample = _step4.value;
            if (sample.time >= start && sample.time < endTime && sample.touching) rows.push(sample);
          }
          return rows;
        };
        _proto.magAt = function magAt(endTime) {
          for (var i = this.samples.length - 1; i >= 0; i--) {
            var sample = this.samples[i];
            if (!sample) continue;
            if (sample.time <= endTime) return sample.mag;
          }
          return 0;
        };
        _createClass(DebugInputSource, [{
          key: "frame",
          get: function get() {
            return this.frameValue;
          }
        }, {
          key: "lastReleaseTime",
          get: function get() {
            return this.lastRelease;
          }
        }]);
        return DebugInputSource;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/DirectorParams.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './EnemyParams.ts'], function (exports) {
  var _extends, cclegacy, numberParam;
  return {
    setters: [function (module) {
      _extends = module.extends;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      numberParam = module.numberParam;
    }],
    execute: function () {
      cclegacy._RF.push({}, "1fddaXc3FtEVJVg1ZVLPdJs", "DirectorParams", undefined);

      // P0 §8 overrides GDD §8.4 (budgetBase 1.5, not 2).
      var DIRECTOR_PARAMS = exports('DIRECTOR_PARAMS', [numberParam('diff.tA', '难度', '时间一次系数', 0.10, 0, 1), numberParam('diff.tB', '难度', '时间二次系数', 0.012, 0, 0.1, 0.001), numberParam('diff.dmgK', '难度', '伤害随难度系数', 0.5, 0, 2), numberParam('diff.budgetBase', '难度', '基础刷怪点数(点/s)', 1.5, 0, 10), numberParam('diff.budgetExp', '难度', '预算指数', 0.6, 0, 2), numberParam('spawn.edgeInset', '刷怪', '边缘内缩(u)', 0.3, 0, 2),
      // P0 §8 (2026-10-19): ring = view rect grown by this margin; replaces spawn.bottomExclude.
      numberParam('spawn.offscreenMargin', '刷怪', '视野外扩(u)', 1, 0, 4), numberParam('spawn.minDistFromPet', '刷怪', '距宠物最小距离(u)', 3, 0, 8),
      // Product 2026-10-19 【提案】: re-roll cap before the in-map fallback. P0 未定义，自选范围.
      numberParam('spawn.maxTries', '刷怪', '刷新点重取次数', 8, 1, 32, 1), numberParam('enemy.recycleDist', '刷怪', '回收距离(u)', 25, 10, 60), numberParam('session.length', '局', '时长(s)', 180, 30, 900, 1), {
        key: 'session.endless',
        group: '局',
        label: '无尽模式',
        kind: 'bool',
        "default": 0
      }, _extends({}, numberParam('session.seed', '局', '种子(0=随机)', 0, 0, 999999, 1), {
        restart: true
      }),
      // P0 §8 specifies a 0.5s purchase cadence, but no key name.
      numberParam('spawn.purchaseInterval', '刷怪', '预算购买间隔(s)', 0.5, 0.1, 2),
      // P0 未定义，自选默认值: radius of a group's spawn neighbourhood.
      numberParam('sheep.groupSpawnRadius', '群聚羊', '整群出生半径(u)', 1, 0, 3)]);
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/DoorPoint.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports('pickDoorPoint', pickDoorPoint);
      cclegacy._RF.push({}, "12f55Sk+UJPlI03AVt7oUGe", "DoorPoint", undefined);
      /** P0 §8 炉门取点最多重取次数 32（#54 实现值，常量，不进 ⚙）. */
      var DOOR_TRIES = exports('DOOR_TRIES', 32);
      /**
       * GDD 2026-10-19 补充决策 / §5.4: uniform angle, uniform distance in [min, max]
       * from the pet; re-roll when the point is in view, outside the map, or within
       * `wallMargin` of a wall. P0 §8【提案】: after `DOOR_TRIES` re-rolls take the
       * candidate farthest from the pet, each rejected point pulled into the map.
       */
      function pickDoorPoint(site) {
        var _best;
        var low = Math.min(site.minDist, site.maxDist);
        var high = Math.max(site.minDist, site.maxDist);
        var margin = Math.max(0, Math.min(site.wallMargin, site.mapWidth / 2, site.mapHeight / 2));
        var best = null;
        var bestDist = -1;
        for (var i = 0; i < DOOR_TRIES; i++) {
          var angle = site.rng.next() * Math.PI * 2;
          var distance = low + site.rng.next() * (high - low);
          var _p = {
            x: site.pet.x + Math.cos(angle) * distance,
            y: site.pet.y + Math.sin(angle) * distance
          };
          var inside = _p.x >= margin && _p.x <= site.mapWidth - margin && _p.y >= margin && _p.y <= site.mapHeight - margin;
          if (inside && !site.inView(_p)) return _p;
          var c = {
            x: Math.max(margin, Math.min(site.mapWidth - margin, _p.x)),
            y: Math.max(margin, Math.min(site.mapHeight - margin, _p.y))
          };
          var d = Math.hypot(c.x - site.pet.x, c.y - site.pet.y);
          if (d > bestDist) {
            best = c;
            bestDist = d;
          }
        }
        return (_best = best) != null ? _best : {
          x: site.mapWidth / 2,
          y: site.mapHeight / 2
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/EnemyArt.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports({
        enemyArtOf: enemyArtOf,
        enemyMoveFrame: enemyMoveFrame,
        enemyRotates: enemyRotates,
        facingAngleDeg: facingAngleDeg,
        jsonRectToCocos: jsonRectToCocos,
        visualDiameterOf: visualDiameterOf
      });
      cclegacy._RF.push({}, "70deb8eSfpBwLi+RNudajM4", "EnemyArt", undefined);
      /**
       * Frame rects / fps / visual sizes transcribed from
       * docs/ui/batch9/batch9-slices.json and docs/ui/batch10/batch10-slices.json.
       * Collision radii stay on the numbers doc (EnemyParams); visualDiameter is display only.
       * Atlas y in JSON is top-left; sliceAtlasFrame converts to Cocos texture space.
       */
      var ANCHOR = [0.5, 0.5];
      var ENEMY_UNIT_PX = exports('ENEMY_UNIT_PX', 72);
      var TURTLE_HIT_FRONT_TIME = exports('TURTLE_HIT_FRONT_TIME', 0.08);
      var ENEMY_ART = exports('ENEMY_ART', {
        blob: {
          atlas: 'enemy_blob_atlas.png',
          atlasPath: 'enemy/enemy_blob_atlas',
          atlasSize: [512, 64],
          frames: {
            blob_move_0: {
              rect: [0, 0, 64, 64],
              anchor: ANCHOR
            },
            blob_move_1: {
              rect: [64, 0, 64, 64],
              anchor: ANCHOR
            },
            blob_move_2: {
              rect: [128, 0, 64, 64],
              anchor: ANCHOR
            },
            blob_move_3: {
              rect: [192, 0, 64, 64],
              anchor: ANCHOR
            },
            blob_die_0: {
              rect: [256, 0, 64, 64],
              anchor: ANCHOR
            }
          },
          cn: '软团子',
          frameSize: [64, 64],
          facing: 'none',
          radiusDesign_u: 0.3,
          visualDiameter_u: 0.78,
          anims: {
            move: {
              frames: ['blob_move_0', 'blob_move_1', 'blob_move_2', 'blob_move_3'],
              fps: 6,
              loop: true
            },
            die: {
              frames: ['blob_die_0'],
              duration: 0.3
            }
          }
        },
        sheep: {
          atlas: 'enemy_sheep_atlas.png',
          atlasPath: 'enemy/enemy_sheep_atlas',
          atlasSize: [512, 64],
          frames: {
            sheep_move_0: {
              rect: [0, 0, 64, 64],
              anchor: ANCHOR
            },
            sheep_move_1: {
              rect: [64, 0, 64, 64],
              anchor: ANCHOR
            },
            sheep_move_2: {
              rect: [128, 0, 64, 64],
              anchor: ANCHOR
            },
            sheep_move_3: {
              rect: [192, 0, 64, 64],
              anchor: ANCHOR
            },
            sheep_die_0: {
              rect: [256, 0, 64, 64],
              anchor: ANCHOR
            }
          },
          cn: '群聚羊',
          frameSize: [64, 64],
          facing: 'down',
          radiusDesign_u: 0.28,
          visualDiameter_u: 0.7,
          anims: {
            move: {
              frames: ['sheep_move_0', 'sheep_move_1', 'sheep_move_2', 'sheep_move_3'],
              fps: 10,
              loop: true
            },
            die: {
              frames: ['sheep_die_0'],
              duration: 0.3
            }
          }
        },
        boar: {
          atlas: 'enemy_boar_atlas.png',
          atlasPath: 'enemy/enemy_boar_atlas',
          atlasSize: [512, 512],
          frames: {
            boar_move_0: {
              rect: [0, 0, 128, 128],
              anchor: ANCHOR
            },
            boar_move_1: {
              rect: [128, 0, 128, 128],
              anchor: ANCHOR
            },
            boar_move_2: {
              rect: [256, 0, 128, 128],
              anchor: ANCHOR
            },
            boar_move_3: {
              rect: [384, 0, 128, 128],
              anchor: ANCHOR
            },
            boar_windup_0: {
              rect: [0, 128, 128, 128],
              anchor: ANCHOR
            },
            boar_windup_1: {
              rect: [128, 128, 128, 128],
              anchor: ANCHOR
            },
            boar_charge_0: {
              rect: [256, 128, 128, 128],
              anchor: ANCHOR
            },
            boar_charge_1: {
              rect: [384, 128, 128, 128],
              anchor: ANCHOR
            },
            boar_die_0: {
              rect: [0, 256, 128, 128],
              anchor: ANCHOR
            }
          },
          cn: '冲锋猪',
          frameSize: [128, 128],
          facing: 'down',
          radiusDesign_u: 0.45,
          visualDiameter_u: 1.3,
          anims: {
            move: {
              frames: ['boar_move_0', 'boar_move_1', 'boar_move_2', 'boar_move_3'],
              fps: 6,
              loop: true
            },
            windup: {
              frames: ['boar_windup_0', 'boar_windup_1'],
              fps: 10,
              loop: true,
              note: '蓄力：后缩+红橙泛色，配合红色预警线'
            },
            charge: {
              frames: ['boar_charge_0', 'boar_charge_1'],
              fps: 14,
              loop: true
            },
            die: {
              frames: ['boar_die_0'],
              duration: 0.4
            }
          }
        },
        worm: {
          atlas: 'enemy_worm_atlas.png',
          atlasPath: 'enemy/enemy_worm_atlas',
          atlasSize: [512, 64],
          frames: {
            worm_move_0: {
              rect: [0, 0, 64, 64],
              anchor: ANCHOR
            },
            worm_move_1: {
              rect: [64, 0, 64, 64],
              anchor: ANCHOR
            },
            worm_move_2: {
              rect: [128, 0, 64, 64],
              anchor: ANCHOR
            },
            worm_move_3: {
              rect: [192, 0, 64, 64],
              anchor: ANCHOR
            },
            worm_die_0: {
              rect: [256, 0, 64, 64],
              anchor: ANCHOR
            }
          },
          cn: '剪链虫',
          frameSize: [64, 64],
          facing: 'down',
          radiusDesign_u: 0.25,
          visualDiameter_u: 0.8,
          anims: {
            move: {
              frames: ['worm_move_0', 'worm_move_1', 'worm_move_2', 'worm_move_3'],
              fps: 12,
              loop: true,
              note: 'snip snip; cut on contact can hold worm_move_2'
            },
            die: {
              frames: ['worm_die_0'],
              duration: 0.35,
              note: 'fade+scale 0.8'
            }
          }
        },
        turtle: {
          atlas: 'enemy_turtle_atlas.png',
          atlasPath: 'enemy/enemy_turtle_atlas',
          atlasSize: [512, 256],
          frames: {
            turtle_move_0: {
              rect: [0, 0, 96, 96],
              anchor: ANCHOR
            },
            turtle_move_1: {
              rect: [96, 0, 96, 96],
              anchor: ANCHOR
            },
            turtle_move_2: {
              rect: [192, 0, 96, 96],
              anchor: ANCHOR
            },
            turtle_move_3: {
              rect: [288, 0, 96, 96],
              anchor: ANCHOR
            },
            turtle_hit_front: {
              rect: [384, 0, 96, 96],
              anchor: ANCHOR
            },
            turtle_die_0: {
              rect: [0, 96, 96, 96],
              anchor: ANCHOR
            }
          },
          cn: '盾甲龟',
          frameSize: [96, 96],
          facing: 'down',
          radiusDesign_u: 0.4,
          visualDiameter_u: 1.2,
          anims: {
            move: {
              frames: ['turtle_move_0', 'turtle_move_1', 'turtle_move_2', 'turtle_move_3'],
              fps: 5,
              loop: true
            },
            hitFront: {
              frames: ['turtle_hit_front'],
              duration: TURTLE_HIT_FRONT_TIME,
              note: '正面命中(×0.1)\'铛\'：替换0.08s+节点抖1px；背/侧面命中用通用白闪'
            },
            die: {
              frames: ['turtle_die_0'],
              duration: 0.4
            }
          }
        },
        bubble: {
          atlas: 'enemy_bubble_atlas.png',
          atlasPath: 'enemy/enemy_bubble_atlas',
          atlasSize: [512, 256],
          frames: {
            bubble_move_0: {
              rect: [0, 0, 96, 96],
              anchor: ANCHOR
            },
            bubble_move_1: {
              rect: [96, 0, 96, 96],
              anchor: ANCHOR
            },
            bubble_move_2: {
              rect: [192, 0, 96, 96],
              anchor: ANCHOR
            },
            bubble_move_3: {
              rect: [288, 0, 96, 96],
              anchor: ANCHOR
            },
            bubble_split_0: {
              rect: [384, 0, 96, 96],
              anchor: ANCHOR
            },
            bubble_pop_0: {
              rect: [0, 96, 96, 96],
              anchor: ANCHOR
            },
            bubblet_move_0: {
              rect: [96, 96, 48, 48],
              anchor: ANCHOR
            },
            bubblet_move_1: {
              rect: [144, 96, 48, 48],
              anchor: ANCHOR
            },
            bubblet_move_2: {
              rect: [192, 96, 48, 48],
              anchor: ANCHOR
            },
            bubblet_move_3: {
              rect: [240, 96, 48, 48],
              anchor: ANCHOR
            },
            bubblet_pop_0: {
              rect: [288, 96, 48, 48],
              anchor: ANCHOR
            }
          },
          cn: '分裂泡泡',
          frameSize: [96, 96],
          childFrameSize: [48, 48],
          facing: 'none',
          radiusDesign_u: 0.4,
          childRadiusDesign_u: 0.22,
          visualDiameter_u: 1.2,
          childVisualDiameter_u: 0.6,
          anims: {
            move: {
              frames: ['bubble_move_0', 'bubble_move_1', 'bubble_move_2', 'bubble_move_3'],
              fps: 6,
              loop: true
            },
            split: {
              frames: ['bubble_split_0'],
              duration: 0.15,
              note: '非画圈斩击杀：播完生成3只子泡 (splitSpread 0.6u)'
            },
            popNoSplit: {
              frames: ['bubble_pop_0'],
              duration: 0.2,
              note: '画圈斩击杀：直接炸开不分裂'
            },
            childMove: {
              frames: ['bubblet_move_0', 'bubblet_move_1', 'bubblet_move_2', 'bubblet_move_3'],
              fps: 8,
              loop: true
            },
            childDie: {
              frames: ['bubblet_pop_0'],
              duration: 0.15
            }
          }
        }
      });
      var ENEMY_ATLAS_KEYS = exports('ENEMY_ATLAS_KEYS', ['blob', 'sheep', 'boar', 'worm', 'turtle', 'bubble']);
      function enemyArtOf(kind) {
        if (kind === 'blob') return ENEMY_ART.blob;
        if (kind === 'sheep') return ENEMY_ART.sheep;
        if (kind === 'boar') return ENEMY_ART.boar;
        if (kind === 'worm') return ENEMY_ART.worm;
        if (kind === 'turtle') return ENEMY_ART.turtle;
        if (kind === 'bubble' || kind === 'bubbleChild') return ENEMY_ART.bubble;
        return null;
      }
      function visualDiameterOf(kind) {
        if (kind === 'bubbleChild') {
          var child = ENEMY_ART.bubble.childVisualDiameter_u;
          return child !== undefined ? child : 0;
        }
        var art = enemyArtOf(kind);
        return art ? art.visualDiameter_u : 0;
      }

      /** Art local down (0,-1) maps onto world facing. Cocos node.angle is CCW degrees. */
      function facingAngleDeg(fx, fy) {
        return Math.atan2(fx, -fy) * 180 / Math.PI;
      }
      function enemyRotates(kind) {
        var art = enemyArtOf(kind);
        return !!art && art.facing === 'down';
      }
      function enemyMoveFrame(kind, simTime, frontHitLeft, phase) {
        var _anim$frames$idx;
        if (kind === 'turtle' && frontHitLeft > 1e-9) return 'turtle_hit_front';
        var art = enemyArtOf(kind);
        if (!art) return null;
        var anim = kind === 'bubbleChild' ? art.anims.childMove : art.anims.move;
        if (kind === 'boar') {
          if (phase === 'windup') anim = art.anims.windup;else if (phase === 'charge') anim = art.anims.charge;
        }
        if (!anim || anim.frames.length === 0) return null;
        var fps = anim.fps !== undefined ? anim.fps : 1;
        var idx = Math.floor(Math.max(0, simTime) * fps) % anim.frames.length;
        return (_anim$frames$idx = anim.frames[idx]) != null ? _anim$frames$idx : null;
      }
      function jsonRectToCocos(rect, atlasH) {
        return {
          x: rect[0],
          y: atlasH - rect[1] - rect[3],
          w: rect[2],
          h: rect[3]
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/EnemyModule.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './SystemOrder.ts', './Boss.ts', './BossChest.ts', './BossParams.ts', './DirectorParams.ts', './EnemyParams.ts', './EnemyWorld.ts', './SpawnDirector.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, cclegacy, SystemOrder, BossController, BossChest, BOSS_PARAMS, DIRECTOR_PARAMS, ENEMY_PARAMS, EnemyWorld, SpawnDirector;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      SystemOrder = module.SystemOrder;
    }, function (module) {
      BossController = module.BossController;
    }, function (module) {
      BossChest = module.BossChest;
    }, function (module) {
      BOSS_PARAMS = module.BOSS_PARAMS;
    }, function (module) {
      DIRECTOR_PARAMS = module.DIRECTOR_PARAMS;
    }, function (module) {
      ENEMY_PARAMS = module.ENEMY_PARAMS;
    }, function (module) {
      EnemyWorld = module.EnemyWorld;
    }, function (module) {
      SpawnDirector = module.SpawnDirector;
    }],
    execute: function () {
      cclegacy._RF.push({}, "a10aeR7f3dIrJT9K4AmmhrY", "EnemyModule", undefined);
      /** Owns lifecycle and the two ordered systems; the view owns no gameplay. */
      var EnemyModule = exports('EnemyModule', /*#__PURE__*/function () {
        function EnemyModule(ctx) {
          this.world = void 0;
          this.director = void 0;
          this.chest = void 0;
          this.boss = void 0;
          this.timing = {
            steps: 0,
            lastMs: 0,
            maxMs: 0,
            totalMs: 0
          };
          this.unsubs = [];
          this.attached = false;
          this.running = false;
          this.clearPending = false;
          this.aiMs = 0;
          this.ctx = void 0;
          this.ctx = ctx;
          this.world = new EnemyWorld(ctx);
          this.director = new SpawnDirector(ctx, this.world);
          this.chest = new BossChest(ctx);
          this.boss = new BossController(ctx, this.world, this.chest);
          this.world.boss = this.boss;
        }
        var _proto = EnemyModule.prototype;
        _proto.install = function install() {
          var _this = this;
          // Preserve definitions already registered by the owning integration.
          this.ctx.tunables.define([].concat(ENEMY_PARAMS, DIRECTOR_PARAMS, BOSS_PARAMS).filter(function (def) {
            return !_this.ctx.tunables.has(def.key);
          }));
          this.ctx.services.provide('enemies', this.world);
          this.ctx.services.provide('director', this.director);
          this.ctx.loop.addSystem({
            id: 'enemy.ai',
            order: SystemOrder.Enemy,
            fixedUpdate: function fixedUpdate(dt) {
              if (!_this.attached || !_this.running || _this.outOfCombat()) return;
              var start = now();
              _this.world.update(dt);
              _this.aiMs = now() - start;
            }
          });
          this.ctx.loop.addSystem({
            id: 'enemy.resolve',
            order: SystemOrder.EnemyResolve,
            fixedUpdate: function fixedUpdate(dt) {
              if (!_this.attached || !_this.running || _this.outOfCombat()) return;
              var start = now();
              _this.world.resolveDeaths();
              // A boss death ends the wave inside resolveDeaths (boss:defeated → wave:clear → chest);
              // the director must not buy for a wave that is already over.
              if (_this.running && !_this.outOfCombat()) {
                _this.director.recycle();
                _this.director.update(dt);
              }
              var ms = _this.aiMs + now() - start;
              _this.timing.steps += 1;
              _this.timing.lastMs = ms;
              _this.timing.totalMs += ms;
              _this.timing.maxMs = Math.max(_this.timing.maxMs, ms);
            }
          });
          this.attach();
        };
        _proto.attach = function attach() {
          var _this2 = this;
          if (this.attached) return;
          this.attached = true;
          this.world.setEnabled(this.running);
          this.unsubs.push(this.ctx.events.on('session:start', function () {
            _this2.clearPending = false;
            _this2.world.clear();
            _this2.director.reset();
            _this2.running = true;
            _this2.world.setEnabled(true);
            _this2.timing.steps = 0;
            _this2.timing.lastMs = 0;
            _this2.timing.maxMs = 0;
            _this2.timing.totalMs = 0;
          }));
          this.unsubs.push(this.ctx.events.on('session:end', function () {
            _this2.running = false;
            _this2.world.setEnabled(false);
            _this2.director.stop();
          }));
          this.unsubs.push(this.ctx.events.on('debug:command', function (_ref) {
            var cmd = _ref.cmd,
              arg = _ref.arg;
            if (!_this2.running) return;
            if (cmd === 'spawn') _this2.director.debugSpawn(arg);else if (cmd === 'clearEnemies') _this2.world.clear();else if (cmd === 'spawnBoss') _this2.spawnBoss(_this2.ctx.services.has('run') ? _this2.ctx.services.get('run').wave : 0);
          }));
          // GDD §12.3 #14 / P1-tasks P1-01 波间清场: the rest of the wave is removed without
          // `enemy:died` (no XP, P1-numbers-batch1 §1.1). They stay queryable through every
          // `wave:clear` listener (loot turns them into coin sparks) and go on the `run:phase`
          // or `wave:start` that run always emits right after.
          this.unsubs.push(this.ctx.events.on('wave:clear', function () {
            _this2.clearPending = true;
          }));
          this.unsubs.push(this.ctx.events.on('run:phase', function () {
            return _this2.flushClear();
          }));
          this.unsubs.push(this.ctx.events.on('wave:start', function () {
            return _this2.flushClear();
          }));
          // GDD §5.2 / P1-tasks P1-07: the boss enters at the start of its wave, after the clear above.
          this.unsubs.push(this.ctx.events.on('wave:start', function (_ref2) {
            var wave = _ref2.wave,
              boss = _ref2.boss;
            if (!_this2.running) return;
            _this2.director.onWaveStart(wave);
            if (boss) _this2.spawnBoss(wave);
          }));
          this.unsubs.push(this.ctx.camera.addIndicator('boss', function () {
            return _this2.boss.indicatorPos();
          }));
          this.chest.attach();
        };
        _proto.spawnBoss = function spawnBoss(wave) {
          this.boss.spawn(wave, this.director.danger);
        }

        /** GDD §8.4 / core IRunInfo.combatActive: no AI, spawning or danger clock outside combat. Always false in the P0 sandbox. */;
        _proto.outOfCombat = function outOfCombat() {
          return this.ctx.services.has('run') && !this.ctx.services.get('run').combatActive;
        };
        _proto.flushClear = function flushClear() {
          if (!this.clearPending) return;
          this.clearPending = false;
          this.world.clear();
        };
        _proto.detach = function detach() {
          if (!this.attached) return;
          this.attached = false;
          this.world.setEnabled(false);
          this.director.stop();
          for (var _iterator = _createForOfIteratorHelperLoose(this.unsubs), _step; !(_step = _iterator()).done;) {
            var off = _step.value;
            off();
          }
          this.unsubs.length = 0;
          this.chest.detach();
        };
        return EnemyModule;
      }());
      function now() {
        return typeof performance === 'undefined' ? Date.now() : performance.now();
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/EnemyParams.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports('numberParam', numberParam);
      cclegacy._RF.push({}, "fab42y1HS5H+ZQSUDjVndko", "EnemyParams", undefined);
      // P0 §7: shared rules, base stats and behaviour tables.
      var ENEMY_PARAMS = exports('ENEMY_PARAMS', [].concat(kindParams('blob', '软团子', 30, 0.30, 1.2, 5, 1, 0, 0, 1.0), kindParams('sheep', '群聚羊', 20, 0.28, 1.6, 3, 0.6, 0, 20, 0.6), kindParams('boar', '冲锋猪', 80, 0.45, 1.0, 12, 4, 0.7, 60, 0.3), kindParams('worm', '剪链虫', 18, 0.25, 2.6, 4, 1.5, 0, 114, 0.5, 4), kindParams('turtle', '盾甲龟', 60, 0.40, 0.8, 8, 2.5, 0.6, 71, 0.4, 3), kindParams('bubble', '分裂泡泡', 40, 0.40, 1.0, 5, 2, 0.2, 71, 0.5, 3), [numberParam('enemy.maxAlive', '敌人', '同屏上限', 80, 10, 200, 1), numberParam('enemy.contactCooldown', '敌人', '接触伤害间隔(s)', 0.5, 0.5, 10), numberParam('enemy.knockbackTime', '敌人', '线性击退时间(s)', 0.15, 0.01, 0.15), numberParam('sheep.groupMin', '群聚羊', '每群最少只数', 6, 1, 30, 1), numberParam('sheep.groupMax', '群聚羊', '每群最多只数', 10, 1, 30, 1), numberParam('sheep.sep', '群聚羊', '分离权重', 1.0, 0, 3), numberParam('sheep.coh', '群聚羊', '聚合权重', 0.6, 0, 3), numberParam('sheep.align', '群聚羊', '对齐权重', 0.4, 0, 3), numberParam('sheep.seek', '群聚羊', '趋向宠物权重', 0.3, 0, 3), numberParam('sheep.sepDist', '群聚羊', '分离距离(u)', 0.5, 0.1, 2), numberParam('sheep.scareRadius', '群聚羊', '受惊传播半径(u)', 1.5, 0, 5), numberParam('sheep.scareTime', '群聚羊', '四散时间(s)', 1.0, 0, 5), numberParam('sheep.scareSpeedMul', '群聚羊', '四散速度倍率', 1.8, 1, 4), numberParam('boar.triggerRange', '冲锋猪', '蓄力距离(u)', 5, 1, 12), numberParam('boar.windup', '冲锋猪', '蓄力(s)', 1.0, 0.2, 3), numberParam('boar.chargeSpeed', '冲锋猪', '冲锋速度(u/s)', 9, 2, 20), numberParam('boar.chargeTime', '冲锋猪', '冲锋时间(s)', 0.6, 0.1, 2), numberParam('boar.stunTime', '冲锋猪', '冲锋后愣住(s)', 1.2, 0, 5), numberParam('boar.stunDmgTakenMul', '冲锋猪', '愣住受伤倍率', 1.5, 1, 5), {
        key: 'boar.cutsTrail',
        group: '冲锋猪',
        label: '冲锋切断未闭合剑痕',
        kind: 'bool',
        "default": 1,
        note: 'P0 supplement 1. Read by sword/loop; enemy only exposes charging boars.'
      }, numberParam('chain.dropChance', '剑链', '普通怪掉散剑概率', 0.08, 0, 1),
      // P0 §6.3; define only if absent.
      // P0 未定义，自选默认值: neighbourhood / flock steering normalisation are documented in README.
      numberParam('sheep.flockRadius', '群聚羊', '群集感知半径(u)', 3, 0, 20),
      // P0 未定义，自选默认值: bounded spatial-hash overlap solver iterations.
      numberParam('enemy.separationPasses', '敌人', '碰撞分离迭代次数', 8, 1, 32, 1), numberParam('enemy.damageNumberMax', '敌人', '同屏伤害数字上限', 30, 1, 30, 1),
      // P0 §3.
      numberParam('enemy.damageMergeTime', '敌人', '同目标数字合并窗口(s)', 0.2, 0, 1),
      // P0 §5.
      // P0 未定义，自选默认值: number lifetime and vertical rise speed (visual only).
      numberParam('enemy.damageNumberTime', '敌人', '伤害数字寿命(s)', 0.6, 0.2, 3), numberParam('enemy.damageNumberRise', '敌人', '伤害数字上浮速度(u/s)', 1, 0, 5),
      // P0 未定义，自选默认值: hit feedback duration (visual only).
      numberParam('enemy.hitFlashTime', '敌人', '受击闪白(s)', 0.12, 0, 1),
      // P1-numbers-batch1 §3.4【提案】: 滚石巨轮 drops 3 loose swords. Read by the boss (P1-07).
      numberParam('boss.swordDrop', 'Boss', '击杀掉散剑数', 3, 0, 6, 1),
      // docs/design/P1-enemies-batch2.md §2.3 剪链虫
      {
        key: 'worm.target',
        group: '剪链虫',
        label: '追击目标',
        kind: 'enum',
        "default": 0,
        options: ['中段', '末端', '宠物'],
        note: 'P1-enemies-batch2 §2.3；0 中段 / 1 末端 / 2 宠物；剑链为空时改追宠物。调参面板按 enum 分段按钮编辑'
      }, numberParam('worm.noChainSpeedMul', '剪链虫', '无链速度倍率', 0.6, 0, 1), {
        key: 'worm.cutOnContact',
        group: '剪链虫',
        label: '碰到链格即剪断',
        kind: 'bool',
        "default": 1,
        note: 'P1-enemies-batch2 §2.3；走现成 chain.breakAt / scatter'
      }, numberParam('worm.cutCooldown', '剪链虫', '剪链间隔(s)', 2, 0, 10), numberParam('worm.retreatTime', '剪链虫', '剪完逃跑时间(s)', 1.5, 0, 5), numberParam('worm.maxAlive', '剪链虫', '同屏上限', 4, 1, 20, 1), {
        key: 'worm.ignoresPet',
        group: '剪链虫',
        label: '不主动撞宠物',
        kind: 'bool',
        "default": 1,
        note: 'P1-enemies-batch2 §2.3；接触伤害只在宠物撞上它时结算'
      },
      // docs/design/P1-enemies-batch2.md §2.3 盾甲龟；bit0 拖剑 bit1 链剑 bit2 飞剑
      numberParam('turtle.frontHalfAngle', '盾甲龟', '正面半角(°)', 60, 15, 90, 1), numberParam('turtle.frontMul', '盾甲龟', '正面伤害倍率', 0.1, 0, 1), numberParam('turtle.turnRate', '盾甲龟', '转身速度(°/s)', 90, 15, 360, 1),
      // Panel has no multi-select; design `shieldAppliesTo` is three bools (default all on).
      {
        key: 'turtle.shieldDrag',
        group: '盾甲龟',
        label: '盾对拖剑/鞭响',
        kind: 'bool',
        "default": 1,
        note: 'P1-enemies-batch2 §2.3 shieldAppliesTo；画圈斩仍无视盾'
      }, {
        key: 'turtle.shieldChain',
        group: '盾甲龟',
        label: '盾对链剑',
        kind: 'bool',
        "default": 1,
        note: 'P1-enemies-batch2 §2.3 shieldAppliesTo'
      }, {
        key: 'turtle.shieldThrow',
        group: '盾甲龟',
        label: '盾对飞剑',
        kind: 'bool',
        "default": 1,
        note: 'P1-enemies-batch2 §2.3 shieldAppliesTo'
      },
      // docs/design/P1-enemies-batch2.md §2.3 分裂泡泡
      numberParam('bubble.splitCount', '分裂泡泡', '分裂只数', 3, 0, 6, 1), numberParam('bubble.childHp', '分裂泡泡', '子泡生命', 10, 1, 2000, 1), numberParam('bubble.childSpeed', '分裂泡泡', '子泡速度(u/s)', 1.8, 0, 8), numberParam('bubble.childDmg', '分裂泡泡', '子泡接触伤害', 3, 0, 100, 1), numberParam('bubble.childRadius', '分裂泡泡', '子泡半径(u)', 0.22, 0.1, 1), numberParam('bubble.childLootMul', '分裂泡泡', '子泡掉落倍率', 0.15, 0, 1), numberParam('bubble.splitSpread', '分裂泡泡', '分裂散开半径(u)', 0.6, 0, 2), {
        key: 'bubble.loopNoSplit',
        group: '分裂泡泡',
        label: '画圈斩不分裂',
        kind: 'bool',
        "default": 1,
        note: 'P1-enemies-batch2 §2.3 / GDD §8.1'
      }, numberParam('bubble.childSpawnGrace', '分裂泡泡', '子泡无敌(s)', 0.2, 0, 1),
      // loot 读 `${kind}.cost`；子泡死亡/超上限折光点时把公式写入此键（enemy 定义，loot 读取）。
      numberParam('bubbleChild.cost', '分裂泡泡', '子泡掉落点数', 0.3, 0.1, 20), numberParam('enemy.bossBreakHitstopFrames', 'Boss', '破皮顿帧', 9, 0, 9, 1)]));

      // P0 未定义，自选默认值: UI step .05 unless supplied; registry does not quantise values.
      function numberParam(key, group, label, value, min, max, step) {
        if (step === void 0) {
          step = 0.05;
        }
        return {
          key: key,
          group: group,
          label: label,
          kind: 'number',
          "default": value,
          min: min,
          max: max,
          step: step
        };
      }
      function kindParams(kind, group, hp, radius, speed, damage, cost, resistance, unlockAt, weight, unlockWave) {
        var rows = [numberParam(kind + ".hp", group, '生命', hp, 1, 2000, 1), numberParam(kind + ".radius", group, '半径(u)', radius, 0.1, 1), numberParam(kind + ".speed", group, '速度(u/s)', speed, 0, 8), numberParam(kind + ".dmg", group, '接触伤害', damage, 0, 100, 1), numberParam(kind + ".cost", group, '刷怪点数(每只)', cost, 0.1, 20), numberParam(kind + ".kbResist", group, '击退抗性', resistance, 0, 1), numberParam(kind + ".unlockAt", group, '解锁时间(s)', unlockAt, 0, 600, 1), numberParam(kind + ".weight", group, '选怪权重(羊按群)', weight, 0, 5)];
        if (unlockWave !== undefined) {
          rows.push(numberParam(kind + ".unlockWave", group, '解锁波次', unlockWave, 1, 10, 1));
        }
        return rows;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/EnemyView.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './ScreenLayout.ts', './EnemyArt.ts'], function (exports) {
  var _inheritsLoose, _createForOfIteratorHelperLoose, _extends, cclegacy, _decorator, Color, Graphics, Label, view, SpriteFrame, Sprite, UITransform, Rect, Size, Vec2, Node, resources, Component, layoutScreen, ENEMY_ATLAS_KEYS, jsonRectToCocos, enemyMoveFrame, visualDiameterOf, enemyRotates, facingAngleDeg, ENEMY_ART;
  return {
    setters: [function (module) {
      _inheritsLoose = module.inheritsLoose;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _extends = module.extends;
    }, function (module) {
      cclegacy = module.cclegacy;
      _decorator = module._decorator;
      Color = module.Color;
      Graphics = module.Graphics;
      Label = module.Label;
      view = module.view;
      SpriteFrame = module.SpriteFrame;
      Sprite = module.Sprite;
      UITransform = module.UITransform;
      Rect = module.Rect;
      Size = module.Size;
      Vec2 = module.Vec2;
      Node = module.Node;
      resources = module.resources;
      Component = module.Component;
    }, function (module) {
      layoutScreen = module.layoutScreen;
    }, function (module) {
      ENEMY_ATLAS_KEYS = module.ENEMY_ATLAS_KEYS;
      jsonRectToCocos = module.jsonRectToCocos;
      enemyMoveFrame = module.enemyMoveFrame;
      visualDiameterOf = module.visualDiameterOf;
      enemyRotates = module.enemyRotates;
      facingAngleDeg = module.facingAngleDeg;
      ENEMY_ART = module.ENEMY_ART;
    }],
    execute: function () {
      exports({
        applyEnemyFrameRect: applyEnemyFrameRect,
        mountEnemyView: mountEnemyView
      });
      cclegacy._RF.push({}, "48a48MOp6JDoKV+sdbh9Zw8", "EnemyView", undefined);
      var ccclass = _decorator.ccclass;
      var BLOB = new Color(112, 165, 126, 255);
      var SHEEP = new Color(220, 220, 228, 255);
      var BOAR = new Color(184, 121, 110, 255);
      var WORM = new Color(168, 92, 196, 255);
      var TURTLE = new Color(72, 148, 108, 255);
      var TURTLE_SHIELD = new Color(210, 196, 88, 255);
      var BUBBLE = new Color(80, 180, 230, 160);
      var BUBBLE_CHILD = new Color(140, 210, 240, 160);
      var FLASH = new Color(255, 255, 255, 255);
      var SPRITE_OK = new Color(255, 255, 255, 255);
      var WARNING = new Color(255, 89, 72, 255);
      /** Batched Graphics fallback + warning lines; batch9/10 sprites when atlases load. */
      var EnemyGreyboxView = exports('EnemyGreyboxView', /*#__PURE__*/function (_Component) {
        _inheritsLoose(EnemyGreyboxView, _Component);
        function EnemyGreyboxView() {
          var _this;
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          _this = _Component.call.apply(_Component, [this].concat(args)) || this;
          _this.ctx = null;
          _this.module = null;
          _this.graphics = null;
          _this.hud = null;
          _this.numbers = [];
          _this.pool = [];
          _this.unsubs = [];
          _this.frames = new Map();
          _this.sprites = new Map();
          _this.subscribed = false;
          _this.disposed = false;
          _this.hudNode = null;
          _this.fxNode = null;
          return _this;
        }
        var _proto = EnemyGreyboxView.prototype;
        _proto.configure = function configure(ctx, module) {
          this.ctx = ctx;
          this.module = module;
          this.graphics = this.node.addComponent(Graphics);
          this.hudNode = makeNode(ctx.layers.get('hud'), 'EnemyDirectorHUD');
          this.hud = this.hudNode.addComponent(Label);
          if (this.hud) {
            this.hud.fontSize = 18;
            this.hud.lineHeight = 24;
            this.hud.color = FLASH;
          }
          this.fxNode = makeNode(ctx.layers.get('fx'), 'EnemyDamageNumbers');
          this.subscribe();
          this.loadArt();
        };
        _proto.onEnable = function onEnable() {
          var _this$module;
          (_this$module = this.module) == null || _this$module.attach();
          if (this.hudNode) this.hudNode.active = true;
          if (this.fxNode) this.fxNode.active = true;
          this.subscribe();
        };
        _proto.onDisable = function onDisable() {
          var _this$module2;
          this.unsubscribe();
          (_this$module2 = this.module) == null || _this$module2.detach();
          if (this.hudNode) this.hudNode.active = false;
          if (this.fxNode) this.fxNode.active = false;
          this.resetNumbers();
        };
        _proto.onDestroy = function onDestroy() {
          var _this$module3, _this$hudNode, _this$fxNode;
          this.disposed = true;
          this.unsubscribe();
          (_this$module3 = this.module) == null || _this$module3.detach();
          this.clearSprites();
          (_this$hudNode = this.hudNode) == null || _this$hudNode.destroy();
          (_this$fxNode = this.fxNode) == null || _this$fxNode.destroy();
          this.ctx = null;
          this.module = null;
        };
        _proto.update = function update() {
          var ctx = this.ctx;
          var module = this.module;
          var g = this.graphics;
          if (!ctx || !module || !g) return;
          g.clear();
          var scale = ctx.toPx({
            x: 1,
            y: 0
          }).x - ctx.toPx({
            x: 0,
            y: 0
          }).x;
          var seen = [];
          for (var _iterator = _createForOfIteratorHelperLoose(module.world.enemies.values()), _step; !(_step = _iterator()).done;) {
            var e = _step.value;
            if (!e.alive || e.kind === 'boss') continue;
            this.drawWarning(g, e, scale, ctx);
            var frame = this.frameOf(e, ctx.loop.simTime);
            if (frame) this.syncSprite(e, frame, scale, ctx);else {
              this.hideSprite(e.id);
              this.drawFallback(g, e, scale, ctx);
            }
            seen.push(e.id);
          }
          this.pruneSprites(seen);
          if (!ctx.services.has('player')) {
            var p = ctx.toPx(module.world.player().pos);
            g.strokeColor = new Color(120, 180, 255, 255);
            g.lineWidth = 2;
            g.circle(p.x, p.y, module.world.player().radius * scale);
            g.stroke();
          }
          if (this.hud) {
            var showHud = debugHudVisible(ctx);
            this.hud.node.active = showHud;
            if (showHud) {
              this.hud.string = "t " + module.director.elapsed.toFixed(3) + "   D " + module.director.danger.toFixed(3) + "   \u654C " + module.director.alive + "   \u89C6\u91CE\u5185\u5237\u51FA " + module.director.inViewSpawns;
              var size = view.getVisibleSize();
              var rect = layoutScreen(size.width, size.height).hud;
              this.hud.node.setPosition(rect.x + rect.width / 2 - size.width / 2, rect.y + rect.height / 2 - size.height / 2, 0);
            }
          }
          for (var i = this.numbers.length - 1; i >= 0; i--) {
            var number = this.numbers[i];
            if (!number) continue;
            var age = ctx.loop.simTime - number.born;
            if (age > ctx.tunables.get('enemy.damageNumberTime')) {
              number.label.node.active = false;
              this.pool.push(number.label);
              this.numbers.splice(i, 1);
            } else {
              var _p = ctx.toPx({
                x: number.pos.x,
                y: number.pos.y + age * ctx.tunables.get('enemy.damageNumberRise')
              });
              number.label.node.setPosition(_p);
            }
          }
        };
        _proto.loadArt = function loadArt() {
          var _this2 = this;
          var _loop = function _loop() {
            var key = ENEMY_ATLAS_KEYS[i];
            if (!key) return 1; // continue
            var spec = ENEMY_ART[key];
            resources.load(spec.atlasPath + "/spriteFrame", SpriteFrame, function (error, atlas) {
              if (_this2.disposed) return;
              if (error || !atlas) {
                console.warn("[enemy] failed to load " + spec.atlasPath + "; using gray-box fallback");
                return;
              }
              _this2.sliceAtlas(key, atlas);
            });
          };
          for (var i = 0; i < ENEMY_ATLAS_KEYS.length; i++) {
            if (_loop()) continue;
          }
        };
        _proto.sliceAtlas = function sliceAtlas(key, atlas) {
          var spec = ENEMY_ART[key];
          var names = Object.keys(spec.frames);
          for (var i = 0; i < names.length; i++) {
            var name = names[i];
            if (!name) continue;
            var fr = spec.frames[name];
            if (!fr) continue;
            var box = jsonRectToCocos(fr.rect, spec.atlasSize[1]);
            var frame = new SpriteFrame();
            frame.texture = atlas.texture;
            applyEnemyFrameRect(frame, box);
            this.frames.set(name, frame);
          }
        };
        _proto.frameOf = function frameOf(e, simTime) {
          var _this$frames$get;
          var name = enemyMoveFrame(e.kind, simTime, e.frontHitLeft, e.phase);
          if (!name) return null;
          return (_this$frames$get = this.frames.get(name)) != null ? _this$frames$get : null;
        };
        _proto.syncSprite = function syncSprite(e, frame, scale, ctx) {
          var slot = this.sprites.get(e.id);
          if (!slot) {
            var node = makeNode(this.node, "Enemy-" + e.id);
            var sprite = node.addComponent(Sprite);
            var transform = node.getComponent(UITransform);
            if (!sprite || !transform) return;
            sprite.sizeMode = Sprite.SizeMode.CUSTOM;
            sprite.type = Sprite.Type.SIMPLE;
            sprite.trim = false;
            slot = {
              node: node,
              sprite: sprite,
              transform: transform
            };
            this.sprites.set(e.id, slot);
          }
          slot.node.active = true;
          var p = ctx.toPx(e.pos);
          var shake = e.kind === 'turtle' && e.frontHitLeft > 1e-9 ? 1 : 0;
          slot.node.setPosition(p.x + shake, p.y, 0);
          var diameter = visualDiameterOf(e.kind) * scale;
          slot.transform.setContentSize(diameter, diameter);
          slot.transform.setAnchorPoint(0.5, 0.5);
          slot.sprite.spriteFrame = frame;
          slot.node.angle = enemyRotates(e.kind) ? facingAngleDeg(e.facing.x, e.facing.y) : 0;
          slot.sprite.color = e.flashLeft > 0 && e.frontHitLeft <= 1e-9 ? FLASH : SPRITE_OK;
        };
        _proto.hideSprite = function hideSprite(id) {
          var slot = this.sprites.get(id);
          if (slot) slot.node.active = false;
        };
        _proto.pruneSprites = function pruneSprites(seen) {
          var stale = [];
          this.sprites.forEach(function (_slot, id) {
            if (seen.indexOf(id) < 0) stale.push(id);
          });
          for (var i = 0; i < stale.length; i++) {
            var id = stale[i];
            if (id === undefined) continue;
            var slot = this.sprites.get(id);
            if (slot) {
              slot.node.active = false;
              slot.node.destroy();
            }
            this.sprites["delete"](id);
          }
        };
        _proto.clearSprites = function clearSprites() {
          this.sprites.forEach(function (slot) {
            return slot.node.destroy();
          });
          this.sprites.clear();
          this.frames.clear();
        };
        _proto.drawWarning = function drawWarning(g, e, scale, ctx) {
          if (e.kind !== 'boar' || e.phase !== 'windup') return;
          var p = ctx.toPx(e.pos);
          var r = e.radius * scale;
          var end = ctx.toPx({
            x: e.pos.x + e.chargeDir.x * e.chargeSpeed * ctx.tunables.get('boar.chargeTime'),
            y: e.pos.y + e.chargeDir.y * e.chargeSpeed * ctx.tunables.get('boar.chargeTime')
          });
          g.strokeColor = WARNING;
          g.lineWidth = Math.max(2, r * 0.15);
          g.moveTo(p.x, p.y);
          g.lineTo(end.x, end.y);
          g.stroke();
        };
        _proto.drawFallback = function drawFallback(g, e, scale, ctx) {
          var p = ctx.toPx(e.pos);
          var r = e.radius * scale;
          g.fillColor = e.flashLeft > 0 ? FLASH : fillOf(e.kind);
          if (e.kind === 'boar') g.roundRect(p.x - r, p.y - r, 2 * r, 2 * r, r / 2);else if (e.kind === 'turtle') g.roundRect(p.x - r, p.y - r, 2 * r, 2 * r, r / 3);else if (e.kind === 'worm') g.ellipse(p.x, p.y, r * 1.4, r * 0.7);else g.circle(p.x, p.y, r);
          g.fill();
          if (e.kind === 'turtle' && e.flashLeft <= 0) {
            var half = (ctx.tunables.has('turtle.frontHalfAngle') ? ctx.tunables.get('turtle.frontHalfAngle') : 60) * Math.PI / 180;
            var ang = Math.atan2(e.facing.y, e.facing.x);
            g.fillColor = TURTLE_SHIELD;
            g.moveTo(p.x, p.y);
            g.arc(p.x, p.y, r, ang - half, ang + half, false);
            g.close();
            g.fill();
          }
          if ((e.kind === 'bubble' || e.kind === 'bubbleChild') && e.flashLeft <= 0) {
            g.strokeColor = BUBBLE;
            g.lineWidth = Math.max(2, r * 0.12);
            g.circle(p.x, p.y, r);
            g.stroke();
          }
        };
        _proto.subscribe = function subscribe() {
          var _this3 = this;
          var ctx = this.ctx;
          if (!ctx || this.subscribed) return;
          this.subscribed = true;
          this.unsubs.push(ctx.events.on('session:start', function () {
            return _this3.resetNumbers();
          }));
          this.unsubs.push(ctx.events.on('debug:command', function (_ref) {
            var cmd = _ref.cmd;
            if (cmd === 'clearEnemies') _this3.resetNumbers();
          }));
          this.unsubs.push(ctx.events.on('enemy:damaged', function (_ref2) {
            var _this3$pool$pop;
            var id = _ref2.id,
              pos = _ref2.pos,
              amount = _ref2.amount,
              source = _ref2.source;
            if (!_this3.fxNode) return;
            var existing = _this3.numbers.find(function (number) {
              return number.id === id && ctx.loop.simTime - number.born <= ctx.tunables.get('enemy.damageMergeTime');
            });
            if (existing) {
              // P0 未定义，自选默认值: mixed-source merged colour follows the latest source.
              existing.label.color = source === 'whip' ? new Color(255, 220, 110, 255) : source === 'loop' ? new Color(80, 230, 230, 255) : FLASH;
              existing.amount += amount;
              existing.label.string = String(Math.round(existing.amount * 10) / 10);
              return;
            }
            if (_this3.numbers.length >= Math.floor(ctx.tunables.get('enemy.damageNumberMax'))) return;
            var label = (_this3$pool$pop = _this3.pool.pop()) != null ? _this3$pool$pop : makeNode(_this3.fxNode, 'Damage').addComponent(Label);
            if (!label) return;
            label.node.active = true;
            label.fontSize = 22;
            label.lineHeight = 26;
            label.color = source === 'whip' ? new Color(255, 220, 110, 255) : source === 'loop' ? new Color(80, 230, 230, 255) : FLASH;
            label.string = String(Math.round(amount * 10) / 10);
            label.node.setPosition(ctx.toPx(pos));
            _this3.numbers.push({
              label: label,
              pos: _extends({}, pos),
              born: ctx.loop.simTime,
              id: id,
              amount: amount
            });
          }));
        };
        _proto.unsubscribe = function unsubscribe() {
          for (var _iterator2 = _createForOfIteratorHelperLoose(this.unsubs), _step2; !(_step2 = _iterator2()).done;) {
            var off = _step2.value;
            off();
          }
          this.unsubs.length = 0;
          this.subscribed = false;
        };
        _proto.resetNumbers = function resetNumbers() {
          for (var _iterator3 = _createForOfIteratorHelperLoose(this.numbers), _step3; !(_step3 = _iterator3()).done;) {
            var number = _step3.value;
            number.label.node.active = false;
            this.pool.push(number.label);
          }
          this.numbers.length = 0;
        };
        return EnemyGreyboxView;
      }(Component));
      ccclass('EnemyGreyboxView')(EnemyGreyboxView);
      function debugHudVisible(ctx) {
        var enabled = typeof DEBUG_TUNING === 'boolean' && DEBUG_TUNING === true || typeof window === 'object' && typeof window.location === 'object' && /(?:^|[?&])debug=1(?:&|$)/.test(window.location.search);
        var toggleOn = ctx.tunables.has('tuning.hud') === false || ctx.tunables.getBool('tuning.hud');
        var combat = ctx.services.has('run') === false || ctx.services.get('run').combatActive;
        return enabled && toggleOn && combat;
      }
      function fillOf(kind) {
        if (kind === 'blob') return BLOB;
        if (kind === 'sheep') return SHEEP;
        if (kind === 'worm') return WORM;
        if (kind === 'turtle') return TURTLE;
        if (kind === 'bubble') return BUBBLE;
        if (kind === 'bubbleChild') return BUBBLE_CHILD;
        return BOAR;
      }

      /** Duck type so tests can pass the enemy CocosStub SpriteFrame (not `cc.SpriteFrame`). */

      /** Atlas SpriteFrame.originalSize defaults to the whole sheet (e.g. 512×64); that draws 64×64 as a sliver. */
      function applyEnemyFrameRect(frame, box) {
        frame.rect = new Rect(box.x, box.y, box.w, box.h);
        frame.originalSize = new Size(box.w, box.h);
        frame.offset = new Vec2(0, 0);
        frame.packable = false;
      }
      function makeNode(parent, name) {
        var node = new Node(name);
        node.layer = parent.layer;
        node.addComponent(UITransform);
        parent.addChild(node);
        return node;
      }
      function mountEnemyView(ctx, module) {
        var parent = ctx.layers.get('enemies');
        // Core's headless ports deliberately supply only { name }, not a Cocos Node.
        if (typeof parent.addChild !== 'function') return;
        var node = makeNode(parent, 'EnemyGreybox');
        var component = node.addComponent(EnemyGreyboxView);
        if (component) component.configure(ctx, module);
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/EnemyWorld.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './SpatialHash.ts', './Geom2.ts', './EnemyArt.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, _extends, cclegacy, SpatialHash, pointSegmentDistance, TURTLE_HIT_FRONT_TIME;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _extends = module.extends;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      SpatialHash = module.SpatialHash;
    }, function (module) {
      pointSegmentDistance = module.pointSegmentDistance;
    }, function (module) {
      TURTLE_HIT_FRONT_TIME = module.TURTLE_HIT_FRONT_TIME;
    }],
    execute: function () {
      exports('payloadKind', payloadKind);
      cclegacy._RF.push({}, "42a37+zTrVMDp1Sh2wN4eiY", "EnemyWorld", undefined);
      function payloadKind(kind) {
        return kind;
      }

      /** Duck-typed chain surface on the live `swordRig` (SwordRig.chain) so we do not import sword/. */

      /**
       * 滚石巨轮 behaviour (P1-07). The world keeps one generic entity list; an
       * enemy of kind `boss` moves, takes damage and dies through these hooks.
       */

      var MISS = {
        applied: false,
        dealt: 0,
        killed: false
      };
      var fixedTestPos = {
        x: 0,
        y: 0
      };

      /** P0 §12 T4 allows a fixed test pet; P0 未定义，自选默认值: map centre (set by `player()`).
       * Radius/HP use P0 §6.1; the fixture is immobile, takes no damage and registers no service. */
      var FIXED_TEST_PLAYER = exports('FIXED_TEST_PLAYER', {
        pos: fixedTestPos,
        vel: {
          x: 0,
          y: 0
        },
        radius: 0.35,
        maxSpeed: 0,
        hp: 100,
        maxHp: 100,
        state: 'normal',
        isInvulnerable: function isInvulnerable() {
          return false;
        },
        applyDamage: function applyDamage() {
          return false;
        }
      });

      /** Exact linear queries at P0's 80 entities also handle synchronous knockback
       * without stale spatial cells. No Cocos runtime dependencies. */
      var EnemyWorld = exports('EnemyWorld', /*#__PURE__*/function () {
        function EnemyWorld(ctx) {
          this.enemies = new Map();
          this.nextId = 1;
          this.alive = 0;
          this.pending = [];
          this.generation = 0;
          this.enabled = false;
          this.boss = null;
          this.ctx = void 0;
          this.ctx = ctx;
        }
        var _proto = EnemyWorld.prototype;
        _proto.setEnabled = function setEnabled(enabled) {
          this.enabled = enabled;
        };
        _proto.player = function player() {
          if (this.ctx.services.has('player')) return this.ctx.services.get('player');
          fixedTestPos.x = this.ctx.arena.width / 2;
          fixedTestPos.y = this.ctx.arena.height / 2;
          return FIXED_TEST_PLAYER;
        }

        /** Teleport without a kill or spawn event (P0 §8 recycle). Pending knockback is dropped. */;
        _proto.relocate = function relocate(e, pos) {
          e.pos = this.ctx.arena.clamp(pos, e.radius);
          e.knockbackLeft = 0;
          e.knockbackRemaining = {
            x: 0,
            y: 0
          };
        };
        _proto.clear = function clear() {
          var _this$boss;
          this.generation += 1;
          this.enemies.clear();
          this.pending.length = 0;
          this.alive = 0;
          // Keep IDs unique across restarts: stale attack IDs cannot hit new enemies.
          // Debug clearing never grants kills or loot.
          (_this$boss = this.boss) == null || _this$boss.cleared();
        }

        /**
         * P1-numbers-batch1 §3.1 / §3.3: HP and contact damage are snapshot by the
         * caller. Ignores `enemy.maxAlive`: the boss wave cannot lose its boss to the cap.
         * One boss at a time: a live one is removed without events (debug respawn).
         */;
        _proto.spawnBoss = function spawnBoss(pos, hp, damage) {
          if (!this.enabled) return null;
          for (var _iterator = _createForOfIteratorHelperLoose(this.enemies.values()), _step; !(_step = _iterator()).done;) {
            var old = _step.value;
            if (old.kind !== 'boss' || !old.alive) continue;
            old.alive = false;
            this.enemies["delete"](old.id);
            this.alive -= 1;
          }
          var t = this.ctx.tunables;
          var radius = t.get('boss.radius');
          var enemy = {
            id: this.nextId++,
            kind: 'boss',
            pos: this.ctx.arena.clamp(pos, radius),
            vel: {
              x: 0,
              y: 0
            },
            facing: {
              x: 0,
              y: -1
            },
            radius: radius,
            hp: hp,
            alive: true,
            speed: t.get('boss.speedBase'),
            damage: damage,
            resistance: t.get('boss.kbResist'),
            knockbackLeft: 0,
            knockbackRemaining: {
              x: 0,
              y: 0
            },
            phase: 'chase',
            phaseLeft: 0,
            chargeDir: {
              x: 0,
              y: -1
            },
            chargeSpeed: 0,
            scatterLeft: 0,
            scatterDir: {
              x: 0,
              y: 0
            },
            contactLeft: 0,
            flashLeft: 0,
            frontHitLeft: 0,
            fatalSource: 'drag',
            hits: new Map(),
            isChild: false,
            spawnGraceLeft: 0,
            cutCooldownLeft: 0,
            retreatLeft: 0,
            bornDanger: 1
          };
          this.enemies.set(enemy.id, enemy);
          this.alive += 1;
          this.ctx.events.emit('enemy:spawned', {
            id: enemy.id,
            kind: 'boss',
            pos: _extends({}, enemy.pos)
          });
          return enemy;
        }

        /** core IEnemyQuery.slowAt: boss ruts (P1-07 车辙减速宠物). */;
        _proto.slowAt = function slowAt(p) {
          return this.boss ? this.boss.slowAt(p) : 0;
        };
        _proto.spawn = function spawn(kind, pos, danger) {
          var t = this.ctx.tunables;
          // The boss has no `boss.hp` / `boss.cost`; it only enters through spawnBoss.
          if (kind === 'boss' || kind === 'bubbleChild' || !this.enabled || this.alive >= Math.floor(t.get('enemy.maxAlive'))) return null;
          if (kind === 'worm' && this.countKind('worm') >= Math.floor(t.get('worm.maxAlive'))) return null;
          // P0 §8: snapshot HP and contact damage at birth; speed never scales with D.
          var enemy = {
            id: this.nextId++,
            kind: kind,
            pos: this.ctx.arena.clamp(pos, t.get(kind + ".radius")),
            vel: {
              x: 0,
              y: 0
            },
            facing: {
              x: 0,
              y: -1
            },
            radius: t.get(kind + ".radius"),
            hp: t.get(kind + ".hp") * danger,
            alive: true,
            speed: t.get(kind + ".speed"),
            damage: t.get(kind + ".dmg") * (1 + t.get('diff.dmgK') * (danger - 1)),
            resistance: t.get(kind + ".kbResist"),
            knockbackLeft: 0,
            knockbackRemaining: {
              x: 0,
              y: 0
            },
            phase: 'chase',
            phaseLeft: 0,
            chargeDir: {
              x: 0,
              y: -1
            },
            chargeSpeed: t.get('boar.chargeSpeed'),
            scatterLeft: 0,
            scatterDir: {
              x: 0,
              y: 0
            },
            contactLeft: 0,
            flashLeft: 0,
            frontHitLeft: 0,
            fatalSource: 'drag',
            hits: new Map(),
            isChild: false,
            spawnGraceLeft: 0,
            cutCooldownLeft: 0,
            retreatLeft: 0,
            bornDanger: danger
          };
          this.enemies.set(enemy.id, enemy);
          this.alive += 1;
          this.ctx.events.emit('enemy:spawned', {
            id: enemy.id,
            kind: payloadKind(kind),
            pos: _extends({}, enemy.pos)
          });
          return enemy;
        };
        _proto.countKind = function countKind(kind) {
          var n = 0;
          for (var _iterator2 = _createForOfIteratorHelperLoose(this.enemies.values()), _step2; !(_step2 = _iterator2()).done;) {
            var _e = _step2.value;
            if (_e.alive && _e.kind === kind) n += 1;
          }
          return n;
        };
        _proto.aliveCount = function aliveCount() {
          return this.alive;
        };
        _proto.queryCircle = function queryCircle(c, r, out) {
          if (r < 0) return 0;
          return this.collect(out, function (e) {
            return Math.hypot(e.pos.x - c.x, e.pos.y - c.y) <= r + e.radius;
          });
        };
        _proto.querySegment = function querySegment(a, b, r, out) {
          if (r < 0) return 0;
          return this.collect(out, function (e) {
            return pointSegmentDistance(e.pos, a, b) <= r + e.radius;
          });
        };
        _proto.queryAABB = function queryAABB(minX, minY, maxX, maxY, out) {
          if (minX > maxX || minY > maxY) return 0;
          return this.collect(out, function (e) {
            var x = Math.max(minX, Math.min(maxX, e.pos.x));
            var y = Math.max(minY, Math.min(maxY, e.pos.y));
            return Math.hypot(e.pos.x - x, e.pos.y - y) <= e.radius;
          });
        };
        _proto.nearest = function nearest(c, r) {
          var nearest = null;
          var distance = r;
          for (var _iterator3 = _createForOfIteratorHelperLoose(this.enemies.values()), _step3; !(_step3 = _iterator3()).done;) {
            var _e2 = _step3.value;
            if (!_e2.alive) continue;
            var d = Math.max(0, Math.hypot(_e2.pos.x - c.x, _e2.pos.y - c.y) - _e2.radius);
            if (d <= distance && (nearest === null || d < distance)) {
              nearest = _e2;
              distance = d;
            }
          }
          return nearest;
        };
        _proto.getChargingBoars = function getChargingBoars() {
          var out = [];
          for (var _iterator4 = _createForOfIteratorHelperLoose(this.enemies.values()), _step4; !(_step4 = _iterator4()).done;) {
            var _e3 = _step4.value;
            if (_e3.alive && _e3.kind === 'boar' && _e3.phase === 'charge') {
              out.push({
                id: _e3.id,
                pos: _extends({}, _e3.pos),
                radius: _e3.radius
              });
            }
          }
          // Do not filter on cutsTrail: sword/loop owns that policy switch.
          return out;
        };
        _proto.hit = function hit(id, req) {
          var e = this.enemies.get(id);
          if (!this.enabled || !e || !e.alive || !Number.isFinite(req.amount) || req.amount <= 0 || !Number.isFinite(req.cooldown) || req.cooldown < 0) return _extends({}, MISS);
          // P1-enemies-batch2 §2.3: 子泡出生 grace 内不受同一次挥击伤害.
          if (e.spawnGraceLeft > 1e-9) return _extends({}, MISS);
          var now = this.ctx.loop.simTime;
          this.pruneHits(e, now);
          var until = e.hits.get(req.hitKey);
          if (until !== undefined && now + 1e-9 < until) return _extends({}, MISS);
          // P0 §7: stun vulnerability applies to every damage source, before overkill clamp.
          var multiplier = this.hitMultiplier(e, req);
          var dealt = Math.min(e.hp, req.amount * multiplier);
          e.hits.set(req.hitKey, now + req.cooldown);
          e.hp -= dealt;
          e.flashLeft = this.ctx.tunables.get('enemy.hitFlashTime');
          if (e.kind === 'turtle' && multiplier + 1e-9 < 1) e.frontHitLeft = TURTLE_HIT_FRONT_TIME;
          // Propagate fear around the impact position, before knockback moves it.
          if (e.kind === 'sheep') this.scatter(e);
          var distance = req.knockback !== undefined && Number.isFinite(req.knockback) ? req.knockback * (1 - e.resistance) : 0;
          // A fully resistant enemy (boss.kbResist 1) must not lose its move slice to a zero-length knockback.
          if (req.dir && Number.isFinite(req.dir.x) && Number.isFinite(req.dir.y) && distance > 1e-9) {
            var dir = unit(req.dir.x, req.dir.y);
            e.knockbackRemaining.x += dir.x * distance;
            e.knockbackRemaining.y += dir.y * distance;
            e.knockbackLeft = this.ctx.tunables.get('enemy.knockbackTime');
          }
          var killed = e.hp <= 0;
          if (killed) {
            e.alive = false;
            e.vel = {
              x: 0,
              y: 0
            };
            e.fatalSource = req.source;
            this.alive -= 1;
            this.pending.push(e);
            if (e.kind === 'bubble' && !e.isChild) this.splitBubble(e);
          }
          this.ctx.events.emit('enemy:damaged', {
            id: id,
            kind: payloadKind(e.kind),
            source: req.source,
            amount: dealt,
            killed: killed,
            pos: _extends({}, e.pos)
          });
          return {
            applied: true,
            dealt: dealt,
            killed: killed
          };
        };
        _proto.update = function update(dt) {
          if (!this.enabled || dt <= 0) return;
          var rigScale = this.ctx.services.has('swordRig') ? this.ctx.services.get('swordRig').enemyTimeScale : 1;
          var scaled = dt * (Number.isFinite(rigScale) ? Math.max(0, rigScale) : 1);
          if (scaled === 0) {
            for (var _iterator5 = _createForOfIteratorHelperLoose(this.enemies.values()), _step5; !(_step5 = _iterator5()).done;) {
              var _e4 = _step5.value;
              _e4.vel = {
                x: 0,
                y: 0
              };
            }
            return;
          }
          var player = this.player();
          var generation = this.generation;
          // Pre-step flock snapshot avoids order-dependent alignment and cohesion.
          var steering = new Map();
          var before = new Map();
          var grid = this.spatial();
          for (var _iterator6 = _createForOfIteratorHelperLoose(this.enemies.values()), _step6; !(_step6 = _iterator6()).done;) {
            var _e5 = _step6.value;
            if (!_e5.alive) continue;
            before.set(_e5.id, _extends({}, _e5.pos));
            if (_e5.kind === 'sheep') steering.set(_e5.id, this.sheepDirection(_e5, player.pos, grid));
          }
          for (var _iterator7 = _createForOfIteratorHelperLoose(this.enemies.values()), _step7; !(_step7 = _iterator7()).done;) {
            var _e6 = _step7.value;
            if (!_e6.alive) continue;
            this.pruneHits(_e6, this.ctx.loop.simTime);
            _e6.flashLeft = Math.max(0, _e6.flashLeft - scaled);
            _e6.frontHitLeft = Math.max(0, _e6.frontHitLeft - scaled);
            _e6.contactLeft = Math.max(0, _e6.contactLeft - scaled);
            _e6.spawnGraceLeft = Math.max(0, _e6.spawnGraceLeft - scaled);
            _e6.cutCooldownLeft = Math.max(0, _e6.cutCooldownLeft - scaled);
            _e6.retreatLeft = Math.max(0, _e6.retreatLeft - scaled);
            // Knockback replaces locomotion for its slice, so its requested
            // distance is not cancelled by pursuit. Timers still advance.
            var knockDt = Math.min(scaled, _e6.knockbackLeft);
            if (knockDt > 0) {
              var fraction = knockDt / _e6.knockbackLeft;
              _e6.pos = this.ctx.arena.clamp({
                x: _e6.pos.x + _e6.knockbackRemaining.x * fraction,
                y: _e6.pos.y + _e6.knockbackRemaining.y * fraction
              }, _e6.radius);
              _e6.knockbackRemaining.x *= 1 - fraction;
              _e6.knockbackRemaining.y *= 1 - fraction;
              _e6.knockbackLeft = Math.max(0, _e6.knockbackLeft - knockDt);
            }
            var _moveDt = scaled - knockDt;
            if (_e6.kind === 'boss') {
              if (this.boss) this.boss.step(_e6, player.pos, scaled, _moveDt);
            } else if (_e6.kind === 'worm') this.updateWorm(_e6, player, scaled, _moveDt);else if (_e6.kind === 'turtle') this.updateTurtle(_e6, player.pos, scaled, _moveDt);else if (_e6.kind === 'boar') this.updateBoar(_e6, player.pos, scaled, _moveDt);else if (_e6.kind === 'sheep') {
              var _steering$get;
              var direction = (_steering$get = steering.get(_e6.id)) != null ? _steering$get : {
                x: 0,
                y: 0
              };
              var scatterDt = Math.min(_moveDt, Math.max(0, _e6.scatterLeft - knockDt));
              if (scatterDt > 0) this.move(_e6, _e6.scatterDir, _e6.speed * this.ctx.tunables.get('sheep.scareSpeedMul'), scatterDt);
              _e6.scatterLeft = Math.max(0, _e6.scatterLeft - scaled);
              if (_moveDt > scatterDt) this.move(_e6, direction, _e6.speed, _moveDt - scatterDt);
            } else if (_moveDt > 0) this.chase(_e6, player.pos, _moveDt);
          }
          this.separate();
          for (var _iterator8 = _createForOfIteratorHelperLoose(this.enemies.values()), _step8; !(_step8 = _iterator8()).done;) {
            var _e7 = _step8.value;
            var start = before.get(_e7.id);
            if (!_e7.alive || !start) continue;
            _e7.vel = {
              x: (_e7.pos.x - start.x) / dt,
              y: (_e7.pos.y - start.y) / dt
            };
            if (player.state !== 'dead' && _e7.contactLeft <= 1e-9 && pointSegmentDistance(player.pos, start, _e7.pos) <= player.radius + _e7.radius && this.contactAllowed(_e7, player)) {
              _e7.contactLeft = this.ctx.tunables.get('enemy.contactCooldown');
              // Player owns invulnerability and jianzhen's 30% ink loss.
              player.applyDamage(_e7.damage, {
                enemyId: _e7.id,
                kind: payloadKind(_e7.kind)
              });
              if (generation !== this.generation || !this.enabled) return;
            }
          }
        };
        _proto.resolveDeaths = function resolveDeaths() {
          if (!this.enabled) return;
          var pending = this.pending;
          this.pending = [];
          var generation = this.generation;
          for (var _iterator9 = _createForOfIteratorHelperLoose(pending), _step9; !(_step9 = _iterator9()).done;) {
            var _e8 = _step9.value;
            this.enemies["delete"](_e8.id);
            if (_e8.kind === 'boss') {
              var _this$boss2;
              (_this$boss2 = this.boss) == null || _this$boss2.died(_e8);
              if (generation !== this.generation || !this.enabled) return;
              continue;
            }
            if (_e8.kind === 'bubbleChild') this.syncChildCost();
            var drop = this.ctx.rng.loot.next() < this.ctx.tunables.get('chain.dropChance');
            this.ctx.events.emit('enemy:died', {
              id: _e8.id,
              kind: payloadKind(_e8.kind),
              pos: _extends({}, _e8.pos),
              source: _e8.fatalSource
            });
            if (generation !== this.generation || !this.enabled) return;
            // P0 §6.3 assigns grade RNG to sword/chain; core's loot:sword grade is
            // optional (#23), so enemy omits it and reads no grade keys.
            if (drop) this.ctx.events.emit('loot:sword', {
              pos: _extends({}, _e8.pos)
            });
            if (generation !== this.generation || !this.enabled) return;
          }
        };
        _proto.collect = function collect(out, keep) {
          var before = out.length;
          for (var _iterator10 = _createForOfIteratorHelperLoose(this.enemies.values()), _step10; !(_step10 = _iterator10()).done;) {
            var _e9 = _step10.value;
            if (_e9.alive && keep(_e9)) out.push(_e9);
          }
          return out.length - before;
        };
        _proto.pruneHits = function pruneHits(e, now) {
          for (var _iterator11 = _createForOfIteratorHelperLoose(e.hits), _step11; !(_step11 = _iterator11()).done;) {
            var _step11$value = _step11.value,
              key = _step11$value[0],
              until = _step11$value[1];
            if (now + 1e-9 >= until) e.hits["delete"](key);
          }
        };
        _proto.scatter = function scatter(hit) {
          var t = this.ctx.tunables;
          var pet = this.player().pos;
          for (var _iterator12 = _createForOfIteratorHelperLoose(this.enemies.values()), _step12; !(_step12 = _iterator12()).done;) {
            var _e10 = _step12.value;
            if (!_e10.alive || _e10.kind !== 'sheep') continue;
            if (Math.hypot(_e10.pos.x - hit.pos.x, _e10.pos.y - hit.pos.y) > t.get('sheep.scareRadius')) continue;
            _e10.scatterLeft = t.get('sheep.scareTime');
            var away = unit(_e10.pos.x - pet.x, _e10.pos.y - pet.y);
            // At the exact pet centre no away vector exists: deterministic
            // opposite headings by ID, without consuming gameplay RNG.
            _e10.scatterDir = Math.hypot(away.x, away.y) > 0 ? away : {
              x: _e10.id % 2 === 0 ? 1 : -1,
              y: 0
            };
          }
        };
        _proto.sheepDirection = function sheepDirection(e, player, grid) {
          var t = this.ctx.tunables;
          var nearby = [];
          grid.queryCircle(e.pos.x, e.pos.y, t.get('sheep.flockRadius'), nearby);
          var cx = 0;
          var cy = 0;
          var ax = 0;
          var ay = 0;
          var sx = 0;
          var sy = 0;
          var count = 0;
          for (var _i = 0, _nearby = nearby; _i < _nearby.length; _i++) {
            var other = _nearby[_i];
            if (other.kind !== 'sheep' || other.id === e.id) continue;
            var dx = other.pos.x - e.pos.x;
            var dy = other.pos.y - e.pos.y;
            var _distance = Math.hypot(dx, dy);
            if (_distance > t.get('sheep.flockRadius')) continue;
            cx += dx;
            cy += dy;
            ax += other.vel.x;
            ay += other.vel.y;
            if (_distance > 1e-8 && _distance < t.get('sheep.sepDist')) {
              sx -= dx / _distance;
              sy -= dy / _distance;
            }
            count += 1;
          }
          // P0 未定义，自选默认值: normalise the four steering vectors, weight
          // their sum, then normalise once more to preserve sheep.speed.
          var separation = unit(sx, sy);
          var cohesion = unit(count ? cx / count : 0, count ? cy / count : 0);
          var alignment = unit(count ? ax / count : 0, count ? ay / count : 0);
          var seek = unit(player.x - e.pos.x, player.y - e.pos.y);
          return unit(separation.x * t.get('sheep.sep') + cohesion.x * t.get('sheep.coh') + alignment.x * t.get('sheep.align') + seek.x * t.get('sheep.seek'), separation.y * t.get('sheep.sep') + cohesion.y * t.get('sheep.coh') + alignment.y * t.get('sheep.align') + seek.y * t.get('sheep.seek'));
        };
        _proto.spatial = function spatial() {
          var radius = 0;
          for (var _iterator13 = _createForOfIteratorHelperLoose(this.enemies.values()), _step13; !(_step13 = _iterator13()).done;) {
            var _e11 = _step13.value;
            if (_e11.alive) radius = Math.max(radius, _e11.radius);
          }
          // Cell side derives from the largest collision diameter, not a new tunable.
          var grid = new SpatialHash(radius > 0 ? 2 * radius : this.ctx.tunables.get('blob.radius') * 2);
          for (var _iterator14 = _createForOfIteratorHelperLoose(this.enemies.values()), _step14; !(_step14 = _iterator14()).done;) {
            var _e12 = _step14.value;
            if (_e12.alive) grid.insert(_e12.id, _e12.pos.x, _e12.pos.y, _e12.radius, _e12);
          }
          return grid;
        };
        _proto.separate = function separate() {
          var candidates = [];
          for (var pass = 0; pass < Math.floor(this.ctx.tunables.get('enemy.separationPasses')); pass++) {
            var grid = this.spatial();
            var changed = false;
            for (var _iterator15 = _createForOfIteratorHelperLoose(this.enemies.values()), _step15; !(_step15 = _iterator15()).done;) {
              var _e13 = _step15.value;
              if (!_e13.alive) continue;
              candidates.length = 0;
              grid.queryCircle(_e13.pos.x, _e13.pos.y, _e13.radius, candidates);
              for (var _iterator16 = _createForOfIteratorHelperLoose(candidates), _step16; !(_step16 = _iterator16()).done;) {
                var other = _step16.value;
                if (other.id <= _e13.id) continue;
                var dx = other.pos.x - _e13.pos.x;
                var dy = other.pos.y - _e13.pos.y;
                var _distance2 = Math.hypot(dx, dy);
                var overlap = _e13.radius + other.radius - _distance2;
                if (overlap <= 1e-8) continue;
                var dir = _distance2 > 1e-8 ? unit(dx, dy) : {
                  x: _e13.id % 2 === 0 ? 1 : -1,
                  y: 0
                };
                // Equal split; if a wall blocks one half the other takes the rest.
                // The boss does not yield (boss.kbResist): the other enemy takes the whole overlap.
                var share = other.kind === 'boss' ? overlap : _e13.kind === 'boss' ? 0 : overlap / 2;
                var start = _extends({}, _e13.pos);
                _e13.pos = this.ctx.arena.clamp({
                  x: _e13.pos.x - dir.x * share,
                  y: _e13.pos.y - dir.y * share
                }, _e13.radius);
                var moved = (start.x - _e13.pos.x) * dir.x + (start.y - _e13.pos.y) * dir.y;
                var otherStart = _extends({}, other.pos);
                other.pos = this.ctx.arena.clamp({
                  x: other.pos.x + dir.x * (overlap - moved),
                  y: other.pos.y + dir.y * (overlap - moved)
                }, other.radius);
                var otherMoved = (other.pos.x - otherStart.x) * dir.x + (other.pos.y - otherStart.y) * dir.y;
                var remainder = Math.max(0, overlap - moved - otherMoved);
                _e13.pos = this.ctx.arena.clamp({
                  x: _e13.pos.x - dir.x * remainder,
                  y: _e13.pos.y - dir.y * remainder
                }, _e13.radius);
                changed = true;
              }
            }
            if (!changed) break;
          }
        };
        _proto.chase = function chase(e, player, dt) {
          var dx = player.x - e.pos.x;
          var dy = player.y - e.pos.y;
          this.move(e, unit(dx, dy), Math.min(e.speed, Math.hypot(dx, dy) / dt), dt);
        };
        _proto.updateBoar = function updateBoar(e, player, dt, moveDt) {
          if (moveDt === void 0) {
            moveDt = dt;
          }
          var t = this.ctx.tunables;
          if (e.phase === 'chase') {
            if (Math.hypot(player.x - e.pos.x, player.y - e.pos.y) > t.get('boar.triggerRange')) {
              if (moveDt > 0) this.chase(e, player, moveDt);
              return;
            }
            e.phase = 'windup';
            e.phaseLeft = t.get('boar.windup');
            var dir = unit(player.x - e.pos.x, player.y - e.pos.y);
            e.chargeDir = Math.hypot(dir.x, dir.y) > 0 ? dir : _extends({}, e.facing);
            e.facing = _extends({}, e.chargeDir);
          }
          // Carry leftover time across phase boundaries, including slow motion.
          var left = dt;
          var blocked = dt - moveDt;
          while (left > 1e-9 || e.phaseLeft <= 1e-9) {
            var _step17 = Math.min(left, e.phaseLeft);
            if (e.phase === 'charge' && moveDt > 0) {
              var travel = Math.max(0, _step17 - blocked);
              var destination = {
                x: e.pos.x + e.chargeDir.x * e.chargeSpeed * travel,
                y: e.pos.y + e.chargeDir.y * e.chargeSpeed * travel
              };
              this.move(e, e.chargeDir, e.chargeSpeed, travel);
              if (!this.ctx.arena.contains(destination, e.radius)) e.phaseLeft = _step17;
            }
            e.phaseLeft = Math.max(0, e.phaseLeft - _step17);
            left -= _step17;
            blocked = Math.max(0, blocked - _step17);
            if (e.phaseLeft > 1e-9) break;
            if (e.phase === 'windup') {
              e.phase = 'charge';
              e.phaseLeft = t.get('boar.chargeTime');
            } else if (e.phase === 'charge') {
              e.phase = 'recover';
              e.phaseLeft = t.get('boar.stunTime');
            } else {
              e.phase = 'chase';
              break;
            }
          }
        };
        _proto.move = function move(e, dir, speed, dt) {
          e.pos = this.ctx.arena.clamp({
            x: e.pos.x + dir.x * speed * dt,
            y: e.pos.y + dir.y * speed * dt
          }, e.radius);
          if (Math.hypot(dir.x, dir.y) > 0) e.facing = _extends({}, dir);
        };
        _proto.hitMultiplier = function hitMultiplier(e, req) {
          if (e.kind === 'boss' && this.boss) return this.boss.damageMul(e, req);
          if (e.kind === 'boar' && e.phase === 'recover') return this.ctx.tunables.get('boar.stunDmgTakenMul');
          if (e.kind === 'turtle') return this.turtleMul(e, req);
          return 1;
        }

        /** GDD §8.1 / P1-enemies-batch2 §2.3: 画圈斩无视盾；正面夹角 < frontHalfAngle 吃 frontMul. */;
        _proto.turtleMul = function turtleMul(e, req) {
          if (req.source === 'loop') return 1;
          if (!this.turtleShieldsSource(req.source) || !this.isFrontHit(e, req)) return 1;
          return this.ctx.tunables.get('turtle.frontMul');
        }

        /** Design `shieldAppliesTo` 多选：面板无多选 kind，拆成三个 bool。 */;
        _proto.turtleShieldsSource = function turtleShieldsSource(source) {
          var t = this.ctx.tunables;
          if (source === 'drag' || source === 'whip') return t.getBool('turtle.shieldDrag');
          if (source === 'link_auto' || source === 'link_contact') return t.getBool('turtle.shieldChain');
          if (source === 'throw_out' || source === 'throw_back' || source === 'main_return') {
            return t.getBool('turtle.shieldThrow');
          }
          return false;
        };
        _proto.isFrontHit = function isFrontHit(e, req) {
          if (!req.dir) return false;
          var dx = req.dir.x;
          var dy = req.dir.y;
          var fx = e.facing.x;
          var fy = e.facing.y;
          var dl = Math.hypot(dx, dy);
          var fl = Math.hypot(fx, fy);
          if (dl < 1e-8 || fl < 1e-8) return false;
          var dot = (dx * fx + dy * fy) / (dl * fl);
          var angle = Math.acos(Math.max(-1, Math.min(1, dot))) * 180 / Math.PI;
          return angle + 1e-9 < this.ctx.tunables.get('turtle.frontHalfAngle');
        };
        _proto.contactAllowed = function contactAllowed(e, player) {
          if (e.kind !== 'worm' || !this.ctx.tunables.getBool('worm.ignoresPet')) return true;
          var dx = e.pos.x - player.pos.x;
          var dy = e.pos.y - player.pos.y;
          return player.vel.x * dx + player.vel.y * dy > 1e-9;
        };
        _proto.updateTurtle = function updateTurtle(e, pet, dt, moveDt) {
          this.turnToward(e, pet, dt);
          if (moveDt <= 0) return;
          var dx = pet.x - e.pos.x;
          var dy = pet.y - e.pos.y;
          var dir = unit(dx, dy);
          var travel = Math.min(e.speed, Math.hypot(dx, dy) / moveDt);
          e.pos = this.ctx.arena.clamp({
            x: e.pos.x + dir.x * travel * moveDt,
            y: e.pos.y + dir.y * travel * moveDt
          }, e.radius);
        };
        _proto.turnToward = function turnToward(e, pet, dt) {
          var desired = unit(pet.x - e.pos.x, pet.y - e.pos.y);
          if (Math.hypot(desired.x, desired.y) < 1e-8) return;
          var cur = unit(e.facing.x, e.facing.y);
          var heading = Math.hypot(cur.x, cur.y) < 1e-8 ? {
            x: 0,
            y: -1
          } : cur;
          var cross = heading.x * desired.y - heading.y * desired.x;
          var dot = heading.x * desired.x + heading.y * desired.y;
          var maxTurn = this.ctx.tunables.get('turtle.turnRate') * Math.PI / 180 * dt;
          var turn = Math.max(-maxTurn, Math.min(maxTurn, Math.atan2(cross, dot)));
          var c = Math.cos(turn);
          var s = Math.sin(turn);
          e.facing = {
            x: heading.x * c - heading.y * s,
            y: heading.x * s + heading.y * c
          };
        };
        _proto.updateWorm = function updateWorm(e, player, _dt, moveDt) {
          var pet = player.pos;
          if (this.tryCutChain(e)) {
            e.retreatLeft = this.ctx.tunables.get('worm.retreatTime');
            e.cutCooldownLeft = this.ctx.tunables.get('worm.cutCooldown');
            var away = unit(e.pos.x - pet.x, e.pos.y - pet.y);
            e.scatterDir = Math.hypot(away.x, away.y) > 0 ? away : {
              x: 1,
              y: 0
            };
          }
          if (moveDt <= 0) return;
          if (e.retreatLeft > 0) {
            this.move(e, e.scatterDir, e.speed * 1.2, moveDt);
            return;
          }
          var target = this.wormTarget(pet);
          var speed = target.fromChain ? e.speed : e.speed * this.ctx.tunables.get('worm.noChainSpeedMul');
          var dx = target.pos.x - e.pos.x;
          var dy = target.pos.y - e.pos.y;
          this.move(e, unit(dx, dy), Math.min(speed, Math.hypot(dx, dy) / moveDt), moveDt);
        };
        _proto.wormTarget = function wormTarget(pet) {
          var _chain$slots$index;
          var mode = Math.floor(this.ctx.tunables.get('worm.target'));
          if (mode === 2) return {
            pos: pet,
            fromChain: false
          };
          var chain = this.chainApi();
          if (!chain || chain.slots.length === 0) return {
            pos: pet,
            fromChain: false
          };
          var index = mode === 1 ? chain.slots.length - 1 : Math.floor((chain.slots.length - 1) / 2);
          var slot = (_chain$slots$index = chain.slots[index]) != null ? _chain$slots$index : chain.slots[0];
          if (!slot) return {
            pos: pet,
            fromChain: false
          };
          return {
            pos: slot.pos,
            fromChain: true
          };
        };
        _proto.tryCutChain = function tryCutChain(e) {
          var _chain$immune;
          if (!this.ctx.tunables.getBool('worm.cutOnContact') || e.cutCooldownLeft > 1e-9) return false;
          var chain = this.chainApi();
          if (!chain || chain.slots.length === 0) return false;
          if (((_chain$immune = chain.immune) != null ? _chain$immune : 0) > 1e-8) return false;
          var linkR = this.ctx.tunables.has('chain.linkRadius') ? this.ctx.tunables.get('chain.linkRadius') : 0.2;
          for (var i = 0; i < chain.slots.length; i++) {
            var slot = chain.slots[i];
            if (!slot) continue;
            if (Math.hypot(e.pos.x - slot.pos.x, e.pos.y - slot.pos.y) > e.radius + linkR) continue;
            chain.breakAt(slot.index, 0, 0);
            return true;
          }
          return false;
        };
        _proto.chainApi = function chainApi() {
          if (!this.ctx.services.has('swordRig')) return null;
          var extras = this.ctx.services.get('swordRig');
          if (extras.chainVisible === false || !extras.chain || typeof extras.chain.breakAt !== 'function') return null;
          return extras.chain;
        };
        _proto.splitBubble = function splitBubble(e) {
          var t = this.ctx.tunables;
          if (t.getBool('bubble.loopNoSplit') && e.fatalSource === 'loop') return;
          var n = Math.max(0, Math.floor(t.get('bubble.splitCount')));
          var spread = t.get('bubble.splitSpread');
          for (var i = 0; i < n; i++) {
            var angle = n > 0 ? Math.PI * 2 * i / n : 0;
            var pos = {
              x: e.pos.x + Math.cos(angle) * spread,
              y: e.pos.y + Math.sin(angle) * spread
            };
            if (this.spawnChild(pos, e.bornDanger)) continue;
            this.emitOverflowChild(pos, e.fatalSource);
          }
        };
        _proto.spawnChild = function spawnChild(pos, danger) {
          var t = this.ctx.tunables;
          if (!this.enabled || this.alive >= Math.floor(t.get('enemy.maxAlive'))) return null;
          var radius = t.get('bubble.childRadius');
          var enemy = {
            id: this.nextId++,
            kind: 'bubbleChild',
            pos: this.ctx.arena.clamp(pos, radius),
            vel: {
              x: 0,
              y: 0
            },
            facing: {
              x: 0,
              y: -1
            },
            radius: radius,
            hp: t.get('bubble.childHp') * danger,
            alive: true,
            speed: t.get('bubble.childSpeed'),
            damage: t.get('bubble.childDmg') * (1 + t.get('diff.dmgK') * (danger - 1)),
            resistance: t.get('bubble.kbResist'),
            knockbackLeft: 0,
            knockbackRemaining: {
              x: 0,
              y: 0
            },
            phase: 'chase',
            phaseLeft: 0,
            chargeDir: {
              x: 0,
              y: -1
            },
            chargeSpeed: 0,
            scatterLeft: 0,
            scatterDir: {
              x: 0,
              y: 0
            },
            contactLeft: 0,
            flashLeft: 0,
            frontHitLeft: 0,
            fatalSource: 'drag',
            hits: new Map(),
            isChild: true,
            spawnGraceLeft: t.get('bubble.childSpawnGrace'),
            cutCooldownLeft: 0,
            retreatLeft: 0,
            bornDanger: danger
          };
          this.enemies.set(enemy.id, enemy);
          this.alive += 1;
          this.ctx.events.emit('enemy:spawned', {
            id: enemy.id,
            kind: payloadKind('bubbleChild'),
            pos: _extends({}, enemy.pos)
          });
          return enemy;
        };
        _proto.emitOverflowChild = function emitOverflowChild(pos, source) {
          this.syncChildCost();
          this.ctx.events.emit('enemy:died', {
            id: this.nextId++,
            kind: payloadKind('bubbleChild'),
            pos: _extends({}, pos),
            source: source
          });
        };
        _proto.syncChildCost = function syncChildCost() {
          var t = this.ctx.tunables;
          if (!t.has('bubbleChild.cost')) return;
          t.set('bubbleChild.cost', t.get('bubble.cost') * t.get('bubble.childLootMul'));
        };
        return EnemyWorld;
      }());
      function unit(x, y) {
        var length = Math.hypot(x, y);
        return length > 1e-8 ? {
          x: x / length,
          y: y / length
        } : {
          x: 0,
          y: 0
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/events.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "7b95cBxjJBMraoOad3POBC/", "events", undefined);
      /** Events that carry no fields. `{}` is the only valid payload. */
      /**
       * A charging boar cut the ink trail.
       * Emitted by sword/loop (issue #3 correction). Enemy does not emit this;
       * it only answers `IEnemyQuery.getChargingBoars()`.
       * `pos` is the cut point (issue #3). `inkLost` is the discarded older ink (P0 supplement).
       */
      /**
       * P0 event table (requirements §4.3) plus `jianzhen:cut` and the P1 run, loot,
       * upgrade and forge events.
       * Payloads are plain data. Do not put Node or Component references in them.
       */
      var GameEvent = exports('GameEvent', {
        SessionStart: 'session:start',
        SessionEnd: 'session:end',
        EnemySpawned: 'enemy:spawned',
        EnemyDamaged: 'enemy:damaged',
        EnemyDied: 'enemy:died',
        LootSword: 'loot:sword',
        PlayerDamaged: 'player:damaged',
        PlayerDied: 'player:died',
        SwordWhip: 'sword:whip',
        SwordFullCharge: 'sword:fullCharge',
        ChainChanged: 'chain:changed',
        ChainPickup: 'chain:pickup',
        ChainBreak: 'chain:break',
        ChainScatterExpired: 'chain:scatterExpired',
        ThrowStart: 'throw:start',
        ThrowCancel: 'throw:cancel',
        ThrowCatch: 'throw:catch',
        ThrowMiss: 'throw:miss',
        ThrowRecovered: 'throw:recovered',
        JianzhenWarn: 'jianzhen:warn',
        JianzhenStart: 'jianzhen:start',
        JianzhenLoop: 'jianzhen:loop',
        JianzhenRejectedLoop: 'jianzhen:rejectedLoop',
        JianzhenHit: 'jianzhen:hit',
        JianzhenEnd: 'jianzhen:end',
        JianzhenCut: 'jianzhen:cut',
        FxHitstop: 'fx:hitstop',
        FxShake: 'fx:shake',
        TuningChanged: 'tuning:changed',
        DebugCommand: 'debug:command',
        RunStart: 'run:start',
        RunPhase: 'run:phase',
        WaveStart: 'wave:start',
        WaveDoorOpen: 'wave:doorOpen',
        WaveFrenzy: 'wave:frenzy',
        WaveClear: 'wave:clear',
        RunEnd: 'run:end',
        BossDefeated: 'boss:defeated',
        LootDrop: 'loot:drop',
        LootPickup: 'loot:pickup',
        LootCoins: 'loot:coins',
        LootLevelUp: 'loot:levelUp',
        UpgradeOffer: 'upgrade:offer',
        UpgradeChosen: 'upgrade:chosen',
        UpgradeDone: 'upgrade:done',
        UpgradeItem: 'upgrade:item',
        UpgradeQuality: 'upgrade:quality',
        UpgradeModifier: 'upgrade:modifier',
        ForgeStrike: 'forge:strike',
        ForgeShatter: 'forge:shatter',
        ForgeShatterChoice: 'forge:shatterChoice',
        ForgeSword: 'forge:sword',
        ForgeLinkSword: 'forge:linkSword',
        ForgeBuyItem: 'forge:buyItem',
        ForgeSellItem: 'forge:sellItem',
        ForgeLeave: 'forge:leave'
      });
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/FixedLoop.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './SystemOrder.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, _createClass, cclegacy, SystemOrder;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      SystemOrder = module.SystemOrder;
    }],
    execute: function () {
      cclegacy._RF.push({}, "d1239ZU+S9OL76iYUAWgOae", "FixedLoop", undefined);
      var FIXED_HZ = exports('FIXED_HZ', 60);
      var FIXED_DT = exports('FIXED_DT', 1 / 60);
      var MAX_STEPS_PER_FRAME = exports('MAX_STEPS_PER_FRAME', 5);
      /** Whip / chain hits: 60ms, and a 200ms gap between two minor requests. */
      var HITSTOP_MAX_MS = exports('HITSTOP_MAX_MS', 60);
      var HITSTOP_MINOR_MAX_FRAMES = exports('HITSTOP_MINOR_MAX_FRAMES', Math.round(HITSTOP_MAX_MS * FIXED_HZ / 1000));
      /** Loop slash / Boss 破皮: P0 `loop.hitstopFrames` default. `fx.hitstopFrames` max 8 stays on that tunable. */
      var HITSTOP_MAJOR_MAX_FRAMES = exports('HITSTOP_MAJOR_MAX_FRAMES', 9);
      /** Product floor between two minor hit-stops. Major requests ignore this gap. */
      var HITSTOP_COOLDOWN_MS = exports('HITSTOP_COOLDOWN_MS', 200);
      var HITSTOP_COOLDOWN_FRAMES = exports('HITSTOP_COOLDOWN_FRAMES', Math.round(HITSTOP_COOLDOWN_MS * FIXED_HZ / 1000));
      /**
       * 60 Hz accumulator. Each render frame runs at most 5 steps; extra time is
       * dropped so a stall cannot spiral.
       * During hit-stop, simulation time stays put and only `SystemOrder.Input`
       * systems run. `render` still runs once per render frame.
       */
      var FixedLoop = exports('FixedLoop', /*#__PURE__*/function () {
        function FixedLoop() {
          this.systems = [];
          this.accumulator = 0;
          this.simTimeValue = 0;
          this.hitstopLeft = 0;
          this.hitstopCoolLeft = 0;
          this.stepsThisFrameValue = 0;
          this.pausedValue = false;
        }
        var _proto = FixedLoop.prototype;
        _proto.addSystem = function addSystem(system) {
          var existing = this.systems.findIndex(function (item) {
            return item.id === system.id;
          });
          if (existing >= 0) this.systems.splice(existing, 1);
          this.systems.push(system);
          this.systems.sort(function (a, b) {
            return a.order - b.order;
          });
        };
        _proto.removeSystem = function removeSystem(id) {
          var index = this.systems.findIndex(function (item) {
            return item.id === id;
          });
          if (index >= 0) this.systems.splice(index, 1);
        }

        /**
         * Request hit-stop frames (60 Hz). Never accumulates:
         * `hitstopLeft = max(hitstopLeft, granted)`.
         * `minor` (whip / chain) caps at 4 frames and is ignored during the 200ms gap.
         * `major` (loop slash / Boss 破皮) caps at 9 frames and ignores that gap.
         */;
        _proto.hitstop = function hitstop(frames, kind) {
          var count = Math.max(0, Math.floor(frames));
          if (count <= 0) return;
          var major = kind === 'major';
          if (!major && this.hitstopCoolLeft > 0) return;
          var cap = major ? HITSTOP_MAJOR_MAX_FRAMES : HITSTOP_MINOR_MAX_FRAMES;
          var granted = Math.min(count, cap);
          this.hitstopLeft = Math.max(this.hitstopLeft, granted);
          if (!major) this.hitstopCoolLeft = HITSTOP_COOLDOWN_FRAMES;
        }

        /**
         * Pause simulation without consuming hit-stop or retaining partial elapsed
         * time. Rendering continues from `tick`.
         */;
        _proto.pause = function pause() {
          this.pausedValue = true;
          this.accumulator = 0;
          this.stepsThisFrameValue = 0;
        }

        /** Resume from the next supplied frame delta, without catch-up steps. */;
        _proto.resume = function resume() {
          this.pausedValue = false;
        };
        _proto.resetClock = function resetClock() {
          this.accumulator = 0;
          this.simTimeValue = 0;
          this.hitstopLeft = 0;
          this.hitstopCoolLeft = 0;
          this.stepsThisFrameValue = 0;
        };
        _proto.tick = function tick(frameDt) {
          if (this.pausedValue) {
            this.accumulator = 0;
            this.stepsThisFrameValue = 0;
            for (var _iterator = _createForOfIteratorHelperLoose(this.systems), _step; !(_step = _iterator()).done;) {
              var system = _step.value;
              system.render == null || system.render();
            }
            return {
              steps: 0,
              hitstopSteps: 0
            };
          }
          var dt = Number.isFinite(frameDt) && frameDt > 0 ? frameDt : 0;
          this.accumulator += dt;
          var cap = FIXED_DT * MAX_STEPS_PER_FRAME;
          if (this.accumulator > cap) this.accumulator = cap;
          var steps = 0;
          var hitstopSteps = 0;
          var budget = MAX_STEPS_PER_FRAME;
          while (budget > 0 && this.accumulator >= FIXED_DT - 1e-8) {
            this.accumulator -= FIXED_DT;
            if (this.accumulator > -1e-8 && this.accumulator < 0) this.accumulator = 0;
            budget -= 1;
            if (this.hitstopCoolLeft > 0) this.hitstopCoolLeft -= 1;
            if (this.hitstopLeft > 0) {
              this.hitstopLeft -= 1;
              hitstopSteps += 1;
              this.step(true);
            } else {
              this.step(false);
              this.simTimeValue += FIXED_DT;
              steps += 1;
            }
          }
          this.stepsThisFrameValue = steps;
          for (var _iterator2 = _createForOfIteratorHelperLoose(this.systems), _step2; !(_step2 = _iterator2()).done;) {
            var _system = _step2.value;
            _system.render == null || _system.render();
          }
          return {
            steps: steps,
            hitstopSteps: hitstopSteps
          };
        };
        _proto.step = function step(hitstop) {
          for (var _iterator3 = _createForOfIteratorHelperLoose(this.systems), _step3; !(_step3 = _iterator3()).done;) {
            var system = _step3.value;
            if (hitstop && system.order !== SystemOrder.Input) continue;
            system.fixedUpdate(FIXED_DT);
          }
        };
        _createClass(FixedLoop, [{
          key: "simTime",
          get: function get() {
            return this.simTimeValue;
          }
        }, {
          key: "stepsThisFrame",
          get: function get() {
            return this.stepsThisFrameValue;
          }
        }, {
          key: "paused",
          get: function get() {
            return this.pausedValue;
          }
        }]);
        return FixedLoop;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/FloatingJoystick.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './InputHistory.ts', './InputParams.ts'], function (exports) {
  var _extends, _createClass, cclegacy, InputHistory, INPUT_DEFAULTS, INPUT_PIXELS_PER_UNIT;
  return {
    setters: [function (module) {
      _extends = module.extends;
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      InputHistory = module.InputHistory;
    }, function (module) {
      INPUT_DEFAULTS = module.INPUT_DEFAULTS;
      INPUT_PIXELS_PER_UNIT = module.INPUT_PIXELS_PER_UNIT;
    }],
    execute: function () {
      cclegacy._RF.push({}, "26ea7j9JM5LQYTczl7+HUc7", "FloatingJoystick", undefined);
      function emptyFrame() {
        return {
          touching: false,
          dir: {
            x: 0,
            y: 0
          },
          mag: 0,
          pressedThisTick: false,
          releasedThisTick: false,
          time: 0
        };
      }

      /** Single-owner pointer state, in UI pixels (+y up). No Cocos runtime dependency. */
      var FloatingJoystick = exports('FloatingJoystick', /*#__PURE__*/function () {
        function FloatingJoystick() {
          this.history = new InputHistory();
          this.config = {
            radiusPx: INPUT_PIXELS_PER_UNIT * INPUT_DEFAULTS.joyRadius,
            deadZone: INPUT_DEFAULTS.deadZone,
            followCenter: Boolean(INPUT_DEFAULTS.followCenter)
          };
          this.frameValue = emptyFrame();
          this.owner = null;
          this.centerValue = {
            x: 0,
            y: 0
          };
          this.pointerValue = {
            x: 0,
            y: 0
          };
          this.pressed = false;
          this.released = false;
          this.lastRelease = -1;
        }
        var _proto = FloatingJoystick.prototype;
        _proto.setConfig = function setConfig(config) {
          var _config$directionEpsi;
          this.config = _extends({}, config);
          this.history.setDirectionEpsilon((_config$directionEpsi = config.directionEpsilon) != null ? _config$directionEpsi : INPUT_DEFAULTS.directionEpsilon);
          this.follow();
        };
        _proto.pointerDown = function pointerDown(id, x, y) {
          if (this.owner !== null) return;
          this.owner = id;
          this.centerValue = {
            x: x,
            y: y
          };
          this.pointerValue = {
            x: x,
            y: y
          };
          this.pressed = true;
        };
        _proto.pointerMove = function pointerMove(id, x, y) {
          if (id !== this.owner) return;
          this.pointerValue = {
            x: x,
            y: y
          };
          this.follow();
        };
        _proto.pointerUp = function pointerUp(id) {
          if (id !== this.owner) return;
          this.owner = null;
          this.released = true;
        };
        _proto.fixedUpdate = function fixedUpdate(time) {
          this.follow();
          var dx = this.pointerValue.x - this.centerValue.x;
          var dy = this.pointerValue.y - this.centerValue.y;
          var distance = Math.hypot(dx, dy);
          var radius = this.config.radiusPx;
          var dead = this.config.deadZone;
          // P0 §6.1: clamp((distance / radius - deadZone) / (1 - deadZone), 0, 1).
          var mag = this.touching && radius > 0 && dead < 1 ? Math.max(0, Math.min(1, (distance / radius - dead) / (1 - dead))) : 0;
          if (this.released) this.lastRelease = time;
          this.frameValue = {
            touching: this.touching,
            dir: mag > 0 ? {
              x: dx / distance,
              y: dy / distance
            } : {
              x: 0,
              y: 0
            },
            mag: mag,
            pressedThisTick: this.pressed,
            releasedThisTick: this.released,
            time: time
          };
          this.pressed = false;
          this.released = false;
          this.history.record(this.frameValue);
        }

        /** Like core: a session clears history/edges but keeps an already held finger. */;
        _proto.beginSession = function beginSession() {
          this.history.clear();
          this.frameValue = _extends({}, emptyFrame(), {
            touching: this.touching
          });
          this.pressed = false;
          this.released = false;
          this.lastRelease = -1;
        };
        _proto.reset = function reset() {
          this.owner = null;
          this.beginSession();
        };
        _proto.avgDir = function avgDir(windowS, endTime) {
          if (endTime === void 0) {
            endTime = this.frameValue.time;
          }
          return this.history.avgDir(windowS, endTime);
        };
        _proto.minMag = function minMag(windowS, endTime) {
          if (endTime === void 0) {
            endTime = this.frameValue.time;
          }
          return this.history.minMag(windowS, endTime);
        };
        _proto.magDrop = function magDrop(windowS, endTime) {
          if (endTime === void 0) {
            endTime = this.frameValue.time;
          }
          return this.history.magDrop(windowS, endTime);
        };
        _proto.follow = function follow() {
          if (!this.touching || !this.config.followCenter || this.config.radiusPx <= 0) return;
          var dx = this.pointerValue.x - this.centerValue.x;
          var dy = this.pointerValue.y - this.centerValue.y;
          var distance = Math.hypot(dx, dy);
          if (distance <= this.config.radiusPx) return;
          // P0 §6.1: move the center by the excess, leaving exactly one radius to the pointer.
          var excess = (distance - this.config.radiusPx) / distance;
          this.centerValue = {
            x: this.centerValue.x + dx * excess,
            y: this.centerValue.y + dy * excess
          };
        };
        _createClass(FloatingJoystick, [{
          key: "frame",
          get: function get() {
            return this.frameValue;
          }
        }, {
          key: "lastReleaseTime",
          get: function get() {
            return this.lastRelease;
          }
        }, {
          key: "touching",
          get: function get() {
            return this.owner !== null;
          }
        }, {
          key: "center",
          get: function get() {
            return this.centerValue;
          }
        }, {
          key: "pointer",
          get: function get() {
            return this.pointerValue;
          }
        }, {
          key: "radiusPx",
          get: function get() {
            return this.config.radiusPx;
          }
        }]);
        return FloatingJoystick;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/ForgeArt.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "f530a/zGvZFUaWMVL27XHyQ", "ForgeArt", undefined);
      function art(name, sourceWidth, sourceHeight, insetTop, insetBottom, insetLeft, insetRight) {
        if (insetTop === void 0) {
          insetTop = 0;
        }
        if (insetBottom === void 0) {
          insetBottom = 0;
        }
        if (insetLeft === void 0) {
          insetLeft = 0;
        }
        if (insetRight === void 0) {
          insetRight = 0;
        }
        return {
          path: "ui/forge/" + name,
          sourceWidth: sourceWidth,
          sourceHeight: sourceHeight,
          insetTop: insetTop,
          insetBottom: insetBottom,
          insetLeft: insetLeft,
          insetRight: insetRight
        };
      }

      /** Transcribed from docs/ui/batch5/batch5-slices.json. */
      var FORGE_ART = exports('FORGE_ART', {
        chip: art('ui_forge_chip_normal', 128, 64, 18, 18, 18, 18),
        cylinder: art('ui_forge_cylinder_normal', 256, 512),
        drawDisabled: art('ui_forge_draw_disabled', 512, 128, 34, 40, 124, 40),
        drawNormal: art('ui_forge_draw_normal', 512, 128, 34, 40, 124, 40),
        drawPressed: art('ui_forge_draw_pressed', 512, 128, 34, 40, 124, 40),
        helpNormal: art('ui_forge_help_normal', 64, 64),
        helpPressed: art('ui_forge_help_pressed', 64, 64),
        slipCrit: art('ui_forge_slip_crit_normal', 64, 256),
        slipDamage: art('ui_forge_slip_dmg_normal', 64, 256),
        slipDrawn: art('ui_forge_slip_drawn', 64, 256),
        slipHighlight: art('ui_forge_slip_highlight', 64, 256),
        slipKeep: art('ui_forge_slip_keep_normal', 64, 256),
        slipShatter: art('ui_forge_slip_shat_normal', 64, 256),
        slipSuccess: art('ui_forge_slip_succ_normal', 64, 256)
      });
      var SLIP_ART = exports('SLIP_ART', {
        greatSuccess: 'slipCrit',
        success: 'slipSuccess',
        hold: 'slipKeep',
        damage: 'slipDamage',
        shatter: 'slipShatter'
      });
      /** 720 × 1280 center-origin positions transcribed from docs/ui/batch5/README.md §B. */
      var FORGE_LAYOUT = exports('FORGE_LAYOUT', {
        slipX: [-279, -217, -154, -92, -29, 33, 95, 158, 220, 283],
        slipRowsY: [360, 130],
        slip: {
          x: 0,
          y: 0,
          width: 64,
          height: 256
        },
        chip: {
          x: -278,
          y: -52,
          width: 132,
          height: 64
        },
        cylinder: {
          x: 0,
          y: -464,
          width: 256,
          height: 512
        },
        cylinderAnchorY: 0.05,
        help: {
          x: 292,
          y: -168,
          width: 64,
          height: 64
        },
        helpHitSize: 88,
        draw: {
          x: 0,
          y: -530,
          width: 440,
          height: 124
        },
        drawTextX: 35,
        dropSlip: {
          x: 6,
          y: -412,
          width: 77,
          height: 307
        }
      });
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/ForgeContract.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _createForOfIteratorHelperLoose, cclegacy;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports({
        applyHotspotBonus: applyHotspotBonus,
        canForge: canForge,
        copyForgeOdds: copyForgeOdds,
        createBaseSword: createBaseSword,
        forgeOdds: forgeOdds,
        forgeOddsSum: forgeOddsSum,
        swordLook: swordLook,
        swordLookRows: swordLookRows,
        swordSlots: swordSlots
      });
      cclegacy._RF.push({}, "254ddRwQkJNFrPDRHRdnCU5", "ForgeContract", undefined);
      /**
       * Shared forge / sword data contract (issue #108 PR1).
       * Every number lives in one tuning table, `FORGE_CONTRACT_PARAMS` (`forge.*`
       * keys), not in assets JSON. `swordLook`, `forgeOdds`, `applyHotspotBonus` and
       * `swordSlots` read those keys through a `ForgeParamSource`: pass `ctx.tunables`
       * so panel edits apply, or omit it to read the table defaults. The forge
       * module's draw and hotspot beat (#108 PR2) read the same table the same way.
       */

      var FORGE_OUTCOMES = exports('FORGE_OUTCOMES', ['great', 'success', 'keep', 'damage', 'break']);
      var FORGE_GOOD_OUTCOMES = exports('FORGE_GOOD_OUTCOMES', ['great', 'success', 'keep']);
      var FORGE_BAD_OUTCOMES = exports('FORGE_BAD_OUTCOMES', ['damage', 'break']);

      /** Level delta for keep/success/great/damage. `break` removes the sword. */
      var FORGE_OUTCOME_DELTA = exports('FORGE_OUTCOME_DELTA', {
        great: 2,
        success: 1,
        keep: 0,
        damage: -1,
        "break": 0
      });

      /** Reads `forge.*` values. `ctx.tunables` fits; `FORGE_CONTRACT_DEFAULTS` reads the table defaults. */

      /**
       * The run's +0 white base sword (保底白剑). It is permanent for the whole run
       * and can never go on the anvil, so a run never runs out of swords.
       */
      function createBaseSword(id) {
        return {
          id: id,
          kind: 'sword',
          level: 0,
          reserve: true
        };
      }

      /** False for the reserve base sword. Forge checks this before a sword goes on the anvil. */
      function canForge(sword) {
        return !sword.reserve;
      }
      var OUTCOME_LABEL = {
        great: '大成功',
        success: '成功',
        keep: '维持',
        damage: '损伤',
        "break": '破坏'
      };
      function lookKey(row, field) {
        return "forge.look.r" + row + "." + field;
      }
      function oddsKey(level, outcome) {
        return "forge.odds.l" + level + "." + outcome;
      }

      /** Art key of look row `row` (1-based): 1 → 'sword_01'. Zero-padded by hand to stay within ES2015. */
      function spriteIdOf(row) {
        return row < 10 ? "sword_0" + row : "sword_" + row;
      }
      function numberDef(key, label, value, min, max, step, note) {
        return {
          key: key,
          group: '锻铸契约',
          label: label,
          kind: 'number',
          "default": value,
          min: min,
          max: max,
          step: step,
          note: note
        };
      }
      function lookRow(row, minLevel, shapeId, tier, bladeTint) {
        var name = "\u5916\u89C2 " + spriteIdOf(row);
        return [numberDef(lookKey(row, 'minLevel'), name + " \u8D77\u59CB\u7B49\u7EA7", minLevel, 0, 40, 1, '从此等级起用这一行；表尾以后沿用最后一行；#108'), numberDef(lookKey(row, 'shapeId'), name + " \u5251\u5F62", shapeId, 0, 5, 1, '只给逻辑用（6 种剑形）；图按 spriteId 加载；#108'), numberDef(lookKey(row, 'tier'), name + " \u6863", tier, 0, 1, 1, '只给逻辑用（每种剑形 2 档，最后一种 1 档）；#108'), numberDef(lookKey(row, 'bladeTint'), name + " \u5203\u8272", bladeTint, 0, 0xffffff, 1, '0xRRGGBB；#108')];
      }
      function oddsRow(level, great, success, keep, damage, brk, initial) {
        var odds = {
          great: great,
          success: success,
          keep: keep,
          damage: damage,
          "break": brk
        };
        var mark = initial ? '【初始值】插值' : 'ForgeTax 实测锚点';
        var defs = [];
        for (var _i = 0, _FORGE_OUTCOMES = FORGE_OUTCOMES; _i < _FORGE_OUTCOMES.length; _i++) {
          var outcome = _FORGE_OUTCOMES[_i];
          defs.push(numberDef(oddsKey(level, outcome), "+" + level + " " + OUTCOME_LABEL[outcome] + "%", odds[outcome], 0, 100, 0.1, mark + "\uFF1B\u4E94\u9879\u5408\u8BA1 100%\uFF08\u504F\u4E86\u6309\u6BD4\u4F8B\u5F52\u4E00\uFF09\uFF1B#108"));
        }
        return defs;
      }

      /**
       * The single forge tuning table: hotspot cap and beat, look formulas, the 11
       * look rows and the per-level odds. App defines it on `ctx.tunables`; forge
       * registers nothing extra for these keys. Interpolated odds rows and the
       * beat's starting guesses are tagged 【初始值】.
       */
      var FORGE_CONTRACT_PARAMS = exports('FORGE_CONTRACT_PARAMS', [numberDef('forge.hotspotBonusCap', '热点加成上限(百分点)', 10, 0, 10, 1, '从破坏+损伤挪到维持/成功/大成功（含+2）；五项合计仍为 100%；#108'),
      // Hotspot beat (forge/ForgeHotspot.ts). Judged on clock ms at the press, never frames.
      numberDef('forge.hotspotPeriodBaseMs', '热点周期 +0(ms)', 1200, 250, 3000, 10, '剑身亮度一次起伏；每级缩短下一项，到下限为止；【初始值】；#108'), numberDef('forge.hotspotPeriodStepMs', '热点周期每级缩短(ms)', 50, 0, 200, 5, '1200 − 50×级，+17 到下限；【初始值】；#108'), numberDef('forge.hotspotPeriodFloorMs', '热点周期下限(ms)', 350, 250, 2000, 10, '再快就成了考反应；到下限后难度改由判定窗口收窄；#108'), numberDef('forge.hotspotToleranceMs', '热点容错 ±(ms)', 60, 0, 200, 5, '按下时刻离峰顶不超过此值 = 满加成；任何等级都不收窄；#108'), numberDef('forge.hotspotWindowMs', '热点判定窗口 ±(ms)', 150, 0, 600, 5, '容错外线性递减，离峰顶超过此值加成为 0（不惩罚）；周期到下限前不变；【初始值】；#108'), numberDef('forge.hotspotWindowStepMs', '热点窗口每级收窄(ms)', 15, 0, 100, 1, '周期到下限后每多 1 级收窄一次；【初始值】；#108'), numberDef('forge.hotspotWindowMinMs', '热点窗口最窄 ±(ms)', 90, 0, 600, 5, '收窄到此为止，且不窄于容错；【初始值】；#108'), numberDef('forge.anvilLengthMin', '铁砧剑长最短(px)', 360, 200, 720, 1, 'T0；跨档 360→648；#108'), numberDef('forge.anvilLengthMax', '铁砧剑长最长(px)', 648, 200, 720, 1, 'T10 及表尾以后；#108'), numberDef('forge.chainSlotPx', '剑链每格(px)', 72, 36, 144, 1, 'chainLengthPx = slots × 此值；#108'), numberDef('forge.slotBase', '占格基数', 1, 0, 4, 0.05, 'slots = min(slotMax, base + level × perLevel)；#108'), numberDef('forge.slotPerLevel', '占格每级', 0.05, 0, 0.2, 0.01, '1/20；#108'), numberDef('forge.slotMax', '占格上限', 2, 1, 4, 0.05, '最多 2 格；#108'), numberDef('forge.glowStartLevel', '光环起始等级', 20, 0, 40, 1, 'level>20 才用公式；#108'), numberDef('forge.glowBase', '光环基数', 1, 0, 2, 0.05, 'glow = min(max, base + 0.1×(level−20))；#108'), numberDef('forge.glowPerLevel', '光环每级', 0.1, 0, 0.5, 0.01, '#108'), numberDef('forge.glowMax', '光环上限', 2, 0, 4, 0.05, '#108')].concat(lookRow(1, 0, 0, 0, 0x6b5344), lookRow(2, 2, 0, 1, 0x8a6a52), lookRow(3, 4, 1, 0, 0x7a8490), lookRow(4, 6, 1, 1, 0x9aa4b0), lookRow(5, 8, 2, 0, 0xb87333), lookRow(6, 10, 2, 1, 0xd4a04a), lookRow(7, 12, 3, 0, 0x4a5560), lookRow(8, 14, 3, 1, 0x6a7580), lookRow(9, 16, 4, 0, 0x5c4a6a), lookRow(10, 18, 4, 1, 0x7a5a8a), lookRow(11, 20, 5, 0, 0xeaa834), oddsRow(0, 8.0, 64.0, 20.0, 8.0, 0, false), oddsRow(1, 7.8, 61.5, 19.6, 8.1, 3.0, true), oddsRow(2, 7.5, 59.2, 19.2, 8.2, 5.9, false), oddsRow(3, 7.2, 55.7, 18.8, 8.3, 10.0, true), oddsRow(4, 7.0, 51.2, 18.4, 8.4, 15.0, true), oddsRow(5, 6.8, 46.7, 18.0, 8.5, 20.0, true), oddsRow(6, 6.5, 42.3, 17.6, 8.6, 25.0, true), oddsRow(7, 6.2, 37.9, 17.2, 8.7, 30.0, true), oddsRow(8, 6.0, 32.4, 16.8, 8.8, 36.0, true), oddsRow(9, 5.8, 27.9, 16.4, 8.9, 41.0, true), oddsRow(10, 5.5, 22.8, 16.0, 9.0, 46.7, false), oddsRow(11, 5.2, 21.5, 15.6, 9.1, 48.6, true), oddsRow(12, 5.0, 20.1, 15.2, 9.2, 50.5, false), oddsRow(13, 4.8, 19.3, 14.8, 9.3, 51.8, true), oddsRow(14, 4.5, 18.6, 14.4, 9.4, 53.1, true), oddsRow(15, 4.2, 17.8, 14.0, 9.5, 54.5, true), oddsRow(16, 4.0, 17.0, 13.6, 9.6, 55.8, false), oddsRow(17, 3.8, 15.7, 13.2, 9.7, 57.6, true), oddsRow(18, 3.5, 14.5, 12.8, 9.8, 59.4, true), oddsRow(19, 3.2, 13.3, 12.4, 9.9, 61.2, true), oddsRow(20, 2.9, 12.1, 12.0, 10.0, 63.0, false)));
      var DEFAULT_VALUES = new Map();
      for (var _iterator = _createForOfIteratorHelperLoose(FORGE_CONTRACT_PARAMS), _step; !(_step = _iterator()).done;) {
        var def = _step.value;
        DEFAULT_VALUES.set(def.key, def["default"]);
      }

      /** `FORGE_CONTRACT_PARAMS` defaults. Unknown keys throw, like `Tunables.get`. */
      var FORGE_CONTRACT_DEFAULTS = exports('FORGE_CONTRACT_DEFAULTS', {
        get: function get(key) {
          var value = DEFAULT_VALUES.get(key);
          if (value === undefined) throw new Error("Unknown forge param: " + key);
          return value;
        }
      });

      /** Consecutive rows in the table, counted from `keyAt(0)`; the table alone sets its shape. */
      function countRows(keyAt) {
        var n = 0;
        while (DEFAULT_VALUES.has(keyAt(n))) n += 1;
        return n;
      }

      /** Look rows in the table (11, T0–T10). Row r (1-based) is keyed `forge.look.r<r>.*` and loads `sword_<rr>`. */
      var SWORD_LOOK_ROW_COUNT = exports('SWORD_LOOK_ROW_COUNT', countRows(function (n) {
        return lookKey(n + 1, 'minLevel');
      }));
      /** Highest level with its own odds row (+20); higher levels reuse it (no level cap). */
      var FORGE_ODDS_TOP_LEVEL = exports('FORGE_ODDS_TOP_LEVEL', countRows(function (n) {
        return oddsKey(n, 'great');
      }) - 1);
      function normalizeLevel(level) {
        if (!Number.isFinite(level) || level < 0) return 0;
        return Math.floor(level);
      }

      /** Levels, ids and colours are integers; round like the forge module's `param` reads. */
      function readInt(params, key) {
        return Math.round(params.get(key));
      }
      function swordSlots(level, params) {
        if (params === void 0) {
          params = FORGE_CONTRACT_DEFAULTS;
        }
        var lv = normalizeLevel(level);
        return Math.min(params.get('forge.slotMax'), params.get('forge.slotBase') + lv * params.get('forge.slotPerLevel'));
      }

      /**
       * Look row `row` (1-based). Anvil length and pre-20 glow ramp with the row
       * index; `chainLengthPx` is for the row's own `minLevel`.
       */
      function lookRowAt(row, params) {
        var ramp = (row - 1) / (SWORD_LOOK_ROW_COUNT - 1);
        var anvilMin = params.get('forge.anvilLengthMin');
        var minLevel = readInt(params, lookKey(row, 'minLevel'));
        return {
          minLevel: minLevel,
          shapeId: readInt(params, lookKey(row, 'shapeId')),
          tier: readInt(params, lookKey(row, 'tier')),
          spriteId: spriteIdOf(row),
          anvilLengthPx: anvilMin + (params.get('forge.anvilLengthMax') - anvilMin) * ramp,
          chainLengthPx: swordSlots(minLevel, params) * params.get('forge.chainSlotPx'),
          bladeTint: readInt(params, lookKey(row, 'bladeTint')),
          glow: ramp
        };
      }

      /** All look rows in order: index i is row i + 1 and loads `sword_<i + 1>`. */
      function swordLookRows(params) {
        if (params === void 0) {
          params = FORGE_CONTRACT_DEFAULTS;
        }
        var rows = [];
        for (var row = 1; row <= SWORD_LOOK_ROW_COUNT; row++) rows.push(lookRowAt(row, params));
        return rows;
      }

      /**
       * Pure look lookup: the last row whose `minLevel` ≤ level (row 1 if none).
       * Levels past the last row reuse its shape / sprite / anvil / tint;
       * `chainLengthPx` and post-20 `glow` still follow the requested level.
       */
      function swordLook(level, params) {
        if (params === void 0) {
          params = FORGE_CONTRACT_DEFAULTS;
        }
        var lv = normalizeLevel(level);
        var found = 1;
        for (var row = 1; row <= SWORD_LOOK_ROW_COUNT; row++) {
          if (readInt(params, lookKey(row, 'minLevel')) <= lv) found = row;
        }
        var src = lookRowAt(found, params);
        var glowStart = params.get('forge.glowStartLevel');
        var glow = lv > glowStart ? Math.min(params.get('forge.glowMax'), params.get('forge.glowBase') + params.get('forge.glowPerLevel') * (lv - glowStart)) : src.glow;
        return {
          minLevel: src.minLevel,
          shapeId: src.shapeId,
          tier: src.tier,
          spriteId: src.spriteId,
          anvilLengthPx: src.anvilLengthPx,
          chainLengthPx: swordSlots(lv, params) * params.get('forge.chainSlotPx'),
          bladeTint: src.bladeTint,
          glow: glow
        };
      }
      function copyForgeOdds(odds) {
        return {
          great: odds.great,
          success: odds.success,
          keep: odds.keep,
          damage: odds.damage,
          "break": odds["break"]
        };
      }
      function sumOf(odds, outcomes) {
        var sum = 0;
        for (var _iterator2 = _createForOfIteratorHelperLoose(outcomes), _step2; !(_step2 = _iterator2()).done;) {
          var outcome = _step2.value;
          sum += odds[outcome];
        }
        return sum;
      }
      function forgeOddsSum(odds) {
        return sumOf(odds, FORGE_OUTCOMES);
      }

      /**
       * Base odds for `level` from the `forge.odds.*` rows; levels past the top row
       * reuse it. A tuned row that drifts off 100 is rescaled to 100; an all-zero
       * row reads as keep 100.
       */
      function forgeOdds(level, params) {
        if (params === void 0) {
          params = FORGE_CONTRACT_DEFAULTS;
        }
        var lv = Math.min(normalizeLevel(level), FORGE_ODDS_TOP_LEVEL);
        var out = {
          great: 0,
          success: 0,
          keep: 0,
          damage: 0,
          "break": 0
        };
        for (var _iterator3 = _createForOfIteratorHelperLoose(FORGE_OUTCOMES), _step3; !(_step3 = _iterator3()).done;) {
          var _outcome = _step3.value;
          out[_outcome] = Math.max(0, params.get(oddsKey(lv, _outcome)));
        }
        var sum = forgeOddsSum(out);
        if (sum <= 0) {
          out.keep = 100;
        } else if (Math.abs(sum - 100) > 1e-9) {
          for (var _iterator4 = _createForOfIteratorHelperLoose(FORGE_OUTCOMES), _step4; !(_step4 = _iterator4()).done;) {
            var outcome = _step4.value;
            out[outcome] = out[outcome] * 100 / sum;
          }
        }
        return out;
      }

      /**
       * Move up to `bonusPct` points, capped by `forge.hotspotBonusCap`, from
       * break + damage into keep / success / great (issue #108 option A: +2 included).
       * Proportional on each side; the five outcomes keep their sum.
       */
      function applyHotspotBonus(odds, bonusPct, params) {
        if (params === void 0) {
          params = FORGE_CONTRACT_DEFAULTS;
        }
        var cap = params.get('forge.hotspotBonusCap');
        var bad = sumOf(odds, FORGE_BAD_OUTCOMES);
        var bonus = Math.min(Number.isFinite(bonusPct) ? bonusPct : 0, Number.isFinite(cap) ? cap : 0, bad);
        var out = copyForgeOdds(odds);
        if (bonus <= 0) return out;
        for (var _iterator5 = _createForOfIteratorHelperLoose(FORGE_BAD_OUTCOMES), _step5; !(_step5 = _iterator5()).done;) {
          var outcome = _step5.value;
          out[outcome] = odds[outcome] - bonus * (odds[outcome] / bad);
        }
        var good = sumOf(odds, FORGE_GOOD_OUTCOMES);
        for (var _iterator6 = _createForOfIteratorHelperLoose(FORGE_GOOD_OUTCOMES), _step6; !(_step6 = _iterator6()).done;) {
          var _outcome2 = _step6.value;
          var share = good > 0 ? odds[_outcome2] / good : 1 / FORGE_GOOD_OUTCOMES.length;
          out[_outcome2] = odds[_outcome2] + bonus * share;
        }
        return out;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/ForgeDebugOdds.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './ForgeContract.ts', './ForgeDraw.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, cclegacy, FORGE_CONTRACT_DEFAULTS, FORGE_OUTCOMES, drawLots, FORGE_DRAW_LOTS;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      FORGE_CONTRACT_DEFAULTS = module.FORGE_CONTRACT_DEFAULTS;
      FORGE_OUTCOMES = module.FORGE_OUTCOMES;
    }, function (module) {
      drawLots = module.drawLots;
      FORGE_DRAW_LOTS = module.FORGE_DRAW_LOTS;
    }],
    execute: function () {
      exports({
        debugOddsSnapshot: debugOddsSnapshot,
        formatDebugOddsLines: formatDebugOddsLines,
        formatOddsPercent: formatOddsPercent,
        isDebugQuery: isDebugQuery
      });
      cclegacy._RF.push({}, "341ac8BY0hFfrfRtua6CKB+", "ForgeDebugOdds", undefined);

      /**
       * Pure helpers for the PR3 hammer shell debug panel (#108).
       * No Cocos imports: unit-testable. Feel / strike timing lives elsewhere.
       */

      var OUTCOME_DEBUG_LABEL = {
        great: '+2 great',
        success: '+1 success',
        keep: 'stay',
        damage: '-1 damage',
        "break": 'break'
      };

      /** True when the URL query carries `debug=1` (same rule as TuningView / SwordView). */
      function isDebugQuery(search) {
        var raw = search !== undefined ? search : typeof window === 'object' && window !== null && typeof window.location === 'object' && window.location !== null ? window.location.search : '';
        return /(?:^|[?&])debug=1(?:&|$)/.test(raw);
      }

      /** One decimal place without String.padStart. */
      function formatOddsPercent(lots) {
        var pct = lots * 100 / FORGE_DRAW_LOTS;
        var rounded = Math.round(pct * 10) / 10;
        var whole = Math.floor(rounded);
        var frac = Math.round((rounded - whole) * 10);
        return whole + "." + frac + "%";
      }
      /**
       * Current draw pool after hotspot adjustment. HammerView passes the live
       * anvil level and real-clock quality; use `stub: true` only when it is empty.
       */
      function debugOddsSnapshot(level, hotspot, stub, params) {
        if (params === void 0) {
          params = FORGE_CONTRACT_DEFAULTS;
        }
        return {
          level: level,
          hotspot: hotspot,
          lots: drawLots(level, hotspot, params),
          stub: stub
        };
      }
      function trimHotspot(h) {
        if (!Number.isFinite(h)) return '0';
        var clamped = h < 0 ? 0 : h > 1 ? 1 : h;
        return String(Math.round(clamped * 1000) / 1000);
      }

      /** On-screen lines for the ?debug=1 odds panel. */
      function formatDebugOddsLines(snap) {
        var lines = [snap.stub ? "DEBUG DRAW ODDS \u2014 STUB (level " + snap.level + ", hotspot " + snap.hotspot + ", no forge run)" : "DEBUG DRAW ODDS \u2014 live (level " + snap.level + ", hotspot " + trimHotspot(snap.hotspot) + ")", "(after hotspot; " + FORGE_DRAW_LOTS + " lots = 100%)"];
        for (var _iterator = _createForOfIteratorHelperLoose(FORGE_OUTCOMES), _step; !(_step = _iterator()).done;) {
          var outcome = _step.value;
          var n = snap.lots[outcome];
          lines.push(OUTCOME_DEBUG_LABEL[outcome] + "  " + formatOddsPercent(n) + "  (" + n + " lots)");
        }
        return lines;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/ForgeDraw.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './ForgeContract.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, cclegacy, forgeOdds, FORGE_OUTCOMES, FORGE_CONTRACT_DEFAULTS, FORGE_BAD_OUTCOMES, FORGE_GOOD_OUTCOMES;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      forgeOdds = module.forgeOdds;
      FORGE_OUTCOMES = module.FORGE_OUTCOMES;
      FORGE_CONTRACT_DEFAULTS = module.FORGE_CONTRACT_DEFAULTS;
      FORGE_BAD_OUTCOMES = module.FORGE_BAD_OUTCOMES;
      FORGE_GOOD_OUTCOMES = module.FORGE_GOOD_OUTCOMES;
    }],
    execute: function () {
      exports({
        draw: draw,
        drawLots: drawLots
      });
      cclegacy._RF.push({}, "007b0fBxpRD3Ln6s6duhj89", "ForgeDraw", undefined);
      /** Lots in the hidden pool (#108 §3.1: one of 1000 lots per strike). One lot = 0.1 percentage point. */
      var FORGE_DRAW_LOTS = exports('FORGE_DRAW_LOTS', 1000);

      /** Whole lots per outcome; the five always add up to exactly `FORGE_DRAW_LOTS`. */

      function unit(x) {
        return x > 0 ? Math.min(1, x) : 0;
      }

      /**
       * Split `total` lots over `outcomes` in proportion to `weights` by cumulative
       * rounding: parts add up to `total` exactly, a zero weight gets no lot, and
       * each part is within one lot of its exact share. All-zero weights split evenly.
       */
      function apportion(total, outcomes, weights) {
        var out = {
          great: 0,
          success: 0,
          keep: 0,
          damage: 0,
          "break": 0
        };
        var sum = 0;
        for (var _iterator = _createForOfIteratorHelperLoose(outcomes), _step; !(_step = _iterator()).done;) {
          var outcome = _step.value;
          sum += Math.max(0, weights[outcome]);
        }
        var cum = 0;
        var placed = 0;
        for (var i = 0; i < outcomes.length; i++) {
          cum += sum > 0 ? Math.max(0, weights[outcomes[i]]) : 1;
          var upTo = i === outcomes.length - 1 ? total : Math.round(total * cum / (sum > 0 ? sum : outcomes.length));
          out[outcomes[i]] = upTo - placed;
          placed = upTo;
        }
        return out;
      }

      /**
       * The pool one strike draws from. Base odds come from the `forge.odds.*` rows
       * (`forgeOdds`; levels past the table reuse its last row). Hotspot quality 0..1
       * moves `quality × forge.hotspotBonusCap` points, to the nearest lot, from
       * break + damage into keep / success / great, each side in proportion to its
       * lots: the `applyHotspotBonus` rule in whole lots. Nothing moves past the cap
       * or past what break + damage hold. NaN or out-of-range quality is clamped to 0..1.
       */
      function drawLots(level, hotspot, params) {
        if (params === void 0) {
          params = FORGE_CONTRACT_DEFAULTS;
        }
        var base = apportion(FORGE_DRAW_LOTS, FORGE_OUTCOMES, forgeOdds(level, params));
        var cap = params.get('forge.hotspotBonusCap');
        // The slack keeps float error from dropping a lot (2.3 points is 23 lots, not 22).
        var capLots = Number.isFinite(cap) && cap > 0 ? Math.floor(cap * FORGE_DRAW_LOTS / 100 + 1e-9) : 0;
        var bad = 0;
        for (var _iterator2 = _createForOfIteratorHelperLoose(FORGE_BAD_OUTCOMES), _step2; !(_step2 = _iterator2()).done;) {
          var outcome = _step2.value;
          bad += base[outcome];
        }
        var moved = Math.min(bad, Math.round(unit(hotspot) * capLots));
        if (moved <= 0) return base;
        var take = apportion(moved, FORGE_BAD_OUTCOMES, base);
        var give = apportion(moved, FORGE_GOOD_OUTCOMES, base);
        var out = {
          great: 0,
          success: 0,
          keep: 0,
          damage: 0,
          "break": 0
        };
        for (var _iterator3 = _createForOfIteratorHelperLoose(FORGE_OUTCOMES), _step3; !(_step3 = _iterator3()).done;) {
          var _outcome = _step3.value;
          out[_outcome] = base[_outcome] - take[_outcome] + give[_outcome];
        }
        return out;
      }

      /**
       * Draw one strike's outcome (#108 decisions: `draw(level, hotspot, rng)`).
       * Uses exactly one `rng.nextInt(FORGE_DRAW_LOTS)` roll, so a seeded stream
       * replays the same results. Lots are laid out in `FORGE_OUTCOMES` order.
       */
      function draw(level, hotspot, rng, params) {
        if (params === void 0) {
          params = FORGE_CONTRACT_DEFAULTS;
        }
        var lots = drawLots(level, hotspot, params);
        var roll = rng.nextInt(FORGE_DRAW_LOTS);
        var upTo = 0;
        var last = 'keep';
        for (var _iterator4 = _createForOfIteratorHelperLoose(FORGE_OUTCOMES), _step4; !(_step4 = _iterator4()).done;) {
          var outcome = _step4.value;
          if (lots[outcome] <= 0) continue;
          upTo += lots[outcome];
          last = outcome;
          if (roll < upTo) return outcome;
        }
        // Only a roll outside [0, FORGE_DRAW_LOTS) gets here.
        return last;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/ForgeHotspot.ts", ['cc', './ForgeContract.ts'], function (exports) {
  var cclegacy, FORGE_CONTRACT_DEFAULTS;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      FORGE_CONTRACT_DEFAULTS = module.FORGE_CONTRACT_DEFAULTS;
    }],
    execute: function () {
      exports({
        hotspotBrightness: hotspotBrightness,
        hotspotPeriodMs: hotspotPeriodMs,
        hotspotQuality: hotspotQuality,
        hotspotWindowMs: hotspotWindowMs,
        rebaseHotspotPhase: rebaseHotspotPhase
      });
      cclegacy._RF.push({}, "cadbeB44RhPZL/rJNo+V7jT", "ForgeHotspot", undefined);

      /**
       * Hotspot beat (issue #108 §2.4 and the 10-21 decisions). The sword on the
       * anvil brightens and dims once per `hotspotPeriodMs(level)`; a press near the
       * brightest moment (a peak) earns hotspot quality 0..1 for `draw`.
       *
       * Times are ms on one monotonic clock that keeps running through hit-stop and
       * slow motion (only the picture pauses), so not `ctx.loop.simTime`, which
       * stops during hit-stop. Quality depends only on the press time: never on the
       * release, never on frames. Every number is a `forge.hotspot*` row of
       * `FORGE_CONTRACT_PARAMS`.
       */

      function levelOf(level) {
        return Number.isFinite(level) && level > 0 ? Math.floor(level) : 0;
      }
      function toleranceOf(params) {
        return Math.max(0, params.get('forge.hotspotToleranceMs'));
      }

      /** Beat period: base − step × level, never below the floor (any faster turns into a reaction test). */
      function hotspotPeriodMs(level, params) {
        if (params === void 0) {
          params = FORGE_CONTRACT_DEFAULTS;
        }
        var raw = params.get('forge.hotspotPeriodBaseMs') - params.get('forge.hotspotPeriodStepMs') * levelOf(level);
        return Math.max(params.get('forge.hotspotPeriodFloorMs'), raw);
      }

      /** First level whose period sits on the floor; Infinity when the period never gets there. */
      function floorLevel(params) {
        var above = params.get('forge.hotspotPeriodBaseMs') - params.get('forge.hotspotPeriodFloorMs');
        if (above <= 0) return 0;
        var step = params.get('forge.hotspotPeriodStepMs');
        if (!(step > 0)) return Infinity;
        // The slack stops float error in the division from skipping a level (850 / 50 stays 17).
        return Math.ceil(above / step - 1e-9);
      }

      /**
       * Judgement window ±ms, where quality reaches 0. Constant until the period hits
       * its floor; each level past that narrows it by `hotspotWindowStepMs`, down to
       * `hotspotWindowMinMs`. Never narrower than the tolerance.
       */
      function hotspotWindowMs(level, params) {
        if (params === void 0) {
          params = FORGE_CONTRACT_DEFAULTS;
        }
        var base = params.get('forge.hotspotWindowMs');
        var past = Math.max(0, levelOf(level) - floorLevel(params));
        var narrowed = base - params.get('forge.hotspotWindowStepMs') * past;
        return Math.max(toleranceOf(params), Math.min(base, params.get('forge.hotspotWindowMinMs')), narrowed);
      }

      /**
       * Hotspot quality 0..1 of a press at `pressTimeMs` for a sword whose pulse
       * started at `phaseStartMs` (when it went on the anvil). Peaks sit at
       * period / 2 + k × period after the start. Within ±tolerance of a peak the
       * press scores 1 at every level; past that, quality falls linearly to 0 at the
       * window edge. Further off, or before the start, is 0: no bonus, no penalty.
       */
      function hotspotQuality(pressTimeMs, phaseStartMs, level, params) {
        if (params === void 0) {
          params = FORGE_CONTRACT_DEFAULTS;
        }
        var elapsed = pressTimeMs - phaseStartMs;
        var period = hotspotPeriodMs(level, params);
        if (!Number.isFinite(elapsed) || elapsed < 0 || !(period > 0)) return 0;
        var off = Math.abs(elapsed % period - period / 2);
        var tolerance = toleranceOf(params);
        if (off <= tolerance) return 1;
        var window = hotspotWindowMs(level, params);
        if (off >= window) return 0;
        return (window - off) / (window - tolerance);
      }

      /**
       * Pulse brightness 0..1 at `nowMs` for the view: 0 as the sword goes on the
       * anvil, exactly 1 at every peak `hotspotQuality` judges against (raised cosine).
       */
      function hotspotBrightness(nowMs, phaseStartMs, level, params) {
        if (params === void 0) {
          params = FORGE_CONTRACT_DEFAULTS;
        }
        var elapsed = nowMs - phaseStartMs;
        var period = hotspotPeriodMs(level, params);
        if (!Number.isFinite(elapsed) || elapsed < 0 || !(period > 0)) return 0;
        return 0.5 - 0.5 * Math.cos(2 * Math.PI * (elapsed % period) / period);
      }

      /**
       * New pulse start for a level change at `nowMs`: the pulse keeps its phase and
       * carries on at the new level's period, because a strike never resets the beat
       * (#108 §2.4). Unchanged when the period stays the same or the pulse has not started.
       */
      function rebaseHotspotPhase(nowMs, phaseStartMs, fromLevel, toLevel, params) {
        if (params === void 0) {
          params = FORGE_CONTRACT_DEFAULTS;
        }
        var from = hotspotPeriodMs(fromLevel, params);
        var to = hotspotPeriodMs(toLevel, params);
        var elapsed = nowMs - phaseStartMs;
        if (from === to || !Number.isFinite(elapsed) || elapsed < 0 || !(from > 0) || !(to > 0)) return phaseStartMs;
        return nowMs - elapsed % from / from * to;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/ForgeModule.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './Anvil.ts', './HammerFeel.ts', './ForgeParams.ts', './ShatterRecord.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, _createClass, cclegacy, Anvil, HAMMER_PARAMS, FORGE_PARAMS, ShatterRecord;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      Anvil = module.Anvil;
    }, function (module) {
      HAMMER_PARAMS = module.HAMMER_PARAMS;
    }, function (module) {
      FORGE_PARAMS = module.FORGE_PARAMS;
    }, function (module) {
      ShatterRecord = module.ShatterRecord;
    }],
    execute: function () {
      cclegacy._RF.push({}, "cf61a9vX7ZBr5zm7a690X5F", "ForgeModule", undefined);

      /**
       * Forge wiring (docs/design/P1-tasks.md P1-04). Reads only `run` (mode / phase),
       * `loot` (coins for the hammer) and `swordRig` (link grades for 提拔); never the
       * ad layer (P1-04 红线, checked by scripts/check-forge-imports.mjs).
       *
       * The lots page opens when run enters the `forge` phase. MVP has no blacksmith
       * screen yet (P1-05), so the page itself offers 去下一波. Without a run module
       * (P0 sandbox) `debug:command` `forge` toggles the page and pauses the loop.
       *
       * PR3 (#108) hammer shell: `debug:command` `hammer` / Key H toggles a separate
       * color-block forge room (does not replace LotsView). See view/HammerView.ts.
       */
      var ForgeModule = exports('ForgeModule', /*#__PURE__*/function () {
        function ForgeModule(ctx, store) {
          var _this = this;
          this.anvil = void 0;
          this.record = void 0;
          this.ctx = void 0;
          this.openListeners = new Set();
          this.hammerOpenListeners = new Set();
          this.unsubs = [];
          this.opened = false;
          this.hammerOpened = false;
          this.pausedByForge = false;
          this.ctx = ctx;
          this.record = new ShatterRecord(store);
          this.anvil = new Anvil({
            param: function param(key) {
              return ctx.tunables.get(key);
            },
            emit: function emit(name, payload) {
              return ctx.events.emit(name, payload);
            },
            wallet: function wallet() {
              return _this.wallet();
            },
            linkGrades: function linkGrades() {
              var _ctx$services$get$lin;
              if (!ctx.services.has('swordRig')) return [];
              return (_ctx$services$get$lin = ctx.services.get('swordRig').linkGrades) != null ? _ctx$services$get$lin : [];
            }
          });
        }
        var _proto = ForgeModule.prototype;
        _proto.install = function install() {
          var _this2 = this;
          var ctx = this.ctx;
          ctx.tunables.define(HAMMER_PARAMS.filter(function (def) {
            return !ctx.tunables.has(def.key);
          }));
          ctx.tunables.define(FORGE_PARAMS.filter(function (def) {
            return !ctx.tunables.has(def.key);
          }));
          this.anvil.reset(ctx.session.seed, false);
          ctx.services.provide('anvil', this.anvil);
          this.unsubs.push(ctx.events.on('session:start', function (p) {
            _this2.anvil.reset(p.seed, _this2.tutorialRun());
            _this2.setOpen(false);
          }));
          this.unsubs.push(ctx.events.on('run:start', function (p) {
            return _this2.anvil.reset(ctx.session.seed, p.mode === 'tutorial');
          }));
          this.unsubs.push(ctx.events.on('run:phase', function (p) {
            if (p.to === 'forge') _this2.setOpen(true);else if (p.from === 'forge') _this2.setOpen(false);
          }));
          this.unsubs.push(ctx.events.on('forge:shatter', function (p) {
            return _this2.record.add(p.level);
          }));
          this.unsubs.push(ctx.events.on('debug:command', function (p) {
            if (p.cmd === 'forge' && !ctx.services.has('run')) _this2.setOpen(!_this2.opened);
          }));
        };
        _proto.dispose = function dispose() {
          for (var _iterator = _createForOfIteratorHelperLoose(this.unsubs), _step; !(_step = _iterator()).done;) {
            var off = _step.value;
            off();
          }
          this.unsubs.length = 0;
          this.openListeners.clear();
          this.hammerOpenListeners.clear();
        };
        _proto.coins = function coins() {
          var wallet = this.wallet();
          return wallet ? wallet.coins : null;
        };
        _proto.onOpenChange = function onOpenChange(cb) {
          var _this3 = this;
          this.openListeners.add(cb);
          return function () {
            _this3.openListeners["delete"](cb);
          };
        }

        /** 碎裂二选一 must be confirmed before leaving (GDD §9.6; UI-requirements S12). */;
        _proto.canLeave = function canLeave() {
          return this.anvil.pendingShatter === null;
        };
        _proto.leave = function leave() {
          if (!this.canLeave()) return;
          if (this.inRun) {
            if (this.ctx.services.get('run').phase === 'forge') this.ctx.events.emit('forge:leave', {});
            return;
          }
          this.setOpen(false);
        }

        /** Sandbox entry for keyboard / debug use; ignored inside a run. */;
        _proto.toggleSandbox = function toggleSandbox() {
          if (!this.inRun) this.setOpen(!this.opened);
        };
        /** PR3 hammer shell open listeners (LotsView stays on forge phase). */
        _proto.onHammerOpenChange = function onHammerOpenChange(cb) {
          var _this4 = this;
          this.hammerOpenListeners.add(cb);
          return function () {
            _this4.hammerOpenListeners["delete"](cb);
          };
        }

        /**
         * Sandbox / debug entry for the PR3 hammer shell. Safe during a run: it only
         * toggles the prototype overlay (the view pauses simulation) without changing
         * LotsView or run phase.
         */;
        _proto.toggleHammerSandbox = function toggleHammerSandbox() {
          this.setHammerOpen(!this.hammerOpened);
        };
        _proto.setHammerOpen = function setHammerOpen(open) {
          if (open === this.hammerOpened) return;
          this.hammerOpened = open;
          for (var _iterator2 = _createForOfIteratorHelperLoose(this.hammerOpenListeners), _step2; !(_step2 = _iterator2()).done;) {
            var cb = _step2.value;
            cb(open);
          }
        };
        _proto.tutorialRun = function tutorialRun() {
          return this.ctx.services.has('run') && this.ctx.services.get('run').mode === 'tutorial';
        };
        _proto.wallet = function wallet() {
          return this.ctx.services.has('loot') ? this.ctx.services.get('loot') : null;
        };
        _proto.setOpen = function setOpen(open) {
          if (open === this.opened) return;
          this.opened = open;
          if (!this.inRun) {
            if (open && !this.ctx.loop.paused) {
              this.ctx.loop.pause();
              this.pausedByForge = true;
            } else if (!open && this.pausedByForge) {
              this.pausedByForge = false;
              this.ctx.loop.resume();
            }
          }
          for (var _iterator3 = _createForOfIteratorHelperLoose(this.openListeners), _step3; !(_step3 = _iterator3()).done;) {
            var cb = _step3.value;
            cb(open);
          }
        };
        _createClass(ForgeModule, [{
          key: "isOpen",
          get: function get() {
            return this.opened;
          }

          /** True when run drives the page (去下一波 emits `forge:leave`). */
        }, {
          key: "inRun",
          get: function get() {
            return this.ctx.services.has('run');
          }
        }, {
          key: "isHammerOpen",
          get: function get() {
            return this.hammerOpened;
          }
        }]);
        return ForgeModule;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/ForgeParams.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports({
        tierKey: tierKey,
        tierOf: tierOf
      });
      cclegacy._RF.push({}, "67229F5TzFE2rAys8kM5rhZ", "ForgeParams", undefined);
      /** Result order on the lot table, best first (docs/design/GDD.md §9.3 五种结果). */
      var FORGE_RESULTS = exports('FORGE_RESULTS', ['greatSuccess', 'success', 'hold', 'damage', 'shatter']);

      /** Short keys used in the tier tunables, same order as `FORGE_RESULTS`. */
      var RESULT_KEYS = ['great', 'success', 'hold', 'damage', 'shatter'];
      var RESULT_LABELS = ['大成功', '成功', '维持', '损伤', '碎裂'];

      /** Lowest level of each tier row; the last row is open-ended (GDD §9.3 等级档; 等级没有上限). */
      var TIER_MIN_LEVELS = exports('TIER_MIN_LEVELS', [0, 3, 6, 9, 12, 15]);
      var TIER_NAMES = exports('TIER_NAMES', ['+0 ~ +2', '+3 ~ +5', '+6 ~ +8', '+9 ~ +11', '+12 ~ +14', '+15 及以上']);

      /** GDD §9.3 档位表 (提案：具体数值), one row per tier, columns in `FORGE_RESULTS` order. */
      var TIER_DEFAULTS = [[4, 12, 4, 0, 0], [3, 10, 4, 2, 1], [2, 8, 4, 4, 2], [2, 6, 4, 5, 3], [1, 5, 4, 6, 4], [1, 4, 3, 7, 5]];

      /** GDD §9.3 教学签筒 I (1 pinned 教学签 + 4 / 15 / 0 / 0 / 0) and II (3 / 14 / 2 / 1 / 0). */
      var TUTORIAL_I_GREAT_EXTRA = exports('TUTORIAL_I_GREAT_EXTRA', 4);
      var TUTORIAL_I_SUCCESS = exports('TUTORIAL_I_SUCCESS', 15);
      var TUTORIAL_II = exports('TUTORIAL_II', {
        greatSuccess: 3,
        success: 14,
        hold: 2,
        damage: 1,
        shatter: 0
      });

      /** 学徒剑 W2 / Lg2 / Cv1 (GDD §9.2): the main sword the anvil starts from and rebuilds after 碎裂. */
      var APPRENTICE_BLADE = exports('APPRENTICE_BLADE', {
        W: 2,
        Lg: 2,
        Cv: 1
      });
      function tierKey(tier, result) {
        return "forge.t" + tier + "." + RESULT_KEYS[FORGE_RESULTS.indexOf(result)];
      }

      /** Row of the GDD §9.3 tier table for `level`. */
      function tierOf(level) {
        var tier = 0;
        for (var i = 0; i < TIER_MIN_LEVELS.length; i++) {
          if (level >= TIER_MIN_LEVELS[i]) tier = i;
        }
        return tier;
      }
      function number(key, label, value, min, max, step, note) {
        return {
          key: key,
          group: '签筒',
          label: label,
          kind: 'number',
          "default": value,
          min: min,
          max: max,
          step: step,
          note: note
        };
      }
      function tierDefs() {
        var defs = [];
        for (var tier = 0; tier < TIER_DEFAULTS.length; tier++) {
          for (var j = 0; j < FORGE_RESULTS.length; j++) {
            defs.push(number(tierKey(tier, FORGE_RESULTS[j]), TIER_NAMES[tier] + " " + RESULT_LABELS[j] + "\u7B7E", TIER_DEFAULTS[tier][j], 0, 20, 1, 'GDD §9.3 档位表【提案】；每档合计应为 20；下次建筒生效'));
          }
        }
        return defs;
      }

      /**
       * Forge tunables (docs/design/P1-tasks.md P1-04; docs/design/GDD.md §7.6, §9.3, §9.5).
       * Every number here is 【提案】 in its source section, so each is on the tuning panel.
       * 大成功 +2 / 成功 +1 / 损伤 −1 are the GDD §9.3 已定 framework and are not tunable.
       */
      var FORGE_PARAMS = exports('FORGE_PARAMS', [number('forge.hammerBase', '锤价基数', 5, 0, 50, 1, 'GDD §7.6 / P1-tasks P1-04：锤价 = 基数 + 每级 × 等级'), number('forge.hammerPerLevel', '锤价每级', 2, 0, 20, 1, 'GDD §7.6 / P1-tasks P1-04'), number('forge.pityStreak', '保底连续损伤次数', 2, 1, 10, 1, 'GDD §9.5：连续 N 次损伤后下一锤至少维持'), number('forge.affixW', '大成功词条 剑重 +', 0.5, 0, 2, 0.1, 'P1-tasks P1-04：W +0.5'), number('forge.affixLg', '大成功词条 剑长 +', 0.5, 0, 2, 0.1, 'P1-tasks P1-04：Lg +0.5；教学签也用这一项'), number('forge.affixWChance', '大成功出剑重词条的概率', 0.5, 0, 1, 0.05, 'P1-tasks P1-04：W / Lg 各一半'), number('forge.splashCount', '大成功溅出链剑数', 1, 0, 5, 1, 'GDD §9.3 / P1-tasks P1-04：溅出 1 把'), number('forge.splashGrade', '溅出链剑等级', 1, 0, 15, 1, 'GDD §9.3 / P1-tasks P1-04：+1 链剑')].concat(tierDefs()));
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/ForgeState.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './ForgeContract.ts', './ForgeDraw.ts', './ForgeHotspot.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, cclegacy, canForge, FORGE_OUTCOME_DELTA, FORGE_CONTRACT_DEFAULTS, draw, hotspotQuality, rebaseHotspotPhase;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      canForge = module.canForge;
      FORGE_OUTCOME_DELTA = module.FORGE_OUTCOME_DELTA;
      FORGE_CONTRACT_DEFAULTS = module.FORGE_CONTRACT_DEFAULTS;
    }, function (module) {
      draw = module.draw;
    }, function (module) {
      hotspotQuality = module.hotspotQuality;
      rebaseHotspotPhase = module.rebaseHotspotPhase;
    }],
    execute: function () {
      exports({
        anvilSword: anvilSword,
        applyForgeOutcome: applyForgeOutcome,
        clearAnvil: clearAnvil,
        createForgeState: createForgeState,
        placeOnAnvil: placeOnAnvil,
        strikeAnvil: strikeAnvil,
        strikeAnvilAtQuality: strikeAnvilAtQuality
      });
      cclegacy._RF.push({}, "325d3cyb1pNXZwTvCoHoDAi", "ForgeState", undefined);

      /**
       * One forge visit (issue #108 §1): the sword rack, the sword on the anvil and
       * the pulse start of that sword's hotspot beat. Steps never mutate a state;
       * they return a new one.
       */

      function createForgeState(swords) {
        return {
          swords: swords.slice(),
          anvilId: null,
          phaseStartMs: 0
        };
      }
      function findSword(state, id) {
        for (var _iterator = _createForOfIteratorHelperLoose(state.swords), _step; !(_step = _iterator()).done;) {
          var sword = _step.value;
          if (sword.id === id) return sword;
        }
        return null;
      }

      /** The sword on the anvil, or null when the anvil is empty. */
      function anvilSword(state) {
        return state.anvilId === null ? null : findSword(state, state.anvilId);
      }

      /**
       * One outcome on one sword: great +2, success +1, keep 0, damage −1 (not below
       * +0); break returns null, the sword is gone with no compensation. Throws for
       * the reserve base sword, which can never be on the anvil.
       */
      function applyForgeOutcome(sword, outcome) {
        if (!canForge(sword)) throw new Error("reserve sword " + sword.id + " can never go on the anvil");
        if (outcome === 'break') return null;
        return {
          id: sword.id,
          kind: sword.kind,
          level: Math.max(0, sword.level + FORGE_OUTCOME_DELTA[outcome]),
          reserve: sword.reserve
        };
      }

      /**
       * Put sword `id` on the anvil; its hotspot pulse starts at `nowMs`. Refuses the
       * reserve base sword (`canForge`).
       */
      function placeOnAnvil(state, id, nowMs) {
        var sword = findSword(state, id);
        if (!sword) return {
          ok: false,
          reason: 'missing'
        };
        if (!canForge(sword)) return {
          ok: false,
          reason: 'reserve'
        };
        return {
          ok: true,
          state: {
            swords: state.swords,
            anvilId: id,
            phaseStartMs: nowMs
          }
        };
      }

      /** Take the sword off the anvil; it stays on the rack. */
      function clearAnvil(state) {
        return {
          swords: state.swords,
          anvilId: null,
          phaseStartMs: state.phaseStartMs
        };
      }

      /**
       * One strike pressed at `pressTimeMs`: judge the hotspot at that moment, draw
       * with one `rng` roll, apply the outcome. A broken sword leaves the rack and
       * the anvil. A level change rebases the pulse so the beat carries on without a
       * jump. A refused strike (empty anvil, reserve sword) does not touch `rng`.
       */
      function strikeAnvil(state, pressTimeMs, rng, params) {
        if (params === void 0) {
          params = FORGE_CONTRACT_DEFAULTS;
        }
        var sword = anvilSword(state);
        if (!sword) return {
          ok: false,
          reason: 'empty'
        };
        if (!canForge(sword)) return {
          ok: false,
          reason: 'reserve'
        };
        var quality = hotspotQuality(pressTimeMs, state.phaseStartMs, sword.level, params);
        return strikeAnvilAtQuality(state, pressTimeMs, quality, rng, params);
      }

      /** Resolve at impact using quality captured at the original press, including buffered input. */
      function strikeAnvilAtQuality(state, pressTimeMs, quality, rng, params) {
        if (params === void 0) {
          params = FORGE_CONTRACT_DEFAULTS;
        }
        var sword = anvilSword(state);
        if (!sword) return {
          ok: false,
          reason: 'empty'
        };
        if (!canForge(sword)) return {
          ok: false,
          reason: 'reserve'
        };
        quality = Math.max(0, Math.min(1, quality));
        var outcome = draw(sword.level, quality, rng, params);
        var after = applyForgeOutcome(sword, outcome);
        var swords = [];
        for (var _iterator2 = _createForOfIteratorHelperLoose(state.swords), _step2; !(_step2 = _iterator2()).done;) {
          var s = _step2.value;
          if (s.id !== sword.id) swords.push(s);else if (after) swords.push(after);
        }
        var next = after ? {
          swords: swords,
          anvilId: sword.id,
          phaseStartMs: rebaseHotspotPhase(pressTimeMs, state.phaseStartMs, sword.level, after.level, params)
        } : {
          swords: swords,
          anvilId: null,
          phaseStartMs: state.phaseStartMs
        };
        return {
          ok: true,
          state: next,
          outcome: outcome,
          quality: quality,
          before: sword,
          after: after
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/FxDriver.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "0e41fh0y8BGQLEmWtvD8izZ", "FxDriver", undefined);
      /** Screen shake in arena units. Render keeps running during hit-stop. */
      var FxDriver = exports('FxDriver', /*#__PURE__*/function () {
        function FxDriver() {
          this.amp = 0;
          this.timeLeft = 0;
          this.duration = 0;
          this.offset = {
            x: 0,
            y: 0
          };
        }
        var _proto = FxDriver.prototype;
        _proto.requestShake = function requestShake(amp, dur) {
          var nextAmp = Math.max(0, amp);
          var nextDur = Math.max(0, dur);
          if (nextAmp <= 0 || nextDur <= 0) return;
          if (this.timeLeft > 0 && nextAmp < this.amp) return;
          this.amp = nextAmp;
          this.duration = nextDur;
          this.timeLeft = nextDur;
        }

        /** Decay the shake and write a new offset. Uses the fx RNG stream. */;
        _proto.update = function update(frameDt, rng) {
          if (this.timeLeft <= 0 || this.duration <= 0) {
            this.offset.x = 0;
            this.offset.y = 0;
            return this.offset;
          }
          var dt = Number.isFinite(frameDt) && frameDt > 0 ? frameDt : 0;
          this.timeLeft = Math.max(0, this.timeLeft - dt);
          var mag = this.amp * (this.timeLeft / this.duration);
          var angle = rng.next() * Math.PI * 2;
          this.offset.x = Math.cos(angle) * mag;
          this.offset.y = Math.sin(angle) * mag;
          return this.offset;
        };
        _proto.reset = function reset() {
          this.amp = 0;
          this.timeLeft = 0;
          this.duration = 0;
          this.offset.x = 0;
          this.offset.y = 0;
        };
        return FxDriver;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/GameContext.ts", ['cc'], function () {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "1f93fZZEK5LSpwY0V2tc0g8", "GameContext", undefined);
      /** The bounded map (P0 §3 地图, §4.2). Size comes from `map.width` / `map.height` at session start. */
      /** Off-view targets that get a screen-edge arrow (GDD §4.4 屏幕边缘指示, UI R7). */
      /** Follow camera (P0 §4.2). The view stays 10u × 15u whatever the map size. */
      /**
       * Shared handle passed to every module's `install`.
       * Modules talk only through `services` and `events`.
       */
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/geom.ts", ['cc', './Geom2.ts'], function (exports) {
  var cclegacy, pointSegmentDistance;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      pointSegmentDistance = module.pointSegmentDistance;
    }],
    execute: function () {
      exports({
        capsuleContact: capsuleContact,
        distance: distance,
        douglasPeucker: douglasPeucker,
        findClosure: findClosure,
        interpolate: interpolate,
        pointInPolygon: pointInPolygon,
        polygonArea: polygonArea,
        segmentIntersection: segmentIntersection,
        trailLength: trailLength,
        trimOldest: trimOldest
      });
      cclegacy._RF.push({}, "2bd61R5xFREeJxn1wNATMag", "geom", undefined);
      var EPS = 1e-9; // Numerical precision, not a gameplay tolerance.

      /** Includes degeneracies and returns the FIRST overlap traveling A -> B. */
      function segmentIntersection(a, b, c, d) {
        var rx = b.x - a.x,
          ry = b.y - a.y;
        var sx = d.x - c.x,
          sy = d.y - c.y;
        var rr = rx * rx + ry * ry,
          ss = sx * sx + sy * sy;
        if (rr <= EPS * EPS) {
          if (pointSegmentDistance(a, c, d) > EPS) return null;
          var _u = ss <= EPS * EPS ? 0 : ((a.x - c.x) * sx + (a.y - c.y) * sy) / ss;
          return {
            point: {
              x: a.x,
              y: a.y
            },
            t: 0,
            u: Math.max(0, Math.min(1, _u))
          };
        }
        var qx = c.x - a.x,
          qy = c.y - a.y;
        var cross = rx * sy - ry * sx;
        var t, u;
        if (Math.abs(cross) <= EPS) {
          if (Math.abs(qx * ry - qy * rx) > EPS) return null;
          var tc = (qx * rx + qy * ry) / rr;
          var td = ((d.x - a.x) * rx + (d.y - a.y) * ry) / rr;
          t = Math.max(0, Math.min(tc, td));
          if (t > Math.min(1, Math.max(tc, td)) + EPS) return null;
          u = ss <= EPS * EPS ? 0 : ((a.x + rx * t - c.x) * sx + (a.y + ry * t - c.y) * sy) / ss;
        } else {
          t = (qx * sy - qy * sx) / cross;
          u = (qx * ry - qy * rx) / cross;
          if (t < -EPS || t > 1 + EPS || u < -EPS || u > 1 + EPS) return null;
        }
        t = Math.max(0, Math.min(1, t));
        return {
          point: {
            x: a.x + rx * t,
            y: a.y + ry * t
          },
          t: t,
          u: Math.max(0, Math.min(1, u))
        };
      }
      function distance(a, b) {
        return Math.hypot(b.x - a.x, b.y - a.y);
      }
      function interpolate(a, b, t) {
        return {
          x: a.x + (b.x - a.x) * t,
          y: a.y + (b.y - a.y) * t,
          time: a.time + (b.time - a.time) * t
        };
      }

      /** Iterative Douglas–Peucker; keeps original timestamped endpoints. */
      function douglasPeucker(points, epsilon) {
        if (points.length <= 2 || epsilon <= 0) return points.slice();
        var keep = new Set([0, points.length - 1]);
        var stack = [[0, points.length - 1]];
        while (stack.length > 0) {
          var range = stack.pop();
          if (!range) break;
          var start = range[0],
            end = range[1];
          var max = epsilon;
          var index = -1;
          for (var i = start + 1; i < end; i++) {
            var d = pointSegmentDistance(points[i], points[start], points[end]);
            if (d > max) {
              max = d;
              index = i;
            }
          }
          if (index >= 0) {
            keep.add(index);
            stack.push([start, index], [index, end]);
          }
        }
        return points.filter(function (_point, index) {
          return keep.has(index);
        });
      }
      function trailLength(points) {
        var length = 0;
        for (var i = 1; i < points.length; i++) length += distance(points[i - 1], points[i]);
        return length;
      }

      /** Removes exactly `amount` units from the old end, interpolating cut time. */
      function trimOldest(points, amount) {
        if (amount <= 0) return points.slice();
        for (var i = 1; i < points.length; i++) {
          var length = distance(points[i - 1], points[i]);
          if (length > amount + EPS) return [interpolate(points[i - 1], points[i], amount / length)].concat(points.slice(i));
          amount -= length;
        }
        return points.length > 0 ? points.slice(-1) : [];
      }
      function polygonArea(points) {
        var twice = 0;
        for (var i = 0; i < points.length; i++) {
          var a = points[i];
          var b = points[(i + 1) % points.length];
          twice += a.x * b.y - b.x * a.y;
        }
        return Math.abs(twice) / 2;
      }

      // P0 未定义，自选默认值: centers on polygon boundaries count as inside.
      /** Ray casting, with an explicit boundary test. */
      function pointInPolygon(point, polygon) {
        if (polygon.length < 3) return false;
        var inside = false;
        for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
          var a = polygon[j];
          var b = polygon[i];
          if (pointSegmentDistance(point, a, b) <= EPS) return true;
          if (a.y > point.y !== b.y > point.y && point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
        }
        return inside;
      }
      /** First crossing along this step wins; otherwise the nearest eligible sample. */
      function findClosure(points, before, now, time, age, tolerance) {
        if (points.length < 2 || distance(before, now) <= EPS) return null;
        var cutoff = time - age;
        var best = null;
        for (var i = 1; i < points.length; i++) {
          var a = points[i - 1];
          var b = points[i];
          if (a.time > cutoff) break;
          var end = b.time > cutoff ? interpolate(a, b, (cutoff - a.time) / (b.time - a.time)) : b;
          var hit = segmentIntersection(before, now, a, end);
          if (hit && (!best || hit.t < best.t)) best = {
            point: hit.point,
            after: i,
            t: hit.t
          };
        }
        if (!best) {
          var nearest = tolerance;
          for (var _i = 0; _i < points.length; _i++) {
            var p = points[_i];
            if (p.time > cutoff) break;
            var d = distance(now, p);
            if (d < nearest) {
              nearest = d;
              best = {
                point: p,
                after: _i + 1,
                t: 1
              };
            }
          }
        }
        if (!best) return null;
        var polygon = [best.point].concat(points.slice(best.after), [before, now]);
        return {
          polygon: polygon,
          area: polygonArea(polygon)
        };
      }

      /** First contact along AB with a circle, including tangency and zero-length AB. */
      function circleContact(a, b, c, radius) {
        var dx = b.x - a.x;
        var dy = b.y - a.y;
        var x = a.x - c.x;
        var y = a.y - c.y;
        var constant = x * x + y * y - radius * radius;
        if (constant <= EPS) return 0;
        var sq = dx * dx + dy * dy;
        if (sq <= EPS) return null;
        var dot = x * dx + y * dy;
        var disc = dot * dot - sq * constant;
        if (disc < -EPS) return null;
        var t = (-dot - Math.sqrt(Math.max(0, disc))) / sq;
        return t >= -EPS && t <= 1 + EPS ? Math.max(0, Math.min(1, t)) : null;
      }

      /** Swept boar body = capsule CD. Returns first contact traveling along AB. */
      function capsuleContact(a, b, c, d, radius) {
        if (pointSegmentDistance(a, c, d) <= radius + EPS) return 0;
        var candidates = [];
        for (var _i2 = 0, _arr = [c, d]; _i2 < _arr.length; _i2++) {
          var center = _arr[_i2];
          var t = circleContact(a, b, center, radius);
          if (t !== null) candidates.push(t);
        }
        var len = distance(c, d);
        if (len > EPS) {
          var nx = -(d.y - c.y) / len * radius;
          var ny = (d.x - c.x) / len * radius;
          for (var _i3 = 0, _arr2 = [-1, 1]; _i3 < _arr2.length; _i3++) {
            var sign = _arr2[_i3];
            var hit = segmentIntersection(a, b, {
              x: c.x + sign * nx,
              y: c.y + sign * ny
            }, {
              x: d.x + sign * nx,
              y: d.y + sign * ny
            });
            if (hit) candidates.push(hit.t);
          }
        }
        return candidates.length > 0 ? Math.min.apply(Math, candidates) : null;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/Geom2.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports({
        circleIntersectsSegment: circleIntersectsSegment,
        pointSegmentDistance: pointSegmentDistance,
        segmentIntersection: segmentIntersection
      });
      cclegacy._RF.push({}, "95337lk+bZHwoY2hTAdxBfv", "Geom", undefined);
      var EPS = 1e-9;
      function clamp01(v) {
        if (v < 0) return 0;
        if (v > 1) return 1;
        return v;
      }

      /**
       * Intersection of segment AB with segment CD.
       * Touching at an endpoint counts. Collinear overlap returns the point where
       * the overlap starts when traveling from the lower projection bound.
       */
      function segmentIntersection(a, b, c, d) {
        var rx = b.x - a.x;
        var ry = b.y - a.y;
        var sx = d.x - c.x;
        var sy = d.y - c.y;
        var denom = rx * sy - ry * sx;
        var qpx = c.x - a.x;
        var qpy = c.y - a.y;
        if (Math.abs(denom) <= EPS) {
          var cross = qpx * ry - qpy * rx;
          if (Math.abs(cross) > EPS) return null;
          return collinearOverlap(a, b, c, d);
        }
        var t = (qpx * sy - qpy * sx) / denom;
        var u = (qpx * ry - qpy * rx) / denom;
        if (t < -EPS || t > 1 + EPS || u < -EPS || u > 1 + EPS) return null;
        var tc = clamp01(t);
        return {
          point: {
            x: a.x + tc * rx,
            y: a.y + tc * ry
          },
          t: tc,
          u: clamp01(u)
        };
      }
      function collinearOverlap(a, b, c, d) {
        var abx = b.x - a.x;
        var aby = b.y - a.y;
        var useX = Math.abs(abx) >= Math.abs(aby);
        var a0 = useX ? a.x : a.y;
        var b0 = useX ? b.x : b.y;
        var c0 = useX ? c.x : c.y;
        var d0 = useX ? d.x : d.y;
        var lo = Math.max(Math.min(a0, b0), Math.min(c0, d0));
        var hi = Math.min(Math.max(a0, b0), Math.max(c0, d0));
        if (lo > hi + EPS) return null;
        var ab = b0 - a0;
        var t = Math.abs(ab) <= EPS ? 0 : (lo - a0) / ab;
        var cd = d0 - c0;
        var u = Math.abs(cd) <= EPS ? 0 : (lo - c0) / cd;
        var tc = clamp01(t);
        return {
          point: {
            x: a.x + tc * (b.x - a.x),
            y: a.y + tc * (b.y - a.y)
          },
          t: tc,
          u: clamp01(u)
        };
      }

      /** Distance from point P to segment AB. */
      function pointSegmentDistance(p, a, b) {
        var abx = b.x - a.x;
        var aby = b.y - a.y;
        var lenSq = abx * abx + aby * aby;
        if (lenSq <= EPS) return Math.hypot(p.x - a.x, p.y - a.y);
        var t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / lenSq;
        if (t < 0) t = 0;else if (t > 1) t = 1;
        var dx = p.x - (a.x + t * abx);
        var dy = p.y - (a.y + t * aby);
        return Math.hypot(dx, dy);
      }

      /** True when the circle of radius r around c touches segment AB. */
      function circleIntersectsSegment(c, r, a, b) {
        if (r < 0) return false;
        return pointSegmentDistance(c, a, b) <= r;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/Gray.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './ForgeArt.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, cclegacy, Color, Node, UITransform, Label, BlockInputEvents, Graphics, resources, SpriteFrame, Sprite, FORGE_ART;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
      Color = module.Color;
      Node = module.Node;
      UITransform = module.UITransform;
      Label = module.Label;
      BlockInputEvents = module.BlockInputEvents;
      Graphics = module.Graphics;
      resources = module.resources;
      SpriteFrame = module.SpriteFrame;
      Sprite = module.Sprite;
    }, function (module) {
      FORGE_ART = module.FORGE_ART;
    }],
    execute: function () {
      exports({
        artBox: artBox,
        artButton: artButton,
        box: box,
        button: button,
        cover: cover,
        text: text
      });
      cclegacy._RF.push({}, "f4903Hkm1NNg6k7PMN4DW1p", "Gray", undefined);

      /**
       * Runtime widgets built without prefabs. Coordinates are design px with the
       * origin at the screen center, +y up. Art widgets load from resources and only
       * create their former gray-box paint when that load fails.
       */
      var INK = exports('INK', new Color(44, 30, 20));
      var BONE = exports('BONE', new Color(232, 224, 206));
      var MUTED = exports('MUTED', new Color(150, 138, 118));
      var HIGHLIGHT = exports('HIGHLIGHT', new Color(255, 238, 196));
      function paint(node, w, h, fill, stroke, name) {
        if (name === void 0) {
          name = 'Paint';
        }
        var layer = new Node(name);
        layer.layer = node.layer;
        node.addChild(layer);
        layer.addComponent(UITransform).setContentSize(w, h);
        var g = layer.addComponent(Graphics);
        g.rect(-w / 2, -h / 2, w, h);
        if (fill) {
          g.fillColor = fill;
          g.fill();
        }
        if (stroke) {
          g.lineWidth = 4;
          g.strokeColor = stroke;
          g.stroke();
        }
      }
      function box(parent, name, x, y, w, h, fill, stroke) {
        var node = new Node(name);
        node.layer = parent.layer;
        parent.addChild(node);
        node.setPosition(x, y, 0);
        node.addComponent(UITransform).setContentSize(w, h);
        if (fill || stroke) paint(node, w, h, fill, stroke);
        return node;
      }
      var loadedArt = new Map();
      var failedArt = new Map();
      var artWaiters = new Map();
      var desiredArt = new WeakMap();
      function loadForgeArt(key, listener) {
        var loaded = loadedArt.get(key);
        if (loaded) {
          listener(loaded);
          return;
        }
        if (failedArt.has(key)) {
          listener(null);
          return;
        }
        var waiting = artWaiters.get(key);
        if (waiting) {
          waiting.push(listener);
          return;
        }
        artWaiters.set(key, [listener]);
        var spec = FORGE_ART[key];
        resources.load(spec.path + "/spriteFrame", SpriteFrame, function (err, frame) {
          var _artWaiters$get;
          var listeners = (_artWaiters$get = artWaiters.get(key)) != null ? _artWaiters$get : [];
          artWaiters["delete"](key);
          if (err !== null || frame === undefined) {
            failedArt.set(key, true);
            for (var _iterator = _createForOfIteratorHelperLoose(listeners), _step; !(_step = _iterator()).done;) {
              var callback = _step.value;
              callback(null);
            }
            return;
          }
          frame.insetTop = spec.insetTop;
          frame.insetBottom = spec.insetBottom;
          frame.insetLeft = spec.insetLeft;
          frame.insetRight = spec.insetRight;
          loadedArt.set(key, frame);
          for (var _iterator2 = _createForOfIteratorHelperLoose(listeners), _step2; !(_step2 = _iterator2()).done;) {
            var _callback = _step2.value;
            _callback(frame);
          }
        });
      }
      function clearFallback(node) {
        var fallback = node.getChildByName('ArtFallback');
        if (fallback === null) return;
        fallback.removeFromParent();
        fallback.destroy();
      }
      function showArt(node, key, w, h, fill, stroke) {
        desiredArt.set(node, key);
        loadForgeArt(key, function (frame) {
          var _node$getComponent;
          if (node.isValid === false || desiredArt.get(node) !== key) return;
          if (frame === null) {
            var current = node.getComponent(Sprite);
            if (current) current.enabled = false;
            if (node.getChildByName('ArtFallback') === null) paint(node, w, h, fill, stroke, 'ArtFallback');
            return;
          }
          clearFallback(node);
          var sprite = node.getComponent(Sprite);
          if (sprite === null) sprite = node.addComponent(Sprite);
          sprite.enabled = true;
          sprite.spriteFrame = frame;
          sprite.type = Sprite.Type.SLICED;
          sprite.sizeMode = Sprite.SizeMode.CUSTOM;
          (_node$getComponent = node.getComponent(UITransform)) == null || _node$getComponent.setContentSize(w, h);
        });
      }
      function artBox(parent, name, x, y, w, h, artKey, fallbackFill, fallbackStroke) {
        var node = box(parent, name, x, y, w, h);
        showArt(node, artKey, w, h, fallbackFill, fallbackStroke);
        return node;
      }
      function text(parent, str, x, y, w, h, size, color, align) {
        if (color === void 0) {
          color = BONE;
        }
        if (align === void 0) {
          align = 'center';
        }
        var node = box(parent, 'Text', x, y, w, h);
        var label = node.addComponent(Label);
        label.fontSize = size;
        label.lineHeight = size + 6;
        label.color = color;
        label.overflow = Label.Overflow.SHRINK;
        label.enableWrapText = true;
        label.horizontalAlign = align === 'left' ? Label.HorizontalAlign.LEFT : Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.string = str;
        return label;
      }
      function artButton(parent, caption, x, y, w, h, normal, pressed, disabled, click, enabled, size, visualW, visualH, captionX, showCaption) {
        if (enabled === void 0) {
          enabled = true;
        }
        if (size === void 0) {
          size = 24;
        }
        if (visualW === void 0) {
          visualW = w;
        }
        if (visualH === void 0) {
          visualH = h;
        }
        if (captionX === void 0) {
          captionX = 0;
        }
        if (showCaption === void 0) {
          showCaption = true;
        }
        var node = box(parent, caption, x, y, w, h);
        var fallbackFill = enabled ? new Color(88, 62, 40) : new Color(70, 64, 58);
        var fallbackStroke = enabled ? HIGHLIGHT : MUTED;
        var visual = artBox(node, 'Art', 0, 0, visualW, visualH, enabled ? normal : disabled, fallbackFill, fallbackStroke);
        loadForgeArt(normal, function () {});
        loadForgeArt(pressed, function () {});
        loadForgeArt(disabled, function () {});
        node.addComponent(BlockInputEvents);
        if (showCaption) text(node, caption, captionX, 0, w - 12, h - 8, size, enabled ? BONE : MUTED);
        if (enabled) {
          node.on(Node.EventType.TOUCH_START, function () {
            return showArt(visual, pressed, visualW, visualH, fallbackFill, fallbackStroke);
          });
          node.on(Node.EventType.TOUCH_CANCEL, function () {
            return showArt(visual, normal, visualW, visualH, fallbackFill, fallbackStroke);
          });
          node.on(Node.EventType.TOUCH_END, function () {
            showArt(visual, normal, visualW, visualH, fallbackFill, fallbackStroke);
            click();
          });
        }
        return node;
      }
      function button(parent, caption, x, y, w, h, click, enabled, size) {
        if (enabled === void 0) {
          enabled = true;
        }
        if (size === void 0) {
          size = 24;
        }
        var node = box(parent, caption, x, y, w, h, enabled ? new Color(88, 62, 40) : new Color(70, 64, 58), enabled ? HIGHLIGHT : MUTED);
        node.addComponent(BlockInputEvents);
        text(node, caption, 0, 0, w - 12, h - 8, size, enabled ? BONE : MUTED);
        if (enabled) node.on(Node.EventType.TOUCH_END, click);
        return node;
      }

      /** Full-screen input blocker with a fill (UI batch5 dim / page background). */
      function cover(parent, name, w, h, fill) {
        var node = box(parent, name, 0, 0, w, h, fill);
        node.addComponent(BlockInputEvents);
        return node;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/HammerArt.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports('swordSpritePath', swordSpritePath);
      cclegacy._RF.push({}, "d3636nkO+ZPH6YA6qrlvQs+", "HammerArt", undefined);
      /**
       * Official forge room sprites under `assets/resources/forge/` (#113 / #114).
       * Paths are `resources.load` keys (no extension). Prefer these over gray boxes
       * when the bundle is present; HammerView falls back to solid color blocks.
       *
       * Layout constants follow UI design (720×1280, center origin): hilt at screen
       * x=36 → −324, strike / anvil focus at screen x=300 → −60.
       */
      var HAMMER_SPRITES = exports('HAMMER_SPRITES', {
        anvil: {
          path: 'forge/anvil',
          width: 420,
          height: 220
        },
        hammer: {
          path: 'forge/hammer',
          width: 160,
          height: 160
        },
        sword: {
          path: 'forge/sword_01',
          width: 72,
          height: 360
        },
        swordWhite: {
          path: 'forge/sword_base_white',
          width: 72,
          height: 360
        },
        crack: {
          path: 'forge/sword_crack',
          width: 120,
          height: 120
        },
        chip: {
          path: 'forge/sword_chip',
          width: 64,
          height: 64
        },
        sparkGreat: {
          path: 'forge/spark_great',
          width: 96,
          height: 96
        },
        sparkSuccess: {
          path: 'forge/spark_success',
          width: 96,
          height: 96
        },
        sparkKeep: {
          path: 'forge/spark_keep',
          width: 96,
          height: 96
        },
        sparkDamage: {
          path: 'forge/spark_damage',
          width: 96,
          height: 96
        },
        sparkBreak: {
          path: 'forge/spark_break',
          width: 96,
          height: 96
        }
      });

      /** resources path for a SwordLook.spriteId (`sword_01` … `sword_11`). */
      function swordSpritePath(spriteId) {
        return "forge/" + spriteId;
      }
      var HAMMER_LAYOUT = exports('HAMMER_LAYOUT', {
        /** Design px, center origin (720×1280). */
        hiltX: -324,
        strikeX: -60,
        anvilY: -200,
        swordY: -80,
        hammerRestY: 160,
        /** Scaffold-only label strip. */
        titleY: 520,
        debugPanelX: 0,
        debugPanelY: 365
      });
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/HammerFeel.ts", ['cc', './ForgeContract.ts', './ForgeHotspot.ts', './ForgeState.ts'], function (exports) {
  var cclegacy, FORGE_CONTRACT_DEFAULTS, swordLook, hotspotQuality, placeOnAnvil, anvilSword, strikeAnvilAtQuality, createForgeState;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      FORGE_CONTRACT_DEFAULTS = module.FORGE_CONTRACT_DEFAULTS;
      swordLook = module.swordLook;
    }, function (module) {
      hotspotQuality = module.hotspotQuality;
    }, function (module) {
      placeOnAnvil = module.placeOnAnvil;
      anvilSword = module.anvilSword;
      strikeAnvilAtQuality = module.strikeAnvilAtQuality;
      createForgeState = module.createForgeState;
    }],
    execute: function () {
      exports({
        bladePresentation: bladePresentation,
        bladeWear: bladeWear,
        clamp01: clamp01,
        hammerParam: hammerParam,
        reboundProgress: reboundProgress,
        sparkLaunch: sparkLaunch,
        sparkSpec: sparkSpec,
        sparkY: sparkY,
        strikeFeel: strikeFeel
      });
      cclegacy._RF.push({}, "71f78Aisu5BZrCoJaOSrzyo", "HammerFeel", undefined);
      function number(key, value, min, max, step) {
        if (step === void 0) {
          step = 1;
        }
        return {
          key: "forge.hammer." + key,
          group: '落锤手感',
          label: key,
          kind: 'number',
          "default": value,
          min: min,
          max: max,
          step: step
        };
      }

      /** Forge-owned feel tuning. Durations use real ms, even during local slow motion. */
      var HAMMER_PARAMS = exports('HAMMER_PARAMS', [number('fallMs', 33, 16, 33), number('reHitLockMs', 120, 120, 200), number('strikeMs', 400, 350, 500), number('chainMs', 350, 350, 500), number('specialMs', 480, 350, 480), number('reboundMs', 100, 60, 150), number('slowMs', 200, 100, 300), number('slowScale', 0.4, 0.2, 0.8, 0.05), number('sparkMs', 280, 200, 300), number('sparkCount', 24, 12, 32), number('sparkSpeed', 720, 600, 1100), number('gravity', 1800, 1000, 2200), number('greatStopMs', 133, 0, 150), number('successStopMs', 67, 0, 100), number('keepStopMs', 50, 0, 100), number('damageStopMs', 83, 0, 120), number('breakStopMs', 200, 0, 220), number('greatShakePx', 8, 0, 16), number('successShakePx', 4, 0, 16), number('keepShakePx', 2, 0, 16), number('damageShakePx', 5, 0, 16), number('breakShakePx', 14, 0, 18), {
        key: 'forge.hammer.lowEnd',
        group: '落锤手感',
        label: '低端模式（遮罩/减半火花）',
        kind: 'bool',
        "default": 0
      }]);
      var HAMMER_DEFAULTS = exports('HAMMER_DEFAULTS', {
        get: function get(key) {
          for (var _i = 0, _HAMMER_PARAMS = HAMMER_PARAMS; _i < _HAMMER_PARAMS.length; _i++) {
            var def = _HAMMER_PARAMS[_i];
            if (def.key === key) return def["default"];
          }
          return FORGE_CONTRACT_DEFAULTS.get(key);
        }
      });
      function hammerParam(params, key) {
        return params.get("forge.hammer." + key);
      }
      function clamp01(n) {
        return Math.max(0, Math.min(1, n));
      }
      function bladeWear(previous, level, outcome) {
        return {
          peakLevel: Math.max(previous.peakLevel, level),
          chipped: outcome === 'damage' || previous.chipped && outcome === 'keep'
        };
      }

      /** The historical look survives damage. No decorative glow competes with the beat on the anvil. */
      function bladePresentation(level, peakLevel, params) {
        if (params === void 0) {
          params = HAMMER_DEFAULTS;
        }
        var look = swordLook(Math.max(level, peakLevel), params);
        return {
          spriteId: look.spriteId,
          length: look.anvilLengthPx,
          centerX: -324 + look.anvilLengthPx / 2,
          anvilGlow: 0,
          revealGlow: swordLook(level, params).glow
        };
      }
      var SPARKS = {
        great: {
          art: 'sparkGreat',
          shape: 'ring',
          color: [234, 168, 52],
          amount: 2
        },
        success: {
          art: 'sparkSuccess',
          shape: 'rays',
          color: [255, 248, 218],
          amount: 1
        },
        keep: {
          art: 'sparkKeep',
          shape: 'fall',
          color: [153, 127, 96],
          amount: 0.25
        },
        damage: {
          art: 'sparkDamage',
          shape: 'side',
          color: [168, 42, 36],
          amount: 0.5
        },
        "break": {
          art: 'sparkBreak',
          shape: 'shards',
          color: [96, 69, 60],
          amount: 0
        }
      };
      function sparkSpec(outcome, lowEnd, params) {
        if (params === void 0) {
          params = HAMMER_DEFAULTS;
        }
        var spec = SPARKS[outcome];
        return {
          art: spec.art,
          shape: spec.shape,
          color: spec.color,
          count: Math.min(64, Math.round(hammerParam(params, 'sparkCount') * spec.amount * (lowEnd ? 0.5 : 1)))
        };
      }

      /** Deterministic decorative motion never consumes the draw RNG. */
      function sparkLaunch(shape, index, baseSpeed) {
        var speed = baseSpeed * (0.65 + index % 5 * 0.09);
        var angle = shape === 'side' ? Math.PI * (1.05 + index % 5 * 0.06) : shape === 'fall' ? Math.PI * (1.15 + index % 5 * 0.17) : shape === 'rays' ? Math.PI * (0.15 + index % 11 * 0.07) : index * 2.39996;
        return {
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          angle: angle
        };
      }
      function sparkY(vy, seconds, gravity) {
        return vy * seconds - 0.5 * gravity * seconds * seconds;
      }
      function strikeFeel(outcome, tierUp, held, params) {
        if (params === void 0) {
          params = HAMMER_DEFAULTS;
        }
        var slow = outcome === 'great' || outcome === 'break' || tierUp;
        return {
          durationMs: Math.max(350, Math.min(500, hammerParam(params, slow ? 'specialMs' : held ? 'chainMs' : 'strikeMs'))),
          stopMs: hammerParam(params, outcome + "StopMs"),
          shakePx: hammerParam(params, outcome + "ShakePx"),
          slow: slow
        };
      }

      /** Local animation time: hit-stop freezes poses; VFX and hotspot still use real time. */
      function reboundProgress(ageMs, feel, params) {
        if (params === void 0) {
          params = HAMMER_DEFAULTS;
        }
        var moving = Math.max(0, ageMs - feel.stopMs);
        var slowMs = feel.slow ? hammerParam(params, 'slowMs') : 0;
        var scale = feel.slow ? hammerParam(params, 'slowScale') : 1;
        return clamp01((Math.min(moving, slowMs) * scale + Math.max(0, moving - slowMs)) / hammerParam(params, 'reboundMs'));
      }
      /** One in flight, one buffered, no catch-up bursts after a stalled frame. Never draws on press. */
      var HammerFeel = exports('HammerFeel', /*#__PURE__*/function () {
        function HammerFeel(swords, rng, params) {
          if (params === void 0) {
            params = HAMMER_DEFAULTS;
          }
          this.state = void 0;
          this.strike = null;
          this.held = false;
          this.queued = null;
          this.rng = void 0;
          this.params = void 0;
          this.rng = rng;
          this.params = params;
          this.state = createForgeState(swords);
        }
        var _proto = HammerFeel.prototype;
        _proto.select = function select(id, nowMs) {
          if (this.strike !== null) return false;
          var placed = placeOnAnvil(this.state, id, nowMs);
          if (!placed.ok) return false;
          this.state = placed.state;
          this.queued = null;
          this.held = false;
          return true;
        };
        _proto.press = function press(nowMs) {
          var sword = anvilSword(this.state);
          if (sword === null) return false;
          this.held = true;
          var press = {
            timeMs: nowMs,
            quality: hotspotQuality(nowMs, this.state.phaseStartMs, sword.level, this.params)
          };
          if (this.strike === null) this.start(press, nowMs);else if (this.queued === null) this.queued = press;
          return true;
        };
        _proto.release = function release() {
          this.held = false;
        };
        _proto.cancel = function cancel() {
          this.held = false;
          this.queued = null;
          this.strike = null;
        };
        _proto.advance = function advance(nowMs) {
          var current = this.strike;
          if (current === null) return null;
          if (current.impactMs === null) {
            if (nowMs - current.startedMs < hammerParam(this.params, 'fallMs')) return null;
            var result = strikeAnvilAtQuality(this.state, current.press.timeMs, current.press.quality, this.rng, this.params);
            if (!result.ok) {
              this.cancel();
              return null;
            }
            this.state = result.state;
            current.result = result;
            current.impactMs = nowMs;
            var tierUp = result.after !== null && swordLook(result.after.level, this.params).minLevel > swordLook(result.before.level, this.params).minLevel;
            current.feel = strikeFeel(result.outcome, tierUp, this.held, this.params);
            return result;
          }
          var duration = current.feel === null ? 500 : current.feel.durationMs;
          // The whole effect gets its allotted time even if the impact frame arrived late.
          var lock = Math.max(hammerParam(this.params, 'reHitLockMs'), duration - hammerParam(this.params, 'fallMs'));
          if (nowMs - current.impactMs < lock) return null;
          this.strike = null;
          if (anvilSword(this.state) === null) {
            this.held = false;
            this.queued = null;
            return null;
          }
          var queued = this.queued;
          this.queued = null;
          if (queued !== null) this.start(queued, nowMs);else if (this.held) this.press(nowMs);
          return null;
        };
        _proto.start = function start(press, nowMs) {
          this.strike = {
            press: press,
            startedMs: nowMs,
            impactMs: null,
            result: null,
            feel: null
          };
        };
        return HammerFeel;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/HammerSoundPool.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _createForOfIteratorHelperLoose, cclegacy, Node, AudioSource, resources, AudioClip;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
      Node = module.Node;
      AudioSource = module.AudioSource;
      resources = module.resources;
      AudioClip = module.AudioClip;
    }],
    execute: function () {
      cclegacy._RF.push({}, "fcc09I0ZkNEwLr72TL/9bav", "HammerSoundPool", undefined);
      var CLIPS = ['tick', 'body', 'bass', 'great', 'success', 'keep', 'damage', 'break'];
      /** Two pre-created voices per layer. Missing/late clips are skipped, never loaded on impact. */
      var HammerSoundPool = exports('HammerSoundPool', /*#__PURE__*/function () {
        function HammerSoundPool(parent) {
          var _this = this;
          this.pairs = new Map();
          this.disposed = false;
          var _loop = function _loop() {
            var key = _step.value;
            var voices = [];
            for (var i = 0; i < 2; i++) {
              var node = new Node("HammerAudio-" + key + "-" + i);
              parent.addChild(node);
              var voice = node.addComponent(AudioSource);
              voice.playOnAwake = false;
              voices.push(voice);
            }
            var pair = {
              voices: voices,
              cursor: 0,
              ready: false
            };
            _this.pairs.set(key, pair);
            resources.load("forge/audio/" + key, AudioClip, function (err, clip) {
              if (_this.disposed || err || clip === undefined) return;
              for (var _iterator2 = _createForOfIteratorHelperLoose(pair.voices), _step2; !(_step2 = _iterator2()).done;) {
                var _voice = _step2.value;
                _voice.clip = clip;
              }
              pair.ready = true;
            });
          };
          for (var _iterator = _createForOfIteratorHelperLoose(CLIPS), _step; !(_step = _iterator()).done;) {
            _loop();
          }
        }
        var _proto = HammerSoundPool.prototype;
        _proto.impact = function impact(outcome) {
          this.play('tick', 0.25);
          this.play('body', 0.5);
          this.play('bass', 0.35);
          this.play(outcome, 0.5);
        };
        _proto.stop = function stop() {
          for (var _iterator3 = _createForOfIteratorHelperLoose(this.pairs.values()), _step3; !(_step3 = _iterator3()).done;) {
            var pair = _step3.value;
            for (var _iterator4 = _createForOfIteratorHelperLoose(pair.voices), _step4; !(_step4 = _iterator4()).done;) {
              var voice = _step4.value;
              voice.stop();
            }
          }
        };
        _proto.dispose = function dispose() {
          this.disposed = true;
          this.stop();
        };
        _proto.play = function play(key, volume) {
          var pair = this.pairs.get(key);
          if (this.disposed || pair === undefined || !pair.ready) return;
          var voice = pair.voices[pair.cursor];
          pair.cursor = (pair.cursor + 1) % pair.voices.length;
          voice.stop();
          voice.volume = volume;
          voice.play();
        };
        return HammerSoundPool;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/HammerView.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './ForgeContract.ts', './Rng.ts', './ForgeState.ts', './ForgeHotspot.ts', './HammerFeel.ts', './HammerSoundPool.ts', './ForgeDebugOdds.ts', './HammerArt.ts', './Gray.ts'], function (exports) {
  var _inheritsLoose, _createForOfIteratorHelperLoose, _createClass, cclegacy, Color, _decorator, input, Input, director, Director, KeyCode, Sprite, UITransform, Graphics, UIOpacity, resources, SpriteFrame, Component, view, Node, forgeOdds, swordLook, createBaseSword, createForgeRng, anvilSword, hotspotBrightness, hotspotQuality, HammerFeel, bladeWear, sparkSpec, sparkLaunch, hammerParam, bladePresentation, clamp01, reboundProgress, sparkY, HammerSoundPool, isDebugQuery, debugOddsSnapshot, formatDebugOddsLines, HAMMER_SPRITES, swordSpritePath, HAMMER_LAYOUT, box, cover, text, MUTED, HIGHLIGHT, BONE, button;
  return {
    setters: [function (module) {
      _inheritsLoose = module.inheritsLoose;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
      Color = module.Color;
      _decorator = module._decorator;
      input = module.input;
      Input = module.Input;
      director = module.director;
      Director = module.Director;
      KeyCode = module.KeyCode;
      Sprite = module.Sprite;
      UITransform = module.UITransform;
      Graphics = module.Graphics;
      UIOpacity = module.UIOpacity;
      resources = module.resources;
      SpriteFrame = module.SpriteFrame;
      Component = module.Component;
      view = module.view;
      Node = module.Node;
    }, function (module) {
      forgeOdds = module.forgeOdds;
      swordLook = module.swordLook;
      createBaseSword = module.createBaseSword;
    }, function (module) {
      createForgeRng = module.createForgeRng;
    }, function (module) {
      anvilSword = module.anvilSword;
    }, function (module) {
      hotspotBrightness = module.hotspotBrightness;
      hotspotQuality = module.hotspotQuality;
    }, function (module) {
      HammerFeel = module.HammerFeel;
      bladeWear = module.bladeWear;
      sparkSpec = module.sparkSpec;
      sparkLaunch = module.sparkLaunch;
      hammerParam = module.hammerParam;
      bladePresentation = module.bladePresentation;
      clamp01 = module.clamp01;
      reboundProgress = module.reboundProgress;
      sparkY = module.sparkY;
    }, function (module) {
      HammerSoundPool = module.HammerSoundPool;
    }, function (module) {
      isDebugQuery = module.isDebugQuery;
      debugOddsSnapshot = module.debugOddsSnapshot;
      formatDebugOddsLines = module.formatDebugOddsLines;
    }, function (module) {
      HAMMER_SPRITES = module.HAMMER_SPRITES;
      swordSpritePath = module.swordSpritePath;
      HAMMER_LAYOUT = module.HAMMER_LAYOUT;
    }, function (module) {
      box = module.box;
      cover = module.cover;
      text = module.text;
      MUTED = module.MUTED;
      HIGHLIGHT = module.HIGHLIGHT;
      BONE = module.BONE;
      button = module.button;
    }],
    execute: function () {
      exports('mountHammerView', mountHammerView);
      cclegacy._RF.push({}, "198abD0kdVHqrzEp5H3ls1y", "HammerView", undefined);

      /** PR3 hammer feel on the existing code-only shell. H / debug:command hammer opens it.
       * LotsView/run integration stays separate; all swords and wear here last only for this session.
       * Real-clock scheduling/draws live in HammerFeel, independent of Cocos render dt/time scaling.
       */

      var BG = new Color(36, 28, 24, 245);
      var ANVIL_FALLBACK = new Color(90, 90, 100);
      var SWORD_FALLBACK = new Color(200, 210, 220);
      var HAMMER_FALLBACK = new Color(160, 90, 50);
      var TITLE_COLOR = new Color(255, 238, 196);
      var loadedSprites = new Map();
      var failedSprites = new Map();
      var spriteWaiters = new Map();
      var desiredSpritePaths = new WeakMap();
      function loadPath(path, listener) {
        var hit = loadedSprites.get(path);
        if (hit) {
          listener(hit);
          return;
        }
        if (failedSprites.has(path)) {
          listener(null);
          return;
        }
        var waiting = spriteWaiters.get(path);
        if (waiting) {
          waiting.push(listener);
          return;
        }
        spriteWaiters.set(path, [listener]);
        resources.load(path + "/spriteFrame", SpriteFrame, function (err, frame) {
          var _spriteWaiters$get;
          var listeners = (_spriteWaiters$get = spriteWaiters.get(path)) != null ? _spriteWaiters$get : [];
          spriteWaiters["delete"](path);
          if (err || frame === undefined) {
            failedSprites.set(path, true);
            for (var i = 0; i < listeners.length; i++) listeners[i](null);
            return;
          }
          loadedSprites.set(path, frame);
          for (var _i = 0; _i < listeners.length; _i++) listeners[_i](frame);
        });
      }
      function paintBlock(node, w, h, fill, name) {
        var layer = new Node(name);
        layer.layer = node.layer;
        node.addChild(layer);
        layer.addComponent(UITransform).setContentSize(w, h);
        var g = layer.addComponent(Graphics);
        g.rect(-w / 2, -h / 2, w, h);
        g.fillColor = fill;
        g.fill();
        g.lineWidth = 3;
        g.strokeColor = HIGHLIGHT;
        g.stroke();
      }
      function spriteOrBlock(parent, name, x, y, key, fallback) {
        var spec = HAMMER_SPRITES[key];
        var node = box(parent, name, x, y, spec.width, spec.height);
        // Color block first so the shell is visible before an async load returns.
        paintBlock(node, spec.width, spec.height, fallback, 'BlockFallback');
        desiredSpritePaths.set(node, spec.path);
        loadPath(spec.path, function (frame) {
          if (node.isValid === false || desiredSpritePaths.get(node) !== spec.path) return;
          if (frame === null) {
            if (node.getChildByName('BlockFallback') === null) {
              paintBlock(node, spec.width, spec.height, fallback, 'BlockFallback');
            }
            return;
          }
          var fallbackNode = node.getChildByName('BlockFallback');
          if (fallbackNode !== null) {
            fallbackNode.removeFromParent();
            fallbackNode.destroy();
          }
          var sprite = node.getComponent(Sprite);
          if (sprite === null) sprite = node.addComponent(Sprite);
          sprite.enabled = true;
          sprite.spriteFrame = frame;
          sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        });
        return node;
      }

      /** Drives `HammerView` from the engine without a scene or prefab component. */
      var ForgeHammerLifecycle = exports('ForgeHammerLifecycle', /*#__PURE__*/function (_Component) {
        _inheritsLoose(ForgeHammerLifecycle, _Component);
        function ForgeHammerLifecycle() {
          var _this;
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          _this = _Component.call.apply(_Component, [this].concat(args)) || this;
          _this.owner = null;
          return _this;
        }
        var _proto = ForgeHammerLifecycle.prototype;
        _proto.update = function update(_dt) {
          var _this$owner;
          (_this$owner = this.owner) == null || _this$owner.tick();
        };
        _proto.onDestroy = function onDestroy() {
          var _this$owner2;
          (_this$owner2 = this.owner) == null || _this$owner2.dispose();
          this.owner = null;
        };
        return ForgeHammerLifecycle;
      }(Component));
      _decorator.ccclass('ForgeHammerLifecycle')(ForgeHammerLifecycle);
      function mountHammerView(ctx, module) {
        var parent = ctx.layers.get('hud');
        if (typeof parent.addChild !== 'function') return;
        var hammerView = new HammerView(ctx, module, parent);
        hammerView.root.addComponent(ForgeHammerLifecycle).owner = hammerView;
      }
      function realClockMs() {
        return typeof performance === 'object' && typeof performance.now === 'function' ? performance.now() : Date.now();
      }
      var RESULT_TEXT = {
        great: '+2  大成功',
        success: '+1',
        keep: '—  维持',
        damage: '−1  崩口',
        "break": '破坏'
      };
      var HammerView = exports('HammerView', /*#__PURE__*/function () {
        function HammerView(ctx, module, parent, clock) {
          var _this$swordArt$getCom,
            _this$hammer$getCompo,
            _this2 = this;
          if (clock === void 0) {
            clock = realClockMs;
          }
          this.root = void 0;
          this.ctx = void 0;
          this.clock = void 0;
          this.module = void 0;
          this.unsubs = [];
          this.stage = void 0;
          this.anvil = void 0;
          this.sword = void 0;
          this.swordArt = void 0;
          this.hammer = void 0;
          this.crack = void 0;
          this.chip = void 0;
          this.highLight = void 0;
          this.highLightOpacity = void 0;
          this.flash = void 0;
          this.flashAlpha = -1;
          this.ring = void 0;
          this.ringOpacity = void 0;
          this.resultLabel = void 0;
          this.resultOpacity = void 0;
          this.swordLabel = void 0;
          this.debugRoot = void 0;
          this.debugLabel = void 0;
          this.lowEndLabel = void 0;
          this.rackLabels = [];
          this.sparks = [];
          this.sound = void 0;
          this.wear = new Map();
          this.feel = void 0;
          this.opened = false;
          this.pausedByHammer = false;
          this.touchId = null;
          this.swordPath = '';
          this.effectStartMs = -10000;
          this.effectSpec = null;
          this.lastClockMs = 0;
          this.previousDebug = '';
          this.lastTickMs = 0;
          this.maxFrameMs = 0;
          this.pressPaintMs = 0;
          this.pendingPaintMs = null;
          this.maxInputDrawMs = 0;
          this.clock = clock;
          this.ctx = ctx;
          this.module = module;
          this.feel = this.newVisit();
          var size = view.getVisibleSize();
          this.root = box(parent, 'ForgeHammerShell', 0, 0, size.width, size.height);
          this.root.active = false;
          cover(this.root, 'Dim', size.width, size.height, BG);
          this.stage = box(this.root, 'Stage', 0, 0, 720, 1280);
          var scale = Math.min(size.width / 720, size.height / 1280);
          this.stage.setScale(scale, scale, 1);
          text(this.stage, '铁匠铺 · PR3', 0, HAMMER_LAYOUT.titleY, 640, 36, 26, TITLE_COLOR);
          text(this.stage, '按下即落锤 · 按住连敲 · H 关闭', 0, HAMMER_LAYOUT.titleY - 38, 640, 28, 18, MUTED);
          this.anvil = spriteOrBlock(this.stage, 'Anvil', HAMMER_LAYOUT.strikeX, HAMMER_LAYOUT.anvilY, 'anvil', ANVIL_FALLBACK);
          this.sword = box(this.stage, 'Blade', -144, HAMMER_LAYOUT.swordY, 360, 72);
          this.swordArt = spriteOrBlock(this.sword, 'Sword', 0, 0, 'sword', SWORD_FALLBACK);
          this.swordArt.angle = -90; // Official swords are tip-up. Hilt stays left, tip grows right.
          (_this$swordArt$getCom = this.swordArt.getComponent(UITransform)) == null || _this$swordArt$getCom.setContentSize(72, 360);
          this.crack = spriteOrBlock(this.stage, 'RiskCrack', HAMMER_LAYOUT.strikeX, HAMMER_LAYOUT.swordY, 'crack', new Color(130, 35, 24));
          this.crack.setScale(0.5, 0.5, 1);
          this.crack.addComponent(UIOpacity);
          this.chip = spriteOrBlock(this.stage, 'BladeChip', HAMMER_LAYOUT.strikeX + 60, HAMMER_LAYOUT.swordY + 20, 'chip', new Color(35, 24, 20));
          this.chip.setScale(0.45, 0.45, 1);
          this.highLight = box(this.stage, 'HotspotHighlight', HAMMER_LAYOUT.strikeX, HAMMER_LAYOUT.swordY, 8, 46, new Color(255, 245, 214));
          this.highLightOpacity = this.highLight.addComponent(UIOpacity);
          this.hammer = spriteOrBlock(this.stage, 'Hammer', HAMMER_LAYOUT.strikeX + 40, HAMMER_LAYOUT.hammerRestY, 'hammer', HAMMER_FALLBACK);
          (_this$hammer$getCompo = this.hammer.getComponent(UITransform)) == null || _this$hammer$getCompo.setContentSize(160, 160);

          // Prewarm bounded sprite/flash pools. No instantiate/destroy or resource load at impact.
          for (var _i2 = 0, _arr = ['sparkGreat', 'sparkSuccess', 'sparkKeep', 'sparkDamage', 'sparkBreak']; _i2 < _arr.length; _i2++) {
            var key = _arr[_i2];
            loadPath(HAMMER_SPRITES[key].path, function () {});
          }
          for (var row = 1; row <= 11; row++) loadPath(swordSpritePath(row < 10 ? "sword_0" + row : "sword_" + row), function () {});
          for (var i = 0; i < 64; i++) {
            var node = spriteOrBlock(this.stage, "Spark-" + i, 0, 0, 'sparkKeep', HIGHLIGHT);
            node.active = false;
            this.sparks.push({
              node: node,
              opacity: node.addComponent(UIOpacity),
              vx: 0,
              vy: 0,
              delay: 0,
              life: 280
            });
          }
          this.ring = box(this.stage, 'ImpactRing', HAMMER_LAYOUT.strikeX, HAMMER_LAYOUT.swordY, 100, 100);
          var circle = this.ring.addComponent(Graphics);
          circle.strokeColor = new Color(234, 168, 52);
          circle.lineWidth = 5;
          circle.circle(0, 0, 40);
          circle.stroke();
          this.ringOpacity = this.ring.addComponent(UIOpacity);
          this.ringOpacity.opacity = 0;
          // Low-end uses this translucent overlay, never a fullscreen postprocess/render texture.
          var flash = box(this.stage, 'ImpactOverlay', 0, 0, 720, 1280);
          this.flash = flash.addComponent(Graphics);
          this.paintFlash(0);
          this.resultLabel = text(this.stage, '', HAMMER_LAYOUT.strikeX, HAMMER_LAYOUT.swordY + 160, 600, 72, 38, HIGHLIGHT);
          this.resultOpacity = this.resultLabel.node.addComponent(UIOpacity);
          this.swordLabel = text(this.stage, '', 0, -340, 650, 30, 20, BONE);
          var pad = box(this.stage, 'StrikePad', 0, 0, 720, 960);
          pad.on(Node.EventType.TOUCH_START, this.onPress, this);
          pad.on(Node.EventType.TOUCH_END, this.onRelease, this);
          pad.on(Node.EventType.TOUCH_CANCEL, this.onCancel, this);
          var _loop = function _loop() {
            var id = _i3;
            var node = button(_this2.stage, '', -264 + _i3 * 132, -430, 120, 70, function () {
              return _this2.selectSword(id);
            }, true, 18);
            _this2.rackLabels.push(text(node, '', 0, 0, 116, 60, 17, BONE));
          };
          for (var _i3 = 0; _i3 < 5; _i3++) {
            _loop();
          }
          button(this.stage, '重置试打', -200, -550, 180, 62, function () {
            return _this2.resetVisit();
          }, true, 20);
          var low = button(this.stage, '', 0, -550, 180, 62, function () {
            ctx.tunables.set('forge.hammer.lowEnd', _this2.lowEnd ? 0 : 1);
            _this2.lowEndLabel.string = _this2.lowEnd ? '低端模式 开' : '低端模式 关';
          });
          this.lowEndLabel = text(low, this.lowEnd ? '低端模式 开' : '低端模式 关', 0, 0, 176, 54, 18, BONE);
          button(this.stage, '关闭原型', 200, -550, 180, 62, function () {
            return _this2.module.toggleHammerSandbox();
          }, true, 20);
          text(this.stage, '试打剑仅在本局有效 · 白剑为保底，不可上砧', 0, -610, 660, 28, 16, MUTED);
          this.debugRoot = box(this.stage, 'DebugOdds', HAMMER_LAYOUT.debugPanelX, HAMMER_LAYOUT.debugPanelY, 680, 190);
          this.debugRoot.active = false;
          box(this.debugRoot, 'Panel', 0, 0, 680, 190, new Color(20, 16, 12, 230), HIGHLIGHT);
          this.debugLabel = text(this.debugRoot, '', 0, 0, 660, 182, 15, BONE, 'left');
          this.sound = new HammerSoundPool(this.root);
          this.unsubs.push(module.onHammerOpenChange(function (open) {
            return _this2.setOpen(open);
          }));
          this.unsubs.push(ctx.events.on('debug:command', function (p) {
            if (p.cmd === 'hammer') _this2.module.toggleHammerSandbox();
          }));
          this.unsubs.push(ctx.events.on('session:start', function () {
            return _this2.resetVisit();
          }));
          this.unsubs.push(ctx.events.on('session:end', function () {
            _this2.feel.cancel();
            _this2.sound.stop();
          }));
          this.unsubs.push(ctx.events.on('run:start', function () {
            return _this2.resetVisit();
          }));
          input.on(Input.EventType.KEY_DOWN, this.onKey, this);
          director.on(Director.EVENT_AFTER_DRAW, this.onAfterDraw, this);
          this.refreshRack();
          this.refreshDebug(this.now());
        }
        var _proto2 = HammerView.prototype;
        _proto2.dispose = function dispose() {
          this.feel.cancel();
          this.sound.dispose();
          if (this.pausedByHammer) this.ctx.loop.resume();
          this.pausedByHammer = false;
          for (var i = 0; i < this.unsubs.length; i++) this.unsubs[i]();
          this.unsubs.length = 0;
          input.off(Input.EventType.KEY_DOWN, this.onKey, this);
          director.off(Director.EVENT_AFTER_DRAW, this.onAfterDraw, this);
        };
        _proto2.tick = function tick() {
          if (!this.opened) return;
          var now = this.now();
          if (this.lastTickMs > 0) this.maxFrameMs = Math.max(this.maxFrameMs, now - this.lastTickMs);
          this.lastTickMs = now;
          var result = this.feel.advance(now);
          if (result !== null) this.onImpact(result, now);
          this.paint(now);
          this.refreshDebug(now);
        };
        _proto2.now = function now() {
          var clock = this.clock();
          this.lastClockMs = Math.max(this.lastClockMs, clock);
          return this.lastClockMs;
        };
        _proto2.onKey = function onKey(e) {
          if (e.keyCode === KeyCode.KEY_H) this.module.toggleHammerSandbox();
        };
        _proto2.onPress = function onPress(e) {
          if (!this.opened || this.touchId !== null) return;
          var now = this.now();
          this.touchId = e === undefined ? 0 : e.getID();
          var previous = this.feel.strike;
          if (this.feel.press(now)) {
            if (previous === null) this.pendingPaintMs = now;
            // Set a visibly falling pose in the handler: no tween, timer, release, or RNG wait.
            this.paint(now);
            this.pressPaintMs = this.now() - now; // handler->scene mutation; not panel/compositor latency
          }
        };

        _proto2.onAfterDraw = function onAfterDraw() {
          if (this.pendingPaintMs === null || !this.opened) return;
          this.maxInputDrawMs = Math.max(this.maxInputDrawMs, this.now() - this.pendingPaintMs);
          this.pendingPaintMs = null;
        };
        _proto2.onRelease = function onRelease(e) {
          if (e !== undefined && this.touchId !== e.getID()) return;
          this.touchId = null;
          this.feel.release();
        };
        _proto2.onCancel = function onCancel() {
          this.pendingPaintMs = null;
          this.touchId = null;
          this.feel.cancel();
          this.sound.stop();
          this.clearEffects();
        };
        _proto2.setOpen = function setOpen(open) {
          if (open === this.opened) return;
          this.opened = open;
          this.root.active = open;
          this.lastTickMs = 0;
          if (!open) {
            this.onCancel();
            if (this.pausedByHammer) this.ctx.loop.resume();
            this.pausedByHammer = false;
            return;
          }
          this.root.setSiblingIndex(this.root.parent === null ? 0 : this.root.parent.children.length - 1);
          if (!this.ctx.loop.paused) {
            this.ctx.loop.pause();
            this.pausedByHammer = true;
          }
          this.paint(this.now());
          this.refreshDebug(this.now());
        };
        _proto2.newVisit = function newVisit() {
          var swords = [createBaseSword(0)];
          for (var i = 0; i < 4; i++) swords.push({
            id: i + 1,
            kind: 'sword',
            level: [0, 6, 12, 20][i],
            reserve: false
          });
          var feel = new HammerFeel(swords, createForgeRng(this.ctx.session.seed, 108), this.ctx.tunables);
          feel.select(1, this.now());
          return feel;
        };
        _proto2.resetVisit = function resetVisit() {
          this.feel.cancel();
          this.wear.clear();
          this.feel = this.newVisit();
          this.touchId = null;
          this.sound.stop();
          this.clearEffects();
          this.refreshRack();
          this.paint(this.now());
          this.refreshDebug(this.now());
        };
        _proto2.selectSword = function selectSword(id) {
          if (this.feel.select(id, this.now())) {
            this.clearEffects();
            this.paint(this.now());
            this.refreshRack();
            this.refreshDebug(this.now());
          }
        };
        _proto2.clearEffects = function clearEffects() {
          for (var _iterator = _createForOfIteratorHelperLoose(this.sparks), _step; !(_step = _iterator()).done;) {
            var spark = _step.value;
            spark.node.active = false;
          }
          this.effectStartMs = -10000;
          this.paintFlash(0);
          this.ringOpacity.opacity = 0;
          this.resultOpacity.opacity = 0;
          this.stage.setPosition(0, 0, 0);
        };
        _proto2.refreshRack = function refreshRack() {
          for (var id = 0; id < this.rackLabels.length; id++) {
            var sword = null;
            for (var _iterator2 = _createForOfIteratorHelperLoose(this.feel.state.swords), _step2; !(_step2 = _iterator2()).done;) {
              var candidate = _step2.value;
              if (candidate.id === id) sword = candidate;
            }
            this.rackLabels[id].string = sword === null ? '已破坏' : sword.reserve ? '白剑 +0\n保底' : (this.feel.state.anvilId === id ? '▸ ' : '') + "\u5251 " + id + "\n+" + sword.level;
          }
        };
        _proto2.onImpact = function onImpact(result, now) {
          var _this$wear$get;
          var previous = (_this$wear$get = this.wear.get(result.before.id)) != null ? _this$wear$get : {
            peakLevel: result.before.level,
            chipped: false
          };
          if (result.after !== null) this.wear.set(result.before.id, bladeWear(previous, result.after.level, result.outcome));else this.wear["delete"](result.before.id);
          this.sound.impact(result.outcome);
          this.effectStartMs = now;
          var spec = sparkSpec(result.outcome, this.lowEnd, this.ctx.tunables);
          this.effectSpec = spec;
          this.resultLabel.string = RESULT_TEXT[result.outcome];
          this.resultLabel.color = new Color(spec.color[0], spec.color[1], spec.color[2]);
          var count = result.outcome === 'break' ? this.lowEnd ? 4 : 6 : spec.count;
          var frame = loadedSprites.get(HAMMER_SPRITES[spec.art].path);
          for (var i = 0; i < this.sparks.length; i++) {
            var _spark$node$getCompon, _spark$node$getChildB;
            var spark = this.sparks[i];
            spark.node.active = i < count;
            if (i >= count) continue;
            var sprite = spark.node.getComponent(Sprite);
            if (sprite !== null && frame !== undefined) {
              sprite.spriteFrame = frame;
              sprite.color = this.resultLabel.color;
            }
            var launch = sparkLaunch(spec.shape, i, hammerParam(this.ctx.tunables, 'sparkSpeed'));
            spark.vx = launch.vx;
            spark.vy = launch.vy;
            spark.delay = result.outcome === 'break' ? 200 : 0;
            spark.life = result.outcome === 'break' ? 220 : hammerParam(this.ctx.tunables, 'sparkMs');
            var width = spec.shape === 'rays' ? 6 : spec.shape === 'shards' ? 34 : 14;
            var height = spec.shape === 'rays' ? 36 : spec.shape === 'shards' ? 24 : 14;
            (_spark$node$getCompon = spark.node.getComponent(UITransform)) == null || _spark$node$getCompon.setContentSize(width, height);
            var fallback = (_spark$node$getChildB = spark.node.getChildByName('BlockFallback')) == null ? void 0 : _spark$node$getChildB.getComponent(Graphics);
            if (fallback !== null && fallback !== undefined) {
              fallback.clear();
              fallback.fillColor = this.resultLabel.color;
              fallback.rect(-width / 2, -height / 2, width, height);
              fallback.fill();
            }
            spark.node.angle = launch.angle * 180 / Math.PI - 90;
            spark.node.setScale(1, 1, 1);
            spark.opacity.opacity = 255;
          }
          this.refreshRack();
        };
        _proto2.paint = function paint(now) {
          var _strike$result$before,
            _strike$result,
            _this3 = this;
          var params = this.ctx.tunables;
          var strike = this.feel.strike;
          var liveSword = anvilSword(this.feel.state);
          var displayed = liveSword != null ? liveSword : (_strike$result$before = strike == null || (_strike$result = strike.result) == null ? void 0 : _strike$result.before) != null ? _strike$result$before : null;
          var effectAge = now - this.effectStartMs;
          this.sword.active = displayed !== null && (liveSword !== null || effectAge < 200);
          if (displayed !== null) {
            var _this$wear$get2, _this$swordArt$getCom2;
            var wear = (_this$wear$get2 = this.wear.get(displayed.id)) != null ? _this$wear$get2 : {
              peakLevel: displayed.level,
              chipped: false
            };
            var blade = bladePresentation(displayed.level, wear.peakLevel, params);
            var path = swordSpritePath(blade.spriteId);
            if (path !== this.swordPath) {
              this.swordPath = path;
              desiredSpritePaths.set(this.swordArt, path);
              loadPath(path, function (frame) {
                if (!_this3.swordArt.isValid || _this3.swordPath !== path || frame === null) return;
                var sprite = _this3.swordArt.getComponent(Sprite);
                if (sprite === null) sprite = _this3.swordArt.addComponent(Sprite);
                sprite.spriteFrame = frame;
                sprite.sizeMode = Sprite.SizeMode.CUSTOM;
                var fallback = _this3.swordArt.getChildByName('BlockFallback');
                if (fallback !== null) {
                  fallback.removeFromParent();
                  fallback.destroy();
                }
              });
            }
            this.sword.setPosition(blade.centerX, HAMMER_LAYOUT.swordY, 0);
            (_this$swordArt$getCom2 = this.swordArt.getComponent(UITransform)) == null || _this$swordArt$getCom2.setContentSize(72, blade.length);
            var bright = hotspotBrightness(now, this.feel.state.phaseStartMs, displayed.level, params);
            var sprite = this.swordArt.getComponent(Sprite);
            if (sprite !== null) sprite.color = new Color(255, 140 + Math.round(bright * 115), 100 + Math.round(bright * 155));
            var risk = forgeOdds(displayed.level, params)["break"] / 100;
            this.crack.active = this.sword.active && risk > 0;
            var crackOpacity = this.crack.getComponent(UIOpacity);
            if (crackOpacity !== null) crackOpacity.opacity = Math.round((60 + risk * 195) * (1 - bright * 0.65));
            var crackScale = 0.35 + risk * 0.55;
            this.crack.setScale(crackScale, crackScale, 1);
            this.chip.active = this.sword.active && wear.chipped;
            this.highLight.active = this.sword.active;
            this.highLight.setPosition(HAMMER_LAYOUT.strikeX + (bright > 0.9 ? (bright - 0.9) * 800 : 0), HAMMER_LAYOUT.swordY, 0);
            this.highLightOpacity.opacity = Math.round(bright > 0.9 ? 230 : bright * 35);
            this.swordLabel.string = liveSword === null ? '剑已破坏 · 点下一把剑继续' : "\u5251 " + displayed.id + "  +" + displayed.level + " \xB7 \u6309\u4F4F\u8FDE\u7EED\u953B\u6253";
          } else {
            this.crack.active = false;
            this.chip.active = false;
            this.highLight.active = false;
            this.swordLabel.string = '铁砧空了 · 选择试打剑，或重置试打';
          }
          var hammerY = HAMMER_LAYOUT.hammerRestY;
          var squash = 0;
          var fallPose = 0;
          if (strike !== null && strike.impactMs === null) {
            // First painted press frame is already below the rest position.
            var fall = Math.max(0.12, clamp01((now - strike.startedMs) / hammerParam(params, 'fallMs')));
            fallPose = fall;
            hammerY -= 296 * fall;
            this.hammer.angle = -35 * fall;
            this.hammer.setScale(1, 1.25);
            this.highLightOpacity.opacity = 240;
          } else if (strike !== null && strike.impactMs !== null && strike.feel !== null) {
            var age = now - strike.impactMs;
            var rebound = reboundProgress(age, strike.feel, params);
            fallPose = 1 - rebound;
            hammerY -= 296 * (1 - rebound);
            this.hammer.angle = -35 * (1 - rebound);
            this.hammer.setScale(1 + 0.15 * (1 - rebound), 0.8 + 0.2 * rebound);
            squash = Math.max(0, 1 - age / 100);
            var decay = Math.max(0, 1 - age / 250);
            var shake = strike.feel.shakePx * decay;
            this.stage.setPosition(Math.sin(age * 0.13) * shake, Math.cos(age * 0.19) * shake * 0.7, 0);
          } else {
            this.hammer.angle = 0;
            this.hammer.setScale(1, 1);
            this.stage.setPosition(0, 0, 0);
          }
          this.hammer.setPosition(HAMMER_LAYOUT.strikeX + 40 - 30 * fallPose, hammerY, 0);
          this.anvil.setScale(1 + 0.06 * squash, 1 - 0.08 * squash);
          this.sword.setScale(1, 1 - 0.05 * squash);
          this.paintEffects(effectAge, now);
        };
        _proto2.paintEffects = function paintEffects(age, now) {
          var _strike$result2, _this$effectSpec;
          var params = this.ctx.tunables;
          var strike = this.feel.strike;
          var result = (_strike$result2 = strike == null ? void 0 : strike.result) != null ? _strike$result2 : null;
          var remaining = (strike == null ? void 0 : strike.feel) === null || (strike == null ? void 0 : strike.feel) === undefined ? 0 : strike.feel.durationMs - hammerParam(params, 'fallMs');
          var active = result !== null && age >= 0 && age < remaining;
          this.resultOpacity.opacity = active ? Math.round(255 * Math.min(1, (remaining - age) / 100)) : 0;
          var pop = active ? 1 + 0.4 * Math.max(0, 1 - age / 150) : 1;
          this.resultLabel.node.setScale(pop, pop);
          this.resultLabel.node.setPosition(HAMMER_LAYOUT.strikeX, HAMMER_LAYOUT.swordY + 160 + ((result == null ? void 0 : result.outcome) === 'damage' ? -age * 0.08 : Math.min(25, age * 0.1)), 0);
          this.paintFlash(active ? Math.round(((result == null ? void 0 : result.outcome) === 'break' ? 75 : this.lowEnd ? 24 : 48) * Math.max(0, 1 - age / ((result == null ? void 0 : result.outcome) === 'break' ? remaining : 34))) : 0);
          var ring = active && !this.lowEnd && (((_this$effectSpec = this.effectSpec) == null ? void 0 : _this$effectSpec.shape) === 'ring' || result !== null && result.quality === 1);
          this.ringOpacity.opacity = ring ? Math.round(210 * Math.max(0, 1 - age / 250)) : 0;
          var glow = (result == null ? void 0 : result.after) === null || (result == null ? void 0 : result.after) === undefined ? 1 : swordLook(result.after.level, params).glow;
          var ringScale = (0.5 + Math.min(250, age) / 90) * Math.max(1, glow);
          this.ring.setScale(ringScale, ringScale, 1);
          for (var _iterator3 = _createForOfIteratorHelperLoose(this.sparks), _step3; !(_step3 = _iterator3()).done;) {
            var spark = _step3.value;
            if (!spark.node.active) continue;
            var elapsed = now - this.effectStartMs - spark.delay;
            if (!active || elapsed >= spark.life) {
              spark.node.active = false;
              continue;
            }
            spark.opacity.opacity = elapsed < 0 ? 0 : Math.round(255 * (1 - elapsed / spark.life));
            var t = Math.max(0, elapsed) / 1000;
            spark.node.setPosition(HAMMER_LAYOUT.strikeX + spark.vx * t, HAMMER_LAYOUT.swordY + sparkY(spark.vy, t, hammerParam(params, 'gravity')), 0);
          }
        };
        _proto2.paintFlash = function paintFlash(alpha) {
          // Put alpha in Graphics vertices directly: opacity propagation can lag a frame on activation.
          var next = Math.max(0, Math.min(80, alpha));
          if (next === this.flashAlpha) return;
          this.flashAlpha = next;
          this.flash.clear();
          if (next === 0) return;
          this.flash.fillColor = new Color(200, 190, 174, next);
          this.flash.rect(-360, -640, 720, 1280);
          this.flash.fill();
        };
        _proto2.refreshDebug = function refreshDebug(now) {
          var _sword$level, _this$feel$strike;
          var show = isDebugQuery();
          this.debugRoot.active = this.opened && show;
          if (!show) return;
          var sword = anvilSword(this.feel.state);
          var q = sword === null ? 0 : hotspotQuality(now, this.feel.state.phaseStartMs, sword.level, this.ctx.tunables);
          var snap = debugOddsSnapshot((_sword$level = sword == null ? void 0 : sword.level) != null ? _sword$level : 0, q, sword === null, this.ctx.tunables);
          var lines = formatDebugOddsLines(snap);
          var pressQ = (_this$feel$strike = this.feel.strike) == null ? void 0 : _this$feel$strike.press.quality;
          lines[1] += " \xB7 press q=" + (pressQ === undefined ? '—' : Math.round(pressQ * 100) / 100) + " \xB7 handler " + this.pressPaintMs.toFixed(1) + "ms \xB7 draw " + this.maxInputDrawMs.toFixed(1) + "ms \xB7 \u0394f " + this.maxFrameMs.toFixed(1) + "ms";
          var next = lines.join('\n');
          if (next !== this.previousDebug) {
            this.debugLabel.string = next;
            this.previousDebug = next;
          }
        };
        _createClass(HammerView, [{
          key: "lowEnd",
          get: function get() {
            return this.ctx.tunables.getBool('forge.hammer.lowEnd');
          }
        }]);
        return HammerView;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/HelpText.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './ForgeParams.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, cclegacy, TIER_NAMES, TUTORIAL_I_GREAT_EXTRA, TUTORIAL_I_SUCCESS, FORGE_RESULTS, tierKey, TUTORIAL_II;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      TIER_NAMES = module.TIER_NAMES;
      TUTORIAL_I_GREAT_EXTRA = module.TUTORIAL_I_GREAT_EXTRA;
      TUTORIAL_I_SUCCESS = module.TUTORIAL_I_SUCCESS;
      FORGE_RESULTS = module.FORGE_RESULTS;
      tierKey = module.tierKey;
      TUTORIAL_II = module.TUTORIAL_II;
    }],
    execute: function () {
      exports({
        lotsHelpText: lotsHelpText,
        paginate: paginate,
        percent: percent,
        tubeTitle: tubeTitle
      });
      cclegacy._RF.push({}, "e3e80XBiiJNopJY2CfSNUcA", "HelpText", undefined);
      var RESULT_NAMES = exports('RESULT_NAMES', {
        greatSuccess: '大成功',
        success: '成功',
        hold: '维持',
        damage: '损伤',
        shatter: '碎裂'
      });

      /**
       * Main sword name by where it came from: the run's 学徒剑 (GDD §9.2); after 提拔 a former
       * link sword, so just 主剑 (GDD §9.6 ①); after 断剑 the "+0 断剑" (GDD §9.6 ②, UI S12).
       */
      var SWORD_NAMES = exports('SWORD_NAMES', {
        apprentice: '学徒剑',
        promoted: '主剑',
        broken: '断剑'
      });
      function tubeTitle(tube) {
        var _TIER_NAMES$tube$tier;
        if (tube.kind === 'tutorialI') return '教学签筒 I';
        if (tube.kind === 'tutorialII') return '教学签筒 II';
        return "\u7B7E\u7B52 \xB7 " + ((_TIER_NAMES$tube$tier = TIER_NAMES[tube.tier]) != null ? _TIER_NAMES$tube$tier : '') + " \u6863";
      }
      function percent(p) {
        return (Math.round(p * 1000) / 10).toFixed(1) + "%";
      }

      /**
       * Split help text into pages at blank lines, estimating wrapped lines from
       * `charsPerLine`. A section longer than a page is split at line breaks.
       */
      function paginate(source, charsPerLine, linesPerPage) {
        var cost = function cost(line) {
          return Math.max(1, Math.ceil(line.length / Math.max(1, charsPerLine)));
        };
        var sections = [[]];
        for (var _iterator = _createForOfIteratorHelperLoose(source.split('\n')), _step; !(_step = _iterator()).done;) {
          var _line2 = _step.value;
          if (_line2 === '') sections.push([]);else sections[sections.length - 1].push(_line2);
        }
        var pages = [];
        var page = [];
        var used = 0;
        var flush = function flush() {
          if (page.length > 0) pages.push(page);
          page = [];
          used = 0;
        };
        for (var _i = 0, _sections = sections; _i < _sections.length; _i++) {
          var section = _sections[_i];
          if (section.length === 0) continue;
          var size = 0;
          for (var _iterator2 = _createForOfIteratorHelperLoose(section), _step2; !(_step2 = _iterator2()).done;) {
            var line = _step2.value;
            size += cost(line);
          }
          var gap = page.length > 0 ? 1 : 0;
          if (used + gap + size > linesPerPage) flush();
          if (page.length > 0) {
            page.push('');
            used += 1;
          }
          for (var _iterator3 = _createForOfIteratorHelperLoose(section), _step3; !(_step3 = _iterator3()).done;) {
            var _line = _step3.value;
            if (used + cost(_line) > linesPerPage && page.length > 0) flush();
            page.push(_line);
            used += cost(_line);
          }
        }
        flush();
        return pages.length > 0 ? pages.map(function (p) {
          return p.join('\n');
        }) : [''];
      }
      function row(counts) {
        return FORGE_RESULTS.map(function (r) {
          return String(counts(r));
        }).join(' / ');
      }
      var SECTION_NUMBERS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

      /**
       * S11 签筒规则帮助页, P1 text (docs/design/P1-tasks.md P1-04: 只写 P1 实际生效的内容,
       * 不照抄 GDD §9.7; docs/design/UI-requirements.md §3 S11, §6.1). Plain text, built from the
       * live tunables so the page always matches the tubes actually used. No 材料 / 熔链 /
       * 入神 / 锻造里程碑改良 (not in P1). Product owns the final wording.
       */
      function lotsHelpText(input) {
        var p = function p(key) {
          return Math.round(input.param(key) * 100) / 100;
        };
        var pity = Math.max(1, Math.round(input.param('forge.pityStreak')));
        var wChance = Math.round(input.param('forge.affixWChance') * 100);
        var section = 0;
        var numeral = function numeral() {
          var _SECTION_NUMBERS$sect;
          return (_SECTION_NUMBERS$sect = SECTION_NUMBERS[section]) != null ? _SECTION_NUMBERS$sect : String(section + 1);
        };
        var heading = function heading(title) {
          var line = numeral() + "\u3001" + title;
          section++;
          return line;
        };
        var lines = ['签筒规则', '', heading('签筒'), '· 每把主剑有自己的签筒，一筒 20 支签，全部公开摆在签表上；每支签都写着结果和这一锤抽到它的机会。', '· 每落一锤抽出一支，抽出的签不放回；每种结果还剩几支一直显示。', '· 抽空后按同一档位重新装满；主剑等级跨档时，签筒按新档位重建。', '', heading('五种结果'), "\xB7 \u5927\u6210\u529F\uFF1A+2\uFF1B\u518D\u52A0\u4E00\u6761\u5C0F\u8BCD\u6761\uFF1A\u5251\u91CD +" + p('forge.affixW') + "\uFF08" + wChance + "%\uFF09\u6216\u5251\u957F +" + p('forge.affixLg') + "\uFF08" + (100 - wChance) + "%\uFF09\uFF1B\u5E76\u6E85\u51FA " + p('forge.splashCount') + " \u628A +" + p('forge.splashGrade') + " \u94FE\u5251\uFF0C\u76F4\u63A5\u52A0\u5165\u5251\u94FE\u3002", '· 成功：+1。', '· 维持：等级不变。', '· 损伤：−1（最低 +0）。', '· 碎裂：主剑碎掉，二选一：提拔（从剑链选一把链剑当新主剑，保留它的等级，按学徒剑属性，剑链少一节），或断剑（拿回一把同剑胚的 +0 断剑，保留原剑 1 条随机词条）。本机会记下"你曾锻到 +N"。', "\xB7 \u6BCF\u9524\u4EF7\u683C = " + p('forge.hammerBase') + " + " + p('forge.hammerPerLevel') + " \xD7 \u4E3B\u5251\u7B49\u7EA7\u3002", '', heading('档位表（大成功 / 成功 / 维持 / 损伤 / 碎裂）')];
        var _loop = function _loop(tier) {
          lines.push("\xB7 " + TIER_NAMES[tier] + "\uFF1A" + row(function (r) {
            return Math.max(0, Math.round(input.param(tierKey(tier, r))));
          }));
        };
        for (var tier = 0; tier < TIER_NAMES.length; tier++) {
          _loop(tier);
        }
        lines.push('', heading('签筒的组成只由这两样决定'), '· 剑的等级（所在档位）。', "\xB7 \u4FDD\u5E95\uFF1A\u540C\u4E00\u628A\u5251\u8FDE\u7EED " + pity + " \u6B21\u635F\u4F24\u540E\uFF0C\u4E0B\u4E00\u9524\u81F3\u5C11\u662F\u7EF4\u6301\uFF08\u62BD\u5230\u635F\u4F24\u6216\u788E\u88C2\u65F6\u653E\u56DE\u91CD\u62BD\uFF09\uFF1B\u5982\u679C\u7B52\u91CC\u5DF2\u7ECF\u6CA1\u6709\u5408\u683C\u7684\u7B7E\uFF0C\u8FD9\u4E00\u9524\u76F4\u63A5\u5224\u7EF4\u6301\uFF0C\u4E0D\u6D88\u8017\u7B7E\u3002", '');
        var unaffected = heading('永远不受以下因素影响');
        var exceptionsNumeral = numeral();
        lines.push(unaffected, '· 是否看过广告', input.tutorial ? "\xB7 \u662F\u5426\u65B0\u73A9\u5BB6\uFF08\u53EA\u6709\u65B0\u624B\u5C40\u7684\u4E09\u6761\u4F8B\u5916\uFF0C\u89C1\u7B2C" + exceptionsNumeral + "\u6761\uFF09" : '· 是否新玩家', '· 在线时长', '· 付费意愿', '· 设备', '· 历史流失情况', '');
        if (input.tutorial) {
          lines.push(heading('新手局三条例外（只在新手局生效，签筒界面上都有标注）'), "\u2460 \u7B2C 1 \u9524\u7528\"\u6559\u5B66\u7B7E\u7B52 I\"\uFF1A\u6700\u4E0A\u9762\u4EAE\u51FA\u7684\"\u6559\u5B66\u7B7E\"\u5FC5\u51FA\u5927\u6210\u529F\uFF0C\u9644\u5E26\u5251\u957F +" + p('forge.affixLg') + "\uFF08\u7B52\u5185\u53E6\u6709\u5927\u6210\u529F " + TUTORIAL_I_GREAT_EXTRA + " / \u6210\u529F " + TUTORIAL_I_SUCCESS + "\uFF09\u3002", "\u2461 \u7B2C 2 \u9524\u7528\"\u6559\u5B66\u7B7E\u7B52 II\"\uFF1A" + row(function (r) {
            return TUTORIAL_II[r];
          }) + "\uFF0C\u5176\u4E2D 1 \u652F\u635F\u4F24\u7B7E\u9AD8\u4EAE\u3002", '③ 新手局其余各锤：碎裂签换成维持签。', '第 2 局起一律用正常档位签筒。', '');
        }
        lines.push(heading('随机数'), '抽签使用独立的随机数流，种子只由本局种子和"本局第几把主剑"决定，与广告模块没有任何数据连接。', '', heading("\u5F53\u524D\u7B7E\u7B52\uFF1A" + tubeTitle(input.tube)));
        var left = 0;
        for (var _iterator4 = _createForOfIteratorHelperLoose(FORGE_RESULTS), _step4; !(_step4 = _iterator4()).done;) {
          var _r = _step4.value;
          left += input.tube.remaining[_r];
        }
        lines.push("\u7B52\u5185\u5269 " + left + " \u652F\uFF1A" + FORGE_RESULTS.map(function (r) {
          return RESULT_NAMES[r] + " " + input.tube.remaining[r] + " \u652F\uFF08\u4E0B\u4E00\u9524 " + percent(input.odds[r]) + "\uFF09";
        }).join('，'));
        if (input.tube.pinnedNext) lines.push('教学签还在最上面：下一锤必出它。');
        if (input.tube.shatterSwapped) lines.push('新手局：碎裂签已换成维持签。');
        if (input.judgedHoldNext) lines.push('保底生效：筒里没有合格的签，下一锤直接判维持，不消耗签。');else if (input.pityActive) lines.push('保底生效：下一锤只会抽到大成功、成功或维持。');
        return lines.join('\n');
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/Hud.ts", ['cc', './TuningParams.ts'], function (exports) {
  var cclegacy, P0_RULES;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      P0_RULES = module.P0_RULES;
    }],
    execute: function () {
      exports('readHud', readHud);
      cclegacy._RF.push({}, "974e9N4QfpI+rvKUl1isclj", "Hud", undefined);

      /** Null means the owning gameplay module has not provided its service yet. */
      function readHud(ctx) {
        var _director$elapsed, _director$danger, _director$alive, _player$hp, _player$maxHp, _player$state, _player$maxSpeed, _rig$vTip, _rig$fullCharge, _rig$ink, _rig$jianzhenRemainin, _rig$N, _rig$slots, _rig$ropeLength, _rig$mode, _rig$jianyi, _rig$combo, _rig$enemyTimeScale;
        var rig = ctx.services.has('swordRig') ? ctx.services.get('swordRig') : null;
        var director = ctx.services.has('director') ? ctx.services.get('director') : null;
        var player = ctx.services.has('player') ? ctx.services.get('player') : null;
        return {
          seed: ctx.session.seed,
          paramsHash: ctx.tunables.hash().slice(0, P0_RULES.hashLength),
          elapsed: (_director$elapsed = director == null ? void 0 : director.elapsed) != null ? _director$elapsed : ctx.loop.simTime,
          danger: (_director$danger = director == null ? void 0 : director.danger) != null ? _director$danger : null,
          alive: (_director$alive = director == null ? void 0 : director.alive) != null ? _director$alive : null,
          hp: (_player$hp = player == null ? void 0 : player.hp) != null ? _player$hp : null,
          maxHp: (_player$maxHp = player == null ? void 0 : player.maxHp) != null ? _player$maxHp : null,
          state: (_player$state = player == null ? void 0 : player.state) != null ? _player$state : null,
          speed: player ? Math.hypot(player.vel.x, player.vel.y) : null,
          maxSpeed: (_player$maxSpeed = player == null ? void 0 : player.maxSpeed) != null ? _player$maxSpeed : null,
          vTip: (_rig$vTip = rig == null ? void 0 : rig.vTip) != null ? _rig$vTip : null,
          fullCharge: (_rig$fullCharge = rig == null ? void 0 : rig.fullCharge) != null ? _rig$fullCharge : null,
          vDead: ctx.tunables.has('drag.vDead') ? ctx.tunables.get('drag.vDead') : null,
          vRef: ctx.tunables.has('drag.vRef') ? ctx.tunables.get('drag.vRef') : null,
          fullChargeSpeed: ctx.tunables.has('sword.fullChargeMul') && ctx.tunables.has('drag.vRef') ? ctx.tunables.get('sword.fullChargeMul') * ctx.tunables.get('drag.vRef') : null,
          ink: (_rig$ink = rig == null ? void 0 : rig.ink) != null ? _rig$ink : null,
          arrayRemaining: (_rig$jianzhenRemainin = rig == null ? void 0 : rig.jianzhenRemaining) != null ? _rig$jianzhenRemainin : null,
          N: (_rig$N = rig == null ? void 0 : rig.N) != null ? _rig$N : null,
          slots: (_rig$slots = rig == null ? void 0 : rig.slots) != null ? _rig$slots : null,
          ropeLength: (_rig$ropeLength = rig == null ? void 0 : rig.ropeLength) != null ? _rig$ropeLength : null,
          mode: (_rig$mode = rig == null ? void 0 : rig.mode) != null ? _rig$mode : null,
          jianyi: (_rig$jianyi = rig == null ? void 0 : rig.jianyi) != null ? _rig$jianyi : null,
          combo: (_rig$combo = rig == null ? void 0 : rig.combo) != null ? _rig$combo : null,
          enemyTimeScale: (_rig$enemyTimeScale = rig == null ? void 0 : rig.enemyTimeScale) != null ? _rig$enemyTimeScale : null
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/HudArt.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports({
        hudDesignToLocal: hudDesignToLocal,
        hudFillRect: hudFillRect,
        hudFillWidth: hudFillWidth
      });
      cclegacy._RF.push({}, "2fae29fA0dNmbHFcoMTGIDI", "HudArt", undefined);
      /** Transcribed from docs/ui/hud/hud-slices.json and docs/ui/hud/README.md §2. */
      var HUD_DESIGN_WIDTH = exports('HUD_DESIGN_WIDTH', 720);
      function art(name, width, height, slice) {
        return {
          path: "ui/hud/" + name,
          width: width,
          height: height,
          slice: slice
        };
      }
      var SWORD_HUD_ART = exports('SWORD_HUD_ART', {
        hpBg: art('ui_hud_hpbg_normal', 64, 32, {
          top: 10,
          bottom: 10,
          left: 12,
          right: 12
        }),
        hpFill: art('ui_hud_hpfill_normal', 64, 32, {
          top: 10,
          bottom: 10,
          left: 12,
          right: 12
        }),
        hpFrame: art('ui_hud_hpframe_normal', 256, 64, {
          top: 20,
          bottom: 20,
          left: 72,
          right: 48
        }),
        jianyiPlate: art('ui_hud_timerplate_normal', 128, 32, {
          top: 10,
          bottom: 10,
          left: 24,
          right: 24
        })
      });
      var SWORD_HUD_LAYOUT = exports('SWORD_HUD_LAYOUT', {
        hpBg: {
          x: 68,
          y: 21,
          width: 202,
          height: 26
        },
        hpFill: {
          x: 68,
          y: 21,
          width: 202,
          height: 26
        },
        hpFrame: {
          x: 8,
          y: 2,
          width: 276,
          height: 64
        },
        hpText: {
          x: 68,
          y: 21,
          width: 202,
          height: 26
        },
        hpFillMin: 24,
        jianyiPlate: {
          x: 440,
          y: 68,
          width: 260,
          height: 32
        },
        jianyiText: {
          x: 440,
          y: 68,
          width: 260,
          height: 32
        }
      });

      /** Design 720×1280 top-left +y down → Cocos center-origin +y up, pinned to the HUD strip. */
      function hudDesignToLocal(rect, visibleW, visibleH, hud) {
        var scale = hud.width > 0 ? hud.width / HUD_DESIGN_WIDTH : 1;
        return {
          x: hud.x - visibleW / 2 + (rect.x + rect.width / 2) * scale,
          y: hud.y + hud.height - visibleH / 2 - (rect.y + rect.height / 2) * scale
        };
      }
      function hudFillWidth(fullWidth, ratio, minWidth) {
        var clamped = ratio < 0 ? 0 : ratio > 1 ? 1 : ratio;
        if (clamped <= 0) return 0;
        var width = fullWidth * clamped;
        return width < minWidth ? minWidth : width;
      }
      function hudFillRect(base, width) {
        return {
          x: base.x,
          y: base.y,
          width: width,
          height: base.height
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/HudArt2.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports({
        hudDesignToLocal: hudDesignToLocal,
        hudFillRect: hudFillRect,
        hudFillWidth: hudFillWidth
      });
      cclegacy._RF.push({}, "a094aBA3QVP8ZfUVgNGe+fO", "HudArt", undefined);
      /** Transcribed from docs/ui/hud/hud-slices.json and docs/ui/hud/README.md §2. */
      var HUD_DESIGN_WIDTH = exports('HUD_DESIGN_WIDTH', 720);
      function art(name, width, height, slice) {
        return {
          path: "ui/hud/" + name,
          width: width,
          height: height,
          slice: slice
        };
      }
      var LOOT_HUD_ART = exports('LOOT_HUD_ART', {
        xpFrame: art('ui_hud_xpframe_normal', 256, 32, {
          top: 10,
          bottom: 10,
          left: 44,
          right: 16
        }),
        xpFill: art('ui_hud_xpfill_normal', 64, 16, {
          top: 5,
          bottom: 5,
          left: 6,
          right: 6
        }),
        coin: art('ui_hud_coin_normal', 32, 32, null)
      });
      var LOOT_HUD_LAYOUT = exports('LOOT_HUD_LAYOUT', {
        xpFrame: {
          x: 8,
          y: 66,
          width: 276,
          height: 32
        },
        xpFill: {
          x: 45,
          y: 78,
          width: 228,
          height: 10
        },
        xpLevel: {
          x: 8,
          y: 66,
          width: 40,
          height: 32
        },
        xpText: {
          x: 45,
          y: 66,
          width: 228,
          height: 32
        },
        coin: {
          x: 440,
          y: 20,
          width: 32,
          height: 32
        },
        coinText: {
          x: 478,
          y: 20,
          width: 180,
          height: 32
        },
        xpFillMin: 12
      });

      /** Design 720×1280 top-left +y down → Cocos center-origin +y up, pinned to the HUD strip. */
      function hudDesignToLocal(rect, visibleW, visibleH, hud) {
        var scale = hud.width > 0 ? hud.width / HUD_DESIGN_WIDTH : 1;
        return {
          x: hud.x - visibleW / 2 + (rect.x + rect.width / 2) * scale,
          y: hud.y + hud.height - visibleH / 2 - (rect.y + rect.height / 2) * scale
        };
      }
      function hudFillWidth(fullWidth, ratio, minWidth) {
        var clamped = ratio < 0 ? 0 : ratio > 1 ? 1 : ratio;
        if (clamped <= 0) return 0;
        var width = fullWidth * clamped;
        return width < minWidth ? minWidth : width;
      }
      function hudFillRect(base, width) {
        return {
          x: base.x,
          y: base.y,
          width: width,
          height: base.height
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/HudArt3.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports({
        bossPipRect: bossPipRect,
        hudDesignToLocal: hudDesignToLocal,
        hudFillRect: hudFillRect,
        hudFillWidth: hudFillWidth
      });
      cclegacy._RF.push({}, "d6629K/ImFNoLmRqk6NEXNL", "HudArt", undefined);
      /** Transcribed from docs/ui/batch4/hud-slices-boss.json and docs/ui/batch4/README.md §A. */
      var HUD_DESIGN_WIDTH = exports('HUD_DESIGN_WIDTH', 720);
      function art(name, width, height, slice) {
        return {
          path: "ui/hud/" + name,
          width: width,
          height: height,
          slice: slice
        };
      }
      var BOSS_HUD_ART = exports('BOSS_HUD_ART', {
        bossBg: art('ui_hud_bossbg_normal', 64, 32, {
          top: 10,
          bottom: 10,
          left: 12,
          right: 12
        }),
        bossFill: art('ui_hud_bossfill_normal', 64, 32, {
          top: 10,
          bottom: 10,
          left: 12,
          right: 12
        }),
        bossBreath: art('ui_hud_bossbar_breath', 64, 32, {
          top: 10,
          bottom: 10,
          left: 12,
          right: 12
        }),
        bossFrame: art('ui_hud_bossframe_normal', 512, 64, {
          top: 0,
          bottom: 0,
          left: 84,
          right: 28
        }),
        skinFull: art('ui_hud_bossskin_full', 32, 32, null),
        skinCracking: art('ui_hud_bossskin_cracking', 32, 32, null),
        skinBroken: art('ui_hud_bossskin_broken', 32, 32, null)
      });
      var BOSS_HUD_LAYOUT = exports('BOSS_HUD_LAYOUT', {
        bossBg: {
          x: 174,
          y: 130,
          width: 426,
          height: 24
        },
        bossFill: {
          x: 174,
          y: 130,
          width: 426,
          height: 24
        },
        bossBreath: {
          x: 174,
          y: 130,
          width: 426,
          height: 24
        },
        bossFrame: {
          x: 104,
          y: 110,
          width: 512,
          height: 64
        },
        bossText: {
          x: 174,
          y: 122,
          width: 426,
          height: 24
        },
        pip: {
          x: 490,
          y: 94,
          width: 32,
          height: 32
        },
        pipSpacing: 30,
        fillMin: 24
      });

      /** Design 720×1280 top-left +y down → Cocos center-origin +y up, pinned to the HUD strip. */
      function hudDesignToLocal(rect, visibleW, visibleH, hud) {
        var scale = hud.width > 0 ? hud.width / HUD_DESIGN_WIDTH : 1;
        return {
          x: hud.x - visibleW / 2 + (rect.x + rect.width / 2) * scale,
          y: hud.y + hud.height - visibleH / 2 - (rect.y + rect.height / 2) * scale
        };
      }
      function hudFillWidth(fullWidth, ratio, minWidth) {
        var clamped = ratio < 0 ? 0 : ratio > 1 ? 1 : ratio;
        if (clamped <= 0) return 0;
        var width = fullWidth * clamped;
        return width < minWidth ? minWidth : width;
      }
      function hudFillRect(base, width) {
        return {
          x: base.x,
          y: base.y,
          width: width,
          height: base.height
        };
      }
      function bossPipRect(index) {
        return {
          x: BOSS_HUD_LAYOUT.pip.x + index * BOSS_HUD_LAYOUT.pipSpacing,
          y: BOSS_HUD_LAYOUT.pip.y,
          width: BOSS_HUD_LAYOUT.pip.width,
          height: BOSS_HUD_LAYOUT.pip.height
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/HudArt4.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports('hudDesignToLocal', hudDesignToLocal);
      cclegacy._RF.push({}, "f9f52IqnrRPzrM4P9EPFY1I", "HudArt", undefined);
      /** Transcribed from docs/ui/hud/hud-slices.json and docs/ui/hud/README.md §2. */
      var HUD_DESIGN_WIDTH = exports('HUD_DESIGN_WIDTH', 720);
      function art(name, width, height, slice) {
        return {
          path: "ui/hud/" + name,
          width: width,
          height: height,
          slice: slice
        };
      }
      var RUN_HUD_ART = exports('RUN_HUD_ART', {
        wavePlate: art('ui_hud_waveplate_normal', 128, 64, {
          top: 22,
          bottom: 22,
          left: 24,
          right: 24
        }),
        timerPlate: art('ui_hud_timerplate_normal', 128, 32, {
          top: 10,
          bottom: 10,
          left: 24,
          right: 24
        }),
        pause: art('ui_hud_pause_normal', 64, 64, null),
        pausePressed: art('ui_hud_pause_pressed', 64, 64, null)
      });
      var RUN_HUD_LAYOUT = exports('RUN_HUD_LAYOUT', {
        wavePlate: {
          x: 296,
          y: 4,
          width: 128,
          height: 64
        },
        waveText: {
          x: 296,
          y: 8,
          width: 128,
          height: 28
        },
        timerPlate: {
          x: 300,
          y: 68,
          width: 120,
          height: 32
        },
        timerText: {
          x: 300,
          y: 68,
          width: 120,
          height: 32
        },
        pause: {
          x: 644,
          y: 4,
          width: 64,
          height: 64
        }
      });

      /** Design 720×1280 top-left +y down → Cocos center-origin +y up, pinned to the HUD strip. */
      function hudDesignToLocal(rect, visibleW, visibleH, hud) {
        var scale = hud.width > 0 ? hud.width / HUD_DESIGN_WIDTH : 1;
        return {
          x: hud.x - visibleW / 2 + (rect.x + rect.width / 2) * scale,
          y: hud.y + hud.height - visibleH / 2 - (rect.y + rect.height / 2) * scale
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/index.ts", ['cc', './SystemOrder.ts', './ThrowController.ts', './ThrowParams.ts', './ThrowView.ts'], function (exports) {
  var cclegacy, SystemOrder, ThrowController, THROW_PARAMS, mountThrowView;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      SystemOrder = module.SystemOrder;
    }, function (module) {
      ThrowController = module.ThrowController;
    }, function (module) {
      THROW_PARAMS = module.THROW_PARAMS;
    }, function (module) {
      mountThrowView = module.mountThrowView;
    }],
    execute: function () {
      exports('installThrow', installThrow);
      cclegacy._RF.push({}, "166efzLXk9B/Z9wiePXU2YG", "index", undefined);
      function installThrow(rig) {
        var ctx = rig.ctx;
        ctx.tunables.define(THROW_PARAMS);
        var controller = new ThrowController(rig);
        var draw = null;
        // FixedLoop sorts by order; stable equal-order registration runs after sword.rig.
        ctx.loop.addSystem({
          id: 'sword.throw',
          order: SystemOrder.Sword,
          fixedUpdate: function fixedUpdate(dt) {
            return controller.fixedUpdate(dt);
          },
          render: function render() {
            if (!draw) draw = mountThrowView(rig, controller);
            draw == null || draw();
          }
        });
        // GDD §4.4 屏幕边缘指示: the main sword lying on the ground gets an edge arrow while off-view.
        ctx.camera.addIndicator('mainSword', function () {
          var snapshot = controller.snapshot;
          return snapshot.phase === 'grounded' ? snapshot.pos : null;
        });
        ctx.events.on('session:start', function () {
          return controller.reset();
        });
        ctx.events.on('session:end', function () {
          return controller.stop();
        });
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/index10.ts", ['cc', './SystemOrder.ts', './SwordRig.ts', './SwordParams.ts', './index.ts', './index8.ts', './SwordView.ts'], function (exports) {
  var cclegacy, SystemOrder, SwordRig, SWORD_PARAMS, installThrow, installLoop, mountSwordView;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      SystemOrder = module.SystemOrder;
    }, function (module) {
      SwordRig = module.SwordRig;
    }, function (module) {
      SWORD_PARAMS = module.SWORD_PARAMS;
    }, function (module) {
      installThrow = module.installThrow;
    }, function (module) {
      installLoop = module.installLoop;
    }, function (module) {
      mountSwordView = module.mountSwordView;
    }],
    execute: function () {
      exports('install', install);
      cclegacy._RF.push({}, "d3d8ekPleNKubDgcXeZKpqc", "index", undefined);
      function install(ctx) {
        ctx.tunables.define(SWORD_PARAMS);
        var rig = new SwordRig(ctx);
        ctx.services.provide('player', rig.pet);
        ctx.services.provide('swordRig', rig);
        rig.attach();
        var draw = null;
        ctx.loop.addSystem({
          id: 'sword.pet',
          order: SystemOrder.Pet,
          fixedUpdate: function fixedUpdate(dt) {
            return rig.stepPet(dt);
          }
        });
        ctx.loop.addSystem({
          id: 'sword.rig',
          order: SystemOrder.Sword,
          fixedUpdate: function fixedUpdate(dt) {
            return rig.fixedUpdate(dt);
          },
          render: function render() {
            if (!draw) draw = mountSwordView(rig);
            draw == null || draw();
          }
        });
        // Same-order systems registered by extensions follow rope, drag/whip and chain.
        installThrow(rig);
        installLoop(rig);
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/index11.ts", ['cc', './UpgradeParams.ts', './UpgradeController.ts', './UpgradeView.ts', './ModifierStore.ts', './UpgradeCatalog.ts'], function (exports) {
  var cclegacy, UPGRADE_PARAMS, UpgradeController, mountUpgradeView;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      UPGRADE_PARAMS = module.UPGRADE_PARAMS;
      exports('UPGRADE_PARAMS', module.UPGRADE_PARAMS);
    }, function (module) {
      UpgradeController = module.UpgradeController;
      exports('UpgradeController', module.UpgradeController);
    }, function (module) {
      mountUpgradeView = module.mountUpgradeView;
      var _setter = {};
      _setter.UpgradeView = module.UpgradeView;
      _setter.mountUpgradeView = module.mountUpgradeView;
      exports(_setter);
    }, function (module) {
      exports('ModifierStore', module.ModifierStore);
    }, function (module) {
      var _setter = {};
      _setter.SHELF_CATALOG = module.SHELF_CATALOG;
      _setter.UPGRADE_CATALOG = module.UPGRADE_CATALOG;
      exports(_setter);
    }],
    execute: function () {
      exports({
        asUpgradeController: asUpgradeController,
        install: install
      });
      cclegacy._RF.push({}, "db20bK/iXZFdJADV+ZOx4hB", "index", undefined);

      /**
       * Pick-1-of-3, items and 质变 (docs/design/P1-tasks.md P1-03 / P1-06). Provides
       * `upgrade` (`IUpgradeInfo`) and `modifiers` (`IModifiers`) and emits the
       * upgrade events. Offers and `drawShelf` use `ctx.rng.shop`. The shelf UI is
       * forge's (docs/MODULES.md); item effects and stacking arrive with P1-06.
       */
      function install(ctx) {
        ctx.tunables.define(UPGRADE_PARAMS);
        var controller = new UpgradeController(ctx);
        ctx.services.provide('upgrade', controller);
        ctx.services.provide('modifiers', controller.modifiers);
        mountUpgradeView(ctx, controller);
      }

      /** Lets the later upgrade view reach logic without widening the core contract. */
      function asUpgradeController(service) {
        return service instanceof UpgradeController ? service : null;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/index12.ts", ['cc', './Vec2.ts', './Geom2.ts', './SpatialHash.ts', './events.ts', './TypedEventBus.ts', './Tunables.ts', './Rng.ts', './SystemOrder.ts', './FixedLoop.ts', './StepProbe.ts', './Session.ts', './SessionWatch.ts', './Arena.ts', './Camera.ts', './CoreParams.ts', './ForgeContract.ts', './ScreenLayout.ts', './Layers.ts', './ServiceRegistry.ts', './FxDriver.ts', './DebugInputSource.ts', './LocalPlatform.ts', './Modules.ts', './App.ts', './CoreArenaView.ts', './CoreBootstrap.ts', './CoreDebugInput.ts'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      var _setter = {};
      _setter.vAdd = module.vAdd;
      _setter.vCopy = module.vCopy;
      _setter.vDist = module.vDist;
      _setter.vDistSq = module.vDistSq;
      _setter.vDot = module.vDot;
      _setter.vLen = module.vLen;
      _setter.vLenSq = module.vLenSq;
      _setter.vLerp = module.vLerp;
      _setter.vNormalize = module.vNormalize;
      _setter.vScale = module.vScale;
      _setter.vSet = module.vSet;
      _setter.vSub = module.vSub;
      _setter.vec2 = module.vec2;
      exports(_setter);
    }, function (module) {
      var _setter = {};
      _setter.circleIntersectsSegment = module.circleIntersectsSegment;
      _setter.pointSegmentDistance = module.pointSegmentDistance;
      _setter.segmentIntersection = module.segmentIntersection;
      exports(_setter);
    }, function (module) {
      exports('SpatialHash', module.SpatialHash);
    }, function (module) {
      exports('GameEvent', module.GameEvent);
    }, function (module) {
      exports('TypedEventBus', module.TypedEventBus);
    }, function (module) {
      var _setter = {};
      _setter.Tunables = module.Tunables;
      _setter.hashValues = module.hashValues;
      exports(_setter);
    }, function (module) {
      var _setter = {};
      _setter.RngStream = module.RngStream;
      _setter.createForgeRng = module.createForgeRng;
      _setter.createSessionRng = module.createSessionRng;
      _setter.deriveStreamSeed = module.deriveStreamSeed;
      _setter.mulberry32 = module.mulberry32;
      exports(_setter);
    }, function (module) {
      exports('SystemOrder', module.SystemOrder);
    }, function (module) {
      var _setter = {};
      _setter.FIXED_DT = module.FIXED_DT;
      _setter.FIXED_HZ = module.FIXED_HZ;
      _setter.FixedLoop = module.FixedLoop;
      _setter.HITSTOP_COOLDOWN_FRAMES = module.HITSTOP_COOLDOWN_FRAMES;
      _setter.HITSTOP_MAJOR_MAX_FRAMES = module.HITSTOP_MAJOR_MAX_FRAMES;
      _setter.HITSTOP_MINOR_MAX_FRAMES = module.HITSTOP_MINOR_MAX_FRAMES;
      _setter.MAX_STEPS_PER_FRAME = module.MAX_STEPS_PER_FRAME;
      exports(_setter);
    }, function (module) {
      exports('StepProbe', module.StepProbe);
    }, function (module) {
      var _setter = {};
      _setter.Session = module.Session;
      _setter.nextSessionId = module.nextSessionId;
      exports(_setter);
    }, function (module) {
      exports('createSessionWatch', module.createSessionWatch);
    }, function (module) {
      var _setter = {};
      _setter.arenaClamp = module.arenaClamp;
      _setter.arenaContains = module.arenaContains;
      _setter.createArena = module.createArena;
      exports(_setter);
    }, function (module) {
      var _setter = {};
      _setter.Camera = module.Camera;
      _setter.VIEW_HEIGHT = module.VIEW_HEIGHT;
      _setter.VIEW_WIDTH = module.VIEW_WIDTH;
      _setter.edgeArrow = module.edgeArrow;
      exports(_setter);
    }, function (module) {
      var _setter = {};
      _setter.CORE_PARAMS = module.CORE_PARAMS;
      _setter.MAP_DEFAULT_HEIGHT = module.MAP_DEFAULT_HEIGHT;
      _setter.MAP_DEFAULT_WIDTH = module.MAP_DEFAULT_WIDTH;
      exports(_setter);
    }, function (module) {
      var _setter = {};
      _setter.FORGE_BAD_OUTCOMES = module.FORGE_BAD_OUTCOMES;
      _setter.FORGE_CONTRACT_DEFAULTS = module.FORGE_CONTRACT_DEFAULTS;
      _setter.FORGE_CONTRACT_PARAMS = module.FORGE_CONTRACT_PARAMS;
      _setter.FORGE_GOOD_OUTCOMES = module.FORGE_GOOD_OUTCOMES;
      _setter.FORGE_ODDS_TOP_LEVEL = module.FORGE_ODDS_TOP_LEVEL;
      _setter.FORGE_OUTCOMES = module.FORGE_OUTCOMES;
      _setter.FORGE_OUTCOME_DELTA = module.FORGE_OUTCOME_DELTA;
      _setter.SWORD_LOOK_ROW_COUNT = module.SWORD_LOOK_ROW_COUNT;
      _setter.applyHotspotBonus = module.applyHotspotBonus;
      _setter.canForge = module.canForge;
      _setter.copyForgeOdds = module.copyForgeOdds;
      _setter.createBaseSword = module.createBaseSword;
      _setter.forgeOdds = module.forgeOdds;
      _setter.forgeOddsSum = module.forgeOddsSum;
      _setter.swordLook = module.swordLook;
      _setter.swordLookRows = module.swordLookRows;
      _setter.swordSlots = module.swordSlots;
      exports(_setter);
    }, function (module) {
      var _setter = {};
      _setter.DESIGN_HEIGHT = module.DESIGN_HEIGHT;
      _setter.DESIGN_WIDTH = module.DESIGN_WIDTH;
      _setter.UNIT_PX = module.UNIT_PX;
      _setter.arenaToPx = module.arenaToPx;
      _setter.intersectRect = module.intersectRect;
      _setter.layoutScreen = module.layoutScreen;
      _setter.rectInside = module.rectInside;
      exports(_setter);
    }, function (module) {
      exports('LAYER_NAMES', module.LAYER_NAMES);
    }, function (module) {
      exports('ServiceRegistry', module.ServiceRegistry);
    }, function (module) {
      exports('FxDriver', module.FxDriver);
    }, function (module) {
      var _setter = {};
      _setter.DebugInputSource = module.DebugInputSource;
      _setter.INPUT_HISTORY_SECONDS = module.INPUT_HISTORY_SECONDS;
      exports(_setter);
    }, function (module) {
      exports('LocalPlatform', module.LocalPlatform);
    }, function (module) {
      var _setter = {};
      _setter.installModules = module.installModules;
      _setter.moduleInstalls = module.moduleInstalls;
      exports(_setter);
    }, function (module) {
      exports('createApp', module.createApp);
    }, function (module) {
      exports('CoreArenaView', module.CoreArenaView);
    }, function (module) {
      exports('CoreBootstrap', module.CoreBootstrap);
    }, function (module) {
      exports('CoreDebugInput', module.CoreDebugInput);
    }],
    execute: function () {
      cclegacy._RF.push({}, "dd841DFjSxDAKu5MeMvO3wE", "index", undefined);
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/index13.ts", ['cc', './RunModule.ts', './PauseView.ts', './RunView.ts'], function (exports) {
  var cclegacy, RunModule, mountPauseView, mountRunView;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      RunModule = module.RunModule;
    }, function (module) {
      mountPauseView = module.mountPauseView;
    }, function (module) {
      mountRunView = module.mountRunView;
    }],
    execute: function () {
      exports('install', install);
      cclegacy._RF.push({}, "f0ec4tkHoFJTZfNWcOl0Qqn", "index", undefined);

      /**
       * Run state machine (docs/design/P1-tasks.md P1-01, issue #59). Provides `run` (`IRunInfo`) and emits
       * the run / wave events; owns the session end for the whole run.
       */
      function install(ctx) {
        var module = new RunModule(ctx);
        module.install();
        mountRunView(ctx, module);
        mountPauseView(ctx, module);
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/index2.ts", ['cc', './TerrainGround.ts', './Regions.ts', './RegionData.ts', './TerrainParams.ts'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      exports('TerrainGround', module.TerrainGround);
    }, function (module) {
      var _setter = {};
      _setter.regionAt = module.regionAt;
      _setter.regionInfo = module.regionInfo;
      exports(_setter);
    }, function (module) {
      var _setter = {};
      _setter.REGIONS = module.REGIONS;
      _setter.REGION_SPAWN = module.REGION_SPAWN;
      exports(_setter);
    }, function (module) {
      exports('TERRAIN_PARAMS', module.TERRAIN_PARAMS);
    }],
    execute: function () {
      cclegacy._RF.push({}, "17c904xBftFi4dF8asNVNRl", "index", undefined);
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/index3.ts", ['cc', './FloatingJoystick.ts', './InputParams.ts', './InputSystem.ts', './JoystickView.ts'], function (exports) {
  var cclegacy, FloatingJoystick, INPUT_PARAMS, InputSystem, mountJoystick;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      FloatingJoystick = module.FloatingJoystick;
    }, function (module) {
      INPUT_PARAMS = module.INPUT_PARAMS;
    }, function (module) {
      InputSystem = module.InputSystem;
    }, function (module) {
      mountJoystick = module.mountJoystick;
    }],
    execute: function () {
      exports('install', install);
      cclegacy._RF.push({}, "23d1bZtW9xA16rLTPUaSXg6", "index", undefined);

      /** Replace the fallback before App checks service identity and mounts debug input. */
      function install(ctx) {
        ctx.tunables.define(INPUT_PARAMS);
        var source = new FloatingJoystick();
        ctx.services.provide('input', source);
        var system = new InputSystem(ctx, source, function () {
          return view == null ? void 0 : view.redraw();
        });
        var view = mountJoystick(ctx, source, system);
        ctx.loop.addSystem(system);
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/index4.ts", ['cc', './ForgeModule.ts', './HammerView.ts', './LotsView.ts'], function (exports) {
  var cclegacy, sys, ForgeModule, mountHammerView, mountLotsView;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
      sys = module.sys;
    }, function (module) {
      ForgeModule = module.ForgeModule;
    }, function (module) {
      mountHammerView = module.mountHammerView;
    }, function (module) {
      mountLotsView = module.mountLotsView;
    }],
    execute: function () {
      exports('install', install);
      cclegacy._RF.push({}, "2d53eJ1jPJHC7ZBvmFYRwPd", "index", undefined);

      /**
       * Lottery tube, the S11 help page and the blacksmith: anvil, sword rack, shelf
       * (docs/design/P1-tasks.md P1-04 / P1-05). Provides `anvil` (`IAnvilInfo`) and
       * emits the forge events. Tube draws use `createForgeRng(ctx.session.seed, k)`
       * only; shelf candidates come from `upgrade.drawShelf`.
       *
       * Must not import the platform module or read its service, directly or
       * indirectly (P1-tasks P1-04 红线; scripts/check-forge-imports.mjs and
       * tests/core/run-tests.mjs check this).
       * The `forge.door*` tunables are not forge's: they place the forge door, are
       * registered by enemy today, and move to run as `run.door*` in P1-01.
       */
      function install(ctx) {
        var module = new ForgeModule(ctx, localStore());
        module.install();
        mountLotsView(ctx, module);
        mountHammerView(ctx, module);
      }

      /** Device-local store for the 碎剑 record only; null when the engine offers none. */
      function localStore() {
        var store = typeof sys === 'object' && sys !== null ? sys.localStorage : null;
        if (typeof store !== 'object' || store === null) return null;
        var candidate = store;
        if (typeof candidate.getItem !== 'function' || typeof candidate.setItem !== 'function') return null;
        return store;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/index5.ts", ['cc', './EnemyModule.ts', './BossChestView.ts', './BossView.ts', './EnemyView.ts'], function (exports) {
  var cclegacy, EnemyModule, mountBossChestView, mountBossView, mountEnemyView;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      EnemyModule = module.EnemyModule;
    }, function (module) {
      mountBossChestView = module.mountBossChestView;
    }, function (module) {
      mountBossView = module.mountBossView;
    }, function (module) {
      mountEnemyView = module.mountEnemyView;
    }],
    execute: function () {
      exports('install', install);
      cclegacy._RF.push({}, "3ec1aIAdwNIypeDajmhb7ih", "index", undefined);
      function install(ctx) {
        var module = new EnemyModule(ctx);
        module.install();
        mountEnemyView(ctx, module);
        mountBossView(ctx, module.boss);
        mountBossChestView(ctx, module.chest);
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/index6.ts", ['cc', './LootModule.ts', './LootView.ts', './LootFormulas.ts', './LootParams.ts'], function (exports) {
  var cclegacy, LootModule, mountLootView;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      LootModule = module.LootModule;
      exports('LootModule', module.LootModule);
    }, function (module) {
      mountLootView = module.mountLootView;
    }, function (module) {
      var _setter = {};
      _setter.bossCoins = module.bossCoins;
      _setter.coinWaveMultiplier = module.coinWaveMultiplier;
      _setter.normalEnemyCoins = module.normalEnemyCoins;
      _setter.stochasticRound = module.stochasticRound;
      _setter.xpToNext = module.xpToNext;
      exports(_setter);
    }, function (module) {
      exports('LOOT_PARAMS', module.LOOT_PARAMS);
    }],
    execute: function () {
      exports('install', install);
      cclegacy._RF.push({}, "7acf8H1iT1OQqgMV2A6FOEE", "index", undefined);

      /**
       * Coin / XP drop and pickup (docs/design/P1-tasks.md P1-02). Provides `loot` (`ILootInfo`) and emits
       * the loot events. Draws use `ctx.rng.loot`. No ad entry point (GDD §12.2).
       * `bubbleChild.cost` is defined by enemy and written on split; this module only reads `${kind}.cost`.
       */
      function install(ctx) {
        var module = new LootModule(ctx);
        module.install();
        mountLootView(ctx, module);
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/index7.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports('install', install);
      cclegacy._RF.push({}, "9c3e5D7ooNP0qdGs/lvjXi5", "index", undefined);
      /**
       * Platform adapter (docs/design/P1-tasks.md P1-13, issue #60). Replaces core's `LocalPlatform` by
       * providing `platform` (`IPlatform`). Installed first so later modules read the final service.
       */
      function install(_ctx) {}
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/index8.ts", ['cc', './SystemOrder.ts', './LoopController.ts', './LoopParams.ts', './LoopView.ts', './ChainLayout.ts'], function (exports) {
  var cclegacy, SystemOrder, LoopController, registerLoopParams, mountLoopView;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      SystemOrder = module.SystemOrder;
    }, function (module) {
      LoopController = module.LoopController;
    }, function (module) {
      registerLoopParams = module.registerLoopParams;
    }, function (module) {
      mountLoopView = module.mountLoopView;
    }, function (module) {
      var _setter = {};
      _setter.CHAIN_SLOT_PX = module.CHAIN_SLOT_PX;
      _setter.chainFitsView = module.chainFitsView;
      _setter.chainLengthPx = module.chainLengthPx;
      _setter.chainLengthU = module.chainLengthU;
      _setter.chainOccupancySlots = module.chainOccupancySlots;
      _setter.collectChainLevels = module.collectChainLevels;
      _setter.forgeLayoutParams = module.forgeLayoutParams;
      _setter.swordChainLengthPx = module.swordChainLengthPx;
      _setter.swordOccupancySlots = module.swordOccupancySlots;
      _setter.viewFitLengthU = module.viewFitLengthU;
      exports(_setter);
    }],
    execute: function () {
      exports('installLoop', installLoop);
      cclegacy._RF.push({}, "b4a77gLg5xDiIrCkmxW4xmH", "index", undefined);
      function installLoop(rig) {
        registerLoopParams(rig.ctx.tunables);
        var controller = new LoopController(rig);
        controller.attach();
        var draw = null;
        rig.ctx.loop.addSystem({
          id: 'sword.loop',
          order: SystemOrder.Sword,
          fixedUpdate: function fixedUpdate(dt) {
            return controller.fixedUpdate(dt);
          },
          render: function render() {
            if (!draw) draw = mountLoopView(controller);
            draw == null || draw();
          }
        });
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/index9.ts", ['cc', './TuningView.ts'], function (exports) {
  var cclegacy, mountTuning;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      mountTuning = module.mountTuning;
    }],
    execute: function () {
      exports('install', install);
      cclegacy._RF.push({}, "c71b43zd+ZLC7aWcPJK4kG5", "index", undefined);

      /** Core installs this after gameplay modules have registered their parameters. */
      function install(ctx) {
        mountTuning(ctx);
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/InputHistory.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './InputParams.ts'], function (exports) {
  var _extends, _createForOfIteratorHelperLoose, cclegacy, HISTORY_SECONDS, INPUT_DEFAULTS;
  return {
    setters: [function (module) {
      _extends = module.extends;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      HISTORY_SECONDS = module.HISTORY_SECONDS;
      INPUT_DEFAULTS = module.INPUT_DEFAULTS;
    }],
    execute: function () {
      cclegacy._RF.push({}, "53ff65b7iFMfYgWnkFK5+YA", "InputHistory", undefined);

      /** Plain snapshots only; neither pointer events nor consumers can mutate history. */
      var InputHistory = exports('InputHistory', /*#__PURE__*/function () {
        function InputHistory() {
          this.samples = [];
          this.directionEpsilon = INPUT_DEFAULTS.directionEpsilon;
        }
        var _proto = InputHistory.prototype;
        _proto.setDirectionEpsilon = function setDirectionEpsilon(value) {
          this.directionEpsilon = value;
        };
        _proto.record = function record(frame) {
          var last = this.samples[this.samples.length - 1];
          if (last && frame.time < last.time) this.clear();
          var row = _extends({}, frame, {
            dir: _extends({}, frame.dir)
          });
          var tail = this.samples[this.samples.length - 1];
          // Hit-stop samples the same simulation instant repeatedly, without growing history.
          if (tail && tail.time === frame.time) this.samples[this.samples.length - 1] = row;else this.samples.push(row);
          var cutoff = frame.time - HISTORY_SECONDS;
          while (this.samples.length > 0 && this.samples[0].time < cutoff) this.samples.shift();
        };
        _proto.clear = function clear() {
          this.samples.length = 0;
        };
        _proto.avgDir = function avgDir(windowS, endTime) {
          var x = 0;
          var y = 0;
          for (var _iterator = _createForOfIteratorHelperLoose(this.windowRows(windowS, endTime)), _step; !(_step = _iterator()).done;) {
            var row = _step.value;
            x += row.dir.x;
            y += row.dir.y;
          }
          // P0 §4.2: normalized average; equal sample weights follow core's DebugInputSource.
          var length = Math.hypot(x, y);
          return length <= this.directionEpsilon ? {
            x: 0,
            y: 0
          } : {
            x: x / length,
            y: y / length
          };
        };
        _proto.minMag = function minMag(windowS, endTime) {
          var rows = this.windowRows(windowS, endTime);
          if (rows.length === 0) return 0;
          var min = 1;
          for (var _iterator2 = _createForOfIteratorHelperLoose(rows), _step2; !(_step2 = _iterator2()).done;) {
            var row = _step2.value;
            min = Math.min(min, row.mag);
          }
          return min;
        };
        _proto.magDrop = function magDrop(windowS, endTime) {
          // P0 §4.2: window peak minus endpoint magnitude, without clamping the result.
          var rows = this.windowRows(windowS, endTime);
          if (rows.length === 0) return 0;
          var peak = 0;
          for (var _iterator3 = _createForOfIteratorHelperLoose(rows), _step3; !(_step3 = _iterator3()).done;) {
            var _row = _step3.value;
            peak = Math.max(peak, _row.mag);
          }
          for (var i = this.samples.length - 1; i >= 0; i--) {
            var row = this.samples[i];
            if (row.time <= endTime) return peak - row.mag;
          }
          return 0;
        };
        _proto.windowRows = function windowRows(windowS, endTime) {
          if (!(windowS > 0) || !Number.isFinite(windowS) || !Number.isFinite(endTime)) return [];
          var start = endTime - Math.min(windowS, HISTORY_SECONDS);
          // P0 §6.1 retains 0.5s; follow core's held-only, end-exclusive query convention.
          return this.samples.filter(function (row) {
            return row.touching && row.time >= start && row.time < endTime;
          });
        };
        return InputHistory;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/InputParams.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "349e1FmvANJfYI7XNt97wI9", "InputParams", undefined);
      // P0 §3 and §6.1: fixed unit conversion and history retention, not tuning knobs.
      var INPUT_PIXELS_PER_UNIT = exports('INPUT_PIXELS_PER_UNIT', 72);
      var HISTORY_SECONDS = exports('HISTORY_SECONDS', 0.5);
      var INPUT_DEFAULTS = exports('INPUT_DEFAULTS', {
        joyRadius: 1.2,
        deadZone: 0.08,
        followCenter: 1,
        // Product: retain the existing cancellation tolerance; default awaits playtesting.
        directionEpsilon: 1e-8
      });

      // Display constants only. Preserve the greybox appearance outside the tuning registry.
      var JOYSTICK_STYLE = exports('JOYSTICK_STYLE', {
        ringWidth: 3,
        thumbRadius: 8,
        colorR: 230,
        colorG: 238,
        colorB: 255,
        ringAlpha: 120,
        thumbAlpha: 180
      });
      var INPUT_PARAMS = exports('INPUT_PARAMS', [{
        key: 'input.joyRadius',
        group: '输入',
        label: '摇杆半径',
        kind: 'number',
        // P0 未定义，自选默认值: UI step only; default and bounds are P0 §6.1.
        "default": INPUT_DEFAULTS.joyRadius,
        min: 0.5,
        max: 3,
        step: 0.1,
        note: '竞技场单位；下一模拟步生效'
      }, {
        key: 'input.deadZone',
        group: '输入',
        label: '摇杆死区',
        kind: 'number',
        // P0 未定义，自选默认值: UI step only; default and bounds are P0 §6.1.
        "default": INPUT_DEFAULTS.deadZone,
        min: 0,
        max: 0.3,
        step: 0.01
      }, {
        key: 'input.followCenter',
        group: '输入',
        label: '中心跟随',
        kind: 'bool',
        "default": INPUT_DEFAULTS.followCenter
      },
      // Product: this gameplay threshold stays tunable; its default awaits playtesting.
      {
        key: 'input.directionEpsilon',
        group: '输入额外参数',
        label: '方向抵消阈值【默认·待试玩】',
        kind: 'number',
        "default": INPUT_DEFAULTS.directionEpsilon,
        min: 0,
        step: 1e-8,
        note: '【默认·待试玩】方向和长度不超过阈值时返回零向量；下一模拟步生效'
      }]);
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/InputSystem.ts", ['cc', './SystemOrder.ts'], function (exports) {
  var cclegacy, SystemOrder;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      SystemOrder = module.SystemOrder;
    }],
    execute: function () {
      cclegacy._RF.push({}, "88940kuQUFAZ6oFWRoosWzu", "InputSystem", undefined);
      var InputSystem = exports('InputSystem', /*#__PURE__*/function () {
        function InputSystem(ctx, source, draw) {
          this.id = 'input.joystick';
          this.order = SystemOrder.Input;
          this.sid = void 0;
          this.ctx = void 0;
          this.source = void 0;
          this.draw = void 0;
          this.offSession = null;
          this.ctx = ctx;
          this.source = source;
          this.draw = draw;
          this.sid = ctx.session.sid;
          this.refreshConfig();
          this.attach();
        }
        var _proto = InputSystem.prototype;
        _proto.fixedUpdate = function fixedUpdate(_dt) {
          this.syncSession();
          this.refreshConfig();
          this.source.fixedUpdate(this.ctx.loop.simTime);
        };
        _proto.attach = function attach() {
          var _this = this;
          this.syncSession();
          if (this.offSession) return;
          this.offSession = this.ctx.events.on('session:start', function () {
            _this.sid = _this.ctx.session.sid;
            _this.source.beginSession();
          });
        };
        _proto.detach = function detach() {
          var _this$offSession;
          (_this$offSession = this.offSession) == null || _this$offSession.call(this);
          this.offSession = null;
        };
        _proto.syncSession = function syncSession() {
          if (this.sid !== this.ctx.session.sid) {
            this.sid = this.ctx.session.sid;
            this.source.beginSession();
          }
        };
        _proto.render = function render() {
          this.draw();
        };
        _proto.refreshConfig = function refreshConfig() {
          var zero = this.ctx.toPx({
            x: 0,
            y: 0
          });
          var unit = this.ctx.toPx({
            x: 1,
            y: 0
          });
          this.source.setConfig({
            radiusPx: this.ctx.tunables.get('input.joyRadius') * Math.hypot(unit.x - zero.x, unit.y - zero.y),
            deadZone: this.ctx.tunables.get('input.deadZone'),
            followCenter: this.ctx.tunables.getBool('input.followCenter'),
            directionEpsilon: this.ctx.tunables.get('input.directionEpsilon')
          });
        };
        return InputSystem;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/JoystickView.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './InputParams.ts'], function (exports) {
  var _inheritsLoose, _createForOfIteratorHelperLoose, cclegacy, _decorator, Input, Graphics, input, view, Color, Button, UITransform, Node, EventMouse, Component, JOYSTICK_STYLE;
  return {
    setters: [function (module) {
      _inheritsLoose = module.inheritsLoose;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
      _decorator = module._decorator;
      Input = module.Input;
      Graphics = module.Graphics;
      input = module.input;
      view = module.view;
      Color = module.Color;
      Button = module.Button;
      UITransform = module.UITransform;
      Node = module.Node;
      EventMouse = module.EventMouse;
      Component = module.Component;
    }, function (module) {
      JOYSTICK_STYLE = module.JOYSTICK_STYLE;
    }],
    execute: function () {
      exports('mountJoystick', mountJoystick);
      var _dec, _class;
      cclegacy._RF.push({}, "00a2bWGRqRIZoxZBQ+Acj+G", "JoystickView", undefined);
      var ccclass = _decorator.ccclass;
      var MOUSE_ID = -1;
      var POINTER_EVENTS = [Input.EventType.TOUCH_START, Input.EventType.TOUCH_MOVE, Input.EventType.TOUCH_END, Input.EventType.TOUCH_CANCEL, Input.EventType.MOUSE_DOWN, Input.EventType.MOUSE_MOVE, Input.EventType.MOUSE_UP];

      /** UI adapter only. Capture also receives UI touches that Cocos swallows before global input. */
      var JoystickView = exports('JoystickView', (_dec = ccclass('InputJoystickView'), _dec(_class = /*#__PURE__*/function (_Component) {
        _inheritsLoose(JoystickView, _Component);
        function JoystickView() {
          var _this;
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          _this = _Component.call.apply(_Component, [this].concat(args)) || this;
          _this.ctx = null;
          _this.source = null;
          _this.system = null;
          _this.graphics = null;
          _this.captureRoot = null;
          _this.bound = false;
          _this.sawTouch = false;
          _this.mouseDown = false;
          _this.onTouchStart = function (event) {
            var _this$source;
            _this.sawTouch = true;
            if (!event.touch || _this.overButton(event)) return;
            var p = event.getUILocation();
            (_this$source = _this.source) == null || _this$source.pointerDown(event.touch.getID(), p.x, p.y);
            _this.redraw();
          };
          _this.onTouchMove = function (event) {
            var _this$source2;
            if (!event.touch) return;
            var p = event.getUILocation();
            (_this$source2 = _this.source) == null || _this$source2.pointerMove(event.touch.getID(), p.x, p.y);
            _this.redraw();
          };
          _this.onTouchEnd = function (event) {
            var _this$source3;
            if (event.touch) (_this$source3 = _this.source) == null || _this$source3.pointerUp(event.touch.getID());
            _this.redraw();
          };
          _this.onMouseDown = function (event) {
            var _this$source4;
            if (_this.sawTouch || event.getButton() !== EventMouse.BUTTON_LEFT || _this.overButton(event)) return;
            _this.mouseDown = true;
            var p = event.getUILocation();
            (_this$source4 = _this.source) == null || _this$source4.pointerDown(MOUSE_ID, p.x, p.y);
            _this.redraw();
          };
          _this.onMouseMove = function (event) {
            var _this$source5;
            if (_this.sawTouch || !_this.mouseDown) return;
            var p = event.getUILocation();
            (_this$source5 = _this.source) == null || _this$source5.pointerMove(MOUSE_ID, p.x, p.y);
            _this.redraw();
          };
          _this.onMouseUp = function (event) {
            var _this$source6;
            if (!_this.mouseDown || event.getButton() !== EventMouse.BUTTON_LEFT) return;
            _this.mouseDown = false;
            (_this$source6 = _this.source) == null || _this$source6.pointerUp(MOUSE_ID);
            _this.redraw();
          };
          _this.handlers = [_this.onTouchStart, _this.onTouchMove, _this.onTouchEnd, _this.onTouchEnd, _this.onMouseDown, _this.onMouseMove, _this.onMouseUp];
          return _this;
        }
        var _proto = JoystickView.prototype;
        _proto.configure = function configure(ctx, source, system) {
          var _this$getComponent;
          this.ctx = ctx;
          this.source = source;
          this.system = system;
          this.graphics = (_this$getComponent = this.getComponent(Graphics)) != null ? _this$getComponent : this.addComponent(Graphics);
          this.captureRoot = ctx.layers.get('hud').parent;
          if (this.enabledInHierarchy) this.bind();
        };
        _proto.onEnable = function onEnable() {
          this.bind();
        };
        _proto.onDisable = function onDisable() {
          var _this$system, _this$source7, _this$graphics;
          if (this.bound) {
            for (var i = 0; i < POINTER_EVENTS.length; i++) {
              var _this$captureRoot;
              input.off(POINTER_EVENTS[i], this.handlers[i], this);
              (_this$captureRoot = this.captureRoot) == null || _this$captureRoot.off(POINTER_EVENTS[i], this.handlers[i], this, true);
            }
            this.bound = false;
          }
          this.mouseDown = false;
          (_this$system = this.system) == null || _this$system.detach();
          (_this$source7 = this.source) == null || _this$source7.reset();
          (_this$graphics = this.graphics) == null || _this$graphics.clear();
        };
        _proto.onDestroy = function onDestroy() {
          this.onDisable();
          this.ctx = null;
          this.source = null;
          this.system = null;
          this.graphics = null;
          this.captureRoot = null;
        };
        _proto.redraw = function redraw() {
          var graphics = this.graphics;
          var source = this.source;
          var ctx = this.ctx;
          if (!graphics || !source || !ctx || !this.enabledInHierarchy) return;
          graphics.clear();
          if (!source.touching) return;
          var visible = view.getVisibleSize();
          var cx = source.center.x - visible.width / 2;
          var cy = source.center.y - visible.height / 2;
          var r = JOYSTICK_STYLE.colorR,
            g = JOYSTICK_STYLE.colorG,
            b = JOYSTICK_STYLE.colorB,
            ringWidth = JOYSTICK_STYLE.ringWidth,
            ringAlpha = JOYSTICK_STYLE.ringAlpha,
            thumbAlpha = JOYSTICK_STYLE.thumbAlpha,
            thumbRadius = JOYSTICK_STYLE.thumbRadius;
          graphics.lineWidth = ringWidth;
          graphics.strokeColor = new Color(r, g, b, ringAlpha);
          graphics.circle(cx, cy, source.radiusPx);
          graphics.stroke();
          graphics.fillColor = new Color(r, g, b, thumbAlpha);
          graphics.circle(source.pointer.x - visible.width / 2, source.pointer.y - visible.height / 2, thumbRadius);
          graphics.fill();
        };
        _proto.bind = function bind() {
          var _this$system2;
          if (this.bound || !this.ctx || !this.source) return;
          (_this$system2 = this.system) == null || _this$system2.attach();
          this.bound = true;
          for (var i = 0; i < POINTER_EVENTS.length; i++) {
            var _this$captureRoot2;
            input.on(POINTER_EVENTS[i], this.handlers[i], this);
            (_this$captureRoot2 = this.captureRoot) == null || _this$captureRoot2.on(POINTER_EVENTS[i], this.handlers[i], this, true);
          }
        };
        _proto.overButton = function overButton(event) {
          if (!this.ctx) return false;
          // No tuning-button tag exists in core. Reserve enabled Buttons in HUD/debug;
          // ordinary HUD labels and the thumb strip remain joystick surfaces.
          for (var _iterator = _createForOfIteratorHelperLoose(['hud', 'debug']), _step; !(_step = _iterator()).done;) {
            var name = _step.value;
            var buttons = this.ctx.layers.get(name).getComponentsInChildren(Button);
            for (var _iterator2 = _createForOfIteratorHelperLoose(buttons), _step2; !(_step2 = _iterator2()).done;) {
              var button = _step2.value;
              if (!button.enabledInHierarchy || !button.interactable) continue;
              var transform = button.node.getComponent(UITransform);
              if (transform != null && transform.hitTest(event.getLocation())) return true;
            }
          }
          return false;
        };
        return JoystickView;
      }(Component)) || _class));
      function mountJoystick(ctx, source, system) {
        var _node$addComponent;
        var parent = ctx.layers.get('debug');
        if (!parent.isValid) return null;
        var node = new Node('InputJoystick');
        node.layer = parent.layer;
        (_node$addComponent = node.addComponent(UITransform)) == null || _node$addComponent.setAnchorPoint(0, 0);
        parent.addChild(node);
        var component = node.addComponent(JoystickView);
        if (!component) {
          node.destroy();
          return null;
        }
        component.configure(ctx, source, system);
        return component;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/Layers.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "e835fbj7glBCpPAfOmMcfVc", "Layers", undefined);
      var LAYER_NAMES = exports('LAYER_NAMES', ['arena', 'trail', 'enemies', 'rig', 'fx', 'hud', 'debug']);
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/LocalPlatform.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _createForOfIteratorHelperLoose, cclegacy;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "9e1760elWpMFozK+o00KgVu", "LocalPlatform", undefined);
      /**
       * The subset of Web Storage (and Cocos `sys.localStorage`) the fallback needs
       * (docs/design/GDD.md §13.6 `storage`; docs/design/P1-tasks.md P1-13 存档).
       */
      /**
       * Fallback `platform` service (docs/design/GDD.md §13.6 浏览器模拟实现;
       * docs/design/P1-tasks.md P1-13), provided by core until the platform module
       * replaces it. Ads stay unimplemented (optional until P2). Writes always land in memory and also
       * go to `backing` when given; backing errors (quota, privacy mode) only warn.
       * `hide()` / `show()` fire the lifecycle callbacks (P1-tasks P1-01 切后台自动暂停);
       * the view forwards the engine's hide/show events, and tests call them directly.
       */
      var LocalPlatform = exports('LocalPlatform', /*#__PURE__*/function () {
        function LocalPlatform(backing) {
          if (backing === void 0) {
            backing = null;
          }
          this.kind = 'web';
          this.storage = void 0;
          this.hideListeners = [];
          this.showListeners = [];
          var memory = new Map();
          this.storage = {
            get: function get(k) {
              var cached = memory.get(k);
              if (cached !== undefined) return cached;
              if (!backing) return null;
              try {
                return backing.getItem(k);
              } catch (_unused) {
                return null;
              }
            },
            set: function set(k, v) {
              memory.set(k, v);
              if (!backing) return;
              try {
                backing.setItem(k, v);
              } catch (err) {
                console.warn("LocalPlatform: storage write failed for " + k, err);
              }
            }
          };
        }

        /** No platform-level notice on web; the S01 page belongs to the platform module. */
        var _proto = LocalPlatform.prototype;
        _proto.healthAdvice = function healthAdvice() {};
        _proto.onHide = function onHide(cb) {
          return subscribe(this.hideListeners, cb);
        };
        _proto.onShow = function onShow(cb) {
          return subscribe(this.showListeners, cb);
        };
        _proto.hide = function hide() {
          notify(this.hideListeners);
        };
        _proto.show = function show() {
          notify(this.showListeners);
        };
        return LocalPlatform;
      }());
      function subscribe(list, cb) {
        list.push(cb);
        return function () {
          var i = list.indexOf(cb);
          if (i >= 0) list.splice(i, 1);
        };
      }
      function notify(list) {
        for (var _iterator = _createForOfIteratorHelperLoose(list.slice()), _step; !(_step = _iterator()).done;) {
          var cb = _step.value;
          try {
            cb();
          } catch (err) {
            console.error(err);
          }
        }
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/LoopController.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './ChainLayout.ts', './geom.ts', './LoopParams.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, _extends, _createClass, cclegacy, forgeLayoutParams, chainOccupancySlots, chainLengthPx, chainFitsView, chainLengthU, collectChainLevels, distance, findClosure, trimOldest, douglasPeucker, pointInPolygon, capsuleContact, interpolate, trailLength, inkBudget, loopDamage;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _extends = module.extends;
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      forgeLayoutParams = module.forgeLayoutParams;
      chainOccupancySlots = module.chainOccupancySlots;
      chainLengthPx = module.chainLengthPx;
      chainFitsView = module.chainFitsView;
      chainLengthU = module.chainLengthU;
      collectChainLevels = module.collectChainLevels;
    }, function (module) {
      distance = module.distance;
      findClosure = module.findClosure;
      trimOldest = module.trimOldest;
      douglasPeucker = module.douglasPeucker;
      pointInPolygon = module.pointInPolygon;
      capsuleContact = module.capsuleContact;
      interpolate = module.interpolate;
      trailLength = module.trailLength;
    }, function (module) {
      inkBudget = module.inkBudget;
      loopDamage = module.loopDamage;
    }],
    execute: function () {
      cclegacy._RF.push({}, "8c9f1jPaPxNS5RB/5+1uleq", "LoopController", undefined);
      /** Pure fixed-step rules. View owns Cocos nodes and lifecycle wiring. */
      var LoopController = exports('LoopController', /*#__PURE__*/function () {
        function LoopController(rig) {
          this.rig = void 0;
          this.ctx = void 0;
          this.phase = 'normal';
          this.jianyi = 0;
          this.ink = 0;
          this.inkRaw = 0;
          this.duration = 0;
          this.elapsed = 0;
          this.loops = 0;
          this.points = [];
          this.flashPolygon = [];
          this.flashCount = 0;
          this.flashLeft = 0;
          /** Sum of forge occupancy slots on the dragged chain (#108 PR5). */
          this.chainOccupancy = 0;
          /** `chainOccupancy × forge.chainSlotPx` (72px per slot by default). */
          this.chainLengthPx = 0;
          /** True when that length still fits the current 10u × 15u view. */
          this.chainFits = true;
          this.unsubs = [];
          this.attached = false;
          this.running = false;
          this.time = 0;
          this.warningElapsed = 0;
          this.returnElapsed = 0;
          this.sinceSample = 0;
          this.hitUntil = 0;
          this.samples = [];
          this.liveHead = false;
          this.previous = {
            x: 0,
            y: 0
          };
          this.hitGains = [];
          this.linkGains = [];
          this.boarPositions = new Map();
          this.emptyStart = true;
          this.serial = 0;
          this.rig = rig;
          this.ctx = rig.ctx;
        }
        var _proto = LoopController.prototype;
        _proto.attach = function attach() {
          var _this = this;
          if (this.attached) return;
          this.attached = true;
          var events = this.ctx.events;
          this.unsubs.push(events.on('session:start', function () {
            return _this.reset();
          }));
          this.unsubs.push(events.on('session:end', function () {
            return _this.stop();
          }));
          this.unsubs.push(events.on('player:died', function () {
            return _this.stop();
          }));
          this.unsubs.push(events.on('enemy:damaged', function (e) {
            if (e.amount > 0 && (e.source === 'drag' || e.source === 'whip')) _this.gain(_this.p('jianyi.hit'), _this.hitGains, _this.p('jianyi.hitCap'));
          }));
          this.unsubs.push(events.on('enemy:died', function (e) {
            if (e.source === 'link_auto' || e.source === 'link_contact') _this.gain(_this.p('jianyi.linkKill'), _this.linkGains, _this.p('jianyi.linkCap'));else _this.gain(_this.p(e.source === 'whip' ? 'jianyi.whipKill' : 'jianyi.kill'));
          }));
          this.unsubs.push(events.on('throw:catch', function (e) {
            if (e.kind === 'perfect') _this.gain(_this.p('jianyi.perfectCatch'));
          }));
          this.unsubs.push(events.on('player:damaged', function () {
            return _this.onHit();
          }));
          this.unsubs.push(events.on('debug:command', function (_ref) {
            var cmd = _ref.cmd;
            if (cmd === 'fillJianyi' && _this.canGain()) {
              _this.setJianyi(_this.p('jianyi.max'));
              _this.maybeWarn();
            }
          }));
        };
        _proto.detach = function detach() {
          for (var _iterator = _createForOfIteratorHelperLoose(this.unsubs), _step; !(_step = _iterator()).done;) {
            var off = _step.value;
            off();
          }
          this.unsubs.length = 0;
          this.attached = false;
        };
        _proto.reset = function reset() {
          // SwordRig resets first on session:start; do not start a return animation here.
          this.phase = 'normal';
          this.running = true;
          this.time = this.elapsed = this.warningElapsed = this.returnElapsed = this.sinceSample = this.hitUntil = 0;
          this.ink = this.inkRaw = this.duration = this.loops = this.serial = 0;
          this.samples = this.points = [];
          this.liveHead = false;
          this.flashPolygon = [];
          this.flashLeft = this.flashCount = 0;
          this.refreshChainLayout();
          this.hitGains.length = this.linkGains.length = 0;
          this.boarPositions.clear();
          this.previous = _extends({}, this.rig.petPos);
          this.setJianyi(0);
          this.rig.setJianzhenInfo(null, null);
          this.rig.setEnemyTimeScale(1);
        };
        _proto.fixedUpdate = function fixedUpdate(dt) {
          if (!this.attached) return;
          this.refreshChainLayout();
          if (!this.running || dt <= 0) return;
          this.time += dt;
          this.flashLeft = Math.max(0, this.flashLeft - dt);
          if (!this.ctx.tunables.getBool('mech.loop')) {
            if (this.phase === 'drawing') this.end(true);
            if (this.phase === 'warning') this.phase = 'normal';
            this.setJianyi(0);
            this.hitGains.length = this.linkGains.length = 0;
          }
          if (this.phase === 'returning') {
            this.returnElapsed += dt;
            if (this.returnElapsed + 1e-9 >= this.p('loop.returnTime')) this.phase = 'normal';
            return;
          }
          if (!this.ctx.tunables.getBool('mech.loop')) return;
          if (this.phase === 'normal') {
            this.maybeWarn();
            return;
          }
          if (this.phase === 'warning') {
            this.warningElapsed += dt;
            if (this.warningElapsed + 1e-9 >= this.p('loop.warnTime')) this.begin();
            return;
          }
          this.elapsed += dt;
          this.refreshBudget();
          this.rig.setJianzhenInfo(this.ink, this.remaining);
          this.rig.setEnemyTimeScale(this.p('loop.bulletTime'));
          if (this.elapsed + 1e-9 >= this.duration) {
            this.end(false);
            return;
          }
          var now = _extends({}, this.rig.petPos);
          this.sinceSample += dt;
          // Fixed samples plus one replaceable live head. Include this step's movement
          // BEFORE trimming/cutting/closure, even between the 0.05s sample ticks.
          if (this.liveHead) this.samples.pop();
          var sampleDue = this.sinceSample + 1e-9 >= this.p('loop.sampleInterval');
          if (sampleDue) this.sinceSample %= this.p('loop.sampleInterval');
          var last = this.samples[this.samples.length - 1];
          this.liveHead = false;
          if (!last || distance(last, now) > 1e-9) {
            this.samples.push(_extends({}, now, {
              time: this.time
            }));
            this.liveHead = !sampleDue;
          }
          // Clip before detecting closure, so expired tails cannot close.
          this.rebuild();
          this.cutByBoars();
          var closed = findClosure(this.points, this.previous, now, this.time, this.p('loop.closeAge'), this.p('loop.closeTol'));
          var consumed = false;
          if (closed) {
            if (closed.area < this.p('loop.minArea')) this.ctx.events.emit('jianzhen:rejectedLoop', {
              area: closed.area
            });else {
              this.slash(closed);
              consumed = true;
            }
          }
          if (consumed) this.restartTrail(now);
          this.previous = now;
        };
        _proto.p = function p(key) {
          return this.ctx.tunables.get(key);
        };
        _proto.refreshChainLayout = function refreshChainLayout() {
          var levels = this.chainLevels();
          var params = forgeLayoutParams(this.ctx.tunables);
          this.chainOccupancy = chainOccupancySlots(levels, params);
          this.chainLengthPx = chainLengthPx(levels, params);
          this.chainFits = chainFitsView(chainLengthU(levels, params), this.ctx.camera.viewW, this.ctx.camera.viewH);
        };
        _proto.chainLevels = function chainLevels() {
          var grades;
          var slots = 0;
          if (this.ctx.services.has('swordRig')) {
            var rig = this.ctx.services.get('swordRig');
            grades = rig.linkGrades;
            slots = rig.slots;
          }
          var main = this.ctx.services.has('anvil') ? this.ctx.services.get('anvil').sword.level : null;
          return collectChainLevels(grades, slots, main);
        };
        _proto.canGain = function canGain() {
          return this.running && this.attached && this.phase === 'normal' && this.ctx.tunables.getBool('mech.loop');
        };
        _proto.setJianyi = function setJianyi(value) {
          this.jianyi = Math.max(0, Math.min(this.p('jianyi.max'), value));
          this.rig.setJianyi(this.jianyi);
        };
        _proto.gain = function gain(amount, bucket, cap) {
          if (cap === void 0) {
            cap = 0;
          }
          if (!this.canGain()) return;
          if (bucket) {
            // A sliding simulation-second window avoids double credit at second boundaries.
            var now = this.ctx.loop.simTime;
            while (bucket.length > 0 && bucket[0].time <= now - 1 + 1e-9) bucket.shift();
            var used = 0;
            for (var _iterator2 = _createForOfIteratorHelperLoose(bucket), _step2; !(_step2 = _iterator2()).done;) {
              var entry = _step2.value;
              used += entry.amount;
            }
            amount = Math.max(0, Math.min(amount, cap - used));
            if (amount > 0) bucket.push({
              time: now,
              amount: amount
            });
          }
          this.setJianyi(this.jianyi + amount * this.p('jianyi.globalMul'));
          this.maybeWarn();
        };
        _proto.maybeWarn = function maybeWarn() {
          if (!this.canGain() || this.jianyi < this.p('jianyi.max')) return;
          this.phase = 'warning';
          this.warningElapsed = 0;
          this.ctx.events.emit('jianzhen:warn', {});
        };
        _proto.refreshBudget = function refreshBudget() {
          var budget = inkBudget(this.ctx.tunables, this.rig.N, this.rig.Lg, this.rig.mainHeld);
          this.ink = budget.ink;
          this.inkRaw = budget.raw;
          this.duration = budget.duration;
        };
        _proto.begin = function begin() {
          this.phase = 'drawing';
          this.elapsed = this.loops = 0;
          this.hitUntil = 0;
          this.setJianyi(0);
          this.refreshBudget();
          this.rig.setChainLanded(true);
          this.rig.setJianzhenInfo(this.ink, this.remaining);
          this.rig.setEnemyTimeScale(this.p('loop.bulletTime'));
          this.boarPositions.clear();
          this.restartTrail(this.rig.petPos);
          this.previous = _extends({}, this.rig.petPos);
          var near = [];
          if (this.ctx.services.has('enemies')) this.ctx.services.get('enemies').queryCircle(_extends({}, this.rig.petPos), 4, near); // P0 §11.
          var enemiesNear = near.filter(function (enemy) {
            return enemy.alive;
          }).length;
          this.emptyStart = enemiesNear < 3;
          this.ctx.events.emit('jianzhen:start', {
            ink: this.ink,
            inkRaw: this.inkRaw,
            duration: this.duration,
            N: this.rig.N,
            enemiesNear: enemiesNear
          });
        };
        _proto.restartTrail = function restartTrail(pos) {
          this.samples = [_extends({}, pos, {
            time: this.time
          })];
          this.points = this.samples.slice();
          this.sinceSample = 0;
          this.liveHead = false;
        };
        _proto.rebuild = function rebuild() {
          this.samples = trimOldest(this.samples, Math.max(0, this.length - this.ink));
          var max = Math.floor(this.p('loop.maxPoints'));
          if (this.samples.length > max) this.samples = this.samples.slice(-max);
          if (this.samples.length <= 1) this.liveHead = false;
          // Simplify original bounded samples, never repeatedly simplify an approximation.
          this.points = douglasPeucker(this.samples, this.p('loop.dpEpsilon'));
        };
        _proto.slash = function slash(closed) {
          var candidates = [];
          var polygon = closed.polygon;
          var minX = Infinity,
            minY = Infinity,
            maxX = -Infinity,
            maxY = -Infinity;
          for (var _iterator3 = _createForOfIteratorHelperLoose(polygon), _step3; !(_step3 = _iterator3()).done;) {
            var p = _step3.value;
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
          }
          var enemies = this.ctx.services.has('enemies') ? this.ctx.services.get('enemies') : null;
          if (enemies) enemies.queryAABB(minX, minY, maxX, maxY, candidates);
          var seen = new Set();
          var inside = candidates.filter(function (enemy) {
            if (!enemy.alive || seen.has(enemy.id) || !pointInPolygon(enemy.pos, polygon)) return false;
            seen.add(enemy.id);
            return true;
          });
          var n = inside.length;
          var amount = loopDamage(this.ctx.tunables, this.rig.B, n, closed.area);
          var hitKey = "loop:" + ++this.serial;
          var totalDamage = 0;
          var kills = 0;
          for (var _iterator4 = _createForOfIteratorHelperLoose(inside), _step4; !(_step4 = _iterator4()).done;) {
            var enemy = _step4.value;
            if (!enemies) break;
            // Unique key per closure needs no additional per-target cooldown.
            var result = enemies.hit(enemy.id, {
              source: 'loop',
              amount: amount,
              hitKey: hitKey,
              cooldown: 0
            });
            if (result.applied) {
              totalDamage += result.dealt;
              if (result.killed) kills++;
            }
          }
          this.loops++;
          this.flashPolygon = polygon.map(function (p) {
            return {
              x: p.x,
              y: p.y
            };
          });
          this.flashCount = n;
          this.flashLeft = this.p('loop.flashTime');
          if (this.ctx.tunables.getBool('fx.hitstop')) {
            this.ctx.events.emit('fx:hitstop', {
              frames: this.p('loop.hitstopFrames'),
              kind: 'major'
            });
          }
          this.ctx.events.emit('jianzhen:loop', {
            area: closed.area,
            n: n,
            totalDamage: totalDamage,
            kills: kills,
            points: polygon.length,
            ink: this.ink
          });
        };
        _proto.onHit = function onHit() {
          if (!this.running || this.phase !== 'drawing' || this.time + 1e-9 < this.hitUntil) return;
          this.hitUntil = this.time + this.p('loop.hitProtect');
          var mode = this.p('loop.hitMode');
          var inkLost = mode === 0 ? this.length * this.p('loop.hitInkLoss') : this.length;
          this.samples = trimOldest(this.samples, inkLost);
          this.rebuild();
          this.ctx.events.emit('jianzhen:hit', {
            mode: mode,
            inkLost: inkLost
          });
          if (mode === 1) {
            this.setJianyi(this.p('loop.hitRefund') * this.p('jianyi.max'));
            this.end(true);
          }
        };
        _proto.cutByBoars = function cutByBoars() {
          if (!this.ctx.services.has('enemies')) return;
          var boars = this.ctx.services.get('enemies').getChargingBoars();
          var next = new Map();
          for (var _iterator5 = _createForOfIteratorHelperLoose(boars), _step5; !(_step5 = _iterator5()).done;) {
            var _this$boarPositions$g;
            var boar = _step5.value;
            var before = (_this$boarPositions$g = this.boarPositions.get(boar.id)) != null ? _this$boarPositions$g : boar.pos;
            next.set(boar.id, _extends({}, boar.pos));
            // Enemy owns this parameter. Until installed, its P0 default is true.
            if (this.ctx.tunables.has('boar.cutsTrail') && !this.ctx.tunables.getBool('boar.cutsTrail')) continue;
            // Newest contact discards every older crossed segment in one cut.
            for (var i = this.samples.length - 1; i > 0; i--) {
              var newer = this.samples[i];
              var older = this.samples[i - 1];
              var t = capsuleContact(newer, older, before, boar.pos, boar.radius);
              if (t === null) continue;
              var cut = interpolate(newer, older, t);
              var kept = t <= 1e-9 ? this.samples.slice(i) : [cut].concat(this.samples.slice(i));
              var inkLost = this.length - trailLength(kept);
              if (inkLost > 1e-9) {
                this.samples = kept;
                this.rebuild();
                this.ctx.events.emit('jianzhen:cut', {
                  pos: {
                    x: cut.x,
                    y: cut.y
                  },
                  inkLost: inkLost
                });
              }
              break;
            }
          }
          this.boarPositions = next;
        };
        _proto.end = function end(interrupted) {
          if (this.phase !== 'drawing') return;
          this.phase = 'returning';
          this.returnElapsed = 0;
          this.samples = this.points = [];
          this.boarPositions.clear();
          this.rig.setJianzhenInfo(null, null);
          this.rig.setEnemyTimeScale(1);
          // Sole exit-immunity hook. SwordRig starts immunity AFTER its return animation.
          this.rig.setChainLanded(false, this.p('loop.postReturnImmune'));
          this.ctx.events.emit('jianzhen:end', {
            loops: this.loops,
            interrupted: interrupted,
            emptyStart: this.emptyStart
          });
        };
        _proto.stop = function stop() {
          this.end(true);
          this.running = false;
          this.phase = 'normal';
          this.samples = this.points = [];
          this.flashLeft = 0;
          this.rig.setJianzhenInfo(null, null);
          this.rig.setEnemyTimeScale(1);
        };
        _createClass(LoopController, [{
          key: "remaining",
          get: function get() {
            return this.phase === 'drawing' ? Math.max(0, this.duration - this.elapsed) : 0;
          }
        }, {
          key: "length",
          get: function get() {
            return trailLength(this.samples);
          }
        }]);
        return LoopController;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/LoopParams.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _extends, _createForOfIteratorHelperLoose, cclegacy;
  return {
    setters: [function (module) {
      _extends = module.extends;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports({
        inkBudget: inkBudget,
        loopDamage: loopDamage,
        registerLoopParams: registerLoopParams
      });
      cclegacy._RF.push({}, "22dd4oyh+dMcq0AFX0ARvu5", "LoopParams", undefined);
      function number(key, label, value, min, max) {
        return {
          key: key,
          group: '剑阵',
          label: label,
          kind: 'number',
          "default": value,
          min: min,
          max: max,
          note: 'P0 §6.5'
        };
      }

      /** Literal P0 §6.5 table. Return/immune parameters belong to SwordParams. */
      var LOOP_PARAMS = exports('LOOP_PARAMS', [{
        key: 'mech.loop',
        group: '剑阵',
        label: '剑阵机制',
        kind: 'bool',
        "default": 1
      }, number('jianyi.max', '剑意上限', 100, 10, 500), number('jianyi.hit', '拖剑命中剑意', 1, 0, 10), number('jianyi.hitCap', '命中每秒剑意上限', 5, 0, 50), number('jianyi.kill', '击杀剑意', 2, 0, 20), number('jianyi.whipKill', '鞭响击杀剑意', 4, 0, 20), number('jianyi.linkKill', '链剑击杀剑意', 0.5, 0, 5), number('jianyi.linkCap', '链剑每秒剑意上限', 2, 0, 20), number('jianyi.perfectCatch', '完美接剑剑意', 12, 0, 50), number('jianyi.globalMul', '剑意总倍率', 1, 0.1, 5), number('loop.warnTime', '预警时长', 1, 0, 3), number('loop.duration', '基础剑阵时长', 6, 2, 15), number('loop.inkBase', '基础墨量', 6, 0, 20), number('loop.inkPerSword', '每把链剑墨量', 0.8, 0, 3), number('loop.inkPerLg', '每点剑长墨量', 0.5, 0, 2), number('loop.inkCap', '墨量上限', 22, 5, 60), number('loop.overflowSecPerU', '超出墨量转时长', 0.15, 0, 1), number('loop.overflowSecCap', '额外时长上限', 3, 0, 10), number('loop.sampleInterval', '剑痕采样间隔', 0.05, 0.01, 0.2), number('loop.dpEpsilon', '剑痕简化容差', 0.05, 0, 0.3), number('loop.maxPoints', '剑痕点数上限', 200, 50, 500), number('loop.closeAge', '可闭合剑痕年龄', 0.3, 0.1, 1), number('loop.closeTol', '闭合容差', 0.3, 0, 1), number('loop.minArea', '最小有效面积', 1.5, 0, 10), number('loop.dmgK', '斩击系数', 6, 0, 30), number('loop.nLogK', '人数对数系数', 0.35, 0, 2), number('loop.areaRef', '面积参考值', 8, 1, 30), number('loop.areaMin', '面积项下限', 0.5, 0, 1), number('loop.areaMax', '面积项上限', 3, 1, 10), number('loop.areaExp', '面积指数', 0.3, 0, 1), {
        key: 'loop.hitMode',
        group: '剑阵',
        label: '受击规则',
        kind: 'enum',
        "default": 0,
        options: ['扣墨', '整段作废']
      }, number('loop.hitInkLoss', '受击剑痕损失比例', 0.3, 0, 1), number('loop.hitProtect', '扣墨保护时长', 0.5, 0, 2), number('loop.hitRefund', '作废返还剑意比例', 0.4, 0, 1), number('loop.bulletTime', '敌人时间倍率', 0.7, 0.3, 1), number('loop.hitstopFrames', '闭合顿帧', 9, 0, 20),
      // P0 未定义，自选默认值: presentation timing only.
      _extends({}, number('loop.flashTime', '闭合闪光时长', 0.4, 0, 2), {
        note: 'P0未定义持续时间，灰盒自选默认值'
      })]);
      function registerLoopParams(params) {
        for (var _iterator = _createForOfIteratorHelperLoose(LOOP_PARAMS), _step; !(_step = _iterator()).done;) {
          var def = _step.value;
          if (!params.has(def.key)) params.define([def]);
        }
      }

      /** P0 §6.5; no P1 item multipliers. Recomputed for pickups and main-sword catches. */
      function inkBudget(p, count, length, held) {
        var raw = p.get('loop.inkBase') + p.get('loop.inkPerSword') * count + (held ? p.get('loop.inkPerLg') * length : 0);
        var cap = p.get('loop.inkCap');
        return {
          raw: raw,
          ink: Math.min(raw, cap),
          duration: p.get('loop.duration') + Math.min(p.get('loop.overflowSecPerU') * Math.max(raw - cap, 0), p.get('loop.overflowSecCap'))
        };
      }

      /** P0 §6.5 / GDD §6.5: natural logarithm, per-enemy damage. */
      function loopDamage(p, base, count, area) {
        var areaTerm = Math.max(p.get('loop.areaMin'), Math.min(p.get('loop.areaMax'), area / p.get('loop.areaRef')));
        return base * p.get('loop.dmgK') * (1 + p.get('loop.nLogK') * Math.log(1 + count)) * Math.pow(areaTerm, p.get('loop.areaExp'));
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/LoopView.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './ScreenLayout.ts', './HudArt.ts', './geom.ts'], function (exports) {
  var _inheritsLoose, _createForOfIteratorHelperLoose, cclegacy, _decorator, Color, Graphics, Label, view, UITransform, Node, resources, SpriteFrame, Sprite, Component, layoutScreen, hudDesignToLocal, SWORD_HUD_LAYOUT, SWORD_HUD_ART, distance;
  return {
    setters: [function (module) {
      _inheritsLoose = module.inheritsLoose;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
      _decorator = module._decorator;
      Color = module.Color;
      Graphics = module.Graphics;
      Label = module.Label;
      view = module.view;
      UITransform = module.UITransform;
      Node = module.Node;
      resources = module.resources;
      SpriteFrame = module.SpriteFrame;
      Sprite = module.Sprite;
      Component = module.Component;
    }, function (module) {
      layoutScreen = module.layoutScreen;
    }, function (module) {
      hudDesignToLocal = module.hudDesignToLocal;
      SWORD_HUD_LAYOUT = module.SWORD_HUD_LAYOUT;
      SWORD_HUD_ART = module.SWORD_HUD_ART;
    }, function (module) {
      distance = module.distance;
    }],
    execute: function () {
      exports('mountLoopView', mountLoopView);
      var _dec, _class;
      cclegacy._RF.push({}, "a479aEzDStA+psZVgMMGfzP", "LoopView", undefined);
      var ccclass = _decorator.ccclass;
      // P0 未定义，自选默认值: greybox styling in pixels/u; no gameplay effects.
      var STYLE = {
        spacing: 0.3,
        blade: 0.24,
        guard: 0.12,
        linePx: 2,
        edgePx: 6,
        fontPx: 16,
        hudHeight: 32
      };
      var INK = new Color(100, 235, 235);
      var FLASH = new Color(255, 240, 165);
      var PLATE_INK = new Color(44, 30, 20);
      var PLATE_FALLBACK = new Color(92, 70, 48, 255);
      var LoopView = exports('LoopView', (_dec = ccclass('SwordLoopGreyboxView'), _dec(_class = /*#__PURE__*/function (_Component) {
        _inheritsLoose(LoopView, _Component);
        function LoopView() {
          var _this;
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          _this = _Component.call.apply(_Component, [this].concat(args)) || this;
          _this.controller = null;
          _this.graphics = null;
          _this.hud = null;
          _this.hudPlate = null;
          _this.caption = null;
          return _this;
        }
        var _proto = LoopView.prototype;
        _proto.bind = function bind(controller) {
          this.controller = controller;
          this.graphics = child(this.node, 'Geometry').addComponent(Graphics);
          var hudLayer = controller.ctx.layers.get('hud');
          this.hudPlate = makeHudSprite(hudLayer, 'LoopStatusArt', SWORD_HUD_ART.jianyiPlate, PLATE_FALLBACK);
          this.hud = label(hudLayer, 'LoopStatus');
          this.hud.color = PLATE_INK;
          this.hud.overflow = Label.Overflow.SHRINK;
          this.hud.horizontalAlign = Label.HorizontalAlign.CENTER;
          this.hud.verticalAlign = Label.VerticalAlign.CENTER;
          this.caption = label(this.node, 'LoopCaption');
        };
        _proto.onEnable = function onEnable() {
          var _this$controller;
          (_this$controller = this.controller) == null || _this$controller.attach();
        };
        _proto.onDisable = function onDisable() {
          var _this$controller2;
          (_this$controller2 = this.controller) == null || _this$controller2.detach();
        };
        _proto.onDestroy = function onDestroy() {
          var _this$controller3, _this$hudPlate, _this$hud;
          (_this$controller3 = this.controller) == null || _this$controller3.detach();
          (_this$hudPlate = this.hudPlate) == null || _this$hudPlate.destroy();
          (_this$hud = this.hud) == null || _this$hud.node.destroy();
          this.controller = null;
        };
        _proto.draw = function draw() {
          var c = this.controller;
          var g = this.graphics;
          if (!c || !g || !this.enabledInHierarchy) return;
          var px = c.ctx.toPx;
          var scale = Math.abs(px({
            x: 1,
            y: 0
          }).x - px({
            x: 0,
            y: 0
          }).x);
          g.clear();
          g.lineWidth = STYLE.linePx;
          g.strokeColor = INK;
          var points = c.points;
          if (c.phase === 'drawing' && points.length > 0) {
            this.outline(g, points);
            // Spatially spaced upright blades distinguish the trail from chain diamonds.
            var offset = 0;
            for (var i = 1; i < points.length; i++) {
              var _a = points[i - 1],
                _b = points[i];
              var length = distance(_a, _b);
              if (length <= 1e-9) continue;
              for (; offset < length; offset += STYLE.spacing) {
                var t = offset / length;
                this.blade(g, {
                  x: _a.x + (_b.x - _a.x) * t,
                  y: _a.y + (_b.y - _a.y) * t
                }, scale);
              }
              offset -= length;
            }
            var last = points[points.length - 1];
            var a = px(last),
              b = px(c.rig.petPos);
            g.moveTo(a.x, a.y);
            g.lineTo(b.x, b.y);
            g.stroke();
          }
          if (c.phase === 'warning') {
            // Screen-edge glow covers the current view only (GDD 2026-10-19 补充决策 全屏类效果).
            var _c$ctx$camera = c.ctx.camera,
              center = _c$ctx$camera.center,
              viewW = _c$ctx$camera.viewW,
              viewH = _c$ctx$camera.viewH;
            var x0 = center.x - viewW / 2,
              x1 = center.x + viewW / 2;
            var y0 = center.y - viewH / 2,
              y1 = center.y + viewH / 2;
            g.strokeColor = FLASH;
            g.lineWidth = STYLE.edgePx;
            this.outline(g, [{
              x: x0,
              y: y0
            }, {
              x: x1,
              y: y0
            }, {
              x: x1,
              y: y1
            }, {
              x: x0,
              y: y1
            }, {
              x: x0,
              y: y0
            }]);
          }
          if (c.flashLeft > 0 && c.flashPolygon.length > 0) {
            g.strokeColor = FLASH;
            g.lineWidth = STYLE.linePx;
            this.outline(g, c.flashPolygon.concat(c.flashPolygon.slice(0, 1)));
            var x = 0,
              y = 0;
            for (var _iterator = _createForOfIteratorHelperLoose(c.flashPolygon), _step; !(_step = _iterator()).done;) {
              var p = _step.value;
              x += p.x;
              y += p.y;
            }
            var _center = {
              x: x / c.flashPolygon.length,
              y: y / c.flashPolygon.length
            };
            var progress = Math.max(0, Math.min(1, 1 - c.flashLeft / Math.max(1e-9, c.ctx.tunables.get('loop.flashTime'))));
            for (var _iterator2 = _createForOfIteratorHelperLoose(c.flashPolygon), _step2; !(_step2 = _iterator2()).done;) {
              var _p = _step2.value;
              this.blade(g, {
                x: _p.x + (_center.x - _p.x) * progress,
                y: _p.y + (_center.y - _p.y) * progress
              }, scale);
            }
            if (this.caption) {
              this.caption.string = "\xD7" + c.flashCount + " \u4E00\u5708\u65A9\uFF01" + (c.flashCount >= 20 ? ' 大满贯' : ''); // GDD §6.5.
              var pos = px(_center);
              this.caption.node.setPosition(pos.x, pos.y, 0);
            }
          }
          if (this.caption) this.caption.node.active = c.flashLeft > 0;
          if (this.hud) {
            var _this$hud$node$getCom;
            var showHud = c.ctx.services.has('run') === false || c.ctx.services.get('run').combatActive;
            this.hud.node.active = showHud;
            if (this.hudPlate) this.hudPlate.active = showHud;
            if (showHud === false) return;
            var visible = view.getVisibleSize();
            var hud = layoutScreen(visible.width, visible.height).hud;
            var platePos = hudDesignToLocal(SWORD_HUD_LAYOUT.jianyiPlate, visible.width, visible.height, hud);
            if (this.hudPlate) {
              var _this$hudPlate$getCom;
              this.hudPlate.setPosition(platePos.x, platePos.y, 0);
              (_this$hudPlate$getCom = this.hudPlate.getComponent(UITransform)) == null || _this$hudPlate$getCom.setContentSize(SWORD_HUD_LAYOUT.jianyiPlate.width, SWORD_HUD_LAYOUT.jianyiPlate.height);
            }
            var textPos = hudDesignToLocal(SWORD_HUD_LAYOUT.jianyiText, visible.width, visible.height, hud);
            this.hud.node.setPosition(textPos.x, textPos.y, 0);
            (_this$hud$node$getCom = this.hud.node.getComponent(UITransform)) == null || _this$hud$node$getCom.setContentSize(SWORD_HUD_LAYOUT.jianyiText.width, SWORD_HUD_LAYOUT.jianyiText.height);
            this.hud.string = c.phase === 'drawing' ? "\u58A8\u91CF " + c.length.toFixed(1) + "/" + c.ink.toFixed(1) + "u  \u5269\u4F59 " + c.remaining.toFixed(1) + "s" : c.phase === 'warning' ? '剑意已满 · 剑阵将至' : c.phase === 'returning' ? '剑阵回收中' : "\u5251\u610F " + c.jianyi.toFixed(0) + "/" + c.ctx.tunables.get('jianyi.max');
          }
        };
        _proto.outline = function outline(g, points) {
          var c = this.controller;
          if (!c || points.length === 0) return;
          var first = c.ctx.toPx(points[0]);
          g.moveTo(first.x, first.y);
          for (var i = 1; i < points.length; i++) {
            var p = c.ctx.toPx(points[i]);
            g.lineTo(p.x, p.y);
          }
          g.stroke();
        };
        _proto.blade = function blade(g, pos, scale) {
          var c = this.controller;
          if (!c) return;
          var p = c.ctx.toPx(pos);
          g.moveTo(p.x, p.y);
          g.lineTo(p.x, p.y + STYLE.blade * scale);
          g.moveTo(p.x - STYLE.guard * scale / 2, p.y + STYLE.blade * scale / 3);
          g.lineTo(p.x + STYLE.guard * scale / 2, p.y + STYLE.blade * scale / 3);
          g.stroke();
        };
        return LoopView;
      }(Component)) || _class));
      function child(parent, name) {
        var node = new Node(name);
        node.layer = parent.layer;
        node.addComponent(UITransform).setAnchorPoint(0, 0);
        parent.addChild(node);
        return node;
      }
      function makeHudSprite(parent, name, spec, fallback) {
        var node = new Node(name);
        node.layer = parent.layer;
        node.addComponent(UITransform).setContentSize(spec.width, spec.height);
        parent.addChild(node);
        resources.load(spec.path + "/spriteFrame", SpriteFrame, function (error, frame) {
          var _node$getComponent;
          if (node.isValid === false) return;
          if (error || !frame) {
            var graphics = node.addComponent(Graphics);
            graphics.rect(-spec.width / 2, -spec.height / 2, spec.width, spec.height);
            graphics.fillColor = fallback;
            graphics.fill();
            return;
          }
          if (spec.slice) {
            frame.insetTop = spec.slice.top;
            frame.insetBottom = spec.slice.bottom;
            frame.insetLeft = spec.slice.left;
            frame.insetRight = spec.slice.right;
          }
          var sprite = node.addComponent(Sprite);
          sprite.spriteFrame = frame;
          sprite.type = spec.slice === null ? Sprite.Type.SIMPLE : Sprite.Type.SLICED;
          sprite.sizeMode = Sprite.SizeMode.CUSTOM;
          (_node$getComponent = node.getComponent(UITransform)) == null || _node$getComponent.setContentSize(spec.width, spec.height);
        });
        return node;
      }
      function label(parent, name) {
        var node = new Node(name);
        node.layer = parent.layer;
        var transform = node.addComponent(UITransform);
        transform.setAnchorPoint(0.5, 0.5);
        transform.setContentSize(680, STYLE.hudHeight);
        parent.addChild(node);
        var result = node.addComponent(Label);
        result.fontSize = STYLE.fontPx;
        result.lineHeight = STYLE.fontPx + 4;
        result.color = INK;
        return result;
      }
      function mountLoopView(controller) {
        var parent = controller.ctx.layers.get('trail');
        if (typeof parent.addChild !== 'function') return null;
        var node = child(parent, 'SwordLoop');
        var component = node.addComponent(LoopView);
        component.bind(controller);
        return function () {
          return component.draw();
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/LootFormulas.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports({
        bossCoins: bossCoins,
        coinWaveMultiplier: coinWaveMultiplier,
        normalEnemyCoins: normalEnemyCoins,
        stochasticRound: stochasticRound,
        xpToNext: xpToNext
      });
      cclegacy._RF.push({}, "e01644ubtlPKbKPapkbB/H3", "LootFormulas", undefined);
      /** docs/design/P1-numbers-batch1.md §1.2, L starts at 1. */
      function xpToNext(level, base, linear, quad) {
        var safeLevel = Math.max(1, Math.floor(finiteOr(level, 1)));
        return Math.max(0, Math.round(finiteOr(base, 0) + finiteOr(linear, 0) * safeLevel + finiteOr(quad, 0) * safeLevel * safeLevel));
      }

      /** docs/design/P1-numbers-batch1.md §2.1. Wave is 1-based. */
      function coinWaveMultiplier(wave, coinWaveK) {
        var safeWave = Math.max(1, Math.floor(finiteOr(wave, 1)));
        return Math.max(0, 1 + finiteOr(coinWaveK, 0) * (safeWave - 1));
      }

      /** floor(expected + rngLoot()) keeps the expected value for non-negative amounts. */
      function stochasticRound(expected, rng) {
        var safeExpected = Math.max(0, finiteOr(expected, 0));
        return Math.floor(safeExpected + rng.next());
      }

      /**
       * P1-numbers-batch1 §2.1 / §3.4: 第 5 波 Boss = loot.bossCoin × waveMul.
       * 第 10 波 Boss 不掉铜钱（之后直接结算，铜钱不带出局）.
       */
      function bossCoins(bossCoin, wave, coinWaveK) {
        var safeWave = Math.max(1, Math.floor(finiteOr(wave, 1)));
        if (safeWave >= 10) return 0;
        return Math.round(Math.max(0, finiteOr(bossCoin, 0)) * coinWaveMultiplier(safeWave, coinWaveK));
      }

      /** Normal-enemy coins = spawn points × coinPerCost × wave multiplier. */
      function normalEnemyCoins(spawnCost, wave, coinPerCost, coinWaveK, rng) {
        var expected = Math.max(0, finiteOr(spawnCost, 0)) * Math.max(0, finiteOr(coinPerCost, 0)) * coinWaveMultiplier(wave, coinWaveK);
        return stochasticRound(expected, rng);
      }
      function finiteOr(value, fallback) {
        return Number.isFinite(value) ? value : fallback;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/LootModule.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './SystemOrder.ts', './LootFormulas.ts', './LootParams.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, _createClass, cclegacy, SystemOrder, bossCoins, normalEnemyCoins, xpToNext, LOOT_PARAMS;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      SystemOrder = module.SystemOrder;
    }, function (module) {
      bossCoins = module.bossCoins;
      normalEnemyCoins = module.normalEnemyCoins;
      xpToNext = module.xpToNext;
    }, function (module) {
      LOOT_PARAMS = module.LOOT_PARAMS;
    }],
    execute: function () {
      cclegacy._RF.push({}, "e1576pHVDlEdKvqbYT1sBQ3", "LootModule", undefined);
      var LOOT_SYSTEM_ORDER = SystemOrder.EnemyResolve + 10;
      /**
       * P1-02 wallet, level progress and physical copper-coin pickups.
       * XP is credited directly on `enemy:died`; only copper coins create world drops.
       */
      var LootModule = exports('LootModule', /*#__PURE__*/function () {
        function LootModule(ctx) {
          this.drops = new Map();
          this.coinBalance = 0;
          this.currentLevel = 1;
          this.currentXp = 0;
          this.picks = 0;
          this.wave = 1;
          this.nextDropId = 1;
          this.running = false;
          this.attached = false;
          this.unsubs = [];
          this.ctx = void 0;
          this.ctx = ctx;
        }
        var _proto = LootModule.prototype;
        _proto.install = function install() {
          var _this = this;
          this.ctx.tunables.define(LOOT_PARAMS.filter(function (def) {
            return !_this.ctx.tunables.has(def.key);
          }));
          this.ctx.services.provide('loot', this);
          this.ctx.loop.addSystem({
            id: 'loot.pickup',
            order: LOOT_SYSTEM_ORDER,
            fixedUpdate: function fixedUpdate(dt) {
              return _this.fixedUpdate(dt);
            }
          });
          this.attach();
        };
        _proto.attach = function attach() {
          var _this2 = this;
          if (this.attached) return;
          this.attached = true;
          this.unsubs.push(this.ctx.events.on('session:start', function () {
            _this2.resetRun();
            _this2.running = true;
          }));
          this.unsubs.push(this.ctx.events.on('run:start', function () {
            _this2.resetRun();
            _this2.running = true;
          }));
          this.unsubs.push(this.ctx.events.on('wave:start', function (_ref) {
            var wave = _ref.wave;
            _this2.wave = Math.max(1, Math.floor(wave));
          }));
          this.unsubs.push(this.ctx.events.on('enemy:died', function (_ref2) {
            var kind = _ref2.kind,
              pos = _ref2.pos;
            if (_this2.running) _this2.rewardNormalEnemy(kind, pos);
          }));
          this.unsubs.push(this.ctx.events.on('boss:defeated', function (_ref3) {
            var wave = _ref3.wave,
              pos = _ref3.pos;
            if (_this2.running) _this2.rewardBoss(wave, pos);
          }));
          this.unsubs.push(this.ctx.events.on('wave:clear', function (_ref4) {
            var wave = _ref4.wave;
            if (_this2.running) _this2.settleWaveClear(wave);
          }));
          this.unsubs.push(this.ctx.events.on('run:end', function () {
            return _this2.endRun();
          }));
          this.unsubs.push(this.ctx.events.on('session:end', function () {
            return _this2.endRun();
          }));
        };
        _proto.detach = function detach() {
          if (!this.attached) return;
          this.attached = false;
          for (var _iterator = _createForOfIteratorHelperLoose(this.unsubs), _step; !(_step = _iterator()).done;) {
            var off = _step.value;
            off();
          }
          this.unsubs.length = 0;
        };
        _proto.spendCoins = function spendCoins(amount, reason) {
          // 10/23 MVP scope: copper has exactly two sinks — hammer strikes and
          // level-up pick-3 rerolls. Shelf/rack/shop-reroll reasons stay in the
          // shared P1 contract for their later tasks but cannot spend here yet.
          if (reason !== 'hammer' && reason !== 'upgradeReroll') return false;
          if (!validCoinAmount(amount) || amount > this.coinBalance) return false;
          if (amount === 0) return true;
          this.coinBalance -= amount;
          this.ctx.events.emit('loot:coins', {
            delta: -amount,
            total: this.coinBalance,
            reason: reason
          });
          return true;
        };
        _proto.refundCoins = function refundCoins(amount, reason) {
          if (!validCoinAmount(amount) || amount === 0) return;
          this.coinBalance += amount;
          this.ctx.events.emit('loot:coins', {
            delta: amount,
            total: this.coinBalance,
            reason: reason
          });
        };
        _proto.consumePick = function consumePick() {
          if (this.picks > 0) this.picks -= 1;
          return this.picks;
        };
        _proto.fixedUpdate = function fixedUpdate(dt) {
          if (!this.attached || !this.running || dt <= 0 || !this.ctx.services.has('player')) return;
          var player = this.ctx.services.get('player');
          var radius = this.pickupRadius();
          var travel = this.ctx.tunables.get('loot.magnetSpeed') * dt;
          for (var _iterator2 = _createForOfIteratorHelperLoose(this.drops.values()), _step2; !(_step2 = _iterator2()).done;) {
            var drop = _step2.value;
            var dx = player.pos.x - drop.pos.x;
            var dy = player.pos.y - drop.pos.y;
            var distance = Math.hypot(dx, dy);
            if (!drop.magnetized && distance <= radius) drop.magnetized = true;
            if (!drop.magnetized) continue;
            if (distance <= travel + 1e-9) {
              this.collect(drop);
              continue;
            }
            if (distance > 1e-9) {
              drop.pos.x += dx / distance * travel;
              drop.pos.y += dy / distance * travel;
            }
          }
        }

        /** P1-numbers-batch1 §1.1 `xp.boss` / §2.1 `loot.bossCoin`. Wave 10 grants neither. */;
        _proto.rewardBoss = function rewardBoss(wave, pos) {
          if (wave >= 10) return;
          this.creditXp(this.ctx.tunables.get('xp.boss'));
          var amount = bossCoins(this.ctx.tunables.get('loot.bossCoin'), wave, this.ctx.tunables.get('loot.coinWaveK'));
          if (amount > 0) this.spawnCoins(amount, pos);
        };
        _proto.rewardNormalEnemy = function rewardNormalEnemy(kind, pos) {
          // `bubbleChild.cost` is defined/written by enemy; loot only reads `${kind}.cost`.
          var cost = this.ctx.tunables.get(kind + ".cost");
          this.creditXp(cost * this.ctx.tunables.get('xp.perCost'));
          var amount = normalEnemyCoins(cost, this.currentWave(), this.ctx.tunables.get('loot.coinPerCost'), this.ctx.tunables.get('loot.coinWaveK'), this.ctx.rng.loot);
          if (amount > 0) this.spawnCoins(amount, pos);
        };
        _proto.creditXp = function creditXp(amount) {
          if (!Number.isFinite(amount) || amount <= 0) return;
          this.currentXp += amount;
          var levels = [];
          var threshold = this.threshold(this.currentLevel);
          while (this.currentXp + 1e-9 >= threshold) {
            this.currentXp -= threshold;
            this.currentLevel += 1;
            this.picks += 1;
            threshold = this.threshold(this.currentLevel);
            levels.push({
              level: this.currentLevel,
              xpToNext: threshold,
              pendingPicks: this.picks
            });
          }
          if (Math.abs(this.currentXp) < 1e-9) this.currentXp = 0;
          this.ctx.events.emit('loot:pickup', {
            kind: 'xp',
            amount: amount,
            total: this.currentXp
          });
          for (var _i = 0, _levels = levels; _i < _levels.length; _i++) {
            var level = _levels[_i];
            this.ctx.events.emit('loot:levelUp', level);
          }
        };
        _proto.spawnCoins = function spawnCoins(amount, pos) {
          var drop = {
            id: this.nextDropId++,
            amount: amount,
            pos: {
              x: pos.x,
              y: pos.y
            },
            magnetized: false
          };
          this.drops.set(drop.id, drop);
          this.ctx.events.emit('loot:drop', {
            id: drop.id,
            kind: 'coin',
            amount: drop.amount,
            pos: {
              x: drop.pos.x,
              y: drop.pos.y
            }
          });
        };
        _proto.collect = function collect(drop) {
          if (!this.drops["delete"](drop.id)) return;
          this.coinBalance += drop.amount;
          this.ctx.events.emit('loot:pickup', {
            kind: 'coin',
            amount: drop.amount,
            total: this.coinBalance
          });
          this.ctx.events.emit('loot:coins', {
            delta: drop.amount,
            total: this.coinBalance,
            reason: 'pickup'
          });
        };
        _proto.collectAllCoins = function collectAllCoins() {
          for (var _i2 = 0, _Array$from = Array.from(this.drops.values()); _i2 < _Array$from.length; _i2++) {
            var drop = _Array$from[_i2];
            this.collect(drop);
          }
        }

        /** P1-numbers-batch1 §1.1 / §2.1: door-cleared enemies give half coins and no XP. */;
        _proto.settleWaveClear = function settleWaveClear(wave) {
          var clearMul = this.ctx.tunables.get('loot.clearCoinMul');
          if (clearMul > 0 && this.ctx.services.has('enemies')) {
            var remaining = [];
            this.ctx.services.get('enemies').queryAABB(0, 0, this.ctx.arena.width, this.ctx.arena.height, remaining);
            for (var _i3 = 0, _remaining = remaining; _i3 < _remaining.length; _i3++) {
              var enemy = _remaining[_i3];
              var amount = normalEnemyCoins(this.ctx.tunables.get(enemy.kind + ".cost"), wave, this.ctx.tunables.get('loot.coinPerCost') * clearMul, this.ctx.tunables.get('loot.coinWaveK'), this.ctx.rng.loot);
              if (amount > 0) this.spawnCoins(amount, enemy.pos);
            }
          }
          if (this.ctx.tunables.getBool('loot.autoCollectOnDoor')) this.collectAllCoins();
        }

        /** Upgrade modifiers use effective = base × (1 + add) × mul (core IModifiers). */;
        _proto.pickupRadius = function pickupRadius() {
          var base = this.ctx.tunables.get('loot.pickupRadius');
          if (!this.ctx.services.has('modifiers')) return base;
          var modifiers = this.ctx.services.get('modifiers');
          return Math.max(0, base * (1 + modifiers.add('loot.pickupRadius')) * modifiers.mul('loot.pickupRadius'));
        };
        _proto.currentWave = function currentWave() {
          if (this.ctx.services.has('run')) {
            var serviceWave = this.ctx.services.get('run').wave;
            if (serviceWave > 0) return serviceWave;
          }
          return this.wave;
        };
        _proto.threshold = function threshold(level) {
          return Math.max(1, xpToNext(level, this.ctx.tunables.get('xp.base'), this.ctx.tunables.get('xp.linear'), this.ctx.tunables.get('xp.quad')));
        };
        _proto.resetRun = function resetRun() {
          this.coinBalance = 0;
          this.currentLevel = 1;
          this.currentXp = 0;
          this.picks = 0;
          this.wave = 1;
          this.nextDropId = 1;
          this.drops.clear();
        };
        _proto.endRun = function endRun() {
          this.running = false;
          this.coinBalance = 0;
          this.drops.clear();
        };
        _createClass(LootModule, [{
          key: "coins",
          get: function get() {
            return this.coinBalance;
          }
        }, {
          key: "level",
          get: function get() {
            return this.currentLevel;
          }
        }, {
          key: "xp",
          get: function get() {
            return this.currentXp;
          }
        }, {
          key: "xpToNext",
          get: function get() {
            return this.threshold(this.currentLevel);
          }
        }, {
          key: "pendingPicks",
          get: function get() {
            return this.picks;
          }
        }]);
        return LootModule;
      }());
      function validCoinAmount(amount) {
        return Number.isFinite(amount) && Number.isInteger(amount) && amount >= 0;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/LootParams.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "814ff+sM1VJo5RjEoNtggaW", "LootParams", undefined);
      /** P1-numbers-batch1 §1–§2. Every 【提案】【待试玩】 value stays live in the tuning panel. */
      var LOOT_PARAMS = exports('LOOT_PARAMS', [numberParam('xp.perCost', '经验', '每刷怪点经验', 1, 0.2, 3), numberParam('xp.eliteMul', '经验', '精英经验倍率', 4, 1, 10), numberParam('xp.surgeMul', '经验', '狂潮经验倍率', 2, 1, 5), numberParam('xp.boss', '经验', '第5波Boss经验', 20, 0, 100, 1), numberParam('xp.tutorialMul', '经验', '新手局经验倍率', 1, 0.5, 2), numberParam('xp.base', '经验', '升级基础经验', 10, 0, 50, 1), numberParam('xp.linear', '经验', '升级线性系数', 4, 0, 20), numberParam('xp.quad', '经验', '升级二次系数', 0.3, 0, 2), numberParam('xp.maxPicksPerWave', '经验', '每波最多连选', 3, 1, 6, 1), numberParam('loot.coinPerCost', '掉落', '每刷怪点铜钱', 0.4, 0.1, 2), numberParam('loot.coinWaveK', '掉落', '每波铜钱增长', 0.05, 0, 0.2), numberParam('loot.eliteCoin', '掉落', '精英基础铜钱', 6, 0, 30, 1), numberParam('loot.surgeCoinMul', '掉落', '狂潮铜钱倍率', 2, 1, 5), numberParam('loot.bossCoin', '掉落', '第5波Boss铜钱', 25, 0, 100, 1), numberParam('loot.pickupRadius', '掉落', '铜钱吸附半径(u)', 1.2, 0.3, 4), numberParam('loot.magnetSpeed', '掉落', '铜钱吸附速度(u/s)', 12, 4, 30), numberParam('loot.mergeAt', '掉落', '大铜钱显示阈值', 5, 1, 20, 1), {
        key: 'loot.autoCollectOnDoor',
        group: '掉落',
        label: '进炉门自动收集',
        kind: 'bool',
        "default": 1,
        note: 'P1-numbers-batch1 §2.1：进炉门时剩余铜钱全部收集'
      }, numberParam('loot.clearCoinMul', '掉落', '清场铜钱倍率', 0.5, 0, 1)]);
      function numberParam(key, group, label, value, min, max, step) {
        if (step === void 0) {
          step = 0.05;
        }
        return {
          key: key,
          group: group,
          label: label,
          kind: 'number',
          "default": value,
          min: min,
          max: max,
          step: step
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/LootView.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './ScreenLayout.ts', './HudArt2.ts'], function (exports) {
  var _inheritsLoose, _createForOfIteratorHelperLoose, cclegacy, Color, Graphics, Label, UITransform, view, _decorator, Node, resources, SpriteFrame, Sprite, Component, layoutScreen, LOOT_HUD_LAYOUT, hudFillWidth, hudFillRect, hudDesignToLocal, LOOT_HUD_ART;
  return {
    setters: [function (module) {
      _inheritsLoose = module.inheritsLoose;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
      Color = module.Color;
      Graphics = module.Graphics;
      Label = module.Label;
      UITransform = module.UITransform;
      view = module.view;
      _decorator = module._decorator;
      Node = module.Node;
      resources = module.resources;
      SpriteFrame = module.SpriteFrame;
      Sprite = module.Sprite;
      Component = module.Component;
    }, function (module) {
      layoutScreen = module.layoutScreen;
    }, function (module) {
      LOOT_HUD_LAYOUT = module.LOOT_HUD_LAYOUT;
      hudFillWidth = module.hudFillWidth;
      hudFillRect = module.hudFillRect;
      hudDesignToLocal = module.hudDesignToLocal;
      LOOT_HUD_ART = module.LOOT_HUD_ART;
    }],
    execute: function () {
      exports('mountLootView', mountLootView);
      cclegacy._RF.push({}, "646b0RcpHxHcYOqJgSYdlk4", "LootView", undefined);
      var COPPER = new Color(205, 126, 62, 255);
      var COPPER_LIT = new Color(255, 195, 96, 255);
      var BONE = new Color(232, 224, 206, 255);
      var INK = new Color(44, 30, 20, 255);
      var XP_FRAME = new Color(92, 70, 48, 255);
      var XP_FILL = new Color(168, 176, 72, 255);

      /** Runtime-created P1 gray box: copper sparks in-world plus a compact wallet/XP readout. */
      var LootGreyboxView = exports('LootGreyboxView', /*#__PURE__*/function (_Component) {
        _inheritsLoose(LootGreyboxView, _Component);
        function LootGreyboxView() {
          var _this;
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          _this = _Component.call.apply(_Component, [this].concat(args)) || this;
          _this.ctx = null;
          _this.module = null;
          _this.graphics = null;
          _this.artNode = null;
          _this.xpFill = null;
          _this.hudNode = null;
          _this.hud = null;
          _this.coinNode = null;
          _this.coinLabel = null;
          return _this;
        }
        var _proto = LootGreyboxView.prototype;
        _proto.configure = function configure(ctx, module) {
          this.ctx = ctx;
          this.module = module;
          this.graphics = this.node.addComponent(Graphics);
          var hudLayer = ctx.layers.get('hud');
          this.artNode = makeNode(hudLayer, 'LootHUDArt');
          makeHudSprite(this.artNode, 'XpFrame', LOOT_HUD_ART.xpFrame, XP_FRAME);
          this.xpFill = makeHudSprite(this.artNode, 'XpFill', LOOT_HUD_ART.xpFill, XP_FILL);
          makeHudSprite(this.artNode, 'Coin', LOOT_HUD_ART.coin, COPPER);
          this.hudNode = makeNode(this.artNode, 'LootHUD');
          this.hud = this.hudNode.addComponent(Label);
          if (this.hud) {
            this.hud.fontSize = 16;
            this.hud.lineHeight = 20;
            this.hud.color = BONE;
            this.hud.enableOutline = true;
            this.hud.outlineColor = INK;
            this.hud.outlineWidth = 2;
            this.hud.overflow = Label.Overflow.SHRINK;
            this.hud.horizontalAlign = Label.HorizontalAlign.CENTER;
            this.hud.verticalAlign = Label.VerticalAlign.CENTER;
            var transform = this.hud.node.getComponent(UITransform);
            transform == null || transform.setContentSize(LOOT_HUD_LAYOUT.xpText.width, LOOT_HUD_LAYOUT.xpText.height);
            transform == null || transform.setAnchorPoint(0.5, 0.5);
          }
          this.coinNode = makeNode(hudLayer, 'LootCoin');
          this.coinLabel = this.coinNode.addComponent(Label);
          if (this.coinLabel) {
            this.coinLabel.fontSize = 22;
            this.coinLabel.lineHeight = 26;
            this.coinLabel.color = BONE;
            this.coinLabel.enableOutline = true;
            this.coinLabel.outlineColor = INK;
            this.coinLabel.outlineWidth = 2;
            this.coinLabel.overflow = Label.Overflow.SHRINK;
            this.coinLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
            this.coinLabel.verticalAlign = Label.VerticalAlign.CENTER;
            var _transform = this.coinNode.getComponent(UITransform);
            _transform == null || _transform.setContentSize(LOOT_HUD_LAYOUT.coinText.width, LOOT_HUD_LAYOUT.coinText.height);
            _transform == null || _transform.setAnchorPoint(0.5, 0.5);
          }
        };
        _proto.onEnable = function onEnable() {
          var _this$module;
          (_this$module = this.module) == null || _this$module.attach();
          if (this.artNode) this.artNode.active = true;
          if (this.hudNode) this.hudNode.active = true;
          if (this.coinNode) this.coinNode.active = true;
        };
        _proto.onDisable = function onDisable() {
          var _this$module2;
          (_this$module2 = this.module) == null || _this$module2.detach();
          if (this.artNode) this.artNode.active = false;
          if (this.hudNode) this.hudNode.active = false;
          if (this.coinNode) this.coinNode.active = false;
        };
        _proto.onDestroy = function onDestroy() {
          var _this$module3, _this$artNode, _this$coinNode;
          (_this$module3 = this.module) == null || _this$module3.detach();
          (_this$artNode = this.artNode) == null || _this$artNode.destroy();
          (_this$coinNode = this.coinNode) == null || _this$coinNode.destroy();
          this.ctx = null;
          this.module = null;
        };
        _proto.update = function update() {
          var ctx = this.ctx;
          var module = this.module;
          var graphics = this.graphics;
          if (!ctx || !module || !graphics) return;
          graphics.clear();
          var origin = ctx.toPx({
            x: 0,
            y: 0
          });
          var unit = Math.abs(ctx.toPx({
            x: 1,
            y: 0
          }).x - origin.x);
          var mergeAt = ctx.tunables.get('loot.mergeAt');
          for (var _iterator = _createForOfIteratorHelperLoose(module.drops.values()), _step; !(_step = _iterator()).done;) {
            var drop = _step.value;
            var p = ctx.toPx(drop.pos);
            var radius = unit * (drop.amount >= mergeAt ? 0.16 : 0.11);
            graphics.fillColor = drop.magnetized ? COPPER_LIT : COPPER;
            graphics.circle(p.x, p.y, radius);
            graphics.fill();
            graphics.strokeColor = COPPER_LIT;
            graphics.lineWidth = Math.max(1, radius * 0.18);
            graphics.moveTo(p.x - radius * 1.7, p.y);
            graphics.lineTo(p.x + radius * 1.7, p.y);
            graphics.moveTo(p.x, p.y - radius * 1.7);
            graphics.lineTo(p.x, p.y + radius * 1.7);
            graphics.stroke();
          }
          var showHud = ctx.services.has('run') === false || ctx.services.get('run').combatActive;
          if (this.artNode) this.artNode.active = showHud;
          if (this.hudNode) this.hudNode.active = showHud;
          if (this.coinNode) this.coinNode.active = showHud;
          if (showHud) {
            var size = view.getVisibleSize();
            var hud = layoutScreen(size.width, size.height).hud;
            placeHudChild(this.artNode, 'XpFrame', LOOT_HUD_LAYOUT.xpFrame, size, hud);
            placeHudChild(this.artNode, 'Coin', LOOT_HUD_LAYOUT.coin, size, hud);
            var ratio = module.xpToNext > 0 ? module.xp / module.xpToNext : 0;
            var fillW = hudFillWidth(LOOT_HUD_LAYOUT.xpFill.width, ratio, LOOT_HUD_LAYOUT.xpFillMin);
            resizeHudFill(this.xpFill, hudFillRect(LOOT_HUD_LAYOUT.xpFill, fillW), size, hud, XP_FILL);
            if (this.hud) {
              this.hud.string = "Lv." + module.level + "  XP " + format(module.xp) + "/" + module.xpToNext;
              var xpPos = hudDesignToLocal(LOOT_HUD_LAYOUT.xpText, size.width, size.height, hud);
              this.hud.node.setPosition(xpPos.x, xpPos.y, 0);
            }
            if (this.coinLabel) {
              this.coinLabel.string = "\u94DC\u94B1 " + module.coins;
              var coinPos = hudDesignToLocal(LOOT_HUD_LAYOUT.coinText, size.width, size.height, hud);
              this.coinLabel.node.setPosition(coinPos.x, coinPos.y, 0);
            }
          }
        };
        return LootGreyboxView;
      }(Component));
      _decorator.ccclass('LootGreyboxView')(LootGreyboxView);
      function makeNode(parent, name) {
        var node = new Node(name);
        node.layer = parent.layer;
        node.addComponent(UITransform);
        parent.addChild(node);
        return node;
      }
      function makeHudSprite(parent, name, spec, fallback) {
        var _node$getComponent;
        var node = makeNode(parent, name);
        (_node$getComponent = node.getComponent(UITransform)) == null || _node$getComponent.setContentSize(spec.width, spec.height);
        resources.load(spec.path + "/spriteFrame", SpriteFrame, function (error, frame) {
          var _node$getComponent2;
          if (node.isValid === false) return;
          if (error || !frame) {
            var graphics = node.addComponent(Graphics);
            graphics.rect(-spec.width / 2, -spec.height / 2, spec.width, spec.height);
            graphics.fillColor = fallback;
            graphics.fill();
            return;
          }
          if (spec.slice) {
            frame.insetTop = spec.slice.top;
            frame.insetBottom = spec.slice.bottom;
            frame.insetLeft = spec.slice.left;
            frame.insetRight = spec.slice.right;
          }
          var sprite = node.addComponent(Sprite);
          sprite.spriteFrame = frame;
          sprite.type = spec.slice === null ? Sprite.Type.SIMPLE : Sprite.Type.SLICED;
          sprite.sizeMode = Sprite.SizeMode.CUSTOM;
          (_node$getComponent2 = node.getComponent(UITransform)) == null || _node$getComponent2.setContentSize(spec.width, spec.height);
        });
        return node;
      }
      function placeHudChild(parent, name, rect, size, hud) {
        var _child$getComponent;
        if (!parent) return;
        var child = parent.getChildByName(name);
        if (!child) return;
        var pos = hudDesignToLocal(rect, size.width, size.height, hud);
        child.setPosition(pos.x, pos.y, 0);
        (_child$getComponent = child.getComponent(UITransform)) == null || _child$getComponent.setContentSize(rect.width, rect.height);
      }
      function resizeHudFill(node, rect, size, hud, fallback) {
        var _node$getComponent3;
        if (!node) return;
        node.active = rect.width > 0;
        if (rect.width <= 0) return;
        var pos = hudDesignToLocal(rect, size.width, size.height, hud);
        node.setPosition(pos.x, pos.y, 0);
        (_node$getComponent3 = node.getComponent(UITransform)) == null || _node$getComponent3.setContentSize(rect.width, rect.height);
        var graphics = node.getComponent(Graphics);
        if (graphics) {
          graphics.clear();
          graphics.rect(-rect.width / 2, -rect.height / 2, rect.width, rect.height);
          graphics.fillColor = fallback;
          graphics.fill();
        }
      }
      function format(value) {
        return String(Math.round(value * 10) / 10);
      }
      function mountLootView(ctx, module) {
        var parent = ctx.layers.get('fx');
        if (typeof parent.addChild !== 'function') return;
        var node = makeNode(parent, 'LootGreybox');
        var component = node.addComponent(LootGreyboxView);
        component == null || component.configure(ctx, module);
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/LotsTube.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './ForgeParams.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, _createClass, cclegacy, FORGE_RESULTS;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      FORGE_RESULTS = module.FORGE_RESULTS;
    }],
    execute: function () {
      exports({
        emptyCounts: emptyCounts,
        pityEligible: pityEligible
      });
      cclegacy._RF.push({}, "2d163s5NJ1ELrOswf5dCfye", "LotsTube", undefined);
      function emptyCounts() {
        return {
          greatSuccess: 0,
          success: 0,
          hold: 0,
          damage: 0,
          shatter: 0
        };
      }

      /** Results that the GDD §9.5 保底 still allows once the damage streak is full. */
      function pityEligible(result) {
        return result === 'greatSuccess' || result === 'success' || result === 'hold';
      }

      /**
       * One public tube (docs/design/GDD.md §9.3: 20 支签，全部公开显示，每抽一支少一支).
       * Lots are laid out grouped by result, best first, so the table reads the same
       * as the composition. Building a tube uses no randomness; draws pick a uniform
       * index among the lots still in the tube.
       */
      var LotsTube = exports('LotsTube', /*#__PURE__*/function () {
        function LotsTube(kind, tier, lots, shatterSwapped) {
          this.kind = void 0;
          /** GDD §9.3 tier row; -1 for tutorial tubes. */
          this.tier = void 0;
          /** Tutorial run: shatter lots were replaced by hold lots (GDD §5.5, §9.3). */
          this.shatterSwapped = void 0;
          this.lots = void 0;
          this.kind = kind;
          this.tier = tier;
          this.lots = lots;
          this.shatterSwapped = shatterSwapped;
        }
        LotsTube.fromCounts = function fromCounts(kind, tier, counts, shatterSwapped, highlight) {
          var lots = [];
          for (var _iterator = _createForOfIteratorHelperLoose(FORGE_RESULTS), _step; !(_step = _iterator()).done;) {
            var result = _step.value;
            var n = Math.max(0, Math.floor(counts[result]));
            for (var i = 0; i < n; i++) lots.push({
              result: result,
              pinned: false,
              highlight: result === highlight,
              drawn: false
            });
          }
          return new LotsTube(kind, tier, lots, shatterSwapped);
        }

        /** GDD §9.3 教学签筒 I: pinned 教学签 on top, then 4 大成功 and 15 成功. */;
        LotsTube.tutorialI = function tutorialI(greatExtra, success) {
          var lots = [{
            result: 'greatSuccess',
            pinned: true,
            highlight: true,
            drawn: false
          }];
          for (var i = 0; i < greatExtra; i++) lots.push({
            result: 'greatSuccess',
            pinned: false,
            highlight: false,
            drawn: false
          });
          for (var _i = 0; _i < success; _i++) lots.push({
            result: 'success',
            pinned: false,
            highlight: false,
            drawn: false
          });
          return new LotsTube('tutorialI', -1, lots, false);
        };
        var _proto = LotsTube.prototype;
        _proto.remainingTotal = function remainingTotal() {
          var n = 0;
          for (var _iterator2 = _createForOfIteratorHelperLoose(this.lots), _step2; !(_step2 = _iterator2()).done;) {
            var lot = _step2.value;
            if (!lot.drawn) n += 1;
          }
          return n;
        };
        _proto.remaining = function remaining() {
          var counts = emptyCounts();
          for (var _iterator3 = _createForOfIteratorHelperLoose(this.lots), _step3; !(_step3 = _iterator3()).done;) {
            var lot = _step3.value;
            if (!lot.drawn) counts[lot.result] += 1;
          }
          return counts;
        }

        /** Index of the pinned 教学签 while it is still in the tube, else -1. */;
        _proto.pinnedIndex = function pinnedIndex() {
          for (var i = 0; i < this.lots.length; i++) {
            if (this.lots[i].pinned && !this.lots[i].drawn) return i;
          }
          return -1;
        }

        /** Indices of undrawn lots, optionally only those 保底 allows. */;
        _proto.live = function live(onlyEligible) {
          var out = [];
          for (var i = 0; i < this.lots.length; i++) {
            var lot = this.lots[i];
            if (lot.drawn) continue;
            if (onlyEligible && !pityEligible(lot.result)) continue;
            out.push(i);
          }
          return out;
        };
        _createClass(LotsTube, [{
          key: "size",
          get: function get() {
            return this.lots.length;
          }
        }]);
        return LotsTube;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/LotsView.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './ForgeParams.ts', './HelpText.ts', './ForgeArt.ts', './Gray.ts'], function (exports) {
  var _inheritsLoose, _createForOfIteratorHelperLoose, cclegacy, Color, _decorator, input, Input, KeyCode, view, UITransform, Component, FORGE_RESULTS, SWORD_NAMES, tubeTitle, RESULT_NAMES, percent, paginate, lotsHelpText, FORGE_LAYOUT, SLIP_ART, cover, button, text, MUTED, HIGHLIGHT, BONE, box, artBox, INK, artButton;
  return {
    setters: [function (module) {
      _inheritsLoose = module.inheritsLoose;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
      Color = module.Color;
      _decorator = module._decorator;
      input = module.input;
      Input = module.Input;
      KeyCode = module.KeyCode;
      view = module.view;
      UITransform = module.UITransform;
      Component = module.Component;
    }, function (module) {
      FORGE_RESULTS = module.FORGE_RESULTS;
    }, function (module) {
      SWORD_NAMES = module.SWORD_NAMES;
      tubeTitle = module.tubeTitle;
      RESULT_NAMES = module.RESULT_NAMES;
      percent = module.percent;
      paginate = module.paginate;
      lotsHelpText = module.lotsHelpText;
    }, function (module) {
      FORGE_LAYOUT = module.FORGE_LAYOUT;
      SLIP_ART = module.SLIP_ART;
    }, function (module) {
      cover = module.cover;
      button = module.button;
      text = module.text;
      MUTED = module.MUTED;
      HIGHLIGHT = module.HIGHLIGHT;
      BONE = module.BONE;
      box = module.box;
      artBox = module.artBox;
      INK = module.INK;
      artButton = module.artButton;
    }],
    execute: function () {
      exports('mountLotsView', mountLotsView);
      cclegacy._RF.push({}, "693e8s7KgJOhrsEOwF27wlq", "LotsView", undefined);

      /** UI batch5 颜色变量表 lot.*; 大成功 is batch6 §2 鞭炮橙金 #EAA834 (【待美术定】). */
      var LOT_COLORS = {
        greatSuccess: new Color(234, 168, 52),
        success: new Color(106, 146, 60),
        hold: new Color(204, 194, 168),
        damage: new Color(172, 116, 50),
        shatter: new Color(56, 50, 48)
      };
      var LEVEL_DELTA = {
        greatSuccess: '+2',
        success: '+1',
        hold: '±0',
        damage: '−1',
        shatter: '碎'
      };
      /** UI batch5 动效 #2: 0.6 s shake around the tube base, 6 segments of 0.1 s. */
      var SHAKE_KEYS = [0, -8, 7, -6, 5, -3, 0];
      var SHAKE_SEGMENT = 0.1;
      var HELP_CHARS_PER_LINE = 30;
      var HELP_LINES_PER_PAGE = 36;
      function lotText(result) {
        return result === 'hold' || result === 'greatSuccess' ? INK : BONE;
      }
      function vertical(s) {
        return s.split('').join('\n');
      }
      function num(v) {
        return String(Math.round(v * 100) / 100);
      }
      function affixName(a, ctx) {
        return a === 'W' ? "\u5251\u91CD +" + num(ctx.tunables.get('forge.affixW')) : "\u5251\u957F +" + num(ctx.tunables.get('forge.affixLg'));
      }

      /** Drives `LotsView` from the engine without a scene or prefab component. */
      var ForgeLotsLifecycle = exports('ForgeLotsLifecycle', /*#__PURE__*/function (_Component) {
        _inheritsLoose(ForgeLotsLifecycle, _Component);
        function ForgeLotsLifecycle() {
          var _this;
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          _this = _Component.call.apply(_Component, [this].concat(args)) || this;
          _this.owner = null;
          return _this;
        }
        var _proto = ForgeLotsLifecycle.prototype;
        _proto.update = function update(dt) {
          var _this$owner;
          (_this$owner = this.owner) == null || _this$owner.update(dt);
        };
        _proto.onDestroy = function onDestroy() {
          var _this$owner2;
          (_this$owner2 = this.owner) == null || _this$owner2.dispose();
          this.owner = null;
        };
        return ForgeLotsLifecycle;
      }(Component));
      _decorator.ccclass('ForgeLotsLifecycle')(ForgeLotsLifecycle);
      function mountLotsView(ctx, module) {
        var parent = ctx.layers.get('hud');
        // Pure test harnesses pass opaque layer handles instead of Cocos nodes.
        if (typeof parent.addChild !== 'function') return;
        var lotsView = new LotsView(ctx, module, parent);
        lotsView.root.addComponent(ForgeLotsLifecycle).owner = lotsView;
      }

      /**
       * Gray-box S10 签筒 + S11 规则帮助页 + S12 碎裂二选一 (docs/design/UI-requirements.md §3,
       * §6.1–§6.2; docs/ui/batch5/README.md B layout; docs/design/P1-tasks.md P1-04).
       * No wheel, reels, lever or rolling numbers; the drawn lot shows its real result
       * at once. No ad entry and no bag entry on these pages.
       */
      var LotsView = exports('LotsView', /*#__PURE__*/function () {
        function LotsView(ctx, module, parent) {
          var _this2 = this;
          this.root = void 0;
          this.ctx = void 0;
          this.module = void 0;
          this.unsubs = [];
          this.cylinder = null;
          this.coinsLabel = null;
          this.shakeT = -1;
          this.pending = null;
          this.last = null;
          this.notice = '';
          this.help = false;
          this.helpPage = 0;
          this.shatterStep = {
            kind: 'choose'
          };
          this.ctx = ctx;
          this.module = module;
          this.root = box(parent, 'ForgeLots', 0, 0, 0, 0);
          this.root.active = false;
          this.unsubs.push(module.onOpenChange(function (open) {
            return _this2.setOpen(open);
          }));
          this.unsubs.push(ctx.events.on('loot:coins', function () {
            return _this2.refreshCoins();
          }));
          this.unsubs.push(ctx.events.on('run:start', function () {
            return _this2.renderIfIdle();
          }));
          this.unsubs.push(ctx.events.on('tuning:changed', function (p) {
            if (p.key.indexOf('forge.') === 0) _this2.renderIfIdle();
          }));
          input.on(Input.EventType.KEY_DOWN, this.onKey, this);
        }
        var _proto2 = LotsView.prototype;
        _proto2.dispose = function dispose() {
          for (var _iterator = _createForOfIteratorHelperLoose(this.unsubs), _step; !(_step = _iterator()).done;) {
            var off = _step.value;
            off();
          }
          this.unsubs.length = 0;
          input.off(Input.EventType.KEY_DOWN, this.onKey, this);
        };
        _proto2.update = function update(dt) {
          if (this.shakeT < 0) return;
          this.shakeT += dt;
          var seg = Math.min(SHAKE_KEYS.length - 2, Math.floor(this.shakeT / SHAKE_SEGMENT));
          var t = Math.min(1, (this.shakeT - seg * SHAKE_SEGMENT) / SHAKE_SEGMENT);
          var eased = 0.5 - 0.5 * Math.cos(Math.PI * t);
          if (this.cylinder) {
            this.cylinder.angle = SHAKE_KEYS[seg] + (SHAKE_KEYS[seg + 1] - SHAKE_KEYS[seg]) * eased;
            this.cylinder.setPosition(FORGE_LAYOUT.cylinder.x, FORGE_LAYOUT.cylinder.y + Math.sin(this.shakeT * 60) * 3, 0);
          }
          if (this.shakeT >= SHAKE_SEGMENT * (SHAKE_KEYS.length - 1)) this.reveal();
        };
        _proto2.onKey = function onKey(e) {
          if (e.keyCode === KeyCode.KEY_F) this.module.toggleSandbox();
        };
        _proto2.setOpen = function setOpen(open) {
          this.shakeT = -1;
          this.pending = null;
          this.last = null;
          this.notice = '';
          this.help = false;
          this.shatterStep = {
            kind: 'choose'
          };
          this.root.active = open;
          if (open) this.render();
        };
        _proto2.renderIfIdle = function renderIfIdle() {
          if (this.root.active && this.shakeT < 0) this.render();
        };
        _proto2.refreshCoins = function refreshCoins() {
          if (!this.root.active) return;
          if (this.shakeT >= 0) {
            if (this.coinsLabel) this.coinsLabel.string = this.coinsText();
            return;
          }
          this.render();
        };
        _proto2.coinsText = function coinsText() {
          var coins = this.module.coins();
          return coins === null ? '铜钱 —' : "\u94DC\u94B1 " + coins;
        };
        _proto2.strike = function strike() {
          if (this.shakeT >= 0) return;
          var outcome = this.module.anvil.strike();
          if (!outcome.ok) {
            this.notice = outcome.reason === 'coins' ? '铜钱不够落这一锤' : '先完成碎裂二选一';
            this.render();
            return;
          }
          this.pending = outcome;
          this.shakeT = 0;
          // Input stays blocked until the lot is out; the table updates on reveal (UI batch5 动效 #1–#5).
          var size = view.getVisibleSize();
          cover(this.root, 'Busy', size.width, size.height, new Color(0, 0, 0, 0));
          if (this.coinsLabel) this.coinsLabel.string = this.coinsText();
        };
        _proto2.reveal = function reveal() {
          this.shakeT = -1;
          this.last = this.pending;
          this.pending = null;
          var last = this.last;
          this.notice = '';
          if (last && last.ok) {
            if (last.tubeChange === 'reshuffle') this.notice = '已重新洗签';
            if (last.tubeChange === 'rebuild') this.notice = '签筒已按新档位重建';
          }
          this.shatterStep = {
            kind: 'choose'
          };
          this.render();
        };
        _proto2.clear = function clear() {
          var old = this.root.children.slice();
          this.root.removeAllChildren();
          for (var _iterator2 = _createForOfIteratorHelperLoose(old), _step2; !(_step2 = _iterator2()).done;) {
            var node = _step2.value;
            node.destroy();
          }
          this.cylinder = null;
          this.coinsLabel = null;
        };
        _proto2.render = function render() {
          var _this3 = this,
            _cylinder$getComponen;
          this.clear();
          var anvil = this.module.anvil;
          var tube = anvil.lots();
          var tv = anvil.tube;
          var sword = anvil.sword;
          var swordName = SWORD_NAMES[anvil.swordOrigin];
          var odds = anvil.lotOdds();
          var resultOdds = anvil.resultOdds();
          var size = view.getVisibleSize();
          var root = this.root;
          var shattered = anvil.pendingShatter !== null;
          var last = this.last && this.last.ok ? this.last : null;
          cover(root, 'Background', size.width, size.height, new Color(40, 30, 24, 252));

          // Top bar (batch5 B: 返回 / 标题牌 / 铜钱).
          button(root, this.module.inRun ? '‹ 去下一波' : '‹ 返回', -264, 588, 160, 60, function () {
            return _this3.module.leave();
          }, this.module.canLeave(), 22);
          text(root, tubeTitle(tv), 0, 602, 320, 34, 24);
          text(root, swordName + " +" + sword.level + " \xB7 \u5251\u91CD " + num(sword.W) + " \xB7 \u5251\u957F " + num(sword.Lg), 0, 570, 340, 24, 17, MUTED);
          this.coinsLabel = text(root, this.coinsText(), 205, 588, 110, 36, 22);

          // Rules bar; 新手局 labels sit here (UI §6.1: 新手局三条例外必须在签筒界面上明确标注).
          var rules = [tube.size + " \u652F\u7B7E\u5168\u90E8\u516C\u5F00 \xB7 \u7B52\u5185\u5269 " + tube.remainingTotal() + " \u652F \xB7 \u62BD\u7A7A\u91CD\u65B0\u6D17"];
          if (tv.shatterSwapped) rules.push('新手局：碎裂签已换成维持签');
          if (tv.kind === 'tutorialI') rules.push('新手局第 1 锤：置顶教学签必出');
          if (tv.kind === 'tutorialII') rules.push('新手局第 2 锤：高亮的是损伤签');
          if (this.notice) rules.push(this.notice);
          text(root, rules.join(' · '), 0, 518, 690, 30, 17, this.notice ? HIGHLIGHT : BONE);

          // Lot table: every lot face up with its result and its chance on the next strike.
          box(root, 'LotTable', 0, 245, 688, 506, new Color(70, 52, 38));
          var n = tube.size;
          var cols = Math.max(10, Math.ceil(n / 2));
          var pitch = 624 / cols;
          var lotW = FORGE_LAYOUT.slip.width;
          var lotH = FORGE_LAYOUT.slip.height;
          var marks = [];
          for (var i = 0; i < n; i++) {
            var _FORGE_LAYOUT$slipRow;
            var lot = tube.lots[i];
            var column = i % cols;
            var layoutX = FORGE_LAYOUT.slipX[column];
            var x = cols === 10 && layoutX !== undefined ? layoutX : -((cols - 1) * pitch) / 2 + column * pitch;
            var row = Math.floor(i / cols);
            var y = (_FORGE_LAYOUT$slipRow = FORGE_LAYOUT.slipRowsY[row]) != null ? _FORGE_LAYOUT$slipRow : row === 0 ? 360 : 130;
            var node = artBox(root, 'Lot', x, y, lotW, lotH, SLIP_ART[lot.result], LOT_COLORS[lot.result]);
            var ink = lotText(lot.result);
            text(node, vertical(RESULT_NAMES[lot.result]), 0, 10, lotW, 110, lot.result === 'greatSuccess' ? 20 : 22, ink);
            var weight = odds[i] > 0 ? "1/" + odds[i] : '0';
            if (lot.pinned && odds[i] === 1) weight = '必出';
            if (lot.drawn) {
              artBox(node, 'Drawn', 0, 0, lotW, lotH, 'slipDrawn', new Color(16, 12, 10, 180), MUTED);
              weight = '已抽';
            }
            text(node, weight, 0, -92, lotW + 10, 26, 16, lot.drawn ? BONE : ink);
            if (lot.pinned && !lot.drawn) marks.push({
              x: x,
              y: y,
              tag: "\u6559\u5B66\u7B7E \xB7 \u5927\u6210\u529F " + affixName('Lg', this.ctx)
            });else if (lot.highlight && !lot.drawn) marks.push({
              x: x,
              y: y,
              tag: '损伤签'
            });
            if (last && last.tubeChange === 'none' && last.lotIndex === i) marks.push({
              x: x,
              y: y,
              tag: '刚抽出'
            });
          }
          // Highlights after every lot so a neighbour never covers the outline (batch5 B).
          for (var _i = 0, _marks = marks; _i < _marks.length; _i++) {
            var m = _marks[_i];
            artBox(root, 'Highlight', m.x, m.y, lotW, lotH, 'slipHighlight', undefined, HIGHLIGHT);
            // Tags go above the first row and below the second, so they never cover a weight label.
            text(root, m.tag, Math.max(-250, Math.min(250, m.x)), m.y > 245 ? m.y + 126 : m.y - 124, 220, 22, 16, HIGHLIGHT);
          }

          // Result chips: remaining count and real next-strike chance, always visible (GDD §9.5).
          for (var j = 0; j < FORGE_RESULTS.length; j++) {
            var r = FORGE_RESULTS[j];
            var chip = artBox(root, 'Chip', FORGE_LAYOUT.chip.x + 139 * j, FORGE_LAYOUT.chip.y, FORGE_LAYOUT.chip.width, FORGE_LAYOUT.chip.height, 'chip', new Color(60, 45, 34));
            box(chip, 'Dot', -50, 13, 16, 16, LOT_COLORS[r], BONE);
            text(chip, RESULT_NAMES[r], 10, 13, 90, 26, 20);
            text(chip, tv.remaining[r] + "\u652F \xB7 " + percent(resultOdds[r]), 0, -15, 128, 22, 17, MUTED);
          }

          // Tube: neutral tails only; nothing on it hints at a result.
          var cylinder = artBox(root, 'Cylinder', FORGE_LAYOUT.cylinder.x, FORGE_LAYOUT.cylinder.y, FORGE_LAYOUT.cylinder.width, FORGE_LAYOUT.cylinder.height, 'cylinder', new Color(58, 44, 34), new Color(30, 22, 16));
          (_cylinder$getComponen = cylinder.getComponent(UITransform)) == null || _cylinder$getComponen.setAnchorPoint(0.5, FORGE_LAYOUT.cylinderAnchorY);
          this.cylinder = cylinder;

          // Price panel, or the result of the last strike.
          var cost = anvil.hammerCost;
          if (last) {
            var lines = ['本锤结果', "\u3010" + RESULT_NAMES[last.result] + " " + LEVEL_DELTA[last.result] + "\u3011", last.result === 'shatter' ? swordName + " +" + last.levelBefore + " \u788E\u4E86" : swordName + " +" + last.levelBefore + " \u2192 +" + last.levelAfter];
            if (last.affix) lines.push("\u8BCD\u6761 " + affixName(last.affix, this.ctx));
            if (last.result === 'greatSuccess' && this.ctx.tunables.get('forge.splashCount') > 0) {
              lines.push("\u6E85\u51FA " + num(this.ctx.tunables.get('forge.splashCount')) + " \u628A +" + num(this.ctx.tunables.get('forge.splashGrade')) + " \u94FE\u5251");
            }
            if (!last.drawn) lines.push('保底：没有合格的签，判维持，未耗签');else if (last.pity) lines.push('保底：放回重抽');
            lines.push("\u4E0B\u4E00\u9524 \u25CF" + cost);
            var panel = box(root, 'ResultPanel', -242, -244, 200, 216, new Color(236, 224, 198));
            box(panel, 'Dot', -78, 66, 18, 18, LOT_COLORS[last.result], INK);
            text(panel, lines.join('\n'), 0, 0, 188, 206, 17, INK);
          } else {
            var _panel = box(root, 'PricePanel', -242, -243, 200, 186, new Color(236, 224, 198));
            text(_panel, '本锤价格', 0, 64, 180, 28, 20, INK);
            text(_panel, "\u25CF" + cost, 0, 22, 180, 44, 34, INK);
            text(_panel, "= " + num(this.ctx.tunables.get('forge.hammerBase')) + " + " + num(this.ctx.tunables.get('forge.hammerPerLevel')) + " \xD7 \u7B49\u7EA7", 0, -24, 190, 24, 16, INK);
            text(_panel, '可连续落锤', 0, -56, 180, 24, 16, INK);
          }

          // Rules entry (S11 is delivered with the tube, UI §3).
          artButton(root, '？', FORGE_LAYOUT.help.x, FORGE_LAYOUT.help.y, FORGE_LAYOUT.helpHitSize, FORGE_LAYOUT.helpHitSize, 'helpNormal', 'helpPressed', 'helpNormal', function () {
            return _this3.openHelp();
          }, true, 36, FORGE_LAYOUT.help.width, FORGE_LAYOUT.help.height, 0, false);
          text(root, '规则', 292, -226, 88, 24, 16);

          // 保底 panel (GDD §9.5), public at all times.
          var pityN = Math.max(1, Math.round(this.ctx.tunables.get('forge.pityStreak')));
          var pityPanel = box(root, 'PityPanel', 244, -315, 196, 150, new Color(236, 224, 198));
          text(pityPanel, '保底', 0, 50, 180, 28, 20, INK);
          text(pityPanel, "\u8FDE\u7EED\u635F\u4F24 " + anvil.damageStreak + " / " + pityN, 0, 16, 180, 26, 18, INK);
          var pityNote = "\u6EE1 " + pityN + " \u6B21\u540E\u4E0B\u4E00\u9524\u81F3\u5C11\u7EF4\u6301";
          if (anvil.judgedHoldNext() && anvil.pityActive()) pityNote = '没有合格的签：下一锤判维持，不耗签';else if (anvil.pityActive()) pityNote = '生效中：损伤、碎裂签本锤不出';
          text(pityPanel, pityNote, 0, -32, 184, 56, 16, INK);

          // Hammer button in the thumb zone (batch5 B).
          var coins = this.module.coins();
          var affordable = coins === null || coins >= cost;
          var caption = (last ? '再落一锤' : '落锤') + " \xB7 \u6C42\u7B7E  \u25CF" + cost;
          if (shattered) caption = '主剑已碎';else if (!affordable) caption = "\u94DC\u94B1\u4E0D\u591F  \u25CF" + cost;
          artButton(root, caption, FORGE_LAYOUT.draw.x, FORGE_LAYOUT.draw.y, FORGE_LAYOUT.draw.width, FORGE_LAYOUT.draw.height, 'drawNormal', 'drawPressed', 'drawDisabled', function () {
            return _this3.strike();
          }, !shattered && affordable, 32, FORGE_LAYOUT.draw.width, FORGE_LAYOUT.draw.height, FORGE_LAYOUT.drawTextX);

          // The drawn lot lies in front of the tube, face up with its real result (batch5 动效 #3–#4).
          if (last && last.drawn) {
            var slip = artBox(root, 'DropSlip', FORGE_LAYOUT.dropSlip.x, FORGE_LAYOUT.dropSlip.y, FORGE_LAYOUT.dropSlip.width, FORGE_LAYOUT.dropSlip.height, SLIP_ART[last.result], LOT_COLORS[last.result], HIGHLIGHT);
            artBox(slip, 'Highlight', 0, 0, FORGE_LAYOUT.dropSlip.width, FORGE_LAYOUT.dropSlip.height, 'slipHighlight', undefined, HIGHLIGHT);
            slip.angle = -74;
            text(slip, vertical(RESULT_NAMES[last.result]), 0, 20, 72, 144, 24, lotText(last.result));
            text(slip, LEVEL_DELTA[last.result], 0, -91, 72, 48, 24, lotText(last.result));
          }
          if (this.help) this.renderHelp(size.width, size.height);else if (shattered) this.renderShatter(size.width, size.height);
        };
        _proto2.openHelp = function openHelp() {
          this.help = true;
          this.helpPage = 0;
          this.render();
        };
        _proto2.helpPages = function helpPages() {
          var _this4 = this;
          var anvil = this.module.anvil;
          return paginate(lotsHelpText({
            param: function param(key) {
              return _this4.ctx.tunables.get(key);
            },
            tube: anvil.tube,
            odds: anvil.resultOdds(),
            pityActive: anvil.pityActive(),
            judgedHoldNext: anvil.judgedHoldNext(),
            tutorial: anvil.tutorialRun
          }), HELP_CHARS_PER_LINE, HELP_LINES_PER_PAGE);
        }

        /** S11: read-only plain text, one tap back to the tube (UI-requirements §3 S11). */;
        _proto2.renderHelp = function renderHelp(w, h) {
          var _pages$page,
            _this5 = this;
          var pages = this.helpPages();
          var page = Math.max(0, Math.min(pages.length - 1, this.helpPage));
          cover(this.root, 'HelpDim', w, h, new Color(14, 10, 8, 178));
          var panel = box(this.root, 'HelpPanel', 0, 0, 670, 1180, new Color(236, 224, 198), new Color(88, 62, 40));
          text(panel, page + 1 + " / " + pages.length, 270, 560, 100, 30, 18, INK);
          text(panel, (_pages$page = pages[page]) != null ? _pages$page : '', 0, 20, 620, 1000, 20, INK, 'left');
          button(panel, '上一页', -220, -540, 170, 70, function () {
            _this5.helpPage = page - 1;
            _this5.render();
          }, page > 0, 24);
          button(panel, '返回签筒', 0, -540, 200, 70, function () {
            _this5.help = false;
            _this5.render();
          }, true, 24);
          button(panel, '下一页', 220, -540, 170, 70, function () {
            _this5.helpPage = page + 1;
            _this5.render();
          }, page < pages.length - 1, 24);
        }

        /** S12: 提拔 / 断剑, confirmed before it applies (GDD §9.6; UI-requirements §3 S12). No 剑魂 / ad button in P1. */;
        _proto2.renderShatter = function renderShatter(w, h) {
          var _this6 = this;
          var anvil = this.module.anvil;
          var shattered = anvil.pendingShatter;
          if (!shattered) return;
          var record = this.module.record.get();
          var grades = this.linkGrades();
          cover(this.root, 'ShatterDim', w, h, new Color(14, 10, 8, 200));
          var panel = box(this.root, 'ShatterPanel', 0, 0, 640, 900, new Color(52, 38, 28), HIGHLIGHT);
          text(panel, '主剑碎了', 0, 380, 400, 50, 36);
          text(panel, SWORD_NAMES[anvil.swordOrigin] + " +" + shattered.level + " \u788E\u88C2", 0, 326, 400, 34, 24);
          text(panel, "\u4F60\u66FE\u953B\u5230 +" + shattered.level, 0, 282, 400, 30, 22, HIGHLIGHT);
          text(panel, "\u672C\u673A\u788E\u5251\u8BB0\u5F55\uFF1A\u6700\u9AD8 +" + Math.max(0, record.best) + " \xB7 \u5171 " + record.count + " \u628A", 0, 248, 560, 26, 17, MUTED);
          var step = this.shatterStep;
          var back = function back() {
            _this6.shatterStep = {
              kind: 'choose'
            };
            _this6.render();
          };
          if (step.kind === 'choose') {
            var affixes = anvil.swordAffixes;
            var kept = affixes.length > 0 ? affixes.map(function (a) {
              return affixName(a, _this6.ctx);
            }).join(' / ') : '原剑没有词条';
            var canPromote = grades.length > 0;
            var promote = button(panel, '提拔', -150, 60, 280, 240, function () {
              _this6.shatterStep = {
                kind: 'pickLink'
              };
              _this6.render();
            }, canPromote, 34);
            text(promote, canPromote ? '从剑链选一把当新主剑\n保留它的等级\n按学徒剑属性 · 剑链少一节' : '剑链里没有可提拔的链剑', 0, -62, 260, 96, 17, canPromote ? BONE : MUTED);
            var broken = button(panel, '断剑', 150, 60, 280, 240, function () {
              _this6.shatterStep = {
                kind: 'confirmBroken'
              };
              _this6.render();
            }, true, 34);
            text(broken, "\u62FF\u56DE\u540C\u5251\u80DA\u7684 +0 \u65AD\u5251\n\u968F\u673A\u4FDD\u7559 1 \u6761\u8BCD\u6761\n\uFF08" + kept + "\uFF09", 0, -62, 260, 96, 17);
            text(panel, '二选一，选完要再确认一次', 0, -150, 500, 30, 18, MUTED);
          } else if (step.kind === 'pickLink') {
            text(panel, '选一把链剑当新主剑', 0, 190, 500, 34, 24);
            var shown = Math.min(grades.length, 16);
            var _loop = function _loop(i) {
              var x = -225 + i % 4 * 150;
              var y = 110 - Math.floor(i / 4) * 96;
              button(panel, "\u7B2C " + (i + 1) + " \u8282 +" + Math.max(0, Math.floor(grades[i])), x, y, 140, 80, function () {
                _this6.shatterStep = {
                  kind: 'confirmPromote',
                  slot: i
                };
                _this6.render();
              }, true, 20);
            };
            for (var i = 0; i < shown; i++) {
              _loop(i);
            }
            button(panel, '‹ 重新选', 0, -380, 220, 70, back, true, 24);
          } else {
            var _grades$step$slot;
            var msg = step.kind === 'confirmPromote' ? "\u786E\u8BA4\u63D0\u62D4\u7B2C " + (step.slot + 1) + " \u8282\u94FE\u5251\uFF08+" + Math.max(0, Math.floor((_grades$step$slot = grades[step.slot]) != null ? _grades$step$slot : 0)) + "\uFF09\u5F53\u65B0\u4E3B\u5251\uFF1F" : '确认断剑：拿回同剑胚的 +0 断剑，随机保留 1 条词条？';
            text(panel, msg, 0, 100, 560, 80, 24);
            button(panel, '确认', 140, -60, 220, 90, function () {
              return _this6.confirmShatter(step);
            }, true, 30);
            button(panel, '‹ 重新选', -140, -60, 220, 90, back, true, 24);
          }
        };
        _proto2.confirmShatter = function confirmShatter(step) {
          var anvil = this.module.anvil;
          var ok = step.kind === 'confirmPromote' ? anvil.choosePromote(step.slot) : step.kind === 'confirmBroken' ? anvil.chooseBroken() : false;
          if (!ok) return;
          this.shatterStep = {
            kind: 'choose'
          };
          this.last = null;
          this.notice = '新主剑的签筒已建好';
          this.render();
        };
        _proto2.linkGrades = function linkGrades() {
          var _this$ctx$services$ge;
          if (!this.ctx.services.has('swordRig')) return [];
          return (_this$ctx$services$ge = this.ctx.services.get('swordRig').linkGrades) != null ? _this$ctx$services$ge : [];
        };
        return LotsView;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/main", ['./App.ts', './Arena.ts', './Camera.ts', './CoreParams.ts', './DebugInputSource.ts', './FixedLoop.ts', './ForgeContract.ts', './FxDriver.ts', './GameContext.ts', './Layers.ts', './LocalPlatform.ts', './Modules.ts', './Rng.ts', './ScreenLayout.ts', './ServiceRegistry.ts', './Session.ts', './SessionWatch.ts', './SpatialHash.ts', './StepProbe.ts', './SystemOrder.ts', './Tunables.ts', './TypedEventBus.ts', './contracts.ts', './events.ts', './index12.ts', './Geom2.ts', './Vec2.ts', './CoreArenaView.ts', './CoreBootstrap.ts', './CoreDebugInput.ts', './Boss.ts', './BossChest.ts', './BossParams.ts', './DirectorParams.ts', './EnemyArt.ts', './EnemyModule.ts', './EnemyParams.ts', './EnemyWorld.ts', './SpawnDirector.ts', './index5.ts', './BossChestView.ts', './BossView.ts', './EnemyView.ts', './HudArt3.ts', './Anvil.ts', './ForgeDebugOdds.ts', './ForgeDraw.ts', './ForgeHotspot.ts', './ForgeModule.ts', './ForgeParams.ts', './ForgeState.ts', './HammerFeel.ts', './HelpText.ts', './LotsTube.ts', './ShatterRecord.ts', './index4.ts', './ForgeArt.ts', './Gray.ts', './HammerArt.ts', './HammerSoundPool.ts', './HammerView.ts', './LotsView.ts', './FloatingJoystick.ts', './InputHistory.ts', './InputParams.ts', './InputSystem.ts', './index3.ts', './JoystickView.ts', './LootFormulas.ts', './LootModule.ts', './LootParams.ts', './index6.ts', './HudArt2.ts', './LootView.ts', './index7.ts', './ChainCamera.ts', './DoorPoint.ts', './RunModule.ts', './RunParams.ts', './index13.ts', './HudArt4.ts', './PauseArt.ts', './PauseView.ts', './RunView.ts', './BattleSwordLook.ts', './SwordParams.ts', './SwordChain.ts', './Damage.ts', './Whip.ts', './index10.ts', './ChainLayout.ts', './LoopController.ts', './LoopParams.ts', './geom.ts', './index8.ts', './LoopView.ts', './Pet.ts', './SwordCombat.ts', './SwordRig.ts', './SwordRigHooks.ts', './VerletRope.ts', './ThrowController.ts', './ThrowFormulas.ts', './ThrowParams.ts', './index.ts', './ThrowView.ts', './HudArt.ts', './SwordView.ts', './SwordViewData.ts', './RegionData.ts', './Regions.ts', './TerrainGround.ts', './TerrainParams.ts', './index2.ts', './Hud.ts', './Presets.ts', './Storage.ts', './Telemetry.ts', './TuningController.ts', './TuningParams.ts', './index9.ts', './TuningView.ts', './Widgets.ts', './ModifierStore.ts', './UpgradeCatalog.ts', './UpgradeController.ts', './UpgradeParams.ts', './index11.ts', './UpgradeView.ts', './UpgradeViewData.ts'], function () {
  return {
    setters: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
    execute: function () {}
  };
});

System.register("chunks:///_virtual/ModifierStore.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "d34b13Io+ROpIRj76/ywLmR", "ModifierStore", undefined);
      /** Additive P1 modifiers; stat owners keep their existing formulas. */
      var ModifierStore = exports('ModifierStore', /*#__PURE__*/function () {
        function ModifierStore(ctx) {
          this.ctx = void 0;
          this.additions = new Map();
          this.ctx = ctx;
        }
        var _proto = ModifierStore.prototype;
        _proto.add = function add(key) {
          var _this$additions$get;
          return (_this$additions$get = this.additions.get(key)) != null ? _this$additions$get : 0;
        };
        _proto.mul = function mul(_key) {
          return 1;
        };
        _proto.increase = function increase(key, value) {
          if (!Number.isFinite(value) || value === 0) return;
          var next = this.add(key) + value;
          this.additions.set(key, next);
          this.ctx.events.emit('upgrade:modifier', {
            key: key,
            add: next,
            mul: 1
          });
        };
        _proto.reset = function reset() {
          var keys = Array.from(this.additions.keys());
          this.additions.clear();
          for (var _i = 0, _keys = keys; _i < _keys.length; _i++) {
            var key = _keys[_i];
            this.ctx.events.emit('upgrade:modifier', {
              key: key,
              add: 0,
              mul: 1
            });
          }
        };
        return ModifierStore;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/Modules.ts", ['cc', './index7.ts', './index3.ts', './index10.ts', './index5.ts', './index6.ts', './index11.ts', './index4.ts', './index13.ts', './index9.ts'], function (exports) {
  var cclegacy, install, install$1, install$2, install$3, install$4, install$5, install$6, install$7, install$8;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      install = module.install;
    }, function (module) {
      install$1 = module.install;
    }, function (module) {
      install$2 = module.install;
    }, function (module) {
      install$3 = module.install;
    }, function (module) {
      install$4 = module.install;
    }, function (module) {
      install$5 = module.install;
    }, function (module) {
      install$6 = module.install;
    }, function (module) {
      install$7 = module.install;
    }, function (module) {
      install$8 = module.install;
    }],
    execute: function () {
      exports('installModules', installModules);
      cclegacy._RF.push({}, "5746dSfdfVIxLu2J1hsZltn", "Modules", undefined);

      /**
       * Startup order. Platform comes first so every later module sees the final
       * `platform` service; loot, upgrade and forge follow the combat modules; run
       * comes after everything it drives; tuning stays last so its panel lists
       * every registered parameter.
       */
      var moduleInstalls = exports('moduleInstalls', [install, install$1, install$2, install$3, install$4, install$5, install$6, install$7, install$8]);
      function installModules(ctx) {
        install$1(ctx);
        install$2(ctx);
        install$3(ctx);
        install$4(ctx);
        install$5(ctx);
        install$6(ctx);
        install$7(ctx);
        install$8(ctx);
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/PauseArt.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports({
        pauseButtonDrawSize: pauseButtonDrawSize,
        pauseButtonLayerFlags: pauseButtonLayerFlags,
        pauseCoinText: pauseCoinText,
        pauseDesignToLocal: pauseDesignToLocal,
        pauseDimSize: pauseDimSize,
        pauseItemsText: pauseItemsText,
        pauseSwordText: pauseSwordText,
        pauseSwordValueText: pauseSwordValueText,
        pauseViewActiveFlags: pauseViewActiveFlags,
        pauseWaveText: pauseWaveText
      });
      cclegacy._RF.push({}, "15f14S+yDtFXIpp7PxE0zh3", "PauseArt", undefined);
      /** Transcribed from docs/ui/batch7/batch7-slices.json. Source JSON stays outside assets/. */
      var PAUSE_DESIGN_WIDTH = exports('PAUSE_DESIGN_WIDTH', 720);
      var PAUSE_DESIGN_HEIGHT = exports('PAUSE_DESIGN_HEIGHT', 1280);
      var BTN_SLICE = {
        top: 34,
        bottom: 40,
        left: 124,
        right: 40
      };
      function art(name, width, height, slice) {
        return {
          path: "ui/pause/" + name,
          width: width,
          height: height,
          slice: slice
        };
      }

      /** Only the continue / quit slices ship in resources/ui/pause for MVP. */
      var PAUSE_ART = exports('PAUSE_ART', {
        continueNormal: art('ui_pause_btn_continue_normal', 512, 128, BTN_SLICE),
        continuePressed: art('ui_pause_btn_continue_pressed', 512, 128, BTN_SLICE),
        quitNormal: art('ui_pause_btn_quit_normal', 512, 128, BTN_SLICE),
        quitPressed: art('ui_pause_btn_quit_pressed', 512, 128, BTN_SLICE)
      });
      var PAUSE_ART_KEYS = exports('PAUSE_ART_KEYS', ['continueNormal', 'continuePressed', 'quitNormal', 'quitPressed']);

      /**
       * 720×1280 top-left +y down from batch7-slices.json pages.UI_Pause.
       * Settings and backpack stay in the json for later; MVP does not build them.
       */
      var PAUSE_LAYOUT = exports('PAUSE_LAYOUT', {
        designWidth: PAUSE_DESIGN_WIDTH,
        designHeight: PAUSE_DESIGN_HEIGHT,
        title: {
          x: 130,
          y: 120,
          width: 460,
          height: 118
        },
        infoPanel: {
          x: 40,
          y: 272,
          width: 640,
          height: 404
        },
        rowWave: {
          x: 68,
          y: 306,
          width: 584,
          height: 84
        },
        rowSword: {
          x: 68,
          y: 390,
          width: 584,
          height: 84
        },
        rowCoin: {
          x: 68,
          y: 474,
          width: 584,
          height: 84
        },
        rowItems: {
          x: 68,
          y: 558,
          width: 584,
          height: 84
        },
        hint: {
          x: 120,
          y: 886,
          width: 480,
          height: 28
        },
        giveUp: {
          x: 372,
          y: 968,
          width: 324,
          height: 116
        },
        continueBtn: {
          x: 24,
          y: 1112,
          width: 672,
          height: 116
        },
        confirmPanel: {
          x: 80,
          y: 420,
          width: 560,
          height: 280
        },
        confirmTitle: {
          x: 100,
          y: 448,
          width: 520,
          height: 80
        },
        confirmCancel: {
          x: 108,
          y: 580,
          width: 240,
          height: 88
        },
        confirmOk: {
          x: 372,
          y: 580,
          width: 240,
          height: 88
        }
      });

      /** Host stays active so PauseView.update keeps running; only this child toggles. */
      var PAUSE_HOST_NAME = exports('PAUSE_HOST_NAME', 'PauseHost');
      var PAUSE_PAGE_NAME = exports('PAUSE_PAGE_NAME', 'UI_Pause');

      /** 9-slice left icon column (flag / play) vs right cap; label sits in the stretch. */
      var PAUSE_BTN_ICON_LEFT = exports('PAUSE_BTN_ICON_LEFT', 124);
      var PAUSE_BTN_ICON_RIGHT = exports('PAUSE_BTN_ICON_RIGHT', 40);
      var PAUSE_BTN_LABEL_SHIFT_X = exports('PAUSE_BTN_LABEL_SHIFT_X', (PAUSE_BTN_ICON_LEFT - PAUSE_BTN_ICON_RIGHT) / 2);

      /** S17 nodes that exist in the mockup but are hidden / skipped in P1 MVP. */
      var PAUSE_MVP_HIDDEN = exports('PAUSE_MVP_HIDDEN', ['BtnSettings', 'BtnBag', 'UI_Backpack']);
      var PAUSE_COPY = exports('PAUSE_COPY', {
        title: '暂停',
        hint: '战斗已暂停 · 切后台也会自动暂停',
        "continue": '继续',
        giveUp: '放弃本局',
        wave: '当前波次',
        sword: '主剑',
        coin: '本局铜钱',
        items: '已拿道具',
        confirmTitle: '确定放弃本局？',
        confirmCancel: '取消',
        confirmOk: '确定'
      });

      /** Design 720×1280 top-left +y down → Cocos center-origin +y up. */
      function pauseDesignToLocal(rect) {
        return {
          x: rect.x + rect.width / 2 - PAUSE_DESIGN_WIDTH / 2,
          y: PAUSE_DESIGN_HEIGHT / 2 - (rect.y + rect.height / 2)
        };
      }
      function pauseSwordText(level) {
        var n = Number.isFinite(level) ? Math.max(0, Math.floor(level)) : 0;
        return "\u4E3B\u5251 +" + n;
      }
      function pauseSwordValueText(level) {
        var n = Number.isFinite(level) ? Math.max(0, Math.floor(level)) : 0;
        return "+" + n;
      }

      /** Host must stay active (Cocos skips update on inactive nodes). Only the page child toggles. */
      function pauseViewActiveFlags(pauseOpen) {
        return {
          host: true,
          page: pauseOpen
        };
      }

      /** When a slice frame is loaded, hide the gray fallback so the wooden sprite is visible. */
      function pauseButtonLayerFlags(hasFrame) {
        return {
          showSprite: hasFrame,
          showFallback: !hasFrame
        };
      }

      /** Display size is the layout rect, not the 512×128 source PNG. */
      function pauseButtonDrawSize(rect) {
        return {
          width: rect.width,
          height: rect.height
        };
      }

      /** Dim size in design space so a Fit-Width phone (e.g. 390×844) is fully covered. */
      function pauseDimSize(visibleW, visibleH) {
        var scale = Math.min(visibleW / PAUSE_DESIGN_WIDTH, visibleH / PAUSE_DESIGN_HEIGHT);
        if (!(scale > 0)) return {
          width: PAUSE_DESIGN_WIDTH,
          height: PAUSE_DESIGN_HEIGHT
        };
        return {
          width: visibleW / scale,
          height: visibleH / scale
        };
      }
      function pauseWaveText(wave, waveCount) {
        var w = Number.isFinite(wave) ? Math.max(0, Math.floor(wave)) : 0;
        var c = Number.isFinite(waveCount) ? Math.max(0, Math.floor(waveCount)) : 0;
        return "\u7B2C " + w + " / " + c + " \u6CE2";
      }
      function pauseCoinText(coins) {
        var n = Number.isFinite(coins) ? Math.max(0, Math.floor(coins)) : 0;
        return String(n);
      }
      function pauseItemsText(count) {
        var n = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
        return String(n);
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/PauseView.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './PauseArt.ts'], function (exports) {
  var _inheritsLoose, cclegacy, Color, BlockInputEvents, view, Sprite, UITransform, Node, Graphics, _decorator, Label, resources, SpriteFrame, Component, pauseViewActiveFlags, PAUSE_ART_KEYS, PAUSE_LAYOUT, PAUSE_COPY, pauseDesignToLocal, pauseWaveText, pauseSwordValueText, pauseCoinText, pauseItemsText, pauseButtonDrawSize, pauseDimSize, PAUSE_HOST_NAME, PAUSE_PAGE_NAME, pauseButtonLayerFlags, PAUSE_BTN_LABEL_SHIFT_X, PAUSE_ART, PAUSE_BTN_ICON_LEFT, PAUSE_BTN_ICON_RIGHT;
  return {
    setters: [function (module) {
      _inheritsLoose = module.inheritsLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
      Color = module.Color;
      BlockInputEvents = module.BlockInputEvents;
      view = module.view;
      Sprite = module.Sprite;
      UITransform = module.UITransform;
      Node = module.Node;
      Graphics = module.Graphics;
      _decorator = module._decorator;
      Label = module.Label;
      resources = module.resources;
      SpriteFrame = module.SpriteFrame;
      Component = module.Component;
    }, function (module) {
      pauseViewActiveFlags = module.pauseViewActiveFlags;
      PAUSE_ART_KEYS = module.PAUSE_ART_KEYS;
      PAUSE_LAYOUT = module.PAUSE_LAYOUT;
      PAUSE_COPY = module.PAUSE_COPY;
      pauseDesignToLocal = module.pauseDesignToLocal;
      pauseWaveText = module.pauseWaveText;
      pauseSwordValueText = module.pauseSwordValueText;
      pauseCoinText = module.pauseCoinText;
      pauseItemsText = module.pauseItemsText;
      pauseButtonDrawSize = module.pauseButtonDrawSize;
      pauseDimSize = module.pauseDimSize;
      PAUSE_HOST_NAME = module.PAUSE_HOST_NAME;
      PAUSE_PAGE_NAME = module.PAUSE_PAGE_NAME;
      pauseButtonLayerFlags = module.pauseButtonLayerFlags;
      PAUSE_BTN_LABEL_SHIFT_X = module.PAUSE_BTN_LABEL_SHIFT_X;
      PAUSE_ART = module.PAUSE_ART;
      PAUSE_BTN_ICON_LEFT = module.PAUSE_BTN_ICON_LEFT;
      PAUSE_BTN_ICON_RIGHT = module.PAUSE_BTN_ICON_RIGHT;
    }],
    execute: function () {
      exports('mountPauseView', mountPauseView);
      cclegacy._RF.push({}, "700cdS4yqpKopzWTlcGPMTX", "PauseView", undefined);
      var INK = new Color(44, 30, 20, 255);
      var BONE = new Color(232, 224, 206, 255);
      var MUTED = new Color(196, 182, 150, 255);
      var FALLBACK_DIM = new Color(22, 13, 7, 200);
      var FALLBACK_PANEL = new Color(70, 58, 44, 255);
      var FALLBACK_EDGE = new Color(205, 181, 132, 255);
      var FALLBACK_BTN = new Color(102, 72, 42, 255);
      var FALLBACK_SECONDARY = new Color(72, 68, 62, 255);

      /**
       * Runtime S17 pause page. The component lives on an always-active host so
       * `update` keeps running; only the `UI_Pause` child is toggled.
       */
      var PauseView = exports('PauseView', /*#__PURE__*/function (_Component) {
        _inheritsLoose(PauseView, _Component);
        function PauseView() {
          var _this;
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          _this = _Component.call.apply(_Component, [this].concat(args)) || this;
          _this.ctx = null;
          _this.module = null;
          _this.frames = new Map();
          _this.loaded = 0;
          _this.disposed = false;
          _this.page = null;
          _this.dimNode = null;
          _this.confirmRoot = null;
          _this.waveValue = null;
          _this.swordValue = null;
          _this.coinValue = null;
          _this.itemsValue = null;
          _this.buttonSprites = [];
          return _this;
        }
        var _proto = PauseView.prototype;
        _proto.configure = function configure(ctx, module) {
          this.ctx = ctx;
          this.module = module;
          // Host stays active. Deactivating this.node would skip update() and freeze the game.
          this.node.active = true;
          this.page = make(this.node, PAUSE_PAGE_NAME, 0, 0, PAUSE_LAYOUT.designWidth, PAUSE_LAYOUT.designHeight);
          this.page.addComponent(BlockInputEvents);
          this.page.active = false;
          this.build(this.page);
          view.on('canvas-resize', this.resize, this);
          this.resize();
          this.loadArt();
        };
        _proto.onDestroy = function onDestroy() {
          this.disposed = true;
          view.off('canvas-resize', this.resize, this);
          this.ctx = null;
          this.module = null;
          this.page = null;
          this.dimNode = null;
          this.confirmRoot = null;
          this.waveValue = null;
          this.swordValue = null;
          this.coinValue = null;
          this.itemsValue = null;
          this.buttonSprites.length = 0;
        };
        _proto.update = function update() {
          var module = this.module;
          var page = this.page;
          if (!module || !page) return;
          var flags = pauseViewActiveFlags(module.pauseOpen);
          if (this.node.active !== flags.host) this.node.active = flags.host;
          if (page.active !== flags.page) page.active = flags.page;
          if (!flags.page) return;
          this.paintInfo();
          if (this.confirmRoot) this.confirmRoot.active = module.abandonConfirmOpen;
        };
        _proto.loadArt = function loadArt() {
          var _this2 = this;
          var _loop = function _loop() {
            var key = PAUSE_ART_KEYS[i];
            var definition = PAUSE_ART[key];
            resources.load(definition.path + "/spriteFrame", SpriteFrame, function (error, frame) {
              if (_this2.disposed) return;
              if (error || !frame) {
                _this2.frames.set(key, null);
              } else {
                if (definition.slice) {
                  frame.insetTop = definition.slice.top;
                  frame.insetBottom = definition.slice.bottom;
                  frame.insetLeft = definition.slice.left;
                  frame.insetRight = definition.slice.right;
                }
                _this2.frames.set(key, frame);
              }
              _this2.loaded += 1;
              _this2.applyButtonFrames();
            });
          };
          for (var i = 0; i < PAUSE_ART_KEYS.length; i++) {
            _loop();
          }
        };
        _proto.applyButtonFrames = function applyButtonFrames() {
          for (var i = 0; i < this.buttonSprites.length; i++) {
            this.showButtonFrame(this.buttonSprites[i], this.buttonSprites[i].normal);
          }
        };
        _proto.showButtonFrame = function showButtonFrame(entry, key) {
          var _entry$sprite$node$ge;
          var frame = this.frames.get(key);
          var layers = pauseButtonLayerFlags(!!frame);
          if (entry.fallback) entry.fallback.active = layers.showFallback;
          if (!frame || !layers.showSprite) return;
          entry.sprite.sizeMode = Sprite.SizeMode.CUSTOM;
          entry.sprite.type = Sprite.Type.SLICED;
          entry.sprite.spriteFrame = frame;
          (_entry$sprite$node$ge = entry.sprite.node.getComponent(UITransform)) == null || _entry$sprite$node$ge.setContentSize(entry.width, entry.height);
        };
        _proto.build = function build(page) {
          var _this3 = this;
          this.dimNode = box(page, 'Dim', {
            x: 0,
            y: 0,
            width: PAUSE_LAYOUT.designWidth,
            height: PAUSE_LAYOUT.designHeight
          }, FALLBACK_DIM);
          this.dimNode.addComponent(BlockInputEvents);
          var title = box(page, 'Title', PAUSE_LAYOUT.title, FALLBACK_PANEL, FALLBACK_EDGE);
          label(title, 'Label', PAUSE_COPY.title, 0, 0, PAUSE_LAYOUT.title.width, PAUSE_LAYOUT.title.height, 44, BONE);
          var panel = box(page, 'InfoPanel', PAUSE_LAYOUT.infoPanel, FALLBACK_PANEL, FALLBACK_EDGE);
          this.waveValue = infoRow(panel, 'RowWave', PAUSE_LAYOUT.rowWave, PAUSE_LAYOUT.infoPanel, PAUSE_COPY.wave);
          this.swordValue = infoRow(panel, 'RowSword', PAUSE_LAYOUT.rowSword, PAUSE_LAYOUT.infoPanel, PAUSE_COPY.sword);
          this.coinValue = infoRow(panel, 'RowCoin', PAUSE_LAYOUT.rowCoin, PAUSE_LAYOUT.infoPanel, PAUSE_COPY.coin);
          this.itemsValue = infoRow(panel, 'RowItems', PAUSE_LAYOUT.rowItems, PAUSE_LAYOUT.infoPanel, PAUSE_COPY.items);
          var hint = pauseDesignToLocal(PAUSE_LAYOUT.hint);
          label(page, 'Hint', PAUSE_COPY.hint, hint.x, hint.y, PAUSE_LAYOUT.hint.width, PAUSE_LAYOUT.hint.height, 20, MUTED);
          this.artButton(page, 'BtnGiveUp', 'quitNormal', 'quitPressed', PAUSE_LAYOUT.giveUp, PAUSE_COPY.giveUp, 34, function () {
            var _this3$module;
            return (_this3$module = _this3.module) == null ? void 0 : _this3$module.requestAbandon();
          });
          this.artButton(page, 'BtnContinue', 'continueNormal', 'continuePressed', PAUSE_LAYOUT.continueBtn, PAUSE_COPY["continue"], 40, function () {
            var _this3$module2;
            return (_this3$module2 = _this3.module) == null ? void 0 : _this3$module2.resumePause();
          });
          var confirm = box(page, 'ConfirmRoot', {
            x: 0,
            y: 0,
            width: PAUSE_LAYOUT.designWidth,
            height: PAUSE_LAYOUT.designHeight
          }, FALLBACK_DIM);
          confirm.addComponent(BlockInputEvents);
          box(confirm, 'Panel', PAUSE_LAYOUT.confirmPanel, FALLBACK_PANEL, FALLBACK_EDGE);
          var confirmTitle = pauseDesignToLocal(PAUSE_LAYOUT.confirmTitle);
          label(confirm, 'Title', PAUSE_COPY.confirmTitle, confirmTitle.x, confirmTitle.y, PAUSE_LAYOUT.confirmTitle.width, PAUSE_LAYOUT.confirmTitle.height, 34, BONE);
          this.plainButton(confirm, 'BtnCancel', PAUSE_LAYOUT.confirmCancel, PAUSE_COPY.confirmCancel, FALLBACK_SECONDARY, function () {
            var _this3$module3;
            return (_this3$module3 = _this3.module) == null ? void 0 : _this3$module3.cancelAbandon();
          });
          this.plainButton(confirm, 'BtnConfirm', PAUSE_LAYOUT.confirmOk, PAUSE_COPY.confirmOk, FALLBACK_BTN, function () {
            var _this3$module4;
            return (_this3$module4 = _this3.module) == null ? void 0 : _this3$module4.confirmAbandon();
          });
          confirm.active = false;
          this.confirmRoot = confirm;
        };
        _proto.paintInfo = function paintInfo() {
          var ctx = this.ctx;
          var module = this.module;
          if (!ctx || !module) return;
          if (this.waveValue) this.waveValue.string = pauseWaveText(module.wave, module.waveCount);
          var swordLevel = ctx.services.has('anvil') ? ctx.services.get('anvil').sword.level : 0;
          if (this.swordValue) this.swordValue.string = pauseSwordValueText(swordLevel);
          var coins = ctx.services.has('loot') ? ctx.services.get('loot').coins : 0;
          if (this.coinValue) this.coinValue.string = pauseCoinText(coins);
          var items = ctx.services.has('upgrade') ? ctx.services.get('upgrade').items.length : 0;
          if (this.itemsValue) this.itemsValue.string = pauseItemsText(items);
        };
        _proto.artButton = function artButton(parent, name, normal, pressed, rect, caption, size, click) {
          var _this4 = this;
          var pos = pauseDesignToLocal(rect);
          var draw = pauseButtonDrawSize(rect);
          var node = make(parent, name, pos.x, pos.y, draw.width, draw.height);
          node.addComponent(BlockInputEvents);
          // Fallback is an earlier sibling so a loaded Sprite is never covered by the gray box.
          var fallback = make(node, 'Fallback', 0, 0, draw.width, draw.height);
          fallbackFill(fallback, draw.width, draw.height, FALLBACK_BTN, FALLBACK_EDGE);
          var body = make(node, 'Art', 0, 0, draw.width, draw.height);
          var sprite = body.addComponent(Sprite);
          sprite.sizeMode = Sprite.SizeMode.CUSTOM;
          sprite.type = Sprite.Type.SLICED;
          var entry = {
            sprite: sprite,
            fallback: fallback,
            normal: normal,
            pressed: pressed,
            width: draw.width,
            height: draw.height
          };
          this.buttonSprites.push(entry);
          this.showButtonFrame(entry, normal);
          var labelW = draw.width - PAUSE_BTN_ICON_LEFT - PAUSE_BTN_ICON_RIGHT;
          label(node, 'Label', caption, PAUSE_BTN_LABEL_SHIFT_X, 0, labelW, draw.height - 12, size, BONE);
          node.on(Node.EventType.TOUCH_START, function () {
            return _this4.showButtonFrame(entry, pressed);
          });
          node.on(Node.EventType.TOUCH_CANCEL, function () {
            return _this4.showButtonFrame(entry, normal);
          });
          node.on(Node.EventType.TOUCH_END, function () {
            _this4.showButtonFrame(entry, normal);
            click();
          });
          return node;
        };
        _proto.plainButton = function plainButton(parent, name, rect, caption, fill, click) {
          var node = box(parent, name, rect, fill, FALLBACK_EDGE);
          node.addComponent(BlockInputEvents);
          label(node, 'Label', caption, 0, 0, rect.width - 24, rect.height - 12, 30, BONE);
          node.on(Node.EventType.TOUCH_END, click);
          return node;
        };
        _proto.resize = function resize() {
          var size = view.getVisibleSize();
          var scale = Math.min(size.width / PAUSE_LAYOUT.designWidth, size.height / PAUSE_LAYOUT.designHeight);
          this.node.setScale(scale, scale, 1);
          var page = this.page;
          if (page) {
            var _page$getComponent;
            page.setScale(1, 1, 1);
            (_page$getComponent = page.getComponent(UITransform)) == null || _page$getComponent.setContentSize(scale > 0 ? size.width / scale : PAUSE_LAYOUT.designWidth, scale > 0 ? size.height / scale : PAUSE_LAYOUT.designHeight);
          }
          this.coverScreen(this.dimNode);
          this.coverScreen(this.confirmRoot);
        };
        _proto.coverScreen = function coverScreen(node) {
          var _node$getComponent, _paint$getComponent;
          if (!node) return;
          var size = view.getVisibleSize();
          var dim = pauseDimSize(size.width, size.height);
          node.setPosition(0, 0, 0);
          (_node$getComponent = node.getComponent(UITransform)) == null || _node$getComponent.setContentSize(dim.width, dim.height);
          var paint = node.getChildByName('Paint');
          if (!paint) return;
          (_paint$getComponent = paint.getComponent(UITransform)) == null || _paint$getComponent.setContentSize(dim.width, dim.height);
          var graphics = paint.getComponent(Graphics);
          if (!graphics) return;
          graphics.clear();
          graphics.fillColor = FALLBACK_DIM;
          graphics.rect(-dim.width / 2, -dim.height / 2, dim.width, dim.height);
          graphics.fill();
        };
        return PauseView;
      }(Component));
      _decorator.ccclass('PauseView')(PauseView);
      function make(parent, name, x, y, width, height) {
        var child = new Node(name);
        child.layer = parent.layer;
        child.setPosition(x, y, 0);
        child.addComponent(UITransform).setContentSize(width, height);
        parent.addChild(child);
        return child;
      }
      function box(parent, name, rect, fill, stroke) {
        var pos = name === 'Dim' || name === 'ConfirmRoot' ? {
          x: 0,
          y: 0
        } : pauseDesignToLocal(rect);
        var node = make(parent, name, pos.x, pos.y, rect.width, rect.height);
        fallbackFill(node, rect.width, rect.height, fill, stroke);
        return node;
      }
      function fallbackFill(parent, width, height, fill, stroke) {
        var paint = make(parent, 'Paint', 0, 0, width, height);
        var graphics = paint.addComponent(Graphics);
        graphics.rect(-width / 2, -height / 2, width, height);
        graphics.fillColor = fill;
        graphics.fill();
        if (stroke) {
          graphics.lineWidth = 4;
          graphics.strokeColor = stroke;
          graphics.stroke();
        }
      }
      function label(parent, name, value, x, y, width, height, size, color) {
        var node = make(parent, name, x, y, width, height);
        var text = node.addComponent(Label);
        text.string = value;
        text.fontSize = size;
        text.lineHeight = size + 6;
        text.color = color;
        text.overflow = Label.Overflow.SHRINK;
        text.enableOutline = color === BONE;
        text.outlineColor = INK;
        text.outlineWidth = 2;
        text.horizontalAlign = Label.HorizontalAlign.CENTER;
        text.verticalAlign = Label.VerticalAlign.CENTER;
        return text;
      }
      function infoRow(panel, name, rect, panelRect, caption) {
        var localX = rect.x + rect.width / 2 - (panelRect.x + panelRect.width / 2);
        var localY = panelRect.y + panelRect.height / 2 - (rect.y + rect.height / 2);
        var row = make(panel, name, localX, localY, rect.width, rect.height);
        label(row, 'Label', caption, -140, 0, 180, rect.height, 26, MUTED);
        return label(row, 'Value', '', 120, 0, 280, rect.height, 30, BONE);
      }
      function mountPauseView(ctx, module) {
        var parent = ctx.layers.get('hud');
        if (typeof parent.addChild !== 'function') return;
        var host = make(parent, PAUSE_HOST_NAME, 0, 0, PAUSE_LAYOUT.designWidth, PAUSE_LAYOUT.designHeight);
        var component = host.addComponent(PauseView);
        if (component) component.configure(ctx, module);
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/Pet.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _createClass, cclegacy;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "f8b91Usk/lC8b3u3EsgUBMb", "Pet", undefined);
      var Pet = exports('Pet', /*#__PURE__*/function () {
        function Pet(ctx, weight) {
          this.pos = {
            x: 0,
            y: 0
          };
          this.vel = {
            x: 0,
            y: 0
          };
          this.previous = {
            x: 0,
            y: 0
          };
          this.hpValue = 100;
          this.maxHpValue = 100;
          this.immune = 0;
          this.active = false;
          this.landed = false;
          this.empty = false;
          this.ctx = void 0;
          this.weight = void 0;
          this.ctx = ctx;
          this.weight = weight;
        }
        var _proto = Pet.prototype;
        _proto.reset = function reset() {
          // P0 未定义，自选默认值: start at the arena center.
          this.pos.x = this.previous.x = this.ctx.arena.width / 2;
          this.pos.y = this.previous.y = this.ctx.arena.height / 2;
          this.vel.x = this.vel.y = 0;
          this.hpValue = this.maxHpValue = this.ctx.tunables.get('pet.maxHp');
          this.immune = 0;
          this.landed = this.empty = false;
          this.active = true;
        };
        _proto.stop = function stop() {
          this.active = false;
          this.vel.x = this.vel.y = 0;
        };
        _proto.setMode = function setMode(landed, empty) {
          this.landed = landed;
          this.empty = empty;
        };
        _proto.fixedUpdate = function fixedUpdate(dt) {
          if (!this.active || dt <= 0) return;
          this.immune = Math.max(0, this.immune - dt);
          this.previous.x = this.pos.x;
          this.previous.y = this.pos.y;
          if (this.hp <= 0) return;
          var input = this.ctx.services.get('input').frame;
          var mag = Math.max(0, Math.min(1, input.mag));
          var len = Math.hypot(input.dir.x, input.dir.y);
          var speed = input.touching && len > 0 ? this.maxSpeed * mag / len : 0;
          var targetX = input.dir.x * speed;
          var targetY = input.dir.y * speed;
          var stopping = Math.hypot(targetX, targetY) < Math.hypot(this.vel.x, this.vel.y);
          var time = this.ctx.tunables.get(stopping ? 'pet.decelTime' : 'pet.accelTime');
          // P0 未定义，自选默认值: exponential smoothing, time is its time constant.
          var alpha = time <= 0 ? 1 : 1 - Math.exp(-dt / time);
          var vx = this.vel.x + (targetX - this.vel.x) * alpha;
          var vy = this.vel.y + (targetY - this.vel.y) * alpha;
          var next = this.ctx.arena.clamp({
            x: this.pos.x + vx * dt,
            y: this.pos.y + vy * dt
          }, this.radius);
          this.vel.x = (next.x - this.pos.x) / dt;
          this.vel.y = (next.y - this.pos.y) / dt;
          this.pos.x = next.x;
          this.pos.y = next.y;
        }

        /** P1-07 / P1-numbers-batch1 §3.3: clamp `enemies.slowAt(pos)` into 0..1. */;
        _proto.groundSlow = function groundSlow() {
          if (!this.ctx.services.has('enemies')) return 0;
          var enemies = this.ctx.services.get('enemies');
          if (enemies.slowAt === undefined) return 0;
          var slow = enemies.slowAt(this.pos);
          if (!Number.isFinite(slow) || slow <= 0) return 0;
          if (slow >= 1) return 1;
          return slow;
        };
        _proto.isInvulnerable = function isInvulnerable() {
          return !this.active || this.hp <= 0 || this.immune > 1e-8 || this.ctx.tunables.getBool('pet.godMode');
        };
        _proto.applyDamage = function applyDamage(amount, by) {
          if (!Number.isFinite(amount) || amount <= 0 || this.isInvulnerable()) return false;
          var applied = Math.min(this.hpValue, amount);
          this.hpValue -= applied;
          this.immune = this.ctx.tunables.get('pet.invuln');
          this.ctx.events.emit('player:damaged', {
            amount: applied,
            byKind: by.kind,
            state: this.state
          });
          if (this.hp <= 0) this.ctx.events.emit('player:died', {});
          return true;
        };
        _createClass(Pet, [{
          key: "radius",
          get: function get() {
            return this.ctx.tunables.get('pet.radius');
          }
        }, {
          key: "maxSpeed",
          get: function get() {
            var weight = this.ctx.tunables.get('pet.speed') * (1 - this.ctx.tunables.get('pet.weightSlow') * (this.weight() - 1));
            // core IEnemyQuery.slowAt: Boss 车辙, 不叠加; absent / 0 means no ground slow.
            return weight * (1 - this.groundSlow());
          }
        }, {
          key: "hp",
          get: function get() {
            return this.hpValue;
          }
        }, {
          key: "maxHp",
          get: function get() {
            return this.maxHpValue;
          }
        }, {
          key: "state",
          get: function get() {
            return this.hp <= 0 ? 'dead' : this.landed ? 'jianzhen' : this.empty ? 'empty' : 'normal';
          }
        }, {
          key: "damageImmune",
          get: function get() {
            return this.immune > 1e-8;
          }
        }]);
        return Pet;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/Presets.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './Tunables.ts', './Storage.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, cclegacy, hashValues, isRecord;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      hashValues = module.hashValues;
    }, function (module) {
      isRecord = module.isRecord;
    }],
    execute: function () {
      exports({
        applyPlayMode: applyPlayMode,
        parameterGroups: parameterGroups
      });
      cclegacy._RF.push({}, "6e74dL7TjZBL68Qul10wCpw", "Presets", undefined);
      var STORAGE_KEY = 'yuedie.tuning.presets.v1';

      // P0 未定义，自选默认值: portable preset schema version 1 and local storage namespace.

      var Presets = exports('Presets', /*#__PURE__*/function () {
        function Presets(tunables, store) {
          this.saved = new Map();
          this.tunables = void 0;
          this.store = void 0;
          this.tunables = tunables;
          this.store = store;
          var data = store.read(STORAGE_KEY);
          if (!Array.isArray(data)) return;
          for (var _iterator = _createForOfIteratorHelperLoose(data), _step; !(_step = _iterator()).done;) {
            var item = _step.value;
            try {
              var preset = parsePreset(item);
              this.saved.set(preset.name, preset);
            } catch (_unused) {
              store.error = '部分预设损坏，已跳过';
            }
          }
        }
        var _proto = Presets.prototype;
        _proto.names = function names() {
          // Cocos Babel loose array spreads do not unpack Map iterators.
          return Array.from(this.saved.keys()).sort();
        };
        _proto.save = function save(name) {
          var preset = this.capture(name);
          this.saved.set(preset.name, preset);
          return this.store.write(STORAGE_KEY, Array.from(this.saved.values()));
        };
        _proto["delete"] = function _delete(name) {
          this.saved["delete"](name);
          return this.store.write(STORAGE_KEY, Array.from(this.saved.values()));
        };
        _proto.load = function load(name) {
          var preset = this.saved.get(name);
          if (!preset) throw new Error('未找到预设');
          return this.apply(preset);
        };
        _proto.exportJson = function exportJson(name) {
          if (name === void 0) {
            name = '导出预设';
          }
          return JSON.stringify(this.capture(name), null, 4);
        };
        _proto.importJson = function importJson(text) {
          // Validate every field before applying anything to the live registry.
          return this.apply(parsePreset(JSON.parse(text)));
        };
        _proto.capture = function capture(name) {
          var trimmed = name.trim();
          if (!trimmed) throw new Error('请输入预设名');
          return {
            version: 1,
            name: trimmed,
            hash: this.tunables.hash(),
            values: this.tunables.snapshot()
          };
        };
        _proto.apply = function apply(preset) {
          this.tunables.load(preset.values);
          return this.tunables.hash() === preset.hash ? "\u5DF2\u5E94\u7528 \xB7 " + preset.hash : "\u5DF2\u5E94\u7528\u517C\u5BB9\u9879\uFF1B\u54C8\u5E0C\u4E0D\u540C\uFF08\u53C2\u6570\u7F3A\u5931\u3001\u65B0\u589E\u6216\u5DF2\u5939\u503C\uFF09\xB7 " + this.tunables.hash();
        };
        return Presets;
      }());
      function parsePreset(value) {
        if (!isRecord(value) || value.version !== 1 || typeof value.name !== 'string' || !value.name.trim() || typeof value.hash !== 'string' || !isRecord(value.values)) throw new Error('预设格式无效（需要 version/name/hash/values）');
        var values = {};
        for (var _i = 0, _Object$keys = Object.keys(value.values); _i < _Object$keys.length; _i++) {
          var key = _Object$keys[_i];
          var number = value.values[key];
          if (typeof number !== 'number' || !Number.isFinite(number)) throw new Error("\u53C2\u6570 " + key + " \u5FC5\u987B\u662F\u6709\u9650\u6570\u503C");
          if (key === '__proto__' || key === 'constructor' || key === 'prototype') throw new Error('预设参数名无效');
          values[key] = number;
        }
        if (hashValues(values) !== value.hash) throw new Error('预设哈希校验失败');
        return {
          version: 1,
          name: value.name.trim(),
          hash: value.hash,
          values: values
        };
      }
      function parameterGroups(tunables, search, collapsed) {
        var groups = new Map();
        var query = search.trim().toLowerCase();
        for (var _iterator2 = _createForOfIteratorHelperLoose(tunables.all()), _step2; !(_step2 = _iterator2()).done;) {
          var _def$note;
          var def = _step2.value;
          if (query && [def.key, def.label, def.group, (_def$note = def.note) != null ? _def$note : ''].join(' ').toLowerCase().indexOf(query) < 0) continue;
          var group = groups.get(def.group);
          if (!group) {
            group = {
              name: def.group,
              collapsed: !query && collapsed.has(def.group),
              defs: []
            };
            groups.set(def.group, group);
          }
          group.defs.push(def);
        }
        return Array.from(groups.values());
      }

      /** P0 §9.1: drag-only disables exactly these three mechanisms. */
      function applyPlayMode(tunables, all) {
        var changed = [];
        for (var _i2 = 0, _arr = ['mech.chain', 'mech.throw', 'mech.loop']; _i2 < _arr.length; _i2++) {
          var key = _arr[_i2];
          if (!tunables.has(key)) continue;
          tunables.set(key, all ? 1 : 0);
          changed.push(key);
        }
        return changed;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/RegionData.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "fd879I6PVpBnrZr3Tv/w8cb", "RegionData", undefined); // Generated by tools/terrain/gen-regions.mjs. Do not edit; rerun the script instead.
      // Sources: docs/ui/batch2/regions.json (sha256 6d6d38fa378d49d2)
      //          assets/art/terrain/mask/mask_regions_240x360.png (sha256 a0da84c48a052109)
      // Coordinates are map u with origin bottom-left, +y up (P0 §3 地图); the sources are top-left, y down.
      var REGION_MAP_W = exports('REGION_MAP_W', 60);
      var REGION_MAP_H = exports('REGION_MAP_H', 90);
      var REGION_GRID_W = exports('REGION_GRID_W', 240);
      var REGION_GRID_H = exports('REGION_GRID_H', 360);
      var REGION_SPAWN = exports('REGION_SPAWN', {
        x: 30,
        y: 45
      });
      var REGIONS = exports('REGIONS', [{
        id: 0,
        key: 'grassland',
        name: '草地',
        turf: 'grass',
        mask: 'w0123.r',
        areaU2: 900,
        centroid: {
          x: 30.5,
          y: 44.24
        }
      }, {
        id: 1,
        key: 'savanna',
        name: '黄草原',
        turf: 'savanna',
        mask: 'w0123.g',
        areaU2: 900,
        centroid: {
          x: 11.62,
          y: 56.83
        }
      }, {
        id: 2,
        key: 'dark_forest',
        name: '暗林地',
        turf: 'forest',
        mask: 'w0123.b',
        areaU2: 900,
        centroid: {
          x: 49.27,
          y: 56.02
        }
      }, {
        id: 3,
        key: 'rocky',
        name: '岩石地',
        turf: 'rocky',
        mask: 'w0123.a',
        areaU2: 900,
        centroid: {
          x: 14.87,
          y: 15.53
        }
      }, {
        id: 4,
        key: 'ruins',
        name: '废墟',
        turf: 'ruins',
        mask: 'w45.r',
        areaU2: 900,
        centroid: {
          x: 44.37,
          y: 14.89
        }
      }, {
        id: 5,
        key: 'ash',
        name: '焦土',
        turf: 'ash',
        mask: 'w45.g',
        areaU2: 900,
        centroid: {
          x: 29.37,
          y: 82.48
        }
      }]);

      /** Grid row r (0 = top edge of the map) owns runs REGION_ROW_START[r] .. REGION_ROW_START[r + 1] - 1. */
      var REGION_ROW_START = exports('REGION_ROW_START', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 58, 62, 66, 74, 81, 88, 93, 96, 100, 104, 108, 110, 112, 114, 116, 118, 120, 122, 124, 126, 128, 130, 132, 134, 136, 138, 140, 142, 144, 146, 148, 150, 152, 154, 156, 158, 160, 162, 164, 166, 168, 170, 172, 174, 176, 178, 180, 182, 184, 186, 188, 190, 192, 194, 196, 198, 200, 202, 204, 206, 208, 210, 212, 214, 216, 219, 222, 225, 228, 231, 234, 237, 240, 243, 246, 249, 252, 255, 258, 261, 264, 267, 270, 273, 276, 279, 282, 285, 288, 291, 294, 297, 300, 303, 306, 309, 312, 315, 318, 321, 324, 327, 330, 333, 336, 339, 342, 345, 348, 351, 354, 357, 360, 363, 366, 369, 372, 375, 378, 381, 384, 387, 390, 393, 396, 399, 402, 405, 408, 411, 414, 417, 420, 423, 426, 429, 432, 435, 438, 441, 444, 447, 450, 453, 456, 459, 462, 465, 468, 471, 474, 477, 480, 483, 486, 489, 492, 496, 500, 504, 508, 512, 516, 520, 524, 528, 532, 536, 540, 544, 548, 553, 558, 563, 568, 573, 578, 583, 588, 593, 598, 603, 608, 613, 618, 623, 628, 633, 638, 643, 648, 653, 661, 665, 669, 673, 677, 681, 685, 689, 693, 697, 701, 705, 709, 713, 717, 721, 724, 727, 730, 733, 736, 739, 742, 745, 748, 751, 754, 757, 760, 763, 766, 768, 770, 772, 774, 776, 778, 780, 782, 784, 786, 788, 790, 792, 794, 796, 798, 800, 802, 804, 806, 808, 810, 812, 814, 816, 818, 820, 822, 824, 826, 828, 830, 832, 834, 836, 838, 840, 842, 844, 846, 848, 850, 852, 854, 856, 858, 860, 862, 864, 866, 868, 870, 872, 874, 876, 878, 880, 882, 884, 886, 888, 890, 892, 894, 896, 898, 900, 902, 904, 906, 908, 910, 912, 914, 916, 918, 920, 922, 924, 926, 928, 930]);

      /** Region of each run. */
      var REGION_RUN_ID = exports('REGION_RUN_ID', [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 2, 5, 5, 2, 5, 2, 5, 2, 5, 2, 5, 1, 5, 2, 5, 2, 5, 2, 5, 1, 5, 1, 2, 5, 2, 5, 1, 5, 1, 2, 5, 2, 5, 1, 5, 1, 2, 5, 1, 2, 1, 5, 1, 2, 1, 5, 1, 2, 1, 5, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 3, 0, 2, 1, 3, 0, 2, 1, 3, 0, 2, 1, 3, 0, 2, 1, 3, 0, 2, 1, 3, 0, 2, 1, 3, 0, 2, 1, 3, 0, 2, 1, 3, 0, 2, 1, 3, 0, 2, 1, 3, 0, 2, 1, 3, 0, 2, 1, 3, 0, 2, 1, 3, 0, 2, 1, 3, 0, 4, 2, 1, 3, 0, 4, 2, 1, 3, 0, 4, 2, 1, 3, 0, 4, 2, 1, 3, 0, 4, 2, 1, 3, 0, 4, 2, 1, 3, 0, 4, 2, 1, 3, 0, 4, 2, 1, 3, 0, 4, 2, 1, 3, 0, 4, 2, 1, 3, 0, 4, 2, 1, 3, 0, 4, 2, 1, 3, 0, 4, 2, 1, 3, 0, 4, 2, 1, 3, 0, 4, 2, 1, 3, 0, 4, 2, 1, 3, 0, 4, 2, 1, 3, 0, 4, 2, 1, 3, 0, 4, 2, 1, 3, 0, 4, 2, 1, 3, 0, 4, 2, 1, 3, 4, 0, 4, 0, 4, 2, 1, 3, 4, 2, 1, 3, 4, 2, 1, 3, 4, 2, 1, 3, 4, 2, 1, 3, 4, 2, 1, 3, 4, 2, 1, 3, 4, 2, 1, 3, 4, 2, 1, 3, 4, 2, 1, 3, 4, 2, 1, 3, 4, 2, 1, 3, 4, 2, 1, 3, 4, 2, 1, 3, 4, 2, 1, 3, 4, 2, 1, 3, 4, 1, 3, 4, 1, 3, 4, 1, 3, 4, 1, 3, 4, 1, 3, 4, 1, 3, 4, 1, 3, 4, 1, 3, 4, 1, 3, 4, 1, 3, 4, 1, 3, 4, 1, 3, 4, 1, 3, 4, 1, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4]);

      /** Exclusive end column of each run; a row's last run ends at REGION_GRID_W. */
      var REGION_RUN_END = exports('REGION_RUN_END', [240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 149, 156, 240, 144, 160, 232, 240, 141, 163, 219, 240, 77, 87, 138, 167, 203, 210, 214, 240, 68, 99, 123, 132, 172, 192, 240, 57, 103, 118, 132, 181, 187, 240, 52, 108, 114, 132, 240, 49, 132, 240, 2, 47, 131, 240, 16, 44, 131, 240, 21, 37, 131, 240, 131, 240, 131, 240, 131, 240, 131, 240, 131, 240, 131, 240, 131, 240, 131, 240, 131, 240, 130, 240, 130, 240, 130, 240, 129, 240, 129, 240, 128, 240, 127, 240, 127, 240, 126, 240, 126, 240, 125, 240, 125, 240, 124, 240, 124, 240, 124, 240, 123, 240, 123, 240, 122, 240, 122, 240, 122, 240, 121, 240, 121, 240, 121, 240, 121, 240, 121, 240, 121, 240, 121, 240, 122, 240, 122, 240, 122, 240, 123, 240, 123, 240, 123, 240, 123, 240, 123, 240, 122, 240, 122, 240, 122, 240, 121, 240, 121, 240, 121, 240, 121, 240, 122, 240, 122, 240, 123, 240, 112, 129, 240, 104, 134, 240, 98, 137, 240, 95, 141, 240, 92, 143, 240, 89, 147, 240, 86, 151, 240, 85, 155, 240, 83, 158, 240, 82, 161, 240, 81, 164, 240, 79, 168, 240, 78, 173, 240, 77, 178, 240, 75, 181, 240, 74, 183, 240, 73, 184, 240, 71, 185, 240, 70, 186, 240, 69, 187, 240, 68, 187, 240, 67, 188, 240, 67, 188, 240, 66, 188, 240, 65, 189, 240, 65, 189, 240, 64, 189, 240, 64, 189, 240, 63, 189, 240, 63, 189, 240, 63, 189, 240, 62, 190, 240, 62, 190, 240, 62, 190, 240, 61, 189, 240, 60, 189, 240, 60, 189, 240, 59, 189, 240, 59, 189, 240, 58, 189, 240, 57, 189, 240, 57, 189, 240, 56, 189, 240, 56, 189, 240, 56, 189, 240, 55, 189, 240, 55, 189, 240, 54, 189, 240, 54, 189, 240, 54, 189, 240, 53, 189, 240, 53, 189, 240, 52, 189, 240, 52, 189, 240, 52, 189, 240, 51, 189, 240, 51, 189, 240, 51, 189, 240, 51, 189, 240, 51, 188, 240, 50, 188, 240, 50, 188, 240, 50, 188, 240, 49, 188, 240, 49, 188, 240, 49, 188, 240, 48, 187, 240, 48, 187, 240, 48, 187, 240, 48, 187, 240, 48, 187, 240, 48, 187, 240, 48, 187, 240, 48, 186, 240, 48, 186, 240, 48, 186, 240, 49, 186, 240, 49, 186, 240, 49, 185, 240, 49, 185, 240, 50, 185, 240, 50, 185, 240, 51, 185, 240, 51, 185, 240, 52, 185, 240, 52, 185, 240, 53, 185, 240, 54, 185, 240, 55, 185, 240, 56, 184, 240, 58, 184, 240, 59, 184, 240, 45, 60, 183, 240, 42, 61, 183, 240, 41, 61, 182, 240, 40, 62, 182, 240, 39, 63, 182, 240, 38, 63, 181, 240, 37, 64, 181, 240, 37, 64, 180, 240, 36, 65, 180, 240, 36, 65, 180, 240, 35, 66, 179, 240, 35, 66, 179, 240, 34, 67, 178, 240, 34, 67, 178, 240, 33, 67, 177, 178, 240, 32, 68, 176, 179, 240, 32, 68, 175, 180, 240, 31, 69, 174, 182, 240, 31, 69, 173, 183, 240, 30, 70, 172, 185, 240, 29, 72, 171, 186, 240, 29, 77, 170, 188, 240, 28, 83, 169, 190, 240, 28, 86, 168, 192, 240, 27, 88, 166, 194, 240, 27, 91, 165, 195, 240, 26, 94, 163, 197, 240, 25, 97, 162, 199, 240, 25, 99, 160, 200, 240, 24, 101, 159, 202, 240, 24, 103, 157, 204, 240, 23, 105, 154, 206, 240, 22, 108, 151, 208, 240, 22, 111, 147, 210, 240, 21, 114, 142, 213, 240, 20, 113, 118, 122, 127, 138, 215, 240, 20, 113, 217, 240, 19, 112, 219, 240, 19, 111, 220, 240, 18, 110, 222, 240, 17, 110, 224, 240, 17, 110, 227, 240, 16, 110, 231, 240, 16, 110, 232, 240, 15, 110, 233, 240, 15, 110, 233, 240, 14, 111, 234, 240, 14, 111, 235, 240, 13, 112, 236, 240, 13, 112, 237, 240, 12, 113, 239, 240, 12, 113, 240, 12, 113, 240, 11, 114, 240, 11, 114, 240, 10, 114, 240, 9, 114, 240, 9, 114, 240, 8, 114, 240, 8, 115, 240, 7, 115, 240, 6, 115, 240, 5, 115, 240, 4, 115, 240, 3, 114, 240, 2, 114, 240, 114, 240, 114, 240, 114, 240, 114, 240, 114, 240, 114, 240, 113, 240, 113, 240, 113, 240, 113, 240, 113, 240, 113, 240, 113, 240, 113, 240, 113, 240, 113, 240, 113, 240, 112, 240, 112, 240, 112, 240, 112, 240, 112, 240, 112, 240, 112, 240, 112, 240, 112, 240, 112, 240, 112, 240, 112, 240, 112, 240, 113, 240, 113, 240, 114, 240, 114, 240, 115, 240, 115, 240, 116, 240, 116, 240, 117, 240, 117, 240, 117, 240, 118, 240, 118, 240, 118, 240, 118, 240, 118, 240, 118, 240, 118, 240, 118, 240, 118, 240, 119, 240, 119, 240, 119, 240, 120, 240, 120, 240, 120, 240, 121, 240, 121, 240, 122, 240, 122, 240, 122, 240, 122, 240, 122, 240, 123, 240, 123, 240, 123, 240, 123, 240, 123, 240, 123, 240, 123, 240, 123, 240, 124, 240, 124, 240, 124, 240, 125, 240, 125, 240, 126, 240, 126, 240, 127, 240, 127, 240, 127, 240, 128, 240]);
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/Regions.ts", ['cc', './RegionData.ts'], function (exports) {
  var cclegacy, REGION_RUN_END, REGION_RUN_ID, REGIONS, REGION_ROW_START, REGION_GRID_W, REGION_GRID_H, REGION_MAP_W, REGION_MAP_H;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      REGION_RUN_END = module.REGION_RUN_END;
      REGION_RUN_ID = module.REGION_RUN_ID;
      REGIONS = module.REGIONS;
      REGION_ROW_START = module.REGION_ROW_START;
      REGION_GRID_W = module.REGION_GRID_W;
      REGION_GRID_H = module.REGION_GRID_H;
      REGION_MAP_W = module.REGION_MAP_W;
      REGION_MAP_H = module.REGION_MAP_H;
    }],
    execute: function () {
      exports({
        regionAt: regionAt,
        regionInfo: regionInfo
      });
      cclegacy._RF.push({}, "f04f6SLnRpImqWdaGfbmyBl", "Regions", undefined);

      /**
       * Region under map point (x, y): map u, origin bottom-left, +y up (`ctx.arena`).
       * The data is authored for a 60×90 u map; other sizes stretch it the same way
       * the ground shader stretches the blend masks. Points outside the map, and
       * non-finite coordinates, resolve to the nearest edge cell.
       * Pure lookup on generated run-length data; no pixels are read at runtime.
       */
      function regionAt(x, y, mapW, mapH) {
        if (mapW === void 0) {
          mapW = REGION_MAP_W;
        }
        if (mapH === void 0) {
          mapH = REGION_MAP_H;
        }
        var col = cellIndex(x / mapW, REGION_GRID_W);
        var row = cellIndex(1 - y / mapH, REGION_GRID_H);
        var end = REGION_ROW_START[row + 1];
        for (var i = REGION_ROW_START[row]; i < end; i++) {
          if (col < REGION_RUN_END[i]) return REGION_RUN_ID[i];
        }
        return REGION_RUN_ID[end - 1];
      }
      function regionInfo(id) {
        return REGIONS[id];
      }
      function cellIndex(t, n) {
        var i = Math.floor(t * n);
        if (!(i >= 0)) return 0;
        return i >= n ? n - 1 : i;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/Rng.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports({
        createForgeRng: createForgeRng,
        createSessionRng: createSessionRng,
        deriveStreamSeed: deriveStreamSeed,
        mulberry32: mulberry32
      });
      cclegacy._RF.push({}, "632a9LOHLFGP6hgqN4+0rC9", "Rng", undefined);
      /** Seeded stream. `next` returns a float in [0, 1). */
      /** mulberry32. The same seed always yields the same sequence in one JS engine. */
      function mulberry32(seed) {
        var a = seed >>> 0;
        var rng = {
          next: function next() {
            a = a + 0x6d2b79f5 >>> 0;
            var t = Math.imul(a ^ a >>> 15, 1 | a);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
          },
          nextInt: function nextInt(max) {
            if (!Number.isInteger(max) || max <= 0) {
              throw new Error("nextInt max must be a positive integer, got " + max);
            }
            return Math.floor(rng.next() * max);
          },
          range: function range(min, max) {
            return min + (max - min) * rng.next();
          }
        };
        return rng;
      }
      var RngStream = exports('RngStream', {
        Spawn: 1,
        Loot: 2,
        Fx: 3,
        /** Shop shelf and pick-1-of-3 offers (docs/design/GDD.md §13.3 rngShop). */
        Shop: 4,
        /** Base of the per-sword forge streams; see `createForgeRng`. Not part of `SessionRng`. */
        Forge: 5
      });

      /** Mix a session seed with a stream id into a non-zero uint32. */
      function deriveStreamSeed(sessionSeed, streamId) {
        var x = sessionSeed >>> 0 ^ Math.imul(streamId + 1 >>> 0, 0x9e3779b9);
        x = Math.imul(x ^ x >>> 16, 0x7feb352d);
        x = Math.imul(x ^ x >>> 15, 0x846ca68b);
        x = (x ^ x >>> 16) >>> 0;
        return x === 0 ? 1 : x;
      }
      function createSessionRng(sessionSeed) {
        return {
          spawn: mulberry32(deriveStreamSeed(sessionSeed, RngStream.Spawn)),
          loot: mulberry32(deriveStreamSeed(sessionSeed, RngStream.Loot)),
          fx: mulberry32(deriveStreamSeed(sessionSeed, RngStream.Fx)),
          shop: mulberry32(deriveStreamSeed(sessionSeed, RngStream.Shop))
        };
      }

      /**
       * rngForge for main sword #k of the run (docs/design/GDD.md §13.3, §9.7 红线;
       * docs/design/P1-tasks.md P1-04). The seed is a
       * function of the session seed and k only, so nothing else (ads, platform,
       * player history, device) can change a tube's draws. Forge owns the instance;
       * it is deliberately not on `ctx.rng`.
       */
      function createForgeRng(sessionSeed, k) {
        return mulberry32(deriveStreamSeed(deriveStreamSeed(sessionSeed, RngStream.Forge), k));
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/RunModule.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './SystemOrder.ts', './Tunables.ts', './ChainCamera.ts', './DoorPoint.ts', './RunParams.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, _createClass, cclegacy, SystemOrder, Tunables, smoothZoom, forgeZoomParams, chainOccupancySlots, chainCameraZoom, chainLengthU, collectChainLevels, worldZoomOffset, pickDoorPoint, RUN_PARAMS, RUN_MODES, wavePlan, RUN_PARAM_ALIASES;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      SystemOrder = module.SystemOrder;
    }, function (module) {
      Tunables = module.Tunables;
    }, function (module) {
      smoothZoom = module.smoothZoom;
      forgeZoomParams = module.forgeZoomParams;
      chainOccupancySlots = module.chainOccupancySlots;
      chainCameraZoom = module.chainCameraZoom;
      chainLengthU = module.chainLengthU;
      collectChainLevels = module.collectChainLevels;
      worldZoomOffset = module.worldZoomOffset;
    }, function (module) {
      pickDoorPoint = module.pickDoorPoint;
    }, function (module) {
      RUN_PARAMS = module.RUN_PARAMS;
      RUN_MODES = module.RUN_MODES;
      wavePlan = module.wavePlan;
      RUN_PARAM_ALIASES = module.RUN_PARAM_ALIASES;
    }],
    execute: function () {
      cclegacy._RF.push({}, "72663c2715Eob5UZ3rCI/I/", "RunModule", undefined);
      var WORLD_ZOOM_LAYERS = ['arena', 'trail', 'enemies', 'rig', 'fx'];
      var EPS = 1e-9;

      /** Frozen data shown by S19 / S20 after `run:end` (P1-tasks P1-08). */

      /**
       * Run state machine (GDD §5.2 单局结构; P1-tasks P1-01). Provides `run` and emits
       * the run / wave events in the order `core/events.ts` documents.
       *
       * 选宠 → 战斗波 →（炉门）→ 三选一 → 铁匠铺 → 下一波 / Boss 波 → 宝箱 → … → 结算.
       * A phase is entered only when the module that resolves it is installed:
       * `upgrade` needs `upgrade` + `loot` with pending picks, `forge` needs `anvil`,
       * `chest` needs `boss:defeated {chest: true}` (enemy then emits
       * `upgrade:done {source:'bossChest'}`). Otherwise the run moves straight on.
       * Boss waves have no door (GDD §5.2 打死为止): they end on `boss:defeated` (P1-07).
       */
      var RunModule = exports('RunModule', /*#__PURE__*/function () {
        function RunModule(ctx) {
          this.modeValue = 'standard';
          this.plan = wavePlan('standard');
          this.phaseValue = 'petSelect';
          this.waveValue = 0;
          this.elapsed = 0;
          this.minDuration = null;
          this.combatSeconds = 0;
          this.door = null;
          this.doorOpenFor = 0;
          this.frenzyFired = false;
          this.chestPending = false;
          this.running = false;
          this.attached = false;
          this.pausedByRun = false;
          this.pausedByPause = false;
          this.pausedByResult = false;
          this.pauseOpenValue = false;
          this.abandonConfirmValue = false;
          this.killsValue = 0;
          this.settlementValue = null;
          this.zoomValue = 1;
          this.unsubs = [];
          this.ctx = void 0;
          this.ctx = ctx;
        }
        var _proto = RunModule.prototype;
        _proto.install = function install() {
          var _this = this;
          var t = this.ctx.tunables;
          t.define(RUN_PARAMS.filter(function (def) {
            return !t.has(def.key);
          }));
          // ITunables does not expose aliases; the live registry is always core's Tunables.
          if (t instanceof Tunables) {
            for (var _iterator = _createForOfIteratorHelperLoose(RUN_PARAM_ALIASES), _step; !(_step = _iterator()).done;) {
              var _step$value = _step.value,
                from = _step$value[0],
                to = _step$value[1];
              t.registerAlias(from, to);
            }
          } else {
            console.warn('[run] tunables registry has no aliases; old forge.door* presets will not load');
          }
          this.ctx.services.provide('run', this);
          this.ctx.loop.addSystem({
            id: 'run.flow',
            order: SystemOrder.Run,
            fixedUpdate: function fixedUpdate(dt) {
              _this.step(dt);
              _this.stepZoom(dt);
            },
            render: function render() {
              return _this.applyZoom();
            }
          });
          this.attach();
        };
        _proto.attach = function attach() {
          var _this2 = this;
          if (this.attached) return;
          this.attached = true;
          var _this$ctx = this.ctx,
            events = _this$ctx.events,
            services = _this$ctx.services,
            camera = _this$ctx.camera;
          this.unsubs.push(events.on('session:start', function () {
            return _this2.start();
          }));
          this.unsubs.push(events.on('enemy:died', function () {
            if (_this2.running) _this2.killsValue += 1;
          }));
          this.unsubs.push(events.on('player:died', function () {
            return _this2.finish('died');
          }));
          this.unsubs.push(events.on('session:end', function (_ref) {
            var reason = _ref.reason;
            return _this2.finish(reason === 'died' ? 'died' : 'abandoned');
          }));
          this.unsubs.push(events.on('upgrade:done', function (_ref2) {
            var source = _ref2.source;
            if (!_this2.running) return;
            if (_this2.phaseValue === 'upgrade' && source === 'levelUp') _this2.toForge();else if (_this2.phaseValue === 'chest' && source === 'bossChest') _this2.toUpgrade();
          }));
          this.unsubs.push(events.on('boss:defeated', function (_ref3) {
            var wave = _ref3.wave,
              chest = _ref3.chest;
            if (!_this2.running || _this2.phaseValue !== 'boss' || wave !== _this2.waveValue) return;
            // The boss emits no enemy:died; S20 击杀 still counts it. Before clearWave: wave 10 settles inside it.
            _this2.killsValue += 1;
            _this2.chestPending = chest;
            _this2.clearWave();
          }));
          this.unsubs.push(events.on('forge:leave', function () {
            if (_this2.running && _this2.phaseValue === 'forge') _this2.beginWave(_this2.waveValue + 1);
          }));
          this.unsubs.push(camera.addIndicator('forgeDoor', function () {
            return _this2.door;
          }));
          if (services.has('platform')) {
            var platform = services.get('platform');
            this.unsubs.push(platform.onHide(function () {
              return _this2.onHide();
            }));
            this.unsubs.push(platform.onShow(function () {
              return _this2.onShow();
            }));
          }
        };
        _proto.detach = function detach() {
          if (!this.attached) return;
          this.attached = false;
          for (var _iterator2 = _createForOfIteratorHelperLoose(this.unsubs), _step2; !(_step2 = _iterator2()).done;) {
            var off = _step2.value;
            off();
          }
          this.unsubs.length = 0;
        };
        _proto.spec = function spec() {
          var _this$plan;
          return (_this$plan = this.plan[this.waveValue - 1]) != null ? _this$plan : null;
        };
        _proto.start = function start() {
          var _RUN_MODES$this$ctx$t;
          this.modeValue = (_RUN_MODES$this$ctx$t = RUN_MODES[this.ctx.tunables.get('run.mode')]) != null ? _RUN_MODES$this$ctx$t : 'standard';
          this.plan = wavePlan(this.modeValue);
          this.phaseValue = 'petSelect';
          this.waveValue = 0;
          this.elapsed = 0;
          this.minDuration = null;
          this.combatSeconds = 0;
          this.door = null;
          this.doorOpenFor = 0;
          this.frenzyFired = false;
          this.chestPending = false;
          this.killsValue = 0;
          this.settlementValue = null;
          this.zoomValue = 1;
          this.running = true;
          this.dismissPause(true);
          if (this.pausedByResult) {
            this.pausedByResult = false;
            if (this.ctx.loop.paused) this.ctx.loop.resume();
          }
          this.ctx.events.emit('run:start', {
            mode: this.modeValue,
            waveCount: this.plan.length
          });
        };
        _proto.step = function step(dt) {
          if (!this.attached || !this.running) return;
          // P1 MVP has one fixed pet (P1-tasks §1 最小闭环: 默认柯基进场), so 选宠 resolves on the first step.
          if (this.phaseValue === 'petSelect') {
            this.beginWave(1);
            return;
          }
          if (!this.combatActive) return;
          this.elapsed += dt;
          this.combatSeconds += dt;
          var t = this.ctx.tunables;
          if (!this.door) {
            var at = this.minDuration;
            if (at !== null && this.elapsed + EPS >= at) this.openDoor();
            return;
          }
          this.doorOpenFor += dt;
          // GDD §5.2 / §8.2: one 狂潮 elite per wave, 30 s after the door opens. Boss waves have no door by design.
          if (!this.frenzyFired && !this.bossWave && this.doorOpenFor + EPS >= t.get('run.frenzyDelay')) {
            this.frenzyFired = true;
            var wave = this.waveValue;
            this.ctx.events.emit('wave:frenzy', {
              wave: wave
            });
            if (!this.running || this.waveValue !== wave || !this.door) return;
          }
          if (this.petAtDoor(this.door)) this.clearWave();
        };
        _proto.openDoor = function openDoor() {
          var _this3 = this;
          var t = this.ctx.tunables;
          var pet = this.petPos();
          var pos = pickDoorPoint({
            pet: pet,
            minDist: t.get('run.doorMinDist'),
            maxDist: t.get('run.doorMaxDist'),
            wallMargin: t.get('run.doorWallMargin'),
            mapWidth: this.ctx.arena.width,
            mapHeight: this.ctx.arena.height,
            inView: function inView(p) {
              return _this3.ctx.camera.inView(p);
            },
            rng: this.ctx.rng.spawn
          });
          this.door = pos;
          this.doorOpenFor = 0;
          this.ctx.events.emit('wave:doorOpen', {
            wave: this.waveValue,
            pos: {
              x: pos.x,
              y: pos.y
            }
          });
        };
        _proto.stepZoom = function stepZoom(dt) {
          if (!this.attached) return;
          var target = this.running && this.combatActive ? this.targetZoom() : 1;
          this.zoomValue = smoothZoom(this.zoomValue, target, dt, this.ctx.tunables.get('run.chainZoomSmoothS'));
        };
        _proto.targetZoom = function targetZoom() {
          var t = this.ctx.tunables;
          var params = forgeZoomParams(t);
          var occupancy = chainOccupancySlots(this.chainLevels(), params);
          return chainCameraZoom({
            lengthU: chainLengthU(occupancy, params.get('forge.chainSlotPx')),
            viewW: this.ctx.camera.viewW,
            viewH: this.ctx.camera.viewH,
            startSlots: t.get('run.chainZoomStartSlots'),
            zoomMin: t.get('run.chainZoomMin'),
            slotPx: params.get('forge.chainSlotPx')
          });
        };
        _proto.chainLevels = function chainLevels() {
          var grades;
          var slots = 0;
          if (this.ctx.services.has('swordRig')) {
            var rig = this.ctx.services.get('swordRig');
            grades = rig.linkGrades;
            slots = rig.slots;
          }
          var main = this.ctx.services.has('anvil') ? this.ctx.services.get('anvil').sword.level : null;
          return collectChainLevels(grades, slots, main);
        }

        /**
         * Scale world layers around the view center. HUD / debug stay 1:1.
         * Core `ctx.camera` is left at 10u × 15u so spawn and `inView` stay put.
         */;
        _proto.applyZoom = function applyZoom() {
          if (!this.attached) return;
          var origin = this.ctx.toPx({
            x: 0,
            y: 0
          });
          var unit = this.ctx.toPx({
            x: 1,
            y: 0
          });
          var ppu = unit.x - origin.x;
          if (!(ppu > 0)) return;
          var offset = worldZoomOffset(this.ctx.camera.viewW, this.ctx.camera.viewH, ppu, this.zoomValue);
          for (var i = 0; i < WORLD_ZOOM_LAYERS.length; i++) {
            applyWorldLayerZoom(this.ctx.layers.get(WORLD_ZOOM_LAYERS[i]), this.zoomValue, offset.x, offset.y);
          }
        };
        _proto.petPos = function petPos() {
          if (this.ctx.services.has('player')) return this.ctx.services.get('player').pos;
          return {
            x: this.ctx.arena.width / 2,
            y: this.ctx.arena.height / 2
          };
        };
        _proto.petAtDoor = function petAtDoor(door) {
          if (!this.ctx.services.has('player')) return false;
          var player = this.ctx.services.get('player');
          var reach = this.ctx.tunables.get('run.doorRadius') + player.radius;
          return Math.hypot(player.pos.x - door.x, player.pos.y - door.y) <= reach + EPS;
        }

        /**
         * Pet walked into the door, or the boss died. `wave:clear` precedes the phase change.
         * The final boss goes straight to 结算 with no chest (P1-tasks Q2: 打完直接撤离结算).
         */;
        _proto.clearWave = function clearWave() {
          var wave = this.waveValue;
          var chest = this.chestPending && this.bossWave;
          this.door = null;
          this.chestPending = false;
          this.ctx.events.emit('wave:clear', {
            wave: wave,
            boss: this.bossWave,
            duration: this.elapsed
          });
          if (!this.running || this.waveValue !== wave) return;
          if (wave >= this.plan.length) this.finish('victory');else if (chest) this.setPhase('chest');else this.toUpgrade();
        }

        /** GDD §5.2 / §7.5: 这一波升了几级就选几次; skipped when there is nothing to pick. */;
        _proto.toUpgrade = function toUpgrade() {
          var services = this.ctx.services;
          if (services.has('upgrade') && services.has('loot') && services.get('loot').pendingPicks > 0) this.setPhase('upgrade');else this.toForge();
        };
        _proto.toForge = function toForge() {
          if (this.ctx.services.has('anvil')) this.setPhase('forge');else this.beginWave(this.waveValue + 1);
        };
        _proto.beginWave = function beginWave(wave) {
          var spec = this.plan[wave - 1];
          if (!spec) return;
          this.waveValue = wave;
          this.elapsed = 0;
          this.door = null;
          this.doorOpenFor = 0;
          this.frenzyFired = false;
          this.chestPending = false;
          this.minDuration = spec.minKey === null ? null : this.ctx.tunables.get(spec.minKey);
          var phase = spec.boss ? 'boss' : 'combat';
          this.setPhase(phase);
          if (!this.running || this.waveValue !== wave || this.phaseValue !== phase) return;
          this.ctx.events.emit('wave:start', {
            wave: wave,
            boss: spec.boss,
            minDuration: this.minDuration
          });
        };
        _proto.setPhase = function setPhase(to) {
          var from = this.phaseValue;
          if (from === to) return;
          this.phaseValue = to;
          this.ctx.events.emit('run:phase', {
            from: from,
            to: to,
            wave: this.waveValue
          });
        }

        /** HUD pause button and `run.pauseOnHide`. No-op outside combat / boss. */;
        _proto.openPause = function openPause() {
          if (!this.running || this.pauseOpenValue) return false;
          if (this.phaseValue !== 'combat' && this.phaseValue !== 'boss') return false;
          this.pauseOpenValue = true;
          this.abandonConfirmValue = false;
          if (!this.ctx.loop.paused) {
            this.ctx.loop.pause();
            this.pausedByPause = true;
          }
          return true;
        }

        /** S17 继续. */;
        _proto.resumePause = function resumePause() {
          if (!this.pauseOpenValue) return false;
          this.dismissPause(true);
          return true;
        };
        _proto.requestAbandon = function requestAbandon() {
          if (!this.pauseOpenValue) return false;
          this.abandonConfirmValue = true;
          return true;
        };
        _proto.cancelAbandon = function cancelAbandon() {
          if (!this.pauseOpenValue || !this.abandonConfirmValue) return false;
          this.abandonConfirmValue = false;
          return true;
        }

        /** Confirmed 放弃本局 → `session:end` → settlement `abandoned`. */;
        _proto.confirmAbandon = function confirmAbandon() {
          if (!this.pauseOpenValue || !this.abandonConfirmValue) return false;
          this.ctx.session.end('manual');
          return true;
        };
        _proto.dismissPause = function dismissPause(resume) {
          var owned = this.pausedByPause;
          this.pauseOpenValue = false;
          this.abandonConfirmValue = false;
          this.pausedByPause = false;
          if (resume && owned && this.ctx.loop.paused) this.ctx.loop.resume();
        }

        /**
         * Death (`player:died`) at any time goes to S19; core ends that session. Any
         * other session end the run did not ask for is an abandon (P1-14 S17 放弃本局
         * calls `ctx.session.end('manual')`). On victory the run ends the session.
         */;
        _proto.finish = function finish(result) {
          if (!this.running) return;
          this.dismissPause(false);
          if (!this.ctx.loop.paused) this.ctx.loop.pause();
          this.pausedByResult = true;
          this.running = false;
          this.door = null;
          this.setPhase('result');
          if (this.running) return;
          var swordLevel = this.ctx.services.has('anvil') ? Math.max(0, Math.floor(this.ctx.services.get('anvil').sword.level)) : 0;
          this.settlementValue = {
            result: result,
            wave: this.waveValue,
            waveCount: this.plan.length,
            combatTime: this.combatSeconds,
            kills: this.killsValue,
            mainSwordLevel: swordLevel
          };
          this.ctx.events.emit('run:end', {
            result: result,
            wave: this.waveValue,
            combatTime: this.combatSeconds
          });
          if (result === 'victory' && !this.running) this.ctx.session.end('manual');
        }

        /** P1-tasks P1-01 / S17: background hide opens the pause page during combat. */;
        _proto.onHide = function onHide() {
          if (!this.running || !this.ctx.tunables.getBool('run.pauseOnHide')) return;
          this.openPause();
        };
        _proto.onShow = function onShow() {
          if (this.pauseOpenValue) return;
          if (!this.pausedByRun) return;
          this.pausedByRun = false;
          if (this.ctx.tunables.getBool('run.resumeOnShow') && this.ctx.loop.paused) this.ctx.loop.resume();
        };
        _createClass(RunModule, [{
          key: "mode",
          get: function get() {
            return this.modeValue;
          }
        }, {
          key: "phase",
          get: function get() {
            return this.phaseValue;
          }
        }, {
          key: "wave",
          get: function get() {
            return this.waveValue;
          }
        }, {
          key: "waveCount",
          get: function get() {
            return this.plan.length;
          }
        }, {
          key: "bossWave",
          get: function get() {
            var _this$spec$boss, _this$spec;
            return (_this$spec$boss = (_this$spec = this.spec()) == null ? void 0 : _this$spec.boss) != null ? _this$spec$boss : false;
          }
        }, {
          key: "waveElapsed",
          get: function get() {
            return this.elapsed;
          }
        }, {
          key: "waveMinDuration",
          get: function get() {
            return this.minDuration;
          }
        }, {
          key: "doorOpen",
          get: function get() {
            return this.door !== null;
          }
        }, {
          key: "combatActive",
          get: function get() {
            return (this.phaseValue === 'combat' || this.phaseValue === 'boss') && !this.pauseOpenValue;
          }
        }, {
          key: "settlement",
          get: function get() {
            return this.settlementValue;
          }
          /** S17 pause page is up; combat HUD is hidden and the loop stays paused. */
        }, {
          key: "pauseOpen",
          get: function get() {
            return this.pauseOpenValue;
          }
        }, {
          key: "abandonConfirmOpen",
          get: function get() {
            return this.abandonConfirmValue;
          }
          /** Visual world zoom (1 = default 10u × 15u). Driven by chain occupancy. */
        }, {
          key: "chainZoom",
          get: function get() {
            return this.zoomValue;
          }

          /** Run total of combat seconds: GDD §8.4 `t`, equal to `director.elapsed`. */
        }, {
          key: "combatTime",
          get: function get() {
            return this.combatSeconds;
          }
        }, {
          key: "doorPos",
          get: function get() {
            return this.door;
          }
          /** Combat seconds until this wave's door opens; null once open or outside combat. */
        }, {
          key: "doorOpensIn",
          get: function get() {
            var at = this.minDuration;
            return this.door || at === null || !this.combatActive ? null : Math.max(0, at - this.elapsed);
          }
          /** Seconds until this wave's `wave:frenzy` hook; null when the door is shut or it already fired. */
        }, {
          key: "frenzyIn",
          get: function get() {
            if (!this.door || this.frenzyFired || this.bossWave) return null;
            return Math.max(0, this.ctx.tunables.get('run.frenzyDelay') - this.doorOpenFor);
          }
        }]);
        return RunModule;
      }());
      function applyWorldLayerZoom(layer, zoom, x, y) {
        if (typeof layer.setScale === 'function') layer.setScale(zoom, zoom, 1);
        if (typeof layer.setPosition === 'function') layer.setPosition(x, y, 0);
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/RunParams.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports({
        waveMinKey: waveMinKey,
        wavePlan: wavePlan
      });
      cclegacy._RF.push({}, "404f53v1pZBvZELSEdpHblj", "RunParams", undefined);
      /** `run.mode` option order. Index 0 is the default (MVP plays the 10-wave standard run). */
      var RUN_MODES = exports('RUN_MODES', ['standard', 'tutorial']);

      /** GDD §5.2 标准局 10 波, §5.5 新手局只打 5 波; P1-tasks P1-01 配置驱动. */
      var WAVE_COUNT = {
        standard: 10,
        tutorial: 5
      };
      /** GDD §5.2: 第 5 波、第 10 波是 Boss 波. */
      var BOSS_WAVES = [5, 10];
      /** GDD §5.2 各波最短时长【提案】: 25 / 30 / 35 / 35 / Boss / 40 × 4 / Boss. */
      var WAVE_MIN_SECONDS = [[1, 25], [2, 30], [3, 35], [4, 35], [6, 40], [7, 40], [8, 40], [9, 40]];
      function waveMinKey(wave) {
        return "run.wave" + wave + "Min";
      }

      /** The tutorial run is the first five waves of the standard run (GDD §5.5). */
      function wavePlan(mode) {
        var out = [];
        for (var wave = 1; wave <= WAVE_COUNT[mode]; wave++) {
          var boss = BOSS_WAVES.indexOf(wave) >= 0;
          out.push({
            wave: wave,
            boss: boss,
            minKey: boss ? null : waveMinKey(wave)
          });
        }
        return out;
      }
      var RUN_PARAMS = exports('RUN_PARAMS', [
      // The 10/23 MVP has no tutorial run, and 'tutorial' also switches on the 教学签筒 (GDD §9.3),
      // so it stays a debug override and must not be the default.
      {
        key: 'run.mode',
        group: '调试',
        label: '调试：局类型',
        kind: 'enum',
        "default": 0,
        options: ['标准 10 波', '调试：新手 5 波'],
        restart: true,
        note: '仅调试；MVP 固定标准 10 波，新手 5 波会同时启用新手签筒'
      }].concat(WAVE_MIN_SECONDS.map(function (_ref) {
        var wave = _ref[0],
          seconds = _ref[1];
        return numberParam(waveMinKey(wave), '波次', "\u7B2C " + wave + " \u6CE2\u6700\u77ED\u65F6\u957F(s)", seconds, 5, 120, 1, '【提案】GDD §5.2');
      }), [numberParam('run.frenzyDelay', '炉门', '开门后刷狂潮(s)', 30, 0, 120, 1, '【提案】GDD §5.2 / §8.2'),
      // Renamed from P0 forge.door* (P1-tasks P1-01 调参键改名); values and ranges unchanged.
      numberParam('run.doorMinDist', '炉门', '离宠物最近(u)', 8, 0, 40, 0.05, '【提案】GDD 2026-10-19 补充决策'), numberParam('run.doorMaxDist', '炉门', '离宠物最远(u)', 12, 0, 40, 0.05, '【提案】GDD 2026-10-19 补充决策'), numberParam('run.doorWallMargin', '炉门', '离墙最小距离(u)', 1, 0, 5, 0.05, 'P0 未定义，#54 自选'),
      // P1-tasks P1-01 走进即触发 gives no radius: about one pet-and-a-half (pet.radius 0.35).
      numberParam('run.doorRadius', '炉门', '触发半径(u)', 0.8, 0.2, 3, 0.05, '【提案】P1-tasks P1-01 走进即触发'), {
        key: 'run.pauseOnHide',
        group: '局流程',
        label: '切后台自动暂停',
        kind: 'bool',
        "default": 1,
        note: '【提案】P1-tasks P1-01；UI S17'
      },
      // S17 pause page owns resume; coming back to the foreground stays on the page.
      {
        key: 'run.resumeOnShow',
        group: '局流程',
        label: '回前台自动继续',
        kind: 'bool',
        "default": 0,
        note: '【提案】P1-14；暂停页打开时忽略，继续按钮才恢复'
      },
      // #108 PR5: zoom the picture out when occupancy × 72px no longer fits the view.
      numberParam('run.chainZoomStartSlots', '剑链镜头', '开始拉远格数', 5, 1, 20, 0.1, '#108 PR5；链长超过此格且放不下当前视野才拉远'), numberParam('run.chainZoomMin', '剑链镜头', '镜头最小倍率', 0.6, 0.2, 1, 0.05, '#108 PR5；更长允许出屏，不改链规则去挤'), numberParam('run.chainZoomSmoothS', '剑链镜头', '拉远平滑(s)', 0.4, 0, 2, 0.05, '#108 PR5；0 = 立刻跟上')]));

      /** P1-tasks P1-01: old presets keep working; `Tunables.load` maps these keys first. */
      var RUN_PARAM_ALIASES = exports('RUN_PARAM_ALIASES', [['forge.doorMinDist', 'run.doorMinDist'], ['forge.doorMaxDist', 'run.doorMaxDist'], ['forge.doorWallMargin', 'run.doorWallMargin']]);
      function numberParam(key, group, label, value, min, max, step, note) {
        return {
          key: key,
          group: group,
          label: label,
          kind: 'number',
          "default": value,
          min: min,
          max: max,
          step: step,
          note: note
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/RunView.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './ScreenLayout.ts', './HudArt4.ts'], function (exports) {
  var _inheritsLoose, _createForOfIteratorHelperLoose, cclegacy, _decorator, Color, Graphics, Label, UITransform, BlockInputEvents, Node, view, resources, SpriteFrame, Sprite, Component, layoutScreen, RUN_HUD_LAYOUT, hudDesignToLocal, RUN_HUD_ART;
  return {
    setters: [function (module) {
      _inheritsLoose = module.inheritsLoose;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
      _decorator = module._decorator;
      Color = module.Color;
      Graphics = module.Graphics;
      Label = module.Label;
      UITransform = module.UITransform;
      BlockInputEvents = module.BlockInputEvents;
      Node = module.Node;
      view = module.view;
      resources = module.resources;
      SpriteFrame = module.SpriteFrame;
      Sprite = module.Sprite;
      Component = module.Component;
    }, function (module) {
      layoutScreen = module.layoutScreen;
    }, function (module) {
      RUN_HUD_LAYOUT = module.RUN_HUD_LAYOUT;
      hudDesignToLocal = module.hudDesignToLocal;
      RUN_HUD_ART = module.RUN_HUD_ART;
    }],
    execute: function () {
      exports({
        combatHudVisible: combatHudVisible,
        formatCombatTime: formatCombatTime,
        mountRunView: mountRunView,
        resultTitle: resultTitle,
        settlementValues: settlementValues,
        statusText: statusText,
        timerCaption: timerCaption,
        waveCaption: waveCaption
      });
      cclegacy._RF.push({}, "9875fSvkSNDE72iLlefl2TR", "RunView", undefined);
      var ccclass = _decorator.ccclass;
      /** UI R7 / P0 §5: 炉门青铜绿 #8FA35A. */
      var DOOR = new Color(143, 163, 90, 255);
      var DOOR_FILL = new Color(143, 163, 90, 90);
      var TEXT = new Color(255, 255, 255, 255);
      var BONE = new Color(232, 224, 206, 255);
      var INK = new Color(44, 30, 20, 255);
      var PLATE = new Color(92, 70, 48, 255);
      var RESULT_DIM = new Color(14, 14, 16, 224);
      var RESULT_PANEL = new Color(70, 58, 44, 255);
      var RESULT_PANEL_EDGE = new Color(205, 181, 132, 255);
      var RESULT_BUTTON = new Color(102, 72, 42, 255);
      var RESULT_BUTTON_EDGE = new Color(234, 168, 52, 255);
      var RESULT_SECONDARY = new Color(72, 68, 62, 255);
      var DESIGN_WIDTH = 720;
      var DESIGN_HEIGHT = 1280;
      var RESULT_BUTTON_WIDTH = 300;
      var RESULT_BUTTON_HEIGHT = 96;
      var PHASE_TEXT = {
        upgrade: '三选一',
        forge: '铁匠铺',
        chest: 'Boss 宝箱'
      };

      /**
       * Runtime door greybox plus the combat wave / timer HUD. Status plates load
       * from resources/ui/hud; full-screen run phases hide the combat HUD.
       */
      var RunGreyboxView = exports('RunGreyboxView', /*#__PURE__*/function (_Component) {
        _inheritsLoose(RunGreyboxView, _Component);
        function RunGreyboxView() {
          var _this;
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          _this = _Component.call.apply(_Component, [this].concat(args)) || this;
          _this.ctx = null;
          _this.module = null;
          _this.graphics = null;
          _this.prompt = null;
          _this.status = null;
          _this.timer = null;
          _this.promptNode = null;
          _this.statusNode = null;
          _this.timerNode = null;
          _this.artNode = null;
          _this.pauseBtn = null;
          _this.resultRoot = null;
          _this.resultDim = null;
          _this.resultTitle = null;
          _this.resultValues = [];
          _this.viewUnsubs = [];
          return _this;
        }
        var _proto = RunGreyboxView.prototype;
        _proto.configure = function configure(ctx, module) {
          var _this2 = this;
          this.ctx = ctx;
          this.module = module;
          this.graphics = this.node.addComponent(Graphics);
          this.promptNode = makeNode(ctx.layers.get('fx'), 'RunDoorPrompt');
          this.prompt = this.promptNode.addComponent(Label);
          if (this.prompt) {
            this.prompt.fontSize = 20;
            this.prompt.lineHeight = 26;
            this.prompt.color = TEXT;
            // UI S07 / GDD §5.4 48–60s.
            this.prompt.string = '进炉门 → 铁匠铺\n多待一会儿掉更多，但会越来越难';
          }
          var hudLayer = ctx.layers.get('hud');
          this.artNode = makeNode(hudLayer, 'RunStatusArt');
          makeHudSprite(this.artNode, 'WavePlate', RUN_HUD_ART.wavePlate, PLATE);
          makeHudSprite(this.artNode, 'TimerPlate', RUN_HUD_ART.timerPlate, PLATE);
          this.statusNode = makeNode(hudLayer, 'RunStatus');
          this.status = this.statusNode.addComponent(Label);
          if (this.status) {
            var _this$statusNode$getC;
            this.status.fontSize = 19;
            this.status.lineHeight = 24;
            this.status.color = BONE;
            this.status.enableOutline = true;
            this.status.outlineColor = INK;
            this.status.outlineWidth = 2;
            this.status.overflow = Label.Overflow.SHRINK;
            this.status.horizontalAlign = Label.HorizontalAlign.CENTER;
            this.status.verticalAlign = Label.VerticalAlign.CENTER;
            (_this$statusNode$getC = this.statusNode.getComponent(UITransform)) == null || _this$statusNode$getC.setContentSize(RUN_HUD_LAYOUT.waveText.width, RUN_HUD_LAYOUT.waveText.height);
          }
          this.timerNode = makeNode(hudLayer, 'RunTimer');
          this.timer = this.timerNode.addComponent(Label);
          if (this.timer) {
            var _this$timerNode$getCo;
            this.timer.fontSize = 16;
            this.timer.lineHeight = 20;
            this.timer.color = INK;
            this.timer.overflow = Label.Overflow.SHRINK;
            this.timer.horizontalAlign = Label.HorizontalAlign.CENTER;
            this.timer.verticalAlign = Label.VerticalAlign.CENTER;
            (_this$timerNode$getCo = this.timerNode.getComponent(UITransform)) == null || _this$timerNode$getCo.setContentSize(RUN_HUD_LAYOUT.timerText.width, RUN_HUD_LAYOUT.timerText.height);
          }
          this.pauseBtn = makeHudSprite(hudLayer, 'HudPause', RUN_HUD_ART.pause, PLATE);
          this.pauseBtn.addComponent(BlockInputEvents);
          this.pauseBtn.on(Node.EventType.TOUCH_END, function () {
            var _this2$module;
            return (_this2$module = _this2.module) == null ? void 0 : _this2$module.openPause();
          });
          this.buildResult(ctx.layers.get('hud'));
          this.viewUnsubs.push(ctx.events.on('run:start', function () {
            return _this2.hideResult();
          }));
          this.viewUnsubs.push(ctx.events.on('run:end', function () {
            return _this2.showResult();
          }));
          this.resizeResult();
        };
        _proto.onEnable = function onEnable() {
          var _this$module;
          (_this$module = this.module) == null || _this$module.attach();
          if (this.promptNode) this.promptNode.active = true;
          if (this.artNode) this.artNode.active = true;
          if (this.statusNode) this.statusNode.active = true;
          if (this.timerNode) this.timerNode.active = true;
          if (this.pauseBtn) this.pauseBtn.active = true;
          view.on('canvas-resize', this.resizeResult, this);
        };
        _proto.onDisable = function onDisable() {
          var _this$module2;
          (_this$module2 = this.module) == null || _this$module2.detach();
          if (this.promptNode) this.promptNode.active = false;
          if (this.artNode) this.artNode.active = false;
          if (this.statusNode) this.statusNode.active = false;
          if (this.timerNode) this.timerNode.active = false;
          if (this.pauseBtn) this.pauseBtn.active = false;
          view.off('canvas-resize', this.resizeResult, this);
        };
        _proto.onDestroy = function onDestroy() {
          var _this$module3, _this$promptNode, _this$artNode, _this$statusNode, _this$timerNode, _this$pauseBtn, _this$resultRoot;
          (_this$module3 = this.module) == null || _this$module3.detach();
          view.off('canvas-resize', this.resizeResult, this);
          for (var _iterator = _createForOfIteratorHelperLoose(this.viewUnsubs), _step; !(_step = _iterator()).done;) {
            var off = _step.value;
            off();
          }
          this.viewUnsubs.length = 0;
          (_this$promptNode = this.promptNode) == null || _this$promptNode.destroy();
          (_this$artNode = this.artNode) == null || _this$artNode.destroy();
          (_this$statusNode = this.statusNode) == null || _this$statusNode.destroy();
          (_this$timerNode = this.timerNode) == null || _this$timerNode.destroy();
          (_this$pauseBtn = this.pauseBtn) == null || _this$pauseBtn.destroy();
          (_this$resultRoot = this.resultRoot) == null || _this$resultRoot.destroy();
          this.ctx = null;
          this.module = null;
        };
        _proto.update = function update() {
          var ctx = this.ctx;
          var module = this.module;
          var g = this.graphics;
          if (!ctx || !module || !g) return;
          g.clear();
          var door = module.doorPos;
          if (door) {
            var scale = ctx.toPx({
              x: 1,
              y: 0
            }).x - ctx.toPx({
              x: 0,
              y: 0
            }).x;
            var p = ctx.toPx(door);
            var r = ctx.tunables.get('run.doorRadius') * scale;
            g.fillColor = DOOR_FILL;
            g.circle(p.x, p.y, r);
            g.fill();
            g.strokeColor = DOOR;
            g.lineWidth = Math.max(3, r * 0.12);
            g.circle(p.x, p.y, r);
            g.stroke();
            // Arch silhouette inside the ring (R7 炉门 = 拱门).
            g.moveTo(p.x - r * 0.45, p.y - r * 0.5);
            g.lineTo(p.x - r * 0.45, p.y + r * 0.1);
            g.arc(p.x, p.y + r * 0.1, r * 0.45, Math.PI, 0, false);
            g.lineTo(p.x + r * 0.45, p.y - r * 0.5);
            g.stroke();
            if (this.prompt) this.prompt.node.setPosition(p.x, p.y + r + 40, 0);
          }
          if (this.promptNode) this.promptNode.active = door !== null && ctx.camera.inView(door, 1);
          var showHud = combatHudVisible(module.phase) && !module.pauseOpen;
          var showPauseBtn = (module.phase === 'combat' || module.phase === 'boss') && !module.pauseOpen;
          if (this.pauseBtn) {
            this.pauseBtn.active = showPauseBtn;
            if (showPauseBtn) {
              var _this$pauseBtn$getCom;
              var size = view.getVisibleSize();
              var hud = layoutScreen(size.width, size.height).hud;
              var pos = hudDesignToLocal(RUN_HUD_LAYOUT.pause, size.width, size.height, hud);
              this.pauseBtn.setPosition(pos.x, pos.y, 0);
              (_this$pauseBtn$getCom = this.pauseBtn.getComponent(UITransform)) == null || _this$pauseBtn$getCom.setContentSize(RUN_HUD_LAYOUT.pause.width, RUN_HUD_LAYOUT.pause.height);
            }
          }
          if (this.artNode) this.artNode.active = showHud;
          if (this.statusNode) this.statusNode.active = showHud;
          if (this.status && showHud) {
            this.status.string = waveCaption(module);
            var _size = view.getVisibleSize();
            var _hud = layoutScreen(_size.width, _size.height).hud;
            placeHudChild(this.artNode, 'WavePlate', RUN_HUD_LAYOUT.wavePlate, _size, _hud);
            var wavePos = hudDesignToLocal(RUN_HUD_LAYOUT.waveText, _size.width, _size.height, _hud);
            this.status.node.setPosition(wavePos.x, wavePos.y, 0);
            var timerLine = timerCaption(module);
            var showTimer = timerLine.length > 0;
            if (this.timerNode) this.timerNode.active = showTimer;
            placeHudChild(this.artNode, 'TimerPlate', RUN_HUD_LAYOUT.timerPlate, _size, _hud);
            var timerPlate = this.artNode ? this.artNode.getChildByName('TimerPlate') : null;
            if (timerPlate) timerPlate.active = showTimer;
            if (this.timer && showTimer) {
              this.timer.string = timerLine;
              var timerPos = hudDesignToLocal(RUN_HUD_LAYOUT.timerText, _size.width, _size.height, _hud);
              this.timer.node.setPosition(timerPos.x, timerPos.y, 0);
            }
          } else if (this.timerNode) {
            this.timerNode.active = false;
          }
        };
        _proto.buildResult = function buildResult(parent) {
          var _this3 = this;
          var root = makeNode(parent, 'RunResult');
          root.addComponent(BlockInputEvents);
          this.resultRoot = root;
          this.resultDim = grayBox(root, 'Dim', 0, 0, DESIGN_WIDTH, DESIGN_HEIGHT, RESULT_DIM);
          this.resultDim.addComponent(BlockInputEvents);
          var panel = grayBox(root, 'Panel', 0, 35, 620, 650, RESULT_PANEL, RESULT_PANEL_EDGE);
          this.resultTitle = grayText(panel, 'Title', '', 0, 245, 540, 80, 52);
          var rowNames = ['WaveRow', 'TimeRow', 'KillRow', 'SwordRow'];
          var rowLabels = ['波数', '时间', '击杀', '主剑'];
          for (var i = 0; i < rowNames.length; i++) {
            var row = makeNode(panel, rowNames[i]);
            row.setPosition(0, 105 - i * 105, 0);
            grayText(row, 'Label', rowLabels[i], -210, 0, 150, 52, 28, new Color(208, 194, 168), 'left');
            var value = grayText(row, 'Value', '', 105, 0, 350, 52, 32, TEXT, 'right');
            this.resultValues.push(value);
            if (i > 0) grayLine(row, -265, 50, 530);
          }

          // P2 placeholders deliberately exist in the runtime hierarchy but are hidden for P1.
          var soulRow = makeNode(root, 'SoulRow');
          soulRow.setPosition(0, -355, 0);
          grayText(soulRow, 'SoulLabel', '剑魂', -100, 0, 160, 50, 26);
          var ad = grayButton(soulRow, 'BtnAdDouble', '剑魂 ×2', 115, 0, 260, 82, RESULT_BUTTON, function () {
            return undefined;
          });
          ad.active = false;
          soulRow.active = false;
          var revive = makeNode(root, 'ReviveSlot');
          revive.active = false;
          grayButton(root, 'BtnEnd', '结束', -165, -500, RESULT_BUTTON_WIDTH, RESULT_BUTTON_HEIGHT, RESULT_SECONDARY, function () {
            return _this3.newRun();
          });
          grayButton(root, 'BtnRetry', '再来一局', 165, -500, RESULT_BUTTON_WIDTH, RESULT_BUTTON_HEIGHT, RESULT_BUTTON, function () {
            return _this3.newRun();
          });
          root.active = false;
        };
        _proto.showResult = function showResult() {
          var _this$module4;
          var settlement = (_this$module4 = this.module) == null ? void 0 : _this$module4.settlement;
          if (!settlement || !this.resultRoot || !this.resultTitle) return;
          this.resultTitle.string = resultTitle(settlement);
          var values = settlementValues(settlement);
          for (var i = 0; i < this.resultValues.length; i++) {
            var _values$i;
            this.resultValues[i].string = (_values$i = values[i]) != null ? _values$i : '';
          }
          this.resizeResult();
          this.resultRoot.active = true;
        };
        _proto.hideResult = function hideResult() {
          if (this.resultRoot) this.resultRoot.active = false;
        };
        _proto.newRun = function newRun() {
          var ctx = this.ctx;
          if (!ctx) return;
          this.hideResult();
          ctx.session.restart();
        };
        _proto.resizeResult = function resizeResult() {
          var root = this.resultRoot;
          var dim = this.resultDim;
          if (!root || !dim) return;
          var size = view.getVisibleSize();
          var scale = Math.min(size.width / DESIGN_WIDTH, size.height / DESIGN_HEIGHT);
          root.setScale(scale, scale, 1);
          var transform = dim.getComponent(UITransform);
          if (transform && scale > 0) transform.setContentSize(size.width / scale, size.height / scale);
          var graphics = dim.getComponentInChildren(Graphics);
          if (graphics && transform && scale > 0) {
            var width = size.width / scale;
            var height = size.height / scale;
            graphics.clear();
            graphics.fillColor = RESULT_DIM;
            graphics.rect(-width / 2, -height / 2, width, height);
            graphics.fill();
          }
        };
        return RunGreyboxView;
      }(Component));
      ccclass('RunGreyboxView')(RunGreyboxView);

      /** UI §4 波次与倒计时: 第 x / 10（5）波 + 炉门倒计时 / 炉门已开. No 狂潮 text: the MVP has no elites. */
      function combatHudVisible(phase) {
        // Full-screen run phases own the HUD, and the Boss bar replaces the wave line.
        return phase === 'combat';
      }
      function waveCaption(run) {
        if (run.phase === 'petSelect' || run.phase === 'result') return '';
        return "\u7B2C " + run.wave + " / " + run.waveCount + " \u6CE2";
      }
      function timerCaption(run) {
        if (run.phase === 'petSelect' || run.phase === 'result') return '';
        var named = PHASE_TEXT[run.phase];
        if (named) return named;
        // GDD §5.2: Boss 波没有炉门，打死为止.
        if (run.bossWave) return 'Boss';
        var opensIn = run.doorOpensIn;
        if (opensIn !== null) return "\u7089\u95E8 " + Math.ceil(opensIn - 1e-9) + "s";
        return run.doorOpen ? '炉门已开' : '';
      }
      function statusText(run) {
        if (run.phase === 'petSelect' || run.phase === 'result') return '';
        var head = waveCaption(run);
        var extra = timerCaption(run);
        return extra.length > 0 ? head + " \xB7 " + extra : head;
      }
      function formatCombatTime(value) {
        var total = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
        var minutes = Math.floor(total / 60);
        var seconds = total % 60;
        var minuteText = minutes < 10 ? "0" + minutes : String(minutes);
        var secondText = seconds < 10 ? "0" + seconds : String(seconds);
        return minuteText + ":" + secondText;
      }
      function resultTitle(settlement) {
        if (settlement.result === 'victory') return '大胜而归';
        if (settlement.result === 'died') return '你倒下了';
        return '本局结束';
      }

      /** P1 settlement has exactly the four rows requested by issue #84. */
      function settlementValues(settlement) {
        return ["\u7B2C " + settlement.wave + " / " + settlement.waveCount + " \u6CE2", formatCombatTime(settlement.combatTime), String(settlement.kills), "\u4E3B\u5251 +" + settlement.mainSwordLevel];
      }
      function makeNode(parent, name) {
        var node = new Node(name);
        node.layer = parent.layer;
        node.addComponent(UITransform);
        parent.addChild(node);
        return node;
      }
      function makeHudSprite(parent, name, spec, fallback) {
        var _node$getComponent;
        var node = makeNode(parent, name);
        (_node$getComponent = node.getComponent(UITransform)) == null || _node$getComponent.setContentSize(spec.width, spec.height);
        resources.load(spec.path + "/spriteFrame", SpriteFrame, function (error, frame) {
          var _node$getComponent2;
          if (node.isValid === false) return;
          if (error || !frame) {
            var graphics = node.addComponent(Graphics);
            graphics.rect(-spec.width / 2, -spec.height / 2, spec.width, spec.height);
            graphics.fillColor = fallback;
            graphics.fill();
            return;
          }
          if (spec.slice) {
            frame.insetTop = spec.slice.top;
            frame.insetBottom = spec.slice.bottom;
            frame.insetLeft = spec.slice.left;
            frame.insetRight = spec.slice.right;
          }
          var sprite = node.addComponent(Sprite);
          sprite.spriteFrame = frame;
          sprite.type = spec.slice === null ? Sprite.Type.SIMPLE : Sprite.Type.SLICED;
          sprite.sizeMode = Sprite.SizeMode.CUSTOM;
          (_node$getComponent2 = node.getComponent(UITransform)) == null || _node$getComponent2.setContentSize(spec.width, spec.height);
        });
        return node;
      }
      function placeHudChild(parent, name, rect, size, hud) {
        var _child$getComponent;
        if (!parent) return;
        var child = parent.getChildByName(name);
        if (!child) return;
        var pos = hudDesignToLocal(rect, size.width, size.height, hud);
        child.setPosition(pos.x, pos.y, 0);
        (_child$getComponent = child.getComponent(UITransform)) == null || _child$getComponent.setContentSize(rect.width, rect.height);
      }
      function grayBox(parent, name, x, y, width, height, fill, stroke) {
        var _node$getComponent3, _paint$getComponent;
        var node = makeNode(parent, name);
        node.setPosition(x, y, 0);
        (_node$getComponent3 = node.getComponent(UITransform)) == null || _node$getComponent3.setContentSize(width, height);
        var paint = makeNode(node, 'Paint');
        (_paint$getComponent = paint.getComponent(UITransform)) == null || _paint$getComponent.setContentSize(width, height);
        var graphics = paint.addComponent(Graphics);
        graphics.rect(-width / 2, -height / 2, width, height);
        graphics.fillColor = fill;
        graphics.fill();
        if (stroke) {
          graphics.lineWidth = 4;
          graphics.strokeColor = stroke;
          graphics.stroke();
        }
        return node;
      }
      function grayText(parent, name, value, x, y, width, height, size, color, align) {
        var _node$getComponent4;
        if (color === void 0) {
          color = TEXT;
        }
        if (align === void 0) {
          align = 'center';
        }
        var node = makeNode(parent, name);
        node.setPosition(x, y, 0);
        (_node$getComponent4 = node.getComponent(UITransform)) == null || _node$getComponent4.setContentSize(width, height);
        var label = node.addComponent(Label);
        label.string = value;
        label.fontSize = size;
        label.lineHeight = size + 8;
        label.color = color;
        label.overflow = Label.Overflow.SHRINK;
        label.horizontalAlign = align === 'left' ? Label.HorizontalAlign.LEFT : align === 'right' ? Label.HorizontalAlign.RIGHT : Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        return label;
      }
      function grayLine(parent, x, y, width) {
        var node = makeNode(parent, 'Divider');
        var graphics = node.addComponent(Graphics);
        graphics.lineWidth = 2;
        graphics.strokeColor = new Color(126, 105, 75, 255);
        graphics.moveTo(x, y);
        graphics.lineTo(x + width, y);
        graphics.stroke();
      }
      function grayButton(parent, name, caption, x, y, width, height, fill, click) {
        var node = grayBox(parent, name, x, y, width, height, fill, RESULT_BUTTON_EDGE);
        node.addComponent(BlockInputEvents);
        grayText(node, 'Label', caption, 0, 0, width - 24, height - 12, 32);
        node.on(Node.EventType.TOUCH_END, click);
        return node;
      }
      function mountRunView(ctx, module) {
        var parent = ctx.layers.get('arena');
        // Core's headless ports supply only { name }, not a Cocos Node.
        if (typeof parent.addChild !== 'function') return;
        var node = makeNode(parent, 'RunGreybox');
        var component = node.addComponent(RunGreyboxView);
        if (component) component.configure(ctx, module);
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/ScreenLayout.ts", ['cc', './Camera.ts'], function (exports) {
  var cclegacy, VIEW_WIDTH, VIEW_HEIGHT;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      VIEW_WIDTH = module.VIEW_WIDTH;
      VIEW_HEIGHT = module.VIEW_HEIGHT;
    }],
    execute: function () {
      exports({
        arenaToPx: arenaToPx,
        intersectRect: intersectRect,
        layoutScreen: layoutScreen,
        rectInside: rectInside
      });
      cclegacy._RF.push({}, "0a229DPx49BXLhConS4UN/W", "ScreenLayout", undefined);
      /** Design resolution. Project settings already use Fit Width. */
      var DESIGN_WIDTH = exports('DESIGN_WIDTH', 720);
      var DESIGN_HEIGHT = exports('DESIGN_HEIGHT', 1280);
      /** 1 u = 72 px = 1/10 of the 720-wide design. */
      var UNIT_PX = exports('UNIT_PX', 72);
      var DESIGN_TALLNESS = DESIGN_HEIGHT / DESIGN_WIDTH;

      /**
       * Place the 10×15 u view (GDD §4.4: "arena" now means the visible range) inside a visible rect.
       * Tall screens (16:9, 20:9) fit the arena to the width and give leftover
       * height to the HUD and the thumb strip. The arena is not scaled up.
       * Wider screens letterbox on the left and right so the 15 u height still fits
       * the 16:9 design proportion.
       * `safeArea` uses the same pixel space as the visible rect, origin bottom-left.
       */
      function layoutScreen(visibleWidth, visibleHeight, safeArea) {
        var width = Math.max(0, visibleWidth);
        var height = Math.max(0, visibleHeight);
        var safe = safeArea != null ? safeArea : {
          x: 0,
          y: 0,
          width: width,
          height: height
        };
        var tallEnough = width <= 0 || height / width >= DESIGN_TALLNESS - 1e-6;
        var fit = tallEnough ? 'width' : 'height';
        var pxPerUnit = tallEnough ? width / VIEW_WIDTH : height / (DESIGN_HEIGHT / UNIT_PX);
        var arenaWidthPx = VIEW_WIDTH * pxPerUnit;
        var arenaHeightPx = VIEW_HEIGHT * pxPerUnit;
        var sideMargin = Math.max(0, (width - arenaWidthPx) / 2);
        var verticalRemainder = Math.max(0, height - arenaHeightPx);
        var arenaOriginX = sideMargin;
        var arenaOriginY = verticalRemainder / 2;
        var hud = intersectRect({
          x: arenaOriginX,
          y: arenaOriginY + arenaHeightPx,
          width: arenaWidthPx,
          height: Math.max(0, height - (arenaOriginY + arenaHeightPx))
        }, safe);
        var thumb = intersectRect({
          x: arenaOriginX,
          y: 0,
          width: arenaWidthPx,
          height: arenaOriginY
        }, safe);
        return {
          fit: fit,
          pxPerUnit: pxPerUnit,
          arenaWidthPx: arenaWidthPx,
          arenaHeightPx: arenaHeightPx,
          arenaOriginX: arenaOriginX,
          arenaOriginY: arenaOriginY,
          hud: hud,
          thumb: thumb,
          sideMargin: sideMargin
        };
      }

      /** View-local units (origin at the view's bottom-left) to visible pixels (origin bottom-left of the visible rect). */
      function arenaToPx(layout, p) {
        return {
          x: layout.arenaOriginX + p.x * layout.pxPerUnit,
          y: layout.arenaOriginY + p.y * layout.pxPerUnit
        };
      }
      function intersectRect(a, b) {
        var x0 = Math.max(a.x, b.x);
        var y0 = Math.max(a.y, b.y);
        var x1 = Math.min(a.x + a.width, b.x + b.width);
        var y1 = Math.min(a.y + a.height, b.y + b.height);
        return {
          x: x0,
          y: y0,
          width: Math.max(0, x1 - x0),
          height: Math.max(0, y1 - y0)
        };
      }

      /** True when `inner` lies entirely inside `outer`. */
      function rectInside(inner, outer) {
        return inner.x >= outer.x - 1e-6 && inner.y >= outer.y - 1e-6 && inner.x + inner.width <= outer.x + outer.width + 1e-6 && inner.y + inner.height <= outer.y + outer.height + 1e-6;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/ServiceRegistry.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "b09eexTqw5MwaAQHY6bgt3s", "ServiceRegistry", undefined);
      var ServiceRegistry = exports('ServiceRegistry', /*#__PURE__*/function () {
        function ServiceRegistry() {
          this.map = new Map();
        }
        var _proto = ServiceRegistry.prototype;
        _proto.provide = function provide(key, value) {
          this.map.set(key, value);
        };
        _proto.get = function get(key) {
          var value = this.map.get(key);
          if (value === undefined) throw new Error("Service not provided: " + key);
          return value;
        };
        _proto.has = function has(key) {
          return this.map.has(key);
        };
        return ServiceRegistry;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/Session.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _createClass, cclegacy;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports('nextSessionId', nextSessionId);
      cclegacy._RF.push({}, "18080XCxz9JUbthkgHwpxe7", "Session", undefined);
      var sessionSerial = 0;
      function nextSessionId(nowMs) {
        if (nowMs === void 0) {
          nowMs = Date.now();
        }
        sessionSerial += 1;
        return "s" + nowMs.toString(36) + "-" + sessionSerial.toString(36);
      }

      /**
       * Session state machine. `restart` begins a new session without emitting
       * `session:end`, so a debug restart does not open the result page.
       * The enemy director supplies elapsed time; core is what calls `end('timeout')`.
       */
      var Session = exports('Session', /*#__PURE__*/function () {
        function Session(hooks) {
          if (hooks === void 0) {
            hooks = {};
          }
          this.sidValue = '';
          this.seedValue = 1;
          this.runningValue = false;
          this.startedAt = 0;
          this.hooks = void 0;
          this.hooks = hooks;
        }
        var _proto = Session.prototype;
        _proto.start = function start() {
          var _this$hooks$prepare, _this$hooks, _this$hooks$nowSid, _this$hooks$nowSid2, _this$hooks2, _this$hooks$simTime, _this$hooks$simTime2, _this$hooks3, _this$hooks$onStart, _this$hooks4, _this$hooks$paramsHas, _this$hooks$paramsHas2, _this$hooks5;
          if (this.runningValue) return;
          (_this$hooks$prepare = (_this$hooks = this.hooks).prepare) == null || _this$hooks$prepare.call(_this$hooks);
          this.sidValue = (_this$hooks$nowSid = (_this$hooks$nowSid2 = (_this$hooks2 = this.hooks).nowSid) == null ? void 0 : _this$hooks$nowSid2.call(_this$hooks2)) != null ? _this$hooks$nowSid : nextSessionId();
          this.seedValue = this.resolveSeed();
          this.runningValue = true;
          this.startedAt = (_this$hooks$simTime = (_this$hooks$simTime2 = (_this$hooks3 = this.hooks).simTime) == null ? void 0 : _this$hooks$simTime2.call(_this$hooks3)) != null ? _this$hooks$simTime : 0;
          (_this$hooks$onStart = (_this$hooks4 = this.hooks).onStart) == null || _this$hooks$onStart.call(_this$hooks4, {
            sid: this.sidValue,
            seed: this.seedValue,
            paramsHash: (_this$hooks$paramsHas = (_this$hooks$paramsHas2 = (_this$hooks5 = this.hooks).paramsHash) == null ? void 0 : _this$hooks$paramsHas2.call(_this$hooks5)) != null ? _this$hooks$paramsHas : ''
          });
        };
        _proto.end = function end(reason) {
          var _this$hooks$simTime3, _this$hooks$simTime4, _this$hooks6, _this$hooks$onEnd, _this$hooks7;
          if (!this.runningValue) return;
          this.runningValue = false;
          var now = (_this$hooks$simTime3 = (_this$hooks$simTime4 = (_this$hooks6 = this.hooks).simTime) == null ? void 0 : _this$hooks$simTime4.call(_this$hooks6)) != null ? _this$hooks$simTime3 : 0;
          (_this$hooks$onEnd = (_this$hooks7 = this.hooks).onEnd) == null || _this$hooks$onEnd.call(_this$hooks7, {
            sid: this.sidValue,
            reason: reason,
            duration: Math.max(0, now - this.startedAt)
          });
        };
        _proto.restart = function restart() {
          this.runningValue = false;
          this.start();
        };
        _proto.resolveSeed = function resolveSeed() {
          var _this$hooks$resolveSe, _this$hooks$resolveSe2, _this$hooks8, _this$hooks$random, _this$hooks$random2, _this$hooks9;
          var requested = (_this$hooks$resolveSe = (_this$hooks$resolveSe2 = (_this$hooks8 = this.hooks).resolveSeed) == null ? void 0 : _this$hooks$resolveSe2.call(_this$hooks8)) != null ? _this$hooks$resolveSe : 0;
          if (requested !== 0 && Number.isFinite(requested)) {
            var seed = Math.floor(Math.abs(requested));
            return seed === 0 ? 1 : seed;
          }
          var roll = (_this$hooks$random = (_this$hooks$random2 = (_this$hooks9 = this.hooks).random) == null ? void 0 : _this$hooks$random2.call(_this$hooks9)) != null ? _this$hooks$random : Math.random();
          var span = Math.floor(roll * 999999);
          return 1 + Math.max(0, Math.min(999998, span));
        };
        _createClass(Session, [{
          key: "sid",
          get: function get() {
            return this.sidValue;
          }

          /** Resolved seed for this session. Never 0 after `start`. */
        }, {
          key: "seed",
          get: function get() {
            return this.seedValue;
          }
        }, {
          key: "running",
          get: function get() {
            return this.runningValue;
          }
        }]);
        return Session;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/SessionWatch.ts", ['cc', './SystemOrder.ts'], function (exports) {
  var cclegacy, SystemOrder;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      SystemOrder = module.SystemOrder;
    }],
    execute: function () {
      exports('createSessionWatch', createSessionWatch);
      cclegacy._RF.push({}, "03f40ke0LJOLLgq9Y/5inYa", "SessionWatch", undefined);
      /** Ends the session once the director clock reaches the configured length. */
      function createSessionWatch(deps) {
        return {
          id: 'core.session',
          order: SystemOrder.Session,
          fixedUpdate: function fixedUpdate() {
            if (!deps.session.running) return;
            if (!deps.hasDirector()) return;
            if (deps.endless()) return;
            if (deps.elapsed() >= deps.length()) deps.session.end('timeout');
          }
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/ShatterRecord.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "6edaczuLV9Bap10hGDOYtnS", "ShatterRecord", undefined);
      /** Web Storage subset (Cocos `sys.localStorage`). */
      var KEY = 'yz.forge.shatterRecord';

      /**
       * 碎剑记录 kept on this device (docs/design/P1-tasks.md P1-04: 碎剑记录"你曾锻到 +N"存本地;
       * docs/design/GDD.md §9.6). Display only: the anvil never reads it, so history
       * cannot change a tube (GDD §9.7 永远不受历史流失情况影响).
       */
      var ShatterRecord = exports('ShatterRecord', /*#__PURE__*/function () {
        function ShatterRecord(store) {
          this.store = void 0;
          this.stats = void 0;
          this.store = store;
          this.stats = read(store);
        }
        var _proto = ShatterRecord.prototype;
        _proto.get = function get() {
          return this.stats;
        };
        _proto.add = function add(level) {
          var lv = Math.max(0, Math.floor(level));
          this.stats = {
            best: Math.max(this.stats.best, lv),
            count: this.stats.count + 1,
            last: lv
          };
          if (this.store) {
            try {
              this.store.setItem(KEY, JSON.stringify(this.stats));
            } catch (err) {
              console.warn('[forge] shatter record write failed', err);
            }
          }
          return this.stats;
        };
        return ShatterRecord;
      }());
      function read(store) {
        var empty = {
          best: -1,
          count: 0,
          last: -1
        };
        if (!store) return empty;
        try {
          var raw = store.getItem(KEY);
          if (typeof raw !== 'string' || raw === '') return empty;
          var parsed = JSON.parse(raw);
          if (typeof parsed !== 'object' || parsed === null) return empty;
          var _value = parsed;
          return {
            best: finiteOr(_value.best, -1),
            count: Math.max(0, finiteOr(_value.count, 0)),
            last: finiteOr(_value.last, -1)
          };
        } catch (_unused) {
          return empty;
        }
      }
      function finiteOr(v, fallback) {
        return typeof v === 'number' && Number.isFinite(v) ? Math.floor(v) : fallback;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/SpatialHash.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _createForOfIteratorHelperLoose, cclegacy;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "c32978uLZBNTpuYqsdoK/hd", "SpatialHash", undefined);
      /**
       * Uniform grid broadphase. An item that covers several cells is inserted into
       * each of them and returned once per query.
       * Callers own `out` and should clear it; the return value is how many items
       * were appended.
       */
      var SpatialHash = exports('SpatialHash', /*#__PURE__*/function () {
        function SpatialHash(cellSize) {
          this.cells = new Map();
          this.cellSize = void 0;
          if (!(cellSize > 0) || !Number.isFinite(cellSize)) {
            throw new Error("SpatialHash cellSize must be > 0, got " + cellSize);
          }
          this.cellSize = cellSize;
        }
        var _proto = SpatialHash.prototype;
        _proto.clear = function clear() {
          this.cells.clear();
        }

        /** Insert a circle (center x,y, radius r) identified by `id`. */;
        _proto.insert = function insert(id, x, y, r, item) {
          var entry = {
            id: id,
            minX: x - r,
            minY: y - r,
            maxX: x + r,
            maxY: y + r,
            item: item
          };
          var x0 = this.cellOf(entry.minX);
          var y0 = this.cellOf(entry.minY);
          var x1 = this.cellOf(entry.maxX);
          var y1 = this.cellOf(entry.maxY);
          for (var cy = y0; cy <= y1; cy++) {
            for (var cx = x0; cx <= x1; cx++) {
              var key = cx + "," + cy;
              var bucket = this.cells.get(key);
              if (!bucket) {
                bucket = [];
                this.cells.set(key, bucket);
              }
              bucket.push(entry);
            }
          }
        };
        _proto.queryCircle = function queryCircle(x, y, r, out) {
          return this.collect(x - r, y - r, x + r, y + r, out, function (entry) {
            return aabbHitsCircle(entry, x, y, r);
          });
        };
        _proto.queryAABB = function queryAABB(minX, minY, maxX, maxY, out) {
          return this.collect(minX, minY, maxX, maxY, out, function (entry) {
            return aabbOverlaps(entry, minX, minY, maxX, maxY);
          });
        }

        /** Segment AB thickened by radius r (capsule broadphase). */;
        _proto.querySegment = function querySegment(ax, ay, bx, by, r, out) {
          var minX = Math.min(ax, bx) - r;
          var minY = Math.min(ay, by) - r;
          var maxX = Math.max(ax, bx) + r;
          var maxY = Math.max(ay, by) + r;
          return this.collect(minX, minY, maxX, maxY, out, function (entry) {
            return segmentHitsAabb(ax, ay, bx, by, entry.minX - r, entry.minY - r, entry.maxX + r, entry.maxY + r);
          });
        };
        _proto.collect = function collect(minX, minY, maxX, maxY, out, keep) {
          var seen = new Set();
          var before = out.length;
          var x0 = this.cellOf(minX);
          var y0 = this.cellOf(minY);
          var x1 = this.cellOf(maxX);
          var y1 = this.cellOf(maxY);
          for (var cy = y0; cy <= y1; cy++) {
            for (var cx = x0; cx <= x1; cx++) {
              var bucket = this.cells.get(cx + "," + cy);
              if (!bucket) continue;
              for (var _iterator = _createForOfIteratorHelperLoose(bucket), _step; !(_step = _iterator()).done;) {
                var _entry = _step.value;
                if (seen.has(_entry.id)) continue;
                if (!keep(_entry)) continue;
                seen.add(_entry.id);
                out.push(_entry.item);
              }
            }
          }
          return out.length - before;
        };
        _proto.cellOf = function cellOf(v) {
          return Math.floor(v / this.cellSize);
        };
        return SpatialHash;
      }());
      function aabbOverlaps(entry, minX, minY, maxX, maxY) {
        return entry.maxX >= minX && entry.minX <= maxX && entry.maxY >= minY && entry.minY <= maxY;
      }
      function aabbHitsCircle(entry, x, y, r) {
        var cx = Math.max(entry.minX, Math.min(x, entry.maxX));
        var cy = Math.max(entry.minY, Math.min(y, entry.maxY));
        var dx = cx - x;
        var dy = cy - y;
        return dx * dx + dy * dy <= r * r;
      }

      /** Liang–Barsky. True when segment AB meets the closed AABB. */
      function segmentHitsAabb(ax, ay, bx, by, minX, minY, maxX, maxY) {
        var dx = bx - ax;
        var dy = by - ay;
        var tmin = 0;
        var tmax = 1;
        var clip = function clip(p, q) {
          if (Math.abs(p) <= 1e-12) return q >= 0;
          var t = q / p;
          if (p < 0) {
            if (t > tmax) return false;
            if (t > tmin) tmin = t;
          } else {
            if (t < tmin) return false;
            if (t < tmax) tmax = t;
          }
          return tmin <= tmax;
        };
        if (!clip(-dx, ax - minX)) return false;
        if (!clip(dx, maxX - ax)) return false;
        if (!clip(-dy, ay - minY)) return false;
        if (!clip(dy, maxY - ay)) return false;
        return true;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/SpawnDirector.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _createForOfIteratorHelperLoose, _extends, _createClass, cclegacy;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _extends = module.extends;
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "d7c2cYUMg9D5ZsHLarNGjxy", "SpawnDirector", undefined);
      var KINDS = ['blob', 'sheep', 'boar', 'worm', 'turtle', 'bubble'];
      var BOSS_WAVE_KINDS = ['blob', 'sheep'];
      var SpawnDirector = exports('SpawnDirector', /*#__PURE__*/function () {
        function SpawnDirector(ctx, world) {
          this.time = 0;
          this.nextPurchase = 0;
          this.previousPurchase = 0;
          this.budget = 0;
          this.pending = null;
          this.generation = 0;
          /** P0 §8 验收: spawns whose center landed inside the view. 0 unless the in-map fallback had no off-view candidate. */
          this.inView = 0;
          /** Last `wave:start` wave (1-based). Used when `run.wave` is stale. */
          this.activeWave = 0;
          /** Wave 4 still owes this many scripted worms (tutorial 2, standard 1). */
          this.wormsNeeded = 0;
          this.ctx = void 0;
          this.world = void 0;
          this.ctx = ctx;
          this.world = world;
        }
        var _proto = SpawnDirector.prototype;
        _proto.reset = function reset() {
          this.generation += 1;
          this.time = 0;
          this.budget = 0;
          this.pending = null;
          this.previousPurchase = 0;
          this.inView = 0;
          this.wormsNeeded = 0;
          this.activeWave = 0;
          this.nextPurchase = this.ctx.tunables.get('spawn.purchaseInterval');
        };
        _proto.stop = function stop() {
          this.generation += 1;
        }

        /** P1-enemies-batch2 / GDD §5.5: 第 4 波必出 1 只剪链虫. */;
        _proto.onWaveStart = function onWaveStart(wave) {
          this.activeWave = wave;
          this.wormsNeeded = 0;
          if (wave === 4) this.wormsNeeded = 1;
        };
        _proto.update = function update(dt) {
          if (dt <= 0) return;
          var target = this.time + dt;
          var t = this.ctx.tunables;
          var generation = this.generation;
          // A run ends its own session, so core's session.length timeout does not apply (core/README 局流程).
          var timed = !this.ctx.services.has('run') && !t.getBool('session.endless');
          while (target + 1e-9 >= this.nextPurchase) {
            this.time = this.nextPurchase;
            // Core owns timeout; never spawn at or beyond its terminal step.
            if (timed && this.time + 1e-9 >= t.get('session.length')) break;
            // P0 §8 rate; P0 未定义，自选默认值: use the right endpoint
            // of each purchase interval for discrete budget integration.
            this.budget += (this.time - this.previousPurchase) * t.get('diff.budgetBase') * Math.pow(this.danger, t.get('diff.budgetExp')) * (this.bossWave() ? t.get('boss.addBudgetMul') : 1);
            this.previousPurchase = this.time;
            this.buy();
            if (generation !== this.generation) return;
            this.nextPurchase += t.get('spawn.purchaseInterval');
          }
          this.time = target;
        };
        _proto.debugSpawn = function debugSpawn(arg) {
          // Debug counts are exact individual counts, not automatic sheep groups.
          var parts = arg === undefined || arg.trim() === '' ? ['blob'] : arg.trim().split(/\s+/);
          var kind = parts[0];
          if (kind !== 'blob' && kind !== 'sheep' && kind !== 'boar' && kind !== 'worm' && kind !== 'turtle' && kind !== 'bubble') return;
          if (parts.length !== 1 && parts.length !== 2 && parts.length !== 4) return;
          var count = parts.length >= 2 ? Number(parts[1]) : 1;
          if (!Number.isInteger(count) || count < 1 || count > this.ctx.tunables.get('enemy.maxAlive')) return;
          var pos = null;
          if (parts.length === 4) {
            var x = Number(parts[2]);
            var y = Number(parts[3]);
            if (!Number.isFinite(x) || !Number.isFinite(y)) return;
            pos = {
              x: x,
              y: y
            };
          }
          var generation = this.generation;
          for (var i = 0; i < count && this.alive < Math.floor(this.ctx.tunables.get('enemy.maxAlive')); i++) {
            var _pos;
            var point = (_pos = pos) != null ? _pos : this.position(kind);
            if (!point) return;
            if (!pos) this.countInView(point);
            this.world.spawn(kind, point, this.danger);
            if (generation !== this.generation) return;
          }
        };
        _proto.buy = function buy() {
          var t = this.ctx.tunables;
          var generation = this.generation;
          while (this.alive < Math.floor(t.get('enemy.maxAlive'))) {
            if (this.wormsNeeded > 0 && this.unlocked('worm')) {
              if (!this.trySpawnScriptedWorm()) return;
              if (generation !== this.generation) return;
              continue;
            }
            if (this.pending && (t.get(this.pending.kind + ".weight") <= 0 || !this.unlocked(this.pending.kind))) {
              this.pending = null;
            }
            if (!this.pending) this.pending = this.rollPurchase();
            var purchase = this.pending;
            if (!purchase) return;
            var cost = purchase.count * t.get(purchase.kind + ".cost");
            // P0 未定义，自选默认值: save for the selected purchase;
            // do not bias weights toward cheap enemies.
            // Sheep groups are atomic: do not silently truncate at the budget/cap.
            if (this.budget + 1e-9 < cost || this.alive + purchase.count > Math.floor(t.get('enemy.maxAlive'))) return;
            if (purchase.kind === 'worm' && this.world.countKind('worm') + purchase.count > Math.floor(t.get('worm.maxAlive'))) {
              this.pending = null;
              continue;
            }
            var anchor = this.position(purchase.kind);
            if (!anchor) return; // No candidate far enough from the pet: retain budget.
            this.budget = Math.max(0, this.budget - cost);
            this.pending = null;
            for (var i = 0; i < purchase.count; i++) {
              var pos = purchase.kind === 'sheep' ? this.groupPosition(anchor) : anchor;
              this.countInView(pos);
              this.world.spawn(purchase.kind, pos, this.danger);
              if (generation !== this.generation) return;
            }
          }
        }

        /** P1-numbers-batch1 §3.3 `boss.addBudgetMul`: Boss 波预算 × 0.4，只刷软团子 / 群聚羊. */;
        _proto.bossWave = function bossWave() {
          return this.ctx.services.has('run') && this.ctx.services.get('run').bossWave;
        };
        _proto.rollPurchase = function rollPurchase() {
          var t = this.ctx.tunables;
          var kinds = this.bossWave() ? BOSS_WAVE_KINDS : KINDS;
          var unlocked = [];
          for (var i = 0; i < kinds.length; i++) {
            var kind = kinds[i];
            if (!kind) continue;
            if (!this.unlocked(kind) || t.get(kind + ".weight") <= 0) continue;
            if (kind === 'worm' && this.world.countKind('worm') >= Math.floor(t.get('worm.maxAlive'))) continue;
            unlocked.push(kind);
          }
          var total = 0;
          for (var _i = 0; _i < unlocked.length; _i++) {
            var _kind = unlocked[_i];
            if (_kind) total += t.get(_kind + ".weight");
          }
          if (total <= 0) return null;
          var roll = this.ctx.rng.spawn.next() * total;
          for (var _i2 = 0; _i2 < unlocked.length; _i2++) {
            var _kind2 = unlocked[_i2];
            if (!_kind2) continue;
            roll -= t.get(_kind2 + ".weight");
            if (roll >= 0) continue;
            var low = Math.floor(Math.min(t.get('sheep.groupMin'), t.get('sheep.groupMax')));
            var high = Math.floor(Math.max(t.get('sheep.groupMin'), t.get('sheep.groupMax')));
            return {
              kind: _kind2,
              count: _kind2 === 'sheep' ? low + Math.floor(this.ctx.rng.spawn.next() * (high - low + 1)) : 1
            };
          }
          return null;
        }

        /** Run 在场用 unlockWave（取 run.wave 与 wave:start 的较大值）；沙盒用 unlockAt 秒数. */;
        _proto.unlocked = function unlocked(kind) {
          var t = this.ctx.tunables;
          if (this.ctx.services.has('run') && t.has(kind + ".unlockWave")) {
            return this.runWave() + 1e-9 >= t.get(kind + ".unlockWave");
          }
          return this.time + 1e-9 >= t.get(kind + ".unlockAt");
        };
        _proto.runWave = function runWave() {
          var live = this.ctx.services.has('run') ? this.ctx.services.get('run').wave : 0;
          return live > this.activeWave ? live : this.activeWave;
        }

        /** Spend budget on one owed wave-4 worm. False = wait (do not buy anything else). */;
        _proto.trySpawnScriptedWorm = function trySpawnScriptedWorm() {
          var t = this.ctx.tunables;
          var cost = t.get('worm.cost');
          var cap = Math.floor(t.get('worm.maxAlive'));
          if (this.world.countKind('worm') >= cap) {
            this.wormsNeeded = 0;
            return true;
          }
          if (this.budget + 1e-9 < cost || this.alive + 1 > Math.floor(t.get('enemy.maxAlive'))) return false;
          var pos = this.position('worm');
          if (!pos) return false;
          this.budget = Math.max(0, this.budget - cost);
          this.countInView(pos);
          this.world.spawn('worm', pos, this.danger);
          this.wormsNeeded -= 1;
          return true;
        }

        /**
         * P0 §8 (2026-10-19): enemies farther than `enemy.recycleDist` from the pet
         * teleport back onto the spawn ring. Stay put when no legal point is found.
         */;
        _proto.recycle = function recycle() {
          var limit = this.ctx.tunables.get('enemy.recycleDist');
          var pet = this.world.player().pos;
          for (var _iterator = _createForOfIteratorHelperLoose(this.world.enemies.values()), _step; !(_step = _iterator()).done;) {
            var e = _step.value;
            // The boss keeps itself within boss.leashDist and has no spawn-ring radius key.
            if (!e.alive || e.kind === 'boss' || Math.hypot(e.pos.x - pet.x, e.pos.y - pet.y) <= limit) continue;
            var point = this.position(e.kind);
            if (point) this.world.relocate(e, point);
          }
        }

        /**
         * P0 §8 (2026-10-19): a random direction from the pet onto the view rect grown
         * by `spawn.offscreenMargin`; re-roll when the point is outside the map (inset
         * by `spawn.edgeInset`) or closer than `spawn.minDistFromPet`.
         * Product 2026-10-19 【提案】: after `spawn.maxTries` re-rolls, fall back to the
         * in-map candidate farthest from the pet, never closer than `spawn.minDistFromPet`.
         * Candidates are each rejected ring point pulled inside the map plus one point
         * sampled uniformly on the inset map edge (the old edge spawn); P0 未定义，自选:
         * off-view candidates win over in-view ones. Null only when none is far enough.
         */;
        _proto.position = function position(kind) {
          var t = this.ctx.tunables;
          var r = t.get(kind + ".radius");
          var inset = Math.max(r, t.get('spawn.edgeInset'));
          var camera = this.ctx.camera;
          var margin = t.get('spawn.offscreenMargin');
          var hw = camera.viewW / 2 + margin;
          var hh = camera.viewH / 2 + margin;
          var cx = camera.center.x;
          var cy = camera.center.y;
          var pet = this.world.player().pos;
          // Cast from the pet; with camera.lerp > 0 it can trail the view center, so keep the origin on the ring's inside.
          var ox = Math.max(cx - hw, Math.min(cx + hw, pet.x));
          var oy = Math.max(cy - hh, Math.min(cy + hh, pet.y));
          var minDist = t.get('spawn.minDistFromPet');
          var tries = Math.max(1, Math.floor(t.get('spawn.maxTries')));
          var best = null;
          var bestDist = -1;
          var bestOffView = false;
          var consider = function consider(c) {
            if (!c) return;
            var d = Math.hypot(c.x - pet.x, c.y - pet.y);
            if (d + 1e-9 < minDist) return;
            var offView = !camera.inView(c);
            if (best && (bestOffView && !offView || bestOffView === offView && d <= bestDist)) return;
            best = c;
            bestDist = d;
            bestOffView = offView;
          };
          for (var i = 0; i < tries; i++) {
            var angle = this.ctx.rng.spawn.next() * Math.PI * 2;
            var dx = Math.cos(angle);
            var dy = Math.sin(angle);
            var sx = dx > 1e-12 ? (cx + hw - ox) / dx : dx < -1e-12 ? (cx - hw - ox) / dx : Infinity;
            var sy = dy > 1e-12 ? (cy + hh - oy) / dy : dy < -1e-12 ? (cy - hh - oy) / dy : Infinity;
            var s = Math.min(sx, sy);
            var p = {
              x: ox + dx * s,
              y: oy + dy * s
            };
            if (this.insideMap(p, inset) && Math.hypot(p.x - pet.x, p.y - pet.y) + 1e-9 >= minDist) return p;
            consider(this.pullInside(p, inset));
            consider(this.edgePoint(inset));
          }
          return best;
        };
        _proto.pullInside = function pullInside(p, inset) {
          var w = this.ctx.arena.width;
          var h = this.ctx.arena.height;
          if (w < inset * 2 || h < inset * 2) return null;
          return {
            x: Math.max(inset, Math.min(w - inset, p.x)),
            y: Math.max(inset, Math.min(h - inset, p.y))
          };
        };
        _proto.edgePoint = function edgePoint(inset) {
          var w = this.ctx.arena.width - inset * 2;
          var h = this.ctx.arena.height - inset * 2;
          if (w < 0 || h < 0) return null;
          var u = this.ctx.rng.spawn.next() * 2 * (w + h);
          if (u < w) return {
            x: inset + u,
            y: inset
          };
          u -= w;
          if (u < h) return {
            x: inset + w,
            y: inset + u
          };
          u -= h;
          if (u < w) return {
            x: inset + w - u,
            y: inset + h
          };
          return {
            x: inset,
            y: inset + h - (u - w)
          };
        };
        _proto.groupPosition = function groupPosition(anchor) {
          var t = this.ctx.tunables;
          var angle = this.ctx.rng.spawn.next() * Math.PI * 2;
          var radius = Math.sqrt(this.ctx.rng.spawn.next()) * t.get('sheep.groupSpawnRadius');
          var r = t.get('sheep.radius');
          var pos = this.ctx.arena.clamp({
            x: anchor.x + Math.cos(angle) * radius,
            y: anchor.y + Math.sin(angle) * radius
          }, r);
          var pet = this.world.player().pos;
          var legal = !this.ctx.camera.inView(pos) && Math.hypot(pos.x - pet.x, pos.y - pet.y) + 1e-9 >= t.get('spawn.minDistFromPet');
          return legal ? pos : _extends({}, anchor);
        };
        _proto.insideMap = function insideMap(p, inset) {
          return p.x >= inset && p.x <= this.ctx.arena.width - inset && p.y >= inset && p.y <= this.ctx.arena.height - inset;
        };
        _proto.countInView = function countInView(p) {
          if (this.ctx.camera.inView(p)) this.inView += 1;
        };
        _createClass(SpawnDirector, [{
          key: "elapsed",
          get: function get() {
            return this.time;
          }
        }, {
          key: "danger",
          get: function get() {
            var t = this.time / 60; // P0 §8: minutes, no cap and no speed scaling.
            return 1 + this.ctx.tunables.get('diff.tA') * t + this.ctx.tunables.get('diff.tB') * t * t;
          }
        }, {
          key: "alive",
          get: function get() {
            return this.world.aliveCount();
          }
        }, {
          key: "inViewSpawns",
          get: function get() {
            return this.inView;
          }
        }]);
        return SpawnDirector;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/StepProbe.ts", ['cc', './SystemOrder.ts'], function (exports) {
  var cclegacy, SystemOrder;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      SystemOrder = module.SystemOrder;
    }],
    execute: function () {
      cclegacy._RF.push({}, "7c261UGE+ZFdb0tVUqtN67U", "StepProbe", undefined);

      /**
       * Example system: counts real simulation steps.
       * At 60 Hz, 30 Hz, and 120 Hz rendering, one second of game time is 60 steps.
       * Hit-stop frames do not increment `steps` (this system is not the input slot).
       */
      var StepProbe = exports('StepProbe', /*#__PURE__*/function () {
        function StepProbe() {
          this.id = 'core.stepProbe';
          this.order = SystemOrder.StepProbe;
          this.steps = 0;
        }
        var _proto = StepProbe.prototype;
        _proto.fixedUpdate = function fixedUpdate(_dt) {
          this.steps += 1;
        };
        _proto.reset = function reset() {
          this.steps = 0;
        };
        return StepProbe;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/Storage.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports('isRecord', isRecord);
      cclegacy._RF.push({}, "a752d1o2w9IUJvAosW9McNI", "Storage", undefined);
      /** Injectable so logic tests and native builds never need browser globals. */
      var StoredJson = exports('StoredJson', /*#__PURE__*/function () {
        function StoredJson(storage) {
          this.error = '';
          this.storage = void 0;
          this.storage = storage;
        }
        var _proto = StoredJson.prototype;
        _proto.read = function read(key) {
          if (!this.storage) return null;
          try {
            var text = this.storage.getItem(key);
            return text === null ? null : JSON.parse(text);
          } catch (_unused) {
            this.error = '本地数据读取失败；仍可导出内存数据';
            return null;
          }
        };
        _proto.write = function write(key, value) {
          if (!this.storage) {
            this.error = '本地存储不可用；请导出数据';
            return false;
          }
          try {
            this.storage.setItem(key, JSON.stringify(value));
            this.error = '';
            return true;
          } catch (_unused2) {
            this.error = '本地保存失败（空间或权限）；请导出数据';
            return false;
          }
        };
        return StoredJson;
      }());
      function isRecord(value) {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/SwordChain.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './Damage.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, _extends, _createClass, cclegacy, ropeLength;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _extends = module.extends;
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      ropeLength = module.ropeLength;
    }],
    execute: function () {
      cclegacy._RF.push({}, "a9141+9o3hF9YL0JSJ2A/sn", "SwordChain", undefined);
      var SwordChain = exports('SwordChain', /*#__PURE__*/function () {
        function SwordChain(ctx) {
          this.slots = [];
          this.loose = [];
          this.slotMax = 12;
          this.immune = 0;
          this.startedAt = 0;
          this.ctx = void 0;
          this.ctx = ctx;
        }
        var _proto = SwordChain.prototype;
        _proto.reset = function reset() {
          this.loose.length = 0;
          this.immune = 0;
          // P0 §6.3: reset is reached from session:start, including debug restart.
          // Use simulation time so hit-stop pauses grace; setCount must not renew it.
          this.startedAt = this.ctx.loop.simTime;
          this.slotMax = Math.floor(this.ctx.tunables.get('chain.slotMax'));
          this.setCount(this.ctx.tunables.get('chain.startCount'));
        };
        _proto.rollGrade = function rollGrade() {
          var a = Math.floor(this.ctx.tunables.get('chain.gradeMin'));
          var b = Math.floor(this.ctx.tunables.get('chain.gradeMax'));
          return Math.min(a, b) + this.ctx.rng.loot.nextInt(Math.abs(a - b) + 1);
        };
        _proto.setCount = function setCount(count) {
          if (!Number.isFinite(count)) return;
          this.slots.length = 0;
          var n = Math.max(0, Math.min(this.capacity, Math.floor(count)));
          // P0 未定义，自选默认值: opening/debug swords use the same grade roll as loot.
          for (var i = 0; i < n; i++) this.insert(this.rollGrade());
          this.changed();
        }
        /** Forge rewards go straight into the chain instead of spawning on the ground. */;
        _proto.addForged = function addForged(count, grade, pet) {
          if (!Number.isFinite(count) || !Number.isFinite(grade) || count <= 0) return 0;
          var target = Math.floor(count);
          var forgedGrade = Math.max(0, Math.min(5, Math.floor(grade)));
          var added = 0;
          while (added < target && this.N < this.capacity) {
            this.insert(forgedGrade);
            added++;
          }
          if (added > 0) this.changed();
          for (var i = added; i < target; i++) this.addLoose({
            x: pet.x,
            y: pet.y
          }, forgedGrade, false);
          return added;
        }
        /** Remove the highest-grade sword represented by a forge slot selection. */;
        _proto.removeForPromote = function removeForPromote(slotIndex) {
          if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= this.slots.length) return false;
          var slot = this.slots[slotIndex];
          var selected = 0;
          for (var i = 1; i < slot.grades.length; i++) {
            if (slot.grades[i] > slot.grades[selected]) selected = i;
          }
          slot.grades.splice(selected, 1);
          if (slot.grades.length === 0) {
            this.slots.splice(slotIndex, 1);
            for (var _i = slotIndex; _i < this.slots.length; _i++) this.slots[_i].index = _i;
          }
          this.changed();
          return true;
        };
        _proto.addLoose = function addLoose(pos, grade, recovered) {
          if (!Number.isFinite(pos.x) || !Number.isFinite(pos.y) || !Number.isFinite(grade)) return;
          this.loose.push({
            pos: this.ctx.arena.clamp(pos, this.ctx.tunables.get('chain.linkRadius')),
            grade: Math.max(0, Math.min(5, Math.floor(grade))),
            left: this.ctx.tunables.get(recovered ? 'scatter.blinkTime' : 'chain.groundLife'),
            recovered: recovered
          });
        };
        _proto.setImmune = function setImmune(seconds) {
          if (Number.isFinite(seconds)) this.immune = Math.max(this.immune, seconds, 0);
          this.clearContacts();
        };
        _proto.clearContacts = function clearContacts() {
          for (var _iterator = _createForOfIteratorHelperLoose(this.slots), _step; !(_step = _iterator()).done;) {
            var s = _step.value;
            s.contactTime = 0;
          }
        };
        _proto.step = function step(dt, pet) {
          this.immune = Math.max(0, this.immune - dt);
          // Hot capacity/layer reductions leave excess swords on the ground, never overstack.
          var changed = false;
          for (var i = this.slots.length - 1; i >= 0; i--) {
            var slot = this.slots[i];
            while (slot.grades.length > this.stackMax) {
              var grade = slot.grades.pop();
              if (grade !== undefined) this.addLoose(slot.pos, grade, false);
              changed = true;
            }
            if (slot.grades.length === 0) this.slots.splice(i, 1);
          }
          while (this.N > this.capacity) {
            var _slot = this.slots[this.slots.length - 1];
            var _grade = _slot.grades.pop();
            if (_grade !== undefined) this.addLoose(_slot.pos, _grade, false);
            if (_slot.grades.length === 0) this.slots.pop();
            changed = true;
          }
          if (changed) this.changed();
          var expired = 0;
          for (var _i2 = this.loose.length - 1; _i2 >= 0; _i2--) {
            var sword = this.loose[_i2];
            sword.left -= dt;
            // Expiration wins at the exact deadline, including when the pet is on the sword.
            if (sword.left <= 1e-8) {
              expired++;
              this.loose.splice(_i2, 1);
              continue;
            }
            if (this.N >= this.capacity || Math.hypot(pet.x - sword.pos.x, pet.y - sword.pos.y) > this.ctx.tunables.get('chain.pickupRadius')) continue;
            this.insert(sword.grade);
            this.loose.splice(_i2, 1);
            this.changed();
            this.ctx.events.emit('chain:pickup', {
              N: this.N,
              recovered: sword.recovered
            });
          }
          if (expired > 0) this.ctx.events.emit('chain:scatterExpired', {
            count: expired
          });
        }

        /** A slot is the rope node, not an independent visual sample. */;
        _proto.place = function place(rope) {
          for (var _iterator2 = _createForOfIteratorHelperLoose(this.slots), _step2; !(_step2 = _iterator2()).done;) {
            var slot = _step2.value;
            var point = rope.points[slot.index + 1];
            if (!point) continue;
            slot.pos = point;
            slot.previous = {
              x: point.beforeX,
              y: point.beforeY
            };
          }
        }

        /** P0 §6.3: contact, rope distance, head-on closing, duration and immunity. */;
        _proto.detectBreak = function detectBreak(dt, pet, vel, rope) {
          if (dt <= 0 || !this.enabled || this.immune > 1e-8 || !this.ctx.tunables.getBool('break.enabled') || this.ctx.loop.simTime - this.startedAt + 1e-8 < this.ctx.tunables.get('break.spawnGrace')) {
            this.clearContacts();
            return null;
          }
          var radius = this.ctx.tunables.get('pet.radius') + this.ctx.tunables.get('chain.linkRadius');
          var minClosing = this.ctx.tunables.get('break.minClosingSpeed');
          for (var _iterator3 = _createForOfIteratorHelperLoose(this.slots), _step3; !(_step3 = _iterator3()).done;) {
            var slot = _step3.value;
            var dx = slot.pos.x - pet.x;
            var dy = slot.pos.y - pet.y;
            var dist = Math.hypot(dx, dy);
            var linkX = (slot.pos.x - slot.previous.x) / dt;
            var linkY = (slot.pos.y - slot.previous.y) / dt;
            var closing = dist > 1e-9 ? ((vel.x - linkX) * dx + (vel.y - linkY) * dy) / dist : 0;
            // P0 §6.3 / product decision 2026-10-19 #4: positive closing also
            // includes catching a slower link. Require opposite velocities and
            // apply the same closing threshold to their paired approach:
            // 2*min(petApproach, linkApproach) = closing - |speed imbalance|.
            // This removes the catch-up contribution; a tiny counter-motion
            // from the hanging rope's adjustment is not a head-on collision.
            // No new speed/angle tunable or pet turn threshold is introduced.
            var opposing = -(vel.x * linkX + vel.y * linkY);
            var petApproach = dist > 1e-9 ? (vel.x * dx + vel.y * dy) / dist : 0;
            var linkApproach = dist > 1e-9 ? -(linkX * dx + linkY * dy) / dist : 0;
            var pairedClosing = 2 * Math.min(petApproach, linkApproach);
            var along = rope.distanceTo(slot.index + 1);
            if (opposing <= 0 || petApproach <= 0 || linkApproach <= 0 || pairedClosing + 1e-8 < minClosing || dist > radius || along + 1e-8 < this.ctx.tunables.get('break.minRopeDist') || closing + 1e-8 < minClosing) {
              slot.contactTime = 0;
              continue;
            }
            slot.contactTime += dt;
            if (slot.contactTime + 1e-8 >= this.ctx.tunables.get('break.minContactTime')) return {
              index: slot.index,
              distance: along,
              closing: closing
            };
          }
          return null;
        };
        _proto.breakAt = function breakAt(index, distance, closing) {
          if (index < 0 || index >= this.slots.length) return;
          var before = this.N;
          for (var i = index; i < this.slots.length; i++) {
            var slot = this.slots[i];
            for (var _iterator4 = _createForOfIteratorHelperLoose(slot.grades), _step4; !(_step4 = _iterator4()).done;) {
              var grade = _step4.value;
              var angle = this.ctx.rng.loot.range(0, Math.PI * 2);
              var offset = this.ctx.rng.loot.range(0, this.ctx.tunables.get('scatter.spread'));
              this.addLoose({
                x: slot.pos.x + Math.cos(angle) * offset,
                y: slot.pos.y + Math.sin(angle) * offset
              }, grade, true);
            }
          }
          this.slots.splice(index);
          this.setImmune(this.ctx.tunables.get('break.immunity'));
          this.changed();
          this.ctx.events.emit('chain:break', {
            slotIndex: index,
            lost: before - this.N,
            nBefore: before,
            ropeDist: distance,
            closingSpeed: closing
          });
        };
        _proto.insert = function insert(grade) {
          if (this.N >= this.capacity) return;
          if (this.slots.length < this.slotMax) {
            var pos = {
              x: this.ctx.arena.width / 2,
              y: this.ctx.arena.height / 2
            };
            this.slots.push({
              index: this.slots.length,
              grades: [grade],
              pos: pos,
              previous: _extends({}, pos),
              autoLeft: this.ctx.tunables.get('chain.autoInterval'),
              contactTime: 0
            });
          } else {
            var _selected;
            var selected = null;
            // Rope order breaks ties toward the pet; preserve each existing sword's slot/grade.
            for (var _iterator5 = _createForOfIteratorHelperLoose(this.slots), _step5; !(_step5 = _iterator5()).done;) {
              var slot = _step5.value;
              if (slot.grades.length < this.stackMax && (!selected || slot.grades.length < selected.grades.length)) selected = slot;
            }
            (_selected = selected) == null || _selected.grades.push(grade);
          }
        };
        _proto.changed = function changed() {
          this.ctx.events.emit('chain:changed', {
            N: this.N,
            slots: this.slots.length
          });
        };
        _createClass(SwordChain, [{
          key: "N",
          get: function get() {
            return this.slots.reduce(function (sum, slot) {
              return sum + slot.grades.length;
            }, 0);
          }
          /** Highest-grade sword in each visible slot; forge uses this list for 提拔. */
        }, {
          key: "linkGrades",
          get: function get() {
            var grades = [];
            for (var _iterator6 = _createForOfIteratorHelperLoose(this.slots), _step6; !(_step6 = _iterator6()).done;) {
              var slot = _step6.value;
              var highest = 0;
              for (var _iterator7 = _createForOfIteratorHelperLoose(slot.grades), _step7; !(_step7 = _iterator7()).done;) {
                var grade = _step7.value;
                highest = Math.max(highest, grade);
              }
              grades.push(highest);
            }
            return grades;
          }
        }, {
          key: "targetLength",
          get: function get() {
            return ropeLength(this.ctx.tunables, this.slots.length);
          }
        }, {
          key: "enabled",
          get: function get() {
            return this.ctx.tunables.getBool('mech.chain');
          }
        }, {
          key: "capacity",
          get: function get() {
            return this.enabled ? Math.min(36, Math.floor(this.ctx.tunables.get('chain.maxCount')), this.slotMax * this.stackMax) : 0;
          }
        }, {
          key: "stackMax",
          get: function get() {
            return Math.min(3, Math.floor(this.ctx.tunables.get('chain.stackMax')));
          }
        }]);
        return SwordChain;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/SwordCombat.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './Geom2.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, _extends, cclegacy, pointSegmentDistance;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _extends = module.extends;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      pointSegmentDistance = module.pointSegmentDistance;
    }],
    execute: function () {
      cclegacy._RF.push({}, "f773afLGFFN/YuVnQas39mE", "SwordCombat", undefined);
      /** Enemy owns cooldowns too; this local guard avoids duplicate service calls in a step. */
      var SwordCombat = exports('SwordCombat', /*#__PURE__*/function () {
        function SwordCombat(ctx) {
          this.labels = [];
          this.out = [];
          this.lastHits = new Map();
          this.clock = 0;
          this.ctx = void 0;
          this.ctx = ctx;
        }
        var _proto = SwordCombat.prototype;
        _proto.reset = function reset() {
          this.labels.length = 0;
          this.lastHits.clear();
          this.clock = 0;
        };
        _proto.step = function step(dt) {
          this.clock += dt;
          for (var i = this.labels.length - 1; i >= 0; i--) {
            this.labels[i].left -= dt;
            if (this.labels[i].left <= 0) this.labels.splice(i, 1);
          }
          for (var _iterator = _createForOfIteratorHelperLoose(this.lastHits.values()), _step; !(_step = _iterator()).done;) {
            var hits = _step.value;
            for (var _iterator2 = _createForOfIteratorHelperLoose(hits), _step2; !(_step2 = _iterator2()).done;) {
              var _step2$value = _step2.value,
                id = _step2$value[0],
                until = _step2$value[1];
              if (until <= this.clock) hits["delete"](id);
            }
          }
        };
        _proto.segment = function segment(a, b, radius, amount, source, key, cooldown, knockback) {
          if (knockback === void 0) {
            knockback = 0;
          }
          if (!this.ctx.services.has('enemies') || amount <= 0) return;
          var enemies = this.ctx.services.get('enemies');
          this.out.length = 0;
          enemies.querySegment(a, b, radius, this.out);
          for (var _iterator3 = _createForOfIteratorHelperLoose(this.out), _step3; !(_step3 = _iterator3()).done;) {
            var enemy = _step3.value;
            if (!enemy.alive || pointSegmentDistance(enemy.pos, a, b) > radius + enemy.radius) continue;
            this.hit(enemy, amount, source, key, cooldown, {
              x: b.x - a.x,
              y: b.y - a.y
            }, knockback);
          }
        };
        _proto.circle = function circle(pos, radius, amount, source, key, cooldown, nearestOnly) {
          if (!this.ctx.services.has('enemies')) return;
          var enemies = this.ctx.services.get('enemies');
          this.out.length = 0;
          enemies.queryCircle(pos, radius, this.out);
          var nearest = null;
          var distance = Infinity;
          for (var _iterator4 = _createForOfIteratorHelperLoose(this.out), _step4; !(_step4 = _iterator4()).done;) {
            var e = _step4.value;
            var d = Math.hypot(e.pos.x - pos.x, e.pos.y - pos.y);
            if (!e.alive || d > radius + e.radius) continue;
            if (!nearestOnly) this.hit(e, amount, source, key, cooldown, {
              x: e.pos.x - pos.x,
              y: e.pos.y - pos.y
            });else if (d < distance) {
              nearest = e;
              distance = d;
            }
          }
          if (nearest) this.hit(nearest, amount, source, key, cooldown, {
            x: nearest.pos.x - pos.x,
            y: nearest.pos.y - pos.y
          });
        };
        _proto.hit = function hit(enemy, amount, source, key, cooldown, dir, knockback) {
          var _hits$get,
            _this = this;
          if (knockback === void 0) {
            knockback = 0;
          }
          if (amount <= 0) return;
          var hits = this.lastHits.get(key);
          if (!hits) {
            hits = new Map();
            this.lastHits.set(key, hits);
          }
          if (((_hits$get = hits.get(enemy.id)) != null ? _hits$get : -Infinity) > this.clock + 1e-8) return;
          var len = Math.hypot(dir.x, dir.y);
          var result = this.ctx.services.get('enemies').hit(enemy.id, {
            source: source,
            amount: amount,
            hitKey: key,
            cooldown: cooldown,
            dir: len > 0 ? {
              x: dir.x / len,
              y: dir.y / len
            } : {
              x: 0,
              y: 0
            },
            knockback: knockback
          });
          if (!result.applied) return;
          hits.set(enemy.id, this.clock + cooldown);
          var merge = this.labels.find(function (label) {
            return label.enemyId === enemy.id && _this.clock - label.created < _this.ctx.tunables.get('fx.damageMergeTime');
          });
          if (merge) {
            merge.amount += result.dealt;
            merge.source = source;
            return;
          }
          var max = Math.floor(this.ctx.tunables.get('fx.damageMax'));
          while (this.labels.length > 0 && this.labels.length >= max) this.labels.shift();
          if (max > 0) this.labels.push({
            enemyId: enemy.id,
            created: this.clock,
            pos: _extends({}, enemy.pos),
            amount: result.dealt,
            source: source,
            left: this.ctx.tunables.get('fx.damageLife')
          });
        };
        return SwordCombat;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/SwordParams.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _extends, cclegacy;
  return {
    setters: [function (module) {
      _extends = module.extends;
    }, function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "fe08bUOhyFBI4HA9Rl7k4N5", "SwordParams", undefined);
      function number(key, group, label, value, min, max, restart) {
        if (restart === void 0) {
          restart = false;
        }
        return {
          key: key,
          group: group,
          label: label,
          kind: 'number',
          "default": value,
          min: min,
          max: max,
          restart: restart
        };
      }
      function toggle(key, group, label, value) {
        if (value === void 0) {
          value = 1;
        }
        return {
          key: key,
          group: group,
          label: label,
          kind: 'bool',
          "default": value
        };
      }

      /** P0 §6.1–6.3; loop return hooks use §6.5. No legacy aliases. */
      var SWORD_PARAMS = exports('SWORD_PARAMS', [number('pet.speed', '宠物', '基础速度', 4.5, 2, 9), number('pet.accelTime', '宠物', '加速时间', 0.08, 0, 0.4), number('pet.decelTime', '宠物', '减速时间', 0.06, 0, 0.4), number('pet.weightSlow', '宠物', '每点剑重减速', 0.05, 0, 0.15), number('pet.radius', '宠物', '半径', 0.35, 0.2, 0.6), number('pet.maxHp', '宠物', '生命', 100, 10, 1000, true), number('pet.invuln', '宠物', '受伤免疫秒', 0.8, 0, 3), toggle('pet.godMode', '宠物', '无敌', 0), number('sword.level', '主剑', '强化等级', 0, 0, 15), number('sword.baseDmg', '主剑', '基础伤害', 10, 1, 100), number('sword.levelGrowth', '主剑', '每级成长', 1.12, 1, 1.3), number('sword.W', '主剑', '剑重', 2, 1, 5), number('sword.Lg', '主剑', '剑长', 2, 1, 5), number('sword.Cv', '主剑', '弧度', 1, 0, 3), number('sword.bladeLenBase', '主剑', '剑身基础长度', 0.4, 0.1, 1.5), number('sword.bladeLenPerLg', '主剑', '每点剑长剑身长度', 0.2, 0, 0.5), number('sword.bladeRadius', '主剑', '剑身半径', 0.15, 0.05, 0.5), number('sword.fullChargeMul', '主剑', '甩满参考速度倍率', 1.3, 1, 2.5), number('rope.baseLen', '绳索', '基础绳长', 1, 0.3, 3), number('rope.lenPerLg', '绳索', '每点剑长加绳长', 0.2, 0, 0.5), number('rope.lenPerSlot', '绳索', '每格加绳长', 0.3, 0.1, 0.6),
      // GDD §6.2 / F1: the settled hard cap wins over P0's proposed tuning range 2–10.
      number('rope.lenCap', '绳索', '绳长上限', 5, 2, 5), number('rope.iterations', '绳索', '约束迭代', 6, 1, 16), number('rope.damping', '绳索', '每步速度损失', 0.02, 0, 0.2), number('rope.linkMass', '绳索', '链格质量', 0.5, 0.1, 3), number('rope.mainMassPerW', '绳索', '主剑质量每剑重', 1, 0.2, 3), number('rope.wallBounce', '绳索', '撞墙反弹', 0.2, 0, 1), number('rope.tipFrames', '绳索', '剑尖速度平均步数', 3, 1, 8), number('drag.vDead', '拖剑', '无伤速度', 2, 0, 5), number('drag.vRef', '拖剑', '参考速度', 6, 2, 15), number('drag.qCap', '拖剑', '速度档上限', 3, 1, 5), number('drag.speedExp', '拖剑', '速度指数', 1.3, 0.5, 2.5), number('drag.weightExp', '拖剑', '重量指数', 0.7, 0, 1.5), number('drag.hitCooldown', '拖剑', '同敌命中间隔', 0.25, 0.05, 1), number('drag.knockbackK', '拖剑', '击退系数', 0.4, 0, 2), number('whip.turnDeg', '鞭响', '转向角度', 100, 45, 180), number('whip.window', '鞭响', '转向窗口', 0.3, 0.1, 0.6), number('whip.minSpeedFrac', '鞭响', '最低速度比例', 0.7, 0, 1), number('whip.impulse', '鞭响', '剑尖冲量', 4, 0, 15), number('whip.dmgMul', '鞭响', '伤害倍率', 1.8, 1, 4), number('whip.duration', '鞭响', '伤害窗口', 0.25, 0.05, 1), number('whip.cooldown', '鞭响', '冷却', 0.6, 0, 2), number('fx.hitstopFrames', '特效', '鞭响顿帧', 3, 0, 8), number('fx.whipHitstopMs', '特效', '鞭击顿帧毫秒', 60, 0, 200), number('fx.whipHitstopCooldownMs', '特效', '鞭击顿帧冷却毫秒', 200, 0, 2000), number('fx.shakeAmp', '特效', '震屏幅度', 0.08, 0, 0.3), number('fx.shakeDur', '特效', '震屏时长', 0.12, 0, 0.5), toggle('fx.trail', '特效', '拖影'), toggle('fx.hitstop', '特效', '顿帧'), toggle('fx.shake', '特效', '震屏'), toggle('mech.chain', '剑链', '剑链机制'), number('chain.startCount', '剑链', '开局剑数', 0, 0, 36, true), number('chain.maxCount', '剑链', '链剑上限', 16, 0, 36), number('chain.slotMax', '剑链', '链格上限', 12, 4, 12, true),
      // GDD §6.2 settled: at most three layers, despite P0's proposed range 1–5.
      number('chain.stackMax', '剑链', '每格层数上限', 3, 1, 3), number('chain.dropChance', '剑链', '普通怪掉散剑概率', 0.08, 0, 1), number('chain.pickupRadius', '剑链', '拾取半径', 0.5, 0.2, 1.5), number('chain.gradeMin', '剑链', '散剑最低等级', 0, 0, 5), number('chain.gradeMax', '剑链', '散剑最高等级', 2, 0, 5), number('chain.baseDmg', '剑链', '链剑基础伤害', 4, 0, 50), number('chain.mainLevelShare', '剑链', '主剑等级共享', 0.25, 0, 1), number('chain.resonPer', '剑链', '每把共鸣', 0.03, 0, 0.1), number('chain.resonCount', '剑链', '共鸣计数上限', 12, 0, 36), number('chain.stackBonus', '剑链', '叠层伤害加成', 0.6, 0, 1), number('chain.autoInterval', '剑链', '自动砍间隔', 1, 0.2, 3), number('chain.autoRange', '剑链', '自动砍范围', 1, 0.3, 3), number('chain.contactMul', '剑链', '接触伤害倍率', 0.3, 0, 2), number('chain.contactCooldown', '剑链', '接触伤害冷却', 0.25, 0.05, 1), number('chain.linkRadius', '剑链', '链格半径', 0.2, 0.05, 0.5), toggle('break.enabled', '断链', '启用断链'), number('break.minRopeDist', '断链', '最小沿绳距离', 1.2, 0, 5), number('break.minClosingSpeed', '断链', '最小相向接近速度', 2.5, 0, 10), number('break.minContactTime', '断链', '最短持续接触', 0.08, 0, 0.5), number('break.immunity', '断链', '断链免疫', 0.5, 0, 3), _extends({}, number('break.spawnGrace', '断链', '开局断链保护秒', 1, 0, 3), {
        step: 0.1
      }), number('scatter.blinkTime', '散落', '回收时间', 4, 0, 10), number('scatter.spread', '散落', '随机偏移', 0.6, 0, 2), number('scatter.mainReturnDelay', '散落', '主剑飞回延迟', 0.8, 0, 3), number('scatter.mainReturnSpeed', '散落', '主剑飞回速度', 10, 2, 30), number('scatter.mainReturnDmgMul', '散落', '主剑飞回伤害倍率', 0.5, 0, 2), number('loop.returnTime', '剑阵', '链格飞回时长', 0.4, 0, 2), number('loop.postReturnImmune', '剑阵', '飞回后断链免疫', 1, 0, 3),
      // Values are specified in P0 prose; only the additional keys are module-owned.
      number('rope.transitionTime', '绳索', '链格变化过渡', 0.2, 0, 0.2), number('chain.groundLife', '散落', '普通散剑保留时间', 10, 0, 10), number('fx.scatterBlinkHz', '特效', '散落闪烁频率', 4, 0, 8), number('fx.scatterFastBlinkHz', '特效', '散落末段闪烁频率', 8, 0, 16), number('fx.scatterFastTime', '特效', '加快闪烁剩余秒', 1, 0, 4), number('fx.damageMergeTime', '特效', '同敌数字合并窗口', 0.2, 0, 1), number('fx.damageMax', '特效', '伤害数字上限', 30, 0, 50),
      // P0 未定义，自选默认值: presentation durations, not combat constants.
      number('fx.trailTime', '特效', '速度拖影时间', 0.08, 0, 0.5), number('fx.petBlinkHz', '特效', '受击闪烁频率', 8, 0, 16), number('fx.damageLife', '特效', '伤害数字寿命', 0.6, 0, 2), number('fx.damageRise', '特效', '伤害数字上浮速度', 0.5, 0, 2), toggle('fx.fullCharge', '特效', '甩满变色') // P0 未定义，自选默认值: enabled.
      ]);

      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/SwordRig.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './ForgeContract.ts', './SwordChain.ts', './Damage.ts', './Whip.ts', './Pet.ts', './VerletRope.ts', './SwordCombat.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, _extends, _createClass, cclegacy, swordLook, SwordChain, dragDamage, slotDamage, contactDamage, speedTier, dragAtTier, baseDamage, ropeLength, Whip, Pet, VerletRope, SwordCombat;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _extends = module.extends;
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      swordLook = module.swordLook;
    }, function (module) {
      SwordChain = module.SwordChain;
    }, function (module) {
      dragDamage = module.dragDamage;
      slotDamage = module.slotDamage;
      contactDamage = module.contactDamage;
      speedTier = module.speedTier;
      dragAtTier = module.dragAtTier;
      baseDamage = module.baseDamage;
      ropeLength = module.ropeLength;
    }, function (module) {
      Whip = module.Whip;
    }, function (module) {
      Pet = module.Pet;
    }, function (module) {
      VerletRope = module.VerletRope;
    }, function (module) {
      SwordCombat = module.SwordCombat;
    }],
    execute: function () {
      cclegacy._RF.push({}, "7edd19E/ElDY5X3wIjfY7Ld", "SwordRig", undefined);
      /** P0 §6.5 parameter table: `jianyi.max` default. */
      var JIANYI_MAX_DEFAULT = 100;
      var SwordRig = exports('SwordRig', /*#__PURE__*/function () {
        function SwordRig(ctx) {
          var _this = this;
          this.ctx = void 0;
          this.pet = void 0;
          this.rope = void 0;
          this.chain = void 0;
          this.whip = void 0;
          this.combat = void 0;
          this.mainPos = {
            x: 0,
            y: 0
          };
          this.mainVel = {
            x: 0,
            y: 0
          };
          /** Shared whip hit-stop gate for every mounted view. */
          this.lastWhipHitstopSim = -1;
          this.lastWhipHitstopReal = -1e9;
          this.multipliers = new Map();
          this.unsubs = [];
          this.forgedSword = null;
          this.emittingSwordReset = false;
          this.attached = false;
          this.running = false;
          this.state = 'held';
          this.landed = false;
          this.loopReturning = false;
          this.loopReturnElapsed = 0;
          this.loopImmune = 0;
          this.loopImmuneLeft = 0;
          this.loopReturnFrom = [];
          this.returnElapsed = 0;
          this.internalReturn = false;
          this.forcedSpeed = null;
          this.speedValue = 0;
          this.charged = false;
          this.jianyiValue = 0;
          this.comboValue = 0;
          this.inkValue = null;
          this.jianzhenRemainingValue = null;
          this.enemyScale = 1;
          this.ctx = ctx;
          this.pet = new Pet(ctx, function () {
            return _this.W;
          });
          this.rope = new VerletRope(ctx);
          this.chain = new SwordChain(ctx);
          this.whip = new Whip(ctx);
          this.combat = new SwordCombat(ctx);
        }
        var _proto = SwordRig.prototype;
        _proto.attach = function attach() {
          var _this2 = this;
          if (this.attached) return;
          this.attached = true;
          this.unsubs.push(this.ctx.events.on('session:start', function () {
            return _this2.reset();
          }));
          this.unsubs.push(this.ctx.events.on('session:end', function () {
            _this2.running = false;
            _this2.pet.stop();
          }));
          this.unsubs.push(this.ctx.events.on('loot:sword', function (_ref) {
            var pos = _ref.pos;
            // P0 §6.3 explicitly rolls the grade with rng.loot; recovered swords retain it.
            if (_this2.running && _this2.chain.enabled) _this2.chain.addLoose(pos, _this2.chain.rollGrade(), false);
          }));
          this.unsubs.push(this.ctx.events.on('forge:sword', function (sword) {
            return _this2.applyForgedSword(sword);
          }));
          this.unsubs.push(this.ctx.events.on('forge:linkSword', function (_ref2) {
            var count = _ref2.count,
              grade = _ref2.grade;
            _this2.chain.addForged(count, grade, _this2.pet.pos);
          }));
          this.unsubs.push(this.ctx.events.on('forge:shatterChoice', function (_ref3) {
            var choice = _ref3.choice,
              slotIndex = _ref3.slotIndex;
            if (choice === 'promote' && slotIndex !== null) _this2.chain.removeForPromote(slotIndex);
          }));
          this.unsubs.push(this.ctx.events.on('debug:command', function (_ref4) {
            var cmd = _ref4.cmd,
              arg = _ref4.arg;
            if (cmd === 'setChain' && arg !== undefined && arg.trim() !== '') _this2.chain.setCount(Number(arg));
            if (cmd === 'forceVtip') {
              if (arg === undefined || arg === 'off' || arg === 'auto') _this2.forcedSpeed = null;else if (arg.trim() !== '' && Number.isFinite(Number(arg))) _this2.forcedSpeed = Math.max(0, Number(arg));
            }
          }));
        };
        _proto.detach = function detach() {
          for (var _iterator = _createForOfIteratorHelperLoose(this.unsubs), _step; !(_step = _iterator()).done;) {
            var off = _step.value;
            off();
          }
          this.unsubs.length = 0;
          this.attached = false;
        };
        _proto.reset = function reset() {
          this.forgedSword = null;
          this.state = 'held';
          this.landed = this.loopReturning = this.internalReturn = false;
          this.loopImmune = this.loopImmuneLeft = this.loopReturnElapsed = this.returnElapsed = 0;
          this.forcedSpeed = null;
          this.speedValue = this.jianyiValue = this.comboValue = 0;
          this.inkValue = this.jianzhenRemainingValue = null;
          this.enemyScale = 1;
          this.multipliers.clear();
          this.pet.reset();
          this.chain.reset();
          this.rope.reset(this.pet.pos, this.targetLength, this.ropeSlots, this.W);
          this.chain.place(this.rope);
          this.copyMain(this.rope.tip, {
            x: 0,
            y: 0
          });
          this.whip.reset();
          this.combat.reset();
          this.running = true;
          this.lastWhipHitstopSim = -1;
          this.lastWhipHitstopReal = -1e9;
          this.updateCharge(false);
          this.emittingSwordReset = true;
          try {
            this.ctx.events.emit('forge:sword', {
              k: 1,
              level: this.level,
              W: this.W,
              Lg: this.Lg,
              Cv: this.Cv
            });
          } finally {
            this.emittingSwordReset = false;
          }
        };
        _proto.stepPet = function stepPet(dt) {
          if (this.attached && this.running) this.pet.fixedUpdate(dt);
        }

        /** Order 400: rope -> drag/whip -> chain -> throw entry -> loop entry. */;
        _proto.fixedUpdate = function fixedUpdate(dt) {
          if (!this.attached || !this.running || this.pet.hp <= 0 || dt <= 0) return;
          this.combat.step(dt);
          this.loopImmuneLeft = Math.max(0, this.loopImmuneLeft - dt);
          for (var _iterator2 = _createForOfIteratorHelperLoose(this.multipliers), _step2; !(_step2 = _iterator2()).done;) {
            var _step2$value = _step2.value,
              key = _step2$value[0],
              _value = _step2$value[1];
            _value.left -= dt;
            if (_value.left <= 0) this.multipliers["delete"](key);
          }
          var heldAtStart = this.mainHeld;
          this.rope.step(dt, this.pet.pos, this.targetLength, this.ropeSlots, this.W);
          if (heldAtStart) {
            this.copyMain(this.rope.tip, this.rope.tipVelocity);
            this.speedValue = this.rope.tipSpeed;
          } else if (this.internalReturn) this.stepMainReturn(dt);else this.speedValue = 0;
          if (this.whip.step(dt, this.pet.vel, this.pet.maxSpeed, this.mainPos, heldAtStart)) this.whipImpulse(dt);
          this.updateCharge(this.mainHeld && this.vTip + 1e-8 >= this.ctx.tunables.get('sword.fullChargeMul') * this.ctx.tunables.get('drag.vRef'));
          if (heldAtStart) {
            var mul = this.whip.active ? this.ctx.tunables.get('whip.dmgMul') : 1;
            for (var _iterator3 = _createForOfIteratorHelperLoose(this.multipliers.values()), _step3; !(_step3 = _iterator3()).done;) {
              var value = _step3.value;
              mul *= value.mul;
            }
            this.hitMain(this.rope.tipBefore, dragDamage(this.ctx.tunables, this.vTip, this.W, this.level) * mul, this.whip.active ? 'whip' : 'drag');
          }
          this.chain.step(dt, this.pet.pos);
          this.rope.configure(this.ropeSlots, this.targetLength, this.W);
          if (!this.landed) this.chain.place(this.rope);
          if (this.loopReturning) {
            this.stepLoopReturn(dt);
            this.chain.clearContacts();
            return;
          }
          if (this.landed || !this.chain.enabled) {
            this.chain.clearContacts();
            return;
          }
          for (var _iterator4 = _createForOfIteratorHelperLoose(this.chain.slots), _step4; !(_step4 = _iterator4()).done;) {
            var slot = _step4.value;
            var damage = slotDamage(this.ctx.tunables, slot.grades, this.N, this.level);
            slot.autoLeft -= dt;
            if (slot.autoLeft <= 1e-8) {
              slot.autoLeft += this.ctx.tunables.get('chain.autoInterval');
              this.combat.circle(slot.pos, this.ctx.tunables.get('chain.autoRange'), damage, 'link_auto', "slot:" + slot.index, this.ctx.tunables.get('chain.autoInterval'), true);
            }
            var speed = Math.hypot(slot.pos.x - slot.previous.x, slot.pos.y - slot.previous.y) / dt;
            this.combat.segment(slot.previous, slot.pos, this.ctx.tunables.get('chain.linkRadius'), contactDamage(this.ctx.tunables, damage, speed), 'link_contact', "slotc:" + slot.index, this.ctx.tunables.get('chain.contactCooldown'));
          }
          if (this.loopImmuneLeft > 1e-8) {
            this.chain.clearContacts();
            return;
          }
          var hit = this.chain.detectBreak(dt, this.pet.pos, this.pet.vel, this.rope);
          if (hit) {
            if (this.mainHeld) this.beginMainReturn();
            this.chain.breakAt(hit.index, hit.distance, hit.closing);
            this.rope.configure(this.ropeSlots, this.targetLength, this.W);
            this.chain.place(this.rope);
          }
        };
        _proto.detachMain = function detachMain() {
          var result = {
            pos: _extends({}, this.mainPos),
            vel: _extends({}, this.mainVel)
          };
          this.setMainState('thrown');
          return result;
        };
        _proto.attachMain = function attachMain() {
          this.internalReturn = false;
          this.rope.setMainAttached(true);
          this.state = 'held';
          this.copyMain(this.rope.tip, this.rope.tipVelocity);
          this.pet.setMode(this.landed, false);
        };
        _proto.setMainState = function setMainState(s) {
          this.internalReturn = false;
          this.state = s;
          this.chain.clearContacts();
          if (s === 'held') this.attachMain();else {
            this.rope.setMainAttached(false);
            this.updateCharge(false);
            this.pet.setMode(this.landed, this.emptyHanded);
          }
        };
        _proto.setChainLanded = function setChainLanded(landed, immuneSec) {
          if (landed === this.landed) return;
          this.landed = landed;
          this.loopReturning = !landed;
          this.loopImmuneLeft = 0;
          var seconds = immuneSec != null ? immuneSec : this.ctx.tunables.get('loop.postReturnImmune');
          this.loopImmune = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
          this.loopReturnElapsed = 0;
          this.loopReturnFrom = this.chain.slots.map(function (s) {
            return _extends({}, s.pos);
          });
          this.chain.clearContacts();
          this.rope.configure(this.ropeSlots, this.targetLength, this.W);
          this.pet.setMode(landed, this.emptyHanded);
        };
        _proto.setBreakImmune = function setBreakImmune(seconds) {
          this.chain.setImmune(seconds);
        };
        _proto.addDragMul = function addDragMul(key, mul, seconds) {
          if (Number.isFinite(mul) && Number.isFinite(seconds) && mul >= 0 && seconds > 0) this.multipliers.set(key, {
            mul: mul,
            left: seconds
          });
        };
        _proto.setEnemyTimeScale = function setEnemyTimeScale(s) {
          if (Number.isFinite(s)) this.enemyScale = Math.max(0, Math.min(1, s));
        }
        /** P0 §6.5: 剑意 is 0–`jianyi.max` (registered by sword/loop); falls back to the P0 default 100 when unregistered. Read per call so hot-tuning applies on the next write. */;
        _proto.setJianyi = function setJianyi(v) {
          if (!Number.isFinite(v)) return;
          var max = this.ctx.tunables.has('jianyi.max') ? this.ctx.tunables.get('jianyi.max') : JIANYI_MAX_DEFAULT;
          this.jianyiValue = Math.max(0, Math.min(max, v));
        };
        _proto.setCombo = function setCombo(c) {
          if (Number.isFinite(c)) this.comboValue = Math.max(0, Math.floor(c));
        };
        _proto.setJianzhenInfo = function setJianzhenInfo(ink, remaining) {
          if (ink === null || remaining === null) {
            this.inkValue = this.jianzhenRemainingValue = null;
            return;
          }
          if (!Number.isFinite(ink) || !Number.isFinite(remaining)) return;
          this.inkValue = Math.max(0, ink);
          this.jianzhenRemainingValue = Math.max(0, remaining);
        };
        _proto.applyForgedSword = function applyForgedSword(sword) {
          if (!Number.isFinite(sword.level) || !Number.isFinite(sword.W) || !Number.isFinite(sword.Lg) || !Number.isFinite(sword.Cv)) return;
          if (!this.emittingSwordReset) this.forgedSword = {
            k: sword.k,
            level: sword.level,
            W: sword.W,
            Lg: sword.Lg,
            Cv: sword.Cv
          };
        };
        _proto.copyMain = function copyMain(pos, vel) {
          this.mainPos.x = pos.x;
          this.mainPos.y = pos.y;
          this.mainVel.x = vel.x;
          this.mainVel.y = vel.y;
        };
        _proto.updateCharge = function updateCharge(on) {
          if (this.charged === on) return;
          this.charged = on;
          this.ctx.events.emit('sword:fullCharge', {
            on: on
          });
        };
        _proto.whipImpulse = function whipImpulse(dt) {
          var dir = this.bladeDir;
          var x = -dir.y;
          var y = dir.x;
          var outside = {
            x: this.pet.vel.y * this.whip.turnSign,
            y: -this.pet.vel.x * this.whip.turnSign
          };
          if (x * outside.x + y * outside.y < 0) {
            x = -x;
            y = -y;
          }
          var impulse = this.ctx.tunables.get('whip.impulse');
          this.rope.impulse({
            x: x * impulse,
            y: y * impulse
          }, dt);
        };
        _proto.hitMain = function hitMain(before, amount, source) {
          var p = this.ctx.tunables;
          var radius = p.get('sword.bladeRadius');
          var cooldown = p.get('drag.hitCooldown');
          var q = source === 'main_return' ? 1 : speedTier(p, this.vTip);
          var knockback = p.get('drag.knockbackK') * this.W * q;
          var dir = this.bladeDir;
          var half = this.bladeLength / 2;
          var a = {
            x: this.mainPos.x - dir.x * half,
            y: this.mainPos.y - dir.y * half
          };
          var b = {
            x: this.mainPos.x + dir.x * half,
            y: this.mainPos.y + dir.y * half
          };
          this.combat.segment(a, b, radius, amount, source, 'main', cooldown, knockback);
          this.combat.segment(before, this.mainPos, radius, amount, source, 'main', cooldown, knockback);
        };
        _proto.beginMainReturn = function beginMainReturn() {
          this.returnElapsed = 0;
          this.state = 'returning';
          this.rope.setMainAttached(false);
          this.internalReturn = true;
          this.mainVel.x = this.mainVel.y = this.speedValue = 0;
          this.pet.setMode(this.landed, this.emptyHanded);
          this.updateCharge(false);
        };
        _proto.stepMainReturn = function stepMainReturn(dt) {
          var delay = this.ctx.tunables.get('scatter.mainReturnDelay');
          var elapsed = this.returnElapsed;
          this.returnElapsed += dt;
          var flightDt = Math.max(0, this.returnElapsed - delay) - Math.max(0, elapsed - delay);
          if (flightDt <= 1e-8) {
            this.speedValue = 0;
            return;
          }
          var before = _extends({}, this.mainPos);
          var target = this.rope.tip;
          var dx = target.x - before.x;
          var dy = target.y - before.y;
          var distance = Math.hypot(dx, dy);
          var step = this.ctx.tunables.get('scatter.mainReturnSpeed') * flightDt;
          var t = distance <= 1e-9 ? 1 : Math.min(1, step / distance);
          var pos = {
            x: before.x + dx * t,
            y: before.y + dy * t
          };
          this.copyMain(pos, {
            x: (pos.x - before.x) / flightDt,
            y: (pos.y - before.y) / flightDt
          });
          this.speedValue = Math.hypot(this.mainVel.x, this.mainVel.y);
          this.hitMain(before, dragAtTier(this.ctx.tunables, 1, this.W, this.level) * this.ctx.tunables.get('scatter.mainReturnDmgMul'), 'main_return');
          if (t >= 1) this.attachMain();
        };
        _proto.stepLoopReturn = function stepLoopReturn(dt) {
          this.loopReturnElapsed += dt;
          var duration = this.ctx.tunables.get('loop.returnTime');
          var t = duration <= 0 ? 1 : Math.min(1, this.loopReturnElapsed / duration);
          for (var i = 0; i < this.chain.slots.length; i++) {
            var _this$loopReturnFrom$;
            var slot = this.chain.slots[i];
            var from = (_this$loopReturnFrom$ = this.loopReturnFrom[i]) != null ? _this$loopReturnFrom$ : this.pet.pos;
            // Animate the display position; physics nodes remain the actual rope target.
            slot.pos = {
              x: from.x + (slot.pos.x - from.x) * t,
              y: from.y + (slot.pos.y - from.y) * t
            };
            slot.previous = _extends({}, slot.pos);
          }
          if (t >= 1 - 1e-8) {
            this.loopReturning = false;
            this.chain.place(this.rope);
            // Product supplement 3: start this separate immunity clock AFTER the animation.
            this.loopImmuneLeft = this.loopImmune;
            this.loopImmune = 0;
          }
        };
        _createClass(SwordRig, [{
          key: "level",
          get: function get() {
            var _this$forgedSword$lev, _this$forgedSword;
            return (_this$forgedSword$lev = (_this$forgedSword = this.forgedSword) == null ? void 0 : _this$forgedSword.level) != null ? _this$forgedSword$lev : this.ctx.tunables.get('sword.level');
          }
          /** Shared forge/battle look: `swordLook(level)`, not a second table. */
        }, {
          key: "look",
          get: function get() {
            return swordLook(this.level, this.ctx.tunables);
          }
        }, {
          key: "B",
          get: function get() {
            return baseDamage(this.ctx.tunables, this.level);
          }
        }, {
          key: "W",
          get: function get() {
            var _this$forgedSword$W, _this$forgedSword2;
            return (_this$forgedSword$W = (_this$forgedSword2 = this.forgedSword) == null ? void 0 : _this$forgedSword2.W) != null ? _this$forgedSword$W : this.ctx.tunables.get('sword.W');
          }
        }, {
          key: "Lg",
          get: function get() {
            var _this$forgedSword$Lg, _this$forgedSword3;
            return (_this$forgedSword$Lg = (_this$forgedSword3 = this.forgedSword) == null ? void 0 : _this$forgedSword3.Lg) != null ? _this$forgedSword$Lg : this.ctx.tunables.get('sword.Lg');
          }
        }, {
          key: "Cv",
          get: function get() {
            var _this$forgedSword$Cv, _this$forgedSword4;
            return (_this$forgedSword$Cv = (_this$forgedSword4 = this.forgedSword) == null ? void 0 : _this$forgedSword4.Cv) != null ? _this$forgedSword$Cv : this.ctx.tunables.get('sword.Cv');
          }
        }, {
          key: "N",
          get: function get() {
            return this.chain.N;
          }
        }, {
          key: "linkGrades",
          get: function get() {
            return this.chain.linkGrades;
          }
        }, {
          key: "slots",
          get: function get() {
            return this.chain.slots.length;
          }
        }, {
          key: "ropeLength",
          get: function get() {
            return this.rope.length;
          }
        }, {
          key: "mainHeld",
          get: function get() {
            return this.state === 'held';
          }
        }, {
          key: "mainState",
          get: function get() {
            return this.state;
          }
        }, {
          key: "mainVisible",
          get: function get() {
            return this.mainHeld || this.internalReturn;
          }
        }, {
          key: "chainVisible",
          get: function get() {
            return !this.landed && this.chain.enabled;
          }
        }, {
          key: "chainLanded",
          get: function get() {
            return this.landed;
          }
        }, {
          key: "vTip",
          get: function get() {
            var _this$forcedSpeed;
            return (_this$forcedSpeed = this.forcedSpeed) != null ? _this$forcedSpeed : this.speedValue;
          }
        }, {
          key: "fullCharge",
          get: function get() {
            return this.charged;
          }
        }, {
          key: "jianyi",
          get: function get() {
            return this.jianyiValue;
          }
        }, {
          key: "combo",
          get: function get() {
            return this.comboValue;
          }
        }, {
          key: "ink",
          get: function get() {
            return this.landed ? this.inkValue : null;
          }
        }, {
          key: "jianzhenRemaining",
          get: function get() {
            return this.landed ? this.jianzhenRemainingValue : null;
          }
        }, {
          key: "enemyTimeScale",
          get: function get() {
            return this.enemyScale;
          }
        }, {
          key: "petPos",
          get: function get() {
            return this.pet.pos;
          }
        }, {
          key: "petVel",
          get: function get() {
            return this.pet.vel;
          }
        }, {
          key: "petMaxSpeed",
          get: function get() {
            return this.pet.maxSpeed;
          }
        }, {
          key: "bladeLength",
          get: function get() {
            return this.ctx.tunables.get('sword.bladeLenBase') + this.ctx.tunables.get('sword.bladeLenPerLg') * this.Lg;
          }
        }, {
          key: "bladeDir",
          get: function get() {
            var before = this.rope.points[this.rope.points.length - 2];
            if (!before) return {
              x: 0,
              y: -1
            };
            var dx = this.rope.tip.x - before.x;
            var dy = this.rope.tip.y - before.y;
            var len = Math.hypot(dx, dy);
            return len > 1e-9 ? {
              x: dx / len,
              y: dy / len
            } : {
              x: 0,
              y: -1
            };
          }
        }, {
          key: "mode",
          get: function get() {
            return this.landed ? 'jianzhen' : this.state === 'held' ? 'drag' : this.state === 'thrown' || this.state === 'returning' ? 'thrown' : 'empty';
          }
          /**
           * #37 / P0 §6.4: 'empty' spans miss → back in hand: grounded, plus throw's post-miss auto-return
           * ('returning' set via setMainState). Normal throw flight ('thrown') and the P0 §6.3 chain-break
           * main return (internalReturn) are not empty-handed. mode is visual and unchanged.
           */
        }, {
          key: "emptyHanded",
          get: function get() {
            return this.state === 'grounded' || this.state === 'returning' && !this.internalReturn;
          }
        }, {
          key: "ropeSlots",
          get: function get() {
            return this.landed || !this.chain.enabled ? 0 : this.slots;
          }
        }, {
          key: "targetLength",
          get: function get() {
            return ropeLength(this.ctx.tunables, this.ropeSlots, this.Lg);
          }
        }]);
        return SwordRig;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/SwordRigHooks.ts", ['cc'], function () {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "fe0ffi7VSFLxqrQIRmq6D5H", "SwordRigHooks", undefined);
      /** Internal to sword; public cross-module consumers use core's ISwordRigInfo. */
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/SwordView.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './ForgeContract.ts', './ScreenLayout.ts', './BattleSwordLook.ts', './SwordViewData.ts', './HudArt.ts'], function (exports) {
  var _inheritsLoose, cclegacy, _decorator, Color, Graphics, Label, UITransform, view, resources, SpriteFrame, Texture2D, MotionStreak, Sprite, Node, Component, swordLookRows, layoutScreen, battleSwordPaint, forgeSwordPath, SWORD_HIT_GOLD, SWORD_HIT_STEEL, SWORD_ART, SWORD_STAR, isChainHit, SWORD_ART_KEYS, SWORD_FLASH, applyAtlasRect, flashFrameBox, SWORD_TRAIL, SWORD_GLOW, hitStopFrames, hudFillWidth, SWORD_HUD_LAYOUT, hudFillRect, hudDesignToLocal, SWORD_HUD_ART;
  return {
    setters: [function (module) {
      _inheritsLoose = module.inheritsLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
      _decorator = module._decorator;
      Color = module.Color;
      Graphics = module.Graphics;
      Label = module.Label;
      UITransform = module.UITransform;
      view = module.view;
      resources = module.resources;
      SpriteFrame = module.SpriteFrame;
      Texture2D = module.Texture2D;
      MotionStreak = module.MotionStreak;
      Sprite = module.Sprite;
      Node = module.Node;
      Component = module.Component;
    }, function (module) {
      swordLookRows = module.swordLookRows;
    }, function (module) {
      layoutScreen = module.layoutScreen;
    }, function (module) {
      battleSwordPaint = module.battleSwordPaint;
      forgeSwordPath = module.forgeSwordPath;
    }, function (module) {
      SWORD_HIT_GOLD = module.SWORD_HIT_GOLD;
      SWORD_HIT_STEEL = module.SWORD_HIT_STEEL;
      SWORD_ART = module.SWORD_ART;
      SWORD_STAR = module.SWORD_STAR;
      isChainHit = module.isChainHit;
      SWORD_ART_KEYS = module.SWORD_ART_KEYS;
      SWORD_FLASH = module.SWORD_FLASH;
      applyAtlasRect = module.applyAtlasRect;
      flashFrameBox = module.flashFrameBox;
      SWORD_TRAIL = module.SWORD_TRAIL;
      SWORD_GLOW = module.SWORD_GLOW;
      hitStopFrames = module.hitStopFrames;
    }, function (module) {
      hudFillWidth = module.hudFillWidth;
      SWORD_HUD_LAYOUT = module.SWORD_HUD_LAYOUT;
      hudFillRect = module.hudFillRect;
      hudDesignToLocal = module.hudDesignToLocal;
      SWORD_HUD_ART = module.SWORD_HUD_ART;
    }],
    execute: function () {
      exports('mountSwordView', mountSwordView);
      var _dec, _class;
      cclegacy._RF.push({}, "21e9dkzRk9B8L4SjAyLTdrj", "SwordView", undefined);
      var ccclass = _decorator.ccclass;
      var WHITE = new Color(225, 232, 240);
      var BONE = new Color(232, 224, 206);
      var INK = new Color(44, 30, 20);
      var ORANGE = new Color(255, 156, 48);
      var BLUE = new Color(130, 170, 230);
      var CYAN = new Color(100, 235, 235);
      var YELLOW = new Color(255, 225, 100);
      var GOLD = new Color(SWORD_HIT_GOLD.r, SWORD_HIT_GOLD.g, SWORD_HIT_GOLD.b);
      var STEEL = new Color(SWORD_HIT_STEEL.r, SWORD_HIT_STEEL.g, SWORD_HIT_STEEL.b);
      /** Official look sprites already carry their own colour; do not gold-tint them. */
      var ART_WHITE = new Color(255, 255, 255);
      var HP_BG = new Color(40, 32, 28, 220);
      var HP_FILL = new Color(160, 48, 42, 255);
      var HP_FRAME = new Color(92, 70, 48, 255);
      var STACK_COLORS = [new Color(165, 175, 190), new Color(205, 215, 230), WHITE];
      /** All Cocos runtime dependencies and node ownership stay in view/. */
      var SwordView = exports('SwordView', (_dec = ccclass('SwordGreyboxView'), _dec(_class = /*#__PURE__*/function (_Component) {
        _inheritsLoose(SwordView, _Component);
        function SwordView() {
          var _this;
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          _this = _Component.call.apply(_Component, [this].concat(args)) || this;
          _this.rig = null;
          _this.graphics = null;
          _this.healthArt = null;
          _this.hpFill = null;
          _this.health = null;
          _this.hud = null;
          _this.stacks = [];
          _this.damage = [];
          _this.frames = new Map();
          _this.lookFrames = new Map();
          _this.flashFrames = [];
          _this.unsubs = [];
          _this.artReady = false;
          _this.loaded = 0;
          _this.disposed = false;
          _this.main = null;
          _this.glow = null;
          _this.trail = null;
          _this.trailNode = null;
          _this.chain = [];
          _this.loose = [];
          _this.flashes = [];
          return _this;
        }
        var _proto = SwordView.prototype;
        _proto.bind = function bind(rig) {
          var _this$health$node$get,
            _this2 = this;
          this.rig = rig;
          var geometry = child(this.node, 'Geometry', 0, 0);
          this.graphics = geometry.addComponent(Graphics);
          var hudLayer = rig.ctx.layers.get('hud');
          this.healthArt = makeNode(hudLayer, 'PlayerHealthArt');
          makeHudSprite(this.healthArt, 'HpBg', SWORD_HUD_ART.hpBg, HP_BG);
          this.hpFill = makeHudSprite(this.healthArt, 'HpFill', SWORD_HUD_ART.hpFill, HP_FILL);
          makeHudSprite(this.healthArt, 'HpFrame', SWORD_HUD_ART.hpFrame, HP_FRAME);
          this.healthArt.active = false;
          this.health = makeLabel(hudLayer, 'PlayerHealth', 17, 202, 26);
          this.health.horizontalAlign = Label.HorizontalAlign.CENTER;
          this.health.verticalAlign = Label.VerticalAlign.CENTER;
          this.health.overflow = Label.Overflow.SHRINK;
          this.health.color = BONE;
          this.health.enableOutline = true;
          this.health.outlineColor = INK;
          this.health.outlineWidth = 2;
          (_this$health$node$get = this.health.node.getComponent(UITransform)) == null || _this$health$node$get.setAnchorPoint(0.5, 0.5);
          this.health.node.active = false;
          this.hud = makeLabel(rig.ctx.layers.get('debug'), 'SwordTelemetry', 18, 680, 64);
          for (var i = 0; i < 12; i++) this.stacks.push(makeLabel(this.node, "Stack" + i, 14, 70, 24));
          for (var _i = 0; _i < Math.floor(rig.ctx.tunables.get('fx.damageMax')); _i++) {
            this.damage.push(makeLabel(this.node, "Damage" + _i, 16, 190, 26));
          }
          this.unsubs.push(rig.ctx.events.on('enemy:damaged', function (e) {
            return _this2.onDamaged(e);
          }));
          this.main = this.makeSwordSprite('MainSword', SWORD_ART.main, null);
          this.glow = this.makeSwordSprite('MainGlow', SWORD_ART.glow, null);
          this.loadArt();
        };
        _proto.onEnable = function onEnable() {
          var _this$rig;
          (_this$rig = this.rig) == null || _this$rig.attach();
        };
        _proto.onDisable = function onDisable() {
          var _this$rig2;
          (_this$rig2 = this.rig) == null || _this$rig2.detach();
        };
        _proto.onDestroy = function onDestroy() {
          var _this$rig3, _this$healthArt, _this$health, _this$hud;
          this.disposed = true;
          (_this$rig3 = this.rig) == null || _this$rig3.detach();
          (_this$healthArt = this.healthArt) == null || _this$healthArt.destroy();
          (_this$health = this.health) == null || _this$health.node.destroy();
          (_this$hud = this.hud) == null || _this$hud.node.destroy();
          for (var i = 0; i < this.unsubs.length; i++) this.unsubs[i]();
          this.unsubs.length = 0;
          this.rig = null;
        };
        _proto.draw = function draw() {
          var rig = this.rig;
          var g = this.graphics;
          if (!rig || !g || !this.enabledInHierarchy) return;
          var px = rig.ctx.toPx;
          var scale = Math.abs(px({
            x: 1,
            y: 0
          }).x - px({
            x: 0,
            y: 0
          }).x);
          var params = rig.ctx.tunables;
          var charged = rig.fullCharge && params.getBool('fx.fullCharge');
          g.clear();
          g.lineWidth = 1;
          g.strokeColor = BLUE;
          var points = rig.rope.points;
          var first = px(points[0]);
          g.moveTo(first.x, first.y);
          for (var i = 1; i < points.length; i++) {
            var p = px(points[i]);
            g.lineTo(p.x, p.y);
          }
          g.stroke();
          g.fillColor = WHITE;
          var pet = px(rig.petPos);
          if (!rig.pet.damageImmune || Math.floor(rig.ctx.loop.simTime * params.get('fx.petBlinkHz') * 2) % 2 === 0) {
            g.circle(pet.x, pet.y, rig.pet.radius * scale);
            g.fill();
            var speed = Math.hypot(rig.petVel.x, rig.petVel.y);
            var dx = speed > 1e-8 ? rig.petVel.x / speed : 0;
            var dy = speed > 1e-8 ? rig.petVel.y / speed : -1;
            var r = rig.pet.radius * scale;
            g.fillColor = BLUE;
            g.moveTo(pet.x + dx * r, pet.y + dy * r);
            g.lineTo(pet.x - dy * r / 2, pet.y + dx * r / 2);
            g.lineTo(pet.x + dy * r / 2, pet.y - dx * r / 2);
            g.lineTo(pet.x + dx * r, pet.y + dy * r);
            g.fill();
          }
          var dir = rig.bladeDir;
          var mainPx = px(rig.mainPos);
          this.drawMain(rig, g, mainPx, dir, scale, charged);
          this.drawChain(rig, g, scale);
          this.drawFlashes(scale);
          var damageMax = Math.floor(params.get('fx.damageMax'));
          while (this.damage.length < damageMax) this.damage.push(makeLabel(this.node, "Damage" + this.damage.length, 16, 190, 26));
          for (var _i2 = 0; _i2 < this.damage.length; _i2++) {
            var label = this.damage[_i2];
            var hit = rig.combat.labels[_i2];
            label.node.active = hit !== undefined && _i2 < damageMax;
            if (!hit) continue;
            label.string = hit.amount.toFixed(1) + " " + hit.source;
            label.color = hit.source === 'whip' ? YELLOW : hit.source === 'loop' ? CYAN : WHITE;
            var _p = px(hit.pos);
            label.node.setPosition(_p.x, _p.y + (params.get('fx.damageLife') - hit.left) * params.get('fx.damageRise') * scale, 0);
          }
          if (this.health) {
            var showHealth = rig.ctx.services.has('run') === false || rig.ctx.services.get('run').combatActive;
            this.health.node.active = showHealth;
            if (this.healthArt) this.healthArt.active = showHealth;
            if (showHealth) {
              var visible = view.getVisibleSize();
              var hud = layoutScreen(visible.width, visible.height).hud;
              placeHudNode(this.healthArt, SWORD_HUD_LAYOUT.hpBg, visible, hud, 'HpBg');
              placeHudNode(this.healthArt, SWORD_HUD_LAYOUT.hpFrame, visible, hud, 'HpFrame');
              var ratio = rig.pet.maxHp > 0 ? rig.pet.hp / rig.pet.maxHp : 0;
              var fillW = hudFillWidth(SWORD_HUD_LAYOUT.hpFill.width, ratio, SWORD_HUD_LAYOUT.hpFillMin);
              resizeHudFill(this.hpFill, hudFillRect(SWORD_HUD_LAYOUT.hpFill, fillW), visible, hud, HP_FILL);
              var textPos = hudDesignToLocal(SWORD_HUD_LAYOUT.hpText, visible.width, visible.height, hud);
              this.health.node.setPosition(textPos.x, textPos.y, 0);
              this.health.string = "HP " + Math.round(rig.pet.hp) + "/" + Math.round(rig.pet.maxHp);
            }
          }
          if (this.hud) {
            var showHud = debugHudVisible(rig);
            this.hud.node.active = showHud;
            if (showHud) {
              var _visible = view.getVisibleSize();
              this.hud.node.setPosition(-_visible.width / 2 + 12, _visible.height / 2 - 38, 0);
              this.hud.string = "v_tip " + rig.vTip.toFixed(2) + "u/s  N/slots " + rig.N + "/" + rig.slots + "\nL " + rig.ropeLength.toFixed(2) + "u  " + rig.mode + "  \u5251\u610F " + rig.jianyi.toFixed(0) + "  combo " + rig.combo;
              this.hud.color = charged ? ORANGE : WHITE;
            }
          }
        };
        _proto.drawMain = function drawMain(rig, g, main, dir, scale, charged) {
          var params = rig.ctx.tunables;
          var visible = rig.mainVisible;
          var paint = battleSwordPaint(rig.look, SWORD_GLOW.opacity);
          this.assignMainFrame(paint.look.spriteId);
          var art = this.lookFrames.get(paint.look.spriteId);
          if (this.main) this.main.node.active = visible && !!art;
          if (this.glow) this.glow.node.active = visible && paint.glowVisible && !!this.frames.get('glow');
          if (this.trailNode) this.trailNode.active = visible && params.getBool('fx.trail') && !!this.trail;
          if (!visible) return;
          var angle = bladeAngle(dir);
          var tint = new Color(paint.tint.r, paint.tint.g, paint.tint.b);
          if (art && this.main) {
            placeSword(this.main, SWORD_ART.main, main, dir, scale, angle);
            this.main.sprite.color = charged ? ORANGE : ART_WHITE;
            var glowArt = this.frames.get('glow');
            if (glowArt && this.glow && paint.glowVisible) {
              var along = (0.5 - SWORD_ART.main.anchorY) * SWORD_ART.main.displayU * scale;
              var pulse = glowPulse();
              var glowScale = scale * pulse;
              placeSized(this.glow, SWORD_ART.glow, main.x + dir.x * along, main.y + dir.y * along, glowScale, 0);
              var a = charged ? 255 : paint.glowAlpha;
              this.glow.sprite.color = new Color(paint.tint.r, paint.tint.g, paint.tint.b, a);
            }
            if (this.trail && this.trailNode && params.getBool('fx.trail')) {
              var tip = (1 - SWORD_ART.main.anchorY) * SWORD_ART.main.displayU * scale;
              this.trailNode.setPosition(main.x + dir.x * tip, main.y + dir.y * tip, 0);
              this.trail.enabled = true;
            } else if (this.trail) {
              this.trail.enabled = false;
            }
            return;
          }
          g.lineWidth = Math.max(1, scale * 0.025);
          g.strokeColor = charged ? ORANGE : tint;
          var speed = Math.hypot(rig.mainVel.x, rig.mainVel.y);
          if (params.getBool('fx.trail') && speed > 1e-8) {
            var length = rig.vTip * params.get('fx.trailTime') * scale;
            g.moveTo(main.x, main.y);
            g.lineTo(main.x - rig.mainVel.x / speed * length, main.y - rig.mainVel.y / speed * length);
            g.stroke();
          }
          var half = rig.bladeLength * scale / 2;
          var radius = params.get('sword.bladeRadius') * scale;
          g.lineWidth = radius * 2;
          g.moveTo(main.x - dir.x * half, main.y - dir.y * half);
          g.lineTo(main.x + dir.x * half, main.y + dir.y * half);
          g.stroke();
          g.fillColor = charged ? ORANGE : tint;
          for (var _i3 = 0, _arr = [-1, 1]; _i3 < _arr.length; _i3++) {
            var sign = _arr[_i3];
            g.circle(main.x + dir.x * half * sign, main.y + dir.y * half * sign, radius);
            g.fill();
          }
          g.lineWidth = Math.max(1, scale * 0.025);
          if (rig.whip.active && rig.mainHeld) {
            g.strokeColor = WHITE;
            var a0 = Math.atan2(dir.y, dir.x);
            for (var i = 0; i <= 16; i++) {
              var _a = a0 + (i / 16 - 0.5) * params.get('whip.turnDeg') * Math.PI / 180;
              var x = main.x + Math.cos(_a) * rig.bladeLength * scale;
              var y = main.y + Math.sin(_a) * rig.bladeLength * scale;
              if (i === 0) g.moveTo(x, y);else g.lineTo(x, y);
            }
            g.stroke();
          } else if (rig.mainHeld && rig.vTip < params.get('drag.vDead')) {
            g.strokeColor = YELLOW;
            this.sword(g, rig.mainPos, radius, {
              x: -dir.y,
              y: dir.x
            });
          }
        };
        _proto.drawChain = function drawChain(rig, g, scale) {
          var params = rig.ctx.tunables;
          var px = rig.ctx.toPx;
          var chainArt = this.frames.get('chain');
          var show = rig.chainVisible;
          for (var i = 0; i < this.stacks.length; i++) {
            var label = this.stacks[i];
            var slot = rig.chain.slots[i];
            label.node.active = show && slot !== undefined && slot.grades.length > 1;
            if (!slot || !show) {
              if (this.chain[i]) this.chain[i].node.active = false;
              continue;
            }
            var p = px(slot.pos);
            var dir = slotDir(rig, i);
            if (chainArt) {
              var sprite = this.ensureChain(i);
              sprite.node.active = true;
              placeSword(sprite, SWORD_ART.chain, p, dir, scale, bladeAngle(dir));
              var tint = STACK_COLORS[Math.min(STACK_COLORS.length - 1, slot.grades.length - 1)];
              sprite.sprite.color = tint;
            } else {
              g.strokeColor = STACK_COLORS[slot.grades.length - 1];
              g.lineWidth = Math.max(1, scale * 0.025 * slot.grades.length);
              this.link(g, slot.pos, params.get('chain.linkRadius') * scale);
            }
            label.string = "\xD7" + slot.grades.length;
            var _rig$ctx$camera = rig.ctx.camera,
              viewW = _rig$ctx$camera.viewW,
              viewH = _rig$ctx$camera.viewH;
            label.node.setPosition(Math.min(viewW * scale - 70, Math.max(0, p.x + 12)), Math.min(viewH * scale - 12, Math.max(12, p.y + 12)), 0);
          }
          for (var _i4 = this.stacks.length; _i4 < this.chain.length; _i4++) this.chain[_i4].node.active = false;
          for (var _i5 = 0; _i5 < this.loose.length; _i5++) this.loose[_i5].node.active = false;
          for (var _i6 = 0; _i6 < rig.chain.loose.length; _i6++) {
            var sword = rig.chain.loose[_i6];
            var hz = params.get(sword.left <= params.get('fx.scatterFastTime') ? 'fx.scatterFastBlinkHz' : 'fx.scatterBlinkHz');
            if (sword.recovered && Math.floor(sword.left * hz * 2) % 2 === 0) continue;
            var _p2 = px(sword.pos);
            if (chainArt) {
              var _sprite = this.ensureLoose(_i6);
              _sprite.node.active = true;
              placeSword(_sprite, SWORD_ART.chain, _p2, {
                x: 0,
                y: 1
              }, scale, 0);
              _sprite.sprite.color = sword.recovered ? ORANGE : STEEL;
            } else {
              g.strokeColor = sword.recovered ? ORANGE : BLUE;
              var r = params.get('chain.linkRadius') * scale;
              g.lineWidth = 1;
              g.moveTo(_p2.x, _p2.y - r);
              g.lineTo(_p2.x, _p2.y + r);
              g.stroke();
            }
          }
        };
        _proto.drawFlashes = function drawFlashes(scale) {
          var now = Date.now();
          var unit = SWORD_ART.flashAtlas.displayU * scale;
          for (var i = 0; i < this.flashes.length; i++) {
            var burst = this.flashes[i];
            var age = now - burst.born;
            var frame = flashIndex(age);
            var live = frame >= 0 && this.flashFrames[frame];
            burst.flash.node.active = !!live;
            if (live) {
              burst.flash.sprite.spriteFrame = this.flashFrames[frame];
              var pop = frame === 0 ? SWORD_FLASH.pop : 1;
              var size = unit * pop;
              burst.flash.node.setPosition(burst.x, burst.y, 0);
              burst.flash.transform.setContentSize(size, size);
              burst.flash.sprite.color = burst.gold ? GOLD : STEEL;
            }
            var starAge = age;
            var starLive = starAge < SWORD_STAR.fadeMs && !!this.frames.get('starburst');
            burst.star.node.active = starLive;
            if (starLive) {
              var t = Math.min(1, starAge / SWORD_STAR.scaleMs);
              var s = SWORD_STAR.scaleFrom + (SWORD_STAR.scaleTo - SWORD_STAR.scaleFrom) * t;
              var fade = 1 - Math.min(1, starAge / SWORD_STAR.fadeMs);
              burst.star.node.setPosition(burst.x, burst.y, 0);
              burst.star.node.angle = burst.starAngle;
              burst.star.transform.setContentSize(unit * s, unit * s);
              var tint = burst.gold ? GOLD : STEEL;
              burst.star.sprite.color = new Color(tint.r, tint.g, tint.b, Math.round(255 * fade));
            }
          }
        };
        _proto.onDamaged = function onDamaged(e) {
          var rig = this.rig;
          if (!rig || this.disposed) return;
          var px = rig.ctx.toPx(e.pos);
          var gold = !isChainHit(e.source);
          this.spawnFlash(px.x, px.y, gold);
          if (e.source !== 'whip') return;
          this.requestWhipHitstop();
        };
        _proto.spawnFlash = function spawnFlash(x, y, gold) {
          var _this$frames$get;
          if (!this.artReady || this.flashFrames.length === 0) return;
          var burst = null;
          for (var i = 0; i < this.flashes.length; i++) {
            if (!this.flashes[i].flash.node.active && !this.flashes[i].star.node.active) {
              burst = this.flashes[i];
              break;
            }
          }
          if (!burst) {
            burst = {
              flash: this.makeFxSprite('HitFlash'),
              star: this.makeFxSprite('HitStar'),
              born: 0,
              x: 0,
              y: 0,
              gold: true,
              starAngle: 0
            };
            this.flashes.push(burst);
          }
          burst.born = Date.now();
          burst.x = x;
          burst.y = y;
          burst.gold = gold;
          burst.starAngle = Math.random() * 360;
          burst.flash.node.active = true;
          burst.star.node.active = true;
          var star = (_this$frames$get = this.frames.get('starburst')) != null ? _this$frames$get : null;
          if (star) burst.star.sprite.spriteFrame = star;
        };
        _proto.requestWhipHitstop = function requestWhipHitstop() {
          var rig = this.rig;
          if (!rig || !rig.ctx.tunables.getBool('fx.hitstop')) return;
          var sim = rig.ctx.loop.simTime;
          var now = Date.now();
          var ms = rig.ctx.tunables.get('fx.whipHitstopMs');
          var cool = rig.ctx.tunables.get('fx.whipHitstopCooldownMs');
          if (sim === rig.lastWhipHitstopSim) return;
          if (now - rig.lastWhipHitstopReal < cool) return;
          var frames = hitStopFrames(ms);
          if (frames <= 0) return;
          rig.lastWhipHitstopSim = sim;
          rig.lastWhipHitstopReal = now;
          rig.ctx.events.emit('fx:hitstop', {
            frames: frames,
            kind: 'minor'
          });
        };
        _proto.loadArt = function loadArt() {
          this.loadTrail();
          this.loadLookSprites();
          for (var i = 0; i < SWORD_ART_KEYS.length; i++) {
            var key = SWORD_ART_KEYS[i];
            if (key !== 'trail') this.loadFrame(key);
          }
        };
        _proto.loadLookSprites = function loadLookSprites() {
          var rows = this.rig ? swordLookRows(this.rig.ctx.tunables) : swordLookRows();
          for (var i = 0; i < rows.length; i++) this.loadLookFrame(rows[i].spriteId);
        };
        _proto.loadLookFrame = function loadLookFrame(spriteId) {
          var _this3 = this;
          if (this.lookFrames.has(spriteId)) return;
          this.lookFrames.set(spriteId, null);
          var path = forgeSwordPath(spriteId);
          resources.load(path + "/spriteFrame", SpriteFrame, function (error, frame) {
            if (_this3.disposed) return;
            if (error || !frame) {
              _this3.lookFrames.set(spriteId, null);
              console.warn("[sword] failed to load " + path + "; greybox fallback", error);
              return;
            }
            _this3.lookFrames.set(spriteId, frame);
            _this3.assignMainFrame(spriteId);
          });
        };
        _proto.assignMainFrame = function assignMainFrame(spriteId) {
          if (!this.main) return;
          var current = this.rig ? this.rig.look.spriteId : spriteId;
          if (current !== spriteId) return;
          var frame = this.lookFrames.get(spriteId);
          if (frame) this.main.sprite.spriteFrame = frame;
        };
        _proto.loadFrame = function loadFrame(key) {
          var _this4 = this;
          var spec = SWORD_ART[key];
          resources.load(spec.path + "/spriteFrame", SpriteFrame, function (error, frame) {
            if (_this4.disposed) return;
            if (error || !frame) {
              _this4.frames.set(key, null);
              console.warn("[sword] failed to load " + spec.path + "; greybox fallback", error);
            } else {
              _this4.frames.set(key, frame);
              if (key === 'flashAtlas') _this4.sliceFlash(frame);
              if (key === 'glow' && _this4.glow) _this4.glow.sprite.spriteFrame = frame;
            }
            _this4.markLoaded();
          });
        };
        _proto.loadTrail = function loadTrail() {
          var _this5 = this;
          resources.load(SWORD_ART.trail.path + "/texture", Texture2D, function (error, texture) {
            if (_this5.disposed) return;
            _this5.frames.set('trail', null);
            if (error || !texture) {
              console.warn("[sword] failed to load " + SWORD_ART.trail.path + "; greybox fallback", error);
            } else {
              _this5.ensureTrail(texture);
            }
            _this5.markLoaded();
          });
        };
        _proto.markLoaded = function markLoaded() {
          this.loaded += 1;
          if (this.loaded === SWORD_ART_KEYS.length) this.artReady = true;
        };
        _proto.sliceFlash = function sliceFlash(atlas) {
          this.flashFrames.length = 0;
          for (var i = 0; i < SWORD_FLASH.frames; i++) {
            var frame = new SpriteFrame();
            frame.texture = atlas.texture;
            applyAtlasRect(frame, flashFrameBox(i));
            this.flashFrames.push(frame);
          }
        };
        _proto.ensureTrail = function ensureTrail(texture) {
          if (this.trail) {
            this.trail.texture = texture;
            return;
          }
          var node = child(this.node, 'MainTrail', 0, 0);
          var streak = node.addComponent(MotionStreak);
          streak.fadeTime = SWORD_TRAIL.fadeTime;
          streak.minSeg = SWORD_TRAIL.minSeg;
          streak.stroke = SWORD_TRAIL.stroke;
          streak.color = WHITE;
          streak.texture = texture;
          streak.enabled = false;
          this.trail = streak;
          this.trailNode = node;
        };
        _proto.makeSwordSprite = function makeSwordSprite(name, spec, frame) {
          var node = child(this.node, name, spec.anchorX, spec.anchorY);
          var transform = node.getComponent(UITransform) || node.addComponent(UITransform);
          transform.setAnchorPoint(spec.anchorX, spec.anchorY);
          var sprite = node.addComponent(Sprite);
          sprite.sizeMode = Sprite.SizeMode.CUSTOM;
          sprite.type = Sprite.Type.SIMPLE;
          sprite.trim = false;
          sprite.spriteFrame = frame;
          node.active = false;
          return {
            node: node,
            sprite: sprite,
            transform: transform
          };
        };
        _proto.makeFxSprite = function makeFxSprite(name) {
          var node = child(this.node, name, 0.5, 0.5);
          var transform = node.getComponent(UITransform) || node.addComponent(UITransform);
          transform.setAnchorPoint(0.5, 0.5);
          var sprite = node.addComponent(Sprite);
          sprite.sizeMode = Sprite.SizeMode.CUSTOM;
          sprite.type = Sprite.Type.SIMPLE;
          sprite.trim = false;
          node.active = false;
          return {
            node: node,
            sprite: sprite,
            transform: transform
          };
        };
        _proto.ensureChain = function ensureChain(index) {
          var _this$frames$get2;
          var frame = (_this$frames$get2 = this.frames.get('chain')) != null ? _this$frames$get2 : null;
          while (this.chain.length <= index) {
            this.chain.push(this.makeSwordSprite("Chain" + this.chain.length, SWORD_ART.chain, frame));
          }
          return this.chain[index] || this.chain[0];
        };
        _proto.ensureLoose = function ensureLoose(index) {
          var _this$frames$get3;
          var frame = (_this$frames$get3 = this.frames.get('chain')) != null ? _this$frames$get3 : null;
          while (this.loose.length <= index) {
            this.loose.push(this.makeSwordSprite("Loose" + this.loose.length, SWORD_ART.chain, frame));
          }
          return this.loose[index] || this.loose[0];
        };
        _proto.link = function link(g, pos, radius) {
          var rig = this.rig;
          if (!rig) return;
          var p = rig.ctx.toPx(pos);
          g.moveTo(p.x, p.y - radius);
          g.lineTo(p.x + radius, p.y);
          g.lineTo(p.x, p.y + radius);
          g.lineTo(p.x - radius, p.y);
          g.lineTo(p.x, p.y - radius);
          g.stroke();
        };
        _proto.sword = function sword(g, pos, halfLength, vel) {
          var rig = this.rig;
          if (!rig) return;
          var p = rig.ctx.toPx(pos);
          var len = Math.hypot(vel.x, vel.y);
          var x = len > 1e-6 ? vel.x / len : 0;
          var y = len > 1e-6 ? vel.y / len : 1;
          g.moveTo(p.x - x * halfLength, p.y - y * halfLength);
          g.lineTo(p.x + x * halfLength, p.y + y * halfLength);
          g.moveTo(p.x - y * halfLength * 0.5, p.y + x * halfLength * 0.5);
          g.lineTo(p.x + y * halfLength * 0.5, p.y - x * halfLength * 0.5);
          g.stroke();
        };
        return SwordView;
      }(Component)) || _class));
      function debugHudVisible(rig) {
        var ctx = rig.ctx;
        var enabled = typeof DEBUG_TUNING === 'boolean' && DEBUG_TUNING === true || typeof window === 'object' && typeof window.location === 'object' && /(?:^|[?&])debug=1(?:&|$)/.test(window.location.search);
        var toggleOn = ctx.tunables.has('tuning.hud') === false || ctx.tunables.getBool('tuning.hud');
        var combat = ctx.services.has('run') === false || ctx.services.get('run').combatActive;
        return enabled && toggleOn && combat;
      }
      function makeLabel(parent, name, fontSize, width, height) {
        var node = new Node(name);
        node.layer = parent.layer;
        var transform = node.addComponent(UITransform);
        transform.setContentSize(width, height);
        transform.setAnchorPoint(0, 0.5);
        parent.addChild(node);
        var label = node.addComponent(Label);
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 4;
        label.color = WHITE;
        return label;
      }
      function child(parent, name, ax, ay) {
        var node = new Node(name);
        node.layer = parent.layer;
        node.addComponent(UITransform).setAnchorPoint(ax, ay);
        parent.addChild(node);
        return node;
      }
      function makeNode(parent, name) {
        var node = new Node(name);
        node.layer = parent.layer;
        node.addComponent(UITransform);
        parent.addChild(node);
        return node;
      }
      function bladeAngle(dir) {
        return Math.atan2(dir.y, dir.x) * 180 / Math.PI - 90;
      }
      function placeSword(slot, spec, pos, _dir, scale, angle) {
        var h = spec.displayU * scale;
        var w = spec.width / spec.height * h;
        slot.node.setPosition(pos.x, pos.y, 0);
        slot.node.angle = angle;
        slot.transform.setAnchorPoint(spec.anchorX, spec.anchorY);
        slot.transform.setContentSize(w, h);
      }
      function placeSized(slot, spec, x, y, scale, angle) {
        var size = spec.displayU * scale;
        slot.node.setPosition(x, y, 0);
        slot.node.angle = angle;
        slot.transform.setAnchorPoint(spec.anchorX, spec.anchorY);
        slot.transform.setContentSize(size, size);
      }
      function glowPulse() {
        var t = Date.now() / 1000 / SWORD_GLOW.period;
        var wave = 0.5 + 0.5 * Math.sin(t * Math.PI * 2);
        return SWORD_GLOW.pulseMin + (SWORD_GLOW.pulseMax - SWORD_GLOW.pulseMin) * wave;
      }
      function slotDir(rig, index) {
        var points = rig.rope.points;
        var cur = points[index + 1];
        var prev = points[index];
        if (!cur || !prev) return {
          x: 0,
          y: -1
        };
        var dx = cur.x - prev.x;
        var dy = cur.y - prev.y;
        var len = Math.hypot(dx, dy);
        return len > 1e-9 ? {
          x: dx / len,
          y: dy / len
        } : {
          x: 0,
          y: -1
        };
      }
      function flashIndex(ageMs) {
        var t = 0;
        for (var i = 0; i < SWORD_FLASH.frameMs.length; i++) {
          t += SWORD_FLASH.frameMs[i];
          if (ageMs < t) return i;
        }
        return -1;
      }
      function makeHudSprite(parent, name, spec, fallback) {
        var _node$getComponent;
        var node = makeNode(parent, name);
        (_node$getComponent = node.getComponent(UITransform)) == null || _node$getComponent.setContentSize(spec.width, spec.height);
        resources.load(spec.path + "/spriteFrame", SpriteFrame, function (error, frame) {
          var _node$getComponent2;
          if (node.isValid === false) return;
          if (error || !frame) {
            var graphics = node.addComponent(Graphics);
            graphics.rect(-spec.width / 2, -spec.height / 2, spec.width, spec.height);
            graphics.fillColor = fallback;
            graphics.fill();
            return;
          }
          if (spec.slice) {
            frame.insetTop = spec.slice.top;
            frame.insetBottom = spec.slice.bottom;
            frame.insetLeft = spec.slice.left;
            frame.insetRight = spec.slice.right;
          }
          var sprite = node.addComponent(Sprite);
          sprite.spriteFrame = frame;
          sprite.type = spec.slice === null ? Sprite.Type.SIMPLE : Sprite.Type.SLICED;
          sprite.sizeMode = Sprite.SizeMode.CUSTOM;
          (_node$getComponent2 = node.getComponent(UITransform)) == null || _node$getComponent2.setContentSize(spec.width, spec.height);
        });
        return node;
      }
      function placeHudNode(parent, rect, visible, hud, name) {
        var _child$getComponent;
        if (!parent) return;
        var child = parent.getChildByName(name);
        if (!child) return;
        var pos = hudDesignToLocal(rect, visible.width, visible.height, hud);
        child.setPosition(pos.x, pos.y, 0);
        (_child$getComponent = child.getComponent(UITransform)) == null || _child$getComponent.setContentSize(rect.width, rect.height);
      }
      function resizeHudFill(node, rect, visible, hud, fallback) {
        var _node$getComponent3;
        if (!node) return;
        node.active = rect.width > 0;
        if (rect.width <= 0) return;
        var pos = hudDesignToLocal(rect, visible.width, visible.height, hud);
        node.setPosition(pos.x, pos.y, 0);
        (_node$getComponent3 = node.getComponent(UITransform)) == null || _node$getComponent3.setContentSize(rect.width, rect.height);
        var graphics = node.getComponent(Graphics);
        if (graphics) {
          graphics.clear();
          graphics.rect(-rect.width / 2, -rect.height / 2, rect.width, rect.height);
          graphics.fillColor = fallback;
          graphics.fill();
        }
      }
      function mountSwordView(rig) {
        var parent = rig.ctx.layers.get('rig');
        // Pure core consumers can supply only a layer descriptor, without a Cocos scene.
        if (typeof parent.addChild !== 'function') return null;
        var node = new Node('SwordRig');
        node.layer = parent.layer;
        node.addComponent(UITransform).setAnchorPoint(0, 0);
        parent.addChild(node);
        var component = node.addComponent(SwordView);
        component.bind(rig);
        return function () {
          return component.draw();
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/SwordViewData.ts", ['cc'], function (exports) {
  var cclegacy, Rect, Size, Vec2;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
      Rect = module.Rect;
      Size = module.Size;
      Vec2 = module.Vec2;
    }],
    execute: function () {
      exports({
        applyAtlasRect: applyAtlasRect,
        flashFrameBox: flashFrameBox,
        hitStopFrames: hitStopFrames,
        isChainHit: isChainHit,
        jsonRectToCocos: jsonRectToCocos
      });
      cclegacy._RF.push({}, "fde84cUQuBLXL+xk4buSSOF", "SwordViewData", undefined);

      /**
       * Runtime sizes / anchors / frame timings transcribed from
       * docs/ui/batch8/batch8-slices.json. The source JSON stays outside assets/.
       */
      var SWORD_FX_UNIT_PX = exports('SWORD_FX_UNIT_PX', 72);
      function art(name, width, height, anchorX, anchorY, displayU) {
        return {
          path: "fx/sword/" + name,
          width: width,
          height: height,
          anchorX: anchorX,
          anchorY: anchorY,
          displayU: displayU
        };
      }
      var SWORD_ART = exports('SWORD_ART', {
        /** Size / hilt anchor only. Battle loads `forge/<spriteId>` from swordLook. */
        main: art('fx_sword_main', 64, 256, 0.5, 0.113, 1.6),
        chain: art('fx_sword_chain', 32, 128, 0.5, 0.113, 0.9),
        glow: art('fx_sword_main_glow', 128, 128, 0.5, 0.5, 1.4),
        trail: art('fx_sword_main_trail', 256, 32, 0.5, 0.5, 0),
        flashAtlas: art('fx_hit_flash_atlas', 512, 256, 0.5, 0.5, 1),
        starburst: art('fx_hit_starburst', 128, 128, 0.5, 0.5, 1)
      });
      /** FX sheets the view still loads. Main blade art comes from `swordLook.spriteId`. */
      var SWORD_ART_KEYS = exports('SWORD_ART_KEYS', ['chain', 'glow', 'trail', 'flashAtlas', 'starburst']);

      /**
       * Glow ring: opacity and pulse only (no additive blend in 3.8). Tint comes
       * from `swordLook.bladeTint`; the ring is hidden while look.glow is 0.
       */
      var SWORD_GLOW = exports('SWORD_GLOW', {
        opacity: 235,
        pulseMin: 0.95,
        pulseMax: 1.12,
        period: 0.8
      });

      /** MotionStreak: fadeTime 0.18s, minSeg 2, stroke 26px. */
      var SWORD_TRAIL = exports('SWORD_TRAIL', {
        fadeTime: 0.18,
        minSeg: 2,
        stroke: 26
      });

      /** Hit flash atlas: 6 frames, 128×128, row-major from the top-left of 512×256. */
      var SWORD_FLASH = exports('SWORD_FLASH', {
        atlasW: 512,
        atlasH: 256,
        frameW: 128,
        frameH: 128,
        frames: 6,
        cols: 4,
        frameMs: [33, 33, 33, 40, 50, 60],
        pop: 1.2
      });

      /** Starburst: scale 0.4→1.3 in 120ms, fade 200ms. */
      var SWORD_STAR = exports('SWORD_STAR', {
        scaleFrom: 0.4,
        scaleTo: 1.3,
        scaleMs: 120,
        fadeMs: 200
      });

      /**
       * Whip-hit presentation defaults. Registered as `fx.whipHitstopMs` /
       * `fx.whipHitstopCooldownMs`. Same simulation frame fires once; 200ms cooldown.
       */
      var SWORD_HITSTOP = exports('SWORD_HITSTOP', {
        hitStopMs: 60,
        cooldownMs: 200
      });
      var SWORD_HIT_GOLD = exports('SWORD_HIT_GOLD', {
        r: 242,
        g: 197,
        b: 61
      });
      var SWORD_HIT_STEEL = exports('SWORD_HIT_STEEL', {
        r: 210,
        g: 214,
        b: 220
      });

      /** Atlas y in JSON is top-left; Cocos texture rects are bottom-left. */
      function jsonRectToCocos(rect, atlasH) {
        return {
          x: rect.x,
          y: atlasH - rect.y - rect.h,
          w: rect.w,
          h: rect.h
        };
      }
      function flashFrameBox(index) {
        var col = index % SWORD_FLASH.cols;
        var row = Math.floor(index / SWORD_FLASH.cols);
        return jsonRectToCocos({
          x: col * SWORD_FLASH.frameW,
          y: row * SWORD_FLASH.frameH,
          w: SWORD_FLASH.frameW,
          h: SWORD_FLASH.frameH
        }, SWORD_FLASH.atlasH);
      }

      /**
       * Atlas SpriteFrame.originalSize defaults to the whole sheet (e.g. 512×256);
       * that draws a 128×128 cell as a sliver. Reset originalSize / offset to the rect.
       */
      function applyAtlasRect(frame, box) {
        frame.rect = new Rect(box.x, box.y, box.w, box.h);
        frame.originalSize = new Size(box.w, box.h);
        frame.offset = new Vec2(0, 0);
        frame.packable = false;
      }
      function hitStopFrames(ms) {
        if (!(ms > 0)) return 0;
        return Math.max(1, Math.round(ms * 60 / 1000));
      }
      function isChainHit(source) {
        return source.indexOf('link_') === 0;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/SystemOrder.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "34877iqKttPza4MBVHB/9Du", "SystemOrder", undefined);
      /**
       * Fixed-step system order. Lower runs first.
       * Gameplay modules use the named slots from the P0 spec.
       * `StepProbe` and `Session` are core bookkeeping, not module slots.
       */
      var SystemOrder = exports('SystemOrder', {
        /** Counts simulated steps so frame-rate independence can be checked. */
        StepProbe: 50,
        /** Read touch, update InputFrame and history. */
        Input: 100,
        /** Pet movement. */
        Pet: 200,
        /** Core: camera follows the pet before anything reads the view. */
        Camera: 250,
        /** Enemy AI, movement (times enemyTimeScale), contact damage. */
        Enemy: 300,
        /** Rope, drag, whip, chain, throw, sword array. */
        Sword: 400,
        /** Deaths, drops, spawn director. */
        EnemyResolve: 500,
        /** Run state machine: wave clock, forge door, phase changes. Sees this step's deaths. */
        Run: 600,
        /** Core: end the session when the director clock reaches session.length. */
        Session: 800,
        /** Telemetry aggregation and HUD data. */
        Tuning: 900
      });
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/Telemetry.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './events.ts', './Hud.ts', './Storage.ts', './TuningParams.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, _extends, _createClass, cclegacy, GameEvent, readHud, isRecord, P0_RULES, TIME_EPSILON;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _extends = module.extends;
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      GameEvent = module.GameEvent;
    }, function (module) {
      readHud = module.readHud;
    }, function (module) {
      isRecord = module.isRecord;
    }, function (module) {
      P0_RULES = module.P0_RULES;
      TIME_EPSILON = module.TIME_EPSILON;
    }],
    execute: function () {
      exports({
        emptyDamage: emptyDamage,
        groupedDamage: groupedDamage,
        percentile: percentile
      });
      cclegacy._RF.push({}, "fc7a1Q4U/9NT59OzrDPJL7B", "Telemetry", undefined);

      // P0 未定义，自选默认值: local storage namespace.
      var STORAGE_KEY = 'yuedie.tuning.telemetry.v1';
      var DAMAGE_SOURCES = exports('DAMAGE_SOURCES', ['drag', 'whip', 'link_auto', 'link_contact', 'throw_out', 'throw_back', 'main_return', 'loop', 'claw']);
      var DAMAGE_GROUPS = exports('DAMAGE_GROUPS', ['拖剑', '鞭响', '链剑', '飞剑', '剑阵', '其他']);

      /** P0 §9.2 names six categories.
       * P0 未定义，自选默认值: main_return and claw map to the remaining "other" category.
       */
      function groupedDamage(d) {
        return [d.drag, d.whip, d.link_auto + d.link_contact, d.throw_out + d.throw_back, d.loop, d.main_return + d.claw];
      }
      function emptyDamage() {
        return {
          drag: 0,
          whip: 0,
          link_auto: 0,
          link_contact: 0,
          throw_out: 0,
          throw_back: 0,
          main_return: 0,
          loop: 0,
          claw: 0
        };
      }

      /** P0 未定义，自选默认值: nearest-rank quantile, null for no samples. */
      function percentile(values, fraction) {
        if (values.length === 0) return null;
        var sorted = values.slice().sort(function (a, b) {
          return a - b;
        });
        return sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)];
      }
      var EVENT_TYPES = {
        'tuning:changed': 'param_change',
        'sword:whip': 'whip',
        'jianzhen:loop': 'loop_closed',
        'jianzhen:rejectedLoop': 'loop_rejected',
        'jianzhen:start': 'jianzhen_start',
        'jianzhen:end': 'jianzhen_end',
        'jianzhen:hit': 'jianzhen_hit',
        'throw:start': 'throw_start',
        'throw:cancel': 'throw_cancel',
        'throw:catch': 'catch',
        'throw:miss': 'miss',
        'chain:pickup': 'chain_pickup',
        'chain:break': 'chain_break',
        'chain:scatterExpired': 'chain_scatter_expired',
        'player:damaged': 'player_damaged'
      };
      var Telemetry = exports('Telemetry', /*#__PURE__*/function () {
        function Telemetry(ctx, store) {
          this.store = void 0;
          this.ctx = void 0;
          this.archives = [];
          this.run = null;
          this.resultRecent = emptyDamage();
          this.resultLines = null;
          this.unsubs = [];
          this.debugNext = false;
          this.normalNext = false;
          this.started = false;
          this.wallTime = 0;
          this.frameHistory = [];
          this.frameCount = 0;
          this.frameSeconds = 0;
          this.result = null;
          this.ctx = ctx;
          this.store = store;
          var saved = store.read(STORAGE_KEY);
          if (!Array.isArray(saved)) return;
          for (var _iterator = _createForOfIteratorHelperLoose(saved), _step; !(_step = _iterator()).done;) {
            var lines = _step.value;
            if (!Array.isArray(lines)) continue;
            var valid = [];
            for (var _iterator2 = _createForOfIteratorHelperLoose(lines), _step2; !(_step2 = _iterator2()).done;) {
              var line = _step2.value;
              if (typeof line !== 'string') continue;
              try {
                var row = JSON.parse(line);
                if (isRecord(row) && row.v === 1 && typeof row.type === 'string' && typeof row.sid === 'string' && typeof row.t === 'number' && typeof row.ph === 'string') valid.push(line);else store.error = '日志格式不符合 P0 §10，已跳过（旧草稿格式不自动转换）';
              } catch (_unused) {
                store.error = '部分日志损坏，已跳过';
              }
            }
            if (valid.length > 0) this.archives.push(valid);
          }
          this.archives = this.archives.slice(-P0_RULES.retainedSessions);
        }
        var _proto = Telemetry.prototype;
        _proto.attach = function attach() {
          var _this = this;
          if (this.unsubs.length > 0) return;
          var events = this.ctx.events;
          this.unsubs.push(events.on('session:start', function (p) {
            return _this.begin(p);
          }));
          this.unsubs.push(events.on('session:end', function (p) {
            var _this$run;
            if (((_this$run = _this.run) == null ? void 0 : _this$run.summary.sid) === p.sid) _this.finish(p.reason, p.duration);
          }));
          this.unsubs.push(events.on('enemy:damaged', function (p) {
            var r = _this.run;
            if (!r) return;
            r.summary.damage[p.source] += p.amount;
            r.summary.totalDamage += p.amount;
            r.bucket[p.source] += p.amount;
            r.bucketTotal += p.amount;
            r.recent.push({
              t: _this.ctx.loop.simTime,
              source: p.source,
              amount: p.amount
            });
            _this.record('enemy:damaged', p);
          }));
          this.unsubs.push(events.on('enemy:died', function (p) {
            if (_this.run) {
              _this.run.summary.kills += 1;
              _this.run.bucketKills[p.source] += 1;
            }
            _this.record('enemy:died', p);
          }));
          this.unsubs.push(events.on('debug:command', function (p) {
            var _this$run2;
            _this.record('debug:command', p);
            if (p.cmd === 'restart' && !((_this$run2 = _this.run) != null && _this$run2.summary.debugRestart)) _this.debugNext = true;
          }));
          // Register metrics before generic logging; core may synchronously end the
          // session while dispatching player:died, so death context comes from damage.
          this.unsubs.push(events.on('player:damaged', function (p) {
            if (_this.run) _this.run.lastDamage = {
              byKind: p.byKind,
              state: p.state
            };
          }));
          this.unsubs.push(events.on('sword:whip', function () {
            if (_this.run && _this.run.summary.firstWhipTime === null) _this.run.summary.firstWhipTime = _this.ctx.loop.simTime;
          }));
          this.unsubs.push(events.on('chain:changed', function (p) {
            if (_this.run) _this.run.summary.maxN = Math.max(_this.run.summary.maxN, p.N);
          }));
          this.unsubs.push(events.on('chain:pickup', function (p) {
            if (!_this.run) return;
            _this.run.summary.maxN = Math.max(_this.run.summary.maxN, p.N);
            if (p.recovered) _this.run.summary.recoveredSwords += 1;
          }));
          this.unsubs.push(events.on('chain:break', function () {
            if (_this.run) _this.run.summary.chainBreaks += 1;
          }));
          this.unsubs.push(events.on('chain:scatterExpired', function (p) {
            if (_this.run) _this.run.summary.expiredSwords += p.count;
          }));
          this.unsubs.push(events.on('throw:start', function (p) {
            if (!_this.run) return;
            _this.run.summary.throwAttempts += 1;
            if (p.joyMag < P0_RULES.throwJoyMin || p.magDrop300 > P0_RULES.throwDropMax) _this.run.summary.suspiciousThrows += 1;
          }));
          this.unsubs.push(events.on('throw:cancel', function () {
            if (!_this.run) return;
            _this.run.summary.throwAttempts += 1;
            _this.run.summary.throwCancels += 1;
          }));
          this.unsubs.push(events.on('throw:catch', function (p) {
            if (!_this.run) return;
            if (p.kind === 'perfect') _this.run.summary.perfectCatches += 1;else _this.run.summary.normalCatches += 1;
          }));
          this.unsubs.push(events.on('throw:miss', function () {
            if (_this.run) _this.run.summary.misses += 1;
          }));
          this.unsubs.push(events.on('jianzhen:start', function (p) {
            if (!_this.run) return;
            _this.run.summary.jianzhenCount += 1;
            _this.run.summary.maxN = Math.max(_this.run.summary.maxN, p.N);
            _this.run.arrayClosed = false;
            // P0 §11: upstream counts enemies within 4u; fewer than 3 is empty.
            _this.run.arrayEmpty = p.enemiesNear < 3;
            if (_this.run.arrayEmpty) _this.run.summary.emptyStarts += 1;
          }));
          this.unsubs.push(events.on('jianzhen:loop', function (p) {
            if (!_this.run) return;
            _this.run.summary.loops.push({
              area: p.area,
              n: p.n
            });
            if (!_this.run.arrayClosed) _this.run.summary.closedJianzhen += 1;
            _this.run.arrayClosed = true;
          }));
          this.unsubs.push(events.on('jianzhen:hit', function () {
            if (_this.run) _this.run.summary.jianzhenHits += 1;
          }));
          this.unsubs.push(events.on('jianzhen:end', function (p) {
            if (!_this.run) return;
            if (p.emptyStart !== _this.run.arrayEmpty) _this.run.summary.emptyStarts += p.emptyStart ? 1 : -1;
          }));
          var _loop = function _loop() {
            var key = _arr[_i];
            var name = GameEvent[key];
            if (name === 'session:start' || name === 'session:end' || name === 'enemy:damaged' || name === 'enemy:died' || name === 'debug:command') return 1; // continue
            _this.unsubs.push(events.on(name, function (p) {
              var _EVENT_TYPES$name;
              _this.record((_EVENT_TYPES$name = EVENT_TYPES[name]) != null ? _EVENT_TYPES$name : name, p);
            }));
          };
          for (var _i = 0, _arr = Object.keys(GameEvent); _i < _arr.length; _i++) {
            if (_loop()) continue;
          }
        };
        _proto.detach = function detach() {
          this.flush();
          for (var _iterator3 = _createForOfIteratorHelperLoose(this.unsubs), _step3; !(_step3 = _iterator3()).done;) {
            var off = _step3.value;
            off();
          }
          this.unsubs = [];
        }

        /** Cocos lifecycle supplies real render dt, including hit-stop frames. */;
        _proto.frame = function frame(dt) {
          var _this2 = this;
          if (!Number.isFinite(dt) || dt <= 0 || !this.run) return;
          this.wallTime += dt;
          this.frameCount += 1;
          this.frameSeconds += dt;
          this.frameHistory.push({
            t: this.wallTime,
            dt: dt
          });
          this.frameHistory = this.frameHistory.filter(function (f) {
            return f.t > _this2.wallTime - P0_RULES.fpsWindow;
          });
          this.run.frames.push(dt);
        }

        // P0 未定义，自选默认值: average = frames / seconds; minimum = 1 / longest frame.
        ;

        _proto.fps = function fps() {
          return {
            fpsAvg: this.frameSeconds > 0 ? this.frameCount / this.frameSeconds : null,
            fpsMin: this.frameHistory.length ? 1 / Math.max.apply(null, this.frameHistory.map(function (f) {
              return f.dt;
            })) : null
          };
        }

        /** P0 未定义，自选默认值: HUD percentiles use all fixed-step samples in the current session. */;
        _proto.vtipPercentiles = function vtipPercentiles() {
          var _this$run$sessionVTip, _this$run3;
          var values = (_this$run$sessionVTip = (_this$run3 = this.run) == null ? void 0 : _this$run3.sessionVTips) != null ? _this$run$sessionVTip : [];
          return {
            p50: percentile(values, 0.5),
            p90: percentile(values, 0.9)
          };
        };
        _proto.fixedUpdate = function fixedUpdate(dt) {
          var r = this.run;
          if (!r) return;
          r.elapsed = Math.max(r.elapsed, this.ctx.loop.simTime + dt);
          var hud = readHud(this.ctx);
          if (hud.vTip !== null) {
            r.vTips.push(hud.vTip);
            r.sessionVTips.push(hud.vTip);
          }
          if (hud.N !== null) r.summary.maxN = Math.max(r.summary.maxN, hud.N);
          if (r.elapsed - r.bucketStart >= P0_RULES.damagePeriod - TIME_EPSILON) this.flushBucket(r.elapsed);
          if (r.elapsed - r.sampleStart >= P0_RULES.samplePeriod - TIME_EPSILON) {
            this.append('vtip_10s', r.elapsed, {
              p50: percentile(r.vTips, 0.5),
              p90: percentile(r.vTips, 0.9),
              max: r.vTips.length ? Math.max.apply(null, r.vTips) : null
            });
            var seconds = r.frames.reduce(function (sum, d) {
              return sum + d;
            }, 0);
            this.append('perf_10s', r.elapsed, {
              fpsAvg: seconds > 0 ? r.frames.length / seconds : null,
              fpsMin: r.frames.length ? 1 / Math.max.apply(null, r.frames) : null,
              alive: hud.alive,
              N: hud.N
            });
            r.vTips = [];
            r.frames = [];
            r.sampleStart = r.elapsed;
          }
          this.pruneRecent();
        }

        /** P0 §10: only completed runs are persisted; active evidence stays in memory. */;
        _proto.flush = function flush() {
          this.store.write(STORAGE_KEY, this.archives);
        };
        _proto.exportJsonLines = function exportJsonLines() {
          var lines = [];
          for (var _iterator4 = _createForOfIteratorHelperLoose(this.archives), _step4; !(_step4 = _iterator4()).done;) {
            var archive = _step4.value;
            for (var _iterator6 = _createForOfIteratorHelperLoose(archive), _step6; !(_step6 = _iterator6()).done;) {
              var _line = _step6.value;
              lines.push(_line);
            }
          }
          if (this.run) {
            for (var _iterator5 = _createForOfIteratorHelperLoose(this.run.lines), _step5; !(_step5 = _iterator5()).done;) {
              var line = _step5.value;
              lines.push(line);
            }
          }
          return lines.length > 0 ? lines.join('\n') + '\n' : '';
        };
        _proto.clear = function clear() {
          // P0 未定义，自选默认值: clearing during a run stops logging until next start.
          // Do not create a partial, inconsistent run. Clearing an active run also
          // stops its recording until the next real session:start.
          this.archives = [];
          this.run = null;
          this.result = null;
          this.resultLines = null;
          this.resultRecent = emptyDamage();
          this.flush();
        };
        _proto.resultChoice = function resultChoice(choice) {
          if (!this.result || !this.resultLines) return;
          this.resultLines.push(this.line('result_choice', this.result.duration, {
            choice: choice
          }, this.result));
          this.flush();
        };
        _proto.damage = function damage(recent) {
          var _ref, _this$run$summary$dam, _this$run4, _this$result;
          if (recent === void 0) {
            recent = false;
          }
          if (!recent) return _extends({}, (_ref = (_this$run$summary$dam = (_this$run4 = this.run) == null ? void 0 : _this$run4.summary.damage) != null ? _this$run$summary$dam : (_this$result = this.result) == null ? void 0 : _this$result.damage) != null ? _ref : emptyDamage());
          if (!this.run) return _extends({}, this.resultRecent);
          this.pruneRecent();
          var damage = emptyDamage();
          for (var _iterator7 = _createForOfIteratorHelperLoose((_this$run$recent = (_this$run5 = this.run) == null ? void 0 : _this$run5.recent) != null ? _this$run$recent : []), _step7; !(_step7 = _iterator7()).done;) {
            var _this$run$recent, _this$run5;
            var hit = _step7.value;
            damage[hit.source] += hit.amount;
          }
          return damage;
        };
        _proto.expectDebugRestart = function expectDebugRestart() {
          this.debugNext = true;
          this.normalNext = false;
        };
        _proto.expectNormalRetry = function expectNormalRetry() {
          this.normalNext = true;
          this.debugNext = false;
        };
        _proto.totals = function totals() {
          var total = {
            sessions: 0,
            damage: 0,
            kills: 0
          };
          for (var _iterator8 = _createForOfIteratorHelperLoose(this.archives), _step8; !(_step8 = _iterator8()).done;) {
            var lines = _step8.value;
            for (var _iterator9 = _createForOfIteratorHelperLoose(lines), _step9; !(_step9 = _iterator9()).done;) {
              var line = _step9.value;
              var row = JSON.parse(line);
              if (!isRecord(row) || row.type !== 'session_end' || !isRecord(row.summary)) continue;
              var s = row.summary;
              if (s.eligible !== true || s.debugRestart !== false || typeof s.totalDamage !== 'number' || typeof s.kills !== 'number') continue;
              total.sessions += 1;
              total.damage += s.totalDamage;
              total.kills += s.kills;
            }
          }
          return total;
        };
        _proto.begin = function begin(p) {
          var _readHud$N;
          var debugRestart = this.debugNext || this.started && !this.normalNext;
          if (this.run) this.finish('restart', this.run.elapsed);
          this.run = {
            summary: {
              sid: p.sid,
              seed: this.ctx.session.seed,
              paramsHash: p.paramsHash,
              debugRestart: debugRestart,
              eligible: false,
              reason: '',
              duration: 0,
              damage: emptyDamage(),
              shares: emptyDamage(),
              totalDamage: 0,
              kills: 0,
              counts: {},
              loops: [],
              jianzhenCount: 0,
              closedJianzhen: 0,
              closedRate: 0,
              emptyStarts: 0,
              emptyRate: 0,
              jianzhenHits: 0,
              throwAttempts: 0,
              throwCancels: 0,
              suspiciousThrows: 0,
              perfectCatches: 0,
              normalCatches: 0,
              misses: 0,
              mistakenThrowRate: 0,
              chainBreaks: 0,
              recoveredSwords: 0,
              expiredSwords: 0,
              maxN: (_readHud$N = readHud(this.ctx).N) != null ? _readHud$N : 0,
              firstWhipTime: null,
              death: null
            },
            lines: [],
            bucket: emptyDamage(),
            bucketKills: emptyDamage(),
            bucketTotal: 0,
            bucketStart: 0,
            elapsed: 0,
            sampleStart: 0,
            vTips: [],
            sessionVTips: [],
            frames: [],
            arrayClosed: false,
            arrayEmpty: false,
            lastDamage: null,
            recent: []
          };
          this.debugNext = false;
          this.normalNext = false;
          this.started = true;
          this.result = null;
          this.resultLines = null;
          this.resultRecent = emptyDamage();
          this.frameCount = 0;
          this.frameSeconds = 0;
          this.wallTime = 0;
          this.frameHistory = [];
          this.record('session_start', {
            seed: this.ctx.session.seed,
            params: this.ctx.tunables.snapshot(),
            screen: typeof window === 'undefined' ? {
              w: null,
              h: null,
              dpr: null
            } : {
              w: window.innerWidth,
              h: window.innerHeight,
              dpr: window.devicePixelRatio
            },
            ua: typeof navigator === 'undefined' ? '' : navigator.userAgent
          });
        };
        _proto.record = function record(type, data) {
          var _this$run$summary$cou;
          if (!this.run) return;
          this.run.elapsed = Math.max(this.run.elapsed, this.ctx.loop.simTime);
          this.run.summary.counts[type] = ((_this$run$summary$cou = this.run.summary.counts[type]) != null ? _this$run$summary$cou : 0) + 1;
          this.append(type, this.run.elapsed, data);
        };
        _proto.line = function line(type, time, data, s) {
          return JSON.stringify(_extends({}, data, {
            v: 1,
            sid: s.sid,
            t: Number(time.toFixed(P0_RULES.timeDigits)),
            type: type,
            ph: this.ctx.tunables.hash(),
            debugRestart: s.debugRestart
          }));
        };
        _proto.append = function append(type, time, data) {
          if (this.run) this.run.lines.push(this.line(type, time, data, this.run.summary));
        }
        // P0 未定义，自选默认值: recent interval is (t - 30, t], modulo TIME_EPSILON.
        ;

        _proto.pruneRecent = function pruneRecent() {
          var _this3 = this;
          if (this.run) this.run.recent = this.run.recent.filter(function (hit) {
            return hit.t > _this3.runElapsed() - P0_RULES.damageWindow + TIME_EPSILON;
          });
        };
        _proto.runElapsed = function runElapsed() {
          var _this$run$elapsed, _this$run6;
          return Math.max((_this$run$elapsed = (_this$run6 = this.run) == null ? void 0 : _this$run6.elapsed) != null ? _this$run$elapsed : 0, this.ctx.loop.simTime);
        };
        _proto.flushBucket = function flushBucket(end) {
          var r = this.run;
          if (!r) return;
          if (end > r.bucketStart + TIME_EPSILON || r.bucketTotal !== 0) this.append('dmg_1s', end, {
            from: r.bucketStart,
            to: end,
            duration: end - r.bucketStart,
            bySource: r.bucket,
            killsBySource: r.bucketKills,
            totalDamage: r.bucketTotal
          });
          r.bucket = emptyDamage();
          r.bucketKills = emptyDamage();
          r.bucketTotal = 0;
          r.bucketStart = end;
        };
        _proto.finish = function finish(reason, duration) {
          var r = this.run;
          if (!r) return;
          this.flushBucket(Math.max(duration, r.elapsed));
          var s = r.summary;
          s.duration = duration;
          s.reason = reason;
          s.eligible = !s.debugRestart && reason !== 'restart';
          for (var _i2 = 0, _DAMAGE_SOURCES = DAMAGE_SOURCES; _i2 < _DAMAGE_SOURCES.length; _i2++) {
            var source = _DAMAGE_SOURCES[_i2];
            s.shares[source] = s.totalDamage > 0 ? s.damage[source] / s.totalDamage : 0;
          }
          // P0 §10 / GDD Appendix B: attempts include cancelled and completed throws.
          // P0 未定义，自选默认值: a zero denominator yields 0 for all rates.
          s.mistakenThrowRate = s.throwAttempts > 0 ? (s.throwCancels + s.suspiciousThrows) / s.throwAttempts : 0;
          s.closedRate = s.jianzhenCount > 0 ? s.closedJianzhen / s.jianzhenCount : 0;
          s.emptyRate = s.jianzhenCount > 0 ? s.emptyStarts / s.jianzhenCount : 0;
          s.death = reason === 'died' ? r.lastDamage : null;
          this.append('session_end', duration, {
            reason: reason,
            duration: duration,
            summary: s
          });
          this.archives.push(r.lines);
          this.archives = this.archives.slice(-P0_RULES.retainedSessions);
          this.resultRecent = this.damage(true);
          this.result = reason === 'restart' ? null : s;
          this.resultLines = reason === 'restart' ? null : r.lines;
          this.run = null;
          this.flush();
        };
        _createClass(Telemetry, [{
          key: "debugRestart",
          get: function get() {
            var _ref2, _this$run$summary$deb, _this$run7, _this$result2;
            return (_ref2 = (_this$run$summary$deb = (_this$run7 = this.run) == null ? void 0 : _this$run7.summary.debugRestart) != null ? _this$run$summary$deb : (_this$result2 = this.result) == null ? void 0 : _this$result2.debugRestart) != null ? _ref2 : false;
          }
        }]);
        return Telemetry;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/TerrainGround.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './CoreBootstrap.ts', './TerrainParams.ts'], function (exports) {
  var _applyDecoratedDescriptor, _inheritsLoose, _initializerDefineProperty, _assertThisInitialized, cclegacy, _decorator, Material, Vec4, Texture2D, SpriteFrame, Node, UITransform, Sprite, Component, CoreBootstrap, TERRAIN_PARAMS, terrainUniforms;
  return {
    setters: [function (module) {
      _applyDecoratedDescriptor = module.applyDecoratedDescriptor;
      _inheritsLoose = module.inheritsLoose;
      _initializerDefineProperty = module.initializerDefineProperty;
      _assertThisInitialized = module.assertThisInitialized;
    }, function (module) {
      cclegacy = module.cclegacy;
      _decorator = module._decorator;
      Material = module.Material;
      Vec4 = module.Vec4;
      Texture2D = module.Texture2D;
      SpriteFrame = module.SpriteFrame;
      Node = module.Node;
      UITransform = module.UITransform;
      Sprite = module.Sprite;
      Component = module.Component;
    }, function (module) {
      CoreBootstrap = module.CoreBootstrap;
    }, function (module) {
      TERRAIN_PARAMS = module.TERRAIN_PARAMS;
      terrainUniforms = module.terrainUniforms;
    }],
    execute: function () {
      var _dec, _dec2, _class, _class2, _descriptor;
      cclegacy._RF.push({}, "2efa1/DECpERoW8Fv8j8QAK", "TerrainGround", undefined);
      var ccclass = _decorator.ccclass,
        property = _decorator.property;

      /**
       * Seamless ground (UI R9 / R10, issue #70): one map-sized sprite drawn with
       * terrain-blend.effect, which mixes the six turf textures by the mask_w0123 /
       * mask_w45 weights. It sits above the greybox map in the `arena` layer and
       * follows the camera through `CoreBootstrap.groundBlend`.
       * Attach next to CoreBootstrap on the Canvas of the battle scene.
       */
      var TerrainGround = exports('TerrainGround', (_dec = ccclass('TerrainGround'), _dec2 = property(Material), _dec(_class = (_class2 = /*#__PURE__*/function (_Component) {
        _inheritsLoose(TerrainGround, _Component);
        function TerrainGround() {
          var _this;
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          _this = _Component.call.apply(_Component, [this].concat(args)) || this;
          _initializerDefineProperty(_this, "material", _descriptor, _assertThisInitialized(_this));
          _this.bootstrap = null;
          _this.ground = null;
          _this.transform = null;
          _this.frame = null;
          _this.runtimeMaterial = null;
          _this.mapW = 0;
          _this.mapH = 0;
          _this.uniformKey = '';
          _this.tileParams = new Vec4();
          _this.mapParams = new Vec4();
          return _this;
        }
        var _proto = TerrainGround.prototype;
        _proto.onLoad = function onLoad() {
          var _bootstrap$ctx;
          var bootstrap = this.getComponent(CoreBootstrap);
          var ctx = bootstrap == null ? void 0 : bootstrap.ctx;
          if (!bootstrap || !ctx) {
            console.warn('[TerrainGround] needs an initialised CoreBootstrap on the same node');
            return;
          }
          if (!this.material) {
            console.warn('[TerrainGround] material not assigned; keeping the greybox map');
            return;
          }
          if (!this.build(ctx, this.material)) return;
          (_bootstrap$ctx = bootstrap.ctx) == null || _bootstrap$ctx.tunables.define(TERRAIN_PARAMS);
          this.bootstrap = bootstrap;
          this.mapW = ctx.arena.width;
          this.mapH = ctx.arena.height;
          bootstrap.groundBlend = this;
        };
        _proto.onDisable = function onDisable() {
          if (this.ground) this.ground.active = false;
        };
        _proto.onDestroy = function onDestroy() {
          var _this$frame, _this$runtimeMaterial;
          if (this.bootstrap && this.bootstrap.groundBlend === this) this.bootstrap.groundBlend = null;
          this.bootstrap = null;
          if (this.ground && this.ground.isValid) this.ground.destroy();
          this.ground = null;
          this.transform = null;
          (_this$frame = this.frame) == null || _this$frame.destroy();
          this.frame = null;
          (_this$runtimeMaterial = this.runtimeMaterial) == null || _this$runtimeMaterial.destroy();
          this.runtimeMaterial = null;
        };
        _proto.setMap = function setMap(width, height) {
          this.mapW = width;
          this.mapH = height;
        };
        _proto.setView = function setView() {
          var _this$bootstrap;
          var ctx = (_this$bootstrap = this.bootstrap) == null ? void 0 : _this$bootstrap.ctx;
          var ground = this.ground;
          var transform = this.transform;
          if (!ctx || !ground || !transform) return;
          var show = this.enabledInHierarchy && ctx.tunables.getBool('terrain.enabled');
          if (ground.active !== show) ground.active = show;
          if (!show) return;
          var origin = ctx.toPx({
            x: 0,
            y: 0
          });
          var far = ctx.toPx({
            x: this.mapW,
            y: this.mapH
          });
          ground.setPosition(origin);
          var width = far.x - origin.x;
          var height = far.y - origin.y;
          var size = transform.contentSize;
          if (size.width !== width || size.height !== height) transform.setContentSize(width, height);
          this.applyUniforms(ctx.tunables);
        };
        _proto.build = function build(ctx, source) {
          var mask = source.getProperty('maskW0123');
          if (!(mask instanceof Texture2D)) {
            console.warn('[TerrainGround] material has no maskW0123 texture; keeping the greybox map');
            return false;
          }
          var frame = new SpriteFrame();
          frame.texture = mask;
          // The shader never samples the sprite texture, but the frame UVs must stay 0–1 across the map.
          frame.packable = false;
          var material = new Material();
          material.copy(source);
          var parent = ctx.layers.get('arena');
          var node = new Node('TerrainGround');
          node.layer = parent.layer;
          var transform = node.addComponent(UITransform);
          transform.setAnchorPoint(0, 0);
          var sprite = node.addComponent(Sprite);
          sprite.sizeMode = Sprite.SizeMode.CUSTOM;
          sprite.type = Sprite.Type.SIMPLE;
          sprite.trim = false;
          sprite.spriteFrame = frame;
          sprite.customMaterial = material;
          parent.addChild(node);
          this.ground = node;
          this.transform = transform;
          this.frame = frame;
          this.runtimeMaterial = material;
          return true;
        };
        _proto.applyUniforms = function applyUniforms(tunables) {
          var material = this.runtimeMaterial;
          if (!material) return;
          var _terrainUniforms = terrainUniforms(tunables, this.mapW, this.mapH),
            tileParams = _terrainUniforms.tileParams,
            mapParams = _terrainUniforms.mapParams;
          var key = tileParams.join(',') + '|' + mapParams.join(',');
          if (key === this.uniformKey) return;
          this.uniformKey = key;
          material.setProperty('tileParams', this.tileParams.set(tileParams[0], tileParams[1], tileParams[2], tileParams[3]));
          material.setProperty('mapParams', this.mapParams.set(mapParams[0], mapParams[1], mapParams[2], mapParams[3]));
        };
        return TerrainGround;
      }(Component), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "material", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _class2)) || _class));
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/TerrainParams.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports('terrainUniforms', terrainUniforms);
      cclegacy._RF.push({}, "55b6fa49GJN+ocuSXgErIfX", "TerrainParams", undefined);
      /** docs/ui/batch2/README.md 导入说明: 地皮平铺，一块贴图 = 4 u. */
      var TERRAIN_TILE_U = exports('TERRAIN_TILE_U', 4);
      /** Core's `map.borderDecorWidth` default (core/CoreParams.ts); used when core has not registered it. */
      var BORDER_WIDTH_FALLBACK = 2;
      var TERRAIN_PARAMS = exports('TERRAIN_PARAMS', [
      // Issue #70 未定义，自选: off shows the greybox grid underneath for comparison.
      {
        key: 'terrain.enabled',
        group: '地形',
        label: '地形地面',
        kind: 'bool',
        "default": 1
      },
      // docs/ui/batch2/README.md 导入说明: 一块贴图 = 4 u.
      {
        key: 'terrain.tileSize',
        group: '地形',
        label: '地皮平铺(u/张)',
        kind: 'number',
        "default": TERRAIN_TILE_U,
        min: 1,
        max: 16,
        step: 0.5
      },
      // docs/ui/batch2/README.md 区域遮罩: weights sum to 1, ~1–2 u transitions. 1 = masks as authored; >1 narrows them.
      {
        key: 'terrain.blendSharpness',
        group: '地形',
        label: '过渡锐度(1=原遮罩)',
        kind: 'number',
        "default": 1,
        min: 0.25,
        max: 8,
        step: 0.25
      },
      // docs/ui/batch2/README.md 文件清单 world-60x90-v4「外墙 2u 暗边」; gen_world.py darkens by 0.5 × band.
      // Band width is core's `map.borderDecorWidth`.
      {
        key: 'terrain.edgeDarken',
        group: '地形',
        label: '外墙暗边强度',
        kind: 'number',
        "default": 0.5,
        min: 0,
        max: 1,
        step: 0.05
      },
      // UI-requirements R9 低对比度、不抢主剑. 1 = art as delivered.
      {
        key: 'terrain.brightness',
        group: '地形',
        label: '地面亮度',
        kind: 'number',
        "default": 1,
        min: 0.3,
        max: 1.5,
        step: 0.05
      }]);

      /** Values for the `tileParams` / `mapParams` uniforms of terrain-blend.effect. */

      function terrainUniforms(tunables, mapW, mapH) {
        var edgeWidth = tunables.has('map.borderDecorWidth') ? tunables.get('map.borderDecorWidth') : BORDER_WIDTH_FALLBACK;
        return {
          tileParams: [tunables.get('terrain.tileSize'), tunables.get('terrain.blendSharpness'), tunables.get('terrain.edgeDarken'), Math.max(0, edgeWidth)],
          mapParams: [mapW, mapH, tunables.get('terrain.brightness'), 0]
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/ThrowController.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './Vec2.ts', './ThrowFormulas.ts'], function (exports) {
  var _extends, _createForOfIteratorHelperLoose, _createClass, cclegacy, vNormalize, vDist, vSub, vDot, throwDistance, arcAmplitude, catchKind, throwDamage, clawDamage;
  return {
    setters: [function (module) {
      _extends = module.extends;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      vNormalize = module.vNormalize;
      vDist = module.vDist;
      vSub = module.vSub;
      vDot = module.vDot;
    }, function (module) {
      throwDistance = module.throwDistance;
      arcAmplitude = module.arcAmplitude;
      catchKind = module.catchKind;
      throwDamage = module.throwDamage;
      clawDamage = module.clawDamage;
    }],
    execute: function () {
      cclegacy._RF.push({}, "932efWRPB5JF5j3PMFGoEEi", "ThrowController", undefined);
      // P0 §6.4 body-contact cooldown is fixed prose, not an extra tunable.
      var CLAW_COOLDOWN = 0.25;
      // OPEN QUESTION (T6-Q9): P0 §5 does not specify the grounded flash frequency.
      var GROUNDED_BLINK_HZ = 4;
      // OPEN QUESTION (T6-Q13): P0 §5 does not specify cross rotation speed; one turn/s.
      var SPIN_RAD_PER_SECOND = 2 * Math.PI;
      // Numerical tolerances / quadrature resolution, not gameplay parameters.
      var EPS = 1e-10;
      var ARC_STEP = Math.PI / 180;

      /** Owns only the external main sword. No cc, concrete rig access, or input mutation. */
      var ThrowController = exports('ThrowController', /*#__PURE__*/function () {
        function ThrowController(rig) {
          this.phase = 'idle';
          this.running = false;
          this.pos = {
            x: 0,
            y: 0
          };
          this.heading = {
            x: 0,
            y: 0
          };
          this.origin = {
            x: 0,
            y: 0
          };
          this.axis = {
            x: 0,
            y: 0
          };
          this.distance = 0;
          this.theta = 0;
          this.spin = 0;
          this.elapsed = 0;
          this.passedPet = false;
          this.pending = null;
          this.aim = null;
          this.launchCombo = 0;
          this.launchVtip = 0;
          this.outHits = new Set();
          this.backHits = new Set();
          this.enemies = [];
          this.rig = void 0;
          this.rig = rig;
        }

        /** Detached copies keep view consumers from mutating simulation state. */
        var _proto = ThrowController.prototype;
        _proto.reset = function reset() {
          this.phase = 'idle';
          this.pending = this.aim = null;
          this.elapsed = this.theta = this.spin = this.distance = this.launchCombo = this.launchVtip = 0;
          this.passedPet = false;
          this.pos = _extends({}, this.rig.petPos);
          this.origin = _extends({}, this.pos);
          this.heading = this.axis = {
            x: 0,
            y: 0
          };
          this.outHits.clear();
          this.backHits.clear();
          this.enemies.length = 0;
          this.rig.setCombo(0);
          this.running = true;
        };
        _proto.stop = function stop() {
          this.running = false;
          this.aim = null;
        };
        _proto.fixedUpdate = function fixedUpdate(dt) {
          if (!this.running || !Number.isFinite(dt) || dt <= 0) return;
          var _this$rig$ctx = this.rig.ctx,
            services = _this$rig$ctx.services,
            p = _this$rig$ctx.tunables;
          if (services.has('player') && services.get('player').hp <= 0) return;
          if (this.phase === 'pending') {
            // OPEN QUESTION (T6-Q7): switch-off / internal detachment silently abandons pending.
            if (!p.getBool('mech.throw') || !this.rig.mainHeld) this.idle();else if (services.has('input') && services.get('input').frame.pressedThisTick) {
              this.idle();
              this.rig.ctx.events.emit('throw:cancel', {
                reason: 'retouch'
              });
            } else {
              this.elapsed += dt;
              if (this.elapsed + EPS >= p.get('throw.confirmDelay')) this.launch();
            }
          } else if (this.phase === 'idle') this.checkRelease(dt);else {
            this.spin = (this.spin + SPIN_RAD_PER_SECOND * dt) % (2 * Math.PI);
            // A live blade-size change must also keep grounded / returning circles in bounds.
            this.pos = this.rig.ctx.arena.clamp(this.pos, this.radius);
            if (this.phase === 'out') this.flyOut(dt);else if (this.phase === 'back') this.flyBack(dt);else {
              this.claw();
              if (this.phase === 'grounded') this.grounded(dt);else this.autoReturn(dt);
            }
          }
          this.updateAim();
        };
        _proto.checkRelease = function checkRelease(dt) {
          var _this$rig$ctx2 = this.rig.ctx,
            services = _this$rig$ctx2.services,
            p = _this$rig$ctx2.tunables;
          if (!p.getBool('mech.throw') || !this.rig.mainHeld || !services.has('input') || !services.has('swordRig')) return;
          var input = services.get('input');
          var info = services.get('swordRig');
          if (!input.frame.releasedThisTick || !info.fullCharge || input.minMag(p.get('throw.minMagWindow')) < p.get('throw.minMag')) return;
          var dir = vNormalize(input.avgDir(p.get('throw.dirWindow')));
          if (dir.x === 0 && dir.y === 0) return;
          // OPEN QUESTION (T6-Q8): InputHistory windows are held-only and end-exclusive.
          // InputSystem records at frame.time = loop.simTime. minMag(dt) reads the last
          // held sample; magDrop's endpoint is inclusive, so exclude the release at 0.
          this.pending = {
            vTip: info.vTip,
            dir: dir,
            joyMag: input.minMag(dt),
            magDrop300: input.magDrop(0.3, input.frame.time - dt),
            dist: throwDistance(p, info.vTip, this.rig.W),
            origin: _extends({}, this.rig.petPos)
          };
          this.phase = 'pending';
          this.elapsed = 0;
          if (p.get('throw.confirmDelay') <= 0) this.launch();
        };
        _proto.updateAim = function updateAim() {
          var _this$rig$ctx3 = this.rig.ctx,
            services = _this$rig$ctx3.services,
            p = _this$rig$ctx3.tunables;
          this.aim = null;
          if (!p.getBool('mech.throw') || !p.getBool('throw.aimLine') || !this.rig.mainHeld) return;
          if (this.phase === 'pending' && this.pending) {
            this.aim = {
              origin: _extends({}, this.pending.origin),
              dir: _extends({}, this.pending.dir),
              dist: this.pending.dist
            };
            return;
          }
          if (this.phase !== 'idle' || !services.has('input') || !services.has('swordRig')) return;
          var input = services.get('input');
          var info = services.get('swordRig');
          if (!info.fullCharge || !input.frame.touching || input.frame.mag < p.get('throw.minMag')) return;
          var dir = vNormalize(input.avgDir(p.get('throw.dirWindow')));
          if (dir.x !== 0 || dir.y !== 0) this.aim = {
            origin: _extends({}, this.rig.petPos),
            dir: dir,
            dist: throwDistance(p, info.vTip, this.rig.W)
          };
        };
        _proto.launch = function launch() {
          var pending = this.pending;
          if (!pending) return;
          var ctx = this.rig.ctx;
          var _this$rig$detachMain = this.rig.detachMain(),
            pos = _this$rig$detachMain.pos;
          this.pos = ctx.arena.clamp(pos, this.radius);
          this.origin = _extends({}, this.pos);
          this.axis = _extends({}, pending.dir);
          this.heading = _extends({}, this.axis);
          // Only historical samples (release vTip / launch combo) are retained.
          // Pending aim retains release D; flight geometry reads live tunables below.
          this.launchVtip = pending.vTip;
          this.distance = throwDistance(ctx.tunables, pending.vTip, this.rig.W);
          this.launchCombo = ctx.services.has('swordRig') ? ctx.services.get('swordRig').combo : 0;
          this.outHits.clear();
          this.backHits.clear();
          this.theta = this.elapsed = 0;
          this.passedPet = false;
          this.phase = 'out';
          this.pending = null;
          this.aim = null;
          // OPEN QUESTION (T6-Q10): frozen rig sets player.state='empty' even while thrown.
          // OPEN QUESTION (T6-Q11): tuning owns telemetry export; only emit core payloads here.
          ctx.events.emit('throw:start', {
            vTip: pending.vTip,
            joyMag: pending.joyMag,
            magDrop300: pending.magDrop300,
            dir: _extends({}, this.axis),
            dist: this.distance
          });
          if (this.distance <= 0) this.beginBack();
        };
        _proto.curve = function curve(theta) {
          // OPEN QUESTION (T6-Q1): docs give only maximum lateral offset and a Cv=3
          // "large ellipse" description; the exact curve awaits design confirmation.
          // T6 implementation choice: s=D*theta/pi, lateral=A*(1-cos(pi*s/D))/2.
          // Its initial tangent follows dir; perp is dir rotated 90 degrees CCW.
          // OPEN QUESTION (T6-Q17): tangent alignment does not bound a finite tick's
          // chord angle for short D / high speed. Default D passes; see PR open questions.
          var along = this.distance * theta / Math.PI;
          var side = arcAmplitude(this.rig.ctx.tunables, this.rig.Cv, this.distance) * (1 - Math.cos(theta)) / 2;
          return {
            x: this.origin.x + this.axis.x * along - this.axis.y * side,
            y: this.origin.y + this.axis.y * along + this.axis.x * side
          };
        };
        _proto.flyOut = function flyOut(dt) {
          var p = this.rig.ctx.tunables;
          this.distance = throwDistance(p, this.launchVtip, this.rig.W);
          if (this.distance <= 0) {
            this.beginBack();
            this.flyBack(dt);
            return;
          }
          var speed = p.get('throw.speed');
          var budget = speed * dt;
          while (budget > EPS && this.phase === 'out') {
            var end = Math.min(Math.PI, this.theta + ARC_STEP);
            var from = this.curve(this.theta);
            var next = this.curve(end);
            var length = vDist(from, next);
            var theta = end;
            if (length > budget) {
              var lo = this.theta;
              var hi = end;
              // Monotone chord-length solve within a one-degree interval.
              for (var i = 0; i < 32; i++) {
                var mid = (lo + hi) / 2;
                if (vDist(from, this.curve(mid)) > budget) hi = mid;else lo = mid;
              }
              theta = (lo + hi) / 2;
              next = this.curve(theta);
              length = vDist(from, next);
            }
            this.theta = theta;
            // Applying the curve delta at the current position preserves continuity
            // when distance / curvature are edited, while taking effect this step.
            var delta = vSub(next, from);
            var before = _extends({}, this.pos);
            var candidate = {
              x: before.x + delta.x,
              y: before.y + delta.y
            };
            var direction = vNormalize(delta);
            this.heading = direction;
            var wall = this.move(candidate);
            this.damage(before, 'out', direction);
            budget = Math.max(0, budget - length);
            if (wall) {
              this.phase = 'back';
              this.passedPet = false;
            } else if (this.theta >= Math.PI - EPS) this.beginBack();
            if (length <= EPS && this.phase === 'out') this.theta = end;
          }
          if (this.phase === 'back' && budget > EPS) this.flyBack(budget / speed);
        }

        /** Returns true on contact; incoming heading is reflected once for each hit edge. */;
        _proto.move = function move(candidate) {
          var clamped = this.rig.ctx.arena.clamp(candidate, this.radius);
          var x = clamped.x !== candidate.x;
          var y = clamped.y !== candidate.y;
          this.pos = clamped;
          if (x) this.heading.x = -this.heading.x;
          if (y) this.heading.y = -this.heading.y;
          return x || y;
        };
        _proto.beginBack = function beginBack() {
          this.phase = 'back';
          this.passedPet = false;
          this.heading = vNormalize(vSub(this.rig.petPos, this.pos));
        };
        _proto.flyBack = function flyBack(dt) {
          if (this.tryCatch()) return;
          var p = this.rig.ctx.tunables;
          var target = vNormalize(vSub(this.rig.petPos, this.pos));
          var angle = Math.atan2(this.heading.x * target.y - this.heading.y * target.x, vDot(this.heading, target));
          var limit = p.get('throw.returnTurn') * Math.PI / 180 * dt;
          var turn = Math.max(-limit, Math.min(limit, angle));
          var c = Math.cos(turn);
          var s = Math.sin(turn);
          this.heading = {
            x: this.heading.x * c - this.heading.y * s,
            y: this.heading.x * s + this.heading.y * c
          };
          var before = _extends({}, this.pos);
          var direction = _extends({}, this.heading);
          this.move({
            x: before.x + direction.x * p.get('throw.speed') * dt,
            y: before.y + direction.y * p.get('throw.speed') * dt
          });
          this.damage(before, 'back', direction);
          if (this.tryCatch()) return;
          var behind = vDot(this.heading, vSub(this.rig.petPos, this.pos)) <= 0;
          if (behind) this.passedPet = true;
          if (this.passedPet && behind && vDist(this.pos, this.rig.petPos) >= p.get('throw.missPassDist')) {
            var comboLost = this.combo;
            this.rig.setCombo(0);
            this.rig.setMainState('grounded');
            this.phase = 'grounded';
            this.elapsed = 0;
            this.rig.ctx.events.emit('throw:miss', {
              comboLost: comboLost
            });
          }
        };
        _proto.tryCatch = function tryCatch() {
          var p = this.rig.ctx.tunables;
          var offset = vSub(this.pos, this.rig.petPos);
          // Contact fallback: wall/corner clamping can keep a large sword
          // outside catchRadius. Touching still catches, with the same quality test.
          if (!this.inCatchRange()) return false;
          var result = catchKind(p, this.rig.petVel, offset, this.rig.petMaxSpeed);
          var combo = this.combo;
          if (result.kind === 'perfect') {
            combo = Math.min(combo + 1, Math.floor(p.get('throw.comboMax')));
            this.rig.setCombo(combo);
            this.rig.addDragMul('throw.yujin', 1 + p.get('throw.yujinMul'), p.get('throw.yujinDur'));
          }
          this.rig.ctx.events.emit('throw:catch', _extends({}, result, {
            combo: combo
          }));
          this.rig.attachMain();
          this.idle();
          return true;
        };
        _proto.damage = function damage(before, phase, dir) {
          var _this$rig$ctx4 = this.rig.ctx,
            services = _this$rig$ctx4.services,
            p = _this$rig$ctx4.tunables;
          if (!services.has('enemies')) return;
          var service = services.get('enemies');
          var seen = phase === 'out' ? this.outHits : this.backHits;
          this.enemies.length = 0;
          service.querySegment(before, this.pos, this.radius, this.enemies);
          for (var _iterator = _createForOfIteratorHelperLoose(this.enemies), _step; !(_step = _iterator()).done;) {
            var enemy = _step.value;
            if (!enemy.alive || seen.has(enemy.id)) continue;
            seen.add(enemy.id);
            var source = phase === 'out' ? 'throw_out' : 'throw_back';
            // OPEN QUESTION (T6-Q3): local once-per-leg authority; cooldown=0, omit knockback.
            service.hit(enemy.id, {
              source: source,
              hitKey: source,
              cooldown: 0,
              dir: _extends({}, dir),
              amount: throwDamage(p, this.rig.B, this.rig.W, this.launchCombo)
            });
          }
        };
        _proto.claw = function claw() {
          var _this$rig$ctx5 = this.rig.ctx,
            services = _this$rig$ctx5.services,
            p = _this$rig$ctx5.tunables;
          if (!services.has('enemies') || !services.has('player')) return;
          var service = services.get('enemies');
          this.enemies.length = 0;
          service.queryCircle(_extends({}, this.rig.petPos), services.get('player').radius, this.enemies);
          for (var _iterator2 = _createForOfIteratorHelperLoose(this.enemies), _step2; !(_step2 = _iterator2()).done;) {
            var enemy = _step2.value;
            if (enemy.alive) {
              service.hit(enemy.id, {
                source: 'claw',
                hitKey: 'claw',
                cooldown: CLAW_COOLDOWN,
                amount: clawDamage(p, this.rig.B),
                dir: vNormalize(vSub(enemy.pos, this.rig.petPos))
              });
            }
          }
        };
        _proto.grounded = function grounded(dt) {
          var p = this.rig.ctx.tunables;
          // OPEN QUESTION (T6-Q5): touching circles = player.radius + sword half-length.
          if (this.touchingPet()) {
            this.recover('pickup');
            return;
          }
          this.elapsed += dt;
          if (this.elapsed + EPS >= p.get('throw.autoReturn')) {
            this.phase = 'autoReturn';
            this.rig.setMainState('returning');
          }
        };
        _proto.autoReturn = function autoReturn(dt) {
          if (this.inCatchRange()) {
            this.recover('auto');
            return;
          }
          var p = this.rig.ctx.tunables;
          var distance = vDist(this.pos, this.rig.petPos);
          // OPEN QUESTION (T6-Q4): automatic recovery does no sword damage; claw still runs.
          // OPEN QUESTION (T6-Q6): reuse throw.speed, straight pursuit without a turn limit.
          // Contact also recovers as 'auto', including arena-clamped corners.
          this.heading = vNormalize(vSub(this.rig.petPos, this.pos));
          var step = Math.min(distance, p.get('throw.speed') * dt);
          this.pos = this.rig.ctx.arena.clamp({
            x: this.pos.x + this.heading.x * step,
            y: this.pos.y + this.heading.y * step
          }, this.radius);
          if (this.inCatchRange()) this.recover('auto');
        };
        _proto.touchingPet = function touchingPet() {
          var services = this.rig.ctx.services;
          // OPEN QUESTION (T6-Q16): extreme legal blade sizes can prevent even contact
          // in a corner: sqrt(2)*(swordRadius-playerRadius) > their summed radii.
          // Both circle containment and contact rules still apply; no teleport/timeout.
          return services.has('player') && vDist(this.pos, this.rig.petPos) <= services.get('player').radius + this.radius;
        };
        _proto.inCatchRange = function inCatchRange() {
          return vDist(this.pos, this.rig.petPos) <= this.rig.ctx.tunables.get('throw.catchRadius') || this.touchingPet();
        };
        _proto.recover = function recover(how) {
          this.rig.attachMain();
          this.idle();
          this.rig.ctx.events.emit('throw:recovered', {
            how: how
          });
        };
        _proto.idle = function idle() {
          this.phase = 'idle';
          this.pending = this.aim = null;
          this.elapsed = 0;
        };
        _createClass(ThrowController, [{
          key: "snapshot",
          get: function get() {
            var aim = this.aim;
            return {
              phase: this.phase,
              pos: _extends({}, this.pos),
              spin: this.spin,
              aim: aim ? {
                origin: _extends({}, aim.origin),
                dir: _extends({}, aim.dir),
                dist: aim.dist
              } : null,
              groundedFlash: this.phase === 'grounded' && Math.floor(this.elapsed * GROUNDED_BLINK_HZ * 2) % 2 === 0
            };
          }
        }, {
          key: "radius",
          get: function get() {
            // OPEN QUESTION (T6-Q2): use P0 §5/§6.2 sword half-length as rotating-cross radius.
            var p = this.rig.ctx.tunables;
            return (p.get('sword.bladeLenBase') + p.get('sword.bladeLenPerLg') * this.rig.Lg) / 2;
          }
        }, {
          key: "combo",
          get: function get() {
            var services = this.rig.ctx.services;
            return services.has('swordRig') ? services.get('swordRig').combo : 0;
          }
        }]);
        return ThrowController;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/ThrowFormulas.ts", ['cc', './Vec2.ts'], function (exports) {
  var cclegacy, vDot, vNormalize, vLen;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      vDot = module.vDot;
      vNormalize = module.vNormalize;
      vLen = module.vLen;
    }],
    execute: function () {
      exports({
        arcAmplitude: arcAmplitude,
        catchKind: catchKind,
        clawDamage: clawDamage,
        directionAngleDeg: directionAngleDeg,
        directionCos: directionCos,
        throwDamage: throwDamage,
        throwDistance: throwDistance
      });
      cclegacy._RF.push({}, "c68fe2Ym0NKmb6eDIj0F5dX", "ThrowFormulas", undefined);

      /** P0 §6.4 / GDD §6.4: cap BEFORE the weight multiplier; T6 §3.3 floors D at 0. */
      function throwDistance(p, vTip, W) {
        return Math.max(0, Math.min(p.get('throw.distBase') + p.get('throw.distPerVtip') * vTip, p.get('throw.distCap')) * (1 - p.get('throw.distWeightK') * (W - 2)));
      }

      /** P0 §6.4 / GDD §6.4: maximum lateral offset, independent of the chosen path shape. */
      function arcAmplitude(p, Cv, distance) {
        return p.get('throw.arcPerCv') * Cv * distance;
      }

      /** P0 §6.4: B comes from the rig; combo is the count captured at launch. */
      function throwDamage(p, B, W, combo) {
        return B * (p.get('throw.dmgBase') + p.get('throw.dmgPerW') * W) * (1 + p.get('throw.comboK') * combo);
      }

      /** P0 §6.4: empty-handed body contact damage. */
      function clawDamage(p, B) {
        return B * p.get('throw.clawMul');
      }

      /** Unit-vector dot product. Zero / near-zero vectors follow core vNormalize's zero convention. */
      function directionCos(a, b) {
        return Math.max(-1, Math.min(1, vDot(vNormalize(a), vNormalize(b))));
      }

      /** Unsigned angle in degrees for P0 §6.4's <5° aim check; a missing direction returns 0. */
      function directionAngleDeg(a, b) {
        var ua = vNormalize(a);
        var ub = vNormalize(b);
        if (vLen(ua) === 0 || vLen(ub) === 0) return 0;
        return Math.acos(directionCos(ua, ub)) * 180 / Math.PI;
      }
      /** P0 §6.4 / T6 §3.7: petToSword = sword - pet; both thresholds are inclusive. */
      function catchKind(p, petVel, petToSword, petMaxSpeed) {
        var cos = directionCos(petVel, petToSword);
        var speedFrac = petMaxSpeed > 0 ? vLen(petVel) / petMaxSpeed : 0;
        return {
          cos: cos,
          speedFrac: speedFrac,
          kind: cos >= p.get('throw.perfectCos') && speedFrac >= p.get('throw.perfectSpeedFrac') ? 'perfect' : 'normal'
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/ThrowParams.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "b0d0eFSxxpK3pTAc8pBw6cE", "ThrowParams", undefined);
      function number(key, label, value, min, max) {
        return {
          key: key,
          group: '掷剑',
          label: label,
          kind: 'number',
          "default": value,
          min: min,
          max: max
        };
      }
      function toggle(key, label) {
        return {
          key: key,
          group: '掷剑',
          label: label,
          kind: 'bool',
          "default": 1
        };
      }

      /** P0 §6.4 parameter table: 25 keys (mech.throw + 24 throw.*). */
      var THROW_PARAMS = exports('THROW_PARAMS', [toggle('mech.throw', '掷剑机制开关'), number('throw.minMag', '松手前最低摇杆幅度', 0.8, 0, 1), number('throw.minMagWindow', '幅度检查窗口（s）', 0.15, 0, 0.5),
      // P0 §11: 120ms, expressed in simulation seconds.
      number('throw.confirmDelay', '延迟确认（s）【默认·待试玩】', 0.12, 0, 0.3), number('throw.dirWindow', '方向平均窗口（s）', 0.1, 0, 0.3), toggle('throw.aimLine', '方向指示线'), number('throw.speed', '飞行速度（u/s）', 10, 4, 25), number('throw.distBase', '飞出距离基数', 2, 0, 5), number('throw.distPerVtip', '每 u/s 剑尖速度', 0.4, 0, 1), number('throw.distCap', '飞出距离上限（u）', 7, 2, 12), number('throw.distWeightK', '每点剑重（相对 2）距离变化', 0.1, 0, 0.3), number('throw.arcPerCv', '每点弧度的侧向偏移比例', 0.25, 0, 0.6), number('throw.returnTurn', '回程最大转向（°/s）', 360, 90, 1080), number('throw.dmgBase', '飞剑伤害系数', 0.8, 0, 3), number('throw.dmgPerW', '飞剑伤害系数/W', 0.2, 0, 1), number('throw.comboK', '每层连击加成', 0.25, 0, 1), number('throw.comboMax', '连击上限', 10, 1, 30), number('throw.catchRadius', '接剑半径（u）', 0.7, 0.3, 1.5), number('throw.perfectCos', '完美接剑余弦门槛', 0.6, 0, 1), number('throw.perfectSpeedFrac', '完美接剑最低速度比例', 0.5, 0, 1), number('throw.yujinMul', '余劲加成', 0.3, 0, 1), number('throw.yujinDur', '余劲时长（s）', 3, 0, 10), number('throw.missPassDist', '漏接判定距离（u）', 1.5, 0.5, 4), number('throw.autoReturn', '漏接后自动飞回（s）', 3, 0.5, 10), number('throw.clawMul', '空手爪击（× B）', 0.2, 0, 1)]);
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/ThrowView.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _inheritsLoose, cclegacy, _decorator, Color, Graphics, Node, UITransform, Component;
  return {
    setters: [function (module) {
      _inheritsLoose = module.inheritsLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
      _decorator = module._decorator;
      Color = module.Color;
      Graphics = module.Graphics;
      Node = module.Node;
      UITransform = module.UITransform;
      Component = module.Component;
    }],
    execute: function () {
      exports('mountThrowView', mountThrowView);
      var _dec, _class;
      cclegacy._RF.push({}, "2246eRdFOFAM6SMaUusyADX", "ThrowView", undefined);
      var ccclass = _decorator.ccclass;
      var ORANGE = new Color(255, 156, 48);
      var GREY = new Color(165, 175, 190);
      var WHITE = new Color(255, 255, 255);
      // OPEN QUESTION (T6-Q15): P0 §5 leaves dash/gap and stroke sizes unspecified.
      // Presentation constants in world units; never extra gameplay tunables.
      var DASH_LENGTH = 0.15;
      var DASH_GAP = 0.1;
      var STROKE_WIDTH = 0.025;
      var MIN_STROKE_PX = 1;
      var ThrowView = exports('ThrowView', (_dec = ccclass('ThrowGreyboxView'), _dec(_class = /*#__PURE__*/function (_Component) {
        _inheritsLoose(ThrowView, _Component);
        function ThrowView() {
          var _this;
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          _this = _Component.call.apply(_Component, [this].concat(args)) || this;
          _this.rig = null;
          _this.controller = null;
          _this.graphics = null;
          return _this;
        }
        var _proto = ThrowView.prototype;
        _proto.bind = function bind(rig, controller) {
          this.rig = rig;
          this.controller = controller;
          this.graphics = this.node.addComponent(Graphics);
        };
        _proto.draw = function draw() {
          var rig = this.rig;
          var controller = this.controller;
          var g = this.graphics;
          if (!rig || !controller || !g || !this.enabledInHierarchy) return;
          var snapshot = controller.snapshot;
          var px = rig.ctx.toPx;
          // Same pixel scale as SwordView, including translated world origins.
          var scale = Math.abs(px({
            x: 1,
            y: 0
          }).x - px({
            x: 0,
            y: 0
          }).x);
          g.clear();
          g.lineWidth = Math.max(MIN_STROKE_PX, STROKE_WIDTH * scale);
          g.strokeColor = ORANGE;
          var aim = snapshot.aim;
          if (aim) {
            for (var s = 0; s < aim.dist; s += DASH_LENGTH + DASH_GAP) {
              var end = Math.min(aim.dist, s + DASH_LENGTH);
              var a = px({
                x: aim.origin.x + aim.dir.x * s,
                y: aim.origin.y + aim.dir.y * s
              });
              var b = px({
                x: aim.origin.x + aim.dir.x * end,
                y: aim.origin.y + aim.dir.y * end
              });
              g.moveTo(a.x, a.y);
              g.lineTo(b.x, b.y);
            }
            g.stroke();
          }
          if (snapshot.phase === 'idle' || snapshot.phase === 'pending') return;
          var p = px(snapshot.pos);
          var tunables = rig.ctx.tunables;
          // T6-Q2: rotating-cross arm length equals the collision half-length.
          var radius = (tunables.get('sword.bladeLenBase') + tunables.get('sword.bladeLenPerLg') * rig.Lg) / 2 * scale;
          var x = Math.cos(snapshot.spin) * radius;
          var y = Math.sin(snapshot.spin) * radius;
          g.strokeColor = snapshot.groundedFlash ? WHITE : GREY;
          g.moveTo(p.x - x, p.y - y);
          g.lineTo(p.x + x, p.y + y);
          g.moveTo(p.x + y, p.y - x);
          g.lineTo(p.x - y, p.y + x);
          if (snapshot.groundedFlash) g.circle(p.x, p.y, radius);
          g.stroke();
        };
        return ThrowView;
      }(Component)) || _class));
      function mountThrowView(rig, controller) {
        var parent = rig.ctx.layers.get('rig');
        // Pure core consumers may provide a descriptor without a Cocos scene.
        if (typeof parent.addChild !== 'function') return null;
        var node = new Node('SwordThrow');
        node.layer = parent.layer;
        node.addComponent(UITransform).setAnchorPoint(0, 0);
        parent.addChild(node);
        var component = node.addComponent(ThrowView);
        component.bind(rig, controller);
        return function () {
          return component.draw();
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/Tunables.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _createForOfIteratorHelperLoose, cclegacy;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports('hashValues', hashValues);
      cclegacy._RF.push({}, "97245/G1A1BSKOC8+qwlLjh", "Tunables", undefined);
      /** One row in the tuning registry. Modules register their own rows at install time. */
      var KEY_RE = /^[A-Za-z][\w]*(\.[A-Za-z][\w]*)+$/;

      /**
       * Runtime tuning registry. Core does not own gameplay defaults; each module
       * passes its `*Params.ts` rows to `define` from `install`.
       */
      var Tunables = exports('Tunables', /*#__PURE__*/function () {
        /**
         * @param emit optional bridge into the event bus. Called only when the
         * stored number actually changes, with the pre-clamp previous value and
         * the clamped new value.
         */
        function Tunables(emit) {
          this.defs = new Map();
          this.values = new Map();
          this.order = [];
          this.aliases = new Map();
          this.listeners = new Map();
          this.anyListeners = new Set();
          this.emit = void 0;
          this.emit = emit;
        }

        /**
         * Map an old preset key onto the current one. `load` applies this before
         * the unknown-key warning, so renamed keys do not drop out of old presets.
         */
        var _proto = Tunables.prototype;
        _proto.registerAlias = function registerAlias(from, to) {
          if (!from || !to) throw new Error('tunable alias needs both keys');
          this.aliases.set(from, to);
        };
        _proto.define = function define(defs) {
          for (var _iterator = _createForOfIteratorHelperLoose(defs), _step; !(_step = _iterator()).done;) {
            var raw = _step.value;
            var def = copyDef(validateDef(raw));
            var existing = this.defs.get(def.key);
            this.defs.set(def.key, def);
            if (!existing) {
              this.order.push(def.key);
              this.values.set(def.key, this.clamp(def, def["default"]));
            } else {
              var _this$values$get;
              console.warn("[tunables] redefining \"" + def.key + "\"");
              var current = (_this$values$get = this.values.get(def.key)) != null ? _this$values$get : def["default"];
              this.values.set(def.key, this.clamp(def, current));
            }
          }
        };
        _proto.has = function has(key) {
          return this.defs.has(key);
        };
        _proto.get = function get(key) {
          var _this$values$get2;
          if (!this.defs.has(key)) throw new Error("Unknown tunable: " + key);
          return (_this$values$get2 = this.values.get(key)) != null ? _this$values$get2 : 0;
        };
        _proto.getBool = function getBool(key) {
          return this.get(key) !== 0;
        };
        _proto.set = function set(key, v) {
          var _this$values$get3;
          var def = this.defs.get(key);
          if (!def) throw new Error("Unknown tunable: " + key);
          var from = (_this$values$get3 = this.values.get(key)) != null ? _this$values$get3 : def["default"];
          var to = this.clamp(def, v);
          if (to === from) return;
          this.values.set(key, to);
          this.emitChange(key, from, to);
        };
        _proto.onChange = function onChange(key, cb) {
          var _this = this;
          if (key === '*') {
            this.anyListeners.add(cb);
            return function () {
              _this.anyListeners["delete"](cb);
            };
          }
          var set = this.listeners.get(key);
          if (!set) {
            set = new Set();
            this.listeners.set(key, set);
          }
          set.add(cb);
          return function () {
            set["delete"](cb);
          };
        };
        _proto.all = function all() {
          var out = [];
          for (var _iterator2 = _createForOfIteratorHelperLoose(this.order), _step2; !(_step2 = _iterator2()).done;) {
            var _key = _step2.value;
            var def = this.defs.get(_key);
            if (def) out.push(copyDef(def));
          }
          return out;
        };
        _proto.snapshot = function snapshot() {
          var out = {};
          for (var _iterator3 = _createForOfIteratorHelperLoose(this.order), _step3; !(_step3 = _iterator3()).done;) {
            var _this$values$get4;
            var _key2 = _step3.value;
            out[_key2] = (_this$values$get4 = this.values.get(_key2)) != null ? _this$values$get4 : 0;
          }
          return out;
        };
        _proto.load = function load(values) {
          // Object.keys + lookup instead of Object.entries (ES2017) to stay within the ES2015 lib.
          for (var _i = 0, _Object$keys = Object.keys(values); _i < _Object$keys.length; _i++) {
            var _this$aliases$get;
            var rawKey = _Object$keys[_i];
            var rawVal = values[rawKey];
            var _key3 = (_this$aliases$get = this.aliases.get(rawKey)) != null ? _this$aliases$get : rawKey;
            if (!this.defs.has(_key3)) {
              console.warn("[tunables] ignoring unknown key \"" + rawKey + "\"");
              continue;
            }
            this.set(_key3, rawVal);
          }
        };
        _proto.hash = function hash() {
          return hashValues(this.snapshot());
        };
        _proto.resetAll = function resetAll() {
          for (var _iterator4 = _createForOfIteratorHelperLoose(this.order), _step4; !(_step4 = _iterator4()).done;) {
            var _key4 = _step4.value;
            var def = this.defs.get(_key4);
            if (!def) continue;
            this.set(_key4, def["default"]);
          }
        };
        _proto.clamp = function clamp(def, v) {
          var x = v;
          if (!Number.isFinite(x)) x = def["default"];
          if (def.kind === 'bool') return x >= 0.5 ? 1 : 0;
          if (def.kind === 'enum') {
            var _def$options$length, _def$options;
            var max = Math.max(0, ((_def$options$length = (_def$options = def.options) == null ? void 0 : _def$options.length) != null ? _def$options$length : 1) - 1);
            var i = Math.round(x);
            if (i < 0) return 0;
            if (i > max) return max;
            return i;
          }
          if (def.min !== undefined) x = Math.max(def.min, x);
          if (def.max !== undefined) x = Math.min(def.max, x);
          return x;
        };
        _proto.emitChange = function emitChange(key, from, to) {
          var _this$emit;
          (_this$emit = this.emit) == null || _this$emit.call(this, key, from, to);
          var set = this.listeners.get(key);
          if (set) {
            // Array.from, not [...set]: Cocos 3.8 Babel loose spreads do not unpack Sets.
            for (var _i2 = 0, _Array$from = Array.from(set); _i2 < _Array$from.length; _i2++) {
              var _cb = _Array$from[_i2];
              _cb(key, to);
            }
          }
          for (var _i3 = 0, _Array$from2 = Array.from(this.anyListeners); _i3 < _Array$from2.length; _i3++) {
            var _cb2 = _Array$from2[_i3];
            _cb2(key, to);
          }
        };
        return Tunables;
      }());
      function hashValues(values) {
        var keys = Object.keys(values).sort();
        var h = 0x811c9dc5;
        var push = function push(s) {
          for (var i = 0; i < s.length; i++) {
            h ^= s.charCodeAt(i);
            h = Math.imul(h, 0x01000193);
          }
        };
        for (var _iterator5 = _createForOfIteratorHelperLoose(keys), _step5; !(_step5 = _iterator5()).done;) {
          var _key5 = _step5.value;
          push(_key5);
          push('=');
          push(String(values[_key5]));
          push(';');
        }
        // Manual left-pad instead of String.prototype.padStart (ES2017).
        var hex = (h >>> 0).toString(16);
        while (hex.length < 8) hex = '0' + hex;
        return hex;
      }
      function validateDef(def) {
        if (!KEY_RE.test(def.key)) {
          throw new Error("Tunable key \"" + def.key + "\" must look like \"module.name\"");
        }
        if (def.kind !== 'number' && def.kind !== 'bool' && def.kind !== 'enum') {
          throw new Error("Tunable \"" + def.key + "\" has unknown kind");
        }
        if (!Number.isFinite(def["default"])) {
          throw new Error("Tunable \"" + def.key + "\" default must be finite");
        }
        if (def.kind === 'enum' && (!def.options || def.options.length === 0)) {
          throw new Error("Enum tunable \"" + def.key + "\" needs options");
        }
        return def;
      }
      function copyDef(def) {
        return {
          key: def.key,
          group: def.group,
          label: def.label,
          kind: def.kind,
          "default": def["default"],
          min: def.min,
          max: def.max,
          step: def.step,
          options: def.options ? def.options.slice() : undefined,
          restart: def.restart,
          note: def.note
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/TuningController.ts", ['cc', './SystemOrder.ts', './Presets.ts', './Storage.ts', './Telemetry.ts', './TuningParams.ts'], function (exports) {
  var cclegacy, SystemOrder, Presets, StoredJson, Telemetry, TUNING_PARAMS;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      SystemOrder = module.SystemOrder;
    }, function (module) {
      Presets = module.Presets;
    }, function (module) {
      StoredJson = module.StoredJson;
    }, function (module) {
      Telemetry = module.Telemetry;
    }, function (module) {
      TUNING_PARAMS = module.TUNING_PARAMS;
    }],
    execute: function () {
      cclegacy._RF.push({}, "3bd53zk7XBMeoB/OIxWFZWC", "TuningController", undefined);
      var TuningController = exports('TuningController', /*#__PURE__*/function () {
        function TuningController(ctx, storage) {
          if (storage === void 0) {
            storage = null;
          }
          this.id = 'tuning';
          this.order = SystemOrder.Tuning;
          this.ctx = void 0;
          this.presets = void 0;
          this.telemetry = void 0;
          this.active = false;
          this.draw = null;
          this.ctx = ctx;
          ctx.tunables.define(TUNING_PARAMS);
          this.presets = new Presets(ctx.tunables, new StoredJson(storage));
          this.telemetry = new Telemetry(ctx, new StoredJson(storage));
        }
        var _proto = TuningController.prototype;
        _proto.attach = function attach() {
          if (this.active) return;
          this.active = true;
          this.telemetry.attach();
        };
        _proto.detach = function detach() {
          if (!this.active) return;
          this.active = false;
          this.telemetry.detach();
        };
        _proto.setView = function setView(draw) {
          this.draw = draw;
        };
        _proto.fixedUpdate = function fixedUpdate(dt) {
          if (this.active) this.telemetry.fixedUpdate(dt);
        };
        _proto.render = function render() {
          var _this$draw;
          if (this.active) (_this$draw = this.draw) == null || _this$draw.call(this);
        };
        _proto.command = function command(cmd, arg) {
          if (cmd === 'restart') this.telemetry.expectDebugRestart();
          this.ctx.events.emit('debug:command', arg === undefined ? {
            cmd: cmd
          } : {
            cmd: cmd,
            arg: arg
          });
        };
        _proto.quit = function quit() {
          this.telemetry.resultChoice('quit');
        };
        _proto.retry = function retry() {
          // A result-page retry is a normal run. Debug buttons always use events.
          if (this.telemetry.result) {
            this.telemetry.resultChoice('again');
            this.telemetry.expectNormalRetry();
            this.ctx.session.restart();
          }
        };
        return TuningController;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/TuningParams.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "9f593JvbMhHP7a9oWzfGdyU", "TuningParams", undefined);
      /** Fixed analysis/schema rules from P0 §9–10; these are not gameplay knobs. */
      var P0_RULES = exports('P0_RULES', {
        damageWindow: 30,
        fpsWindow: 5,
        samplePeriod: 10,
        damagePeriod: 1,
        retainedSessions: 30,
        timeDigits: 2,
        hashLength: 6,
        throwJoyMin: 0.5,
        throwDropMax: 0.3,
        chainShortcuts: [0, 8, 16],
        sheepShortcut: 20
      });

      // P0 未定义，自选默认值: floating-point boundary tolerance, not game timing.
      var TIME_EPSILON = exports('TIME_EPSILON', 1e-8);

      /** Presentation/command preferences. No gameplay defaults are owned here. */
      var TUNING_PARAMS = exports('TUNING_PARAMS', [
      // P0 §9.2 defines the default, but not the key or tuning prefix.
      {
        key: 'tuning.hud',
        group: '调试',
        label: '调试 HUD',
        kind: 'bool',
        "default": 1
      },
      // P0 §9.1 defines default-on behavior. P0 未定义，自选默认值: key and tuning prefix.
      {
        key: 'tuning.pauseOnOpen',
        group: '调试',
        label: '打开时暂停',
        kind: 'bool',
        "default": 1
      },
      // P0 未定义，自选默认值 (seconds; nonnegative refresh delay).
      {
        key: 'tuning.refresh',
        group: '调试',
        label: '界面刷新间隔',
        kind: 'number',
        "default": 0.1,
        min: 0,
        max: 1,
        step: 0.01
      },
      // P0 未定义，自选默认值 (positive integral page size).
      {
        key: 'tuning.pageRows',
        group: '调试',
        label: '每页参数行数',
        kind: 'number',
        "default": 6,
        min: 1,
        max: 6,
        step: 1
      },
      // P0 未定义，自选默认值 (nonnegative command arguments).
      {
        key: 'tuning.chainArg',
        group: '调试',
        label: '调试链剑数',
        kind: 'number',
        "default": 10,
        min: 0,
        max: 36,
        step: 1
      },
      // P0 未定义，自选默认值
      {
        key: 'tuning.speedArg',
        group: '调试',
        label: '调试剑尖速度',
        kind: 'number',
        "default": 25,
        min: 0,
        max: 100,
        step: 0.1
      },
      // P0 未定义，自选默认值 (kind index 0 = blob; count >= 1).
      {
        key: 'tuning.spawnKind',
        group: '调试',
        label: '调试刷怪种类',
        kind: 'enum',
        "default": 0,
        options: ['blob', 'sheep', 'boar']
      },
      // P0 未定义，自选默认值
      {
        key: 'tuning.spawnCount',
        group: '调试',
        label: '调试刷怪数量',
        kind: 'number',
        "default": 1,
        min: 1,
        max: 80,
        step: 1
      }]);
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/TuningView.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './Hud.ts', './Presets.ts', './Telemetry.ts', './TuningParams.ts', './ScreenLayout.ts', './TuningController.ts', './Widgets.ts'], function (exports) {
  var _inheritsLoose, _createForOfIteratorHelperLoose, cclegacy, _decorator, sys, view, screen, EditBox, Label, Component, Color, BlockInputEvents, readHud, applyPlayMode, parameterGroups, groupedDamage, DAMAGE_GROUPS, DAMAGE_SOURCES, P0_RULES, layoutScreen, TuningController, edit, exportText, label, slider, button, box;
  return {
    setters: [function (module) {
      _inheritsLoose = module.inheritsLoose;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
      _decorator = module._decorator;
      sys = module.sys;
      view = module.view;
      screen = module.screen;
      EditBox = module.EditBox;
      Label = module.Label;
      Component = module.Component;
      Color = module.Color;
      BlockInputEvents = module.BlockInputEvents;
    }, function (module) {
      readHud = module.readHud;
    }, function (module) {
      applyPlayMode = module.applyPlayMode;
      parameterGroups = module.parameterGroups;
    }, function (module) {
      groupedDamage = module.groupedDamage;
      DAMAGE_GROUPS = module.DAMAGE_GROUPS;
      DAMAGE_SOURCES = module.DAMAGE_SOURCES;
    }, function (module) {
      P0_RULES = module.P0_RULES;
    }, function (module) {
      layoutScreen = module.layoutScreen;
    }, function (module) {
      TuningController = module.TuningController;
    }, function (module) {
      edit = module.edit;
      exportText = module.exportText;
      label = module.label;
      slider = module.slider;
      button = module.button;
      box = module.box;
    }],
    execute: function () {
      exports('mountTuning', mountTuning);
      cclegacy._RF.push({}, "e0168dBxFFD/plfyryTv3uz", "TuningView", undefined);
      /** Owns subscription lifetime without requiring a scene/prefab component. */
      var TuningLifecycle = exports('TuningLifecycle', /*#__PURE__*/function (_Component) {
        _inheritsLoose(TuningLifecycle, _Component);
        function TuningLifecycle() {
          var _this;
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          _this = _Component.call.apply(_Component, [this].concat(args)) || this;
          _this.owner = null;
          return _this;
        }
        var _proto = TuningLifecycle.prototype;
        _proto.update = function update(dt) {
          var _this$owner;
          (_this$owner = this.owner) == null || _this$owner.controller.telemetry.frame(dt);
        };
        _proto.onEnable = function onEnable() {
          var _this$owner2;
          (_this$owner2 = this.owner) == null || _this$owner2.enable();
        };
        _proto.onDisable = function onDisable() {
          var _this$owner3;
          (_this$owner3 = this.owner) == null || _this$owner3.disable();
        };
        _proto.onDestroy = function onDestroy() {
          var _this$owner4;
          (_this$owner4 = this.owner) == null || _this$owner4.destroy();
          this.owner = null;
        };
        return TuningLifecycle;
      }(Component));
      _decorator.ccclass('TuningLifecycle')(TuningLifecycle);
      function mountTuning(ctx) {
        var controller = new TuningController(ctx, sys.localStorage);
        ctx.loop.addSystem(controller);
        var parent = ctx.layers.get('debug');
        // Pure core callers supply opaque layer handles, rather than Cocos nodes.
        if (typeof parent.addChild !== 'function') {
          controller.attach();
          return controller;
        }
        var ui = new TuningView(controller, parent, ctx.layers.get('hud'));
        ui.enable();
        return controller;
      }
      var TuningView = exports('TuningView', /*#__PURE__*/function () {
        // P0 未定义，自选默认值: retained layout coordinates, sizes, typography and palette (design pixels).
        function TuningView(controller, parent, hud) {
          var _this2 = this,
            _pauseOnOpen$children,
            _pauseOnOpen$children2;
          this.controller = void 0;
          this.root = void 0;
          this.hudRoot = void 0;
          this.panel = void 0;
          this.rowsRoot = void 0;
          this.resultRoot = void 0;
          this.transferRoot = void 0;
          this.hudLabel = void 0;
          this.damageLabel = void 0;
          this.statusLabel = void 0;
          this.pageLabel = void 0;
          this.barRoot = void 0;
          this.bars = [];
          this.recentBars = [];
          this.gear = void 0;
          this.pauseOnOpenCaption = void 0;
          this.debugEnabled = typeof DEBUG_TUNING === 'boolean' && DEBUG_TUNING === true || typeof window === 'object' && typeof window.location === 'object' && /(?:^|[?&])debug=1(?:&|$)/.test(window.location.search);
          this.tipFill = void 0;
          this.tipTicks = [];
          this.tipLabel = void 0;
          this.sliders = new Map();
          this.commandFields = new Map();
          this.values = new Map();
          this.editing = new Set();
          this.captions = new Map();
          this.collapsed = new Set();
          this.presetName = null;
          this.transfer = null;
          this.search = '';
          this.page = 0;
          this.registrySignature = '';
          this.lastResult = '';
          this.dismissedResult = '';
          this.status = '';
          this.enabled = false;
          this.destroyed = false;
          this.pausedByPanel = false;
          this.renderTime = 0;
          this.flush = function () {
            _this2.controller.telemetry.flush();
          };
          this.controller = controller;
          this.root = box(parent, 'Tuning', 0, 0, 0, 0);
          this.hudRoot = box(hud, 'TuningHUD', 0, 0, 0, 0);
          this.hudLabel = label(this.hudRoot, '', -30, 23, 600, 50, 10);
          if (this.hudLabel) this.hudLabel.lineHeight = 11;
          this.damageLabel = label(this.hudRoot, '', 0, -42, 670, 16, 9);
          this.barRoot = box(this.hudRoot, 'DamageShare', 0, -20, 0, 0);
          var tipRoot = box(this.hudRoot, 'TipSpeed', -230, -5, 200, 6, new Color(48, 69, 92));
          this.tipFill = box(tipRoot, 'SpeedFill', 0, 0, 1, 6, new Color(230, 150, 70));
          for (var _i = 0, _arr = ['vDead', 'vRef', 'fullCharge']; _i < _arr.length; _i++) {
            var name = _arr[_i];
            this.tipTicks.push(box(tipRoot, name, 0, 0, 1, 10, new Color(240, 240, 240)));
          }
          this.tipLabel = label(this.hudRoot, '', 100, -5, 440, 16, 10);
          for (var i = 0; i < DAMAGE_GROUPS.length; i++) {
            this.bars.push(box(this.barRoot, DAMAGE_GROUPS[i], 0, 0, 1, 8, new Color(70 + i * 19, 190 - i * 11, 100 + i * 16)));
          }
          for (var _i2 = 0; _i2 < DAMAGE_GROUPS.length; _i2++) {
            this.recentBars.push(box(this.barRoot, "Recent" + DAMAGE_GROUPS[_i2], 0, -12, 1, 8, new Color(70 + _i2 * 19, 190 - _i2 * 11, 100 + _i2 * 16)));
          }
          this.gear = button(this.root, '⚙', 310, 590, 60, function () {
            return _this2.togglePanel();
          });
          this.gear.active = this.debugEnabled;
          this.panel = box(this.root, 'TuningPanel', 0, -30, 690, 1110, new Color(27, 35, 48, 253));
          this.panel.addComponent(BlockInputEvents);
          label(this.panel, '调参 / 试玩', -205, 510, 240, 40, 28);
          var pauseOnOpen = button(this.panel, '打开时暂停', 85, 510, 220, function () {
            return _this2.togglePauseOnOpen();
          });
          this.pauseOnOpenCaption = (_pauseOnOpen$children = (_pauseOnOpen$children2 = pauseOnOpen.children.find(function (child) {
            return child.getComponent(Label) !== null;
          })) == null ? void 0 : _pauseOnOpen$children2.getComponent(Label)) != null ? _pauseOnOpen$children : null;
          this.updatePauseOnOpenCaption();
          button(this.panel, '关闭', 275, 510, 100, function () {
            return _this2.togglePanel();
          });
          edit(this.panel, '', '搜索参数、分组、说明', 0, 450, 640, function (value) {
            _this2.search = value;
            _this2.page = 0;
            _this2.rebuildRows();
          }, 44, false, true);
          button(this.panel, '只开拖剑', -165, 394, 310, function () {
            return _this2.playMode(false);
          });
          button(this.panel, '全部机制', 165, 394, 310, function () {
            return _this2.playMode(true);
          });
          this.presetName = edit(this.panel, '', '预设名', -210, 338, 220, function () {});
          button(this.panel, '保存', -30, 338, 110, function () {
            return _this2.action(function () {
              var _this2$presetName$str, _this2$presetName;
              var ok = controller.presets.save((_this2$presetName$str = (_this2$presetName = _this2.presetName) == null ? void 0 : _this2$presetName.string) != null ? _this2$presetName$str : '');
              return ok ? '预设已保存；刷新后可加载' : controller.presets.store.error;
            });
          });
          button(this.panel, '加载', 95, 338, 110, function () {
            return _this2.action(function () {
              var _this2$presetName$str2, _this2$presetName2;
              var message = controller.presets.load((_this2$presetName$str2 = (_this2$presetName2 = _this2.presetName) == null ? void 0 : _this2$presetName2.string) != null ? _this2$presetName$str2 : '');
              _this2.rebuildRows();
              return message;
            });
          });
          button(this.panel, '切换', 220, 338, 110, function () {
            var names = controller.presets.names();
            if (!_this2.presetName || names.length === 0) {
              _this2.status = '暂无已保存预设';
              return;
            }
            var i = names.indexOf(_this2.presetName.string);
            _this2.presetName.string = names[(i + 1) % names.length];
            _this2.status = "\u9884\u8BBE " + (i + 2 > names.length ? 1 : i + 2) + "/" + names.length + "\uFF1B\u70B9\u52A0\u8F7D\u5E94\u7528";
          });
          button(this.panel, '导出 JSON', -215, 282, 200, function () {
            return _this2.showTransfer(controller.presets.exportJson(), false);
          });
          button(this.panel, '导入 JSON', 0, 282, 200, function () {
            return _this2.showTransfer('', true);
          });
          button(this.panel, '导出埋点', 215, 282, 200, function () {
            return _this2.showTransfer(controller.telemetry.exportJsonLines(), false, true);
          });
          button(this.panel, '调试重开', -215, 226, 200, function () {
            return controller.command('restart');
          });
          button(this.panel, '填满剑意', 0, 226, 200, function () {
            return controller.command('fillJianyi');
          });
          button(this.panel, '清空敌人', 215, 226, 200, function () {
            return controller.command('clearEnemies');
          });
          this.commandField('tuning.chainArg', '链剑数', -265);
          button(this.panel, '设链剑', -140, 170, 130, function () {
            return _this2.numericCommand('setChain', String(controller.ctx.tunables.get('tuning.chainArg')));
          });
          this.commandField('tuning.speedArg', '剑尖速度', 65);
          button(this.panel, '设速度', 205, 170, 150, function () {
            return _this2.numericCommand('forceVtip', String(controller.ctx.tunables.get('tuning.speedArg')));
          });
          button(this.panel, '刷怪种类', -215, 114, 200, function () {
            var t = controller.ctx.tunables;
            t.set('tuning.spawnKind', (t.get('tuning.spawnKind') + 1) % 3);
            _this2.status = "\u5237\u602A\u79CD\u7C7B\uFF1A" + ['blob', 'sheep', 'boar'][t.get('tuning.spawnKind')];
          });
          button(this.panel, '生成怪物', 0, 114, 200, function () {
            return controller.command('spawn', ['blob', 'sheep', 'boar'][controller.ctx.tunables.get('tuning.spawnKind')] + ' ' + Math.floor(controller.ctx.tunables.get('tuning.spawnCount')));
          });
          button(this.panel, '恢复默认', 215, 114, 200, function () {
            controller.ctx.tunables.resetAll();
            _this2.status = '已恢复默认；标 * 项需重开';
            _this2.rebuildRows();
          });
          button(this.panel, '删除预设', -240, 64, 150, function () {
            return _this2.action(function () {
              var _this2$presetName$str3, _this2$presetName3;
              return controller.presets["delete"]((_this2$presetName$str3 = (_this2$presetName3 = _this2.presetName) == null ? void 0 : _this2$presetName3.string) != null ? _this2$presetName$str3 : '') ? '预设已删除' : controller.presets.store.error;
            });
          });
          button(this.panel, '清空埋点', -80, 64, 150, function () {
            controller.telemetry.clear();
            _this2.status = '埋点已清空；下局重新记录';
          });
          button(this.panel, '刷20只羊', 80, 64, 150, function () {
            return controller.command('spawn', "sheep " + P0_RULES.sheepShortcut);
          });
          var _loop = function _loop() {
            var n = P0_RULES.chainShortcuts[_i3];
            button(_this2.panel, "N=" + n, 190 + _i3 * 52, 64, 48, function () {
              return controller.command('setChain', String(n));
            });
          };
          for (var _i3 = 0; _i3 < P0_RULES.chainShortcuts.length; _i3++) {
            _loop();
          }
          this.rowsRoot = box(this.panel, 'Parameters', 0, 0, 0, 0);
          button(this.panel, '上一页', -215, -410, 190, function () {
            _this2.page -= 1;
            _this2.rebuildRows();
          });
          button(this.panel, '下一页', 215, -410, 190, function () {
            _this2.page += 1;
            _this2.rebuildRows();
          });
          this.pageLabel = label(this.panel, '', 0, -410, 220);
          this.statusLabel = label(this.panel, '', 0, -492, 640, 100, 18);
          this.transferRoot = box(this.panel, 'JsonTransfer', 0, -150, 670, 740, new Color(27, 35, 48));
          label(this.transferRoot, 'JSON 传输 · 可选择复制 / 粘贴', 0, 320, 620);
          this.transfer = edit(this.transferRoot, '', '粘贴完整 JSON', 0, 30, 620, function () {}, 510, true);
          button(this.transferRoot, '应用导入', -160, -300, 280, function () {
            return _this2.action(function () {
              var _this2$transfer$strin, _this2$transfer;
              var message = controller.presets.importJson((_this2$transfer$strin = (_this2$transfer = _this2.transfer) == null ? void 0 : _this2$transfer.string) != null ? _this2$transfer$strin : '');
              _this2.transferRoot.active = false;
              _this2.rebuildRows();
              return message;
            });
          });
          button(this.transferRoot, '返回', 160, -300, 280, function () {
            _this2.transferRoot.active = false;
          });
          this.transferRoot.active = false;
          this.resultRoot = box(this.root, 'Result', 0, 0, 680, 840, new Color(27, 35, 48, 253));
          this.resultRoot.addComponent(BlockInputEvents);
          this.resultRoot.active = false;
          this.hudRoot.active = false;
          this.panel.active = false;
          var lifecycle = this.root.addComponent(TuningLifecycle);
          if (lifecycle) lifecycle.owner = this;
          this.rebuildRows();
          this.resize();
        }
        var _proto2 = TuningView.prototype;
        _proto2.enable = function enable() {
          var _this3 = this;
          if (this.enabled || this.destroyed) return;
          this.enabled = true;
          this.hudRoot.active = false;
          this.controller.attach();
          this.controller.setView(function () {
            return _this3.render();
          });
          view.on('canvas-resize', this.resize, this);
          if (typeof window !== 'undefined') window.addEventListener('pagehide', this.flush);
          this.syncPanelPause();
          this.resize();
        };
        _proto2.disable = function disable() {
          if (!this.enabled) return;
          this.enabled = false;
          view.off('canvas-resize', this.resize, this);
          if (typeof window !== 'undefined') window.removeEventListener('pagehide', this.flush);
          this.releasePanelPause();
          this.controller.detach();
          this.controller.setView(null);
          this.hudRoot.active = false;
        };
        _proto2.destroy = function destroy() {
          if (this.destroyed) return;
          this.disable();
          this.destroyed = true;
          this.hudRoot.destroy();
        };
        _proto2.resize = function resize() {
          var size = view.getVisibleSize();
          var scale = Math.min(size.width / 720, size.height / 1280);
          this.root.setScale(scale, scale, 1);
          this.hudRoot.setScale(scale, scale, 1);
          var safe = sys.getSafeAreaRect();
          var windowSize = screen.windowSize;
          var sx = windowSize.width > 0 ? size.width / windowSize.width : 1;
          var sy = windowSize.height > 0 ? size.height / windowSize.height : 1;
          var strip = layoutScreen(size.width, size.height, {
            x: safe.x * sx,
            y: safe.y * sy,
            width: safe.width * sx,
            height: safe.height * sy
          }).hud;
          // The gear remains at least 44 visible pixels, outside the arena.
          this.gear.setScale(Math.max(1, 44 / (60 * scale)), Math.max(1, 44 / (44 * scale)), 1);
          this.hudRoot.setPosition(strip.x + strip.width / 2 - size.width / 2, strip.y + strip.height / 2 - size.height / 2, 0);
          this.gear.setPosition((strip.x + strip.width - 30 - size.width / 2) / scale, (strip.y + strip.height / 2 - size.height / 2) / scale, 0);
        };
        _proto2.togglePanel = function togglePanel() {
          this.panel.active = !this.panel.active;
          if (this.panel.active) {
            this.resultRoot.active = false;
            this.rebuildRows();
          } else if (this.controller.telemetry.result && this.controller.telemetry.result.sid !== this.dismissedResult) this.resultRoot.active = true;
          this.syncPanelPause();
        };
        _proto2.togglePauseOnOpen = function togglePauseOnOpen() {
          var tunables = this.controller.ctx.tunables;
          tunables.set('tuning.pauseOnOpen', tunables.getBool('tuning.pauseOnOpen') ? 0 : 1);
          this.updatePauseOnOpenCaption();
          this.syncPanelPause();
        };
        _proto2.updatePauseOnOpenCaption = function updatePauseOnOpenCaption() {
          if (this.pauseOnOpenCaption) {
            this.pauseOnOpenCaption.string = this.controller.ctx.tunables.getBool('tuning.pauseOnOpen') ? '打开时暂停：开 ✓' : '打开时暂停：关';
          }
        };
        _proto2.syncPanelPause = function syncPanelPause() {
          var loop = this.controller.ctx.loop;
          if (this.panel.active && this.controller.ctx.tunables.getBool('tuning.pauseOnOpen')) {
            if (!loop.paused) {
              loop.pause();
              this.pausedByPanel = true;
            }
            return;
          }
          this.releasePanelPause();
        };
        _proto2.releasePanelPause = function releasePanelPause() {
          if (!this.pausedByPanel) return;
          this.controller.ctx.loop.resume();
          this.pausedByPanel = false;
        };
        _proto2.action = function action(fn) {
          try {
            this.status = fn();
          } catch (error) {
            this.status = error instanceof Error ? error.message : '操作失败';
          }
        };
        _proto2.commandField = function commandField(key, hint, x) {
          var _this4 = this;
          var input = edit(this.panel, String(this.controller.ctx.tunables.get(key)), hint, x, 170, 105, function (v) {
            return _this4.setCommandArg(key, v);
          });
          if (!input) return;
          this.commandFields.set(key, input);
          input.node.on(EditBox.EventType.EDITING_DID_BEGAN, function () {
            return _this4.editing.add(key);
          });
          input.node.on(EditBox.EventType.EDITING_DID_ENDED, function () {
            return _this4.editing["delete"](key);
          });
        };
        _proto2.setCommandArg = function setCommandArg(key, text) {
          var n = Number(text);
          if (!text.trim() || !Number.isFinite(n) || n < 0) {
            this.status = '请输入非负有限数值';
            return;
          }
          this.controller.ctx.tunables.set(key, key === 'tuning.chainArg' ? Math.floor(n) : n);
        };
        _proto2.numericCommand = function numericCommand(cmd, text) {
          var value = Number(text);
          if (!text.trim() || !Number.isFinite(value) || value < 0) {
            this.status = '请输入非负有限数值';
            return;
          }
          this.controller.command(cmd, String(cmd === 'setChain' ? Math.floor(value) : value));
        };
        _proto2.playMode = function playMode(all) {
          var keys = applyPlayMode(this.controller.ctx.tunables, all);
          this.status = keys.length > 0 ? "\u5DF2\u5207\u6362 " + keys.length + " \u4E2A\u673A\u5236\u5F00\u5173\uFF1B\u6807 * \u9879\u9700\u91CD\u5F00" : '玩法模块尚未注册 mech.chain / mech.throw / mech.loop';
          this.rebuildRows();
        };
        _proto2.showTransfer = function showTransfer(text, importing, logs) {
          var _this5 = this;
          if (logs === void 0) {
            logs = false;
          }
          this.transferRoot.active = true;
          if (this.transfer) this.transfer.string = text;
          if (importing) {
            this.status = '粘贴完整 JSON 后点应用导入';
            return;
          }
          void exportText(text, logs ? "p0_telemetry_" + new Date().toISOString().slice(0, 10) + ".jsonl" : 'preset.json', logs ? 'application/x-ndjson' : 'application/json').then(function (message) {
            _this5.status = message;
          });
        };
        _proto2.rebuildRows = function rebuildRows() {
          var _this6 = this;
          for (var _i4 = 0, _arr2 = [].concat(this.rowsRoot.children); _i4 < _arr2.length; _i4++) {
            var node = _arr2[_i4];
            node.removeFromParent();
            node.destroy();
          }
          this.values.clear();
          this.sliders.clear();
          this.editing.clear();
          this.captions.clear();
          var rows = [];
          var groups = parameterGroups(this.controller.ctx.tunables, this.search, this.collapsed);
          for (var _iterator = _createForOfIteratorHelperLoose(groups), _step; !(_step = _iterator()).done;) {
            var group = _step.value;
            rows.push({
              group: group.name,
              collapsed: group.collapsed
            });
            if (!group.collapsed) {
              for (var _iterator2 = _createForOfIteratorHelperLoose(group.defs), _step2; !(_step2 = _iterator2()).done;) {
                var def = _step2.value;
                rows.push({
                  def: def
                });
              }
            }
          }
          var rowsPerPage = Math.floor(this.controller.ctx.tunables.get('tuning.pageRows'));
          var pages = Math.max(1, Math.ceil(rows.length / rowsPerPage));
          this.page = Math.max(0, Math.min(pages - 1, this.page));
          if (this.pageLabel) this.pageLabel.string = this.page + 1 + " / " + pages;
          var _loop2 = function _loop2() {
            var row = rows[_this6.page * rowsPerPage + i];
            if (!row) return 1; // break
            var y = 10 - i * (408 / rowsPerPage);
            if ('group' in row) {
              button(_this6.rowsRoot, (row.collapsed ? '▸' : '▾') + " " + row.group, 0, y, 640, function () {
                if (_this6.collapsed.has(row.group)) _this6.collapsed["delete"](row.group);else _this6.collapsed.add(row.group);
                _this6.rebuildRows();
              });
            } else _this6.parameter(row.def, y);
          };
          for (var i = 0; i < rowsPerPage; i++) {
            if (_loop2()) break;
          }
          if (rows.length === 0) label(this.rowsRoot, '没有匹配的参数', 0, -100, 640);
        };
        _proto2.parameter = function parameter(def, y) {
          var _def$min,
            _def$max,
            _def$note,
            _this7 = this;
          var t = this.controller.ctx.tunables;
          var value = t.get(def.key);
          label(this.rowsRoot, "" + def.label + (def.restart ? ' 重开生效' : ''), -175, y + 11, 285, 28, 19);
          var range = def.kind === 'number' ? " [" + ((_def$min = def.min) != null ? _def$min : '—') + ", " + ((_def$max = def.max) != null ? _def$max : '—') + "]" : '';
          label(this.rowsRoot, "" + def.key + range + " " + ((_def$note = def.note) != null ? _def$note : ''), -175, y - 19, 285, 27, 13);
          if (def.kind === 'number') {
            var input = edit(this.rowsRoot, String(value), def.label, 125, y + 10, 145, function (text) {
              var number = Number(text);
              if (!text.trim() || !Number.isFinite(number)) _this7.status = '请输入有限数字';else t.set(def.key, number);
              if (input) input.string = String(t.get(def.key));
            }, 28);
            if (input) {
              this.values.set(def.key, input);
              input.node.on(EditBox.EventType.EDITING_DID_BEGAN, function () {
                return _this7.editing.add(def.key);
              });
              input.node.on(EditBox.EventType.EDITING_DID_ENDED, function () {
                return _this7.editing["delete"](def.key);
              });
            }
            // Unbounded rows have numeric input; no arbitrary gameplay range.
            if (def.min !== undefined && def.max !== undefined && def.max > def.min) {
              var min = def.min;
              var max = def.max;
              var control = slider(this.rowsRoot, "Slider:" + def.key, 125, y - 18, 145, (value - min) / (max - min), function (p) {
                var raw = min + p * (max - min);
                t.set(def.key, def.step ? min + Math.round((raw - min) / def.step) * def.step : raw);
              });
              if (control) this.sliders.set(def.key, control);
            }
            button(this.rowsRoot, '默认', 270, y, 84, function () {
              return t.set(def.key, def["default"]);
            });
          } else if (def.kind === 'bool') {
            var _node$children$find;
            var node = button(this.rowsRoot, '', 180, y, 260, function () {
              t.set(def.key, 1 - t.get(def.key));
              if (def.key === 'tuning.pauseOnOpen') {
                _this7.updatePauseOnOpenCaption();
                _this7.syncPanelPause();
              }
            });
            var caption = (_node$children$find = node.children.find(function (child) {
              return child.getComponent(Label) !== null;
            })) == null ? void 0 : _node$children$find.getComponent(Label);
            if (caption) this.captions.set(def.key, caption);
          } else {
            var _def$options;
            var options = (_def$options = def.options) != null ? _def$options : [];
            var width = 260 / Math.max(1, options.length);
            var _loop3 = function _loop3(i) {
              var _node$children$find2;
              var node = button(_this7.rowsRoot, options[i], 50 + width * (i + 0.5), y, width, function () {
                t.set(def.key, i);
                _this7.rebuildRows();
              });
              var caption = (_node$children$find2 = node.children.find(function (child) {
                return child.getComponent(Label) !== null;
              })) == null ? void 0 : _node$children$find2.getComponent(Label);
              if (caption) _this7.captions.set(def.key + ":" + i, caption);
            };
            for (var i = 0; i < options.length; i++) {
              _loop3(i);
            }
          }
        };
        _proto2.render = function render() {
          var _data$vTip,
            _data$vTip2,
            _this8 = this;
          // Rendering is driven even during hit-stop. Throttle text and node work.
          var ctx = this.controller.ctx;
          var combatHud = ctx.services.has('run') === false || ctx.services.get('run').combatActive;
          this.gear.active = this.debugEnabled && combatHud;
          if (this.debugEnabled === false || combatHud === false) {
            this.hudRoot.active = false;
            this.resultRoot.active = false;
          }
          if (combatHud === false) {
            this.panel.active = false;
            this.releasePanelPause();
          }
          var now = Date.now();
          if (now - this.renderTime < this.controller.ctx.tunables.get('tuning.refresh') * 1000) return;
          this.renderTime = now;
          var data = readHud(ctx);
          var fps = this.controller.telemetry.fps();
          var vtipPercentiles = this.controller.telemetry.vtipPercentiles();
          var fmt = function fmt(v) {
            return v === null ? '—' : typeof v === 'number' ? String(Math.round(v * 100) / 100) : String(v);
          };
          this.hudRoot.active = this.debugEnabled && combatHud && ctx.tunables.getBool('tuning.hud') && this.panel.active === false && this.resultRoot.active === false;
          if (this.hudLabel) this.hudLabel.string = ["seed " + data.seed + " \xB7 #" + data.paramsHash + " \xB7 " + (this.controller.telemetry.debugRestart ? '调试局（不计统计）' : '正常局'), "FPS " + fmt(fps.fpsAvg) + " / 5s\u4F4E " + fmt(fps.fpsMin) + " \xB7 \u65F6\u95F4 " + fmt(data.elapsed) + "  \u5371\u9669 " + fmt(data.danger) + "  \u654C\u4EBA " + fmt(data.alive) + "  HP " + integer(data.hp) + "/" + integer(data.maxHp), "vTip " + fmt(data.vTip) + " p50 " + fmt(vtipPercentiles.p50) + " p90 " + fmt(vtipPercentiles.p90) + " \u6EE1\u5145 " + fmt(data.fullCharge) + "  N " + fmt(data.N) + " \u69FD " + fmt(data.slots) + " \u7EF3 " + fmt(data.ropeLength), "\u5251\u610F " + fmt(data.jianyi) + "  \u8FDE\u51FB " + fmt(data.combo) + "  \u58A8\u91CF " + fmt(data.ink) + "  \u5251\u9635\u5269\u4F59 " + fmt(data.arrayRemaining)].join('\n');
          var thresholds = [data.vDead, data.vRef, data.fullChargeSpeed];
          var maxTip = Math.max.apply(null, [(_data$vTip = data.vTip) != null ? _data$vTip : 0].concat(thresholds.map(function (v) {
            return v != null ? v : 0;
          })));
          var speedWidth = maxTip > 0 ? 200 * ((_data$vTip2 = data.vTip) != null ? _data$vTip2 : 0) / maxTip : 0;
          this.tipFill.active = speedWidth > 0;
          this.tipFill.setScale(speedWidth, 1, 1);
          this.tipFill.setPosition(-100 + speedWidth / 2, 0, 0);
          for (var i = 0; i < thresholds.length; i++) {
            var tick = this.tipTicks[i];
            var threshold = thresholds[i];
            if (tick) {
              tick.active = threshold !== null && maxTip > 0;
              tick.setPosition(-100 + (maxTip > 0 ? 200 * (threshold != null ? threshold : 0) / maxTip : 0), 0, 0);
            }
          }
          if (this.tipLabel) this.tipLabel.string = "vDead " + fmt(data.vDead) + " / vRef " + fmt(data.vRef) + " / \u7529\u6EE1 " + fmt(data.fullChargeSpeed);
          var damage = this.controller.telemetry.damage();
          var groups = groupedDamage(damage);
          var recent = groupedDamage(this.controller.telemetry.damage(true));
          var total = groups.reduce(function (sum, d) {
            return sum + d;
          }, 0);
          var paint = function paint(bars, values, y) {
            var sum = values.reduce(function (s, d) {
              return s + d;
            }, 0);
            var x = -330;
            for (var _i5 = 0; _i5 < values.length; _i5++) {
              var width = sum > 0 ? 660 * values[_i5] / sum : 0;
              var bar = bars[_i5];
              if (bar) {
                bar.active = width > 0;
                bar.setScale(width, 1, 1);
                bar.setPosition(x + width / 2, y, 0);
              }
              x += width;
            }
          };
          paint(this.bars, groups, 0);
          paint(this.recentBars, recent, -12);
          if (this.damageLabel) this.damageLabel.string = "\u7D2F\u8BA1 " + fmt(total) + " / \u6700\u8FD130\u79D2 " + fmt(recent.reduce(function (s, d) {
            return s + d;
          }, 0)) + " \xB7 " + DAMAGE_GROUPS.map(function (key, i) {
            return key + " " + (total > 0 ? (100 * groups[i] / total).toFixed(1) : '0') + "%";
          }).join(' / ');
          var defs = ctx.tunables.all();
          var signature = JSON.stringify(defs) + ':' + ctx.tunables.get('tuning.pageRows');
          if (signature !== this.registrySignature) {
            this.registrySignature = signature;
            this.rebuildRows();
          }
          if (this.panel.active) {
            this.updatePauseOnOpenCaption();
            for (var _i6 = 0, _Array$from = Array.from(this.commandFields.entries()); _i6 < _Array$from.length; _i6++) {
              var _Array$from$_i = _Array$from[_i6],
                key = _Array$from$_i[0],
                input = _Array$from$_i[1];
              if (!this.editing.has(key)) input.string = String(ctx.tunables.get(key));
            }
            for (var _iterator3 = _createForOfIteratorHelperLoose(defs), _step3; !(_step3 = _iterator3()).done;) {
              var _def$options$ctx$tuna, _def$options3;
              var def = _step3.value;
              var control = this.sliders.get(def.key);
              if (control && def.min !== undefined && def.max !== undefined && def.max > def.min) control.progress = (ctx.tunables.get(def.key) - def.min) / (def.max - def.min);
              var _input = this.values.get(def.key);
              if (_input && !this.editing.has(def.key)) _input.string = String(ctx.tunables.get(def.key));
              if (def.kind === 'enum') {
                var _def$options2;
                var options = (_def$options2 = def.options) != null ? _def$options2 : [];
                for (var _i7 = 0; _i7 < options.length; _i7++) {
                  var segment = this.captions.get(def.key + ":" + _i7);
                  if (segment) segment.string = options[_i7] + (ctx.tunables.get(def.key) === _i7 ? ' ✓' : '');
                }
              }
              var caption = this.captions.get(def.key);
              if (caption) caption.string = def.kind === 'bool' ? ctx.tunables.getBool(def.key) ? '开 ✓' : '关' : (_def$options$ctx$tuna = (_def$options3 = def.options) == null ? void 0 : _def$options3[ctx.tunables.get(def.key)]) != null ? _def$options$ctx$tuna : '—';
            }
          }
          if (this.statusLabel) this.statusLabel.string = this.status + "\n#" + ctx.tunables.hash() + " \xB7 " + defs.length + " \u53C2\u6570\n" + (this.controller.presets.store.error || this.controller.telemetry.store.error);
          var result = this.controller.telemetry.result;
          if (result === null || this.debugEnabled === false || combatHud === false) {
            this.resultRoot.active = false;
            this.lastResult = '';
            return;
          }
          if (result.sid !== this.lastResult && result.sid !== this.dismissedResult) {
            this.lastResult = result.sid;
            this.panel.active = false;
            this.syncPanelPause();
            this.resultRoot.active = true;
            for (var _i8 = 0, _arr3 = [].concat(this.resultRoot.children); _i8 < _arr3.length; _i8++) {
              var node = _arr3[_i8];
              node.removeFromParent();
              node.destroy();
            }
            label(this.resultRoot, result.debugRestart ? '调试局结束 · 不计统计' : '本局结束', 0, 350, 620, 50, 30);
            var totalStats = this.controller.telemetry.totals();
            label(this.resultRoot, ["seed " + ctx.session.seed + " \xB7 #" + result.paramsHash + " \xB7 " + result.reason, "\u65F6\u957F " + result.duration.toFixed(2) + " \u79D2 \xB7 \u51FB\u6740 " + result.kills + " \xB7 \u603B\u4F24\u5BB3 " + result.totalDamage.toFixed(2), "\u95ED\u5408\u5708 " + result.loops.length + " \xB7 \u5B8C\u7F8E\u63A5\u5251 " + result.perfectCatches + " \xB7 \u65AD\u94FE " + result.chainBreaks].concat(DAMAGE_SOURCES.map(function (key) {
              return key + ": " + result.damage[key].toFixed(2) + " (" + (100 * result.shares[key]).toFixed(1) + "%)";
            }), ["\u6709\u6548\u5C40 " + totalStats.sessions + " \xB7 \u7D2F\u8BA1\u51FB\u6740 " + totalStats.kills + " \xB7 \u7D2F\u8BA1\u4F24\u5BB3 " + totalStats.damage.toFixed(2)]).join('\n'), 0, 30, 620, 510, 22);
            // Equal size and weight: neither next action is promoted over the other.
            button(this.resultRoot, '再来一局', -160, -340, 290, function () {
              return _this8.controller.retry();
            });
            button(this.resultRoot, '结束', 160, -340, 290, function () {
              _this8.controller.quit();
              _this8.dismissedResult = result.sid;
              _this8.resultRoot.active = false;
            });
          }
        };
        return TuningView;
      }());
      function integer(value) {
        return value === null ? '—' : String(Math.round(value));
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/TypedEventBus.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "4f6a3X/SatMcqH51xbhsKqa", "TypedEventBus", undefined);
      /**
       * Type-safe pub/sub. `on` returns an unsubscribe function; components must
       * call it from `onDisable` / `onDestroy`.
       * A throwing listener is logged and does not stop the rest of the fan-out.
       */
      var TypedEventBus = exports('TypedEventBus', /*#__PURE__*/function () {
        function TypedEventBus() {
          this.listeners = new Map();
        }
        var _proto = TypedEventBus.prototype;
        _proto.on = function on(name, cb) {
          var set = this.listeners.get(name);
          if (!set) {
            set = new Set();
            this.listeners.set(name, set);
          }
          var handler = cb;
          set.add(handler);
          return function () {
            set["delete"](handler);
          };
        };
        _proto.off = function off(name, cb) {
          var set = this.listeners.get(name);
          if (!set) return;
          set["delete"](cb);
        };
        _proto.emit = function emit(name, payload) {
          var set = this.listeners.get(name);
          if (!set || set.size === 0) return;
          // Array.from, not [...set]: Cocos 3.8 compiles spreads in Babel loose mode
          // ([].concat(set)), which does not unpack a Set.
          var snapshot = Array.from(set);
          for (var _i = 0, _snapshot = snapshot; _i < _snapshot.length; _i++) {
            var cb = _snapshot[_i];
            try {
              cb(payload);
            } catch (err) {
              console.error("[events] listener for \"" + name + "\" threw", err);
            }
          }
        };
        _proto.listenerCount = function listenerCount(name) {
          var _this$listeners$get$s, _this$listeners$get;
          return (_this$listeners$get$s = (_this$listeners$get = this.listeners.get(name)) == null ? void 0 : _this$listeners$get.size) != null ? _this$listeners$get$s : 0;
        };
        _proto.clear = function clear() {
          this.listeners.clear();
        };
        return TypedEventBus;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/UpgradeCatalog.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "aca1fgte2dKzoMDJjIg9H+g", "UpgradeCatalog", undefined);
      /**
       * GDD §7.5 numeric pool. MVP keeps common and rare only; epic and legendary
       * are intentionally absent (P1-tasks P1-03).
       */
      var UPGRADE_CATALOG = exports('UPGRADE_CATALOG', [{
        id: 'dmgAll',
        modifierKey: 'dmg.all',
        values: {
          common: 'upgrade.dmgAllCommon',
          rare: 'upgrade.dmgAllRare'
        }
      }, {
        id: 'moveSpeed',
        modifierKey: 'pet.speed',
        values: {
          common: 'upgrade.moveSpeedCommon',
          rare: 'upgrade.moveSpeedRare'
        }
      }, {
        id: 'ropeLength',
        modifierKey: 'rope.baseLen',
        normalizeByBase: true,
        values: {
          common: 'upgrade.ropeLengthCommon',
          rare: 'upgrade.ropeLengthRare'
        }
      }, {
        id: 'chainCapacity',
        modifierKey: 'chain.maxCount',
        normalizeByBase: true,
        values: {
          rare: 'upgrade.chainCapacityRare'
        }
      }, {
        id: 'ink',
        modifierKey: 'loop.inkBase',
        values: {
          common: 'upgrade.inkCommon',
          rare: 'upgrade.inkRare'
        }
      }, {
        id: 'catchRange',
        modifierKey: 'throw.catchRadius',
        values: {
          common: 'upgrade.catchRangeCommon',
          rare: 'upgrade.catchRangeRare'
        }
      }, {
        id: 'maxHp',
        modifierKey: 'pet.maxHp',
        normalizeByBase: true,
        values: {
          common: 'upgrade.maxHpCommon',
          rare: 'upgrade.maxHpRare'
        }
      }, {
        id: 'jianyiGain',
        modifierKey: 'jianyi.globalMul',
        values: {
          common: 'upgrade.jianyiGainCommon',
          rare: 'upgrade.jianyiGainRare'
        }
      }, {
        id: 'pickupRange',
        modifierKey: 'loot.pickupRadius',
        values: {
          common: 'upgrade.pickupRangeCommon',
          rare: 'upgrade.pickupRangeRare'
        }
      }, {
        id: 'whipThreshold',
        modifierKey: 'whip.turnDeg',
        normalizeByBase: true,
        values: {
          rare: 'upgrade.whipThresholdRare'
        }
      }]);
      /**
       * The twelve P1 items selected in P1-tasks Q8. Only white and green entries
       * exist in the MVP shelf; effects and quality changes belong to P1-06.
       */
      var SHELF_CATALOG = exports('SHELF_CATALOG', [{
        id: 'whetstone',
        rarity: 'white',
        stacking: 'L'
      }, {
        id: 'ironWeight',
        rarity: 'white',
        stacking: 'L'
      }, {
        id: 'firecracker',
        rarity: 'green',
        stacking: 'L'
      }, {
        id: 'knot',
        rarity: 'white',
        stacking: 'L'
      }, {
        id: 'snakeSlough',
        rarity: 'green',
        stacking: 'L'
      }, {
        id: 'resonanceBell',
        rarity: 'green',
        stacking: 'L'
      }, {
        id: 'slingBracer',
        rarity: 'white',
        stacking: 'L'
      }, {
        id: 'returnBracer',
        rarity: 'green',
        stacking: 'H'
      }, {
        id: 'ricochetSpring',
        rarity: 'green',
        stacking: 'L'
      }, {
        id: 'inkPot',
        rarity: 'white',
        stacking: 'L'
      }, {
        id: 'swordTassel',
        rarity: 'green',
        stacking: 'L'
      }, {
        id: 'foodCan',
        rarity: 'white',
        stacking: 'L'
      }]);
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/UpgradeController.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './ModifierStore.ts', './UpgradeCatalog.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, _extends, _createClass, cclegacy, ModifierStore, UPGRADE_CATALOG, SHELF_CATALOG;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _extends = module.extends;
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      ModifierStore = module.ModifierStore;
    }, function (module) {
      UPGRADE_CATALOG = module.UPGRADE_CATALOG;
      SHELF_CATALOG = module.SHELF_CATALOG;
    }],
    execute: function () {
      cclegacy._RF.push({}, "e7c97aOZ2JPgZavFq031JcJ", "UpgradeController", undefined);
      var OFFER_COUNT = 3;
      var MAX_PICKS_FALLBACK = 3;
      var TIERS = ['common', 'rare'];

      /**
       * Pure pick-3 state. The later UI calls choose/reroll on this controller;
       * the public core service remains the read-only IUpgradeInfo contract.
       */
      var UpgradeController = exports('UpgradeController', /*#__PURE__*/function () {
        function UpgradeController(ctx) {
          this.modifiers = void 0;
          this.ctx = void 0;
          this.owned = [];
          this.unsubs = [];
          this.choicesValue = [];
          this.activeValue = false;
          this.picksValue = 0;
          this.resolvedValue = 0;
          this.rerollsValue = 0;
          this.pausedHere = false;
          this.resolving = false;
          this.ctx = ctx;
          this.modifiers = new ModifierStore(ctx);
          this.attach();
        }
        var _proto = UpgradeController.prototype;
        _proto.stacks = function stacks(id) {
          var _item$stacks;
          var item = this.owned.find(function (candidate) {
            return candidate.id === id;
          });
          return (_item$stacks = item == null ? void 0 : item.stacks) != null ? _item$stacks : 0;
        }

        /**
         * GDD §7.3 / P1-tasks P1-06: normalize the MVP's 70/25 white/green
         * weights after red and purple are removed.
         */;
        _proto.drawShelf = function drawShelf(count, exclude) {
          var target = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
          var blocked = new Set();
          for (var _iterator = _createForOfIteratorHelperLoose(exclude), _step; !(_step = _iterator()).done;) {
            var id = _step.value;
            blocked.add(id);
          }
          var result = [];
          while (result.length < target) {
            var white = this.shelfPool('white', blocked);
            var green = this.shelfPool('green', blocked);
            if (white.length === 0 && green.length === 0) break;
            var whiteWeight = white.length > 0 ? Math.max(0, this.param('upgrade.shelfWhiteWeight')) : 0;
            var greenWeight = green.length > 0 ? Math.max(0, this.param('upgrade.shelfGreenWeight')) : 0;
            var pool = this.roll(whiteWeight, greenWeight) === 0 ? white : green;
            var fallback = pool.length > 0 ? pool : white.length > 0 ? white : green;
            var picked = fallback[this.ctx.rng.shop.nextInt(fallback.length)];
            if (!picked) break;
            blocked.add(picked.id);
            result.push({
              id: picked.id,
              rarity: picked.rarity,
              basePrice: this.param(picked.rarity === 'white' ? 'upgrade.shelfWhitePrice' : 'upgrade.shelfGreenPrice')
            });
          }
          return result;
        }

        /** Start the wave-end choices. Returns false while another set is active. */;
        _proto.beginLevelUp = function beginLevelUp() {
          if (this.activeValue || !this.inUpgradePhase() || !this.ctx.services.has('loot')) return false;
          var loot = this.ctx.services.get('loot');
          var limit = this.ctx.tunables.has('xp.maxPicksPerWave') ? Math.max(0, Math.floor(this.ctx.tunables.get('xp.maxPicksPerWave'))) : MAX_PICKS_FALLBACK;
          var picks = Math.min(Math.max(0, Math.floor(loot.pendingPicks)), limit);
          if (picks <= 0) {
            this.emitDone(0);
            return false;
          }
          this.activeValue = true;
          this.picksValue = picks;
          this.resolvedValue = 0;
          this.rerollsValue = 0;
          if (!this.ctx.loop.paused) {
            this.ctx.loop.pause();
            this.pausedHere = true;
          }
          this.emitOffer();
          return true;
        }

        /** Resolve the currently displayed id. Stale or duplicate input is ignored. */;
        _proto.choose = function choose(id) {
          if (!this.activeValue || this.resolving) return false;
          var choice = this.choicesValue.find(function (candidate) {
            return candidate.id === id;
          });
          if (!choice) return false;
          var definition = UPGRADE_CATALOG.find(function (candidate) {
            return candidate.id === choice.id;
          });
          if (!definition) return false;
          this.resolving = true;
          this.choicesValue = [];
          this.modifiers.increase(definition.modifierKey, this.modifierValue(definition, choice.value));
          var pick = this.resolvedValue + 1;
          this.resolvedValue = pick;
          this.ctx.services.get('loot').consumePick();
          this.ctx.events.emit('upgrade:chosen', {
            source: 'levelUp',
            pick: pick,
            picks: this.picksValue,
            choice: _extends({}, choice)
          });
          if (!this.activeValue) ;else if (this.resolvedValue >= this.picksValue) {
            this.finish();
          } else {
            this.emitOffer();
          }
          this.resolving = false;
          return true;
        }

        /** Spend copper before consuming any RNG. */;
        _proto.reroll = function reroll() {
          if (!this.activeValue || this.resolving) return false;
          this.resolving = true;
          var cost = this.rerollCost;
          var loot = this.ctx.services.get('loot');
          if (!loot.spendCoins(cost, 'upgradeReroll')) {
            this.resolving = false;
            return false;
          }
          this.rerollsValue += 1;
          if (this.activeValue) this.emitOffer();
          this.resolving = false;
          return true;
        };
        _proto.detach = function detach() {
          for (var _iterator2 = _createForOfIteratorHelperLoose(this.unsubs), _step2; !(_step2 = _iterator2()).done;) {
            var unsub = _step2.value;
            unsub();
          }
          this.unsubs.length = 0;
          this.cancelOffer();
        };
        _proto.attach = function attach() {
          var _this = this;
          this.unsubs.push(this.ctx.events.on('session:start', function () {
            _this.cancelOffer();
            _this.modifiers.reset();
          }));
          this.unsubs.push(this.ctx.events.on('session:end', function () {
            return _this.cancelOffer();
          }));
          this.unsubs.push(this.ctx.events.on('run:phase', function (_ref) {
            var from = _ref.from,
              to = _ref.to;
            if (to === 'upgrade') {
              _this.beginLevelUp();
            } else if (from === 'upgrade') {
              _this.cancelOffer();
            }
          }));
          this.unsubs.push(this.ctx.events.on('loot:levelUp', function () {
            // GDD §7.5 defers level-up choices until run enters `upgrade`.
            if (_this.inUpgradePhase()) _this.beginLevelUp();
          }));
        };
        _proto.emitOffer = function emitOffer() {
          this.choicesValue = this.drawChoices();
          this.ctx.events.emit('upgrade:offer', {
            source: 'levelUp',
            pick: this.resolvedValue + 1,
            picks: this.picksValue,
            choices: this.choicesValue.map(function (choice) {
              return _extends({}, choice);
            }),
            rerollCost: this.rerollCost
          });
        };
        _proto.finish = function finish() {
          var picks = this.picksValue;
          this.activeValue = false;
          this.choicesValue = [];
          // Release before the event so a synchronous next phase can establish
          // its own pause without this module immediately undoing it.
          this.releasePause();
          this.emitDone(picks);
        };
        _proto.cancelOffer = function cancelOffer() {
          this.activeValue = false;
          this.choicesValue = [];
          this.picksValue = 0;
          this.resolvedValue = 0;
          this.rerollsValue = 0;
          this.releasePause();
        };
        _proto.releasePause = function releasePause() {
          if (this.pausedHere) this.ctx.loop.resume();
          this.pausedHere = false;
        };
        _proto.drawChoices = function drawChoices() {
          var used = new Set();
          var out = [];
          while (out.length < OFFER_COUNT) {
            var tier = this.drawTier(used);
            if (!tier) break;
            var pool = this.choicePool(tier, used);
            if (pool.length === 0) break;
            var definition = pool[this.ctx.rng.shop.nextInt(pool.length)];
            if (!definition) break;
            var valueKey = definition.values[tier];
            if (valueKey === undefined) break;
            used.add(definition.id);
            out.push({
              id: definition.id,
              tier: tier,
              value: this.param(valueKey)
            });
          }
          return out;
        };
        _proto.drawTier = function drawTier(used) {
          var _TIERS$index;
          var danger = this.ctx.services.has('director') ? Math.max(1, this.ctx.services.get('director').danger) : 1;
          var excess = danger - 1;
          var weights = [Math.max(0, this.param('upgrade.commonWeight')), Math.max(0, this.param('upgrade.rareWeight') + this.param('upgrade.rarePerDanger') * excess)];
          for (var i = 0; i < TIERS.length; i++) {
            var tier = TIERS[i];
            if (!tier || this.choicePool(tier, used).length === 0) weights[i] = 0;
          }
          var index = this.weightedIndex(weights);
          if (index >= 0) return (_TIERS$index = TIERS[index]) != null ? _TIERS$index : null;
          for (var _i = 0, _TIERS = TIERS; _i < _TIERS.length; _i++) {
            var _tier = _TIERS[_i];
            if (this.choicePool(_tier, used).length > 0) return _tier;
          }
          return null;
        };
        _proto.choicePool = function choicePool(tier, used) {
          var _this2 = this;
          return UPGRADE_CATALOG.filter(function (definition) {
            return !used.has(definition.id) && definition.values[tier] !== undefined && (definition.id !== 'ropeLength' || !_this2.ropeCapped());
          });
        };
        _proto.ropeCapped = function ropeCapped() {
          if (!this.ctx.services.has('swordRig') || !this.ctx.tunables.has('rope.lenCap')) return false;
          return this.ctx.services.get('swordRig').ropeLength >= this.ctx.tunables.get('rope.lenCap') - 1e-9;
        };
        _proto.shelfPool = function shelfPool(rarity, blocked) {
          return SHELF_CATALOG.filter(function (definition) {
            return definition.rarity === rarity && !blocked.has(definition.id);
          });
        };
        _proto.weightedIndex = function weightedIndex(weights) {
          var total = 0;
          for (var _iterator3 = _createForOfIteratorHelperLoose(weights), _step3; !(_step3 = _iterator3()).done;) {
            var weight = _step3.value;
            total += Math.max(0, weight);
          }
          if (total <= 0) return -1;
          var cursor = this.ctx.rng.shop.next() * total;
          for (var i = 0; i < weights.length; i++) {
            var _weights$i;
            cursor -= Math.max(0, (_weights$i = weights[i]) != null ? _weights$i : 0);
            if (cursor < 0) return i;
          }
          return weights.length - 1;
        }

        /** Two-bucket roll; 0 = white, 1 = green. */;
        _proto.roll = function roll(white, green) {
          var total = white + green;
          if (total <= 0) return white > 0 ? 0 : 1;
          return this.ctx.rng.shop.next() * total < white ? 0 : 1;
        };
        _proto.param = function param(key) {
          return this.ctx.tunables.get(key);
        };
        _proto.inUpgradePhase = function inUpgradePhase() {
          return this.ctx.services.has('run') && this.ctx.services.get('run').phase === 'upgrade';
        };
        _proto.emitDone = function emitDone(picks) {
          if (this.inUpgradePhase()) this.ctx.events.emit('upgrade:done', {
            source: 'levelUp',
            picks: picks
          });
        };
        _proto.modifierValue = function modifierValue(definition, choiceValue) {
          if (!definition.normalizeByBase) return choiceValue;
          if (!this.ctx.tunables.has(definition.modifierKey)) return 0;
          var base = this.ctx.tunables.get(definition.modifierKey);
          return Math.abs(base) > 1e-9 ? choiceValue / base : 0;
        };
        _createClass(UpgradeController, [{
          key: "items",
          get: function get() {
            return this.owned.map(function (item) {
              return _extends({}, item);
            });
          }
        }, {
          key: "active",
          get: function get() {
            return this.activeValue;
          }
        }, {
          key: "choices",
          get: function get() {
            return this.choicesValue.map(function (choice) {
              return _extends({}, choice);
            });
          }
        }, {
          key: "pick",
          get: function get() {
            return this.activeValue ? this.resolvedValue + 1 : 0;
          }
        }, {
          key: "picks",
          get: function get() {
            return this.picksValue;
          }
        }, {
          key: "rerollCost",
          get: function get() {
            var wave = this.ctx.services.has('run') ? Math.max(0, this.ctx.services.get('run').wave) : 0;
            var raw = this.param('upgrade.rerollBase') + this.param('upgrade.rerollWave') * wave + this.param('upgrade.rerollStep') * this.rerollsValue;
            return Math.max(0, Math.round(raw));
          }
        }]);
        return UpgradeController;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/UpgradeParams.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "e1f59VfSCxK+qNd5jTfktOC", "UpgradeParams", undefined);
      function number(key, group, label, value, min, max, step, note) {
        return {
          key: key,
          group: group,
          label: label,
          kind: 'number',
          "default": value,
          min: min,
          max: max,
          step: step,
          note: note
        };
      }
      function rule(key, label, value, min, max, step, note) {
        return number(key, '三选一', label, value, min, max, step, note);
      }
      function effect(key, label, value, min, max, step) {
        return number(key, '三选一效果', label, value, min, max, step, '【提案】GDD §7.5 选项池');
      }

      /**
       * P1 upgrade proposals. MVP keeps common and rare only, and GDD §7.5 says
       * danger raises the upper tier but does not prescribe exact odds;
       * those defaults therefore remain visible in the tuning panel.
       */
      var UPGRADE_PARAMS = exports('UPGRADE_PARAMS', [rule('upgrade.commonWeight', '普通档基础权重', 70, 0, 100, 1, '【提案】GDD §7.5：普通档最常见'), rule('upgrade.rareWeight', '稀有档基础权重', 25, 0, 100, 1, '【提案】GDD §7.5：稀有档较少'), rule('upgrade.rarePerDanger', '每点危险稀有加权', 5, 0, 50, 0.5, '【提案】GDD §7.5：档次随危险钟略升'), rule('upgrade.rerollBase', '刷新基础价', 1, 0, 20, 1, '【提案】UI batch5 README：三选一刷新费 1 + 波次'), rule('upgrade.rerollWave', '刷新每波加价', 1, 0, 10, 1, '【提案】UI batch5 README：三选一刷新费 1 + 波次'), rule('upgrade.rerollStep', '同轮每次加价', 1, 0, 10, 1, '【提案】UI batch5 README：同一轮每刷一次再 +1'), rule('upgrade.shelfWhiteWeight', '货架白色权重', 70, 0, 100, 1, 'P1-tasks P1-06：白 70'), rule('upgrade.shelfGreenWeight', '货架绿色权重', 25, 0, 100, 1, 'P1-tasks P1-06：绿 25'), rule('upgrade.shelfWhitePrice', '货架白色基础价', 12, 0, 100, 1, '【提案】P1-numbers-batch1 §2.2：前两波白道具约 13–14 铜钱'), rule('upgrade.shelfGreenPrice', '货架绿色基础价', 30, 0, 200, 1, '【提案】P1-numbers-batch1 §2.2：绿道具约 33 铜钱'), effect('upgrade.dmgAllCommon', '全剑伤·普通', 0.05, 0, 1, 0.01), effect('upgrade.dmgAllRare', '全剑伤·稀有', 0.10, 0, 1, 0.01), effect('upgrade.moveSpeedCommon', '移速·普通', 0.03, 0, 1, 0.01), effect('upgrade.moveSpeedRare', '移速·稀有', 0.06, 0, 1, 0.01), effect('upgrade.ropeLengthCommon', '绳长·普通', 0.15, 0, 2, 0.05), effect('upgrade.ropeLengthRare', '绳长·稀有', 0.30, 0, 2, 0.05), effect('upgrade.chainCapacityRare', '剑链上限·稀有', 1, 0, 10, 1), effect('upgrade.inkCommon', '墨量·普通', 0.08, 0, 1, 0.01), effect('upgrade.inkRare', '墨量·稀有', 0.15, 0, 1, 0.01), effect('upgrade.catchRangeCommon', '接剑范围·普通', 0.08, 0, 1, 0.01), effect('upgrade.catchRangeRare', '接剑范围·稀有', 0.15, 0, 1, 0.01), effect('upgrade.maxHpCommon', '最大生命·普通', 8, 0, 100, 1), effect('upgrade.maxHpRare', '最大生命·稀有', 15, 0, 100, 1), effect('upgrade.jianyiGainCommon', '剑意获取·普通', 0.05, 0, 1, 0.01), effect('upgrade.jianyiGainRare', '剑意获取·稀有', 0.10, 0, 1, 0.01), effect('upgrade.pickupRangeCommon', '拾取范围·普通', 0.15, 0, 2, 0.05), effect('upgrade.pickupRangeRare', '拾取范围·稀有', 0.30, 0, 2, 0.05), effect('upgrade.whipThresholdRare', '鞭响门槛·稀有', -10, -90, 0, 1)]);
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/UpgradeView.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './UpgradeViewData.ts'], function (exports) {
  var _inheritsLoose, _createForOfIteratorHelperLoose, cclegacy, Color, BlockInputEvents, UITransform, view, Node, Sprite, Graphics, _decorator, Label, resources, SpriteFrame, Component, UPGRADE_LAYOUT, choiceCopy, UPGRADE_ART_KEYS, UPGRADE_ART;
  return {
    setters: [function (module) {
      _inheritsLoose = module.inheritsLoose;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
      Color = module.Color;
      BlockInputEvents = module.BlockInputEvents;
      UITransform = module.UITransform;
      view = module.view;
      Node = module.Node;
      Sprite = module.Sprite;
      Graphics = module.Graphics;
      _decorator = module._decorator;
      Label = module.Label;
      resources = module.resources;
      SpriteFrame = module.SpriteFrame;
      Component = module.Component;
    }, function (module) {
      UPGRADE_LAYOUT = module.UPGRADE_LAYOUT;
      choiceCopy = module.choiceCopy;
      UPGRADE_ART_KEYS = module.UPGRADE_ART_KEYS;
      UPGRADE_ART = module.UPGRADE_ART;
    }],
    execute: function () {
      exports('mountUpgradeView', mountUpgradeView);
      cclegacy._RF.push({}, "2a721fIzYVM1bWMpm8s21L9", "UpgradeView", undefined);
      var INK = new Color(44, 30, 20, 255);
      var NOTE = new Color(110, 90, 64, 255);
      var BONE = new Color(232, 224, 206, 255);
      var MUTED = new Color(190, 180, 160, 255);
      var COMMON_EFFECT = new Color(92, 82, 68, 255);
      var RARE_EFFECT = new Color(62, 96, 28, 255);
      var FALLBACK_DARK = new Color(54, 54, 54, 245);
      var FALLBACK_PANEL = new Color(112, 112, 112, 255);
      var FALLBACK_DISABLED = new Color(70, 70, 70, 255);

      /** Runtime S08 UI. It owns only level-up offers; BossChestView owns bossChest offers. */
      var UpgradeView = exports('UpgradeView', /*#__PURE__*/function (_Component) {
        _inheritsLoose(UpgradeView, _Component);
        function UpgradeView() {
          var _this;
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          _this = _Component.call.apply(_Component, [this].concat(args)) || this;
          _this.ctx = null;
          _this.controller = null;
          _this.offer = null;
          _this.frames = new Map();
          _this.unsubs = [];
          _this.loaded = 0;
          _this.artReady = false;
          _this.disposed = false;
          return _this;
        }
        var _proto = UpgradeView.prototype;
        _proto.configure = function configure(ctx, controller) {
          var _this$node$getCompone,
            _this2 = this;
          this.ctx = ctx;
          this.controller = controller;
          this.node.active = false;
          this.node.addComponent(BlockInputEvents);
          (_this$node$getCompone = this.node.getComponent(UITransform)) == null || _this$node$getCompone.setContentSize(UPGRADE_LAYOUT.designWidth, UPGRADE_LAYOUT.designHeight);
          this.unsubs.push(ctx.events.on('upgrade:offer', function (offer) {
            if (offer.source !== 'levelUp') return;
            _this2.offer = offer;
            _this2.node.active = true;
            _this2.renderWhenReady();
          }));
          this.unsubs.push(ctx.events.on('upgrade:done', function (done) {
            if (done.source === 'levelUp') _this2.close();
          }));
          this.unsubs.push(ctx.events.on('loot:coins', function () {
            return _this2.renderWhenReady();
          }));
          this.unsubs.push(ctx.events.on('session:start', function () {
            return _this2.close();
          }));
          view.on('canvas-resize', this.resize, this);
          this.resize();
          this.loadArt();
        };
        _proto.onDestroy = function onDestroy() {
          this.disposed = true;
          view.off('canvas-resize', this.resize, this);
          for (var _iterator = _createForOfIteratorHelperLoose(this.unsubs), _step; !(_step = _iterator()).done;) {
            var off = _step.value;
            off();
          }
          this.unsubs.length = 0;
          this.offer = null;
          this.controller = null;
          this.ctx = null;
        };
        _proto.loadArt = function loadArt() {
          var _this3 = this;
          var _loop = function _loop() {
            var key = _step2.value;
            var definition = UPGRADE_ART[key];
            resources.load(definition.path + "/spriteFrame", SpriteFrame, function (error, frame) {
              if (_this3.disposed) return;
              if (error || !frame) {
                _this3.frames.set(key, null);
                console.warn("[upgrade] failed to load " + definition.path + "; using gray-box fallback", error);
              } else {
                if (definition.slice) {
                  frame.insetTop = definition.slice.top;
                  frame.insetBottom = definition.slice.bottom;
                  frame.insetLeft = definition.slice.left;
                  frame.insetRight = definition.slice.right;
                }
                _this3.frames.set(key, frame);
              }
              _this3.loaded += 1;
              if (_this3.loaded === UPGRADE_ART_KEYS.length) {
                _this3.artReady = true;
                _this3.renderWhenReady();
              }
            });
          };
          for (var _iterator2 = _createForOfIteratorHelperLoose(UPGRADE_ART_KEYS), _step2; !(_step2 = _iterator2()).done;) {
            _loop();
          }
        };
        _proto.renderWhenReady = function renderWhenReady() {
          if (!this.artReady || !this.offer || !this.node.active) return;
          this.clear();
          this.resize();
          var offer = this.offer;
          var width = this.visibleDesignWidth();
          var height = this.visibleDesignHeight();
          var dim = this.art(this.node, 'Dim', 'dim', 0, 0, width, height);
          dim.addComponent(BlockInputEvents);
          text(this.node, 'Hint', '战斗已暂停 · 不限时间', 0, UPGRADE_LAYOUT.hintY, 400, 36, 18, BONE);
          var title = this.art(this.node, 'Title', 'title', UPGRADE_LAYOUT.title.x, UPGRADE_LAYOUT.title.y, UPGRADE_LAYOUT.title.width, UPGRADE_LAYOUT.title.height);
          text(title, 'LblTitle', '升级 · 选一项', 0, 15, 360, 46, 36, BONE);
          text(title, 'LblCount', "\u7B2C " + offer.pick + " / " + offer.picks + " \u6B21", 0, -29, 240, 30, 20, BONE);
          var cards = node(this.node, 'Cards', 0, 0, UPGRADE_LAYOUT.cardWidth, 782);
          for (var i = 0; i < offer.choices.length && i < UPGRADE_LAYOUT.cardsY.length; i++) {
            var _UPGRADE_LAYOUT$cards;
            var choice = offer.choices[i];
            if (choice) this.card(cards, choice, i, (_UPGRADE_LAYOUT$cards = UPGRADE_LAYOUT.cardsY[i]) != null ? _UPGRADE_LAYOUT$cards : 0);
          }
          this.refreshButton(offer.rerollCost);
        };
        _proto.card = function card(parent, choice, index, y) {
          var _this4 = this;
          var card = node(parent, "Card" + index, 0, y, UPGRADE_LAYOUT.cardWidth, UPGRADE_LAYOUT.cardHeight);
          card.addComponent(BlockInputEvents);
          var body = this.art(card, 'Body', 'cardNormal', 0, 0, UPGRADE_LAYOUT.cardWidth, UPGRADE_LAYOUT.cardHeight);
          var edgeKey = choice.tier === 'rare' ? 'edgeRare' : 'edgeCommon';
          this.art(card, 'Edge', edgeKey, 0, 0, UPGRADE_LAYOUT.cardWidth, UPGRADE_LAYOUT.cardHeight);
          var copy = choiceCopy(choice);
          this.art(card, 'IconSlot', 'iconSlot', -222, 3, 128, 128);
          this.art(card, 'Icon', copy.icon, -222, 5, 112, 112);
          text(card, 'LblName', copy.name, -64, 59, 250, 56, 40, INK, 'left');
          var rare = choice.tier === 'rare';
          var tag = this.art(card, 'Tag', rare ? 'tagRare' : 'tagCommon', 222, 62, 116, 64);
          text(tag, 'LblTag', rare ? '稀有' : '普通', 0, 0, 92, 40, 22, rare ? BONE : INK);
          line(card, -132, 25, 408, new Color(110, 90, 64, 170));
          text(card, 'LblEffect', copy.effect, 72, -15, 400, 44, 30, rare ? RARE_EFFECT : COMMON_EFFECT, 'left');
          text(card, 'LblNote', copy.note, 72, -61, 400, 34, 21, NOTE, 'left');
          card.on(Node.EventType.TOUCH_START, function () {
            return _this4.setFrame(body, 'cardPressed');
          });
          card.on(Node.EventType.TOUCH_CANCEL, function () {
            return _this4.setFrame(body, 'cardNormal');
          });
          card.on(Node.EventType.TOUCH_END, function () {
            var _this4$controller;
            _this4.setFrame(body, 'cardNormal');
            (_this4$controller = _this4.controller) == null || _this4$controller.choose(choice.id);
          });
        };
        _proto.refreshButton = function refreshButton(cost) {
          var _this5 = this;
          var ctx = this.ctx;
          if (!ctx || !ctx.services.has('loot')) return;
          var coins = ctx.services.get('loot').coins;
          var affordable = coins >= cost;
          var refresh = node(this.node, 'Refresh', UPGRADE_LAYOUT.refresh.x, UPGRADE_LAYOUT.refresh.y, UPGRADE_LAYOUT.refresh.width, UPGRADE_LAYOUT.refresh.height);
          refresh.addComponent(BlockInputEvents);
          var body = this.art(refresh, 'Body', affordable ? 'refreshNormal' : 'refreshDisabled', 0, 0, UPGRADE_LAYOUT.refresh.width, UPGRADE_LAYOUT.refresh.height);
          text(refresh, 'LblRefresh', affordable ? "\u5237\u65B0 \xB7 \u94DC\u94B1 " + cost : "\u94DC\u94B1\u4E0D\u591F \xB7 " + cost, 25, 0, 210, 48, affordable ? 28 : 24, affordable ? BONE : MUTED);
          if (affordable) {
            refresh.on(Node.EventType.TOUCH_START, function () {
              return _this5.setFrame(body, 'refreshPressed');
            });
            refresh.on(Node.EventType.TOUCH_CANCEL, function () {
              return _this5.setFrame(body, 'refreshNormal');
            });
            refresh.on(Node.EventType.TOUCH_END, function () {
              var _this5$controller;
              _this5.setFrame(body, 'refreshNormal');
              (_this5$controller = _this5.controller) == null || _this5$controller.reroll();
            });
          }
          text(this.node, 'Wallet', "\u94DC\u94B1 " + coins + "\n\u6301\u6709", UPGRADE_LAYOUT.wallet.x, UPGRADE_LAYOUT.wallet.y, UPGRADE_LAYOUT.wallet.width, UPGRADE_LAYOUT.wallet.height, 22, BONE);
          text(this.node, 'RerollNote', '刷新费\n每次 +1', UPGRADE_LAYOUT.rerollNote.x, UPGRADE_LAYOUT.rerollNote.y, UPGRADE_LAYOUT.rerollNote.width, UPGRADE_LAYOUT.rerollNote.height, 18, MUTED);
        };
        _proto.art = function art(parent, name, key, x, y, width, height) {
          var _this$frames$get;
          var artNode = node(parent, name, x, y, width, height);
          var sprite = artNode.addComponent(Sprite);
          var definition = UPGRADE_ART[key];
          sprite.sizeMode = Sprite.SizeMode.CUSTOM;
          sprite.type = definition.slice ? Sprite.Type.SLICED : Sprite.Type.SIMPLE;
          sprite.spriteFrame = (_this$frames$get = this.frames.get(key)) != null ? _this$frames$get : null;
          if (!sprite.spriteFrame) this.fallback(artNode, width, height, key);
          return artNode;
        };
        _proto.fallback = function fallback(parent, width, height, key) {
          var paint = node(parent, 'Fallback', 0, 0, width, height);
          var graphics = paint.addComponent(Graphics);
          graphics.rect(-width / 2, -height / 2, width, height);
          graphics.fillColor = key === 'dim' ? FALLBACK_DARK : key === 'refreshDisabled' ? FALLBACK_DISABLED : FALLBACK_PANEL;
          graphics.fill();
          if (key === 'edgeCommon' || key === 'edgeRare') {
            graphics.lineWidth = 4;
            graphics.strokeColor = key === 'edgeRare' ? new Color(104, 146, 58, 255) : MUTED;
            graphics.stroke();
          }
        };
        _proto.setFrame = function setFrame(artNode, key) {
          var _this$frames$get2;
          var sprite = artNode.getComponent(Sprite);
          if (sprite) sprite.spriteFrame = (_this$frames$get2 = this.frames.get(key)) != null ? _this$frames$get2 : null;
        };
        _proto.close = function close() {
          this.offer = null;
          this.node.active = false;
          this.clear();
        };
        _proto.clear = function clear() {
          var children = this.node.children.slice();
          this.node.removeAllChildren();
          for (var _iterator3 = _createForOfIteratorHelperLoose(children), _step3; !(_step3 = _iterator3()).done;) {
            var child = _step3.value;
            child.destroy();
          }
        };
        _proto.resize = function resize() {
          var size = view.getVisibleSize();
          var scale = Math.min(size.width / UPGRADE_LAYOUT.designWidth, size.height / UPGRADE_LAYOUT.designHeight);
          this.node.setScale(scale, scale, 1);
        };
        _proto.visibleDesignWidth = function visibleDesignWidth() {
          var size = view.getVisibleSize();
          var scale = Math.min(size.width / UPGRADE_LAYOUT.designWidth, size.height / UPGRADE_LAYOUT.designHeight);
          return scale > 0 ? size.width / scale : UPGRADE_LAYOUT.designWidth;
        };
        _proto.visibleDesignHeight = function visibleDesignHeight() {
          var size = view.getVisibleSize();
          var scale = Math.min(size.width / UPGRADE_LAYOUT.designWidth, size.height / UPGRADE_LAYOUT.designHeight);
          return scale > 0 ? size.height / scale : UPGRADE_LAYOUT.designHeight;
        };
        return UpgradeView;
      }(Component));
      _decorator.ccclass('UpgradeView')(UpgradeView);
      function node(parent, name, x, y, width, height) {
        var child = new Node(name);
        child.layer = parent.layer;
        child.setPosition(x, y, 0);
        child.addComponent(UITransform).setContentSize(width, height);
        parent.addChild(child);
        return child;
      }
      function text(parent, name, value, x, y, width, height, size, color, align) {
        if (align === void 0) {
          align = 'center';
        }
        var label = node(parent, name, x, y, width, height).addComponent(Label);
        label.string = value;
        label.fontSize = size;
        label.lineHeight = size + 6;
        label.color = color;
        label.overflow = Label.Overflow.SHRINK;
        label.enableWrapText = true;
        label.horizontalAlign = align === 'left' ? Label.HorizontalAlign.LEFT : Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        return label;
      }
      function line(parent, x, y, width, color) {
        var divider = node(parent, 'Divider', 0, 0, 0, 0).addComponent(Graphics);
        divider.lineWidth = 2;
        divider.strokeColor = color;
        divider.moveTo(x, y);
        divider.lineTo(x + width, y);
        divider.stroke();
      }
      function mountUpgradeView(ctx, controller) {
        var parent = ctx.layers.get('hud');
        // Pure test harnesses may expose opaque layer handles instead of Cocos nodes.
        if (typeof parent.addChild !== 'function') return;
        var root = node(parent, 'UpgradePick3', 0, 0, UPGRADE_LAYOUT.designWidth, UPGRADE_LAYOUT.designHeight);
        var component = root.addComponent(UpgradeView);
        if (component) component.configure(ctx, controller);
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/UpgradeViewData.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports('choiceCopy', choiceCopy);
      cclegacy._RF.push({}, "aecb81loK9DPbmqw/yxlurX", "UpgradeViewData", undefined);
      function art(name, width, height, slice) {
        return {
          path: "ui/upgrade/" + name,
          width: width,
          height: height,
          slice: slice
        };
      }
      var CARD_SLICE = {
        top: 56,
        bottom: 56,
        left: 56,
        right: 56
      };
      var TAG_SLICE = {
        top: 0,
        bottom: 0,
        left: 26,
        right: 26
      };
      var REFRESH_SLICE = {
        top: 34,
        bottom: 40,
        left: 80,
        right: 36
      };

      /**
       * Runtime resource paths and 9-slice data transcribed from
       * docs/ui/batch5/batch5-slices.json. The source JSON stays outside assets/.
       */
      var UPGRADE_ART = exports('UPGRADE_ART', {
        cardNormal: art('ui_upgrade_card_normal', 512, 256, CARD_SLICE),
        cardPressed: art('ui_upgrade_card_pressed', 512, 256, CARD_SLICE),
        edgeCommon: art('ui_upgrade_cardedge_common', 512, 256, CARD_SLICE),
        edgeRare: art('ui_upgrade_cardedge_rare', 512, 256, CARD_SLICE),
        tagCommon: art('ui_upgrade_raritytag_common', 128, 64, TAG_SLICE),
        tagRare: art('ui_upgrade_raritytag_rare', 128, 64, TAG_SLICE),
        iconSlot: art('ui_upgrade_iconslot_normal', 128, 128, null),
        iconDamage: art('ui_upgrade_icon_dmg', 128, 128, null),
        iconHp: art('ui_upgrade_icon_hp', 128, 128, null),
        iconChain: art('ui_upgrade_icon_chain', 128, 128, null),
        refreshNormal: art('ui_upgrade_refresh_normal', 256, 128, REFRESH_SLICE),
        refreshPressed: art('ui_upgrade_refresh_pressed', 256, 128, REFRESH_SLICE),
        refreshDisabled: art('ui_upgrade_refresh_disabled', 256, 128, REFRESH_SLICE),
        title: art('ui_upgrade_titleplate_normal', 512, 128, {
          top: 44,
          bottom: 40,
          left: 72,
          right: 72
        }),
        dim: art('ui_upgrade_dim_normal', 32, 32, null)
      });
      var UPGRADE_ART_KEYS = exports('UPGRADE_ART_KEYS', ['cardNormal', 'cardPressed', 'edgeCommon', 'edgeRare', 'tagCommon', 'tagRare', 'iconSlot', 'iconDamage', 'iconHp', 'iconChain', 'refreshNormal', 'refreshPressed', 'refreshDisabled', 'title', 'dim']);
      var UPGRADE_LAYOUT = exports('UPGRADE_LAYOUT', {
        designWidth: 720,
        designHeight: 1280,
        hintY: 528,
        title: {
          x: 0,
          y: 441,
          width: 460,
          height: 118
        },
        cardsY: [225, -41, -307],
        cardWidth: 640,
        cardHeight: 250,
        refresh: {
          x: 0,
          y: -530,
          width: 280,
          height: 120
        },
        wallet: {
          x: 255,
          y: -518,
          width: 130,
          height: 74
        },
        rerollNote: {
          x: -250,
          y: -522,
          width: 150,
          height: 62
        }
      });
      var COPY = {
        dmgAll: {
          name: '全剑伤',
          note: '全部剑的伤害提高',
          icon: 'iconDamage',
          unit: 'percent'
        },
        moveSpeed: {
          name: '身法',
          note: '宠物移动速度提高',
          icon: 'iconHp',
          unit: 'percent'
        },
        ropeLength: {
          name: '延绳',
          note: '主剑绳长增加',
          icon: 'iconChain',
          unit: 'unit'
        },
        chainCapacity: {
          name: '扩链',
          note: '剑链容量增加',
          icon: 'iconChain',
          unit: 'number'
        },
        ink: {
          name: '添墨',
          note: '剑阵墨量增加',
          icon: 'iconChain',
          unit: 'percent'
        },
        catchRange: {
          name: '稳接',
          note: '接剑范围提高',
          icon: 'iconChain',
          unit: 'percent'
        },
        maxHp: {
          name: '强身',
          note: '宠物最大生命提高',
          icon: 'iconHp',
          unit: 'number'
        },
        jianyiGain: {
          name: '聚意',
          note: '剑意获取提高',
          icon: 'iconDamage',
          unit: 'percent'
        },
        pickupRange: {
          name: '广纳',
          note: '拾取范围提高',
          icon: 'iconHp',
          unit: 'percent'
        },
        whipThreshold: {
          name: '鞭响',
          note: '更容易触发鞭响',
          icon: 'iconDamage',
          unit: 'degrees'
        }
      };
      var UNKNOWN_COPY = {
        name: '升级',
        note: '本局数值提高',
        icon: 'iconDamage',
        unit: 'number'
      };
      function choiceCopy(choice) {
        var _COPY$choice$id;
        var copy = (_COPY$choice$id = COPY[choice.id]) != null ? _COPY$choice$id : UNKNOWN_COPY;
        return {
          name: copy.name,
          effect: effectPrefix(choice.id) + " " + formatValue(choice.value, copy.unit),
          note: copy.note,
          icon: copy.icon
        };
      }
      function effectPrefix(id) {
        var copy = COPY[id];
        return copy ? copy.note.replace('提高', '').replace('增加', '') : '效果';
      }
      function formatValue(value, unit) {
        if (unit === 'percent') return signed(Math.round(value * 100), '%');
        if (unit === 'unit') return signed(round(value), 'u');
        if (unit === 'degrees') return signed(round(value), '°');
        return signed(round(value), '');
      }
      function signed(value, suffix) {
        return "" + (value >= 0 ? '+' : '') + value + suffix;
      }
      function round(value) {
        return Math.round(value * 100) / 100;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/Vec2.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports({
        vAdd: vAdd,
        vCopy: vCopy,
        vDist: vDist,
        vDistSq: vDistSq,
        vDot: vDot,
        vLen: vLen,
        vLenSq: vLenSq,
        vLerp: vLerp,
        vNormalize: vNormalize,
        vScale: vScale,
        vSet: vSet,
        vSub: vSub,
        vec2: vec2
      });
      cclegacy._RF.push({}, "7259cbKwcdAlqyLjOMXJ3+b", "Vec2", undefined);
      /** Arena-space vector. Origin is the arena's bottom-left; +y is up. Units are u. */
      function vec2(x, y) {
        if (x === void 0) {
          x = 0;
        }
        if (y === void 0) {
          y = 0;
        }
        return {
          x: x,
          y: y
        };
      }
      function vSet(out, x, y) {
        out.x = x;
        out.y = y;
        return out;
      }
      function vCopy(out, v) {
        out.x = v.x;
        out.y = v.y;
        return out;
      }
      function vAdd(a, b, out) {
        if (out === void 0) {
          out = vec2();
        }
        out.x = a.x + b.x;
        out.y = a.y + b.y;
        return out;
      }
      function vSub(a, b, out) {
        if (out === void 0) {
          out = vec2();
        }
        out.x = a.x - b.x;
        out.y = a.y - b.y;
        return out;
      }
      function vScale(a, s, out) {
        if (out === void 0) {
          out = vec2();
        }
        out.x = a.x * s;
        out.y = a.y * s;
        return out;
      }
      function vDot(a, b) {
        return a.x * b.x + a.y * b.y;
      }
      function vLenSq(a) {
        return a.x * a.x + a.y * a.y;
      }
      function vLen(a) {
        return Math.hypot(a.x, a.y);
      }
      function vDist(a, b) {
        return Math.hypot(a.x - b.x, a.y - b.y);
      }
      function vDistSq(a, b) {
        var dx = a.x - b.x;
        var dy = a.y - b.y;
        return dx * dx + dy * dy;
      }

      /** Writes a unit vector. Zero-length input becomes (0, 0). */
      function vNormalize(a, out) {
        if (out === void 0) {
          out = vec2();
        }
        var len = Math.hypot(a.x, a.y);
        if (len <= 1e-12) {
          out.x = 0;
          out.y = 0;
          return out;
        }
        out.x = a.x / len;
        out.y = a.y / len;
        return out;
      }
      function vLerp(a, b, t, out) {
        if (out === void 0) {
          out = vec2();
        }
        out.x = a.x + (b.x - a.x) * t;
        out.y = a.y + (b.y - a.y) * t;
        return out;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/VerletRope.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _createClass, cclegacy;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "6c95ef8IaxBXKtau359qndj", "VerletRope", undefined);
      /** P0 §6.2 / GDD §13.2: pet + real link nodes + main, at most 14 nodes. */
      var VerletRope = exports('VerletRope', /*#__PURE__*/function () {
        function VerletRope(ctx) {
          this.points = [];
          this.tipBefore = {
            x: 0,
            y: 0
          };
          this.tipVelocity = {
            x: 0,
            y: 0
          };
          this.length = 0;
          this.tipSpeed = 0;
          this.mainAttached = true;
          this.topologyChanged = false;
          this.speeds = [];
          this.target = 0;
          this.fromLength = 0;
          this.transition = 0;
          this.fromSegments = [];
          this.mainWeight = 2;
          this.ctx = void 0;
          this.ctx = ctx;
          this.points.push(this.particle({
            x: 0,
            y: 0
          }), this.particle({
            x: 0,
            y: 0
          }));
        }
        var _proto = VerletRope.prototype;
        _proto.reset = function reset(anchor, length, slots, mainWeight) {
          if (slots === void 0) {
            slots = 0;
          }
          if (mainWeight === void 0) {
            mainWeight = this.ctx.tunables.get('sword.W');
          }
          this.mainAttached = true;
          this.mainWeight = mainWeight;
          this.topologyChanged = false;
          this.length = this.target = this.fromLength = length;
          this.points.length = 0;
          // P0 未定义，自选默认值: initial rope hangs downward from the pet.
          for (var i = 0; i < slots + 2; i++) {
            this.points.push(this.particle(this.ctx.arena.clamp({
              x: anchor.x,
              y: anchor.y - length * i / (slots + 1)
            }, this.radius(i, slots))));
          }
          this.transition = this.ctx.tunables.get('rope.transitionTime');
          this.fromSegments = [];
          this.speeds = [];
          this.tipSpeed = 0;
          this.setMasses();
          this.tipBefore.x = this.tip.x;
          this.tipBefore.y = this.tip.y;
          this.tipVelocity.x = this.tipVelocity.y = 0;
        }

        /** GDD §6.7: an external/returning main leaves the last link as the rope end. */;
        _proto.setMainAttached = function setMainAttached(attached) {
          if (attached === this.mainAttached) return;
          if (attached) {
            var end = this.tip;
            var main = this.particle(end);
            main.oldX = end.oldX;
            main.oldY = end.oldY;
            this.points.push(main);
          } else this.points.pop();
          this.mainAttached = attached;
          this.topologyChanged = true;
          this.setMasses();
        }

        /** Preserve retained nodes/history. Additional links are inserted before the held main. */;
        _proto.configure = function configure(slots, targetLength, mainWeight) {
          if (mainWeight === void 0) {
            mainWeight = this.ctx.tunables.get('sword.W');
          }
          this.mainWeight = mainWeight;
          var count = Math.max(0, Math.min(12, Math.floor(slots)));
          var changed = this.topologyChanged;
          this.topologyChanged = false;
          var ends = this.mainAttached ? 2 : 1;
          if (this.points.length !== count + ends) {
            var _this$points;
            var end = this.tip;
            var oldCount = this.points.length - ends;
            var last = this.points[Math.min(count, oldCount)];
            var retained = this.points.slice(0, Math.min(count, oldCount) + 1);
            for (var i = oldCount; i < count; i++) {
              var t = this.mainAttached ? (i - oldCount + 1) / (count - oldCount + 1) : 0;
              var p = this.particle({
                x: last.x + (end.x - last.x) * t,
                y: last.y + (end.y - last.y) * t
              });
              p.oldX = last.oldX + (end.oldX - last.oldX) * t;
              p.oldY = last.oldY + (end.oldY - last.oldY) * t;
              retained.push(p);
            }
            this.points.length = 0;
            (_this$points = this.points).push.apply(_this$points, retained); // retained is an Array.
            if (this.mainAttached) this.points.push(end);
            changed = true;
          }
          if (changed || Math.abs(targetLength - this.target) > 1e-8) {
            this.fromLength = this.length;
            this.target = targetLength;
            this.transition = 0;
            this.fromSegments = [];
            for (var _i = 1; _i < this.points.length; _i++) {
              var a = this.points[_i - 1];
              var b = this.points[_i];
              this.fromSegments.push(Math.hypot(b.x - a.x, b.y - a.y));
            }
          }
          this.setMasses();
        };
        _proto.step = function step(dt, anchor, targetLength, slots, mainWeight) {
          if (slots === void 0) {
            slots = this.points.length - (this.mainAttached ? 2 : 1);
          }
          if (mainWeight === void 0) {
            mainWeight = this.ctx.tunables.get('sword.W');
          }
          if (dt <= 0) return;
          this.configure(slots, targetLength, mainWeight);
          var duration = this.ctx.tunables.get('rope.transitionTime');
          this.transition += dt;
          var t = duration <= 0 ? 1 : Math.min(1, this.transition / duration);
          this.length = this.fromLength + (this.target - this.fromLength) * t;
          this.tipBefore.x = this.tip.x;
          this.tipBefore.y = this.tip.y;
          var damping = 1 - this.ctx.tunables.get('rope.damping');
          for (var i = 1; i < this.points.length; i++) {
            var p = this.points[i];
            p.beforeX = p.x;
            p.beforeY = p.y;
            var dx = (p.x - p.oldX) * damping;
            var dy = (p.y - p.oldY) * damping;
            p.oldX = p.x;
            p.oldY = p.y;
            p.x += dx;
            p.y += dy;
          }
          var head = this.points[0];
          head.x = head.oldX = anchor.x;
          head.y = head.oldY = anchor.y;
          var segment = this.target / (slots + 1);
          var iterations = Math.round(this.ctx.tunables.get('rope.iterations'));
          for (var j = 0; j < iterations; j++) {
            for (var _i2 = 1; _i2 < this.points.length; _i2++) {
              var _this$fromSegments;
              var from = (_this$fromSegments = this.fromSegments[_i2 - 1]) != null ? _this$fromSegments : segment;
              this.constrain(_i2, from + (segment - from) * t);
            }
            // Clamp after every sweep; each particle has its actual collision radius.
            for (var _i3 = 1; _i3 < this.points.length; _i3++) this.clamp(this.points[_i3], this.radius(_i3, slots));
          }
          this.tipVelocity.x = (this.tip.x - this.tipBefore.x) / dt;
          this.tipVelocity.y = (this.tip.y - this.tipBefore.y) / dt;
          this.speeds.push(Math.hypot(this.tipVelocity.x, this.tipVelocity.y));
          var frames = Math.round(this.ctx.tunables.get('rope.tipFrames'));
          while (this.speeds.length > frames) this.speeds.shift();
          this.tipSpeed = this.speeds.reduce(function (sum, value) {
            return sum + value;
          }, 0) / this.speeds.length;
        }

        /** Velocity impulse encoded in Verlet history; applied on the next integration. */;
        _proto.impulse = function impulse(velocity, dt) {
          this.tip.oldX -= velocity.x * dt;
          this.tip.oldY -= velocity.y * dt;
        };
        _proto.distanceTo = function distanceTo(index) {
          var distance = 0;
          for (var i = 1; i <= index && i < this.points.length; i++) {
            var a = this.points[i - 1];
            var b = this.points[i];
            distance += Math.hypot(b.x - a.x, b.y - a.y);
          }
          return distance;
        };
        _proto.particle = function particle(p) {
          return {
            x: p.x,
            y: p.y,
            oldX: p.x,
            oldY: p.y,
            beforeX: p.x,
            beforeY: p.y,
            mass: 0
          };
        };
        _proto.radius = function radius(i, slots) {
          return this.ctx.tunables.get(i === 0 ? 'pet.radius' : this.mainAttached && i === slots + 1 ? 'sword.bladeRadius' : 'chain.linkRadius');
        };
        _proto.setMasses = function setMasses() {
          for (var i = 0; i < this.points.length; i++) {
            this.points[i].mass = i === 0 ? Infinity : this.mainAttached && i === this.points.length - 1 ? this.mainWeight * this.ctx.tunables.get('rope.mainMassPerW') : this.ctx.tunables.get('rope.linkMass');
          }
        };
        _proto.constrain = function constrain(i, segment) {
          var a = this.points[i - 1];
          var b = this.points[i];
          var dx = b.x - a.x;
          var dy = b.y - a.y;
          var dist = Math.hypot(dx, dy);
          if (dist < 1e-9) {
            if (segment <= 1e-9) return;
            var prev = this.points[Math.max(0, i - 2)];
            var lx = a.x - prev.x;
            var ly = a.y - prev.y;
            var len = Math.hypot(lx, ly);
            var nx = len > 1e-9 ? lx / len : 0;
            var ny = len > 1e-9 ? ly / len : -1;
            var _wa = 1 / a.mass;
            var _wb = 1 / b.mass;
            a.x -= nx * segment * _wa / (_wa + _wb);
            a.y -= ny * segment * _wa / (_wa + _wb);
            b.x += nx * segment * _wb / (_wa + _wb);
            b.y += ny * segment * _wb / (_wa + _wb);
            return;
          }
          var wa = 1 / a.mass;
          var wb = 1 / b.mass;
          var correction = (dist - segment) / dist / (wa + wb);
          a.x += dx * correction * wa;
          a.y += dy * correction * wa;
          b.x -= dx * correction * wb;
          b.y -= dy * correction * wb;
        };
        _proto.clamp = function clamp(p, radius) {
          var pos = this.ctx.arena.clamp(p, radius);
          var bounce = this.ctx.tunables.get('rope.wallBounce');
          if (pos.x !== p.x) p.oldX = pos.x + (p.x - p.oldX) * bounce;
          if (pos.y !== p.y) p.oldY = pos.y + (p.y - p.oldY) * bounce;
          p.x = pos.x;
          p.y = pos.y;
        };
        _createClass(VerletRope, [{
          key: "hasMain",
          get: function get() {
            return this.mainAttached;
          }
        }, {
          key: "tip",
          get: function get() {
            return this.points[this.points.length - 1];
          }
        }, {
          key: "segmentLength",
          get: function get() {
            return this.length / (this.points.length - (this.mainAttached ? 1 : 0));
          }
        }]);
        return VerletRope;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/Whip.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _createForOfIteratorHelperLoose, _extends, _createClass, cclegacy;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _extends = module.extends;
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "d01b1e9UMtGEJUOHWptZHdR", "Whip", undefined);
      /** Uses actual pet motion, never raw stick jitter, and net turn rather than summed wobble. */
      var Whip = exports('Whip', /*#__PURE__*/function () {
        function Whip(ctx) {
          this.headings = [];
          this.clock = 0;
          this.cooldown = 0;
          this.activeLeft = 0;
          this.angle = 0;
          this.turnSign = 1;
          this.lastRaw = null;
          this.ctx = void 0;
          this.ctx = ctx;
        }
        var _proto = Whip.prototype;
        _proto.reset = function reset() {
          this.headings.length = 0;
          this.clock = this.cooldown = this.activeLeft = this.angle = 0;
          this.lastRaw = null;
        };
        _proto.turn = function turn(window) {
          var max = 0;
          for (var _iterator = _createForOfIteratorHelperLoose(this.headings), _step; !(_step = _iterator()).done;) {
            var h = _step.value;
            if (this.clock - h.time <= window + 1e-8) max = Math.max(max, Math.abs(this.angle - h.angle));
          }
          return max * 180 / Math.PI;
        };
        _proto.step = function step(dt, vel, maxSpeed, pos, held) {
          this.clock += dt;
          this.cooldown = Math.max(0, this.cooldown - dt);
          this.activeLeft = Math.max(0, this.activeLeft - dt);
          var window = this.ctx.tunables.get('whip.window');
          while (this.headings.length > 0 && this.clock - this.headings[0].time > window + 1e-8) this.headings.shift();
          if (this.headings.length === 0) this.lastRaw = null;
          var speed = Math.hypot(vel.x, vel.y);
          if (maxSpeed <= 0 || speed <= 1e-8 || speed < maxSpeed * this.ctx.tunables.get('whip.minSpeedFrac')) {
            // P0 §6.2 gates CURRENT speed, not every sample in the window.
            return false;
          }
          var raw = Math.atan2(vel.y, vel.x);
          if (this.lastRaw !== null) {
            var delta = raw - this.lastRaw;
            while (delta > Math.PI) delta -= Math.PI * 2;
            while (delta < -Math.PI) delta += Math.PI * 2;
            this.angle += delta;
          }
          this.lastRaw = raw;
          this.headings.push({
            time: this.clock,
            angle: this.angle
          });
          var turnDeg = this.turn(window);
          if (!held || this.cooldown > 1e-8 || turnDeg + 1e-8 < this.ctx.tunables.get('whip.turnDeg')) return false;
          var earliest = this.headings[0];
          this.turnSign = earliest && this.angle < earliest.angle ? -1 : 1;
          this.cooldown = this.ctx.tunables.get('whip.cooldown');
          this.activeLeft = this.ctx.tunables.get('whip.duration');
          this.ctx.events.emit('sword:whip', {
            pos: _extends({}, pos),
            turnDeg: turnDeg,
            speed: speed
          });
          if (this.ctx.tunables.getBool('fx.hitstop')) {
            this.ctx.events.emit('fx:hitstop', {
              frames: this.ctx.tunables.get('fx.hitstopFrames'),
              kind: 'minor'
            });
          }
          if (this.ctx.tunables.getBool('fx.shake')) this.ctx.events.emit('fx:shake', {
            amp: this.ctx.tunables.get('fx.shakeAmp'),
            dur: this.ctx.tunables.get('fx.shakeDur')
          });
          return true;
        };
        _createClass(Whip, [{
          key: "active",
          get: function get() {
            return this.activeLeft > 1e-8;
          }
        }]);
        return Whip;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/Widgets.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _asyncToGenerator, _regeneratorRuntime, cclegacy, Node, UITransform, Graphics, Label, Color, BlockInputEvents, EditBox, Slider, Sprite;
  return {
    setters: [function (module) {
      _asyncToGenerator = module.asyncToGenerator;
      _regeneratorRuntime = module.regeneratorRuntime;
    }, function (module) {
      cclegacy = module.cclegacy;
      Node = module.Node;
      UITransform = module.UITransform;
      Graphics = module.Graphics;
      Label = module.Label;
      Color = module.Color;
      BlockInputEvents = module.BlockInputEvents;
      EditBox = module.EditBox;
      Slider = module.Slider;
      Sprite = module.Sprite;
    }],
    execute: function () {
      exports({
        box: box,
        button: button,
        download: download,
        edit: edit,
        exportText: exportText,
        label: label,
        slider: slider
      });
      cclegacy._RF.push({}, "b9878IPiVRJ3oE8BDlsCs6l", "Widgets", undefined);

      // P0 未定义，自选默认值: widget typography/palette; button height 44 meets P0 §9.1.
      function box(parent, name, x, y, width, height, fill) {
        var node = new Node(name);
        node.layer = parent.layer;
        parent.addChild(node);
        node.setPosition(x, y, 0);
        var transform = node.addComponent(UITransform);
        if (transform) transform.setContentSize(width, height);
        if (fill) {
          // EditBox adds a Sprite to its own node on enable. Keep our painted
          // background on a child so each node has at most one renderer.
          var background = box(node, 'Background', 0, 0, width, height);
          var graphics = background.addComponent(Graphics);
          if (graphics) {
            graphics.fillColor = fill;
            graphics.rect(-width / 2, -height / 2, width, height);
            graphics.fill();
          }
        }
        return node;
      }
      function configureLabel(component, text, x, y, width, height, size) {
        var _component$node$paren, _component$node$paren2, _component$node$getCo;
        component.node.layer = (_component$node$paren = (_component$node$paren2 = component.node.parent) == null ? void 0 : _component$node$paren2.layer) != null ? _component$node$paren : component.node.layer;
        component.node.setPosition(x, y, 0);
        var transform = (_component$node$getCo = component.node.getComponent(UITransform)) != null ? _component$node$getCo : component.node.addComponent(UITransform);
        if (transform) transform.setContentSize(width, height);
        component.fontSize = size;
        component.lineHeight = size + 6;
        component.color = new Color(232, 237, 245);
        component.overflow = Label.Overflow.CLAMP;
        component.enableWrapText = true;
        component.string = text;
        return component;
      }
      function label(parent, text, x, y, width, height, size) {
        if (height === void 0) {
          height = 36;
        }
        if (size === void 0) {
          size = 22;
        }
        var node = box(parent, 'Text', x, y, width, height);
        var component = node.addComponent(Label);
        return component ? configureLabel(component, text, x, y, width, height, size) : null;
      }
      function button(parent, text, x, y, width, click) {
        var node = box(parent, text, x, y, width, 44, new Color(48, 69, 92));
        node.addComponent(BlockInputEvents);
        var caption = label(node, text, 0, 0, width - 8, 36, 20);
        if (caption) caption.horizontalAlign = Label.HorizontalAlign.CENTER;
        node.on(Node.EventType.TOUCH_END, click);
        return node;
      }
      function edit(parent, text, hint, x, y, width, changed, height, multiline, live) {
        var _input$textLabel, _input$placeholderLab;
        if (height === void 0) {
          height = 44;
        }
        if (multiline === void 0) {
          multiline = false;
        }
        if (live === void 0) {
          live = false;
        }
        var node = box(parent, hint, x, y, width, height, new Color(19, 27, 39));
        node.addComponent(BlockInputEvents);
        var input = node.addComponent(EditBox);
        if (!input) return null;
        var textLabel = (_input$textLabel = input.textLabel) != null ? _input$textLabel : label(node, '', 0, 0, width - 16, height - 8, 19);
        var placeholderLabel = (_input$placeholderLab = input.placeholderLabel) != null ? _input$placeholderLab : label(node, hint, 0, 0, width - 16, height - 8, 19);
        input.textLabel = textLabel ? configureLabel(textLabel, '', 0, 0, width - 16, height - 8, 19) : null;
        input.placeholderLabel = placeholderLabel ? configureLabel(placeholderLabel, hint, 0, 0, width - 16, height - 8, 19) : null;
        input.inputMode = multiline ? EditBox.InputMode.ANY : EditBox.InputMode.SINGLE_LINE;
        input.inputFlag = EditBox.InputFlag.DEFAULT;
        input.maxLength = -1;
        input.string = text;
        input.placeholder = hint;
        node.on(live ? EditBox.EventType.TEXT_CHANGED : EditBox.EventType.EDITING_DID_ENDED, function () {
          return changed(input.string);
        });
        return input;
      }

      /** Browser downloads; native builds retain the selectable transfer text. */
      function download(text, filename, mime) {
        if (typeof document === 'undefined' || typeof URL === 'undefined' || typeof Blob === 'undefined') return false;
        var url = URL.createObjectURL(new Blob([text], {
          type: mime
        }));
        var link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        // P0 未定义，自选默认值: release the download URL after 1000ms.
        setTimeout(function () {
          return URL.revokeObjectURL(url);
        }, 1000);
        return true;
      }

      /** Slider renderers occupy their own child nodes (Cocos 3.8). */
      function slider(parent, name, x, y, width, progress, changed) {
        var track = box(parent, name, x, y, width, 16, new Color(48, 69, 92));
        track.addComponent(BlockInputEvents);
        var component = track.addComponent(Slider);
        if (!component) return null;
        var handle = box(track, 'Handle', 0, 0, 16, 24, new Color(190, 210, 230));
        component.handle = handle.addComponent(Sprite);
        component.progress = progress;
        track.on('slide', function () {
          return changed(component.progress);
        });
        return component;
      }

      /** P0 §10: download, then clipboard, then console. The text box stays available. */
      function exportText(_x, _x2, _x3) {
        return _exportText.apply(this, arguments);
      }
      function _exportText() {
        _exportText = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(text, filename, mime) {
          return _regeneratorRuntime().wrap(function _callee$(_context) {
            while (1) switch (_context.prev = _context.next) {
              case 0:
                _context.prev = 0;
                if (!download(text, filename, mime)) {
                  _context.next = 3;
                  break;
                }
                return _context.abrupt("return", '已请求下载；也可从文本框复制');
              case 3:
                _context.next = 7;
                break;
              case 5:
                _context.prev = 5;
                _context.t0 = _context["catch"](0);
              case 7:
                _context.prev = 7;
                if (!(typeof navigator !== 'undefined' && navigator.clipboard)) {
                  _context.next = 12;
                  break;
                }
                _context.next = 11;
                return navigator.clipboard.writeText(text);
              case 11:
                return _context.abrupt("return", '已复制到剪贴板');
              case 12:
                _context.next = 16;
                break;
              case 14:
                _context.prev = 14;
                _context.t1 = _context["catch"](7);
              case 16:
                console.log(text);
                return _context.abrupt("return", '已输出到 console；也可从文本框复制');
              case 18:
              case "end":
                return _context.stop();
            }
          }, _callee, null, [[0, 5], [7, 14]]);
        }));
        return _exportText.apply(this, arguments);
      }
      cclegacy._RF.pop();
    }
  };
});

(function(r) {
  r('virtual:///prerequisite-imports/main', 'chunks:///_virtual/main'); 
})(function(mid, cid) {
    System.register(mid, [cid], function (_export, _context) {
    return {
        setters: [function(_m) {
            var _exportObj = {};

            for (var _key in _m) {
              if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _m[_key];
            }
      
            _export(_exportObj);
        }],
        execute: function () { }
    };
    });
});