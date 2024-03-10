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

        subtract(rhs) {
            return new Vector(this.x - rhs.x, this.y - rhs.y);
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

    function wrapIfOutside( vector, size = 0, cnvas = canvas ) {
        let v = new Vector(vector.x, vector.y);

        if (v.x < -size) {
            v.x = cnvas.width + size;
            v.y = cnvas.height - v.y;
        }
        if (v.x > cnvas.width + size) {
            v.x = -size;
            v.y = cnvas.height - v.y;
        }
        if ( v.y < -size ) {
            v.y = cnvas.height + size;
            v.x = cnvas.width - v.x;
        }
        if ( v.y > cnvas.height + size ) {
            v.y = -size;
            v.x = cnvas.width - v.x;
        }

        return v;
    }

    class Projectile {
        constructor(position, direction, friendly = true) {
            this.position = position;
            this.direction = direction.add( direction.normalize().multiply(10) );
            this.friendly = friendly;
        }
        
        update(time) {
            this.position = this.position.add( this.direction.multiply(time) );
        }

        draw(context) {
            context.fillStyle = this.friendly ? 'yellow' : 'red';
            
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
        
        update(time) {
            this.position = this.position.add( this.direction.multiply(time) );
            this.position = wrapIfOutside(this.position, this.size);
        }        

        draw(context) {
            const astroid_sprite = document.getElementById('asteroid');
            
            context.fillStyle = 'brown';
                    
            context.translate(this.position.x, this.position.y);
            context.drawImage(astroid_sprite, 0, 0, this.size, this.size);
            context.resetTransform();
        }

    }

    class Saucer {
        constructor(game, position, direction) {
            this.position = position;
            this.direction = direction.multiply(5);
            this.size = (Math.random() * 10 ) + 25;
            this.counter = 0;
            this.last_shosts = 0;
            this.shield = 10;
        }
        
        update(time) {
            this.position = this.position.add( this.direction.multiply(time) );
            this.position = wrapIfOutside(this.position, this.size);

            if ( this.last_shot == 0 ) {
                this.last_shot = Math.floor(Date.now() / 1000);
            } else {
                // if less than one second ago, don't shoot
                if ( Math.floor(Date.now() / 1000) - this.last_shot < 2 )
                    return;

                // shoot at player
                if (Math.random() < 0.01) {

                    let direction = game.player.position.subtract(this.position).normalize().multiply(5);
                    // randomly miss
                    if (Math.random() < 0.4) {
                        direction = direction.rotate((Math.random() - 0.5) * 90);
                    }
                    game.projectiles.push( new Projectile(this.position, direction, false) );

                    // record time of last shot
                    this.last_shot = Math.floor(Date.now() / 1000);
                }
            }

            // go after player?
            if ( this.counter++ % 100 == 0 && Math.random() < 0.7 ) {
                this.direction = game.player.position.subtract(this.position).normalize().multiply(5);
            }
        }        

        draw(context) {
            //const astroid_sprite = document.getElementById('asteroid');
            
            context.translate(this.position.x, this.position.y);
            
            context.fillStyle = 'green';
            //context.drawImage(astroid_sprite, 0, 0, this.size, this.size);
            context.beginPath();
            context.arc(0, 0, this.size, 0, Math.PI * 2);
            context.fill();

            // draw shield number of blue rings around the saucer
            context.strokeStyle = 'blue';
            for (let i = 0; i < this.shield; i++) {
                context.beginPath();
                context.arc(0, 0, this.size + i * 2, 0, Math.PI * 2);
                context.stroke();
            }

            // draw a number to show shield strength
            context.fillStyle = 'white';
            context.font = '20px RetroFont';
            let tw = context.measureText(this.shield).width;
            context.fillText(this.shield, (this.size / 2) - (tw), 10);

            context.resetTransform();
        }

    }

    class Player {
            constructor(game) {
                this.position = new Vector(game.width / 2, game.height / 2);
                console.log(this.position);
                this.direction = new Vector(2, 0.0);
                this.game = game;
                this.is_dead = false;
                this.size = 10;
            }

            update(time) {
                this.position = this.position.add( this.direction.multiply(time) );
                this.position = wrapIfOutside(this.position, this.size);
            }

            draw(context) {
                // draw a triangle that points in the direction of this.direction
                context.fillStyle = 'red';
                
                context.translate(this.position.x, this.position.y);
                context.rotate(Math.atan2(this.direction.y, this.direction.x));

                let size = 50;
                const player_sprite = document.getElementById('spaceship');
                context.drawImage(player_sprite, -size/2, -size/2, size, size);

                context.resetTransform();
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

            document.addEventListener('keydown', (event) => {
                switch(event.code) {
                    case 'ArrowUp':
                    case 'KeyW':
                        this.player.direction = this.player.direction.add( this.player.direction.normalize() );
                        break;
                    case 'ArrowDown':
                    case 'KeyS':
                        this.player.direction = this.player.direction.subtract( this.player.direction.normalize() );
                        break; 
                    case 'Space':
                        this.game.projectiles.push( new Projectile(this.player.position, this.player.direction) );
                        break;
                    case 'ArrowLeft':
                    case 'KeyA':
                    case 'ArrowRight':
                    case 'KeyD':
                        //console.log(event.key + " down"); 
                        this.keysPressed[event.code] = true;
                }
                
            });

            document.addEventListener('keyup', (event) => {
                //console.log(event.key + " up");
                this.keysPressed[event.code] = false;
            });
        }

        update(time) {
            let rotationStep = 10;
            for (let key in this.keysPressed) {
                //console.log("checking " + key);
                if (this.keysPressed[key]) {
                    //console.log(key + " is pressed");
                    switch(key) {
                        case 'ArrowLeft':
                        case 'KeyA':
                            this.player.direction = this.player.direction.rotate(-rotationStep * time);
                            break;
                        case 'ArrowRight':
                        case 'KeyD':
                            this.player.direction = this.player.direction.rotate(rotationStep * time);
                            break;
                    }
                }
            }
        }
    }

    class Game {
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

            // Create saucer
            this.saucers = [];
            let numberOfSaucers = 2;
            for (let i = 0; i < numberOfSaucers; i++) {
                this.createSaucer();
            }
        }

        createAsteroid(){
            let x = Math.random() * this.width;
            let y = Math.random() * this.height;

            // move the asteroid outside the screen boundary
            if (Math.random() < 0.5) {
                if (Math.random() < 0.5) {
                    x -= this.width;
                } else {
                    x += this.width;
                }
            } else {
                if (Math.random() < 0.5) {
                    y -= this.height;
                } else {
                    y += this.height;
                }
            }

            let position = new Vector(x, y);

            // calculate direction towards the center of the screen
            let direction = new Vector(this.width / 2, this.height / 2).subtract(position).normalize().multiply(1.5).multiply(Math.random());
            direction = direction.rotate(Math.random() * 360);

            this.asteroids.push( new Asteroid(position, direction) );
        }

        createSaucer() {
            let position = new Vector(Math.random() * this.width, Math.random() * this.height);

            // calculate direction towards the center of the screen
            let direction = new Vector(this.width / 2, this.height / 2).subtract(position).normalize().multiply(1.5).multiply(Math.random());
            direction = direction.rotate(Math.random() * 360);

            this.saucers.push( new Saucer(this, position, direction) );
        }


        update(time) {
            this.input.update(time);
            this.player.update(time);

            for (let i = 0; i < this.projectiles.length; i++) {
                this.projectiles[i].update(time);
            }
            for (let i = 0; i < this.asteroids.length; i++) {
                this.asteroids[i].update(time);
            }
            for (let i = 0; i < this.saucers.length; i++) {
                this.saucers[i].update(time);
            }

            // check if any projectile hits any asteroid
            for (let i = 0; i < this.projectiles.length; i++) {
                for (let j = 0; j < this.asteroids.length; j++) {
                    let dx = this.projectiles[i].position.x - this.asteroids[j].position.x;
                    let dy = this.projectiles[i].position.y - this.asteroids[j].position.y;
                    let distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < this.asteroids[j].size) {
                        let friendly = this.projectiles[i].friendly;

                        this.projectiles.splice(i, 1);
                        this.asteroids.splice(j, 1);

                        i--;
                        j--;

                        if ( friendly )
                            this.score++;

                        this.createAsteroid();
                        break;
                    }
                }
            }

            // check if any non-friendly projectile hit the spaceship
            for (let i = 0; i < this.projectiles.length; i++) {
                if (this.projectiles[i].friendly) {
                    continue;
                }

                let dx = this.projectiles[i].position.x - this.player.position.x;
                let dy = this.projectiles[i].position.y - this.player.position.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < this.player.size) {
                    this.player.is_dead = true;
                    break;
                }
            }

            // check if any friendly projectiles hit any saucer
            for (let i = 0; i < this.projectiles.length; i++) {
                if (!this.projectiles[i].friendly) {
                    continue;
                }

                for (let j = 0; j < this.saucers.length; j++) {
                    let dx = this.projectiles[i].position.x - this.saucers[j].position.x;
                    let dy = this.projectiles[i].position.y - this.saucers[j].position.y;
                    let distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < this.saucers[j].size) {
                        this.projectiles.splice(i, 1);
                        this.saucers[j].shield -= 1;
                        if (this.saucers[j].shield <= 0) {
                            this.saucers.splice(j, 1);
                            this.score += 10;
                            this.createSaucer();
                        }
                        i--;
                        break;
                    }
                }
            }

            // remove all projectiles that are outside the game area
            for (let i = 0; i < this.projectiles.length; i++) {
                if (this.projectiles[i].position.x < 0 || this.projectiles[i].position.x > this.width ||
                    this.projectiles[i].position.y < 0 || this.projectiles[i].position.y > this.height) {
                    this.projectiles.splice(i, 1);
                    i--;
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

            // check if player hits any saucer
            for (let j = 0; j < this.saucers.length; j++) {
                let dx = this.player.position.x - this.saucers[j].position.x;
                let dy = this.player.position.y - this.saucers[j].position.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < this.saucers[j].size) {
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
            for (let i = 0; i < this.saucers.length; i++) {
                this.saucers[i].draw(context);
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
    const game = new Game( canvas.width, canvas.height );

    let start, previousTimeStamp;

    function gameLoop(ts) {
        if ( start === undefined ) {
            start = ts;
            previousTimeStamp = ts;
        }
        const elapsed = ts - start;
        const delta = ts - previousTimeStamp;
        previousTimeStamp = ts;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update game state
        if ( 1 ) {
            game.update(delta / 50);
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
