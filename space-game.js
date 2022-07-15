// space-game.js
// don't forget to validate at jslint.com

/*jslint devel: true, browser: true, fudge: true */
/*global window Audio*/

(function () {
    "use strict";

    const SPACE_KEYCODE = 32;
    const RIGHTARROW_KEYCODE = 39;
    const LEFTARROW_KEYCODE = 37;
    const UPARROW_KEYCODE = 38;
    const DOWNARROW_KEYCODE = 40;
    const ESCAPE_KEYCODE = 27;


    const DIRECTION = {
        LEFT: "left",
        RIGHT: "right",
        UP: "up",
        DOWN: "down"
    };

    let _left_key_down = false;
    let _right_key_down = false;
    let _down_key_down = false;
    let _up_key_down = false;

    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min;
    }

    function byID(e) {
        return document.getElementById(e);
    }

    function Sprite(sprite_object_spec) {

        let {
            image_file,
            image_width,
            image_height,
            start_left,
            start_top,
            does_disappear
        } = sprite_object_spec;

        // ships are visible at start, bullets not!
        let _visible = !does_disappear;
        let _left = start_left;
        let _top = start_top;

        // these are constants because
        // these values never change

        const _disappears = does_disappear;
        const _width = image_width;
        const _height = image_height;
        const _img = document.createElement("img");

        _img.src = image_file;

        let sprite = {};

        sprite.visible = function () {
            return _visible;
        };

        sprite.disappears = function () {
            return _disappears;
        };

        sprite.left = function () {
            return _left;
        };

        sprite.setLeft = function (value) {
            _left = value;
        };

        sprite.top = function () {
            return _top;
        };

        sprite.setTop = function (value) {
            _top = value;
        };

        sprite.width = function () {
            return _width;
        };

        sprite.height = function () {
            return _height;
        };

        sprite.img = function () {
            return _img;
        };

        sprite.moveLeft = function () {
            _left -= 5;
            sprite.boundaryCheck();
        };

        sprite.moveRight = function () {
            _left += 5;
            sprite.boundaryCheck();
        };

        sprite.moveUp = function () {
            _top -= 5;
            sprite.boundaryCheck();
        };

        sprite.moveDown = function () {
            _top += 5;
            sprite.boundaryCheck();
        };

        sprite.makeVisible = function () {
            _visible = true;
        };

        sprite.makeInvisible = function () {
            _visible = false;
        };

        sprite.boundaryCheck = function () {
            if (_left < 0) {
                if (_disappears) {
                    _visible = false;
                }
                _left = 0;
            }
            if (_top < 0) {
                if (_disappears) {
                    _visible = false;
                }
                _top = 0;
            }
            if (_left + _width > byID("gameboard").clientWidth) {
                if (_disappears) {
                    _visible = false;
                }
                _left = byID("gameboard").clientWidth - _width;
            }
            if (_top + _height > byID("gameboard").clientHeight) {
                if (_disappears) {
                    _visible = false;
                }
                _top = byID("gameboard").clientHeight - _height;
            }
        };

        return sprite;
    }

    function Ship(ship_file) {
        const ship_left = getRandomInt(0, byID("gameboard").clientWidth);
        const ship_top = getRandomInt(0, byID("gameboard").clientHeight);
        let ship = new Sprite(
            {
                image_file: ship_file,
                image_width: 150,
                image_height: 78,
                start_left: ship_left,
                start_top: ship_top
            }
        );

        const _img = document.createElement("img");

        _img.src = "images/player.png";

        return ship;
    }

    function PlayerShip() {
        const player_image = "images/player.png";
        let player = new Ship(player_image);

        player.navigate = function (keys, pressed) {
            switch (keys) {
            case RIGHTARROW_KEYCODE:
                _right_key_down = pressed;
                break;
            case LEFTARROW_KEYCODE:
                _left_key_down = pressed;
                break;
            case UPARROW_KEYCODE:
                _up_key_down = pressed;
                break;
            case DOWNARROW_KEYCODE:
                _down_key_down = pressed;
                break;
            }

            player.boundaryCheck();
        };

        player.moveShip = function (paused) {
            if (!paused) {
                if (_right_key_down) {
                    player.moveRight();
                }
                if (_left_key_down) {
                    player.moveLeft();
                }
                if (_up_key_down) {
                    player.moveUp();
                }
                if (_down_key_down) {
                    player.moveDown();
                }
            }
            player.boundaryCheck();
        };

        return Object.freeze(player);
    }

    function EnemyShip() {
        const enemy_image = "images/enemy.png";
        let enemy = new Ship(enemy_image);

        enemy.moveRandom = function (paused) {
            if (!paused) {
                const left_rnd = Boolean(getRandomInt(0, 2));
                const top_rnd = Boolean(getRandomInt(0, 2));
                if (left_rnd) {
                    enemy.moveLeft();
                } else {
                    enemy.moveRight();
                }
                if (top_rnd) {
                    enemy.moveUp();
                } else {
                    enemy.moveDown();
                }
            }
        };
        return Object.freeze(enemy);
    }

    function Bullet() {

        const bullet_image = "images/bullet.png";
        let bullet = new Sprite(
            {
                image_file: bullet_image,
                image_width: 36,
                image_height: 36,
                start_left: 0,
                start_top: 0,
                does_disappear: true
            }
        );
        let _direction = "";

        bullet.direction = function (value) {
            if (value !== undefined) {
                _direction = value;
            }
            return _direction;
        };

        bullet.setDirection = function (x1, y1, x2, y2) {
            let _deltax = x2 - x1;
            let _deltay = y2 - y1;
            let _absdx = Math.abs(_deltax);
            let _absdy = Math.abs(_deltay);

            if (_absdy > _absdx) {
                if (_deltay > 0) {
                    _direction = DIRECTION.DOWN;
                } else {
                    _direction = DIRECTION.UP;
                }
            } else {
                if (_deltax > 0) {
                    _direction = DIRECTION.RIGHT;
                } else {
                    _direction = DIRECTION.LEFT;
                }
            }
        };

        bullet.shoot = function (
            keys,
            player_left,
            player_top,
            enemy_left,
            enemy_top
        ) {

            if (keys === SPACE_KEYCODE) {
                if (!bullet.visible()) {
                    bullet.makeVisible();
                    bullet.setLeft(player_left);
                    bullet.setTop(player_top);
                    let audio = new Audio("mp3/launch.mp3");
                    audio.play();
                    bullet.setDirection(
                        player_left,
                        player_top,
                        enemy_left,
                        enemy_top
                    );
                }
            }
            bullet.boundaryCheck();
        };

        bullet.move = function (paused) {
            if (!paused) {
                if (bullet.visible()) {
                    switch (_direction) {
                    case DIRECTION.LEFT:
                        bullet.moveLeft();
                        break;
                    case DIRECTION.RIGHT:
                        bullet.moveRight();
                        break;
                    case DIRECTION.UP:
                        bullet.moveUp();
                        break;
                    case DIRECTION.DOWN:
                        bullet.moveDown();
                        break;
                    default:
                        bullet.moveLeft();
                    }
                }
            }
            bullet.boundaryCheck();
        };

        return Object.freeze(bullet);
    }

    function Game() {

        let _total_points = 0;
        let _game_paused = false;

        const _player_ship = new PlayerShip();
        const _enemy_ship = new EnemyShip();
        const _bullet = new Bullet();

        const displayPoints = function () {
            gcontext.clearRect(0, 0, 250, 150);
            gcontext.fillStyle = "#ffffff";
            gcontext.fillRect(0, 0, 250, 150);
            gcontext.font = "30px Arial";
            gcontext.fillStyle = "#000000";
            gcontext.fillText("Score: " + _total_points, 10, 50);
        };

        const moveBackground = function () {
            if (!_game_paused) {
                const bg = byID("universe");
                const bg_cs = window.getComputedStyle(bg);
                const raw_x = bg_cs.getPropertyValue(
                    "background-position-x"
                );
                const raw_y = bg_cs.getPropertyValue(
                    "background-position-y"
                );
                const current_x = parseInt(raw_x, 10);
                const current_y = parseInt(raw_y, 10);
                const new_x = current_x - 1;
                const new_y = current_y;
                const newpos = new_x + "px " + new_y + "px";
                byID("universe").style.backgroundPosition = newpos;
            }
        };

        const clearObjects = function () {

            gcontext.clearRect(
                _player_ship.left(),
                _player_ship.top(),
                _player_ship.width(),
                _player_ship.height()
            );

            gcontext.clearRect(
                _enemy_ship.left(),
                _enemy_ship.top(),
                _enemy_ship.width(),
                _enemy_ship.height()
            );

            if (_bullet.visible()) {
                gcontext.clearRect(
                    _bullet.left(),
                    _bullet.top(),
                    _bullet.width(),
                    _bullet.height()
                );
            }
        };

        const drawObjects = function () {

            gcontext.drawImage(
                _player_ship.img(),
                _player_ship.left(),
                _player_ship.top()
            );

            gcontext.drawImage(
                _enemy_ship.img(),
                _enemy_ship.left(),
                _enemy_ship.top()
            );

            if (_bullet.visible()) {
                gcontext.drawImage(
                    _bullet.img(),
                    _bullet.left(),
                    _bullet.top()
                );
            }
        };

        const checkKeys = function () {

            document.addEventListener("keydown", function (key_event) {
                if (key_event.which === ESCAPE_KEYCODE) {
                    if (_game_paused) {
                        _game_paused = false;
                        byID("pause").classList.add("hidden");
                    } else {
                        _game_paused = true;
                        byID("pause").classList.remove("hidden");
                    }
                } else if (!_game_paused) {
                    clearObjects();

                    _player_ship.navigate(key_event.which, true);
                    _bullet.shoot(
                        key_event.which,
                        _player_ship.left(),
                        _player_ship.top(),
                        _enemy_ship.left(),
                        _enemy_ship.top()
                    );

                    displayPoints();
                    drawObjects();
                }
            });
        };
        const releaseKeys = function () {
            document.addEventListener("keyup", function (key_event) {
                if (!_game_paused) {
                    clearObjects();

                    _player_ship.navigate(
                        key_event.which,
                        false
                    );

                    displayPoints();
                    drawObjects();
                }
            });
        };

        const checkResize = function () {
            window.addEventListener("resize", function () {
                const u_width = byID("universe").clientWidth;
                gcontext.canvas.width = u_width;
                const u_height = byID("universe").clientHeight;
                gcontext.canvas.height = u_height;
                _player_ship.boundaryCheck();
                _enemy_ship.boundaryCheck();
                _bullet.boundaryCheck();
            });
        };

        const collisions = function (enemy) {
            if (!_game_paused && _bullet.visible()) {
                const bl = _bullet.left();
                const bw = _bullet.width();
                const bt = _bullet.top();
                const bh = _bullet.height();
                const el = enemy.left();
                const ew = enemy.width();
                const et = enemy.top();
                const eh = enemy.height();

                if (
                    (
                        (bl + bw < el) || (bl > el + ew)
                    ) ||
                    (
                        (bt + bh < et) || (bt > et + eh)
                    )
                ) {
                    return false;
                } else {
                    return true;
                }
            } else {
                return false;
            }
        };

        const play = function () {
            clearObjects();
            _player_ship.moveShip(_game_paused);
            _enemy_ship.moveRandom(_game_paused);
            _bullet.move(_game_paused);
            displayPoints();
            drawObjects();
            if (collisions(_enemy_ship)) {
                _total_points += 1;
                displayPoints();
            }
        };
        return Object.freeze({
            displayPoints,
            moveBackground,
            clearObjects,
            drawObjects,
            checkKeys,
            releaseKeys,
            checkResize,
            collisions,
            play
        });
    }

    // spacegame global gameboard canvas context letiable
    const gcontext = byID("gameboard").getContext("2d");

    // gameboard canvas
    const u_width = byID("universe").clientWidth;
    gcontext.canvas.width = u_width;
    const u_height = byID("universe").clientHeight;
    gcontext.canvas.height = u_height;

    const game = new Game();

    game.checkResize();
    game.checkKeys();
    game.releaseKeys();
    setInterval(game.moveBackground, 10);
    setInterval(game.play, 1);
}());