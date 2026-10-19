System.register("chunks:///_virtual/App.ts", ['cc', './Arena.ts', './Camera.ts', './CoreParams.ts', './DebugInputSource.ts', './FxDriver.ts', './FixedLoop.ts', './Modules.ts', './Rng.ts', './Session.ts', './SessionWatch.ts', './ServiceRegistry.ts', './StepProbe.ts', './SystemOrder.ts', './Tunables.ts', './TypedEventBus.ts'], function (exports) {
  var cclegacy, createArena, Camera, CORE_PARAMS, MAP_DEFAULT_HEIGHT, MAP_DEFAULT_WIDTH, DebugInputSource, FxDriver, FixedLoop, installModules, createSessionRng, Session, createSessionWatch, ServiceRegistry, StepProbe, SystemOrder, Tunables, TypedEventBus;
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
      DebugInputSource = module.DebugInputSource;
    }, function (module) {
      FxDriver = module.FxDriver;
    }, function (module) {
      FixedLoop = module.FixedLoop;
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
        var fx = new FxDriver();
        var rng = createSessionRng(1);
        var probe = new StepProbe();
        var arena = createArena(MAP_DEFAULT_WIDTH, MAP_DEFAULT_HEIGHT);
        var camera = new Camera();
        tunables.define(CORE_PARAMS);
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
          hitstop: function hitstop(frames) {
            return loop.hitstop(frames);
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
        installModules(ctx);
        var usingDebugInput = services.get('input') === debugInput;
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
          endless: function endless() {
            return tunables.has('session.endless') && tunables.getBool('session.endless');
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
            return loop.hitstop(payload.frames);
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

System.register("chunks:///_virtual/contracts.ts", ['cc'], function () {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "dc49fV1Q5tLWZbMmU0pXRY3", "contracts", undefined);
      /**
       * A boar that is currently in its charge phase.
       * Windup and stun do not qualify. Declared here so sword/loop can ask
       * without importing the enemy module (issue #3 correction).
       * The enemy module implements this; core does not.
       */
      /** Read-only rig snapshot for the HUD, telemetry, and the enemy module. */
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
  var _inheritsLoose, _createForOfIteratorHelperLoose, cclegacy, _decorator, Color, Vec3, view, Graphics, Node, UITransform, sys, screen, Component, createApp, LAYER_NAMES, layoutScreen, CoreArenaView, CoreDebugInput;
  return {
    setters: [function (module) {
      _inheritsLoose = module.inheritsLoose;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
      _decorator = module._decorator;
      Color = module.Color;
      Vec3 = module.Vec3;
      view = module.view;
      Graphics = module.Graphics;
      Node = module.Node;
      UITransform = module.UITransform;
      sys = module.sys;
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
          var _this2 = this;
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
            }
          });
          if (this.app.usingDebugInput) this.mountDebugInput(this.app);
        };
        _proto.onEnable = function onEnable() {
          var _this$app;
          view.on('canvas-resize', this.onResize, this);
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
          (_this$app3 = this.app) == null || _this$app3.detach();
        };
        _proto.onDestroy = function onDestroy() {
          var _this$app4;
          view.off('canvas-resize', this.onResize, this);
          (_this$app4 = this.app) == null || _this$app4.detach();
          this.app = null;
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
      function baseDamage(p) {
        return p.get('sword.baseDmg') * Math.pow(p.get('sword.levelGrowth'), p.get('sword.level'));
      }
      function speedTier(p, vTip) {
        return vTip < p.get('drag.vDead') ? 0 : Math.max(0, Math.min(p.get('drag.qCap'), vTip / p.get('drag.vRef')));
      }
      function dragAtTier(p, q) {
        return baseDamage(p) * Math.pow(p.get('sword.W'), p.get('drag.weightExp')) * Math.pow(q, p.get('drag.speedExp'));
      }
      function dragDamage(p, vTip) {
        return dragAtTier(p, speedTier(p, vTip));
      }
      /** P0 §6.3: the growth base here is explicitly 1.12, independent of sword.levelGrowth. */
      function linkDamage(p, grade, N) {
        return p.get('chain.baseDmg') * Math.pow(1.12, grade + p.get('chain.mainLevelShare') * p.get('sword.level')) * (1 + p.get('chain.resonPer') * Math.min(N, p.get('chain.resonCount')));
      }
      function slotDamage(p, grades, N) {
        if (grades.length === 0) return 0;
        var highest = 0;
        for (var _iterator = _createForOfIteratorHelperLoose(grades), _step; !(_step = _iterator()).done;) {
          var grade = _step.value;
          highest = Math.max(highest, linkDamage(p, grade, N));
        }
        return highest * (1 + p.get('chain.stackBonus') * (grades.length - 1));
      }
      function contactDamage(p, damage, speed) {
        return damage * p.get('chain.contactMul') * speed / p.get('drag.vRef');
      }
      function ropeLength(p, slots) {
        return Math.min(p.get('rope.baseLen') + p.get('rope.lenPerLg') * p.get('sword.Lg') + p.get('rope.lenPerSlot') * slots, p.get('rope.lenCap'));
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
      numberParam('spawn.maxTries', '刷怪', '刷新点重取次数', 8, 1, 32, 1), numberParam('enemy.recycleDist', '刷怪', '回收距离(u)', 25, 10, 60),
      // GDD §5.4 / 2026-10-19 补充决策: forge door 8–12 u from the pet, off-view.
      // P0 未定义，自选范围 for both distances, and the wall margin default/range.
      numberParam('forge.doorMinDist', '炉门', '离宠物最近(u)', 8, 0, 40), numberParam('forge.doorMaxDist', '炉门', '离宠物最远(u)', 12, 0, 40), numberParam('forge.doorWallMargin', '炉门', '离墙最小距离(u)', 1, 0, 5), numberParam('session.length', '局', '时长(s)', 180, 30, 900, 1), {
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

System.register("chunks:///_virtual/EnemyModule.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './SystemOrder.ts', './DirectorParams.ts', './EnemyParams.ts', './EnemyWorld.ts', './SpawnDirector.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, cclegacy, SystemOrder, DIRECTOR_PARAMS, ENEMY_PARAMS, EnemyWorld, SpawnDirector;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      SystemOrder = module.SystemOrder;
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
          this.timing = {
            steps: 0,
            lastMs: 0,
            maxMs: 0,
            totalMs: 0
          };
          this.unsubs = [];
          this.attached = false;
          this.running = false;
          this.aiMs = 0;
          this.ctx = void 0;
          this.ctx = ctx;
          this.world = new EnemyWorld(ctx);
          this.director = new SpawnDirector(ctx, this.world);
        }
        var _proto = EnemyModule.prototype;
        _proto.install = function install() {
          var _this = this;
          // Preserve definitions already registered by the owning integration.
          this.ctx.tunables.define([].concat(ENEMY_PARAMS, DIRECTOR_PARAMS).filter(function (def) {
            return !_this.ctx.tunables.has(def.key);
          }));
          this.ctx.services.provide('enemies', this.world);
          this.ctx.services.provide('director', this.director);
          this.ctx.loop.addSystem({
            id: 'enemy.ai',
            order: SystemOrder.Enemy,
            fixedUpdate: function fixedUpdate(dt) {
              if (!_this.attached || !_this.running) return;
              var start = now();
              _this.world.update(dt);
              _this.aiMs = now() - start;
            }
          });
          this.ctx.loop.addSystem({
            id: 'enemy.resolve',
            order: SystemOrder.EnemyResolve,
            fixedUpdate: function fixedUpdate(dt) {
              if (!_this.attached || !_this.running) return;
              var start = now();
              _this.world.resolveDeaths();
              if (_this.running) {
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
            if (cmd === 'spawn') _this2.director.debugSpawn(arg);else if (cmd === 'clearEnemies') _this2.world.clear();
          }));
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
      var ENEMY_PARAMS = exports('ENEMY_PARAMS', [].concat(kindParams('blob', '软团子', 30, 0.30, 1.2, 5, 1, 0, 0, 1.0), kindParams('sheep', '群聚羊', 20, 0.28, 1.6, 3, 0.6, 0, 20, 0.6), kindParams('boar', '冲锋猪', 80, 0.45, 1.0, 12, 4, 0.7, 60, 0.3), [numberParam('enemy.maxAlive', '敌人', '同屏上限', 80, 10, 200, 1), numberParam('enemy.contactCooldown', '敌人', '接触伤害间隔(s)', 0.5, 0.5, 10), numberParam('enemy.knockbackTime', '敌人', '线性击退时间(s)', 0.15, 0.01, 0.15), numberParam('sheep.groupMin', '群聚羊', '每群最少只数', 6, 1, 30, 1), numberParam('sheep.groupMax', '群聚羊', '每群最多只数', 10, 1, 30, 1), numberParam('sheep.sep', '群聚羊', '分离权重', 1.0, 0, 3), numberParam('sheep.coh', '群聚羊', '聚合权重', 0.6, 0, 3), numberParam('sheep.align', '群聚羊', '对齐权重', 0.4, 0, 3), numberParam('sheep.seek', '群聚羊', '趋向宠物权重', 0.3, 0, 3), numberParam('sheep.sepDist', '群聚羊', '分离距离(u)', 0.5, 0.1, 2), numberParam('sheep.scareRadius', '群聚羊', '受惊传播半径(u)', 1.5, 0, 5), numberParam('sheep.scareTime', '群聚羊', '四散时间(s)', 1.0, 0, 5), numberParam('sheep.scareSpeedMul', '群聚羊', '四散速度倍率', 1.8, 1, 4), numberParam('boar.triggerRange', '冲锋猪', '蓄力距离(u)', 5, 1, 12), numberParam('boar.windup', '冲锋猪', '蓄力(s)', 1.0, 0.2, 3), numberParam('boar.chargeSpeed', '冲锋猪', '冲锋速度(u/s)', 9, 2, 20), numberParam('boar.chargeTime', '冲锋猪', '冲锋时间(s)', 0.6, 0.1, 2), numberParam('boar.stunTime', '冲锋猪', '冲锋后愣住(s)', 1.2, 0, 5), numberParam('boar.stunDmgTakenMul', '冲锋猪', '愣住受伤倍率', 1.5, 1, 5), {
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
      numberParam('enemy.hitFlashTime', '敌人', '受击闪白(s)', 0.12, 0, 1)]));

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
      function kindParams(kind, group, hp, radius, speed, damage, cost, resistance, unlockAt, weight) {
        return [numberParam(kind + ".hp", group, '生命', hp, 1, 2000, 1), numberParam(kind + ".radius", group, '半径(u)', radius, 0.1, 1), numberParam(kind + ".speed", group, '速度(u/s)', speed, 0, 8), numberParam(kind + ".dmg", group, '接触伤害', damage, 0, 100, 1), numberParam(kind + ".cost", group, '刷怪点数(每只)', cost, 0.1, 20), numberParam(kind + ".kbResist", group, '击退抗性', resistance, 0, 1), numberParam(kind + ".unlockAt", group, '解锁时间(s)', unlockAt, 0, 600, 1), numberParam(kind + ".weight", group, '选怪权重(羊按群)', weight, 0, 5)];
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/EnemyView.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './ScreenLayout.ts'], function (exports) {
  var _inheritsLoose, _createForOfIteratorHelperLoose, _extends, cclegacy, _decorator, Color, Graphics, Label, view, Node, UITransform, Component, layoutScreen;
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
      Node = module.Node;
      UITransform = module.UITransform;
      Component = module.Component;
    }, function (module) {
      layoutScreen = module.layoutScreen;
    }],
    execute: function () {
      exports('mountEnemyView', mountEnemyView);
      cclegacy._RF.push({}, "48a48MOp6JDoKV+sdbh9Zw8", "EnemyView", undefined);
      var ccclass = _decorator.ccclass;
      var BLOB = new Color(112, 165, 126, 255);
      var SHEEP = new Color(220, 220, 228, 255);
      var BOAR = new Color(184, 121, 110, 255);
      var FLASH = new Color(255, 255, 255, 255);
      var WARNING = new Color(255, 89, 72, 255);
      /** Single batched Graphics for silhouettes and warning lines; bounded label pool. */
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
          _this.subscribed = false;
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
          this.unsubscribe();
          (_this$module3 = this.module) == null || _this$module3.detach();
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
          for (var _iterator = _createForOfIteratorHelperLoose(module.world.enemies.values()), _step; !(_step = _iterator()).done;) {
            var e = _step.value;
            if (e.alive) this.drawEnemy(g, e, scale, ctx);
          }
          if (!ctx.services.has('player')) {
            var p = ctx.toPx(module.world.player().pos);
            g.strokeColor = new Color(120, 180, 255, 255);
            g.lineWidth = 2;
            g.circle(p.x, p.y, module.world.player().radius * scale);
            g.stroke();
          }
          if (this.hud) {
            this.hud.string = "t " + module.director.elapsed.toFixed(3) + "   D " + module.director.danger.toFixed(3) + "   \u654C " + module.director.alive + "   \u89C6\u91CE\u5185\u5237\u51FA " + module.director.inViewSpawns;
            var size = view.getVisibleSize();
            var rect = layoutScreen(size.width, size.height).hud;
            this.hud.node.setPosition(rect.x + rect.width / 2 - size.width / 2, rect.y + rect.height / 2 - size.height / 2, 0);
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
        _proto.drawEnemy = function drawEnemy(g, e, scale, ctx) {
          var p = ctx.toPx(e.pos);
          var r = e.radius * scale;
          if (e.kind === 'boar' && e.phase === 'windup') {
            // Visible from the very first windup frame; aim was locked by AI.
            var end = ctx.toPx({
              x: e.pos.x + e.chargeDir.x * e.chargeSpeed * ctx.tunables.get('boar.chargeTime'),
              y: e.pos.y + e.chargeDir.y * e.chargeSpeed * ctx.tunables.get('boar.chargeTime')
            });
            g.strokeColor = WARNING;
            g.lineWidth = Math.max(2, r * 0.15);
            g.moveTo(p.x, p.y);
            g.lineTo(end.x, end.y);
            g.stroke();
          }
          g.fillColor = e.flashLeft > 0 ? FLASH : e.kind === 'blob' ? BLOB : e.kind === 'sheep' ? SHEEP : BOAR;
          if (e.kind === 'boar') g.roundRect(p.x - r, p.y - r, 2 * r, 2 * r, r / 2);else g.circle(p.x, p.y, r);
          g.fill();
        };
        _proto.subscribe = function subscribe() {
          var _this2 = this;
          var ctx = this.ctx;
          if (!ctx || this.subscribed) return;
          this.subscribed = true;
          this.unsubs.push(ctx.events.on('session:start', function () {
            return _this2.resetNumbers();
          }));
          this.unsubs.push(ctx.events.on('debug:command', function (_ref) {
            var cmd = _ref.cmd;
            if (cmd === 'clearEnemies') _this2.resetNumbers();
          }));
          this.unsubs.push(ctx.events.on('enemy:damaged', function (_ref2) {
            var _this2$pool$pop;
            var id = _ref2.id,
              pos = _ref2.pos,
              amount = _ref2.amount,
              source = _ref2.source;
            if (!_this2.fxNode) return;
            var existing = _this2.numbers.find(function (number) {
              return number.id === id && ctx.loop.simTime - number.born <= ctx.tunables.get('enemy.damageMergeTime');
            });
            if (existing) {
              // P0 未定义，自选默认值: mixed-source merged colour follows the latest source.
              existing.label.color = source === 'whip' ? new Color(255, 220, 110, 255) : source === 'loop' ? new Color(80, 230, 230, 255) : FLASH;
              existing.amount += amount;
              existing.label.string = String(Math.round(existing.amount * 10) / 10);
              return;
            }
            if (_this2.numbers.length >= Math.floor(ctx.tunables.get('enemy.damageNumberMax'))) return;
            var label = (_this2$pool$pop = _this2.pool.pop()) != null ? _this2$pool$pop : makeNode(_this2.fxNode, 'Damage').addComponent(Label);
            if (!label) return;
            label.node.active = true;
            label.fontSize = 22;
            label.lineHeight = 26;
            label.color = source === 'whip' ? new Color(255, 220, 110, 255) : source === 'loop' ? new Color(80, 230, 230, 255) : FLASH;
            label.string = String(Math.round(amount * 10) / 10);
            label.node.setPosition(ctx.toPx(pos));
            _this2.numbers.push({
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

System.register("chunks:///_virtual/EnemyWorld.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './SpatialHash.ts', './Geom2.ts'], function (exports) {
  var _extends, _createForOfIteratorHelperLoose, cclegacy, SpatialHash, pointSegmentDistance;
  return {
    setters: [function (module) {
      _extends = module.extends;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      SpatialHash = module.SpatialHash;
    }, function (module) {
      pointSegmentDistance = module.pointSegmentDistance;
    }],
    execute: function () {
      cclegacy._RF.push({}, "42a37+zTrVMDp1Sh2wN4eiY", "EnemyWorld", undefined);
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
          this.generation += 1;
          this.enemies.clear();
          this.pending.length = 0;
          this.alive = 0;
          // Keep IDs unique across restarts: stale attack IDs cannot hit new enemies.
          // Debug clearing never grants kills or loot.
        };

        _proto.spawn = function spawn(kind, pos, danger) {
          var t = this.ctx.tunables;
          if (!this.enabled || this.alive >= Math.floor(t.get('enemy.maxAlive'))) return null;
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
            fatalSource: 'drag',
            hits: new Map()
          };
          this.enemies.set(enemy.id, enemy);
          this.alive += 1;
          this.ctx.events.emit('enemy:spawned', {
            id: enemy.id,
            kind: kind,
            pos: _extends({}, enemy.pos)
          });
          return enemy;
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
          for (var _iterator = _createForOfIteratorHelperLoose(this.enemies.values()), _step; !(_step = _iterator()).done;) {
            var _e = _step.value;
            if (!_e.alive) continue;
            var d = Math.max(0, Math.hypot(_e.pos.x - c.x, _e.pos.y - c.y) - _e.radius);
            if (d <= distance && (nearest === null || d < distance)) {
              nearest = _e;
              distance = d;
            }
          }
          return nearest;
        };
        _proto.getChargingBoars = function getChargingBoars() {
          var out = [];
          for (var _iterator2 = _createForOfIteratorHelperLoose(this.enemies.values()), _step2; !(_step2 = _iterator2()).done;) {
            var _e2 = _step2.value;
            if (_e2.alive && _e2.kind === 'boar' && _e2.phase === 'charge') {
              out.push({
                id: _e2.id,
                pos: _extends({}, _e2.pos),
                radius: _e2.radius
              });
            }
          }
          // Do not filter on cutsTrail: sword/loop owns that policy switch.
          return out;
        };
        _proto.hit = function hit(id, req) {
          var e = this.enemies.get(id);
          if (!this.enabled || !e || !e.alive || !Number.isFinite(req.amount) || req.amount <= 0 || !Number.isFinite(req.cooldown) || req.cooldown < 0) return _extends({}, MISS);
          var now = this.ctx.loop.simTime;
          this.pruneHits(e, now);
          var until = e.hits.get(req.hitKey);
          if (until !== undefined && now + 1e-9 < until) return _extends({}, MISS);
          // P0 §7: stun vulnerability applies to every damage source, before overkill clamp.
          var multiplier = e.kind === 'boar' && e.phase === 'recover' ? this.ctx.tunables.get('boar.stunDmgTakenMul') : 1;
          var dealt = Math.min(e.hp, req.amount * multiplier);
          e.hits.set(req.hitKey, now + req.cooldown);
          e.hp -= dealt;
          e.flashLeft = this.ctx.tunables.get('enemy.hitFlashTime');
          // Propagate fear around the impact position, before knockback moves it.
          if (e.kind === 'sheep') this.scatter(e);
          if (req.dir && Number.isFinite(req.dir.x) && Number.isFinite(req.dir.y) && req.knockback !== undefined && Number.isFinite(req.knockback) && req.knockback > 0) {
            var dir = unit(req.dir.x, req.dir.y);
            var distance = req.knockback * (1 - e.resistance);
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
          }
          this.ctx.events.emit('enemy:damaged', {
            id: id,
            kind: e.kind,
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
            for (var _iterator3 = _createForOfIteratorHelperLoose(this.enemies.values()), _step3; !(_step3 = _iterator3()).done;) {
              var _e3 = _step3.value;
              _e3.vel = {
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
          for (var _iterator4 = _createForOfIteratorHelperLoose(this.enemies.values()), _step4; !(_step4 = _iterator4()).done;) {
            var _e4 = _step4.value;
            if (!_e4.alive) continue;
            before.set(_e4.id, _extends({}, _e4.pos));
            if (_e4.kind === 'sheep') steering.set(_e4.id, this.sheepDirection(_e4, player.pos, grid));
          }
          for (var _iterator5 = _createForOfIteratorHelperLoose(this.enemies.values()), _step5; !(_step5 = _iterator5()).done;) {
            var _e5 = _step5.value;
            if (!_e5.alive) continue;
            this.pruneHits(_e5, this.ctx.loop.simTime);
            _e5.flashLeft = Math.max(0, _e5.flashLeft - scaled);
            _e5.contactLeft = Math.max(0, _e5.contactLeft - scaled);
            // Knockback replaces locomotion for its slice, so its requested
            // distance is not cancelled by pursuit. Timers still advance.
            var knockDt = Math.min(scaled, _e5.knockbackLeft);
            if (knockDt > 0) {
              var fraction = knockDt / _e5.knockbackLeft;
              _e5.pos = this.ctx.arena.clamp({
                x: _e5.pos.x + _e5.knockbackRemaining.x * fraction,
                y: _e5.pos.y + _e5.knockbackRemaining.y * fraction
              }, _e5.radius);
              _e5.knockbackRemaining.x *= 1 - fraction;
              _e5.knockbackRemaining.y *= 1 - fraction;
              _e5.knockbackLeft = Math.max(0, _e5.knockbackLeft - knockDt);
            }
            var moveDt = scaled - knockDt;
            if (_e5.kind === 'boar') this.updateBoar(_e5, player.pos, scaled, moveDt);else if (_e5.kind === 'sheep') {
              var _steering$get;
              var direction = (_steering$get = steering.get(_e5.id)) != null ? _steering$get : {
                x: 0,
                y: 0
              };
              var scatterDt = Math.min(moveDt, Math.max(0, _e5.scatterLeft - knockDt));
              if (scatterDt > 0) this.move(_e5, _e5.scatterDir, _e5.speed * this.ctx.tunables.get('sheep.scareSpeedMul'), scatterDt);
              _e5.scatterLeft = Math.max(0, _e5.scatterLeft - scaled);
              if (moveDt > scatterDt) this.move(_e5, direction, _e5.speed, moveDt - scatterDt);
            } else if (moveDt > 0) this.chase(_e5, player.pos, moveDt);
          }
          this.separate();
          for (var _iterator6 = _createForOfIteratorHelperLoose(this.enemies.values()), _step6; !(_step6 = _iterator6()).done;) {
            var _e6 = _step6.value;
            var start = before.get(_e6.id);
            if (!_e6.alive || !start) continue;
            _e6.vel = {
              x: (_e6.pos.x - start.x) / dt,
              y: (_e6.pos.y - start.y) / dt
            };
            if (player.state !== 'dead' && _e6.contactLeft <= 1e-9 && pointSegmentDistance(player.pos, start, _e6.pos) <= player.radius + _e6.radius) {
              _e6.contactLeft = this.ctx.tunables.get('enemy.contactCooldown');
              // Player owns invulnerability and jianzhen's 30% ink loss.
              player.applyDamage(_e6.damage, {
                enemyId: _e6.id,
                kind: _e6.kind
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
          for (var _iterator7 = _createForOfIteratorHelperLoose(pending), _step7; !(_step7 = _iterator7()).done;) {
            var _e7 = _step7.value;
            this.enemies["delete"](_e7.id);
            var drop = this.ctx.rng.loot.next() < this.ctx.tunables.get('chain.dropChance');
            this.ctx.events.emit('enemy:died', {
              id: _e7.id,
              kind: _e7.kind,
              pos: _extends({}, _e7.pos),
              source: _e7.fatalSource
            });
            if (generation !== this.generation || !this.enabled) return;
            // P0 §6.3 assigns grade RNG to sword/chain; core's loot:sword grade is
            // optional (#23), so enemy omits it and reads no grade keys.
            if (drop) this.ctx.events.emit('loot:sword', {
              pos: _extends({}, _e7.pos)
            });
            if (generation !== this.generation || !this.enabled) return;
          }
        };
        _proto.collect = function collect(out, keep) {
          var before = out.length;
          for (var _iterator8 = _createForOfIteratorHelperLoose(this.enemies.values()), _step8; !(_step8 = _iterator8()).done;) {
            var _e8 = _step8.value;
            if (_e8.alive && keep(_e8)) out.push(_e8);
          }
          return out.length - before;
        };
        _proto.pruneHits = function pruneHits(e, now) {
          for (var _iterator9 = _createForOfIteratorHelperLoose(e.hits), _step9; !(_step9 = _iterator9()).done;) {
            var _step9$value = _step9.value,
              key = _step9$value[0],
              until = _step9$value[1];
            if (now + 1e-9 >= until) e.hits["delete"](key);
          }
        };
        _proto.scatter = function scatter(hit) {
          var t = this.ctx.tunables;
          var pet = this.player().pos;
          for (var _iterator10 = _createForOfIteratorHelperLoose(this.enemies.values()), _step10; !(_step10 = _iterator10()).done;) {
            var _e9 = _step10.value;
            if (!_e9.alive || _e9.kind !== 'sheep') continue;
            if (Math.hypot(_e9.pos.x - hit.pos.x, _e9.pos.y - hit.pos.y) > t.get('sheep.scareRadius')) continue;
            _e9.scatterLeft = t.get('sheep.scareTime');
            var away = unit(_e9.pos.x - pet.x, _e9.pos.y - pet.y);
            // At the exact pet centre no away vector exists: deterministic
            // opposite headings by ID, without consuming gameplay RNG.
            _e9.scatterDir = Math.hypot(away.x, away.y) > 0 ? away : {
              x: _e9.id % 2 === 0 ? 1 : -1,
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
            var distance = Math.hypot(dx, dy);
            if (distance > t.get('sheep.flockRadius')) continue;
            cx += dx;
            cy += dy;
            ax += other.vel.x;
            ay += other.vel.y;
            if (distance > 1e-8 && distance < t.get('sheep.sepDist')) {
              sx -= dx / distance;
              sy -= dy / distance;
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
          for (var _iterator11 = _createForOfIteratorHelperLoose(this.enemies.values()), _step11; !(_step11 = _iterator11()).done;) {
            var _e10 = _step11.value;
            if (_e10.alive) radius = Math.max(radius, _e10.radius);
          }
          // Cell side derives from the largest collision diameter, not a new tunable.
          var grid = new SpatialHash(radius > 0 ? 2 * radius : this.ctx.tunables.get('blob.radius') * 2);
          for (var _iterator12 = _createForOfIteratorHelperLoose(this.enemies.values()), _step12; !(_step12 = _iterator12()).done;) {
            var _e11 = _step12.value;
            if (_e11.alive) grid.insert(_e11.id, _e11.pos.x, _e11.pos.y, _e11.radius, _e11);
          }
          return grid;
        };
        _proto.separate = function separate() {
          var candidates = [];
          for (var pass = 0; pass < Math.floor(this.ctx.tunables.get('enemy.separationPasses')); pass++) {
            var grid = this.spatial();
            var changed = false;
            for (var _iterator13 = _createForOfIteratorHelperLoose(this.enemies.values()), _step13; !(_step13 = _iterator13()).done;) {
              var _e12 = _step13.value;
              if (!_e12.alive) continue;
              candidates.length = 0;
              grid.queryCircle(_e12.pos.x, _e12.pos.y, _e12.radius, candidates);
              for (var _iterator14 = _createForOfIteratorHelperLoose(candidates), _step14; !(_step14 = _iterator14()).done;) {
                var other = _step14.value;
                if (other.id <= _e12.id) continue;
                var dx = other.pos.x - _e12.pos.x;
                var dy = other.pos.y - _e12.pos.y;
                var distance = Math.hypot(dx, dy);
                var overlap = _e12.radius + other.radius - distance;
                if (overlap <= 1e-8) continue;
                var dir = distance > 1e-8 ? unit(dx, dy) : {
                  x: _e12.id % 2 === 0 ? 1 : -1,
                  y: 0
                };
                // Equal split; if a wall blocks one half the other takes the rest.
                var start = _extends({}, _e12.pos);
                _e12.pos = this.ctx.arena.clamp({
                  x: _e12.pos.x - dir.x * overlap / 2,
                  y: _e12.pos.y - dir.y * overlap / 2
                }, _e12.radius);
                var moved = (start.x - _e12.pos.x) * dir.x + (start.y - _e12.pos.y) * dir.y;
                var otherStart = _extends({}, other.pos);
                other.pos = this.ctx.arena.clamp({
                  x: other.pos.x + dir.x * (overlap - moved),
                  y: other.pos.y + dir.y * (overlap - moved)
                }, other.radius);
                var otherMoved = (other.pos.x - otherStart.x) * dir.x + (other.pos.y - otherStart.y) * dir.y;
                var remainder = Math.max(0, overlap - moved - otherMoved);
                _e12.pos = this.ctx.arena.clamp({
                  x: _e12.pos.x - dir.x * remainder,
                  y: _e12.pos.y - dir.y * remainder
                }, _e12.radius);
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
            var step = Math.min(left, e.phaseLeft);
            if (e.phase === 'charge' && moveDt > 0) {
              var travel = Math.max(0, step - blocked);
              var destination = {
                x: e.pos.x + e.chargeDir.x * e.chargeSpeed * travel,
                y: e.pos.y + e.chargeDir.y * e.chargeSpeed * travel
              };
              this.move(e, e.chargeDir, e.chargeSpeed, travel);
              if (!this.ctx.arena.contains(destination, e.radius)) e.phaseLeft = step;
            }
            e.phaseLeft = Math.max(0, e.phaseLeft - step);
            left -= step;
            blocked = Math.max(0, blocked - step);
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
       * P0 event table (requirements §4.3) plus `jianzhen:cut`.
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
        DebugCommand: 'debug:command'
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

        /** Add hit-stop frames (60 Hz). Stacks with any frames still pending. */;
        _proto.hitstop = function hitstop(frames) {
          var count = Math.max(0, Math.floor(frames));
          this.hitstopLeft += count;
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

System.register("chunks:///_virtual/index2.ts", ['cc', './FloatingJoystick.ts', './InputParams.ts', './InputSystem.ts', './JoystickView.ts'], function (exports) {
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

System.register("chunks:///_virtual/index3.ts", ['cc', './EnemyModule.ts', './EnemyView.ts'], function (exports) {
  var cclegacy, EnemyModule, mountEnemyView;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      EnemyModule = module.EnemyModule;
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
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/index4.ts", ['cc', './SystemOrder.ts', './LoopController.ts', './LoopParams.ts', './LoopView.ts'], function (exports) {
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

System.register("chunks:///_virtual/index5.ts", ['cc', './TuningView.ts'], function (exports) {
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

System.register("chunks:///_virtual/index6.ts", ['cc', './SystemOrder.ts', './SwordRig.ts', './SwordParams.ts', './index.ts', './index4.ts', './SwordView.ts'], function (exports) {
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

System.register("chunks:///_virtual/index7.ts", ['cc', './Vec2.ts', './Geom2.ts', './SpatialHash.ts', './events.ts', './TypedEventBus.ts', './Tunables.ts', './Rng.ts', './SystemOrder.ts', './FixedLoop.ts', './StepProbe.ts', './Session.ts', './SessionWatch.ts', './Arena.ts', './Camera.ts', './CoreParams.ts', './ScreenLayout.ts', './Layers.ts', './ServiceRegistry.ts', './FxDriver.ts', './DebugInputSource.ts', './Modules.ts', './App.ts', './CoreArenaView.ts', './CoreBootstrap.ts', './CoreDebugInput.ts'], function (exports) {
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

System.register("chunks:///_virtual/LoopController.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './geom.ts', './LoopParams.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, _extends, _createClass, cclegacy, distance, findClosure, trimOldest, douglasPeucker, pointInPolygon, capsuleContact, interpolate, trailLength, inkBudget, loopDamage;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _extends = module.extends;
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
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
          this.hitGains.length = this.linkGains.length = 0;
          this.boarPositions.clear();
          this.previous = _extends({}, this.rig.petPos);
          this.setJianyi(0);
          this.rig.setJianzhenInfo(null, null);
          this.rig.setEnemyTimeScale(1);
        };
        _proto.fixedUpdate = function fixedUpdate(dt) {
          if (!this.attached || !this.running || dt <= 0) return;
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
          if (this.ctx.tunables.getBool('fx.hitstop')) this.ctx.events.emit('fx:hitstop', {
            frames: this.p('loop.hitstopFrames')
          });
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

System.register("chunks:///_virtual/LoopView.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './geom.ts'], function (exports) {
  var _inheritsLoose, _createForOfIteratorHelperLoose, cclegacy, _decorator, Color, Graphics, Node, UITransform, Label, Component, distance;
  return {
    setters: [function (module) {
      _inheritsLoose = module.inheritsLoose;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
      _decorator = module._decorator;
      Color = module.Color;
      Graphics = module.Graphics;
      Node = module.Node;
      UITransform = module.UITransform;
      Label = module.Label;
      Component = module.Component;
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
        fontPx: 18,
        hudHeight: 30
      };
      var INK = new Color(100, 235, 235);
      var FLASH = new Color(255, 240, 165);
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
          _this.caption = null;
          return _this;
        }
        var _proto = LoopView.prototype;
        _proto.bind = function bind(controller) {
          this.controller = controller;
          this.graphics = child(this.node, 'Geometry').addComponent(Graphics);
          this.hud = label(controller.ctx.layers.get('hud'), 'LoopStatus');
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
          var _this$controller3, _this$hud;
          (_this$controller3 = this.controller) == null || _this$controller3.detach();
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
            // Bottom of the HUD bar, above the arena and below the existing sword HUD.
            this.hud.node.setPosition(0, c.ctx.camera.viewH * scale / 2 + STYLE.hudHeight / 2, 0);
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

System.register("chunks:///_virtual/main", ['./App.ts', './Arena.ts', './Camera.ts', './CoreParams.ts', './DebugInputSource.ts', './FixedLoop.ts', './FxDriver.ts', './GameContext.ts', './Layers.ts', './Modules.ts', './Rng.ts', './ScreenLayout.ts', './ServiceRegistry.ts', './Session.ts', './SessionWatch.ts', './SpatialHash.ts', './StepProbe.ts', './SystemOrder.ts', './Tunables.ts', './TypedEventBus.ts', './contracts.ts', './events.ts', './index7.ts', './Geom2.ts', './Vec2.ts', './CoreArenaView.ts', './CoreBootstrap.ts', './CoreDebugInput.ts', './DirectorParams.ts', './EnemyModule.ts', './EnemyParams.ts', './EnemyWorld.ts', './SpawnDirector.ts', './index3.ts', './EnemyView.ts', './FloatingJoystick.ts', './InputHistory.ts', './InputParams.ts', './InputSystem.ts', './index2.ts', './JoystickView.ts', './SwordParams.ts', './SwordChain.ts', './Damage.ts', './Whip.ts', './index6.ts', './LoopController.ts', './LoopParams.ts', './geom.ts', './index4.ts', './LoopView.ts', './Pet.ts', './SwordCombat.ts', './SwordRig.ts', './SwordRigHooks.ts', './VerletRope.ts', './ThrowController.ts', './ThrowFormulas.ts', './ThrowParams.ts', './index.ts', './ThrowView.ts', './SwordView.ts', './Hud.ts', './Presets.ts', './Storage.ts', './Telemetry.ts', './TuningController.ts', './TuningParams.ts', './index5.ts', './TuningView.ts', './Widgets.ts'], function () {
  return {
    setters: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
    execute: function () {}
  };
});

System.register("chunks:///_virtual/Modules.ts", ['cc', './index2.ts', './index6.ts', './index3.ts', './index5.ts'], function (exports) {
  var cclegacy, install, install$1, install$2, install$3;
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
    }],
    execute: function () {
      exports('installModules', installModules);
      cclegacy._RF.push({}, "5746dSfdfVIxLu2J1hsZltn", "Modules", undefined);

      /** Startup order. Later tasks fill these functions; core keeps calling them. */
      var moduleInstalls = exports('moduleInstalls', [install, install$1, install$2, install$3]);
      function installModules(ctx) {
        install(ctx);
        install$1(ctx);
        install$2(ctx);
        install$3(ctx);
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
            return this.ctx.tunables.get('pet.speed') * (1 - this.ctx.tunables.get('pet.weightSlow') * (this.weight() - 1));
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

System.register("chunks:///_virtual/Rng.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports({
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
        Fx: 3
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
          fx: mulberry32(deriveStreamSeed(sessionSeed, RngStream.Fx))
        };
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
      var KINDS = ['blob', 'sheep', 'boar'];
      // P0 未定义，自选: re-roll cap for forge door points; on failure the caller gets null.
      var FORGE_DOOR_TRIES = 32;
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
          this.nextPurchase = this.ctx.tunables.get('spawn.purchaseInterval');
        };
        _proto.stop = function stop() {
          this.generation += 1;
        };
        _proto.update = function update(dt) {
          if (dt <= 0) return;
          var target = this.time + dt;
          var t = this.ctx.tunables;
          var generation = this.generation;
          while (target + 1e-9 >= this.nextPurchase) {
            this.time = this.nextPurchase;
            // Core owns timeout; never spawn at or beyond its terminal step.
            if (!t.getBool('session.endless') && this.time + 1e-9 >= t.get('session.length')) break;
            // P0 §8 rate; P0 未定义，自选默认值: use the right endpoint
            // of each purchase interval for discrete budget integration.
            this.budget += (this.time - this.previousPurchase) * t.get('diff.budgetBase') * Math.pow(this.danger, t.get('diff.budgetExp'));
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
          if (kind !== 'blob' && kind !== 'sheep' && kind !== 'boar') return;
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
            if (this.pending && (t.get(this.pending.kind + ".weight") <= 0 || this.time < t.get(this.pending.kind + ".unlockAt"))) this.pending = null;
            if (!this.pending) this.pending = this.rollPurchase();
            var purchase = this.pending;
            if (!purchase) return;
            var cost = purchase.count * t.get(purchase.kind + ".cost");
            // P0 未定义，自选默认值: save for the selected purchase;
            // do not bias weights toward cheap enemies.
            // Sheep groups are atomic: do not silently truncate at the budget/cap.
            if (this.budget + 1e-9 < cost || this.alive + purchase.count > Math.floor(t.get('enemy.maxAlive'))) return;
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
        };
        _proto.rollPurchase = function rollPurchase() {
          var _this = this;
          var t = this.ctx.tunables;
          var unlocked = KINDS.filter(function (kind) {
            return _this.time + 1e-9 >= t.get(kind + ".unlockAt") && t.get(kind + ".weight") > 0;
          });
          var total = unlocked.reduce(function (sum, kind) {
            return sum + t.get(kind + ".weight");
          }, 0);
          if (total <= 0) return null;
          var roll = this.ctx.rng.spawn.next() * total;
          for (var _iterator = _createForOfIteratorHelperLoose(unlocked), _step; !(_step = _iterator()).done;) {
            var kind = _step.value;
            roll -= t.get(kind + ".weight");
            if (roll >= 0) continue;
            var low = Math.floor(Math.min(t.get('sheep.groupMin'), t.get('sheep.groupMax')));
            var high = Math.floor(Math.max(t.get('sheep.groupMin'), t.get('sheep.groupMax')));
            return {
              kind: kind,
              count: kind === 'sheep' ? low + Math.floor(this.ctx.rng.spawn.next() * (high - low + 1)) : 1
            };
          }
          return null;
        }

        /**
         * P0 §8 (2026-10-19): enemies farther than `enemy.recycleDist` from the pet
         * teleport back onto the spawn ring. Stay put when no legal point is found.
         */;
        _proto.recycle = function recycle() {
          var limit = this.ctx.tunables.get('enemy.recycleDist');
          var pet = this.world.player().pos;
          for (var _iterator2 = _createForOfIteratorHelperLoose(this.world.enemies.values()), _step2; !(_step2 = _iterator2()).done;) {
            var e = _step2.value;
            if (!e.alive || Math.hypot(e.pos.x - pet.x, e.pos.y - pet.y) <= limit) continue;
            var point = this.position(e.kind);
            if (point) this.world.relocate(e, point);
          }
        }

        /**
         * GDD §5.4 / 2026-10-19 补充决策: forge door 8–12 u from the pet, outside the
         * view; re-roll when it lands in view, outside the map, or against a wall.
         * P0 未定义，自选: uniform angle and uniform distance in [min, max].
         */;
        _proto.forgeDoorPoint = function forgeDoorPoint() {
          var t = this.ctx.tunables;
          var low = Math.min(t.get('forge.doorMinDist'), t.get('forge.doorMaxDist'));
          var high = Math.max(t.get('forge.doorMinDist'), t.get('forge.doorMaxDist'));
          var wall = t.get('forge.doorWallMargin');
          var pet = this.world.player().pos;
          var rng = this.ctx.rng.spawn;
          for (var i = 0; i < FORGE_DOOR_TRIES; i++) {
            var angle = rng.next() * Math.PI * 2;
            var distance = low + rng.next() * (high - low);
            var p = {
              x: pet.x + Math.cos(angle) * distance,
              y: pet.y + Math.sin(angle) * distance
            };
            if (this.ctx.camera.inView(p) || !this.insideMap(p, wall)) continue;
            return p;
          }
          return null;
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
          for (var _i = this.loose.length - 1; _i >= 0; _i--) {
            var sword = this.loose[_i];
            sword.left -= dt;
            // Expiration wins at the exact deadline, including when the pet is on the sword.
            if (sword.left <= 1e-8) {
              expired++;
              this.loose.splice(_i, 1);
              continue;
            }
            if (this.N >= this.capacity || Math.hypot(pet.x - sword.pos.x, pet.y - sword.pos.y) > this.ctx.tunables.get('chain.pickupRadius')) continue;
            this.insert(sword.grade);
            this.loose.splice(_i, 1);
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
      number('rope.lenCap', '绳索', '绳长上限', 5, 2, 5), number('rope.iterations', '绳索', '约束迭代', 6, 1, 16), number('rope.damping', '绳索', '每步速度损失', 0.02, 0, 0.2), number('rope.linkMass', '绳索', '链格质量', 0.5, 0.1, 3), number('rope.mainMassPerW', '绳索', '主剑质量每剑重', 1, 0.2, 3), number('rope.wallBounce', '绳索', '撞墙反弹', 0.2, 0, 1), number('rope.tipFrames', '绳索', '剑尖速度平均步数', 3, 1, 8), number('drag.vDead', '拖剑', '无伤速度', 2, 0, 5), number('drag.vRef', '拖剑', '参考速度', 6, 2, 15), number('drag.qCap', '拖剑', '速度档上限', 3, 1, 5), number('drag.speedExp', '拖剑', '速度指数', 1.3, 0.5, 2.5), number('drag.weightExp', '拖剑', '重量指数', 0.7, 0, 1.5), number('drag.hitCooldown', '拖剑', '同敌命中间隔', 0.25, 0.05, 1), number('drag.knockbackK', '拖剑', '击退系数', 0.4, 0, 2), number('whip.turnDeg', '鞭响', '转向角度', 100, 45, 180), number('whip.window', '鞭响', '转向窗口', 0.3, 0.1, 0.6), number('whip.minSpeedFrac', '鞭响', '最低速度比例', 0.7, 0, 1), number('whip.impulse', '鞭响', '剑尖冲量', 4, 0, 15), number('whip.dmgMul', '鞭响', '伤害倍率', 1.8, 1, 4), number('whip.duration', '鞭响', '伤害窗口', 0.25, 0.05, 1), number('whip.cooldown', '鞭响', '冷却', 0.6, 0, 2), number('fx.hitstopFrames', '特效', '鞭响顿帧', 3, 0, 8), number('fx.shakeAmp', '特效', '震屏幅度', 0.08, 0, 0.3), number('fx.shakeDur', '特效', '震屏时长', 0.12, 0, 0.5), toggle('fx.trail', '特效', '拖影'), toggle('fx.hitstop', '特效', '顿帧'), toggle('fx.shake', '特效', '震屏'), toggle('mech.chain', '剑链', '剑链机制'), number('chain.startCount', '剑链', '开局剑数', 0, 0, 36, true), number('chain.maxCount', '剑链', '链剑上限', 16, 0, 36), number('chain.slotMax', '剑链', '链格上限', 12, 4, 12, true),
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

System.register("chunks:///_virtual/SwordRig.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './SwordChain.ts', './Damage.ts', './Whip.ts', './Pet.ts', './VerletRope.ts', './SwordCombat.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, _extends, _createClass, cclegacy, SwordChain, dragDamage, slotDamage, contactDamage, speedTier, dragAtTier, baseDamage, ropeLength, Whip, Pet, VerletRope, SwordCombat;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _extends = module.extends;
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
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
          this.multipliers = new Map();
          this.unsubs = [];
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
          this.unsubs.push(this.ctx.events.on('debug:command', function (_ref2) {
            var cmd = _ref2.cmd,
              arg = _ref2.arg;
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
          this.rope.reset(this.pet.pos, this.targetLength, this.ropeSlots);
          this.chain.place(this.rope);
          this.copyMain(this.rope.tip, {
            x: 0,
            y: 0
          });
          this.whip.reset();
          this.combat.reset();
          this.running = true;
          this.updateCharge(false);
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
          this.rope.step(dt, this.pet.pos, this.targetLength, this.ropeSlots);
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
            this.hitMain(this.rope.tipBefore, dragDamage(this.ctx.tunables, this.vTip) * mul, this.whip.active ? 'whip' : 'drag');
          }
          this.chain.step(dt, this.pet.pos);
          this.rope.configure(this.ropeSlots, this.targetLength);
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
            var damage = slotDamage(this.ctx.tunables, slot.grades, this.N);
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
            this.rope.configure(this.ropeSlots, this.targetLength);
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
          this.rope.configure(this.ropeSlots, this.targetLength);
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
          this.hitMain(before, dragAtTier(this.ctx.tunables, 1) * this.ctx.tunables.get('scatter.mainReturnDmgMul'), 'main_return');
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
          key: "B",
          get: function get() {
            return baseDamage(this.ctx.tunables);
          }
        }, {
          key: "W",
          get: function get() {
            return this.ctx.tunables.get('sword.W');
          }
        }, {
          key: "Lg",
          get: function get() {
            return this.ctx.tunables.get('sword.Lg');
          }
        }, {
          key: "Cv",
          get: function get() {
            return this.ctx.tunables.get('sword.Cv');
          }
        }, {
          key: "N",
          get: function get() {
            return this.chain.N;
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
            return ropeLength(this.ctx.tunables, this.ropeSlots);
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

System.register("chunks:///_virtual/SwordView.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _inheritsLoose, _createForOfIteratorHelperLoose, cclegacy, _decorator, Color, Node, Graphics, view, UITransform, Label, Component;
  return {
    setters: [function (module) {
      _inheritsLoose = module.inheritsLoose;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
      _decorator = module._decorator;
      Color = module.Color;
      Node = module.Node;
      Graphics = module.Graphics;
      view = module.view;
      UITransform = module.UITransform;
      Label = module.Label;
      Component = module.Component;
    }],
    execute: function () {
      exports('mountSwordView', mountSwordView);
      var _dec, _class;
      cclegacy._RF.push({}, "21e9dkzRk9B8L4SjAyLTdrj", "SwordView", undefined);
      var ccclass = _decorator.ccclass;
      var WHITE = new Color(225, 232, 240);
      var ORANGE = new Color(255, 156, 48);
      var BLUE = new Color(130, 170, 230);
      var CYAN = new Color(100, 235, 235);
      var YELLOW = new Color(255, 225, 100);
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
          _this.hud = null;
          _this.stacks = [];
          _this.damage = [];
          return _this;
        }
        var _proto = SwordView.prototype;
        _proto.bind = function bind(rig) {
          this.rig = rig;
          var geometry = new Node('Geometry');
          geometry.layer = this.node.layer;
          this.node.addChild(geometry);
          this.graphics = geometry.addComponent(Graphics);
          this.hud = makeLabel(rig.ctx.layers.get('debug'), 'SwordTelemetry', 18, 680, 64);
          for (var i = 0; i < 12; i++) this.stacks.push(makeLabel(this.node, "Stack" + i, 14, 70, 24));
          for (var _i = 0; _i < Math.floor(rig.ctx.tunables.get('fx.damageMax')); _i++) this.damage.push(makeLabel(this.node, "Damage" + _i, 16, 190, 26));
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
          var _this$rig3, _this$hud;
          (_this$rig3 = this.rig) == null || _this$rig3.detach();
          (_this$hud = this.hud) == null || _this$hud.node.destroy();
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
          g.lineWidth = Math.max(1, scale * 0.025);
          g.strokeColor = charged ? ORANGE : WHITE;
          if (rig.mainVisible) {
            var main = px(rig.mainPos);
            var _speed = Math.hypot(rig.mainVel.x, rig.mainVel.y);
            if (params.getBool('fx.trail') && _speed > 1e-8) {
              var length = rig.vTip * params.get('fx.trailTime') * scale;
              g.moveTo(main.x, main.y);
              g.lineTo(main.x - rig.mainVel.x / _speed * length, main.y - rig.mainVel.y / _speed * length);
              g.stroke();
            }
            var dir = rig.bladeDir;
            var half = rig.bladeLength * scale / 2;
            var radius = params.get('sword.bladeRadius') * scale;
            g.lineWidth = radius * 2;
            g.moveTo(main.x - dir.x * half, main.y - dir.y * half);
            g.lineTo(main.x + dir.x * half, main.y + dir.y * half);
            g.stroke();
            g.fillColor = charged ? ORANGE : WHITE;
            for (var _i2 = 0, _arr = [-1, 1]; _i2 < _arr.length; _i2++) {
              var sign = _arr[_i2];
              g.circle(main.x + dir.x * half * sign, main.y + dir.y * half * sign, radius);
              g.fill();
            }
            g.lineWidth = Math.max(1, scale * 0.025);
            if (rig.whip.active && rig.mainHeld) {
              g.strokeColor = WHITE;
              var angle = Math.atan2(dir.y, dir.x);
              // Polyline tessellation is presentation only, no gameplay sampling.
              for (var _i3 = 0; _i3 <= 16; _i3++) {
                var a = angle + (_i3 / 16 - 0.5) * params.get('whip.turnDeg') * Math.PI / 180;
                var x = main.x + Math.cos(a) * rig.bladeLength * scale;
                var y = main.y + Math.sin(a) * rig.bladeLength * scale;
                if (_i3 === 0) g.moveTo(x, y);else g.lineTo(x, y);
              }
              g.stroke();
            } else if (rig.mainHeld && rig.vTip < params.get('drag.vDead')) {
              // Greybox ground sparks, constrained to the blade's own footprint.
              g.strokeColor = YELLOW;
              this.sword(g, rig.mainPos, radius, {
                x: -dir.y,
                y: dir.x
              });
            }
          }
          for (var _i4 = 0; _i4 < this.stacks.length; _i4++) {
            var label = this.stacks[_i4];
            var slot = rig.chain.slots[_i4];
            label.node.active = rig.chainVisible && slot !== undefined && slot.grades.length > 1;
            if (!slot || !rig.chainVisible) continue;
            g.strokeColor = STACK_COLORS[slot.grades.length - 1];
            g.lineWidth = Math.max(1, scale * 0.025 * slot.grades.length);
            this.link(g, slot.pos, params.get('chain.linkRadius') * scale);
            label.string = "\xD7" + slot.grades.length;
            var _p = px(slot.pos);
            var _rig$ctx$camera = rig.ctx.camera,
              viewW = _rig$ctx$camera.viewW,
              viewH = _rig$ctx$camera.viewH;
            label.node.setPosition(Math.min(viewW * scale - 70, Math.max(0, _p.x + 12)), Math.min(viewH * scale - 12, Math.max(12, _p.y + 12)), 0);
          }
          for (var _iterator = _createForOfIteratorHelperLoose(rig.chain.loose), _step; !(_step = _iterator()).done;) {
            var sword = _step.value;
            var hz = params.get(sword.left <= params.get('fx.scatterFastTime') ? 'fx.scatterFastBlinkHz' : 'fx.scatterBlinkHz');
            if (sword.recovered && Math.floor(sword.left * hz * 2) % 2 === 0) continue;
            g.strokeColor = sword.recovered ? ORANGE : BLUE;
            var _p3 = px(sword.pos);
            var _r = params.get('chain.linkRadius') * scale;
            g.lineWidth = 1;
            g.moveTo(_p3.x, _p3.y - _r);
            g.lineTo(_p3.x, _p3.y + _r);
            g.stroke();
          }
          var damageMax = Math.floor(params.get('fx.damageMax'));
          while (this.damage.length < damageMax) this.damage.push(makeLabel(this.node, "Damage" + this.damage.length, 16, 190, 26));
          for (var _i5 = 0; _i5 < this.damage.length; _i5++) {
            var _label = this.damage[_i5];
            var hit = rig.combat.labels[_i5];
            _label.node.active = hit !== undefined && _i5 < damageMax;
            if (!hit) continue;
            _label.string = hit.amount.toFixed(1) + " " + hit.source;
            _label.color = hit.source === 'whip' ? YELLOW : hit.source === 'loop' ? CYAN : WHITE;
            var _p2 = px(hit.pos);
            _label.node.setPosition(_p2.x, _p2.y + (params.get('fx.damageLife') - hit.left) * params.get('fx.damageRise') * scale, 0);
          }
          if (this.hud) {
            var visible = view.getVisibleSize();
            this.hud.node.setPosition(-visible.width / 2 + 12, visible.height / 2 - 38, 0);
            this.hud.string = "HP " + rig.pet.hp + "/" + rig.pet.maxHp + "  v_tip " + rig.vTip.toFixed(2) + "u/s  N/slots " + rig.N + "/" + rig.slots + "\nL " + rig.ropeLength.toFixed(2) + "u  " + rig.mode + "  \u5251\u610F " + rig.jianyi.toFixed(0) + "  combo " + rig.combo;
            this.hud.color = charged ? ORANGE : WHITE;
          }
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
          this.debugEnabled = typeof DEBUG_TUNING === 'undefined' || DEBUG_TUNING;
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
          this.hudRoot.active = true;
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
          var now = Date.now();
          if (now - this.renderTime < this.controller.ctx.tunables.get('tuning.refresh') * 1000) return;
          this.renderTime = now;
          var ctx = this.controller.ctx;
          var data = readHud(ctx);
          var fps = this.controller.telemetry.fps();
          var vtipPercentiles = this.controller.telemetry.vtipPercentiles();
          var fmt = function fmt(v) {
            return v === null ? '—' : typeof v === 'number' ? String(Math.round(v * 100) / 100) : String(v);
          };
          this.hudRoot.active = this.debugEnabled && ctx.tunables.getBool('tuning.hud') && !this.panel.active && !this.resultRoot.active;
          if (this.hudLabel) this.hudLabel.string = ["seed " + data.seed + " \xB7 #" + data.paramsHash + " \xB7 " + (this.controller.telemetry.debugRestart ? '调试局（不计统计）' : '正常局'), "FPS " + fmt(fps.fpsAvg) + " / 5s\u4F4E " + fmt(fps.fpsMin) + " \xB7 \u65F6\u95F4 " + fmt(data.elapsed) + "  \u5371\u9669 " + fmt(data.danger) + "  \u654C\u4EBA " + fmt(data.alive) + "  HP " + fmt(data.hp) + "/" + fmt(data.maxHp), "vTip " + fmt(data.vTip) + " p50 " + fmt(vtipPercentiles.p50) + " p90 " + fmt(vtipPercentiles.p90) + " \u6EE1\u5145 " + fmt(data.fullCharge) + "  N " + fmt(data.N) + " \u69FD " + fmt(data.slots) + " \u7EF3 " + fmt(data.ropeLength), "\u5251\u610F " + fmt(data.jianyi) + "  \u8FDE\u51FB " + fmt(data.combo) + "  \u58A8\u91CF " + fmt(data.ink) + "  \u5251\u9635\u5269\u4F59 " + fmt(data.arrayRemaining)].join('\n');
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
          if (!result) {
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
        _proto.reset = function reset(anchor, length, slots) {
          if (slots === void 0) {
            slots = 0;
          }
          this.mainAttached = true;
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
        _proto.configure = function configure(slots, targetLength) {
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
        _proto.step = function step(dt, anchor, targetLength, slots) {
          if (slots === void 0) {
            slots = this.points.length - (this.mainAttached ? 2 : 1);
          }
          if (dt <= 0) return;
          this.configure(slots, targetLength);
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
            this.points[i].mass = i === 0 ? Infinity : this.mainAttached && i === this.points.length - 1 ? this.ctx.tunables.get('sword.W') * this.ctx.tunables.get('rope.mainMassPerW') : this.ctx.tunables.get('rope.linkMass');
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
          if (this.ctx.tunables.getBool('fx.hitstop')) this.ctx.events.emit('fx:hitstop', {
            frames: this.ctx.tunables.get('fx.hitstopFrames')
          });
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