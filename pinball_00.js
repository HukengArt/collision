//****various jshint configs****
// jshint esversion: 8
// jshint browser: true
// jshint node: true
// jshint -W117
"use strict";

const WIDTH = 500;
const HEIGHT = 800;
const FPS = 60;

var canvas;
var ctx;
var keys = [];
var t_vel = 10;
var grav = 1;
var fric;

var ball;
var solid_elements = [];
var flippers = [];

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
    solid_elements = [
      // table outline
      new SolidElement([[50,150,1],
                        [25,250,1],
                        [50,350,1],
                        [75,390,1],
                        [75,650,1],
                        [170,700,1],
                        [170,875,1],
                        [330,875,1],
                        [330,700,1],
                        [425,650,1],
                        [425,390,1],
                        [450,350,1],
                        [475,250,1],
                        [450,150,1],
                        [350,50,1],
                        [250,25,1],
                        [150,50,1]]),

      // side bumpers
      new SolidElement([[150,450,1],
                        [160,600,1],
                        [120,580,1],
                        [120,460,1]]),
      new SolidElement([[340,600,1],
                        [350,450,1],
                        [380,460,1],
                        [380,580,1]]),
      // round bumpers
      // new SolidElement([[250,75,-1.3],
      //                   [300,100,-1.3],
      //                   [300,150,-1.3],
      //                   [250,175,-1.3],
      //                   [200,150,-1.3],
      //                   [200,100,-1.3]], true),
      // new SolidElement([[150,225,-1.3],
      //                   [200,250,-1.3],
      //                   [200,300,-1.3],
      //                   [150,325,-1.3],
      //                   [100,300,-1.3],
      //                   [100,250,-1.3]], true),
      // new SolidElement([[350,225,-1.3],
      //                   [400,250,-1.3],
      //                   [400,300,-1.3],
      //                   [350,325,-1.3],
      //                   [300,300,-1.3],
      //                   [300,250,-1.3]], true)
    ];
    flippers = [
      new Flipper([170,700],
                  [[-15,0,1],
                   [0,-15,1],
                   [60,-10,1],
                   [70,0,-1],
                   [60,10,-1],
                   [0,15,1]],
                  Math.PI*30/180, Math.PI/2, 70, true),
      new Flipper([330,700],
                  [[-70,0,1],
                   [-60,-10,1],
                   [0,-15,1],
                   [15,0,1],
                   [0,15,-1],
                   [-60,10,-1]],
                   Math.PI*30/180, Math.PI/2, 74, false)
    ];
}

function update() {
    ctx.clearRect(0,0,WIDTH,HEIGHT);
    ctx.fillRect(0,0,WIDTH,HEIGHT);
    ctx.strokeStyle = 'white';

    for (let i = 0; i < flippers.length; i++) {
      flippers[i].control();
      flippers[i].move();
      flippers[i].drawHbSolid();
    }

    for (let i = 0; i < flippers.length; i++) {
      if (ball.bounce(flippers[i].hb_solid, true)) {
        break;
      }
    }

    for (let i = 0; i < solid_elements.length; i++) {
      if (ball.bounce(solid_elements[i].hb_solid, solid_elements[i].convex)) {
        break;
      }
      solid_elements[i].drawHbSolid();
    }

    ball.move();
    ball.drawHbSolid();

    if (ball.pos[1] > HEIGHT) {
      ball = new Ball([WIDTH/2, HEIGHT/2],
                      [Math.floor(Math.random() * 15) - 7, Math.floor(Math.random() * 15) - 7]);
    }
}

function vecAngle2D(vec_a, vec_b) {
    // return smaller angle between two 2D vectors (in radians)
    return Math.acos((vec_a[0] * vec_b[0] + vec_a[1] * vec_b[1]) / (Math.sqrt(Math.pow(vec_a[0], 2) + Math.pow(vec_a[1], 2)) * Math.sqrt(Math.pow(vec_b[0], 2) + Math.pow(vec_b[1], 2))));
  }

function vecLen2D(vec) {
  // return length of a 2D vector
  return Math.sqrt(Math.pow(vec[0],2) + Math.pow(vec[1],2));
}

function vecRotate2D(vec, angle) {
  // rotate a 2D vector or point by angle (in radians) around zero
  let new_x = vec[0] * Math.cos(angle) - vec[1] * Math.sin(angle);
  let new_y = vec[0] * Math.sin(angle) + vec[1] * Math.cos(angle);
  vec[0] = new_x;
  vec[1] = new_y;
  return vec;
}

class Ball {
    constructor(pos, mo_vec) {
        this.pos = pos; // center of ball
        this.hb_solid_rad = 12;
        this.mo_vec = mo_vec;
        this.elasticity = 0.8; // fraction of movement speed retained after bounce
        this.mass = 0.1;
    }

    move() {

        // adjust speed to terminal velocity
        if (t_vel && vecLen2D(this.mo_vec) > t_vel) {
            this.mo_vec[0] = this.mo_vec[0] / vecLen2D(this.mo_vec) * t_vel;
            this.mo_vec[1] = this.mo_vec[1] / vecLen2D(this.mo_vec) * t_vel;
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

    bounce(hitbox) {

      for (let i = 0; i < hitbox.length; i++) {
        let vec_a = [this.pos[0] - hitbox[i][0], // vector between vertex and ball
                    this.pos[1] - hitbox[i][1]];
        let vec_b = [hitbox[(i + 1) % hitbox.length][0] - hitbox[i][0], //vector between vertex and next vertex
                    hitbox[(i + 1) % hitbox.length][1] - hitbox[i][1]];

        let radians_a = vecAngle2D(vec_a, vec_b);

        // collision detection
        if (radians_a <= Math.PI * 0.5 &&
            vecLen2D(vec_a) <= vecLen2D(vec_b) + this.hb_solid_rad && // distance of ball from vertex is shorter than length of side
            vecLen2D(vec_a) * Math.sin(radians_a) <= this.hb_solid_rad && // ball is closer to side of hitbox than its own radius
            vecAngle2D(this.mo_vec, [-1 * vec_b[1], vec_b[0]]) <= Math.PI * 0.5) { // ball is not already moving away from hitbox

          let alpha = vecAngle2D(this.mo_vec, vec_b);

          // move ball out of hitbox !!!WORK IN PROGRESS!!!
          // let overlap = this.hb_solid_rad - vecLen2D(vec_a) * Math.sin(radians_a);
          // this.pos = [this.pos[0] - this.mo_vec[0] / vecLen2D(this.mo_vec) * overlap * Math.sin(alpha),
          //             this.pos[1] - this.mo_vec[1] / vecLen2D(this.mo_vec) * overlap * Math.sin(alpha)];

          if (hitbox[i][2] > 0) { // normal bounce
            let mo_vec_new = vecRotate2D(this.mo_vec, 2 * Math.PI - 2 * alpha);
            this.mo_vec = [mo_vec_new[0] * this.elasticity * hitbox[i][2],
                           mo_vec_new[1] * this.elasticity * hitbox[i][2]];
          } else if (hitbox[i][2] < 0) { // perpedicular bounce
            this.mo_vec = [vec_b[1] / vecLen2D(vec_b) * vecLen2D(this.mo_vec) * Math.abs(hitbox[i][2]),
                           vec_b[0] / vecLen2D(vec_b) * vecLen2D(this.mo_vec) * hitbox[i][2]];
          } else {} // inactive vertex


          ctx.strokeStyle = 'red';
          return true;
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

      this.hb_solid = outline;
      if (this.ccw) { // adjust hb_ghost to actual starting position
        for (let i = 0; i < this.hb_solid.length; i++) {
          let new_point = vecRotate2D(this.hb_solid[i], this.min_angle);
          this.hb_solid[i] = [new_point[0] + this.pivot[0], new_point[1] + this.pivot[1], new_point[2]];
        }
      } else {
        for (let i = 0; i < this.hb_solid.length; i++) {
          let new_point = vecRotate2D(this.hb_solid[i], 2*Math.PI - this.min_angle);
          this.hb_solid[i] = [new_point[0] + this.pivot[0], new_point[1] + this.pivot[1], new_point[2]];
        }
      }

      this.active = false;
      this.angular_speed = Math.PI * 10/180;
    }

    control() {
      if (keys[this.key_code]) {
        this.active = true; // flipper moves up or rests in max_angle position
        if (this.angle < this.max_angle) {
          this.hb_solid[0][2] = -10;
          this.hb_solid[1][2] = -10;
          this.hb_solid[2][2] = -10;
          this.hb_solid[3][2] = 0;
          this.hb_solid[5][2] = 0;
          this.hb_solid[5][2] = 0;
        } else {
          this.hb_solid[0][2] = 1;
          this.hb_solid[1][2] = 1;
          this.hb_solid[2][2] = 1;
          this.hb_solid[3][2] = 1;
          this.hb_solid[5][2] = 1;
          this.hb_solid[5][2] = 1;
        }
      } else {
        this.active = false; // flipper moves down or rests in min_angle position
        this.hb_solid[0][2] = 1;
        this.hb_solid[1][2] = 1;
        this.hb_solid[2][2] = 1;
        this.hb_solid[3][2] = 1;
        this.hb_solid[5][2] = 1;
        this.hb_solid[5][2] = 1;
      }
    }

    move() {

      if (this.active) {
        if (this.angle <= this.max_angle) { // flipper moves up
          if (this.ccw) {
            for (let i = 0; i < this.hb_solid.length; i++) {
              let new_point = vecRotate2D([this.hb_solid[i][0] - this.pivot[0],this.hb_solid[i][1] - this.pivot[1]], 2*Math.PI - this.angular_speed);
              this.hb_solid[i] = [new_point[0] + this.pivot[0], new_point[1] + this.pivot[1], this.hb_solid[i][2]];
            }
            this.angle += this.angular_speed;
          } else {
            for (let i = 0; i < this.hb_solid.length; i++) {
              let new_point = vecRotate2D([this.hb_solid[i][0] - this.pivot[0],this.hb_solid[i][1] - this.pivot[1]], this.angular_speed);
              this.hb_solid[i] = [new_point[0] + this.pivot[0], new_point[1] + this.pivot[1], this.hb_solid[i][2]];
            }
            this.angle += this.angular_speed;
          }
        }
      } else if (this.angle > 0) { // flipper moves down
        if (this.ccw) {
          for (let i = 0; i < this.hb_solid.length; i++) {
            let new_point = vecRotate2D([this.hb_solid[i][0] - this.pivot[0],this.hb_solid[i][1] - this.pivot[1]], this.angular_speed);
            this.hb_solid[i] = [new_point[0] + this.pivot[0], new_point[1] + this.pivot[1], this.hb_solid[i][2]];
          }
          this.angle -= this.angular_speed;
        } else {
          for (let i = 0; i < this.hb_solid.length; i++) {
            let new_point = vecRotate2D([this.hb_solid[i][0] - this.pivot[0],this.hb_solid[i][1] - this.pivot[1]], 2*Math.PI - this.angular_speed);
            this.hb_solid[i] = [new_point[0] + this.pivot[0], new_point[1] + this.pivot[1], this.hb_solid[i][2]];
          }
          this.angle -= this.angular_speed;
        }
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
    constructor(outline) {
        this.hb_solid = outline;
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
