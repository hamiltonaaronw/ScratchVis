#version 410

// derived from https://glslsandbox.com/e#38358.0

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

	float iter = 13.0;

	q = vec2(atan(q.x, q.y) / PI * iter, length(q) * 2.0);
	q = abs(fract(q) - 0.5);
	//q *= sin(uTime * df);

//float a = 0.1 + length(q);
	float a = 0.1 + length(q);

	float b1 = uFreq > 0.00001 ? 
		_f 
		: uTime;
	float b2 = uFreq > 0.00001 ? 
		tf 
		: uTime;

//float b = 0.75 * abs(sin(uTime - cos(uTime * 0.01) * 9.0 * length(q)));
	float b = 0.75 * abs(sin(b1 - cos(b2 * 0.01) * 9.0 * length(q)));

//float d = abs(0.1 + length(q) - 0.75 * abs(sin(uTime - cos(uTime * 0.01) * 9.0 * length(q)))) * 5.0;
	float d = abs(a - b) * 5.0;

	b1 = uFreq > 0.00001 ?
		tf * pow(acosh(lvf), sinc(_f))
		: uTime;

	b = 0.5 * abs(sin(b1 * 0.5 - 4.0));

//float e = abs(0.1 + length(q) - 0.5 * abs(sin(uTime * 0.5 - 4.0))) * 10.0;
	float e = abs(a - b) * 10.0;

	c += (vec3(0.1, 0.1, 0.27) / d);
	c += (vec3(0.27, 0.1, 0.1) / d / e);
	//c *= uFreq > 0.00001 ? _f : 1.0;
	
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