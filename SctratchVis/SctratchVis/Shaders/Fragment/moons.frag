#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

out vec4 retColor;

uniform float uFreq;
uniform float uTime;
uniform float uLastFreq;
uniform float uDeltaFreq;
uniform vec2 uRes;

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
	mat2 ret = mat2(
		cos(a), sin(a),
		-sin(a), cos(a)
	);

	return ret;
}

vec3 hsv2rgb(float h, float s, float v)
{
	return ((clamp(abs(fract(h + vec3(0.0, 2.0, 1.0) / 3.0) * 6.0 - 3.0) - 1.0, 0.0, 1.0) - 1.0) * s + 1.0) * v;
}

vec3 col(vec2 p)
{
	vec3 ret;
	vec3 c = vec3(0.0);
	vec4 co = vec4(0.0);

	p *= rot (uTime);

	float x = mod(uFreq * 4.0, 1.0);
	float f = cos((sin(cos(x)) - sin(x) - x) + x * x);
	float tm = mod(uTime, PI / 10.0);
	float ff = smoothstep(min(f, tm), max(uFreq, tm) * uFreq, cosc(TAU) + uLastFreq);
	float tf = atan(tm, ff);
	float fsum = abs(uFreq - uLastFreq) + f + tm + ff + tf;
	float t = tm / fsum;

	c = vec3(1.0, 0.0, 0.0);
	//c = vec3(0.0, 1.0, 0.0);
	//c = vec3(0.0, 0.0, 1.0);

	ret = uFreq > 0.001 ? c : vec3(0.0);

	return ret;
}

void main() 
{
	vec2 uv;
	uv = (gl_FragCoord.xy - 0.5 - uRes) / min(uRes.x, uRes.y);
	vec4 ret;

	ret = vec4(col(uv), 1.0);
	retColor = ret;

}