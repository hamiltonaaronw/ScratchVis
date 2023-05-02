#version 410

// derived from https://www.shadertoy.com/view/fd2GD1

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

out vec4 retColor;

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
	return length(max(vec3(0.0), pc)) - min(0.0, max(pc.z, max(pc.x, pc.y)));
}

vec2 amod(vec2 p, float n, float off, out float i)
{
	float l = length(p) - off;
	float at = atan(p.x, p.y) / PI * n * 0.5;
	i = abs(floor(at));
	float a = fract(at) - 0.5;
	return vec2(a, l);
}

float ring(vec3 p, inout vec2 id, float f)
{
	p.xy = amod(p.xy, 20.0, 2.0, id.x);

	vec2 q = vec2(0.5 + fract(id.x * 0.2 + id.y * 0.1), 0.0);
	float h = max(0.0, fract(length(q) - f) * 1.5 - 0.5);

	h += sin(uTime * 10.0 + id.x) * 0.2;
	float d = box(p + vec3(0.0, -h * 1.5, 0.0), vec3(0.1, h, 0.1));
	return d * 0.5;
}

float de(vec3 p, float f)
{
	float d = 100.0;
	float ii = 0.0;
	float r = 4.0;
	vec2 ids;

	p.xz *= rot(uTime);
	p.yz *= rot(sin(uTime));

	for (float i = 0.0; i < r; i++)
	{
		p.xz *= rot(PI / r);
		ids.y = i;
		float r = ring(p, ids, f);

		if (r < d)
		{
			d = r;
			id = ids;
		}
	}

	d = min(d, length(p) - 1.5);

	return d * 0.7;
}

vec3 normal(vec3 p, float f)
{
	vec2 e = vec2(0.0, det);
	return normalize(
		vec3(de(p + e.yxx, f),
			 de(p + e.xyx, f),
			 de(p + e.xxy, f)
			) - de(p, f)
	);
}

vec3 march(vec3 from, vec3 dir, float f)
{
	float d;
	float td = 0.0;
	vec3 p;
	vec3 c = vec3(0.0);

	for (int i = 0; i < 100; i++)
	{
		p = from + td * dir;
		d = de(p, f);

		if (d < det || td > maxDist) 
			break;

		td += d;
		gl += 0.1 / (10.0 + d * d * 10.0) * step(0.7, hash12(id + floor(uTime * 5.0)));
	}

	if (d < det)
	{
		vec3 cid = vec3(hash12(id), hash12(id + 123.123), 1.0);
		p -= dir * det;

		vec3 n = normal(p, f);
		vec2 e = vec2(0.0, 0.05);

		c = 0.1 + max(0.0, dot(-dir, n)) * cid;
		c *= 0.5 + step(0.7, hash12(id + floor(uTime * 5.0)));
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
			p2 = abs(p2 * 1.3) * rot(radians(45.0)) - 0.5;
			float sh = length(max(vec2(0.0), abs(p2) - 0.05));

			if (sh < d2)
			{
				d2 = sh;
				is = float(i);
			}
		}
		c += smoothstep(0.05, 0.0, d2) * fract(is * 0.1 + uTime) * normalize(p + 50.0);
	}

	return c * mod(gl_FragCoord.y, 4.0) * 0.5 + gl;
}

vec3 col(vec2 p)
{
	vec3 ret;
	vec3 c = vec3(0.0);

	float x = mod(uFreq * 4.0, 1.0);
	float f = cos((sin(cos(x)) - sin(x) - x) + x * x);
	vec3 vf = uSpec3;
	float lvf;
	float t = uTime * 0.25;

	vf *= sin(t * (uSpecSum / 256) / TAU);
	lvf = length(vf);
	
	float tf = clamp((t * 0.5), vf.x, step(uFreq, lvf)) + f;
	float df = (abs(uLastFreq - uFreq) * 0.5);

	vec3 from = vec3(0.0, 0.0, -8.0 + 
				(uFreq > 0.0001 ?
				uFreq
				: 0.0)
			);
	vec3 dir = normalize(vec3(p, 1.3));

	float af = uFreq > 0.0001 ?
				uFreq :
				sin(uTime) * 0.5;

	c = march(from, dir, af);

	//c = vec3(1.0, 0.0, 0.0);
	//c = vec3(0.0, 1.0, 0.0);
	//c = vec3(0.0, 0.0, 1.0);

	ret = c;

	return ret;
}

void main()
{
	vec4 ret;
	vec2 uv;
	uv = (gl_FragCoord.xy - uRes.xy) / uRes.y;

	ret = vec4(col(uv), 1.0);
	retColor = ret;
}