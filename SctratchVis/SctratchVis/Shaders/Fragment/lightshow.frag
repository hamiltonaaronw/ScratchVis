#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

out vec4 retColor;

uniform float uFreq;
uniform float uTime;
uniform float uLastFreq;
uniform float uDeltaTime;
uniform float[256] uSpectrum;
uniform vec2 uRes;

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

float sinc(float x)
{
	return sin(x) / x;
}

float cosc(float x)
{
	return cos(x) / x;
}

vec3 pal(in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d)
{
	return (a + b * cos(TAU * (c * t + d)));
}

vec3 pal(float t, float f)
{
	return pal(t, 
			vec3(0.15), 
			vec3(0.5, 0.25, 0.5), 
			vec3(2.0 + f, 1.0, f), 
			vec3(0.5 - f, 0.5, 0.25)
		);
}

vec3 hmm(float a, float t)
{
	return cos(vec3(
		cos(a) * cos(t),
		cos(a) * sin(t),
		sin(t) * sin(a)
	) * (sin(t) * cos(t)));
}

vec2 f2(float t)
{
	t /= 16.0;
	return vec2(
		sin(t * PI) * cos(2.0 * t * TAU),
		cos(t * TAU) * sin(2.0 * t * PI)
	);
}

int f_int(float x, float m, float ml)
{
	return int(floor(mod(x * m, ml)));
}

vec3 col(vec2 p)
{
	vec3 ret;
	vec3 c = vec3(0.0);

	p.yx *= rot(uTime * 2.0);

	float x = mod(uFreq * 4.0, 1.0);
	float f = cos((sin(cos(x)) - sin(x) - x) + x * x);
	vec3 vf = vec3(
		uSpectrum[31] / f,
		uSpectrum[63] - f,
		uSpectrum[127] * f
	) + uSpectrum[254];

	float t0 = uTime;
	t0 += f * length(p) * uSpectrum[f_int(x + f, 100.0, 255)];
	t0 += length(p) * max(sin(uTime), f);
	//t0 += length(vf) * length(p);

	vec2 m0 = f2(t0);
	vec2 m = (cos(p * (16.0 * TAU)) * TAU * (m0));
	m *= smoothstep(0.0, 1.0, dot(m, m)) - (f * uFreq);
	float t = dot(p, p) * dot(m, m) + t0;

	c = pal(t, f) * hmm(t + f, 1.0 - t);

	//c = vec3(1.0, 0.0, 0.0);
	//c = vec3(0.0, 1.0, 0.0);
	//c = vec3(0.0, 0.0, 1.0);

	ret = uFreq > 0.0001 ? c : vec3(0.0);

	return ret;
}

void main()
{
	vec2 uv = (gl_FragCoord.xy - uRes) / min(uRes.x, uRes.y) / 2.25;

	//retColor = vec4(col(uv), 1.0);
	retColor = vec4(col(uv), 1.0);
}