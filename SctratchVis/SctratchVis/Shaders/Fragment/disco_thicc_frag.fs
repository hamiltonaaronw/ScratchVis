#version 450 core

/*
derived from shadertoy user @flopine
user profile: https://www.shadertoy.com/user/Flopine
code source: https://www.shadertoy.com/view/4syfDt
*/

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

out vec4 retColor;

in vec3 oColor;
in vec2 oTexCoord;

uniform float uFreq;
uniform float uTime;

uniform float uLastFreq;
uniform float uLastFrame;

uniform float uDeltaFreq;
uniform float uDeltaTime;

uniform float[256] uSpectrum;

uniform sampler2D uTex;

uniform vec2 uRes;

float sinc(float x)
{
	return sin(x) / x;
}

float cosc(float x)
{
	return cos(x) / x;
}

float smin(float a, float b, float k)
{
	float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);

	return mix(b, a, h) - k * h * (1.0 - h);
}

mat2 rot(float a)
{
	float c = cos(a);
	float s = sin(a);

	mat2 ret = mat2(
		c, -s,
		s, c
	);

	return ret;
}

vec2 moda(vec2 p)
{
	float per = TAU / 6.0;
	float a = atan(p.y, p.x);
	float l = length(p);
	a = mod(a - per / 2.0, per) - per / 2.0;

	vec2 ret = vec2(cos(a), sin(a)) * l;

	return ret;
}

float sphere(vec3 p, float r)
{
	float ret = length(p) - r;

	return ret;
}

float cylinder(vec3 p, float r, float h)
{
	float ret = max(length(p.xz) - r, abs(p.y) - h);

	return ret;
}

float box(vec3 p, vec3 c)
{
	float ret = length(max(abs(p) - c, 0.0));

	return ret;
}

float branch(vec3 p)
{
	p.yz = moda(p.yz);
	p.y -= 6.0;

	float ret = smin(cylinder(p, (p.y + 12.0) * 0.05, 5.0),
				sphere(vec3(p.x, p.y - 5.0, p.z), 0.9), 0.05);

	return ret;
}

float branches(vec3 p)
{
	vec3 q = p;
	float b = branch(p);
	
	p.xz *= rot(TAU / 2.0);
	float b1 = branch(p);
	p = q;
	p.xy *= rot(PI / 2);
	float b2 = branch(p);

	float ret = smin(b2, smin(b, b1, 0.5), 0.5);

	return ret;
}

float prim1(vec3 p, float detail)
{
	p = floor(p * detail) / detail;
	p.xy -= vec2(5.0, -1.0);
	p.xz *= rot(uTime);
	p.xy *= rot(uTime + 2.0);

	float ret = smin(sphere(p, 3.0), branches(p /sinc(uFreq)), 0.5);

	return ret;// * sinc(uFreq);
}

float prim2(vec3 p)
{
	p *= 2.0;
	p.xy += vec2(18.0, 10.0);
	p.xz *= rot(uFreq);
	float b1 = box(p, vec3(3.5, 0.5, 0.5));

	p.xy *= rot(PI / (uFreq * 10));

	float b2 = box(p + vec3(2.0, 1.0, 0.0),		vec3(2.5, 0.5, 0.5));// * mod(uTime, uFreq * 2.0);
	float b3 = box(p + vec3(1.5, 3.0, 0.0),		vec3(1.5, 0.5, 0.5));// * mod(uTime, uFreq * 3.0);
	float b4 = box(p + vec3(1.5, -3.0, 0.0),	vec3(1.5, 0.5, 0.5));// * mod(uTime, uFreq * 4.0);
	float b5 = box(p + vec3(1.5, -1.0, 0.0),	vec3(1.5, 0.5, 0.5));// * mod(uTime, uFreq * 5.0);

	float ret = min(b5, min(b4, min(b3, min(b1, b2))));

	return ret;
}

float g = 0;
float SDF(vec3 p)
{
	//float d = min(prim1(p, 4.0), prim2(p));
	//float d = min(prim1(cos(p), mod(uTime / uFreq, max(uFreq * 10, 40.0))), prim2(sin(p)));
	float d = min(prim1(sin(p) * (uFreq * 10), min(cosc(uFreq), sinc(uFreq)) * 10), prim2(p * mod(uTime, sinc(uFreq * cosc(uDeltaFreq)))));
	//d += a;
	
	g += 0.01 / (0.01 + pow(sin(d), 2));

	return d;
}

void main()
{
	vec2 uv = 2.0 * (gl_FragCoord.xy / uRes) - 1.0;
	uv.x *= uRes.x / uRes.y;

	vec3 r = vec3(0.001, 0.001, -8.0);
	vec3 p = r;
	vec3 dir = normalize(vec3(uv + (uDeltaFreq * uDeltaTime), 1));

	float shad = 0.0;
	for (float i = 0; i < 100; i++)
	{
		float d = SDF(p) + uFreq;// +  mod(uTime, uFreq));
		if (d < 0.001)
		{
			shad = i / 256;
			shad += uSpectrum[int(mod(256, i))];
			break;
		}
		p += d * dir * 0.5 * uFreq;
	}

	float t = cosc(length(r - sin(p))) / cosc(uLastFreq / uTime);

	vec3 col = vec3(TAU / cosc(mod(uTime, shad + uFreq)) - shad) * 
	vec3(mod(uFreq, 1.0), 0.1 * uFreq, cosc(0.5 * TAU) * sinc(uFreq))
	+ g * 0.2;
	col = mix(col, 
	vec3(0.3 / uFreq, mod(uTime, uFreq * 10), 0.4 * uFreq) * (1.0 - sinc(length(uv * 0.2))), 
	1.0 - exp(-0.007 * t * t * cosc(uFreq)));

	retColor = vec4(col * uFreq, 1.0);
	//retColor = vec4(1.0, 0.0, 0.0, 1.0);
}