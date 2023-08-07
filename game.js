// Main Menu Scene
var MainMenu = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

    function MainMenu ()
    {
        Phaser.Scene.call(this, { key: 'mainMenu' });
    },

    create: function ()
    {
        this.add.text(100, 100, '2048 Game', { fontSize: '64px', fill: '#FFF' });
        var playButton = this.add.text(100, 200, 'Play', { fontSize: '32px', fill: '#FFF' });
        playButton.setInteractive();
        playButton.on('pointerdown', () => this.scene.start('game'));
    }
});

// Game Over Scene
var GameOver = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

    function GameOver ()
    {
        Phaser.Scene.call(this, { key: 'gameOver' });
    },

    create: function ()
    {
        this.add.text(100, 100, 'Game Over!', { fontSize: '64px', fill: '#FFF' });
        this.add.text(100, 200, 'Score: ' + this.sys.game.score, { fontSize: '32px', fill: '#FFF' });
        var retryButton = this.add.text(100, 300, 'Retry', { fontSize: '32px', fill: '#FFF' });
        retryButton.setInteractive();
        retryButton.on('pointerdown', () => this.scene.start('game'));
    }
});

// Game Scene
var Game = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

    function Game ()
    {
        Phaser.Scene.call(this, { key: 'game' });
    },

    create: function ()
    {
        // Create a 4x4 grid of squares
        this.size = 150; // size of each square
        this.padding = 10; // padding between squares
        this.offset = this.size + this.padding; // total offset between the start of each square

        // Calculate the offsets to center the grid
        this.offsetX = (this.sys.game.config.width - this.offset * 4) / 2;
        this.offsetY = (this.sys.game.config.height - this.offset * 4) / 2;

        this.grid = [];
        for (var i = 0; i < 4; i++) {
            this.grid[i] = [];
            for (var j = 0; j < 4; j++) {
                this.grid[i][j] = 0;
            }
        }

        this.graphics = this.add.graphics();
        this.textGroup = this.add.group();

        // Initialize score
        this.sys.game.score = 0;
        this.scoreText = this.add.text(10, 10, 'Score: 0', { fontSize: '32px', fill: '#FFF' });

        // Add a new number to the grid at the start of the game
        this.addNumber();
        this.drawGrid();

        // Add keyboard controls
        this.cursors = this.input.keyboard.createCursorKeys();

        // Add swipe controls
        this.input.on('pointerdown', function (pointer) {
            this.startX = pointer.x;
            this.startY = pointer.y;
        }, this);

        this.input.on('pointerup', function (pointer) {
            var endX = pointer.x;
            var endY = pointer.y;

            var dx = endX - this.startX;
            var dy = endY - this.startY;

            if (Math.abs(dx) > Math.abs(dy)) {
                // Horizontal swipe
                if (dx > 0) {
                    this.moveTiles('right');
                } else {
                    this.moveTiles('left');
                }
            } else {
                // Vertical swipe
                if (dy > 0) {
                    this.moveTiles('down');
                } else {
                    this.moveTiles('up');
                }
            }
        }, this);
    },

    drawGrid: function ()
    {
        this.graphics.clear();
        this.textGroup.clear(true);

        for (var i = 0; i < 4; i++) {
            for (var j = 0; j < 4; j++) {
                var x = this.offsetX + i * this.offset;
                var y = this.offsetY + j * this.offset;

                // Draw the square
                var color;
                switch (this.grid[i][j]) {
                    case 2: color = 0xFFA500; break; // orange
                    case 4: color = 0xFF0000; break; // red
                    case 8: color = 0x008000; break; // green
                    case 16: color = 0x0000FF; break; // blue
                    default: color = 0xFFFFFF; // white
                }
                this.graphics.fillStyle(color, 1);
                this.graphics.fillRect(x, y, this.size, this.size);

                // Draw the number
                if (this.grid[i][j] !== 0) {
                    this.textGroup.add(this.add.text(x, y, this.grid[i][j], { fontSize: '32px', fill: '#FFF' }));
                }
            }
        }
    },

    addNumber: function ()
    {
        var emptySpaces = [];

        // Find all empty spaces
        for (var i = 0; i < 4; i++) {
            for (var j = 0; j < 4; j++) {
                if (this.grid[i][j] === 0) {
                    emptySpaces.push({ x: i, y: j });
                }
            }
        }

        // Choose a random empty space
        if (emptySpaces.length > 0) {
            var randomSpace = Phaser.Math.RND.pick(emptySpaces);
            // Assign it a 2 or a 4
            this.grid[randomSpace.x][randomSpace.y] = (Phaser.Math.RND.integerInRange(1, 2) * 2);
        }
    },

    update: function ()
    {
        // Move tiles based on keyboard input
        if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
            this.moveTiles('left');
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
            this.moveTiles('right');
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            this.moveTiles('up');
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
            this.moveTiles('down');
        }
    },

    moveTiles: function (direction)
    {
        var dx = (direction === 'right') - (direction === 'left');
        var dy = (direction === 'down') - (direction === 'up');
    
        var startI = (dy === 1) ? 3 : 0;
        var startJ = (dx === 1) ? 3 : 0;
        var endI = (dy === 1) ? -1 : 4;
        var endJ = (dx === 1) ? -1 : 4;
        var stepI = -dy;
        var stepJ = -dx;
    
        var moved = false;
        var merged = [];
    
        for (var i = 0; i < 4; i++) {
            merged[i] = [];
            for (var j = 0; j < 4; j++) {
                merged[i][j] = false;
            }
        }
    
        for (var i = startI; i !== endI; i += stepI) {
            for (var j = startJ; j !== endJ; j += stepJ) {
                if (this.grid[i][j] !== 0) {
                    var x = i;
                    var y = j;
    
                    // Move the tile as far as possible
                    while (x >= 0 && x < 4 && y >= 0 && y < 4) {
                        var nextX = x + dx;
                        var nextY = y + dy;
    
                        if (nextX < 0 || nextX > 3 || nextY < 0 || nextY > 3 || this.grid[nextX][nextY] !== 0) {
                            break;
                        }
    
                        x = nextX;
                        y = nextY;
                    }
    
                    // Merge the tile with another tile of the same value
                    var nextX = x + dx;
                    var nextY = y + dy;
    
                    if (nextX >= 0 && nextX <= 3 && nextY >= 0 && nextY <= 3 && this.grid[nextX][nextY] === this.grid[i][j] && !merged[nextX][nextY]) {
                        this.grid[nextX][nextY] *= 2;
                        this.grid[i][j] = 0;
                        merged[nextX][nextY] = true;
                        moved = true;

                        // Update score
                        this.sys.game.score += this.grid[nextX][nextY];
                        this.scoreText.setText('Score: ' + this.sys.game.score);
                    } else if (x !== i || y !== j) {
                        // Move the tile to the new position
                        this.grid[x][y] = this.grid[i][j];
                        this.grid[i][j] = 0;
                        moved = true;
                    }
                }
            }
        }
    
        if (moved) {
            this.addNumber();
            this.drawGrid();

            if (this.checkGameOver()) {
                this.scene.start('gameOver');
            }
        }
    },

    checkGameOver: function ()
    {
        // Check for empty spaces
        for (var i = 0; i < 4; i++) {
            for (var j = 0; j < 4; j++) {
                if (this.grid[i][j] === 0) {
                    return false;
                }
            }
        }

        // Check for adjacent tiles with the same value
        for (var i = 0; i < 4; i++) {
            for (var j = 0; j < 4; j++) {
                if (i < 3 && this.grid[i][j] === this.grid[i + 1][j] || j < 3 && this.grid[i][j] === this.grid[i][j + 1]) {
                    return false;
                }
            }
        }

        // If no empty spaces or adjacent tiles with the same value, game over
        return true;
    }
});

var config = {
    type: Phaser.AUTO,
    width: 800, // Adjust as needed
    height: 800, // Adjust as needed
    scene: [ MainMenu, Game, GameOver ]
};

var game = new Phaser.Game(config);
