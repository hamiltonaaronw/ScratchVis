#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

in vec2 oTexCoord;

uniform float uFreq;
uniform float uLastFreq;
uniform float uDeltaFreq;
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
	float c = cos(a);
	float s = sin(a);
	mat2 ret = mat2(
		c, s,
		-s, c
	);
	return ret;
}

float lerp(float a, float b, float i)
{
	if (i < 0.0)
		i += 1.0;
	float ret = a * (1.0 - i) + b * i;
	return ret;
}

vec3 hsv(float h, float s, float v)
{
	vec3 ret = ((clamp(abs(fract(h + vec3(0.0, 2.0, 1.0) / 3.0) * 6.0 - 3.0) - 1.0, 0.0, 1.0) - 1.0) * s + 1.0) * v;
	return ret;
}

float smin(float a, float b, float k)
{
	float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
	return mix(b, a, h) - k * h * (1.0 - h);
}

vec3 cMap(float x)
{
	const vec4 kRedVec4 = vec4(0.13572138, 4.61539260, -42.66032258, 132.13108234);
	const vec4 kGreenVec4 = vec4(0.09140261, 2.19418839, 4.84296658, -14.18503333);
	const vec4 kBlueVec4 = vec4(0.10667330, 12.64194608, -60.58204836, 110.36276771);
	const vec2 kRedVec2 = vec2(-152.94239396, 59.28637943);
	const vec2 kGreenVec2 = vec2(4.27729857, 2.82956604);
	const vec2 kBlueVec2 = vec2(-89.90310912, 27.34824973); 
	x = clamp(x, 0., 1.);
	vec4 v4 = vec4( 1.0, x, x * x, x * x * x);
	vec2 v2 = v4.zw * v4.z;
	return vec3(
		dot(v4, kRedVec4)   + dot(v2, kRedVec2),
		dot(v4, kGreenVec4) + dot(v2, kGreenVec2),
		dot(v4, kBlueVec4)  + dot(v2, kBlueVec2)
	);
}

vec3 col(vec2 p)
{
	vec3 ret;

	float f = mod(fract(uFreq * 100.0), fract(uFreq * 10.0));
	float maxF = max(f, uFreq);
	float minF = min(f, uFreq);
	float ff = mod(maxF, minF) / 0.025;
	float t;
	t = uTime;

	vec2 q = mod(p * TAU, TAU) - 250.0;
	vec2 i = vec2(q);
	float c = 1.0;
	float inten = 0.005;

	for (int n = 0; n < 5; n++)
	{
		float _t = t * (1.0 - (3.5 / float(n + 1)));
		i = q + vec2(cos(_t - i.x) + sin(_t + i.y), sin(_t - i.y) + cos(_t + i.x));
		c += 1.0 / length(vec2(q.x / (sin(i.x + _t) / inten), q.y / cos(i.y + _t) / inten));
	}

	c /= 5.0;
	c = 1.17 - pow(c, 1.4);

	//ret = vec3(1.0, 0.0, 0.0);
	//ret = vec3(0.0, 1.0, 0.0);
	//ret = vec3(0.0, 0.0, 1.0);

	ret = cMap(smoothstep(0.15, 1.1, pow(abs(c), 3.5)));

	return ret;
}

void main()
{
	vec2 uv = (gl_FragCoord.xy - uRes) / min(uRes.x, uRes.y) * 2.0;

	vec4 ret = vec4(col(uv), 1.0);

	retColor = ret;
}