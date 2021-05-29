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

float tanc(float x)
{
	return tan(x) / x;
}

mat2 rot(float x)
{
	return mat2(
		cos(x), -sin(x),
		sin(x), cos(x)
	);
}

float donut(vec3 p, vec2 t)
{
	return length(
		vec2(
			length(p.xz) - t.x,
			p.y
		)
	) - t.y;
}

#define MAX_DIST 250.0
#define STEP 128.0

float g1 = 0.0;

vec2 dist(vec3 p, float f)
{
	vec2 a = vec2(donut(p, vec2(1.0, 0.5)), 2.0);
	vec2 b = vec2(length(p + vec3(0.0, 1.0 - abs(sin(f)) * 3.0, 0.0)) - 0.5, 1.0);
	
	g1 += 0.01 / (0.01 + b.x * b.x);
	b = (b.x < a.x) ? b : a;

	return b;
}

float invert(float inv, float t, vec2 uv, float cap)
{
	return mix(
		inv, 1.0 - inv, step(sin(length(uv) * 0.45 - t) * 0.5 + 0.6, cap)
	);
}

vec2 dist2(vec3 p, float f)
{
	float t = mod(f, 200.0);
	t = fract(t) * fract(t) + floor(t);
	vec3 q = p;

	float modd = 42.0;
	vec3 id = floor((q + modd * 0.5) / modd);
	t += id.x * 2.0;
	t += id.z * 2.0;

	q.yz *= rot(sin(t) * 0.2);
	q += sin(id.x + t) * 12.0;
	q = mod(q + modd * 0.5, modd) - modd * 0.5;
	q.xy *= rot(t * (mod(abs(id.x), 3.0) - 1.0));
	q.xy *= rot(t * (mod(abs(id.x), 3.0) - 1.0));
	q.zy *= rot(-t * 0.5 * (mod(abs(id.z), 3.0) - 1.0));

	for (int i = 0; i < 4; i++)
	{
		q = abs(q) - vec3(2.0, 1.0, 1.0);
		q.xy *= rot(0.5);
		q.zy *= rot(0.5 + sin(t) * 2.0);
		q.zx *= rot(0.5);
	}

	return dist(q, f) * vec2(0.65, 1.0);
}

vec3 col(vec2 p)
{
	p.yx *= rot(uTime * 0.25);
	p *= 0.0625;
	vec3 ret;
	vec3 c;

	float f = cos((sin(cos(uFreq)) - sin(uFreq) + uFreq * uFreq));
	float t = mod(uTime, 1000.0 * f);

	float ft = smoothstep(sin(uTime), sin(f),  uFreq);
	float fs = mod(uTime, 1.0 - f);
	//float fstep = smoothstep(sin(uFreq / f), uFreq + uLastFreq, uTime);
	//float tf = smoothstep(sin(f), 2.0, uTime);

	p *= f > mod(uTime, 0.5) ? sinc(f) : sin(uTime);;

	vec3 ro = vec3(t * 3.0, f, -30.0);
	vec3 rd = normalize(vec3(p, 1.05));
	float d0 = f;
	float shad = 0.0;


	vec2 obj;

	for (float i = 0.0; i < STEP; i++)
	{
		vec3 q = ro + rd * d0 + f;
		obj = dist2(q, uTime + sinc(f) * (uFreq * 0.25));
		d0 += obj.x;

		if (obj.x < 0.001 || d0 > MAX_DIST)
		{
			shad = i / STEP;
			break;
		}
	}

	obj *= rot(fs);
	obj.yx *= rot(uTime);

	float r = 0.2 + ft;
	float g = 0.5 * fs + atan(r, uFreq);
	float b = mod(0.8, r * fs);

	if (obj.y >= 1.0 + f)
	{
		shad = 1.0 - shad;
		c = vec3(shad) * vec3(r, g, b);
	}
	if (obj.y <= 2.0 + f)
	{
		shad = shad;
		c = vec3(shad) * vec3(r + 0.6, g - 0.3, b + 0.1);
	}

	c += g1 * vec3(0.2, 0.5, 0.8) * 0.2;
	c = mix(
		c,
		vec3(0.235, 0.075, 0.369) * 0.2,
		clamp(d0 / MAX_DIST, 0.0, 1.0)
	);

	t /= 0.6 * t - 2.0;

	float inv = 0.0;
	inv = invert(inv, t, p, 0.05);
	inv *= invert(inv, t, p, 0.0466);
	inv = invert(inv, t, p, 0.0433);
	inv = invert(inv, t, p, 0.04);
	inv = invert(inv, t, p, 0.0366);

	c = mix(c * 1.6, 1.0 - c * sinc(f), inv);

	//c = vec3(1.0, 0.0, 0.0);
	//c = vec3(0.0, 1.0, 0.0);
	//c = vec3(0.0, 0.0, 1.0);

	ret = uFreq > 0.00001 ? min(c, 1.0) : vec3(0.0);

	return ret;
}

void main()
{
	vec2 uv;
	uv = ((gl_FragCoord.xy / uRes.xy) / 2.0 - 0.5);
	//uv = (gl_FragCoord.xy - 0.5 * uRes.xy) / uRes.y;

	vec4 ret;

	ret = vec4(col(sin(uv) * uTime), 1.0);
	retColor = ret;
}