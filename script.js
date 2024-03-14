window.addEventListener('load', function(){
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth; 
    canvas.height = window.innerHeight;
    let constantspeedmode = false;
    let drawmarkers = false;
    let drawdistancevecs = false;
    let started = false;

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

        distanceTo(rhs) {
            return Math.sqrt((this.x - rhs.x) * (this.x - rhs.x) + (this.y - rhs.y) * (this.y - rhs.y));
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
            this.size = (Math.random() * 100 ) + 25;
            this.crashed = false;
        }
        
        update(time) {
            this.position = this.position.add( this.direction.multiply(time) );
            this.position = wrapIfOutside(this.position, this.size);
        }        

        draw(context) {
            const astroid_sprite = document.getElementById('asteroid');

            // find the size of the asteroid image w, h
            let w = astroid_sprite.width;
            let h = astroid_sprite.height;
            
            context.fillStyle = 'brown';
                    
            context.translate(this.position.x, this.position.y);
            //context.translate(-this.size / 2, -this.size / 2);

            if ( drawmarkers) {
                context.globalAlpha = 0.3;
                context.fillStyle = 'white';
                context.beginPath();
                context.arc(0, 0, this.size/2, 0, Math.PI * 2);
                context.fill();
                context.globalAlpha = 1;
            }
            if ( this.crashed ) {
                context.fillStyle = 'red';
                context.beginPath();
                context.arc(0, 0, this.size/2, 0, Math.PI * 2);
                context.fill();
            }

            context.drawImage(astroid_sprite, -this.size/2, -this.size/2, this.size, this.size);

            if ( drawmarkers ) {
                context.fillStyle = 'yellow';
                context.beginPath();
                context.arc(0, 0, 2, 0, Math.PI * 2);
                context.fill();
            }

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

            // make an evasive maneuver if too close to player
            // if ( 1 ) { // this.counter % 100 == 0 && Math.random() < 0.3 ) {
            //     if ( game.player.position.subtract(this.position).length < 200 ) {
            //         if ( Math.random() < 0.8 ) {
            //             this.direction = this.direction.rotate(90);
            //         }
            //     }
            // }
        }        

        draw(context) {
            //const astroid_sprite = document.getElementById('asteroid');
            
            context.translate(this.position.x, this.position.y);
            //context.translate(-this.size / 2, -this.size / 2);
            
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
            // context.fillStyle = 'white';
            // context.font = '20px RetroFont';
            // let tw = context.measureText(this.shield).width;
            // context.fillText(this.shield, (this.size / 2) - (tw), 10);

            if ( drawmarkers ) {
                context.fillStyle = 'yellow';
                context.beginPath();
                context.arc(0, 0, 2, 0, Math.PI * 2);
                context.fill();
            }

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
                this.shield = 10;
            }

            update(time) {
                this.position = this.position.add( this.direction.multiply(time) );
                this.position = wrapIfOutside(this.position, this.size);

                if ( !constantspeedmode ) {
                    this.direction = this.direction.multiply(0.99);
                }

            }

            draw(context) {
                // draw a triangle that points in the direction of this.direction
                context.fillStyle = 'red';
                
                context.translate(this.position.x, this.position.y);
                context.translate(-this.size / 2, -this.size / 2);
                context.rotate(Math.atan2(this.direction.y, this.direction.x));

                let size = 50;
                const player_sprite = document.getElementById('spaceship');
                context.drawImage(player_sprite, -size/2, -size/2, size, size);

                // draw shield number of blue rings around the player
                context.strokeStyle = 'blue';
                for (let i = 0; i < this.shield; i++) {
                    context.beginPath();
                    context.arc(0, 0, size / 2 + i * 2, 0, Math.PI * 2);
                    context.stroke();
                }

                if ( drawmarkers ) {
                    context.fillStyle = 'yellow';
                    context.beginPath();
                    context.arc(0, 0, 2, 0, Math.PI * 2);
                    context.fill();
                }

                if ( drawdistancevecs ) {

                    context.strokeStyle = 'white';
                    context.globalAlpha = 0.3;

                    context.resetTransform();
                    context.translate(this.position.x, this.position.y);
                    //context.moveTo(this.position.x, this.position.y);

                    // loop over all asteroids and draw distance vectors
                    for (let i = 0; i < this.game.asteroids.length; i++) {
                        this.drawDistanceVector(context, this.game.asteroids[i].position.subtract(this.position));
                    }

                    // loop over all saucers and draw distance vectors
                    for (let i = 0; i < this.game.saucers.length; i++) {
                        this.drawDistanceVector(context, this.game.saucers[i].position.subtract(this.position));
                    }

                    context.globalAlpha = 1;
    
                }

                context.resetTransform();
            }

            drawDistanceVector(context, vector) {
                context.beginPath();
                
                context.moveTo(0,0);
                context.lineTo(vector.x, vector.y);
                context.stroke();

                // draw number with length on the middle of the vector line
                // context.fillStyle = 'white';
                // context.font = '20px RetroFont';

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
                        if ( !constantspeedmode ) {
                            this.player.direction = this.player.direction.add( this.player.direction.normalize().multiply(5) );
                        } else {
                            this.player.direction = this.player.direction.add( this.player.direction.normalize() );
                        }
                        break;
                    case 'ArrowDown':
                    case 'KeyS':
                        if ( constantspeedmode ) {
                            this.player.direction = this.player.direction.subtract( this.player.direction.normalize() );
                        }
                        break; 
                    case 'Space':
                        if ( !started ) {
                            started = true;
                            return;
                        } 
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
            if ( !started ) return;

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
                    let distance = this.projectiles[i].position.distanceTo(this.asteroids[j].position);
                    if (distance < this.asteroids[j].size / 2) {
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

                let distance = this.projectiles[i].position.distanceTo(this.player.position);
                if (distance < this.player.size - 2) {
                    this.player.shield -= 1;
                    if (this.player.shield <= 0) {
                        this.player.is_dead = true;
                    }
                    this.projectiles.splice(i, 1);
                    break;
                }
            }

            // check if any friendly projectiles hit any saucer
            for (let i = 0; i < this.projectiles.length; i++) {
                if (!this.projectiles[i].friendly) {
                    continue;
                }

                for (let j = 0; j < this.saucers.length; j++) {
                    let distance = this.projectiles[i].position.distanceTo(this.saucers[j].position);
                    if (distance < this.saucers[j].size / 2) {
                        this.projectiles.splice(i, 1);
                        this.saucers[j].shield -= 1;
                        if (this.saucers[j].shield <= 0) {
                            this.saucers.splice(j, 1);
                            this.score += 100;
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
                // is asteroid outside screen
                if (this.asteroids[j].position.x < -this.asteroids[j].size || this.asteroids[j].position.x > this.width + this.asteroids[j].size ||
                    this.asteroids[j].position.y < -this.asteroids[j].size || this.asteroids[j].position.y > this.height + this.asteroids[j].size) {
                    continue;
                }
                // calculate distance
                let distance = this.player.position.distanceTo(this.asteroids[j].position);
                if (distance < this.asteroids[j].size / 2) {
                    this.asteroids[j].crashed = true;
                    this.player.is_dead = true;
                    break;
                }
                
            }

            // check if player hits any saucer
            for (let j = 0; j < this.saucers.length; j++) {
                let distance = this.player.position.distanceTo(this.saucers[j].position);
                if (distance < this.saucers[j].size / 2) {
                    this.saucers[j].shield -= 1;
                    this.player.shield -= 1;
                    if (this.saucers[j].shield <= 0) {
                        this.saucers.splice(j, 1);
                        this.score += 100;
                        this.createSaucer();
                    } else if (this.player.shield <= 0) {
                        this.player.is_dead = true;
                    }
                    break;
                }
            }
        }

        draw(context) {
            this.player.draw(context);

            if ( !started ) {
                this.drawCenteredText(context, 'Asteroids', 60, canvas.height / 2 - 120);
                this.drawCenteredText(context, 'Press Space Bar to start', 30, canvas.height / 2 - 60 );
                
                this.drawCenteredText(context, 'Rotate: A+D, Speed: W+S', 30, canvas.height / 2 + 80 );
                return;
            }

            
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
                this.drawCenteredText(context, 'Game Over', 60, canvas.height / 2 - 50);
                // write below hit refresh to try again
                context.font = '40px RetroFont';
                const text2 = 'Hit refresh to try again';
                const textWidth2 = context.measureText(text2).width;
                context.fillText(text2, (canvas.width / 2) - (textWidth2 / 2), canvas.height / 2 + 50);
            }
        }

        drawCenteredText(context, text, size, y) {
            context.fillStyle = 'white';
            context.font = `${size}px RetroFont`;
            const textWidth = context.measureText(text).width;
            context.fillText(text, (canvas.width / 2) - (textWidth / 2), y);
        }

        drawScore(context, score) {
            const textpos_y = 45;

            context.fillStyle = 'white';
            context.font = '40px RetroFont';
            context.fillText('Score: ' + score, 10, textpos_y);

            context.fillStyle = 'white';
            context.font = '40px RetroFont';
            let string = 'Shield: ' + this.player.shield;
            let tw = context.measureText(string).width;
            context.fillText('Shield: ' + this.player.shield, (canvas.width - 10) - tw, textpos_y);
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
