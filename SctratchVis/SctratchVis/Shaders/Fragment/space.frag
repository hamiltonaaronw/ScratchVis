#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

in vec2 oTexCoord;

uniform float uFreq;
uniform float uLastFreq;
uniform float uDeltaFreq;
uniform float uTime;
uniform vec2 uRes;
uniform float[256] uSpectrum;

out vec4 retColor;

float sinc(float x)
{
	return sin(x) / x;
}

float cosc(float x)
{
	return cos(x) / x;
}

mat2 rot(float a)
{
	float c = cos(a);
	float s = sin(a);
	mat2 ret = mat2(
		c, s,
		-s, c
	);
	return ret;
}

float lerp(float a, float b, float i)
{
	if (i < 0.0)
		i += 1.0;
	float ret = a * (1.0 - i) + b * i;
	return ret;
}

vec3 lerp(vec3 a, vec3 b, float i)
{
	if (i < 0.0)
		i += 1.0;
	vec3 ret = a * (1.0 - i) + b * i;
	return ret;
}

vec3 hsv(float h, float s, float v)
{
	vec3 ret = ((clamp(abs(fract(h + vec3(0.0, 2.0, 1.0) / 3.0) * 6.0 - 3.0) - 1.0, 0.0, 1.0) - 1.0) * s + 1.0) * v;
	return ret;
}

vec2 pmod(vec2 p, float n)
{
	float np = TAU / n;
	float r = atan(p.x, p.y) - 0.5 * np;
	r = mod(r, np) - 0.5 * np;
	return length(p) * vec2(cos(r), sin(r));
}

vec3 col(vec2 p)
{
	vec2 q;
	vec3 ret;

	p *= 2.0 - floor(fract(uFreq * 1000.0) * 10.0);
	q /= dot(q, p) * uFreq;

	float f = abs(uFreq + uLastFreq / mod(uTime, 1.0)) * mod(sin(uTime), 0.5);
	float ff = fract(fract(f * 1000.0) + fract(f * 100.0)) + (fract(f  * 10.0)); 
	
	q = p;
	q.x *= uRes.x / uRes.y;

	vec3 c = vec3(1.0);

	vec2 sp = q;

	float t = uTime * uFreq / 0.01;

	q /= 1.2 + sinc(ff / t);
	q /= 4.0 + 10.0 * (fract(ff * 10000.0) / 10.0);
	q *= rot(t * 0.01);
	q = pmod(q, 3.0 + mod(floor(uTime * 0.3), min(sinc(ff), cosc(f))));

	for (int i = 0; i < 3; i++)
	{
		q = abs(q) - mod(ff + fract(f * 100.0), uFreq);
		//q *= rot(uTime * 2.0 + min(q.x, 1.0));\
		ff += uSpectrum[int(mod(i * 100, 256))];
		q *= rot(ff* t);
	}

	q.x -= 0.3 + 0.2 * uTime + ff;
	float kx = 0.5;
	q.x = mod(q.x, kx) - 0.5 * kx* sin(mod(sin(uTime), t));

	float ins = 0.028 * pow(abs(sin(uTime * 6.0)), 12.0) +0.0002;
	float c0 = ins / abs(q.x);

	c += c0 * vec3(0.3, 0.5, 0.8);
	q.x += kx / 3.0;

	c0 = ins / abs(q.x - ff);
	c += c0 * vec3(0.7, f, 0.1);
	q.x -= 2.0 * kx / 3.0;

	c0 = ins / abs(q.x);
	c += c0 * vec3(0.3, 0.8, 0.5);
	c *= 1.3 * vec3(0.3, 0.5, 0.9);
	c = pow(c, vec3(0.9));

	float g0;
	g0 = dot(q * ff, p * mod(fract(ff * 100.0) , f)) / 0.5;

	c += vec3(
		uSpectrum[int(floor(fract(ff * 100.0)) * sin(uTime + uFreq))] / sinc(ff),
		sinc(uLastFreq / uFreq), // * mod(g0, uSpectrum[int(floor(fract(g0 * 10000.0)))],
		cosc(g0) * sin(ff / g0)
	);

	c *= hsv(
		c.r * sinc(uFreq),
		mod(c.g / c.r, (1.0 + c.b) - ff), //* mod(cosc(ff), sinc(f)),
		cosc((t / ff) + sinc(uFreq)) * dot(c.rg / q.xy, c.gr / q.xx)
	);

	c -= vec3(q * rot(t), length(p) * f);

	//c += sinc(uTime);

	vec3 cc = cross(vec3(p, ff), vec3(p, f));
	float cl = length(cc);

	c.rb *= rot((cl + ff) / sin(uTime)) / t;

	//c /= sin(t) * cross(vec3(q * uFreq, ff), vec3(ff, p * rot(ff)));
	c *= uFreq > 0.075 ? 1.0 : 0.0;

	ret = c;

	return ret;
}


void main()
{
	vec2 uv = ((gl_FragCoord.xy / uRes.xy) / 2.0 - 0.5);

	vec4 ret = vec4(col(uv), 1.0);

	retColor = ret;
}