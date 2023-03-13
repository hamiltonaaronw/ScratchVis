#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

uniform float uFreq;
uniform float uLastFreq;
uniform float uTime;
uniform vec2 uRes;

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

mat2 rot(float f)
{
	return mat2(
		cos(f), sin(f),
		-sin(f), cos(f)
	);
}

vec3 col(vec2 p)
{
	vec3 c = vec3(0.0);
	vec3 ret = vec3(0.0);

	float x = mod(uFreq * 4.0, 1.0);
	//float f = mix(min(uFreq, uLastFreq), max(uFreq, uLastFreq), sin(uTime));
	float f = cos((sin(cos(x)) - sin(x) - x) + x * x);
	float ff = mod(fract(uFreq * 100.0), fract(uFreq * 10.0)) * f;
	vec3 fcv = cross(vec3(f, ff, f), vec3(uFreq, uLastFreq, f));
	float fc = length(fcv);

	//c = vec3(1.0, 0.0, 0.0);
	c = vec3(0.0, 1.0, 0.0);
	//c = vec3(0.0, 0.0, 1.0);

	ret = uFreq > 0.0001 ? c : vec3(0.0);

	return ret;
}

void main()
{
	vec2 uv;
	uv = (gl_FragCoord.xy - uRes) / min(uRes.x, uRes.y) * 0.5;
	
	retColor = vec4(col(uv), 0.5);
}