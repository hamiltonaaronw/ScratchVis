#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

in vec2 oTexCoord;

uniform float uFreq;
uniform float uLastFreq;
uniform float uDeltaFreq;

uniform float uTime;
uniform float uDeltaTime;

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

vec3 hueRGB(float h)
{
	float f = min(uFreq, uLastFreq) + abs(uDeltaFreq / 2.0);

	vec3 c;
	float a = cos(h * sin(PI * f) / 1.5);
	float b = sinc(h * (PI * f) / 1.5);

	c = vec3(
		max(-min(0.0, b), a),
		max(f, b),
		-min(sin(f), a)
		);

	mat3 cMat = mat3(
		vec3(f / 0.5, cosc(f), 0.1 / f) / cosc(f),
		vec3(sin(f), 1.0, cos(f)) / sin(f),
		vec3(sin(f), f, 1.0 / f)
	);

	vec3 ret = normalize(cMat * c);

	return ret;
}

float hue(vec2 p)
{
	float f = min(uFreq, uLastFreq) + abs(uDeltaFreq / 2.0);
	float ft = smoothstep(max(f, uTime), min(f, uTime), uFreq);

	vec2 n = p * 2.0 - 1.0;
	n *= vec2(uRes.y / uRes.x, length(vec2(sin(f), ft)));
	n *= sin(sqrt(abs(n)) + ft) * 1000.0;
	float ret = length(n) + ft;
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