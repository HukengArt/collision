
//****various jshint configs****
// jshint esversion: 8
// jshint browser: true
// jshint node: true
// jshint -W117
"use strict";

const WIDTH = 800;
const HEIGHT = 500;
const FPS = 60;

var canvas;
var ctx;
var keys = [];
var t_vel = 5;
var grav = 1;
var fric;

var level;
var ball;
var box;


document.addEventListener('DOMContentLoaded', setupCanvas);
setInterval(update, 1000/FPS);

function setupCanvas() {
    canvas = document.getElementById('display');
    ctx = canvas.getContext('2d');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'white';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    document.body.addEventListener("keydown", function(e) {
        keys[e.keyCode] = true;
    });
    document.body.addEventListener("keyup", function(e) {
        keys[e.keyCode] = false;
    });

    ball = new Ball([WIDTH/2, HEIGHT/2],
                    [Math.floor(Math.random() * 15) - 7, Math.floor(Math.random() * 15) - 7]);
    // testing table
    level = new SolidElement([[100,150,1],[200,50,1],[600,50,1], [700,150,1], [700,300,1], [600,400,1], [400, 450, 1], [200,400,1], [100,300,1]], false);
    box = new SolidElement([[550,150,3], [650,150,3], [650,300,3], [550,300,3]], true);
}

function update() {
    // ctx.fillRect(0,0,WIDTH,HEIGHT);
    ctx.strokeStyle = 'white';
    ball.bounce(level.hb_solid, level.convex);
    ball.bounce(box.hb_solid, box.convex);
    ball.move();

    ball.drawHbSolid();
    level.drawHbSolid();
    box.drawHbSolid();

    if (ball.pos[0] > WIDTH - ball.hb_solid_rad && ball.mo_vec[0] > 0 || ball.pos[0] < ball.hb_solid_rad && ball.mo_vec[0] < 0) {
        ball.mo_vec[0] *= -ball.elasticity;
    }
    if (ball.pos[1] > HEIGHT - ball.hb_solid_rad && ball.mo_vec[1] > 0 || ball.pos[1] < ball.hb_solid_rad && ball.mo_vec[1] < 0) {
        ball.mo_vec[1] *= -ball.elasticity;
    }
}

function vecAngle2D(vec0, vec1) {
    return Math.acos((vec0[0] * vec1[0] + vec0[1] * vec1[1]) / (Math.sqrt(Math.pow(vec0[0], 2) + Math.pow(vec0[1], 2)) * Math.sqrt(Math.pow(vec1[0], 2) + Math.pow(vec1[1], 2))));
  }

class Ball {
    constructor(pos, mo_vec) {
        this.pos = pos;
        this.hb_solid_rad = 7;
        this.mo_vec = mo_vec;
        this.elasticity = 0.9; // removes part of movement speed after every bounce
        this.mass = 0.05;
        this.bounce_lock = 0; // counter to prevent 'flicker-bounce'

    }

    move() {
        // manage bounce lock
        if (this.bounce_lock > 0) {
          this.bounce_lock += 1;
          if (this.bounce_lock > 3) {
            this.bounce_lock = 0;
          }
        }

        // adjust speed to terminal velocity
        if (t_vel && Math.sqrt(Math.pow(this.mo_vec[0],2) + Math.pow(this.mo_vec[1],2)) > t_vel) {
            this.mo_vec[0] = this.mo_vec[0] / Math.sqrt(Math.pow(this.mo_vec[0],2) + Math.pow(this.mo_vec[1],2)) * t_vel;
            this.mo_vec[1] = this.mo_vec[1] / Math.sqrt(Math.pow(this.mo_vec[0],2) + Math.pow(this.mo_vec[1],2)) * t_vel;
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

    bounce(hitbox, convex) {
      if (this.bounce_lock == 0) {
        for (let i = 0; i < hitbox.length; i++) {
          let vec0 = [this.pos[0] - hitbox[i][0], this.pos[1] - hitbox[i][1]];
          let vec1 = [hitbox[(i + 1) % hitbox.length][0] - hitbox[i][0], hitbox[(i + 1) % hitbox.length][1] - hitbox[i][1]];

          if (Math.sqrt(Math.pow(vec0[0], 2) + Math.pow(vec0[1], 2)) <= Math.sqrt(Math.pow(vec1[0], 2) + Math.pow(vec1[1], 2)) &&
              vecAngle2D(vec0, vec1) < Math.PI/2) {

            let radians = vecAngle2D(vec0, vec1);

            if (Math.sqrt(Math.pow(vec0[0], 2) + Math.pow(vec0[1], 2)) * Math.sin(radians) <= this.hb_solid_rad) {
                ctx.strokeStyle = 'red';

                let alpha = vecAngle2D(this.mo_vec, vec1);

                if (convex) { // bounce off CONVEX hibtoxes
                  let x_new = (this.mo_vec[0]*Math.cos(2*Math.PI - 2*alpha) - this.mo_vec[1]*Math.sin(2*Math.PI - 2*alpha)) * this.elasticity * hitbox[i][2];
                  let y_new = (this.mo_vec[0]*Math.sin(2*Math.PI - 2*alpha) + this.mo_vec[1]*Math.cos(2*Math.PI - 2*alpha)) * this.elasticity * hitbox[i][2];
                  this.mo_vec = [x_new, y_new];
                } else { // bounce off CONCAVE hibtoxes
                  let x_new = (this.mo_vec[0]*Math.cos(2*alpha) - this.mo_vec[1]*Math.sin(2*alpha)) * this.elasticity * hitbox[i][2];
                  let y_new = (this.mo_vec[0]*Math.sin(2*alpha) + this.mo_vec[1]*Math.cos(2*alpha)) * this.elasticity * hitbox[i][2];
                  this.mo_vec = [x_new, y_new];
                }
                this.bounce_lock = 1;
            }
          }
        }
      }
    }

    drawHbSolid() {
        ctx.beginPath();
        ctx.arc(this.pos[0], this.pos[1], this.hb_solid_rad, 0, Math.PI * 2, false);
            // (x, y, radius, start angle(radians), end angle(radians), clockwise y/n)
        ctx.closePath();
        ctx.stroke();

    }
}

class SolidElement {
    constructor(outline, convex) {
        this.hb_solid = outline;
        this.convex = convex;
    }

    drawHbSolid() {
        ctx.beginPath();
        for (let i = 0; i < this.hb_solid.length; i++) {
            ctx.lineTo(this.hb_solid[i][0], this.hb_solid[i][1]);
        }
        ctx.closePath();
        ctx.stroke();
    }
}
