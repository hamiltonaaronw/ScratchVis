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

	c = vec3(1.0, 0.0, 0.0);
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