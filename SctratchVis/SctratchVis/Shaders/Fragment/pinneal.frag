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

float sinc(float x)
{
	float ret = sin(x) / x;
	return ret;
}

float cosc(float x)
{
	float ret = cos(x) / x;
	return ret;
}

vec2 cmul(vec2 a, vec2 b)
{
	vec2 ret = vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
	return ret;
}

float hash(vec2 p, float s)
{
	vec3 p2 = vec3(p.xy, 27.0 * abs(sinc(s)));
	float ret = fract(sin(dot(p2, vec3(27.1, 61.7, 12.4)))* 2.1);
	return ret;
}

vec3 hueRGB(float h)
{
	float f = min(uFreq, uLastFreq) + abs(uDeltaFreq / 2.0);

	vec3 c;
	float a = cos(h * PI * 1.5) * f;
	float b = sin(h * PI * 1.5) * f;

	float s0 = 0.0,
	s1 = 0.0,
	s2 = 0.0;

	for (int i = 0; i < 256; i++)
	{
		if (i % 3 == 0)
			s0 += uSpectrum[i];
		if (i % 3 == 1)
			s1 += uSpectrum[i];
		if (i % 3 == 2)
			s2 += uSpectrum[i];
	}
	float avg0 = s0 / 86;
	float avg1 = s1 / 85;
	float avg2 = s2 / 85;

	c = vec3(
		max(-min(0.0, b), a) * hash(uRes, avg0) / avg0,
		max(0.0, b) * hash(uRes, avg1) / avg1,	
		-min(0.0, a) * hash(uRes, avg2) / avg2
		);

	mat3 cMat = mat3(
		vec3(0.5, 0.0, 0.1),
		vec3(0.0, 1.0, 0.0),
		vec3(0.0, 0.0, 1.0)
	);

	c /= mod(uTime, uFreq);

	vec3 ret = normalize(cMat * c);

	return ret;
}

float hue(vec2 p)
{
	float f = min(uFreq, uLastFreq) + abs(uDeltaFreq / 2.0);
	float ft = smoothstep(max(f, uTime), min(f, uTime), uFreq);
	float sft = uTime * sin(f / cosc(uFreq));
	sft /= clamp(sinc(uTime), 0.1, uFreq);

	vec2 n = p * 2.0 - 1.0;
	n *= vec2(uRes.x / uRes.y, 1.0);
	n *= sin(sqrt(abs(n) * sft)) * (sin(sft) / f * 50.0);
	n /= 2.0;
	float ret = length(n) - uTime;
	return ret;
}

void main()
{
	vec4 ret;
	vec2 uv = gl_FragCoord.xy / uRes.xy / 2.0;

	float h = hue(uv);

	ret = vec4(hueRGB(h), 1.0);

	retColor = ret;
}