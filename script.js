window.addEventListener('load', function(){
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = 500;
    canvas.height = 500;

    class Vector {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
        
        add(rhs) {
            return new Vector(this.x + rhs.x, this.y + rhs.y);
        }

        multiply(scalar) {
            return new Vector(this.x * scalar, this.y * scalar);
        }

        equals(rhs) {
            return this.x === rhs.x && this.y === rhs.y;
        }

        rotate(degrees) {
            let new_x = Math.cos(degrees * Math.PI / 180) * this.x - Math.sin(degrees * Math.PI / 180) * this.y;
            let new_y = Math.sin(degrees * Math.PI / 180) * this.x + Math.cos(degrees * Math.PI / 180) * this.y;
            return new Vector(new_x, new_y);
        }
    }

    class Projectile {

    }

    class Asteroid {

    }

    class Player {
            constructor(game) {
                this.position = new Vector(2, 15);
                this.direction = new Vector(0.2, 0);
                this.game = game;
                this.is_dead = false;
            }

            update() {
                this.position = this.position.add( this.direction );
            }

            draw(context) {
                // draw a triangle that points in the direction of this.direction
                context.fillStyle = 'red';
                
                context.translate(this.position.x * 20, this.position.y * 20);
                context.rotate(Math.atan2(this.direction.y, this.direction.x));

                context.beginPath();
                
                context.moveTo(0, 0);
                context.lineTo(0, -10);
                context.lineTo(20, -5);
                context.fill();

                context.resetTransform();

                //context.fillStyle = 'yellow';
                //context.fillRect(this.position.x * 20, this.position.y * 20, 20, 20);
            }

            isDead() {
                return this.is_dead;
            }
    }

    class InputHandler{
        constructor(player) {
            document.addEventListener('keydown', (event) => {
                let newDirection = new Vector(0, 0);
                switch(event.code) {
                    case 'ArrowLeft':
                        newDirection = new Vector(-1, 0);
                        break;
                    case 'ArrowUp':
                        newDirection = new Vector(0, -1);
                        break;
                    case 'ArrowRight':
                        newDirection = new Vector(1, 0);
                        break;
                    case 'ArrowDown':
                        newDirection = new Vector(0, 1);
                    case 'KeyA':
                        player.direction = player.direction.rotate(-15);
                        break;
                    case 'KeyD':
                        player.direction = player.direction.rotate(15);
                        break;
                    case 'KeyW':
                        player.direction = player.direction.multiply(1.2);
                        break;
                    case 'KeyS':
                        player.direction = player.direction.multiply(0.8);
                        break;
                }
            });
        }
    }

    class Game{
        constructor(width, height){
            this.width = width;
            this.height = height;
            this.player = new Player(this);
            this.input = new InputHandler(this.player);
        }

        update(){
            this.player.update();
        }

        draw(context){
            this.player.draw(context);
        }
    }

    const game = new Game (canvas.width, canvas.height);

    let start, previousTimeStamp;

    function gameLoop(ts) {
        if ( start === undefined ) {
            start = ts;
        }
        const elapsed = ts - start;
        const delta = ts - previousTimeStamp;
        previousTimeStamp = ts;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update game state
        if ( elapsed > 150 ) {
            game.update();
            start = ts;
        }

        // Draw game
        game.draw(ctx);

        // Request next frame
        if ( !game.player.isDead() )
            requestAnimationFrame(gameLoop);
    }

    // Start the game loop
    requestAnimationFrame(gameLoop);
});