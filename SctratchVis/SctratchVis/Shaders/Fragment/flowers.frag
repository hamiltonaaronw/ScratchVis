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
		cos(a), -sin(a),
		sin(a), cos(a)
	);
	return ret;
} 

vec3 col(vec2 p)
{
	float w = 2.0;
	float h = 4.0;
	float f = min(uFreq, uLastFreq) + abs(uDeltaFreq / 2.0);
	float ft = smoothstep(uTime, uFreq, f);
	float tf = uTime / f;
	ft *= sinc(cosc(tf * length(oTexCoord)));
	f += smoothstep(max(ft, tf), min(tf, ft), 1.0 / f);
	//p /= f;
	float lp = length(p);
	float dp = dot(p, p);

	float c;
	vec3 co;

	vec3 ret = vec3(0.1);

	for (int i = 0; i < 7; i++)
	{
		float it;
		if (i % 2 != 0)
			it = -1.0;
		else
			it = 1.0;

		p *= rot(it * (uTime - f));
		p /= 1.6;

		c = smoothstep(w * f, h * f, abs(length(p) - 25.0 + sin(atan(p.y, p.x) * 9.0 - TAU / 2.0) * 14.0 * sin(f + uTime)));
		co = vec3(sinc(p.x) / pow(uFreq, PI), cosc(p.y) / pow(uFreq, PI), f) * c * f;
		ret *= co;
	}

	return ret;
}

void main()
{	
	vec4 ret;

	vec2 uv = gl_FragCoord.xy - uRes;

	ret = vec4(col(uv), 1.0);

	retColor = ret;
}