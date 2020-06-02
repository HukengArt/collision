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
var t_vel = 7;
var grav = 1;
var fric;

var level;
var ball;
var box;
var left_bumper;
var right_bumper;
var left_flipper;
var right_flipper;


document.addEventListener('DOMContentLoaded', setup);
setInterval(update, 1000/FPS);

function setup() {
    canvas = document.getElementById('display');
    ctx = canvas.getContext('2d');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'white';
    ctx.clearRect(0,0,canvas.width,canvas.height);
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
    // left_bumper = new SolidElement([[200,200,-4],[300,350,1],[225,325,1]], true);
    // right_bumper = new SolidElement([[600,200,1],[575,325,1],[500,350,-4]], true);
    left_flipper = new Flipper([300, 300], [[-15, 0, 1], [0, -15, 1], [50,-10,1], [60,0,1], [50,10,1], [0, 15, 1]], Math.PI*30/180, Math.PI/2, 70, true);
    right_flipper = new Flipper([500, 300], [[-50,10,1], [-60,0,1],[-50,-10,1],[0,-15,1],[15,0,1],[0,15,1]], Math.PI*30/180, Math.PI/2, 74, false);
}

function update() {
    ctx.fillRect(0,0,WIDTH,HEIGHT);
    ctx.strokeStyle = 'white';

    left_flipper.control();
    left_flipper.move();
    right_flipper.control();
    right_flipper.move();

    ball.bounce(level.hb_solid, level.convex);
    ball.bounce(left_flipper.hb_solid, true);
    ball.bounce(right_flipper.hb_solid, true);
    // ball.bounce(left_bumper.hb_solid, left_bumper.convex);
    // ball.bounce(right_bumper.hb_solid, right_bumper.convex);
    ball.move();

    ball.drawHbSolid();
    level.drawHbSolid();
    // right_bumper.drawHbSolid();
    // left_bumper.drawHbSolid();
    left_flipper.drawHbSolid();
    right_flipper.drawHbSolid();

    if (ball.pos[0] > WIDTH - ball.hb_solid_rad && ball.mo_vec[0] > 0 || ball.pos[0] < ball.hb_solid_rad && ball.mo_vec[0] < 0) {
        ball.mo_vec[0] *= -ball.elasticity;
    }
    if (ball.pos[1] > HEIGHT - ball.hb_solid_rad && ball.mo_vec[1] > 0 || ball.pos[1] < ball.hb_solid_rad && ball.mo_vec[1] < 0) {
        ball.mo_vec[1] *= -ball.elasticity;
    }
}

function vecAngle2D(vec_a, vec_b) {
    return Math.acos((vec_a[0] * vec_b[0] + vec_a[1] * vec_b[1]) / (Math.sqrt(Math.pow(vec_a[0], 2) + Math.pow(vec_a[1], 2)) * Math.sqrt(Math.pow(vec_b[0], 2) + Math.pow(vec_b[1], 2))));
  }

class Ball {
    constructor(pos, mo_vec) {
        this.pos = pos;
        this.hb_solid_rad = 5;
        this.mo_vec = mo_vec;
        this.elasticity = 0.9; // fraction of movement speed retained after bounce
        this.mass = 0.03;
        this.bounce_lock = 0; // counter to prevent 'flicker-bounce'

    }

    move() {
        // manage bounce lock
        if (this.bounce_lock > 0) {
          this.bounce_lock += 1;
          if (this.bounce_lock > 10) {
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
          let vec_a = [this.pos[0] - hitbox[i][0],
                      this.pos[1] - hitbox[i][1]];
          let vec_b = [hitbox[(i + 1) % hitbox.length][0] - hitbox[i][0],
                      hitbox[(i + 1) % hitbox.length][1] - hitbox[i][1]];

          if (Math.sqrt(Math.pow(vec_a[0], 2) + Math.pow(vec_a[1], 2)) <= Math.sqrt(Math.pow(vec_b[0], 2) + Math.pow(vec_b[1], 2)) &&
              vecAngle2D(vec_a, vec_b) < Math.PI/2) {

            let radians = vecAngle2D(vec_a, vec_b);

            if (Math.sqrt(Math.pow(vec_a[0], 2) + Math.pow(vec_a[1], 2)) * Math.sin(radians) <= this.hb_solid_rad) {
                ctx.strokeStyle = 'red';

                let alpha = vecAngle2D(this.mo_vec, vec_b);

                if (hitbox[i][2] > 0) {
                  if (convex) { // bounce off CONVEX hibtoxes
                    let x_new = (this.mo_vec[0]*Math.cos(2*Math.PI - 2*alpha) - this.mo_vec[1]*Math.sin(2*Math.PI - 2*alpha)) * this.elasticity * hitbox[i][2];
                    let y_new = (this.mo_vec[0]*Math.sin(2*Math.PI - 2*alpha) + this.mo_vec[1]*Math.cos(2*Math.PI - 2*alpha)) * this.elasticity * hitbox[i][2];
                    this.mo_vec = [x_new, y_new];
                  } else { // bounce off CONCAVE hibtoxes
                    let x_new = (this.mo_vec[0]*Math.cos(2*alpha) - this.mo_vec[1]*Math.sin(2*alpha)) * this.elasticity * hitbox[i][2];
                    let y_new = (this.mo_vec[0]*Math.sin(2*alpha) + this.mo_vec[1]*Math.cos(2*alpha)) * this.elasticity * hitbox[i][2];
                    this.mo_vec = [x_new, y_new];
                  }
                } else {
                  if (convex) { // perpendicular bounce off CONVEX hitbox
                    let x_new = vec_b[1] / Math.sqrt(Math.pow(vec_b[0],2) + Math.pow(vec_b[1],2)) * Math.sqrt(Math.pow(this.mo_vec[0],2) + Math.pow(this.mo_vec[1],2)) * Math.abs(hitbox[i][2]);
                    let y_new = vec_b[0] / Math.sqrt(Math.pow(vec_b[0],2) + Math.pow(vec_b[1],2)) * Math.sqrt(Math.pow(this.mo_vec[0],2) + Math.pow(this.mo_vec[1],2)) * hitbox[i][2];
                    this.mo_vec = [x_new, y_new];
                  } else { // perpendicular bounce off CONCAVE hitbox
                    let x_new = vec_b[1] / Math.sqrt(Math.pow(vec_b[0],2) + Math.pow(vec_b[1],2)) * Math.sqrt(Math.pow(this.mo_vec[0],2) + Math.pow(this.mo_vec[1],2)) * hitbox[i][2];
                    let y_new = vec_b[0] / Math.sqrt(Math.pow(vec_b[0],2) + Math.pow(vec_b[1],2)) * Math.sqrt(Math.pow(this.mo_vec[0],2) + Math.pow(this.mo_vec[1],2)) * Math.abs(hitbox[i][2]);
                    this.mo_vec = [x_new, y_new];
                  }
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

class Flipper {
    constructor(pivot, outline, min_angle, max_angle, key_code, ccw) {
      this.pivot = pivot;
      this.key_code = key_code;
      this.min_angle = min_angle;
      this.angle = 0;
      this.max_angle = max_angle;
      this.ccw = ccw;

      this.hb_ghost = outline;
      if (this.ccw) {
        for (let i = 0; i < this.hb_ghost.length; i++) {
          let x_new = this.hb_ghost[i][0] * Math.cos(this.min_angle) - this.hb_ghost[i][1] * Math.sin(this.min_angle);
          let y_new = this.hb_ghost[i][0] * Math.sin(this.min_angle) + this.hb_ghost[i][1] * Math.cos(this.min_angle);
          this.hb_ghost[i] = [x_new, y_new, this.hb_ghost[i][2]];
        }
      } else {
        for (let i = 0; i < this.hb_ghost.length; i++) {
          let x_new = this.hb_ghost[i][0] * Math.cos(2*Math.PI - this.min_angle) - this.hb_ghost[i][1] * Math.sin(2*Math.PI - this.min_angle);
          let y_new = this.hb_ghost[i][0] * Math.sin(2*Math.PI - this.min_angle) + this.hb_ghost[i][1] * Math.cos(2*Math.PI - this.min_angle);
          this.hb_ghost[i] = [x_new, y_new, this.hb_ghost[i][2]];
        }
      }

      this.hb_solid = [];
      for (let i = 0; i < this.hb_ghost.length; i++) {
        this.hb_solid.push([this.hb_ghost[i][0] + this.pivot[0], this.hb_ghost[i][1] + this.pivot[1], this.hb_ghost[2]]);
      }

      this.active = false;
      this.convex = true;
      this.angular_speed = Math.PI / 40;
    }

    control() {
      if (keys[this.key_code]) {
        this.active = true;
        this.hb_ghost[1][2] = -5;
        this.hb_ghost[2][2] = -5;
      } else {
        this.active = false;
        this.hb_ghost[1][2] = 1;
        this.hb_ghost[2][2] = 1;
      }
    }

    move() {

      if (this.active) {
        if (this.angle <= this.max_angle) {
          if (this.ccw) {
            for (let i = 0; i < this.hb_ghost.length; i++) {
              let x_new = this.hb_ghost[i][0] * Math.cos(2*Math.PI - this.angular_speed) - this.hb_ghost[i][1] * Math.sin(2*Math.PI - this.angular_speed);
              let y_new = this.hb_ghost[i][0] * Math.sin(2*Math.PI - this.angular_speed) + this.hb_ghost[i][1] * Math.cos(2*Math.PI - this.angular_speed);
              this.hb_ghost[i] = [x_new, y_new, this.hb_ghost[i][2]];
            }
            this.angle += this.angular_speed;
          } else {
            for (let i = 0; i < this.hb_ghost.length; i++) {
              let x_new = this.hb_ghost[i][0] * Math.cos(this.angular_speed) - this.hb_ghost[i][1] * Math.sin(this.angular_speed);
              let y_new = this.hb_ghost[i][0] * Math.sin(this.angular_speed) + this.hb_ghost[i][1] * Math.cos(this.angular_speed);
              this.hb_ghost[i] = [x_new, y_new, this.hb_ghost[i][2]];
            }
            this.angle += this.angular_speed;
          }
        }
      } else if (this.angle > 0) {
        if (this.ccw) {
          for (let i = 0; i < this.hb_ghost.length; i++) {
            let x_new = this.hb_ghost[i][0] * Math.cos(this.angular_speed) - this.hb_ghost[i][1] * Math.sin(this.angular_speed);
            let y_new = this.hb_ghost[i][0] * Math.sin(this.angular_speed) + this.hb_ghost[i][1] * Math.cos(this.angular_speed);
            this.hb_ghost[i] = [x_new, y_new, this.hb_ghost[i][2]];
          }
          this.angle -= this.angular_speed;
        } else {
          for (let i = 0; i < this.hb_ghost.length; i++) {
            let x_new = this.hb_ghost[i][0] * Math.cos(2*Math.PI - this.angular_speed) - this.hb_ghost[i][1] * Math.sin(2*Math.PI - this.angular_speed);
            let y_new = this.hb_ghost[i][0] * Math.sin(2*Math.PI - this.angular_speed) + this.hb_ghost[i][1] * Math.cos(2*Math.PI - this.angular_speed);
            this.hb_ghost[i] = [x_new, y_new, this.hb_ghost[i][2]];
          }
          this.angle -= this.angular_speed;
        }
      }

      for (let i = 0; i < this.hb_ghost.length; i++) {
        this.hb_solid[i] = [this.hb_ghost[i][0] + this.pivot[0], this.hb_ghost[i][1] + this.pivot[1], this.hb_ghost[i][2]];
      }
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
