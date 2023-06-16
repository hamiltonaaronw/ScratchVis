#version 410

// derived from https://glslsandbox.com/e#103855.0

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

#define sinc(x) (sin(x) / x)
#define cosc(x) (cos(x) / x)
#define cot(x) (sin(x) / cos(x))

mat2 rot(float x)
{
	return mat2(
		cos(x), sin(x),
		-sin(x), cos(x)
	);
}

vec3 palette(float t)
{
	vec3 a = vec3(0.5);
	vec3 b = vec3(0.5);
	vec3 c = vec3(1.0);
	vec3 d = vec3(0.263, 0.416, 0.557);

	return a + b * cos(TAU * (c * t + d));
}

vec3 col(vec2 p)
{
	vec3 ret;
	vec3 c = vec3(0.0);
	vec3 c0 = vec3(0.0);

	float f = sinc(fract(uFreq * 100.0) - uFreq);
	float ff = 1.0 - (f - abs(acos(f)));
	ff = clamp(ff, 0.1, 0.9);
	ff += (ff - abs(pow(cot(ff), -1.0)));
	ff = mod(ff, 0.5);

	float lf = sinc(fract(uLastFreq * 100.0) - uLastFreq);
	float lff = 1.0 - (lf - abs(acos(lf)));
	lff = clamp(lff, 0.1, 0.9);

	float df = sinc(fract(uDeltaFreq * 100.0) - uDeltaFreq);
	float dff = 1.0 - (df - abs(acos(df)));
	dff = clamp(dff, 0.1, 0.9);

	float t = smoothstep
		(min(lf, ff) / max(f, lff), 
		cot(max(lf, ff)), 
		1.0 + df);

	vec3 vf = uSpec3;
	vf *= sinc(t * (uSpecSum / 256) / TAU);
	float lvf = length(vf);
	vf = normalize(vf);

	vec2 q = p;

	for (float i = 0.0; i < 4.0; i++)
	{
		q = fract(q * 1.5) - 0.5;

		float d = length(q) * exp(-length(p));

c0 = palette(length(p) + i * 0.4 + uTime * 0.4);
		//c0 = palette(length(p) + i * 0.4 + uTime * 0.4);

d = sin(d * 8.0 + uTime) / 8.0;
		//d = sin(d * 8.0 + uTime) / 8.0;

		d = abs(d);

		d = pow(0.01 / d, 1.2);

		c += c0 * d;
	}

	//c = vec3(1.0, 0.0, 0.0);
	//c = vec3(0.0, 1.0, 0.0);
	//c = vec3(0.0, 0.0, 1.0);

	ret = uFreq > 0.009 ? c : vec3(0.0);

	return ret;
}

void main()
{
	vec2 uv;
	vec4 ret; 

	uv = (gl_FragCoord.xy - 0.5 - uRes) / min(uRes.x, uRes.y);
	//uv = (gl_FragCoord.xy * 2.0 - uRes.xy) / uRes.y;

	ret = vec4(col(uv), 1.0);
	retColor = ret;
}
