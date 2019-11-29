#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

in vec2 oTexCoord;

uniform float uFreq;
uniform float uLastFreq;
uniform float uDeltaFreq;

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

mat2 rot(float a)
{
	mat2 ret = mat2(
		cos(a), sin(a),
		-sin(a), cos(a)
	);
	return ret;
} 

vec3 col(vec2 p)
{
	vec3 ret;
	vec2 q = p;

	q *= rot(uTime * 0.2);

	float f = (abs(uFreq) + abs(uLastFreq)) * 0.5;
	float ff = fract(f * 100.0);

	float a = atan(q.y, q.x) * 100.0;
	float l = 0.2 / abs(length(q * sinc(ff)) - 0.8 + sin(a * ff + uTime * 1.5) * 0.04);
	l += 0.2 / abs(length(q / sinc(ff * TAU)) - 0.2 + sin(a * ff + uTime * 3.5) * 4.0);

	l *= length(ff / q);

	vec3 c = vec3(
		tan(f) + ff,
		ff * cosc(uTime) * dot(q, p),
		sinc(ff - f) - ((q.x / q.y) * sin(uTime) / f)
	);

	c *= 0.5 + sin(a * uTime * 1.3) * 0.0003;
	
	ret = c * l * f;

	//ret = vec3(1.0, 0.0, 0.0);
	return ret;
}

void main()
{	
	vec4 ret;
	vec2 uv = (gl_FragCoord.xy - uRes) / min(uRes.x, uRes.y) * 2.0;

	ret = vec4(col(uv), 1.0);

	retColor = ret;
}