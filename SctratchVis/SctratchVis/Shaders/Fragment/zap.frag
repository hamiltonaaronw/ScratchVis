#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

uniform float uFreq;
uniform float uLastFreq;
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
	return mat2(
		cos(a), -sin(a),
		sin(a), cos(a)
	);
}

vec3 hsv2rgb(float h, float s, float v)
{
	return ((clamp(abs(fract(h + vec3(0.0, 2.0, 1.0) / 3.0) * 6.0 - 3.0) - 1.0, 0.0, 1.0) - 1.0) * s + 1.0) * v;
}


#define less(a, b, c) mix(a, b, step(0.0, c));
#define sabs(x, k) less((0.5 / k) * x * x + k * 0.5, abs(x), abs(x) - k);

float smin(float a, float b, float k)
{
	float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);

	return mix(b, a, h) - k * h * (1.0 - h);
}

vec3 col(vec2 p)
{
	vec3 ret;
	vec3 c;

	vec2 q = p;
	//q *= rot(uTime);

	float f = mod(fract(uFreq * 100.0), fract(uFreq * 10.0));
	float maxF = max(f, uFreq);
	float minF = min(f, uFreq);
	float ff = mod(maxF, minF) / 0.025;
	float t;
	t = uTime * sinc(uFreq) + cosc(ff);
	t += sin(uTime) / mod(ff, 0.5);
	t *= 0.5;
	t *= 0.5;

	q = sabs(q, 0.05);
	q *= rot(uTime + sinc(ff * t));

	float d = length(q + vec2(ff, 0.0));// - 0.5;
	float d2 = length(q - vec2(0.0, ff));// - 0.5;

	vec2 offset = vec2(sin(q.y * 8.0 + t * 1.3), cos(q.x * 8.0 + t));
	offset = sabs(offset, sinc(0.7 + f));
	offset *= 0.45;

	float d3 = length(q - offset) - 0.3;
	d *= smin(d, d2, 0.45);
	d = smin(d, d3, 0.3 + sin(t) * 0.125);
	d = sin(d * 15.0 - t);

	d = sabs(d, 0.5);
	d = 0.55 / d;

	float dr = d * 0.38 * sin(uTime);
	float dg = d * 0.41 + sin((uFreq - uLastFreq) * ff - t) * 0.005;
	float db = d * 0.05 + sin(uTime);

	vec3 hc = hsv2rgb(db, dr, dg) * cross(hsv2rgb(ff, (t + sinc(dot(q, q))), dg), hsv2rgb(db, ff, dg));;

	//ret = vec3(1.0, 0.0, 0.0);
	//ret = vec3(0.0, 1.0, 0.0);
	//ret = vec3(0.0, 0.0, 1.0);

	c = vec3(dr, dg, db) - sinc(ff * t) * 0.5;

	c.rb *= rot(ff) / hc.b;
	c.gb *= rot(sinc(uTime / t)) * hc.r;

	c *= uFreq > 0.075 ? 1.0 : 0.0;

	ret = c;

	return ret;
}

void main()
{
	vec4 ret;
	vec2 uv;
	
	uv = (gl_FragCoord.xy - uRes) / min(uRes.x, uRes.y) * 2.0;
	//uv = gl_FragCoord.xy / uRes.xy - 0.5;

	ret = vec4(col(uv), 1.0);
	//ret = col(uv);
	retColor = ret;
}
