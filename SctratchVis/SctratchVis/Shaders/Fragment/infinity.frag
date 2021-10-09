#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

in vec2 oTexCoord;

uniform float uFreq;
uniform float uLastFreq;
uniform float uDeltaFreq;
uniform float uTime;
uniform float uLastFrame;
uniform float uDeltaTime;
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
		cos(a), sin(a),
		-sin(a), cos(a)
		);
}

vec3 hsv(float h, float s, float v)
{
	vec3 ret = ((clamp(abs(fract(h + vec3(0.0, 2.0, 1.0) / 3.0) * 9.0 - 3.0) -1.0, 0.0, 1.0) - 1.0) * s + 1.0) * v;
	return ret;
}

float sdBoxFrame(vec3 p, vec3 b, float e)
{
	p = abs(p) - b;
	vec3 q = abs(p + e) - e;
	return min(min(
		length(max(vec3(p.x, q.y, q.z), 0.0)) + min(max(p.x, max(q.y, q.z)), 0.0),
		length(max(vec3(q.x, p.y, q.z), 0.0)) + min(max(q.x, max(p.y, q.z)), 0.0)),
		length(max(vec3(q.x, q.y, p.z), 0.0)) + min(max(q.x, max(q.y, p.z)), 0.0)
		);
}

vec4 map(vec3 p, float f)
{
	float t = uTime + 80.0;
	float rt = t * 0.1;
	for (int i = 0; i < 5; i++)
	{
		p = abs(p) - 0.2;
		p.xz *= rot(rt);
		p.yz *= rot(rt);
	}

	float d=  sdBoxFrame(p, vec3(1.0), 0.05);
	p.xz *= rot((PI / 180.0) * 45.0) * sinc(f);
	p.yz *= rot((PI / 180.0) * 45.0) + f;
	d = min(d, sdBoxFrame(p, vec3(1.0), 0.05));

	return vec4(p, d);
}

vec2 rm(vec3 ro, vec3 rd, float f)
{
	float dq, ii;
	for (int i = 0; i < 250; i++)
	{
		vec3 p = ro + rd * dq;
		float ds = map(p, f).w;
		dq += ds + f;
		ii += 0.13;
		if (dq > 1000.0 || ds < 0.001)
			break;
	}

	return vec2(dq, ii);
}

vec3 col(vec2 p)
{
	vec3 ret;
	vec3 c;
	vec2 q = p;
	float t = uTime + 80.0;

	float r, g, b;

	float f = cos((sin(cos(uFreq)) - sin(uFreq) + uFreq * uFreq));
	float fs = mod(uTime, 1.0 - f);

	r = abs(f - (f / fs));
	b = fs;
	g -= r;

	float x = mod(uFreq * 4.0, 1.0);
	float ff = cos((sin(cos(x)) - sin(x) - x) + x * x);
	float fft = mod(uTime, 1000.0 * f);

	g += fft;

	f = mod(max(f, ff), min(f, ff) * uFreq);
	f /= length(vec2(f, ff) * rot(abs(uFreq - uLastFreq)));

	c = vec3(r, g, b) * 0.275;

	float ar = uRes.x / uRes.y;
	q.x *= ar;
	float rt = t * 0.1;
	float size = sin(t * 0.1) * 0.5 + 0.5;
	vec2 q1 = q;

	for (int i = 0; i < 30; i++)
	{
		q = abs(q) - size * 1.0;
		q.xy *= rot(rt * 0.4 + 2.1);
	}

	q = mix(q, q1, sin(t * 0.055) * 0.5 + 0.5);
	
	vec3 ro = vec3(0.0, 0.0, -5.0);
	vec3 rd = normalize(vec3(q, 1.0));
	
	ro.xy *= rot(rt);
	rd.xy *= rot(rt);
	ro.xz *= rot(rt);
	rd.xz *= rot(rt);

	vec2 d = rm(ro, rd, f);
	c += vec3(d.x * 0.05);
	c.r += sin(c.r * 100.0) * 0.2;

	if (d.x > 999.0)
		c = vec3(sin(d.y + 3.4) * 1.0);

	c *= hsv(c.r * c.g, c.g * c.b, c.b * c.r) * 0.125;

	//c = vec3(1.0, 0.0, 0.0);
	//c = vec3(0.0, 1.0, 0.0);
	//c = vec3(0.0, 0.0, 1.0);

	ret = uFreq > 0.0001 ? min(c, 1.0) : vec3(0.0);

	return ret;
}

void main()
{
	vec2 uv;
	uv = ((gl_FragCoord.xy / uRes.xy) / 2.0 - 0.5);

	vec4 ret;
	ret = vec4(col(uv), 1.0);
	retColor = ret;
}