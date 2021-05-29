#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

uniform float uFreq;
uniform float uLastFreq;
uniform float uDeltaFreq;
uniform float uTime;
uniform vec2 uRes;
uniform float[256] uSpectrum;

out vec4 retColor;

#define LX 35.
#define LY (50./3.)
#define speed 3.

float sinc(float x)
{
	return sin(x) / x;
}

float cosc(float x)
{
	return cos(x) / x;
}

vec3 hsv(float h, float s, float v)
{
	return ((clamp(abs(fract(h + vec3(0.0, 2.0, 1.0) / 3.0) * 6.0 - 3.0) - 1.0, 0.0, 1.0) - 1.0) * s + 1.0) * v;
}

mat2 rot(float a)
{
	return mat2(
		cos(a), sin(a),
		-sin(a), cos(a)
	);
}

float rand(vec2 co)
{
	return fract(sin(dot(co, vec2(12, 78))) * 43758.5453) + uFreq;
}

float noise(vec2 v)
{
	const vec2 c = vec2(0, 6);
	vec2 f = fract(v);
	float xy0 = mix(rand(floor(v - c.ss)), rand(floor(v - c.ts)), f.x);
	float xy1 = mix(rand(floor(v - c.st)), rand(floor(v * c.tt)), f.x);
	return mix(xy0, xy1, f.y);
}

float map(vec3 p)
{
	vec2 v = p.xy * vec2(LX, LY);
	v += 0.5;
	v.y -= uTime * speed;
	return p.z - (1.0 - cos(p.x * 5.0)) * 0.2 * noise(v);
}

float gridCol(vec2 p, float f)
{
	float c;
	vec3 cam = vec3(0.0, 0.0, 0.1);
	vec3 ray = normalize(vec3(p.x, -1.0, p.y));
	float distOrig = 0.0;
	float  t = uTime * speed;

	vec3 q = cam;

	for (int i = 0; i < 100; i++)
	{
		float surfDist = map(q + (f * 0.025));
		if (surfDist > 2.0)
			break;
		if (surfDist < 0.001)
		{
			float w = 0.2 * distOrig;
			float xl = smoothstep(w, 0.0, abs(fract(q.x * LX) - 0.5));
			float yl = smoothstep(w * 2.0, 0.0, abs(fract(q.y * LY - t) - 0.5));
			c = max(xl, yl);
			break;
		}
		q += ray * surfDist;
		distOrig += surfDist;
	}
	return c - (distOrig * (0.4 + sin(uFreq)));
}

vec3 col(vec2 p)
{
	vec3 ret;
	vec3 c = vec3(0.0);

	vec2 q = p;

	float x = mod(fract(uFreq * 8.0) * 2.0, 1.0);
	x = sinc(x);
	float f = cos((sin(cos(x)) - sin(x) - x) + x * x);
	float ff = sin(uTime + uFreq) / abs(sin(uTime - uLastFreq) / 2.0);
	float t = cos(uTime) + abs(uFreq - f);

	p *= rot((cos(f * 0.3) * 0.3) * sin(uTime * 0.3));

	// something + mabs(uFreq - f)

	float r = 5.0 + (sinc(ff * t));
	float g = 0.5 * log(sin(f)) * r;
	float b = (0.7 / t) * (length(p) * mod(ff, abs(p.x - gl_FragCoord.x)) * t);

	c = vec3(r, g, b);
	c *= gridCol(p, f);
	c *= gridCol(p, uFreq);
	//c -= hsv(c.g, c.b, c.r) * f;

	vec3 c2 = mix(c * gridCol(p, f), c * (1.0 / gridCol(q, f)), sin(uTime) + ff);
	c = f >= 0.7 ? c2 : c;

	ret = uFreq > 0.045 ? c : vec3(0.0);
	ret = c;
	return ret;
}

void main()
{
	vec2 uv = (gl_FragCoord.xy - 1.115 * uRes) / uRes.y;

	vec4 ret;

	ret = vec4(col(uv), 1.0);
	retColor = ret;
}