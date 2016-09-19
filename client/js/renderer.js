/* global Detect, Class, _, log, Types, font */

define(['camera', 'item', 'character', 'player', 'timer', 'mob', 'npc', 'pet'],
    function(Camera, Item, Character, Player, Timer, Mob, Npc, Pet) {

        var Renderer = Class.extend({
            init: function(game, canvas, buffer, background, foreground, textcanvas, toptextcanvas) {
                this.game = game;

                this.setZoom();


                this.context = (canvas && canvas.getContext) ? canvas.getContext("2d") : null;
                this.buffer = (buffer && buffer.getContext) ? buffer.getContext("2d") : null;
                this.background = (background && background.getContext) ? background.getContext("2d") : null;
                this.foreground = (foreground && foreground.getContext) ? foreground.getContext("2d") : null;
                this.textcontext = (textcanvas && textcanvas.getContext) ? textcanvas.getContext("2d") : null;
                this.toptextcontext = (toptextcanvas && toptextcanvas.getContext) ? toptextcanvas.getContext("2d") : null;

                this.canvas = canvas;
                this.backbuffercanvas = buffer;
                this.backcanvas = background;
                this.forecanvas = foreground;
                this.textcanvas = textcanvas;
                this.toptextcanvas = toptextcanvas;

                this.bgrcanvas = document.getElementById("background");

                this.initFPS();
                this.tilesize = 16;

                this.upscaledRendering = this.context.mozImageSmoothingEnabled !== undefined;
                this.supportsSilhouettes = this.upscaledRendering;
                this.isFirefox = Detect.isFirefox();
                this.isCanary = Detect.isEdgeOnWindows();
                this.isEdge = Detect.isCanaryOnWindows();
                this.isSafari = Detect.isSafari();

                this.rescale(this.getScaleFactor());
                this.lastTime = new Date();
                this.frameCount = 0;
                this.maxFPS = this.FPS;
                this.realFPS = 0;
                this.fullscreen = false;
                this.allowDrawing = false;
                this.tutorialText = null;

                //Turn on or off Debuginfo (FPS Counter)
                this.isDebugInfoVisible = false;
                this.animatedTileCount = 0;
                this.highTileCount = 0;
                this.tablet = Detect.isTablet(window.innerWidth);
                this.fixFlickeringTimer = new Timer(100);

                this.mobile = false;

                this.forceRedraw = true;
            },

            setZoom: function () {
                if (this.getScaleFactor() == 3)
                    return;

                var zoom = $(window).width() / $('#container').width();
                $('body').css('zoom', zoom);
                $('body').css('-moz-transform', 'scale('+zoom+')');
                $('#mainborder').css("top", 0);

            },

            getWidth: function() {
                return this.toptextcanvas.width;
            },

            getHeight: function() {
                return this.toptextcanvas.height;
            },

            setTileset: function(tileset) {
                this.tileset = tileset;
            },

            getScaleFactor: function() {
                var w = window.innerWidth,
                    h = window.innerHeight,
                    scale;

                this.mobile = false;

                //if(w <= 1136) {
                if(w <= 1000) {
                    scale = 2;
                    this.mobile = true;
                } else if(w <= 1500 || h <= 870) {

                    scale = 2;
                } else {

                    scale = 3;
                }

                return scale;
            },

            rescale: function(factor) {
                this.setZoom();

                this.scale = this.getScaleFactor();

                this.createCamera();

                this.context.mozImageSmoothingEnabled = true;
                this.background.mozImageSmoothingEnabled = true;
                this.foreground.mozImageSmoothingEnabled = true;
                this.textcontext.mozImageSmoothingEnabled = true;
                this.toptextcontext.mozImageSmoothingEnabled = true;
                this.initFont();

                if(!this.upscaledRendering && this.game.map && this.game.map.tilesets) {
                    this.setTileset(this.game.map.tilesets[this.scale - 1]);
                }

                if(this.game.ready && this.game.renderer) {
                    this.game.setSpriteScale(this.scale);
                    this.game.inventoryHandler.scale = this.scale;
                }
            },

            createCamera: function() {
                this.camera = new Camera(this.game, this);
                this.camera.rescale();

                this.canvas.width = this.camera.gridW * this.tilesize * this.scale;
                this.canvas.height = this.camera.gridH * this.tilesize * this.scale;

                if (this.mobile)
                    this.canvas.height += 15;

                this.backbuffercanvas.width = this.canvas.width + 2 * this.tilesize;
                this.backbuffercanvas.height = this.canvas.height+ 2 * this.tilesize;

                this.backcanvas.width = this.canvas.width;
                this.backcanvas.height = this.canvas.height;

                this.forecanvas.width = this.canvas.width;
                this.forecanvas.height = this.canvas.height;

                this.textcanvas.width = this.camera.gridW * this.tilesize * this.scale;
                this.textcanvas.height = this.camera.gridH * this.tilesize * this.scale;

                this.toptextcanvas.width = this.textcanvas.width;
                this.toptextcanvas.height = this.textcanvas.height;

            },

            initFPS: function() {
                this.FPS = 60;
            },

            initFont: function() {
                var fontsize;

                switch(this.scale) {
                    case 1:
                        fontsize = 10; break;
                    case 2:
                        fontsize = Detect.isWindows() ? 10 : 13; break;
                    case 3:
                        fontsize = 20;
                }
                this.setFontSize(fontsize);
            },

            setFontSize: function(size) {
                var font = size+"px GraphicPixel";

                this.context.font = font;
                this.background.font = font;
                this.textcontext.font = font;
                this.toptextcontext.font = font;
            },

            drawText: function(ctx, text, x, y, centered, color, strokeColor) {
                var strokeSize = 5;

                switch(this.scale) {
                    case 1:
                        strokeSize = 2; break;
                    case 2:
                        strokeSize = 3; break;
                    case 3:
                        strokeSize = 5;
                }

                if(text && x && y) {
                    ctx.save();
                    if(centered) {
                        ctx.textAlign = "center";
                    }
                    ctx.strokeStyle = strokeColor || "#373737";
                    ctx.lineWidth = strokeSize;
                    ctx.strokeText(text, x * this.scale, y * this.scale);
                    ctx.fillStyle = color || "white";
                    ctx.fillText(text, x * this.scale, y * this.scale);
                    ctx.restore();
                }
            },

            drawCellRect: function(x, y, color) {
                this.context.save();
                this.context.lineWidth = 2*this.scale;

                this.context.translate(x+2, y+2);
                if (this.mobile)
                    this.context.clearRect(-8, -8, (this.tilesize * this.scale) + 16, (this.tilesize * this.scale) + 16);
                this.context.strokeStyle = color;
                this.context.strokeRect(0, 0, (this.tilesize * this.scale) - 4, (this.tilesize * this.scale) - 4);
                this.context.restore();
            },
            drawRectStroke: function(x, y, width, height, color) {
                this.context.fillStyle = color;
                this.context.fillRect(x * this.scale, y * this.scale, (this.tilesize * this.scale)*width, (this.tilesize * this.scale)*height);
                this.context.fill();
                this.context.lineWidth = 5;
                this.context.strokeStyle = 'black';
                this.context.strokeRect(x * this.scale, y * this.scale, (this.tilesize * this.scale)*width, (this.tilesize * this.scale)*height);
            },
            drawRect: function(ctx, x, y, width, height, color) {
                ctx.fillStyle = color;
                ctx.fillRect(x * this.scale, y * this.scale, (this.tilesize * this.scale)*width, (this.tilesize * this.scale)*height);
                ctx.fill();
            },

            drawCellHighlight: function(x, y, color) {
                var s = this.scale,
                    ts = this.tilesize,
                    tx = x * ts * s,
                    ty = y * ts * s;

                this.drawCellRect(tx, ty, color);
            },

            drawTargetCell: function() {
                var mouse = this.game.getMouseGridPosition();

                if(this.game.targetCellVisible && !(mouse.x === this.game.selectedX && mouse.y === this.game.selectedY)) {
                    this.drawCellHighlight(mouse.x, mouse.y, this.game.targetColor);
                }
            },

            drawAttackTargetCell: function() {
                var mouse = this.game.getMouseGridPosition(),
                    entity = this.game.getEntityAt(mouse.x, mouse.y);

                if(entity instanceof Mob && !(entity instanceof Pet)) {
                    this.drawCellRect(entity.x * this.scale, entity.y * this.scale, "rgba(255, 0, 0, 0.5)");
                }
            },

            drawOccupiedCells: function() {
                var positions = this.game.entityGrid;

                if(positions) {
                    for(var i=0; i < positions.length; i += 1) {
                        for(var j=0; j < positions[i].length; j += 1) {
                            if(!_.isNull(positions[i][j])) {
                                this.drawCellHighlight(i, j, "rgba(50, 50, 255, 0.5)");
                            }
                        }
                    }
                }
            },

            drawPathingCells: function() {
                var grid = this.game.pathingGrid;

                if(grid && this.game.debugPathing) {
                    for(var y=0; y < grid.length; y += 1) {
                        for(var x=0; x < grid[y].length; x += 1) {
                            if(grid[y][x] === 1 && this.game.camera.isVisiblePosition(x, y)) {
                                this.drawCellHighlight(x, y, "rgba(50, 50, 255, 0.5)");
                            }
                        }
                    }
                }
            },

            drawSelectedCell: function() {
                var sprite = this.game.cursors["target"],
                    anim = this.game.targetAnimation,
                    os = this.upscaledRendering ? 1 : this.scale,
                    ds = this.upscaledRendering ? this.scale : 1;

                if(!this.game.selectedCellVisible)
                    return;

                if(this.mobile) {
                    if(this.game.drawTarget) {
                        var x = this.game.selectedX,
                            y = this.game.selectedY;

                        //this.context.clearRect(x-this.tilesize, y-this.tilesize, this.tilesize*2, this.tilesize*2);
                        this.drawCellHighlight(x, y, "rgb(51, 255, 0)");
                        this.lastTargetPos = { x: x,
                            y: y };
                        this.game.drawTarget = false;
                    }
                } else {


                    if(sprite && anim) {
                        var    frame = anim.currentFrame,
                            s = this.scale,
                            x = frame.x * os,
                            y = frame.y * os,
                            w = sprite.width * os,
                            h = sprite.height * os,
                            ts = 16,
                            dx = this.game.selectedX * ts * s,
                            dy = this.game.selectedY * ts * s,
                            dw = w * ds,
                            dh = h * ds;

                        if (!sprite.isLoaded) sprite.load();
                        this.context.save();
                        this.context.translate(dx, dy);
                        this.context.drawImage(sprite.image, x, y, w, h, 0, 0, dw, dh);
                        this.context.restore();
                    }
                }
            },

            clearScaledRect: function(ctx, x, y, w, h) {
                var s = this.scale;

                ctx.clearRect(x * s, y * s, w * s, h * s);
            },

            drawCursor: function() {
                var mx = this.game.mouse.x,
                    my = this.game.mouse.y,
                    s = this.scale,
                    os = this.upscaledRendering ? 1 : this.scale;

                this.context.save();
                if (!this.game.currentCursor.isLoaded)
                    this.game.currentCursor.load();

                if(this.game.currentCursor && this.game.currentCursor.isLoaded)
                    this.context.drawImage(this.game.currentCursor.image, 0, 0, 14 * os, 14 * os, mx, my, 14*s, 14*s);


                this.context.restore();
            },

            drawScaledImage: function(ctx, image, x, y, w, h, dx, dy) {
                var s = this.upscaledRendering ? 1 : this.scale;
                if (!ctx)
                    return;

                ctx.drawImage(image,
                    x * s,
                    y * s,
                    w * s,
                    h * s,
                    dx * this.scale,
                    dy * this.scale,
                    w * this.scale,
                    h * this.scale);

            },

            drawTile: function(ctx, tileid, tileset, setW, gridW, cellid) {
                var s = this.upscaledRendering ? 1 : this.scale;
                if(tileid !== -1) { // -1 when tile is empty in Tiled. Don't attempt to draw it.
                    this.drawScaledImage(ctx,
                        tileset,
                        getX(tileid + 1, (setW / s)) * this.tilesize,
                        Math.floor(tileid / (setW / s)) * this.tilesize,
                        this.tilesize,
                        this.tilesize,
                        getX(cellid + 1, gridW) * this.tilesize,
                        Math.floor(cellid / gridW) * this.tilesize);
                }
            },

            clearTile: function(ctx, gridW, cellid) {
                var s = this.scale,
                    ts = this.tilesize,
                    x = getX(cellid + 1, gridW) * ts * s,
                    y = Math.floor(cellid / gridW) * ts * s,
                    w = ts * s,
                    h = w;

                ctx.clearRect(x, y, h, w);
            },
            drawItemInfo: function(){
                var self = this;
                var s = this.scale;
                var ds = this.upscaledRendering ? this.scale : 1;
                var os = this.upscaledRendering ? 1 : this.scale;

                this.context.save();
                this.context.translate(this.camera.x*s, this.camera.y*s);
                this.drawRectStroke(4, 4, 29, 4, "rgba(142, 214, 255, 0.8)");

                ItemTypes.forEachArmorKind(function(kind, kindName){
                    var item = self.game.sprites[kindName];
                    if(item){
                        var itemAnimData = item.animationData["idle_down"];
                        if(itemAnimData){
                            var ix = item.width * os,
                                iy = item.height * itemAnimData.row * os,
                                iw = item.width * os,
                                ih = item.height * os,
                                rank = Types.getArmorRank(kind);

                            if(rank > Types.getArmorRank(190)){
                                return;
                            }

                            if(kind !== 175){
                                self.context.drawImage(item.image, ix, iy, iw, ih,
                                    item.offsetX * s + ((rank%19)*3+2)*self.tilesize,
                                    item.offsetY * s + (Math.floor(rank/19)*3+2)*self.tilesize,
                                    iw * ds, ih * ds);
                            }
                        }
                    }
                });

                ItemTypes.forEachWeaponKind(function(kind, kindName){
                    var item = self.game.sprites[kindName];
                    if (!item.isLoaded) item.load();
                    if(item){
                        var itemAnimData = item.animationData["idle_down"];
                        if(itemAnimData){
                            var ix = item.width * os,
                                iy = item.height * itemAnimData.row * os,
                                iw = item.width * os,
                                ih = item.height * os,
                                rank = Types.getWeaponRank(kind);

                            if(rank > Types.getWeaponRank(191)){
                                return;
                            }

                            self.context.drawImage(item.image, ix, iy, iw, ih,
                                item.offsetX * s + ((rank%19)*3+2)*self.tilesize,
                                item.offsetY * s + (Math.floor(rank/19)*3+2)*self.tilesize,
                                iw * ds, ih * ds);

                        }
                    }
                });
                this.context.restore();
            },


            drawEntitiesCircle: function() {
                var ac = this.game.activeCircle;

                if (!ac) return;

                var os = this.upscaledRendering ? 1 : this.scale,
                    ds = this.upscaledRendering ? this.scale : 1;

                this.context.save();
                for (var i = 0; i < ac.length; ++i)
                {
                    var filename = "item-"+ItemTypes.KindData[ac[i].inv.item].key;
                    var item = this.game.sprites[filename];
                    if (!item.isLoaded) item.load();
                    var s = this.scale,
                        dw = ac[i].w * ds / .9,
                        dh = ac[i].h * ds / .9;

                    this.context.drawImage(item.image, 0, 0, ac[i].w * 0.9, ac[i].h * 0.9, ac[i].x, ac[i].y, dw, dh);
                }
                this.context.restore();
            },

            drawEntity: function(entity) {
                var sprite = entity.sprite,
                    shadow = this.game.shadows["small"],
                    anim = entity.currentAnimation,
                    os = this.upscaledRendering ? 1 : this.scale,
                    ds = this.upscaledRendering ? this.scale : 1;

                if(anim && sprite) {
                    var frame = anim.currentFrame,
                        s = this.scale,
                        x = frame.x * os,
                        y = frame.y * os,
                        w = sprite.width * os,
                        h = sprite.height * os,
                        ox = sprite.offsetX * s,
                        oy = sprite.offsetY * s,
                        dx = entity.x * s,
                        dy = entity.y * s,
                        dw = w * ds,
                        dh = h * ds;

                    if(entity.isFading) {
                        this.context.save();
                        this.context.globalAlpha = entity.fadingAlpha;
                    }

                    this.context.save();
                    if(entity.flipSpriteX) {
                        this.context.translate(dx + this.tilesize*s, dy);
                        this.context.scale(-1, 1);
                    }
                    else if(entity.flipSpriteY) {
                        this.context.translate(dx, dy + dh);
                        this.context.scale(1, -1);
                    }
                    else {
                        this.context.translate(dx, dy);
                    }

                    if(entity.isVisible()) {

                        if (entity.hasShadow()) {
                            if (!shadow.isLoaded)
                                shadow.load();

                            this.context.drawImage(shadow.image, 0, 0, shadow.width * os, shadow.height * os,
                                0,
                                entity.shadowOffsetY * ds,
                                shadow.width * os * ds, shadow.height * os * ds);
                        }


                        try {
                            this.context.drawImage(sprite.image, x, y, w, h, ox, oy, dw, dh);
                        } catch(e) { log.info(e); }


                        if(entity instanceof Item && entity.kind !== 39) {

                            var sparks = this.game.sprites["sparks"],
                                anim = this.game.sparksAnimation,
                                frame = anim.currentFrame,
                                sx = sparks.width * frame.index * os,
                                sy = sparks.height * anim.row * os,
                                sw = sparks.width * os,
                                sh = sparks.width * os;

                            if (!sparks.isLoaded) sparks.load();

                            this.context.drawImage(sparks.image, sx, sy, sw, sh,
                                sparks.offsetX * s,
                                sparks.offsetY * s,
                                sw * ds, sh * ds);

                            if (entity.count > 1)
                                this.drawText(this.textcontext, entity.count, entity.x + 8, entity.y - 0.3, true, "white");
                        }
                    }

                    if(entity instanceof Character && !entity.isDead && entity.hasWeapon()) {
                        var weapon = this.game.sprites[entity.getWeaponName()];
                        if(weapon) {
                            if (!weapon.isLoaded) weapon.load();
                            var weaponAnimData = weapon.animationData[anim.name],
                                index = frame.index < weaponAnimData.length ? frame.index : frame.index % weaponAnimData.length,
                                wx = weapon.width * index * os,
                                wy = weapon.height * anim.row * os,
                                ww = weapon.width * os,
                                wh = weapon.height * os;

                            this.context.drawImage(weapon.image, wx, wy, ww, wh,
                                weapon.offsetX * s,
                                weapon.offsetY * s,
                                ww * ds, wh * ds);
                        }
                    }

                    this.context.restore();

                    if(entity.isFading) {
                        this.context.restore();
                    }

                    //this.drawEntityName(entity);
                }
            },

            drawEntities: function(dirtyOnly) {
                var self = this;

                this.game.forEachVisibleEntityByDepth(function(entity) {
                    if(entity.isLoaded) {
                        if(dirtyOnly) {
                            if(entity.isDirty) {
                                self.drawEntity(entity);

                                entity.isDirty = false;
                                entity.oldDirtyRect = entity.dirtyRect;
                                entity.dirtyRect = null;
                            }
                        } else {
                            self.drawEntity(entity);
                        }
                    }
                });
            },

            drawDirtyEntities: function() {
                this.drawEntities(true);
            },

            clearDirtyRect: function(r) {
                this.context.clearRect(r.x, r.y, r.w, r.h);
            },

            clearDirtyRects: function() {
                var self = this,
                    count = 0;

                //this.context.translate(-(this.camera.x-this.cameraOldX) * this.scale,
                //    -(this.camera.y-this.cameraOldY) * this.scale);

                this.game.forEachVisibleEntityByDepth(function(entity) {
                    if(entity.isDirty && entity.oldDirtyRect)
                        self.clearDirtyRect(entity.oldDirtyRect);
                });


                this.game.forEachAnimatedTile(function(tile) {
                    if(tile.isDirty)
                        self.clearDirtyRect(tile.dirtyRect);
                });

                if(this.game.clearTarget && this.lastTargetPos) {
                    var last = this.lastTargetPos;
                    var rect = this.getTargetBoundingRect(last.x, last.y);

                    this.clearDirtyRect(rect);
                    this.game.clearTarget = false;
                }
            },

            getEntityBoundingRect: function(entity) {
                var rect = {},
                    s = this.scale,
                    spr;

                if(entity instanceof Player && entity.hasWeapon()) {
                    var weapon = this.game.sprites[entity.getWeaponName()];
                    spr = weapon;
                } else {
                    spr = entity.sprite;
                }

                if(spr) {
                    rect.x = (entity.x + spr.offsetX - this.camera.x) * s;
                    rect.y = (entity.y + spr.offsetY - this.camera.y) * s;
                    rect.w = spr.width * s;
                    rect.h = spr.height * s;
                    rect.left = rect.x;
                    rect.right = rect.x + rect.w;
                    rect.top = rect.y;
                    rect.bottom = rect.y + rect.h;
                }
                return rect;
            },

            getTileBoundingRect: function(tile) {
                var rect = {},
                    gridW = this.game.map.width,
                    s = this.scale,
                    ts = this.tilesize,
                    cellid = tile.index;

                rect.x = ((getX(cellid + 1, gridW) * ts) - this.camera.x) * s;
                rect.y = ((Math.floor(cellid / gridW) * ts) - this.camera.y) * s;
                rect.w = ts * s;
                rect.h = ts * s;
                rect.left = rect.x;
                rect.right = rect.x + rect.w;
                rect.top = rect.y;
                rect.bottom = rect.y + rect.h;

                return rect;
            },

            getTargetBoundingRect: function(x, y) {
                var rect = {},
                    s = this.scale,
                    ts = this.tilesize,
                    tx = x || this.game.selectedX,
                    ty = y || this.game.selectedY;

                rect.x = ((tx * ts) - this.camera.x) * s;
                rect.y = ((ty * ts) - this.camera.y) * s;
                rect.w = ts * s;
                rect.h = ts * s;
                rect.left = rect.x;
                rect.right = rect.x + rect.w;
                rect.top = rect.y;
                rect.bottom = rect.y + rect.h;

                return rect;
            },

            isIntersecting: function(rect1, rect2) {
                return !((rect2.left > rect1.right) ||
                (rect2.right < rect1.left) ||
                (rect2.top > rect1.bottom) ||
                (rect2.bottom < rect1.top));
            },

            drawEntityNames: function() {
                var self = this;
                this.game.forEachVisibleEntityByDepth(function(entity) {
                    if(entity.isLoaded) {
                        self.drawEntityName(entity);
                    }
                });
            },

            drawEntityName: function(entity) {
                var ctx = this.textcontext;
                ctx.save();

                //"#00CCFF" : "#78AB46
                if(entity.name && entity instanceof Player && entity.isMoving) {
                    var color =  entity.isWanted ? "red" : (entity.id === this.game.playerId) ? "#fcda5c" : entity.admin ? "#ff0000" : "white";
                    var name = (entity.level) ? entity.name + " (" + entity.level + ")" : entity.name;

                    this.drawText(this.textcontext, name,
                        (entity.x + 8),
                        (entity.y + entity.nameOffsetY),
                        true,
                        color);
                }
                if(entity instanceof Mob) {
                    var color;
                    var mobLvl = entity.level;

                    var playerLvl;


                    if (this.game.player) {
                        playerLvl = this.game.player.level;
                        //alert("mobLevel="+mobLvl+",playerLvl="+playerLvl);
                        //8, 4
                        color = "white";

                        if (mobLvl > playerLvl + 5)
                            color = "red";

                    } else
                        color = "white";


                    //var name = entity.title + " " + entity.kind;
                    var name = entity.title;

                    this.drawText(ctx, name,
                        (entity.x + 8),
                        (entity.y - 10),
                        true,
                        color);
                }
                if(entity instanceof Npc) {
                    var color;
                    var name;
                    if (this.game.achievementHandler.npcHasAchievement(entity.kind))
                    {
                        color = "cyan";
                        name = entity.title + " ?";
                    }
                    else
                    {
                        color = "white";
                        name = entity.title;
                    }

                    this.drawText(ctx, name,
                        (entity.x + 8),
                        (entity.y - 10),
                        true,
                        color);
                }
                ctx.restore();
            },
            drawInventory: function(){
                var s = this.scale;
                this.textcontext.save();
                this.textcontext.translate(this.camera.x * s, this.camera.y * s);
                this.drawInventoryMenu();
                this.textcontext.restore();
            },

            drawInventoryMenu: function(){
                if(this.game.player && this.game.menu && this.game.menu.selectedEquipped !== null) {
                    var equippedNumber = this.game.menu.selectedEquipped;
                    var leftTextAlign = 12 * this.tilesize;
                    var leftRectAlign = 11 * this.tilesize;
                    if (equippedNumber) {
                        this.drawRect(this.textcontext, leftRectAlign, (this.camera.gridH - 4) * this.tilesize, 3, 2, "rgba(0, 0, 0, 0.5)");
                        this.drawText(this.textcontext, "Unequip", leftTextAlign, (this.camera.gridH - 3.4) * this.tilesize, true, "white", "black");
                        this.drawText(this.textcontext, "Drop", leftTextAlign, (this.camera.gridH-2.4) * this.tilesize, true, "white", "black");
                    }
                    return;
                }
                else if(this.game.player && this.game.menu && this.game.menu.selectedInventory !== null){
                    var inventoryNumber = this.game.menu.selectedInventory;
                    var itemKind = this.game.inventoryHandler.inventory[inventoryNumber];

                    if (!this.game.bankShowing) {
                        var leftTextAlign = 12 * this.tilesize;
                        var leftRectAlign = 11 * this.tilesize;
                        if(itemKind === 39 || itemKind === 173) {
                            this.drawRect(this.textcontext, leftRectAlign, (this.camera.gridH-3) * this.tilesize, 3, 1, "rgba(0, 0, 0, 0.5)");
                            this.drawText(this.textcontext, "Drop", leftTextAlign, (this.camera.gridH-2.4) * this.tilesize, true, "white", "black");
                        } else if(itemKind === 306) {
                            this.drawRect(this.textcontext, leftRectAlign, (this.camera.gridH - 4) * this.tilesize, 3, 2, "rgba(0, 0, 0, 1)");
                            this.drawText(this.textcontext, "Enchant Bloodsucking", leftTextAlign, (this.camera.gridH-3.4) * this.tilesize, true, "white", "black");
                            this.drawText(this.textcontext, "Drop", leftTextAlign, (this.camera.gridH-2.4) * this.tilesize, true, "white", "black");

                        } else if(ItemTypes.isConsumableItem(itemKind)) {
                            this.drawRect(this.textcontext, leftRectAlign, (this.camera.gridH - 5) * this.tilesize, 3, 3, "rgba(0, 0, 0, 0.5)");
                            this.drawText(this.textcontext, inventoryNumber === this.game.healShortCut ? "Manual" : "Auto", leftTextAlign, (this.camera.gridH-4.4) * this.tilesize, true, "white", "black");
                            this.drawText(this.textcontext, "Eat", leftTextAlign, (this.camera.gridH-3.4) * this.tilesize, true, "white", "black");
                            this.drawText(this.textcontext, "Drop", leftTextAlign, (this.camera.gridH-2.4) * this.tilesize, true, "white", "black");

                        } else if(itemKind === 200) {
                            this.drawRect(this.textcontext, leftRectAlign, (this.camera.gridH - 6) * this.tilesize, 3, 4, "rgba(0, 0, 0, 0.5)");
                            this.drawText(this.textcontext, "Enchant Pendant", leftTextAlign, (this.camera.gridH-5.4) * this.tilesize, true, "white", "black");
                            this.drawText(this.textcontext, "Enchant Ring",  leftTextAlign, (this.camera.gridH-4.4) * this.tilesize, true, "white", "black");
                            this.drawText(this.textcontext, "Enchant Weapon", leftTextAlign, (this.camera.gridH-3.4) * this.tilesize, true, "white", "black");
                            this.drawText(this.textcontext, "Drop", leftTextAlign, (this.camera.gridH-2.4) * this.tilesize, true, "white", "black");
                        } else if(ItemTypes.isGold(itemKind)) {
                            this.drawRect(this.textcontext, leftRectAlign, (this.camera.gridH - 3) * this.tilesize, 3, 1, "rgba(0, 0, 0, 0.5)");
                            this.drawText(this.textcontext, "Drop", leftTextAlign, (this.camera.gridH-2.4) * this.tilesize, true, "white", "black");
                        } else {
                            this.drawRect(this.textcontext, leftRectAlign, (this.camera.gridH - 4) * this.tilesize, 3, 2, "rgba(0, 0, 0, 0.5)");
                            this.drawText(this.textcontext, "Equip", leftTextAlign, (this.camera.gridH - 3.4) * this.tilesize, true, "white", "black");
                            this.drawText(this.textcontext, "Drop", leftTextAlign, (this.camera.gridH-2.4) * this.tilesize, true, "white", "black");
                        }
                    } else {
                        this.drawRect(this.textcontext, leftRectAlign, (this.camera.gridH - 4) * this.tilesize, 3, 2, "rgba(0, 0, 0, 0.5)");
                        this.drawText(this.textcontext, "Deposit 1", leftTextAlign, (this.camera.gridH-3.4) * this.tilesize, true, "white", "black");
                        this.drawText(this.textcontext, "Deposit All", leftTextAlign, (this.camera.gridH-2.4) * this.tilesize, true, "white", "black");
                    }
                }
            },
            drawCoordinates: function () {
                if (this.game.player)
                {
                    var s = this.scale;
                    this.textcontext.save();
                    this.textcontext.translate(this.camera.x * s, this.camera.y * s);

                    var realX = Math.floor(this.game.player.x / this.tilesize);
                    var realY = Math.floor(this.game.player.y / this.tilesize);
                    var coord = "(x:"+realX+",y:"+realY+")";
                    this.drawText(this.textcontext, coord, (this.camera.gridW-2) * this.tilesize, 6, true, "white", "black");
                    //var touch = Math.round(this.game.joystick.deltaX()) + " : " + Math.round(this.game.joystick.deltaY());
                    //this.drawText(this.textcontext, touch, (this.camera.gridW-2) * this.tilesize, this.tilesize * s, true, "white", "black");
                    //var zoom = $('body').css('zoom');
                    //if (this.game.renderer.isFirefox)
                    //	    zoom = $('body').css('-moz-transform') > 0 ? $('body').css('-moz-transform') : 1;

                    //this.drawText(this.textcontext, "zoom: "+zoom, (this.camera.gridW-2) * this.tilesize, this.tilesize * s, true, "white", "black");
                    this.textcontext.restore();
                }
            },

            // Can only be called once as it resets the previous positions.
            getOldOffset: function () {
                var p = this.game.player;
                var a = 0, b = 0;

                if (p && p.isMoving())
                {
                    a = (p.prevX - p.x) * this.scale;
                    b = (p.prevY - p.y) * this.scale;
                    p.prevX = 0;
                    p.prevY = 0;
                    // Prevent overdrawing.
                    var c = this.tilesize*this.scale;
                    if (Math.abs(a) >= c ||
                        Math.abs(b) >= c)
                    {
                        this.forceRedraw = true;
                    }
                }

                return {"x": a, "y": b};
            },

            drawOldTerrain: function () {
                var self = this,
                    m = this.game.map;
                //tilesetwidth = m.tilesets[this.scale-1].width / m.tilesize;
                var p = this.game.player;
                var c = this.camera;

                var oldoffset = this.getOldOffset();

                if (p.prevOrientation !== p.orientation)
                    this.forceRedraw = true;

                if (!p || !p.isMoving() || this.forceRedraw)
                {
                    this.drawBackground(this.background, "#12100D");
                    return;
                }

                this.buffer.save();
                this.clearBuffer(this.buffer);
                this.foreground.save();

                this.background.save();
                this.drawBackground(this.buffer, "#12100D");
                this.buffer.drawImage(this.background.canvas, oldoffset.x, oldoffset.y);

                this.drawBackground(this.background, "#12100D");
                this.background.drawImage(this.buffer.canvas, 0, 0);

                this.setCameraView(this.background);
                this.drawTerrain(this.background);
                //this.drawAnimatedTiles(false, this.background);
                this.background.restore();

                this.foreground.save();
                this.clearBuffer(this.buffer);
                this.buffer.drawImage(this.foreground.canvas,oldoffset.x,oldoffset.y);
                this.setCameraView(this.buffer);
                this.drawHighTiles(this.buffer);
                this.clearScreen(this.foreground);
                this.foreground.drawImage(this.buffer.canvas, 0, 0);

                this.foreground.restore();
                this.buffer.restore();

            },

            drawTerrain: function(ctx) {
                var self = this,
                    m = this.game.map,
                    p = this.game.player,
                    tilesetwidth = this.tileset.width / m.tilesize;


                var optimized = false;
                if (p && p.isMoving() && !this.forceRedraw)
                    optimized = true;


                ctx.save();
                //log.info("optimized:"+optimized);

                this.game.forEachVisibleTile(function (id, index) {
                    if(!m.isHighTile(id) && !m.isAnimatedTile(id)) { // Don't draw unnecessary tiles
                        self.drawTile(ctx, id, self.tileset, tilesetwidth, m.width, index);
                    }
                }, 1, optimized);

                ctx.restore()


            },

            drawHighTerrain: function() {
                var p = this.game.player;

                if (!p || !p.isMoving() || this.forceRedraw)
                {
                    this.foreground.save();
                    this.clearScreen(this.foreground);
                    this.setCameraView(this.foreground);
                    this.drawHighTiles(this.foreground);
                    this.foreground.restore();
                }
            },

            drawAnimatedTiles: function(dirtyOnly, ctx) {
                if (!this.camera.isattached)
                   return;

                var self = this,
                    m = this.game.map,
                    tilesetwidth = this.tileset.width / m.tilesize;

                this.animatedTileCount = 0;
                this.game.forEachAnimatedTile(function (tile) {
                    if(dirtyOnly) {
                        if(tile.isDirty) {
                            self.drawTile(ctx, tile.id, self.tileset, tilesetwidth, m.width, tile.index);
                            tile.isDirty = false;
                        }
                    } else {
                        self.drawTile(ctx, tile.id, self.tileset, tilesetwidth, m.width, tile.index);
                        self.animatedTileCount += 1;
                    }
                });
            },

            drawDirtyAnimatedTiles: function(ctx) {
                this.drawAnimatedTiles(true, ctx);
            },

            drawHighTiles: function(ctx) {
                var self = this,
                    m = this.game.map,
                    tilesetwidth = this.tileset.width / m.tilesize;

                this.highTileCount = 0;
                var p = this.game.player;

                var optimized = false;
                if (p && p.isMoving() && !this.forceRedraw)
                {
                    optimized = true;
                }

                this.game.forEachVisibleTile(function (id, index) {
                    if(m.isHighTile(id)) {
                        self.clearTile(ctx, m.width, index);
                        self.drawTile(ctx, id, self.tileset, tilesetwidth, m.width, index);
                        self.highTileCount += 1;
                    }
                }, 1, optimized);

            },

            drawBackground: function(ctx, color) {
                ctx.fillStyle = color;
                ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            },

            drawTutorialText: function() {
                // drawText: function(ctx, text, x, y, centered, color, strokeColor) {
                if (!this.tutorialText)
                    return;

                var view = this.toptextcontext;

                this.drawText(view, this.tutorialText, view / 2, (view / 3) * 4, true);
            },

            setNightMode: function() {
                var self = this;

                self.bgrcanvas.style.color = 'rgba(0, 0, 20, 0.1)';
            },

            setDayMode: function() {
                self.background.style.backgroundColor = 'rgba(0, 0, 0, 0)';
            },

            drawFPS: function() {
                var nowTime = new Date(),
                    diffTime = nowTime.getTime() - this.lastTime.getTime();

                if (diffTime >= 2000) {
                    this.realFPS = this.frameCount;
                    this.frameCount = 0;
                    this.lastTime = nowTime;
                    this.FPS = this.realFPS;
                }
                this.frameCount++;

                //this.drawText(this.toptextcontext, "FPS: " + this.realFPS + " / " + this.maxFPS, 30, 30, false);
                this.drawText(this.toptextcontext, "FPS: " + this.realFPS, 10, 11, false);
            },

            drawDebugInfo: function() {
                if(this.isDebugInfoVisible) {
                    this.drawFPS();
                    //this.drawText(this.toptextcontext, "A: " + this.animatedTileCount, 50, 20, false);
                    //this.drawText(this.toptextcontext, "H: " + this.highTileCount, 70, 20, false);
                }
            },

            drawCombatInfo: function() {
                var self = this;

                switch(this.scale) {
                    case 2: this.setFontSize(20); break;
                    case 3: this.setFontSize(30); break;
                }
                this.game.infoManager.forEachInfo(function(info) {
                    self.textcontext.save();
                    self.textcontext.globalAlpha = info.opacity;
                    self.drawText(self.textcontext, info.value, (info.x + 8), Math.floor(info.y), true, info.fillColor, info.strokeColor);
                    self.textcontext.restore();
                });
                this.initFont();
            },

            drawHUD: function() {
                /**
                 * Draws HUD (PVP, Tutorial, Etc);
                  */

                if (this.game && this.game.player && (this.game.player.pvpFlag || this.game.player.pvpWaitFlag)) {
                    this.toptextcontext.save();
                    var time = this.game.getPVPTimer();


                    switch (this.scale) {
                        case 1: this.setFontSize(10); break;
                        case 2: this.setFontSize(20); break;
                        case 3: this.setFontSize(30); break;
                    }

                    this.drawText(this.toptextcontext, "" + this.game.redkills,
                        this.getWidth() / 2 - 100 * this.scale,
                        10 * this.scale,
                        true,
                        "#cf7c6a");

                    this.drawText(this.toptextcontext, time,
                        this.getWidth() / 2,
                        10 * this.scale,
                        true,
                        "#fcda5c");

                    this.drawText(this.toptextcontext, "" + this.game.bluekills,
                        this.getWidth() / 2 + 100 * this.scale,
                        10 * this.scale,
                        true,
                        "#0085E5");

                    this.toptextcontext.restore();

                    this.initFont();
                }
            },

            setCameraView: function(ctx) {
                this.camera.setRealCoords();
                ctx.translate(-this.camera.x * this.scale, -this.camera.y * this.scale);
            },
            setCameraViewText: function(ctx) {
                ctx.translate(-this.camera.x * this.scale, -this.camera.y * this.scale);
            },

            clearScreen: function(ctx) {
                ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            },

            clearBuffer: function(ctx) {
                ctx.clearRect(0, 0, this.canvas.width+this.tilesize, this.canvas.height+this.tilesize);
            },

            clearScreenText: function(ctx) {
                ctx.clearRect(0, 0, this.textcanvas.width, this.textcanvas.height);
            },

            getPlayerImage: function() {
                var canvas = document.createElement('canvas'),
                    ctx = canvas.getContext('2d'),
                    os = this.upscaledRendering ? 1 : this.scale,
                    player = this.game.player,
                    sprite = player.getArmorSprite(),
                    spriteAnim = sprite.animationData["idle_down"],
                // character
                    row = spriteAnim.row,
                    w = sprite.width * os,
                    h = sprite.height * os,
                    y = row * h,
                // weapon
                    weapon = this.game.sprites[this.game.player.getWeaponName()],
                    ww = weapon.width * os,
                    wh = weapon.height * os,
                    wy = wh * row,
                    offsetX = (weapon.offsetX - sprite.offsetX) * os,
                    offsetY = (weapon.offsetY - sprite.offsetY) * os,
                // shadow
                    shadow = this.game.shadows["small"],
                    sw = shadow.width * os,
                    sh = shadow.height * os,
                    ox = -sprite.offsetX * os,
                    oy = -sprite.offsetY * os;

                canvas.width = w;
                canvas.height = h;

                ctx.clearRect(0, 0, w, h);
                ctx.drawImage(shadow.image, 0, 0, sw, sh, ox, oy, sw, sh);
                ctx.drawImage(sprite.image, 0, y, w, h, 0, 0, w, h);
                ctx.drawImage(weapon.image, 0, wy, ww, wh, offsetX, offsetY, ww, wh);

                return canvas.toDataURL("image/png");
            },

            renderStaticCanvases: function() {

                this.drawOldTerrain();

                if (this.forceRedraw || this.game.player && !this.game.player.isMoving())
                {
                    this.background.save();
                    this.setCameraView(this.background);
                    this.drawTerrain(this.background);
                    this.drawHighTerrain();
                    this.background.restore();

                }

                this.game.renderbackground = false;
                this.forceRedraw = false;
            },

            renderFrame: function() {
                if (this.mobile) {
                    this.clearDirtyRects();
                    this.preventFlickeringBug();
                } else
                    this.clearScreen(this.context);

                this.clearScreenText(this.textcontext);
                this.clearScreenText(this.toptextcontext);

                this.renderStaticCanvases();

                this.textcontext.save();
                this.toptextcontext.save();
                this.context.save();

                this.setCameraView(this.context);
                this.setCameraView(this.textcontext);
                this.setCameraView(this.toptextcontext);

                this.drawAnimatedTiles(this.mobile, this.context);

                this.drawSelectedCell();

                this.drawEntityNames();

                if (!this.mobile && !this.tablet) {
                    if (this.game.cursorVisible) {
                        this.drawTargetCell();
                        this.drawAttackTargetCell();
                    }
                }

                this.drawEntities(this.mobile);
                this.drawCombatInfo();
                this.drawInventory();

                this.context.restore();
                this.textcontext.restore();
                this.toptextcontext.restore();

                if (!this.mobile && !this.tablet) {
                    if (this.game.cursorVisible)
                        this.drawCursor();
                }

            },

            preventFlickeringBug: function() {
                if(this.fixFlickeringTimer.isOver(this.game.currentTime))
                    this.context.fillRect(0, 0, 0, 0);
            },

            cleanPathing: function() {
                this.clearScreen(this.context);
            }
        });

        var getX = function(id, w) {
            if(id === 0) {
                return 0;
            }
            return (id % w === 0) ? w - 1 : (id % w) - 1;
        };

        return Renderer;
    });
