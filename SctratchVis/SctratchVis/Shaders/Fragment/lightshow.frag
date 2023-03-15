#version 410

// based on https://glslsandbox.com/e#75206.2

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

out vec4 retColor;

uniform float uFreq;
uniform float uTime;
uniform float uLastFreq;
uniform float uDeltaTime;
uniform float[256] uSpectrum;
uniform vec2 uRes;

#define R(p, a, r) mix(a * dot(p, a), p, cos(r)) + sin(r) * cross(p, a)
#define H(h) (cos((h) * 6.3 + vec3(0.0, 23.0, 21.0)) * 0.5 + 0.5)
mat2 rot(float a)
{
	return mat2(
		cos(a), sin(a),
		-sin(a), cos(a)
	);
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
	vec2 uv = (gl_FragCoord.xy - 0.5 - uRes) / min(uRes.x, uRes.y);

	retColor = vec4(col(uv), 1.0);
}