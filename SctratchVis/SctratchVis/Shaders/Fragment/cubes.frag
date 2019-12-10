#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

uniform float uFreq;
uniform float uLastFreq;
uniform float uDeltaFreq;

uniform float uTime;
//uniform float uLastFrame;
//uniform float uDeltaTime;

//uniform float[256] uSpectrum;

uniform vec2 uRes;

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

float box(vec3 p, vec3 s)
{
	vec3 d = abs(p) - s;
	float ret = min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0));

	return ret;
}

float fsBox(vec3 p, float t)
{
	for(int i = 0; i < 4; i++)
	{
		p = abs(p) - 1.0;
		float a = 0.05 + 0.12 * sin(1.6 * uTime) + (t * 0.001);
		p.xy *= rot(a);
		p.xz *= rot(a);
	}

	float f = fract(uFreq * 10.0 / t) - length(p) * uFreq;
	float s = clamp(cos(uTime), 0.25, 0.4);

	vec3 scale = vec3(s + t * f);

	float ret = box(p, scale);

	return ret;
}

float map(vec3 p, float t)
{
	p.xy *= rot(0.12 * sin(uTime));
	p.xz *= rot(PI * 0.5 + 0.16 * sin(0.7 * uTime + t));

	return fsBox(p, t);
}

vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d)
{
	vec3 ret = a + b * cos(6.28318 * (c * t + d));
	return ret;
}

vec3 col(vec2 p)
{
	vec2 q = p;

	float f = abs(uFreq + uLastFreq * uDeltaFreq) * 0.5;
	float ff = fract(f * 10.0);
	ff = abs(abs(ff - f) - uLastFreq) - uDeltaFreq * 0.5;

	vec3 cPos = vec3(0.0, 0.0, 15.0);
	vec3 ray = normalize(vec3(p.xy, -1.0));

	float depth = 0.0;
	float d = 0.0;
	vec3 pos = vec3(0.0);
	vec3 c = vec3(ff);

	float t = smoothstep(min(f, ff) * max(f, ff), max(f, ff), 1.0 + uDeltaFreq);
	for (int i = 0; i < 99; i++)
	{
		pos = cPos + ray * depth;
		d = map(pos, t);
		if (d < 0.0001 || pos.z > 50.0)
			break;
		c += exp(-d * 2.0) * palette(length(pos) / ff / f * sin(uTime),
									 vec3(0.1, f, uDeltaFreq),
									 vec3(0.1, 0.8 - f, f),
									 vec3(1.0),
									 vec3(ff, 0.3, 0.4)
									 );
		depth += d * 0.2;
	}

	c *= 0.03;

	vec3 ret;

	ret = c * sinc(uFreq);

	return ret;
}

void main()
{
	vec2 uv = (gl_FragCoord.xy - uRes) / min(uRes.x, uRes.y) * 0.5;// * 2.0;

	vec4 ret = vec4(col(uv), 1.0);

	retColor = ret;
}
