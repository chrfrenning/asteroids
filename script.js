window.addEventListener('load', function(){
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth; 
    canvas.height = window.innerHeight;

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

        get length() {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        }

        normalize() {
            let length = this.length;
            return new Vector(this.x / length, this.y / length);
        }
    }

    class Projectile {
        constructor(position, direction) {
            this.position = position;
            this.direction = direction.normalize().multiply(10); 
        }
        
        update() {
            this.position = this.position.add( this.direction );
        }        

        draw(context) {
            context.fillStyle = 'yellow';
                    
            context.translate(this.position.x, this.position.y);
            context.beginPath();
            context.arc(0, 0, 5, 0, Math.PI * 2);
            context.fill();

            context.resetTransform();
        }
    }

    class Asteroid {
        constructor(position, direction) {
            this.position = position;
            this.direction = direction.multiply(5);
            this.size = (Math.random() * 50 ) + 50;
        }
        
        update() {
            this.position = this.position.add( this.direction );
            // if outside the game area, wrap around
            if (this.position.x < -this.size) {
                this.position.x = canvas.width + this.size;
            }
            if (this.position.x > canvas.width + this.size) {
                this.position.x = -this.size;
            }
            if ( this.position.y < -this.size ) {
                this.position.y = canvas.height + this.size;
            }
            if ( this.position.y > canvas.height + this.size ) {
                this.position.y = -this.size;
            }
        }        

        draw(context) {
            const astroid_sprite = document.getElementById('asteroid');
            

            context.fillStyle = 'brown';
                    
            context.translate(this.position.x, this.position.y);
            //context.beginPath();
            //context.arc(0, 0, this.size, 0, Math.PI * 2);

            context.drawImage(astroid_sprite, 0, 0, this.size, this.size);
            //context.fill();

            context.resetTransform();
        }

    }

    class Player {
            constructor(game) {
                this.position = new Vector(game.width / 2, game.height / 2);
                console.log(this.position);
                this.direction = new Vector(0.4, 0.0);
                this.game = game;
                this.is_dead = false;
                this.size = 10;
            }

            update() {
                this.position = this.position.add( this.direction );
                // if outside the game area, wrap around
                if (this.position.x < 0) {
                    this.position.x = canvas.width;
                } else if (this.position.x > canvas.width) {
                    this.position.x = 0;
                }
                if ( this.position.y < -this.size ) {
                    this.position.y = canvas.height + this.size;
                } else if ( this.position.y > canvas.height + this.size ) {
                    this.position.y = -this.size;
                }

            }

            draw(context) {
                // draw a triangle that points in the direction of this.direction
                context.fillStyle = 'red';
                
                context.translate(this.position.x, this.position.y);
                context.rotate(Math.atan2(this.direction.y, this.direction.x));

                // context.beginPath();
                
                // context.moveTo(0, 0);
                // context.lineTo(0, -10);
                // context.lineTo(20, -5);
                // context.fill();

                let size = 50;
                const player_sprite = document.getElementById('spaceship');
                context.drawImage(player_sprite, -size/2, -size/2, size, size);

                context.resetTransform();

                //context.fillStyle = 'yellow';
                //context.fillRect(this.position.x * 20, this.position.y * 20, 20, 20);
            }

            isDead() {
                return this.is_dead;
            }
    }

    class InputHandler{
        constructor(game, player) {
            this.game = game;
            this.player = player;
            this.keysPressed = {};
            this.counter = 0;

            document.addEventListener('keydown', (event) => {
                console.log(event.key + " down");
                this.keysPressed[event.code] = true;
            });

            document.addEventListener('keyup', (event) => {
                console.log(event.key + " up");
                this.keysPressed[event.code] = false;
            });
        }

        update() {
            let rotationStep = 5;
            let shootSpeed = 9;
            for (let key in this.keysPressed) {
                console.log("checking " + key);
                if (this.keysPressed[key]) {
                    console.log(key + " is pressed");
                    switch(key) {
                        case 'ArrowLeft':
                        case 'KeyA':
                            this.player.direction = this.player.direction.rotate(-rotationStep);
                            break;
                        case 'ArrowRight':
                        case 'KeyD':
                            this.player.direction = this.player.direction.rotate(rotationStep);
                            break;
                        case 'ArrowUp':
                        case 'KeyW':
                            this.player.direction = this.player.direction.multiply(1.2);
                            break;
                        case 'ArrowDown':
                        case 'KeyS':
                            this.player.direction = this.player.direction.multiply(0.8);
                            break; 
                        case 'Space':
                            this.counter++;
                            if ( this.counter % shootSpeed == 0 )
                                this.game.projectiles.push( new Projectile(this.player.position, this.player.direction) );
                            break;
                    }
                }
            }
        }
    }

    class Game{
        constructor(width, height){
            this.width = width;
            this.height = height;
            this.player = new Player(this);
            this.input = new InputHandler(this, this.player);
            this.projectiles = [];
            this.asteroids = [];
            this.score = 0;
            // Create asteroids
            let numberOfAsteroids = 20;
            for (let i = 0; i < numberOfAsteroids; i++) {
                this.createAsteroid();
            }
        }

        createAsteroid(){
            let x = Math.random() * this.width;
            let y = Math.random() * this.height;
            let direction = new Vector(Math.random(), Math.random()).multiply(Math.random());
            // move the asteroid outside the screen boundary
            if (Math.random() < 0.5) {
                if (Math.random() < 0.5) {
                    x = -100;
                } else {
                    x = this.width + 100;
                }
            } else {
                if (Math.random() < 0.5) {
                    y = -100;
                } else {
                    y = this.height + 100;
                }
            }
            this.asteroids.push( new Asteroid(new Vector(x, y), direction) );
        }

        update() {
            this.input.update();
            this.player.update();
            for (let i = 0; i < this.projectiles.length; i++) {
                this.projectiles[i].update();
            }
            for (let i = 0; i < this.asteroids.length; i++) {
                this.asteroids[i].update();
            }
            // check if any projectile hits any asteroid
            for (let i = 0; i < this.projectiles.length; i++) {
                for (let j = 0; j < this.asteroids.length; j++) {
                    let dx = this.projectiles[i].position.x - this.asteroids[j].position.x;
                    let dy = this.projectiles[i].position.y - this.asteroids[j].position.y;
                    let distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < this.asteroids[j].size) {
                        this.projectiles.splice(i, 1);
                        this.asteroids.splice(j, 1);
                        i--;
                        j--;
                        this.score++;
                        this.createAsteroid();
                        break;
                    }
                }
            }
            // check if player hits any asteroid
            for (let j = 0; j < this.asteroids.length; j++) {
                let dx = this.player.position.x - this.asteroids[j].position.x;
                let dy = this.player.position.y - this.asteroids[j].position.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < this.asteroids[j].size) {
                    this.player.is_dead = true;
                    break;
                }
            }
        }

        draw(context) {
            this.player.draw(context);
            for (let i = 0; i < this.projectiles.length; i++) {
                this.projectiles[i].draw(context);
            }
            for (let i = 0; i < this.asteroids.length; i++) {
                this.asteroids[i].draw(context);
            }
            this.drawScore(context, this.score);
            if (this.player.isDead()) {
                context.fillStyle = 'white';
                const text = 'Game Over';
                context.font = '80px RetroFont';
                const textWidth = context.measureText(text).width;
                context.fillText(text, (canvas.width / 2) - (textWidth / 2), canvas.height / 2);
                // write below hit refresh to try again
                context.font = '40px RetroFont';
                const text2 = 'Hit refresh to try again';
                const textWidth2 = context.measureText(text2).width;
                context.fillText(text2, (canvas.width / 2) - (textWidth2 / 2), canvas.height / 2 + 50);
                
            }
        }

        drawScore(context, score) {
            context.fillStyle = 'white';
            context.font = '40px RetroFont';
            context.fillText('Score: ' + score, 10, 45);
        }
    }

    console.log(canvas.width, canvas.height);
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
        if ( elapsed > 1 ) {
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