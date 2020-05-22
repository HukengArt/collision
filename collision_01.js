const WIDTH = 800;
const HEIGHT = 500;
const FPS = 25;

var canvas;
var ctx;
var keys = [];
var t_vel = 4;
var grav = 1;
var fric = undefined;


document.addEventListener('DOMContentLoaded', setupCanvas);
setInterval(update, 1000/FPS);

function setupCanvas() {
    canvas = document.getElementById('display');
    ctx = canvas.getContext('2d');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    ctx.fillStyle = 'black';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    

    document.body.addEventListener("keydown", function(e) {
        keys[e.keyCode] = true;
    });
    document.body.addEventListener("keyup", function(e) {
        keys[e.keyCode] = false;
    });

    ball = new Ball([WIDTH/2, HEIGHT/2],
                    [Math.floor(Math.random() * 15) - 7, Math.floor(Math.random() * 15) - 7]);
}

class Ball {
    constructor(pos, mo_vec) {
        this.pos = pos;
        this.hb_solid_rad = 5;
        this.mo_vec = mo_vec;
        this.elasticity = 0.9;
        this.mass = 0.5;

    }

    move() {
        // adjust speed to terminal velocity
        if (t_vel && Math.sqrt(this.mo_vec[0]^2 + this.mo_vec[1]) > t_vel) {
            this.mo_vec[0] = this.mo_vec[0] / Math.sqrt(this.mo_vec[0]^2 + this.mo_vec[1]) * t_vel;
            this.mo_vec[1] = this.mo_vec[1] / Math.sqrt(this.mo_vec[0]^2 + this.mo_vec[1]) * t_vel;
        }
        
        // move orb
        this.pos[0] += this.mo_vec[0];
        this.pos[1] += this.mo_vec[1];

        // apply gravity
        if (grav) {
            this.mo_vec[1] += this.mass * grav;
        }

        // apply friction
        if (fric) {
            this.mo_vec[0] *= fric;
            this.mo_vec[1] *= fric;
        }        
    }

    drawHbSolid() {
        ctx.strokeStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.pos[0], this.pos[1], this.hb_solid_rad, 0, Math.PI * 2, false);
            // (x, y, radius, start angle(radians), end angle(radians), clockwise y/n)
        ctx.closePath();
        ctx.stroke();

    }
}


function update() {
    ctx.fillRect(0,0,WIDTH,HEIGHT);
    ball.move();
    ball.drawHbSolid();

    if (ball.pos[0] > WIDTH - ball.hb_solid_rad && ball.mo_vec[0] > 0 || ball.pos[0] < ball.hb_solid_rad && ball.mo_vec[0] < 0) {
        ball.mo_vec[0] *= -ball.elasticity;
    }
    if (ball.pos[1] > HEIGHT - ball.hb_solid_rad && ball.mo_vec[1] > 0 || ball.pos[1] < ball.hb_solid_rad && ball.mo_vec[1] < 0) {
        ball.mo_vec[1] *= -ball.elasticity;
    }
}