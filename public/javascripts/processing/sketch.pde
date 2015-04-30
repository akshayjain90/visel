

float framerate = 24;

int ball_x;
int ball_y;
int ball_radius = 20;

void setup() {
    size(200, 200);
    frameRate(framerate);
    ball_x = width/2;
    ball_y = ball_radius;
    stroke(#003300);
    fill(#000FF);

}

void draw() {
    ellipse(ball_x, ball_y, ball_radius, ball_radius);
}

