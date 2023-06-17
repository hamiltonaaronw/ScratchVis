#version 410

// derived from https://glslsandbox.com/e#103777.0

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

uniform vec2 uRes;
uniform vec3 uSpec3;
uniform float uDeltaFreq;
uniform float uDeltaTime;
uniform float uFreq;
uniform float uLastFrame;
uniform float uLastFreq;
uniform float uSpecSum;
uniform float uTime;
uniform float uSpectrum[256];

out vec4 retColor;

#define sinc(x) (sin(x) / x)
#define cosc(x) (cos(x) / x)

mat2 rot(float a)
{
	return mat2(
		cos(a), sin(a),
		-sin(a), cos(a)
	);
}

vec3 col(vec2 p)
{
	vec3 ret;
	vec3 c = vec3(0.0);
	vec2 q = p;
	q *= rot(uTime * 0.1);

	float x = mod(uFreq * 4.0, 1.0);
	float f = cos((sin(cos(x)) - sin(x) - x) + x * x);
	f = fract(f * 100.0);
	vec3 vf = uSpec3;
	float lvf;
	float t = uTime * 0.25;

	vf *= sin(t * (uSpecSum / 256) / TAU);
	lvf = length(vf);
	
	float tf = clamp((t * 0.5), vf.x, step(uFreq, lvf)) + f;
	float df = (abs(uLastFreq - uFreq) * 0.5);
	float _f = abs(1.0 - (uFreq + f + df));

	float Lx = 1.0;
	float Ly = 1.0;
	float m0 = 5.0;
	float n0 = 12.0;
	float sens = 0.15;

	float n = n0;
	float m = m0 * sin(uTime * 0.5);

	float z = cos(n * PI * q.x / Lx) * 
		cos(m * PI * q.y / Ly) + 
		cos(n * PI * q.y / Ly) *
		cos(m * PI * q.x / Lx);

	float dist = abs(z) * (1.0 / sens);

	c = vec3(0.6, 1.35, 0.6) / dist;
	
	//c = vec3(1.0, 0.0, 0.0);
	//c = vec3(0.0, 1.0, 0.0);
	//c = vec3(0.0, 0.0, 1.0);

	ret = c;

	return ret;
}

void main()
{
	vec4 ret;
	vec2 uv ;
	uv = (gl_FragCoord.xy - uRes) / min(uRes.x, uRes.y);

	ret = vec4(col(uv), 1.0);

	retColor = ret;
}