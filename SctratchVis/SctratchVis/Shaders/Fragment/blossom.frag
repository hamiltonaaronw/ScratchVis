#version 410

/*
Derived from Shimmy by Kali
Shadertoy link:
https://www.shadertoy.com/view/fd2GD1
*/

#define PI		3.1415926535897932384626433832795
#define TAU	(2.0 * PI)

out vec4 retColor;

uniform float uFreq;
uniform float uTime;
uniform float uLastFreq;
uniform float uDeltaFreq;
uniform float uDeltaTime;
uniform float[256] uSpectrum;
uniform vec2 uRes;

float det = 0.005;
float maxDist = 50.0;
float gl = 0.0;
vec2 id;

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
	vec3 ret = ((clamp(abs(fract(h + vec3(0.0, 2.0, 1.0) / 3.0) * 6.0 - 3.0) - 1.0, 0.0, 1.0) - 1.0) * s + 1.0) * v;
	return ret;
}

float hash12(vec2 p)
{
	p *= 1000.0;
	vec3 p3 = fract(vec3(p.xyx) * 0.1031);
	p3 += dot(p3, p3.yzx + 33.33);
	return fract((p3.x + p3.y) * p3.z);
}

float box(vec3 p, vec3 c)
{
	vec3 pc = abs(p) - c;
	return length(
		max(vec3(0.0), pc)) -
		min(0.0, max(pc.z, max(pc.x, pc.y))
	);
}

vec2 amod(vec2 p, float n, float off, out float i)
{
	float l = length(p) - off;
	float at = atan(p.x, p.y) / PI * n * 0.5;
	i = abs(floor(at));
	float a = fract(at) -abs(0.5 + uFreq);
	return vec2(a, l);
}

float ring(vec3 p, inout vec2 id, float f)
{
	p.xy = amod(p.xy * rot(uTime * 0.0), 20.0, 2.0, id.x);
	float x = sinc(atan(f, uFreq)) * (vec2(0.5 + fract(id.x * 0.2 + id.y * 0.1), 0.0).x * 0.5);
	x = smoothstep(max(uFreq, f), min(uFreq, f), length(vec2(uFreq, f)));
	float h = max(0.0, x * 3.0 - 0.5); // texture(iChannel0,vec2(.5+fract(id.x*.2+id.y*.1),0.)*.5).r*3.-.5);
	h += sin(uTime * 10.0 + id.x) * 2.0;
	float d = box(p + vec3(0.0, -h * 1.5, 0.0), vec3(0.1, h, 0.1));
	return d * (0.5 + f);
}

float de(vec3 p, float f)
{
	float d = 100.0 + (f * 100.0);
	p.xz *= rot(uTime);
	p.yz *= rot(sin(uTime)  + f);
	float r = 4.0;
	vec2 ids;

	for (float i = 0.0; i < r; i++)
	{
		p.xz *= rot(PI / abs(r - f));
		ids.y = i;
		float r = ring(p, ids, f);
		if (r < d)
		{
			d = r;
			id = ids + f;
		}
	}

	d = min(d, length(p) - 1.5);
	return d * 0.7;
}

vec3 normal(vec3 p, float f)
{
	vec2 e = vec2(0.0, det);
	return normalize(vec3(
			de(p + e.yxx, f),
			de(p + e.xyx, f),
			de(p + e.xxy, f)
		) - de(p, f));
}

vec3 march(vec3 from, vec3 dir, float f)
{
	float d;
	float td = 0.0;

	vec3 p;
	vec3 c = vec3(0.0);

	float t = fract(uTime + f) * sinc(f);

	for (int i = 0; i < 100; i++)
	{
		p = from + td * dir;
		d = de(p, fract(uFreq + f));
		if (d < det || td > maxDist)
			break;
		td += d;
		gl += uFreq / (10.0 + d * d * 10.0) * step(0.7 + uFreq, hash12(id + floor(uTime * 0.5)));
	}

	if (d < det)
	{
		vec3 colID = vec3(hash12(id), hash12(id + 123.123), 1.0);
		p -= dir * det;
		vec3 n = normal(p, f);
		vec2 e = vec2(0.0, 0.05);
		c = 1.0 + max(0.0, dot(-dir, n)) * colID * f;
		c *= 0.5 + step(0.7, hash12(id + floor(uFreq * 5.0)));
	}
	else
	{
		dir.xz *= rot(uTime * 0.5);
		dir.yz *= rot(uTime * 0.25);
		vec2 p2 = abs(0.5 - fract(dir.yz));
		float d2 = 100.0;
		float is = 0.0;

		for (int i = 0; i < 10; i++)
		{
			p2 = abs(p2 * 1.3) * rot(radians(45.0 + f)) - (f);
			float sh = length(max(vec2(0.0), abs(p2) - 0.05));
			if (sh < d2)
			{
				d2 = sh;
				is = float(i);
			}
		}
		c += smoothstep(0.05 + f * t, 0.0, d2 * f) * fract(is * 0.1 + uTime) * normalize(p + 50.0);
	}

	return c * mod(gl_FragCoord.y + uFreq, 4.0) * 0.5 + gl;
}

vec3 col(vec2 p)
{
	vec3 ret;
	vec3 c = vec3(0.0);

	float x = mod(fract(uFreq * 8.0) * 2.0, 1.0);
	x = sinc(x);
	float f = cos((sin(cos(x)) - sin(x) - x) + x * x);
	//float f = min(abs(uFreq), abs(uLastFreq)) + abs(uDeltaFreq / 2.0) * 0.1;
	float fs = sin(uTime + uFreq) / abs(sin(uTime - uLastFreq) / 14.0);
	float ft = sin(uTime * f) + f;
	float t = fract(uTime / f);// uTime +smoothstep(min(ft, fs), min(f, fs), uLastFreq) * uFreq;
	ft = abs(ft - t) * sinc(f);

	vec3 from = vec3(0.0, f, -8.0 + f * (cos(TAU + ft) + sinc(fs)));
	vec3 dir = normalize(vec3(p, 1.3));

	c = march(from, dir, fs * abs((1.0 - uFreq) - abs(fract(sinc(uTime)) - f)));

	ret = f > 0.009 ? c : vec3(0.0);

	return ret;
}

void main()
{
	vec2 uv = (gl_FragCoord.xy - uRes) / min(uRes.x, uRes.y) * 2.0;
	vec4 ret;

	ret = vec4(col(uv), 1.0);
	retColor = ret;
}